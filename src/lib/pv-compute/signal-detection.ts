/**
 * Client-side PV signal detection algorithms.
 *
 * All 5 standard disproportionality measures from a 2x2 contingency table.
 * No server round-trip — math runs in the browser.
 *
 * Reference: Bate et al. (1998), Evans et al. (2001), DuMouchel (1999)
 *
 * T1 primitives: κ(Comparison) + N(Quantity) + ∂(Boundary) + ν(Frequency)
 */

export interface ContingencyTable {
  /** Drug + Event */
  a: number;
  /** Drug + No Event */
  b: number;
  /** No Drug + Event */
  c: number;
  /** No Drug + No Event */
  d: number;
}

export interface SignalResult {
  prr: number;
  ror: number;
  ror_lower: number;
  ror_upper: number;
  ic: number;
  ic025: number;
  ebgm: number;
  eb05: number;
  chi_square: number;
  prr_signal: boolean;
  ror_signal: boolean;
  ic_signal: boolean;
  ebgm_signal: boolean;
  chi_signal: boolean;
  any_signal: boolean;
}

/**
 * Proportional Reporting Ratio
 * PRR = [a/(a+b)] / [c/(c+d)]
 * Signal: PRR >= 2.0
 */
function computePRR(t: ContingencyTable): number {
  const { a, b, c, d } = t;
  const drugRate = a / (a + b);
  const otherRate = c / (c + d);
  if (otherRate === 0) return Infinity;
  return drugRate / otherRate;
}

/**
 * Reporting Odds Ratio with 95% CI
 * ROR = (a*d) / (b*c)
 * Signal: lower 95% CI > 1.0
 */
function computeROR(t: ContingencyTable): { ror: number; lower: number; upper: number } {
  const { a, b, c, d } = t;
  if (b * c === 0) return { ror: Infinity, lower: Infinity, upper: Infinity };
  const ror = (a * d) / (b * c);
  const lnROR = Math.log(ror);
  const se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  return {
    ror,
    lower: Math.exp(lnROR - 1.96 * se),
    upper: Math.exp(lnROR + 1.96 * se),
  };
}

/**
 * Information Component (IC) with IC025 lower bound
 * IC = log2(observed / expected)
 * IC025: conservative lower bound (Norén et al. 2006)
 * Signal: IC025 > 0
 */
function computeIC(t: ContingencyTable): { ic: number; ic025: number } {
  const { a, b, c, d } = t;
  const N = a + b + c + d;
  const expected = ((a + b) * (a + c)) / N;
  if (expected === 0) return { ic: Infinity, ic025: Infinity };
  const ic = Math.log2(a / expected);
  // Norén approximation for lower credibility bound
  const ic025 = ic - 3.3 * (1 / Math.sqrt(a + 0.5));
  return { ic, ic025 };
}

/**
 * Empirical Bayes Geometric Mean (EBGM) with EB05 lower bound
 * Simplified GPS model (DuMouchel 1999)
 * Signal: EB05 >= 2.0
 */
