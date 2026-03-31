'use client';

import { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * SVG-based Biological Neural Network Background
 *
 * Design Philosophy: "Bio-luminescent deep-sea organism"
 * - Organic, cellular nodes with soft radial glows
 * - Curved synaptic connections (bezier paths)
 * - Depth simulation via layering and blur
 * - Signal animations flowing along neural pathways
 * - Vignette clustering (dense edges, clear center)
 *
 * Performance: GPU-composited SVG animations
 * Accessibility: aria-hidden for decorative background
 */

interface NeuralNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'soma' | 'neuron' | 'synapse';
  layer: 'far' | 'mid' | 'near';
  connections: string[];
}

interface NeuralConnection {
  id: string;
  from: string;
  to: string;
  curve: number;
  animationDelay: number;
  animationDuration: number;
}

interface NeuralNetworkSVGProps {
  className?: string;
  /** Opacity of the entire network (0-1) */
  opacity?: number;
  /** Enable signal animations */
  animated?: boolean;
  /**
   * Color theme variants:
   * - default: Balanced gold soma + cyan neurons (landing page)
   * - warm: Gold-dominant warmth
   * - cool: Cyan-dominant coolness
   * - guardian: Security-focused intense cyan (for Guardian pages)
   * - academy: Knowledge-focused amber/gold (for Academy pages)
   */
  theme?: 'default' | 'warm' | 'cool' | 'guardian' | 'academy';
}

/**
 * Deterministic hash-based pseudo-random value generator
 * Produces consistent results between SSR and client hydration
 */
function deterministicValue(str: string, index: number): number {
  let hash = 5381;
  const input = `${str}-${index}`;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  // Normalize to 0-1 range
  return Math.abs((hash % 10000) / 10000);
}

