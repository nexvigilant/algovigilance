/**
 * Client-side surveillance microgram computations.
 *
 * Implements YAML decision trees from rsk/micrograms/:
 *   signal-validation-gate.yaml — classifies signal strength from boolean criteria
 *   triage-to-signal.yaml      — routes triage output to next PV chain
 *
 * T1 primitives: ∂(Boundary) + κ(Comparison) + Ψ(Routing)
 */

// ── Signal Validation Gate ───────────────────────────────────────────────────

export interface SignalValidationInput {
  /** PRR meets Evans criteria (>= 2.0) */
  prr_above_threshold?: boolean;
  /** Minimum case count met (N >= 3) */
  case_count_sufficient?: boolean;
  /** Reports from multiple geographic regions */
  geographic_spread?: boolean;
  /** Biologically plausible onset timing observed */
  temporal_pattern?: boolean;
}

export interface SignalValidationResult {
  classification:
    | "VALIDATED_SIGNAL"
    | "PROBABLE_SIGNAL"
    | "POSSIBLE_SIGNAL"
    | "NOISE";
  confidence: number;
  next_action: string;
}

/**
 * Classify signal strength from boolean validation criteria.
 *
 * Implements signal-validation-gate.yaml (v0.1.0).
 * Counts confirmed criteria to rank signal evidence:
 *   4 criteria → VALIDATED_SIGNAL (confidence 95)
 *   3 criteria → PROBABLE_SIGNAL  (confidence 75)
 *   2 criteria → POSSIBLE_SIGNAL  (confidence 50)
 *   ≤1 criterion → NOISE          (confidence 20)
 *
 * PRR is checked first (Evans criteria anchor). Geographic spread
 * and temporal pattern are weighted after case count.
 */
export function validateSignal(
  signal: SignalValidationInput,
): SignalValidationResult {
  const prr = signal.prr_above_threshold ?? false;
  const cases = signal.case_count_sufficient ?? false;
  const geo = signal.geographic_spread ?? false;
  const temporal = signal.temporal_pattern ?? false;

  // Follows the exact tree traversal order from signal-validation-gate.yaml
  if (prr) {
    if (cases) {
      if (geo) {
        if (temporal) {
          return {
            classification: "VALIDATED_SIGNAL",
            confidence: 95,
            next_action:
              "Open formal signal investigation and convene safety review committee",
          };
        }
        // prr=1, cases=1, geo=1, temporal=0 → PROBABLE
        return {
          classification: "PROBABLE_SIGNAL",
          confidence: 75,
          next_action:
            "Conduct targeted data query and expedited medical review within 30 days",
        };
      }
      // prr=1, cases=1, geo=0
      if (temporal) {
        return {
          classification: "PROBABLE_SIGNAL",
          confidence: 75,
          next_action:
            "Conduct targeted data query and expedited medical review within 30 days",
        };
      }
      return {
        classification: "POSSIBLE_SIGNAL",
        confidence: 50,
        next_action: "Add to signal monitoring list for continued surveillance",
      };
    }
    // prr=1, cases=0
    if (geo) {
      if (temporal) {
        return {
          classification: "PROBABLE_SIGNAL",
          confidence: 75,
          next_action:
            "Conduct targeted data query and expedited medical review within 30 days",
        };
      }
      return {
        classification: "POSSIBLE_SIGNAL",
        confidence: 50,
        next_action: "Add to signal monitoring list for continued surveillance",
      };
    }
    if (temporal) {
      return {
        classification: "POSSIBLE_SIGNAL",
        confidence: 50,
        next_action: "Add to signal monitoring list for continued surveillance",
      };
    }
    // prr=1, cases=0, geo=0, temporal=0 → NOISE
    return {
      classification: "NOISE",
      confidence: 20,
      next_action:
        "Continue routine pharmacovigilance monitoring - no signal action required",
    };
  }

  // prr=0
  if (cases) {
    if (geo) {
      if (temporal) {
        return {
          classification: "PROBABLE_SIGNAL",
          confidence: 75,
          next_action:
            "Conduct targeted data query and expedited medical review within 30 days",
        };
      }
      return {
        classification: "POSSIBLE_SIGNAL",
        confidence: 50,
        next_action: "Add to signal monitoring list for continued surveillance",
      };
    }
    if (temporal) {
      return {
        classification: "POSSIBLE_SIGNAL",
        confidence: 50,
        next_action: "Add to signal monitoring list for continued surveillance",
      };
    }
    return {
      classification: "NOISE",
      confidence: 20,
      next_action:
        "Continue routine pharmacovigilance monitoring - no signal action required",
    };
  }

  // prr=0, cases=0
  if (geo && temporal) {
    return {
      classification: "POSSIBLE_SIGNAL",
      confidence: 50,
      next_action: "Add to signal monitoring list for continued surveillance",
    };
  }
  if (geo || temporal) {
    return {
      classification: "NOISE",
      confidence: 20,
      next_action:
        "Continue routine pharmacovigilance monitoring - no signal action required",
    };
  }

  return {
    classification: "NOISE",
    confidence: 20,
    next_action:
      "Continue routine pharmacovigilance monitoring - no signal action required",
  };
}