function computeEBGM(t: ContingencyTable): { ebgm: number; eb05: number } {
  const { a, b, c, d } = t;
  const N = a + b + c + d;
  const expected = ((a + b) * (a + c)) / N;
  if (expected === 0) return { ebgm: Infinity, eb05: Infinity };

  // Simplified two-component Poisson mixture (DuMouchel 1999)
  // Prior: w * Gamma(alpha1, beta1) + (1-w) * Gamma(alpha2, beta2)
  const alpha1 = 0.2, beta1 = 0.1;
  const alpha2 = 2.0, beta2 = 4.0;
  const w = 1 / 3;

  // Posterior weights
  const logLik1 = alpha1 * Math.log(beta1) - (alpha1 + a) * Math.log(beta1 + expected)
    + logGamma(alpha1 + a) - logGamma(alpha1);
  const logLik2 = alpha2 * Math.log(beta2) - (alpha2 + a) * Math.log(beta2 + expected)
    + logGamma(alpha2 + a) - logGamma(alpha2);

  const maxLL = Math.max(logLik1, logLik2);
  const lik1 = w * Math.exp(logLik1 - maxLL);
  const lik2 = (1 - w) * Math.exp(logLik2 - maxLL);
  const totalLik = lik1 + lik2;
  const q1 = lik1 / totalLik;
  const q2 = lik2 / totalLik;

  // Posterior means for each component
  const mean1 = (alpha1 + a) / (beta1 + expected);
  const mean2 = (alpha2 + a) / (beta2 + expected);

  // EBGM = geometric mean of posterior mixture
  const logEBGM = q1 * Math.log(mean1) + q2 * Math.log(mean2);
  const ebgm = Math.exp(logEBGM);

  // EB05 approximation: shrink toward prior more aggressively
  // Use posterior variance for conservative bound
  const var1 = (alpha1 + a) / Math.pow(beta1 + expected, 2);
  const var2 = (alpha2 + a) / Math.pow(beta2 + expected, 2);
  const posteriorVar = q1 * (var1 + mean1 * mean1) + q2 * (var2 + mean2 * mean2)
    - Math.pow(q1 * mean1 + q2 * mean2, 2);
  const posteriorMean = q1 * mean1 + q2 * mean2;
  const logSD = Math.sqrt(posteriorVar) / posteriorMean; // CV
  const eb05 = ebgm * Math.exp(-1.645 * logSD);

  return { ebgm, eb05 };
}

/**
 * Chi-Square with Yates correction
 * χ² = Σ (|O-E| - 0.5)² / E
 * Signal: chi² >= 3.841 (p < 0.05, df=1)
 */
function computeChiSquare(t: ContingencyTable): number {
  const { a, b, c, d } = t;
  const N = a + b + c + d;
  const denom = (a + b) * (c + d) * (a + c) * (b + d);
  if (denom === 0) return 0;
  const num = Math.pow(Math.abs(a * d - b * c) - N / 2, 2) * N;
  return num / denom;
}

/**
 * Stirling's approximation for log(Gamma(x))
 * Good for x > 0.5
 */
function logGamma(x: number): number {
  if (x <= 0) return 0;
  // Lanczos approximation
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
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }

  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) {
    a += c[i] / (x + i);
  }

  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Run all 5 disproportionality algorithms on a contingency table.
 * Pure client-side computation — no network calls.
 */
export function computeSignals(table: ContingencyTable): SignalResult {
  const { a, b, c, d } = table;

  // Guard: all cells must be non-negative
  if (a < 0 || b < 0 || c < 0 || d < 0) {
    throw new Error('Contingency table cells must be non-negative');
  }

  // Guard: at least drug row must have data
  if (a + b === 0) {
    throw new Error('Drug exposure group is empty (a + b = 0)');
  }

  const prr = computePRR({ a, b, c, d });
  const { ror, lower: ror_lower, upper: ror_upper } = computeROR({ a, b, c, d });
  const { ic, ic025 } = computeIC({ a, b, c, d });
  const { ebgm, eb05 } = computeEBGM({ a, b, c, d });
  const chi_square = computeChiSquare({ a, b, c, d });

  const prr_signal = prr >= 2.0;
  const ror_signal = ror_lower > 1.0;
  const ic_signal = ic025 > 0;
  const ebgm_signal = eb05 >= 2.0;
  const chi_signal = chi_square >= 3.841;

  return {
    prr,
    ror,
    ror_lower,
    ror_upper,
    ic,
    ic025,
    ebgm,
    eb05,
    chi_square,
    prr_signal,
    ror_signal,
    ic_signal,
    ebgm_signal,
    chi_signal,
    any_signal: prr_signal || ror_signal || ic_signal || ebgm_signal || chi_signal,
  };
}
