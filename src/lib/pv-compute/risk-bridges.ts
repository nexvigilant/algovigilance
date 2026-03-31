/**
 * Risk bridge functions — translate pv-compute outputs across PV chain boundaries.
 *
 * Bridges:
 *   signal → risk input (for benefit-risk assessment)
 *   risk result → regulatory action recommendation
 *
 * T1 primitives: →(Causality) + ∂(Boundary) + ς(State)
 */

import type { SignalResult } from "./signal-detection";

// ── Input/Output types ────────────────────────────────────────────────────────

export interface RiskInput {
  /** Composite risk score 0–100 derived from signal strength */
  risk_score: number;
  /** Benefit score 0–100 (caller must supply; default 50 if unknown) */
  benefit_score: number;
  /** True if there is unmet medical need for this drug */
  unmet_need: boolean;
  /** True if therapeutic alternatives are available */
  alternative_available: boolean;
  /** Source signal metadata */
  signal_source: {
    prr?: number;
    ror?: number;
    ic025?: number;
    eb05?: number;
    chi_square?: number;
    n_cases?: number;
  };
}

export type RegulatoryDecision =
  | "FAVORABLE"
  | "ACCEPTABLE"
  | "CONDITIONAL"
  | "UNFAVORABLE"
  | "NEGATIVE";

export interface RegulatoryAction {
  decision: RegulatoryDecision;
  action: string;
  benefit_risk_ratio: string;
  recommendation: string;
  regulatory_reference: string;
}

// ── bridgeSignalToRisk ────────────────────────────────────────────────────────

/**
 * Translate a SignalResult from pv-compute into a RiskInput for benefit-risk assessment.
 *
 * Risk score derivation (0–100):
 *   - Base: prr contribution capped at 60 pts (linear 0–10 range)
 *   - ic025 > 0 adds 15 pts
 *   - eb05 >= 2.0 adds 15 pts
 *   - chi_signal adds 10 pts
 *   Max 100.
 *
 * T1: →(signal causes risk input) + κ(threshold comparisons)
 */
export function bridgeSignalToRisk(
  signalResult: SignalResult,
  opts?: {
    benefit_score?: number;
    unmet_need?: boolean;
    alternative_available?: boolean;
  },
): RiskInput {
  const prr = signalResult.prr ?? 0;
  const ic025 = signalResult.ic025 ?? 0;
  const eb05 = signalResult.eb05 ?? 0;

  // Proportional contribution — prr 0–10 maps to 0–60 pts (capped)
  let riskScore = Math.min(60, (prr / 10) * 60);
  if (ic025 > 0) riskScore += 15;
  if (eb05 >= 2.0) riskScore += 15;
  if (signalResult.chi_signal) riskScore += 10;
  riskScore = Math.min(100, Math.round(riskScore));

  return {
    risk_score: riskScore,
    benefit_score: opts?.benefit_score ?? 50,
    unmet_need: opts?.unmet_need ?? false,
    alternative_available: opts?.alternative_available ?? false,
    signal_source: {
      prr: signalResult.prr,
      ror: signalResult.ror,
      ic025: signalResult.ic025,
      eb05: signalResult.eb05,
      chi_square: signalResult.chi_square,
      n_cases: undefined,
    },
  };
}

// ── bridgeRiskToRegulatory ────────────────────────────────────────────────────

/**
 * Translate a benefit-risk result into a regulatory action recommendation.
 *
 * Implements the benefit-risk-gate.yaml decision logic:
 *   risk > 80 → NEGATIVE
 *   risk > 60 → UNFAVORABLE
 *   benefit >= 80 AND risk <= 20 → FAVORABLE
 *   benefit >= 60 AND risk <= 40 → ACCEPTABLE
 *   benefit >= 40 AND risk <= 60 AND (unmet_need OR !alternative) → CONDITIONAL
 *   otherwise → UNFAVORABLE
 *
 * T1: κ(Comparison) + →(Causality: score causes action)
 */
export function bridgeRiskToRegulatory(riskInput: RiskInput): RegulatoryAction {
  const { risk_score, benefit_score, unmet_need, alternative_available } =
    riskInput;

  if (risk_score > 80) {
    return {
      decision: "NEGATIVE",
      action: "consider_withdrawal",
      benefit_risk_ratio: "negative",
      recommendation:
        "Immediate review required; benefit no longer outweighs risk",
      regulatory_reference: "ICH E2C(R2) / EU GVP Module V",
    };
  }

  if (risk_score > 60) {
    return {
      decision: "UNFAVORABLE",
      action: "risk_mitigation_required",
      benefit_risk_ratio: "unfavorable",
      recommendation:
        "Implement risk minimization measures before continuation",
      regulatory_reference: "ICH E2C(R2) / GVP Module V",
    };
  }

  if (benefit_score >= 80 && risk_score <= 20) {
    return {
      decision: "FAVORABLE",
      action: "continue_monitoring",
      benefit_risk_ratio: "favorable",
      recommendation:
        "Benefit clearly outweighs risk; maintain standard surveillance",
      regulatory_reference: "ICH E2C(R2)",
    };
  }

  if (benefit_score >= 60 && risk_score <= 40) {
    return {
      decision: "ACCEPTABLE",
      action: "standard_risk_management",
      benefit_risk_ratio: "acceptable",
      recommendation:
        "Benefit outweighs risk with standard risk management plan",
      regulatory_reference: "ICH E2C(R2) / GVP Module V",
    };
  }

  if (benefit_score >= 40 && risk_score <= 60) {
    if (unmet_need || !alternative_available) {
      return {
        decision: "CONDITIONAL",
        action: "enhanced_monitoring_with_rmp",
        benefit_risk_ratio: "conditional",
        recommendation:
          "Benefit marginal; enhanced monitoring and RMP required",
        regulatory_reference: "ICH E2C(R2) / GVP Module V",
      };
    }
  }

  return {
    decision: "UNFAVORABLE",
    action: "risk_mitigation_required",
    benefit_risk_ratio: "unfavorable",
    recommendation: "Implement risk minimization measures before continuation",
    regulatory_reference: "ICH E2C(R2) / GVP Module V",
  };
}
