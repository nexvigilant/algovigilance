/**
 * Tests for flywheel-logic.ts — client-side microgram mirrors.
 *
 * Validates all 4 pure functions against formula.rs:275 thresholds:
 *   - classifyVelocity: EXCEPTIONAL ≤1h, TARGET ≤24h, ACCEPTABLE ≤168h, SLOW >168h
 *   - computeEventHealth: red/yellow/green from emitRatio + pendingEvents
 *   - computeComposite: CELEBRATE/MONITOR/INVESTIGATE/INTERVENE from composite score
 *   - routeAction: step routing by dimension
 */

import {
  classifyVelocity,
  computeEventHealth,
  computeComposite,
  routeAction,
  normalizeStatus,
} from "../flywheel-logic";
import type {
  FlywheelStatusRaw,
  FlywheelStatusResult,
} from "../flywheel-types";

// ── Constants ────────────────────────────────────────────────────────────────

const H1 = 1 * 60 * 60 * 1000; // 3_600_000 ms — boundary: EXCEPTIONAL
const H24 = 24 * 60 * 60 * 1000; // 86_400_000 ms — boundary: TARGET
const H168 = 168 * 60 * 60 * 1000; // 604_800_000 ms — boundary: ACCEPTABLE

// ── 1. classifyVelocity ──────────────────────────────────────────────────────

describe("classifyVelocity", () => {
  // Exact boundary values
  test("exactly 1h → EXCEPTIONAL", () => {
    expect(classifyVelocity(H1)).toBe("EXCEPTIONAL");
  });

  test("exactly 24h → TARGET", () => {
    expect(classifyVelocity(H24)).toBe("TARGET");
  });

  test("exactly 168h → ACCEPTABLE", () => {
    expect(classifyVelocity(H168)).toBe("ACCEPTABLE");
  });

  // Just below each boundary (still in lower band)
  test("1ms below 1h boundary → EXCEPTIONAL", () => {
    expect(classifyVelocity(H1 - 1)).toBe("EXCEPTIONAL");
  });

  test("1ms below 24h boundary → TARGET", () => {
    expect(classifyVelocity(H24 - 1)).toBe("TARGET");
  });

  test("1ms below 168h boundary → ACCEPTABLE", () => {
    expect(classifyVelocity(H168 - 1)).toBe("ACCEPTABLE");
  });

  // Just above each boundary (crosses to next band)
  test("1ms above 1h boundary → TARGET", () => {
    expect(classifyVelocity(H1 + 1)).toBe("TARGET");
  });

  test("1ms above 24h boundary → ACCEPTABLE", () => {
    expect(classifyVelocity(H24 + 1)).toBe("ACCEPTABLE");
  });

  test("1ms above 168h boundary → SLOW", () => {
    expect(classifyVelocity(H168 + 1)).toBe("SLOW");
  });

  // Explicit interior values
  test("30 minutes → EXCEPTIONAL", () => {
    expect(classifyVelocity(30 * 60 * 1000)).toBe("EXCEPTIONAL");
  });

  test("7 days → SLOW", () => {
    expect(classifyVelocity(7 * 24 * 60 * 60 * 1000 + 1)).toBe("SLOW");
  });
});

// ── 2. computeEventHealth ────────────────────────────────────────────────────

describe("computeEventHealth", () => {
  test("0/0 nodes → red (no nodes configured)", () => {
    const result = computeEventHealth(0, 0, 0);
    expect(result.level).toBe("red");
    expect(result.reason).toBe("No nodes configured");
  });

  test("4/5 nodes emitting, 0 pending → green", () => {
    // 4/5 = 80% ≥ 0.8, pending === 0 → green
    const result = computeEventHealth(4, 5, 0);
    expect(result.level).toBe("green");
    expect(result.reason).toBe("All systems healthy");
  });

  test("5/5 nodes emitting, 0 pending → green", () => {
    const result = computeEventHealth(5, 5, 0);
    expect(result.level).toBe("green");
    expect(result.reason).toBe("All systems healthy");
  });

  test("4/5 nodes emitting, 3 pending → yellow (ratio ≥ 0.8 but pending > 0)", () => {
    // ratio ≥ 0.8 but pendingEvents !== 0 → falls to second condition: ratio ≥ 0.5 → yellow
    const result = computeEventHealth(4, 5, 3);
    expect(result.level).toBe("yellow");
  });

  test("2/5 nodes emitting (partial), 0 pending → yellow (ratio ≥ 0.5 or pending ≤ 3)", () => {
    // 2/5 = 40% < 0.5 but pending === 0 ≤ 3 → yellow
    const result = computeEventHealth(2, 5, 0);
    expect(result.level).toBe("yellow");
  });

  test("2/5 nodes emitting, 5 pending → red (ratio < 0.5 and pending > 3)", () => {
    // 2/5 = 40% < 0.5, pending = 5 > 3 → red
    const result = computeEventHealth(2, 5, 5);
    expect(result.level).toBe("red");
  });

  test("1/5 nodes emitting (low), 5 pending → red", () => {
    // 1/5 = 20% < 0.5, pending = 5 > 3 → red
    const result = computeEventHealth(1, 5, 5);
    expect(result.level).toBe("red");
    expect(result.reason).toContain("1/5");
  });

  test("3/5 nodes emitting, 3 pending → yellow (pending ≤ 3)", () => {
    // 3/5 = 60% ≥ 0.5 → yellow
    const result = computeEventHealth(3, 5, 3);
    expect(result.level).toBe("yellow");
  });

  test("0/5 nodes emitting, 0 pending → yellow (pending ≤ 3 satisfies second condition)", () => {
    // 0/5 = 0% < 0.5, but pending = 0 ≤ 3 → yellow
    const result = computeEventHealth(0, 5, 0);
    expect(result.level).toBe("yellow");
  });
});

