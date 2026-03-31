'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

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

  // Scientific accuracy enhancements
  signalFadePerHop: number; // Intensity diminishes with cascade depth
  waveTrailCount: number; // Number of trailing wave segments
  waveTrailSpacing: number; // Progress offset between trail segments
  saltatoryElongation: number; // Visual stretch factor during jumps

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

export interface NeuralCircuitProps {
  config?: Partial<NeuralCircuitConfig>;
  className?: string;
  style?: React.CSSProperties;
  paused?: boolean;
  reducedMotion?: boolean;
  onSignalComplete?: (fromNode: number, toNode: number) => void;
  /** CSS selector for elements to exclude from neural network (default: '[data-neural-exclude]') */
  exclusionSelector?: string;
  /** Padding around exclusion zones in pixels (default: 20) */
  exclusionPadding?: number;
  /** Enable content-aware routing around DOM elements */
  contentAware?: boolean;
  /** Extend neural network across full page height (not just viewport) */
  fullPage?: boolean;
  /** Add frosted glass overlay for text readability (0-1, default: 0) */
  frostedOverlay?: number;
  /** Opacity of the neural circuit (0-1, default: 1) */
  opacity?: number;
}

interface Node {
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

interface Path {
  from: number;
  to: number;
  segments: number;
}

// ============================================================================
// Default Configuration - Aligned with AlgoVigilance Brand Colors
// ============================================================================

const DEFAULT_COLORS: NeuralCircuitColors = {
  // AlgoVigilance brand colors - professional, muted palette
  navy: '#010812',       // Deep navy background (nex-deep)
  surface: '#0A1628',    // Subtle surface for grid lines
  techBlue: '#2B6F99',   // Muted tech blue for traces
  cyan: '#52C5C7',       // Soft cyan for signals
  gold: '#F4D078',       // Muted gold for node activation
  white: '#E6F1FF',      // Signal core
  gray: '#8892b0',       // Secondary elements
};

const DEFAULT_CONFIG: NeuralCircuitConfig = {
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

  // Scientific accuracy enhancements
  signalFadePerHop: 0.15,
  waveTrailCount: 3,
  waveTrailSpacing: 0.08,
  saltatoryElongation: 1.5,

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

// ============================================================================
// Signal Class
// ============================================================================

class Signal {
  fromNode: number;
  toNode: number;
  pathIndex: number;
  progress: number;
  speed: number;
  alive: boolean;
  hopCount: number; // Cascade depth for intensity fading
  isJumping: boolean; // True when at saltatory gap

  constructor(
    fromNode: number,
    toNode: number,
    pathIndex: number,
    config: NeuralCircuitConfig,
    hopCount: number = 0
  ) {
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.pathIndex = pathIndex;
    this.progress = 0;
    this.speed =
      config.signalSpeedMin +
      Math.random() * (config.signalSpeedMax - config.signalSpeedMin);
    this.alive = true;
    this.hopCount = hopCount;
    this.isJumping = false;
  }

  update(paths: Path[]): void {
    this.progress += this.speed;

    const path = paths[this.pathIndex];
    if (path) {
      // Saltatory conduction - speed boost at myelin gaps
      const segmentProgress = (this.progress * path.segments) % 1;
      this.isJumping = segmentProgress < 0.15 || segmentProgress > 0.85;
      if (this.isJumping) {
        this.progress += this.speed * 0.4;
      }
    }

    if (this.progress >= 1) {
      this.alive = false;
    }
  }

  // Calculate intensity based on cascade depth (sparse coding principle)
  getIntensity(fadePerHop: number): number {
    return Math.max(0.25, 1 - this.hopCount * fadePerHop);
  }
}

// ============================================================================
// Component
// ============================================================================

const NeuralCircuitBackground = forwardRef<
  NeuralCircuitHandle,
  NeuralCircuitProps
>(
  (
    {
      config: userConfig,
      className,
      style,
      paused = false,
      reducedMotion = false,
      onSignalComplete,
      exclusionSelector = '[data-neural-exclude]',
      exclusionPadding = 20,
      contentAware = true,
      fullPage = false,
      frostedOverlay = 0,
      opacity = 1,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const nodesRef = useRef<Node[]>([]);
    const pathsRef = useRef<Path[]>([]);
    const signalsRef = useRef<Signal[]>([]);
    const isPausedRef = useRef(paused);
    const exclusionZonesRef = useRef<ExclusionZone[]>([]);
    const documentHeightRef = useRef<number>(0);

    // Memoize config to prevent unnecessary re-renders
    const config = useMemo<NeuralCircuitConfig>(
      () => ({ ...DEFAULT_CONFIG, ...userConfig }),
      [userConfig]
    );

    // ========================================================================
    // Exclusion Zone Detection
    // ========================================================================

    const getExclusionZones = useCallback((): ExclusionZone[] => {
      if (!contentAware) return [];

      const zones: ExclusionZone[] = [];
      const elements = document.querySelectorAll(exclusionSelector);

      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        // Only include visible elements with actual dimensions
        if (rect.width > 0 && rect.height > 0) {
          zones.push({
            x: rect.left,
            y: rect.top + window.scrollY, // Account for scroll
            width: rect.width,
            height: rect.height,
            padding: exclusionPadding,
          });
        }
      });

      return zones;
    }, [contentAware, exclusionSelector, exclusionPadding]);

    const isPointInExclusionZone = useCallback(
      (x: number, y: number, zones: ExclusionZone[]): boolean => {
        for (const zone of zones) {
          const left = zone.x - zone.padding;
          const right = zone.x + zone.width + zone.padding;
          const top = zone.y - zone.padding;
          const bottom = zone.y + zone.height + zone.padding;

          if (x >= left && x <= right && y >= top && y <= bottom) {
            return true;
          }
        }
        return false;
      },
      []
    );

    const doesPathCrossExclusionZone = useCallback(
      (
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        zones: ExclusionZone[]
      ): boolean => {
        // Check multiple points along the path
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = fromX + (toX - fromX) * t;
          const y = fromY + (toY - fromY) * t;
          if (isPointInExclusionZone(x, y, zones)) {
            return true;
          }
        }
        return false;
      },
      [isPointInExclusionZone]
    );

    // ========================================================================
    // Network Initialization - HEXAGONAL LATTICE ALGORITHM
    // ========================================================================
    // Mathematical basis: Hexagonal close-packing provides optimal 2D coverage
    // with uniform density and natural 6-neighbor connectivity.
    //
    // For spacing S:
    //   - Horizontal distance: dx = S
    //   - Vertical distance: dy = S × (√3/2) ≈ S × 0.866
    //   - Alternate rows offset by dx/2 for honeycomb pattern
    // ========================================================================

    const initializeNetwork = useCallback(
      (width: number, height: number, zones: ExclusionZone[]) => {
        const nodes: Node[] = [];
        const paths: Path[] = [];
        const {
          gridSize,
          gridJitter,
          connectionDistanceMultiplier,
          maxConnections,
          somaChance,
          // vignetteStrength is used in vignette overlay CSS
          centerClearRadius,
          heroNodeScale,
        } = config;

        // Store exclusion zones for reference
        exclusionZonesRef.current = zones;

        // Center of viewport for vignette calculations
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDistFromCenter = Math.hypot(centerX, centerY);

        // ====================================================================
        // PHASE 1: Generate Organic Cluster Nodes with Vignette Distribution
        // ====================================================================
        const dx = gridSize;                    // Horizontal spacing
        const dy = gridSize * 0.866;            // Vertical spacing (√3/2)

        // Extend beyond viewport edges to hide boundaries
        const startX = -gridSize / 2;
        const startY = -gridSize / 2;
        const endX = width + gridSize;
        const endY = height + gridSize;

        // Calculate grid dimensions
        const cols = Math.ceil((endX - startX) / dx) + 1;
        const rows = Math.ceil((endY - startY) / dy) + 1;

        // Seeded random for consistent jitter pattern (but still organic)
        const seededRandom = (row: number, col: number, seed: number) => {
          const x = Math.sin(row * 12.9898 + col * 78.233 + seed) * 43758.5453;
          return x - Math.floor(x);
        };

        // Generate nodes with vignette-based density (sparse center, dense edges)
        for (let row = 0; row < rows; row++) {
          // Offset alternate rows for hexagonal arrangement
          const offsetX = (row % 2) * (dx / 2);

          for (let col = 0; col < cols; col++) {
            // Base position on hex grid
            const baseX = startX + col * dx + offsetX;
            const baseY = startY + row * dy;

            // Apply high jitter for organic appearance
            const jitterX = (seededRandom(row, col, 1) - 0.5) * gridJitter * 2;
            const jitterY = (seededRandom(row, col, 2) - 0.5) * gridJitter * 2;

            const x = baseX + jitterX;
            const y = baseY + jitterY;

            // ================================================================
            // VIGNETTE CLUSTERING: Sparse center, dense edges
            // ================================================================
            const distFromCenter = Math.hypot(x - centerX, y - centerY);
            const normalizedDist = distFromCenter / maxDistFromCenter;

            // Clear center zone - very sparse (only 15% of nodes)
            if (normalizedDist < centerClearRadius) {
              if (seededRandom(row, col, 10) > 0.15) continue;
            }
            // Transition zone - moderate density (50% of nodes)
            else if (normalizedDist < centerClearRadius * 2) {
              if (seededRandom(row, col, 11) > 0.5) continue;
            }
            // Edge zone - full density (100%)
            // Nodes placed here form the "framing" around content

            // Skip if in exclusion zone
            if (isPointInExclusionZone(x, y, zones)) {
              continue;
            }

            // Deterministic soma placement (creates visual hierarchy)
            const isSoma = ((row + col) % 5 === 0) && (seededRandom(row, col, 3) < somaChance * 2);

            // Hero nodes: rare large nodes (1 in 50) for visual anchoring
            const isHero = seededRandom(row, col, 6) < 0.02 && normalizedDist > 0.4;

            // Depth simulation: nodes farther from center appear "deeper"
            const depth = 0.3 + normalizedDist * 0.7; // 0.3-1.0 range

            // Calculate radius with hero scaling
            let radius: number;
            if (isHero) {
              radius = config.somaRadiusMax * heroNodeScale;
            } else if (isSoma) {
              radius = config.somaRadiusMin +
                seededRandom(row, col, 4) * (config.somaRadiusMax - config.somaRadiusMin);
            } else {
              radius = config.nodeRadiusMin +
                seededRandom(row, col, 5) * (config.nodeRadiusMax - config.nodeRadiusMin);
            }

            const node: Node = {
              x,
              y,
              baseX: x,      // Store base position for wave animation
              baseY: y,
              radius,
              potential: 0,
              refractory: 0,
              connections: [],
              glow: 0,
              isSoma,
              isHero,
              depth,
              gridRow: row,
              gridCol: col,
            };
            nodes.push(node);
          }
        }

        // ====================================================================
        // PHASE 2: Build Spatial Hash for O(1) Neighbor Lookup
        // ====================================================================
        const cellSize = gridSize * 1.5;
        const spatialHash: Map<string, number[]> = new Map();

        nodes.forEach((node, i) => {
          const cellX = Math.floor(node.baseX / cellSize);
          const cellY = Math.floor(node.baseY / cellSize);
          const key = `${cellX},${cellY}`;
          if (!spatialHash.has(key)) {
            spatialHash.set(key, []);
          }
          spatialHash.get(key)?.push(i);
        });

        // Helper to get candidate neighbors from spatial hash
        const getCandidates = (node: Node, maxDist: number): number[] => {
          const candidates: number[] = [];
          const cellX = Math.floor(node.baseX / cellSize);
          const cellY = Math.floor(node.baseY / cellSize);

          // Check 3×3 neighborhood of cells
          for (let dcx = -1; dcx <= 1; dcx++) {
            for (let dcy = -1; dcy <= 1; dcy++) {
              const key = `${cellX + dcx},${cellY + dcy}`;
              const cellNodes = spatialHash.get(key);
              if (cellNodes) {
                for (const j of cellNodes) {
                  const other = nodes[j];
                  const dist = Math.hypot(node.baseX - other.baseX, node.baseY - other.baseY);
                  if (dist > 0 && dist <= maxDist) {
                    candidates.push(j);
                  }
                }
              }
            }
          }
          return candidates;
        };

        // ====================================================================
        // PHASE 3: Connect Nearest Neighbors (Distance-Based)
        // ====================================================================
        const maxDist = gridSize * connectionDistanceMultiplier;
        const connectedPairs = new Set<string>();

        // Process nodes to create connections
        nodes.forEach((node, i) => {
          if (node.connections.length >= maxConnections) return;

          // Get candidate neighbors from spatial hash
          const candidates = getCandidates(node, maxDist);

          // Sort by distance (closest first)
          candidates.sort((a, b) => {
            const distA = Math.hypot(node.baseX - nodes[a].baseX, node.baseY - nodes[a].baseY);
            const distB = Math.hypot(node.baseX - nodes[b].baseX, node.baseY - nodes[b].baseY);
            return distA - distB;
          });

          // Add connections to nearest neighbors
          for (const j of candidates) {
            if (node.connections.length >= maxConnections) break;
            if (nodes[j].connections.length >= maxConnections) continue;

            // Check if already connected (bidirectional check)
            const pairKey = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (connectedPairs.has(pairKey)) continue;

            // Check exclusion zone crossing
            if (doesPathCrossExclusionZone(node.baseX, node.baseY, nodes[j].baseX, nodes[j].baseY, zones)) {
              continue;
            }

            // Add connection
            node.connections.push(j);
            connectedPairs.add(pairKey);
            paths.push({
              from: i,
              to: j,
              segments: 2, // Simple straight line
            });
          }
        });

        // ====================================================================
        // PHASE 4: Ensure No Orphan Nodes (Minimum Connectivity)
        // ====================================================================
        nodes.forEach((node, i) => {
          if (node.connections.length === 0) {
            // Find closest node to connect to
            let closest = -1;
            let closestDist = Infinity;

            nodes.forEach((other, j) => {
              if (i === j) return;
              const dist = Math.hypot(node.baseX - other.baseX, node.baseY - other.baseY);
              if (dist < closestDist && !doesPathCrossExclusionZone(node.baseX, node.baseY, other.baseX, other.baseY, zones)) {
                closest = j;
                closestDist = dist;
              }
            });

            if (closest !== -1) {
              node.connections.push(closest);
              const pairKey = i < closest ? `${i}-${closest}` : `${closest}-${i}`;
              if (!connectedPairs.has(pairKey)) {
                connectedPairs.add(pairKey);
                paths.push({
                  from: i,
                  to: closest,
                  segments: 2,
                });
              }
            }
          }
        });

        nodesRef.current = nodes;
        pathsRef.current = paths;
      },
      [config, isPointInExclusionZone, doesPathCrossExclusionZone]
    );

    // ========================================================================
    // Signal Management
    // ========================================================================

    const triggerSignalAtPath = useCallback(
      (pathIdx: number) => {
        const paths = pathsRef.current;
        const nodes = nodesRef.current;

        if (pathIdx < 0 || pathIdx >= paths.length) return;

        const path = paths[pathIdx];
        const sourceNode = nodes[path.from];

        if (sourceNode && sourceNode.refractory <= 0) {
          sourceNode.potential = 1;
          sourceNode.glow = 1;
          signalsRef.current.push(
            new Signal(path.from, path.to, pathIdx, config)
          );
        }
      },
      [config]
    );

    const triggerRandomSignal = useCallback(() => {
      const paths = pathsRef.current;
      if (
        paths.length > 0 &&
        signalsRef.current.length < config.maxActiveSignals
      ) {
        const pathIdx = Math.floor(Math.random() * paths.length);
        triggerSignalAtPath(pathIdx);
      }
    }, [config.maxActiveSignals, triggerSignalAtPath]);

    const triggerBurst = useCallback(
      (count: number = 12) => {
        for (let i = 0; i < count; i++) {
          setTimeout(triggerRandomSignal, i * 50);
        }
      },
      [triggerRandomSignal]
    );

    // ========================================================================
    // Imperative Handle
    // ========================================================================

    useImperativeHandle(
      ref,
      () => ({
        triggerSignal: triggerRandomSignal,
        triggerBurst,
        pause: () => {
          isPausedRef.current = true;
        },
        resume: () => {
          isPausedRef.current = false;
        },
        isPaused: () => isPausedRef.current,
      }),
      [triggerRandomSignal, triggerBurst]
    );

    // ========================================================================
    // Animation Loop
    // ========================================================================

    useEffect(() => {
      if (reducedMotion) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let resizeTimeout: ReturnType<typeof setTimeout>;

      // Calculate document height for full-page mode
      const getDocumentHeight = () => {
        return Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
      };

      const resize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const dpr = window.devicePixelRatio || 1;
          const width = window.innerWidth;
          // Use document height for fullPage mode, viewport height otherwise
          const height = fullPage ? getDocumentHeight() : window.innerHeight;
          documentHeightRef.current = height;

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          canvas.style.width = width + 'px';
          canvas.style.height = height + 'px';
          ctx.scale(dpr, dpr);
          // Get exclusion zones from DOM before initializing network
          const zones = getExclusionZones();
          initializeNetwork(width, height, zones);
        }, 100);
      };

