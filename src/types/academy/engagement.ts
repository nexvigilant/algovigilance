// ============================================================================
// ENGAGEMENT TYPES: Bookmarks, Notes, Analytics, Admin Dashboard
// ============================================================================

import { type Timestamp } from 'firebase/firestore';

import type { SkillLevel } from './ids';
import type { SerializedTimestamp } from './serialization';

// ============================================================================
// BOOKMARK & NOTES TYPES
// ============================================================================

/**
 * Bookmark for a lesson.
 */
export interface ActivityBookmark {
  /** Unique identifier */
  readonly id: string;
  /** User who created the bookmark */
  readonly userId: string;
  /** Course containing the lesson */
  readonly courseId: string;
  /** Bookmarked lesson */
  readonly lessonId: string;

  // Context
  /** Lesson title for display */
  readonly lessonTitle: string;
  /** Course title for display */
  readonly courseTitle: string;

  /** Optional note about the bookmark */
  readonly note?: string;

  /** When bookmark was created */
  readonly createdAt: Timestamp;
}

/**
 * Note attached to a lesson.
 */
export interface ActivityNote {
  /** Unique identifier */
  readonly id: string;
  /** User who created the note */
  readonly userId: string;
  /** Course containing the lesson */
  readonly courseId: string;
  /** Lesson this note is about */
  readonly lessonId: string;

  // Context
  /** Lesson title for display */
  readonly lessonTitle: string;
  /** Course title for display */
  readonly courseTitle: string;

  // Note content
  /** Rich text content */
  readonly content: string;
  /** Timestamp in video where note was taken (seconds) */
  readonly videoTimestamp?: number;

  /** When note was created */
  readonly createdAt: Timestamp;
  /** When note was last updated */
  readonly updatedAt: Timestamp;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/** Difficulty classification for quiz questions */
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Analytics for a single course.
 */
export interface PathwayAnalytics {
  /** Course ID */
  readonly courseId: string;
  /** Start of analysis period (Timestamp or SerializedTimestamp for server-to-client boundary) */
  readonly periodStart: Timestamp | SerializedTimestamp;
  /** End of analysis period (Timestamp or SerializedTimestamp for server-to-client boundary) */
  readonly periodEnd: Timestamp | SerializedTimestamp;

  // Enrollment metrics
  /** Total enrollments all-time */
  readonly totalEnrollments: number;
  /** Users who accessed in period */
  readonly activeStudents: number;
  /** New enrollments in period */
  readonly newEnrollments: number;
  /** Completions in period */
  readonly completions: number;
  /** Dropouts in period */
  readonly dropouts: number;

  // Completion metrics
  /** Completion rate (0-100) */
  readonly completionRate: number;
  /** Average days to complete */
  readonly averageCompletionTime: number;
  /** Average progress percentage (0-100) */
  readonly averageProgress: number;

  // Engagement metrics
  /** Total time spent by all students in minutes */
  readonly totalTimeSpent: number;
  /** Average time per practitioner in minutes */
  readonly averageTimePerStudent: number;
  /** Average activities completed per practitioner */
  readonly averageLessonsCompleted: number;

  // Quiz performance
  /** Average quiz score (0-100) */
  readonly averageQuizScore: number;
  /** Quiz pass rate (0-100) */
  readonly quizPassRate: number;
  /** Quiz retake rate (0-100) */
  readonly quizRetakeRate: number;

  // Video engagement
  /** Percentage of videos watched to end (0-100) */
  readonly videoCompletionRate: number;
  /** Average percentage of video watched (0-100) */
  readonly averageVideoWatchPercentage: number;

  // Certificate metrics
  /** Number of certificates issued */
  readonly certificatesIssued: number;

  // Popular lessons
  /** Most viewed lessons */
  readonly mostViewedLessons: readonly { readonly lessonId: string; readonly views: number }[];
  /** Highest rated lessons */
  readonly highestRatedLessons: readonly { readonly lessonId: string; readonly rating: number }[];

  /** When analytics were calculated (Timestamp or SerializedTimestamp for server-to-client boundary) */
  readonly calculatedAt: Timestamp | SerializedTimestamp;
}

/**
 * Analytics for a single practitioner.
 */
export interface PractitionerAnalytics {
  /** User ID */
  readonly userId: string;
  /** Start of analysis period */
  readonly periodStart: Timestamp;
  /** End of analysis period */
  readonly periodEnd: Timestamp;

