/**
 * EBGM (Empirical Bayesian Geometric Mean) Algorithm
 *
 * Implementation of DuMouchel's Gamma-Poisson Shrinker (GPS) model
 * for pharmacovigilance signal detection.
 *
 * @see DuMouchel, W. (1999). Bayesian Data Mining in Large Frequency Tables
 * @see https://journal.r-project.org/articles/RJ-2017-063/ (openEBGM)
 *
 * @copyright AlgoVigilance 2025
 * @license Proprietary - Trade Secret
 */

import type { ContingencyTableExtended, EBGMResult } from '../../types/federated-signal';
import { classifySignalStrength } from './signal-utils';

// Re-export EBGMResult from types for convenience
export type { EBGMResult } from '../../types/federated-signal';

/**
 * Hyperparameters for the Gamma-Poisson Shrinker model
 */
export interface GPSHyperparameters {
  /** First gamma component shape parameter */
  alpha1: number;
  /** First gamma component rate parameter */
  beta1: number;
  /** Second gamma component shape parameter */
  alpha2: number;
  /** Second gamma component rate parameter */
  beta2: number;
  /** Mixing proportion (probability of first component) */
  P: number;
}

/**
 * Default GPS hyperparameters
 * Source: openEBGM package defaults / DuMouchel (1999)
 *
 * Component 1: Models rare but potentially significant signals
 * Component 2: Models the bulk of drug-event pairs (background)
 */
export const DEFAULT_GPS_HYPERPARAMETERS: GPSHyperparameters = {
  alpha1: 0.2,
  beta1: 0.1,
  alpha2: 2.0,
  beta2: 4.0,
  P: 0.1,
};

// =============================================================================
// Mathematical Helper Functions
// =============================================================================

/**
 * Digamma function (derivative of log-gamma)
 * Using asymptotic expansion for numerical stability
 *
 * ψ(x) = d/dx ln(Γ(x))
 */
function digamma(x: number): number {
  if (x <= 0) {
    throw new Error('Digamma undefined for x <= 0');
  }

  // Use recurrence relation for small x: ψ(x) = ψ(x+1) - 1/x
  let result = 0;
  while (x < 6) {
    result -= 1 / x;
    x += 1;
  }

  // Asymptotic expansion for large x
  // ψ(x) ≈ ln(x) - 1/(2x) - 1/(12x²) + 1/(120x⁴) - 1/(252x⁶)
  result += Math.log(x) - 1 / (2 * x);
  const x2 = x * x;
  result -= 1 / (12 * x2);
  result += 1 / (120 * x2 * x2);
  result -= 1 / (252 * x2 * x2 * x2);

  return result;
}

/**
 * Log of gamma function using Stirling's approximation
 * More numerically stable than computing Γ(x) directly
 */
