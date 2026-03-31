/**
 * Client-side epidemiology calculations.
 *
 * Each function mirrors the corresponding NexCore epi_* MCP tool.
 * All computation runs in the browser — no server round-trip.
 *
 * References:
 * - Rothman, Greenland & Lash. "Modern Epidemiology" 3rd ed (2008)
 * - Szklo & Nieto. "Epidemiology: Beyond the Basics" 4th ed (2019)
 */

// ============================================================================
// Types
// ============================================================================

export interface RelativeRiskResult {
  relative_risk: number;
  ci_lower: number;
  ci_upper: number;
  risk_exposed: number;
  risk_unexposed: number;
  significant: boolean;
}

export interface OddsRatioResult {
  odds_ratio: number;
  ci_lower: number;
  ci_upper: number;
  odds_exposed: number;
  odds_unexposed: number;
  significant: boolean;
}

export interface AttributableRiskResult {
  attributable_risk: number;
  ci_lower: number;
  ci_upper: number;
  risk_exposed: number;
  risk_unexposed: number;
}

export interface NNTResult {
  nnt: number;
  ci_lower: number;
  ci_upper: number;
  label: 'NNT' | 'NNH';
  interpretation: string;
}

export interface AttributableFractionResult {
  af_exposed: number;
  relative_risk: number;
  interpretation: string;
}

export interface PopulationAFResult {
  paf: number;
  prevalence_exposure: number;
  relative_risk: number;
  interpretation: string;
}

export interface IncidenceRateResult {
  rate: number;
  ci_lower: number;
  ci_upper: number;
  per_unit: number;
  events: number;
  person_time: number;
}

export interface PrevalenceResult {
  prevalence: number;
  ci_lower: number;
  ci_upper: number;
  cases: number;
  total: number;
}

export interface KaplanMeierStep {
  time: number;
  survival: number;
  ci_lower: number;
  ci_upper: number;
  at_risk: number;
  events: number;
  censored: number;
}

export interface KaplanMeierResult {
  steps: KaplanMeierStep[];
  median_survival: number | null;
  total_events: number;
  total_censored: number;
}

export interface SMRResult {
  smr: number;
  ci_lower: number;
  ci_upper: number;
  observed: number;
  expected: number;
  significant: boolean;
}

// ============================================================================
// Standard normal quantile for CI calculations
// ============================================================================

/** z-value for 95% CI (two-sided) */
const Z_95 = 1.96;

// ============================================================================
// 1. Relative Risk (Risk Ratio)
// RR = [a/(a+b)] / [c/(c+d)]
// PV transfer: 0.95 → PRR (identical formula for cohort data)
// ============================================================================

export function computeRelativeRisk(
  a: number, b: number, c: number, d: number
): RelativeRiskResult {
  validateCounts(a, b, c, d);

  const riskExposed = a / (a + b);
  const riskUnexposed = c / (c + d);

  if (riskUnexposed === 0) {
    return {
      relative_risk: Infinity,
      ci_lower: Infinity,
      ci_upper: Infinity,
      risk_exposed: riskExposed,
      risk_unexposed: 0,
      significant: true,
    };
  }

  const rr = riskExposed / riskUnexposed;
  const lnRR = Math.log(rr);
  const se = Math.sqrt(b / (a * (a + b)) + d / (c * (c + d)));

  return {
    relative_risk: round4(rr),
    ci_lower: round4(Math.exp(lnRR - Z_95 * se)),
    ci_upper: round4(Math.exp(lnRR + Z_95 * se)),
    risk_exposed: round4(riskExposed),
    risk_unexposed: round4(riskUnexposed),
    significant: Math.exp(lnRR - Z_95 * se) > 1 || Math.exp(lnRR + Z_95 * se) < 1,
  };
}

// ============================================================================
// 2. Odds Ratio
// OR = (a*d) / (b*c)
// PV transfer: 0.98 → ROR (identical formula)
// ============================================================================

export function computeOddsRatio(
  a: number, b: number, c: number, d: number
): OddsRatioResult {
  validateCounts(a, b, c, d);

  if (b * c === 0) {
    return {
      odds_ratio: Infinity,
      ci_lower: Infinity,
      ci_upper: Infinity,
      odds_exposed: b === 0 ? Infinity : a / b,
      odds_unexposed: c === 0 ? 0 : c / d,
      significant: true,
    };
  }

  const or = (a * d) / (b * c);
  const lnOR = Math.log(or);
  const se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);

  return {
    odds_ratio: round4(or),
    ci_lower: round4(Math.exp(lnOR - Z_95 * se)),
    ci_upper: round4(Math.exp(lnOR + Z_95 * se)),
    odds_exposed: round4(a / b),
    odds_unexposed: round4(c / d),
    significant: Math.exp(lnOR - Z_95 * se) > 1 || Math.exp(lnOR + Z_95 * se) < 1,
  };
}

// ============================================================================
// 3. Attributable Risk (Risk Difference)
// AR = risk_exposed - risk_unexposed
// PV transfer: 0.90
// ============================================================================

