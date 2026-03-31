/**
 * EPA Pathway Types
 *
 * Type definitions for EPA-centric Capability Pathways in the Academy.
 * EPAs (Entrustable Professional Activities) define what PV professionals
 * should be able to do independently at various entrustment levels.
 *
 * @remarks
 * This module supports competency-based education with progressive
 * entrustment levels from observation-only to supervisor capability.
 *
 * Reference: PDC Chapter 5 - EPAs | Guardian EPA Service Matrix
 */

import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/** Branded string type for EPA IDs (EPA-01, EPA-02, etc.) */
export type EPAId = string & { readonly __brand: 'EPAId' };

/** Branded string type for Domain IDs (D01, D02, etc.) */
export type DomainId = string & { readonly __brand: 'DomainId' };

/** Branded string type for CPA IDs */
export type CPAId = string & { readonly __brand: 'CPAId' };

/** Branded string type for KSB IDs */
export type KSBId = string & { readonly __brand: 'KSBId' };

/** Branded string type for Verification IDs */
export type VerificationId = string & { readonly __brand: 'VerificationId' };

/** @deprecated Use `VerificationId` instead */
export type CertificateId = VerificationId;

/** Branded string type for Portfolio Artifact IDs */
export type PortfolioArtifactId = string & { readonly __brand: 'PortfolioArtifactId' };

/** Branded string type for User IDs in EPA context */
export type EPAUserId = string & { readonly __brand: 'EPAUserId' };

// ============================================================================
// TIMESTAMP TYPES
// ============================================================================

/**
 * Flexible timestamp type supporting multiple formats.
 * Handles Firestore Timestamp, serialized form, Date, and ISO strings.
 *
 * @remarks
 * Use this for fields that may be serialized across server/client boundary.
 */
export type FlexibleTimestamp =
  | Timestamp
  | { seconds: number; nanoseconds: number }
  | Date
  | string;

/**
 * Legacy timestamp alias for backward compatibility.
 * @deprecated Use FlexibleTimestamp instead
 */
export type FirestoreTimestamp = FlexibleTimestamp;

// =============================================================================
// CORE EPA TYPES
// =============================================================================

/**
 * EPA Tier classification.
 * - Core: EPA 1-10 (Foundation to Professional Practice)
 * - Executive: EPA 11-20 (Leadership and Transformation)
 * - Network: EPA 21 (Network Intelligence - Advanced)
 */
export type EPATier = 'Core' | 'Executive' | 'Network';

/**
 * All valid EPA tiers.
 */
export const EPA_TIERS: readonly EPATier[] = ['Core', 'Executive', 'Network'] as const;

/**
 * Type guard for EPATier.
 */
export function isEPATier(value: string): value is EPATier {
  return EPA_TIERS.includes(value as EPATier);
}

/**
 * EPA Status for publishing workflow.
 */
export type EPAStatus = 'draft' | 'review' | 'published' | 'archived';

/**
 * All valid EPA statuses.
 */
export const EPA_STATUSES: readonly EPAStatus[] = [
  'draft', 'review', 'published', 'archived'
] as const;

/**
 * Type guard for EPAStatus.
 */
export function isEPAStatus(value: string): value is EPAStatus {
  return EPA_STATUSES.includes(value as EPAStatus);
}

/**
 * Proficiency Levels (L1-L5+).
 * Maps to entrustment/supervision requirements.
 */
export type ProficiencyLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L5+';

/**
 * All valid proficiency levels in progression order.
 */
export const PROFICIENCY_LEVELS: readonly ProficiencyLevel[] = [
  'L1', 'L2', 'L3', 'L4', 'L5', 'L5+'
] as const;

/**
 * Type guard for ProficiencyLevel.
 */
export function isProficiencyLevel(value: string): value is ProficiencyLevel {
  return PROFICIENCY_LEVELS.includes(value as ProficiencyLevel);
}

/**
 * Entrustment Level descriptions.
 * Defines supervision requirements at each level.
 */
export type EntrustmentLevel =
  | 'observation'      // L1: Can observe only
  | 'direct'           // L2: Direct supervision required
  | 'indirect'         // L3: Indirect supervision (available if needed)
  | 'remote'           // L4: Remote/retrospective supervision
  | 'independent'      // L5: Independent practice
  | 'supervisor';      // L5+: Can supervise others

/**
 * All valid entrustment levels in progression order.
 */
export const ENTRUSTMENT_LEVELS: readonly EntrustmentLevel[] = [
  'observation', 'direct', 'indirect', 'remote', 'independent', 'supervisor'
] as const;

/**
 * Type guard for EntrustmentLevel.
 */
export function isEntrustmentLevel(value: string): value is EntrustmentLevel {
  return ENTRUSTMENT_LEVELS.includes(value as EntrustmentLevel);
}

