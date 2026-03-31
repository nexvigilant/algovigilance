import { type Timestamp } from 'firebase/firestore';

import { logger } from '@/lib/logger';
const _log = logger.scope('academy');

// ============================================================================
// BRANDED ID TYPES
// ============================================================================
// Branded types prevent accidentally mixing up IDs at compile time.
// Example: passing a PathwayId where a UserId is expected will fail type checking.

/** Branded string type for User IDs */
export type UserId = string & { readonly __brand: 'UserId' };

/** Branded string type for Course IDs */
export type PathwayId = string & { readonly __brand: 'PathwayId' };

/** Branded string type for Lesson IDs */
export type ActivityId = string & { readonly __brand: 'ActivityId' };

/** Branded string type for Module IDs */
export type StageId = string & { readonly __brand: 'StageId' };

/** Branded string type for Enrollment IDs */
export type PathwayEnrollmentId = string & { readonly __brand: 'PathwayEnrollmentId' };

/** Branded string type for Certificate IDs */
export type VerificationId = string & { readonly __brand: 'VerificationId' };

/** Branded string type for Skill IDs */
export type SkillId = string & { readonly __brand: 'SkillId' };

/**
 * Helper to create a branded ID from a string.
 * Use when reading IDs from external sources (Firestore, API, etc.)
 * @example const userId = brandId<UserId>('abc123');
 */
export function brandId<T extends string>(id: string): T {
  return id as T;
}

// ============================================================================
// SERIALIZATION TYPES
// ============================================================================
// Server actions cannot return Firestore Timestamp objects directly.
// These types represent the serialized form for client-server communication.

/**
 * Serialized representation of a Firestore Timestamp.
 * Used when returning data from server actions to clients.
 */
export interface SerializedTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

/**
 * Convert a Firestore Timestamp to serializable format.
 * @param ts - Firestore Timestamp, null, or undefined
 * @returns SerializedTimestamp or undefined if input is null/undefined
 */
export function serializeTimestamp(ts: Timestamp | null | undefined): SerializedTimestamp | undefined {
  if (!ts) return undefined;
  return { seconds: ts.seconds, nanoseconds: ts.nanoseconds };
}

/**
 * Convert a SerializedTimestamp to milliseconds since epoch.
 * Safe to call on both SerializedTimestamp objects and Firestore Timestamps.
 * @param ts - SerializedTimestamp, Firestore Timestamp, null, or undefined
 * @returns Milliseconds since epoch, or 0 if timestamp is null/undefined
 */
export function toMillisFromSerialized(ts: SerializedTimestamp | Timestamp | Record<string, unknown> | null | undefined): number {
  if (!ts) return 0;
  const obj = ts as Record<string, unknown>;
  // Handle Firestore Timestamp
  if ('toMillis' in obj && typeof obj.toMillis === 'function') {
    return (obj.toMillis as () => number)();
  }
  // SerializedTimestamp: { seconds, nanoseconds }
  const seconds = typeof obj.seconds === 'number' ? obj.seconds : 0;
  const nanoseconds = typeof obj.nanoseconds === 'number' ? obj.nanoseconds : 0;
  return seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
}

/**
 * Convert a SerializedTimestamp to a JavaScript Date object.
 * Safe to call on both SerializedTimestamp objects and Firestore Timestamps.
 * @param ts - SerializedTimestamp, Firestore Timestamp, null, or undefined
 * @returns Date object, or current date if timestamp is null/undefined
 */
export function toDateFromSerialized(ts: SerializedTimestamp | Timestamp | Record<string, unknown> | null | undefined): Date {
  if (!ts) return new Date();
  const obj = ts as Record<string, unknown>;
  // Handle Firestore Timestamp
  if ('toDate' in obj && typeof obj.toDate === 'function') {
    return (obj.toDate as () => Date)();
  }
  // SerializedTimestamp: use milliseconds conversion
  return new Date(toMillisFromSerialized(ts));
}

/**
 * Format a SerializedTimestamp as a localized date string.
 * Safe to call on both SerializedTimestamp objects and Firestore Timestamps.
 * @param ts - SerializedTimestamp, Firestore Timestamp, null, or undefined
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Localized date string
 */
