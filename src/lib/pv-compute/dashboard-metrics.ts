/**
 * Client-side dashboard metric classification.
 *
 * Implements YAML decision tree from rsk/micrograms/:
 *   dashboard-metric-classifier.yaml — HEALTHY/WARNING/CRITICAL from numeric value
 *
 * Standard PVOS operational thresholds: warn >= 70, critical >= 90.
 * T1 primitives: ∂(Boundary) + κ(Comparison)
 */

export type MetricHealth = "HEALTHY" | "WARNING" | "CRITICAL";

export interface MetricClassification {
  health: MetricHealth;
  description: string;
}

/**
 * Classify a PVOS dashboard metric against operational thresholds.
 *
 * Implements dashboard-metric-classifier.yaml (v0.1.0).
 * Thresholds (standard PVOS operational bands):
 *   value >= 90 → CRITICAL — immediate action required
 *   value >= 70 → WARNING  — monitor and investigate
 *   value <  70 → HEALTHY  — no action required
 *
 * Designed for capacity/load metrics where high values indicate stress
 * (e.g. queue depth, error rate %, resource utilization %).
 * Invert the metric (100 - value) for metrics where high is good.
 *
 * @param metricName  Display label for the metric (unused in computation, for caller context)
 * @param value       Numeric metric value (0–100 expected; values > 100 treated as CRITICAL)
 */
export function classifyMetric(
  metricName: string,
  value: number,
): MetricClassification {
  // Suppress unused-var lint — name is part of the API contract for caller context
  void metricName;

  if (value >= 90) {
    return {
      health: "CRITICAL",
      description:
        "Metric exceeds critical threshold - immediate action required",
    };
  }

  if (value >= 70) {
    return {
      health: "WARNING",
      description: "Metric exceeds warning threshold - monitor and investigate",
    };
  }

  return {
    health: "HEALTHY",
    description: "Metric within normal range - no action required",
  };
}

/**
 * Health color tokens for UI rendering.
 * Returns Tailwind class strings matching the AlgoVigilance design system.
 */
export function metricHealthColor(health: MetricHealth): string {
  switch (health) {
    case "CRITICAL":
      return "text-red-400 border-red-500/30";
    case "WARNING":
      return "text-amber-400 border-amber-500/30";
    case "HEALTHY":
      return "text-emerald-400 border-emerald-500/30";
  }
}