export function computeAttributableRisk(
  a: number, b: number, c: number, d: number
): AttributableRiskResult {
  validateCounts(a, b, c, d);

  const re = a / (a + b);
  const ru = c / (c + d);
  const ar = re - ru;

  const se = Math.sqrt(
    (re * (1 - re)) / (a + b) + (ru * (1 - ru)) / (c + d)
  );

  return {
    attributable_risk: round4(ar),
    ci_lower: round4(ar - Z_95 * se),
    ci_upper: round4(ar + Z_95 * se),
    risk_exposed: round4(re),
    risk_unexposed: round4(ru),
  };
}

// ============================================================================
// 4. Number Needed to Treat / Harm
// NNT = 1 / |AR|
// PV transfer: 0.85 → benefit-risk
// ============================================================================

export function computeNNT(
  a: number, b: number, c: number, d: number
): NNTResult {
  const ar = computeAttributableRisk(a, b, c, d);
  const absAR = Math.abs(ar.attributable_risk);

  if (absAR === 0) {
    return {
      nnt: Infinity,
      ci_lower: Infinity,
      ci_upper: Infinity,
      label: 'NNT',
      interpretation: 'No difference in risk between groups',
    };
  }

  const nnt = 1 / absAR;
  const isHarm = ar.attributable_risk > 0;

  // CI for NNT = 1/CI_upper(AR) to 1/CI_lower(AR)
  const ciLower = ar.ci_upper !== 0 ? Math.abs(1 / ar.ci_upper) : Infinity;
  const ciUpper = ar.ci_lower !== 0 ? Math.abs(1 / ar.ci_lower) : Infinity;

  return {
    nnt: round4(nnt),
    ci_lower: round4(Math.min(ciLower, ciUpper)),
    ci_upper: round4(Math.max(ciLower, ciUpper)),
    label: isHarm ? 'NNH' : 'NNT',
    interpretation: isHarm
      ? `For every ${Math.ceil(nnt)} patients exposed, 1 additional adverse event is expected`
      : `${Math.ceil(nnt)} patients need treatment to prevent 1 adverse event`,
  };
}

// ============================================================================
// 5. Attributable Fraction among Exposed
// AF = (RR - 1) / RR
// PV transfer: 0.88
// ============================================================================

export function computeAttributableFraction(
  a: number, b: number, c: number, d: number
): AttributableFractionResult {
  const rr = computeRelativeRisk(a, b, c, d);

  if (rr.relative_risk <= 0 || !isFinite(rr.relative_risk)) {
    return {
      af_exposed: 0,
      relative_risk: rr.relative_risk,
      interpretation: 'Cannot compute AF — invalid relative risk',
    };
  }

  const af = (rr.relative_risk - 1) / rr.relative_risk;

  return {
    af_exposed: round4(af),
    relative_risk: rr.relative_risk,
    interpretation: af > 0
      ? `${(af * 100).toFixed(1)}% of cases in exposed group are attributable to the exposure`
      : `Exposure appears protective (RR < 1)`,
  };
}

// ============================================================================
// 6. Population Attributable Fraction
// PAF = Pe * (RR - 1) / [Pe * (RR - 1) + 1]
// PV transfer: 0.85
// ============================================================================

export function computePopulationAF(
  a: number, b: number, c: number, d: number,
  prevalenceExposure: number
): PopulationAFResult {
  const rr = computeRelativeRisk(a, b, c, d);
  const pe = prevalenceExposure;

  if (rr.relative_risk <= 0 || !isFinite(rr.relative_risk)) {
    return {
      paf: 0,
      prevalence_exposure: pe,
      relative_risk: rr.relative_risk,
      interpretation: 'Cannot compute PAF — invalid relative risk',
    };
  }

  const paf = (pe * (rr.relative_risk - 1)) / (pe * (rr.relative_risk - 1) + 1);

  return {
    paf: round4(paf),
    prevalence_exposure: pe,
    relative_risk: rr.relative_risk,
    interpretation: paf > 0
      ? `${(paf * 100).toFixed(1)}% of all cases in the population are attributable to the exposure`
      : `Exposure appears protective at the population level`,
  };
}

// ============================================================================
// 7. Incidence Rate (with Poisson CI)
// IR = events / person_time
// PV transfer: 0.92 → reporting rate
// ============================================================================

export function computeIncidenceRate(
  events: number, personTime: number, perUnit: number = 1000
): IncidenceRateResult {
  if (events < 0) throw new Error('Events must be non-negative');
  if (personTime <= 0) throw new Error('Person-time must be positive');

  const rate = events / personTime;

  // Exact Poisson CI (mid-P approach, using normal approximation for simplicity)
  const se = Math.sqrt(events) / personTime;
  const ciLower = Math.max(0, rate - Z_95 * se);
  const ciUpper = rate + Z_95 * se;

  return {
    rate: round4(rate * perUnit),
    ci_lower: round4(ciLower * perUnit),
    ci_upper: round4(ciUpper * perUnit),
    per_unit: perUnit,
    events,
    person_time: personTime,
  };
}

