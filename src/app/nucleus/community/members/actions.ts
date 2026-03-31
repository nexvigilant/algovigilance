'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { CommunityPost, Reply, UserReputation, FlexibleTimestamp } from '@/types/community';
import type { CommunityUserId } from '@/types/community/branded-ids';
import { getReputationLevel, getBadgeById } from '@/lib/community-constants';

import { logger } from '@/lib/logger';
const log = logger.scope('members/actions');

/**
 * Get user profile and community activity
 * Uses Admin SDK to bypass security rules (server-side operation)
 */
export async function getUserProfile(userId: string) {
  try {
    // Get user document
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    if (!userData) return { success: false, error: 'User data is empty' };

    // Get user reputation
    const reputationDoc = await adminDb.collection('user_reputations').doc(userId).get();

    let reputation: UserReputation;
    if (reputationDoc.exists) {
      const repData = reputationDoc.data() ?? {};
      const level = getReputationLevel(repData.totalPoints || 0);
      reputation = {
        userId: userId as CommunityUserId,
        totalPoints: repData.totalPoints || 0,
        level: level.level,
        levelName: level.name,
        postPoints: repData.postPoints || 0,
        replyPoints: repData.replyPoints || 0,
        reactionPoints: repData.reactionPoints || 0,
        acceptedAnswerPoints: repData.acceptedAnswerPoints || 0,
        badges: repData.badges || [],
        achievements: repData.achievements || [],
        updatedAt: repData.updatedAt,
      } as UserReputation;
    } else {
      // Initialize default reputation
      const defaultLevel = getReputationLevel(0);
      reputation = {
        userId: userId as CommunityUserId,
        totalPoints: 0,
        level: defaultLevel.level,
        levelName: defaultLevel.name,
        postPoints: 0,
        replyPoints: 0,
        reactionPoints: 0,
        acceptedAnswerPoints: 0,
        badges: [],
        achievements: [],
        updatedAt: FieldValue.serverTimestamp() as unknown as FlexibleTimestamp,
      } as UserReputation;
    }

    // Get accurate post count
    const postsCountSnapshot = await adminDb
      .collection('community_posts')
      .where('authorId', '==', userId)
      .where('isHidden', '==', false)
      .count()
      .get();
    const totalPostCount = postsCountSnapshot.data().count;

    // Get accurate reply count
    const repliesCountSnapshot = await adminDb
      .collectionGroup('replies')
      .where('authorId', '==', userId)
      .where('isHidden', '==', false)
      .count()
      .get();
    const totalReplyCount = repliesCountSnapshot.data().count;

    // Get user's posts
    const postsSnapshot = await adminDb
      .collection('community_posts')
      .where('authorId', '==', userId)
      .where('isHidden', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    const posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as CommunityPost));

    // Get user's replies using collection group query (optimized - single query)
    const repliesSnapshot = await adminDb
      .collectionGroup('replies')
      .where('authorId', '==', userId)
      .where('isHidden', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    // Get parent post titles for replies (batch fetch)
    const postIds = new Set(repliesSnapshot.docs.map(doc => doc.ref.parent.parent?.id).filter(Boolean));
    const postTitles = new Map<string, string>();

    await Promise.all(
      Array.from(postIds).map(async (postId) => {
        const postSnap = await adminDb.collection('community_posts').doc(postId as string).get();
        if (postSnap.exists) {
          postTitles.set(postId as string, postSnap.data()?.title ?? '');
        }
      })
    );

    const replies = repliesSnapshot.docs.map((replyDoc) => {
      const postId = replyDoc.ref.parent.parent?.id || '';
      return {
        id: replyDoc.id,
        postId,
        postTitle: postTitles.get(postId) || 'Unknown Post',
        ...replyDoc.data(),
      } as Reply & { postTitle: string };
    });

    // Get earned badges
    const earnedBadges = reputation.badges
      .map((badgeId) => getBadgeById(badgeId))
      .filter((badge): badge is import('@/types/community').Badge => badge !== undefined);

    return {
      success: true,
      profile: {
        uid: userId,
        name: userData.name || userData.displayName || 'Anonymous',
        avatar: userData.avatar || userData.photoURL || null,
        bio: userData.bio || null,
        joinedAt: userData.createdAt,
        postCount: totalPostCount,
        replyCount: totalReplyCount,
        reputation,
        badges: earnedBadges,
        verifiedPractitioner: Boolean(userData.capability?.verifiedPractitioner),
      },
      posts,
      replies, // Already limited to 10 in query
    };
  } catch (error) {
    log.error('Error fetching user profile:', error);
    return { success: false, error: 'Failed to load user profile' };
  }
}
