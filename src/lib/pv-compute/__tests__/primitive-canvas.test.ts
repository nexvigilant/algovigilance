/**
 * Tests for pv-compute/primitive-canvas.ts — the × (Product) primitive.
 *
 * Covers:
 *   - Primitive lookup
 *   - Conservation law validation
 *   - Composition with tier classification
 *   - Distance measurement (symmetric difference)
 *   - Canvas state serialization
 */

import {
  PRIMITIVES,
  getPrimitive,
  checkConservation,
  compose,
  computeDistance,
  createCanvasState,
  serializeCanvas,
  deserializeCanvas,
} from "../primitive-canvas";
import type { ConservationVerdict, Composition } from "../primitive-canvas";

// ── Primitives catalog ─────────────────────────────────────────────────────

describe("PRIMITIVES catalog", () => {
  test("contains exactly 15 primitives", () => {
    expect(PRIMITIVES).toHaveLength(15);
  });

  test("each has symbol, name, description", () => {
    for (const p of PRIMITIVES) {
      expect(p.symbol.length).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
    }
  });

  test("exactly 4 conservation terms", () => {
    const conservationTerms = PRIMITIVES.filter((p) => p.isConservationTerm);
    expect(conservationTerms).toHaveLength(4);
    const names = conservationTerms.map((p) => p.name).sort();
    expect(names).toEqual(["Boundary", "Existence", "State", "Void"]);
  });

  test("all symbols are unique", () => {
    const symbols = PRIMITIVES.map((p) => p.symbol);
    expect(new Set(symbols).size).toBe(15);
  });
});

// ── Primitive lookup ───────────────────────────────────────────────────────

describe("getPrimitive", () => {
  test("finds by exact name", () => {
    const p = getPrimitive("Causality");
    expect(p).toBeDefined();
    expect(p!.symbol).toBe("→");
  });

  test("case-insensitive", () => {
    expect(getPrimitive("void")).toBeDefined();
    expect(getPrimitive("VOID")).toBeDefined();
    expect(getPrimitive("Void")).toBeDefined();
  });

  test("returns undefined for unknown", () => {
    expect(getPrimitive("Nonexistent")).toBeUndefined();
  });
});

// ── Conservation law ───────────────────────────────────────────────────────

describe("checkConservation", () => {
  test("CONSERVED when all 4 terms present", () => {
    const result = checkConservation([
      "Existence",
      "Boundary",
      "State",
      "Void",
    ]);
    expect(result.verdict).toBe("CONSERVED");
    expect(result.termsPresent).toBe(4);
    expect(result.missing.existence).toBe(false);
    expect(result.missing.boundary).toBe(false);
    expect(result.missing.state).toBe(false);
    expect(result.missing.void).toBe(false);
  });

  test("CONSERVED with extra non-conservation primitives", () => {
    const result = checkConservation([
      "Existence",
      "Boundary",
      "State",
      "Void",
      "Causality",
      "Recursion",
    ]);
    expect(result.verdict).toBe("CONSERVED");
    expect(result.termsPresent).toBe(4);
  });

  test("PARTIAL when some terms present", () => {
    const result = checkConservation(["Existence", "Boundary"]);
    expect(result.verdict).toBe("PARTIAL");
    expect(result.termsPresent).toBe(2);
    expect(result.missing.state).toBe(true);
    expect(result.missing.void).toBe(true);
  });

  test("ABSENT when no conservation terms present", () => {
    const result = checkConservation(["Causality", "Comparison"]);
    expect(result.verdict).toBe("ABSENT");
    expect(result.termsPresent).toBe(0);
  });

  test("ABSENT for empty input", () => {
    const result = checkConservation([]);
    expect(result.verdict).toBe("ABSENT");
  });

  test("case-insensitive conservation check", () => {
    const result = checkConservation([
      "existence",
      "BOUNDARY",
      "State",
      "void",
    ]);
    expect(result.verdict).toBe("CONSERVED");
  });
});

// ── Composition ────────────────────────────────────────────────────────────

