/**
 * Client-side epidemiology computation library.
 *
 * 10 standard epidemiology measures for pharmacovigilance.
 * No server round-trip — math runs in the browser.
 *
 * Maps 1:1 with NexCore epi_* MCP tools (transfer confidence: 0.82-0.98).
 *
 * T1 primitives: N(Quantity) + κ(Comparison) + ∂(Boundary) + ν(Frequency)
 */

export {
  computeRelativeRisk,
  computeOddsRatio,
  computeAttributableRisk,
  computeNNT,
  computeAttributableFraction,
  computePopulationAF,
  computeIncidenceRate,
  computePrevalence,
  computeKaplanMeier,
  computeSMR,
} from './epidemiology';

export type {
  RelativeRiskResult,
  OddsRatioResult,
  AttributableRiskResult,
  NNTResult,
  AttributableFractionResult,
  PopulationAFResult,
  IncidenceRateResult,
  PrevalenceResult,
  KaplanMeierResult,
  KaplanMeierStep,
  SMRResult,
} from './epidemiology';
