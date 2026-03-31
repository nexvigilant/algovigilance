/**
 * Content Lifecycle Types
 * Lifecycle management, versioning, and audit trails
 */

// ============================================================================
// CONTENT LIFECYCLE MANAGEMENT (P0 - Critical for Governance)
// ============================================================================

/**
 * Content state in lifecycle
 */
export type ContentLifecycleState =
  | 'active'            // Current, in use
  | 'under_review'      // Being reviewed for updates
  | 'needs_update'      // Flagged as needing revision
  | 'deprecated'        // No longer recommended
  | 'archived';         // Removed from active use

/**
 * Review trigger type
 */
export type ReviewTriggerType =
  | 'scheduled'         // Regular review cycle
  | 'regulatory_change' // Regulation/guideline updated
  | 'feedback'          // Learner/SME feedback triggered
  | 'incident'          // Safety/quality incident
  | 'manual';           // Manual request

/**
 * Content Lifecycle - Ownership, review cycles, and deprecation
 *
 * Enables:
 * - Content governance and accountability
 * - Automated review reminders
 * - Deprecation and sunset workflows
 */
export interface ContentLifecycle {
  // Ownership
  ownerId: string;                    // Content steward user ID
  ownerName?: string;                 // Cached for display
  ownerEmail?: string;                // For notifications
  backupOwnerId?: string;             // Alternate owner

  // Review cycle
  reviewCycleDays: number;            // How often to review (default: 365)
  lastReviewedAt?: Date;
  lastReviewedBy?: string;
  nextReviewDate: Date;
  reviewNotes?: string;

  // Review history
  reviewHistory?: {
    reviewedAt: Date;
    reviewedBy: string;
    outcome: 'approved' | 'updated' | 'flagged';
    notes?: string;
    triggerType: ReviewTriggerType;
  }[];

  // Current state
  contentState: ContentLifecycleState;
  stateChangedAt?: Date;
  stateChangedBy?: string;
  stateChangeReason?: string;

  // Deprecation/sunset
  scheduledSunsetDate?: Date;
  sunsetReason?: string;
  replacementKsbId?: string;          // What to use instead

  // Notifications
  reviewRemindersEnabled: boolean;
  reminderDaysBefore: number[];       // e.g., [30, 7, 1]
  lastReminderSentAt?: Date;
}

// ============================================================================
// VERSION HISTORY (P0 - Critical for Compliance/Audit)
// ============================================================================

/**
 * Change type for version history
 */
export type ContentChangeType =
  | 'initial_creation'
  | 'regulatory_update'   // Guideline/regulation changed
  | 'error_correction'    // Factual error fixed
  | 'enhancement'         // Content improved
  | 'sme_review'          // SME feedback incorporated
  | 'learner_feedback'    // Learner feedback addressed
  | 'style_update'        // Writing style/format changed
  | 'deprecation';        // Content being retired

/**
 * Individual version snapshot reference
 */
export interface ContentVersion {
  version: string;                    // Semantic version "2.1.0"
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
  changeType: ContentChangeType;
  changesSummary: string;

  // Snapshot storage
  snapshotPath?: string;              // Cloud Storage path to full snapshot
  snapshotSize?: number;              // Bytes

  // Diff from previous
  sectionsChanged: string[];          // ['hook', 'concept', 'activity']
  linesAdded?: number;
  linesRemoved?: number;
}

/**
 * Detailed change log entry
 */
export interface ChangeLogEntry {
  id: string;
  date: Date;
  author: string;
  authorName?: string;
  changeType: ContentChangeType;
  description: string;
  affectedSections: string[];

  // For regulatory changes
  regulatoryReference?: string;       // Which guideline changed

  // Review/approval
  approvedBy?: string;
  approvedAt?: Date;
}

/**
 * Version History - Complete audit trail for compliance
 *
 * Enables:
 * - Regulatory compliance audits
 * - Content rollback
 * - Change tracking and attribution
 */
export interface VersionHistory {
  currentVersion: string;             // "2.1.0"
  initialVersion: string;             // "1.0.0"
  totalVersions: number;

  // Version snapshots
  versions: ContentVersion[];

  // Detailed change log
  changeLog: ChangeLogEntry[];

  // Rollback capability
  canRollback: boolean;
  lastRollbackAt?: Date;
  lastRollbackBy?: string;
  lastRollbackReason?: string;
}
