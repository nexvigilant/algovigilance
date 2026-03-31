/**
 * Regulatory-Curriculum Integration Types
 *
 * Types for bidirectional mapping between regulatory requirements
 * and curriculum components (KSBs, EPAs, CPAs, Domains).
 *
 * Source: Regulatory Tracker Spreadsheet
 * @see https://docs.google.com/spreadsheets/d/1xqZMCavHmweesd79rw2CsFxe_1NClf2f6z6nTyLWt0c
 */

// =============================================================================
// JURISDICTION & DOCUMENT TYPES
// =============================================================================

export type Jurisdiction = 'FDA' | 'EMA' | 'ICH' | 'WHO' | 'UK-MHRA' | 'International';

export type DocumentType =
  | 'CFR'
  | 'US Statute'
  | 'FDA Guidance'
  | 'EU Regulation'
  | 'EU Directive'
  | 'EU GVP Module'
  | 'ICH Guideline'
  | 'CIOMS Report'
  | 'Commission Regulation'
  | 'Reflection Paper'
  | 'Safety Guidance';

export type RegulatoryStatus =
  | 'Current'
  | 'Draft'
  | 'Superseded'
  | 'Emerging'
  | 'Under Review';

// =============================================================================
// REGULATORY ENTRY (from Master Directory)
// =============================================================================

export interface RegulatoryEntry {
  /** Unique regulatory ID (e.g., FDA-CFR-001, ICH-E2-001) */
  regId: string;

  /** Official identifier (e.g., 21 CFR 312.32, ICH E2A) */
  officialIdentifier: string;

  /** Full title of the regulation/guideline */
  title: string;

  /** Regulatory jurisdiction */
  jurisdiction: Jurisdiction;

  /** Document type */
  documentType: DocumentType;

  /** Current status */
  status: RegulatoryStatus;

  /** Effective date (if applicable) */
  effectiveDate?: string;

  /** Product applicability flags */
  applicability: {
    rxDrugs: boolean;
    otc: boolean;
    biologics: boolean;
    vaccines: boolean;
    bloodProducts: boolean;
    biosimilars: boolean;
    generics: boolean;
    combinationProducts: boolean;
    atmp: boolean;
  };

  /** Role applicability flags */
  roles: {
    mahSponsor: boolean;
    qppv: boolean;
    investigator: boolean;
    hcp: boolean;
    distributor: boolean;
    croVendor: boolean;
  };

  /** Lifecycle stage applicability */
  lifecycleStage: 'Pre-Approval' | 'Post-Approval' | 'Both';

  /** PV activity category */
  pvActivityCategory: PVActivityCategory;

  /** Summary description */
  summaryDescription: string;

  /** Key requirements (bullet points) */
  keyRequirements: string[];

  /** Additional notes */
  notes?: string;
}

export type PVActivityCategory =
  | 'Expedited Reporting'
  | 'Periodic Reporting'
  | 'ICSR Reporting'
  | 'Risk Management'
  | 'Post-Marketing Studies'
  | 'Signal Detection'
  | 'PV System Quality'
  | 'GCP Modernization'
  | 'AI/ML Regulation'
  | 'CGT/ATMP'
  | 'Data Protection';

// =============================================================================
// REPORTING TIMELINES
// =============================================================================

export interface ReportingTimeline {
  /** Event/report type */
  eventReportType: string;

  /** Report category (Expedited, Periodic, Signal, Labeling) */
  reportCategory: 'Expedited' | 'Periodic' | 'Signal' | 'Labeling';

  /** FDA timeframe and authority */
  fda: {
    timeframe: string;
    authority: string;
  };

  /** EMA timeframe and authority */
  ema: {
    timeframe: string;
    authority: string;
  };

  /** ICH reference */
  ichReference?: string;

  /** WHO reference */
  whoReference?: string;

  /** Day 0 definition */
  day0Definition: string;

  /** Key differences between jurisdictions */
  keyDifferences: string;

  /** Additional notes */
  notes?: string;
}

// =============================================================================
// CROSS-REFERENCE MATRIX
// =============================================================================

export type HarmonizationLevel =
  | 'Fully Harmonized'
  | 'Substantially Harmonized'
  | 'Partially Harmonized'
  | 'Divergent';

export interface CrossReferenceEntry {
  /** Topic area (e.g., "Serious Adverse Event Definition") */
  topicArea: string;

  /** Key requirement description */
  keyRequirement: string;

  /** FDA citation and document */
  fda: {
    citation: string;
    document: string;
  };

  /** EMA citation and document */
  ema: {
    citation: string;
    document: string;
  };

  /** ICH citation and document */
  ich?: {
    citation: string;
    document: string;
  };

  /** WHO citation */
  who?: string;

  /** CIOMS citation */
  cioms?: string;

