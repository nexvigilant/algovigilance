/**
 * Observatory Constants — Single source of truth for all 3D visualization config.
 *
 * Colors mapped to Tailwind design tokens from tailwind.config.ts.
 * Physics, material, and animation parameters centralized from 9 component files.
 */

// ─── Colors (mapped to Tailwind design tokens) ───────────────────────────────

export const COLORS = {
  // Brand primary (steel blue — migrated from old cyan #00AEEF)
  cyan:         '#7B95B5',  // cyan.DEFAULT
  cyanGlow:     '#94ABC5',  // cyan.glow
  cyanSoft:     '#A8BAD0',  // cyan.soft (hsl 215 30% 70% approx)
  cyanMuted:    '#5F7A96',  // cyan.muted (hsl 215 20% 45% approx)

  // Gold family
  gold:         '#D4AF37',  // gold.DEFAULT
  goldBright:   '#F4D03F',  // gold.bright

  // Semantic
  ember:        '#DC2626',  // ember.DEFAULT — danger/alert
  success:      '#22c55e',  // green — success/complete
  warning:      '#f97316',  // orange — detected/warning
  violet:       '#a855f7',  // purple — assessed/phase
  teal:         '#06b6d4',  // teal — social/info
  yellow:       '#eab308',  // yellow — caution
  neutral:      '#64748b',  // slate — noise/inactive
  emerald:      '#10b981',  // emerald — complete/resolved

  // Text
  textPrimary:  '#E6F1FF',  // slate.light
  textSecondary:'#a8b2d1',  // slate.dim

  // Background / surfaces
  deep:         '#0a0e1a',  // Scene canvas background
  navy:         '#0a1628',  // Gradient start (surface-plot navy)
  grid:         '#1a2744',  // Grid lines, orbital paths
  wireframe:    '#E6F1FF',  // Wireframe overlay (= textPrimary)
} as const

// ─── Layer Group Colors ──────────────────────────────────────────────────────

/**
 * Default group → color mapping for Observatory graph nodes.
 *
 * This is the **fallback** palette only. The authoritative source is
 * `ObservatoryTheme.groupColors` from `@/lib/observatory/themes`. Consumers
 * should accept a `groupColors` prop and resolve via:
 *   `const resolved = groupColors ?? GROUP_COLORS`
 *
 * Do not reference this constant directly in rendering code — always use
 * the resolved value so themes can override it.
 */
export const GROUP_COLORS: Record<string, string> = {
  foundation:    COLORS.cyan,
  domain:        COLORS.gold,
  orchestration: COLORS.cyanGlow,
  service:       COLORS.goldBright,
  default:       COLORS.cyan,
}

// ─── ToV Harm Type Colors (A–H) ─────────────────────────────────────────────

export const TOV_HARM_COLORS = {
  A: COLORS.ember,    // Physical harm
  B: COLORS.warning,  // Delayed treatment
  C: COLORS.yellow,   // Unnecessary treatment
  D: COLORS.violet,   // Psychological
  E: COLORS.gold,     // Economic
  F: COLORS.teal,     // Social
  G: COLORS.cyan,     // Healthcare system
  H: COLORS.success,  // Public health
} as const

// ─── Material Defaults ───────────────────────────────────────────────────────

export const MATERIAL = {
  roughness:        0.35,
  metalness:        0.2,
  roughnessSmooth:  0.15,  // For state planets
  metalnessHigh:    0.4,   // For state planets
  // HDR emissive values — exceed bloomThreshold for selective glow
  emissiveActive:   1.8,
  emissiveHover:    2.0,
  emissiveIdle:     1.2,
  emissiveDim:      0.4,
  surfaceRoughness: 0.3,   // Surface plot (slightly smoother for sheen)
  surfaceMetalness: 0.3,   // Surface plot (more reflective)
  wireframeOpacity: 0.15,  // Wireframe overlay
  // MeshPhysicalMaterial — clearcoat + transmission for crystal look
  clearcoat:            0.5,
  clearcoatRoughness:   0.1,
  transmission:         0.15,
  thickness:            0.4,
  ior:                  1.45,
  envMapIntensity:      1.5,
} as const

// ─── Glow Effects ────────────────────────────────────────────────────────────

