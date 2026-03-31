/**
 * Core types for PV Curriculum
 * Base enums, status types, and workflow metadata
 */

// Re-export from pv-framework for convenience
export type { ProficiencyLevel, BloomLevel, KSBType } from '../pv-framework';

// ============================================================================
// WORKFLOW STATUS TYPES
// ============================================================================

/**
 * Unified KSB workflow status - single source of truth
 *
 * Workflow: draft → generating → review → published → archived
 */
export type KSBContentStatus =
  | 'draft'           // Initial creation, no content
  | 'generating'      // AI content generation in progress
  | 'review'          // Content complete, pending review
  | 'published'       // Live and available to learners
  | 'archived';       // Deprecated/hidden

/**
 * Workflow metadata for tracking content progression
 */
export interface KSBWorkflowMetadata {
  version: number;                    // Increments on each update
  lastModifiedBy?: string;            // User ID who last modified
  generatedAt?: Date;                 // When AI generation completed
  reviewedBy?: string;                // User ID who reviewed
  reviewedAt?: Date;                  // When review completed
  publishedBy?: string;               // User ID who published
  publishedAt?: Date;                 // When published
  archivedBy?: string;                // User ID who archived
  archivedAt?: Date;                  // When archived
  reviewNotes?: string;               // Notes from reviewer
}
