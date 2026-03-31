/**
 * Visual Encoding Engine — Perception-calibrated encoding functions.
 *
 * Section 2.3.2-2.3.3 of the Observatory 3D Rendering Architecture.
 *
 * Uses Stevens' Power Law, confidence-to-opacity mapping, and trend-based
 * emissive intensity for scientifically accurate data visualization.
 *
 * All perceptual constants sourced from observatory-constants.ts PERCEPTION.
 */

import { PERCEPTION } from '@/components/observatory/observatory-constants'

// ─── Stevens' Power Law ──────────────────────────────────────────────────────

/**
 * Map a data value to perceptual radius using Stevens' Power Law.
 *
 * Human area perception follows a power function with exponent ~0.7.
 * To make perceived area proportional to data value, we invert:
 * radius ∝ value^(1/0.7) ≈ value^1.43
 *
 * This ensures that a node representing 2x the value *looks* 2x as large.
 */
export function perceptualRadius(
  value: number,
  minVal: number,
  maxVal: number,
  minR: number = 0.15,
  maxR: number = 1.0,
): number {
  if (maxVal === minVal) return (minR + maxR) / 2

  const normalised = (value - minVal) / (maxVal - minVal)
  const clamped = Math.max(0, Math.min(1, normalised))
  const perceptual = Math.pow(clamped, PERCEPTION.stevensExponent)

  return minR + perceptual * (maxR - minR)
}

// ─── Confidence → Opacity ────────────────────────────────────────────────────

/**
 * Map confidence interval width to opacity.
 *
 * Narrow CI (high confidence) → fully opaque.
 * Wide CI (low confidence) → semi-transparent.
 *
 * Range: CI width [0, 20] → opacity [1.0, 0.2]
 */
export function confidenceToOpacity(ciWidth: number): number {
  const clamped = Math.max(0, Math.min(PERCEPTION.ciWidthMax, ciWidth))
  const t = clamped / PERCEPTION.ciWidthMax
  return PERCEPTION.ciOpacityMax - t * (PERCEPTION.ciOpacityMax - PERCEPTION.ciOpacityMin)
}

/**
 * Map confidence interval width to dissolution threshold for the
 * uncertainty shader. Higher values = more dissolved (less confident).
 */
export function confidenceToDissolve(ciWidth: number): number {
  const clamped = Math.max(0, Math.min(PERCEPTION.ciWidthMax, ciWidth))
  return clamped / PERCEPTION.ciWidthMax
}

// ─── Trend → Emissive ────────────────────────────────────────────────────────

/**
 * Map temporal trend to emissive intensity.
 *
 * Emerging signals glow brightly to draw pre-attentive attention.
 * Stable signals have moderate glow. Declining signals are dim.
 */
export function trendToEmissive(trend: 'emerging' | 'stable' | 'declining'): number {
  switch (trend) {
    case 'emerging': return 0.8
    case 'stable': return 0.4
    case 'declining': return 0.15
  }
}

// ─── Seriousness → Glow ──────────────────────────────────────────────────────

/**
 * Map seriousness score to bloom threshold contribution.
 *
 * High seriousness → low threshold (blooms easily, glows prominently).
 * Low seriousness → high threshold (requires bright scene to bloom).
 *
 * Range: seriousness [0, 1] → bloom threshold [0.9, 0.3]
 */
export function seriousnessToGlow(seriousness: number): number {
  const clamped = Math.max(0, Math.min(1, seriousness))
  return 0.9 - clamped * 0.6
}
