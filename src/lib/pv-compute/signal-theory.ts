/**
 * Signal Theory — the three axioms of pharmacovigilance signal detection.
 *
 * Maps nexcore-signal-theory crate axioms to client-side computation:
 *   A1 DataGeneration:  capacity utilization of data sources
 *   A2 NoiseDominance:  signal-to-noise ratio and overwhelming detection
 *   A3 SignalExistence: confidence in signal existence
 *
 * T1 primitives: N(Quantity: utilization, snr, strength)
 *              + κ(Comparison: threshold verdicts)
 *              + ∂(Boundary: axiom pass/fail gates)
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type AxiomVerdict =
  | "Insufficient"
  | "Moderate"
  | "Good"
  | "Low noise"
  | "High"
  | "Overwhelming"
  | "Detected"
  | "Absent";

export interface A1Result {
  utilization: number;
  verdict: AxiomVerdict;
  passes: boolean;
}

export interface A2Result {
  snr: number;
  overwhelming: boolean;
  verdict: AxiomVerdict;
  passes: boolean;
}

export interface A3Result {
  strength: number;
  exists: boolean;
  verdict: AxiomVerdict;
  passes: boolean;
}

export interface CombinedAssessment {
  a1: A1Result;
  a2: A2Result;
  a3: A3Result;
  passCount: number;
  overallLevel: "green" | "yellow" | "red";
  overallLabel: string;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * A1 — Data Generation: how much data do we have relative to capacity?
 *
 * Utilization = reports / capacity.
 * < 0.3 → Insufficient (fails), 0.3–0.7 → Moderate (passes), > 0.7 → Good (passes).
 */
export function computeA1DataGeneration(
  reportsReceived: number,
  capacity: number,
): A1Result {
  const utilization = capacity > 0 ? reportsReceived / capacity : 0;
  let verdict: AxiomVerdict;
  if (utilization < 0.3) verdict = "Insufficient";
  else if (utilization <= 0.7) verdict = "Moderate";
  else verdict = "Good";
  return { utilization, verdict, passes: verdict !== "Insufficient" };
}

/**
 * A2 — Noise Dominance: can we hear the signal above the noise?
 *
 * SNR = (1 - noiseRatio) / noiseRatio.
 * Overwhelming when noiseRatio > 0.8 (fails).
 */
export function computeA2NoiseDominance(noiseRatio: number): A2Result {
  const snr = noiseRatio > 0 ? (1 - noiseRatio) / noiseRatio : Infinity;
  const overwhelming = noiseRatio > 0.8;
  let verdict: AxiomVerdict;
  if (overwhelming) verdict = "Overwhelming";
  else if (noiseRatio > 0.6) verdict = "High";
  else if (noiseRatio > 0.3) verdict = "Moderate";
  else verdict = "Low noise";
  return { snr, overwhelming, verdict, passes: !overwhelming };
}

/**
 * A3 — Signal Existence: is the signal statistically real?
 *
 * Strength = (observed - expected) / √expected.
 * Exists when confidence > 0.5 AND strength > 1.96 (95% CI).
 */
export function computeA3SignalExistence(
  confidence: number,
  observedCount: number,
  expectedCount: number,
): A3Result {
  const strength =
    expectedCount > 0
      ? (observedCount - expectedCount) / Math.sqrt(expectedCount)
      : 0;
  const exists = confidence > 0.5 && strength > 1.96;
  const verdict: AxiomVerdict = exists ? "Detected" : "Absent";
  return { strength, exists, verdict, passes: exists };
}

/**
 * Assess all three axioms and produce a combined verdict.
 *
 * All 3 pass → green ("Signal Confirmed")
 * 1–2 pass → yellow ("Partial Evidence")
 * 0 pass → red ("No Signal")
 */
export function assessAllAxioms(
  a1: A1Result,
  a2: A2Result,
  a3: A3Result,
): CombinedAssessment {
  const passCount = [a1.passes, a2.passes, a3.passes].filter(Boolean).length;
  const overallLevel: "green" | "yellow" | "red" =
    passCount === 3 ? "green" : passCount >= 1 ? "yellow" : "red";
  const overallLabel =
    passCount === 3
      ? "Signal Confirmed"
      : passCount >= 1
        ? "Partial Evidence"
        : "No Signal";
  return { a1, a2, a3, passCount, overallLevel, overallLabel };
}
