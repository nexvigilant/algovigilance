/**
 * Primitive Canvas — client-side composition engine.
 *
 * Wraps the 15 T1 Lex Primitiva into a composable, conservation-checked
 * block system. Each composition is validated against ∃ = ∂(×(ς, ∅))
 * before acceptance.
 *
 * T1 primitives: × (Product) + ∂ (Boundary) + ∃ (Existence) + ∅ (Void)
 *
 * Source: Lex Primitiva proof notebook (primitives.ipynb Part II)
 * MCP backend: primitive_brain_compose, primitive_brain_conserve, primitive_brain_distance
 */

// ── Primitive Definitions ──────────────────────────────────────────────────

export interface Primitive {
  symbol: string;
  name: string;
  description: string;
  isConservationTerm: boolean;
}

/** The 15 operational T1 primitives (source: T1-PRIMITIVES.md) */
export const PRIMITIVES: Primitive[] = [
  {
    symbol: "∅",
    name: "Void",
    description: "The absence that defines presence. Ground state.",
    isConservationTerm: true,
  },
  {
    symbol: "∂",
    name: "Boundary",
    description: "Where things begin and end. Creates identity.",
    isConservationTerm: true,
  },
  {
    symbol: "ς",
    name: "State",
    description: "What changed. The variable before π fixes it.",
    isConservationTerm: true,
  },
  {
    symbol: "∃",
    name: "Existence",
    description: "¬∅ at ∂ given ς. The conservation law's output.",
    isConservationTerm: true,
  },
  {
    symbol: "→",
    name: "Causality",
    description: "What caused what. Every function, every consequence.",
    isConservationTerm: false,
  },
  {
    symbol: "N",
    name: "Quantity",
    description: "How many. The measurable.",
    isConservationTerm: false,
  },
  {
    symbol: "κ",
    name: "Comparison",
    description: "How two things relate. The universal primitive.",
    isConservationTerm: false,
  },
  {
    symbol: "σ",
    name: "Sequence",
    description: "In what order. Iteration, dependency.",
    isConservationTerm: false,
  },
  {
    symbol: "μ",
    name: "Mapping",
    description: "What transforms to what. The bridge.",
    isConservationTerm: false,
  },
  {
    symbol: "ρ",
    name: "Recursion",
    description: "Does it contain itself. Self-reference.",
    isConservationTerm: false,
  },
  {
    symbol: "ν",
    name: "Frequency",
    description: "How often. Rate, rhythm, repetition.",
    isConservationTerm: false,
  },
  {
    symbol: "π",
    name: "Persistence",
    description: "Does it endure. What survives.",
    isConservationTerm: false,
  },
  {
    symbol: "λ",
    name: "Location",
    description: "Where is it. Address, reference, path.",
    isConservationTerm: false,
  },
  {
    symbol: "∝",
    name: "Irreversibility",
    description: "Can it be undone. Entropy's arrow.",
    isConservationTerm: false,
  },
  {
    symbol: "Σ",
    name: "Sum",
    description: "Which variant. The disjoint union.",
    isConservationTerm: false,
  },
];

