/**
 * War Game — PRR signal strength and payoff tier classification.
 *
 * Mirrors: prr-strength-classifier.yaml (PRR → strength tier)
 *          payoff-tier-classifier.yaml (payoff value → tier)
 *
 * Primitives: ∂(Boundary) threshold-based classification
 *             κ(Comparison) PRR magnitude assessment
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PrrStrength = "critical" | "signal" | "subthreshold";

export interface PrrStrengthResult {
  strength: PrrStrength;
}

export type PayoffTier = "high" | "medium" | "low";

export interface PayoffTierResult {
  tier: PayoffTier;
}

// ─── PRR strength classification (2/10 thresholds) ──────────────────────────

/**
 * Classify PRR value into signal strength tier.
 * >=10 = critical, >=2 = signal, else subthreshold.
 */
export function classifyPrrStrength(prr: number): PrrStrengthResult {
  if (prr >= 10) return { strength: "critical" };
  if (prr >= 2) return { strength: "signal" };
  return { strength: "subthreshold" };
}

// ─── Payoff tier classification (40/70 thresholds) ──────────────────────────

/**
 * Classify Nash payoff value into display tier.
 * >=70 = high, >=40 = medium, else low.
 */
export function classifyPayoffTier(value: number): PayoffTierResult {
  if (value >= 70) return { tier: "high" };
  if (value >= 40) return { tier: "medium" };
  return { tier: "low" };
}
