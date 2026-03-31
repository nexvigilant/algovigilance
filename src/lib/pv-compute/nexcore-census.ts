/**
 * NexCore Census — Population-Bounded Signal Verification.
 *
 * Transforms parallel data strings into verified epidemiological fact
 * through precision boundary intersection. Counted knowledge, not estimated.
 *
 * T1 primitives: N(Quantity) + ∂(Boundary) + λ(Location) + ∃(Existence)
 *                + ς(State) + ∅(Void) + σ(Sequence) + κ(Comparison)
 *
 * Architecture:
 *   String = data source (FAERS, NCPDP, Part D, PDMP, EHR)
 *   Boundary = geographic/chain/payer/temporal partition
 *   Intersection = where boundary crosses all strings → verified fact
 *
 * Source: NexCore methodology (NV-COR-WP-001), March 4 2026
 */

// ── Data Strings ───────────────────────────────────────────────────────────

export type StringId = "faers" | "ncpdp" | "part_d" | "pdmp" | "ehr" | "custom";

export interface DataString {
  id: StringId;
  name: string;
  description: string;
  denominatorType: "none" | "partial" | "complete";
  coverage: number; // 0-1, estimated national coverage
}

/** The five founding data strings (source: NV-COR-WP-001 March 4 2026) */
export const DATA_STRINGS: DataString[] = [
  {
    id: "faers",
    name: "FAERS Reports",
    description:
      "FDA Adverse Event Reporting System — voluntary spontaneous reports",
    denominatorType: "none",
    coverage: 0.05, // ~5% estimated reporting rate
  },
  {
    id: "ncpdp",
    name: "NCPDP Rx Ledger",
    description:
      "National Council for Prescription Drug Programs — pharmacy transaction records",
    denominatorType: "complete",
    coverage: 0.92,
  },
  {
    id: "part_d",
    name: "Medicare Part D Claims",
    description:
      "CMS Part D prescription drug event data — enrolled beneficiaries",
    denominatorType: "complete",
    coverage: 0.3, // ~30% of US population
  },
  {
    id: "pdmp",
    name: "State PDMP",
    description:
      "Prescription Drug Monitoring Programs — controlled substance dispensing",
    denominatorType: "partial",
    coverage: 0.7,
  },
  {
    id: "ehr",
    name: "EHR Discharge Data",
    description:
      "Electronic Health Record systems — clinical encounter records",
    denominatorType: "partial",
    coverage: 0.6,
  },
];

export function getDataString(id: StringId): DataString | undefined {
  return DATA_STRINGS.find((s) => s.id === id);
}

// ── Boundary System ────────────────────────────────────────────────────────

export type BoundaryType =
  | "national"
  | "state"
  | "chain"
  | "zip"
  | "pharmacy"
  | "payer"
  | "prescriber"
  | "temporal";

export interface Boundary {
  type: BoundaryType;
  value: string;
  resolution: "coarse" | "medium" | "fine" | "atomic";
}

/** Resolution hierarchy (source: NV-COR-WP-001 boundary precision hierarchy) */
const RESOLUTION_MAP: Record<BoundaryType, Boundary["resolution"]> = {
  national: "coarse",
  state: "medium",
  chain: "medium",
  zip: "fine",
  payer: "medium",
  prescriber: "fine",
  pharmacy: "atomic",
  temporal: "fine",
};

export function createBoundary(type: BoundaryType, value: string): Boundary {
  return {
    type,
    value,
    resolution: RESOLUTION_MAP[type],
  };
}

// ── Intersection (Where Boundary Crosses Strings) ──────────────────────────

export type EpistemicLevel = "counted" | "estimated" | "unknown";

export interface IntersectionResult {
  boundary: Boundary;
  strings: DataString[];
  exposurePopulation: number;
  adverseEvents: number;
  incidenceRate: number;
  denominatorConfidence: number; // 0-1
  epistemicLevel: EpistemicLevel;
  reconciles: boolean; // does this level reconcile with parent boundary?
}

