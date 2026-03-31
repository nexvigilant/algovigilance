import { useRef, useCallback, useEffect, useMemo, useState, type MutableRefObject } from 'react';
import {
  type NeuralCircuitConfig,
  type ExclusionZone,
  type Node,
  type Path,
  DEFAULT_CONFIG,
} from './types';

// ============================================================================
// Accessibility Hook: Detect prefers-reduced-motion
// ============================================================================
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// Adaptive Config Hook: Adjust settings based on device capabilities
// ============================================================================
export function useAdaptiveConfig(): Partial<NeuralCircuitConfig> {
  const [adaptiveConfig, setAdaptiveConfig] = useState<Partial<NeuralCircuitConfig>>({});

  useEffect(() => {
    // Detect device capabilities
    const isMobile = window.innerWidth < 768;
    const isLowPower = navigator.hardwareConcurrency <= 4;

    if (isMobile || isLowPower) {
      setAdaptiveConfig({
        gridSize: 140,              // Fewer nodes on mobile
        maxActiveSignals: 15,       // Fewer signals
        waveEnabled: !isLowPower,   // Disable wave on very slow devices
      });
    }
  }, []);

  return adaptiveConfig;
}

// ============================================================================
// Signal Class
// ============================================================================

export class Signal {
  fromNode: number;
  toNode: number;
  pathIndex: number;
  progress: number;
  speed: number;
  alive: boolean;

  constructor(
    fromNode: number,
    toNode: number,
    pathIndex: number,
    config: NeuralCircuitConfig
  ) {
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.pathIndex = pathIndex;
    this.progress = 0;
    this.speed =
      config.signalSpeedMin +
      Math.random() * (config.signalSpeedMax - config.signalSpeedMin);
    this.alive = true;
  }

  update(paths: Path[]): void {
    this.progress += this.speed;

    const path = paths[this.pathIndex];
    if (path) {
      // Saltatory conduction - speed boost at myelin gaps
      const segmentProgress = (this.progress * path.segments) % 1;
      if (segmentProgress < 0.15 || segmentProgress > 0.85) {
        this.progress += this.speed * 0.4;
      }
    }

    if (this.progress >= 1) {
      this.alive = false;
    }
  }
}

// ============================================================================
// Hook Definition
// ============================================================================

interface UseNeuralCircuitProps {
  config?: Partial<NeuralCircuitConfig>;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  paused?: boolean;
  reducedMotion?: boolean;
  onSignalComplete?: (fromNode: number, toNode: number) => void;
  exclusionSelector?: string;
  exclusionPadding?: number;
  contentAware?: boolean;
}

