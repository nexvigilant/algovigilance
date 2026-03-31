/**
 * Intelligence Products Schema
 *
 * Micrograms are grams in stoichiometry. They combine in defined ratios
 * to produce intelligence products. Each product has a balanced equation:
 * reagent micrograms + catalyst MCP tools → product + evidence residue.
 *
 * The schema encodes WHAT combines, in WHAT ratio, producing WHAT output,
 * validated by WHAT gate.
 */

// ---------------------------------------------------------------------------
// Reagents — micrograms as stoichiometric inputs
// ---------------------------------------------------------------------------

/** A microgram reagent with its stoichiometric coefficient */
export interface Reagent {
  /** Microgram name (e.g., "prr-signal", "naranjo-quick") */
  microgram: string;
  /** Stoichiometric coefficient — how many moles needed (usually 1) */
  coefficient: number;
  /** Phase in the reaction sequence (reagents in same phase run in parallel) */
  phase: number;
  /** What this reagent contributes to the product */
  yields: string;
}

/** MCP tool acting as a catalyst — enables the reaction without being consumed */
export interface Catalyst {
  /** MCP tool name (e.g., "api_fda_gov_search_adverse_events") */
  tool: string;
  /** Domain the catalyst draws from */
  domain: string;
  /** What the catalyst provides (data, computation, validation) */
  role: "data_source" | "computation" | "validation" | "enrichment";
}

// ---------------------------------------------------------------------------
// Products — intelligence outputs
// ---------------------------------------------------------------------------

/** Classification of intelligence product */
export type ProductClass =
  | "susar_brief" // Suspected Unexpected Serious Adverse Reaction
  | "signal_report" // Disproportionality signal investigation
  | "causality_dossier" // Deep causality assessment
  | "class_review" // Drug class comparative analysis
  | "safety_profile" // Comprehensive drug safety summary
  | "regulatory_action" // Recommended regulatory response
  | "competitive_intel"; // Head-to-head manufacturer comparison;

/** Seriousness level per ICH E2A — determines escalation timeline */
export type Seriousness =
  | "fatal"
  | "life_threatening"
  | "disability"
  | "congenital_anomaly"
  | "hospitalization"
  | "medically_important"
  | "non_serious";

/** Evidence grade for a claim within a product */
export type EvidenceGrade =
  | "mcp_computed" // Computed by MCP tool from live database
  | "mcp_retrieved" // Retrieved from regulatory database via MCP
  | "literature" // Published peer-reviewed source with PMID
  | "derived" // Calculated from other validated claims
  | "unverified"; // Not yet validated — blocks product completion

// ---------------------------------------------------------------------------
// The Balanced Equation
// ---------------------------------------------------------------------------

/** A stoichiometric equation for producing an intelligence product */
export interface BalancedEquation {
  /** Unique equation identifier (e.g., "SUSAR-7L" for 7-layer SUSAR brief) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Product class this equation produces */
  productClass: ProductClass;

  /** Reagent micrograms — the decision trees that combine */
  reagents: Reagent[];
  /** Catalyst MCP tools — data sources and compute engines */
  catalysts: Catalyst[];

  /** Number of distinct phases (sequential steps in the reaction) */
  phaseCount: number;

  /** Validation gate — what must be true for the product to be valid */
  completionGate: CompletionGate;
}

/** Gate that validates the product is complete */
export interface CompletionGate {
  /** Minimum number of validated claims (0 = unverified allowed) */
  minValidatedClaims: number;
  /** All claims must be this grade or higher */
  minEvidenceGrade: EvidenceGrade;
  /** ICH E2A seriousness must be assessed */
  requireSeriousness: boolean;
  /** Naranjo or WHO-UMC causality must be computed */
  requireCausality: boolean;
  /** DailyMed label must be checked for expectedness */
  requireLabelCheck: boolean;
  /** At least one literature source must exist */
  requireLiterature: boolean;
}

// ---------------------------------------------------------------------------
// Intelligence Product — the output
// ---------------------------------------------------------------------------

/** A produced intelligence product (the result of running a balanced equation) */
export interface IntelligenceProduct {
  /** AlgoVigilance Intelligence Brief number (e.g., "NIB-2026-001") */
  nib: string;
  /** Which equation produced this */
  equationId: string;
  /** Product class */
  productClass: ProductClass;
  /** Date produced */
  producedAt: string;

