/**
 * Research Validation Algorithm (CMER Framework) — Types & Constants
 *
 * Multi-dimensional quality assessment for research artifacts using:
 * - Credibility: Source authority, citation quality
 * - Methodology: Study design rigor, bias control
 * - Evidence: Data quality, statistical validity
 * - Reproducibility: Replication potential, transparency
 *
 * @version 1.0 - Base implementation
 * @see cmer-v2-extensions.ts for v2.0 enhancements
 *
 * @complexity Time: O(n·m + k·log k) where n=claims, m=evidence/claim, k=citations
 * @complexity Space: O(k² + n + d) where d=data points
 *
 * Mathematical basis:
 * V(r) = Σᵢ wᵢ · Vᵢ(r) where Σᵢ wᵢ = 1 and each Vᵢ ∈ [0, 1]
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type StudyType =
  | 'randomized_controlled_trial'
  | 'cohort_study'
  | 'case_control'
  | 'cross_sectional'
  | 'case_report'
  | 'systematic_review'
  | 'meta_analysis'
  | 'qualitative'
  | 'mixed_methods'
  | 'observational'
  | 'experimental'
  | 'survey'
  | 'other';

export type BiasControl =
  | 'randomization'
  | 'blinding_single'
  | 'blinding_double'
  | 'blinding_triple'
  | 'placebo_control'
  | 'intention_to_treat'
  | 'allocation_concealment'
  | 'stratification'
  | 'matching'
  | 'adjustment';

export type FlagSeverity = 'critical' | 'warning' | 'info';

export interface Citation {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  doi?: string;
  isPeerReviewed: boolean;
  impactFactor?: number;
  citationCount?: number;
  sourceType: 'journal' | 'conference' | 'preprint' | 'book' | 'website' | 'report' | 'other';
}

export interface Author {
  name: string;
  affiliation?: string;
  hIndex?: number;
  publicationCount?: number;
  conflictOfInterest?: string;
}

export interface Methodology {
  studyType: StudyType;
  sampleSize?: number;
  populationDescription?: string;
  inclusionCriteria?: string[];
  exclusionCriteria?: string[];
  biasControls: BiasControl[];
  statisticalMethods?: string[];
  powerAnalysis?: boolean;
  effectSizeReported?: boolean;
  confidenceIntervals?: boolean;
  pValueThreshold?: number;
  description: string;
}

export interface Claim {
  id: string;
  statement: string;
  type: 'primary' | 'secondary' | 'exploratory';
  supportingEvidenceIds: string[];
}

export interface DataPoint {
  id: string;
  type: 'quantitative' | 'qualitative' | 'mixed';
  description: string;
  source: 'primary' | 'secondary' | 'meta';
  sampleSize?: number;
  statisticalSignificance?: number;
  effectSize?: number;
  confidenceInterval?: [number, number];
}

export interface ResearchMetadata {
  title: string;
  authors: Author[];
  publicationYear: number;
  journal?: string;
  doi?: string;
  field: string;
  isPreregistered: boolean;
  preregistrationUrl?: string;
  fundingSource?: string;
  dataAvailabilityStatement?: string;
}

export interface ResearchArtifact {
  metadata: ResearchMetadata;
  claims: Claim[];
  citations: Citation[];
  methodology: Methodology;
  dataPoints: DataPoint[];
  dataAvailable: boolean;
  methodsAvailable: boolean;
  codeAvailable?: boolean;
}

export interface ValidationFlag {
  code: string;
  severity: FlagSeverity;
  message: string;
  dimension: 'credibility' | 'methodology' | 'evidence' | 'reproducibility';
  relatedItemId?: string;
}

export interface DimensionResult {
  score: number;
  flags: ValidationFlag[];
  details: Record<string, number>;
}

export interface ValidationResult {
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensionScores: {
    credibility: number;
    methodology: number;
    evidence: number;
    reproducibility: number;
  };
  flags: ValidationFlag[];
  confidence: number;
  recommendations: string[];
  summary: string;
}

export interface ValidationWeights {
  credibility: number;
  methodology: number;
  evidence: number;
  reproducibility: number;
}

export interface QuickValidationInput {
  title: string;
  authors: string[];
  year: number;
  studyType: StudyType;
  sampleSize?: number;
  citationCount: number;
  isPeerReviewed: boolean;
  hasBiasControls: boolean;
  dataAvailable: boolean;
  claimCount: number;
  supportedClaimPercentage: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEFAULT_WEIGHTS: ValidationWeights = {
  credibility: 0.25,
  methodology: 0.30,
  evidence: 0.25,
  reproducibility: 0.20,
};

export const STUDY_TYPE_SCORES: Record<StudyType, number> = {
  meta_analysis: 1.0,
  systematic_review: 0.95,
  randomized_controlled_trial: 0.9,
  cohort_study: 0.75,
  case_control: 0.65,
  cross_sectional: 0.55,
  observational: 0.5,
  experimental: 0.7,
  survey: 0.45,
  mixed_methods: 0.6,
  qualitative: 0.5,
  case_report: 0.3,
  other: 0.4,
};

export const BIAS_CONTROL_SCORES: Record<BiasControl, number> = {
  blinding_triple: 0.2,
  blinding_double: 0.18,
  randomization: 0.15,
  allocation_concealment: 0.12,
  intention_to_treat: 0.1,
  blinding_single: 0.08,
  placebo_control: 0.07,
  stratification: 0.05,
  matching: 0.04,
  adjustment: 0.03,
};

export const MIN_SAMPLE_SIZES: Partial<Record<StudyType, number>> = {
  randomized_controlled_trial: 30,
  cohort_study: 100,
  case_control: 50,
  cross_sectional: 100,
  survey: 100,
  qualitative: 12,
  case_report: 1,
};

export const CURRENT_YEAR = new Date().getFullYear();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function _standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

export function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 0.9) return 'A';
  if (score >= 0.8) return 'B';
  if (score >= 0.7) return 'C';
  if (score >= 0.6) return 'D';
  return 'F';
}
