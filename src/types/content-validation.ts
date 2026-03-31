/**
 * Intelligence Content Validation Types
 *
 * Types for the automated content fact-checking and validation system
 * powered by Perplexity Sonar for real-time web research.
 *
 * @remarks
 * This module supports automated fact-checking of Intelligence content
 * with categorized issues, severity levels, and source citations.
 */

import type { Timestamp } from 'firebase/firestore';
import type { ContentType } from './intelligence';

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/** Branded string type for Content Issue IDs */
export type ContentIssueId = string & { readonly __brand: 'ContentIssueId' };

/** Branded string type for Validation Run IDs */
export type ValidationRunId = string & { readonly __brand: 'ValidationRunId' };

/** Branded string type for Content Validation IDs */
export type ContentValidationId = string & { readonly __brand: 'ContentValidationId' };

// ============================================================================
// STATUS & CATEGORY ENUMS
// ============================================================================

/**
 * Issue severity levels.
 */
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * All valid issue severities.
 */
export const ISSUE_SEVERITIES: readonly IssueSeverity[] = [
  'critical', 'high', 'medium', 'low', 'info'
] as const;

/**
 * Type guard for IssueSeverity.
 */
export function isIssueSeverity(value: string): value is IssueSeverity {
  return ISSUE_SEVERITIES.includes(value as IssueSeverity);
}

/**
 * Issue category types.
 */
export type IssueCategory =
  | 'factual_error'
  | 'outdated_information'
  | 'source_unavailable'
  | 'contradiction'
  | 'missing_context'
  | 'claim_unsubstantiated'
  | 'regulatory_update'
  | 'enhancement_opportunity';

/**
 * All valid issue categories.
 */
export const ISSUE_CATEGORIES: readonly IssueCategory[] = [
  'factual_error', 'outdated_information', 'source_unavailable',
  'contradiction', 'missing_context', 'claim_unsubstantiated',
  'regulatory_update', 'enhancement_opportunity'
] as const;

/**
 * Type guard for IssueCategory.
 */
export function isIssueCategory(value: string): value is IssueCategory {
  return ISSUE_CATEGORIES.includes(value as IssueCategory);
}

/**
 * Status of validation run.
 */
export type ValidationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * All valid validation statuses.
 */
export const VALIDATION_STATUSES: readonly ValidationStatus[] = [
  'pending', 'in_progress', 'completed', 'failed'
] as const;

/**
 * Type guard for ValidationStatus.
 */
export function isValidationStatus(value: string): value is ValidationStatus {
  return VALIDATION_STATUSES.includes(value as ValidationStatus);
}

/**
 * Status of individual issue.
 */
export type IssueStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

/**
 * All valid issue statuses.
 */
export const ISSUE_STATUSES: readonly IssueStatus[] = [
  'open', 'acknowledged', 'resolved', 'dismissed'
] as const;

/**
 * Type guard for IssueStatus.
 */
export function isIssueStatus(value: string): value is IssueStatus {
  return ISSUE_STATUSES.includes(value as IssueStatus);
}

/**
 * Claim types for extraction.
 */
export type ClaimType = 'statistic' | 'fact' | 'date' | 'quote' | 'regulation' | 'source_reference';

/**
 * All valid claim types.
 */
export const CLAIM_TYPES: readonly ClaimType[] = [
  'statistic', 'fact', 'date', 'quote', 'regulation', 'source_reference'
] as const;

/**
 * Type guard for ClaimType.
 */
