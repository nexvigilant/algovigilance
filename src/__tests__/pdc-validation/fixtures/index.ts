/**
 * PDC Validation Test Fixtures
 *
 * Provides valid and invalid data samples for testing validators.
 * Each fixture includes edge cases, boundary conditions, and error scenarios.
 */

import type {
  EPA,
  CPA,
  Domain,
  EPADomainMapping,
  CPAEPAMapping,
  KSB,
  ActivityAnchor,
  PDCData,
} from '../../../../scripts/validation/content-validation/types';

// =============================================================================
// VALID FIXTURES
// =============================================================================

export const validEPAs: EPA[] = [
  {
    id: 'EPA-01',
    name: 'Process and Evaluate ICSRs',
    focusArea: 'Case Processing',
    tier: 'Core',
    description:
      'Independently process and evaluate individual adverse event reports from receipt through regulatory submission, ensuring accuracy, completeness, and compliance with global requirements.',
    portRange: '3001-3003',
  },
  {
    id: 'EPA-10',
    name: 'AI-Augmented Signal Analysis',
    focusArea: 'AI Integration',
    tier: 'Core',
    description:
      'Apply artificial intelligence and machine learning tools to enhance pharmacovigilance workflows, signal detection, and safety analysis while maintaining human oversight.',
    portRange: '3028-3030',
  },
  {
    id: 'EPA-21',
    name: 'Network Intelligence',
    focusArea: 'AI Network',
    tier: 'Advanced',
    description:
      'Federated learning, social signal ingestion, cross-client AI integration for advanced pharmacovigilance intelligence.',
    portRange: '3061-3063',
  },
];

export const validCPAs: CPA[] = [
  {
    id: 'CPA-1',
    name: 'Case Management Activities',
    focusArea: 'Operational Excellence',
    primaryIntegration: 'Process + AI',
    careerStage: 'Foundation-Advanced',
    executiveSummary:
      'Comprehensive mastery of ICSR processing with AI-enhanced efficiency and quality assurance capabilities.',
    aiIntegration:
      'AI-assisted case triage, duplicate detection, and coding suggestions with human validation.',
    keyEPAs: ['EPA-01', 'EPA-10'],
  },
  {
    id: 'CPA-8',
    name: 'Strategic PV Leadership',
    focusArea: 'Executive Leadership',
    primaryIntegration: 'Strategy + All Domains',
    careerStage: 'Executive',
    executiveSummary:
      'Executive-level pharmacovigilance leadership integrating all competency areas for organizational excellence.',
    aiIntegration:
      'AI-driven strategic decision support and organizational intelligence.',
    keyEPAs: ['EPA-10', 'EPA-21'],
    prerequisite: 'EPA-10 L4+',
  },
];

export const validDomains: Domain[] = [
  {
    id: 'D01',
    name: 'Foundations of Pharmacovigilance in the AI Era',
    thematicCluster: 1,
    clusterName: 'Foundational Domains',
    definition:
      'Understanding of the historical context, public health importance, and basic concepts of pharmacovigilance, integrating traditional principles with emerging AI applications.',
    totalKSBs: 52,
    hasAssessment: true,
  },
  {
    id: 'D08',
    name: 'Signal Detection and Management Using AI',
    thematicCluster: 2,
    clusterName: 'Process and Methodology Domains',
    definition:
      'Statistical methodologies and AI-enhanced approaches for identifying, validating, and managing safety signals from multiple data sources.',
    totalKSBs: 92,
    hasAssessment: true,
  },
  {
    id: 'D15',
    name: 'Leadership and Professional Development',
    thematicCluster: 4,
    clusterName: 'Integration and Communication Domains',
    definition:
      'Strategic leadership capabilities and professional development for pharmacovigilance excellence.',
    totalKSBs: 60,
    hasAssessment: true,
  },
];

