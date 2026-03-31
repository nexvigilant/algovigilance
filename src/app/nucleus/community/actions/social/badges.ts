'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserReputation, Badge } from '@/types/community';
import { BADGES } from '@/lib/community-constants';
import type { OnboardingJourney } from '@/types/onboarding-journey';

import { logger } from '@/lib/logger';
const log = logger.scope('social/badges');

/**
 * Check and award badges to a user based on their current stats
 * Returns array of newly awarded badge IDs
 *
 * Optimized with:
 * - Parallel badge requirement checks
 * - Single batch reputation update (instead of N writes)
 * - Promise.allSettled for resilient notification delivery
 */
export async function checkAndAwardBadges(userId: string): Promise<{ newBadges: string[] }> {
  try {
    // Get user reputation
    const reputationDoc = await adminDb.collection('user_reputations').doc(userId).get();

    if (!reputationDoc.exists) {
      return { newBadges: [] };
    }

    const reputation = reputationDoc.data() as UserReputation;
    const currentBadges = new Set(reputation.badges || []);

    // Get user stats for badge checking
    const stats = await getUserStats(userId);

    // Filter to badges not yet earned
    const unearnedBadges = BADGES.filter(badge => !currentBadges.has(badge.id));

    if (unearnedBadges.length === 0) {
      return { newBadges: [] };
    }

    // Check all badge requirements in parallel
    const badgeChecks = await Promise.all(
      unearnedBadges.map(async badge => ({
        badge,
        meetsRequirement: await checkBadgeRequirement(badge, stats, reputation),
      }))
    );

    // Filter to earned badges
    const earnedBadges = badgeChecks
      .filter(check => check.meetsRequirement)
      .map(check => check.badge);

    if (earnedBadges.length === 0) {
      return { newBadges: [] };
    }

    // Prepare batch update data
    const newBadgeIds = earnedBadges.map(b => b.id);
    const newAchievements = earnedBadges.map(badge => ({
      badgeId: badge.id,
      earnedAt: FieldValue.serverTimestamp(),
    }));

    // Single reputation update for all new badges
    await adminDb.collection('user_reputations').doc(userId).update({
      badges: [...Array.from(currentBadges), ...newBadgeIds],
      achievements: [...(reputation.achievements || []), ...newAchievements],
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Send all notifications in parallel with allSettled (resilient to failures)
    const notificationResults = await Promise.allSettled(
      earnedBadges.map(badge => createBadgeNotification(userId, badge))
    );

    // Log any notification failures (but don't fail the badge award)
    const failures = notificationResults.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      log.warn(`${failures.length} badge notification(s) failed to send`, { userId });
    }

    return { newBadges: newBadgeIds };
  } catch (error) {
    log.error('Error checking badges:', error);
    return { newBadges: [] };
  }
}

/**
 * Get user stats for badge checking
 * Uses Promise.all for parallel Firestore queries (~4x faster)
 */
async function getUserStats(userId: string) {
  // Execute all independent queries in parallel
  const [postsResult, repliesResult, acceptedResult, journeyDoc] = await Promise.all([
    // Get post count
    adminDb
      .collection('community_posts')
      .where('authorId', '==', userId)
      .where('isHidden', '==', false)
      .count()
      .get(),
    // Get reply count
    adminDb
      .collectionGroup('replies')
      .where('authorId', '==', userId)
      .where('isHidden', '==', false)
      .count()
      .get(),
    // Get accepted answer count
    adminDb
      .collectionGroup('replies')
      .where('authorId', '==', userId)
      .where('isAcceptedAnswer', '==', true)
      .count()
      .get(),
    // Check onboarding completion
    adminDb
      .collection('users')
      .doc(userId)
      .collection('onboarding')
      .doc('journey')
      .get(),
  ]);

  const onboardingComplete = journeyDoc.exists
    ? (journeyDoc.data() as OnboardingJourney)?.isComplete === true
    : false;

  return {
    posts: postsResult.data().count,
    replies: repliesResult.data().count,
    accepted_answers: acceptedResult.data().count,
    reactions: 0, // Placeholder - would need proper reaction counting
    onboarding: onboardingComplete ? 1 : 0,
  };
}

/**
 * Check if user meets a specific badge requirement
 */
async function checkBadgeRequirement(
  badge: Badge,
  stats: { posts: number; replies: number; accepted_answers: number; reactions: number; onboarding: number },
  reputation: UserReputation
): Promise<boolean> {
  const { requirement } = badge;

  switch (requirement.type) {
    case 'posts':
      return stats.posts >= requirement.count;

    case 'replies':
      return stats.replies >= requirement.count;

    case 'accepted_answers':
      return stats.accepted_answers >= requirement.count;

    case 'reactions': {
      // Estimate reactions from reaction points (2 points per reaction)
      const estimatedReactions = Math.floor(reputation.reactionPoints / 2);
      return estimatedReactions >= requirement.count;
    }

    case 'reputation':
      return reputation.totalPoints >= requirement.count;

    case 'streak':
      // Streak tracking would need separate implementation
      // For now, always return false
      return false;

    case 'onboarding':
      return stats.onboarding >= requirement.count;

    default:
      return false;
  }
}

/**
 * Create notification for badge award
 */
async function createBadgeNotification(userId: string, badge: Badge): Promise<void> {
  try {
    // Fetch user name for potential future personalization
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const _userName = userDoc.exists
      ? userDoc.data()?.name || userDoc.data()?.displayName || 'User'
      : 'User';

    await adminDb
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .add({
        type: 'badge',
        title: 'Badge Earned!',
        message: `${badge.icon} You've earned the "${badge.name}" badge!`,
        read: false,
        actionUrl: `/nucleus/community/members/${userId}`,
        metadata: {
          badgeId: badge.id,
          badgeName: badge.name,
          badgeIcon: badge.icon,
        },
        createdAt: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    log.error('Error creating badge notification:', error);
  }
}

/**
 * Get all available badges with user's progress
 */
export async function getBadgeProgress(userId: string): Promise<{
  badges: Array<Badge & { earned: boolean; progress: number; progressText: string }>;
}> {
  try {
    // Get user reputation
    const reputationDoc = await adminDb.collection('user_reputations').doc(userId).get();

    const reputation = reputationDoc.exists
      ? (reputationDoc.data() as UserReputation)
      : null;

    const earnedBadgeIds = new Set(reputation?.badges || []);

    // Get user stats
    const stats = await getUserStats(userId);

    // Map badges with progress
    const badgesWithProgress = BADGES.map((badge) => {
      const earned = earnedBadgeIds.has(badge.id);
      let current = 0;
      let progressText = '';

      // Calculate current progress
      switch (badge.requirement.type) {
        case 'posts':
          current = stats.posts;
          progressText = `${current}/${badge.requirement.count} posts`;
          break;
        case 'replies':
          current = stats.replies;
          progressText = `${current}/${badge.requirement.count} replies`;
          break;
        case 'accepted_answers':
          current = stats.accepted_answers;
          progressText = `${current}/${badge.requirement.count} accepted answers`;
          break;
        case 'reactions':
          current = Math.floor((reputation?.reactionPoints || 0) / 2);
          progressText = `${current}/${badge.requirement.count} reactions`;
          break;
        case 'reputation':
          current = reputation?.totalPoints || 0;
          progressText = `${current}/${badge.requirement.count} reputation`;
          break;
        case 'streak':
          current = 0; // Placeholder
          progressText = `${current}/${badge.requirement.count} day streak`;
          break;
        case 'onboarding':
          current = stats.onboarding;
          progressText = current >= badge.requirement.count
            ? 'Journey completed!'
            : 'Complete onboarding to unlock';
          break;
      }

      const progress = Math.min(100, (current / badge.requirement.count) * 100);

      return {
        ...badge,
        earned,
        progress,
        progressText,
      };
    });

    return { badges: badgesWithProgress };
  } catch (error) {
    log.error('Error getting badge progress:', error);
    return { badges: [] };
  }
}
