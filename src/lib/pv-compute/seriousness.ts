/**
 * Client-side seriousness classification algorithms.
 *
 * Mirrors:
 *   case-seriousness.yaml         — ICH E2A 6-criterion classifier
 *   seriousness-to-deadline.yaml  — ICH E2B reporting deadline router
 *   transform-seriousness-to-bool.yaml — boolean decomposition bridge
 *
 * Reference: ICH E2A Section II.B, ICH E2B
 *
 * T1 primitives: κ(Comparison) + ∂(Boundary) + Σ(Sequencing)
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface SeriousnessCriteria {
  /** ICH E2A: Results in death */
  death?: boolean;
  /** ICH E2A: Requires or prolongs hospitalization */
  hospitalization?: boolean;
  /** ICH E2A: Persistent or significant disability/incapacity */
  disability?: boolean;
  /** ICH E2A: Life-threatening at time of event */
  life_threatening?: boolean;
  /** ICH E2A: Congenital anomaly/birth defect */
  congenital_anomaly?: boolean;
  /** ICH E2A: Other medically important condition (Section II.A.4) */
  medically_important?: boolean;
}

export type SeriousnessClassification = "SERIOUS" | "NON-SERIOUS";

export type SeriousnessCriterion =
  | "DEATH"
  | "HOSPITALIZATION"
  | "DISABILITY"
  | "LIFE_THREATENING"
  | "CONGENITAL_ANOMALY"
  | "MEDICALLY_IMPORTANT";

export interface SeriousnessResult {
  seriousness: SeriousnessClassification;
  criterion?: SeriousnessCriterion;
  reportable: boolean;
  expedited: boolean;
  regulatory_reference: string;
}

export type DeadlineType =
  | "7_DAY_EXPEDITED"
  | "15_DAY_EXPEDITED"
  | "PERIODIC_PSUR"
  | "PERIODIC_STANDARD";

export interface DeadlineInput {
  is_fatal?: boolean;
  is_life_threatening?: boolean;
  is_serious?: boolean;
  is_unexpected?: boolean;
}

export interface DeadlineResult {
  deadline_days: number;
  deadline_type: DeadlineType;
  regulatory_basis: string;
  report_category: "expedited" | "periodic";
}

export interface SeriousnessBoolResult {
  serious: boolean;
  serious_ae: boolean;
  fatal: boolean;
  life_threatening: boolean;
  source: string;
}

/* ------------------------------------------------------------------ */
/*  classifySeriousness — mirrors case-seriousness.yaml                */
/* ------------------------------------------------------------------ */

/**
 * ICH E2A seriousness classification.
 *
 * Waterfall: death → hospitalization → disability → life_threatening
 *            → congenital_anomaly → medically_important → NON-SERIOUS
 *
 * First criterion matched wins (priority order per ICH E2A Section II.B).
 */
export function classifySeriousness(
  criteria: SeriousnessCriteria,
): SeriousnessResult {
  if (criteria.death) {
    return {
      seriousness: "SERIOUS",
      criterion: "DEATH",
      reportable: true,
      expedited: true,
      regulatory_reference: "ICH E2A Section II.B",
    };
  }
  if (criteria.hospitalization) {
    return {
      seriousness: "SERIOUS",
      criterion: "HOSPITALIZATION",
      reportable: true,
      expedited: true,
      regulatory_reference: "ICH E2A Section II.B",
    };
  }
  if (criteria.disability) {
    return {
      seriousness: "SERIOUS",
      criterion: "DISABILITY",
      reportable: true,
      expedited: true,
      regulatory_reference: "ICH E2A Section II.B",
    };
  }
  if (criteria.life_threatening) {
    return {
      seriousness: "SERIOUS",
      criterion: "LIFE_THREATENING",
      reportable: true,
      expedited: true,
      regulatory_reference: "ICH E2A Section II.B",
    };
  }
  if (criteria.congenital_anomaly) {
    return {
      seriousness: "SERIOUS",
      criterion: "CONGENITAL_ANOMALY",
      reportable: true,
      expedited: true,
      regulatory_reference: "ICH E2A Section II.B",
    };
  }
  if (criteria.medically_important) {
    return {
      seriousness: "SERIOUS",
      criterion: "MEDICALLY_IMPORTANT",
      reportable: true,
      expedited: true,
      regulatory_reference: "ICH E2A Section II.A.4",
    };
  }
  return {
    seriousness: "NON-SERIOUS",
    reportable: false,
    expedited: false,
    regulatory_reference: "ICH E2A Section II.B",
  };
}

/* ------------------------------------------------------------------ */
/*  computeReportingDeadline — mirrors seriousness-to-deadline.yaml    */
/* ------------------------------------------------------------------ */

/**
 * ICH E2B reporting deadline router.
 *
 * Fatal/life-threatening + unexpected → 7-day expedited
 * Fatal/life-threatening + expected   → 90-day PSUR
 * Serious + unexpected                → 15-day expedited
 * Serious + expected                  → 90-day PSUR
 * Non-serious                         → 180-day standard periodic
 */
