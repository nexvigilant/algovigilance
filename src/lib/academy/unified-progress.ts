/**
 * Unified Progress Collection for Academy
 *
 * Consolidates progress data from multiple collections into a single
 * document per user-course combination for efficient queries.
 *
 * Collection: /progress/{userId}_{courseId}
 *
 * @module lib/academy/unified-progress
 */

import { adminDb, adminTimestamp, adminFieldValue } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { ActivityEngineType } from '@/types/alo';
import { toDateFromSerialized } from '@/types/academy';

const log = logger.scope('unified-progress');

const PROGRESS_COLLECTION = 'progress';

/**
 * Lesson completion record
 */
export interface LessonCompletion {
  lessonId: string;
  completedAt: Date;
  timeSpent: number; // seconds
  score?: number;
}

/**
 * Activity score record
 */
export interface ActivityScore {
  activityId: string;
  lessonId: string;
  activityType: ActivityEngineType;
  score: number;
  maxScore: number;
  attempts: number;
  bestAttemptAt: Date;
  timeSpent: number; // seconds
}

/**
 * FSRS progress summary
 */
export interface FSRSProgress {
  totalCards: number;
  cardsLearning: number;
  cardsReview: number;
  cardsRelearning: number;
  cardsDueToday: number;
  averageRetention: number;
  averageStability: number;
  streakDays: number;
}

/**
 * Unified progress document
 */
export interface UnifiedProgress {
  id: string; // {userId}_{courseId}
  userId: string;
  courseId: string;
  /** All completed lessons */
  completedLessons: LessonCompletion[];
  /** Current module being worked on */
  currentModuleId: string;
  /** Current lesson being worked on */
  currentLessonId: string;
  /** Overall course progress (0-100) */
  overallProgress: number;
  /** Activity scores */
  activityScores: ActivityScore[];
  /** Average activity score (0-100) */
  averageActivityScore: number;
  /** FSRS progress for this course */
  fsrs: FSRSProgress;
  /** Points earned in this course */
  pointsEarned: number;
  /** Badges earned */
  badgesEarned: string[];
  /** Current proficiency level */
  currentLevel: number;
  /** Total time spent (seconds) */
  totalTimeSpent: number;
  /** When enrollment started */
  startedAt: Date;
  /** Last access timestamp */
  lastAccessedAt: Date;
  /** Current streak days */
  streakDays: number;
  /** Last activity date (YYYY-MM-DD) */
  lastActivityDate: string;
  /** Course completion status */
  status: 'not_started' | 'in_progress' | 'completed';
  /** Certificate ID if completed */
  certificateId?: string;
}

/**
 * Progress update input
 */
export interface ProgressUpdate {
  lessonId?: string;
  moduleId?: string;
  activityId?: string;
  activityType?: ActivityEngineType;
  score?: number;
  maxScore?: number;
  timeSpent?: number;
  pointsEarned?: number;
  badgeEarned?: string;
}

/**
 * Generates a progress document ID
 */
export function generateProgressId(userId: string, courseId: string): string {
  return `${userId}_${courseId}`;
}

/**
 * Gets or creates a unified progress document
 */
export async function getOrCreateProgress(
  userId: string,
  courseId: string
): Promise<UnifiedProgress> {
  const progressId = generateProgressId(userId, courseId);
  const progressRef = adminDb.collection(PROGRESS_COLLECTION).doc(progressId);

  const doc = await progressRef.get();

  if (doc.exists) {
    const data = doc.data();
    return {
      ...data,
      startedAt: toDateFromSerialized(data?.startedAt) || new Date(),
      lastAccessedAt: toDateFromSerialized(data?.lastAccessedAt) || new Date(),
    } as UnifiedProgress;
  }

  // Create new progress document
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const initialProgress: UnifiedProgress = {
    id: progressId,
    userId,
    courseId,
    completedLessons: [],
    currentModuleId: '',
    currentLessonId: '',
    overallProgress: 0,
    activityScores: [],
    averageActivityScore: 0,
    fsrs: {
      totalCards: 0,
      cardsLearning: 0,
      cardsReview: 0,
      cardsRelearning: 0,
      cardsDueToday: 0,
      averageRetention: 0,
      averageStability: 0,
      streakDays: 0,
    },
    pointsEarned: 0,
    badgesEarned: [],
    currentLevel: 1,
    totalTimeSpent: 0,
    startedAt: now,
    lastAccessedAt: now,
    streakDays: 0,
    lastActivityDate: today,
    status: 'not_started',
  };

  await progressRef.set(initialProgress);
  log.info(`Created unified progress for ${userId} in course ${courseId}`);

  return initialProgress;
}

