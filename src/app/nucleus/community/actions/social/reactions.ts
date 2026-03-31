'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Reaction, FlexibleTimestamp } from '@/types/community';
import type { CommunityUserId, PostId, ReplyId, ReactionId } from '@/types/community/branded-ids';
import { REPUTATION_POINTS } from '@/lib/community-constants';
import { checkAndAwardBadges } from './badges';
import { orchestrateActivity, getAuthenticatedUser } from '../utils';
import { withRateLimit } from '@/lib/rate-limit';

import { logger } from '@/lib/logger';
const log = logger.scope('social/reactions');

/**
 * Add a reaction to a post or reply
 */
export async function addReaction(input: {
  targetId: string;
  targetType: 'post' | 'reply';
  reactionType: 'like' | 'love' | 'insightful' | 'helpful' | 'celebrate';
}): Promise<{ success: boolean; error?: string; reaction?: Reaction; rateLimited?: boolean }> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'You must be logged in to react' };
    }

    // Check rate limit
    const rateLimitResult = await withRateLimit(user.uid, 'reactions');
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.error || 'You are reacting too frequently. Please slow down.',
        rateLimited: true,
      };
    }

    const { targetId, targetType, reactionType } = input;

    // Check if user already reacted to this target
    const existingReactionsSnapshot = await adminDb
      .collection('reactions')
      .where('userId', '==', user.uid)
      .where('targetId', '==', targetId)
      .where('targetType', '==', targetType)
      .get();

    // If user already reacted with a different type, remove it first
    if (!existingReactionsSnapshot.empty) {
      const existingReaction = existingReactionsSnapshot.docs[0];
      const existingData = existingReaction.data() as Reaction;

      // If same reaction type, don't allow duplicate
      if (existingData.reactionType === reactionType) {
        return { success: false, error: 'You already reacted with this type' };
      }

      // Remove old reaction counts
      const targetCollection = targetType === 'post' ? 'community_posts' : 'community_replies';
      await adminDb.collection(targetCollection).doc(targetId).update({
        [`reactionCounts.${existingData.reactionType}`]: FieldValue.increment(-1),
      });

      // Delete old reaction
      await existingReaction.ref.delete();
    }

    // Get user name
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    const userName = userDoc.exists
      ? userDoc.data()?.name || user.email || 'Unknown User'
      : user.email || 'Unknown User';

    // Create new reaction
    const newReaction: Omit<Reaction, 'id'> = {
      userId: user.uid as CommunityUserId,
      userName,
      targetId: targetId as PostId | ReplyId,
      targetType,
      reactionType,
      createdAt: FieldValue.serverTimestamp() as unknown as FlexibleTimestamp,
    };

    const reactionDoc = await adminDb.collection('reactions').add(newReaction);

    // Update reaction counts on target
    const targetCollection = targetType === 'post' ? 'community_posts' : 'community_replies';
    await adminDb.collection(targetCollection).doc(targetId).update({
      [`reactionCounts.${reactionType}`]: FieldValue.increment(1),
    });

    // Award reputation points to target author and track engagement
    const targetDoc = await adminDb.collection(targetCollection).doc(targetId).get();
    if (targetDoc.exists) {
      const targetData = targetDoc.data();
      if (!targetData) {
        return { success: true, reaction: { id: reactionDoc.id as ReactionId, ...newReaction, createdAt: new Date() } };
      }
      const authorId = targetData.authorId;

      // Unified Activity Orchestration
      await orchestrateActivity({
        type: 'reaction_added',
        metadata: {
          contentId: targetId,
          contentType: targetType,
          topics: targetData.tags || [],
          category: targetData.category,
          reactionType: reactionType,
        }
      });

      if (authorId && authorId !== user.uid) {
        // Don't award points for self-reactions
        await updateReputationPoints(
          authorId,
          REPUTATION_POINTS.RECEIVE_REACTION
        );

        // Check and award badges after reputation update
        await checkAndAwardBadges(authorId);

        // Create notification for the author
        await createNotification({
          userId: authorId,
          type: 'reaction',
          title: 'New Reaction',
          message: `${userName} reacted to your ${targetType}`,
          actionUrl:
            targetType === 'post'
              ? `/nucleus/community/circles/post/${targetId}`
              : `/nucleus/community/circles/post/${targetData.postId}`,
          metadata: {
            senderId: user.uid,
            senderName: userName,
            reactionType,
            ...(targetType === 'post'
              ? { postId: targetId }
              : { replyId: targetId, postId: targetData.postId }),
          },
        });
      }
    }

    return {
      success: true,
      reaction: {
        id: reactionDoc.id as ReactionId,
        ...newReaction,
        createdAt: new Date(),
      },
    };
  } catch (error) {
    log.error('Error adding reaction:', error);
    return { success: false, error: 'Failed to add reaction' };
  }
}

