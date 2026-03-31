/**
 * Client-side ICSR case processing algorithms.
 *
 * Mirrors 5 micrograms from rsk-core/rsk/micrograms/:
 *   - icsr-triage.yaml        → triageCase()
 *   - case-ingest-validator.yaml → validateCaseIngest()
 *   - case-validity.yaml      → checkCaseValidity()
 *   - data-completeness.yaml  → assessDataCompleteness()
 *   - intake-to-triage.yaml   → routeIntakeToTriage()
 *
 * All functions are pure synchronous — no server round-trips.
 * Reference: ICH E2A, ICH E2B(R3)
 */

// ─── icsr-triage.yaml ─────────────────────────────────────────────────────────

export interface IcsrTriageInput {
  death?: boolean;
  hospitalization?: boolean;
  naranjo_score?: number;
  prr?: number;
}

export interface IcsrTriageResult {
  triage: "CRITICAL" | "SERIOUS" | "PROBABLE" | "MONITOR" | "LOW_SIGNAL";
  channel: "pager" | "slack" | "queue" | "backlog" | "archive";
  action: "expedited_report" | "investigate" | "periodic_review" | "document";
  deadline_days: 7 | 15 | 30 | 90;
}

/**
 * Triage an ICSR case by signal strength, seriousness, and causality.
 * Mirrors icsr-triage.yaml — PRR gates entry, then death/hosp/Naranjo route severity.
 */
export function triageCase(input: IcsrTriageInput): IcsrTriageResult {
  const prr = input.prr ?? 0;
  const death = input.death ?? false;
  const hospitalization = input.hospitalization ?? false;
  const naranjo_score = input.naranjo_score ?? 0;

  // signal_check: prr >= 2
  if (prr < 2) {
    return {
      triage: "LOW_SIGNAL",
      channel: "archive",
      action: "document",
      deadline_days: 90,
    };
  }
  // serious_check: death == true
  if (death) {
    return {
      triage: "CRITICAL",
      channel: "pager",
      action: "expedited_report",
      deadline_days: 7,
    };
  }
  // hosp_check: hospitalization == true
  if (hospitalization) {
    return {
      triage: "SERIOUS",
      channel: "slack",
      action: "expedited_report",
      deadline_days: 15,
    };
  }
  // causality_check: naranjo_score >= 5
  if (naranjo_score >= 5) {
    return {
      triage: "PROBABLE",
      channel: "queue",
      action: "investigate",
      deadline_days: 30,
    };
  }
  return {
    triage: "MONITOR",
    channel: "backlog",
    action: "periodic_review",
    deadline_days: 90,
  };
}

// ─── case-ingest-validator.yaml ───────────────────────────────────────────────

export interface CaseIngestInput {
  has_drug?: boolean;
  has_event?: boolean;
  has_reporter?: boolean;
}

export interface CaseIngestResult {
  status: "VALID" | "INCOMPLETE" | "REJECTED";
  description: string;
}

/**
 * Validate case data completeness before ingestion.
 * Requires drug, event, and reporter to proceed.
 * Mirrors case-ingest-validator.yaml.
 */
export function validateCaseIngest(input: CaseIngestInput): CaseIngestResult {
  const { has_drug = false, has_event = false, has_reporter = false } = input;

  if (!has_drug) {
    return {
      status: "REJECTED",
      description:
        "Missing drug information - case rejected without suspect drug",
    };
  }
  if (!has_event) {
    return {
      status: "INCOMPLETE",
      description: "Missing adverse event - cannot ingest without event data",
    };
  }
  if (!has_reporter) {
    return {
      status: "INCOMPLETE",
      description:
        "Missing reporter information - cannot ingest without reporter data",
    };
  }
  return {
    status: "VALID",
    description: "Case data complete - drug, event, and reporter all present",
  };
}

// ─── case-validity.yaml ───────────────────────────────────────────────────────

export interface CaseValidityInput {
  has_reporter?: boolean;
  has_patient?: boolean;
  has_suspect_drug?: boolean;
  has_adverse_event?: boolean;
}

export interface CaseValidityResult {
  valid: boolean;
  status:
    | "VALID_COMPLETE"
    | "INVALID_INCOMPLETE"
    | "INVALID_MINIMAL"
    | "INVALID_INSUFFICIENT";
  missing_count: number;
  missing_fields: string[];
  action:
    | "process_normally"
    | "request_followup"
    | "request_followup_urgent"
    | "cannot_process";
  regulatory_reference: string;
}

/**
 * Enforce 4 minimum ICH E2B(R3) validity criteria.
 * Required: reporter, patient, suspect drug, adverse event.
 * Mirrors case-validity.yaml.
 */