/**
 * Updates unified progress with new activity
 */
export async function updateUnifiedProgress(
  userId: string,
  courseId: string,
  update: ProgressUpdate
): Promise<UnifiedProgress> {
  const progressId = generateProgressId(userId, courseId);
  const progressRef = adminDb.collection(PROGRESS_COLLECTION).doc(progressId);

  const now = adminTimestamp.now();
  const today = new Date().toISOString().split('T')[0];

  // Build update object
  const updates: Record<string, unknown> = {
    lastAccessedAt: now,
    lastActivityDate: today,
  };

  // Update current position
  if (update.lessonId) {
    updates.currentLessonId = update.lessonId;
  }
  if (update.moduleId) {
    updates.currentModuleId = update.moduleId;
  }

  // Add time spent
  if (update.timeSpent) {
    updates.totalTimeSpent = adminFieldValue.increment(update.timeSpent);
  }

  // Add points
  if (update.pointsEarned) {
    updates.pointsEarned = adminFieldValue.increment(update.pointsEarned);
  }

  // Add badge
  if (update.badgeEarned) {
    updates.badgesEarned = adminFieldValue.arrayUnion(update.badgeEarned);
  }

  // Update status if first activity
  const doc = await progressRef.get();
  if (doc.exists) {
    const data = doc.data();
    if (data?.status === 'not_started') {
      updates.status = 'in_progress';
    }
  }

  await progressRef.update(updates);

  // Return updated progress
  return getOrCreateProgress(userId, courseId);
}

/**
 * Records a lesson completion
 */
export async function recordLessonCompletion(
  userId: string,
  courseId: string,
  lessonId: string,
  options: {
    timeSpent?: number;
    score?: number;
    totalLessons?: number;
  } = {}
): Promise<void> {
  const progressId = generateProgressId(userId, courseId);
  const progressRef = adminDb.collection(PROGRESS_COLLECTION).doc(progressId);

  const now = new Date();

  const lessonCompletion: LessonCompletion = {
    lessonId,
    completedAt: now,
    timeSpent: options.timeSpent || 0,
    score: options.score,
  };

  // Get current progress to check if already completed
  const doc = await progressRef.get();
  const data = doc.data();
  const existingLessons = (data?.completedLessons || []) as LessonCompletion[];
  const alreadyCompleted = existingLessons.some((l) => l.lessonId === lessonId);

  if (alreadyCompleted) {
    // Just update time spent
    await progressRef.update({
      totalTimeSpent: adminFieldValue.increment(options.timeSpent || 0),
      lastAccessedAt: adminTimestamp.now(),
    });
    return;
  }

  // Calculate new progress percentage
  const totalLessons = options.totalLessons || 20; // Default estimate
  const completedCount = existingLessons.length + 1;
  const overallProgress = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  await progressRef.update({
    completedLessons: adminFieldValue.arrayUnion(lessonCompletion),
    overallProgress,
    totalTimeSpent: adminFieldValue.increment(options.timeSpent || 0),
    lastAccessedAt: adminTimestamp.now(),
    currentLessonId: lessonId,
    status: overallProgress >= 100 ? 'completed' : 'in_progress',
  });

  log.debug(`Recorded lesson completion for ${userId}`, {
    courseId,
    lessonId,
    overallProgress,
  });
}

/**
 * Records an activity score
 */