  /** The drug investigated */
  drug: string;
  /** The adverse event investigated */
  event: string;
  /** Manufacturer / MAH */
  manufacturer: string;

  /** Quantitative claims with evidence grades */
  claims: Claim[];

  /** Signal metrics */
  signal: SignalMetrics;

  /** Causality assessment result */
  causality: CausalityResult | null;

  /** Label status — the SUSAR boundary */
  onLabel: boolean;

  /** ICH E2A seriousness */
  seriousness: Seriousness;

  /** Harm type per ToV §9 taxonomy (A-H) */
  harmType: string;

  /** Regulatory actions produced */
  outputs: ProductOutput[];
}

/** A single quantitative claim within a product */
export interface Claim {
  /** What is being claimed */
  statement: string;
  /** Numeric value (if applicable) */
  value: number | null;
  /** Evidence grade */
  grade: EvidenceGrade;
  /** MCP tool or source that produced this claim */
  source: string;
}

/** Disproportionality signal metrics */
export interface SignalMetrics {
  prr: number;
  prrCiLower: number;
  prrCiUpper: number;
  ror: number;
  ic: number;
  ic025: number;
  caseCount: number;
  chiSquared: number;
  /** Evans criteria: PRR >= 2.0, chi2 >= 4.0, N >= 3 */
  evansMetAll: boolean;
}

/** Causality assessment result */
export interface CausalityResult {
  method: "naranjo" | "who_umc";
  score: number;
  maxScore: number;
  category: "definite" | "probable" | "possible" | "doubtful" | "unlikely";
}

/** Downstream output produced from the intelligence product */
export interface ProductOutput {
  type:
    | "nucleus_page"
    | "epub"
    | "mah_letter"
    | "medwatch_report"
    | "crystalbook_entry";
  path: string;
  status: "draft" | "ready" | "published" | "sent";
}

// ---------------------------------------------------------------------------
// Pre-defined Equations — the reaction library
// ---------------------------------------------------------------------------

/** The 7-Layer SUSAR Brief equation (what we built today) */
export const SUSAR_7L: BalancedEquation = {
  id: "SUSAR-7L",
  name: "7-Layer SUSAR Intelligence Brief",
  productClass: "susar_brief",
  phaseCount: 7,
  reagents: [
    {
      microgram: "prr-signal",
      coefficient: 1,
      phase: 1,
      yields: "Layer 1: Signal Detection",
    },
    {
      microgram: "case-seriousness",
      coefficient: 1,
      phase: 2,
      yields: "Layer 2: Case Series",
    },
    {
      microgram: "naranjo-quick",
      coefficient: 1,
      phase: 3,
      yields: "Layer 3: Causality",
    },
    {
      microgram: "seriousness-to-deadline",
      coefficient: 1,
      phase: 4,
      yields: "Layer 4: Expectedness + SUSAR gate",
    },
    {
      microgram: "signal-to-causality",
      coefficient: 1,
      phase: 5,
      yields: "Layer 5: Comparative / Plausibility",
    },
    {
      microgram: "pv-signal-to-action",
      coefficient: 1,
      phase: 6,
      yields: "Layer 6: Literature",
    },
    {
      microgram: "causality-to-action",
      coefficient: 1,
      phase: 7,
      yields: "Layer 7: Regulatory Action",
    },
  ],
  catalysts: [
    {
      tool: "rxnav_nlm_nih_gov_search_drugs",
      domain: "rxnav",
      role: "data_source",
    },
    {
      tool: "api_fda_gov_search_adverse_events",
      domain: "faers",
      role: "data_source",
    },
    {
      tool: "open-vigil_fr_compute_disproportionality",
      domain: "openvigil",
      role: "computation",
    },
    {
      tool: "calculate_nexvigilant_com_compute_prr",
      domain: "compute",
      role: "computation",
    },
    {
      tool: "calculate_nexvigilant_com_assess_naranjo_causality",
      domain: "compute",
      role: "computation",
    },
    {
      tool: "dailymed_nlm_nih_gov_get_adverse_reactions",
      domain: "dailymed",
      role: "validation",
    },
    {
      tool: "pubmed_ncbi_nlm_nih_gov_search_signal_literature",
      domain: "pubmed",
      role: "enrichment",
    },
    {
      tool: "vigilance_nexvigilant_com_harm_classify",
      domain: "vigilance",
      role: "computation",
    },
  ],
  completionGate: {
    minValidatedClaims: 13,
    minEvidenceGrade: "mcp_computed",
    requireSeriousness: true,
    requireCausality: true,
    requireLabelCheck: true,
    requireLiterature: true,
  },
};

