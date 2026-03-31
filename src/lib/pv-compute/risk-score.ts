/**
 * Risk Score — Composite risk scoring with ToV harm taxonomy classification.
 *
 * Mirrors: risk-harm-classifier.yaml (harm levels A-F)
 *          risk-score-classifier.yaml (Guardian routing CRITICAL/HIGH/MODERATE/LOW)
 *
 * Primitives: κ(Comparison) weighted factor evaluation
 *             ∂(Boundary) threshold-based classification
 *             ρ(Ratio) normalized score ratios
 *
 * Takes 5 disproportionality metrics, normalizes each against its
 * significance range, applies weights, and maps the composite 0-100
 * score to a ToV harm level (A-F) and traffic level (green/yellow/red).
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type TrafficLevel = "green" | "yellow" | "red";

export type HarmLevel =
  | "A — Negligible"
  | "B — Minor"
  | "C — Moderate"
  | "D — Significant"
  | "E — Serious"
  | "F — Critical";

export interface RiskFactorMeta {
  label: string;
  friendlyName: string;
  jargonDef: string;
  lo: number;
  hi: number;
  weight: number;
}

export interface RiskFactor {
  key: string;
  label: string;
  friendlyName: string;
  jargonDef: string;
  raw: number;
  normalized: number;
  weight: number;
  weighted: number;
  level: TrafficLevel;
}

export interface RiskScoreInput {
  prr: number;
  ror_lower: number;
  ic025: number;
  eb05: number;
  n: number;
}

export interface RiskScoreResult {
  score: number;
  factors: RiskFactor[];
  harmLevel: HarmLevel;
  harmDescription: string;
  trafficLevel: TrafficLevel;
}

// ─── Factor metadata (PRR 25%, ROR/IC/EB 20% each, N 15%) ──────────────────

export const FACTOR_META: Record<string, RiskFactorMeta> = {
  prr: {
    label: "PRR",
    friendlyName: "Proportional Reporting Ratio",
    jargonDef:
      "Compares how often this side effect is reported for this drug vs. all others. A PRR of 2 means double the expected rate.",
    lo: 2,
    hi: 10,
    weight: 0.25,
  },
  ror_lower: {
    label: "ROR Lower CI",
    friendlyName: "ROR Lower Confidence Interval",
    jargonDef:
      "The conservative (lower bound) estimate of the Reporting Odds Ratio. If this is above 1, the signal is statistically significant.",
    lo: 1,
    hi: 5,
    weight: 0.2,
  },
  ic025: {
    label: "IC025",
    friendlyName: "Information Component (Lower 2.5%)",
    jargonDef:
      "A Bayesian measure of how surprising this drug-event pair is, using the conservative lower bound. Positive values mean the pair shows up more than expected.",
    lo: 0,
    hi: 3,
    weight: 0.2,
  },
  eb05: {
    label: "EB05",
    friendlyName: "Empirical Bayes (5th Percentile)",
    jargonDef:
      "The conservative estimate of the EBGM score, accounting for statistical noise. Values above 2 suggest a real pattern.",
    lo: 2,
    hi: 10,
    weight: 0.2,
  },
  n: {
    label: "Case Count",
    friendlyName: "Number of Reported Cases",
    jargonDef:
      "How many individual reports of this drug-event combination exist. More reports mean more confidence that the signal is real.",
    lo: 3,
    hi: 100,
    weight: 0.15,
  },
};

// ─── Core functions ─────────────────────────────────────────────────────────

/** Clamp value between lo and hi, scale to 0-1. */
function normalize(value: number, lo: number, hi: number): number {
  if (hi <= lo) return 0;
  return Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
}

/** Map normalized 0-1 value to traffic light color. */
function factorLevel(normalized: number): TrafficLevel {
  if (normalized < 0.33) return "green";
  if (normalized < 0.66) return "yellow";
  return "red";
}

/** Map composite score 0-100 to ToV harm level A-F. */
function toHarmLevel(score: number): {
  level: HarmLevel;
  description: string;
} {
  if (score >= 85)
    return {
      level: "F — Critical",
      description:
        "All metrics point to a very strong drug-event association. Immediate safety review warranted.",
    };
  if (score >= 70)
    return {
      level: "E — Serious",
      description:
        "Strong signal across most metrics. Escalate to your safety team and consider regulatory action.",
    };
  if (score >= 55)
    return {
      level: "D — Significant",
      description:
        "Multiple metrics cross concern thresholds. A formal signal evaluation is recommended.",
    };
  if (score >= 40)
    return {
      level: "C — Moderate",
      description:
        "Some metrics are elevated. This drug-event pair deserves periodic monitoring.",
    };
  if (score >= 20)
    return {
      level: "B — Minor",
      description:
        "A faint signal exists but falls well below concern thresholds. Worth noting, not worth losing sleep over.",
    };
  return {
    level: "A — Negligible",
    description:
      "No meaningful risk signal detected. This drug-event pair looks unremarkable in the data.",
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Compute a composite risk score from 5 disproportionality metrics.
 *
 * Each metric is normalized against its clinical significance range,
 * weighted by importance, and combined into a 0-100 composite score.
 * The composite is then classified into a ToV harm level (A-F).
 */
export function computeRiskScore(input: RiskScoreInput): RiskScoreResult {
  const raw: Record<string, number> = {
    prr: input.prr,
    ror_lower: input.ror_lower,
    ic025: input.ic025,
    eb05: input.eb05,
    n: input.n,
  };

  const factors: RiskFactor[] = Object.entries(FACTOR_META).map(
    ([key, meta]) => {
      const value = raw[key];
      const norm = normalize(value, meta.lo, meta.hi);
      return {
        key,
        label: meta.label,
        friendlyName: meta.friendlyName,
        jargonDef: meta.jargonDef,
        raw: value,
        normalized: norm,
        weight: meta.weight,
        weighted: norm * meta.weight,
        level: factorLevel(norm),
      };
    },
  );

  const rawScore = Math.round(
    factors.reduce((sum, f) => sum + f.weighted, 0) * 100,
  );
  const score = Math.max(0, Math.min(100, rawScore));

  const harm = toHarmLevel(score);

  const trafficLevel: TrafficLevel =
    score < 33 ? "green" : score < 66 ? "yellow" : "red";

  return {
    score,
    factors,
    harmLevel: harm.level,
    harmDescription: harm.description,
    trafficLevel,
  };
}

/**
 * Classify a pre-computed composite score into a ToV harm level.
 * Standalone function for use without the full factor computation.
 */
export function classifyHarmLevel(compositeScore: number): {
  harmLevel: HarmLevel;
  harmDescription: string;
  trafficLevel: TrafficLevel;
} {
  const score = Math.max(0, Math.min(100, compositeScore));
  const harm = toHarmLevel(score);
  const trafficLevel: TrafficLevel =
    score < 33 ? "green" : score < 66 ? "yellow" : "red";
  return {
    harmLevel: harm.level,
    harmDescription: harm.description,
    trafficLevel,
  };
}
