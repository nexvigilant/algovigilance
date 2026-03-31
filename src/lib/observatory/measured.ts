/**
 * Measured<T> — TypeScript mirror of Rust Measured<T> for confidence propagation.
 *
 * The computational engine (NexCore) produces results with honest confidence.
 * This module bridges that confidence through the TypeScript layer into the
 * Observatory rendering pipeline, where it becomes visual opacity/dissolution.
 *
 * Two input patterns:
 *   A. MCP tools returning {"value", "confidence"} → direct passthrough
 *   B. MCP tools returning CI/SE → derive confidence via deriveMeasured()
 *
 * Grounding: κ(Comparison) + ∂(Boundary) — comparing certainty against threshold
 */

/** Core measured type mirroring Rust Measured<T> */
export interface Measured<T> {
  value: T
  /** Confidence in [0.0, 1.0]. 1.0 = full confidence, 0.0 = no confidence. */
  confidence: number
}

/** A time-indexed measured value for survival curves and sequential analysis. */
export interface MeasuredPoint {
  time: number
  value: Measured<number>
}

/**
 * Derive Measured<number> from a value with standard error.
 *
 * Maps normalized SE to inverse confidence:
 *   confidence = 1.0 - clamp(SE / |value|, 0, 1)
 *
 * // CALIBRATION: When |value| approaches 0 (e.g., S(t) near end of KM curve),
 * // SE/|value| grows large and confidence approaches 0. This is CORRECT behavior —
 * // a near-zero survival estimate is genuinely uncertain relative to its scale.
 * // The visual result (surface dissolving at late timepoints) is the intended effect.
 * // Do not "fix" this by clamping value or using absolute SE.
 *
 * For values near zero with meaningful absolute uncertainty, use
 * deriveMeasuredAbsolute() instead.
 */
export function deriveMeasured(value: number, se: number): Measured<number> {
  const absVal = Math.abs(value)
  // CALIBRATION: normalized SE as inverse confidence — relative scale
  const confidence = absVal > 0
    ? 1.0 - Math.min(se / absVal, 1.0)
    : 0.5 // When value=0 exactly, SE is meaningless on relative scale
  return { value, confidence: Math.max(0, Math.min(1, confidence)) }
}

/**
 * Derive Measured<number> from absolute SE for values near zero.
 *
 * Uses SE directly as inverse confidence without normalization by value.
 * Appropriate when the value itself may be near zero but the SE has
 * absolute meaning (e.g., difference surfaces where z crosses zero).
 *
 * // CALIBRATION: SE in [0, maxSe] → confidence in [1.0, 0.0]
 */
export function deriveMeasuredAbsolute(
  value: number,
  se: number,
  maxSe: number = 1.0,
): Measured<number> {
  const confidence = 1.0 - Math.min(se / maxSe, 1.0)
  return { value, confidence: Math.max(0, Math.min(1, confidence)) }
}

/**
 * Pass Measured<T> confidence directly to shader.
 *
 * Bypasses CI width [0-20] scale used by confidenceToOpacity/confidenceToDissolve.
 * The uncertainty shader accepts [0,1] natively — no conversion needed.
 *
 * // CALIBRATION: identity mapping, confidence [0,1] → shader confidence [0,1]
 */
export function measuredToShaderConfidence(m: Measured<number>): number {
  return Math.max(0, Math.min(1, m.confidence))
}

/**
 * Build a Float32Array of per-vertex opacities from measured values.
 *
 * Used by SurfacePlot3D vertexOpacities prop to map Measured<T>
 * confidence to per-vertex transparency across the surface mesh.
 *
 * @param measured - Flat array of measured values, one per vertex
 * @param minOpacity - Minimum opacity for zero-confidence vertices (default 0.15)
 */
export function measuredToVertexOpacities(
  measured: Measured<number>[],
  minOpacity: number = 0.15,
): Float32Array {
  const opacities = new Float32Array(measured.length)
  for (let i = 0; i < measured.length; i++) {
    const m = measured[i]
    if (m) {
      // CALIBRATION: linear map confidence [0,1] → opacity [minOpacity, 1.0]
      opacities[i] = minOpacity + m.confidence * (1.0 - minOpacity)
    } else {
      opacities[i] = minOpacity
    }
  }
  return opacities
}
