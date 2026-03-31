/**
 * Daily Activity Tracking for Academy
 *
 * Provides efficient streak tracking and daily activity snapshots.
 * Replaces reading ALL review logs (O(365)) with simple document reads (O(2)).
 *
 * Collection structure:
 * - /user_activity/{userId}/days/{YYYY-MM-DD}
 *
 * @module lib/academy/daily-activity
 */

import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

const log = logger.scope('daily-activity');

const USER_ACTIVITY_COLLECTION = 'user_activity';
const USER_STATS_COLLECTION = 'user_stats';

/**
 * Daily activity snapshot for a user
 */
export interface DailyActivity {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** User ID */
  userId: string;
  /** Number of lessons completed today */
  lessonsCompleted: number;
  /** Number of activities completed today */
  activitiesCompleted: number;
  /** Number of quizzes completed today */
  quizzesCompleted: number;
  /** Number of FSRS reviews completed today */
  fsrsReviewsCompleted: number;
  /** Total points earned today */
  pointsEarned: number;
  /** Average score across activities today */
  averageScore: number;
  /** Total time spent learning (minutes) */
  totalTimeMinutes: number;
  /** Courses interacted with today */
  courseIds: string[];
  /** KSBs practiced today */
  ksbIds: string[];
  /** Domains practiced today */
  domainIds: string[];
}

/**
 * User statistics with streak data
 */
export interface UserStats {
  userId: string;
  /** Current active streak (days in a row) */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Last activity date (YYYY-MM-DD) */
  lastActivityDate: string;
  /** Total points earned all-time */
  totalPoints: number;
  /** Total lessons completed all-time */
  totalLessons: number;
  /** Total activities completed all-time */
  totalActivities: number;
  /** Total learning time (minutes) */
  totalTimeMinutes: number;
  /** When stats were last updated */
  updatedAt: Date;
}

/**
 * Activity recording input
 */
