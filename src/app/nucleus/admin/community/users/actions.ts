'use server';

import { toDate } from '@/lib/utils';
import { adminAuth, adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('users/actions');

// Check if user is admin - verifies session AND role
async function checkAdmin() {
  const session = (await cookies()).get('session')?.value;
  if (!session) {
    throw new Error('Not authenticated');
  }

  try {
    const user = await adminAuth.verifySessionCookie(session, true);

    // SECURITY: Verify admin role in Firestore
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
      log.error(`[checkAdmin] User document not found for uid: ${user.uid}`);
      throw new Error('Unauthorized: User not found');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      log.error(`[checkAdmin] Unauthorized access attempt by user: ${user.uid}, role: ${userData?.role}`);
      throw new Error('Unauthorized: Admin access required');
    }

    return user;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      throw error;
    }
    throw new Error('Not authenticated');
  }
}

export interface UserStats {
  totalPosts: number;
  totalReplies: number;
  totalReactions: number;
  badgesEarned: number;
  circlesMember: number;
  lastActiveAt?: Date;
  accountAge: number; // days
}

export interface CommunityUserStats {
  totalUsers: number;
  activeUsers: number; // active in last 7 days
  newUsersThisWeek: number;
  bannedUsers: number;
  adminCount: number;
  moderatorCount: number;
}

/**
 * Get community-wide user statistics
 */
export async function getCommunityUserStats(): Promise<CommunityUserStats> {
  try {
    await checkAdmin();

    const usersSnapshot = await adminDb.collection('users').get();

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let totalUsers = 0;
    let activeUsers = 0;
    let newUsersThisWeek = 0;
    let bannedUsers = 0;
    let adminCount = 0;
    let moderatorCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const data = userDoc.data();
      totalUsers++;

      // Check role
      const role = data.role || 'user';
      if (role === 'admin') adminCount++;
      if (role === 'moderator') moderatorCount++;

      // Check banned status
      if (data.isBanned) bannedUsers++;

      // Check if active in last 7 days
      const lastActive = toDateFromSerialized(data.lastActiveAt) || toDateFromSerialized(data.updatedAt);
      if (lastActive && lastActive >= weekAgo) {
        activeUsers++;
      }

      // Check if new user this week
      const createdAt = toDateFromSerialized(data.createdAt);
      if (createdAt && createdAt >= weekAgo) {
        newUsersThisWeek++;
      }
    }

    return {
      totalUsers,
      activeUsers,
      newUsersThisWeek,
      bannedUsers,
      adminCount,
      moderatorCount,
    };
  } catch (error) {
    log.error('Error fetching community user stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisWeek: 0,
      bannedUsers: 0,
      adminCount: 0,
      moderatorCount: 0,
    };
  }
}

/**
 * Get detailed stats for a specific user
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    await checkAdmin();

    // Get user document, posts, reactions, badges, and forums in parallel
    const [
      userDoc,
      postsSnapshot,
      allPostsSnapshot,
      reactionsSnapshot,
      badgesSnapshot,
      forumsSnapshot,
    ] = await Promise.all([
      adminDb.collection('users').doc(userId).get(),
      adminDb.collection('community_posts').where('authorId', '==', userId).get(),
      adminDb.collection('community_posts').get(),
      adminDb.collection('reactions').where('userId', '==', userId).get(),
      adminDb.collection('users').doc(userId).collection('badges').get(),
      adminDb.collection('forums').get(),
    ]);
    const userData = userDoc.data();

    const totalPosts = postsSnapshot.size;

    // Count replies by this user
    let totalReplies = 0;
    for (const postDoc of postsSnapshot.docs) {
      const repliesSnapshot = await adminDb
        .collection('community_posts')
        .doc(postDoc.id)
        .collection('replies')
        .where('authorId', '==', userId)
        .get();
      totalReplies += repliesSnapshot.size;
    }

    // Also check replies on other posts
    for (const postDoc of allPostsSnapshot.docs) {
      if (postsSnapshot.docs.find(d => d.id === postDoc.id)) continue; // Skip own posts
      const repliesSnapshot = await adminDb
        .collection('community_posts')
        .doc(postDoc.id)
        .collection('replies')
        .where('authorId', '==', userId)
        .get();
      totalReplies += repliesSnapshot.size;
    }

    const totalReactions = reactionsSnapshot.size;
    const badgesEarned = badgesSnapshot.size;

    // Count circles membership
    let circlesMember = 0;

    for (const forumDoc of forumsSnapshot.docs) {
      const memberDoc = await adminDb
        .collection('forums')
        .doc(forumDoc.id)
        .collection('members')
        .doc(userId)
        .get();
      if (memberDoc.exists) {
        circlesMember++;
      }
    }

    // Calculate account age
    const createdAt = toDate(userData?.createdAt);
    const accountAge = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalPosts,
      totalReplies,
      totalReactions,
      badgesEarned,
      circlesMember,
      lastActiveAt: toDateFromSerialized(userData?.lastActiveAt),
      accountAge,
    };
  } catch (error) {
    log.error('Error fetching user stats:', error);
    return {
      totalPosts: 0,
      totalReplies: 0,
      totalReactions: 0,
      badgesEarned: 0,
      circlesMember: 0,
      accountAge: 0,
    };
  }
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  newRole: 'user' | 'moderator' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    await adminDb.collection('users').doc(userId).update({
      role: newRole,
      updatedAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/users');
    return { success: true };
  } catch (error) {
    log.error('Error updating user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

/**
 * Get recent user activity
 */