// ── Triage-to-Signal Router ───────────────────────────────────────────────────

export interface TriageInput {
  /** ICH E2A seriousness criteria met */
  serious?: boolean;
  /** Listed in reference safety information */
  expected?: boolean;
  /** Case qualifies for signal review queue */
  signal_review_eligible?: boolean;
  /** Number of cases in database */
  case_count?: number;
  /** Causality assessment requested */
  causality_needed?: boolean;
}

export type TriageRoute =
  | "SUSAR_PATHWAY"
  | "SIGNAL_DETECTION"
  | "CAUSALITY_ASSESSMENT"
  | "PERIODIC_REPORTING"
  | "ROUTINE_MONITORING";

export interface TriageResult {
  route: TriageRoute;
  next_chain: string;
  priority: "CRITICAL" | "HIGH" | "STANDARD" | "LOW";
  escalation_needed: boolean;
}

/**
 * Route a triaged case to the appropriate PV workflow chain.
 *
 * Implements triage-to-signal.yaml (v1.0.0).
 * Priority ordering:
 *   1. SUSAR pathway (serious + unexpected) — CRITICAL
 *   2. Signal detection (eligible + N >= 3)  — HIGH
 *   3. Causality assessment (if needed)      — STANDARD
 *   4. Periodic reporting (serious expected) — STANDARD
 *   5. Routine monitoring (default)          — LOW
 *
 * ICH E2A: SUSARs (serious unexpected) require expedited reporting.
 * Evans criteria: N >= 3 is minimum for disproportionality analysis.
 */
export function triageToSignal(triage: TriageInput): TriageResult {
  const serious = triage.serious ?? false;
  const expected = triage.expected ?? true;
  const signalEligible = triage.signal_review_eligible ?? false;
  const caseCount = triage.case_count ?? 0;
  const causalityNeeded = triage.causality_needed ?? false;

  // Step 1: SUSAR check — serious + unexpected = expedited reporting required
  if (serious && !expected) {
    return {
      route: "SUSAR_PATHWAY",
      next_chain: "susar-classifier -> expedited-reporting",
      priority: "CRITICAL",
      escalation_needed: true,
    };
  }

  // Step 2: Signal detection eligibility (Evans criteria N >= 3)
  if (signalEligible && caseCount >= 3) {
    return {
      route: "SIGNAL_DETECTION",
      next_chain: "prr-signal -> ror-signal -> multi-signal-combiner",
      priority: "HIGH",
      escalation_needed: false,
    };
  }

  // Step 3: Causality assessment
  if (causalityNeeded) {
    return {
      route: "CAUSALITY_ASSESSMENT",
      next_chain: "naranjo-quick -> causality-to-action",
      priority: "STANDARD",
      escalation_needed: false,
    };
  }

  // Step 4: Periodic reporting (serious but expected, no other path)
  if (serious) {
    return {
      route: "PERIODIC_REPORTING",
      next_chain: "report-deadline",
      priority: "STANDARD",
      escalation_needed: false,
    };
  }

  // Default: routine monitoring
  return {
    route: "ROUTINE_MONITORING",
    next_chain: "quality-score",
    priority: "LOW",
    escalation_needed: false,
  };
}
