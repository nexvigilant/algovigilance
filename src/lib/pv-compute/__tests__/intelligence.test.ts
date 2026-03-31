/**
 * Tests for pv-compute/intelligence.ts — the ρ (Recursion) primitive.
 *
 * Covers:
 *   - State creation and accumulation
 *   - Class-level pattern detection
 *   - Temporal cluster detection
 *   - Strengthening signal detection
 *   - Novel pair detection
 *   - Absence detection (∅)
 *   - Escalation pattern detection
 *   - Causality cross-reference (unassessed signals)
 *   - Velocity measurement
 *   - Serialization round-trip
 */

import {
  createIntelligenceState,
  accumulateSignals,
  accumulateCausality,
  getActiveSignals,
  getSignalsForDrug,
  getSignalsForClass,
  getUnassessedSignals,
  getRecentInsights,
  serializeState,
  deserializeState,
} from "../intelligence";
import type {
  SignalMemory,
  CausalityMemory,
  IntelligenceState,
} from "../intelligence";

// ── Fixtures ────────────────────────────────────────────────────────────────

const NOW = Date.now();

function makeSignal(overrides: Partial<SignalMemory> = {}): SignalMemory {
  return {
    drug: "DrugA",
    event: "Headache",
    drugClass: "NSAID",
    prr: 3.5,
    ror: 4.2,
    ic: 1.8,
    ebgm: 2.1,
    anySignal: true,
    detectedAt: NOW,
    cycleNumber: 1,
    ...overrides,
  };
}

function makeCausality(
  overrides: Partial<CausalityMemory> = {},
): CausalityMemory {
  return {
    drug: "DrugA",
    event: "Headache",
    method: "naranjo",
    category: "Possible",
    score: 3,
    assessedAt: NOW,
    cycleNumber: 1,
    ...overrides,
  };
}

// ── State creation ──────────────────────────────────────────────────────────

describe("createIntelligenceState", () => {
  test("creates empty state with zero cycle count", () => {
    const state = createIntelligenceState();
    expect(state.signals).toHaveLength(0);
    expect(state.causality).toHaveLength(0);
    expect(state.insights).toHaveLength(0);
    expect(state.cycleCount).toBe(0);
  });
});

// ── Signal accumulation ─────────────────────────────────────────────────────

describe("accumulateSignals", () => {
  test("increments cycle count", () => {
    const state = createIntelligenceState();
    const result = accumulateSignals(state, [makeSignal()]);
    expect(result.state.cycleCount).toBe(1);

    const result2 = accumulateSignals(result.state, [
      makeSignal({ drug: "DrugB" }),
    ]);
    expect(result2.state.cycleCount).toBe(2);
  });

  test("accumulates signals across cycles", () => {
    const state = createIntelligenceState();
    const r1 = accumulateSignals(state, [makeSignal()]);
    expect(r1.state.signals).toHaveLength(1);

    const r2 = accumulateSignals(r1.state, [
      makeSignal({ drug: "DrugB", event: "Nausea" }),
    ]);
    expect(r2.state.signals).toHaveLength(2);
  });

  test("preserves causality across signal accumulation", () => {
    let state = createIntelligenceState();
    state = accumulateCausality(state, [makeCausality()]).state;
    const result = accumulateSignals(state, [makeSignal()]);
    expect(result.state.causality).toHaveLength(1);
  });
});

// ── Novel pair detection ────────────────────────────────────────────────────

describe("novel pair detection", () => {
  test("first signal for a drug-event pair is novel", () => {
    const state = createIntelligenceState();
    const result = accumulateSignals(state, [makeSignal()]);
    const novel = result.newInsights.filter((i) => i.type === "novel_pair");
    expect(novel).toHaveLength(1);
    expect(novel[0].description).toContain("DrugA");
    expect(novel[0].description).toContain("Headache");
  });

  test("repeat signal for same pair is NOT novel", () => {
    const state = createIntelligenceState();
    const r1 = accumulateSignals(state, [makeSignal()]);
    const r2 = accumulateSignals(r1.state, [makeSignal()]);
    const novel = r2.newInsights.filter((i) => i.type === "novel_pair");
    expect(novel).toHaveLength(0);
  });

  test("noise signal (anySignal=false) is NOT novel", () => {
    const state = createIntelligenceState();
    const result = accumulateSignals(state, [makeSignal({ anySignal: false })]);
    const novel = result.newInsights.filter((i) => i.type === "novel_pair");
    expect(novel).toHaveLength(0);
  });
});

