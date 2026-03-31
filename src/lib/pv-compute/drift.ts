/**
 * Drift — Signal drift classification and data coverage assessment.
 *
 * Mirrors: drift-direction-classifier.yaml (direction from change_pct)
 *          drift-alert-classifier.yaml (severity from PRR change + time window)
 *          coverage-tier-classifier.yaml (coverage tier from percentage)
 *
 * Primitives: ∂(Boundary) threshold-based direction/tier classification
 *             κ(Comparison) severity string to traffic level mapping
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type DriftDirection = "rising" | "falling" | "stable";
export type TrafficLevel = "green" | "yellow" | "red";
export type CoverageTier = "HIGH" | "MODERATE" | "LOW" | "CRITICAL_GAP";
export type CoverageColor = "emerald" | "amber" | "orange" | "red";

export interface DriftDirectionResult {
  direction: DriftDirection;
  trafficLevel: TrafficLevel;
}

export interface DriftSeverityResult {
  trafficLevel: TrafficLevel;
}

export interface CoverageTierResult {
  tier: CoverageTier;
  color: CoverageColor;
  bgClass: string;
}

// ─── Direction classification (change_pct thresholds: +-5%) ─────────────────

/**
 * Classify signal drift direction from percentage change.
 * >5% = rising (red), <-5% = falling (green), else stable (green).
 */
export function classifyDriftDirection(
  changePct: number,
): DriftDirectionResult {
  if (changePct > 5) return { direction: "rising", trafficLevel: "red" };
  if (changePct < -5) return { direction: "falling", trafficLevel: "green" };
  return { direction: "stable", trafficLevel: "green" };
}

// ─── Severity to traffic level mapping ──────────────────────────────────────

/**
 * Map a severity string (from pvos-client DriftResult) to traffic level.
 * critical → red, moderate/minor → yellow, everything else → green.
 */
export function classifyDriftLevel(severity: string): DriftSeverityResult {
  if (severity === "critical") return { trafficLevel: "red" };
  if (severity === "moderate" || severity === "minor")
    return { trafficLevel: "yellow" };
  return { trafficLevel: "green" };
}

// ─── Coverage tier classification (75/50/25 thresholds) ─────────────────────

const COVERAGE_TIERS: {
  threshold: number;
  tier: CoverageTier;
  color: CoverageColor;
  bgClass: string;
}[] = [
  { threshold: 75, tier: "HIGH", color: "emerald", bgClass: "bg-emerald-500" },
  { threshold: 50, tier: "MODERATE", color: "amber", bgClass: "bg-amber-500" },
  { threshold: 25, tier: "LOW", color: "orange", bgClass: "bg-orange-500" },
];

const CRITICAL_GAP_TIER: CoverageTierResult = {
  tier: "CRITICAL_GAP",
  color: "red",
  bgClass: "bg-red-500",
};

/**
 * Classify data coverage percentage into quality tiers.
 * >=75% = HIGH (emerald), >=50% = MODERATE (amber),
 * >=25% = LOW (orange), <25% = CRITICAL_GAP (red).
 */
export function classifyCoverageTier(coveragePct: number): CoverageTierResult {
  for (const entry of COVERAGE_TIERS) {
    if (coveragePct >= entry.threshold) {
      return { tier: entry.tier, color: entry.color, bgClass: entry.bgClass };
    }
  }
  return CRITICAL_GAP_TIER;
}
