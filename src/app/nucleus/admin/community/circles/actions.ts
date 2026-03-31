'use server';

import { toDate } from '@/lib/utils';
import { adminAuth, adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('circles/actions');

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

export interface CircleMember {
  id: string;
  odspId: string;
  odName: string;
  avatar?: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
  postCount: number;
  lastActive?: Date;
}

export interface JoinRequest {
  id: string;
  odspId: string;
  odName: string;
  avatar?: string;
  message?: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CircleAnalytics {
  totalMembers: number;
  totalPosts: number;
  totalReplies: number;
  activeMembers: number;
  growthRate: number;
  topContributors: Array<{
    odspId: string;
    odName: string;
    contributions: number;
  }>;
  activityByDay: Array<{
    date: string;
    posts: number;
    replies: number;
  }>;
  memberGrowth: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Get all members of a circle
 */
export async function getCircleMembersAdmin(
  circleId: string
): Promise<CircleMember[]> {
  try {
    await checkAdmin();

    const snapshot = await adminDb.collection(`forums/${circleId}/members`)
      .orderBy('joinedAt', 'desc')
      .get();

    const members: CircleMember[] = [];

    for (const memberDoc of snapshot.docs) {
      const data = memberDoc.data();

      // Get user details
      let userName = data.userName || 'Unknown';
      let avatar = data.avatar;
      let postCount = 0;
      let lastActive: Date | undefined;

      // Try to get additional user info and post count in parallel (independent)
      if (data.userId) {
        const [userDoc, postsSnapshot] = await Promise.all([
          adminDb.collection('users').doc(data.userId).get(),
          adminDb.collection('community_posts')
            .where('forumId', '==', circleId)
            .where('authorId', '==', data.userId)
            .get(),
        ]);
        const userData = userDoc.data();
        if (userDoc.exists && userData) {
          userName = userData.displayName || userData.name || userName;
          avatar = userData.photoURL || avatar;
          lastActive = toDateFromSerialized(userData.lastActiveAt);
        }
        postCount = postsSnapshot.size;
      }

      members.push({
        id: memberDoc.id,
        odspId: data.userId || memberDoc.id,
        odName: userName,
        avatar,
        role: data.role || 'member',
        joinedAt: toDate(data.joinedAt),
        postCount,
        lastActive,
      });
    }

    return members;
  } catch (error) {
    log.error('Error fetching circle members:', error);
    return [];
  }
}

/**
 * Update member role in a circle
 */
export async function updateMemberRoleAdmin(
  circleId: string,
  memberId: string,
  newRole: 'member' | 'moderator' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    const memberRef = adminDb.collection(`forums/${circleId}/members`).doc(memberId);
    await memberRef.update({
      role: newRole,
      updatedAt: adminTimestamp.now(),
    });

    revalidatePath(`/nucleus/admin/community/circles`);
    return { success: true };
  } catch (error) {
    log.error('Error updating member role:', error);
    return { success: false, error: 'Failed to update member role' };
  }
}

/**
 * Remove member from a circle
 */
export async function removeCircleMemberAdmin(
  circleId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    // Delete member document and read circle doc in parallel (independent operations)
    const memberRef = adminDb.collection(`forums/${circleId}/members`).doc(memberId);
    const circleRef = adminDb.collection('forums').doc(circleId);
    const [, circleDoc] = await Promise.all([
      memberRef.delete(),
      circleRef.get(),
    ]);
    const circleData = circleDoc.data();
    if (circleDoc.exists && circleData) {
      const currentCount = circleData.membership?.memberCount || 0;
      await circleRef.update({
        'membership.memberCount': Math.max(0, currentCount - 1),
        updatedAt: adminTimestamp.now(),
      });
    }

    revalidatePath(`/nucleus/admin/community/circles`);
    return { success: true };
  } catch (error) {
    log.error('Error removing member:', error);
    return { success: false, error: 'Failed to remove member' };
  }
}

/**
 * Get pending join requests for a circle
 */
export async function getJoinRequestsAdmin(
  circleId: string
): Promise<JoinRequest[]> {
  try {
    await checkAdmin();

    const snapshot = await adminDb.collection(`forums/${circleId}/joinRequests`)
      .orderBy('createdAt', 'desc')
      .get();

    const requests: JoinRequest[] = [];

    for (const requestDoc of snapshot.docs) {
      const data = requestDoc.data();

      // Get user details
      let userName = 'Unknown';
      let avatar: string | undefined;

      if (data.userId) {
        const userDoc = await adminDb.collection('users').doc(data.userId).get();
        const userData = userDoc.data();
        if (userDoc.exists && userData) {
          userName = userData.displayName || userData.name || 'Unknown';
          avatar = userData.photoURL;
        }
      }

      requests.push({
        id: requestDoc.id,
        odspId: data.userId || requestDoc.id,
        odName: userName,
        avatar,
        message: data.message,
        createdAt: toDate(data.createdAt),
        status: data.status || 'pending',
      });
    }

    return requests.filter(r => r.status === 'pending');
  } catch (error) {
    log.error('Error fetching join requests:', error);
    return [];
  }
}

/**
 * Approve a join request
 */
export async function approveJoinRequestAdmin(
  circleId: string,
  requestId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    // Update request status
    const requestRef = adminDb.collection(`forums/${circleId}/joinRequests`).doc(requestId);
    await requestRef.update({
      status: 'approved',
      processedAt: adminTimestamp.now(),
    });

    // Read member doc and circle doc in parallel (independent reads)
    const memberRef = adminDb.collection(`forums/${circleId}/members`).doc(userId);
    const circleRef = adminDb.collection('forums').doc(circleId);
    const [memberDoc, circleDoc] = await Promise.all([
      memberRef.get(),
      circleRef.get(),
    ]);

    // Add user as member
    if (memberDoc.exists) {
      await memberRef.update({
        userId,
        role: 'member',
        joinedAt: adminTimestamp.now(),
      });
    } else {
      await memberRef.set({
        userId,
        role: 'member',
        joinedAt: adminTimestamp.now(),
      });
    }

    // Update member count
    const circleDocData = circleDoc.data();
    if (circleDoc.exists && circleDocData) {
      const currentCount = circleDocData.membership?.memberCount || 0;
      await circleRef.update({
        'membership.memberCount': currentCount + 1,
        updatedAt: adminTimestamp.now(),
      });
    }

    revalidatePath(`/nucleus/admin/community/circles`);
    return { success: true };
  } catch (error) {
    log.error('Error approving join request:', error);
    return { success: false, error: 'Failed to approve request' };
  }
}

