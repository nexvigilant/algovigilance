'use server';

import { adminAuth, adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

import { logger } from '@/lib/logger';
const log = logger.scope('badges/actions');

/**
 * Helper to convert flexible timestamp types to Date
 */
function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'number') return new Date(value);
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return toDateFromSerialized(value as { toDate: () => Date });
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  return new Date();
}
import { revalidatePath } from 'next/cache';
import { BADGES } from '@/lib/community-constants';
import type { Badge, UserReputation, Achievement } from '@/types/community';
import type { BadgeId } from '@/types/community/branded-ids';
import { toDateFromSerialized } from '@/types/academy';

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

export interface BadgeWithStats extends Badge {
  totalAwarded: number;
  recentAwards: Array<{
    userId: string;
    userName: string;
    awardedAt: Date;
  }>;
}

export interface BadgeAnalytics {
  totalBadgesAwarded: number;
  uniqueUsersWithBadges: number;
  mostAwardedBadges: Array<{ badgeId: string; count: number }>;
  leastAwardedBadges: Array<{ badgeId: string; count: number }>;
  recentActivity: Array<{
    userId: string;
    userName: string;
    badgeId: string;
    badgeName: string;
    awardedAt: Date;
  }>;
  categoryDistribution: Record<string, number>;
  rarityDistribution: Record<string, number>;
}

/**
 * Get all badges with award statistics
 */
export async function getAllBadgesWithStats(): Promise<BadgeWithStats[]> {
  try {
    await checkAdmin();

    // Get all user reputations to count badges
    const reputationsSnapshot = await adminDb.collection('user_reputations').get();

    // Count badges across all users
    const badgeCounts: Record<string, number> = {};
    const badgeAwards: Record<string, Array<{ userId: string; userName: string; awardedAt: Date }>> = {};

    for (const repDoc of reputationsSnapshot.docs) {
      const reputation = repDoc.data() as UserReputation;
      const userId = repDoc.id;

      // Get user name
      const oderDoc = await adminDb.collection('users').doc(userId).get();
      const oderData = oderDoc.data();
      const userName = oderDoc.exists && oderData
        ? oderData.displayName || oderData.name || 'Unknown'
        : 'Unknown';

      // Count badges and track awards
      const badges = reputation.badges || [];
      const achievements = reputation.achievements || [];

      for (const badgeId of badges) {
        badgeCounts[badgeId] = (badgeCounts[badgeId] || 0) + 1;

        // Find achievement record for this badge
        const achievement = achievements.find((a) => a.badgeId === badgeId);
        const awardedAt = toDate(achievement?.earnedAt);

        if (!badgeAwards[badgeId]) {
          badgeAwards[badgeId] = [];
        }
        badgeAwards[badgeId].push({ userId, userName, awardedAt });
      }
    }

    // Build badges with stats
    const badgesWithStats: BadgeWithStats[] = BADGES.map((badge) => {
      const awards = badgeAwards[badge.id] || [];
      // Sort by most recent and take top 5
      const sortedAwards = awards
        .sort((a, b) => b.awardedAt.getTime() - a.awardedAt.getTime())
        .slice(0, 5)
        .map((a) => ({
          userId: a.userId,
          userName: a.userName,
          awardedAt: a.awardedAt,
        }));

      return {
        ...badge,
        totalAwarded: badgeCounts[badge.id] || 0,
        recentAwards: sortedAwards,
      };
    });

    return badgesWithStats;
  } catch (error) {
    log.error('Error fetching badges with stats:', error);
    throw new Error('Failed to fetch badges');
  }
}

/**
 * Get badge analytics dashboard data
 */
