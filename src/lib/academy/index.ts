/**
 * Academy Utilities
 *
 * Utilities for the AlgoVigilance Academy LMS.
 * Migrated from infrastructure/course-components/
 */

export {
  QuizBuilder,
  createEvenQuiz,
  calculateEvenPoints,
  validateQuizStandards,
} from './quiz-builder';

export type {
  MultipleChoiceInput,
  TrueFalseInput,
  MultipleSelectInput,
} from './quiz-builder';

// Query caching for expensive analytics
export {
  getCachedOrCompute,
  invalidateCache,
  invalidateCacheByPattern,
  getCacheStats,
  cleanupExpiredCache,
  generateCacheKey,
  withCache,
  CACHE_TTL,
} from './query-cache';

// Daily activity and streak tracking
export {
  recordDailyActivity,
  updateUserStreak,
  getUserStreak,
  getDailyActivity,
  getActivityHistory,
  getUserStats,
  recalculateUserStats,
  getTodayDateString,
  getYesterdayDateString,
  type DailyActivity,
  type UserStats,
  type RecordActivityInput,
} from './daily-activity';

// Unified progress collection
export {
  generateProgressId,
  getOrCreateProgress,
  updateUnifiedProgress,
  recordLessonCompletion,
  recordActivityScore,
  updateFSRSProgress,
  getUserAllProgress,
  getUserProgressStats,
  markCourseCompleted,
  type UnifiedProgress,
  type LessonCompletion,
  type ActivityScore,
  type FSRSProgress,
  type ProgressUpdate,
} from './unified-progress';

// Progress milestones for learner celebrations
export {
  MILESTONES,
  checkMilestone,
  getMilestoneInfo,
  getNextMilestone,
  getProgressToNextMilestone,
  type Milestone,
  type MilestoneInfo,
} from './progress-milestones';
