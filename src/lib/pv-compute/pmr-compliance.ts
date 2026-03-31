/**
 * Client-side PMR/PMC compliance status classification.
 *
 * Mirrors: pmr-delay-classifier.yaml — status/overdue to classification mapper
 *
 * Reference: FDA PMR/PMC tracking requirements (21 CFR 314.81(b)(2))
 *
 * T1 primitives: κ(Comparison) + ∂(Boundary) + Σ(Sequencing)
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type PmrStatus =
  | "Fulfilled"
  | "Released"
  | "Terminated"
  | "Delayed"
  | "Pending"
  | "Ongoing";
export type PmrClassification = "on_track" | "at_risk" | "delayed" | "critical";

export interface PmrDelayInput {
  status: PmrStatus;
  has_due_date: boolean;
  days_overdue?: number;
  delay_rate?: number;
}

export interface PmrDelayResult {
  classification: PmrClassification;
  action: string;
}

/* ------------------------------------------------------------------ */
/*  classifyPmrDelay — mirrors pmr-delay-classifier.yaml                */
/* ------------------------------------------------------------------ */

/**
 * PMR/PMC compliance status classifier.
 *
 * Maps status + due date + days overdue to a classification with action.
 *
 * Fulfilled/Released/Terminated → on_track (no action)
 * Delayed 180+ days → critical (escalate)
 * Delayed 90+ days → delayed (progress report)
 * Delayed <90 days → delayed (review timeline)
 * Pending past due → at_risk
 * Ongoing past due → at_risk
 */
export function classifyPmrDelay(input: PmrDelayInput): PmrDelayResult {
  const { status, has_due_date, days_overdue = 0 } = input;

  // Terminal states — no action required
  if (status === "Fulfilled") {
    return {
      classification: "on_track",
      action: "No action required — commitment fulfilled",
    };
  }
  if (status === "Released") {
    return {
      classification: "on_track",
      action: "No action required — requirement released",
    };
  }
  if (status === "Terminated") {
    return {
      classification: "on_track",
      action: "No action required — commitment terminated",
    };
  }

  // Delayed status — severity by days overdue
  if (status === "Delayed") {
    if (days_overdue >= 180) {
      return {
        classification: "critical",
        action: "Immediate escalation — overdue by 180+ days",
      };
    }
    if (days_overdue >= 90) {
      return {
        classification: "delayed",
        action: "Submit progress report to FDA — overdue 90+ days",
      };
    }
    return {
      classification: "delayed",
      action: "Review timeline and submit updated schedule",
    };
  }

  // Pending status
  if (status === "Pending") {
    if (!has_due_date) {
      return {
        classification: "on_track",
        action: "Pending without due date — request timeline from FDA",
      };
    }
    if (days_overdue > 0) {
      return {
        classification: "at_risk",
        action: "Pending commitment past due date — initiate work",
      };
    }
    return {
      classification: "on_track",
      action: "Commitment pending — monitor due date",
    };
  }

  // Ongoing status
  if (status === "Ongoing") {
    if (has_due_date && days_overdue > 0) {
      return {
        classification: "at_risk",
        action: "Ongoing but past due — accelerate completion",
      };
    }
    return {
      classification: "on_track",
      action: "On track — continue per schedule",
    };
  }

  // Fallback for unknown status
  return {
    classification: "on_track",
    action: "Status noted — monitor for changes",
  };
}

/* ------------------------------------------------------------------ */
/*  classifyApplicantRisk — applicant-level aggregation                  */
/* ------------------------------------------------------------------ */

export type ApplicantRiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ApplicantRiskResult {
  risk_level: ApplicantRiskLevel;
  delay_rate: number;
  delayed_count: number;
  total_count: number;
}

/**
 * Classify applicant-level risk based on delay rate.
 *
 * delay_rate > 50% → CRITICAL
 * delay_rate > 25% → HIGH
 * delay_rate > 15% → MEDIUM
 * else → LOW
 */
export function classifyApplicantRisk(
  delayed_count: number,
  total_count: number,
): ApplicantRiskResult {
  const delay_rate = total_count > 0 ? (delayed_count / total_count) * 100 : 0;

  let risk_level: ApplicantRiskLevel = "LOW";
  if (delay_rate > 50) risk_level = "CRITICAL";
  else if (delay_rate > 25) risk_level = "HIGH";
  else if (delay_rate > 15) risk_level = "MEDIUM";

  return { risk_level, delay_rate, delayed_count, total_count };
}
