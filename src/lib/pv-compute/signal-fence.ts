/**
 * Signal Fence — threshold-based boundary enforcement for disproportionality signals.
 *
 * Evaluates drug-event signal metrics against configurable rules.
 * Priority cascade: block > warn > allow (strictest rule wins).
 *
 * T1 primitives: ∂(Boundary: fence rules) + κ(Comparison: threshold check)
 *              + →(Causality: signal causes decision) + Σ(Sum: decision priority)
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** Disproportionality metric key */
export type FenceMetricKey = "prr" | "ror" | "ic025" | "eb05" | "chi_square";

/** Fence action when a rule triggers */
export type FenceAction = "allow" | "warn" | "block";

/** Fence decision after evaluating all rules */
export type FenceDecision = "PASS" | "WARN" | "BLOCK";

/** A single fence rule: metric + operator + threshold → action */
export interface FenceRule {
  id: string;
  name: string;
  metric: FenceMetricKey;
  operator: ">=" | ">";
  threshold: number;
  action: FenceAction;
  enabled: boolean;
}

/** Signal metrics to test against the fence */
export interface FenceSignal {
  drug: string;
  event: string;
  prr: number;
  ror: number;
  ic025: number;
  eb05: number;
  chi_square: number;
}

/** Result of evaluating a signal against fence rules */
export interface FenceResult {
  signal: FenceSignal;
  triggered: FenceRule[];
  decision: FenceDecision;
  timestamp: Date;
}

/** Aggregate fence health statistics */
export interface FenceHealthStats {
  total: number;
  pass: number;
  warn: number;
  block: number;
  /** Percentage of signals that passed (0–100) */
  healthPct: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Human-readable labels for metric keys */
export const FENCE_METRIC_LABELS: Record<FenceMetricKey, string> = {
  prr: "PRR",
  ror: "ROR",
  ic025: "IC (0.25)",
  eb05: "EB05",
  chi_square: "Chi-Square",
};

/** Default Evans-criteria fence rules */
export const DEFAULT_FENCE_RULES: FenceRule[] = [
  {
    id: "r1",
    name: "PRR Warning",
    metric: "prr",
    operator: ">=",
    threshold: 2.0,
    action: "warn",
    enabled: true,
  },
  {
    id: "r2",
    name: "ROR Warning",
    metric: "ror",
    operator: ">=",
    threshold: 1.5,
    action: "warn",
    enabled: true,
  },
  {
    id: "r3",
    name: "PRR Block",
    metric: "prr",
    operator: ">=",
    threshold: 5.0,
    action: "block",
    enabled: true,
  },
  {
    id: "r4",
    name: "EB05 Warning",
    metric: "eb05",
    operator: ">=",
    threshold: 2.0,
    action: "warn",
    enabled: true,
  },
];

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Evaluate a signal against fence rules.
 *
 * Priority cascade: if ANY enabled rule with action "block" fires → BLOCK.
 * Else if ANY "warn" fires → WARN. Otherwise → PASS.
 */
export function evaluateFence(
  signal: FenceSignal,
  rules: FenceRule[],
): FenceResult {
  const triggered: FenceRule[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const value = signal[rule.metric];
    const crosses =
      rule.operator === ">=" ? value >= rule.threshold : value > rule.threshold;
    if (crosses) triggered.push(rule);
  }

  let decision: FenceDecision = "PASS";
  if (triggered.some((r) => r.action === "block")) decision = "BLOCK";
  else if (triggered.some((r) => r.action === "warn")) decision = "WARN";

  return { signal, triggered, decision, timestamp: new Date() };
}

/**
 * Compute aggregate health statistics from fence evaluation history.
 */
export function computeFenceHealth(history: FenceResult[]): FenceHealthStats {
  const total = history.length;
  const pass = history.filter((h) => h.decision === "PASS").length;
  const warn = history.filter((h) => h.decision === "WARN").length;
  const block = history.filter((h) => h.decision === "BLOCK").length;
  const healthPct = total > 0 ? Math.round((pass / total) * 100) : 100;
  return { total, pass, warn, block, healthPct };
}
