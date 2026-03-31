// ============================================================================
// LMS PROGRESS: Unified Progress, Daily Activity, User Stats, Events
// ============================================================================

import { type Timestamp } from 'firebase/firestore';

import type { ActivityEngineType } from './activity-engines';

// ============================================================================
// UNIFIED PROGRESS TRACKING (integrates with FSRS)
// ============================================================================

/**
 * Unified progress document for a user's learning journey.
 * Aggregates lesson completion, FSRS data, gamification, and streaks.
 *
 * Firestore: /progress/{odUserId}_{courseId}
 */
export interface UnifiedProgress {
  id: string;                     // userId_courseId composite
  userId: string;
  courseId: string;

  // --- Lesson Completion ---
  completedLessons: LessonCompletion[];
  currentModuleId: string;
  currentLessonId: string;
  overallProgress: number;        // 0-100

  // --- Activity Scores ---
  activityScores: ActivityScore[];
  averageActivityScore: number;   // 0-100

  // --- FSRS Integration ---
  fsrs: FSRSProgressSummary;

  // --- Gamification ---
  pointsEarned: number;
  badgesEarned: string[];         // Badge IDs
  currentLevel: number;

  // --- Timing ---
  totalTimeSpent: number;         // Minutes
  startedAt: Timestamp;
  lastAccessedAt: Timestamp;
  completedAt?: Timestamp;

  // --- Streak (course-specific) ---
  streakDays: number;
  lastActivityDate: string;       // YYYY-MM-DD
}

export interface LessonCompletion {
  lessonId: string;
  moduleId: string;
  completedAt: Timestamp;
  timeSpent: number;              // Minutes
  attempts: number;
  bestScore?: number;             // For quizzes/activities
}

export interface ActivityScore {
  activityId: string;
  lessonId: string;
  activityType: ActivityEngineType;
  score: number;                  // 0-100
  maxScore: number;
  attempts: number;
  bestAttemptAt: Timestamp;
  timeSpent: number;              // Seconds
}

export interface FSRSProgressSummary {
  totalCards: number;
  cardsLearning: number;
  cardsReview: number;
  cardsRelearning: number;
  cardsDueToday: number;
  averageRetention: number;       // 0-1
  averageStability: number;       // Days
  streakDays: number;
  lastReviewAt?: Timestamp;
}

// ============================================================================
// DAILY ACTIVITY & USER STATS
// ============================================================================

/**
 * Daily activity snapshot for streak tracking.
 * Firestore: /user_activity/{odUserId}/days/{YYYY-MM-DD}
 */
export interface DailyActivity {
  date: string;                   // YYYY-MM-DD
  userId: string;

  // Activity counts
  lessonsCompleted: number;
  activitiesCompleted: number;
  quizzesCompleted: number;
  fsrsReviewsCompleted: number;

  // Scores
  pointsEarned: number;
  averageScore: number;

  // Time
  totalTimeMinutes: number;

  // Details
  courseIds: string[];            // Courses touched
  ksbIds: string[];               // KSBs reviewed (FSRS)
}

/**
 * Aggregated user stats across all courses.
 * Firestore: /user_stats/{odUserId}
 */
export interface UserStats {
  userId: string;

  // Aggregate counts
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  activitiesCompleted: number;
  quizzesCompleted: number;

  // Gamification
  totalPoints: number;
  currentLevel: number;
  badgesEarned: string[];

  // FSRS aggregate
  totalFSRSCards: number;
  averageRetention: number;
  totalReviews: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;

  // Time
  totalLearningTimeMinutes: number;
  averageDailyTimeMinutes: number;

  // Timestamps
  firstActivityAt: Timestamp;
  lastActivityAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// LEARNING EVENTS
// ============================================================================

/**
 * Event types for activity logging and analytics.
 */
export type LearningEventType =
  | 'lesson_started'
  | 'lesson_completed'
  | 'activity_started'
  | 'activity_completed'
  | 'quiz_started'
  | 'quiz_completed'
  | 'fsrs_review'
  | 'badge_earned'
  | 'level_up'
  | 'course_started'
  | 'course_completed';

/**
 * Learning event for real-time tracking and analytics.
 * Can be stored in Firestore or sent to analytics pipeline.
 */
export interface LearningEvent {
  id: string;
  userId: string;
  eventType: LearningEventType;
  timestamp: Timestamp;

  // Context
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  activityId?: string;
  ksbId?: string;

  // Outcome
  score?: number;
  pointsEarned?: number;
  badgeId?: string;
  newLevel?: number;
  fsrsRating?: number;            // 1-4

  // Metadata
  timeSpentSeconds?: number;
  attempts?: number;
  deviceType?: string;
  sessionId?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  limit: number;
  offset?: number;
  cursor?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Standard API response wrapper
 */
export interface LMSResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