export async function recordActivityScore(
  userId: string,
  courseId: string,
  activityScore: Omit<ActivityScore, 'bestAttemptAt' | 'attempts'>
): Promise<void> {
  const progressId = generateProgressId(userId, courseId);
  const progressRef = adminDb.collection(PROGRESS_COLLECTION).doc(progressId);

  const doc = await progressRef.get();
  const data = doc.data();
  const existingScores = (data?.activityScores || []) as ActivityScore[];

  // Check for existing score for this activity
  const existingIndex = existingScores.findIndex(
    (s) => s.activityId === activityScore.activityId
  );

  const newScore: ActivityScore = {
    ...activityScore,
    attempts: 1,
    bestAttemptAt: new Date(),
  };

  let updatedScores: ActivityScore[];

  if (existingIndex >= 0) {
    // Update existing score if better
    const existing = existingScores[existingIndex];
    if (activityScore.score > existing.score) {
      newScore.attempts = existing.attempts + 1;
      updatedScores = [...existingScores];
      updatedScores[existingIndex] = newScore;
    } else {
      // Just increment attempts
      updatedScores = [...existingScores];
      updatedScores[existingIndex] = {
        ...existing,
        attempts: existing.attempts + 1,
        timeSpent: existing.timeSpent + activityScore.timeSpent,
      };
    }
  } else {
    // Add new score
    updatedScores = [...existingScores, newScore];
  }

  // Calculate average score
  const totalScore = updatedScores.reduce((sum, s) => sum + s.score, 0);
  const averageActivityScore =
    updatedScores.length > 0 ? Math.round(totalScore / updatedScores.length) : 0;

  await progressRef.update({
    activityScores: updatedScores,
    averageActivityScore,
    totalTimeSpent: adminFieldValue.increment(activityScore.timeSpent),
    lastAccessedAt: adminTimestamp.now(),
  });

  log.debug(`Recorded activity score for ${userId}`, {
    activityId: activityScore.activityId,
    score: activityScore.score,
    averageActivityScore,
  });
}

/**
 * Updates FSRS progress summary
 */
export async function updateFSRSProgress(
  userId: string,
  courseId: string,
  fsrsProgress: Partial<FSRSProgress>
): Promise<void> {
  const progressId = generateProgressId(userId, courseId);
  const progressRef = adminDb.collection(PROGRESS_COLLECTION).doc(progressId);

  const doc = await progressRef.get();
  const data = doc.data();
  const existingFsrs = (data?.fsrs || {}) as FSRSProgress;

  const updatedFsrs: FSRSProgress = {
    ...existingFsrs,
    ...fsrsProgress,
  };

  await progressRef.update({
    fsrs: updatedFsrs,
    lastAccessedAt: adminTimestamp.now(),
  });

  log.debug(`Updated FSRS progress for ${userId}`, {
    courseId,
    totalCards: updatedFsrs.totalCards,
    averageRetention: updatedFsrs.averageRetention,
  });
}

/**
 * Gets progress for a user across all courses
 */
export async function getUserAllProgress(userId: string): Promise<UnifiedProgress[]> {
  const snapshot = await adminDb
    .collection(PROGRESS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('lastAccessedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      startedAt: toDateFromSerialized(data.startedAt) || new Date(),
      lastAccessedAt: toDateFromSerialized(data.lastAccessedAt) || new Date(),
    } as UnifiedProgress;
  });
}

/**
 * Gets aggregate stats for a user
 */
export async function getUserProgressStats(
  userId: string
): Promise<{
  totalCourses: number;
  coursesInProgress: number;
  coursesCompleted: number;
  totalTimeSpent: number;
  totalPoints: number;
  averageScore: number;
  totalLessonsCompleted: number;
}> {
  const allProgress = await getUserAllProgress(userId);

  const stats = {
    totalCourses: allProgress.length,
    coursesInProgress: allProgress.filter((p) => p.status === 'in_progress').length,
    coursesCompleted: allProgress.filter((p) => p.status === 'completed').length,
    totalTimeSpent: allProgress.reduce((sum, p) => sum + p.totalTimeSpent, 0),
    totalPoints: allProgress.reduce((sum, p) => sum + p.pointsEarned, 0),
    averageScore:
      allProgress.length > 0
        ? Math.round(
            allProgress.reduce((sum, p) => sum + p.averageActivityScore, 0) /
              allProgress.length
          )
        : 0,
    totalLessonsCompleted: allProgress.reduce(
      (sum, p) => sum + p.completedLessons.length,
      0
    ),
  };

  return stats;
}

/**
 * Marks a course as completed and issues certificate
 */
export async function markCourseCompleted(
  userId: string,
  courseId: string,
  certificateId: string
): Promise<void> {
  const progressId = generateProgressId(userId, courseId);
  const progressRef = adminDb.collection(PROGRESS_COLLECTION).doc(progressId);

  await progressRef.update({
    status: 'completed',
    certificateId,
    overallProgress: 100,
    lastAccessedAt: adminTimestamp.now(),
  });

  log.info(`Course completed for ${userId}`, { courseId, certificateId });
}