// ── 3. computeComposite ──────────────────────────────────────────────────────

describe("computeComposite", () => {
  // CELEBRATE: composite >= 9, with staging > 0 to avoid staging downgrade
  // healthScore=3 (green) + bandScore=4 (EXCEPTIONAL) + coverageScore=3 (≥3 live) = 10
  test("green + EXCEPTIONAL + 3 live + 2 staging → CELEBRATE", () => {
    const result = computeComposite("green", "EXCEPTIONAL", 3, 2);
    expect(result.action).toBe("CELEBRATE");
    expect(result.level).toBe("green");
    expect(result.degraded).toBeNull();
    expect(result.summary).toContain("spinning fast");
  });

  // CELEBRATE minimum: 3+4+2=9 (green+EXCEPTIONAL+1-2 live), staging > 0
  test("green + EXCEPTIONAL + 1 live + 1 staging → CELEBRATE (composite=9)", () => {
    const result = computeComposite("green", "EXCEPTIONAL", 1, 1);
    expect(result.action).toBe("CELEBRATE");
  });

  // Staging gate: zero staging nodes downgrades CELEBRATE → MONITOR
  test("downgrades CELEBRATE to MONITOR when staging is 0", () => {
    const result = computeComposite("green", "EXCEPTIONAL", 3, 0);
    expect(result.action).toBe("MONITOR");
    expect(result.level).toBe("green");
  });

  // Staging gate: non-zero staging keeps CELEBRATE
  test("keeps CELEBRATE when staging > 0", () => {
    const result = computeComposite("green", "EXCEPTIONAL", 3, 2);
    expect(result.action).toBe("CELEBRATE");
    expect(result.level).toBe("green");
  });

  // MONITOR: composite >= 7 && < 9
  // healthScore=3 (green) + bandScore=3 (TARGET) + coverageScore=3 (≥3 live) = 9 → CELEBRATE
  // healthScore=3 + bandScore=3 + coverageScore=2 (1-2 live) = 8 → MONITOR
  test("green + TARGET + 2 live → MONITOR (composite=8)", () => {
    const result = computeComposite("green", "TARGET", 2, 0);
    expect(result.action).toBe("MONITOR");
    expect(result.level).toBe("green");
    expect(result.degraded).toBeNull();
    expect(result.summary).toContain("healthy");
  });

  // healthScore=3 + bandScore=3 + coverageScore=1 (0 live) = 7 → MONITOR
  test("green + TARGET + 0 live → MONITOR (composite=7)", () => {
    const result = computeComposite("green", "TARGET", 0, 0);
    expect(result.action).toBe("MONITOR");
  });

  // INVESTIGATE: composite >= 5 && < 7
  // healthScore=2 (yellow) + bandScore=2 (ACCEPTABLE) + coverageScore=2 (1 live) = 6
  test("yellow + ACCEPTABLE + 1 live → INVESTIGATE (composite=6)", () => {
    const result = computeComposite("yellow", "ACCEPTABLE", 1, 0);
    expect(result.action).toBe("INVESTIGATE");
    expect(result.level).toBe("yellow");
    expect(result.degraded).not.toBeNull();
    expect(result.summary).toContain("needs attention");
  });

  // healthScore=2 + bandScore=1 (SLOW) + coverageScore=2 = 5 → INVESTIGATE
  test("yellow + SLOW + 1 live → INVESTIGATE (composite=5)", () => {
    const result = computeComposite("yellow", "SLOW", 1, 0);
    expect(result.action).toBe("INVESTIGATE");
  });

  // INTERVENE: composite < 5
  // healthScore=1 (red) + bandScore=1 (SLOW) + coverageScore=1 (0 live) = 3
  test("red + SLOW + 0 live → INTERVENE (composite=3)", () => {
    const result = computeComposite("red", "SLOW", 0, 0);
    expect(result.action).toBe("INTERVENE");
    expect(result.level).toBe("red");
    expect(result.degraded).not.toBeNull();
    expect(result.summary).toContain("stalled");
  });

  // healthScore=1 + bandScore=1 + coverageScore=2 = 4 → INTERVENE
  test("red + SLOW + 1 live → INTERVENE (composite=4)", () => {
    const result = computeComposite("red", "SLOW", 1, 0);
    expect(result.action).toBe("INTERVENE");
  });

  // Degraded dimension logic
  test("velocity degraded when band is SLOW and health/coverage are higher", () => {
    // healthScore=3, bandScore=1, coverageScore=3 → composite=7 → MONITOR (no degraded)
    const result = computeComposite("green", "SLOW", 3, 0);
    expect(result.action).toBe("MONITOR");
    // try a lower composite to get INTERVENE with velocity as weakest
    const result2 = computeComposite("yellow", "SLOW", 0, 0);
    // 2+1+1=4 → INTERVENE, bandScore=1 <= coverageScore=1, so degraded=velocity
    expect(result2.degraded).toBe("velocity");
  });
});

