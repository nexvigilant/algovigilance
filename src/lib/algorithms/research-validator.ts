/**
 * Research Validation Algorithm (CMER Framework)
 *
 * Multi-dimensional quality assessment for research artifacts using:
 * - Credibility: Source authority, citation quality
 * - Methodology: Study design rigor, bias control
 * - Evidence: Data quality, statistical validity
 * - Reproducibility: Replication potential, transparency
 *
 * @version 1.0 - Base implementation
 * @see cmer-v2-extensions.ts for v2.0 enhancements:
 *   - S-Value (Surprisal) for information-theoretic scoring
 *   - Domain classifier for dynamic methodology matrix
 *   - Citation kinematics (velocity, acceleration, disruption index)
 *   - Legal-aware reproducibility (GDPR/HIPAA decision trees)
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

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_WEIGHTS: ValidationWeights = {
  credibility: 0.25,
  methodology: 0.30,
  evidence: 0.25,
  reproducibility: 0.20,
};

const STUDY_TYPE_SCORES: Record<StudyType, number> = {
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

const BIAS_CONTROL_SCORES: Record<BiasControl, number> = {
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

const MIN_SAMPLE_SIZES: Partial<Record<StudyType, number>> = {
  randomized_controlled_trial: 30,
  cohort_study: 100,
  case_control: 50,
  cross_sectional: 100,
  survey: 100,
  qualitative: 12,
  case_report: 1,
};

const CURRENT_YEAR = new Date().getFullYear();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function _standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 0.9) return 'A';
  if (score >= 0.8) return 'B';
  if (score >= 0.7) return 'C';
  if (score >= 0.6) return 'D';
  return 'F';
}

// =============================================================================
// CREDIBILITY ASSESSMENT
// =============================================================================

function evaluateCitationQuality(citation: Citation): number {
  let score = 0;

  // Peer review status (30%)
  if (citation.isPeerReviewed) {
    score += 0.3;
  }

  // Source type (25%)
  const sourceTypeScores: Record<Citation['sourceType'], number> = {
    journal: 1.0,
    conference: 0.8,
    book: 0.75,
    report: 0.6,
    preprint: 0.5,
    website: 0.3,
    other: 0.2,
  };
  score += 0.25 * (sourceTypeScores[citation.sourceType] || 0.2);

  // Impact factor (20%)
  if (citation.impactFactor !== undefined) {
    const impactScore = Math.min(citation.impactFactor / 10, 1);
    score += 0.2 * impactScore;
  } else if (citation.isPeerReviewed) {
    score += 0.1; // Partial credit for peer-reviewed without IF
  }

  // Citation count (15%)
  if (citation.citationCount !== undefined) {
    const citationScore = Math.min(citation.citationCount / 100, 1);
    score += 0.15 * citationScore;
  }

  // Recency (10%)
  const age = CURRENT_YEAR - citation.year;
  const recencyScore = Math.max(0, 1 - age / 20);
  score += 0.1 * recencyScore;

  return clamp(score, 0, 1);
}

function calculateSourceDiversity(citations: Citation[]): number {
  if (citations.length === 0) return 0;
  if (citations.length === 1) return 0.5;

  // Unique authors
  const allAuthors = new Set<string>();
  citations.forEach((c) => c.authors.forEach((a) => allAuthors.add(a.toLowerCase())));
  const authorDiversity = Math.min(allAuthors.size / (citations.length * 2), 1);

  // Unique journals/sources
  const sources = new Set(citations.map((c) => c.journal || c.sourceType));
  const sourceDiversity = Math.min(sources.size / citations.length, 1);

  // Year spread
  const years = citations.map((c) => c.year);
  const yearSpread = years.length > 1 ? (Math.max(...years) - Math.min(...years)) / 20 : 0;
  const yearDiversity = Math.min(yearSpread, 1);

  return 0.4 * authorDiversity + 0.4 * sourceDiversity + 0.2 * yearDiversity;
}

function calculateRecencyScore(citations: Citation[], field: string): number {
  if (citations.length === 0) return 0;

  // Fast-moving fields require more recent citations
  const fastMovingFields = ['ai', 'machine learning', 'covid', 'technology', 'software'];
  const isFastMoving = fastMovingFields.some((f) => field.toLowerCase().includes(f));
  const recencyThreshold = isFastMoving ? 5 : 10;

  const recentCount = citations.filter((c) => CURRENT_YEAR - c.year <= recencyThreshold).length;
  return recentCount / citations.length;
}

function evaluateAuthorCredibility(authors: Author[]): number {
  if (authors.length === 0) return 0.5;

  const authorScores = authors.map((author) => {
    let score = 0.5; // Base score

    // H-index contribution
    if (author.hIndex !== undefined) {
      score += 0.25 * Math.min(author.hIndex / 50, 1);
    }

    // Publication count
    if (author.publicationCount !== undefined) {
      score += 0.15 * Math.min(author.publicationCount / 100, 1);
    }

    // Affiliation bonus
    if (author.affiliation) {
      score += 0.1;
    }

    return clamp(score, 0, 1);
  });

  // Weight towards highest-credibility author
  authorScores.sort((a, b) => b - a);
  const weights = authorScores.map((_, i) => 1 / (i + 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  return authorScores.reduce((sum, score, i) => sum + score * weights[i], 0) / totalWeight;
}

function assessCredibility(citations: Citation[], metadata: ResearchMetadata): DimensionResult {
  const flags: ValidationFlag[] = [];
  const details: Record<string, number> = {};

  // Citation quality scores
  const citationScores = citations.map(evaluateCitationQuality);
  details.avgCitationQuality = mean(citationScores);

  // Flag low-quality citations
  citationScores.forEach((score, i) => {
    if (score < 0.3) {
      flags.push({
        code: 'LOW_QUALITY_CITATION',
        severity: 'warning',
        message: `Citation "${citations[i].title}" has low quality score (${(score * 100).toFixed(0)}%)`,
        dimension: 'credibility',
        relatedItemId: citations[i].id,
      });
    }
  });

  // Source diversity
  details.sourceDiversity = calculateSourceDiversity(citations);
  if (details.sourceDiversity < 0.5) {
    flags.push({
      code: 'LOW_SOURCE_DIVERSITY',
      severity: 'warning',
      message: 'Sources lack diversity - consider citing from more varied sources',
      dimension: 'credibility',
    });
  }

  // Recency
  details.recencyScore = calculateRecencyScore(citations, metadata.field);
  if (details.recencyScore < 0.3) {
    flags.push({
      code: 'OUTDATED_CITATIONS',
      severity: 'info',
      message: 'Most citations are not recent - ensure findings are still relevant',
      dimension: 'credibility',
    });
  }

  // Author credibility
  details.authorCredibility = evaluateAuthorCredibility(metadata.authors);

  // Check for conflicts of interest
  const hasConflicts = metadata.authors.some((a) => a.conflictOfInterest);
  if (hasConflicts) {
    flags.push({
      code: 'CONFLICT_OF_INTEREST',
      severity: 'warning',
      message: 'Authors have declared conflicts of interest',
      dimension: 'credibility',
    });
  }

  // Insufficient citations
  if (citations.length < 5) {
    flags.push({
      code: 'INSUFFICIENT_CITATIONS',
      severity: 'warning',
      message: `Only ${citations.length} citations - consider expanding literature review`,
      dimension: 'credibility',
    });
  }

  // Calculate final score
  const finalScore =
    0.35 * details.avgCitationQuality +
    0.25 * details.sourceDiversity +
    0.2 * details.recencyScore +
    0.2 * details.authorCredibility;

  return {
    score: clamp(finalScore, 0, 1),
    flags,
    details,
  };
}

// =============================================================================
// METHODOLOGY ASSESSMENT
// =============================================================================

function scoreStudyDesign(studyType: StudyType): number {
  return STUDY_TYPE_SCORES[studyType] || 0.4;
}

function scoreBiasControls(biasControls: BiasControl[]): number {
  if (biasControls.length === 0) return 0;

  let totalScore = 0;
  const usedControls = new Set<BiasControl>();

  for (const control of biasControls) {
    if (!usedControls.has(control)) {
      totalScore += BIAS_CONTROL_SCORES[control] || 0;
      usedControls.add(control);
    }
  }

  // Cap at 1.0
  return Math.min(totalScore, 1);
}

function scoreStatisticalMethods(methodology: Methodology): number {
  let score = 0.5; // Base score for having any statistical analysis

  // Power analysis
  if (methodology.powerAnalysis) {
    score += 0.15;
  }

  // Effect size reporting
  if (methodology.effectSizeReported) {
    score += 0.15;
  }

  // Confidence intervals
  if (methodology.confidenceIntervals) {
    score += 0.1;

    // Appropriate CI level
    if (methodology.pValueThreshold && methodology.pValueThreshold <= 0.05) {
      score += 0.05;
    }
  }

  // Named statistical methods
  if (methodology.statisticalMethods && methodology.statisticalMethods.length > 0) {
    score += 0.05 * Math.min(methodology.statisticalMethods.length, 3);
  }

  return clamp(score, 0, 1);
}

function assessMethodology(methodology: Methodology): DimensionResult {
  const flags: ValidationFlag[] = [];
  const details: Record<string, number> = {};

  // Study design scoring (30%)
  details.studyDesign = scoreStudyDesign(methodology.studyType);

  // Sample size adequacy (20%)
  const minSampleSize = MIN_SAMPLE_SIZES[methodology.studyType] || 30;
  if (methodology.sampleSize !== undefined) {
    if (methodology.sampleSize < minSampleSize) {
      flags.push({
        code: 'INSUFFICIENT_SAMPLE_SIZE',
        severity: 'critical',
        message: `Sample size (${methodology.sampleSize}) below recommended minimum (${minSampleSize}) for ${methodology.studyType}`,
        dimension: 'methodology',
      });
      details.sampleSizeAdequacy = methodology.sampleSize / minSampleSize;
    } else {
      details.sampleSizeAdequacy = 1.0;
    }
  } else {
    flags.push({
      code: 'SAMPLE_SIZE_NOT_REPORTED',
      severity: 'warning',
      message: 'Sample size not reported',
      dimension: 'methodology',
    });
    details.sampleSizeAdequacy = 0.5;
  }

  // Bias control measures (25%)
  details.biasControl = scoreBiasControls(methodology.biasControls);
  if (details.biasControl < 0.5) {
    flags.push({
      code: 'POTENTIAL_BIAS',
      severity: 'warning',
      message: 'Limited bias control measures - results may be affected by confounding',
      dimension: 'methodology',
    });
  }

  // No bias controls at all
  if (methodology.biasControls.length === 0) {
    flags.push({
      code: 'NO_BIAS_CONTROLS',
      severity: 'critical',
      message: 'No bias control measures reported',
      dimension: 'methodology',
    });
  }

  // Statistical methods appropriateness (25%)
  details.statisticalMethods = scoreStatisticalMethods(methodology);
  if (details.statisticalMethods < 0.4) {
    flags.push({
      code: 'QUESTIONABLE_STATISTICS',
      severity: 'warning',
      message: 'Statistical methods may be insufficient or not well-documented',
      dimension: 'methodology',
    });
  }

  // Check for p-hacking indicators
  if (methodology.pValueThreshold && methodology.pValueThreshold > 0.05) {
    flags.push({
      code: 'RELAXED_SIGNIFICANCE_THRESHOLD',
      severity: 'warning',
      message: `Significance threshold (p < ${methodology.pValueThreshold}) is higher than conventional standards`,
      dimension: 'methodology',
    });
  }

  // Calculate final score
  const finalScore =
    0.3 * details.studyDesign +
    0.2 * details.sampleSizeAdequacy +
    0.25 * details.biasControl +
    0.25 * details.statisticalMethods;

  return {
    score: clamp(finalScore, 0, 1),
    flags,
    details,
  };
}

// =============================================================================
// EVIDENCE ASSESSMENT
// =============================================================================

function findSupportingEvidence(claim: Claim, dataPoints: DataPoint[]): DataPoint[] {
  return dataPoints.filter((dp) => claim.supportingEvidenceIds.includes(dp.id));
}

function evaluateEvidenceStrength(evidence: DataPoint[]): number {
  if (evidence.length === 0) return 0;

  const scores = evidence.map((dp) => {
    let score = 0.5; // Base score

    // Source type
    const sourceScores = { primary: 0.2, meta: 0.15, secondary: 0.1 };
    score += sourceScores[dp.source] || 0.1;

    // Data type preference
    if (dp.type === 'quantitative') {
      score += 0.1;

      // Statistical significance
      if (dp.statisticalSignificance !== undefined && dp.statisticalSignificance < 0.05) {
        score += 0.1;
      }

      // Effect size
      if (dp.effectSize !== undefined && Math.abs(dp.effectSize) > 0.2) {
        score += 0.05;
      }

      // Confidence interval
      if (dp.confidenceInterval) {
        score += 0.05;
      }
    } else if (dp.type === 'mixed') {
      score += 0.05;
    }

    // Sample size
    if (dp.sampleSize !== undefined && dp.sampleSize >= 30) {
      score += 0.05 * Math.min(dp.sampleSize / 100, 1);
    }

    return clamp(score, 0, 1);
  });

  // Weight by evidence quality
  scores.sort((a, b) => b - a);
  const weights = scores.map((_, i) => 1 / (i + 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  return scores.reduce((sum, score, i) => sum + score * weights[i], 0) / totalWeight;
}

function assessDataQuality(dataPoints: DataPoint[]): number {
  if (dataPoints.length === 0) return 0;

  const qualityScores = dataPoints.map((dp) => {
    let score = 0.5;

    // Has sample size
    if (dp.sampleSize !== undefined) {
      score += 0.15;
    }

    // Has statistical measures
    if (dp.statisticalSignificance !== undefined) {
      score += 0.1;
    }
    if (dp.effectSize !== undefined) {
      score += 0.1;
    }
    if (dp.confidenceInterval) {
      score += 0.1;
    }

    // Primary data is preferred
    if (dp.source === 'primary') {
      score += 0.05;
    }

    return clamp(score, 0, 1);
  });

  return mean(qualityScores);
}

function assessEvidence(claims: Claim[], dataPoints: DataPoint[]): DimensionResult {
  const flags: ValidationFlag[] = [];
  const details: Record<string, number> = {};
  const claimScores: number[] = [];

  for (const claim of claims) {
    const supportingEvidence = findSupportingEvidence(claim, dataPoints);

    if (supportingEvidence.length === 0) {
      flags.push({
        code: 'UNSUPPORTED_CLAIM',
        severity: 'critical',
        message: `Claim "${claim.statement.substring(0, 50)}..." has no supporting evidence`,
        dimension: 'evidence',
        relatedItemId: claim.id,
      });
      claimScores.push(0);
      continue;
    }

    let evidenceStrength = evaluateEvidenceStrength(supportingEvidence);

    // Check evidence quantity vs claim type
    const minEvidence = claim.type === 'primary' ? 2 : 1;
    if (supportingEvidence.length < minEvidence) {
      flags.push({
        code: 'WEAK_EVIDENCE_SUPPORT',
        severity: 'warning',
        message: `${claim.type} claim "${claim.statement.substring(0, 30)}..." supported by only ${supportingEvidence.length} data point(s)`,
        dimension: 'evidence',
        relatedItemId: claim.id,
      });
      evidenceStrength *= 0.8;
    }

    claimScores.push(evidenceStrength);
  }

  details.avgClaimSupport = mean(claimScores);
  details.supportedClaims = claimScores.filter((s) => s > 0).length / claims.length;

  // Data quality assessment
  details.dataQuality = assessDataQuality(dataPoints);

  // Check for insufficient data points overall
  if (dataPoints.length < claims.length) {
    flags.push({
      code: 'INSUFFICIENT_DATA_POINTS',
      severity: 'warning',
      message: `Only ${dataPoints.length} data points for ${claims.length} claims`,
      dimension: 'evidence',
    });
  }

  // Calculate final score
  const finalScore = 0.7 * details.avgClaimSupport + 0.3 * details.dataQuality;

  return {
    score: clamp(finalScore, 0, 1),
    flags,
    details,
  };
}

// =============================================================================
// REPRODUCIBILITY ASSESSMENT
// =============================================================================

function scoreMethodologyDetail(methodology: Methodology): number {
  let score = 0;
  const maxScore = 1.0;
  const checkpoints = [
    { check: !!methodology.studyType, weight: 0.1 },
    { check: methodology.sampleSize !== undefined, weight: 0.15 },
    { check: !!methodology.populationDescription, weight: 0.1 },
    { check: (methodology.inclusionCriteria?.length || 0) > 0, weight: 0.1 },
    { check: (methodology.exclusionCriteria?.length || 0) > 0, weight: 0.1 },
    { check: methodology.biasControls.length > 0, weight: 0.15 },
    { check: (methodology.statisticalMethods?.length || 0) > 0, weight: 0.15 },
    { check: methodology.description.length > 200, weight: 0.15 },
  ];

  for (const cp of checkpoints) {
    if (cp.check) {
      score += cp.weight;
    }
  }

  return Math.min(score, maxScore);
}

function assessReproducibility(research: ResearchArtifact): DimensionResult {
  const flags: ValidationFlag[] = [];
  const details: Record<string, number> = {};
  let score = 0;

  // Data availability (25%)
  if (research.dataAvailable) {
    details.dataAvailability = 1.0;
    score += 0.25;
  } else {
    details.dataAvailability = 0;
    flags.push({
      code: 'DATA_NOT_AVAILABLE',
      severity: 'warning',
      message: 'Research data is not publicly available',
      dimension: 'reproducibility',
    });
  }

  // Methods/protocol availability (25%)
  if (research.methodsAvailable) {
    details.methodsAvailability = 1.0;
    score += 0.25;
  } else {
    details.methodsAvailability = 0;
    flags.push({
      code: 'METHODS_NOT_AVAILABLE',
      severity: 'warning',
      message: 'Detailed methods/protocols are not publicly available',
      dimension: 'reproducibility',
    });
  }

  // Code availability (bonus, included in methods)
  if (research.codeAvailable) {
    details.codeAvailability = 1.0;
    score += 0.05; // Bonus
  }

  // Methodology detail score (25%)
  details.methodologyDetail = scoreMethodologyDetail(research.methodology);
  score += 0.25 * details.methodologyDetail;

  // Pre-registration (15%)
  if (research.metadata.isPreregistered) {
    details.preregistration = 1.0;
    score += 0.15;
  } else {
    details.preregistration = 0;
    // Only flag for study types where pre-registration is expected
    const requiresPreregistration = ['randomized_controlled_trial', 'cohort_study'].includes(
      research.methodology.studyType
    );
    if (requiresPreregistration) {
      flags.push({
        code: 'NOT_PREREGISTERED',
        severity: 'info',
        message: 'Study was not pre-registered',
        dimension: 'reproducibility',
      });
    } else {
      score += 0.15; // Full credit for study types where N/A
    }
  }

  // Data availability statement (10%)
  if (research.metadata.dataAvailabilityStatement) {
    details.dataStatement = 1.0;
    score += 0.1;
  } else {
    details.dataStatement = 0;
    flags.push({
      code: 'NO_DATA_AVAILABILITY_STATEMENT',
      severity: 'info',
      message: 'No data availability statement provided',
      dimension: 'reproducibility',
    });
  }

  return {
    score: clamp(score, 0, 1),
    flags,
    details,
  };
}

// =============================================================================
// CONFIDENCE CALCULATION
// =============================================================================

function computeConfidence(research: ResearchArtifact, flags: ValidationFlag[]): number {
  let confidence = 1.0;

  // Reduce confidence based on missing information
  if (!research.metadata.doi) {
    confidence -= 0.05;
  }
  if (research.citations.length < 3) {
    confidence -= 0.1;
  }
  if (research.claims.length === 0) {
    confidence -= 0.2;
  }
  if (research.dataPoints.length === 0) {
    confidence -= 0.15;
  }

  // Reduce confidence based on critical flags
  const criticalFlags = flags.filter((f) => f.severity === 'critical');
  confidence -= 0.05 * criticalFlags.length;

  // Reduce confidence based on warning flags
  const warningFlags = flags.filter((f) => f.severity === 'warning');
  confidence -= 0.02 * warningFlags.length;

  return clamp(confidence, 0.1, 1.0);
}

// =============================================================================
// RECOMMENDATION GENERATION
// =============================================================================

function generateRecommendations(
  flags: ValidationFlag[],
  dimensionScores: ValidationResult['dimensionScores']
): string[] {
  const recommendations: string[] = [];

  // Critical issues first
  const criticalFlags = flags.filter((f) => f.severity === 'critical');
  for (const flag of criticalFlags.slice(0, 3)) {
    recommendations.push(`🔴 CRITICAL: Address ${flag.code.toLowerCase().replace(/_/g, ' ')}`);
  }

  // Dimension-specific recommendations
  if (dimensionScores.credibility < 0.6) {
    recommendations.push('📚 Strengthen citations with peer-reviewed, high-impact sources');
  }
  if (dimensionScores.methodology < 0.6) {
    recommendations.push('🔬 Improve methodology documentation and bias controls');
  }
  if (dimensionScores.evidence < 0.6) {
    recommendations.push('📊 Provide stronger evidence support for claims');
  }
  if (dimensionScores.reproducibility < 0.6) {
    recommendations.push('🔄 Increase transparency by sharing data and detailed methods');
  }

  // General improvements based on warning flags
  const warningFlags = flags.filter((f) => f.severity === 'warning');
  for (const flag of warningFlags.slice(0, 2)) {
    if (!recommendations.some((r) => r.includes(flag.code))) {
      recommendations.push(`⚠️ Consider: ${flag.message}`);
    }
  }

  // Limit recommendations
  return recommendations.slice(0, 7);
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validates a research artifact using the CMER Framework
 *
 * @param research - The research artifact to validate
 * @param customWeights - Optional custom weights for dimensions (must sum to 1.0)
 * @returns Comprehensive validation result with scores, flags, and recommendations
 *
 * @example
 * ```typescript
 * const result = validateResearch(myResearch);
 * log.info(`Overall Score: ${result.overallScore} (${result.grade})`);
 * log.info(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
 * ```
 */