export interface RecordActivityInput {
  /** Type of activity */
  type: 'lesson' | 'activity' | 'quiz' | 'fsrs_review';
  /** Course ID */
  courseId: string;
  /** KSB ID (optional) */
  ksbId?: string;
  /** Domain ID (optional) */
  domainId?: string;
  /** Points earned (optional) */
  pointsEarned?: number;
  /** Score achieved (optional, 0-100) */
  score?: number;
  /** Time spent in minutes (optional) */
  timeMinutes?: number;
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Gets yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Records a daily activity for a user
 *
 * Call this after any learning activity completes.
 */
export async function recordDailyActivity(
  userId: string,
  activity: RecordActivityInput
): Promise<void> {
  const today = getTodayDateString();

  try {
    const activityRef = adminDb
      .collection(USER_ACTIVITY_COLLECTION)
      .doc(userId)
      .collection('days')
      .doc(today);

    const docSnap = await activityRef.get();

    if (!docSnap.exists) {
      // Create new daily activity document
      const newActivity: DailyActivity = {
        date: today,
        userId,
        lessonsCompleted: activity.type === 'lesson' ? 1 : 0,
        activitiesCompleted: activity.type === 'activity' ? 1 : 0,
        quizzesCompleted: activity.type === 'quiz' ? 1 : 0,
        fsrsReviewsCompleted: activity.type === 'fsrs_review' ? 1 : 0,
        pointsEarned: activity.pointsEarned || 0,
        averageScore: activity.score || 0,
        totalTimeMinutes: activity.timeMinutes || 0,
        courseIds: [activity.courseId],
        ksbIds: activity.ksbId ? [activity.ksbId] : [],
        domainIds: activity.domainId ? [activity.domainId] : [],
      };

      await activityRef.set(newActivity);
      log.debug(`Created daily activity for ${userId} on ${today}`);
    } else {
      // Update existing document
      const updates: Record<string, unknown> = {
        totalTimeMinutes: adminFieldValue.increment(activity.timeMinutes || 0),
        courseIds: adminFieldValue.arrayUnion(activity.courseId),
      };

      // Increment appropriate counter
      switch (activity.type) {
        case 'lesson':
          updates.lessonsCompleted = adminFieldValue.increment(1);
          break;
        case 'activity':
          updates.activitiesCompleted = adminFieldValue.increment(1);
          break;
        case 'quiz':
          updates.quizzesCompleted = adminFieldValue.increment(1);
          break;
        case 'fsrs_review':
          updates.fsrsReviewsCompleted = adminFieldValue.increment(1);
          break;
      }

      // Add optional arrays
      if (activity.ksbId) {
        updates.ksbIds = adminFieldValue.arrayUnion(activity.ksbId);
      }
      if (activity.domainId) {
        updates.domainIds = adminFieldValue.arrayUnion(activity.domainId);
      }

      // Update points
      if (activity.pointsEarned) {
        updates.pointsEarned = adminFieldValue.increment(activity.pointsEarned);
      }

      // Recalculate average score
      if (activity.score !== undefined && activity.type === 'activity') {
        const data = docSnap.data() as DailyActivity;
        const totalScored = data.activitiesCompleted + 1;
        if (totalScored > 0) {
          const currentTotal = data.averageScore * data.activitiesCompleted;
          updates.averageScore = (currentTotal + activity.score) / totalScored;
        }
      }

      await activityRef.update(updates);
      log.debug(`Updated daily activity for ${userId} on ${today}`);
    }

    // Update user streak (async, non-blocking)
    updateUserStreak(userId).catch((error) => {
      log.error('Failed to update user streak', { userId, error });
    });
  } catch (error) {
    log.error('Failed to record daily activity', { userId, error });
    throw error;
  }
}

/**
 * Updates user streak based on recent activity
 *
 * Called automatically after recording activity.
 */
export async function updateUserStreak(userId: string): Promise<UserStats> {
  const statsRef = adminDb.collection(USER_STATS_COLLECTION).doc(userId);
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  try {
    // Get today and yesterday's activity in parallel
    const [todayDoc, yesterdayDoc, statsDoc] = await Promise.all([
      adminDb
        .collection(USER_ACTIVITY_COLLECTION)
        .doc(userId)
        .collection('days')
        .doc(today)
        .get(),
      adminDb
        .collection(USER_ACTIVITY_COLLECTION)
        .doc(userId)
        .collection('days')
        .doc(yesterday)
        .get(),
      statsRef.get(),
    ]);

    const existingStats = statsDoc.exists ? (statsDoc.data() as UserStats) : null;
    let currentStreak = existingStats?.currentStreak || 0;
    const longestStreak = existingStats?.longestStreak || 0;
    const lastActivityDate = existingStats?.lastActivityDate || '';

    // Calculate new streak
    if (todayDoc.exists) {
      if (lastActivityDate === today) {
        // Already updated today, no change
      } else if (lastActivityDate === yesterday || yesterdayDoc.exists) {
        // Continued streak
        currentStreak += 1;
      } else if (lastActivityDate !== yesterday && !yesterdayDoc.exists) {
        // Streak broken, start new
        currentStreak = 1;
      }
    }

    const newLongest = Math.max(longestStreak, currentStreak);

    const updatedStats: Partial<UserStats> = {
      userId,
      currentStreak,
      longestStreak: newLongest,
      lastActivityDate: today,
      updatedAt: new Date(),
    };

    await statsRef.set(updatedStats, { merge: true });

    log.debug(`Updated streak for ${userId}`, { currentStreak, longestStreak: newLongest });

    return {
      ...existingStats,
      ...updatedStats,
    } as UserStats;
  } catch (error) {
    log.error('Failed to update user streak', { userId, error });
    throw error;
  }
}

/**
 * Gets a user's streak information
 */
export async function getUserStreak(
  userId: string
): Promise<{ currentStreak: number; longestStreak: number; isActiveToday: boolean }> {
  try {
    const [statsDoc, todayDoc] = await Promise.all([
      adminDb.collection(USER_STATS_COLLECTION).doc(userId).get(),
      adminDb
        .collection(USER_ACTIVITY_COLLECTION)
        .doc(userId)
        .collection('days')
        .doc(getTodayDateString())
        .get(),
    ]);

    const stats = statsDoc.exists ? (statsDoc.data() as UserStats) : null;
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    // Check if streak is still active
    let currentStreak = stats?.currentStreak || 0;
    if (stats?.lastActivityDate && stats.lastActivityDate !== today && stats.lastActivityDate !== yesterday) {
      // Streak broken (no activity today or yesterday)
      currentStreak = 0;
    }

    return {
      currentStreak,
      longestStreak: stats?.longestStreak || 0,
      isActiveToday: todayDoc.exists,
    };
  } catch (error) {
    log.error('Failed to get user streak', { userId, error });
    return { currentStreak: 0, longestStreak: 0, isActiveToday: false };
  }
}

/**
 * Gets daily activity for a specific date
 */
export async function getDailyActivity(
  userId: string,
  date: string
): Promise<DailyActivity | null> {
  try {
    const doc = await adminDb
      .collection(USER_ACTIVITY_COLLECTION)
      .doc(userId)
      .collection('days')
      .doc(date)
      .get();

    if (!doc.exists) return null;
    return doc.data() as DailyActivity;
  } catch (error) {
    log.error('Failed to get daily activity', { userId, date, error });
    return null;
  }
}

/**
 * Gets activity history for date range (for heatmaps, charts)
 */
export async function getActivityHistory(
  userId: string,
  options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}
): Promise<DailyActivity[]> {
  try {
    let query = adminDb
      .collection(USER_ACTIVITY_COLLECTION)
      .doc(userId)
      .collection('days')
      .orderBy('date', 'desc');

    if (options.startDate) {
      query = query.where('date', '>=', options.startDate);
    }
    if (options.endDate) {
      query = query.where('date', '<=', options.endDate);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    } else {
      query = query.limit(365); // Default to 1 year
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as DailyActivity);
  } catch (error) {
    log.error('Failed to get activity history', { userId, error });
    return [];
  }
}