export const validEPADomainMappings: EPADomainMapping[] = [
  { epaId: 'EPA-01', domainId: 'D01', role: 'Primary', level: 'L3' },
  { epaId: 'EPA-01', domainId: 'D08', role: 'Supporting', level: 'L2' },
  { epaId: 'EPA-10', domainId: 'D08', role: 'Primary', level: 'L4' },
  { epaId: 'EPA-21', domainId: 'D08', role: 'Primary', level: 'L5++' },
  { epaId: 'EPA-21', domainId: 'D15', role: 'Supporting', level: 'L5+' },
];

export const validCPAEPAMappings: CPAEPAMapping[] = [
  { cpaId: 'CPA-1', epaId: 'EPA-01', relationship: 'Core' },
  { cpaId: 'CPA-1', epaId: 'EPA-10', relationship: 'Core' },
  { cpaId: 'CPA-8', epaId: 'EPA-10', relationship: 'Gateway' },
  { cpaId: 'CPA-8', epaId: 'EPA-21', relationship: 'Advanced' },
];

export const validKSBs: KSB[] = [
  {
    id: 'KSB-D01-K0001',
    domainId: 'D01',
    type: 'Knowledge',
    majorSection: 'Historical Context',
    section: 'Evolution of PV',
    itemName: 'Thalidomide Tragedy Understanding',
    itemDescription:
      'Comprehensive understanding of the thalidomide tragedy and its impact on modern pharmacovigilance.',
    proficiencyLevel: 'L1',
    bloomLevel: 'Remember',
    keywords: ['thalidomide', 'history', 'birth defects'],
    epaIds: ['EPA-01'],
    cpaIds: ['CPA-1'],
    regulatoryRefs: ['ICH E2A'],
    status: 'active',
  },
  {
    id: 'KSB-D08-S0001',
    domainId: 'D08',
    type: 'Skill',
    majorSection: 'Signal Detection',
    section: 'Statistical Methods',
    itemName: 'PRR Calculation',
    itemDescription:
      'Apply Proportional Reporting Ratio calculations to identify potential safety signals from spontaneous reporting data.',
    proficiencyLevel: 'L3',
    bloomLevel: 'Apply',
    keywords: ['PRR', 'disproportionality', 'signal detection'],
    epaIds: ['EPA-01', 'EPA-10'],
    cpaIds: ['CPA-1', 'CPA-8'],
    regulatoryRefs: ['ICH E2E', 'FDA Guidance'],
    status: 'active',
  },
];

export const validActivityAnchors: ActivityAnchor[] = [
  {
    domainId: 'D01',
    proficiencyLevel: 'L1',
    levelName: 'Novice',
    anchorNumber: 1,
    activityDescription:
      'Identify the key milestones in pharmacovigilance history.',
    observableBehaviors:
      'Lists major regulatory events chronologically with basic accuracy.',
    evidenceTypes: ['written assessment', 'oral presentation'],
  },
  {
    domainId: 'D08',
    proficiencyLevel: 'L4',
    levelName: 'Proficient',
    anchorNumber: 1,
    activityDescription:
      'Design and execute a signal detection strategy for a novel therapeutic.',
    observableBehaviors:
      'Independently selects appropriate statistical methods and interprets results with clinical context.',
    evidenceTypes: ['case study', 'peer review', 'portfolio evidence'],
  },
];

// =============================================================================
// INVALID FIXTURES (for error testing)
// =============================================================================

export const invalidEPAs = {
  badIdFormat: {
    id: 'epa1', // Should be EPA-XX
    name: 'Test EPA',
    focusArea: 'Test',
    tier: 'Core',
    description: 'Test description',
    portRange: '3001-3003',
  },
  missingName: {
    id: 'EPA-99',
    name: '', // Empty name
    focusArea: 'Test',
    tier: 'Core',
    description: 'Test description',
    portRange: '3001-3003',
  },
  invalidTier: {
    id: 'EPA-99',
    name: 'Test EPA',
    focusArea: 'Test',
    tier: 'SuperAdvanced' as 'Core', // Invalid tier
    description: 'Test description',
    portRange: '3001-3003',
  },
  shortDescription: {
    id: 'EPA-99',
    name: 'Test EPA',
    focusArea: 'Test',
    tier: 'Core',
    description: 'Too short', // Below MIN_DESCRIPTION_LENGTH
    portRange: '3001-3003',
  },
};