// ============================================================================
// 8. Point Prevalence (with Wilson CI)
// P = cases / total
// PV transfer: 0.90 → background rate
// ============================================================================

export function computePrevalence(
  cases: number, total: number
): PrevalenceResult {
  if (cases < 0 || total <= 0) throw new Error('Invalid inputs');
  if (cases > total) throw new Error('Cases cannot exceed total');

  const p = cases / total;

  // Wilson score interval (better coverage than Wald for small proportions)
  const z2 = Z_95 * Z_95;
  const denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const margin = (Z_95 * Math.sqrt(p * (1 - p) / total + z2 / (4 * total * total))) / denominator;

  return {
    prevalence: round4(p),
    ci_lower: round4(Math.max(0, center - margin)),
    ci_upper: round4(Math.min(1, center + margin)),
    cases,
    total,
  };
}

// ============================================================================
// 9. Kaplan-Meier Survival Estimator (with Greenwood CI)
// S(t) = Π [1 - d_i / n_i]
// PV transfer: 0.82 → Weibull TTO
// ============================================================================

export function computeKaplanMeier(
  times: number[],
  events: boolean[]
): KaplanMeierResult {
  if (times.length !== events.length) {
    throw new Error('Times and events arrays must be same length');
  }
  if (times.length === 0) {
    throw new Error('At least one observation required');
  }

  // Sort by time
  const indices = times.map((_, i) => i).sort((a, b) => times[a] - times[b]);
  const sorted = indices.map(i => ({ time: times[i], event: events[i] }));

  // Group by time
  const timeGroups = new Map<number, { events: number; censored: number }>();
  for (const obs of sorted) {
    const existing = timeGroups.get(obs.time) ?? { events: 0, censored: 0 };
    if (obs.event) {
      existing.events++;
    } else {
      existing.censored++;
    }
    timeGroups.set(obs.time, existing);
  }

  const steps: KaplanMeierStep[] = [];
  let atRisk = times.length;
  let survival = 1.0;
  let greenwood = 0;
  let totalEvents = 0;
  let totalCensored = 0;

  // Initial step at time 0
  steps.push({
    time: 0,
    survival: 1.0,
    ci_lower: 1.0,
    ci_upper: 1.0,
    at_risk: atRisk,
    events: 0,
    censored: 0,
  });

  const sortedTimes = [...timeGroups.keys()].sort((a, b) => a - b);

  for (const t of sortedTimes) {
    const group = timeGroups.get(t);
    if (!group) continue;
    const d = group.events;
    const c = group.censored;

    if (d > 0) {
      survival *= (1 - d / atRisk);
      greenwood += d / (atRisk * (atRisk - d));
      totalEvents += d;
    }
    totalCensored += c;

    // Greenwood standard error
    const se = survival * Math.sqrt(greenwood);
    const ciLower = Math.max(0, survival - Z_95 * se);
    const ciUpper = Math.min(1, survival + Z_95 * se);

    steps.push({
      time: t,
      survival: round4(survival),
      ci_lower: round4(ciLower),
      ci_upper: round4(ciUpper),
      at_risk: atRisk,
      events: d,
      censored: c,
    });

    atRisk -= (d + c);
  }

  // Median survival: first time S(t) <= 0.5
  const medianStep = steps.find(s => s.survival <= 0.5 && s.time > 0);

  return {
    steps,
    median_survival: medianStep?.time ?? null,
    total_events: totalEvents,
    total_censored: totalCensored,
  };
}

// ============================================================================
// 10. Standardized Mortality/Morbidity Ratio (with Byar CI)
// SMR = Observed / Expected
// PV transfer: 0.93 → EBGM O/E
// ============================================================================

export function computeSMR(
  observed: number, expected: number
): SMRResult {
  if (observed < 0) throw new Error('Observed must be non-negative');
  if (expected <= 0) throw new Error('Expected must be positive');

  const smr = observed / expected;

  // Byar's approximation for Poisson CI
  const oLow = observed === 0 ? 0 : observed;
  const oHigh = observed + 1;

  const ciLower = (oLow * Math.pow(1 - 1 / (9 * oLow) - Z_95 / (3 * Math.sqrt(oLow)), 3)) / expected;
  const ciUpper = (oHigh * Math.pow(1 - 1 / (9 * oHigh) + Z_95 / (3 * Math.sqrt(oHigh)), 3)) / expected;

  return {
    smr: round4(smr),
    ci_lower: round4(observed === 0 ? 0 : ciLower),
    ci_upper: round4(ciUpper),
    observed,
    expected,
    significant: (observed === 0 ? 0 : ciLower) > 1 || ciUpper < 1,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function validateCounts(a: number, b: number, c: number, d: number) {
  if (a < 0 || b < 0 || c < 0 || d < 0) {
    throw new Error('All counts must be non-negative');
  }
  if (a + b === 0) throw new Error('Exposed group is empty');
  if (c + d === 0) throw new Error('Unexposed group is empty');
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
