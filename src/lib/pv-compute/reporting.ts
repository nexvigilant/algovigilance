/**
 * Client-side regulatory reporting algorithms.
 *
 * Mirrors 3 micrograms from rsk-core/rsk/micrograms/:
 *   - report-deadline.yaml      → computeReportDeadline()
 *   - reporting-priority.yaml   → computeReportingPriority()
 *   - expedited-reporting.yaml  → computeExpeditedReporting()
 *
 * All functions are pure synchronous — no server round-trips.
 * Reference: ICH E2A, ICH E2C(R2), ICH E2D, 21 CFR 312.32, 21 CFR 314.80
 */

// ─── report-deadline.yaml ─────────────────────────────────────────────────────

export interface ReportDeadlineInput {
  expedited?: boolean;
  /** 'SERIOUS' triggers 7-day if expedited, otherwise 15-day */
  seriousness?: string;
}

export interface ReportDeadlineResult {
  deadline_days: 7 | 15 | 90;
  report_type: "7-day" | "15-day" | "periodic";
  regulatory_basis: string;
}

/**
 * Determine regulatory reporting deadline from seriousness and expedited flag.
 * Mirrors report-deadline.yaml.
 */
export function computeReportDeadline(
  input: ReportDeadlineInput,
): ReportDeadlineResult {
  const expedited = input.expedited ?? false;
  const seriousness = input.seriousness ?? "";

  if (!expedited) {
    return {
      deadline_days: 90,
      report_type: "periodic",
      regulatory_basis: "ICH E2A non-serious",
    };
  }
  if (seriousness === "SERIOUS") {
    return {
      deadline_days: 7,
      report_type: "7-day",
      regulatory_basis: "ICH E2A fatal/life-threatening",
    };
  }
  return {
    deadline_days: 15,
    report_type: "15-day",
    regulatory_basis: "ICH E2A serious unexpected",
  };
}

// ─── reporting-priority.yaml ──────────────────────────────────────────────────

export type CausalityCategory =
  | "DEFINITE"
  | "PROBABLE"
  | "POSSIBLE"
  | "DOUBTFUL"
  | string;
export type ReportingPriorityLevel =
  | "P0_IMMEDIATE"
  | "P1_EXPEDITED"
  | "P2_PERIODIC"
  | "P3_ROUTINE";

export interface ReportingPriorityInput {
  is_serious?: boolean;
  is_unexpected?: boolean;
  causality_category?: CausalityCategory;
}

export interface ReportingPriorityResult {
  priority: ReportingPriorityLevel;
  deadline_days: 7 | 90 | 15;
  report_type: "7-day_expedited" | "15-day_expedited" | "PSUR_PBRER";
  rationale: string;
}

/**
 * Master priority calculator combining seriousness + expectedness + causality per ICH E2A.
 * P0 (7-day) through P3 (periodic) priority tiers.
 * Mirrors reporting-priority.yaml.
 */
export function computeReportingPriority(
  input: ReportingPriorityInput,
): ReportingPriorityResult {
  const is_serious = input.is_serious ?? false;
  const is_unexpected = input.is_unexpected ?? false;
  const causality = input.causality_category ?? "";

  if (!is_serious) {
    return {
      priority: "P3_ROUTINE",
      deadline_days: 90,
      report_type: "PSUR_PBRER",
      rationale:
        "Non-serious ADR included in routine periodic safety reporting",
    };
  }
  if (!is_unexpected) {
    return {
      priority: "P2_PERIODIC",
      deadline_days: 90,
      report_type: "PSUR_PBRER",
      rationale:
        "Serious expected ADR included in periodic safety update report",
    };
  }
  if (causality === "DEFINITE" || causality === "PROBABLE") {
    return {
      priority: "P0_IMMEDIATE",
      deadline_days: 7,
      report_type: "7-day_expedited",
      rationale:
        "Serious unexpected ADR with definite or probable causality requires 7-day expedited reporting per ICH E2A",
    };
  }
  return {
    priority: "P1_EXPEDITED",
    deadline_days: 15,
    report_type: "15-day_expedited",
    rationale:
      "Serious unexpected ADR with possible or doubtful causality requires 15-day expedited reporting per ICH E2A",
  };
}

// ─── expedited-reporting.yaml ─────────────────────────────────────────────────

export type StudyType = "premarket" | "postmarket" | string;
export type ExpeditedTimeline =
  | "7_CALENDAR_DAYS"
  | "15_CALENDAR_DAYS"
  | "PERIODIC";
export type ExpeditedReportType =
  | "IND_SAFETY"
  | "FIELD_ALERT"
  | "PSUR_DSUR"
  | "LINE_LISTING";

export interface ExpeditedReportingInput {
  serious?: boolean;
  fatal?: boolean;
  life_threatening?: boolean;
  unexpected?: boolean;
  study_type?: StudyType;
}

export interface ExpeditedReportingResult {
  timeline: ExpeditedTimeline;
  report_type: ExpeditedReportType;
  regulatory_reference: string;
  days_from_awareness: 7 | 15 | 90;
}

/**
 * Determine expedited reporting timeline per ICH E2D / 21 CFR 312.32.
 * Routes by serious → fatal/life-threatening → unexpected → study phase.
 * Mirrors expedited-reporting.yaml.
 */
export function computeExpeditedReporting(
  input: ExpeditedReportingInput,
): ExpeditedReportingResult {
  const serious = input.serious ?? false;
  const fatal = input.fatal ?? false;
  const life_threatening = input.life_threatening ?? false;
  const unexpected = input.unexpected ?? false;
  const study_type = input.study_type ?? "";

  if (!serious) {
    return {
      timeline: "PERIODIC",
      report_type: "LINE_LISTING",
      regulatory_reference: "ICH E2C(R2)",
      days_from_awareness: 90,
    };
  }
  if (fatal || life_threatening) {
    if (study_type === "premarket") {
      return {
        timeline: "7_CALENDAR_DAYS",
        report_type: "IND_SAFETY",
        regulatory_reference: "21 CFR 312.32(c)(2)",
        days_from_awareness: 7,
      };
    }
    return {
      timeline: "15_CALENDAR_DAYS",
      report_type: "FIELD_ALERT",
      regulatory_reference: "21 CFR 314.80",
      days_from_awareness: 15,
    };
  }
  if (unexpected) {
    if (study_type === "premarket") {
      return {
        timeline: "15_CALENDAR_DAYS",
        report_type: "IND_SAFETY",
        regulatory_reference: "21 CFR 312.32(c)(1)",
        days_from_awareness: 15,
      };
    }
    return {
      timeline: "15_CALENDAR_DAYS",
      report_type: "FIELD_ALERT",
      regulatory_reference: "21 CFR 314.80",
      days_from_awareness: 15,
    };
  }
  return {
    timeline: "PERIODIC",
    report_type: "PSUR_DSUR",
    regulatory_reference: "ICH E2C(R2)",
    days_from_awareness: 90,
  };
}
