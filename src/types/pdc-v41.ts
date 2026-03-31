/**
 * PDC v4.1 Type Definitions
 *
 * Type definitions for the Pharmacovigilance Development Continuum (PDC) v4.1 framework.
 * These types align with the Firestore schema defined in:
 * - /pdc_framework/domains/items/{id}
 * - /pdc_framework/epas/items/{id}
 * - /pdc_framework/cpas/items/{id}
 * - /pdc_framework/dag_metadata
 * - /ksb_library/{id}
 *
 * Reference: PDC Manual v4.1, December 2025
 */

import type { Timestamp } from 'firebase/firestore';

// =============================================================================
// SHARED TYPES
// =============================================================================

/**
 * Domain cluster identifiers
 */
export type DomainClusterId = 'foundational' | 'operational' | 'strategic' | 'integration';

/**
 * DAG layer (0-5)
 */
export type DAGLayer = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Proficiency level (1-5)
 */
export type ProficiencyLevelNumeric = 1 | 2 | 3 | 4 | 5;

/**
 * EPA tier classification
 */
export type EPATierV41 = 'Core' | 'Executive' | 'Advanced';

/**
 * CPA category classification
 */
export type CPACategoryV41 = 'Core' | 'Advanced' | 'Capstone';

/**
 * Career stage for CPAs
 */
export type CPACareerStageV41 = 'Foundation' | 'Foundation-Advanced' | 'Advanced' | 'Executive';

/**
 * KSB type codes
 */
export type KSBTypeCode = 'K' | 'S' | 'B' | 'A';

/**
 * KSB type names
 */
export type KSBTypeName = 'Knowledge' | 'Skill' | 'Behavior' | 'AI_Integration';

/**
 * KSB status workflow
 */
export type KSBStatusV41 = 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';

/**
 * Assessment tier (Knowledge → Intelligence → Expertise)
 */
export type AssessmentTier = 'Knowledge' | 'Intelligence' | 'Expertise';

// =============================================================================
// DOMAIN TYPES
// =============================================================================

/**
 * Domain cluster metadata
 */
export interface DomainCluster {
  id: DomainClusterId;
  number: 1 | 2 | 3 | 4;
  name: string;
}

/**
 * Domain DAG metadata
 */
export interface DomainDAG {
  layer: DAGLayer;
  prerequisites: string[];
  unlocks: string[];
  isSourceNode: boolean;
  isSinkNode: boolean;
  isCriticalPath: boolean;
  criticalPathOrder: number | null;
}

/**
 * Domain assessment weights by level
 */
export interface LevelAssessmentWeights {
  knowledge: number;
  intelligence: number;
  expertise: number;
}

/**
 * PDC v4.1 Domain
 * Firestore: /pdc_framework/domains/items/{id}
 */
export interface PDCDomainV41 {
  id: string; // 'D01' - 'D15'
  name: string;
  shortName: string;
  description: string;

  cluster: DomainCluster;

  dag: DomainDAG;

  coreKnowledge: Array<{
    component: string;
    aiIntegration?: string;
  }>;

  assessmentWeights: {
    L1: LevelAssessmentWeights;
    L2: LevelAssessmentWeights;
    L3: LevelAssessmentWeights;
    L4: LevelAssessmentWeights;
    L5: LevelAssessmentWeights;
  };

  programCoverage: {
    appe: { levelRange: string; weeks: string } | null;
    pcap: { rotations: string[]; levelRange: string } | null;
    smp: { focus: string; levelRange: string } | null;
  };

