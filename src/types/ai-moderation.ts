import { type Timestamp } from 'firebase/firestore';

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/** Branded string type for Content IDs */
export type ContentId = string & { readonly __brand: 'ContentId' };

/** Branded string type for Author IDs */
export type AuthorId = string & { readonly __brand: 'AuthorId' };

/** Branded string type for Moderation Log IDs */
export type ModerationLogId = string & { readonly __brand: 'ModerationLogId' };

/** Branded string type for Moderation Case IDs */
export type ModerationCaseId = string & { readonly __brand: 'ModerationCaseId' };

/** Branded string type for Warning IDs */
export type WarningId = string & { readonly __brand: 'WarningId' };

/** Branded string type for Moderation Request IDs */
export type ModerationRequestId = string & { readonly __brand: 'ModerationRequestId' };

// ============================================================================
// SERIALIZATION TYPES
// ============================================================================

/**
 * Serialized representation of a Firestore Timestamp.
 * Used when returning data from server actions to clients.
 */
export interface SerializedTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

// ============================================================================
// VIOLATION CATEGORIES & SEVERITY
// ============================================================================

/**
 * Categories of content policy violations.
 * Used to classify detected issues in user-generated content.
 */
export type ViolationCategory =
  | 'harassment'
  | 'threats'
  | 'hate_speech'
  | 'misinformation'
  | 'medical_misinformation'
  | 'spam'
  | 'solicitation'
  | 'impersonation'
  | 'pii_exposure'
  | 'off_topic'
  | 'self_promotion'
  | 'profanity'
  | 'copyright'
  | 'illegal_content'
  | 'none';

/**
 * Severity levels for content violations.
 * Determines urgency of response and escalation path.
 */
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

/**
 * Type guard to check if a string is a valid ViolationCategory.
 */
export function isViolationCategory(value: string): value is ViolationCategory {
  const categories: readonly ViolationCategory[] = [
    'harassment', 'threats', 'hate_speech', 'misinformation',
    'medical_misinformation', 'spam', 'solicitation', 'impersonation',
    'pii_exposure', 'off_topic', 'self_promotion', 'profanity',
    'copyright', 'illegal_content', 'none'
  ];
  return categories.includes(value as ViolationCategory);
}

/**
 * Type guard to check if a string is a valid SeverityLevel.
 */
export function isSeverityLevel(value: string): value is SeverityLevel {
  const levels: readonly SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'none'];
  return levels.includes(value as SeverityLevel);
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

/**
 * Types of content that can be moderated.
 */
export type ModeratedContentType =
  | 'post'
  | 'comment'
  | 'message'
  | 'profile'
  | 'forum'
  | 'resource';

/**
 * Type guard to check if a string is a valid ModeratedContentType.
 */
export function isModeratedContentType(value: string): value is ModeratedContentType {
  const types: readonly ModeratedContentType[] = [
    'post', 'comment', 'message', 'profile', 'forum', 'resource'
  ];
  return types.includes(value as ModeratedContentType);
}

// ============================================================================
// MODERATION ACTIONS
// ============================================================================

/**
 * Actions that can be taken on moderated content.
 */
export type ModerationAction =
  | 'approve'
  | 'flag_for_review'
  | 'auto_warn'
  | 'auto_remove'
  | 'auto_suspend'
  | 'escalate';

/**
 * Analysis tier determining depth of moderation.
 */
export type ModerationTier = 'quick' | 'detailed';

// ============================================================================
// MODERATION REQUEST/RESPONSE
// ============================================================================

/**
 * Optional metadata for moderation requests.
 */
export interface ModerationRequestMetadata {
  /** Title of the content (for posts, forums) */
  readonly title?: string;
  /** ID of parent content (for replies, comments) */
  readonly parentId?: string;
  /** ID of forum containing this content */
  readonly forumId?: string;
}

/**
 * Request to moderate a piece of content.
 * Sent to the AI moderation service for analysis.
 */
