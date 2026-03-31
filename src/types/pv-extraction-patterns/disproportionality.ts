// ============================================================================
// PV EXTRACTION PATTERNS — DISPROPORTIONALITY ANALYSIS
// ============================================================================
// Calculation functions and result types for disproportionality analysis.
// Source: OpenRIMS-PV extraction patterns (clean-room implementation).

import type { SignalStrength } from './signal';

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * 2x2 Contingency Table for disproportionality analysis
 *
 * @see /docs/junkyard/faers-signal-detection-extraction.md
 */
export interface ContingencyTable {
  /** A: Reports with both drug AND event */
  a: number;
  /** B: Reports with drug but NOT event */
  b: number;
  /** C: Reports with event but NOT drug */
  c: number;
  /** D: Reports with neither drug nor event */
  d: number;
}

/**
 * Proportional Reporting Ratio (PRR) result
 */
export interface PRRResult {
  prr: number;
  ciLow: number;
  ciHigh: number;
  chiSquare: number;
  isSignal: boolean; // PRR >= 2, Chi² >= 4, A >= 3
}

/**
 * Reporting Odds Ratio (ROR) result
 */
export interface RORResult {
  ror: number;
  ciLow: number;
  ciHigh: number;
  isSignal: boolean; // CI lower bound > 1
}

/**
 * Information Component (IC/BCPNN) result
 */
export interface ICResult {
  ic: number;
  variance: number;
  ciLow: number;
  ciHigh: number;
  isSignal: boolean; // IC025 > 0
}

/**
 * Bayesian disproportionality result (Monte Carlo sampling)
 */
export interface BayesianResult {
  mean: number;
  median: number;
  ciLow: number;
  ciHigh: number;
  probabilityGreaterThanOne: number; // P(metric > 1)
}

/**
 * Complete disproportionality analysis result
 */
export interface DisproportionalityResult {
  drug: string;
  event: string;
  contingencyTable: ContingencyTable;

  // Frequentist measures
  prr: PRRResult;
  ror: RORResult;

  // Bayesian measures
  ic: ICResult;
  bayesianPRR?: BayesianResult;
  bayesianROR?: BayesianResult;

  // Statistical tests
  fisherPValue: number;
  chiSquarePValue: number;

  // Overall assessment
  isSignal: boolean;
  signalStrength: SignalStrength;
}

/**
 * Signal detection thresholds (configurable)
 */
export interface SignalThresholds {
  /** Minimum PRR value (default: 2.0) */
  minPRR: number;
  /** Minimum chi-square value (default: 4.0) */
  minChiSquare: number;
  /** Minimum case count A (default: 3) */
  minCaseCount: number;
  /** Require ROR CI lower bound > 1 */
  requireRORSignificance: boolean;
  /** Require IC025 > 0 */
  requireICSignificance: boolean;
}

