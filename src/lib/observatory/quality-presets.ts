/**
 * Observatory Quality Presets — Pure μ (stateless transformation).
 *
 * Maps quality level → rendering configuration overrides.
 * Client-side only. No server dependency.
 *
 * Primitive formula: quality-preset = μ(κ, N, ∂)
 *   μ: Mapping (level → config)
 *   κ: Comparison (device capability assessment)
 *   N: Quantity (parameter values)
 *   ∂: Boundary (min/max clamping)
 */

export type QualityLevel = 'low' | 'medium' | 'high' | 'cinematic'

export interface QualityConfig {
  /** Post-processing */
  bloom: boolean
  ssao: boolean
  vignette: boolean
  dof: boolean
  chromaticAberration: boolean
  /** Geometry */
  sphereSegments: number
  tubeSegments: number
  /** Stars */
  starCount: number
  sparkles: boolean
  /** Material */
  usePBR: boolean
  useGlowShader: boolean
  useEnergyEdges: boolean
  /** Edge threshold for energy edges (above this → Line fallback) */
  energyEdgeThreshold: number
  /** SSAO samples */
  ssaoSamples: number
  /** Instancing threshold (above this → instanced mesh) */
  instanceThreshold: number
}

const PRESETS: Record<QualityLevel, QualityConfig> = {
  low: {
    bloom: false,
    ssao: false,
    vignette: false,
    dof: false,
    chromaticAberration: false,
    sphereSegments: 12,
    tubeSegments: 8,
    starCount: 500,
    sparkles: false,
    usePBR: false,
    useGlowShader: false,
    useEnergyEdges: false,
    energyEdgeThreshold: 0,
    ssaoSamples: 8,
    instanceThreshold: 20,
  },
  medium: {
    bloom: true,
    ssao: false,
    vignette: true,
    dof: false,
    chromaticAberration: false,
    sphereSegments: 16,
    tubeSegments: 12,
    starCount: 1500,
    sparkles: false,
    usePBR: true,
    useGlowShader: true,
    useEnergyEdges: true,
    energyEdgeThreshold: 60,
    ssaoSamples: 16,
    instanceThreshold: 40,
  },
  high: {
    bloom: true,
    ssao: true,
    vignette: true,
    dof: true,
    chromaticAberration: true,
    sphereSegments: 24,
    tubeSegments: 16,
    starCount: 3000,
    sparkles: true,
    usePBR: true,
    useGlowShader: true,
    useEnergyEdges: true,
    energyEdgeThreshold: 100,
    ssaoSamples: 32,
    instanceThreshold: 50,
  },
  cinematic: {
    bloom: true,
    ssao: true,
    vignette: true,
    dof: true,
    chromaticAberration: true,
    sphereSegments: 32,
    tubeSegments: 16,
    starCount: 5000,
    sparkles: true,
    usePBR: true,
    useGlowShader: true,
    useEnergyEdges: true,
    energyEdgeThreshold: 150,
    ssaoSamples: 48,
    instanceThreshold: 80,
  },
} as const

/**
 * Get rendering config for a quality level.
 * Pure μ — no side effects, no state.
 */
export function getQualityConfig(level: QualityLevel): QualityConfig {
  return PRESETS[level]
}

/**
 * Detect recommended quality level based on device capabilities.
 * Pure μ(κ) — comparison-based classification.
 *
 * Checks: GPU renderer string, device pixel ratio, hardware concurrency, memory.
 * Returns conservative default if detection fails.
 */
export function detectQualityLevel(): QualityLevel {
  if (typeof window === 'undefined') return 'medium'

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return 'low'

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase()
      : ''

    // Integrated GPU detection
    const isIntegrated = /intel|mesa|llvmpipe|swiftshader/.test(renderer)
    const isMobile = /adreno|mali|powervr|apple gpu/.test(renderer)

    const cores = navigator.hardwareConcurrency ?? 4
    const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 4
    const dpr = window.devicePixelRatio ?? 1

    // Score: 0-12
    let score = 0
    if (!isIntegrated && !isMobile) score += 4
    if (cores >= 8) score += 2
    else if (cores >= 4) score += 1
    if (memory >= 8) score += 2
    else if (memory >= 4) score += 1
    if (dpr <= 1.5) score += 2 // Lower DPR = less fill rate pressure
    else if (dpr <= 2) score += 1
    if (/nvidia|geforce|radeon|rtx|gtx/.test(renderer)) score += 2

    if (score >= 9) return 'cinematic'
    if (score >= 6) return 'high'
    if (score >= 3) return 'medium'
    return 'low'
  } catch {
    return 'medium'
  }
}

/** Quality level display labels */
export const QUALITY_LABELS: Record<QualityLevel, string> = {
  low: 'Performance',
  medium: 'Balanced',
  high: 'Quality',
  cinematic: 'Cinematic',
}