export interface ModerationRequest {
  /** Unique identifier for the content */
  readonly contentId: string;
  /** Type of content being moderated */
  readonly contentType: ModeratedContentType;
  /** The actual content text to analyze */
  readonly content: string;
  /** ID of the content author */
  readonly authorId: string;
  /** Optional additional context */
  readonly metadata?: ModerationRequestMetadata;
}

/**
 * Detail about a specific policy violation found in content.
 */
export interface ViolationDetail {
  /** Category of the violation */
  readonly category: ViolationCategory;
  /** Confidence score (0-1) that this violation exists */
  readonly confidence: number;
  /** Severity of this violation */
  readonly severity: SeverityLevel;
  /** Human-readable explanation of the violation */
  readonly explanation: string;
  /** Specific excerpts that triggered this detection */
  readonly evidence: readonly string[];
}

/**
 * Result of AI moderation analysis.
 * Contains assessment, violations found, and recommended action.
 */
export interface ModerationResult {
  /** Unique request identifier */
  readonly requestId: string;
  /** Content that was analyzed */
  readonly contentId: string;
  /** Type of content analyzed */
  readonly contentType: ModeratedContentType;

  // Overall assessment
  /** Whether content is approved for publication */
  readonly approved: boolean;
  /** Whether human review is recommended */
  readonly requiresReview: boolean;
  /** Whether automatic action was taken */
  readonly autoActioned: boolean;

  // Scores
  /** Overall risk score (0-1, higher = more risky) */
  readonly overallRiskScore: number;
  /** Confidence in the assessment (0-1) */
  readonly confidenceScore: number;

  // Violations found
  /** All violations detected */
  readonly violations: readonly ViolationDetail[];
  /** Most severe violation category, if any */
  readonly primaryViolation?: ViolationCategory;

  // Recommended action
  /** Action recommended by the AI */
  readonly recommendedAction: ModerationAction;

  // Analysis metadata
  /** AI model used for analysis */
  readonly modelUsed: string;
  /** Time taken for analysis in milliseconds */
  readonly analysisTimeMs: number;
  /** Depth of analysis performed */
  readonly tier: ModerationTier;

  // Timestamps
  /** When analysis was completed */
  readonly analyzedAt: Timestamp;
}

/**
 * Serialized ModerationResult for server action returns.
 */
export interface ModerationResultSerialized extends Omit<ModerationResult, 'analyzedAt'> {
  readonly analyzedAt: SerializedTimestamp;
}

// ============================================================================
// MODERATION LOG
// ============================================================================

/**
 * Persistent log entry for a moderation event.
 * Records the analysis, action taken, and any human review.
 */
export interface ModerationLog {
  /** Unique log entry identifier */
  readonly logId: string;

  // Content reference
  /** ID of moderated content */
  readonly contentId: string;
  /** Type of moderated content */
  readonly contentType: ModeratedContentType;
  /** Author of the content */
  readonly authorId: string;
  /** Snapshot of content at time of moderation */
  readonly contentSnapshot: string;

  // Result
  /** Full moderation result */
  readonly result: ModerationResult;

  // Actions taken
  /** Action that was actually taken */
  readonly actionTaken: ModerationAction;
  /** Whether action was automatic (vs human-initiated) */
  readonly actionAutomatic: boolean;
  /** ID of moderator who overrode automatic action */
  readonly actionOverriddenBy?: string;
  /** Reason for override */
  readonly actionOverrideReason?: string;

  // Case created (if flagged)
  /** ID of moderation case, if one was created */
  readonly caseId?: string;
  /** ID of warning issued, if any */
  readonly warningId?: string;

  // Timestamps
  /** When log entry was created */
  readonly createdAt: Timestamp;
  /** When human review occurred */
  readonly reviewedAt?: Timestamp;
  /** ID of moderator who reviewed */
  readonly reviewedBy?: string;
}

/**
 * Serialized ModerationLog for server action returns.
 */
