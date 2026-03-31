/**
 * Grounded uncertainty — UncertainValue<T> with confidence bands.
 *
 * TypeScript mirror of Rust `grounded::Uncertain<T>`. Wraps a computed
 * value with a confidence score and discrete band, forcing explicit
 * handling of epistemic uncertainty in PV signal results.
 *
 * T1 primitives: ×(Product) = value × confidence, ∂(Boundary) = band thresholds
 */

import type { ContingencyTable, SignalResult } from "./signal-detection";
import { computeSignals } from "./signal-detection";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ConfidenceBand = "high" | "medium" | "low" | "negligible";

export interface UncertainValue<T> {
  /** The computed value */
  value: T;
  /** Confidence score in [0, 1] */
  confidence: number;
  /** Discrete confidence band */
  band: ConfidenceBand;
  /** Optional provenance string describing the computation source */
  provenance?: string;
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Map a raw confidence score to a discrete band.
 *
 * Thresholds match Rust `grounded::ConfidenceBand`:
 * - High:       >= 0.95
 * - Medium:     >= 0.80
 * - Low:        >= 0.50
 * - Negligible: < 0.50
 */
export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.95) return "high";
  if (confidence >= 0.8) return "medium";
  if (confidence >= 0.5) return "low";
  return "negligible";
}

/**
 * Derive confidence from signal statistics using log-scale CI width.
 *
 * For ratio statistics (PRR, ROR, EBGM), CIs are computed as
 * exp(ln(est) ± Z*SE), making ln(upper/lower) = 2*Z*SE the true
 * precision measure — independent of point estimate magnitude.
 *
 * CALIBRATION (matches Rust `derive_confidence` in grounded_signals.rs):
 * - ln(upper/lower) < 1.0 with n >= 10: High (0.95)
 * - ln(upper/lower) < 2.0 with n >= 5:  Medium (0.80)
 * - ln(upper/lower) < 3.0 with n >= 3:  Low (0.50)
 * - Otherwise:                           Negligible (0.30)
 */
export function deriveConfidence(
  pointEstimate: number,
  lowerCi: number,
  upperCi: number,
  caseCount: number,
): number {
  // Log-scale CI width: ln(upper/lower) = 2*Z*SE for ratio statistics
  const logCiWidth =
    upperCi > 0 && lowerCi > 0 ? Math.log(upperCi / lowerCi) : Infinity;

  if (logCiWidth < 1.0 && caseCount >= 10) return 0.95;
  if (logCiWidth < 2.0 && caseCount >= 5) return 0.8;
  if (logCiWidth < 3.0 && caseCount >= 3) return 0.5;
  return 0.3;
}

// ─── Signal Uncertain Wrappers ──────────────────────────────────────────────

/**
 * PRR with grounded uncertainty.
 *
 * Computes PRR via computeSignals then wraps with confidence
 * derived from CI width and case count.
 */
export function prrUncertain(table: ContingencyTable): UncertainValue<number> {
  const result = computeSignals(table);
  // PRR CI: exp(ln(PRR) ± 1.96 * SE)
  const se = computePrrSe(table);
  const lnPrr = Math.log(result.prr);
  const lower = Math.exp(lnPrr - 1.96 * se);
  const upper = Math.exp(lnPrr + 1.96 * se);

  const conf = deriveConfidence(result.prr, lower, upper, table.a);
  return {
    value: result.prr,
    confidence: conf,
    band: confidenceBand(conf),
    provenance: "PRR disproportionality analysis",
  };
}

/**
 * ROR with grounded uncertainty.
 *
 * Uses the ROR CI already computed by computeSignals.
 */
export function rorUncertain(table: ContingencyTable): UncertainValue<number> {
  const result = computeSignals(table);
  const conf = deriveConfidence(
    result.ror,
    result.ror_lower,
    result.ror_upper,
    table.a,
  );
  return {
    value: result.ror,
    confidence: conf,
    band: confidenceBand(conf),
    provenance: "ROR disproportionality analysis",
  };
}

/**
 * All signals with grounded uncertainty.
 *
 * Returns uncertain wrappers for PRR, ROR, IC, and EBGM.
 */
export function evaluateAllUncertain(
  table: ContingencyTable,
): Record<"PRR" | "ROR" | "IC" | "EBGM", UncertainValue<number>> {
  const result = computeSignals(table);

  // PRR CI
  const prrSe = computePrrSe(table);
  const lnPrr = Math.log(result.prr);
  const prrLower = Math.exp(lnPrr - 1.96 * prrSe);
  const prrUpper = Math.exp(lnPrr + 1.96 * prrSe);
  const prrConf = deriveConfidence(result.prr, prrLower, prrUpper, table.a);

  // ROR CI — already in result
  const rorConf = deriveConfidence(
    result.ror,
    result.ror_lower,
    result.ror_upper,
    table.a,
  );

  // IC CI — use ic025 as lower bound proxy, mirror for upper
  const icSpan = result.ic - result.ic025;
  const icUpper = result.ic + icSpan;
  const icLowerAbs = Math.pow(2, result.ic025);
  const icUpperAbs = Math.pow(2, icUpper);
  const icConf = deriveConfidence(
    Math.pow(2, result.ic),
    icLowerAbs,
    icUpperAbs,
    table.a,
  );

  // EBGM CI — use eb05 as lower bound, mirror for upper
  const ebgmSpan = result.ebgm - result.eb05;
  const ebgmUpper = result.ebgm + ebgmSpan;
  const ebgmConf = deriveConfidence(
    result.ebgm,
    result.eb05,
    ebgmUpper,
    table.a,
  );

  return {
    PRR: {
      value: result.prr,
      confidence: prrConf,
      band: confidenceBand(prrConf),
      provenance: "PRR disproportionality analysis",
    },
    ROR: {
      value: result.ror,
      confidence: rorConf,
      band: confidenceBand(rorConf),
      provenance: "ROR disproportionality analysis",
    },
    IC: {
      value: result.ic,
      confidence: icConf,
      band: confidenceBand(icConf),
      provenance: "IC Bayesian signal analysis",
    },
    EBGM: {
      value: result.ebgm,
      confidence: ebgmConf,
      band: confidenceBand(ebgmConf),
      provenance: "EBGM empirical Bayes analysis",
    },
  };
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

/** PRR standard error: sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d)) */
function computePrrSe(t: ContingencyTable): number {
  const { a, b, c, d } = t;
  if (a === 0 || c === 0) return Infinity;
  return Math.sqrt(1 / a - 1 / (a + b) + 1 / c - 1 / (c + d));
}