export function formatTimestamp(
  ts: SerializedTimestamp | Timestamp | Record<string, unknown> | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDateFromSerialized(ts);
  return date.toLocaleDateString(undefined, options);
}

// ============================================================================
// PROFICIENCY LEVELS
// ============================================================================

/**
 * Proficiency levels for skill assessment.
 * Used across courses, enrollments, and capability statements.
 */
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Capability-focused proficiency levels.
 * More nuanced than traditional difficulty levels.
 */
export type CapabilityProficiency = 'foundational' | 'proficient' | 'advanced' | 'master';

/**
 * Skill level for analytics and user profiles.
 */
export type SkillLevel = 'novice' | 'intermediate' | 'advanced' | 'expert';

// ============================================================================
// NOTE: Primitives-first names are now primary (see interfaces below).
// Deprecated backward-compatibility aliases are at the end of this file.
// ============================================================================

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

// ============================================================================
// CORE TYPES: PRACTICE ACTIVITY (was Lesson)
// ============================================================================

/**
 * Individual practice activity within a capability stage.
 * Represents atomic learning content with optional video, assessment, and resources.
 *
 * @remarks
 * Practice activities are the fundamental unit of learning content. They can contain:
 * - Rich text/markdown content
 * - Video content from various providers
 * - Interactive assessments (quizzes, assignments, projects)
 * - Downloadable resources
 */
export interface PracticeActivity {
  /** Unique identifier */
  readonly id: string;
  /** Lesson title displayed in navigation */
  readonly title: string;
  /** Brief description for preview */
  readonly description: string;
  /** Main content body (rich text/markdown) */
  readonly content: string;

  // Metadata
  /** Estimated time to complete in minutes */
  readonly estimatedDuration?: number;

  // Video content (optional)
  /** Video embed URL or video ID */
  readonly videoUrl?: string;
  /** Video duration in seconds */
  readonly videoDuration?: number;
  /** Video hosting provider, defaults to 'vimeo' */
  readonly videoProvider?: VideoProvider;
  /** Chapter markers for video navigation */
  readonly videoTimestamps?: readonly VideoTimestamp[];

  // Assessment (optional)
  /** Quiz, assignment, or project for this lesson */
  readonly assessment?: ActivityAssessment;

  // Downloadable resources (optional)
  /** Supplementary materials for download */
  readonly resources?: readonly ActivityResource[];
}

/**
 * Activity with explicit resources array (for type composition).
 */
export interface ActivityWithResources extends PracticeActivity {
  readonly resources: readonly ActivityResource[];
}

/**
 * Activity with practice metadata.
 * Distinguishes passive consumption from active practice.
 */
export interface ActivityWithPractice extends PracticeActivity {
  /** Type of practice activity */
  readonly activityType?: 'guided' | 'practice' | 'application' | 'assessment';
  /** Instruction for what to create/do */
  readonly practicePrompt?: string;
  /** Description of expected deliverable */
  readonly expectedOutcome?: string;
  /** Realistic time estimate for this activity in hours */
  readonly estimatedPracticeHours?: number;
}

// ============================================================================
// CORE TYPES: CAPABILITY STAGE (was Module)
// ============================================================================

/**
 * Capability stage grouping related practice activities together.
 * Represents a thematic unit within a capability pathway.
 */
export interface CapabilityStage {
  /** Unique identifier */
  readonly id: string;
  /** Stage title */
  readonly title: string;
  /** Brief description of stage content */
  readonly description: string;
  /** Ordered list of practice activities in this stage */
  readonly lessons: readonly PracticeActivity[];
}

// ============================================================================
// CORE TYPES: CAPABILITY PATHWAY (was Course)
// ============================================================================

/** Publishing status for capability pathways */
export type PathwayStatus = 'draft' | 'published' | 'archived' | 'generating' | 'completed';

/** Visibility setting for capability pathways */
export type PathwayVisibility = 'internal' | 'public';

/** Difficulty level for capability pathways */
export type PathwayDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Instructor information for a capability pathway.
 */