/**
 * Progress status for an EPA enrollment.
 */
export type EPAProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'certified';

/**
 * All valid EPA progress statuses.
 */
export const EPA_PROGRESS_STATUSES: readonly EPAProgressStatus[] = [
  'not_started', 'in_progress', 'completed', 'certified'
] as const;

/**
 * Type guard for EPAProgressStatus.
 */
export function isEPAProgressStatus(value: string): value is EPAProgressStatus {
  return EPA_PROGRESS_STATUSES.includes(value as EPAProgressStatus);
}

/**
 * Activity types for KSB completion.
 */
export type ActivityType = 'red_pen' | 'triage' | 'synthesis' | 'assessment';

/**
 * All valid activity types.
 */
export const ACTIVITY_TYPES: readonly ActivityType[] = [
  'red_pen', 'triage', 'synthesis', 'assessment'
] as const;

/**
 * Type guard for ActivityType.
 */
export function isActivityType(value: string): value is ActivityType {
  return ACTIVITY_TYPES.includes(value as ActivityType);
}

/**
 * Difficulty level for pathways.
 */
export type PathwayDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * All valid pathway difficulties.
 */
export const PATHWAY_DIFFICULTIES: readonly PathwayDifficulty[] = [
  'beginner', 'intermediate', 'advanced', 'expert'
] as const;

/**
 * Type guard for PathwayDifficulty.
 */
export function isPathwayDifficulty(value: string): value is PathwayDifficulty {
  return PATHWAY_DIFFICULTIES.includes(value as PathwayDifficulty);
}

/**
 * Source of EPA enrollment.
 */
export type EnrollmentSource = 'catalog' | 'recommendation' | 'admin_assigned';

/**
 * All valid enrollment sources.
 */
export const ENROLLMENT_SOURCES: readonly EnrollmentSource[] = [
  'catalog', 'recommendation', 'admin_assigned'
] as const;

/**
 * Type guard for EnrollmentSource.
 */
export function isEnrollmentSource(value: string): value is EnrollmentSource {
  return ENROLLMENT_SOURCES.includes(value as EnrollmentSource);
}

// =============================================================================
// LEVEL MAPPINGS & LABELS
// =============================================================================

/**
 * Mapping between Proficiency and Entrustment levels.
 */
export const PROFICIENCY_ENTRUSTMENT_MAP: Readonly<Record<ProficiencyLevel, EntrustmentLevel>> = {
  'L1': 'observation',
  'L2': 'direct',
  'L3': 'indirect',
  'L4': 'remote',
  'L5': 'independent',
  'L5+': 'supervisor',
} as const;

/**
 * Human-readable labels for proficiency levels.
 */
export const PROFICIENCY_LABELS: Readonly<Record<ProficiencyLevel, string>> = {
  'L1': 'Foundational',
  'L2': 'Developing',
  'L3': 'Competent',
  'L4': 'Proficient',
  'L5': 'Expert',
  'L5+': 'Thought Leader',
} as const;

/**
 * Human-readable descriptions for entrustment levels.
 */
export const ENTRUSTMENT_DESCRIPTIONS: Readonly<Record<EntrustmentLevel, string>> = {
  'observation': 'Observation Only - Cannot perform independently',
  'direct': 'Direct Supervision - Supervisor present during activity',
  'indirect': 'Indirect Supervision - Supervisor available if needed',
  'remote': 'Remote Supervision - Retrospective review only',
  'independent': 'Independent Practice - Full autonomy',
  'supervisor': 'Can Supervise Others - Teaching capability',
} as const;

/**
 * Human-readable labels for activity types.
 */
export const ACTIVITY_TYPE_LABELS: Readonly<Record<ActivityType, string>> = {
  'red_pen': 'Red Pen Review',
  'triage': 'Triage Exercise',
  'synthesis': 'Synthesis Activity',
  'assessment': 'Formal Assessment',
} as const;

/**
 * Human-readable labels for pathway difficulties.
 */
export const DIFFICULTY_LABELS: Readonly<Record<PathwayDifficulty, string>> = {
  'beginner': 'Beginner',
  'intermediate': 'Intermediate',
  'advanced': 'Advanced',
  'expert': 'Expert',
} as const;

// =============================================================================
// EPA PATHWAY DEFINITION
// =============================================================================

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

/**
 * Creates empty KSB statistics.
 */
export function createEmptyKSBStats(): KSBStats {
  return { total: 0, knowledge: 0, skill: 0, behavior: 0 };
}

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

// =============================================================================
// USER EPA PROGRESS
// =============================================================================

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

// =============================================================================
// EPA CATALOG TYPES
// =============================================================================

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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the next proficiency level
 */