      // Track animation time for wave motion
      let animationTime = 0;

      const animate = () => {
        if (isPausedRef.current) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const width = window.innerWidth;
        const height = fullPage ? documentHeightRef.current : window.innerHeight;
        const { colors } = config;

        // Update animation time
        animationTime += 0.016; // ~60fps

        // ================================================================
        // WAVE ANIMATION: Update node positions with synchronized motion
        // ================================================================
        if (config.waveEnabled) {
          const waveTime = animationTime * config.waveFrequency * Math.PI * 2;

          nodesRef.current.forEach((node) => {
            // Calculate wave phase based on position (creates ripple effect)
            const phase = (node.baseX + node.baseY) * config.wavePhaseOffset;

            // Subtle sinusoidal motion
            node.x = node.baseX + Math.sin(waveTime + phase) * config.waveAmplitude;
            node.y = node.baseY + Math.cos(waveTime + phase * 0.7) * config.waveAmplitude * 0.6;
          });
        }

        // ================================================================
        // DRIFT ANIMATION: Independent floating motion per node
        // ================================================================
        // Creates organic, underwater floating effect where each node
        // drifts independently using multiple sine frequencies (Perlin-like)
        if (config.driftEnabled) {
          const driftTime = animationTime * config.driftSpeed;

          nodesRef.current.forEach((node) => {
            // Multiple frequencies create organic, non-repetitive motion
            // Each node uses its base position as a unique phase offset
            const driftX =
              Math.sin(driftTime + node.baseY * 0.008) * 2.0 +
              Math.sin(driftTime * 1.3 + node.baseX * 0.005) * 1.0 +
              Math.sin(driftTime * 0.7 + (node.baseX + node.baseY) * 0.003) * 0.5;

            const driftY =
              Math.cos(driftTime * 0.8 + node.baseX * 0.008) * 1.5 +
              Math.cos(driftTime * 1.1 + node.baseY * 0.006) * 0.8 +
              Math.cos(driftTime * 0.5 + (node.baseX - node.baseY) * 0.004) * 0.4;

            // Add drift to current position (combines with wave if enabled)
            node.x += driftX;
            node.y += driftY;
          });
        }

        // Clear with navy background
        ctx.fillStyle = colors.navy;
        ctx.fillRect(0, 0, width, height);

        // Draw subtle grid texture (optional)
        if (config.enableGrid) {
          ctx.strokeStyle = colors.surface;
          ctx.lineWidth = 0.5;
          for (let x = 0; x < width; x += config.gridStep) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          for (let y = 0; y < height; y += config.gridStep) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
        }

        // ================================================================
        // DRAW PATHS: Synaptic connections with fading ends and curves
        // ================================================================
        pathsRef.current.forEach((path) => {
          const from = nodesRef.current[path.from];
          const to = nodesRef.current[path.to];
          if (!from || !to) return;

          // Calculate connection length and midpoint
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const length = Math.hypot(dx, dy);
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          // Depth-based opacity: fade connections based on average node depth
          const avgDepth = (from.depth + to.depth) / 2;
          const depthOpacity = config.connectionOpacityMin +
            (config.connectionOpacityMax - config.connectionOpacityMin) * avgDepth;

          // Create gradient for fading line ends (synaptic fade)
          const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
          const fadeLength = config.connectionFadeLength;

          // Fade: transparent -> solid -> solid -> transparent
          gradient.addColorStop(0, colors.techBlue + '00');
          gradient.addColorStop(fadeLength, colors.techBlue + Math.floor(depthOpacity * 255).toString(16).padStart(2, '0'));
          gradient.addColorStop(1 - fadeLength, colors.techBlue + Math.floor(depthOpacity * 255).toString(16).padStart(2, '0'));
          gradient.addColorStop(1, colors.techBlue + '00');

          // Draw curved or straight line based on config
          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = config.traceWidth * (0.5 + avgDepth * 0.5);
          ctx.lineCap = 'round';

          if (config.connectionCurve > 0 && length > 50) {
            // Subtle curve for organic feel
            const perpX = -dy / length;
            const perpY = dx / length;
            const curveOffset = length * config.connectionCurve * 0.3;
            // Alternate curve direction based on path index
            const curveDir = (path.from + path.to) % 2 === 0 ? 1 : -1;
            const ctrlX = midX + perpX * curveOffset * curveDir;
            const ctrlY = midY + perpY * curveOffset * curveDir;

            ctx.moveTo(from.x, from.y);
            ctx.quadraticCurveTo(ctrlX, ctrlY, to.x, to.y);
          } else {
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
          }
          ctx.stroke();
        });

        // Update and draw signals
        signalsRef.current.forEach((signal) => {
          signal.update(pathsRef.current);
          if (!signal.alive) {
            // Trigger destination node activation
            const destNode = nodesRef.current[signal.toNode];
            if (destNode && destNode.refractory <= 0) {
              destNode.potential = 1;
              destNode.glow = 1;

              onSignalComplete?.(signal.fromNode, signal.toNode);

              // Propagate signal to next node
              setTimeout(
                () => {
                  if (
                    destNode.connections.length > 0 &&
                    Math.random() < config.propagationChance
                  ) {
                    const nextNode =
                      destNode.connections[
                        Math.floor(Math.random() * destNode.connections.length)
                      ];
                    const pathIdx = pathsRef.current.findIndex(
                      (p) => p.from === signal.toNode && p.to === nextNode
                    );
                    if (
                      pathIdx !== -1 &&
                      signalsRef.current.length < config.maxActiveSignals
                    ) {
                      // Pass incremented hopCount for cascade depth tracking
                      signalsRef.current.push(
                        new Signal(signal.toNode, nextNode, pathIdx, config, signal.hopCount + 1)
                      );
                    }
                  }
                },
                config.propagationDelayMin +
                  Math.random() *
                    (config.propagationDelayMax - config.propagationDelayMin)
              );
            }
            return;
          }

          // Calculate signal position along straight path
          const path = pathsRef.current[signal.pathIndex];
          if (!path) return; // Safety check for invalid path index
          const from = nodesRef.current[path.from];
          const to = nodesRef.current[path.to];
          if (!from || !to) return;

          // Helper to calculate linear position at progress t
          const getLinearPos = (t: number) => ({
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t
          });

          const mainPos = getLinearPos(signal.progress);
          const intensity = signal.getIntensity(config.signalFadePerHop);

          // Draw trailing wave pulses (soliton wave mechanics)
          for (let i = config.waveTrailCount; i >= 1; i--) {
            const trailProgress = Math.max(0, signal.progress - (i * config.waveTrailSpacing));
            if (trailProgress <= 0) continue;

            const trailPos = getLinearPos(trailProgress);
            const trailIntensity = intensity * (1 - i * 0.25);
            const trailRadius = (config.glowRadius - i * 4) * trailIntensity;

            if (trailRadius > 0) {
              const trailAlpha = Math.floor(trailIntensity * 180).toString(16).padStart(2, '0');
              const trailGradient = ctx.createRadialGradient(
                trailPos.x, trailPos.y, 0,
                trailPos.x, trailPos.y, trailRadius
              );
              trailGradient.addColorStop(0, colors.cyan + trailAlpha);
              trailGradient.addColorStop(1, 'transparent');

              ctx.fillStyle = trailGradient;
              ctx.beginPath();
              ctx.arc(trailPos.x, trailPos.y, trailRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Draw main signal with saltatory jump visualization
          const glowRadius = config.glowRadius * intensity;
          const alphaHex = Math.floor(intensity * 255).toString(16).padStart(2, '0');

          if (signal.isJumping && config.saltatoryElongation > 1) {
            // Saltatory jump - elongate and brighten signal
            ctx.save();
            ctx.translate(mainPos.x, mainPos.y);
            ctx.rotate(Math.atan2(to.y - from.y, to.x - from.x));
            ctx.scale(config.saltatoryElongation, 1);

            // Brighter glow during jump (white core visible)
            const jumpGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
            jumpGradient.addColorStop(0, colors.white); // White core during jump
            jumpGradient.addColorStop(0.3, colors.cyan);
            jumpGradient.addColorStop(0.6, colors.cyan + '60');
            jumpGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = jumpGradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          } else {
            // Normal signal rendering
            const gradient = ctx.createRadialGradient(
              mainPos.x, mainPos.y, 0,
              mainPos.x, mainPos.y, glowRadius
            );
            gradient.addColorStop(0, colors.cyan + alphaHex);
            gradient.addColorStop(0.4, colors.cyan + Math.floor(intensity * 96).toString(16).padStart(2, '0'));
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(mainPos.x, mainPos.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw signal core
            ctx.fillStyle = colors.white + alphaHex;
            ctx.beginPath();
            ctx.arc(mainPos.x, mainPos.y, 2.5 * intensity, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Remove dead signals
        signalsRef.current = signalsRef.current.filter((s) => s.alive);

        // ================================================================
        // DRAW NODES: Cellular styling with radial gradient glow
        // ================================================================
        nodesRef.current.forEach((node) => {
          // Update node state
          if (node.potential > 0) {
            node.potential -= 0.025;
            node.refractory = 25;
          }
          if (node.refractory > 0) node.refractory -= 1;
          if (node.glow > 0) node.glow -= 0.035;

          // Calculate opacity based on depth (depth-of-field effect)
          const baseOpacity = 0.4 + node.depth * 0.6; // 0.4-1.0 range
          const glowIntensity = config.nodeGlowIntensity * baseOpacity;

          // ============================================================
          // CELLULAR GLOW HALO: Soft outer glow (always visible)
          // ============================================================
          const haloRadius = node.radius * (node.isHero ? 4 : 3);
          const haloGradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, haloRadius
          );

          // Nucleus-like gradient: bright center fading to transparent
          const haloAlpha = Math.floor(glowIntensity * 60).toString(16).padStart(2, '0');
          haloGradient.addColorStop(0, colors.techBlue + haloAlpha);
          haloGradient.addColorStop(0.5, colors.techBlue + Math.floor(glowIntensity * 30).toString(16).padStart(2, '0'));
          haloGradient.addColorStop(1, 'transparent');

          ctx.fillStyle = haloGradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
          ctx.fill();

          // ============================================================
          // ACTIVATION GLOW: Brighter when signal passes through
          // ============================================================
          if (node.glow > 0) {
            const glowVal = Math.floor(node.glow * 255).toString(16).padStart(2, '0');
            const activationRadius = node.radius * 8;
            const activationGradient = ctx.createRadialGradient(
              node.x, node.y, 0,
              node.x, node.y, activationRadius
            );
            activationGradient.addColorStop(0, colors.gold + glowVal);
            activationGradient.addColorStop(0.3, colors.cyan + Math.floor(node.glow * 150).toString(16).padStart(2, '0'));
            activationGradient.addColorStop(0.6, colors.cyan + Math.floor(node.glow * 50).toString(16).padStart(2, '0'));
            activationGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = activationGradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, activationRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Determine node color based on potential
          const nodeColor =
            node.potential > 0.5
              ? colors.gold
              : node.potential > 0
                ? colors.cyan
                : colors.techBlue;

          // ============================================================
          // NODE CORE: Soft cellular body with gradient fill
          // ============================================================
          const coreGradient = ctx.createRadialGradient(
            node.x - node.radius * 0.3, node.y - node.radius * 0.3, 0,
            node.x, node.y, node.radius * 1.2
          );

          // Cellular gradient: lighter center (nucleus effect)
          if (node.isHero) {
            // Hero nodes: more prominent with gold tint
            coreGradient.addColorStop(0, colors.gold + '40');
            coreGradient.addColorStop(0.5, nodeColor + '60');
            coreGradient.addColorStop(1, colors.navy);
          } else if (node.isSoma) {
            // Soma nodes: larger, slightly brighter
            coreGradient.addColorStop(0, nodeColor + '50');
            coreGradient.addColorStop(0.6, colors.surface);
            coreGradient.addColorStop(1, colors.navy);
          } else {
            // Regular nodes: subtle glow
            coreGradient.addColorStop(0, nodeColor + '40');
            coreGradient.addColorStop(0.7, colors.navy + 'CC');
            coreGradient.addColorStop(1, colors.navy);
          }

          // Draw node fill with gradient
          ctx.beginPath();
          ctx.fillStyle = coreGradient;
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fill();

          // ============================================================
          // NODE RING: Soft edge highlight (not hard geometric)
          // ============================================================
          const ringAlpha = Math.floor(baseOpacity * 150).toString(16).padStart(2, '0');
          ctx.beginPath();
          ctx.strokeStyle = nodeColor + ringAlpha;
          ctx.lineWidth = node.isHero ? 2 : 1;
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Hero nodes get an extra outer ring
          if (node.isHero) {
            ctx.beginPath();
            ctx.strokeStyle = colors.gold + '30';
            ctx.lineWidth = 0.5;
            ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        });

        // Spontaneous signal generation
        if (Math.random() < config.spontaneousRate) {
          triggerRandomSignal();
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      // Initial setup
      resize();
      window.addEventListener('resize', resize);

      // For fullPage mode, also listen for scroll and DOM changes to handle dynamic content
      let mutationObserver: MutationObserver | null = null;
      let scrollTimeout: ReturnType<typeof setTimeout>;

      if (fullPage) {
        // Re-check height on scroll (debounced) - handles lazy-loaded content
        const handleScroll = () => {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            const newHeight = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight
            );
            if (Math.abs(newHeight - documentHeightRef.current) > 100) {
              resize();
            }
          }, 200);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        // MutationObserver to detect DOM changes that might affect page height
        mutationObserver = new MutationObserver(() => {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(resize, 300);
        });
        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: false,
        });
      }

      animate();

      // Initial burst of activity
      for (let i = 0; i < 6; i++) {
        setTimeout(triggerRandomSignal, i * 150);
      }

      // Cleanup
      return () => {
        clearTimeout(resizeTimeout);
        clearTimeout(scrollTimeout);
        window.removeEventListener('resize', resize);
        if (fullPage) {
          window.removeEventListener('scroll', () => {});
          mutationObserver?.disconnect();
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [
      config,
      initializeNetwork,
      reducedMotion,
      triggerRandomSignal,
      onSignalComplete,
      getExclusionZones,
      fullPage,
    ]);

    // Sync paused prop with ref
    useEffect(() => {
      isPausedRef.current = paused;
    }, [paused]);

    // Container styling based on fullPage mode
    const containerStyle: React.CSSProperties = fullPage
      ? {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          minHeight: '100%',
          zIndex: -1,
          background: config.colors.navy,
          ...style,
        }
      : {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          background: config.colors.navy,
          ...style,
        };

    // Reduced motion fallback - static gradient
    if (reducedMotion) {
      return (
        <div
          ref={containerRef}
          className={className}
          style={{
            ...containerStyle,
            background: `linear-gradient(135deg, ${config.colors.navy} 0%, ${config.colors.surface} 100%)`,
          }}
        />
      );
    }

    return (
      <div
        ref={containerRef}
        className={className}
        style={containerStyle}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: fullPage ? 'auto' : '100%',
            opacity: opacity,
          }}
        />
        {/* Vignette overlay - only for fixed mode, fullPage doesn't need it */}
        {!fullPage && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(ellipse at center, transparent 0%, ${config.colors.navy}90 100%)`,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Frosted glass overlay for text readability */}
        {frostedOverlay > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: `rgba(1, 8, 18, ${frostedOverlay * 0.6})`,
              backdropFilter: `blur(${frostedOverlay * 2}px)`,
              WebkitBackdropFilter: `blur(${frostedOverlay * 2}px)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    );
  }
);

NeuralCircuitBackground.displayName = 'NeuralCircuitBackground';

export default NeuralCircuitBackground;
export { DEFAULT_CONFIG, DEFAULT_COLORS };