export function useNeuralCircuit({
  config: userConfig,
  canvasRef,
  paused = false,
  reducedMotion = false,
  onSignalComplete,
  exclusionSelector = '[data-neural-exclude]',
  exclusionPadding = 20,
  contentAware = true,
}: UseNeuralCircuitProps) {
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const pathsRef = useRef<Path[]>([]);
  const signalsRef = useRef<Signal[]>([]);
  const isPausedRef = useRef(paused);
  const exclusionZonesRef = useRef<ExclusionZone[]>([]);

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
  // Network Initialization - Clean Geometric Grid
  // ========================================================================

  const initializeNetwork = useCallback(
    (width: number, height: number, zones: ExclusionZone[]) => {
      const nodes: Node[] = [];
      const paths: Path[] = [];
      const {
        gridSize,
        connectionDistanceMultiplier,
        maxConnections,
        somaChance,
      } = config;

      // Store exclusion zones for reference
      exclusionZonesRef.current = zones;

      // ========================================================================
      // Pure Grid Distribution - Clean geometric placement
      // ========================================================================

      // Calculate grid dimensions
      const cols = Math.floor((width - gridSize) / gridSize);
      const rows = Math.floor((height - gridSize) / gridSize);

      // Center the grid
      const offsetX = (width - cols * gridSize) / 2;
      const offsetY = (height - rows * gridSize) / 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * gridSize + gridSize / 2;
          const y = offsetY + row * gridSize + gridSize / 2;

          // Skip if outside canvas bounds
          if (x < 50 || x > width - 50 || y < 50 || y > height - 50) {
            continue;
          }

          // Skip this node if it falls within an exclusion zone
          if (isPointInExclusionZone(x, y, zones)) {
            continue;
          }

          // Deterministic soma placement (corners and center-ish nodes)
          const isSoma = (row + col) % 5 === 0 && Math.random() < somaChance;

          // Hero nodes: rare large nodes (1 in 50) for visual anchoring
          const isHero = Math.random() < 0.02;

          // Depth simulation: random depth for parallax effect
          const depth = 0.3 + Math.random() * 0.7; // 0.3-1.0 range

          const node: Node = {
            x,
            y,
            baseX: x,          // Base position for wave animation
            baseY: y,
            radius: isSoma
              ? config.somaRadiusMin +
                Math.random() * (config.somaRadiusMax - config.somaRadiusMin)
              : config.nodeRadiusMin +
                Math.random() * (config.nodeRadiusMax - config.nodeRadiusMin),
            potential: 0,
            refractory: 0,
            connections: [],
            glow: 0,
            isSoma,
            isHero,
            depth,
            gridRow: row,      // Grid position for neighbor lookup
            gridCol: col,
          };
          nodes.push(node);
        }
      }

      // ========================================================================
      // Line Segment Intersection Detection
      // ========================================================================
      const segmentsIntersect = (
        x1: number, y1: number, x2: number, y2: number,
        x3: number, y3: number, x4: number, y4: number
      ): boolean => {
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (Math.abs(denom) < 0.0001) return false; // Parallel lines

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

        // Check if intersection point is within both segments (excluding endpoints)
        return ua > 0.01 && ua < 0.99 && ub > 0.01 && ub < 0.99;
      };

      const wouldIntersectExistingPath = (
        fromX: number, fromY: number, toX: number, toY: number
      ): boolean => {
        for (const path of paths) {
          const existingFrom = nodes[path.from];
          const existingTo = nodes[path.to];
          if (!existingFrom || !existingTo) continue;

          if (segmentsIntersect(
            fromX, fromY, toX, toY,
            existingFrom.x, existingFrom.y, existingTo.x, existingTo.y
          )) {
            return true;
          }
        }
        return false;
      };

      // ========================================================================
      // Create connections - only orthogonal/diagonal, no intersections
      // ========================================================================
      const maxDist = gridSize * connectionDistanceMultiplier;

      // Sort nodes by position for consistent connection order
      const sortedIndices = nodes.map((_, i) => i).sort((a, b) => {
        const nodeA = nodes[a];
        const nodeB = nodes[b];
        if (Math.abs(nodeA.y - nodeB.y) < 10) {
          return nodeA.x - nodeB.x;
        }
        return nodeA.y - nodeB.y;
      });

      // Connect nodes in sorted order (prioritize horizontal/vertical neighbors)
      for (const i of sortedIndices) {
        const node = nodes[i];
        if (node.connections.length >= maxConnections) continue;

        // Find nearest neighbors
        const neighbors: { index: number; dist: number; isOrthogonal: boolean }[] = [];

        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const other = nodes[j];
          const dist = Math.hypot(node.x - other.x, node.y - other.y);

          if (dist < maxDist && dist > gridSize * 0.5) {
            // Check if connection is roughly orthogonal (horizontal/vertical)
            const angle = Math.atan2(other.y - node.y, other.x - node.x);
            const normalizedAngle = Math.abs(angle % (Math.PI / 2));
            const isOrthogonal = normalizedAngle < 0.15 || normalizedAngle > (Math.PI / 2 - 0.15);

            neighbors.push({ index: j, dist, isOrthogonal });
          }
        }

        // Prioritize orthogonal connections, then by distance
        neighbors.sort((a, b) => {
          if (a.isOrthogonal !== b.isOrthogonal) {
            return a.isOrthogonal ? -1 : 1;
          }
          return a.dist - b.dist;
        });

        // Add connections (respecting max and avoiding intersections)
        for (const neighbor of neighbors) {
          if (node.connections.length >= maxConnections) break;
          if (nodes[neighbor.index].connections.length >= maxConnections) continue;

          // Check if path would cross an exclusion zone
          if (doesPathCrossExclusionZone(node.x, node.y, nodes[neighbor.index].x, nodes[neighbor.index].y, zones)) {
            continue;
          }

          // Check if path would intersect existing paths
          if (wouldIntersectExistingPath(node.x, node.y, nodes[neighbor.index].x, nodes[neighbor.index].y)) {
            continue;
          }

          // Check if reverse connection already exists
          const alreadyConnected = paths.some(
            p => (p.from === i && p.to === neighbor.index) || (p.from === neighbor.index && p.to === i)
          );
          if (alreadyConnected) continue;

          node.connections.push(neighbor.index);
          paths.push({
            from: i,
            to: neighbor.index,
            segments: 2,
          });
        }
      }

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
  // Animation Loop
  // ========================================================================

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let resizeTimeout: ReturnType<typeof setTimeout>;

    const resize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(dpr, dpr);
        // Get exclusion zones from DOM before initializing network
        const zones = getExclusionZones();
        initializeNetwork(window.innerWidth, window.innerHeight, zones);
      }, 100);
    };

    window.addEventListener('resize', resize);
    resize(); // Initial resize

    const animate = () => {
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const { colors } = config;

      // Clear with navy background
      ctx.fillStyle = colors.navy;
      ctx.fillRect(0, 0, width, height);

      // Draw visible grid
      if (config.enableGrid) {
        ctx.strokeStyle = colors.surface;
        ctx.lineWidth = 1.5;
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

      // Calculate center for vignette effect
      const centerX = width / 2;
      const centerY = height / 2;
      const maxDist = Math.hypot(centerX, centerY);

      // Draw paths (straight lines) with depth-based opacity
      pathsRef.current.forEach((path) => {
        const from = nodesRef.current[path.from];
        const to = nodesRef.current[path.to];
        if (!from || !to) return;

        // Calculate distance from center for vignette effect
        const pathCenterX = (from.x + to.x) / 2;
        const pathCenterY = (from.y + to.y) / 2;
        const distFromCenter = Math.hypot(pathCenterX - centerX, pathCenterY - centerY);
        const depthOpacity = Math.max(0.25, 1 - (distFromCenter / maxDist) * 0.6);

        // Straight line with depth-based opacity
        const alphaHex = Math.floor(depthOpacity * 200).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.strokeStyle = colors.techBlue + alphaHex;
        ctx.lineWidth = config.traceWidth;
        ctx.lineCap = 'round';
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
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
                    signalsRef.current.push(
                      new Signal(signal.toNode, nextNode, pathIdx, config)
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
        const from = nodesRef.current[path.from];
        const to = nodesRef.current[path.to];
        if (!from || !to) return;

        const t = signal.progress;
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t;

        // Draw signal glow
        const gradient = ctx.createRadialGradient(
          x,
          y,
          0,
          x,
          y,
          config.glowRadius
        );
        gradient.addColorStop(0, colors.cyan);
        gradient.addColorStop(0.4, colors.cyan + '60');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, config.glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw signal core
        ctx.fillStyle = colors.white;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Remove dead signals
      signalsRef.current = signalsRef.current.filter((s) => s.alive);

      // Draw nodes with vignette effect
      nodesRef.current.forEach((node) => {
        // Update node state
        if (node.potential > 0) {
          node.potential -= 0.025;
          node.refractory = 25;
        }
        if (node.refractory > 0) node.refractory -= 1;
        if (node.glow > 0) node.glow -= 0.035;

        // Calculate vignette opacity for this node
        const nodeDistFromCenter = Math.hypot(node.x - centerX, node.y - centerY);
        const nodeDepthOpacity = Math.max(0.2, 1 - (nodeDistFromCenter / maxDist) * 0.65);

        // Draw node glow when activated (glow ignores vignette for emphasis)
        if (node.glow > 0) {
          const glowVal = Math.floor(node.glow * 255)
            .toString(16)
            .padStart(2, '0');
          const glowGradient = ctx.createRadialGradient(
            node.x,
            node.y,
            0,
            node.x,
            node.y,
            node.radius * 7
          );
          glowGradient.addColorStop(0, colors.gold + glowVal);
          glowGradient.addColorStop(
            0.5,
            colors.cyan +
              Math.floor(node.glow * 100)
                .toString(16)
                .padStart(2, '0')
          );
          glowGradient.addColorStop(1, 'transparent');

          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 7, 0, Math.PI * 2);
          ctx.fill();
        }

        // Determine node color based on potential
        const baseColor =
          node.potential > 0.5
            ? colors.gold
            : node.potential > 0
              ? colors.cyan
              : colors.techBlue;

        // Apply vignette to inactive nodes (active nodes stay bright)
        const nodeAlpha = node.potential > 0 ? 'ff' : Math.floor(nodeDepthOpacity * 200).toString(16).padStart(2, '0');
        const nodeColor = baseColor + nodeAlpha;

        // Draw node ring
        ctx.beginPath();
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = 1.5;
        ctx.arc(node.x, node.y, node.radius + 1.5, 0, Math.PI * 2);
        ctx.stroke();

        // Draw node fill (slightly transparent for depth)
        ctx.beginPath();
        ctx.fillStyle = colors.navy + (node.potential > 0 ? 'ff' : Math.floor(nodeDepthOpacity * 255).toString(16).padStart(2, '0'));
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimeout);
    };
  }, [
    canvasRef,
    config,
    reducedMotion,
    getExclusionZones,
    initializeNetwork,
    onSignalComplete,
  ]);

  return {
    triggerSignal: triggerRandomSignal,
    triggerBurst,
    pause: () => {
      isPausedRef.current = true;
    },
    resume: () => {
      isPausedRef.current = false;
    },
    isPaused: () => isPausedRef.current,
  };
}
