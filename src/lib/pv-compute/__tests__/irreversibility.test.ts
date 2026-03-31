/**
 * Tests for pv-compute/irreversibility.ts — PV Action Point-of-No-Return.
 *
 * Covers:
 *   - Action catalog completeness
 *   - Reversibility classification
 *   - Irreversibility score computation
 *   - Point of no return temporal classification
 *   - Deadline preset catalog
 */

import {
  getAction,
  getAllActions,
  classifyReversibility,
  computeIrreversibilityScore,
  findPointOfNoReturn,
  STANDARD_FACTORS,
  DEADLINE_PRESETS,
  getDeadlinePreset,
} from "../irreversibility";
import type {
  IrreversibilityFactor,
  PvActionCategory,
} from "../irreversibility";

// ── Action catalog ───────────────────────────────────────────────────────────

describe("PV action catalog", () => {
  test("contains exactly 12 actions", () => {
    expect(getAllActions()).toHaveLength(12);
  });

  test("all categories are unique", () => {
    const actions = getAllActions();
    const ids = actions.map((a) => a.category);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("getAction returns undefined for unknown category", () => {
    expect(getAction("nonexistent" as PvActionCategory)).toBeUndefined();
  });

  test("case_draft is reversible", () => {
    const action = getAction("case_draft");
    expect(action).toBeDefined();
    expect(action!.reversibilityLevel).toBe("reversible");
  });

  test("case_submission is irreversible", () => {
    const action = getAction("case_submission");
    expect(action).toBeDefined();
    expect(action!.reversibilityLevel).toBe("irreversible");
    expect(action!.undoWindow).toBeNull();
  });

  test("market_withdrawal is irreversible", () => {
    const action = getAction("market_withdrawal");
    expect(action!.reversibilityLevel).toBe("irreversible");
  });

  test("signal_assessment is conditional with undo window", () => {
    const action = getAction("signal_assessment");
    expect(action!.reversibilityLevel).toBe("conditional");
    expect(action!.undoWindow).toBeGreaterThan(0);
  });
});

// ── Reversibility classification ─────────────────────────────────────────────

describe("classifyReversibility", () => {
  test("irreversible action returns canUndo=false", () => {
    const result = classifyReversibility("case_submission");
    expect(result.level).toBe("irreversible");
    expect(result.canUndo).toBe(false);
    expect(result.explanation).toContain("irreversible");
  });

  test("reversible action returns canUndo=true", () => {
    const result = classifyReversibility("case_draft");
    expect(result.level).toBe("reversible");
    expect(result.canUndo).toBe(true);
    expect(result.explanation).toContain("reversible");
  });

  test("conditional action returns canUndo=true with window", () => {
    const result = classifyReversibility("signal_assessment");
    expect(result.level).toBe("conditional");
    expect(result.canUndo).toBe(true);
    expect(result.undoWindowHours).toBeGreaterThan(0);
  });

  test("unknown category returns conditional with warning", () => {
    const result = classifyReversibility("fake_action" as PvActionCategory);
    expect(result.level).toBe("conditional");
    expect(result.canUndo).toBe(false);
    expect(result.explanation).toContain("not found");
  });

  test("deadline_expiry is irreversible", () => {
    const result = classifyReversibility("deadline_expiry");
    expect(result.level).toBe("irreversible");
    expect(result.canUndo).toBe(false);
  });

  test("study_termination is irreversible", () => {
    const result = classifyReversibility("study_termination");
    expect(result.level).toBe("irreversible");
  });
});

// ── Irreversibility score ────────────────────────────────────────────────────

describe("computeIrreversibilityScore", () => {
  test("empty factors yields score 0", () => {
    const result = computeIrreversibilityScore([]);
    expect(result.score).toBe(0);
    expect(result.level).toBe("reversible");
    expect(result.dominantFactor).toBe("none");
  });

  test("all factors present yields score 1.0", () => {
    const factors: IrreversibilityFactor[] = STANDARD_FACTORS.map((f) => ({
      ...f,
      present: true,
    }));
    const result = computeIrreversibilityScore(factors);
    expect(result.score).toBeCloseTo(1.0);
    expect(result.level).toBe("irreversible");
  });

  test("no factors present yields score 0", () => {
    const factors: IrreversibilityFactor[] = STANDARD_FACTORS.map((f) => ({
      ...f,
      present: false,
    }));
    const result = computeIrreversibilityScore(factors);
    expect(result.score).toBe(0);
    expect(result.level).toBe("reversible");
  });

  test("single heavy factor crosses conditional threshold", () => {
    const factors: IrreversibilityFactor[] = [
      { name: "Submitted to regulator", weight: 0.35, present: true },
      { name: "Patient safety impacted", weight: 0.25, present: false },
      { name: "Public communication issued", weight: 0.2, present: false },
      { name: "Regulatory deadline passed", weight: 0.15, present: false },
      { name: "Third-party dependency", weight: 0.05, present: false },
    ];
    const result = computeIrreversibilityScore(factors);
    expect(result.score).toBeCloseTo(0.35);
    expect(result.level).toBe("conditional");
    expect(result.dominantFactor).toBe("Submitted to regulator");
  });

  test("two heavy factors cross irreversible threshold", () => {
    const factors: IrreversibilityFactor[] = [
      { name: "Submitted to regulator", weight: 0.35, present: true },
      { name: "Patient safety impacted", weight: 0.25, present: true },
      { name: "Public communication issued", weight: 0.2, present: true },
      { name: "Regulatory deadline passed", weight: 0.15, present: false },
      { name: "Third-party dependency", weight: 0.05, present: false },
    ];
    const result = computeIrreversibilityScore(factors);
    // 0.35 + 0.25 + 0.20 = 0.80
    expect(result.score).toBeCloseTo(0.8);
    expect(result.level).toBe("irreversible");
  });

  test("score is clamped to [0,1]", () => {
    const factors: IrreversibilityFactor[] = [
      { name: "Huge", weight: 2.0, present: true },
    ];
    const result = computeIrreversibilityScore(factors);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  test("dominant factor is the highest-weight present factor", () => {
    const factors: IrreversibilityFactor[] = [
      { name: "Low", weight: 0.1, present: true },
      { name: "High", weight: 0.9, present: true },
    ];
    const result = computeIrreversibilityScore(factors);
    expect(result.dominantFactor).toBe("High");
  });

  test("STANDARD_FACTORS weights sum to 1.0", () => {
    const sum = STANDARD_FACTORS.reduce((s, f) => s + f.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });
});

// ── Point of no return ───────────────────────────────────────────────────────

describe("findPointOfNoReturn", () => {
  const HOUR = 1000 * 60 * 60;

  test("safe when > 48 hours remain", () => {
    const deadline = 100 * HOUR;
    const now = 0;
    const result = findPointOfNoReturn(deadline, now);
    expect(result.urgency).toBe("safe");
    expect(result.pastDeadline).toBe(false);
    expect(result.hoursRemaining).toBe(100);
  });

  test("warning when 12-48 hours remain", () => {
    const deadline = 36 * HOUR;
    const now = 0;
    const result = findPointOfNoReturn(deadline, now);
    expect(result.urgency).toBe("warning");
    expect(result.hoursRemaining).toBe(36);
    expect(result.explanation).toContain("WARNING");
  });

  test("critical when < 12 hours remain", () => {
    const deadline = 6 * HOUR;
    const now = 0;
    const result = findPointOfNoReturn(deadline, now);
    expect(result.urgency).toBe("critical");
    expect(result.hoursRemaining).toBe(6);
    expect(result.explanation).toContain("CRITICAL");
  });

  test("expired when past deadline", () => {
    const deadline = 10 * HOUR;
    const now = 15 * HOUR;
    const result = findPointOfNoReturn(deadline, now);
    expect(result.urgency).toBe("expired");
    expect(result.pastDeadline).toBe(true);
    expect(result.hoursRemaining).toBe(-5);
    expect(result.explanation).toContain("irreversible");
  });

  test("exactly at deadline is expired", () => {
    const deadline = 10 * HOUR;
    const now = 10 * HOUR;
    const result = findPointOfNoReturn(deadline, now);
    expect(result.urgency).toBe("expired");
    expect(result.pastDeadline).toBe(true);
  });

  test("percentElapsed computed with windowStart", () => {
    const start = 0;
    const deadline = 100 * HOUR;
    const now = 50 * HOUR;
    const result = findPointOfNoReturn(deadline, now, start);
    expect(result.percentElapsed).toBeCloseTo(0.5);
  });

  test("percentElapsed clamped to [0,1]", () => {
    const start = 0;
    const deadline = 100 * HOUR;
    const now = 200 * HOUR; // past deadline
    const result = findPointOfNoReturn(deadline, now, start);
    expect(result.percentElapsed).toBeLessThanOrEqual(1);
  });

  test("percentElapsed is 0 at window start", () => {
    const start = 0;
    const deadline = 100 * HOUR;
    const result = findPointOfNoReturn(deadline, start, start);
    expect(result.percentElapsed).toBeCloseTo(0);
  });
});

// ── Deadline presets ─────────────────────────────────────────────────────────

describe("DEADLINE_PRESETS", () => {
  test("contains exactly 5 presets", () => {
    expect(DEADLINE_PRESETS).toHaveLength(5);
  });

  test("7-day expedited is 168 hours", () => {
    const preset = getDeadlinePreset("expedited_7_day");
    expect(preset).toBeDefined();
    expect(preset!.windowHours).toBe(168);
  });

  test("15-day expedited is 360 hours", () => {
    const preset = getDeadlinePreset("expedited_15_day");
    expect(preset!.windowHours).toBe(360);
  });

  test("annual PSUR is 8760 hours", () => {
    const preset = getDeadlinePreset("annual_psur");
    expect(preset!.windowHours).toBe(8760);
  });

  test("all presets have source citation", () => {
    for (const p of DEADLINE_PRESETS) {
      expect(p.source.length).toBeGreaterThan(0);
    }
  });

  test("getDeadlinePreset returns undefined for unknown id", () => {
    expect(
      getDeadlinePreset(
        "nonexistent" as Parameters<typeof getDeadlinePreset>[0],
      ),
    ).toBeUndefined();
  });

  test("presets ordered by ascending window", () => {
    for (let i = 1; i < DEADLINE_PRESETS.length; i++) {
      expect(DEADLINE_PRESETS[i].windowHours).toBeGreaterThanOrEqual(
        DEADLINE_PRESETS[i - 1].windowHours,
      );
    }
  });
});