export const invalidDomains = {
  badIdFormat: {
    id: 'Domain1', // Should be DXX
    name: 'Test Domain',
    thematicCluster: 1,
    clusterName: 'Test',
    definition: 'Test definition for this domain.',
    totalKSBs: 50,
    hasAssessment: true,
  },
  invalidCluster: {
    id: 'D99',
    name: 'Test Domain',
    thematicCluster: 10, // Should be 1-4
    clusterName: 'Test',
    definition: 'Test definition for this domain.',
    totalKSBs: 50,
    hasAssessment: true,
  },
  negativeTotalKSBs: {
    id: 'D99',
    name: 'Test Domain',
    thematicCluster: 1,
    clusterName: 'Test',
    definition: 'Test definition for this domain.',
    totalKSBs: -5, // Negative count
    hasAssessment: true,
  },
};

export const invalidMappings = {
  orphanEPA: {
    epaId: 'EPA-99', // Doesn't exist
    domainId: 'D01',
    role: 'Primary',
    level: 'L3',
  },
  orphanDomain: {
    epaId: 'EPA-01',
    domainId: 'D99', // Doesn't exist
    role: 'Primary',
    level: 'L3',
  },
  invalidRole: {
    epaId: 'EPA-01',
    domainId: 'D01',
    role: 'Main', // Should be Primary or Supporting
    level: 'L3',
  },
  invalidLevel: {
    epaId: 'EPA-01',
    domainId: 'D01',
    role: 'Primary',
    level: 'L10', // Invalid level
  },
};

// =============================================================================
// COMPLETE VALID DATASET
// =============================================================================

export const validPDCData: PDCData = {
  epas: validEPAs,
  cpas: validCPAs,
  domains: validDomains,
  epaDomainMappings: validEPADomainMappings,
  cpaEpaMappings: validCPAEPAMappings,
  cpaDomainMappings: [],
  ksbs: validKSBs,
  activityAnchors: validActivityAnchors,
  metadata: {
    version: '4.1',
    exportedAt: new Date().toISOString(),
  },
};

// =============================================================================
// EDGE CASES
// =============================================================================

export const edgeCases = {
  // Empty arrays (should pass schema, fail completeness)
  emptyData: {
    epas: [],
    cpas: [],
    domains: [],
    epaDomainMappings: [],
    cpaEpaMappings: [],
    cpaDomainMappings: [],
    ksbs: [],
    activityAnchors: [],
    metadata: { version: '4.1', exportedAt: new Date().toISOString() },
  } as PDCData,

  // Duplicate IDs
  duplicateEPAIds: [
    { ...validEPAs[0] },
    { ...validEPAs[0] }, // Same ID
  ],

  // Circular reference (CPA references EPA that references back)
  // This tests DAG validation

  // Maximum values
  maxDomainsPerEPA: 15, // All domains mapped
  maxEPAsPerCPA: 21, // All EPAs mapped

  // Boundary proficiency levels
  boundaryLevels: ['L1', 'L5++'],
};

// =============================================================================
// DAG STRUCTURE FIXTURES
// =============================================================================