function logGamma(x: number): number {
  if (x <= 0) {
    throw new Error('Log-gamma undefined for x <= 0');
  }

  // Lanczos approximation coefficients
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (x < 0.5) {
    // Reflection formula: Γ(1-x)Γ(x) = π/sin(πx)
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }

  x -= 1;
  let a = c[0];
  for (let i = 1; i < g + 2; i++) {
    a += c[i] / (x + i);
  }
  const t = x + g + 0.5;

  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Log of negative binomial probability mass function
 * P(N=n | α, β, E) = Γ(α+n)/(Γ(α)n!) * (β/(β+E))^α * (E/(β+E))^n
 */
function logNegBinomialPMF(n: number, alpha: number, beta: number, E: number): number {
  const p = beta / (beta + E);
  const q = E / (beta + E);

  return (
    logGamma(alpha + n) -
    logGamma(alpha) -
    logGamma(n + 1) +
    alpha * Math.log(p) +
    n * Math.log(q)
  );
}

/**
 * Compute Qn: posterior probability that λ came from first component
 *
 * Qn = P * f1(n|E) / (P * f1(n|E) + (1-P) * f2(n|E))
 * where fi is the negative binomial PMF for component i
 */
function computeQn(
  n: number,
  E: number,
  hyperparams: GPSHyperparameters
): number {
  const { alpha1, beta1, alpha2, beta2, P } = hyperparams;

  // Log scale for numerical stability
  const logF1 = logNegBinomialPMF(n, alpha1, beta1, E);
  const logF2 = logNegBinomialPMF(n, alpha2, beta2, E);

  // Qn = P * exp(logF1) / (P * exp(logF1) + (1-P) * exp(logF2))
  // = 1 / (1 + (1-P)/P * exp(logF2 - logF1))
  const logOdds = Math.log((1 - P) / P) + logF2 - logF1;

  // Numerical stability: if logOdds is very large/small
  if (logOdds > 700) return 0; // exp(700) overflows
  if (logOdds < -700) return 1;

  return 1 / (1 + Math.exp(logOdds));
}

/**
 * Compute EBGM: Empirical Bayes Geometric Mean
 *
 * EBGM = exp(E[log(λ) | N=n])
 * where the expectation is over the posterior mixture distribution
 *
 * E[log(λ)] = Qn * (ψ(α1+n) - log(β1+E)) + (1-Qn) * (ψ(α2+n) - log(β2+E))
 */
function computeEBGM(
  n: number,
  E: number,
  Qn: number,
  hyperparams: GPSHyperparameters
): number {
  const { alpha1, beta1, alpha2, beta2 } = hyperparams;

  // Expected log(λ) for each component
  const eLogLambda1 = digamma(alpha1 + n) - Math.log(beta1 + E);
  const eLogLambda2 = digamma(alpha2 + n) - Math.log(beta2 + E);

  // Mixture expectation
  const eLogLambda = Qn * eLogLambda1 + (1 - Qn) * eLogLambda2;

  // EBGM is the antilog (geometric mean)
  return Math.exp(eLogLambda);
}

/**
 * Compute quantile of posterior mixture using bisection
 * The posterior is a mixture of two gamma distributions
 *
 * @param quantile - Target quantile (0-1)
 * @param n - Observed count
 * @param E - Expected count
 * @param Qn - Posterior mixture weight
 * @param hyperparams - GPS hyperparameters
 * @returns Lambda value at the specified quantile
 */
function computePosteriorQuantile(
  quantile: number,
  n: number,
  E: number,
  Qn: number,
  hyperparams: GPSHyperparameters
): number {
  const { alpha1, beta1, alpha2, beta2 } = hyperparams;

  // Posterior parameters
  const a1 = alpha1 + n;
  const b1 = beta1 + E;
  const a2 = alpha2 + n;
  const b2 = beta2 + E;

  // Bisection search for quantile
  let lo = 1e-10;
  let hi = 1000;
  const tolerance = 1e-8;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2;
    const cdf = mixtureCDF(mid, a1, b1, a2, b2, Qn);

    if (Math.abs(cdf - quantile) < tolerance) {
      return mid;
    }

    if (cdf < quantile) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return (lo + hi) / 2;
}

/**
 * CDF of gamma mixture distribution
 * F(x) = Qn * Gamma_CDF(x; a1, b1) + (1-Qn) * Gamma_CDF(x; a2, b2)
 */
function mixtureCDF(
  x: number,
  a1: number,
  b1: number,
  a2: number,
  b2: number,
  Qn: number
): number {
  const cdf1 = gammaCDF(x, a1, b1);
  const cdf2 = gammaCDF(x, a2, b2);
  return Qn * cdf1 + (1 - Qn) * cdf2;
}

/**
 * Gamma distribution CDF using incomplete gamma function
 * P(X ≤ x) for X ~ Gamma(shape=a, rate=b)
 */
function gammaCDF(x: number, shape: number, rate: number): number {
  if (x <= 0) return 0;
  return regularizedGammaP(shape, rate * x);
}

/**
 * Regularized lower incomplete gamma function P(a,x)
 * Uses series expansion for x < a+1, continued fraction otherwise
 */
function regularizedGammaP(a: number, x: number): number {
  if (x < 0 || a <= 0) {
    throw new Error('Invalid parameters for regularized gamma');
  }

  if (x === 0) return 0;

  // Use series expansion for x < a+1
  if (x < a + 1) {
    return gammaPSeries(a, x);
  }

  // Use continued fraction for x >= a+1
  return 1 - gammaPContinuedFraction(a, x);
}

/**
 * Series expansion for regularized incomplete gamma
 */
function gammaPSeries(a: number, x: number): number {
  const maxIterations = 200;
  const epsilon = 1e-10;

  let sum = 1 / a;
  let term = sum;

  for (let n = 1; n < maxIterations; n++) {
    term *= x / (a + n);
    sum += term;

    if (Math.abs(term) < epsilon * Math.abs(sum)) {
      break;
    }
  }

  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * sum;
}

/**
 * Continued fraction for upper incomplete gamma Q(a,x) = 1 - P(a,x)
 */
function gammaPContinuedFraction(a: number, x: number): number {
  const maxIterations = 200;
  const epsilon = 1e-10;

  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;

  for (let i = 1; i < maxIterations; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < epsilon) {
      break;
    }
  }

  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

// =============================================================================
// Main EBGM Calculation Function
// =============================================================================

/**
 * Calculate EBGM (Empirical Bayesian Geometric Mean) from contingency table
 *
 * Implements DuMouchel's Gamma-Poisson Shrinker (GPS) model for
 * pharmacovigilance signal detection with empirical Bayesian shrinkage.
 *
 * @param table - Aggregated contingency table
 * @param hyperparams - GPS hyperparameters (optional, uses defaults)
 * @returns EBGM result with credibility intervals
 */
export function calculateEBGM(
  table: ContingencyTableExtended,
  hyperparams: GPSHyperparameters = DEFAULT_GPS_HYPERPARAMETERS
): EBGMResult {
  const { a, E } = table;

  // Handle edge cases
  if (a === 0 || E === 0) {
    return {
      value: 0,
      eb05: 0,
      eb95: 0,
      posteriorWeight: 0,
      rawRatio: 0,
      shrinkageFactor: 0,
      isSignal: false,
      strength: 'no_signal',
    };
  }

  // Raw N/E ratio (before shrinkage)
  const rawRatio = a / E;

  // Compute posterior mixture weight Qn
  const Qn = computeQn(a, E, hyperparams);

  // Compute EBGM (geometric mean of posterior)
  const ebgm = computeEBGM(a, E, Qn, hyperparams);

  // Compute credibility intervals
  const eb05 = computePosteriorQuantile(0.05, a, E, Qn, hyperparams);
  const eb95 = computePosteriorQuantile(0.95, a, E, Qn, hyperparams);

  // Shrinkage factor (how much the raw ratio was shrunk)
  const shrinkageFactor = rawRatio > 0 ? ebgm / rawRatio : 0;

  // Signal determination (standard threshold: EB05 > 2)
  const isSignal = eb05 > 2.0 && a >= 3;

  return {
    value: ebgm,
    eb05,
    eb95,
    posteriorWeight: Qn,
    rawRatio,
    shrinkageFactor,
    isSignal,
    strength: classifySignalStrength(ebgm, isSignal),
  };
}

// =============================================================================
// Federated EBGM Thresholds
// =============================================================================

/**
 * Federated EBGM signal thresholds (more conservative due to noise)
 */
export const FEDERATED_EBGM_THRESHOLDS = {
  /** EB05 threshold for signal (standard: 2.0) */
  eb05Threshold: 2.5,
  /** Minimum case count */
  minCases: 5,
  /** Minimum EBGM for any signal */
  minEBGM: 2.0,
} as const;

/**
 * Calculate EBGM with federated thresholds
 */
export function calculateFederatedEBGM(
  table: ContingencyTableExtended,
  hyperparams: GPSHyperparameters = DEFAULT_GPS_HYPERPARAMETERS
): EBGMResult {
  const result = calculateEBGM(table, hyperparams);

  // Apply federated thresholds (more conservative)
  const isSignal =
    result.eb05 > FEDERATED_EBGM_THRESHOLDS.eb05Threshold &&
    table.a >= FEDERATED_EBGM_THRESHOLDS.minCases &&
    result.value >= FEDERATED_EBGM_THRESHOLDS.minEBGM;

  return {
    ...result,
    isSignal,
    strength: classifySignalStrength(result.value, isSignal),
  };
}
