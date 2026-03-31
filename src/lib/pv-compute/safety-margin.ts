/**
 * Client-side safety margin computation.
 *
 * Combines all five disproportionality signal results into a single
 * "distance from danger" score for the ScoreMeter gauge.
 *
 * T1 primitives: ∂(Boundary) + Σ(Sequencing) + κ(Comparison)
 */

import type { SignalResult } from "./signal-detection";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface SafetyZone {
  label: string;
  min: number;
  max: number;
  color: string;
}

export interface SafetyMarginResult {
  /** Raw margin distance — positive = safe, zero/negative = signal territory */
  margin: number;
  /** Normalized 0-100 score for ScoreMeter */
  score: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

export const SAFETY_MARGIN_ZONES: SafetyZone[] = [
  { label: "Danger", min: 0, max: 33, color: "bg-red-500" },
  { label: "Caution", min: 33, max: 66, color: "bg-amber-500" },
  { label: "Safe", min: 66, max: 100, color: "bg-emerald-500" },
];

/* ------------------------------------------------------------------ */
/*  computeSafetyMargin                                                 */
/* ------------------------------------------------------------------ */

/**
 * Compute minimum distance from signal thresholds across all five metrics.
 *
 * d = min(PRR/2 - 1, ROR_lower - 1, IC025, EB05/2 - 1, ln(n/3))
 * Positive d → safe side of thresholds; d <= 0 → at or past danger.
 *
 * @param result - Full signal detection result
 * @param n - Number of drug+event reports (cell "a" of contingency table)
 * @returns Raw margin distance
 */
export function computeSafetyMargin(result: SignalResult, n: number): number {
  const terms = [
    result.prr / 2.0 - 1,
    result.ror_lower - 1,
    result.ic025,
    result.eb05 / 2.0 - 1,
    n > 0 ? Math.log(n / 3) : -Infinity,
  ].filter((v) => isFinite(v));

  if (terms.length === 0) return 0;
  return Math.min(...terms);
}

/* ------------------------------------------------------------------ */
/*  marginToScore                                                       */
/* ------------------------------------------------------------------ */

/**
 * Map continuous margin distance to 0-100 for ScoreMeter display.
 *
 *   d <= 0   → Danger zone  (0-33)
 *   0 < d <= 1 → Caution zone (33-66)
 *   d > 1   → Safe zone    (66-100)
 */
export function marginToScore(d: number): number {
  if (d <= 0) return Math.max(0, Math.round(16.5 + d * 16.5));
  if (d <= 1) return Math.round(33 + d * 33);
  return Math.min(100, Math.round(66 + Math.min(d - 1, 1) * 34));
}
