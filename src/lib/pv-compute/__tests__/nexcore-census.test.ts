/**
 * Tests for pv-compute/nexcore-census.ts — Population-Bounded Signal Verification.
 *
 * Covers:
 *   - Data string catalog
 *   - Boundary creation and resolution
 *   - Boundary threading (intersection computation)
 *   - Denominator confidence scoring
 *   - Epistemic level classification
 *   - Hierarchy reconciliation
 *   - FAERS vs NexCore epistemic comparison
 */

import {
  DATA_STRINGS,
  getDataString,
  createBoundary,
  threadBoundary,
  reconcileHierarchy,
  compareEpistemicLevels,
} from "../nexcore-census";
import type {
  DataString,
  Boundary,
  IntersectionResult,
} from "../nexcore-census";

// ── Data strings ───────────────────────────────────────────────────────────

describe("DATA_STRINGS catalog", () => {
  test("contains exactly 5 founding strings", () => {
    expect(DATA_STRINGS).toHaveLength(5);
  });

  test("FAERS has no denominator", () => {
    const faers = getDataString("faers");
    expect(faers).toBeDefined();
    expect(faers!.denominatorType).toBe("none");
  });

  test("NCPDP has complete denominator", () => {
    const ncpdp = getDataString("ncpdp");
    expect(ncpdp).toBeDefined();
    expect(ncpdp!.denominatorType).toBe("complete");
    expect(ncpdp!.coverage).toBeGreaterThan(0.9);
  });

  test("all strings have coverage in [0,1]", () => {
    for (const s of DATA_STRINGS) {
      expect(s.coverage).toBeGreaterThanOrEqual(0);
      expect(s.coverage).toBeLessThanOrEqual(1);
    }
  });
});

// ── Boundary creation ──────────────────────────────────────────────────────

describe("createBoundary", () => {
  test("national boundary is coarse resolution", () => {
    const b = createBoundary("national", "US");
    expect(b.type).toBe("national");
    expect(b.resolution).toBe("coarse");
  });

  test("pharmacy boundary is atomic resolution", () => {
    const b = createBoundary("pharmacy", "NPI-1234567890");
    expect(b.type).toBe("pharmacy");
    expect(b.resolution).toBe("atomic");
  });

  test("zip boundary is fine resolution", () => {
    const b = createBoundary("zip", "02139");
    expect(b.resolution).toBe("fine");
  });

  test("chain boundary is medium resolution", () => {
    const b = createBoundary("chain", "CVS");
    expect(b.resolution).toBe("medium");
  });
});

// ── Boundary threading ─────────────────────────────────────────────────────

describe("threadBoundary", () => {
  const ncpdp = getDataString("ncpdp")!;
  const partD = getDataString("part_d")!;
  const faers = getDataString("faers")!;
  const stateBoundary = createBoundary("state", "Massachusetts");

  test("counted level with complete-denominator strings", () => {
    const result = threadBoundary(stateBoundary, [ncpdp, partD], 50000, 25);
    expect(result.epistemicLevel).toBe("counted");
    expect(result.denominatorConfidence).toBeGreaterThan(0.7);
    expect(result.incidenceRate).toBeCloseTo(25 / 50000);
  });

  test("unknown level with FAERS only", () => {
    const result = threadBoundary(stateBoundary, [faers], 0, 150);
    expect(result.epistemicLevel).toBe("unknown");
    expect(result.denominatorConfidence).toBe(0);
  });

  test("estimated level with partial-denominator strings", () => {
    const pdmp = getDataString("pdmp")!;
    const ehr = getDataString("ehr")!;
    const result = threadBoundary(stateBoundary, [pdmp, ehr], 30000, 12);
    expect(result.epistemicLevel).toBe("estimated");
    expect(result.denominatorConfidence).toBeGreaterThan(0.3);
    expect(result.denominatorConfidence).toBeLessThan(0.7);
  });

  test("incidence rate computed correctly", () => {
    const result = threadBoundary(stateBoundary, [ncpdp], 100000, 50);
    expect(result.incidenceRate).toBeCloseTo(0.0005);
  });

  test("zero exposure yields zero incidence", () => {
    const result = threadBoundary(stateBoundary, [ncpdp], 0, 10);
    expect(result.incidenceRate).toBe(0);
  });

  test("reconciles when no parent given", () => {
    const result = threadBoundary(stateBoundary, [ncpdp], 50000, 25);
    expect(result.reconciles).toBe(true);
  });

  test("reconciles when child <= parent population", () => {
    const result = threadBoundary(stateBoundary, [ncpdp], 50000, 25, 100000);
    expect(result.reconciles).toBe(true);
  });

  test("does NOT reconcile when child > parent population", () => {
    const result = threadBoundary(stateBoundary, [ncpdp], 150000, 25, 100000);
    expect(result.reconciles).toBe(false);
  });
});