  /** Harmonization level */
  harmonizationLevel: HarmonizationLevel;

  /** Variance notes explaining differences */
  varianceNotes: string;
}

// =============================================================================
// KSB-REGULATION MAPPING
// =============================================================================

export interface KSBRegulationMapping {
  /** Regulatory ID */
  regId: string;

  /** Regulation title (for display) */
  regTitle: string;

  /** Mapped domain ID */
  domainId: string;

  /** Domain name */
  domainName: string;

  /** Relevance type */
  relevanceType: 'Foundational' | 'Professional' | 'Advanced' | 'Specialized';

  /** Academy level */
  academyLevel: 'Core' | 'Advanced' | 'Executive';

  /** Related KSB IDs */
  relatedKsbIds: string[];

  /** Related KSB count */
  relatedKsbCount: number;

  /** Competency focus area */
  competencyFocus: string;

  /** Notes */
  notes?: string;
}

// =============================================================================
// REGULATORY GAP ANALYSIS
// =============================================================================

export type GapPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'REGIONAL';

export interface RegulatoryGap {
  /** Priority level */
  priority: GapPriority;

  /** Regulatory ID */
  regId: string;

  /** Official identifier */
  officialIdentifier: string;

  /** Title */
  title: string;

  /** Jurisdiction */
  jurisdiction: Jurisdiction;

  /** Document type */
  documentType: DocumentType;

  /** Status/effective date */
  statusEffectiveDate: string;

  /** Gap category */
  gapCategory: string;

  /** Action required */
  actionRequired: string;

  /** Notes */
  notes?: string;
}

// =============================================================================
// ACRONYMS & DEFINITIONS
// =============================================================================

export interface RegulatoryAcronym {
  /** Acronym */
  acronym: string;

  /** Full term */
  fullTerm: string;

  /** Definition */
  definition: string;

  /** Context jurisdiction */
  contextJurisdiction: Jurisdiction | 'All';
}

// =============================================================================
// CURRICULUM INTEGRATION
// =============================================================================

/**
 * Bidirectional mapping for curriculum-regulation integration
 */
export interface CurriculumRegulationLink {
  /** Link type (regulation → curriculum or curriculum → regulation) */
  linkType: 'regulation-to-curriculum' | 'curriculum-to-regulation';

  /** Source entity */
  source: {
    type: 'regulation' | 'ksb' | 'epa' | 'cpa' | 'domain';
    id: string;
    name: string;
  };

  /** Target entity */
  target: {
    type: 'regulation' | 'ksb' | 'epa' | 'cpa' | 'domain';
    id: string;
    name: string;
  };

  /** Relationship strength */
  strength: 'primary' | 'secondary' | 'reference';

  /** Competency alignment description */
  alignmentDescription?: string;
}

/**
 * Regulatory learning pathway - specialized capability pathway
 * focused on specific regulatory frameworks
 */
export interface RegulatoryLearningPathway {
  /** Pathway ID */
  id: string;

  /** Pathway name */
  name: string;

  /** Description */
  description: string;

  /** Target regulatory framework(s) */
  regulatoryFrameworks: {
    regId: string;
    title: string;
    jurisdiction: Jurisdiction;
  }[];

  /** Career stage target */
  careerStage: 'Entry' | 'Intermediate' | 'Senior' | 'Executive';

  /** Role focus */
  rolesFocus: string[];

  /** Required KSBs */
  requiredKsbs: {
    ksbId: string;
    domainId: string;
    proficiencyLevel: string;
  }[];

  /** Related EPAs */
  relatedEpas: string[];

  /** Estimated duration (hours) */
  estimatedDuration: number;

  /** Learning objectives */
  learningObjectives: string[];

  /** Assessment criteria */
  assessmentCriteria: string[];
}

// =============================================================================
// COMPLIANCE CHECKLIST
// =============================================================================

export interface ComplianceChecklist {
  /** Checklist ID */
  id: string;

  /** Title */
  title: string;

  /** Regulatory basis */
  regulatoryBasis: {
    regId: string;
    officialIdentifier: string;
    jurisdiction: Jurisdiction;
  }[];

  /** Product types applicable */
  productTypes: string[];

  /** Lifecycle stage */
  lifecycleStage: 'Pre-Approval' | 'Post-Approval' | 'Both';

  /** Checklist items */
  items: {
    id: string;
    requirement: string;
    regulatoryRef: string;
    verification: string;
    criticality: 'Critical' | 'Major' | 'Minor';
  }[];

  /** Related KSBs for competency verification */
  relatedKsbs: string[];
}

// =============================================================================
// REGULATORY TRACKER DATA BUNDLE
// =============================================================================

export interface RegulatoryTrackerData {
  /** Master directory of all regulations */
  masterDirectory: RegulatoryEntry[];