export function validateResearch(
  research: ResearchArtifact,
  customWeights?: Partial<ValidationWeights>
): ValidationResult {
  // Validate and apply weights
  const weights: ValidationWeights = { ...DEFAULT_WEIGHTS, ...customWeights };
  const weightSum = weights.credibility + weights.methodology + weights.evidence + weights.reproducibility;

  if (Math.abs(weightSum - 1.0) > 0.001) {
    throw new Error(`Weights must sum to 1.0, got ${weightSum}`);
  }

  // Precondition validation
  if (research.claims.length === 0) {
    throw new Error('Research artifact must have at least one claim');
  }

  // Phase 1: Credibility Assessment
  const credibilityResult = assessCredibility(research.citations, research.metadata);

  // Phase 2: Methodology Assessment
  const methodologyResult = assessMethodology(research.methodology);

  // Phase 3: Evidence Assessment
  const evidenceResult = assessEvidence(research.claims, research.dataPoints);

  // Phase 4: Reproducibility Assessment
  const reproducibilityResult = assessReproducibility(research);

  // Aggregate all flags
  const allFlags = [
    ...credibilityResult.flags,
    ...methodologyResult.flags,
    ...evidenceResult.flags,
    ...reproducibilityResult.flags,
  ];

  // Sort flags by severity
  const severityOrder: Record<FlagSeverity, number> = { critical: 0, warning: 1, info: 2 };
  allFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Calculate overall score
  const overallScore =
    weights.credibility * credibilityResult.score +
    weights.methodology * methodologyResult.score +
    weights.evidence * evidenceResult.score +
    weights.reproducibility * reproducibilityResult.score;

  const dimensionScores = {
    credibility: credibilityResult.score,
    methodology: methodologyResult.score,
    evidence: evidenceResult.score,
    reproducibility: reproducibilityResult.score,
  };

  // Calculate confidence
  const confidence = computeConfidence(research, allFlags);

  // Generate recommendations
  const recommendations = generateRecommendations(allFlags, dimensionScores);

  // Generate summary
  const grade = scoreToGrade(overallScore);
  const criticalCount = allFlags.filter((f) => f.severity === 'critical').length;
  const warningCount = allFlags.filter((f) => f.severity === 'warning').length;

  let summary = `Research validation complete: Grade ${grade} (${(overallScore * 100).toFixed(0)}%)`;
  if (criticalCount > 0) {
    summary += ` | ${criticalCount} critical issue(s)`;
  }
  if (warningCount > 0) {
    summary += ` | ${warningCount} warning(s)`;
  }
  summary += ` | Confidence: ${(confidence * 100).toFixed(0)}%`;

  return {
    overallScore: clamp(overallScore, 0, 1),
    grade,
    dimensionScores,
    flags: allFlags,
    confidence,
    recommendations,
    summary,
  };
}

// =============================================================================
// QUICK VALIDATION (Simplified Interface)
// =============================================================================

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

/**
 * Quick validation for when full research artifact isn't available
 */
export function quickValidate(input: QuickValidationInput): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
} {
  let score = 0;

  // Credibility (25%)
  score += 0.25 * (input.isPeerReviewed ? 0.8 : 0.3);
  score += 0.25 * 0.2 * Math.min(input.citationCount / 20, 1);

  // Methodology (30%)
  score += 0.3 * STUDY_TYPE_SCORES[input.studyType];
  if (input.sampleSize) {
    const minSize = MIN_SAMPLE_SIZES[input.studyType] || 30;
    score += 0.3 * 0.3 * Math.min(input.sampleSize / minSize, 1);
  }
  score += 0.3 * 0.2 * (input.hasBiasControls ? 1 : 0.3);

  // Evidence (25%)
  score += 0.25 * input.supportedClaimPercentage;

  // Reproducibility (20%)
  score += 0.2 * (input.dataAvailable ? 0.8 : 0.3);

  const grade = scoreToGrade(score);

  return {
    score: clamp(score, 0, 1),
    grade,
    summary: `Quick validation: Grade ${grade} (${(score * 100).toFixed(0)}%)`,
  };
}