// ── 4. routeAction ───────────────────────────────────────────────────────────

describe("routeAction", () => {
  test("CELEBRATE → empty steps, Maintenance strategy", () => {
    const result = routeAction("CELEBRATE", null);
    expect(result.strategy).toBe("Maintenance");
    expect(result.steps).toHaveLength(0);
  });

  test("MONITOR → empty steps, Maintenance strategy", () => {
    const result = routeAction("MONITOR", null);
    expect(result.strategy).toBe("Maintenance");
    expect(result.steps).toHaveLength(0);
  });

  test("INVESTIGATE with velocity dimension → velocity steps (3 steps)", () => {
    const result = routeAction("INVESTIGATE", "velocity");
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps.map((s) => s.id)).toContain("v1");
    expect(result.steps.map((s) => s.id)).toContain("v2");
    expect(result.steps.map((s) => s.id)).toContain("v3");
    // No health/coverage steps
    expect(result.steps.map((s) => s.id)).not.toContain("h1");
    expect(result.steps.map((s) => s.id)).not.toContain("c1");
    expect(result.strategy).toContain("velocity");
  });

  test("INVESTIGATE with health dimension → health steps (3 steps)", () => {
    const result = routeAction("INVESTIGATE", "health");
    expect(result.steps.map((s) => s.id)).toContain("h1");
    expect(result.steps.map((s) => s.id)).toContain("h2");
    expect(result.steps.map((s) => s.id)).toContain("h3");
    expect(result.steps.map((s) => s.id)).not.toContain("v1");
    expect(result.steps.map((s) => s.id)).not.toContain("c1");
  });

  test("INVESTIGATE with coverage dimension → coverage steps (2 steps)", () => {
    const result = routeAction("INVESTIGATE", "coverage");
    expect(result.steps.map((s) => s.id)).toContain("c1");
    expect(result.steps.map((s) => s.id)).toContain("c2");
    expect(result.steps.map((s) => s.id)).not.toContain("v1");
    expect(result.steps.map((s) => s.id)).not.toContain("h1");
  });

  test("INTERVENE with null dimension → all steps (velocity + health + coverage = 8 steps)", () => {
    const result = routeAction("INTERVENE", null);
    const ids = result.steps.map((s) => s.id);
    expect(ids).toContain("v1");
    expect(ids).toContain("v2");
    expect(ids).toContain("v3");
    expect(ids).toContain("h1");
    expect(ids).toContain("h2");
    expect(ids).toContain("h3");
    expect(ids).toContain("c1");
    expect(ids).toContain("c2");
    expect(result.steps).toHaveLength(8);
    expect(result.strategy).toContain("all dimensions");
  });

  test("INTERVENE with velocity dimension → velocity steps only", () => {
    const result = routeAction("INTERVENE", "velocity");
    expect(result.steps.map((s) => s.id)).toContain("v1");
    expect(result.steps.map((s) => s.id)).not.toContain("h1");
    expect(result.strategy).toContain("velocity");
  });

  test("each step has required id, label, detail fields", () => {
    const result = routeAction("INTERVENE", null);
    for (const step of result.steps) {
      expect(typeof step.id).toBe("string");
      expect(typeof step.label).toBe("string");
      expect(typeof step.detail).toBe("string");
      expect(step.id.length).toBeGreaterThan(0);
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.detail.length).toBeGreaterThan(0);
    }
  });
});