  version: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// =============================================================================
// EPA TYPES
// =============================================================================

/**
 * EPA domain requirement
 */
export interface EPADomainRequirement {
  domainId: string;
  minimumLevel: ProficiencyLevelNumeric;
  isPrimary: boolean;
}

/**
 * EPA DAG metadata
 */
export interface EPADAG {
  primaryLayer: number;
  requiredDomains: EPADomainRequirement[];
  enabledAtProgramStage:
    | 'APPE'
    | 'PCAP_R1-2'
    | 'PCAP_R3-4'
    | 'PCAP_R5-6'
    | 'PCAP_R7-8'
    | 'SMP';
}

/**
 * EPA entrustment level
 */
export interface EPAEntrustmentLevel {
  level: ProficiencyLevelNumeric;
  label: string;
  description: string;
  supervisionNeed: string;
  assessmentMethod: string;
}

/**
 * AI Gateway phase (for EPA-10 and EPA-21)
 */
export interface AIGatewayPhase {
  phase: 1 | 2 | 3 | 4 | 5;
  name: string;
  levelRange: string;
  capabilities: string[];
}

/**
 * AI Gateway metadata
 */
export interface AIGateway {
  isGateway: true;
  phases: AIGatewayPhase[];
  enablesCPA8: boolean;
}

/**
 * PDC v4.1 EPA
 * Firestore: /pdc_framework/epas/items/{id}
 */
export interface PDCEPAV41 {
  id: string; // 'EPA-01' - 'EPA-21'
  name: string;
  shortName: string;
  definition: string;

  tier: EPATierV41;
  tierNumber: 1 | 2 | 3;

  dag: EPADAG;

  competencyRequirements: {
    primary: Array<{ domainId: string; level: number }>;
    supporting: Array<{ domainId: string; level: number }>;
  };

  entrustmentLevels: EPAEntrustmentLevel[];

  aiGateway?: AIGateway;

  guardian?: {
    portRange: string;
    serviceEndpoints: string[];
  };

  version: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// =============================================================================
// CPA TYPES
// =============================================================================

/**
 * CPA DAG metadata
 */
export interface CPADAG {
  layers: number[];
  primaryDomains: string[];
  isFullDAGTraversal: boolean;
  alignedPCAPRotations: string[];
}

/**
 * CPA integration module
 */
export interface CPAIntegrationModule {
  id: string;
  name: string;
  domains: string[];
}

/**
 * CPA AI integration metadata
 */
export interface CPAAIIntegration {
  capabilities: string[];
  isAICapstone: boolean;
}

/**
 * CPA achievement criteria
 */
export interface CPAAchievementCriteria {
  level: string;
  requirements: string[];
}

/**
 * CPA success metric
 */
export interface CPASuccessMetric {
  metric: string;
  target: string;
}

/**
 * AI Gateway Capstone (for CPA-08)
 */
export interface AIGatewayCapstone {
  entryRequirements: string[];
  executionPhase: string[];
  masteryOutcomes: string[];
  roiTarget: string;
}

/**
 * PDC v4.1 CPA
 * Firestore: /pdc_framework/cpas/items/{id}
 */
export interface PDCCPAV41 {
  id: string; // 'CPA-01' - 'CPA-08'
  name: string;
  focusArea: string;
  definition: string;

  category: CPACategoryV41;
  careerStage: CPACareerStageV41;

  dag: CPADAG;

  keyEPAs: string[];

  integrationModule?: CPAIntegrationModule;

  aiIntegration: CPAAIIntegration;

  achievementCriteria: CPAAchievementCriteria;

  successMetrics: CPASuccessMetric[];

  aiGatewayCapstone?: AIGatewayCapstone;