  /** Reporting timelines */
  reportingTimelines: ReportingTimeline[];

  /** Cross-reference matrix */
  crossReferenceMatrix: CrossReferenceEntry[];

  /** KSB-Regulation mappings */
  ksbRegulationMappings: KSBRegulationMapping[];

  /** Gap analysis */
  gapAnalysis: RegulatoryGap[];

  /** Acronyms and definitions */
  acronyms: RegulatoryAcronym[];

  /** Metadata */
  metadata: {
    version: string;
    lastUpdated: string;
    totalRegulations: number;
    totalMappings: number;
  };
}

// =============================================================================
// DOMAIN-REGULATION ALIGNMENT (from KSB Cross-Reference)
// =============================================================================

/**
 * Pre-defined domain-regulation alignments from the tracker
 */
export const DOMAIN_REGULATION_ALIGNMENT: Record<string, {
  domainName: string;
  primaryRegulations: string[];
  competencyFocus: string;
}> = {
  D06: {
    domainName: 'Expedited & ICSR Reporting',
    primaryRegulations: [
      'FDA-CFR-001', // 21 CFR 312.32 - IND Safety
      'FDA-CFR-003', // 21 CFR 314.80 - Postmarketing ADE
      'FDA-CFR-005', // 21 CFR 600.80 - Biologics AE
      'ICH-E2-001', // ICH E2A
      'ICH-E2-002', // ICH E2B(R3)
      'ICH-E2-004', // ICH E2D
    ],
    competencyFocus: 'Case processing & reporting',
  },
  D07: {
    domainName: 'Aggregate Reporting (PSUR/PBRER)',
    primaryRegulations: [
      'FDA-CFR-002', // 21 CFR 312.33 - IND Annual
      'FDA-CFR-004', // 21 CFR 314.81 - Other Reports
      'FDA-STAT-003', // 506B Reports
      'ICH-E2-003', // ICH E2C(R2)
      'ICH-E2-006', // ICH E2F
    ],
    competencyFocus: 'Periodic report preparation',
  },
  D09: {
    domainName: 'Post-Authorization Studies',
    primaryRegulations: [
      'FDA-CFR-006', // Distribution Reports
      'FDA-STAT-001', // FDAAA PMRs
    ],
    competencyFocus: 'Post-auth study design',
  },
  D11: {
    domainName: 'Risk Management & Minimization',
    primaryRegulations: [
      'FDA-STAT-002', // REMS
    ],
    competencyFocus: 'RMP/REMS development',
  },
  D14: {
    domainName: 'PV Systems & Quality',
    primaryRegulations: [
      'ICH-E2-005', // ICH E2E
      'EMA-REG-001', // EU 726/2004
      'EMA-REG-002', // Dir 2001/83/EC
    ],
    competencyFocus: 'PV system compliance',
  },
};

// =============================================================================
// CRITICAL GAPS (from Gap Analysis)
// =============================================================================

/**
 * Critical regulatory gaps requiring curriculum attention
 */
export const CRITICAL_REGULATORY_GAPS: {
  category: string;
  description: string;
  regulations: string[];
  suggestedDomains: string[];
}[] = [
  {
    category: 'AI/ML Regulation',
    description: 'Emerging AI/ML regulations for drug development and PV',
    regulations: [
      'FDA-GUID-017', // FDA AI Draft Guidance
      'EMA-GUID-001', // EMA AI Reflection Paper
      'CIOMS-008', // CIOMS XIV AI in PV
    ],
    suggestedDomains: ['D14', 'D13'], // PV Systems, Technology
  },
  {
    category: 'CGT/ATMP',
    description: 'Cell and gene therapy pharmacovigilance',
    regulations: [
      'FDA-GUID-018', // Genome Editing
      'FDA-GUID-019', // CAR-T
      'EMA-REG-007', // ATMP Regulation
      'EMA-GUID-002', // CAR-T Safety
    ],
    suggestedDomains: ['D06', 'D09'], // ICSR Reporting, Post-Auth Studies
  },
  {
    category: 'EU PV Framework Updates',
    description: 'Major EU pharmacovigilance regulation changes',
    regulations: [
      'EMA-REG-006', // EU IR 2025/1466
      'EMA-GVP-024', // GVP Module VI Addendum II
      'EMA-GVP-025', // GVP Module XVI Add I
    ],
    suggestedDomains: ['D14', 'D11'], // PV Systems, Risk Management
  },
  {
    category: 'GCP Modernization',
    description: 'ICH E6(R3) principles-based GCP',
    regulations: [
      'ICH-017', // ICH E6(R3)
    ],
    suggestedDomains: ['D06', 'D14'], // ICSR Reporting, PV Systems
  },
];