// Pre-designed organic node layout for 1920x1080 viewport
// Vignette pattern: dense at edges, sparse in center
const generateNodes = (): NeuralNode[] => {
  const nodes: NeuralNode[] = [];

  // Edge clusters - dense biological clusters at periphery
  // Top-left cluster
  nodes.push(
    { id: 'tl-soma-1', x: 8, y: 12, radius: 18, type: 'soma', layer: 'near', connections: ['tl-n1', 'tl-n2', 'tl-n3'] },
    { id: 'tl-n1', x: 5, y: 8, radius: 6, type: 'neuron', layer: 'mid', connections: ['tl-s1'] },
    { id: 'tl-n2', x: 12, y: 6, radius: 8, type: 'neuron', layer: 'near', connections: ['tl-s2', 't-n1'] },
    { id: 'tl-n3', x: 15, y: 15, radius: 5, type: 'neuron', layer: 'far', connections: ['l-soma-1'] },
    { id: 'tl-s1', x: 3, y: 5, radius: 3, type: 'synapse', layer: 'far', connections: [] },
    { id: 'tl-s2', x: 18, y: 3, radius: 4, type: 'synapse', layer: 'mid', connections: [] },
  );

  // Top cluster
  nodes.push(
    { id: 't-soma-1', x: 35, y: 8, radius: 14, type: 'soma', layer: 'mid', connections: ['t-n1', 't-n2', 't-n3'] },
    { id: 't-n1', x: 28, y: 5, radius: 7, type: 'neuron', layer: 'near', connections: [] },
    { id: 't-n2', x: 42, y: 4, radius: 5, type: 'neuron', layer: 'far', connections: ['t-s1'] },
    { id: 't-n3', x: 38, y: 14, radius: 6, type: 'neuron', layer: 'mid', connections: ['tr-n1'] },
    { id: 't-s1', x: 48, y: 2, radius: 3, type: 'synapse', layer: 'far', connections: [] },
  );

  // Top-right cluster
  nodes.push(
    { id: 'tr-soma-1', x: 88, y: 10, radius: 16, type: 'soma', layer: 'near', connections: ['tr-n1', 'tr-n2', 'tr-n3'] },
    { id: 'tr-n1', x: 78, y: 8, radius: 7, type: 'neuron', layer: 'mid', connections: [] },
    { id: 'tr-n2', x: 94, y: 6, radius: 5, type: 'neuron', layer: 'far', connections: ['tr-s1'] },
    { id: 'tr-n3', x: 92, y: 18, radius: 8, type: 'neuron', layer: 'near', connections: ['r-n1'] },
    { id: 'tr-s1', x: 97, y: 3, radius: 4, type: 'synapse', layer: 'mid', connections: [] },
  );

  // Left cluster
  nodes.push(
    { id: 'l-soma-1', x: 6, y: 45, radius: 20, type: 'soma', layer: 'near', connections: ['l-n1', 'l-n2', 'l-n3', 'l-n4'] },
    { id: 'l-n1', x: 3, y: 35, radius: 6, type: 'neuron', layer: 'mid', connections: ['tl-n3'] },
    { id: 'l-n2', x: 2, y: 55, radius: 8, type: 'neuron', layer: 'near', connections: ['bl-n1'] },
    { id: 'l-n3', x: 12, y: 38, radius: 5, type: 'neuron', layer: 'far', connections: [] },
    { id: 'l-n4', x: 14, y: 52, radius: 7, type: 'neuron', layer: 'mid', connections: [] },
  );

  // Right cluster
  nodes.push(
    { id: 'r-soma-1', x: 94, y: 48, radius: 18, type: 'soma', layer: 'near', connections: ['r-n1', 'r-n2', 'r-n3'] },
    { id: 'r-n1', x: 96, y: 35, radius: 7, type: 'neuron', layer: 'mid', connections: [] },
    { id: 'r-n2', x: 98, y: 58, radius: 6, type: 'neuron', layer: 'far', connections: ['br-n1'] },
    { id: 'r-n3', x: 88, y: 42, radius: 8, type: 'neuron', layer: 'near', connections: [] },
  );

  // Bottom-left cluster
  nodes.push(
    { id: 'bl-soma-1', x: 10, y: 85, radius: 15, type: 'soma', layer: 'mid', connections: ['bl-n1', 'bl-n2', 'bl-n3'] },
    { id: 'bl-n1', x: 5, y: 78, radius: 6, type: 'neuron', layer: 'near', connections: [] },
    { id: 'bl-n2', x: 8, y: 92, radius: 7, type: 'neuron', layer: 'far', connections: ['b-n1'] },
    { id: 'bl-n3', x: 18, y: 88, radius: 5, type: 'neuron', layer: 'mid', connections: [] },
  );

  // Bottom cluster
  nodes.push(
    { id: 'b-soma-1', x: 55, y: 92, radius: 12, type: 'soma', layer: 'far', connections: ['b-n1', 'b-n2'] },
    { id: 'b-n1', x: 45, y: 95, radius: 5, type: 'neuron', layer: 'mid', connections: [] },
    { id: 'b-n2', x: 65, y: 96, radius: 6, type: 'neuron', layer: 'near', connections: ['br-n2'] },
  );

  // Bottom-right cluster
  nodes.push(
    { id: 'br-soma-1', x: 90, y: 88, radius: 17, type: 'soma', layer: 'near', connections: ['br-n1', 'br-n2', 'br-n3'] },
    { id: 'br-n1', x: 95, y: 80, radius: 6, type: 'neuron', layer: 'mid', connections: [] },
    { id: 'br-n2', x: 85, y: 94, radius: 7, type: 'neuron', layer: 'far', connections: [] },
    { id: 'br-n3', x: 96, y: 92, radius: 5, type: 'neuron', layer: 'near', connections: [] },
  );

  // Sparse center nodes (for depth, much fewer)
  nodes.push(
    { id: 'c-n1', x: 25, y: 30, radius: 4, type: 'synapse', layer: 'far', connections: [] },
    { id: 'c-n2', x: 75, y: 28, radius: 3, type: 'synapse', layer: 'far', connections: [] },
    { id: 'c-n3', x: 22, y: 70, radius: 4, type: 'synapse', layer: 'far', connections: [] },
    { id: 'c-n4', x: 78, y: 72, radius: 3, type: 'synapse', layer: 'far', connections: [] },
  );

  return nodes;
};

// Generate bezier curve path between two nodes
const generateConnectionPath = (
  fromNode: NeuralNode,
  toNode: NeuralNode,
  curveIntensity: number = 0.3
): string => {
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate control points for organic curve
  // Perpendicular offset creates natural arc
  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;

  // Perpendicular direction
  const perpX = -dy / distance;
  const perpY = dx / distance;

  // Curve offset (alternating direction based on position)
  const curveOffset = distance * curveIntensity * (fromNode.x > toNode.x ? 1 : -1);

  const ctrlX = midX + perpX * curveOffset;
  const ctrlY = midY + perpY * curveOffset;

  return `M ${fromNode.x} ${fromNode.y} Q ${ctrlX} ${ctrlY} ${toNode.x} ${toNode.y}`;
};

