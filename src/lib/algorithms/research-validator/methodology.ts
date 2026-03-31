/**
 * CMER Framework — Methodology Assessment
 *
 * Evaluates study design rigor, sample size adequacy, bias controls,
 * and statistical methods appropriateness.
 */

import type { BiasControl, DimensionResult, Methodology, StudyType, ValidationFlag } from './types';
import { BIAS_CONTROL_SCORES, clamp, MIN_SAMPLE_SIZES, STUDY_TYPE_SCORES } from './types';

// =============================================================================
// METHODOLOGY ASSESSMENT
// =============================================================================

export function scoreStudyDesign(studyType: StudyType): number {
  return STUDY_TYPE_SCORES[studyType] || 0.4;
}

export function scoreBiasControls(biasControls: BiasControl[]): number {
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

export function scoreStatisticalMethods(methodology: Methodology): number {
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

export function assessMethodology(methodology: Methodology): DimensionResult {
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
