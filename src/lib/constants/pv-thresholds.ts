/**
 * Pharmacovigilance Signal Detection Thresholds
 *
 * Single source of truth for all PV disproportionality signal thresholds.
 * Referenced by: signals.ts (server), signal-detection.ts (client), guardian/types.ts
 *
 * Standard thresholds per ICH/CIOMS guidelines:
 *   PRR >= 2.0, Chi² >= 3.841 (p<0.05, 1df), ROR LCI > 1.0, IC025 > 0, EB05 >= 2.0
 *
 * T1 primitives: ∂(Boundary) + N(Quantity) + κ(Comparison)
 */

// ============================================================================
// Signal Thresholds (positive signal detection)
// ============================================================================

export const PV_SIGNAL_THRESHOLDS = {
  /** PRR >= 2.0 indicates disproportionate reporting */
  prr: 2.0,
  /** Chi-square >= 3.841 corresponds to p < 0.05 with 1 degree of freedom */
  chiSquare: 3.841,
  /** ROR lower 95% CI > 1.0 indicates statistically significant odds ratio */
  rorLowerCI: 1.0,
  /** IC025 (lower 95% credible interval) > 0 indicates Bayesian signal */
  ic025: 0.0,
  /** EB05 (lower 5th percentile) >= 2.0 indicates empirical Bayes signal */
  eb05: 2.0,
} as const;

// ============================================================================
// Borderline Thresholds (for status classification)
// ============================================================================

export const PV_BORDERLINE_THRESHOLDS = {
  /** PRR borderline range: >= 1.5 but < signal threshold */
  prrBorderline: 1.5,
  /** ROR borderline range: >= 1.0 but below positive signal */
  rorBorderline: 1.0,
  /** IC borderline range: > -0.5 but <= 0 */
  icBorderline: -0.5,
  /** EBGM borderline range: >= 1.5 but < signal threshold */
  ebgmBorderline: 1.5,
  /** Chi-square borderline range: >= 2.0 but < 3.841 */
  chiSquareBorderline: 2.0,
} as const;

// ============================================================================
// Concordance Thresholds
// ============================================================================

export const PV_CONCORDANCE_THRESHOLDS = {
  /** >= 0.6 concordance score = strong agreement across algorithms */
  strong: 0.6,
  /** >= 0.4 concordance score = moderate agreement */
  moderate: 0.4,
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type SignalThresholds = typeof PV_SIGNAL_THRESHOLDS;
export type BorderlineThresholds = typeof PV_BORDERLINE_THRESHOLDS;
export type ConcordanceThresholds = typeof PV_CONCORDANCE_THRESHOLDS;

/** Mutable threshold overrides — partial, merged with defaults at resolution */
export interface SignalThresholdOverrides {
  prr?: number;
  chiSquare?: number;
  rorLowerCI?: number;
  ic025?: number;
  eb05?: number;
}

/** Resolved thresholds — always complete (defaults + overrides merged) */
export interface ResolvedSignalThresholds {
  prr: number;
  chiSquare: number;
  rorLowerCI: number;
  ic025: number;
  eb05: number;
}

/** Merge partial overrides with Evans defaults */
export function resolveThresholds(
  overrides?: SignalThresholdOverrides | null,
): ResolvedSignalThresholds {
  return {
    prr: overrides?.prr ?? PV_SIGNAL_THRESHOLDS.prr,
    chiSquare: overrides?.chiSquare ?? PV_SIGNAL_THRESHOLDS.chiSquare,
    rorLowerCI: overrides?.rorLowerCI ?? PV_SIGNAL_THRESHOLDS.rorLowerCI,
    ic025: overrides?.ic025 ?? PV_SIGNAL_THRESHOLDS.ic025,
    eb05: overrides?.eb05 ?? PV_SIGNAL_THRESHOLDS.eb05,
  };
}