export async function getUserActivity(
  userId: string,
  limitCount: number = 10
): Promise<Array<{
  type: 'post' | 'reply' | 'reaction';
  content: string;
  createdAt: Date;
  targetId: string;
}>> {
  try {
    await checkAdmin();

    const activity: Array<{
      type: 'post' | 'reply' | 'reaction';
      content: string;
      createdAt: Date;
      targetId: string;
    }> = [];

    // Get recent posts and reactions in parallel
    const [postsSnapshot, reactionsSnapshot] = await Promise.all([
      adminDb
        .collection('community_posts')
        .where('authorId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get(),
      adminDb
        .collection('reactions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get(),
    ]);

    for (const postDoc of postsSnapshot.docs) {
      const data = postDoc.data();
      activity.push({
        type: 'post',
        content: data.title || data.content?.substring(0, 50) || 'Post',
        createdAt: toDate(data.createdAt),
        targetId: postDoc.id,
      });
    }

    for (const reactionDoc of reactionsSnapshot.docs) {
      const data = reactionDoc.data();
      activity.push({
        type: 'reaction',
        content: `${data.type} reaction`,
        createdAt: toDate(data.createdAt),
        targetId: data.postId || data.targetId,
      });
    }

    // Sort by date and limit
    return activity
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limitCount);
  } catch (error) {
    log.error('Error fetching user activity:', error);
    return [];
  }
}

/**
 * Revocation result type
 */
export interface RevocationResult {
  success: boolean;
  circlesRemoved?: number;
  error?: string;
}

/**
 * Guardian Protocol: Revoke a user's verified practitioner status
 *
 * This action:
 * 1. Clears the verifiedPractitioner flag on the user document
 * 2. Invalidates any existing capability proof tokens
 * 3. Removes the user from all high-trust circles they gained access through verification
 * 4. Creates an audit trail for compliance
 */
export async function revokeCapabilityProof(
  userId: string,
  reason?: string
): Promise<RevocationResult> {
  try {
    const admin = await checkAdmin();

    // 1. Fetch user document to verify current status
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();

    // Check if user is actually verified
    if (!userData?.verifiedPractitioner) {
      return { success: false, error: 'User is not currently verified' };
    }

    // 2. Find all high-trust circles this user is a member of
    const forumsSnapshot = await adminDb.collection('forums').get();
    const highTrustCirclesToRemove: { id: string; name: string }[] = [];

    for (const forumDoc of forumsSnapshot.docs) {
      const forumData = forumDoc.data();
      const membership = forumData.membership || {};
      const memberIds: string[] = membership.memberIds || [];

      // Check if user is a member and if it's a high-trust circle
      const isHighTrust =
        membership.trustLevel === 'high' ||
        membership.requiredTrustLevel === 'verified' ||
        membership.requiredTrustLevel === 'expert' ||
        forumData.metadata?.requiredPathway;

      if (memberIds.includes(userId) && isHighTrust) {
        highTrustCirclesToRemove.push({
          id: forumDoc.id,
          name: forumData.name || 'Unnamed Circle',
        });
      }
    }

    // 3. Execute batch update for atomic operation
    const batch = adminDb.batch();

    // Update user document - clear verification status
    batch.update(userRef, {
      verifiedPractitioner: false,
      'capability.verifiedPractitioner': false,
      'capability.proofToken': FieldValue.delete(),
      'capability.verifiedAt': FieldValue.delete(),
      'capability.revokedAt': adminTimestamp.now(),
      'capability.revokedBy': admin.uid,
      'capability.revocationReason': reason || 'Administrative revocation',
      trustStatus: 'revoked', // New field for UI status display
      updatedAt: adminTimestamp.now(),
    });

    // Remove user from each high-trust circle
    for (const circle of highTrustCirclesToRemove) {
      const forumRef = adminDb.collection('forums').doc(circle.id);
      batch.update(forumRef, {
        'membership.memberIds': FieldValue.arrayRemove(userId),
        'membership.memberCount': FieldValue.increment(-1),
        updatedAt: adminTimestamp.now(),
      });

      // Create removal audit entry
      const auditRef = adminDb
        .collection('forums')
        .doc(circle.id)
        .collection('audit_log')
        .doc();
      batch.set(auditRef, {
        type: 'member_removed',
        reason: 'capability_revocation',
        userId,
        removedBy: admin.uid,
        revocationReason: reason || 'Administrative revocation',
        createdAt: adminTimestamp.now(),
      });
    }

    // 4. Create Guardian Protocol audit entry
    const auditRef = adminDb.collection('audit_log').doc();
    batch.set(auditRef, {
      type: 'capability_revocation',
      targetUserId: userId,
      targetUserEmail: userData.email,
      targetUserName: userData.name || userData.displayName,
      performedBy: admin.uid,
      reason: reason || 'Administrative revocation',
      circlesRemoved: highTrustCirclesToRemove.map(c => ({ id: c.id, name: c.name })),
      circlesRemovedCount: highTrustCirclesToRemove.length,
      previousStatus: {
        verifiedPractitioner: userData.verifiedPractitioner,
        pathwayId: userData.capability?.pathwayId,
        progressPercent: userData.capability?.progressPercent,
      },
      createdAt: adminTimestamp.now(),
    });

    // Create user notification about revocation
    const notificationRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .doc();
    batch.set(notificationRef, {
      type: 'capability_revoked',
      message: 'Your verified practitioner status has been revoked.',
      reason: reason || 'Please contact support for more information.',
      circlesAffected: highTrustCirclesToRemove.length,
      read: false,
      createdAt: adminTimestamp.now(),
    });

    // Commit all changes atomically
    await batch.commit();

    // Guardian Protocol: Audit trail logging
    log.info('Capability proof revoked', {
      targetUserId: userId,
      adminUserId: admin.uid,
      reason,
      circlesRemoved: highTrustCirclesToRemove.length,
      circleNames: highTrustCirclesToRemove.map(c => c.name),
    });

    revalidatePath('/nucleus/admin/community/users');
    revalidatePath('/nucleus/community/circles');

    return {
      success: true,
      circlesRemoved: highTrustCirclesToRemove.length,
    };
  } catch (error) {
    log.error('Error revoking capability proof:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke capability'
    };
  }
}

/**
 * Restore a previously revoked user's verification status
 * (Requires manual re-verification through normal pathways)
 */
export async function clearRevocationStatus(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    await adminDb.collection('users').doc(userId).update({
      trustStatus: FieldValue.delete(),
      'capability.revokedAt': FieldValue.delete(),
      'capability.revokedBy': FieldValue.delete(),
      'capability.revocationReason': FieldValue.delete(),
      updatedAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/users');
    return { success: true };
  } catch (error) {
    log.error('Error clearing revocation status:', error);
    return { success: false, error: 'Failed to clear revocation status' };
  }
}
