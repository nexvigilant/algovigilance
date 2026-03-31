export interface NeuralCircuitColors {
  navy: string;
  surface: string;
  techBlue: string;
  cyan: string;
  gold: string;
  white: string;
  gray: string;
}

export interface NeuralCircuitConfig {
  // Network generation - Organic Cluster Parameters
  gridSize: number;           // Base spacing between nodes (px)
  gridJitter: number;         // Random offset ±jitter for organic feel
  connectionDistanceMultiplier: number;  // Max connection distance = gridSize × this
  maxConnections: number;     // Max connections per node
  somaChance: number;         // Probability of soma (larger hub) nodes

  // Signal behavior
  signalSpeedMin: number;
  signalSpeedMax: number;
  propagationChance: number;
  propagationDelayMin: number;
  propagationDelayMax: number;
  maxActiveSignals: number;
  spontaneousRate: number;

  // Visual - Cellular Node Styling
  traceWidth: number;
  myelinWidth: number;
  nodeRadiusMin: number;      // Small "particulate" nodes
  nodeRadiusMax: number;
  somaRadiusMin: number;      // Large "hero" nodes
  somaRadiusMax: number;
  glowRadius: number;         // Soft halo around nodes
  nodeGlowIntensity: number;  // 0-1, intensity of node halo
  heroNodeScale: number;      // Scale factor for rare hero nodes (2-4x)

  // Visual - Synaptic Connections
  connectionFadeLength: number;  // How much line fades at ends (0-0.5)
  connectionCurve: number;       // 0 = straight, 1 = max curve
  connectionOpacityMin: number;  // Minimum opacity for distant connections
  connectionOpacityMax: number;  // Maximum opacity for close connections

  // Composition - Vignette Clustering
  vignetteStrength: number;   // 0-1, how much to fade center
  clusterDensity: number;     // 0-1, concentration at edges vs uniform
  centerClearRadius: number;  // Radius of clear area in center (0-0.5 of viewport)

  // Animation - Wave Motion
  waveEnabled: boolean;       // Enable synchronized wave motion
  waveAmplitude: number;      // Wave motion amplitude in pixels
  waveFrequency: number;      // Wave cycles per second
  wavePhaseOffset: number;    // Phase offset based on position
  driftEnabled: boolean;      // Enable gentle drift motion
  driftSpeed: number;         // Speed of drift movement

  // Performance
  enableGrid: boolean;
  gridStep: number;

  // Colors
  colors: NeuralCircuitColors;
}

export interface NeuralCircuitHandle {
  triggerSignal: () => void;
  triggerBurst: (count?: number) => void;
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
}

export interface ExclusionZone {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
}

export interface Node {
  x: number;              // Current x position (may include wave offset)
  y: number;              // Current y position (may include wave offset)
  baseX: number;          // Base grid x position (no animation)
  baseY: number;          // Base grid y position (no animation)
  radius: number;
  potential: number;
  refractory: number;
  connections: number[];
  glow: number;
  isSoma: boolean;
  isHero: boolean;        // Rare large "hero" node for visual hierarchy
  depth: number;          // 0-1, simulated depth for blur/opacity (0 = far, 1 = near)
  gridRow: number;        // Row index for neighbor lookup
  gridCol: number;        // Column index for neighbor lookup
}

export interface Path {
  from: number;
  to: number;
  segments: number;
}

export const DEFAULT_COLORS: NeuralCircuitColors = {
  // AlgoVigilance brand colors - professional, muted palette
  navy: '#010812',       // Deep navy background (nex-deep)
  surface: '#0A1628',    // Subtle surface for grid lines
  techBlue: '#2B6F99',   // Muted tech blue for traces
  cyan: '#52C5C7',       // Soft cyan for signals
  gold: '#F4D078',       // Muted gold for node activation
  white: '#E6F1FF',      // Signal core
  gray: '#8892b0',       // Secondary elements
};

export const DEFAULT_CONFIG: NeuralCircuitConfig = {
  // =========================================================================
  // BIOLOGICAL ENTERPRISE - Organic, cellular, professional
  // =========================================================================
  // Design philosophy: "Bio-luminescent deep-sea" aesthetic
  //   - Soft glowing nodes (cellular, not geometric)
  //   - Branching synaptic connections (not rigid mesh)
  //   - Clustered at edges, clear center (premium negative space)
  // =========================================================================

  gridSize: 120,                      // Moderate spacing for organic clusters
  gridJitter: 35,                     // High jitter for organic randomness
  connectionDistanceMultiplier: 1.8,  // Longer reach for branching paths
  maxConnections: 2,                  // Sparse connections (dendritic, not mesh)
  somaChance: 0.15,                   // 15% larger hub nodes

  // Signal behavior - gentle, pulsing activity
  signalSpeedMin: 0.003,
  signalSpeedMax: 0.008,
  propagationChance: 0.6,             // Moderate propagation
  propagationDelayMin: 120,
  propagationDelayMax: 300,
  maxActiveSignals: 20,               // Subtle activity
  spontaneousRate: 0.008,             // Sparse spontaneous signals

  // Visual - Cellular Node Styling (soft, glowing)
  traceWidth: 1.0,                    // Thin, elegant traces
  myelinWidth: 0,                     // No myelin overlay
  nodeRadiusMin: 2,                   // Small "particulate" nodes
  nodeRadiusMax: 4,
  somaRadiusMin: 6,                   // Medium hub nodes
  somaRadiusMax: 10,
  glowRadius: 25,                     // Soft halo around nodes
  nodeGlowIntensity: 0.6,             // Subtle glow
  heroNodeScale: 3,                   // Hero nodes are 3x larger

  // Visual - Synaptic Connections (fading, organic)
  connectionFadeLength: 0.3,          // Lines fade 30% at each end
  connectionCurve: 0.15,              // Subtle curve for organic feel
  connectionOpacityMin: 0.1,          // Very faint distant connections
  connectionOpacityMax: 0.4,          // Moderate close connections

  // Composition - Vignette Clustering (edges heavy, center clear)
  vignetteStrength: 0.7,              // Strong edge concentration
  clusterDensity: 0.6,                // Moderate clustering
  centerClearRadius: 0.25,            // 25% of viewport center is sparse

  // Animation - Drift Motion (organic floating)
  waveEnabled: true,
  waveAmplitude: 4,                   // Gentle sway
  waveFrequency: 0.08,                // Very slow (12+ second cycle)
  wavePhaseOffset: 0.015,             // Gradual phase shift
  driftEnabled: true,                 // Enable drift
  driftSpeed: 0.3,                    // Slow drift

  // Performance
  enableGrid: false,
  gridStep: 30,

  colors: DEFAULT_COLORS,
};