export interface PathwayInstructor {
  /** Display name */
  readonly name?: string;
  /** Short bio or credentials */
  readonly bio?: string;
  /** Avatar image URL */
  readonly avatar?: string;
}

/**
 * Pathway metadata for display and filtering.
 */
export interface PathwayMetadata {
  /** Estimated total duration in minutes */
  readonly estimatedDuration: number;
  /** Total number of content components */
  readonly componentCount: number;
  /** Course thumbnail image URL */
  readonly thumbnailUrl?: string;
}

/**
 * Capability Pathway - the primary learning container.
 *
 * @remarks
 * Capability pathways are structured learning experiences that develop specific capabilities.
 * They contain stages, which contain practice activities. Progress is tracked via PathwayEnrollments.
 *
 * The three publishing fields (status, isPublished, academyStatus) exist for
 * backward compatibility. Use `status` as the primary field for new code.
 */
export interface CapabilityPathway {
  /** Unique identifier */
  readonly id: string;
  /** Pathway title */
  readonly title: string;
  /** Full description */
  readonly description: string;
  /** Topic/category for filtering */
  readonly topic: string;

  // Content structure
  /** Ordered capability stages containing practice activities */
  readonly modules: readonly CapabilityStage[];

  // Publishing state
  /** Primary publishing status */
  readonly status: PathwayStatus;
  /**
   * @deprecated Use `status` instead. Kept for backward compatibility with older security rules.
   */
  readonly isPublished?: boolean;
  /**
   * @deprecated Use `status` instead. Kept for Course Builder compatibility.
   */
  readonly academyStatus?: 'draft' | 'published' | 'archived';
  /** Visibility setting */
  readonly visibility: PathwayVisibility;
  /** When the course was published */
  readonly publishedAt?: Timestamp;

  // Metadata
  /** Quality score (0-100) */
  readonly qualityScore: number;
  /** PV domain this course belongs to */
  readonly domain?: string;
  /** Description of intended audience */
  readonly targetAudience?: string;
  /** Difficulty level */
  readonly difficulty?: PathwayDifficulty;
  /** Additional metadata */
  readonly metadata: PathwayMetadata;

  // Instructor Info
  /** Course instructor details */
  readonly instructor?: PathwayInstructor;

  // Tracking
  /** User ID of course creator */
  readonly userId: string;
  /** When course was created */
  readonly createdAt: Timestamp;
  /** When course was last updated */
  readonly updatedAt: Timestamp;
  /** Version number for change tracking */
  readonly version: number;
}

/**
 * Pathway with capability framing extensions.
 * Adds behavioral objectives and practice activity metadata.
 */
export interface PathwayWithCapabilities extends CapabilityPathway {
  /** Specific capability this pathway develops */
  readonly capabilityOutcome?: string;
  /** What practitioners will DO (not just know) */
  readonly behavioralObjectives?: readonly string[];
  /** Count of hands-on practice activities */
  readonly practiceActivities?: number;
  /** Realistic time estimate for mastery in hours */
  readonly expectedPracticeHours?: number;
}

// ============================================================================
// CORE TYPES: PATHWAY ENROLLMENT (was Enrollment)
// ============================================================================

/** Enrollment status for tracking progress */
export type EnrollmentStatus = 'in-progress' | 'completed' | 'dropped';

/**
 * Pathway enrollment tracking a user's progress through a capability pathway.
 *
 * @remarks
 * Pathway enrollments track the practitioner's journey through a pathway, including:
 * - Current position (stage/activity)
 * - Completed activities
 * - Quiz scores
 * - Time spent
 */
export interface PathwayEnrollment {
  /** Unique identifier */
  readonly id: string;
  /** User enrolled in the course */
  readonly userId: string;
  /** Course being taken */
  readonly courseId: string;

  // Progress
  /** Current enrollment status */
  readonly status: EnrollmentStatus;
  /** Overall progress percentage (0-100) */
  readonly progress: number;
  /** Index of current module */
  readonly currentModuleIndex: number;
  /** Index of current lesson within module */
  readonly currentLessonIndex: number;
  /** IDs of completed lessons */
  readonly completedLessons: readonly string[];

