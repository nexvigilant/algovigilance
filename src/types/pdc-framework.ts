/**
 * PDC Framework Types
 *
 * Type definitions for the Pharmacovigilance Development Continuum (PDC) framework.
 * Hierarchy: CPA > EPA > Domain > KSB
 *
 * CPAs (Career Practice Activities) are the top-level organizational unit,
 * grouping related EPAs that contribute to professional career progression.
 *
 * Reference: PDC Manual Chapters 4-6
 */

import type {
  ProficiencyLevel,
  EPATier,
  EPAStatus,
  FirestoreTimestamp,
} from './epa-pathway';

// =============================================================================
// CPA CORE TYPES
// =============================================================================

/**
 * CPA Status for publishing workflow
 */
export type CPAStatus = 'draft' | 'published' | 'archived';

/**
 * Career stages that CPAs target
 */
export type CPACareerStage =
  | 'Foundation'
  | 'Foundation-Advanced'
  | 'Advanced'
  | 'Advanced-Executive'
  | 'Executive';

/**
 * CPA proficiency level description
 */
export interface CPAProficiencyLevel {
  title: string;
  description: string;
  scope?: string;
  keyCapability?: string;
  supervision?: string;
}

/**
 * CPA cached statistics
 */
export interface CPAStats {
  epaCount: number;
  domainCount: number;
  ksbCount: number;
  contentCoverage: number; // 0-100 percentage
}

/**
 * Source reference for Google Sheet provenance tracking
 */
export interface SourceReference {
  sheetId: string;
  sheetName: string;
  rowNumber?: number;
  lastSynced: FirestoreTimestamp;
}

// =============================================================================
// CPA ENTITY
// =============================================================================

/**
 * Career Practice Activity (CPA)
 * Top-level organizational unit in PDC hierarchy
 * Firestore: /cpas/{cpaId}
 */
export interface CPA {
  // Identity
  id: string;                         // "CPA-01", "CPA-02", etc.
  name: string;                       // "Case Management Activities"
  focusArea: string;                  // "Case Management"
  summary: string;                    // Full description

  // Career context
  careerStage: CPACareerStage;        // "Foundation-Advanced"
  aiIntegration: string;              // AI capabilities description

  // Relationships
  primaryDomains: string[];           // ["D02", "D03", "D04"]
  supportingDomains?: string[];
  keyEPAs: string[];                  // ["EPA-01", "EPA-02", "EPA-03"]
  supportingEPAs?: string[];

  // Proficiency framework
  proficiencyLevels?: Record<ProficiencyLevel, CPAProficiencyLevel>;
  behavioralAnchors?: Record<ProficiencyLevel, string[]>;
  successMetrics?: string[];
  developmentPathway?: string[];

  // Educational content
  educationalPhilosophy?: string;
  implementationPhase?: string;

  // Status & ordering
  status: CPAStatus;
  order: number;                      // 1-8 for display ordering

  // Cached statistics
  stats: CPAStats;

  // Timestamps
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  publishedAt?: FirestoreTimestamp;

  // Provenance tracking
  sourceRef?: SourceReference;
}

/**
 * CPA Catalog Card (lightweight for listing views)
 */
export interface CPACatalogCard {
  id: string;
  name: string;
  focusArea: string;
  careerStage: CPACareerStage;
  keyEPAs: string[];
  stats: CPAStats;
  status: CPAStatus;

  // User-specific (if logged in)
  userProgress?: {
    epaProgress: number;              // 0-100 aggregate EPA progress
    ksbsCompleted: number;
    totalKsbs: number;
    status: 'not_started' | 'in_progress' | 'completed';
  };
}

// =============================================================================
// PDC HIERARCHY TYPES (for tree display)
// =============================================================================

/**
 * Hierarchical KSB for tree display
 */
export interface PDCHierarchyKSB {
  id: string;
  name: string;
  type: 'knowledge' | 'skill' | 'behavior';
  status: string;
  proficiencyLevel?: ProficiencyLevel;
  hasContent: boolean;
}

/**
 * Hierarchical Domain for tree display
 */
export interface PDCHierarchyDomain {
  id: string;
  name: string;
  cluster: string;
  clusterName: string;
  stats: {
    total: number;
    knowledge: number;
    skill: number;
    behavior: number;
    published: number;
    draft: number;
  };
  ksbs?: PDCHierarchyKSB[];           // Lazy loaded on expand
}

/**
 * Hierarchical EPA for tree display
 */
export interface PDCHierarchyEPA {
  id: string;
  name: string;
  shortName: string;
  tier: EPATier;
  epaNumber: number;
  status: EPAStatus;
  domains: PDCHierarchyDomain[];
  stats: {
    domainCount: number;
    ksbCount: number;
    contentCoverage: number;
  };
}

/**
 * Hierarchical CPA for tree display
 */
