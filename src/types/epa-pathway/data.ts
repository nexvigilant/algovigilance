// ============================================================================
// EPA PATHWAY — MASTER DATA, HELPER FUNCTIONS, BRANDED TYPE CREATORS
// ============================================================================

import type {
  EPAId,
  DomainId,
  EPATier,
  ProficiencyLevel,
  EntrustmentLevel,
} from './types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get the next proficiency level */
export function getNextProficiencyLevel(current: ProficiencyLevel): ProficiencyLevel | null {
  const levels: ProficiencyLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+'];
  const currentIndex = levels.indexOf(current);
  if (currentIndex === -1 || currentIndex >= levels.length - 1) {
    return null;
  }
  return levels[currentIndex + 1];
}

/** Get proficiency level from entrustment level */
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

/** Calculate overall EPA progress percentage */
export function calculateEPAProgress(
  completedKSBs: number,
  totalKSBs: number
): number {
  if (totalKSBs === 0) return 0;
  return Math.round((completedKSBs / totalKSBs) * 100);
}

/** Determine if user can advance to next level */
export function canAdvanceLevel(
  currentProgress: number,
  threshold: number = 80
): boolean {
  return currentProgress >= threshold;
}

/** Get EPA tier from EPA number */
export function getEPATierFromNumber(epaNumber: number): EPATier {
  if (epaNumber >= 1 && epaNumber <= 10) return 'Core';
  if (epaNumber >= 11 && epaNumber <= 20) return 'Executive';
  if (epaNumber === 21) return 'Network';
  throw new Error(`Invalid EPA number: ${epaNumber}`);
}

/** Format EPA ID from number */
export function formatEPAId(epaNumber: number): string {
  return `EPA-${String(epaNumber).padStart(2, '0')}`;
}

/** Parse EPA number from ID */
export function parseEPANumber(epaId: string): number {
  const match = epaId.match(/EPA-(\d+)/);
  if (!match) throw new Error(`Invalid EPA ID format: ${epaId}`);
  return parseInt(match[1], 10);
}

// ============================================================================
// BRANDED TYPE HELPERS
// ============================================================================

/** Create an EPAId from a string. */
export function createEPAId(id: string): EPAId {
  return id as EPAId;
}

/** Create a DomainId from a string. */
export function createDomainId(id: string): DomainId {
  return id as DomainId;
}

/** Create a readonly array of DomainIds from strings. */
function domainIds(...ids: string[]): readonly DomainId[] {
  return ids.map(id => id as DomainId);
}

// ============================================================================
// EPA MASTER DATA
// ============================================================================

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

/** Type for priority EPA IDs. */
export type PriorityEPAId = (typeof PRIORITY_EPA_IDS)[number];

/** Type guard for PriorityEPAId. */
export function isPriorityEPAId(value: string): value is PriorityEPAId {
  return PRIORITY_EPA_IDS.includes(value as EPAId);
}