  // Timing
  /** When user enrolled */
  readonly enrolledAt: Timestamp;
  /** When user started (first lesson viewed) */
  readonly startedAt?: Timestamp;
  /** When course was completed */
  readonly completedAt?: Timestamp;
  /** When course was last accessed */
  readonly lastAccessedAt: Timestamp;

  // Performance
  /** Quiz scores for each assessed lesson */
  readonly quizScores: readonly QuizScore[];
}

/**
 * Pathway enrollment with serialized timestamps for server action returns.
 */
export interface PathwayEnrollmentSerialized extends Omit<PathwayEnrollment, 'enrolledAt' | 'lastAccessedAt' | 'startedAt' | 'completedAt' | 'quizScores'> {
  readonly enrolledAt: SerializedTimestamp;
  readonly lastAccessedAt: SerializedTimestamp;
  readonly startedAt?: SerializedTimestamp;
  readonly completedAt?: SerializedTimestamp;
  readonly quizScores: readonly QuizScoreSerialized[];
}

/**
 * Pathway enrollment with capability tracking extensions.
 */
export interface PathwayEnrollmentWithCapabilities extends PathwayEnrollment {
  /** Total practice hours logged */
  readonly practiceHours?: number;
  /** URLs to created work products */
  readonly workProducts?: readonly string[];
  /** Demonstrated competencies */
  readonly demonstratedBehaviors?: readonly string[];
  /** Current proficiency level */
  readonly proficiencyLevel?: CapabilityProficiency;
  /** Number of PracticeEvidence entries */
  readonly evidenceCount?: number;
}

// ============================================================================
// CORE TYPES: CAPABILITY VERIFICATION (was Certificate)
// ============================================================================

/**
 * Capability verification issued upon pathway completion.
 *
 * @remarks
 * Capability verifications provide verifiable proof of pathway completion.
 * They include a unique verification code and URL for external validation.
 */
export interface CapabilityVerification {
  /** Unique identifier */
  readonly id: string;
  /** User who earned the certificate */
  readonly userId: string;
  /** Course that was completed */
  readonly courseId: string;

  // Certificate data
  /** Unique certificate number (e.g., "NVP-2025-12345") */
  readonly certificateNumber: string;
  /** When certificate was issued */
  readonly issuedAt: Timestamp;
  /** When certificate expires (if applicable) */
  readonly expiresAt?: Timestamp;

  // Verification
  /** Public URL for verification */
  readonly verificationUrl: string;
  /** Whether certificate has been revoked */
  readonly isRevoked: boolean;

  // Display fields (populated when fetched with course data)
  /** Course title for display */
  readonly courseTitle?: string;
  /** Course thumbnail for display */
  readonly courseThumbnail?: string;
}

// ============================================================================
// LEARNING PATH TYPES
// ============================================================================

/**
 * Learning path grouping multiple courses into a curriculum.
 * Defines prerequisites and skills gained.
 */
export interface LearningPath {
  /** Unique identifier */
  readonly id: string;
  /** Path title */
  readonly title: string;
  /** Path description */
  readonly description: string;

  /** Ordered list of course IDs in this path */
  readonly courseIds: readonly string[];
  /** Prerequisite paths or courses */
  readonly prerequisites?: readonly string[];

  /** Total estimated duration in minutes */
  readonly estimatedDuration: number;
  /** Skills developed by completing this path */
  readonly skillsGained: readonly string[];

  /** When path was created */
  readonly createdAt: Timestamp;
  /** When path was last updated */
  readonly updatedAt: Timestamp;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

/**
 * User review of a course.
 */
export interface PathwayReview {
  /** Unique identifier */
  readonly id: string;
  /** Course being reviewed */
  readonly courseId: string;
  /** User who wrote the review */
  readonly userId: string;
  /** User's display name */
  readonly userDisplayName: string;

  /** Star rating (1-5) */
  readonly rating: number;
  /** Review comment */
  readonly comment?: string;

  /** When review was created */
  readonly createdAt: Timestamp;
  /** When review was last updated */
  readonly updatedAt?: Timestamp;