export async function getBadgeAnalytics(): Promise<BadgeAnalytics> {
  try {
    await checkAdmin();

    const reputationsSnapshot = await adminDb.collection('user_reputations').get();

    // Initialize counters
    const badgeCounts: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};
    const rarityCount: Record<string, number> = {};
    const recentActivity: BadgeAnalytics['recentActivity'] = [];
    let totalBadgesAwarded = 0;
    let uniqueUsersWithBadges = 0;

    for (const repDoc of reputationsSnapshot.docs) {
      const reputation = repDoc.data() as UserReputation;
      const userId = repDoc.id;
      const badges = reputation.badges || [];
      const achievements = reputation.achievements || [];

      if (badges.length > 0) {
        uniqueUsersWithBadges++;
      }

      // Get user name for activity
      const oderDoc = await adminDb.collection('users').doc(userId).get();
      const oderData = oderDoc.data();
      const userName = oderDoc.exists && oderData
        ? oderData.displayName || oderData.name || 'Unknown'
        : 'Unknown';

      for (const badgeId of badges) {
        totalBadgesAwarded++;
        badgeCounts[badgeId] = (badgeCounts[badgeId] || 0) + 1;

        // Find badge definition
        const badgeDef = BADGES.find((b) => b.id === badgeId);
        if (badgeDef) {
          categoryCount[badgeDef.category] = (categoryCount[badgeDef.category] || 0) + 1;
          rarityCount[badgeDef.rarity] = (rarityCount[badgeDef.rarity] || 0) + 1;

          // Find achievement for activity feed
          const achievement = achievements.find((a) => a.badgeId === badgeId);
          if (achievement) {
            recentActivity.push({
              userId,
              userName: userName,
              badgeId,
              badgeName: badgeDef.name,
              awardedAt: toDate(achievement.earnedAt),
            });
          }
        }
      }
    }

    // Sort and slice activity
    recentActivity.sort((a, b) => b.awardedAt.getTime() - a.awardedAt.getTime());
    const topActivity = recentActivity.slice(0, 20);

    // Get most/least awarded
    const sortedBadges = Object.entries(badgeCounts)
      .map(([badgeId, count]) => ({ badgeId, count }))
      .sort((a, b) => b.count - a.count);

    const mostAwarded = sortedBadges.slice(0, 5);
    const leastAwarded = sortedBadges
      .filter((b) => b.count > 0)
      .slice(-5)
      .reverse();

    return {
      totalBadgesAwarded,
      uniqueUsersWithBadges,
      mostAwardedBadges: mostAwarded,
      leastAwardedBadges: leastAwarded,
      recentActivity: topActivity,
      categoryDistribution: categoryCount,
      rarityDistribution: rarityCount,
    };
  } catch (error) {
    log.error('Error fetching badge analytics:', error);
    throw new Error('Failed to fetch analytics');
  }
}

/**
 * Search users for badge award modal
 */
export async function searchUsersForAward(searchTerm: string): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    badgeCount: number;
  }>
> {
  try {
    await checkAdmin();

    // Get users (limit to 100 for performance)
    const usersSnapshot = await adminDb.collection('users').limit(100).get();

    const results: Array<{
      id: string;
      name: string;
      email: string;
      photoURL?: string;
      badgeCount: number;
    }> = [];

    const searchLower = searchTerm.toLowerCase();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const name = userData.displayName || userData.name || '';
      const email = userData.email || '';

      // Filter by search term
      if (
        name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower)
      ) {
        // Get badge count
        const repDoc = await adminDb.collection('user_reputations').doc(userDoc.id).get();
        const repData = repDoc.data();
        const badgeCount = repDoc.exists && repData
          ? (repData.badges || []).length
          : 0;

        results.push({
          id: userDoc.id,
          name,
          email,
          photoURL: userData.photoURL,
          badgeCount,
        });

        if (results.length >= 20) break;
      }
    }

    return results;
  } catch (error) {
    log.error('Error searching users:', error);
    return [];
  }
}

/**
 * Manually award a badge to a user
 */
export async function awardBadgeToUser(
  userId: string,
  badgeId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await checkAdmin();

    // Validate badge exists
    const badgeDef = BADGES.find((b) => b.id === badgeId);
    if (!badgeDef) {
      return { success: false, error: 'Badge not found' };
    }

    // Get or create user reputation
    const reputationRef = adminDb.collection('user_reputations').doc(userId);
    const reputationDoc = await reputationRef.get();

    let currentBadges: readonly BadgeId[] = [];
    let currentAchievements: readonly Achievement[] = [];

    if (reputationDoc.exists) {
      const data = reputationDoc.data() as UserReputation;
      currentBadges = data.badges || [];
      currentAchievements = data.achievements || [];

      // Check if already has badge
      if (currentBadges.includes(badgeId as BadgeId)) {
        return { success: false, error: 'User already has this badge' };
      }
    }

    // Add badge
    const newAchievement: Achievement = {
      badgeId: badgeId as BadgeId,
      earnedAt: adminTimestamp.now(),
      awardedBy: admin.uid,
      isManualAward: true,
      reason: reason || 'Manually awarded by admin',
    };

    await reputationRef.update({
      badges: [...currentBadges, badgeId as BadgeId],
      achievements: [...currentAchievements, newAchievement],
      updatedAt: adminTimestamp.now(),
    });

    // Log admin action and create notification in parallel (independent writes)
    await Promise.all([
      adminDb.collection('badge_admin_actions').add({
        type: 'award',
        badgeId,
        userId,
        adminId: admin.uid,
        reason: reason || 'Manual award',
        createdAt: adminTimestamp.now(),
      }),
      adminDb.collection('users').doc(userId).collection('notifications').add({
        type: 'badge',
        title: 'Badge Awarded!',
        message: `${badgeDef.icon} You've been awarded the "${badgeDef.name}" badge!`,
        read: false,
        actionUrl: `/nucleus/community/members/${userId}`,
        metadata: {
          badgeId,
          badgeName: badgeDef.name,
          badgeIcon: badgeDef.icon,
          isManualAward: true,
        },
        createdAt: adminTimestamp.now(),
      }),
    ]);

    revalidatePath('/nucleus/admin/community/badges');
    return { success: true };
  } catch (error) {
    log.error('Error awarding badge:', error);
    return { success: false, error: 'Failed to award badge' };
  }
}

