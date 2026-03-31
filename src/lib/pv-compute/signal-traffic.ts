/**
 * Signal Traffic — Signal count and event aggregate traffic classification.
 *
 * Mirrors: signal-count-classifier.yaml (signal count → traffic level)
 *          event-aggregate-classifier.yaml (red/yellow counts → overall level)
 *
 * Primitives: ∂(Boundary) threshold-based classification
 *             Σ(Aggregation) counting across signal algorithms
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type TrafficLevel = "green" | "yellow" | "red";

export interface SignalCountResult {
  trafficLevel: TrafficLevel;
}

export interface EventAggregateResult {
  trafficLevel: TrafficLevel;
}

// ─── Signal count classification (0/2 thresholds) ───────────────────────────

/**
 * Classify traffic level from the number of positive signal algorithms.
 * 0 = green, 1-2 = yellow, 3+ = red.
 */
export function classifySignalCount(signalCount: number): SignalCountResult {
  if (signalCount === 0) return { trafficLevel: "green" };
  if (signalCount <= 2) return { trafficLevel: "yellow" };
  return { trafficLevel: "red" };
}

// ─── Event aggregate classification (3/1/3 thresholds) ──────────────────────

/**
 * Classify overall traffic level from counts of red and yellow events.
 * >=3 red = red, >=1 red or >=3 yellow = yellow, else green.
 */
export function classifyEventAggregate(
  redCount: number,
  yellowCount: number,
): EventAggregateResult {
  if (redCount >= 3) return { trafficLevel: "red" };
  if (redCount >= 1 || yellowCount >= 3) return { trafficLevel: "yellow" };
  return { trafficLevel: "green" };
}
