'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

import { logger } from '@/lib/logger';
const log = logger.scope('social/following');

/**
 * Helper to get authenticated user from session cookie
 */
async function getAuthenticatedUser() {
  const token = (await cookies()).get('nucleus_id_token')?.value;
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch (error) {
    return null;
  }
}

/**
 * Follow a user
 *
 * Uses a Firestore transaction to ensure atomicity:
 * - Either all relationships and counts update, or none do
 * - Prevents race conditions and data inconsistency
 */
export async function followUser(targetUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (user.uid === targetUserId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    // Document references
    const followingRef = adminDb
      .collection('users')
      .doc(user.uid)
      .collection('following')
      .doc(targetUserId);

    const followerRef = adminDb
      .collection('users')
      .doc(targetUserId)
      .collection('followers')
      .doc(user.uid);

    const currentUserRef = adminDb.collection('users').doc(user.uid);
    const targetUserRef = adminDb.collection('users').doc(targetUserId);

    // Use transaction to ensure atomicity
    const { followerData } = await adminDb.runTransaction(async (transaction) => {
      // Read phase: Check if already following
      const followDoc = await transaction.get(followingRef);
      if (followDoc.exists) {
        throw new Error('Already following this user');
      }

      // Read follower data for notification
      const currentUserDoc = await transaction.get(currentUserRef);
      const userData = currentUserDoc.data();

      // Write phase: Create relationships and update counts
      const now = Timestamp.now();

      transaction.set(followingRef, {
        userId: targetUserId,
        followedAt: now,
      });

      transaction.set(followerRef, {
        userId: user.uid,
        followedAt: now,
      });

      transaction.update(currentUserRef, {
        'stats.followingCount': FieldValue.increment(1),
      });

      transaction.update(targetUserRef, {
        'stats.followersCount': FieldValue.increment(1),
      });

      return { followerData: userData };
    });

    // Create notification (outside transaction - not critical to follow relationship)
    // If this fails, the follow relationship is still valid
    try {
      await adminDb
        .collection('users')
        .doc(targetUserId)
        .collection('notifications')
        .add({
          type: 'follow',
          userId: targetUserId,
          fromUserId: user.uid,
          fromUserName: followerData?.name || 'A user',
          fromUserAvatar: followerData?.avatar || null,
          message: `${followerData?.name || 'A user'} started following you`,
          read: false,
          createdAt: Timestamp.now(),
        });
    } catch (notifError) {
      // Log but don't fail the follow operation
      log.warn('Failed to create follow notification:', notifError);
    }

    return { success: true };
  } catch (error) {
    log.error('Error following user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to follow user',
    };
  }
}

/**
 * Unfollow a user
 *
 * Uses a Firestore transaction to ensure atomicity:
 * - Either all relationships and counts update, or none do
 * - Prevents race conditions and data inconsistency
 */
export async function unfollowUser(targetUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Document references
    const followingRef = adminDb
      .collection('users')
      .doc(user.uid)
      .collection('following')
      .doc(targetUserId);

    const followerRef = adminDb
      .collection('users')
      .doc(targetUserId)
      .collection('followers')
      .doc(user.uid);

    const currentUserRef = adminDb.collection('users').doc(user.uid);
    const targetUserRef = adminDb.collection('users').doc(targetUserId);

    // Use transaction to ensure atomicity
    await adminDb.runTransaction(async (transaction) => {
      // Read phase: Verify the follow relationship exists
      const followDoc = await transaction.get(followingRef);
      if (!followDoc.exists) {
        throw new Error('Not following this user');
      }

      // Write phase: Delete relationships and update counts
      transaction.delete(followingRef);
      transaction.delete(followerRef);

      transaction.update(currentUserRef, {
        'stats.followingCount': FieldValue.increment(-1),
      });

      transaction.update(targetUserRef, {
        'stats.followersCount': FieldValue.increment(-1),
      });
    });

    return { success: true };
  } catch (error) {
    log.error('Error unfollowing user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unfollow user',
    };
  }
}

/**
 * Check if current user is following a target user
 */
export async function isFollowing(targetUserId: string): Promise<{
  success: boolean;
  isFollowing?: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: true, isFollowing: false };
    }

    const followDoc = await adminDb
      .collection('users')
      .doc(user.uid)
      .collection('following')
      .doc(targetUserId)
      .get();

    return { success: true, isFollowing: followDoc.exists };
  } catch (error) {
    log.error('Error checking follow status:', error);
    return { success: false, error: 'Failed to check follow status' };
  }
}

/**
 * Get user's followers
 */
export async function getFollowers(userId: string): Promise<{
  success: boolean;
  followers?: Array<{
    userId: string;
    followedAt: Timestamp | null;
    name?: string;
    avatar?: string;
  }>;
  error?: string;
}> {
  try {
    const followersSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('followers')
      .get();

    const followers = await Promise.all(
      followersSnapshot.docs.map(async (followerDoc) => {
        const followerData = followerDoc.data();
        const userDoc = await adminDb.collection('users').doc(followerData.userId).get();
        const userData = userDoc.data();

        return {
          userId: followerData.userId,
          followedAt: followerData.followedAt,
          name: userData?.name,
          avatar: userData?.avatar,
        };
      })
    );

    return { success: true, followers };
  } catch (error) {
    log.error('Error getting followers:', error);
    return { success: false, error: 'Failed to get followers' };
  }
}

/**
 * Get user's following list
 */
export async function getFollowing(userId: string): Promise<{
  success: boolean;
  following?: Array<{
    userId: string;
    followedAt: Timestamp | null;
    name?: string;
    avatar?: string;
  }>;
  error?: string;
}> {
  try {
    const followingSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('following')
      .get();

    const following = await Promise.all(
      followingSnapshot.docs.map(async (followingDoc) => {
        const followingData = followingDoc.data();
        const userDoc = await adminDb.collection('users').doc(followingData.userId).get();
        const userData = userDoc.data();

        return {
          userId: followingData.userId,
          followedAt: followingData.followedAt,
          name: userData?.name,
          avatar: userData?.avatar,
        };
      })
    );

    return { success: true, following };
  } catch (error) {
    log.error('Error getting following:', error);
    return { success: false, error: 'Failed to get following' };
  }
}

/**
 * Get suggested users to follow
 * Based on shared interests, forums, etc.
 */
export async function getSuggestedUsers(limitCount: number = 10): Promise<{
  success: boolean;
  users?: Array<{
    userId: string;
    name: string;
    avatar?: string;
    bio?: string;
    stats?: Record<string, unknown>;
  }>;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get current following list to exclude
    const followingSnapshot = await adminDb
      .collection('users')
      .doc(user.uid)
      .collection('following')
      .get();
    const followingIds = followingSnapshot.docs.map((doc) => doc.id);

    // Get active users (simplified - in production would use more complex algorithm)
    const usersSnapshot = await adminDb
      .collection('users')
      .where('isProfilePublic', '==', true)
      .get();

    const suggestions = usersSnapshot.docs
      .filter((doc) => doc.id !== user.uid && !followingIds.includes(doc.id))
      .slice(0, limitCount)
      .map((doc) => {
        const data = doc.data();
        return {
          userId: doc.id,
          name: data.name,
          avatar: data.avatar,
          bio: data.bio,
          stats: data.stats,
        };
      });

    return { success: true, users: suggestions };
  } catch (error) {
    log.error('Error getting suggested users:', error);
    return { success: false, error: 'Failed to get suggested users' };
  }
}