export interface PDCHierarchyCPA {
  id: string;
  name: string;
  focusArea: string;
  careerStage: CPACareerStage;
  order: number;
  status: CPAStatus;
  epas: PDCHierarchyEPA[];
  stats: CPAStats;
}

/**
 * Complete PDC Hierarchy for tree display
 */
export interface PDCHierarchy {
  cpas: PDCHierarchyCPA[];
  orphanEPAs: PDCHierarchyEPA[];      // EPAs not linked to any CPA
  orphanDomains: PDCHierarchyDomain[]; // Domains not linked to any EPA
  stats: {
    totalCPAs: number;
    totalEPAs: number;
    totalDomains: number;
    totalKSBs: number;
    contentCoverage: number;          // 0-100 overall
  };
}

// =============================================================================
// USER CPA PROGRESS
// =============================================================================

/**
 * User CPA Progress
 * Firestore: /users/{userId}/cpa_progress/{cpaId}
 */
export interface UserCPAProgress {
  userId: string;
  cpaId: string;
  status: 'not_started' | 'in_progress' | 'completed';

  // EPA progress within CPA
  epaProgress: Record<string, {
    status: string;
    currentLevel: ProficiencyLevel;
    progressPercent: number;
  }>;

  // Aggregate statistics
  overallProgress: number;            // 0-100
  ksbsCompleted: number;
  totalKsbs: number;

  // Timestamps
  enrolledAt: FirestoreTimestamp;
  lastActivityAt: FirestoreTimestamp;
  completedAt?: FirestoreTimestamp;
}

// =============================================================================
// IMPORT TYPES
// =============================================================================

/**
 * Configuration for importing from Google Sheet
 */
export interface PDCImportConfig {
  sheetId: string;
  sheets: {
    cpas: string;                     // Sheet name for CPA data
    cpaEpaMapping?: string;           // Sheet for CPA-EPA relationships
    cpaDomainMapping?: string;        // Sheet for CPA-Domain relationships
    epas?: string;                    // Sheet for EPA data (optional enrichment)
    domains?: string;                 // Sheet for Domain data (optional enrichment)
  };
  options: {
    overwriteExisting: boolean;
    validateRelationships: boolean;
    dryRun: boolean;
  };
}

/**
 * Import operation result
 */
export interface PDCImportResult {
  success: boolean;
  stats: {
    cpas: { created: number; updated: number; skipped: number; errors: number };
    epas: { created: number; updated: number; skipped: number; errors: number };
    domains: { created: number; updated: number; skipped: number; errors: number };
  };
  errors: Array<{
    entity: 'CPA' | 'EPA' | 'Domain';
    id: string;
    message: string;
    row?: number;
  }>;
  warnings: Array<{
    entity: 'CPA' | 'EPA' | 'Domain';
    id: string;
    message: string;
  }>;
  duration: number;                   // ms
}

/**
 * Import log entry
 * Firestore: /pdc_import_logs/{logId}
 */
export interface PDCImportLog {
  id: string;
  importType: 'full' | 'cpas_only' | 'epas_only' | 'domains_only' | 'relationships';
  sourceSheetId: string;
  sourceSheetName: string;
  config: PDCImportConfig;
  result: PDCImportResult;
  initiatedBy: string;                // User ID
  startedAt: FirestoreTimestamp;
  completedAt: FirestoreTimestamp;
  notes?: string;
}

// =============================================================================
// COVERAGE & QUALITY TYPES
// =============================================================================

/**
 * CPA x Domain coverage matrix entry
 */
export interface CoverageMatrixEntry {
  cpaId: string;
  domainId: string;
  relationship: 'primary' | 'supporting' | 'none';
  ksbCount: number;
  publishedCount: number;
  coveragePercent: number;
}

/**
 * Gap analysis result
 */