export function NeuralNetworkSVG({
  className,
  opacity = 0.6,
  animated = true,
  theme = 'default',
}: NeuralNetworkSVGProps) {
  const uniqueId = useId();

  const nodes = useMemo(() => generateNodes(), []);
  const nodeMap = useMemo(() => {
    const map = new Map<string, NeuralNode>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Generate connections from node definitions
  // Uses deterministic hash function for consistent SSR/client values (avoids hydration mismatch)
  const connections = useMemo(() => {
    const conns: NeuralConnection[] = [];
    let connIndex = 0;

    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const targetNode = nodeMap.get(targetId);
        if (targetNode) {
          // Create deterministic key from node IDs
          const connKey = `${node.id}-${targetId}`;

          conns.push({
            id: `conn-${connIndex++}`,
            from: node.id,
            to: targetId,
            curve: 0.2 + deterministicValue(connKey, 0) * 0.3,
            animationDelay: deterministicValue(connKey, 1) * 8,
            animationDuration: 4 + deterministicValue(connKey, 2) * 4,
          });
        }
      });
    });

    return conns;
  }, [nodes, nodeMap]);

  // Theme colors
  const colors = useMemo(() => {
    switch (theme) {
      case 'warm':
        return {
          soma: { core: '#F4D078', glow: '#D4AF37', outer: '#B87333' },
          neuron: { core: '#52C5C7', glow: '#2B6F99', outer: '#1a4d66' },
          synapse: { core: '#E6F1FF', glow: '#8892b0', outer: '#4a5568' },
          signal: { primary: '#F4D078', secondary: '#52C5C7' },
          connection: { stroke: '#2B6F99', glow: '#52C5C7' },
        };
      case 'cool':
        return {
          soma: { core: '#52C5C7', glow: '#2B6F99', outer: '#1a4d66' },
          neuron: { core: '#F4D078', glow: '#D4AF37', outer: '#B87333' },
          synapse: { core: '#E6F1FF', glow: '#8892b0', outer: '#4a5568' },
          signal: { primary: '#52C5C7', secondary: '#F4D078' },
          connection: { stroke: '#D4AF37', glow: '#F4D078' },
        };
      case 'guardian':
        // Security-focused: intense cyan dominance with digital blue accents
        return {
          soma: { core: '#00D4FF', glow: '#0099CC', outer: '#006699' },
          neuron: { core: '#52C5C7', glow: '#2B6F99', outer: '#1a4d66' },
          synapse: { core: '#B8E6FF', glow: '#6BB3D9', outer: '#3d7a9e' },
          signal: { primary: '#00D4FF', secondary: '#52C5C7' },
          connection: { stroke: '#0099CC', glow: '#00D4FF' },
        };
      case 'academy':
        // Knowledge-focused: warm amber/gold prominence for learning
        return {
          soma: { core: '#FFD700', glow: '#DAA520', outer: '#B8860B' },
          neuron: { core: '#F4D078', glow: '#D4AF37', outer: '#B87333' },
          synapse: { core: '#FFF8DC', glow: '#F5DEB3', outer: '#DEB887' },
          signal: { primary: '#FFD700', secondary: '#F4D078' },
          connection: { stroke: '#DAA520', glow: '#FFD700' },
        };
      default:
        return {
          soma: { core: '#F4D078', glow: '#D4AF37', outer: '#B87333' },
          neuron: { core: '#52C5C7', glow: '#2B6F99', outer: '#1a4d66' },
          synapse: { core: '#E6F1FF', glow: '#8892b0', outer: '#4a5568' },
          signal: { primary: '#52C5C7', secondary: '#F4D078' },
          connection: { stroke: '#2B6F99', glow: '#52C5C7' },
        };
    }
  }, [theme]);

  // Layer opacity based on depth
  const layerOpacity = {
    far: 0.3,
    mid: 0.6,
    near: 1.0,
  };

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        style={{ opacity }}
      >
        <defs>
          {/* Radial gradients for soma nodes (large cellular bodies) */}
          <radialGradient id={`${uniqueId}-soma-gradient`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={colors.soma.core} stopOpacity="1" />
            <stop offset="40%" stopColor={colors.soma.glow} stopOpacity="0.8" />
            <stop offset="70%" stopColor={colors.soma.outer} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.soma.outer} stopOpacity="0" />
          </radialGradient>

          {/* Radial gradients for neuron nodes (medium cells) */}
          <radialGradient id={`${uniqueId}-neuron-gradient`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={colors.neuron.core} stopOpacity="1" />
            <stop offset="50%" stopColor={colors.neuron.glow} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colors.neuron.outer} stopOpacity="0" />
          </radialGradient>

          {/* Radial gradients for synapse nodes (tiny connection points) */}
          <radialGradient id={`${uniqueId}-synapse-gradient`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={colors.synapse.core} stopOpacity="0.8" />
            <stop offset="60%" stopColor={colors.synapse.glow} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.synapse.outer} stopOpacity="0" />
          </radialGradient>

          {/* Connection gradient with fade at ends */}
          <linearGradient id={`${uniqueId}-connection-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.connection.stroke} stopOpacity="0" />
            <stop offset="20%" stopColor={colors.connection.stroke} stopOpacity="0.4" />
            <stop offset="50%" stopColor={colors.connection.glow} stopOpacity="0.6" />
            <stop offset="80%" stopColor={colors.connection.stroke} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.connection.stroke} stopOpacity="0" />
          </linearGradient>

          {/* Glow filters */}
          <filter id={`${uniqueId}-glow-soma`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="over" />
          </filter>

          <filter id={`${uniqueId}-glow-neuron`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="over" />
          </filter>

          <filter id={`${uniqueId}-glow-connection`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.15" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Blur filter for far layer */}
          <filter id={`${uniqueId}-blur-far`}>
            <feGaussianBlur stdDeviation="0.3" />
          </filter>

          <filter id={`${uniqueId}-blur-mid`}>
            <feGaussianBlur stdDeviation="0.1" />
          </filter>

          {/* Signal particle gradient */}
          <radialGradient id={`${uniqueId}-signal-gradient`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.signal.primary} stopOpacity="1" />
            <stop offset="50%" stopColor={colors.signal.secondary} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors.signal.primary} stopOpacity="0" />
          </radialGradient>

          {/* Vignette gradient overlay */}
          <radialGradient id={`${uniqueId}-vignette`} cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#010812" stopOpacity="0" />
            <stop offset="50%" stopColor="#010812" stopOpacity="0" />
            <stop offset="100%" stopColor="#010812" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* Background base */}
        <rect width="100" height="100" fill="#010812" />

        {/* Far layer - blurred background elements */}
        <g filter={`url(#${uniqueId}-blur-far)`} opacity={layerOpacity.far}>
          {/* Connections for far layer */}
          {connections
            .filter(conn => {
              const fromNode = nodeMap.get(conn.from);
              return fromNode?.layer === 'far';
            })
            .map(conn => {
              const fromNode = nodeMap.get(conn.from);
              const toNode = nodeMap.get(conn.to);
              if (!fromNode || !toNode) return null;

              const pathD = generateConnectionPath(fromNode, toNode, conn.curve);

              return (
                <g key={conn.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={colors.connection.stroke}
                    strokeWidth="0.15"
                    strokeOpacity="0.3"
                    filter={`url(#${uniqueId}-glow-connection)`}
                  />
                </g>
              );
            })}

          {/* Nodes for far layer */}
          {nodes
            .filter(node => node.layer === 'far')
            .map(node => (
              <circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={node.radius * 0.15}
                fill={`url(#${uniqueId}-${node.type}-gradient)`}
              />
            ))}
        </g>

        {/* Mid layer */}
        <g filter={`url(#${uniqueId}-blur-mid)`} opacity={layerOpacity.mid}>
          {/* Connections for mid layer */}
          {connections
            .filter(conn => {
              const fromNode = nodeMap.get(conn.from);
              return fromNode?.layer === 'mid';
            })
            .map(conn => {
              const fromNode = nodeMap.get(conn.from);
              const toNode = nodeMap.get(conn.to);
              if (!fromNode || !toNode) return null;

              const pathD = generateConnectionPath(fromNode, toNode, conn.curve);
              const pathId = `${uniqueId}-path-${conn.id}`;

              return (
                <g key={conn.id}>
                  <path
                    id={pathId}
                    d={pathD}
                    fill="none"
                    stroke={colors.connection.stroke}
                    strokeWidth="0.12"
                    strokeOpacity="0.5"
                    filter={`url(#${uniqueId}-glow-connection)`}
                  />
                  {animated && (
                    <circle r="0.3" fill={`url(#${uniqueId}-signal-gradient)`}>
                      <animateMotion
                        dur={`${conn.animationDuration}s`}
                        repeatCount="indefinite"
                        begin={`${conn.animationDelay}s`}
                      >
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                      <animate
                        attributeName="opacity"
                        values="0;1;1;0"
                        dur={`${conn.animationDuration}s`}
                        repeatCount="indefinite"
                        begin={`${conn.animationDelay}s`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

          {/* Nodes for mid layer */}
          {nodes
            .filter(node => node.layer === 'mid')
            .map(node => (
              <circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={node.radius * 0.12}
                fill={`url(#${uniqueId}-${node.type}-gradient)`}
                filter={node.type === 'soma' ? `url(#${uniqueId}-glow-soma)` : `url(#${uniqueId}-glow-neuron)`}
              />
            ))}
        </g>

        {/* Near layer - sharpest, most prominent */}
        <g opacity={layerOpacity.near}>
          {/* Connections for near layer */}
          {connections
            .filter(conn => {
              const fromNode = nodeMap.get(conn.from);
              return fromNode?.layer === 'near';
            })
            .map(conn => {
              const fromNode = nodeMap.get(conn.from);
              const toNode = nodeMap.get(conn.to);
              if (!fromNode || !toNode) return null;

              const pathD = generateConnectionPath(fromNode, toNode, conn.curve);
              const pathId = `${uniqueId}-path-near-${conn.id}`;

              return (
                <g key={conn.id}>
                  {/* Connection glow */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={colors.connection.glow}
                    strokeWidth="0.25"
                    strokeOpacity="0.3"
                    filter={`url(#${uniqueId}-glow-connection)`}
                  />
                  {/* Connection line */}
                  <path
                    id={pathId}
                    d={pathD}
                    fill="none"
                    stroke={colors.connection.stroke}
                    strokeWidth="0.1"
                    strokeOpacity="0.7"
                  />
                  {/* Animated signal */}
                  {animated && (
                    <circle r="0.4" fill={`url(#${uniqueId}-signal-gradient)`}>
                      <animateMotion
                        dur={`${conn.animationDuration}s`}
                        repeatCount="indefinite"
                        begin={`${conn.animationDelay}s`}
                      >
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                      <animate
                        attributeName="opacity"
                        values="0;1;1;0"
                        dur={`${conn.animationDuration}s`}
                        repeatCount="indefinite"
                        begin={`${conn.animationDelay}s`}
                      />
                      <animate
                        attributeName="r"
                        values="0.3;0.5;0.3"
                        dur={`${conn.animationDuration}s`}
                        repeatCount="indefinite"
                        begin={`${conn.animationDelay}s`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

          {/* Nodes for near layer */}
          {nodes
            .filter(node => node.layer === 'near')
            .map(node => (
              <g key={node.id}>
                {/* Outer glow halo */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius * 0.2}
                  fill={`url(#${uniqueId}-${node.type}-gradient)`}
                  opacity="0.4"
                  filter={`url(#${uniqueId}-glow-soma)`}
                />
                {/* Core node */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius * 0.1}
                  fill={`url(#${uniqueId}-${node.type}-gradient)`}
                  filter={node.type === 'soma' ? `url(#${uniqueId}-glow-soma)` : `url(#${uniqueId}-glow-neuron)`}
                />
                {/* Pulsing animation for soma nodes */}
                {animated && node.type === 'soma' && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius * 0.1}
                    fill="none"
                    stroke={colors.soma.core}
                    strokeWidth="0.05"
                    strokeOpacity="0.5"
                  >
                    <animate
                      attributeName="r"
                      values={`${node.radius * 0.1};${node.radius * 0.15};${node.radius * 0.1}`}
                      dur="4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-opacity"
                      values="0.5;0.2;0.5"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            ))}
        </g>

        {/* Subtle ambient particles */}
        {animated && (
          <g opacity="0.4">
            {Array.from({ length: 12 }).map((_, i) => {
              const x = 5 + (i * 8) % 90;
              const y = 10 + (i * 13) % 80;
              const delay = i * 0.8;
              const duration = 6 + (i % 4);

              return (
                <circle
                  key={`particle-${i}`}
                  r="0.15"
                  fill={i % 2 === 0 ? colors.signal.primary : colors.signal.secondary}
                >
                  <animate
                    attributeName="cx"
                    values={`${x};${x + 3};${x}`}
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                  />
                  <animate
                    attributeName="cy"
                    values={`${y};${y - 2};${y}`}
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.6;0"
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                  />
                </circle>
              );
            })}
          </g>
        )}

        {/* Vignette overlay - darkens edges, clear center */}
        <rect
          width="100"
          height="100"
          fill={`url(#${uniqueId}-vignette)`}
          style={{ mixBlendMode: 'multiply' }}
        />
      </svg>

      {/* CSS animations for enhanced effects */}
      <style jsx global>{`
        @keyframes neuralPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes neuralDrift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(2px, -1px); }
          50% { transform: translate(-1px, 2px); }
          75% { transform: translate(1px, 1px); }
        }
      `}</style>
    </div>
  );
}