export const GLOW = {
  nodeSphereScale:  1.6,
  haloScaleHover:   2.2,
  haloScaleDefault: 1.8,
  opacityHover:     0.25,
  opacityDefault:   0.12,
  opacityActive:    0.20,
  opacityDim:       0.06,
  // Shader params (glow-material.tsx)
  defaultIntensity: 2.5,
  rimPower:         2.5,
  pulseSpeed:       1.5,
  pulseAmplitude:   0.15,
  alphaMultiplier:  0.9,
} as const

// ─── Physics (Force-Directed Layout) ─────────────────────────────────────────

export const PHYSICS = {
  iterations:         10,
  minDistance:         0.1,
  repulsionStrength:  2.0,
  forceApplyFactor:   0.1,
  targetEdgeLength:   2,
  springConstant:     0.05,
  baseSphereRadius:   3,
  valueSizeMultiplier:0.5,
} as const

// ─── Animation ───────────────────────────────────────────────────────────────

export const ANIMATION = {
  idleOscFreq:          2,
  idleOscAmp:           0.05,
  randomPhaseMultiplier:10,
  hoverScale:           1.3,
  autoRotateSpeed:      0.5,
  dampingFactor:        0.05,
  orbitRotationSpeed:   0.3,
  orbitTiltSpeed:       0.2,
  orbitTiltAngle:       0.1,
  activeStatePulseFreq: 3,
  activeStatePulseAmp:  0.1,
  ringRotationSpeed:    0.5,
  ringTiltAngle:        Math.PI / 3,
  nucleusRotationSpeed: 0.2,
  nucleusTiltSpeed:     0.1,
  nucleusTiltAngle:     0.1,
  // Hub page motion
  transitionDuration:   0.5,
  initialOffsetY:       20,
  cardInitialOffsetY:   30,
  staggerDelay:         0.1,
  dimFrameworkDelay:    0.5,
} as const

// ─── Labels / Text ───────────────────────────────────────────────────────────

export const LABEL = {
  fontSize:       0.3,
  titleFontSize:  0.4,
  stateFontSize:  0.25,    // State planet label
  transitionFont: 0.18,
  nucleusFont:    0.2,
  offsetY:        0.5,
  activeOffsetY:  0.4,
  outlineWidth:   0.02,
  outlineColor:   COLORS.deep,
} as const

// ─── Arcs / Edges ────────────────────────────────────────────────────────────

export const ARC = {
  liftFactor:      0.3,
  opacityMultiplier: 0.6,
  minLineWidth:    0.5,
  weightMultiplier: 2,
} as const

// ─── Geometry ────────────────────────────────────────────────────────────────

export const GEOMETRY = {
  sphereDetail:       [24, 24] as const,
  sphereDetailHigh:   [32, 32] as const,
  sphereDetailLow:    [16, 16] as const,
  nodeSizeDefault:    0.3,
  edgeOpacityDefault: 0.4,
  nucleusRadius:      0.3,
  nucleusDetail:      1,
  nucleusHaloScale:   0.5,
  nucleusHaloOpacity: 0.05,
  orbitalPathRadius:  0.01,
  orbitalPathDetail:  [8, 64] as const,
  orbitalPathOpacity: 0.3,
  ringThickness:      0.03,
  ringDetail:         [8, 48] as const,
  ringOpacity:        0.6,
  ringScale:          1.8,
  gridDensity:        10,
  gridFloorOffset:    0.01,
  zClampMax:          10,
  zClampMin:          -10,
} as const

// ─── Lighting ────────────────────────────────────────────────────────────────

export const LIGHTING = {
  ambientIntensity:    0.15,
  // Key light — cinematic warm, shadows
  keyLightPosition:    [10, 12, 8] as const,
  keyLightIntensity:   1.5,
  keyLightColor:       '#b0c4e0',  // Cool blue-white (5500K approx)
  // Fill light — warm gold for contrast
  fillLightPosition:   [-8, -3, -10] as const,
  fillLightIntensity:  0.6,
  fillLightColor:      COLORS.gold,
  // Rim light — cool back-light for edge separation
  rimLightPosition:    [0, -8, -14] as const,
  rimLightIntensity:   0.8,
  rimLightColor:       '#3355aa',
  // Hemisphere light — sky/ground gradient
  hemiSkyColor:        '#1a2a4a',
  hemiGroundColor:     '#0a0a0a',
  hemiIntensity:       0.25,
  // Fog — depth cueing (wider range for less aggressive falloff)
  fogColor:            COLORS.deep,
  fogNear:             20,
  fogFar:              80,
} as const