export const DEFAULT_SIGNAL_THRESHOLDS: SignalThresholds = {
  minPRR: 2.0,
  minChiSquare: 4.0,
  minCaseCount: 3,
  requireRORSignificance: true,
  requireICSignificance: false,
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate Proportional Reporting Ratio (PRR)
 *
 * PRR = [A/(A+B)] / [(A+C)/N]
 */
export function calculatePRR(table: ContingencyTable, thresholds = DEFAULT_SIGNAL_THRESHOLDS): PRRResult {
  const { a, b, c, d } = table;
  const n = a + b + c + d;

  // Guard against division by zero
  if (a + b === 0 || n === 0) {
    return { prr: 0, ciLow: 0, ciHigh: 0, chiSquare: 0, isSignal: false };
  }

  const numerator = a / (a + b);
  const denominator = (a + c) / n;

  if (denominator === 0) {
    return { prr: Infinity, ciLow: 0, ciHigh: Infinity, chiSquare: 0, isSignal: false };
  }

  const prr = numerator / denominator;

  // Standard error for log(PRR)
  const seLogPRR = Math.sqrt(1 / a - 1 / (a + b) + 1 / c - 1 / (c + d));
  const ciLow = Math.exp(Math.log(prr) - 1.96 * seLogPRR);
  const ciHigh = Math.exp(Math.log(prr) + 1.96 * seLogPRR);

  // Chi-square calculation
  const expected = ((a + b) * (a + c)) / n;
  const chiSquare = expected > 0 ? Math.pow(a - expected, 2) / expected : 0;

  // Signal detection (Evans criteria)
  const isSignal =
    prr >= thresholds.minPRR &&
    chiSquare >= thresholds.minChiSquare &&
    a >= thresholds.minCaseCount;

  return { prr, ciLow, ciHigh, chiSquare, isSignal };
}

/**
 * Calculate Reporting Odds Ratio (ROR)
 *
 * ROR = (A/B) / (C/D) = (A*D) / (B*C)
 */
export function calculateROR(table: ContingencyTable): RORResult {
  const { a, b, c, d } = table;

  // Guard against division by zero
  if (b === 0 || c === 0) {
    return { ror: Infinity, ciLow: 0, ciHigh: Infinity, isSignal: false };
  }

  const ror = (a * d) / (b * c);

  // Standard error for log(ROR)
  const seLogROR = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  const ciLow = Math.exp(Math.log(ror) - 1.96 * seLogROR);
  const ciHigh = Math.exp(Math.log(ror) + 1.96 * seLogROR);

  // Signal: lower CI bound > 1
  const isSignal = ciLow > 1.0;

  return { ror, ciLow, ciHigh, isSignal };
}

/**
 * Calculate Information Component (IC) / BCPNN
 *
 * IC = log2(observed / expected)
 */
export function calculateIC(table: ContingencyTable, continuity = 0.5): ICResult {
  const { a, b, c, d } = table;
  const n = a + b + c + d;

  if (n === 0) {
    return { ic: 0, variance: 0, ciLow: 0, ciHigh: 0, isSignal: false };
  }

  // Expected value
  const expected = ((a + b) * (a + c)) / n;

  // Apply continuity correction
  const aObs = a + continuity;
  const eAdj = expected === 0 ? continuity : expected;

  // IC calculation (log base 2)
  const ln2 = Math.log(2);
  const ic = Math.log(aObs / eAdj) / ln2;

  // Variance and CI
  const variance = (1 / (ln2 * ln2)) * (1 / aObs + 1 / eAdj);
  const se = Math.sqrt(variance);
  const ciLow = ic - 1.96 * se;
  const ciHigh = ic + 1.96 * se;

  // Signal: IC025 > 0
  const isSignal = ciLow > 0;

  return { ic, variance, ciLow, ciHigh, isSignal };
}

/**
 * Calculate Haldane's Odds Ratio with continuity correction
 * Useful when cells contain zeros
 */
export function calculateHaldaneOR(table: ContingencyTable): RORResult {
  const ac = table.a + 0.5;
  const bc = table.b + 0.5;
  const cc = table.c + 0.5;
  const dc = table.d + 0.5;

  const hor = (ac * dc) / (bc * cc);

  const seLogHOR = Math.sqrt(1 / ac + 1 / bc + 1 / cc + 1 / dc);
  const ciLow = Math.exp(Math.log(hor) - 1.96 * seLogHOR);
  const ciHigh = Math.exp(Math.log(hor) + 1.96 * seLogHOR);

  const isSignal = ciLow > 1.0;

  return { ror: hor, ciLow, ciHigh, isSignal };
}

/**
 * Perform complete disproportionality analysis
 */
export function analyzeDisproportionality(
  drug: string,
  event: string,
  table: ContingencyTable,
  thresholds = DEFAULT_SIGNAL_THRESHOLDS
): DisproportionalityResult {
  const prr = calculatePRR(table, thresholds);
  const ror = calculateROR(table);
  const ic = calculateIC(table);

  // Multi-criteria signal assessment
  const isSignal =
    prr.isSignal &&
    (!thresholds.requireRORSignificance || ror.isSignal) &&
    (!thresholds.requireICSignificance || ic.isSignal);

  // Determine signal strength
  let signalStrength: SignalStrength = 'none';
  if (isSignal) {
    if (prr.prr >= 4.0 && ror.ror >= 4.0) {
      signalStrength = 'strong';
    } else if (prr.prr >= 2.0 && ror.ror >= 2.0) {
      signalStrength = 'moderate';
    } else {
      signalStrength = 'weak';
    }
  }

  return {
    drug,
    event,
    contingencyTable: table,
    prr,
    ror,
    ic,
    fisherPValue: 0, // Would require external library
    chiSquarePValue: 0, // Would require external library
    isSignal,
    signalStrength,
  };
}