export function getNextProficiencyLevel(current: ProficiencyLevel): ProficiencyLevel | null {
  const levels: ProficiencyLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+'];
  const currentIndex = levels.indexOf(current);
  if (currentIndex === -1 || currentIndex >= levels.length - 1) {
    return null;
  }
  return levels[currentIndex + 1];
}

/**
 * Get proficiency level from entrustment level
 */
export function getProficiencyFromEntrustment(entrustment: EntrustmentLevel): ProficiencyLevel {
  const reverseMap: Record<EntrustmentLevel, ProficiencyLevel> = {
    'observation': 'L1',
    'direct': 'L2',
    'indirect': 'L3',
    'remote': 'L4',
    'independent': 'L5',
    'supervisor': 'L5+',
  };
  return reverseMap[entrustment];
}

/**
 * Calculate overall EPA progress percentage
 */
export function calculateEPAProgress(
  completedKSBs: number,
  totalKSBs: number
): number {
  if (totalKSBs === 0) return 0;
  return Math.round((completedKSBs / totalKSBs) * 100);
}

/**
 * Determine if user can advance to next level
 */
export function canAdvanceLevel(
  currentProgress: number,
  threshold: number = 80
): boolean {
  return currentProgress >= threshold;
}

/**
 * Get EPA tier from EPA number
 */
export function getEPATierFromNumber(epaNumber: number): EPATier {
  if (epaNumber >= 1 && epaNumber <= 10) return 'Core';
  if (epaNumber >= 11 && epaNumber <= 20) return 'Executive';
  if (epaNumber === 21) return 'Network';
  throw new Error(`Invalid EPA number: ${epaNumber}`);
}

/**
 * Format EPA ID from number
 */
export function formatEPAId(epaNumber: number): string {
  return `EPA-${String(epaNumber).padStart(2, '0')}`;
}

/**
 * Parse EPA number from ID
 */
export function parseEPANumber(epaId: string): number {
  const match = epaId.match(/EPA-(\d+)/);
  if (!match) throw new Error(`Invalid EPA ID format: ${epaId}`);
  return parseInt(match[1], 10);
}

// =============================================================================
// BRANDED TYPE HELPERS
// =============================================================================

/**
 * Create an EPAId from a string.
 * Use this to safely create branded EPA IDs.
 */
export function createEPAId(id: string): EPAId {
  return id as EPAId;
}

/**
 * Create a DomainId from a string.
 * Use this to safely create branded Domain IDs.
 */
export function createDomainId(id: string): DomainId {
  return id as DomainId;
}

/**
 * Create a readonly array of DomainIds from strings.
 * Helper for EPA_MASTER_LIST initialization.
 */
function domainIds(...ids: string[]): readonly DomainId[] {
  return ids.map(id => id as DomainId);
}

// =============================================================================
// EPA MASTER DATA
// =============================================================================

/**
 * EPA master list entry structure.
 *
 * @remarks
 * Lightweight definition for the static EPA master list,
 * containing essential information for each EPA.
 */
export interface EPAMasterListEntry {
  /** EPA identifier (EPA-01, etc.) */
  readonly id: EPAId;
  /** Full name */
  readonly name: string;
  /** Short display name */
  readonly shortName: string;
  /** EPA tier */
  readonly tier: EPATier;
  /** Primary domain IDs */
  readonly primaryDomains: readonly DomainId[];
  /** Guardian service port range */
  readonly portRange: string;
}

/**
 * Complete EPA master list with primary domains.
 * Source: Guardian EPA Service Matrix + Domain Overview
 *
 * @remarks
 * Static reference data for all 21 EPAs with their domain mappings
 * and Guardian service port assignments.
 */
