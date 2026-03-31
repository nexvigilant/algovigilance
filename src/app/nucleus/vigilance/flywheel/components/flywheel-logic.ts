// ── Client-Side Flywheel Logic ───────────────────────────────────────────────
// Pure functions matching MCP formula.rs:275 thresholds for client-side computation.
// Corresponding YAML micrograms at rsk/micrograms/flywheel/ (10 programs, 78 tests).

import type {
  VelocityBand,
  HealthLevel,
  EventHealthResult,
  CompositeResult,
  CompositeAction,
  DegradedDimension,
  ActionRoute,
  ActionStep,
  FlywheelStatusRaw,
  FlywheelStatusResult,
  FlywheelNode,
  NodeTier,
} from "./flywheel-types";

// ── Thresholds (formula.rs:275) ─────────────────────────────────────────────

const EXCEPTIONAL_MS = 1 * 60 * 60 * 1000; // ≤ 1 hour
const TARGET_MS = 24 * 60 * 60 * 1000; // ≤ 24 hours
const ACCEPTABLE_MS = 168 * 60 * 60 * 1000; // ≤ 168 hours (1 week)

// ── 1. classifyVelocity ─────────────────────────────────────────────────────

export function classifyVelocity(avgFixTimeMs: number): VelocityBand {
  if (avgFixTimeMs <= EXCEPTIONAL_MS) return "EXCEPTIONAL";
  if (avgFixTimeMs <= TARGET_MS) return "TARGET";
  if (avgFixTimeMs <= ACCEPTABLE_MS) return "ACCEPTABLE";
  return "SLOW";
}

// ── 2. computeEventHealth ───────────────────────────────────────────────────

export function computeEventHealth(
  emittingNodes: number,
  totalNodes: number,
  pendingEvents: number,
): EventHealthResult {
  if (totalNodes === 0) {
    return { level: "red", reason: "No nodes configured" };
  }

  const emitRatio = emittingNodes / totalNodes;

  if (emitRatio >= 0.8 && pendingEvents === 0) {
    return { level: "green", reason: "All systems healthy" };
  }
  if (emitRatio >= 0.5 || pendingEvents <= 3) {
    return {
      level: "yellow",
      reason: `${totalNodes - emittingNodes} node(s) silent, ${pendingEvents} event(s) pending`,
    };
  }
  return {
    level: "red",
    reason: `Only ${emittingNodes}/${totalNodes} nodes emitting, ${pendingEvents} event(s) backed up`,
  };
}

// ── 3. computeComposite ─────────────────────────────────────────────────────

export function computeComposite(
  health: HealthLevel,
  band: VelocityBand,
  liveNodes: number,
  stagingNodes: number,
): CompositeResult {
  // Score each dimension
  const healthScore = health === "green" ? 3 : health === "yellow" ? 2 : 1;
  const bandScore =
    band === "EXCEPTIONAL"
      ? 4
      : band === "TARGET"
        ? 3
        : band === "ACCEPTABLE"
          ? 2
          : 1;
  const coverageScore = liveNodes >= 3 ? 3 : liveNodes >= 1 ? 2 : 1;

  const composite = healthScore + bandScore + coverageScore;

  let action: CompositeAction;
  let level: HealthLevel;
  let degraded: DegradedDimension = null;

  if (composite >= 9) {
    action = "CELEBRATE";
    level = "green";
  } else if (composite >= 7) {
    action = "MONITOR";
    level = "green";
  } else if (composite >= 5) {
    action = "INVESTIGATE";
    level = "yellow";
    // Find weakest dimension
    if (healthScore <= bandScore && healthScore <= coverageScore)
      degraded = "health";
    else if (bandScore <= coverageScore) degraded = "velocity";
    else degraded = "coverage";
  } else {
    action = "INTERVENE";
    level = "red";
    if (healthScore <= bandScore && healthScore <= coverageScore)
      degraded = "health";
    else if (bandScore <= coverageScore) degraded = "velocity";
    else degraded = "coverage";
  }

  // Doctrine alignment: flywheel-composite.yaml check_staging_empty node.
  // YAML: staging_node_count == 0 → YELLOW (monitor), regardless of other signals.
  // If no staging nodes exist, the flywheel has no growth pipeline — downgrade
  // CELEBRATE to MONITOR even when the composite score is otherwise perfect.
  if (stagingNodes === 0 && action === "CELEBRATE") {
    action = "MONITOR";
    level = "green";
  }

  const summaries: Record<CompositeAction, string> = {
    CELEBRATE: "Flywheel is spinning fast — all systems performing well.",
    MONITOR: "Flywheel is healthy — keep an eye on minor items.",
    INVESTIGATE: `Flywheel needs attention — ${degraded ?? "multiple dimensions"} degraded.`,
    INTERVENE: `Flywheel is stalled — immediate action needed on ${degraded ?? "multiple dimensions"}.`,
  };

  return { level, action, degraded, summary: summaries[action] };
}

