/**
 * Client-side drug comparison algorithms.
 *
 * Mirrors: drug-comparison.yaml — differential safety profile classifier
 *
 * T1 primitives: κ(Comparison) + ∂(Boundary) + ρ(Ratio)
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type Differential = "A_WORSE" | "B_WORSE" | "SIMILAR";
export type ComparisonConfidence = "high" | "medium" | "low";

export interface DrugComparisonInput {
  signal_count_a: number;
  signal_count_b: number;
  shared_events: number;
  unique_a: number;
  unique_b: number;
  prr_max_a: number;
  prr_max_b: number;
}

export interface DrugComparisonResult {
  differential: Differential;
  confidence: ComparisonConfidence;
  reason: string;
}

/* ------------------------------------------------------------------ */
/*  compareDrugs — mirrors drug-comparison.yaml                        */
/* ------------------------------------------------------------------ */

/**
 * Differential safety profile classifier.
 *
 * Compares two drug profiles by signal count, unique events, and PRR.
 * Returns which drug has worse safety profile or if they are similar.
 */
export function compareDrugs(input: DrugComparisonInput): DrugComparisonResult {
  const {
    signal_count_a,
    signal_count_b,
    shared_events,
    unique_a,
    unique_b,
    prr_max_a,
    prr_max_b,
  } = input;

  // No signals for either drug
  if (signal_count_a === 0 && signal_count_b === 0) {
    return {
      differential: "SIMILAR",
      confidence: "low",
      reason: "No signals detected for either drug",
    };
  }

  // Only drug A has signals
  if (signal_count_a > 0 && signal_count_b === 0) {
    return {
      differential: "A_WORSE",
      confidence: "high",
      reason: "Drug A has signals while Drug B has none",
    };
  }

  // Only drug B has signals
  if (signal_count_b > 0 && signal_count_a === 0) {
    return {
      differential: "B_WORSE",
      confidence: "high",
      reason: "Drug B has signals while Drug A has none",
    };
  }

  // Both have signals — check if A has double the count
  if (signal_count_a >= signal_count_b * 2) {
    return {
      differential: "A_WORSE",
      confidence: "high",
      reason: "Drug A has significantly more signals than Drug B",
    };
  }

  // B has double the count
  if (signal_count_b >= signal_count_a * 2) {
    return {
      differential: "B_WORSE",
      confidence: "high",
      reason: "Drug B has significantly more signals than Drug A",
    };
  }

  // Similar signal counts — compare PRR
  if (prr_max_a > prr_max_b * 1.5) {
    return {
      differential: "A_WORSE",
      confidence: "medium",
      reason: "Drug A has higher maximum PRR despite similar signal counts",
    };
  }

  if (prr_max_b > prr_max_a * 1.5) {
    return {
      differential: "B_WORSE",
      confidence: "medium",
      reason: "Drug B has higher maximum PRR despite similar signal counts",
    };
  }

  // PRR similar — compare unique events
  if (unique_a > unique_b + shared_events) {
    return {
      differential: "A_WORSE",
      confidence: "medium",
      reason: "Drug A has more unique adverse events",
    };
  }

  if (unique_b > unique_a + shared_events) {
    return {
      differential: "B_WORSE",
      confidence: "medium",
      reason: "Drug B has more unique adverse events",
    };
  }

  // No clear difference
  return {
    differential: "SIMILAR",
    confidence: "medium",
    reason: "Similar safety profiles based on available data",
  };
}
