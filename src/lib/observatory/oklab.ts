/**
 * OKLab Perceptual Color Engine — Perceptually uniform color space for data visualization.
 *
 * Section 2.3.1 of the Observatory 3D Rendering Architecture.
 *
 * OKLab guarantees that equal numerical distances produce equal perceived
 * differences, unlike sRGB or HSL. This matters for scientific visualization
 * where color encodes quantitative data.
 */

import * as THREE from 'three'

// ─── OKLab → Linear sRGB ────────────────────────────────────────────────────

/** Convert OKLab (L, a, b) to linear sRGB (r, g, b). */
export function oklabToLinearSRGB(L: number, a: number, b: number): [number, number, number] {
  // OKLab → LMS (approximate inverse)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  // LMS → linear sRGB
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bOut = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

  return [
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, bOut)),
  ]
}

// ─── sRGB gamma ──────────────────────────────────────────────────────────────

/** Apply sRGB gamma correction to a linear channel value. */
export function linearSRGBToSRGB(c: number): number {
  if (c <= 0.0031308) return 12.92 * c
  return 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055
}

// ─── sRGB to OKLab ───────────────────────────────────────────────────────────

/** Convert sRGB hex to OKLab (L, a, b). */
function srgbHexToOklab(hex: string): [number, number, number] {
  const c = new THREE.Color(hex)
  // sRGB → linear
  const lr = c.r <= 0.04045 ? c.r / 12.92 : Math.pow((c.r + 0.055) / 1.055, 2.4)
  const lg = c.g <= 0.04045 ? c.g / 12.92 : Math.pow((c.g + 0.055) / 1.055, 2.4)
  const lb = c.b <= 0.04045 ? c.b / 12.92 : Math.pow((c.b + 0.055) / 1.055, 2.4)

  // linear sRGB → LMS
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ]
}

// ─── Signal Color Scale ──────────────────────────────────────────────────────

// Pre-compute OKLab anchors for the diverging scale
const CYAN_OKLAB = srgbHexToOklab('#52C5C7')
const NAVY_OKLAB = srgbHexToOklab('#101C34')
const GOLD_OKLAB = srgbHexToOklab('#F4D078')

// Work color to avoid allocations in hot path
const _workColor = new THREE.Color()

/** Interpolate in OKLab space. */
function oklabLerp(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

/**
 * Diverging color scale in OKLab space.
 *
 * Cyan (#52C5C7) → Navy (#101C34) → Gold (#F4D078)
 *
 * Returns a THREE.Color for direct use in materials.
 */
export function signalColorScale(value: number, min: number, max: number): THREE.Color {
  const t = max === min ? 0.5 : (value - min) / (max - min)
  const clamped = Math.max(0, Math.min(1, t))

  let oklab: [number, number, number]
  if (clamped < 0.5) {
    // Cyan → Navy
    oklab = oklabLerp(CYAN_OKLAB, NAVY_OKLAB, clamped * 2)
  } else {
    // Navy → Gold
    oklab = oklabLerp(NAVY_OKLAB, GOLD_OKLAB, (clamped - 0.5) * 2)
  }

  const [r, g, b] = oklabToLinearSRGB(oklab[0], oklab[1], oklab[2])

  // THREE.Color works in linear sRGB when passed to materials,
  // so we set linear values directly.
  _workColor.setRGB(r, g, b)
  return _workColor.clone()
}

/**
 * OKLab gradient for surface plots — replaces linear RGB lerp.
 *
 * Navy → Cyan → Gold, perceptually uniform.
 */
export function surfaceColorScale(value: number, min: number, max: number): THREE.Color {
  const t = max === min ? 0.5 : (value - min) / (max - min)
  const clamped = Math.max(0, Math.min(1, t))

  let oklab: [number, number, number]
  if (clamped < 0.5) {
    oklab = oklabLerp(NAVY_OKLAB, CYAN_OKLAB, clamped * 2)
  } else {
    oklab = oklabLerp(CYAN_OKLAB, GOLD_OKLAB, (clamped - 0.5) * 2)
  }

  const [r, g, b] = oklabToLinearSRGB(oklab[0], oklab[1], oklab[2])
  _workColor.setRGB(r, g, b)
  return _workColor.clone()
}