  /** Number of users who found this helpful */
  readonly helpfulCount?: number;
}

/**
 * Aggregate rating statistics for a course.
 */
export interface PathwayRatingStats {
  /** Course these stats are for */
  readonly courseId: string;
  /** Average rating (0-5) */
  readonly averageRating: number;
  /** Total number of reviews */
  readonly totalReviews: number;
  /** Distribution of ratings by star count */
  readonly ratingDistribution: {
    readonly 1: number;
    readonly 2: number;
    readonly 3: number;
    readonly 4: number;
    readonly 5: number;
  };
}

/**
 * Pathway with enrollment data for display.
 */
export interface PathwayWithEnrollment extends CapabilityPathway {
  /** User's enrollment if enrolled */
  readonly enrollment?: PathwayEnrollment;
  /** Quick check if user is enrolled */
  readonly isEnrolled: boolean;
}

// ============================================================================
// SKILLS & CAPABILITY TRACKING TYPES
// ============================================================================

/** Skill category for classification */
export type SkillCategory = 'technical' | 'regulatory' | 'clinical' | 'business' | 'soft-skill';

/** How a skill was acquired */
export type SkillAcquisitionSource = 'course' | 'endorsement' | 'self-reported';

/**
 * Skill definition for capability tracking.
 */
export interface Skill {
  /** Unique identifier */
  readonly id: string;
  /** Skill name */
  readonly name: string;
  /** Skill description */
  readonly description: string;
  /** Category for classification */
  readonly category: SkillCategory;

  // Hierarchy
  /** Parent skill ID for nested skill trees */
  readonly parentSkillId?: string;
  /** Child skill IDs */
  readonly subSkills?: readonly string[];

  // Industry alignment
  /** Whether this is a recognized pharmaceutical industry skill */
  readonly industryStandard?: boolean;
  /** Job roles that require this skill */
  readonly associatedRoles?: readonly string[];

  /** When skill was created */
  readonly createdAt: Timestamp;
  /** When skill was last updated */
  readonly updatedAt: Timestamp;
}

/**
 * Mapping of skills developed by a course.
 */
export interface PathwaySkillMapping {
  /** Course ID */
  readonly courseId: string;
  /** Skills developed with proficiency levels */
  readonly skills: readonly {
    readonly skillId: string;
    readonly proficiencyLevel: ProficiencyLevel;
    /** True if this is a primary learning outcome */
    readonly primarySkill: boolean;
  }[];
}

/**
 * User's skill profile tracking all acquired skills.
 */
export interface UserSkillProfile {
  /** User ID */
  readonly userId: string;
  /** All acquired skills */
  readonly skills: readonly {
    readonly skillId: string;
    readonly proficiencyLevel: ProficiencyLevel;
    readonly acquiredFrom: SkillAcquisitionSource;
    /** Course IDs or endorsement IDs that granted this skill */
    readonly sourceIds: readonly string[];
    readonly lastUpdated: Timestamp;
  }[];

  // Goals
  /** Skills user wants to learn */
  readonly targetSkills?: readonly string[];
  /** Target role/career path */
  readonly careerPath?: string;

  /** When profile was last updated */
  readonly updatedAt: Timestamp;
}

/**
 * Analysis of skill gaps for a target role.
 */
export interface SkillGapAnalysis {
  /** User ID */
  readonly userId: string;
  /** Target role being analyzed */
  readonly targetRole: string;
  /** Skills required for the role */
  readonly requiredSkills: readonly string[];
  /** Skills user currently has */
  readonly currentSkills: readonly string[];
  /** Detailed gap analysis */
  readonly skillGaps: readonly {
    readonly skillId: string;
    readonly currentLevel?: ProficiencyLevel;
    readonly requiredLevel: ProficiencyLevel;
    /** Course IDs that teach this skill */
    readonly recommendedCourses: readonly string[];
  }[];
  /** Overall completion percentage (0-100) */
  readonly completionPercentage: number;
  /** Estimated time to close gaps in minutes */
  readonly estimatedLearningTime: number;
}

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

// ============================================================================
// CAPABILITY VERIFICATION & PORTFOLIO TYPES
// ============================================================================

/**
 * Practice Evidence - Portfolio entry showing work products created during learning.
 * Emphasizes DOING over CONSUMING (capability over credential).
 */
export interface PracticeEvidence {
  /** Unique identifier */
  readonly id: string;
  /** User who created this evidence */
  readonly userId: string;
  /** Course/pathway this evidence is for */
  readonly pathwayId: string;
  /** Lesson/activity this evidence is for */
  readonly activityId: string;