export function computeReportingDeadline(input: DeadlineInput): DeadlineResult {
  if (input.is_fatal) {
    if (input.is_unexpected) {
      return {
        deadline_type: "7_DAY_EXPEDITED",
        deadline_days: 7,
        report_category: "expedited",
        regulatory_basis:
          "ICH E2B - fatal/life-threatening unexpected reaction requires 7-day expedited report",
      };
    }
    return {
      deadline_type: "PERIODIC_PSUR",
      deadline_days: 90,
      report_category: "periodic",
      regulatory_basis:
        "ICH E2B - fatal but expected reaction included in periodic safety update",
    };
  }

  if (input.is_life_threatening) {
    if (input.is_unexpected) {
      return {
        deadline_type: "7_DAY_EXPEDITED",
        deadline_days: 7,
        report_category: "expedited",
        regulatory_basis:
          "ICH E2B - fatal/life-threatening unexpected reaction requires 7-day expedited report",
      };
    }
    return {
      deadline_type: "PERIODIC_PSUR",
      deadline_days: 90,
      report_category: "periodic",
      regulatory_basis:
        "ICH E2B - life-threatening but expected reaction included in periodic safety update",
    };
  }

  if (input.is_serious) {
    if (input.is_unexpected) {
      return {
        deadline_type: "15_DAY_EXPEDITED",
        deadline_days: 15,
        report_category: "expedited",
        regulatory_basis:
          "ICH E2B - serious unexpected reaction requires 15-day expedited report",
      };
    }
    return {
      deadline_type: "PERIODIC_PSUR",
      deadline_days: 90,
      report_category: "periodic",
      regulatory_basis:
        "ICH E2B - serious expected reaction included in PSUR/PBRER cycle",
    };
  }

  return {
    deadline_type: "PERIODIC_STANDARD",
    deadline_days: 180,
    report_category: "periodic",
    regulatory_basis:
      "ICH E2B - non-serious reaction included in standard periodic reporting",
  };
}

/* ------------------------------------------------------------------ */
/*  isSeriousEvent — mirrors transform-seriousness-to-bool.yaml        */
/* ------------------------------------------------------------------ */

/**
 * Boolean bridge: decomposes seriousness classification into typed flags.
 *
 * Used as input for downstream micrograms (seriousness-to-deadline,
 * susar-classifier, expedited-reporting).
 */
export function isSeriousEvent(
  seriousness: SeriousnessClassification,
  criterion?: SeriousnessCriterion,
): SeriousnessBoolResult {
  if (seriousness !== "SERIOUS") {
    return {
      serious: false,
      serious_ae: false,
      fatal: false,
      life_threatening: false,
      source: "case-seriousness",
    };
  }
  return {
    serious: true,
    serious_ae: true,
    fatal: criterion === "DEATH",
    life_threatening: criterion === "LIFE_THREATENING",
    source: "case-seriousness",
  };
}

/* ------------------------------------------------------------------ */
/*  Case Tracker enum mappers (moved from case-tracker.tsx)             */
/* ------------------------------------------------------------------ */

/** UI-level seriousness state for case tracker pipeline */
export type TrackerSeriousness = "serious" | "non_serious" | "pending";

/** UI-level priority for case tracker pipeline */
export type TrackerPriority = "expedited" | "standard" | "follow_up";

/** Traffic light level for display (compatible with TrafficLight component) */
export type TrackerTrafficLevel = "red" | "yellow" | "green";

/** Badge configuration for priority display */
export interface PriorityBadgeConfig {
  label: string;
  className: string;
}

/**
 * Map case seriousness to traffic light level.
 *
 * serious  → red
 * pending  → yellow
 * non_serious → green
 */
export function getSeriousnessLevel(
  s: TrackerSeriousness,
): TrackerTrafficLevel {
  switch (s) {
    case "serious":
      return "red";
    case "non_serious":
      return "green";
    case "pending":
      return "yellow";
  }
}

/**
 * Map case seriousness to display label.
 */
export function getSeriousnessLabel(s: TrackerSeriousness): string {
  switch (s) {
    case "serious":
      return "Serious";
    case "non_serious":
      return "Non-Serious";
    case "pending":
      return "Pending Classification";
  }
}

/**
 * Map case priority to badge configuration (label + CSS class).
 */
export function getPriorityBadge(p: TrackerPriority): PriorityBadgeConfig {
  switch (p) {
    case "expedited":
      return {
        label: "Expedited",
        className: "border-red-400/30 bg-red-400/10 text-red-300",
      };
    case "standard":
      return {
        label: "Standard",
        className: "border-slate-400/30 bg-slate-400/10 text-slate-300",
      };
    case "follow_up":
      return {
        label: "Follow-up",
        className: "border-cyan/30 bg-cyan/10 text-cyan-300",
      };
  }
}
