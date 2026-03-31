/**
 * Client-side expectedness classification algorithms.
 *
 * Mirrors:
 *   expectedness-check.yaml             — ICH E2A 4-category classifier
 *   transform-expectedness-to-bool.yaml — boolean bridge for downstream mcgs
 *
 * Reference: ICH E2A Section II.C
 *
 * T1 primitives: κ(Comparison) + ∂(Boundary) + ν(Frequency)
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type ExpectednessClassification =
  | "EXPECTED_LISTED"
  | "UNEXPECTED_SEVERITY"
  | "EXPECTED_CLASS"
  | "UNEXPECTED_NATURE";

export interface ExpectednessInput {
  /** Event (specific adverse reaction) is listed in product labeling */
  event_in_label?: boolean;
  /** Observed severity matches the severity described in labeling */
  severity_in_label?: boolean;
  /** Event class (drug class effect) is listed in labeling, even if specific event is not */
  event_class_in_label?: boolean;
}

export interface ExpectednessResult {
  expectedness: ExpectednessClassification;
  description: string;
  regulatory_impact: string;
  regulatory_reference: string;
}

export interface ExpectednessBoolResult {
  unexpected: boolean;
  source: string;
}

/* ------------------------------------------------------------------ */
/*  checkExpectedness — mirrors expectedness-check.yaml                */
/* ------------------------------------------------------------------ */

/**
 * ICH E2A expectedness classification.
 *
 * Decision tree (mirrors expectedness-check.yaml):
 *   event_in_label = true  → check severity_in_label
 *     severity_in_label = true  → EXPECTED_LISTED
 *     severity_in_label = false → UNEXPECTED_SEVERITY
 *   event_in_label = false → check event_class_in_label
 *     event_class_in_label = true  → EXPECTED_CLASS
 *     event_class_in_label = false → UNEXPECTED_NATURE
 */
export function checkExpectedness(
  input: ExpectednessInput,
): ExpectednessResult {
  if (input.event_in_label) {
    if (input.severity_in_label) {
      return {
        expectedness: "EXPECTED_LISTED",
        description:
          "Specific adverse event and its observed severity are listed in product labeling",
        regulatory_impact:
          "Periodic reporting only - no expedited submission required",
        regulatory_reference: "ICH E2A Section II.C",
      };
    }
    return {
      expectedness: "UNEXPECTED_SEVERITY",
      description:
        "Adverse event nature is listed but observed severity exceeds labeling",
      regulatory_impact:
        "Expedited reporting required - event unexpected by severity per ICH E2A",
      regulatory_reference: "ICH E2A Section II.C",
    };
  }

  if (input.event_class_in_label) {
    return {
      expectedness: "EXPECTED_CLASS",
      description:
        "Event class is labeled but specific event not listed - borderline expectedness",
      regulatory_impact:
        "Medical review required to confirm expectedness determination",
      regulatory_reference: "ICH E2A Section II.C",
    };
  }

  return {
    expectedness: "UNEXPECTED_NATURE",
    description:
      "Adverse event not listed in product labeling - unexpected by nature",
    regulatory_impact:
      "Expedited reporting required if case is serious per ICH E2A",
    regulatory_reference: "ICH E2A Section II.C",
  };
}

/* ------------------------------------------------------------------ */
/*  isExpectedEvent — mirrors transform-expectedness-to-bool.yaml      */
/* ------------------------------------------------------------------ */

/**
 * Boolean bridge: is the adverse event expected?
 *
 * Returns false for UNEXPECTED_NATURE and UNEXPECTED_SEVERITY.
 * Returns true for EXPECTED_LISTED and EXPECTED_CLASS.
 *
 * Mirrors transform-expectedness-to-bool.yaml.
 */
export function isExpectedEvent(
  input: ExpectednessInput,
): ExpectednessBoolResult {
  const { expectedness } = checkExpectedness(input);
  const unexpected =
    expectedness === "UNEXPECTED_NATURE" ||
    expectedness === "UNEXPECTED_SEVERITY";
  return { unexpected, source: "expectedness-check" };
}