  // What they created/did
  /** URL to actual work (Google Doc, PDF, etc.) */
  readonly workProduct?: string;
  /** Reflection on what was learned */
  readonly reflectionNote?: string;
  /** How they applied or will apply this learning */
  readonly applicationContext?: string;

  // Verification metrics
  /** Time spent on this activity in hours */
  readonly practiceHours: number;
  /** Competencies demonstrated */
  readonly demonstratedBehaviors: readonly string[];

  /** When evidence was created */
  readonly createdAt: Timestamp;
  /** When evidence was last updated */
  readonly updatedAt?: Timestamp;
}

/**
 * Capability Statement - Enhanced verification document with evidence.
 * Replaces traditional "certificate of completion" with demonstrated capability.
 */
export interface CapabilityStatement {
  /** Unique identifier */
  readonly id: string;
  /** User who earned this statement */
  readonly userId: string;
  /** Course/pathway this statement is for */
  readonly pathwayId: string;

  // Capability framing
  /** Name of the capability (e.g., "Signal Detection Proficiency") */
  readonly capabilityName: string;
  /** Achieved proficiency level */
  readonly proficiencyLevel: CapabilityProficiency;

  // Evidence of capability
  /** List of activities completed */
  readonly demonstratedActivities: readonly string[];
  /** URLs to portfolio evidence */
  readonly workProducts: readonly string[];
  /** Specific competencies demonstrated */
  readonly behaviorsMastered: readonly string[];
  /** Total time spent building this capability in hours */
  readonly practiceHours: number;

  // Verification data (for HR/external use)
  /** Unique verification code (e.g., "NVP-2025-12345") */
  readonly verificationCode: string;
  /** Public verification page URL */
  readonly verificationUrl: string;
  /** When statement was issued */
  readonly issuedAt: Timestamp;
  /** When statement expires (if applicable) */
  readonly expiresAt?: Timestamp;
  /** Whether statement has been revoked */
  readonly isRevoked: boolean;

