/**
 * CMER Framework — Evidence Assessment
 *
 * Evaluates claim support, evidence strength, data quality,
 * and statistical validity of supporting data points.
 */

import type { Claim, DataPoint, DimensionResult, ValidationFlag } from './types';
import { clamp, mean } from './types';

// =============================================================================
// EVIDENCE ASSESSMENT
// =============================================================================

export function findSupportingEvidence(claim: Claim, dataPoints: DataPoint[]): DataPoint[] {
  return dataPoints.filter((dp) => claim.supportingEvidenceIds.includes(dp.id));
}

export function evaluateEvidenceStrength(evidence: DataPoint[]): number {
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

export function assessDataQuality(dataPoints: DataPoint[]): number {
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

export function assessEvidence(claims: Claim[], dataPoints: DataPoint[]): DimensionResult {
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
