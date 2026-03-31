// ============================================================================
// EPA PATHWAY — USER PROGRESS, ENROLLMENT, CATALOG TYPES
// ============================================================================

import type {
  EPAId,
  KSBId,
  CertificateId,
  PortfolioArtifactId,
  EPAUserId,
  EPATier,
  EPAStatus,
  EPAProgressStatus,
  ProficiencyLevel,
  EntrustmentLevel,
  PathwayDifficulty,
  EnrollmentSource,
  FlexibleTimestamp,
  ActivityType,
  DomainId,
  CPAId,
} from './types';

import type { KSBStats, EPAPathwayMetadata } from './pathway';

// ============================================================================
// KSB COMPLETION RECORD
// ============================================================================

/**
 * Individual KSB completion record.
 *
 * @remarks
 * Tracks the completion of a single KSB within an EPA,
 * including scoring and portfolio artifact linking.
 */
export interface KSBCompletion {
  /** KSB identifier */
  readonly ksbId: KSBId;
  /** When this KSB was completed */
  readonly completedAt: FlexibleTimestamp;
  /** Score if the activity was scored (0-100) */
  readonly score?: number;
  /** Number of attempts made */
  readonly attempts: number;
  /** Type of activity used for completion */
  readonly activityType: ActivityType;
  /** Link to portfolio artifact (if created) */
  readonly portfolioArtifactId?: PortfolioArtifactId;
}

// ============================================================================
// PROFICIENCY PROGRESSION
// ============================================================================

/**
 * Level progress within an EPA.
 *
 * @remarks
 * Tracks a learner's progress through a single proficiency level.
 */
export interface LevelProgress {
  /** Proficiency level being tracked */
  readonly level: ProficiencyLevel;
  /** When the learner started this level */
  readonly startedAt?: FlexibleTimestamp;
  /** When the learner completed this level */
  readonly completedAt?: FlexibleTimestamp;
  /** Number of KSBs completed at this level */
  readonly ksbsCompleted: number;
  /** Total KSBs required at this level */
  readonly ksbsTotal: number;
  /** Progress percentage (0-100) */
  readonly progressPercent: number;
  /** Whether the level assessment was passed */
  readonly assessmentPassed: boolean;
}

/**
 * Proficiency progression state.
 *
 * @remarks
 * Tracks overall proficiency progress including level history.
 */
export interface ProficiencyProgressState {
  /** Current proficiency level */
  readonly currentLevel: ProficiencyLevel;
  /** Progress toward next level (0-100) */
  readonly progressPercent: number;
  /** History of level completions */
  readonly levelHistory: readonly LevelProgress[];
}

/**
 * Entrustment progression state.
 *
 * @remarks
 * Tracks the learner's entrustment level and verification status.
 */
export interface EntrustmentProgressState {
  /** Current entrustment level */
  readonly currentLevel: EntrustmentLevel;
  /** Description of supervision required */
  readonly supervisionRequired: string;
  /** When entrustment was verified */
  readonly verifiedAt?: FlexibleTimestamp;
  /** Supervisor who verified (userId) */
  readonly verifiedBy?: EPAUserId;
}

// ============================================================================
// USER EPA PROGRESS
// ============================================================================

/**
 * User's progress on a specific EPA.
 * Stored in Firestore: /users/{userId}/epa_progress/{epaId}
 *
 * @remarks
 * Complete progress tracking for a user's journey through an EPA,
 * from enrollment to certification.
 */
export interface UserEPAProgress {
  // Identity
  /** User identifier */
  readonly userId: EPAUserId;
  /** EPA identifier */
  readonly epaId: EPAId;

  // Overall status
  /** Current progress status */
  readonly status: EPAProgressStatus;

  // Proficiency progression
  /** Proficiency level progression */
  readonly proficiencyProgress: ProficiencyProgressState;

  // Entrustment progression
  /** Entrustment level progression */
  readonly entrustmentProgress: EntrustmentProgressState;

  // KSB tracking
  /** Array of completed KSB IDs */
  readonly completedKSBs: readonly KSBId[];
  /** Detailed completion records */
  readonly ksbCompletions: readonly KSBCompletion[];

  // Time tracking
  /** Total time spent in minutes */
  readonly totalTimeSpent: number;

  // Enrollment metadata
  /** When the user enrolled */
  readonly enrolledAt: FlexibleTimestamp;
  /** Last activity timestamp */
  readonly lastActivityAt: FlexibleTimestamp;
  /** Completion timestamp (if completed) */
  readonly completedAt?: FlexibleTimestamp;

  // Certificate
  /** Certificate ID (if certified) */
  readonly certificateId?: CertificateId;
  /** Certification timestamp (if certified) */
  readonly certifiedAt?: FlexibleTimestamp;
}

// ============================================================================
// EPA ENROLLMENT
// ============================================================================

/**
 * EPA Enrollment action (for starting a pathway).
 *
 * @remarks
 * Represents the action of enrolling in an EPA pathway,
 * with optional target level and date.
 */
export interface EPAEnrollment {
  /** User enrolling */
  readonly userId: EPAUserId;
  /** EPA being enrolled in */
  readonly epaId: EPAId;
  /** Enrollment timestamp */
  readonly enrolledAt: FlexibleTimestamp;
  /** Source of enrollment */
  readonly source: EnrollmentSource;
  /** Target proficiency level (optional) */
  readonly targetLevel?: ProficiencyLevel;
  /** Target completion date (optional) */
  readonly targetDate?: FlexibleTimestamp;
}

// ============================================================================
// EPA CATALOG TYPES
// ============================================================================

/**
 * User progress summary for catalog cards.
 *
 * @remarks
 * Lightweight progress summary for display on catalog cards
 * when a user is logged in.
 */
export interface UserProgressSummary {
  /** Current progress status */
  readonly status: EPAProgressStatus;
  /** Current proficiency level */
  readonly currentLevel: ProficiencyLevel;
  /** Overall progress percentage (0-100) */
  readonly progressPercent: number;
}

/**
 * EPA Card data for catalog display.
 *
 * @remarks
 * Lightweight version of EPAPathway for catalog listing,
 * with optional user progress when authenticated.
 */
export interface EPACatalogCard {
  /** EPA identifier */
  readonly id: EPAId;
  /** Full name */
  readonly name: string;
  /** Short display name */
  readonly shortName: string;
  /** EPA tier */
  readonly tier: EPATier;
  /** EPA number (1-21) */
  readonly epaNumber: number;
  /** KSB distribution statistics */
  readonly ksbStats: KSBStats;
  /** Pathway metadata */
  readonly pathway: EPAPathwayMetadata;
  /** Content coverage percentage (0-100) */
  readonly contentCoverage: number;
  /** Publication status */
  readonly status: EPAStatus;
  /** User progress (if logged in) */
  readonly userProgress?: UserProgressSummary;
}

/**
 * EPA filter options for catalog.
 *
 * @remarks
 * Filter criteria for the EPA catalog page.
 * All fields are optional for flexible filtering.
 */
export interface EPACatalogFilters {
  /** Filter by tier */
  readonly tier?: EPATier;
  /** Filter by difficulty */
  readonly difficulty?: PathwayDifficulty;
  /** Filter by publication status */
  readonly status?: EPAStatus;
  /** Minimum content coverage percentage */
  readonly minContentCoverage?: number;
  /** Filter by domain ID */
  readonly domainId?: DomainId;
  /** Filter by CPA ID */
  readonly cpaId?: CPAId;
}