  // Display metadata
  /** Pathway title for display */
  readonly pathwayTitle?: string;
  /** Pathway description for display */
  readonly pathwayDescription?: string;
}

// ============================================================================
// ACHIEVEMENT TYPES
// ============================================================================

/** Achievement category for grouping */
export type AchievementCategory = 'pathway' | 'assessment' | 'streak' | 'verification';

/** Achievement rarity tier */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/**
 * Achievement definition — a milestone practitioners can earn.
 * Achievements are derived from existing data (enrollments, completions, streaks, quiz scores).
 * No separate Firestore collection needed.
 */
export interface Achievement {
  /** Unique achievement identifier (e.g., 'first-enrollment') */
  readonly id: string;
  /** Display title */
  readonly title: string;
  /** Description of how to earn this achievement */
  readonly description: string;
  /** Emoji icon for display */
  readonly icon: string;
  /** Category for filtering */
  readonly category: AchievementCategory;
  /** Rarity tier affecting visual treatment */
  readonly rarity: AchievementRarity;
  /** Whether the practitioner has earned this */
  readonly earned: boolean;
  /** When earned (ISO string), undefined if not earned */
  readonly earnedAt?: string;
  /** Progress toward earning (0-100), only for progressive achievements */
  readonly progress?: number;
  /** Target value for progressive achievements */
  readonly target?: number;
  /** Current value for progressive achievements */
  readonly current?: number;
}

/**
 * Achievement summary for dashboard display.
 */
export interface AchievementSummary {
  /** Total achievements available */
  readonly total: number;
  /** Achievements earned */
  readonly earned: number;
  /** All achievement details */
  readonly achievements: readonly Achievement[];
  /** Most recently earned achievement (for toast notification) */
  readonly latest?: Achievement;
}

// ============================================================================
// DEPRECATED BACKWARD-COMPATIBILITY ALIASES
// These preserve imports in consuming files during migration.
// All old names point to the new primitives-first interfaces above.
// Remove these once all consumers have migrated.
// ============================================================================

// --- Core Interfaces ---
/** @deprecated Use `CapabilityPathway` instead */
export type Course = CapabilityPathway;
/** @deprecated Use `PracticeActivity` instead */
export type Lesson = PracticeActivity;
/** @deprecated Use `CapabilityStage` instead */
export type Module = CapabilityStage;
/** @deprecated Use `PathwayEnrollment` instead */
export type Enrollment = PathwayEnrollment;
/** @deprecated Use `CapabilityVerification` instead */
export type Certificate = CapabilityVerification;

// --- Branded IDs ---
/** @deprecated Use `PathwayId` instead */
export type CourseId = PathwayId;
/** @deprecated Use `ActivityId` instead */
export type LessonId = ActivityId;
/** @deprecated Use `StageId` instead */
export type ModuleId = StageId;
/** @deprecated Use `PathwayEnrollmentId` instead */
export type EnrollmentId = PathwayEnrollmentId;
/** @deprecated Use `VerificationId` instead */
export type CertificateId = VerificationId;

// --- Compound Types ---
/** @deprecated Use `PathwayStatus` instead */
export type CourseStatus = PathwayStatus;
/** @deprecated Use `PathwayVisibility` instead */
export type CourseVisibility = PathwayVisibility;
/** @deprecated Use `PathwayDifficulty` instead */
export type CourseDifficulty = PathwayDifficulty;
/** @deprecated Use `PathwayInstructor` instead */
export type CourseInstructor = PathwayInstructor;
/** @deprecated Use `PathwayMetadata` instead */
export type CourseMetadata = PathwayMetadata;
/** @deprecated Use `ActivityAssessment` instead */
export type LessonAssessment = ActivityAssessment;
/** @deprecated Use `ActivityResource` instead */
export type LessonResource = ActivityResource;
/** @deprecated Use `ActivityWithResources` instead */
export type LessonWithResources = ActivityWithResources;
/** @deprecated Use `ActivityWithPractice` instead */
export type LessonWithPractice = ActivityWithPractice;
/** @deprecated Use `PathwayWithCapabilities` instead */
export type CourseWithCapabilities = PathwayWithCapabilities;
/** @deprecated Use `PathwayEnrollmentSerialized` instead */
export type EnrollmentSerialized = PathwayEnrollmentSerialized;
/** @deprecated Use `PathwayEnrollmentWithCapabilities` instead */
export type EnrollmentWithCapabilities = PathwayEnrollmentWithCapabilities;
/** @deprecated Use `PathwayReview` instead */
export type CourseReview = PathwayReview;
/** @deprecated Use `PathwayRatingStats` instead */
export type CourseRatingStats = PathwayRatingStats;
/** @deprecated Use `PathwayWithEnrollment` instead */
export type CourseWithEnrollment = PathwayWithEnrollment;
/** @deprecated Use `PathwaySkillMapping` instead */
export type CourseSkillMapping = PathwaySkillMapping;
/** @deprecated Use `PathwayAnalytics` instead */
export type CourseAnalytics = PathwayAnalytics;
/** @deprecated Use `PractitionerAnalytics` instead */
export type StudentAnalytics = PractitionerAnalytics;
/** @deprecated Use `SerializedPractitionerAnalytics` instead */
export type SerializedStudentAnalytics = SerializedPractitionerAnalytics;
/** @deprecated Use `ActivityBookmark` instead */
export type LessonBookmark = ActivityBookmark;
/** @deprecated Use `ActivityNote` instead */
export type LessonNote = ActivityNote;

// --- Legacy Aliases (from prior alias section) ---
/** @deprecated Use `CapabilityStage` instead */
export type SkillModule = CapabilityStage;
/** @deprecated Use `PathwayEnrollment` instead */
export type PracticeSession = PathwayEnrollment;
