/**
 * Client-side Theory of Vigilance harm classification.
 *
 * 8 harm types (A-H) derived combinatorially from 3 binary attributes:
 * Temporal × Scope × Mechanism (2³ = 8)
 *
 * Maps 1:1 with NexCore vigilance_harm_types MCP tool.
 * All computation runs in the browser — no server round-trip.
 *
 * T1 primitives: Σ(Sum/disjunction) + κ(Comparison) + ∂(Boundary) + →(Causality)
 */

export interface HarmType {
  letter: string;
  name: string;
  conservation_law: number | null;
  hierarchy_levels: number[];
  temporal: 'acute' | 'cumulative';
  scope: 'individual' | 'population';
  mechanism: 'direct' | 'indirect';
  description: string;
  examples: string[];
  conservation_description: string;
}

export interface ClassificationResult {
  harm_type: HarmType;
  confidence: number;
  reasoning: string[];
  safety_margin_applicable: boolean;
}

export interface SafetyMarginInput {
  prr: number;
  ror_lower: number;
  ic025: number;
  eb05: number;
  n: number;
}

export interface SafetyMarginResult {
  d_s: number;
  safe: boolean;
  interpretation: string;
  contributing_factors: { metric: string; value: number; threshold: number; breached: boolean }[];
}

const HIERARCHY_NAMES: Record<number, string> = {
  1: 'Atomic',
  2: 'Molecular',
  3: 'Subcellular',
  4: 'Cellular',
  5: 'Tissue/Organ',
  6: 'Clinical',
  7: 'Population',
  8: 'Regulatory',
};

const CONSERVATION_LAWS: Record<number, string> = {
  1: 'Energy conservation (dose-response proportionality)',
  2: 'Selectivity conservation (off-target binding proportional to affinity)',
  4: 'Cascade amplification (signal propagates through pathway)',
  5: 'Interaction additivity (combined effect ≥ sum of individual effects)',
  8: 'Saturation kinetics (Michaelis-Menten capacity limit)',
};

export const HARM_TYPES: HarmType[] = [
  {
    letter: 'A',
    name: 'Acute',
    conservation_law: 1,
    hierarchy_levels: [4, 5, 6],
    temporal: 'acute',
    scope: 'individual',
    mechanism: 'direct',
    description: 'Immediate, dose-dependent adverse effects from direct pharmacological action.',
    examples: ['Hypotension from antihypertensives', 'Bleeding from anticoagulants', 'Bradycardia from beta-blockers'],
    conservation_description: 'Energy conservation: effect magnitude proportional to dose',
  },
  {
    letter: 'B',
    name: 'Cumulative',
    conservation_law: 1,
    hierarchy_levels: [5, 6, 7],
    temporal: 'cumulative',
    scope: 'individual',
    mechanism: 'direct',
    description: 'Time-dependent effects that accumulate with repeated exposure.',
    examples: ['Nephrotoxicity from aminoglycosides', 'Hepatotoxicity from methotrexate', 'Ototoxicity from cisplatin'],
    conservation_description: 'Energy conservation: cumulative dose drives cumulative damage',
  },
  {
    letter: 'C',
    name: 'Off-Target',
    conservation_law: 2,
    hierarchy_levels: [3, 4, 5],
    temporal: 'acute',
    scope: 'individual',
    mechanism: 'indirect',
    description: 'Effects from unintended receptor binding or pathway activation.',
    examples: ['QT prolongation from non-cardiac drugs', 'Anticholinergic effects of antihistamines', 'Serotonin syndrome'],
    conservation_description: 'Selectivity conservation: off-target effects proportional to binding affinity',
  },
  {
    letter: 'D',
    name: 'Cascade',
    conservation_law: 4,
    hierarchy_levels: [4, 5, 6, 7],
    temporal: 'cumulative',
    scope: 'individual',
    mechanism: 'indirect',
    description: 'Signal amplification through biological cascades causing delayed, indirect harm.',
    examples: ['Drug-induced lupus', 'Stevens-Johnson syndrome', 'Immune-mediated thrombocytopenia'],
    conservation_description: 'Cascade amplification: small initial signal amplified through pathway',
  },
  {
    letter: 'E',
    name: 'Idiosyncratic',
    conservation_law: null,
    hierarchy_levels: [3, 4, 5, 6],
    temporal: 'acute',
    scope: 'population',
    mechanism: 'direct',
    description: 'Unpredictable reactions in genetically susceptible subpopulations.',
    examples: ['Malignant hyperthermia from anesthetics', 'HLA-B*5701 abacavir hypersensitivity', 'G6PD deficiency hemolysis'],
    conservation_description: 'No conservation law — stochastic, genotype-dependent',
  },
  {
    letter: 'F',
    name: 'Saturation',
    conservation_law: 8,
    hierarchy_levels: [3, 4, 5],
    temporal: 'cumulative',
    scope: 'population',
    mechanism: 'direct',
    description: 'Capacity-limited metabolism causing nonlinear toxicity at high doses.',
    examples: ['Acetaminophen hepatotoxicity (glutathione depletion)', 'Phenytoin toxicity (zero-order kinetics)', 'Ethanol toxicity'],
    conservation_description: 'Saturation kinetics: Michaelis-Menten enzyme capacity exceeded',
  },
  {
    letter: 'G',
    name: 'Interaction',
    conservation_law: 5,
    hierarchy_levels: [4, 5, 6],
    temporal: 'acute',
    scope: 'population',
    mechanism: 'indirect',
    description: 'Harmful effects from drug-drug or drug-food interactions.',
    examples: ['Warfarin + NSAIDs (bleeding risk)', 'MAOIs + tyramine (hypertensive crisis)', 'Statins + CYP3A4 inhibitors (rhabdomyolysis)'],
    conservation_description: 'Interaction additivity: combined effect exceeds individual effects',
  },
  {
    letter: 'H',
    name: 'Population',
    conservation_law: null,
    hierarchy_levels: [6, 7, 8],
    temporal: 'cumulative',
    scope: 'population',
    mechanism: 'indirect',
    description: 'Emergent safety signals visible only at population scale.',
    examples: ['Increased cardiovascular risk from COX-2 inhibitors', 'Rare cancers from long-term immunosuppression', 'Antimicrobial resistance'],
    conservation_description: 'No conservation law — emergent population-level phenomenon',
  },
];