export function checkCaseValidity(
  input: CaseValidityInput,
): CaseValidityResult {
  const {
    has_reporter = false,
    has_patient = false,
    has_suspect_drug = false,
    has_adverse_event = false,
  } = input;

  const missing: string[] = [];
  if (!has_reporter) missing.push("reporter");
  if (!has_patient) missing.push("patient");
  if (!has_suspect_drug) missing.push("suspect_drug");
  if (!has_adverse_event) missing.push("adverse_event");

  const ref = "ICH E2B(R3) Section II.A";

  if (missing.length === 0) {
    return {
      valid: true,
      status: "VALID_COMPLETE",
      missing_count: 0,
      missing_fields: [],
      action: "process_normally",
      regulatory_reference: ref,
    };
  }
  if (missing.length === 1) {
    return {
      valid: false,
      status: "INVALID_INCOMPLETE",
      missing_count: 1,
      missing_fields: missing,
      action: "request_followup",
      regulatory_reference: ref,
    };
  }
  if (missing.length === 2) {
    return {
      valid: false,
      status: "INVALID_MINIMAL",
      missing_count: 2,
      missing_fields: missing,
      action: "request_followup_urgent",
      regulatory_reference: ref,
    };
  }
  return {
    valid: false,
    status: "INVALID_INSUFFICIENT",
    missing_count: missing.length,
    missing_fields: missing,
    action: "cannot_process",
    regulatory_reference: ref,
  };
}

// ─── data-completeness.yaml ───────────────────────────────────────────────────

export interface DataCompletenessInput {
  pct_filled?: number;
}

export interface DataCompletenessResult {
  completeness: "COMPLETE" | "PARTIAL" | "INSUFFICIENT";
  proceed: boolean;
  needs_enrichment: boolean;
}

/**
 * Assess data completeness: COMPLETE (>=95%), PARTIAL (>=70%), INSUFFICIENT (<70%).
 * Mirrors data-completeness.yaml.
 */
export function assessDataCompleteness(
  input: DataCompletenessInput,
): DataCompletenessResult {
  const pct = input.pct_filled ?? 0;

  if (pct >= 95) {
    return { completeness: "COMPLETE", proceed: true, needs_enrichment: false };
  }
  if (pct >= 70) {
    return { completeness: "PARTIAL", proceed: true, needs_enrichment: true };
  }
  return {
    completeness: "INSUFFICIENT",
    proceed: false,
    needs_enrichment: true,
  };
}

// ─── intake-to-triage.yaml ────────────────────────────────────────────────────

export interface IntakeToTriageInput {
  valid?: boolean;
  duplicate_status?:
    | "CONFIRMED"
    | "PROBABLE"
    | "POSSIBLE"
    | "UNLIKELY"
    | string;
  serious_suspected?: boolean;
  completeness_pct?: number;
}

export interface IntakeToTriageResult {
  route:
    | "RETURN_TO_INTAKE"
    | "MERGE"
    | "MANUAL_DEDUP"
    | "TRIAGE_EXPEDITED"
    | "TRIAGE_STANDARD"
    | "FOLLOWUP_FIRST";
  action: string;
  next_mg: string;
  priority: "CRITICAL" | "HIGH" | "STANDARD" | "LOW";
}

/**
 * Route completed intake cases to the appropriate triage pathway.
 * Checks validity → dedup status → seriousness + completeness.
 * Mirrors intake-to-triage.yaml.
 */
export function routeIntakeToTriage(
  input: IntakeToTriageInput,
): IntakeToTriageResult {
  const {
    valid = false,
    duplicate_status = "UNLIKELY",
    serious_suspected = false,
    completeness_pct = 0,
  } = input;

  if (!valid) {
    return {
      route: "RETURN_TO_INTAKE",
      action: "request_missing_fields",
      next_mg: "case-validity",
      priority: "HIGH",
    };
  }
  if (duplicate_status === "CONFIRMED") {
    return {
      route: "MERGE",
      action: "merge_with_primary",
      next_mg: "duplicate-gate",
      priority: "STANDARD",
    };
  }
  if (duplicate_status === "PROBABLE") {
    return {
      route: "MANUAL_DEDUP",
      action: "reviewer_dedup_check",
      next_mg: "duplicate-gate",
      priority: "STANDARD",
    };
  }
  if (serious_suspected && completeness_pct >= 80) {
    return {
      route: "TRIAGE_EXPEDITED",
      action: "case-seriousness",
      next_mg: "case-seriousness",
      priority: "CRITICAL",
    };
  }
  if (completeness_pct >= 60) {
    return {
      route: "TRIAGE_STANDARD",
      action: "case-seriousness",
      next_mg: "case-seriousness",
      priority: "STANDARD",
    };
  }
  return {
    route: "FOLLOWUP_FIRST",
    action: "collect_data",
    next_mg: "followup-prioritizer",
    priority: "LOW",
  };
}