/**
 * Reject a join request
 */
export async function rejectJoinRequestAdmin(
  circleId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    const requestRef = adminDb.collection(`forums/${circleId}/joinRequests`).doc(requestId);
    await requestRef.update({
      status: 'rejected',
      processedAt: adminTimestamp.now(),
    });

    revalidatePath(`/nucleus/admin/community/circles`);
    return { success: true };
  } catch (error) {
    log.error('Error rejecting join request:', error);
    return { success: false, error: 'Failed to reject request' };
  }
}

/**
 * Get analytics for a specific circle
 */
export async function getCircleAnalyticsAdmin(
  circleId: string
): Promise<CircleAnalytics> {
  try {
    await checkAdmin();

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get circle data, members, and posts in parallel (all independent)
    const [circleDoc, membersSnapshot, postsSnapshot] = await Promise.all([
      adminDb.collection('forums').doc(circleId).get(),
      adminDb.collection(`forums/${circleId}/members`).get(),
      adminDb.collection('community_posts').where('forumId', '==', circleId).get(),
    ]);
    const _circleData = circleDoc.data();
    const totalMembers = membersSnapshot.size;
    const totalPosts = postsSnapshot.size;

    // Calculate activity metrics
    let totalReplies = 0;
    let activeMembers = new Set<string>();
    const contributorCounts: Record<string, { name: string; count: number }> = {};
    const activityByDay: Record<string, { posts: number; replies: number }> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      activityByDay[dateKey] = { posts: 0, replies: 0 };
    }

    for (const postDoc of postsSnapshot.docs) {
      const post = postDoc.data();
      const authorId = post.authorId;
      const authorName = post.authorName || 'Unknown';
      const createdAt = toDateFromSerialized(post.createdAt);

      // Track contributors
      if (!contributorCounts[authorId]) {
        contributorCounts[authorId] = { name: authorName, count: 0 };
      }
      contributorCounts[authorId].count++;

      // Track active members (posted in last 7 days)
      if (createdAt && createdAt >= weekAgo) {
        activeMembers.add(authorId);
        const dateKey = createdAt.toISOString().split('T')[0];
        if (activityByDay[dateKey]) {
          activityByDay[dateKey].posts++;
        }
      }

      // Count replies
      const repliesSnapshot = await adminDb.collection(`community_posts/${postDoc.id}/replies`).get();
      totalReplies += repliesSnapshot.size;

      for (const replyDoc of repliesSnapshot.docs) {
        const reply = replyDoc.data();
        const replyCreatedAt = toDateFromSerialized(reply.createdAt);
        if (replyCreatedAt && replyCreatedAt >= weekAgo) {
          activeMembers.add(reply.authorId);
          const dateKey = replyCreatedAt.toISOString().split('T')[0];
          if (activityByDay[dateKey]) {
            activityByDay[dateKey].replies++;
          }
        }
      }
    }

    // Get top contributors
    const topContributors = Object.entries(contributorCounts)
      .map(([odspId, data]) => ({
        odspId,
        odName: data.name,
        contributions: data.count,
      }))
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 5);

    // Format activity by day
    const activityByDayArray = Object.entries(activityByDay)
      .map(([date, data]) => ({
        date,
        posts: data.posts,
        replies: data.replies,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate growth rate (simplified - compare this week to total)
    const growthRate = totalMembers > 0
      ? Math.round((activeMembers.size / totalMembers) * 100)
      : 0;

    // Member growth (simplified - just show current count for last 7 days)
    const memberGrowth = activityByDayArray.map(day => ({
      date: day.date,
      count: totalMembers, // In production, track historical member counts
    }));

    return {
      totalMembers,
      totalPosts,
      totalReplies,
      activeMembers: activeMembers.size,
      growthRate,
      topContributors,
      activityByDay: activityByDayArray,
      memberGrowth,
    };
  } catch (error) {
    log.error('Error fetching circle analytics:', error);
    return {
      totalMembers: 0,
      totalPosts: 0,
      totalReplies: 0,
      activeMembers: 0,
      growthRate: 0,
      topContributors: [],
      activityByDay: [],
      memberGrowth: [],
    };
  }
}

/**
 * Get all join requests across all circles (for dashboard)
 */
export async function getAllPendingRequestsAdmin(): Promise<
  Array<{
    circleId: string;
    circleName: string;
    requests: JoinRequest[];
  }>
> {
  try {
    await checkAdmin();

    const circlesSnapshot = await adminDb.collection('forums').get();

    const results: Array<{
      circleId: string;
      circleName: string;
      requests: JoinRequest[];
    }> = [];

    for (const circleDoc of circlesSnapshot.docs) {
      const circleData = circleDoc.data();
      const requests = await getJoinRequestsAdmin(circleDoc.id);

      if (requests.length > 0) {
        results.push({
          circleId: circleDoc.id,
          circleName: circleData.name || 'Unknown Circle',
          requests,
        });
      }
    }

    return results;
  } catch (error) {
    log.error('Error fetching all pending requests:', error);
    return [];
  }
}
