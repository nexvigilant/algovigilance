/**
 * PRISMA Systematic Review Types
 *
 * Type definitions for the PRISMA 2020 framework for systematic reviews.
 * Implements the official PRISMA 2020 flow diagram and checklist structures.
 *
 * @see https://www.prisma-statement.org/
 * @see BMJ 2020;372:n71 (PRISMA 2020 Statement)
 */

// =============================================================================
// Core Pipeline Types
// =============================================================================

/**
 * Phases in the PRISMA flow diagram
 * Ordered: IDENTIFIED → SCREENED → ELIGIBLE → INCLUDED
 * EXCLUDED is a terminal state reachable from any non-terminal phase
 */
export type PRISMAPhase =
  | 'IDENTIFIED'
  | 'SCREENED'
  | 'ELIGIBLE'
  | 'INCLUDED'
  | 'EXCLUDED';

/**
 * Decision outcomes at each screening phase
 */
export type ScreeningDecision =
  | { type: 'INCLUDE' }
  | { type: 'EXCLUDE'; reason: string }
  | { type: 'PENDING' };

/**
 * Source categories as defined in PRISMA 2020
 * The 2020 update separates databases/registers from other methods
 */
export type RecordSource =
  | 'database' // e.g., PubMed, Embase, CENTRAL
  | 'register' // e.g., ClinicalTrials.gov, WHO ICTRP
  | 'website' // e.g., FDA, EMA websites
  | 'citation_search' // Forward/backward citation searching
  | 'grey_literature' // Unpublished studies, conference abstracts
  | 'manufacturer_data' // Internal company data (common in PV)
  | 'other';

/**
 * A literature record at any stage of the review process
 */
export interface LiteratureRecord {
  /** Unique identifier */
  id: string;

  /** Record metadata */
  title: string;
  abstract?: string | null;
  fullText?: string | null;
  source: RecordSource;

  /** Bibliographic information */
  metadata: {
    authors: string[];
    year: number;
    journal?: string | null;
    doi?: string | null;
    pmid?: string | null;
    volume?: string | null;
    issue?: string | null;
    pages?: string | null;
  };

  /** Current phase in the pipeline */
  phase: PRISMAPhase;

  /** Exclusion reason if phase is EXCLUDED */
  exclusionReason?: string | null;

  /** Phase-specific notes from reviewers */
  reviewerNotes?: {
    screening?: string;
    eligibility?: string;
    inclusion?: string;
  };

  /** Whether record contains quantitative data for meta-analysis */
  hasQuantitativeData?: boolean;
}

/**
 * Eligibility criteria for screening
 * Based on PICO framework (Population, Intervention, Comparator, Outcome)
 */
export interface EligibilityCriteria {
  /** Keywords that must appear (case-insensitive) */
  inclusionKeywords?: string[];

  /** Keywords that disqualify a record */
  exclusionKeywords?: string[];

  /** Minimum publication year */
  minYear?: number;

  /** Maximum publication year */
  maxYear?: number;

  /** Allowed study types */
  studyTypes?: string[];

  /** Language restrictions */
  languages?: string[];

  /** Custom predicate for complex criteria */
  customPredicate?: (record: LiteratureRecord) => ScreeningDecision;
}

/**
 * Configuration for the screening pipeline
 */
export interface ScreeningConfig {
  /** Criteria for title/abstract screening */
  abstractCriteria: EligibilityCriteria;

  /** Criteria for full-text eligibility */
  fullTextCriteria: EligibilityCriteria;

  /** Enable duplicate detection */
  deduplication: boolean;

  /** Fields to use for duplicate fingerprinting */
  deduplicationFields?: ('title' | 'doi' | 'pmid')[];
}

/**
 * PRISMA 2020 Flow Diagram data structure
 * Matches the official PRISMA 2020 flow diagram template
 */
