/**
 * CMER Framework — Scoring, Reproducibility, Confidence & Main Validation
 *
 * Combines reproducibility assessment, confidence calculation,
 * recommendation generation, and the main validateResearch entry point.
 */

import { assessCredibility } from './credibility';
import { assessEvidence } from './evidence';
import { assessMethodology } from './methodology';
import type {
  FlagSeverity,
  Methodology,
  QuickValidationInput,
  ResearchArtifact,
  ValidationFlag,
  ValidationResult,
  ValidationWeights,
  DimensionResult,
} from './types';
import { clamp, DEFAULT_WEIGHTS, MIN_SAMPLE_SIZES, scoreToGrade, STUDY_TYPE_SCORES } from './types';

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