/**
 * Compute denominator confidence from the strings contributing to an intersection.
 *
 * Strings with "complete" denominator type contribute full confidence.
 * "partial" contributes half. "none" contributes zero.
 * Final score is weighted average of contributing string confidences × coverage.
 */
function computeDenominatorConfidence(strings: DataString[]): number {
  if (strings.length === 0) return 0;

  let totalWeight = 0;
  let weightedConfidence = 0;

  for (const s of strings) {
    const typeWeight =
      s.denominatorType === "complete"
        ? 1.0
        : s.denominatorType === "partial"
          ? 0.5
          : 0.0;
    const contribution = typeWeight * s.coverage;
    weightedConfidence += contribution;
    totalWeight += s.coverage;
  }

  if (totalWeight === 0) return 0;
  return Math.min(1, weightedConfidence / totalWeight);
}

/**
 * Classify the epistemic level of an intersection.
 *
 * Source: NV-COR-WP-001 — "counted knowledge vs estimated knowledge"
 *   - Counted: denominator confidence >= 0.7 (at least one complete-denominator string)
 *   - Estimated: denominator confidence >= 0.3 (partial denominator strings)
 *   - Unknown: denominator confidence < 0.3 (no reliable denominator)
 */
function classifyEpistemicLevel(
  denominatorConfidence: number,
  strings: DataString[],
): EpistemicLevel {
  const hasCompleteDenominator = strings.some(
    (s) => s.denominatorType === "complete",
  );

  if (hasCompleteDenominator && denominatorConfidence >= 0.7) return "counted";
  if (denominatorConfidence >= 0.3) return "estimated";
  return "unknown";
}

/**
 * Thread a boundary through data strings to produce a verified intersection.
 *
 * This is the core NexCore operation: boundary × strings → verified fact.
 *
 * Source: NV-COR-WP-001 — "At that intersection point — where your boundary
 * crosses all strings simultaneously — you get something none of the individual
 * strings can produce alone: Verified, multi-source, denominator-confirmed signal."
 */
export function threadBoundary(
  boundary: Boundary,
  strings: DataString[],
  exposurePopulation: number,
  adverseEvents: number,
  parentPopulation?: number,
): IntersectionResult {
  const denominatorConfidence = computeDenominatorConfidence(strings);
  const epistemicLevel = classifyEpistemicLevel(denominatorConfidence, strings);
  const incidenceRate =
    exposurePopulation > 0 ? adverseEvents / exposurePopulation : 0;

  // Reconciliation check: if parent population given, this level's population
  // should not exceed it (numbers must sum upward)
  const reconciles =
    parentPopulation === undefined || exposurePopulation <= parentPopulation;

  return {
    boundary,
    strings,
    exposurePopulation,
    adverseEvents,
    incidenceRate,
    denominatorConfidence,
    epistemicLevel,
    reconciles,
  };
}

// ── Boundary Hierarchy (Numbers Must Reconcile Upward) ─────────────────────

export interface ReconciliationResult {
  levels: IntersectionResult[];
  allReconcile: boolean;
  discrepancies: string[];
  totalCoverage: number;
}

/**
 * Check that a set of child intersections reconcile with their parent.
 *
 * Source: NV-COR-WP-001 — "Numbers at the ZIP level should sum to the state level.
 * State level should sum to national. If they don't — that discrepancy itself is a signal."
 */