  // Course activity
  /** Total courses enrolled */
  readonly coursesEnrolled: number;
  /** Courses completed */
  readonly coursesCompleted: number;
  /** Courses in progress */
  readonly coursesInProgress: number;

  // Learning metrics
  /** Total learning time in minutes */
  readonly totalLearningTime: number;
  /** Total lessons completed */
  readonly lessonsCompleted: number;
  /** Average quiz score (0-100) */
  readonly averageQuizScore: number;
  /** Total certificates earned */
  readonly certificatesEarned: number;

  // Engagement
  /** Days with activity in period */
  readonly daysActive: number;
  /** Current consecutive day streak */
  readonly currentStreak: number;
  /** Longest streak ever */
  readonly longestStreak: number;

  // Skills
  /** Number of skills acquired */
  readonly skillsAcquired: number;
  /** Overall skill level */
  readonly skillLevel: SkillLevel;

  /** When analytics were calculated */
  readonly calculatedAt: Timestamp;
}

/**
 * Serialized PractitionerAnalytics for server action returns.
 */
export interface SerializedPractitionerAnalytics {
  readonly userId: string;
  readonly periodStart: SerializedTimestamp;
  readonly periodEnd: SerializedTimestamp;
  readonly coursesEnrolled: number;
  readonly coursesCompleted: number;
  readonly coursesInProgress: number;
  readonly totalLearningTime: number;
  readonly lessonsCompleted: number;
  readonly averageQuizScore: number;
  readonly certificatesEarned: number;
  readonly daysActive: number;
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly skillsAcquired: number;
  readonly skillLevel: SkillLevel;
  readonly calculatedAt: SerializedTimestamp;
}

/**
 * Analytics for a single quiz question.
 */
export interface QuizQuestionAnalytics {
  /** Question ID */
  readonly questionId: string;
  /** Lesson containing the question */
  readonly lessonId: string;
  /** Course containing the lesson */
  readonly courseId: string;

  // Performance
  /** Total attempts */
  readonly totalAttempts: number;
  /** Correct attempts */
  readonly correctAttempts: number;
  /** Incorrect attempts */
  readonly incorrectAttempts: number;
  /** Accuracy rate (0-100) */
  readonly accuracyRate: number;

  // Difficulty assessment
  /** Auto-calculated from accuracy */
  readonly difficulty: QuestionDifficulty;
  /** Average time to answer in seconds */
  readonly averageTimeToAnswer: number;

  // Wrong answer analysis
  /** Most common wrong answers */
  readonly commonWrongAnswers: readonly { readonly answerIndex: number; readonly count: number }[];

  /** When analytics were calculated */
  readonly calculatedAt: Timestamp;
}

// ============================================================================
// ADMIN DASHBOARD TYPES
// ============================================================================

/**
 * Dashboard statistics for admin overview.
 */
export interface DashboardStats {
  // Global metrics
  /** Total courses all-time */
  readonly totalCourses: number;
  /** Published courses */
  readonly publishedCourses: number;
  /** Draft courses */
  readonly draftCourses: number;
  /** Archived courses */
  readonly archivedCourses: number;

  /** Total registered students */
  readonly totalStudents: number;
  /** Students active in last 30 days */
  readonly activeStudents: number;
  /** Total enrollments all-time */
  readonly totalEnrollments: number;

  /** Total certificates issued */
  readonly certificatesIssued: number;
  /** Average completion rate across all courses (0-100) */
  readonly averageCompletionRate: number;

  // Recent activity
  /** Enrollments in last 7 days */
  readonly enrollmentsLast7Days: number;
  /** Completions in last 7 days */
  readonly completionsLast7Days: number;

  // Top performers
  /** Courses with most enrollments */
  readonly topCourses: readonly { readonly courseId: string; readonly enrollments: number }[];
  /** Students with most completions */
  readonly topStudents: readonly { readonly userId: string; readonly coursesCompleted: number }[];

  /** When stats were calculated (Timestamp or SerializedTimestamp for server-to-client boundary) */
  readonly calculatedAt: Timestamp | SerializedTimestamp;
}
