'use client';

import { NeuralCircuitBackground } from '@/components/effects';
import type { NeuralCircuitConfig } from '@/components/effects/deprecated/neural-circuit';
import {
  usePrefersReducedMotion,
  useAdaptiveConfig,
} from '@/hooks/use-neural-circuit';

/**
 * Visual density preset - controls how busy the network looks
 */
export type DensityPreset =
  | 'minimal'
  | 'sparse'
  | 'balanced'
  | 'dense'
  | 'dramatic';

/**
 * Activity level - controls signal animation frequency
 */
export type ActivityLevel = 'calm' | 'subtle' | 'active' | 'energetic';

interface NeuralBackgroundWrapperProps {
  /**
   * Visual density preset - how many nodes/connections appear
   * - minimal: Very few nodes, clean look
   * - sparse: Light network, elegant
   * - balanced: Moderate density (default)
   * - dense: More nodes and connections
   * - dramatic: Maximum visual impact
   */
  density?: DensityPreset;

  /**
   * Activity level - how often signals fire
   * - calm: Very infrequent signals
   * - subtle: Occasional signals
   * - active: Regular signal activity (default)
   * - energetic: Frequent, lively signals
   */
  activity?: ActivityLevel;

  /**
   * Trace thickness multiplier (0.5 = half, 2 = double)
   * Default: 1
   */
  thickness?: number;

  /**
   * Node size multiplier (0.5 = half, 2 = double)
   * Default: 1
   */
  nodeScale?: number;

  /**
   * Glow intensity multiplier (0 = no glow, 2 = intense)
   * Default: 1
   */
  glowIntensity?: number;

  /**
   * Show background grid lines
   * Default: true
   */
  showGrid?: boolean;

  /**
   * Padding around exclusion zones in pixels
   * Default: 30
   */
  exclusionPadding?: number;

  /**
   * Legacy intensity prop - maps to density+activity combo
   * @deprecated Use density and activity instead
   */
  intensity?: 'low' | 'medium' | 'high';

  /**
   * Direct configuration override (from admin settings)
   */
  config?: Partial<NeuralCircuitConfig>;

  /**
   * Extend neural network across full page height (not just viewport)
   * Use for long scrolling pages where you want the network everywhere
   * Default: false
   */
  fullPage?: boolean;

  /**
   * Add frosted glass overlay for text readability (0-1)
   * 0 = no overlay, 1 = maximum frost
   * Default: 0
   */
  frostedOverlay?: number;

  /**
   * Overall opacity of the neural circuit (0-1)
   * Use to make the network more subtle
   * Default: 1
   */
  opacity?: number;
}

// Density presets - HEXAGONAL LATTICE optimized
// Grid spacing determines node density: smaller = more nodes
const DENSITY_PRESETS: Record<DensityPreset, Partial<NeuralCircuitConfig>> = {
  minimal: {
    gridSize: 160,                      // ~80 nodes on 1920×1080
    gridJitter: 10,
    maxConnections: 3,
    somaChance: 0.06,
    connectionDistanceMultiplier: 1.3,
  },
  sparse: {
    gridSize: 130,                      // ~120 nodes on 1920×1080
    gridJitter: 12,
    maxConnections: 3,
    somaChance: 0.07,
    connectionDistanceMultiplier: 1.4,
  },
  balanced: {
    gridSize: 100,                      // ~200 nodes on 1920×1080 (default)
    gridJitter: 12,
    maxConnections: 4,
    somaChance: 0.08,
    connectionDistanceMultiplier: 1.4,
  },
  dense: {
    gridSize: 80,                       // ~300 nodes on 1920×1080
    gridJitter: 10,
    maxConnections: 4,
    somaChance: 0.10,
    connectionDistanceMultiplier: 1.5,
  },
  dramatic: {
    gridSize: 65,                       // ~450 nodes on 1920×1080
    gridJitter: 8,
    maxConnections: 5,
    somaChance: 0.12,
    connectionDistanceMultiplier: 1.5,
  },
};