// ── 5. normalizeStatus ───────────────────────────────────────────────────────

describe("normalizeStatus", () => {
  test("transforms live MCP response to UI types", () => {
    const raw: FlywheelStatusRaw = {
      success: true,
      nodes: [
        {
          name: "nexcore",
          tier: "live",
          status: "active",
          crates: ["nexcore-pv-core"],
        },
      ],
      tier_counts: { live: 1, staging: 0, draft: 0 },
    };
    const result: FlywheelStatusResult = normalizeStatus(raw);
    expect(result.nodes[0].tier).toBe("Live");
    expect(result.nodes[0].status).toBe("active");
    expect(result.nodes[0].crates).toEqual(["nexcore-pv-core"]);
  });

  test("maps all three tier names correctly", () => {
    const raw: FlywheelStatusRaw = {
      success: true,
      nodes: [
        { name: "a", tier: "live", status: "active", crates: [] },
        { name: "b", tier: "staging", status: "active", crates: [] },
        { name: "c", tier: "draft", status: "active", crates: [] },
      ],
      tier_counts: { live: 1, staging: 1, draft: 1 },
    };
    const result = normalizeStatus(raw);
    expect(result.nodes[0].tier).toBe("Live");
    expect(result.nodes[1].tier).toBe("Staging");
    expect(result.nodes[2].tier).toBe("Draft");
  });

  test("defaults unknown tier to Draft", () => {
    const raw: FlywheelStatusRaw = {
      success: true,
      nodes: [
        { name: "x", tier: "experimental", status: "active", crates: [] },
      ],
      tier_counts: {},
    };
    const result = normalizeStatus(raw);
    expect(result.nodes[0].tier).toBe("Draft");
  });

  test("handles missing tier_counts keys", () => {
    const raw: FlywheelStatusRaw = {
      success: true,
      nodes: [],
      tier_counts: {},
    };
    const result = normalizeStatus(raw);
    expect(result.tier_counts.Live).toBe(0);
    expect(result.tier_counts.Staging).toBe(0);
    expect(result.tier_counts.Draft).toBe(0);
  });

  test("counts active nodes correctly", () => {
    const raw: FlywheelStatusRaw = {
      success: true,
      nodes: [
        { name: "a", tier: "live", status: "active", crates: [] },
        { name: "b", tier: "staging", status: "wiring", crates: [] },
        { name: "c", tier: "draft", status: "dormant", crates: [] },
        { name: "d", tier: "live", status: "active", crates: [] },
      ],
      tier_counts: { live: 2, staging: 1, draft: 1 },
    };
    const result = normalizeStatus(raw);
    expect(result.total_nodes).toBe(4);
    expect(result.active_nodes).toBe(2);
  });

  test("handles empty nodes array", () => {
    const raw: FlywheelStatusRaw = {
      success: true,
      nodes: [],
      tier_counts: { live: 0, staging: 0, draft: 0 },
    };
    const result = normalizeStatus(raw);
    expect(result.total_nodes).toBe(0);
    expect(result.active_nodes).toBe(0);
  });

  test("preserves crates array per node", () => {
    const crates = [
      "nexcore-pv-core",
      "nexcore-vigilance",
      "nexcore-faers-etl",
    ];
    const raw: FlywheelStatusRaw = {
      success: true,
      nodes: [{ name: "n", tier: "live", status: "active", crates }],
      tier_counts: { live: 1 },
    };
    const result = normalizeStatus(raw);
    expect(result.nodes[0].crates).toEqual(crates);
  });

  test("handles wiring and dormant statuses", () => {
    const raw: FlywheelStatusRaw = {
      success: true,
      nodes: [
        { name: "w", tier: "staging", status: "wiring", crates: [] },
        { name: "d", tier: "draft", status: "dormant", crates: [] },
      ],
      tier_counts: { staging: 1, draft: 1 },
    };
    const result = normalizeStatus(raw);
    expect(result.nodes[0].status).toBe("wiring");
    expect(result.nodes[1].status).toBe("dormant");
    expect(result.active_nodes).toBe(0);
  });
});