// ─── Stars ───────────────────────────────────────────────────────────────────

export const STARS = {
  radius:     100,
  depth:      60,
  count:      3000,
  factor:     5,
  saturation: 0.3,   // Subtle color variation (was 0 — pure white)
  speed:      0.5,   // Slower drift for subtlety
} as const

// ─── Camera ──────────────────────────────────────────────────────────────────

export const CAMERA = {
  fov: 60,
  defaultPosition: [5, 5, 5] as const,
  graphPosition:   [8, 6, 8] as const,
  mathPosition:    [6, 5, 6] as const,
  statePosition:   [6, 4, 6] as const,
} as const

// ─── Layout ──────────────────────────────────────────────────────────────────

export const LAYOUT = {
  sceneHeight: 600,
  /** CSS-compatible responsive height using clamp for mobile */
  sceneHeightCSS: 'clamp(400px, 60vw, 600px)',
} as const

// ─── Strings ─────────────────────────────────────────────────────────────────

export const STRINGS = {
  brandSubtitle: 'AlgoVigilance Observatory',
} as const

// ─── Perception ──────────────────────────────────────────────────────────────

export const PERCEPTION = {
  stevensExponent: 1 / 0.7,  // Stevens' Power Law inverse for area (~1.4286)
  oklabCyanAnchor: '#52C5C7',
  oklabNavyAnchor: '#101C34',
  oklabGoldAnchor: '#F4D078',
  ciOpacityMin: 0.2,
  ciOpacityMax: 1.0,
  ciWidthMax: 20,
} as const

// ─── Post-Processing ─────────────────────────────────────────────────────────

export const POST_PROCESSING = {
  // Bloom: threshold > emissiveIdle means only hovered/active nodes bloom
  bloomIntensity: 0.5,
  bloomThreshold: 0.8,
  bloomSmoothing: 0.4,
  // SSAO: contact shadows for depth grouping
  ssaoSamples: 32,
  ssaoRadius: 1.5,
  ssaoIntensity: 1.0,
  ssaoColor: '#0a1628',     // Foundation Navy
  // Depth of Field: subtle background softening
  dofFocusDistance: 8,
  dofFocalLength: 0.02,
  dofBokehScale: 2.5,
  // Vignette: foveal attention focusing
  vignetteOffset: 0.4,
  vignetteDarkness: 0.6,
  // Chromatic Aberration: subtle lens physicality
  chromaticAberrationOffset: 0.0005,
  // Tone mapping exposure
  toneMappingExposure: 1.1,
} as const

// ─── Semantic Zoom ───────────────────────────────────────────────────────────

export const SEMANTIC_ZOOM = {
  level1: 200,   // >200: Cluster clouds with aggregate labels
  level2: 80,    // >80: Individual nodes with drug names
  level3: 20,    // >20: Detailed nodes with labels, halos, sparklines
  // <20: Level 4 — Single-node focus with full data card
} as const

// ─── LOD ─────────────────────────────────────────────────────────────────────

export const LOD = {
  farSegments: 0,        // Point sprite (no geometry)
  mediumSegments: 8,     // Low-poly sphere
  closeSegments: 32,     // Full sphere
} as const

// ─── State Machine Sizes ─────────────────────────────────────────────────────

export const STATE_SIZE = {
  sm:  0.35,
  md:  0.4,
  mdl: 0.45,
  lg:  0.5,
  xl:  0.55,
} as const

// ─── Explorer Color Legends ───────────────────────────────────────────────────

export const CAREER_GROUP_COLORS: { label: string; color: string }[] = [
  { label: 'Leadership / Executive', color: '#eab308' },
  { label: 'Technical / Systems', color: '#06b6d4' },
  { label: 'Operational / Clinical', color: '#7B95B5' },
]

export const LEARNING_STATUS_COLORS: { label: string; color: string }[] = [
  { label: 'Completed', color: '#10b981' },
  { label: 'Unlocked', color: '#06b6d4' },
  { label: 'Locked', color: '#475569' },
]