/**
 * Classify an adverse event by answering 3 binary questions.
 */
export function classifyHarm(
  temporal: 'acute' | 'cumulative',
  scope: 'individual' | 'population',
  mechanism: 'direct' | 'indirect'
): ClassificationResult {
  const match = HARM_TYPES.find(
    h => h.temporal === temporal && h.scope === scope && h.mechanism === mechanism
  );

  if (!match) {
    return {
      harm_type: HARM_TYPES[0],
      confidence: 0,
      reasoning: ['No matching harm type found'],
      safety_margin_applicable: false,
    };
  }

  const reasoning = [
    `Temporal: ${temporal} → ${temporal === 'acute' ? 'immediate onset' : 'delayed/accumulated'}`,
    `Scope: ${scope} → ${scope === 'individual' ? 'patient-level' : 'population-level'}`,
    `Mechanism: ${mechanism} → ${mechanism === 'direct' ? 'on-target pharmacology' : 'off-target/cascade'}`,
    `Classification: Type ${match.letter} (${match.name})`,
    `Conservation: ${match.conservation_description}`,
  ];

  return {
    harm_type: match,
    confidence: 1.0,
    reasoning,
    safety_margin_applicable: match.conservation_law !== null,
  };
}

/**
 * Compute safety margin d(s) from signal metrics.
 * d(s) > 0 means safe, d(s) < 0 means signal detected.
 */
export function computeSafetyMargin(input: SafetyMarginInput): SafetyMarginResult {
  const thresholds = {
    prr: 2.0,
    ror_lower: 1.0,
    ic025: 0,
    eb05: 2.0,
    n_min: 3,
  };

  const factors = [
    { metric: 'PRR', value: input.prr, threshold: thresholds.prr, breached: input.prr >= thresholds.prr },
    { metric: 'ROR lower CI', value: input.ror_lower, threshold: thresholds.ror_lower, breached: input.ror_lower > thresholds.ror_lower },
    { metric: 'IC025', value: input.ic025, threshold: thresholds.ic025, breached: input.ic025 > thresholds.ic025 },
    { metric: 'EB05', value: input.eb05, threshold: thresholds.eb05, breached: input.eb05 >= thresholds.eb05 },
    { metric: 'Case count (N)', value: input.n, threshold: thresholds.n_min, breached: input.n >= thresholds.n_min },
  ];

  const breachedCount = factors.filter(f => f.breached).length;

  // d(s) = normalized distance: positive = safe, negative = signal
  // Simple: average of (threshold - value)/threshold for each metric, capped
  const distances = [
    (thresholds.prr - input.prr) / thresholds.prr,
    (thresholds.ror_lower - input.ror_lower) / thresholds.ror_lower,
    (thresholds.ic025 - input.ic025) / Math.max(Math.abs(thresholds.ic025), 1),
    (thresholds.eb05 - input.eb05) / thresholds.eb05,
  ];

  const d_s = round4(distances.reduce((a, b) => a + b, 0) / distances.length);

  let interpretation: string;
  if (breachedCount === 0) {
    interpretation = 'No signal thresholds breached — within safety boundary';
  } else if (breachedCount <= 2) {
    interpretation = `${breachedCount}/5 thresholds breached — weak signal, monitor`;
  } else if (breachedCount <= 4) {
    interpretation = `${breachedCount}/5 thresholds breached — moderate signal, investigate`;
  } else {
    interpretation = `All thresholds breached — strong signal, action required`;
  }

  return {
    d_s,
    safe: d_s > 0,
    interpretation,
    contributing_factors: factors,
  };
}

export function getHierarchyName(level: number): string {
  return HIERARCHY_NAMES[level] ?? `Level ${level}`;
}

export function getConservationLaw(id: number): string {
  return CONSERVATION_LAWS[id] ?? 'Unknown';
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