export function isClaimType(value: string): value is ClaimType {
  return CLAIM_TYPES.includes(value as ClaimType);
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Source/citation from Perplexity research.
 *
 * @remarks
 * Sources are retrieved during fact-checking to support
 * or contradict claims in the content.
 */
export interface ValidationSource {
  /** Source title or domain */
  readonly title: string;
  /** Full URL */
  readonly url: string;
  /** Relevant snippet from source */
  readonly snippet?: string;
  /** When this source was accessed (ISO date) */
  readonly accessedAt?: string;
}

/**
 * A single issue found during validation.
 *
 * @remarks
 * Issues are categorized by type and severity, with full
 * audit trail of status changes and resolution notes.
 */
export interface ContentIssue {
  /** Unique issue identifier */
  readonly id: ContentIssueId;
  /** Reference to the validation run that detected this issue */
  readonly runId?: string;
  /** Issue category */
  readonly category: IssueCategory;
  /** Severity level */
  readonly severity: IssueSeverity;
  /** Brief title of the issue */
  readonly title: string;
  /** Detailed description of what was found */
  readonly description: string;
  /** The problematic text/claim from the article */
  readonly problematicText?: string;
  /** What the correct/updated information should be */
  readonly suggestedCorrection?: string;
  /** Supporting evidence or sources for the issue */
  readonly sources: readonly ValidationSource[];
  /** Current status */
  readonly status: IssueStatus;
  /** When this issue was detected (ISO date) */
  readonly detectedAt: string;
  /** When status was last changed (ISO date) */
  readonly statusUpdatedAt?: string;
  /** Who updated the status (admin userId) */
  readonly statusUpdatedBy?: string;
  /** Notes from admin about resolution */
  readonly resolutionNotes?: string;
}

/**
 * Validation summary statistics.
 */
export interface ValidationSummary {
  /** Total issues found */
  readonly totalIssues: number;
  /** Critical issues count */
  readonly criticalCount: number;
  /** High severity count */
  readonly highCount: number;
  /** Medium severity count */
  readonly mediumCount: number;
  /** Low severity count */
  readonly lowCount: number;
  /** Open issues still needing attention */
  readonly openIssuesCount: number;
}

/**
 * Creates empty validation summary.
 */
export function createEmptyValidationSummary(): ValidationSummary {
  return {
    totalIssues: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    openIssuesCount: 0,
  };
}

/**
 * Validation result for a single article.
 *
 * @remarks
 * Stores the complete validation state including all issues,
 * summary statistics, and health score.
 */
export interface ContentValidation {
  /** Firestore document ID */
  readonly id?: ContentValidationId;
  /** Content slug being validated */
  readonly slug: string;
  /** Content type */
  readonly contentType: ContentType;
  /** Article title (for display) */
  readonly title: string;
  /** When the article was published (ISO date) */
  readonly publishedAt: string;
  /** Validation status */
  readonly status: ValidationStatus;
  /** When validation started */
  readonly startedAt: Timestamp | string;
  /** When validation completed */
  readonly completedAt?: Timestamp | string;
  /** Issues found */
  readonly issues: readonly ContentIssue[];
  /** Summary statistics */
  readonly summary: ValidationSummary;
  /** Overall health score (0-100) */
  readonly healthScore: number;
  /** Whether this content needs immediate attention */
  readonly needsAttention: boolean;
  /** Error message if validation failed */
  readonly errorMessage?: string;
  /** Perplexity model used */
  readonly model?: string;
  /** Processing time in seconds */
  readonly processingTimeSeconds?: number;
}

/**
 * Daily validation run record.
 *
 * @remarks
 * Tracks a complete validation batch run with aggregate statistics
 * across all validated articles.
 */
export interface ValidationRun {
  /** Firestore document ID */
  readonly id?: ValidationRunId;
  /** When this run started */
  readonly startedAt: Timestamp | string;
  /** When this run completed */
  readonly completedAt?: Timestamp | string;
  /** Status of the run */
  readonly status: ValidationStatus;
  /** Total articles validated */
  readonly totalArticles: number;
  /** Articles with issues found */
  readonly articlesWithIssues: number;
  /** Total issues found across all articles */
  readonly totalIssues: number;
  /** Critical issues found */
  readonly criticalIssues: number;
  /** List of article slugs that need attention */
  readonly articlesNeedingAttention: readonly string[];
  /** Any errors during the run */
  readonly errors?: readonly string[];
  /** Whether notifications were sent */
  readonly notificationsSent: boolean;
}

/**
 * Content validation configuration.
 *
 * @remarks
 * Configures the automated validation system including
 * content selection criteria and notification settings.
 */
export interface ValidationConfig {
  /** Whether automated validation is enabled */
  readonly enabled: boolean;
  /** Perplexity model to use */
  readonly model: string;
  /** Content types to validate */
  readonly contentTypesToValidate: readonly ContentType[];
  /** Minimum days since publication before validating */
  readonly minDaysAfterPublication: number;
  /** Maximum age of content to validate (days) */
  readonly maxContentAgeDays: number;
  /** Severity threshold for notifications */
  readonly notificationThreshold: IssueSeverity;
  /** Email addresses for notifications */
  readonly notificationEmails: readonly string[];
  /** Whether to send Slack notifications */
  readonly slackEnabled: boolean;
  /** Slack webhook URL */
  readonly slackWebhookUrl?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to validate specific content.
 */
export interface ValidateContentRequest {
  /** Slugs to validate (if empty, validates all eligible) */
  readonly slugs?: readonly string[];
  /** Force re-validation even if recently validated */
  readonly force?: boolean;
  /** Override default model */
  readonly model?: string;
}

/**
 * Validation API response.
 */
export interface ValidateContentResponse {
  readonly success: boolean;
  readonly message: string;
  readonly runId?: ValidationRunId;
  readonly results?: readonly ContentValidation[];
  readonly duration?: string;
  readonly error?: string;
}

// ============================================================================
// CLAIM EXTRACTION & VERIFICATION
// ============================================================================

/**
 * Claim extracted from content for fact-checking.
 */
export interface ExtractedClaim {
  /** The claim text */
  readonly claim: string;
  /** Type of claim */
  readonly type: ClaimType;
  /** Original source citation if any */
  readonly sourceCitation?: string;
  /** Approximate location in article */
  readonly location?: string;
}

/**
 * Result of fact-checking a single claim.
 */
export interface ClaimVerification {
  /** Original claim */
  readonly claim: ExtractedClaim;
  /** Whether the claim was verified */
  readonly verified: boolean;
  /** Confidence level (0-1) */
  readonly confidence: number;
  /** Verification explanation */
  readonly explanation: string;
  /** Supporting or contradicting sources */
  readonly sources: readonly ValidationSource[];
  /** If not verified, what's the issue */
  readonly issue?: ContentIssue;
}

// ============================================================================
// DISPLAY CONFIGURATION
// ============================================================================

/**
 * Display configuration for issue categories.
 */
export interface IssueCategoryDisplayConfig {
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

/**
 * Display config for issue categories.
 */
export const ISSUE_CATEGORY_CONFIG: Readonly<Record<IssueCategory, IssueCategoryDisplayConfig>> = {
  factual_error: {
    label: 'Factual Error',
    description: 'Incorrect facts or data that contradict authoritative sources',
    icon: '❌',
  },
  outdated_information: {
    label: 'Outdated Information',
    description: 'Information that has changed since publication',
    icon: '📅',
  },
  source_unavailable: {
    label: 'Source Unavailable',
    description: 'Referenced sources are no longer accessible',
    icon: '🔗',
  },
  contradiction: {
    label: 'Contradiction Found',
    description: 'Content conflicts with authoritative sources',
    icon: '⚔️',
  },
  missing_context: {
    label: 'Missing Context',
    description: 'Important context or nuance not included',
    icon: '📋',
  },
  claim_unsubstantiated: {
    label: 'Unsubstantiated Claim',
    description: 'Claims that cannot be verified with current sources',
    icon: '❓',
  },
  regulatory_update: {
    label: 'Regulatory Update',
    description: 'Regulations or guidelines have changed since publication',
    icon: '⚖️',
  },
  enhancement_opportunity: {
    label: 'Enhancement Opportunity',
    description: 'Not an error, but content could be improved',
    icon: '💡',
  },
} as const;

/**
 * Display configuration for severity levels.
 */
export interface SeverityDisplayConfig {
  readonly label: string;
  readonly color: string;
  readonly bgColor: string;
  readonly borderColor: string;
}

/**
 * Display config for severity levels.
 */
export const SEVERITY_CONFIG: Readonly<Record<IssueSeverity, SeverityDisplayConfig>> = {
  critical: {
    label: 'Critical',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  high: {
    label: 'High',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  low: {
    label: 'Low',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  info: {
    label: 'Info',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
} as const;