/**
 * Gets user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const doc = await adminDb.collection(USER_STATS_COLLECTION).doc(userId).get();
    if (!doc.exists) return null;
    return doc.data() as UserStats;
  } catch (error) {
    log.error('Failed to get user stats', { userId, error });
    return null;
  }
}

/**
 * Recalculates user stats from activity history
 *
 * Use for data recovery or initial migration.
 */
export async function recalculateUserStats(userId: string): Promise<UserStats> {
  try {
    const history = await getActivityHistory(userId, { limit: 365 });

    // Calculate totals
    let totalPoints = 0;
    let totalLessons = 0;
    let totalActivities = 0;
    let totalTimeMinutes = 0;

    for (const day of history) {
      totalPoints += day.pointsEarned;
      totalLessons += day.lessonsCompleted;
      totalActivities += day.activitiesCompleted;
      totalTimeMinutes += day.totalTimeMinutes;
    }

    // Calculate streak from sorted dates
    const sortedDates = history
      .map((d) => d.date)
      .sort()
      .reverse();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      if (!prevDate) {
        // First date
        tempStreak = 1;

        // Check if it's today or yesterday (streak still active)
        const today = new Date();
        const daysDiff = Math.floor(
          (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 1) {
          currentStreak = 1;
        }
      } else {
        const daysDiff = Math.floor(
          (prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          // Consecutive day
          tempStreak++;
          if (currentStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          // Gap in streak
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      prevDate = date;
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    const stats: UserStats = {
      userId,
      currentStreak,
      longestStreak,
      lastActivityDate: sortedDates[0] || '',
      totalPoints,
      totalLessons,
      totalActivities,
      totalTimeMinutes,
      updatedAt: new Date(),
    };

    await adminDb.collection(USER_STATS_COLLECTION).doc(userId).set(stats);

    log.info(`Recalculated stats for ${userId}`, {
      currentStreak,
      longestStreak,
      totalActivities,
    });

    return stats;
  } catch (error) {
    log.error('Failed to recalculate user stats', { userId, error });
    throw error;
  }
}