// ── Hierarchy reconciliation ───────────────────────────────────────────────

describe("reconcileHierarchy", () => {
  const ncpdp = getDataString("ncpdp")!;

  test("children that sum correctly reconcile", () => {
    const parent = threadBoundary(
      createBoundary("state", "Massachusetts"),
      [ncpdp],
      100000,
      50,
    );
    const child1 = threadBoundary(
      createBoundary("zip", "02139"),
      [ncpdp],
      40000,
      20,
      100000,
    );
    const child2 = threadBoundary(
      createBoundary("zip", "02140"),
      [ncpdp],
      35000,
      15,
      100000,
    );

    const result = reconcileHierarchy(parent, [child1, child2]);
    expect(result.allReconcile).toBe(true);
    expect(result.discrepancies).toHaveLength(0);
    expect(result.totalCoverage).toBeCloseTo(0.75);
  });

  test("children exceeding parent produces discrepancy", () => {
    const parent = threadBoundary(
      createBoundary("state", "Massachusetts"),
      [ncpdp],
      100000,
      50,
    );
    const child1 = threadBoundary(
      createBoundary("zip", "02139"),
      [ncpdp],
      70000,
      30,
      100000,
    );
    const child2 = threadBoundary(
      createBoundary("zip", "02140"),
      [ncpdp],
      50000,
      25,
      100000,
    );

    const result = reconcileHierarchy(parent, [child1, child2]);
    expect(result.allReconcile).toBe(false);
    expect(result.discrepancies.length).toBeGreaterThan(0);
  });

  test("discrepancy message identifies the boundary", () => {
    const parent = threadBoundary(
      createBoundary("state", "MA"),
      [ncpdp],
      100,
      10,
    );
    const child = threadBoundary(
      createBoundary("zip", "02139"),
      [ncpdp],
      200,
      15,
      100,
    );

    const result = reconcileHierarchy(parent, [child]);
    expect(result.discrepancies.some((d) => d.includes("state:MA"))).toBe(true);
  });
});

// ── Epistemic comparison ───────────────────────────────────────────────────

describe("compareEpistemicLevels", () => {
  const ncpdp = getDataString("ncpdp")!;
  const stateBoundary = createBoundary("state", "Massachusetts");

  test("counted intersection produces categorical upgrade", () => {
    const intersection = threadBoundary(stateBoundary, [ncpdp], 50000, 25);
    const comparison = compareEpistemicLevels(
      "Ibuprofen",
      "GI Bleeding",
      3.2,
      intersection,
    );

    expect(comparison.faersLevel.epistemicLevel).toBe("unknown");
    expect(comparison.faersLevel.denominatorConfidence).toBe(0);
    expect(comparison.nexcoreLevel.epistemicLevel).toBe("counted");
    expect(comparison.nexcoreLevel.denominatorConfidence).toBeGreaterThan(0.7);
    expect(comparison.epistemicGain).toContain("Categorical upgrade");
  });

  test("FAERS-only intersection produces no gain", () => {
    const faers = getDataString("faers")!;
    const intersection = threadBoundary(stateBoundary, [faers], 0, 150);
    const comparison = compareEpistemicLevels(
      "Ibuprofen",
      "GI Bleeding",
      3.2,
      intersection,
    );

    expect(comparison.nexcoreLevel.epistemicLevel).toBe("unknown");
    expect(comparison.epistemicGain).toContain("No epistemic gain");
  });

  test("interpretation includes rate per 1,000", () => {
    const intersection = threadBoundary(stateBoundary, [ncpdp], 100000, 50);
    const comparison = compareEpistemicLevels(
      "Atorvastatin",
      "Rhabdomyolysis",
      4.5,
      intersection,
    );

    // 50/100000 = 0.0005, × 1000 = 0.50 per 1,000
    expect(comparison.nexcoreLevel.interpretation).toContain("0.50");
    expect(comparison.nexcoreLevel.interpretation).toContain("per 1,000");
  });

  test("sub-threshold FAERS PRR acknowledged correctly", () => {
    const intersection = threadBoundary(stateBoundary, [ncpdp], 100000, 5);
    const comparison = compareEpistemicLevels(
      "Metformin",
      "Headache",
      1.2,
      intersection,
    );

    expect(comparison.faersLevel.interpretation).toContain(
      "below signal threshold",
    );
    expect(comparison.faersLevel.interpretation).toContain(
      "denominator is unknown",
    );
  });
});