export const dagStructure = {
  // Critical path: D01→D04→D08→D10→D12→D15
  criticalPath: ['D01', 'D04', 'D08', 'D10', 'D12', 'D15'],

  // Layer assignments
  layers: {
    0: ['D01', 'D02', 'D03'], // Source nodes
    1: ['D04', 'D07'],
    2: ['D05', 'D06'],
    3: ['D08'],
    4: ['D09', 'D10', 'D11'],
    5: ['D12', 'D13', 'D14'],
    6: ['D15'], // Sink node
  },

  // Dependencies (prerequisite → dependent)
  dependencies: [
    { from: 'D01', to: 'D04' },
    { from: 'D02', to: 'D04' },
    { from: 'D01', to: 'D07' },
    { from: 'D04', to: 'D05' },
    { from: 'D04', to: 'D06' },
    { from: 'D04', to: 'D08' },
    { from: 'D07', to: 'D08' },
    { from: 'D08', to: 'D09' },
    { from: 'D08', to: 'D10' },
    { from: 'D03', to: 'D10' },
    { from: 'D08', to: 'D13' },
    { from: 'D05', to: 'D09' },
    { from: 'D09', to: 'D11' },
    { from: 'D10', to: 'D11' },
    { from: 'D10', to: 'D12' },
    { from: 'D11', to: 'D12' },
    { from: 'D12', to: 'D14' },
    { from: 'D13', to: 'D14' },
    { from: 'D12', to: 'D15' },
    { from: 'D14', to: 'D15' },
  ],

  // Invalid: would create cycle
  cyclicDependency: { from: 'D15', to: 'D01' },
};

// =============================================================================
// BLOOM'S TAXONOMY FIXTURES
// =============================================================================

export const bloomsTaxonomy = {
  // Valid level → verb mappings
  validMappings: {
    L1: ['Remember', 'Understand'],
    L2: ['Understand', 'Apply'],
    L3: ['Apply', 'Analyze'],
    L4: ['Analyze', 'Evaluate'],
    L5: ['Evaluate', 'Create'],
    'L5+': ['Evaluate', 'Create'],
    'L5++': ['Create'],
  },

  // Action verbs by level
  actionVerbs: {
    Remember: ['list', 'identify', 'recognize', 'recall', 'define', 'name'],
    Understand: [
      'explain',
      'describe',
      'summarize',
      'interpret',
      'classify',
      'compare',
    ],
    Apply: ['apply', 'use', 'implement', 'execute', 'demonstrate', 'solve'],
    Analyze: [
      'analyze',
      'differentiate',
      'examine',
      'investigate',
      'compare',
      'contrast',
    ],
    Evaluate: [
      'evaluate',
      'assess',
      'judge',
      'critique',
      'justify',
      'recommend',
    ],
    Create: ['design', 'develop', 'create', 'formulate', 'construct', 'plan'],
  },

  // Invalid: L1 with Create verb
  invalidMapping: {
    proficiencyLevel: 'L1',
    bloomLevel: 'Create', // Too advanced for L1
  },
};

// =============================================================================
// PV TERMINOLOGY FIXTURES
// =============================================================================

export const pvTerminology = {
  // Required terms that should appear in PV content
  requiredTerms: [
    'pharmacovigilance',
    'adverse event',
    'adverse drug reaction',
    'safety signal',
    'ICSR',
    'MedDRA',
    'causality',
    'risk-benefit',
  ],

  // Common misspellings to detect
  misspellings: {
    pharmacovigilence: 'pharmacovigilance',
    pharmocovigilance: 'pharmacovigilance',
    'adverse reaction': 'adverse drug reaction',
    CIOMS: 'CIOMS', // Correct
  },

  // Acronym expansions
  acronyms: {
    ICSR: 'Individual Case Safety Report',
    ADR: 'Adverse Drug Reaction',
    AE: 'Adverse Event',
    PSUR: 'Periodic Safety Update Report',
    PBRER: 'Periodic Benefit-Risk Evaluation Report',
    RMP: 'Risk Management Plan',
    REMS: 'Risk Evaluation and Mitigation Strategy',
    PRR: 'Proportional Reporting Ratio',
    ROR: 'Reporting Odds Ratio',
    EBGM: 'Empirical Bayesian Geometric Mean',
  },
};