  version: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// =============================================================================
// KSB TYPES
// =============================================================================

/**
 * KSB domain reference
 */
export interface KSBDomainRef {
  id: string;
  name: string;
  cluster: string;
  dagLayer: number;
}

/**
 * KSB content
 */
export interface KSBContent {
  statement: string;
  description: string;
  keywords: string[];
  aiAspect?: {
    description: string;
    tools: string[];
  };
}

/**
 * KSB framework alignment
 */
export interface KSBFramework {
  proficiencyLevel: ProficiencyLevelNumeric;
  bloomLevel: 1 | 2 | 3 | 4 | 5 | 6;
  bloomVerb: string;
  assessmentTier: AssessmentTier;
}

/**
 * KSB DAG metadata
 */
export interface KSBDAG {
  layer: DAGLayer;
  isCriticalPath: boolean;
  prerequisiteKSBs: string[];
  enablesKSBs: string[];
}

/**
 * KSB mappings
 *
 * Note: EPA-KSB relationships are derived through domain membership.
 * Use `getKSBsForEPA()` from `@/lib/pdc-queries` to get KSBs for an EPA.
 *
 * Hierarchy: KSB → Domain → EPA (via epa.dag.requiredDomains)
 */
export interface KSBMappings {
  cpas: string[];
}

/**
 * KSB behavioral anchor
 */
export interface KSBAnchor {
  level: ProficiencyLevelNumeric;
  label: string;
  behavior: string;
  evidence: string[];
  assessment: string;
  supervisionRequired: string;
}

/**
 * KSB metadata
 */
export interface KSBMetadata {
  version: string;
  status: KSBStatusV41;
  source: {
    document: string;
    section: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Timestamp;
}

/**
 * PDC v4.1 KSB
 * Firestore: /ksb_library/{id}
 */
export interface PDCKSBV41 {
  id: string; // 'K-D01-001', 'S-D05-042', etc.
  code: string;
  type: KSBTypeName;
  typeCode: KSBTypeCode;