// Activity presets - SPARSE CODING aligned with scientific addendum
// "More activity is NOT better" - fewer but meaningful signal cascades
const ACTIVITY_PRESETS: Record<ActivityLevel, Partial<NeuralCircuitConfig>> = {
  calm: {
    spontaneousRate: 0.006, // Very sparse
    maxActiveSignals: 12,
    propagationChance: 0.75, // High propagation = meaningful cascades
    signalSpeedMin: 0.004,
    signalSpeedMax: 0.012,
  },
  subtle: {
    spontaneousRate: 0.012, // Sparse coding default (scientific spec)
    maxActiveSignals: 20,
    propagationChance: 0.80, // Per scientific spec
    signalSpeedMin: 0.005,
    signalSpeedMax: 0.014,
  },
  active: {
    spontaneousRate: 0.018, // Moderate sparse
    maxActiveSignals: 30,
    propagationChance: 0.75,
    signalSpeedMin: 0.006,
    signalSpeedMax: 0.016,
  },
  energetic: {
    spontaneousRate: 0.025,
    maxActiveSignals: 40,
    propagationChance: 0.70,
    signalSpeedMin: 0.008,
    signalSpeedMax: 0.018,
  },
};

// Legacy intensity mapping
const LEGACY_INTENSITY_MAP: Record<
  'low' | 'medium' | 'high',
  { density: DensityPreset; activity: ActivityLevel }
> = {
  low: { density: 'sparse', activity: 'calm' },
  medium: { density: 'balanced', activity: 'active' },
  high: { density: 'dramatic', activity: 'energetic' },
};

/**
 * Client wrapper for NeuralCircuitBackground
 * Provides easy-to-use presets and fine-grained controls
 *
 * @example
 * // Clean, minimal look
 * <NeuralBackgroundWrapper density="sparse" activity="subtle" />
 *
 * @example
 * // Dramatic, busy look
 * <NeuralBackgroundWrapper density="dense" activity="energetic" />
 *
 * @example
 * // Custom tweaks
 * <NeuralBackgroundWrapper
 *   density="balanced"
 *   activity="subtle"
 *   thickness={0.7}
 *   nodeScale={0.8}
 *   glowIntensity={0.6}
 * />
 */
export function NeuralBackgroundWrapper({
  density,
  activity,
  thickness = 1,
  nodeScale = 1,
  glowIntensity = 1,
  showGrid = true,
  exclusionPadding = 30,
  intensity,
  config,
  fullPage = false,
  frostedOverlay = 0,
  opacity = 1,
}: NeuralBackgroundWrapperProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const adaptiveConfig = useAdaptiveConfig();

  // Handle legacy intensity prop
  let resolvedDensity = density;
  let resolvedActivity = activity;

  if (intensity && !density && !activity) {
    const mapped = LEGACY_INTENSITY_MAP[intensity];
    resolvedDensity = mapped.density;
    resolvedActivity = mapped.activity;
  }

  // Default to balanced/active if not specified
  resolvedDensity = resolvedDensity ?? 'balanced';
  resolvedActivity = resolvedActivity ?? 'active';

  // Get preset configurations
  const densityConfig = DENSITY_PRESETS[resolvedDensity];
  const activityConfig = ACTIVITY_PRESETS[resolvedActivity];

  // Apply multipliers for fine-tuning (base values from reference spec)
  const scaledConfig: Partial<NeuralCircuitConfig> = {
    // Thickness scaling (base: 2 trace, 5 myelin per spec)
    traceWidth: 2 * thickness,
    myelinWidth: 5 * thickness,

    // Node size scaling (base: 3-5 regular, 5-8 soma per spec)
    nodeRadiusMin: 3 * nodeScale,
    nodeRadiusMax: 5 * nodeScale,
    somaRadiusMin: 5 * nodeScale,
    somaRadiusMax: 8 * nodeScale,

    // Glow scaling (base: 18 per spec)
    glowRadius: 18 * glowIntensity,

    // Grid visibility
    enableGrid: showGrid,
  };

  return (
    <NeuralCircuitBackground
      reducedMotion={prefersReducedMotion}
      exclusionPadding={exclusionPadding}
      fullPage={fullPage}
      frostedOverlay={frostedOverlay}
      opacity={opacity}
      config={{
        ...densityConfig,
        ...activityConfig,
        ...scaledConfig,
        ...adaptiveConfig,
        ...config,
      }}
    />
  );
}