export interface ModerationLogSerialized extends Omit<ModerationLog, 'createdAt' | 'reviewedAt' | 'result'> {
  readonly createdAt: SerializedTimestamp;
  readonly reviewedAt?: SerializedTimestamp;
  readonly result: ModerationResultSerialized;
}

// ============================================================================
// POLICY CONFIGURATION
// ============================================================================

/**
 * Threshold configuration for a specific violation category.
 */
export interface CategoryThreshold {
  /** Risk score above which to flag for review (0-1) */
  readonly flagThreshold: number;
  /** Risk score above which to take automatic action (0-1) */
  readonly autoActionThreshold: number;
  /** Default severity for violations in this category */
  readonly defaultSeverity: SeverityLevel;
}

/**
 * Policy thresholds for automated moderation decisions.
 * Controls when to auto-approve, flag, or take action.
 */
export interface PolicyThresholds {
  /** Auto-approve if risk below this threshold (0-1) */
  readonly autoApproveThreshold: number;
  /** Auto-action if confidence above this threshold (0-1) */
  readonly autoActionThreshold: number;
  /** Category-specific threshold overrides */
  readonly categoryThresholds: Partial<Record<ViolationCategory, CategoryThreshold>>;
}

/**
 * Default threshold configuration.
 * Tuned for pharmacovigilance professional community.
 */
export const DEFAULT_THRESHOLDS: PolicyThresholds = {
  autoApproveThreshold: 0.15,
  autoActionThreshold: 0.92,
  categoryThresholds: {
    harassment: {
      flagThreshold: 0.6,
      autoActionThreshold: 0.9,
      defaultSeverity: 'high',
    },
    threats: {
      flagThreshold: 0.5,
      autoActionThreshold: 0.85,
      defaultSeverity: 'critical',
    },
    hate_speech: {
      flagThreshold: 0.5,
      autoActionThreshold: 0.85,
      defaultSeverity: 'critical',
    },
    medical_misinformation: {
      flagThreshold: 0.6,
      autoActionThreshold: 0.9,
      defaultSeverity: 'high',
    },
    misinformation: {
      flagThreshold: 0.65,
      autoActionThreshold: 0.9,
      defaultSeverity: 'medium',
    },
    spam: {
      flagThreshold: 0.7,
      autoActionThreshold: 0.95,
      defaultSeverity: 'low',
    },
    pii_exposure: {
      flagThreshold: 0.5,
      autoActionThreshold: 0.85,
      defaultSeverity: 'high',
    },
    profanity: {
      flagThreshold: 0.8,
      autoActionThreshold: 0.95,
      defaultSeverity: 'low',
    },
  },
} as const;

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * Aggregate statistics for AI moderation dashboard.
 */
export interface AIModerationStats {
  /** Total content items scanned */
  readonly totalScanned: number;
  /** Items automatically approved */
  readonly autoApproved: number;
  /** Items automatically actioned */
  readonly autoActioned: number;
  /** Items flagged for human review */
  readonly flaggedForReview: number;
  /** Detected false positives (overridden decisions) */
  readonly falsePositives: number;
  /** Average confidence score across all analyses */
  readonly avgConfidence: number;
  /** Average processing time in milliseconds */
  readonly avgProcessingTime: number;
  /** Count of violations by category */
  readonly violationsByCategory: Readonly<Record<ViolationCategory, number>>;
  /** Count of AI decisions overridden by humans */
  readonly actionsOverridden: number;
}

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Context provided to AI for content moderation.
 * Used to construct the moderation prompt.
 */
export interface ModerationPromptContext {
  /** Content to analyze */
  readonly content: string;
  /** Type of content */
  readonly contentType: ModeratedContentType;
  /** Description of platform context */
  readonly platformContext: string;
  /** Relevant policies to check against */
  readonly policies: readonly string[];
  /** Number of previous violations by this author */
  readonly previousViolations?: number;
}
