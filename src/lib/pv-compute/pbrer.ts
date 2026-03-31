/**
 * Client-side PBRER section completeness assessment.
 *
 * Mirrors: pbrer-section-gate.yaml — ICH E2C(R2) section completeness gate
 *
 * Reference: ICH E2C(R2) Periodic Benefit-Risk Evaluation Report
 *
 * T1 primitives: κ(Comparison) + ∃(Existence) + ∂(Boundary)
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type PbrerSectionId =
  | "intro"
  | "safety"
  | "signals"
  | "benefit-risk"
  | "conclusions";
export type PbrerSectionStatus = "complete" | "partial" | "missing";

export interface PbrerSectionInput {
  section_id: PbrerSectionId;
  has_faers_data: boolean;
  signal_count: number;
  has_benefit_risk?: boolean;
  has_guidelines?: boolean;
}

export interface PbrerSectionResult {
  status: PbrerSectionStatus;
  missing_elements: string;
}

/* ------------------------------------------------------------------ */
/*  assessPbrerSection — mirrors pbrer-section-gate.yaml                */
/* ------------------------------------------------------------------ */

/**
 * PBRER section completeness gate.
 *
 * Evaluates whether an ICH E2C(R2) section has sufficient data
 * to be considered complete, partial, or missing.
 */
export function assessPbrerSection(
  input: PbrerSectionInput,
): PbrerSectionResult {
  const { section_id, has_faers_data, has_benefit_risk } = input;

  switch (section_id) {
    case "intro":
      if (has_faers_data) {
        return { status: "complete", missing_elements: "none" };
      }
      return { status: "partial", missing_elements: "FAERS exposure data" };

    case "safety":
      if (has_faers_data) {
        return { status: "complete", missing_elements: "none" };
      }
      return {
        status: "missing",
        missing_elements: "FAERS safety data required",
      };

    case "signals":
      if (has_faers_data) {
        return { status: "complete", missing_elements: "none" };
      }
      return {
        status: "missing",
        missing_elements: "FAERS signal detection data required",
      };

    case "benefit-risk":
      if (!has_faers_data) {
        return {
          status: "missing",
          missing_elements: "FAERS data and benefit-risk assessment",
        };
      }
      if (has_benefit_risk) {
        return { status: "complete", missing_elements: "none" };
      }
      return { status: "partial", missing_elements: "benefit-risk assessment" };

    case "conclusions":
      if (!has_faers_data) {
        return {
          status: "missing",
          missing_elements: "All prerequisite sections incomplete",
        };
      }
      if (has_benefit_risk) {
        return { status: "complete", missing_elements: "none" };
      }
      return {
        status: "partial",
        missing_elements: "benefit-risk assessment for final conclusions",
      };

    default:
      return { status: "missing", missing_elements: "Unknown section" };
  }
}

/* ------------------------------------------------------------------ */
/*  assessAllPbrerSections — batch evaluator                            */
/* ------------------------------------------------------------------ */

export interface PbrerOverallResult {
  sections: Record<PbrerSectionId, PbrerSectionResult>;
  overall_status: PbrerSectionStatus;
  complete_count: number;
  total_sections: number;
}

/**
 * Evaluate all 5 PBRER sections and compute overall completeness.
 */
export function assessAllPbrerSections(
  has_faers_data: boolean,
  signal_count: number,
  has_benefit_risk: boolean,
): PbrerOverallResult {
  const sectionIds: PbrerSectionId[] = [
    "intro",
    "safety",
    "signals",
    "benefit-risk",
    "conclusions",
  ];

  const sections = {} as Record<PbrerSectionId, PbrerSectionResult>;
  let completeCount = 0;

  for (const id of sectionIds) {
    const result = assessPbrerSection({
      section_id: id,
      has_faers_data,
      signal_count,
      has_benefit_risk,
    });
    sections[id] = result;
    if (result.status === "complete") completeCount++;
  }

  let overall: PbrerSectionStatus = "missing";
  if (completeCount === sectionIds.length) {
    overall = "complete";
  } else if (completeCount > 0) {
    overall = "partial";
  }

  return {
    sections,
    overall_status: overall,
    complete_count: completeCount,
    total_sections: sectionIds.length,
  };
}