/**
 * Revoke a badge from a user
 */
export async function revokeBadgeFromUser(
  userId: string,
  badgeId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await checkAdmin();

    const reputationRef = adminDb.collection('user_reputations').doc(userId);
    const reputationDoc = await reputationRef.get();

    if (!reputationDoc.exists) {
      return { success: false, error: 'User reputation not found' };
    }

    const data = reputationDoc.data() as UserReputation;
    const currentBadges = data.badges || [];
    const currentAchievements = data.achievements || [];

    if (!currentBadges.includes(badgeId as BadgeId)) {
      return { success: false, error: 'User does not have this badge' };
    }

    // Remove badge
    const updatedBadges = currentBadges.filter((id) => id !== (badgeId as BadgeId));
    const updatedAchievements = currentAchievements.filter(
      (a) => a.badgeId !== badgeId
    );

    await reputationRef.update({
      badges: updatedBadges,
      achievements: updatedAchievements,
      updatedAt: adminTimestamp.now(),
    });

    // Log admin action
    await adminDb.collection('badge_admin_actions').add({
      type: 'revoke',
      badgeId,
      userId,
      adminId: admin.uid,
      reason,
      createdAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/badges');
    return { success: true };
  } catch (error) {
    log.error('Error revoking badge:', error);
    return { success: false, error: 'Failed to revoke badge' };
  }
}

/**
 * Get admin action history
 */
export async function getBadgeAdminHistory(): Promise<
  Array<{
    id: string;
    type: 'award' | 'revoke';
    badgeId: string;
    badgeName: string;
    userId: string;
    userName: string;
    adminId: string;
    adminName: string;
    reason: string;
    createdAt: Date;
  }>
> {
  try {
    await checkAdmin();

    const snapshot = await adminDb.collection('badge_admin_actions')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const history: Array<{
      id: string;
      type: 'award' | 'revoke';
      badgeId: string;
      badgeName: string;
      userId: string;
      userName: string;
      adminId: string;
      adminName: string;
      reason: string;
      createdAt: Date;
    }> = [];

    for (const actionDoc of snapshot.docs) {
      const action = actionDoc.data();

      // Get badge name
      const badgeDef = BADGES.find((b) => b.id === action.badgeId);

      // Get user name and admin name in parallel (independent lookups)
      const [oderDoc, adminDoc] = await Promise.all([
        adminDb.collection('users').doc(action.userId).get(),
        adminDb.collection('users').doc(action.adminId).get(),
      ]);
      const oderData = oderDoc.data();
      const userName = oderDoc.exists && oderData
        ? oderData.displayName || oderData.name || 'Unknown'
        : 'Unknown';
      const adminData = adminDoc.data();
      const adminName = adminDoc.exists && adminData
        ? adminData.displayName || adminData.name || 'Admin'
        : 'Admin';

      history.push({
        id: actionDoc.id,
        type: action.type,
        badgeId: action.badgeId,
        badgeName: badgeDef?.name || action.badgeId,
        userId: action.userId,
        userName: userName,
        adminId: action.adminId,
        adminName,
        reason: action.reason || '',
        createdAt: toDate(action.createdAt),
      });
    }

    return history;
  } catch (error) {
    log.error('Error fetching admin history:', error);
    return [];
  }
}

/**
 * Get users who have a specific badge
 */
export async function getUsersWithBadge(badgeId: string): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    awardedAt: Date;
  }>
> {
  try {
    await checkAdmin();

    const reputationsSnapshot = await adminDb.collection('user_reputations').get();

    const users: Array<{
      id: string;
      name: string;
      email: string;
      photoURL?: string;
      awardedAt: Date;
    }> = [];

    for (const repDoc of reputationsSnapshot.docs) {
      const reputation = repDoc.data() as UserReputation;

      if (reputation.badges?.includes(badgeId as BadgeId)) {
        const oderDoc = await adminDb.collection('users').doc(repDoc.id).get();
        const userData = oderDoc.data() || {};

        // Find award date
        const achievement = reputation.achievements?.find(
          (a) => a.badgeId === badgeId
        );

        users.push({
          id: repDoc.id,
          name: userData.displayName || userData.name || 'Unknown',
          email: userData.email || '',
          photoURL: userData.photoURL,
          awardedAt: toDate(achievement?.earnedAt),
        });
      }
    }

    // Sort by award date
    users.sort((a, b) => b.awardedAt.getTime() - a.awardedAt.getTime());

    return users;
  } catch (error) {
    log.error('Error fetching users with badge:', error);
    return [];
  }
}
