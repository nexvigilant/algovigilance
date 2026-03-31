/**
 * Epidemiology result types.
 *
 * Extracted to keep epidemiology.ts within the 600-line limit.
 * All types map 1:1 to NexCore epi_* MCP tool output shapes.
 */

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