/**
 * Remove a reaction from a post or reply
 */
export async function removeReaction(input: {
  targetId: string;
  targetType: 'post' | 'reply';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to remove reaction',
      };
    }

    const { targetId, targetType } = input;

    // Find user's reaction
    const reactionSnapshot = await adminDb
      .collection('reactions')
      .where('userId', '==', user.uid)
      .where('targetId', '==', targetId)
      .where('targetType', '==', targetType)
      .get();

    if (reactionSnapshot.empty) {
      return { success: false, error: 'Reaction not found' };
    }

    const reactionDoc = reactionSnapshot.docs[0];
    const reactionData = reactionDoc.data() as Reaction;

    // Update reaction counts on target
    const targetCollection = targetType === 'post' ? 'community_posts' : 'community_replies';
    await adminDb.collection(targetCollection).doc(targetId).update({
      [`reactionCounts.${reactionData.reactionType}`]: FieldValue.increment(-1),
    });

    // Delete reaction
    await reactionDoc.ref.delete();

    // Remove reputation points from target author
    const targetDoc = await adminDb.collection(targetCollection).doc(targetId).get();
    if (targetDoc.exists) {
      const targetData = targetDoc.data();
      if (!targetData) return { success: true };
      const authorId = targetData.authorId;

      if (authorId && authorId !== user.uid) {
        await updateReputationPoints(
          authorId,
          -REPUTATION_POINTS.RECEIVE_REACTION
        );
      }
    }

    return { success: true };
  } catch (error) {
    log.error('Error removing reaction:', error);
    return { success: false, error: 'Failed to remove reaction' };
  }
}

/**
 * Get user's reaction for a target
 */
export async function getUserReaction(input: {
  targetId: string;
  targetType: 'post' | 'reply';
}): Promise<{ reaction: Reaction | null }> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { reaction: null };
    }

    const { targetId, targetType } = input;

    const reactionSnapshot = await adminDb
      .collection('reactions')
      .where('userId', '==', user.uid)
      .where('targetId', '==', targetId)
      .where('targetType', '==', targetType)
      .get();

    if (reactionSnapshot.empty) {
      return { reaction: null };
    }

    const reactionDoc = reactionSnapshot.docs[0];
    return {
      reaction: {
        id: reactionDoc.id,
        ...reactionDoc.data(),
      } as Reaction,
    };
  } catch (error) {
    log.error('Error getting user reaction:', error);
    return { reaction: null };
  }
}

/**
 * Get all reactions for a target
 */
export async function getReactions(input: {
  targetId: string;
  targetType: 'post' | 'reply';
}): Promise<{ reactions: Reaction[] }> {
  try {
    const { targetId, targetType } = input;

    const reactionSnapshot = await adminDb
      .collection('reactions')
      .where('targetId', '==', targetId)
      .where('targetType', '==', targetType)
      .get();

    const reactions: Reaction[] = reactionSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Reaction[];

    return { reactions };
  } catch (error) {
    log.error('Error getting reactions:', error);
    return { reactions: [] };
  }
}

/**
 * Helper: Update user reputation points
 */
async function updateReputationPoints(
  userId: string,
  points: number
): Promise<void> {
  try {
    const reputationRef = adminDb.collection('user_reputations').doc(userId);
    const reputationDoc = await reputationRef.get();

    if (reputationDoc.exists) {
      await reputationRef.update({
        totalPoints: FieldValue.increment(points),
        reactionPoints: FieldValue.increment(points),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Initialize reputation if it doesn't exist
      await reputationRef.set({
        userId,
        totalPoints: Math.max(0, points),
        level: 1,
        levelName: 'Newcomer',
        postPoints: 0,
        replyPoints: 0,
        reactionPoints: Math.max(0, points),
        acceptedAnswerPoints: 0,
        badges: [],
        achievements: [],
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    log.error('Error updating reputation points:', error);
  }
}

/**
 * Helper: Create notification
 */
async function createNotification(input: {
  userId: string;
  type: 'reply' | 'reaction' | 'mention' | 'badge' | 'message' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await adminDb
      .collection('users')
      .doc(input.userId)
      .collection('notifications')
      .add({
        ...input,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    log.error('Error creating notification:', error);
  }
}
