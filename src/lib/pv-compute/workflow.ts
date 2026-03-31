/**
 * Client-side PV workflow routing algorithms.
 *
 * Mirrors:
 *   workflow-router.yaml   — routes users to the correct PV starting tool
 *   full-case-router.yaml  — master case processor, routes by seriousness & signal
 *
 * Reference: ICH E2A, GVP Module IX
 *
 * T1 primitives: →(Causality) + κ(Comparison) + ς(State)
 */

// ── workflow-router ───────────────────────────────────────────────────────────

export type WorkflowTaskType =
  | "signal_detection"
  | "causality_assessment"
  | "case_review"
  | string;

export type WorkflowStartPoint =
  | "signal_detection"
  | "causality_assessment"
  | "case_review"
  | "data_collection";

export interface WorkflowInput {
  /** Task type: signal_detection | causality_assessment | case_review */
  task_type?: WorkflowTaskType;
  /** Whether the user has drug-event count data available */
  has_drug_event_data?: boolean;
}

export interface WorkflowRoute {
  start_with: WorkflowStartPoint;
  first_tool: string;
  description: string;
  next_steps: string;
}

/**
 * Routes to the correct PV starting tool based on available data and task type.
 *
 * Implements workflow-router.yaml (v0.1.0).
 * Decision order:
 *   1. task_type === signal_detection → signal path
 *   2. task_type === causality_assessment → causality path
 *   3. task_type === case_review → case path
 *   4. has_drug_event_data === true → signal path
 *   5. otherwise → getting started (data collection)
 */
export function routeWorkflow(input: WorkflowInput): WorkflowRoute {
  const task = input.task_type;
  const hasData = input.has_drug_event_data ?? false;

  if (task === "signal_detection") {
    return {
      start_with: "signal_detection",
      first_tool: "prr_calculator",
      description:
        "Analyze drug-event pair frequencies to detect safety signals using PRR",
      next_steps: "If signal found, proceed to causality assessment",
    };
  }

  if (task === "causality_assessment") {
    return {
      start_with: "causality_assessment",
      first_tool: "naranjo_scale",
      description:
        "Score the likelihood that a drug caused an adverse event using Naranjo algorithm",
      next_steps: "After scoring, review recommended regulatory action",
    };
  }

  if (task === "case_review") {
    return {
      start_with: "case_review",
      first_tool: "case_seriousness",
      description:
        "Evaluate the seriousness of an individual case report using ICH E2A criteria",
      next_steps: "After classification, check reporting deadlines",
    };
  }

  if (hasData) {
    return {
      start_with: "signal_detection",
      first_tool: "prr_calculator",
      description:
        "Analyze drug-event pair frequencies to detect safety signals using PRR",
      next_steps: "If signal found, proceed to causality assessment",
    };
  }

  return {
    start_with: "data_collection",
    first_tool: "none",
    description:
      "You need drug-event data to begin. Collect adverse event reports or FAERS data first",
    next_steps: "Once you have data, return and select signal detection",
  };
}

// ── full-case-router ──────────────────────────────────────────────────────────

export type CaseNextAction =
  | "ASSESS_CAUSALITY_URGENT"
  | "FILE_EXPEDITED_REPORT"
  | "ASSESS_CAUSALITY_ROUTINE"
  | "ROUTINE_MONITORING";

export type CasePriority = "P0" | "P1" | "P2" | "P3";

export interface CaseData {
  /** ICH E2A death criterion */
  has_death?: boolean;
  /** ICH E2A hospitalization criterion */
  has_hospitalization?: boolean;
  /** ICH E2A disability criterion */
  has_disability?: boolean;
  /** Signal detected in FAERS or disproportionality analysis */
  signal_detected?: boolean;
  /** Causality already assessed (Naranjo/WHO-UMC complete) */
  causality_assessed?: boolean;
}

export interface CaseRoute {
  next_action: CaseNextAction;
  priority: CasePriority;
  tool_path: string;
  reason: string;
}

/**
 * Master case processor: routes by seriousness, signal, and causality state.
 *
 * Implements full-case-router.yaml (v0.1.0).
 * Decision order:
 *   1. has_death → serious path
 *   2. has_hospitalization → serious path
 *   3. has_disability → serious path
 *   4. serious + causality_assessed → FILE_EXPEDITED_REPORT (P1)
 *   5. serious + !causality_assessed → ASSESS_CAUSALITY_URGENT (P0)
 *   6. !serious + signal_detected → ASSESS_CAUSALITY_ROUTINE (P2)
 *   7. !serious + !signal → ROUTINE_MONITORING (P3)
 */
export function routeFullCase(data: CaseData): CaseRoute {
  const isSerious =
    (data.has_death ?? false) ||
    (data.has_hospitalization ?? false) ||
    (data.has_disability ?? false);

  if (isSerious) {
    if (data.causality_assessed) {
      return {
        next_action: "FILE_EXPEDITED_REPORT",
        priority: "P1",
        tool_path: "/vigilance/reporting",
        reason:
          "Serious case with causality assessed - proceed to expedited regulatory filing",
      };
    }
    return {
      next_action: "ASSESS_CAUSALITY_URGENT",
      priority: "P0",
      tool_path: "/vigilance/causality",
      reason:
        "Serious case criteria met - immediate causality assessment required before expedited filing",
    };
  }

  if (data.signal_detected) {
    return {
      next_action: "ASSESS_CAUSALITY_ROUTINE",
      priority: "P2",
      tool_path: "/vigilance/causality",
      reason:
        "Signal detected in non-serious case - routine causality assessment recommended",
    };
  }

  return {
    next_action: "ROUTINE_MONITORING",
    priority: "P3",
    tool_path: "/vigilance/signals",
    reason:
      "No serious criteria and no signal - continue routine pharmacovigilance monitoring",
  };
}