export const EPA_MASTER_LIST: readonly EPAMasterListEntry[] = [
  // Core EPAs (1-10)
  { id: createEPAId('EPA-01'), name: 'Process and Evaluate Individual Case Safety Reports', shortName: 'Case Processing', tier: 'Core', primaryDomains: domainIds('D01', 'D03', 'D04', 'D06'), portRange: '3001-3003' },
  { id: createEPAId('EPA-02'), name: 'Perform Literature Screening and Evaluation', shortName: 'Literature Screening', tier: 'Core', primaryDomains: domainIds('D02', 'D03', 'D05', 'D07', 'D15'), portRange: '3004-3005' },
  { id: createEPAId('EPA-03'), name: 'Prepare and Present Safety Information', shortName: 'Safety Communication', tier: 'Core', primaryDomains: domainIds('D10', 'D14'), portRange: '3006-3008' },
  { id: createEPAId('EPA-04'), name: 'Conduct Post-Marketing Surveillance Data Analysis', shortName: 'Surveillance Analytics', tier: 'Core', primaryDomains: domainIds('D04', 'D05', 'D07', 'D08', 'D09'), portRange: '3009-3010' },
  { id: createEPAId('EPA-05'), name: 'Detect and Validate Potential Safety Signals', shortName: 'Signal Detection', tier: 'Core', primaryDomains: domainIds('D02', 'D03', 'D07', 'D08', 'D09'), portRange: '3011-3012' },
  { id: createEPAId('EPA-06'), name: 'Develop Safety Sections for Regulatory Documents', shortName: 'Regulatory Documents', tier: 'Core', primaryDomains: domainIds('D10', 'D11'), portRange: '3013-3015' },
  { id: createEPAId('EPA-07'), name: 'Design and Implement Risk Minimization Measures', shortName: 'Risk Minimization', tier: 'Core', primaryDomains: domainIds('D09', 'D12'), portRange: '3016-3017' },
  { id: createEPAId('EPA-08'), name: 'Lead Cross-Functional Safety Investigations', shortName: 'Safety Investigations', tier: 'Core', primaryDomains: domainIds('D08', 'D12', 'D13'), portRange: '3018-3019' },
  { id: createEPAId('EPA-09'), name: 'Ensure Pharmacovigilance Quality and Compliance', shortName: 'Quality & Compliance', tier: 'Core', primaryDomains: domainIds('D11', 'D13'), portRange: '3020-3022' },
  { id: createEPAId('EPA-10'), name: 'Implement and Validate AI/ML Tools', shortName: 'AI Gateway', tier: 'Core', primaryDomains: domainIds('D14', 'D15'), portRange: '3023-3024' },

  // Executive EPAs (11-20)
  { id: createEPAId('EPA-11'), name: 'Develop Global Pharmacovigilance Strategy', shortName: 'Global Strategy', tier: 'Executive', primaryDomains: domainIds('D11', 'D13'), portRange: '3025-3026' },
  { id: createEPAId('EPA-12'), name: 'Lead Digital Transformation Initiatives', shortName: 'Digital Transformation', tier: 'Executive', primaryDomains: domainIds('D14', 'D15'), portRange: '3027-3028' },
  { id: createEPAId('EPA-13'), name: 'Build and Lead High-Performing PV Teams', shortName: 'Team Leadership', tier: 'Executive', primaryDomains: domainIds('D13'), portRange: '3029-3030' },
  { id: createEPAId('EPA-14'), name: 'Shape Regulatory Policy and Standards', shortName: 'Regulatory Policy', tier: 'Executive', primaryDomains: domainIds('D11'), portRange: '3031-3032' },
  { id: createEPAId('EPA-15'), name: 'Advance Pharmacovigilance Science', shortName: 'PV Science', tier: 'Executive', primaryDomains: domainIds('D15'), portRange: '3033-3034' },
  { id: createEPAId('EPA-16'), name: 'Manage Safety Crisis Response', shortName: 'Crisis Response', tier: 'Executive', primaryDomains: domainIds('D08', 'D12'), portRange: '3035-3036' },
  { id: createEPAId('EPA-17'), name: 'Develop Future PV Leaders', shortName: 'Leader Development', tier: 'Executive', primaryDomains: domainIds('D13'), portRange: '3037-3038' },
  { id: createEPAId('EPA-18'), name: 'Foster External Partnerships', shortName: 'Partnerships', tier: 'Executive', primaryDomains: domainIds('D10', 'D11'), portRange: '3039-3040' },
  { id: createEPAId('EPA-19'), name: 'Navigate Public Perception of Drug Safety', shortName: 'Public Perception', tier: 'Executive', primaryDomains: domainIds('D10'), portRange: '3041-3042' },
  { id: createEPAId('EPA-20'), name: 'Drive Industry Transformation', shortName: 'Industry Transformation', tier: 'Executive', primaryDomains: domainIds('D14', 'D15'), portRange: '3043-3044' },

  // Network EPA (21)
  { id: createEPAId('EPA-21'), name: 'Network Intelligence and Federated Learning', shortName: 'Network Intelligence', tier: 'Network', primaryDomains: domainIds('D14', 'D15'), portRange: '3045-3046' },
];

/**
 * Priority EPA IDs for Phase 4 content generation.
 *
 * @remarks
 * These EPAs are prioritized for initial content development.
 */
export const PRIORITY_EPA_IDS: readonly EPAId[] = [
  createEPAId('EPA-01'),
  createEPAId('EPA-02'),
  createEPAId('EPA-03'),
  createEPAId('EPA-04'),
  createEPAId('EPA-05'),
];

/**
 * Type for priority EPA IDs.
 */
export type PriorityEPAId = (typeof PRIORITY_EPA_IDS)[number];

/**
 * Type guard for PriorityEPAId.
 */
export function isPriorityEPAId(value: string): value is PriorityEPAId {
  return PRIORITY_EPA_IDS.includes(value as EPAId);
}