export interface GapAnalysisResult {
  missingContent: Array<{
    cpaId: string;
    epaId: string;
    domainId: string;
    ksbsMissing: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
  orphanedContent: Array<{
    type: 'EPA' | 'Domain' | 'KSB';
    id: string;
    name: string;
    reason: string;
  }>;
  recommendations: string[];
}

// =============================================================================
// HELPER CONSTANTS
// =============================================================================

/**
 * CPA order mapping
 */
export const CPA_ORDER: Record<string, number> = {
  'CPA-01': 1,
  'CPA-02': 2,
  'CPA-03': 3,
  'CPA-04': 4,
  'CPA-05': 5,
  'CPA-06': 6,
  'CPA-07': 7,
  'CPA-08': 8,
} as const;

/**
 * Human-readable CPA career stage labels
 */
export const CAREER_STAGE_LABELS: Record<CPACareerStage, string> = {
  'Foundation': 'Foundation Level',
  'Foundation-Advanced': 'Foundation to Advanced',
  'Advanced': 'Advanced Practice',
  'Advanced-Executive': 'Advanced to Executive',
  'Executive': 'Executive Leadership',
} as const;

/**
 * Career stage colors for UI
 */
export const CAREER_STAGE_COLORS: Record<CPACareerStage, { bg: string; text: string; border: string }> = {
  'Foundation': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Foundation-Advanced': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'Advanced': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  'Advanced-Executive': { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  'Executive': { bg: 'bg-gold/20', text: 'text-gold', border: 'border-gold/30' },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format CPA ID from number
 */
export function formatCPAId(cpaNumber: number): string {
  return `CPA-${String(cpaNumber).padStart(2, '0')}`;
}

/**
 * Parse CPA number from ID
 */
export function parseCPANumber(cpaId: string): number {
  const match = cpaId.match(/CPA-(\d+)/);
  if (!match) throw new Error(`Invalid CPA ID format: ${cpaId}`);
  return parseInt(match[1], 10);
}

/**
 * Get CPA order from ID
 */
export function getCPAOrder(cpaId: string): number {
  return CPA_ORDER[cpaId] ?? 99;
}

/**
 * Sort CPAs by order
 */
export function sortCPAsByOrder<T extends { id: string }>(cpas: T[]): T[] {
  return [...cpas].sort((a, b) => getCPAOrder(a.id) - getCPAOrder(b.id));
}

/**
 * Calculate aggregate CPA progress from EPA progress
 */
export function calculateCPAProgress(
  epaProgress: Record<string, { progressPercent: number }>
): number {
  const values = Object.values(epaProgress);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, ep) => acc + ep.progressPercent, 0);
  return Math.round(sum / values.length);
}

/**
 * Determine CPA status from EPA progress
 */
export function determineCPAStatus(
  epaProgress: Record<string, { status: string; progressPercent: number }>
): 'not_started' | 'in_progress' | 'completed' {
  const values = Object.values(epaProgress);
  if (values.length === 0) return 'not_started';

  const allCompleted = values.every(ep => ep.status === 'completed' || ep.status === 'certified');
  if (allCompleted) return 'completed';

  const anyStarted = values.some(ep => ep.progressPercent > 0 || ep.status !== 'not_started');
  return anyStarted ? 'in_progress' : 'not_started';
}

// =============================================================================
// CPA MASTER DATA
// =============================================================================

/**
 * Complete CPA master list
 * Source: PDC Manual Chapter 6
 */
export const CPA_MASTER_LIST: Array<{
  id: string;
  name: string;
  focusArea: string;
  careerStage: CPACareerStage;
  keyEPAs: string[];
  primaryDomains: string[];
}> = [
  {
    id: 'CPA-01',
    name: 'Case Management Activities',
    focusArea: 'Case Management',
    careerStage: 'Foundation-Advanced',
    keyEPAs: ['EPA-01', 'EPA-02', 'EPA-03'],
    primaryDomains: ['D02', 'D03', 'D04', 'D06'],
  },
  {
    id: 'CPA-02',
    name: 'Signal Detection and Evaluation Activities',
    focusArea: 'Signal Detection',
    careerStage: 'Advanced',
    keyEPAs: ['EPA-04', 'EPA-05', 'EPA-08'],
    primaryDomains: ['D05', 'D07', 'D08', 'D09'],
  },
  {
    id: 'CPA-03',
    name: 'Risk Management and Minimization Activities',
    focusArea: 'Risk Management',
    careerStage: 'Advanced',
    keyEPAs: ['EPA-06', 'EPA-07', 'EPA-09'],
    primaryDomains: ['D09', 'D10', 'D11', 'D12'],
  },
  {
    id: 'CPA-04',
    name: 'Regulatory Intelligence and Compliance Activities',
    focusArea: 'Regulatory Compliance',
    careerStage: 'Advanced-Executive',
    keyEPAs: ['EPA-09', 'EPA-14'],
    primaryDomains: ['D11', 'D12', 'D13'],
  },
  {
    id: 'CPA-05',
    name: 'Safety Communication and Stakeholder Engagement',
    focusArea: 'Safety Communication',
    careerStage: 'Advanced-Executive',
    keyEPAs: ['EPA-03', 'EPA-18', 'EPA-19'],
    primaryDomains: ['D10', 'D14'],
  },
  {
    id: 'CPA-06',
    name: 'Strategic Leadership and Organizational Development',
    focusArea: 'Leadership',
    careerStage: 'Executive',
    keyEPAs: ['EPA-11', 'EPA-13', 'EPA-17'],
    primaryDomains: ['D11', 'D13'],
  },
  {
    id: 'CPA-07',
    name: 'Pharmacovigilance Science and Innovation',
    focusArea: 'PV Science',
    careerStage: 'Executive',
    keyEPAs: ['EPA-12', 'EPA-15', 'EPA-20'],
    primaryDomains: ['D14', 'D15'],
  },
  {
    id: 'CPA-08',
    name: 'AI-Enhanced Pharmacovigilance Activities',
    focusArea: 'AI Integration',
    careerStage: 'Executive',
    keyEPAs: ['EPA-10', 'EPA-12', 'EPA-21'],
    primaryDomains: ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15'],
  },
];