describe("compose", () => {
  test("creates named composition with conservation check", () => {
    const c = compose("CausalityAssessment", [
      "Existence",
      "Boundary",
      "State",
      "Void",
      "Causality",
    ]);
    expect(c.name).toBe("CausalityAssessment");
    expect(c.primitives).toHaveLength(5);
    expect(c.conservation.verdict).toBe("CONSERVED");
  });

  test("deduplicates primitive names", () => {
    const c = compose("Test", ["Causality", "causality", "CAUSALITY"]);
    expect(c.primitives).toHaveLength(1);
  });

  test("ignores unknown primitive names", () => {
    const c = compose("Test", ["Causality", "FakePrimitive"]);
    expect(c.primitives).toHaveLength(1);
    expect(c.primitives[0].name).toBe("Causality");
  });

  test("detects dominant primitive (non-conservation first)", () => {
    const c = compose("Test", [
      "Existence",
      "Boundary",
      "State",
      "Void",
      "Recursion",
    ]);
    expect(c.dominant).toBeDefined();
    expect(c.dominant!.name).toBe("Recursion");
  });

  test("dominant falls back to conservation term when no others", () => {
    const c = compose("Test", ["Existence", "Boundary"]);
    expect(c.dominant).toBeDefined();
    expect(c.dominant!.isConservationTerm).toBe(true);
  });

  test("classifies tier by count", () => {
    const small = compose("T1", ["Causality"]);
    expect(small.tier).toBe("T1");

    const medium = compose("T2", ["Existence", "Boundary", "State", "Void"]);
    expect(medium.tier).toBe("T2Primitive"); // 4 primitives, conserved

    const large = compose("T3", [
      "Existence",
      "Boundary",
      "State",
      "Void",
      "Causality",
      "Recursion",
    ]);
    expect(large.tier).toBe("T3DomainSpecific");
  });

  test("sets createdAt timestamp", () => {
    const before = Date.now();
    const c = compose("Test", ["Causality"]);
    expect(c.createdAt).toBeGreaterThanOrEqual(before);
  });
});

// ── Distance ───────────────────────────────────────────────────────────────

describe("computeDistance", () => {
  test("identical compositions have distance 0", () => {
    const a = compose("A", ["Causality", "Comparison"]);
    const b = compose("B", ["Causality", "Comparison"]);
    const d = computeDistance(a, b);
    expect(d.distance).toBe(0);
    expect(d.jaccard).toBe(1);
    expect(d.verdict).toBe("identical");
  });

  test("completely different compositions", () => {
    const a = compose("A", ["Causality", "Comparison"]);
    const b = compose("B", ["Recursion", "Persistence"]);
    const d = computeDistance(a, b);
    expect(d.distance).toBe(4);
    expect(d.jaccard).toBe(0);
    expect(d.intersection).toHaveLength(0);
    expect(d.symmetricDifference).toHaveLength(4);
  });

  test("partial overlap", () => {
    const a = compose("A", ["Causality", "Comparison", "Boundary"]);
    const b = compose("B", ["Causality", "Recursion", "Boundary"]);
    const d = computeDistance(a, b);
    expect(d.distance).toBe(2); // Comparison vs Recursion
    expect(d.intersection).toContain("Causality");
    expect(d.intersection).toContain("Boundary");
    expect(d.verdict).toBe("close");
  });

  test("large distance → far verdict", () => {
    const a = compose("A", [
      "Existence",
      "Boundary",
      "State",
      "Void",
      "Causality",
    ]);
    const b = compose("B", ["Comparison", "Quantity"]);
    const d = computeDistance(a, b);
    expect(d.distance).toBeGreaterThanOrEqual(5);
    expect(["far", "orthogonal"]).toContain(d.verdict);
  });
});

// ── Canvas state ───────────────────────────────────────────────────────────

describe("canvas state", () => {
  test("creates empty state", () => {
    const s = createCanvasState();
    expect(s.compositions).toHaveLength(0);
    expect(s.selectedPrimitives).toHaveLength(0);
    expect(s.compositionName).toBe("");
  });

  test("serialization round-trip", () => {
    const s = createCanvasState();
    s.compositions.push(compose("Test", ["Causality", "Boundary"]));
    s.compositionName = "MyWorld";

    const json = serializeCanvas(s);
    const restored = deserializeCanvas(json);

    expect(restored.compositions).toHaveLength(1);
    expect(restored.compositionName).toBe("MyWorld");
  });

  test("deserialize handles invalid JSON gracefully", () => {
    const restored = deserializeCanvas("not json");
    expect(restored.compositions).toHaveLength(0);
    expect(restored.selectedPrimitives).toHaveLength(0);
  });

  test("deserialize handles partial data", () => {
    const restored = deserializeCanvas("{}");
    expect(restored.compositions).toHaveLength(0);
    expect(restored.compositionName).toBe("");
  });
});
