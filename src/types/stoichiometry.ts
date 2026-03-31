/**
 * Stoichiometry types — mirrors Rust nexcore-lex-primitiva stoichiometry module.
 *
 * Concepts are encoded as balanced equations of 15 operational primitives,
 * analogous to chemical equations where mass (primitive weight) must be conserved.
 */

// --- Core Stoichiometry Types ---

export interface MolecularFormula {
  primitives: string[];
  weight: number;
}

export interface ReactantFormula {
  word: string;
  formula: MolecularFormula;
}

export interface ConceptFormula {
  name: string;
  formula: MolecularFormula;
  definition: string;
}

export interface PrimitiveInventory {
  reactant_counts: number[];
  product_counts: number[];
}

export interface BalanceProof {
  reactant_mass: number;
  product_mass: number;
  delta: number;
  is_balanced: boolean;
  primitive_inventory: PrimitiveInventory;
}

export interface BalancedEquation {
  concept: ConceptFormula;
  reactants: ReactantFormula[];
  balance: BalanceProof;
}

// --- Dictionary ---

export interface TermEntry {
  name: string;
  definition: string;
  source: string;
  equation: BalancedEquation;
}

// --- Jeopardy ---

export interface JeopardyAnswer {
  question: string;
  concept: string;
  confidence: number;
  equation_display: string;
}

// --- Sister Concepts ---

export interface SisterMatch {
  name: string;
  similarity: number;
  shared_primitives: string[];
  unique_to_self: string[];
  unique_to_other: string[];
  is_isomer: boolean;
}

// --- Thermodynamic Mass State ---

export interface MassStateInfo {
  total_mass: number;
  entropy: number;
  max_entropy: number;
  gibbs_free_energy: number;
  is_equilibrium: boolean;
  depleted: string[];
  saturated: string[];
}

// --- Primitive metadata for UI ---

export interface PrimitiveInfo {
  symbol: string;
  name: string;
  color: string;
}

export const PRIMITIVES: PrimitiveInfo[] = [
  { symbol: '\u2192', name: 'Causality', color: 'rose' },
  { symbol: 'N', name: 'Quantity', color: 'amber' },
  { symbol: '\u2203', name: 'Existence', color: 'emerald' },
  { symbol: '\u03BA', name: 'Comparison', color: 'sky' },
  { symbol: '\u03C2', name: 'State', color: 'violet' },
  { symbol: '\u03BC', name: 'Mapping', color: 'orange' },
  { symbol: '\u03C3', name: 'Sequence', color: 'teal' },
  { symbol: '\u03C1', name: 'Recursion', color: 'pink' },
  { symbol: '\u2205', name: 'Void', color: 'slate' },
  { symbol: '\u2202', name: 'Boundary', color: 'cyan' },
  { symbol: '\u03BD', name: 'Frequency', color: 'yellow' },
  { symbol: '\u03BB', name: 'Location', color: 'lime' },
  { symbol: '\u03C0', name: 'Persistence', color: 'indigo' },
  { symbol: '\u221D', name: 'Irreversibility', color: 'red' },
  { symbol: '\u03A3', name: 'Sum', color: 'purple' },
];

/** Lookup a primitive by name (case-insensitive) */
export function findPrimitive(name: string): PrimitiveInfo | undefined {
  const lower = name.toLowerCase();
  return PRIMITIVES.find((p) => p.name.toLowerCase() === lower);
}

/** Lookup a primitive by symbol */
export function findPrimitiveBySymbol(symbol: string): PrimitiveInfo | undefined {
  return PRIMITIVES.find((p) => p.symbol === symbol);
}

/** Sources for stoichiometric definitions */
export const DEFINITION_SOURCES = [
  'ICH',
  'CIOMS',
  'FDA',
  'WHO',
  'MedDRA',
  'Custom',
] as const;

export type DefinitionSource = (typeof DEFINITION_SOURCES)[number];
