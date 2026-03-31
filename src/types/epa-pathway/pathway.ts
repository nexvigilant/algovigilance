// ============================================================================
// EPA PATHWAY — CORE PATHWAY DEFINITION & STRUCTURE
// ============================================================================

import type {
  EPAId,
  DomainId,
  CPAId,
  KSBId,
  EPATier,
  EPAStatus,
  ProficiencyLevel,
  EntrustmentLevel,
  PathwayDifficulty,
  FlexibleTimestamp,
} from './types';

// ============================================================================
// KSB STATISTICS
// ============================================================================

/**
 * KSB statistics for an EPA or level.
 *
 * @remarks
 * Tracks the distribution of Knowledge, Skills, and Behaviors
 * within an EPA or at a specific proficiency level.
 */
export interface KSBStats {
  /** Total number of KSBs */
  readonly total: number;
  /** Number of Knowledge components */
  readonly knowledge: number;
  /** Number of Skill components */
  readonly skill: number;
  /** Number of Behavior components */
  readonly behavior: number;
}

/** Creates empty KSB statistics. */
export function createEmptyKSBStats(): KSBStats {
  return { total: 0, knowledge: 0, skill: 0, behavior: 0 };
}

// ============================================================================
// ENTRUSTMENT LEVEL REQUIREMENTS
// ============================================================================

/**
 * Entrustment level requirements within an EPA.
 *
 * @remarks
 * Defines what a learner must achieve at each proficiency level
 * including specific KSBs and assessment criteria.
 */
export interface EntrustmentLevelRequirements {
  /** Proficiency level (L1-L5+) */
  readonly level: ProficiencyLevel;
  /** Corresponding entrustment level */
  readonly entrustment: EntrustmentLevel;
  /** Description of expectations at this level */
  readonly description: string;
  /** Number of KSBs required at this level */
  readonly ksbCount: number;
  /** Specific KSB IDs required */
  readonly ksbIds: readonly KSBId[];
  /** Assessment criteria for level completion */
  readonly assessmentCriteria: readonly string[];
  /** Estimated hours to complete this level */
  readonly estimatedHours: number;
}

// ============================================================================
// EPA PATHWAY METADATA
// ============================================================================

/**
 * EPA Pathway metadata for catalog display.
 *
 * @remarks
 * Contains display-oriented information for the EPA catalog,
 * including prerequisites and certification availability.
 */
export interface EPAPathwayMetadata {
  /** Human-readable duration (e.g., "40-60 hours") */
  readonly estimatedDuration: string;
  /** Difficulty classification */
  readonly difficulty: PathwayDifficulty;
  /** EPA IDs required before starting (optional) */
  readonly prerequisites?: readonly EPAId[];
  /** Whether official certification is available */
  readonly certificationAvailable: boolean;
}

// ============================================================================
// GUARDIAN SERVICE MAPPING
// ============================================================================

/**
 * Guardian service mapping for an EPA.
 *
 * @remarks
 * Links EPAs to their corresponding Guardian microservices
 * for automation and AI-assisted learning.
 */
export interface GuardianServiceMapping {
  /** Port range for services (e.g., "3001-3003") */
  readonly portRange: string;
  /** Service names (e.g., ["guardian-epa1-intake"]) */
  readonly serviceNames: readonly string[];
}

// ============================================================================
// COMPLETE EPA PATHWAY
// ============================================================================

/**
 * Complete EPA Pathway definition.
 * Stored in Firestore: /epas/{epaId}
 *
 * @remarks
 * Represents a complete Entrustable Professional Activity with
 * all levels, KSB mappings, and metadata for the Academy.
 */
export interface EPAPathway {
  // Identity
  /** Unique EPA identifier (EPA-01, EPA-02, etc.) */
  readonly id: EPAId;
  /** Full name (e.g., "Process and Evaluate ICSRs") */
  readonly name: string;
  /** Short display name (e.g., "Case Processing") */
  readonly shortName: string;
  /** Full description */
  readonly description: string;
  /** Primary focus area */
  readonly focusArea: string;

  // Classification
  /** EPA tier (Core, Executive, Network) */
  readonly tier: EPATier;
  /** EPA number (1-21) */
  readonly epaNumber: number;

  // Domain relationships
  /** Primary domain IDs (D01, D02, etc.) */
  readonly primaryDomains: readonly DomainId[];
  /** Supporting domain IDs */
  readonly secondaryDomains: readonly DomainId[];
  /** Related CPA IDs */
  readonly cpaIds: readonly CPAId[];

  // Content statistics
  /** KSB distribution statistics */
  readonly ksbStats: KSBStats;

  // Level-by-level requirements
  /** Requirements for each proficiency level */
  readonly entrustmentLevels: Readonly<Record<ProficiencyLevel, EntrustmentLevelRequirements>>;

  // Pathway metadata
  /** Display metadata for catalog */
  readonly pathway: EPAPathwayMetadata;

  // Guardian service mapping (optional)
  /** Guardian microservice integration */
  readonly guardianServices?: GuardianServiceMapping;

  // Status and timestamps
  /** Publication status */
  readonly status: EPAStatus;
  /** Creation timestamp */
  readonly createdAt: FlexibleTimestamp;
  /** Last update timestamp */
  readonly updatedAt: FlexibleTimestamp;
  /** Publication timestamp (if published) */
  readonly publishedAt?: FlexibleTimestamp;

  // Content coverage
  /** Percentage of KSBs with ALO content (0-100) */
  readonly contentCoverage: number;
}