// ── 4. routeAction ──────────────────────────────────────────────────────────

export function routeAction(
  action: CompositeAction,
  dimension: DegradedDimension,
): ActionRoute {
  if (action === "CELEBRATE" || action === "MONITOR") {
    return { strategy: "Maintenance", steps: [] };
  }

  const steps: ActionStep[] = [];

  if (dimension === "velocity" || dimension === null) {
    steps.push(
      {
        id: "v1",
        label: "Review recent fix times",
        detail: "Check if any session took unusually long to resolve issues.",
      },
      {
        id: "v2",
        label: "Check for stale branches",
        detail: "Unmerged branches can slow the flywheel. Clean up or merge.",
      },
      {
        id: "v3",
        label: "Run microgram test suite",
        detail: "Confirm all 78 tests pass — failures drag velocity down.",
      },
    );
  }

  if (dimension === "health" || dimension === null) {
    steps.push(
      {
        id: "h1",
        label: "Check node emitter status",
        detail: "Verify all 8 Rust emitters are producing events.",
      },
      {
        id: "h2",
        label: "Review pending events",
        detail: "Clear any backed-up events in the flywheel queue.",
      },
      {
        id: "h3",
        label: "Restart silent nodes",
        detail: "Nodes that stopped emitting may need a session restart.",
      },
    );
  }

  if (dimension === "coverage" || dimension === null) {
    steps.push(
      {
        id: "c1",
        label: "Promote staging nodes",
        detail:
          "Move validated staging nodes to Live tier to improve coverage.",
      },
      {
        id: "c2",
        label: "Add new micrograms",
        detail: "Identify decision gaps and create new microgram programs.",
      },
    );
  }

  const strategy =
    action === "INVESTIGATE"
      ? `Investigate degraded ${dimension ?? "system"}`
      : `Urgent intervention on ${dimension ?? "all dimensions"}`;

  return { strategy, steps };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Convert milliseconds to human-readable duration. */
export function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)}h`;
  return `${(ms / 86_400_000).toFixed(1)}d`;
}

/** Get velocity band color for UI. */
export function bandColor(band: VelocityBand): string {
  switch (band) {
    case "EXCEPTIONAL":
      return "text-emerald-400";
    case "TARGET":
      return "text-cyan-400";
    case "ACCEPTABLE":
      return "text-amber-400";
    case "SLOW":
      return "text-red-400";
  }
}

/** Convert velocity band to a 0-100 score for ScoreMeter. */
export function bandToScore(band: VelocityBand): number {
  switch (band) {
    case "EXCEPTIONAL":
      return 95;
    case "TARGET":
      return 75;
    case "ACCEPTABLE":
      return 45;
    case "SLOW":
      return 15;
  }
}

// ── MCP Response Normalizer ─────────────────────────────────────────────────

const tierMap: Record<string, NodeTier> = {
  live: "Live",
  staging: "Staging",
  draft: "Draft",
};

/** Normalize raw MCP flywheel_status response to UI types. */
export function normalizeStatus(raw: FlywheelStatusRaw): FlywheelStatusResult {
  const nodes: FlywheelNode[] = raw.nodes.map((n) => ({
    name: n.name,
    tier: tierMap[n.tier] ?? "Draft",
    status: n.status,
    crates: n.crates,
  }));

  const tier_counts: Record<NodeTier, number> = {
    Live: raw.tier_counts["live"] ?? 0,
    Staging: raw.tier_counts["staging"] ?? 0,
    Draft: raw.tier_counts["draft"] ?? 0,
  };

  return {
    nodes,
    tier_counts,
    total_nodes: nodes.length,
    active_nodes: nodes.filter((n) => n.status === "active").length,
  };
}
