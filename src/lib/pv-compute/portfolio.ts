/**
 * Client-side portfolio risk tier classification.
 *
 * Mirrors: portfolio-risk-rank.yaml — signal count and ratio to tier mapper
 *
 * T1 primitives: κ(Comparison) + ∂(Boundary) + Σ(Sequencing)
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type RiskTier = "critical" | "high" | "medium" | "low";

export interface PortfolioRiskInput {
  signal_count: number;
  event_count: number;
  total_reports: number;
  signal_ratio: number;
}

export interface PortfolioRiskResult {
  tier: RiskTier;
  reason: string;
}

/* ------------------------------------------------------------------ */
/*  classifyPortfolioRisk — mirrors portfolio-risk-rank.yaml            */
/* ------------------------------------------------------------------ */

/**
 * Portfolio risk tier classification.
 *
 * Waterfall: signal_count >= 10 OR ratio > 0.6 → critical
 *            signal_count >= 5  OR ratio > 0.4 → high
 *            signal_count >= 2  OR reports > 50000 → medium
 *            else → low
 */
export function classifyPortfolioRisk(
  input: PortfolioRiskInput,
): PortfolioRiskResult {
  const { signal_count, signal_ratio, total_reports } = input;

  // Critical tier
  if (signal_count >= 10) {
    return {
      tier: "critical",
      reason: "High signal count or signal ratio exceeds 60%",
    };
  }
  if (signal_ratio > 0.6) {
    return {
      tier: "critical",
      reason: "High signal count or signal ratio exceeds 60%",
    };
  }

  // High tier
  if (signal_count >= 5) {
    return {
      tier: "high",
      reason: "Elevated signal count or signal ratio exceeds 40%",
    };
  }
  if (signal_ratio > 0.4) {
    return {
      tier: "high",
      reason: "Elevated signal count or signal ratio exceeds 40%",
    };
  }

  // Medium tier
  if (signal_count >= 2) {
    return {
      tier: "medium",
      reason: "Multiple signals detected or high report volume",
    };
  }
  if (total_reports > 50000) {
    return {
      tier: "medium",
      reason: "Multiple signals detected or high report volume",
    };
  }

  // Low tier
  return {
    tier: "low",
    reason: "Minimal signal activity",
  };
}
