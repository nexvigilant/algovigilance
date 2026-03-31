// ============================================================================
// CORE DOMAIN TYPES: Activity, Stage, Pathway, Enrollment, Verification
// ============================================================================

import { type Timestamp } from 'firebase/firestore';

import type { CapabilityProficiency } from './ids';
import type { SerializedTimestamp } from './serialization';
import type {
  VideoProvider,
  VideoTimestamp,
  ActivityAssessment,
  ActivityResource,
  QuizScore,
  QuizScoreSerialized,
} from './content';

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
