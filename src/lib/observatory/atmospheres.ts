/**
 * Scene Atmospheres — Per-dataset environmental lighting profiles.
 *
 * Each atmosphere defines a complete lighting rig (key/fill/rim/ambient/hemisphere),
 * fog depth, star field, and sparkle configuration. Theme colors compose on top
 * via HSL hue interpolation (30% shift toward theme primary/secondary).
 */

import type { SceneAtmosphere, AtmosphereId } from '@/lib/observatory/types'
import type { ObservatoryTheme } from '@/lib/observatory/themes'

// ─── Atmosphere Definitions ──────────────────────────────────────────────────

export const ATMOSPHERES: Record<AtmosphereId, SceneAtmosphere> = {
  'deep-space': {
    id: 'deep-space',
    label: 'Deep Space',
    keyLight: { color: '#b0c4e0', intensity: 1.5, position: [10, 12, 8] },
    fillLight: { color: '#D4AF37', intensity: 0.6, position: [-8, -3, -10] },
    rimLight: { color: '#3355aa', intensity: 0.8, position: [0, -8, -14] },
    ambient: { intensity: 0.15 },
    hemisphere: { sky: '#1a2a4a', ground: '#0a0a0a', intensity: 0.25 },
    fog: { near: 20, far: 80 },
    stars: { enabled: true, count: 3000, saturation: 0.3, speed: 0.5 },
    sparkles: { enabled: true, count: 200, color: '#7B95B5', opacity: 0.3 },
    environment: 'night',
    background: '#0a0e1a',
  },
  clinical: {
    id: 'clinical',
    label: 'Clinical',
    keyLight: { color: '#e8e8f0', intensity: 2.0, position: [10, 14, 10] },
    fillLight: { color: '#06b6d4', intensity: 0.8, position: [-8, -2, -8] },
    rimLight: { color: '#8899aa', intensity: 0.4, position: [0, -6, -12] },
    ambient: { intensity: 0.3 },
    hemisphere: { sky: '#1a2a3a', ground: '#0a0a12', intensity: 0.35 },
    fog: { near: 40, far: 120 },
    stars: { enabled: false, count: 0, saturation: 0, speed: 0 },
    sparkles: { enabled: false, count: 0, color: '#ffffff', opacity: 0 },
    environment: 'studio',
    background: '#0a1218',
  },
  'war-room': {
    id: 'war-room',
    label: 'War Room',
    keyLight: { color: '#ffaa44', intensity: 1.8, position: [8, 10, 6] },
    fillLight: { color: '#DC2626', intensity: 0.5, position: [-6, -4, -8] },
    rimLight: { color: '#ddddff', intensity: 1.0, position: [0, -8, -14] },
    ambient: { intensity: 0.12 },
    hemisphere: { sky: '#2a1a0a', ground: '#0a0808', intensity: 0.2 },
    fog: { near: 25, far: 70 },
    stars: { enabled: true, count: 500, saturation: 0.1, speed: 0.2 },
    sparkles: { enabled: false, count: 0, color: '#ffffff', opacity: 0 },
    environment: 'sunset',
    background: '#120a08',
  },
  blueprint: {
    id: 'blueprint',
    label: 'Blueprint',
    keyLight: { color: '#d0d8e8', intensity: 1.6, position: [10, 12, 10] },
    fillLight: { color: '#06b6d4', intensity: 0.4, position: [-8, -2, -10] },
    rimLight: { color: '#000000', intensity: 0, position: [0, 0, 0] },
    ambient: { intensity: 0.25 },
    hemisphere: { sky: '#1a2030', ground: '#0a0a10', intensity: 0.3 },
    fog: { near: 999, far: 1000 },
    stars: { enabled: true, count: 200, saturation: 0, speed: 0.1 },
    sparkles: { enabled: false, count: 0, color: '#ffffff', opacity: 0 },
    environment: 'city',
    background: '#0a0e14',
  },
}

// ─── HSL Utilities ───────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) return [0, 0, l]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return [h * 360, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function lerpHue(colorHex: string, targetHex: string, t: number): string {
  const [h1, s1, l1] = hexToHsl(colorHex)
  const [h2] = hexToHsl(targetHex)
  let dh = h2 - h1
  if (dh > 180) dh -= 360
  if (dh < -180) dh += 360
  return hslToHex(h1 + dh * t, s1, l1)
}

// ─── Theme Composition ───────────────────────────────────────────────────────

const THEME_SHIFT = 0.3

/**
 * Blend atmosphere light colors toward theme palette via HSL hue interpolation.
 *
 * Key light shifts 30% toward theme.primary.
 * Fill light shifts 30% toward theme.secondary.
 * Rim light shifts 15% toward theme.primary.
 * Background uses theme.background directly.
 */
export function applyThemeShift(
  atmosphere: SceneAtmosphere,
  theme: ObservatoryTheme,
): SceneAtmosphere {
  const tp = theme.colors.primary
  const ts = theme.colors.secondary

  return {
    ...atmosphere,
    keyLight: {
      ...atmosphere.keyLight,
      color: lerpHue(atmosphere.keyLight.color, tp, THEME_SHIFT),
    },
    fillLight: {
      ...atmosphere.fillLight,
      color: lerpHue(atmosphere.fillLight.color, ts, THEME_SHIFT),
    },
    rimLight: atmosphere.rimLight.intensity > 0
      ? {
          ...atmosphere.rimLight,
          color: lerpHue(atmosphere.rimLight.color, tp, THEME_SHIFT * 0.5),
        }
      : atmosphere.rimLight,
    hemisphere: {
      ...atmosphere.hemisphere,
      sky: lerpHue(atmosphere.hemisphere.sky, tp, THEME_SHIFT * 0.3),
    },
    background: theme.colors.background,
  }
}