export interface PRISMAFlowDiagram {
  /** Identification phase counts */
  identification: {
    /** Records from databases (e.g., PubMed, Embase) */
    databases: number;
    /** Records from registers (e.g., ClinicalTrials.gov) */
    registers: number;
    /** Records from other methods (citation searching, grey lit) */
    otherMethods: number;
    /** Duplicates removed (before screening) */
    duplicatesRemoved: number;
    /** Records marked as ineligible by automation tools (PRISMA 2020) */
    automationExcluded: number;
    /** Records removed for other reasons */
    otherRemovals: number;
  };

  /** Screening phase counts */
  screening: {
    /** Records screened (title/abstract) */
    recordsScreened: number;
    /** Records excluded at screening */
    recordsExcluded: number;
  };

  /** Eligibility phase counts */
  eligibility: {
    /** Reports sought for retrieval */
    reportsSought: number;
    /** Reports not retrieved */
    reportsNotRetrieved: number;
    /** Reports assessed for eligibility */
    reportsAssessed: number;
    /** Reports excluded with reasons */
    reportsExcluded: Map<string, number>;
  };

  /** Inclusion counts */
  included: {
    /** Studies included in review */
    studies: number;
    /** Studies included in meta-analysis (if applicable) */
    inMetaAnalysis: number | null;
  };

  /** Timestamp of generation */
  generatedAt: Date;
}

/**
 * Result of processing the pipeline
 */
export interface PipelineResult {
  /** All records with updated phases */
  records: LiteratureRecord[];

  /** Generated flow diagram */
  flowDiagram: PRISMAFlowDiagram;

  /** Summary statistics */
  statistics: {
    totalIdentified: number;
    totalExcluded: number;
    totalIncluded: number;
    inclusionRate: number;
    processingTimeMs: number;
  };
}

// =============================================================================
// PRISMA Checklist Types
// =============================================================================

/**
 * Status of a checklist item validation
 */
export type ChecklistItemStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'NOT_APPLICABLE';

/**
 * Result of validating a single checklist item
 */
export interface ChecklistItemResult {
  itemNumber: number;
  section: string;
  topic: string;
  status: ChecklistItemStatus;
  description: string;
  evidence?: string;
  recommendation?: string;
}

/**
 * Overall compliance report
 */
export interface ComplianceReport {
  /** Individual item results */
  items: ChecklistItemResult[];

  /** Number of items that passed */
  passedCount: number;

  /** Number of items that failed */
  failedCount: number;

  /** Number of partial/NA items */
  otherCount: number;

  /** Compliance score (0-1) */
  score: number;

  /** Whether report meets minimum threshold (default 0.9) */
  isCompliant: boolean;

  /** Critical failures that must be addressed */
  criticalFailures: ChecklistItemResult[];

  /** Generated at timestamp */
  assessedAt: Date;
}

/**
 * Report structure for compliance checking
 * Maps to PRISMA checklist sections
 */
export interface SystematicReviewReport {
  title?: string;
  abstract?: {
    background?: string;
    methods?: string;
    results?: string;
    conclusion?: string;
    fullText?: string;
  };
  introduction?: {
    rationale?: string;
    objectives?: string;
    picoStatement?: string;
  };
  methods?: {
    protocolRegistration?: string;
    eligibilityCriteria?: string;
    informationSources?: string[];
    searchStrategy?: string;
    selectionProcess?: string;
    dataCollectionProcess?: string;
    dataItems?: string[];
    riskOfBiasAssessment?: string;
    effectMeasures?: string[];
    synthesisMethods?: string;
    reportingBiasAssessment?: string;
    certaintyAssessment?: string;
  };
  results?: {
    flowDiagram?: PRISMAFlowDiagram;
    studyCharacteristics?: unknown[];
    riskOfBiasResults?: unknown[];
    individualStudyResults?: unknown[];
    synthesisResults?: {
      summary?: string;
      heterogeneity?: string;
      sensitivityAnalyses?: string;
    };
    reportingBiasResults?: string;
    certaintyResults?: string;
  };
  discussion?: {
    summary?: string;
    limitations?: string;
    implications?: string;
    otherInfo?: string;
  };
  funding?: {
    sources?: string;
    role?: string;
  };
  conflictsOfInterest?: string;
  dataAvailability?: string;
}