  domain: KSBDomainRef;
  content: KSBContent;
  framework: KSBFramework;
  dag: KSBDAG;
  mappings: KSBMappings;
  anchors: KSBAnchor[];
  metadata: KSBMetadata;
}

// =============================================================================
// DAG METADATA TYPES
// =============================================================================

/**
 * DAG critical path
 */
export interface DAGCriticalPath {
  nodes: string[];
  totalDuration: number;
  description: string;
}

/**
 * AI Gateway progression metadata
 */
export interface DAGAIGateway {
  entry: string;
  capstone: string;
  leadership: string;
  progression: string[];
}

/**
 * Program metadata
 */
export interface DAGPrograms {
  appe: {
    duration: string;
    levelRange: string;
    focusDomains: string[];
    dagLayers: number[];
  };
  pcap: {
    duration: string;
    rotations: number;
    levelRange: string;
    criticalPathTraversal: boolean;
  };
  smp: {
    levelRange: string;
    focusDomains: string[];
    capstone: string;
  };
}

/**
 * Cluster metadata
 */
export interface DAGClusterInfo {
  number: number;
  name: string;
  domains: string[];
  dagLayers: number[];
}

/**
 * Integration module
 */
export interface DAGIntegrationModule {
  id: string;
  name: string;
  domains: string[];
  dagLayers: number[];
  timeline: string;
  keyEPAs: string[];
}

/**
 * PDC v4.1 DAG Metadata
 * Firestore: /pdc_framework/dag_metadata
 */
export interface PDCDAGMetadataV41 {
  version: string;
  layers: Record<number, string[]>;
  criticalPath: DAGCriticalPath;
  aiGateway: DAGAIGateway;
  programs: DAGPrograms;
  clusters: Record<string, DAGClusterInfo>;
  integrationModules: DAGIntegrationModule[];
  updatedAt: Timestamp;
}

// =============================================================================
// HELPER CONSTANTS
// =============================================================================

/**
 * Domain ID to cluster mapping
 */
export const DOMAIN_CLUSTERS: Record<string, DomainClusterId> = {
  D01: 'foundational',
  D02: 'foundational',
  D03: 'foundational',
  D04: 'foundational',
  D05: 'operational',
  D06: 'operational',
  D07: 'operational',
  D08: 'operational',
  D09: 'strategic',
  D10: 'strategic',
  D11: 'strategic',
  D12: 'strategic',
  D13: 'integration',
  D14: 'integration',
  D15: 'integration',
};

/**
 * Domain ID to DAG layer mapping
 */
export const DOMAIN_DAG_LAYERS: Record<string, DAGLayer> = {
  D01: 0,
  D02: 1,
  D03: 1,
  D04: 1,
  D05: 2,
  D06: 2,
  D07: 2,
  D08: 3,
  D09: 3,
  D10: 4,
  D11: 4,
  D12: 5,
  D13: 4,
  D14: 1,
  D15: 5,
};

/**
 * Critical path domains in order
 */
export const CRITICAL_PATH: string[] = ['D01', 'D04', 'D08', 'D10', 'D12', 'D15'];

/**
 * EPA tier mapping
 */
export const EPA_TIERS: Record<string, EPATierV41> = {
  'EPA-01': 'Core',
  'EPA-02': 'Core',
  'EPA-03': 'Core',
  'EPA-04': 'Core',
  'EPA-05': 'Core',
  'EPA-06': 'Core',
  'EPA-07': 'Core',
  'EPA-08': 'Core',
  'EPA-09': 'Core',
  'EPA-10': 'Core',
  'EPA-11': 'Executive',
  'EPA-12': 'Executive',
  'EPA-13': 'Executive',
  'EPA-14': 'Executive',
  'EPA-15': 'Executive',
  'EPA-16': 'Executive',
  'EPA-17': 'Executive',
  'EPA-18': 'Executive',
  'EPA-19': 'Executive',
  'EPA-20': 'Executive',
  'EPA-21': 'Advanced',
};

/**
 * CPA category mapping
 */
export const CPA_CATEGORIES: Record<string, CPACategoryV41> = {
  'CPA-01': 'Core',
  'CPA-02': 'Core',
  'CPA-03': 'Core',
  'CPA-04': 'Core',
  'CPA-05': 'Advanced',
  'CPA-06': 'Advanced',
  'CPA-07': 'Advanced',
  'CPA-08': 'Capstone',
};

/**
 * Bloom's taxonomy level to verb mapping
 */
export const BLOOM_VERBS: Record<number, string> = {
  1: 'Remember',
  2: 'Understand',
  3: 'Apply',
  4: 'Analyze',
  5: 'Evaluate',
  6: 'Create',
};

/**
 * Get assessment tier from proficiency level
 */
export function getAssessmentTier(level: number): AssessmentTier {
  if (level <= 2) return 'Knowledge';
  if (level <= 3) return 'Intelligence';
  return 'Expertise';
}

/**
 * Get domain cluster from domain ID
 */
export function getDomainCluster(domainId: string): DomainClusterId {
  return DOMAIN_CLUSTERS[domainId] || 'foundational';
}

/**
 * Get domain DAG layer from domain ID
 */
export function getDomainDAGLayer(domainId: string): DAGLayer {
  return DOMAIN_DAG_LAYERS[domainId] ?? 0;
}

/**
 * Check if domain is on critical path
 */
export function isOnCriticalPath(domainId: string): boolean {
  return CRITICAL_PATH.includes(domainId);
}

/**
 * Get EPA tier from EPA ID
 */
export function getEPATier(epaId: string): EPATierV41 {
  return EPA_TIERS[epaId] || 'Core';
}

/**
 * Get CPA category from CPA ID
 */
export function getCPACategory(cpaId: string): CPACategoryV41 {
  return CPA_CATEGORIES[cpaId] || 'Core';
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Check if value is a valid DAG layer
 */
export function isDAGLayer(value: number): value is DAGLayer {
  return [0, 1, 2, 3, 4, 5].includes(value);
}

/**
 * Check if value is a valid proficiency level
 */
export function isProficiencyLevel(value: number): value is ProficiencyLevelNumeric {
  return [1, 2, 3, 4, 5].includes(value);
}

/**
 * Check if value is a valid KSB type code
 */
export function isKSBTypeCode(value: string): value is KSBTypeCode {
  return ['K', 'S', 'B', 'A'].includes(value);
}