/** Lookup by name (case-insensitive) */
export function getPrimitive(name: string): Primitive | undefined {
  return PRIMITIVES.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

// ── Conservation Law ───────────────────────────────────────────────────────

export type ConservationVerdict = "CONSERVED" | "PARTIAL" | "ABSENT";

export interface ConservationResult {
  verdict: ConservationVerdict;
  termsPresent: number;
  termsTotal: 4;
  missing: {
    existence: boolean;
    boundary: boolean;
    state: boolean;
    void: boolean;
  };
}

/**
 * Check the conservation law ∃ = ∂(×(ς, ∅)) against a set of primitive names.
 * Pure client-side — no MCP call needed.
 *
 * Source: primitives.ipynb Part II — Conservation Law, proven in boundary.rs
 */
export function checkConservation(
  primitiveNames: string[],
): ConservationResult {
  const lower = new Set(primitiveNames.map((n) => n.toLowerCase()));

  const hasExistence = lower.has("existence");
  const hasBoundary = lower.has("boundary");
  const hasState = lower.has("state");
  const hasVoid = lower.has("void");

  const termsPresent =
    (hasExistence ? 1 : 0) +
    (hasBoundary ? 1 : 0) +
    (hasState ? 1 : 0) +
    (hasVoid ? 1 : 0);

  let verdict: ConservationVerdict;
  if (termsPresent === 4) {
    verdict = "CONSERVED";
  } else if (termsPresent > 0) {
    verdict = "PARTIAL";
  } else {
    verdict = "ABSENT";
  }

  return {
    verdict,
    termsPresent,
    termsTotal: 4,
    missing: {
      existence: !hasExistence,
      boundary: !hasBoundary,
      state: !hasState,
      void: !hasVoid,
    },
  };
}

// ── Composition ────────────────────────────────────────────────────────────

export type CompositionTier =
  | "T1"
  | "T2Primitive"
  | "T2Composite"
  | "T3DomainSpecific";

export interface Composition {
  name: string;
  primitives: Primitive[];
  dominant: Primitive | null;
  tier: CompositionTier;
  conservation: ConservationResult;
  createdAt: number;
}

/**
 * Classify tier by primitive count and conservation status.
 * Source: primitives.ipynb Part II — Tier definitions
 */
function classifyTier(count: number, conserved: boolean): CompositionTier {
  if (count <= 2) return "T1";
  if (count <= 4) return conserved ? "T2Primitive" : "T2Composite";
  return "T3DomainSpecific";
}

/**
 * Detect dominant primitive — the most "load-bearing" one.
 * Heuristic: non-conservation terms first (they carry domain meaning),
 * then conservation terms. Among equals, first in composition order.
 */
function detectDominant(primitives: Primitive[]): Primitive | null {
  if (primitives.length === 0) return null;
  const nonConservation = primitives.filter((p) => !p.isConservationTerm);
  if (nonConservation.length > 0) return nonConservation[0];
  return primitives[0];
}

/**
 * Compose a set of primitive names into a named structure.
 * Pure client-side. Deduplicates, checks conservation, classifies tier.
 */
export function compose(name: string, primitiveNames: string[]): Composition {
  // Deduplicate
  const unique = Array.from(
    new Set(primitiveNames.map((n) => n.toLowerCase())),
  );
  const primitives = unique
    .map((n) => getPrimitive(n))
    .filter((p): p is Primitive => p !== undefined);

  const conservation = checkConservation(primitiveNames);
  const tier = classifyTier(
    primitives.length,
    conservation.verdict === "CONSERVED",
  );
  const dominant = detectDominant(primitives);

  return {
    name,
    primitives,
    dominant,
    tier,
    conservation,
    createdAt: Date.now(),
  };
}

// ── Distance ───────────────────────────────────────────────────────────────

export type DistanceVerdict =
  | "identical"
  | "close"
  | "moderate"
  | "far"
  | "orthogonal";

export interface DistanceResult {
  distance: number;
  jaccard: number;
  intersection: string[];
  symmetricDifference: string[];
  verdict: DistanceVerdict;
}

/**
 * Compute symmetric difference distance |A△B| between two compositions.
 * Pure client-side implementation of Algorithm 2: COMPARE.
 *
 * Source: primitives.ipynb Part II — Metric Space section
 */
export function computeDistance(
  a: Composition,
  b: Composition,
): DistanceResult {
  const setA = new Set(a.primitives.map((p) => p.name));
  const setB = new Set(b.primitives.map((p) => p.name));

  const intersection: string[] = [];
  const symmetricDifference: string[] = [];

  setA.forEach((name) => {
    if (setB.has(name)) {
      intersection.push(name);
    } else {
      symmetricDifference.push(name);
    }
  });
  setB.forEach((name) => {
    if (!setA.has(name)) {
      symmetricDifference.push(name);
    }
  });

  const distance = symmetricDifference.length;
  const union = setA.size + setB.size - intersection.length;
  const jaccard = union === 0 ? 1 : intersection.length / union;

  let verdict: DistanceVerdict;
  if (distance === 0) verdict = "identical";
  else if (distance <= 2) verdict = "close";
  else if (distance <= 4) verdict = "moderate";
  else if (distance <= 7) verdict = "far";
  else verdict = "orthogonal";

  return { distance, jaccard, intersection, symmetricDifference, verdict };
}

// ── Canvas State ───────────────────────────────────────────────────────────

export interface CanvasState {
  compositions: Composition[];
  selectedPrimitives: string[];
  compositionName: string;
}

export function createCanvasState(): CanvasState {
  return {
    compositions: [],
    selectedPrimitives: [],
    compositionName: "",
  };
}

/**
 * Serialize canvas state for persistence.
 */
export function serializeCanvas(state: CanvasState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize canvas state from JSON.
 */
export function deserializeCanvas(json: string): CanvasState {
  try {
    const parsed = JSON.parse(json);
    return {
      compositions: Array.isArray(parsed.compositions)
        ? parsed.compositions
        : [],
      selectedPrimitives: Array.isArray(parsed.selectedPrimitives)
        ? parsed.selectedPrimitives
        : [],
      compositionName:
        typeof parsed.compositionName === "string"
          ? parsed.compositionName
          : "",
    };
  } catch {
    return createCanvasState();
  }
}
