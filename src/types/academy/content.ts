// ============================================================================
// CONTENT TYPES: Video, Quiz, Assessment, Resource
// ============================================================================

import { type Timestamp } from 'firebase/firestore';

import type { SerializedTimestamp } from './serialization';

// ============================================================================
// VIDEO TYPES
// ============================================================================

/** Supported video hosting providers */
export type VideoProvider = 'vimeo' | 'youtube' | 'bunny' | 'cloudflare';

/**
 * Video timestamp/chapter marker for navigation.
 * Allows learners to jump to specific sections of video content.
 */
export interface VideoTimestamp {
  /** Unique identifier for this timestamp */
  readonly id: string;
  /** Chapter/section title displayed to user */
  readonly title: string;
  /** Optional description of what this section covers */
  readonly description?: string;
  /** Seconds from video start where this chapter begins */
  readonly secondsFromStart: number;
}

// ============================================================================
// QUIZ TYPES - DISCRIMINATED UNION
// ============================================================================

/**
 * Base properties shared by all quiz question types.
 */
interface BaseQuizQuestion {
  /** Unique identifier for this question */
  readonly id: string;
  /** The question text displayed to the learner */
  readonly question: string;
  /** Explanation shown after answering (for learning purposes) */
  readonly explanation?: string;
  /** Points awarded for correct answer */
  readonly points: number;
}

/**
 * Multiple choice question with single correct answer.
 */
export interface MultipleChoiceQuestion extends BaseQuizQuestion {
  readonly type: 'multiple-choice';
  /** Available answer options */
  readonly options: readonly string[];
  /** Index of the correct answer in options array */
  readonly correctAnswer: number;
}

/**
 * True/false question.
 */
export interface TrueFalseQuestion extends BaseQuizQuestion {
  readonly type: 'true-false';
  /** 0 = false, 1 = true */
  readonly correctAnswer: 0 | 1;
}

/**
 * Multiple select question where multiple options can be correct.
 */
export interface MultipleSelectQuestion extends BaseQuizQuestion {
  readonly type: 'multiple-select';
  /** Available answer options */
  readonly options: readonly string[];
  /** Indices of all correct answers in options array */
  readonly correctAnswer: readonly number[];
}

/**
 * Discriminated union of all quiz question types.
 * Use type guards to narrow to specific question type.
 * @example
 * if (isMultipleChoice(question)) {
 *   log.info(question.options); // TypeScript knows options exists
 * }
 */
export type QuizQuestion = MultipleChoiceQuestion | TrueFalseQuestion | MultipleSelectQuestion;

// Type Guards for QuizQuestion
/**
 * Type guard to check if a question is multiple choice.
 */
export function isMultipleChoice(q: QuizQuestion): q is MultipleChoiceQuestion {
  return q.type === 'multiple-choice';
}

/**
 * Type guard to check if a question is true/false.
 */
export function isTrueFalse(q: QuizQuestion): q is TrueFalseQuestion {
  return q.type === 'true-false';
}

/**
 * Type guard to check if a question is multiple select.
 */
export function isMultipleSelect(q: QuizQuestion): q is MultipleSelectQuestion {
  return q.type === 'multiple-select';
}

// ============================================================================
// ASSESSMENT TYPES
// ============================================================================

/** Type of assessment attached to a lesson */
export type AssessmentType = 'quiz' | 'assignment' | 'project';

/**
 * Assessment configuration for a lesson.
 * Supports quizzes, assignments, and projects.
 */
export interface ActivityAssessment {
  /** Type of assessment */
  readonly type: AssessmentType;
  /** Minimum score to pass (0-100), default 70 */
  readonly passingScore?: number;
  /** Maximum attempts allowed, 0 = unlimited, default 0 */
  readonly maxAttempts?: number;
  /** Whether to shuffle question order each attempt */
  readonly randomizeQuestions?: boolean;
  /** Whether to shuffle answer options each attempt */
  readonly randomizeOptions?: boolean;
  /** Questions in this assessment */
  readonly questions: readonly QuizQuestion[];
}

/**
 * Record of a single quiz attempt by a learner.
 */
export interface QuizAttempt {
  /** Which attempt this was (1, 2, 3, etc.) */
  readonly attemptNumber: number;
  /** User's answers (index for MC, indices array for MS, 0/1 for T/F) */
  readonly answers: readonly (number | readonly number[])[];
  /** Score as percentage (0-100) */
  readonly score: number;
  /** Total points earned */
  readonly pointsEarned: number;
  /** Maximum possible points */
  readonly pointsPossible: number;
  /** Whether this attempt met the passing threshold */
  readonly passed: boolean;
  /** When this attempt was completed */
  readonly completedAt: Timestamp;
  /** Time spent on this attempt in seconds */
  readonly timeSpent?: number;
}

/**
 * Serialized QuizAttempt for server action returns.
 */
export interface QuizAttemptSerialized extends Omit<QuizAttempt, 'completedAt'> {
  readonly completedAt: SerializedTimestamp;
}

/**
 * Aggregate quiz score for a lesson across all attempts.
 */
export interface QuizScore {
  /** Lesson this score is for */
  readonly lessonId: string;
  /** Best score achieved (0-100) */
  readonly score: number;
  /** Total number of attempts */
  readonly attempts: number;
  /** When the best score was achieved */
  readonly completedAt: Timestamp;
  /** History of all attempts */
  readonly allAttempts: readonly QuizAttempt[];
  /** Reference to the best scoring attempt */
  readonly bestAttempt?: QuizAttempt;
}

/**
 * Serialized QuizScore for server action returns.
 */
export interface QuizScoreSerialized extends Omit<QuizScore, 'completedAt' | 'allAttempts' | 'bestAttempt'> {
  readonly completedAt: SerializedTimestamp;
  readonly allAttempts: readonly QuizAttemptSerialized[];
  readonly bestAttempt?: QuizAttemptSerialized;
}

// ============================================================================
// RESOURCE TYPES
// ============================================================================

/** Supported downloadable resource file types */
export type ResourceFileType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'zip' | 'other';

/**
 * Downloadable resource attached to a lesson.
 * Supports various document types for supplementary materials.
 */
export interface ActivityResource {
  /** Unique identifier */
  readonly id: string;
  /** Display title */
  readonly title: string;
  /** Optional description of the resource */
  readonly description?: string;
  /** File type for icon display */
  readonly fileType: ResourceFileType;
  /** Firebase Storage URL */
  readonly fileUrl: string;
  /** File size in bytes */
  readonly fileSize: number;
  /** When this resource was uploaded */
  readonly uploadedAt: Timestamp;
  /** Number of times this resource has been downloaded */
  readonly downloadCount?: number;
}