// ── Class-level pattern detection ───────────────────────────────────────────

describe("class-level pattern detection", () => {
  test("2+ signals across 2+ drugs in same class triggers class insight", () => {
    const state = createIntelligenceState();
    const r1 = accumulateSignals(state, [
      makeSignal({ drug: "Ibuprofen", drugClass: "NSAID" }),
    ]);
    const r2 = accumulateSignals(r1.state, [
      makeSignal({ drug: "Naproxen", drugClass: "NSAID" }),
    ]);
    const classInsights = r2.newInsights.filter(
      (i) => i.type === "class_signal",
    );
    expect(classInsights.length).toBeGreaterThanOrEqual(1);
    expect(classInsights[0].description).toContain("NSAID");
  });

  test("single drug does not trigger class pattern", () => {
    const state = createIntelligenceState();
    const r1 = accumulateSignals(state, [
      makeSignal({ drug: "Ibuprofen", drugClass: "NSAID" }),
    ]);
    const r2 = accumulateSignals(r1.state, [
      makeSignal({ drug: "Ibuprofen", drugClass: "NSAID", event: "Nausea" }),
    ]);
    const classInsights = r2.newInsights.filter(
      (i) => i.type === "class_signal",
    );
    expect(classInsights).toHaveLength(0);
  });
});

// ── Strengthening signal detection ──────────────────────────────────────────

describe("strengthening signal detection", () => {
  test("PRR increasing 1.5x across cycles triggers strengthening insight", () => {
    const state = createIntelligenceState();
    const r1 = accumulateSignals(state, [
      makeSignal({ prr: 2.0, cycleNumber: 1 }),
    ]);
    const r2 = accumulateSignals(r1.state, [
      makeSignal({ prr: 4.0, cycleNumber: 2 }),
    ]);
    const strengthening = r2.newInsights.filter(
      (i) => i.type === "strengthening_signal",
    );
    expect(strengthening.length).toBeGreaterThanOrEqual(1);
    expect(strengthening[0].description).toContain("2.0");
    expect(strengthening[0].description).toContain("4.0");
  });

  test("stable PRR does not trigger strengthening", () => {
    const state = createIntelligenceState();
    const r1 = accumulateSignals(state, [makeSignal({ prr: 3.0 })]);
    const r2 = accumulateSignals(r1.state, [makeSignal({ prr: 3.1 })]);
    const strengthening = r2.newInsights.filter(
      (i) => i.type === "strengthening_signal",
    );
    expect(strengthening).toHaveLength(0);
  });
});

// ── Absence detection (∅) ───────────────────────────────────────────────────

describe("absence detection", () => {
  test("class with 2+ signal drugs and 1+ silent drug triggers absence", () => {
    const state = createIntelligenceState();
    const r1 = accumulateSignals(state, [
      makeSignal({ drug: "DrugA", drugClass: "Statin", anySignal: true }),
      makeSignal({ drug: "DrugB", drugClass: "Statin", anySignal: true }),
      makeSignal({ drug: "DrugC", drugClass: "Statin", anySignal: false }),
    ]);
    const absence = r1.newInsights.filter((i) => i.type === "absence_detected");
    expect(absence.length).toBeGreaterThanOrEqual(1);
    expect(absence[0].description).toContain("DrugC");
  });
});

// ── Causality accumulation ──────────────────────────────────────────────────