/** Signal Report — lighter than SUSAR, no regulatory action layer */
export const SIGNAL_REPORT: BalancedEquation = {
  id: "SIGNAL-RPT",
  name: "Signal Detection Report",
  productClass: "signal_report",
  phaseCount: 4,
  reagents: [
    {
      microgram: "prr-signal",
      coefficient: 1,
      phase: 1,
      yields: "Disproportionality",
    },
    {
      microgram: "case-seriousness",
      coefficient: 1,
      phase: 2,
      yields: "Case characterization",
    },
    {
      microgram: "naranjo-quick",
      coefficient: 1,
      phase: 3,
      yields: "Causality screening",
    },
    {
      microgram: "workflow-router",
      coefficient: 1,
      phase: 4,
      yields: "Action routing",
    },
  ],
  catalysts: [
    {
      tool: "api_fda_gov_search_adverse_events",
      domain: "faers",
      role: "data_source",
    },
    {
      tool: "open-vigil_fr_compute_disproportionality",
      domain: "openvigil",
      role: "computation",
    },
  ],
  completionGate: {
    minValidatedClaims: 5,
    minEvidenceGrade: "mcp_computed",
    requireSeriousness: true,
    requireCausality: false,
    requireLabelCheck: false,
    requireLiterature: false,
  },
};

/** Class Review — comparative analysis across drug class */
export const CLASS_REVIEW: BalancedEquation = {
  id: "CLASS-REV",
  name: "Drug Class Comparative Review",
  productClass: "class_review",
  phaseCount: 5,
  reagents: [
    {
      microgram: "prr-signal",
      coefficient: 2,
      phase: 1,
      yields: "Signal per drug (coefficient=2: index + comparator)",
    },
    {
      microgram: "case-seriousness",
      coefficient: 2,
      phase: 2,
      yields: "Seriousness per drug",
    },
    {
      microgram: "naranjo-quick",
      coefficient: 2,
      phase: 3,
      yields: "Causality per drug",
    },
    {
      microgram: "benefit-risk-assessment",
      coefficient: 1,
      phase: 4,
      yields: "Head-to-head benefit-risk",
    },
    {
      microgram: "pv-signal-to-action",
      coefficient: 1,
      phase: 5,
      yields: "Class-level action",
    },
  ],
  catalysts: [
    {
      tool: "open-vigil_fr_compare_drugs",
      domain: "openvigil",
      role: "computation",
    },
    {
      tool: "calculate_nexvigilant_com_compute_disproportionality_table",
      domain: "compute",
      role: "computation",
    },
    {
      tool: "pubmed_ncbi_nlm_nih_gov_search_signal_literature",
      domain: "pubmed",
      role: "enrichment",
    },
  ],
  completionGate: {
    minValidatedClaims: 10,
    minEvidenceGrade: "mcp_computed",
    requireSeriousness: true,
    requireCausality: true,
    requireLabelCheck: true,
    requireLiterature: true,
  },
};

/** All available equations */
export const EQUATION_LIBRARY: BalancedEquation[] = [
  SUSAR_7L,
  SIGNAL_REPORT,
  CLASS_REVIEW,
];

/** Look up an equation by ID */
export function getEquation(id: string): BalancedEquation | undefined {
  return EQUATION_LIBRARY.find((eq) => eq.id === id);
}

/** Compute the limiting reagent — the microgram that constrains production */
export function limitingReagent(
  equation: BalancedEquation,
  available: Record<string, number>,
): Reagent | null {
  let limiting: Reagent | null = null;
  let minRatio = Infinity;

  for (const reagent of equation.reagents) {
    const have = available[reagent.microgram] ?? 0;
    const ratio = have / reagent.coefficient;
    if (ratio < minRatio) {
      minRatio = ratio;
      limiting = reagent;
    }
  }

  return minRatio === 0 ? limiting : null;
}