export function reconcileHierarchy(
  parent: IntersectionResult,
  children: IntersectionResult[],
): ReconciliationResult {
  const discrepancies: string[] = [];

  // Sum of children should not exceed parent
  const childPopulationSum = children.reduce(
    (sum, c) => sum + c.exposurePopulation,
    0,
  );
  const childEventSum = children.reduce((sum, c) => sum + c.adverseEvents, 0);

  if (childPopulationSum > parent.exposurePopulation) {
    discrepancies.push(
      `Child population sum (${childPopulationSum}) exceeds parent (${parent.exposurePopulation}) at boundary ${parent.boundary.type}:${parent.boundary.value}`,
    );
  }

  if (childEventSum > parent.adverseEvents) {
    discrepancies.push(
      `Child event sum (${childEventSum}) exceeds parent (${parent.adverseEvents}) at boundary ${parent.boundary.type}:${parent.boundary.value}`,
    );
  }

  // Check each child reconciles individually
  for (const child of children) {
    if (!child.reconciles) {
      discrepancies.push(
        `Child boundary ${child.boundary.type}:${child.boundary.value} does not reconcile`,
      );
    }
  }

  const totalCoverage =
    parent.exposurePopulation > 0
      ? childPopulationSum / parent.exposurePopulation
      : 0;

  return {
    levels: [parent, ...children],
    allReconcile: discrepancies.length === 0,
    discrepancies,
    totalCoverage: Math.min(1, totalCoverage),
  };
}

// ── Signal Comparison: Counted vs Estimated ────────────────────────────────

export interface SignalComparison {
  drug: string;
  event: string;
  faersLevel: {
    prr: number;
    epistemicLevel: "unknown";
    denominatorConfidence: 0;
    interpretation: string;
  };
  nexcoreLevel: {
    incidenceRate: number;
    epistemicLevel: EpistemicLevel;
    denominatorConfidence: number;
    interpretation: string;
  };
  epistemicGain: string;
}

/**
 * Compare a traditional FAERS disproportionality signal against a NexCore
 * counted intersection for the same drug-event pair.
 *
 * Source: NV-COR-WP-001 — "FAERS paradigm: Model → Estimate → Signal → Maybe True.
 * NexCore paradigm: Count → Verify → Signal → Demonstrably True."
 */
export function compareEpistemicLevels(
  drug: string,
  event: string,
  faersPRR: number,
  nexcoreIntersection: IntersectionResult,
): SignalComparison {
  const faersInterpretation =
    faersPRR >= 2.0
      ? `PRR ${faersPRR.toFixed(1)} suggests disproportionate reporting — but denominator is unknown`
      : `PRR ${faersPRR.toFixed(1)} below signal threshold — but absence of evidence is not evidence of absence when denominator is unknown`;

  const rate = nexcoreIntersection.incidenceRate;
  const ratePerK = rate * 1000;
  const nexcoreInterpretation =
    nexcoreIntersection.epistemicLevel === "counted"
      ? `Verified incidence rate: ${ratePerK.toFixed(2)} per 1,000 exposed patients — denominator confirmed`
      : nexcoreIntersection.epistemicLevel === "estimated"
        ? `Estimated incidence rate: ${ratePerK.toFixed(2)} per 1,000 — denominator partially confirmed`
        : `Incidence rate ${ratePerK.toFixed(2)} per 1,000 — denominator uncertain`;

  const gain =
    nexcoreIntersection.epistemicLevel === "counted"
      ? "Categorical upgrade: unknown → counted. Signal is now a verified epidemiological fact."
      : nexcoreIntersection.epistemicLevel === "estimated"
        ? "Partial upgrade: unknown → estimated. Denominator improves confidence but is not complete."
        : "No epistemic gain — NexCore intersection lacks denominator-complete strings.";

  return {
    drug,
    event,
    faersLevel: {
      prr: faersPRR,
      epistemicLevel: "unknown",
      denominatorConfidence: 0,
      interpretation: faersInterpretation,
    },
    nexcoreLevel: {
      incidenceRate: nexcoreIntersection.incidenceRate,
      epistemicLevel: nexcoreIntersection.epistemicLevel,
      denominatorConfidence: nexcoreIntersection.denominatorConfidence,
      interpretation: nexcoreInterpretation,
    },
    epistemicGain: gain,
  };
}