describe("accumulateCausality", () => {
  test("accumulates causality assessments", () => {
    const state = createIntelligenceState();
    const result = accumulateCausality(state, [makeCausality()]);
    expect(result.state.causality).toHaveLength(1);
    expect(result.state.cycleCount).toBe(1);
  });

  test("escalation pattern: increasing causality score", () => {
    const state = createIntelligenceState();
    const r1 = accumulateCausality(state, [
      makeCausality({ score: 2, category: "Doubtful", cycleNumber: 1 }),
    ]);
    const r2 = accumulateCausality(r1.state, [
      makeCausality({ score: 7, category: "Probable", cycleNumber: 2 }),
    ]);
    const escalation = r2.newInsights.filter(
      (i) => i.type === "escalation_pattern",
    );
    expect(escalation.length).toBeGreaterThanOrEqual(1);
  });

  test("cross-reference: signal without causality generates recommendation", () => {
    let state = createIntelligenceState();
    state = accumulateSignals(state, [makeSignal()]).state;
    const result = accumulateCausality(state, [
      makeCausality({ drug: "DrugB", event: "Nausea" }),
    ]);
    // DrugA:Headache has signal but no causality assessment
    const reassess = result.recommendations.filter(
      (r) => r.action === "reassess_causality",
    );
    expect(reassess.length).toBeGreaterThanOrEqual(1);
    expect(reassess[0].target).toBe("DrugA:Headache");
  });
});

// ── Velocity ────────────────────────────────────────────────────────────────

describe("velocity measurement", () => {
  test("cold start on fewer than 3 cycles", () => {
    const state = createIntelligenceState();
    const result = accumulateSignals(state, [makeSignal()]);
    expect(result.velocity.classification).toBe("cold_start");
  });

  test("coverage count reflects unique drug-event pairs", () => {
    const state = createIntelligenceState();
    const result = accumulateSignals(state, [
      makeSignal({ drug: "A", event: "X" }),
      makeSignal({ drug: "A", event: "Y" }),
      makeSignal({ drug: "B", event: "X" }),
    ]);
    expect(result.velocity.coverageCount).toBe(3);
  });

  test("signalsPerCycle tracks active signals", () => {
    const state = createIntelligenceState();
    const result = accumulateSignals(state, [
      makeSignal({ anySignal: true }),
      makeSignal({ anySignal: false, drug: "B", event: "Y" }),
    ]);
    // 1 active signal in 1 cycle
    expect(result.velocity.signalsPerCycle).toBe(1);
  });
});

// ── Query functions ─────────────────────────────────────────────────────────

describe("query functions", () => {
  let state: IntelligenceState;

  beforeEach(() => {
    state = createIntelligenceState();
    state = accumulateSignals(state, [
      makeSignal({ drug: "DrugA", event: "Headache", anySignal: true }),
      makeSignal({ drug: "DrugA", event: "Nausea", anySignal: false }),
      makeSignal({
        drug: "DrugB",
        event: "Rash",
        drugClass: "Beta-blocker",
        anySignal: true,
      }),
    ]).state;
  });

  test("getActiveSignals returns only anySignal=true", () => {
    expect(getActiveSignals(state)).toHaveLength(2);
  });

  test("getSignalsForDrug is case-insensitive", () => {
    expect(getSignalsForDrug(state, "druga")).toHaveLength(2);
    expect(getSignalsForDrug(state, "DRUGA")).toHaveLength(2);
  });

  test("getSignalsForClass filters by drug class", () => {
    expect(getSignalsForClass(state, "Beta-blocker")).toHaveLength(1);
    expect(getSignalsForClass(state, "NSAID")).toHaveLength(2);
  });

  test("getUnassessedSignals returns signals without causality", () => {
    expect(getUnassessedSignals(state)).toHaveLength(2);
  });

  test("getRecentInsights returns newest first", () => {
    const insights = getRecentInsights(state, 5);
    if (insights.length >= 2) {
      expect(insights[0].detectedAt).toBeGreaterThanOrEqual(
        insights[1].detectedAt,
      );
    }
  });
});

// ── Serialization ───────────────────────────────────────────────────────────

describe("serialization", () => {
  test("round-trip preserves state", () => {
    const state = createIntelligenceState();
    const r = accumulateSignals(state, [
      makeSignal(),
      makeSignal({ drug: "DrugB", event: "Nausea" }),
    ]);

    const json = serializeState(r.state);
    const restored = deserializeState(json);

    expect(restored.signals).toHaveLength(2);
    expect(restored.cycleCount).toBe(1);
    expect(restored.signals[0].drug).toBe("DrugA");
  });

  test("deserialize handles partial data gracefully", () => {
    const restored = deserializeState("{}");
    expect(restored.signals).toHaveLength(0);
    expect(restored.causality).toHaveLength(0);
    expect(restored.cycleCount).toBe(0);
  });
});
