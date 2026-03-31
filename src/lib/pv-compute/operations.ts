/**
 * Operations — PV operations center classification helpers.
 *
 * Mirrors: deadline-urgency-classifier.yaml (days remaining → traffic level)
 *          signal-strength-classifier.yaml (traffic level → signal strength)
 *          health-traffic-classifier.yaml (health status → traffic level)
 *
 * Primitives: ∂(Boundary) threshold-based urgency classification
 *             κ(Comparison) string-to-string mapping
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type TrafficLevel = "green" | "yellow" | "red";
export type SignalStrength = "strong" | "moderate" | "weak" | "none";

export interface DeadlineUrgencyResult {
  trafficLevel: TrafficLevel;
}

export interface SignalStrengthResult {
  strength: SignalStrength;
}

export interface HealthTrafficResult {
  trafficLevel: TrafficLevel;
}

// ─── Deadline urgency (3/7 day thresholds) ──────────────────────────────────

/**
 * Classify deadline urgency from days remaining.
 * <=3 = red (critical), <=7 = yellow (warning), >7 = green (normal).
 */
export function classifyDeadlineUrgency(
  daysRemaining: number,
): DeadlineUrgencyResult {
  if (daysRemaining <= 3) return { trafficLevel: "red" };
  if (daysRemaining <= 7) return { trafficLevel: "yellow" };
  return { trafficLevel: "green" };
}

// ─── Signal level to strength mapping ───────────────────────────────────────

/**
 * Map a traffic level (from signal detection) to signal strength label.
 * red → strong, yellow → moderate, green/other → none.
 */
export function classifySignalStrength(level: string): SignalStrengthResult {
  if (level === "red") return { strength: "strong" };
  if (level === "yellow") return { strength: "moderate" };
  return { strength: "none" };
}

// ─── Health status to traffic level ─────────────────────────────────────────

/**
 * Map system health status string to traffic level.
 * healthy → green, degraded → yellow, anything else → red.
 */
export function classifyHealthTraffic(status: string): HealthTrafficResult {
  if (status === "healthy") return { trafficLevel: "green" };
  if (status === "degraded") return { trafficLevel: "yellow" };
  return { trafficLevel: "red" };
}
