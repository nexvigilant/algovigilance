/**
 * Capability Component Types
 * Main KSB entity and status change tracking
 */

import type { ProficiencyLevel, BloomLevel, KSBType } from '../pv-framework';
import type { KSBContentStatus, KSBWorkflowMetadata } from './core';
import type { ResearchData, AIGenerationMeta, RegulatoryContext } from './research';
import type { QualityMetrics, CoverageScore } from './quality';
import type { KSBRelationships } from './relationships';
import type { ContentLifecycle, VersionHistory } from './lifecycle';
import type {
  KSBHook,
  KSBConcept,
  KSBActivity,
  KSBReflection,
  KSBActivityMetadata,
} from './activity-engines/base';
import type { KSBActivityModular, ActivityResult } from './activity-engines/modular';

// ============================================================================
// CAPABILITY COMPONENT (Main Entity)
// ============================================================================

/**
 * Capability Component (Curriculum Entry)
 *
 * Firestore: /pv_domains/{domainId}/capability_components/{componentId}
 *
 * This represents a curriculum requirement that references a KSB from ksb_library.
 * The pv_domains collection is a "curriculum coordinator" - it tracks what's needed
 * and monitors coverage/quality, while ksb_library holds the actual research.
 */
export interface CapabilityComponent {
  id: string;                           // "KSB-D01-K0001"
  domainId: string;                     // "D01"
  type: KSBType | 'ai_integration';     // knowledge, skill, behavior, ai_integration

  // Reference to Universal Knowledge Bank
  ksbLibraryId?: string;                // Reference to ksb_library/{id} (e.g., "K-SIG-001")
  ksbLibraryMapping?: {
    matchConfidence: number;            // 0-100 confidence in mapping
    mappedAt?: Date;                    // When mapping was established
    mappedBy?: string;                  // User ID who mapped
    alternateIds?: string[];            // Other potential matches
  };

  // Curriculum Coverage Tracking (legacy - use coverageScore for new implementations)
  coverage?: {
    hasResearch: boolean;               // Is there research in ksb_library?
    researchQuality?: number;           // Quality score from ksb_library (0-100)
    lastSynced?: Date;                  // When last checked against ksb_library
    readyForProduction: boolean;        // Meets all thresholds for ALO generation
    missingRequirements?: string[];     // What's needed before production
  };

  // NEW: Structured coverage assessment
  coverageScore?: CoverageScore;

  // NEW: Research provenance and citations
  research?: ResearchData;

  // NEW: Regulatory context and jurisdiction
  regulatoryContext?: RegulatoryContext;

  // NEW: Inter-KSB relationships for learning paths
  relationships?: KSBRelationships;

  // NEW: Content lifecycle management
  lifecycle?: ContentLifecycle;

  // NEW: Version history for compliance/audit
  versionHistory?: VersionHistory;

  // Hierarchical structure (curriculum definition)
  majorSection: string;                 // Top-level category
  section: string;                      // Sub-category
  itemName: string;                     // Specific item
  itemDescription: string;              // Full description

  // Framework alignment
  proficiencyLevel: ProficiencyLevel;
  bloomLevel: BloomLevel;
  keywords: string[];
  curriculumRef: string;                // Reference to curriculum section

  // EPA/CPA Mapping (for Capability Pathways)
  epaIds?: string[];                    // EPA IDs this KSB contributes to (e.g., ["EPA-01", "EPA-05"])
  cpaIds?: string[];                    // CPA IDs this KSB contributes to (e.g., ["CPA-01", "CPA-02"])

  // Provenance
  sourceFile: string;
  sourceLocation: string;

  // Workflow Status (for ALO content)
  status: KSBContentStatus;
  workflow?: KSBWorkflowMetadata;
  createdAt: Date;
  updatedAt: Date;

  // NEW: AI generation audit trail
  generation?: AIGenerationMeta;

  // NEW: Content quality metrics
  qualityMetrics?: QualityMetrics;

  // ALO Content (Atomic Learning Object - the deliverable)
  hook?: KSBHook;
  concept?: KSBConcept;
  activity?: KSBActivity;                    // Legacy: typed union
  activityModular?: KSBActivityModular;      // NEW: Plugin-based (preferred)
  reflection?: KSBReflection;
  activityMetadata?: KSBActivityMetadata;

  // Activity result tracking
  lastActivityResult?: ActivityResult;
}

/**
 * KSB Status Change Audit Record
 *
 * Firestore: /ksb_status_changes/{changeId}
 */
export interface KSBStatusChange {
  id: string;
  ksbId: string;
  domainId: string;
  previousStatus: KSBContentStatus;
  newStatus: KSBContentStatus;
  changedBy: string;
  changedAt: Date;
  comment?: string;
}
