'use client'

import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Line, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import {
  COLORS, GROUP_COLORS, MATERIAL, GLOW, ANIMATION,
  LABEL, ARC, GEOMETRY,
} from './observatory-constants'
import { computeLayoutForMode, seededRandom, hashString } from './graph-layouts'
import { InstancedSignalCloud } from './instanced-graph'
import { perceptualRadius, trendToEmissive, seriousnessToGlow, confidenceToOpacity, confidenceToDissolve } from '@/lib/observatory/visual-encoding'
import { getNodeGeometry } from './cvd-geometry'
import type { DataType } from './cvd-geometry'
import type { CVDMode, SemanticZoomLevel } from '@/lib/observatory/types'
import { AdaptiveNode } from './semantic-zoom'
import './uncertainty-material'
import './glow-material'
import { EnergyEdge } from './energy-edge'

export interface GraphNode {
  id: string
  label: string
  group?: string
  value?: number
  color?: string
  /** Optional data type for CVD shape encoding */
  dataType?: DataType
  /** Confidence level for uncertainty visualization (0-1, used with FAERS live data) */
  confidence?: number
  /** Temporal trend for emissive intensity encoding */
  trend?: 'emerging' | 'stable' | 'declining'
  /** Seriousness score for glow intensity encoding (0-1) */
  seriousness?: number
  /** Perceptually-calibrated visual encoding data for pharmacovigilance signals */
  encoding?: EncodedNodeData
}

/** Perceptually-calibrated encoding overrides for pharmacovigilance signal nodes. */
export interface EncodedNodeData {
  /** Statistical strength (e.g., PRR, ROR) — maps to perceptual radius via Stevens' Power Law */
  signalStrength?: number
  /** Confidence interval width — maps to opacity (range 0-20) */
  ciWidth?: number
  /** Temporal trend — maps to emissive intensity */
  trend?: 'emerging' | 'stable' | 'declining'
  /** Seriousness score 0-1 — maps to bloom glow threshold */
  seriousness?: number
}

export interface GraphEdge {
  source: string
  target: string
  weight?: number
  label?: string
}

export type GraphLayout = 'force' | 'hierarchy' | 'radial' | 'grid'

export interface ForceGraph3DProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (node: GraphNode) => void
  nodeSize?: number
  edgeOpacity?: number
  showLabels?: boolean
  colorScheme?: 'cyan' | 'gold' | 'mixed'
  /** Layout algorithm — force (physics), hierarchy (DAG layers), radial (concentric), grid (matrix) */
  layout?: GraphLayout
  /** CVD mode — when not 'normal', nodes use shape encoding via getNodeGeometry */
  cvdMode?: CVDMode
  /** Pre-computed positions from web worker (bypasses synchronous layout) */
  externalPositions?: Map<string, [number, number, number]>
  /** Semantic zoom level for AdaptiveNode rendering */
  zoomLevel?: SemanticZoomLevel
  /** Theme-driven group color overrides. Falls back to GROUP_COLORS constant. */
  groupColors?: Record<string, string>
  /** Min/max signal strength for perceptual radius scaling (auto-computed from encoding data if omitted) */
  signalRange?: { min: number; max: number }
}

function GraphNodeMesh({
  node,
  position,
  size,
  showLabel,
  cvdMode,
  onClick,
  groupColors,
}: {
  node: GraphNode
  position: THREE.Vector3
  size: number
  showLabel: boolean
  cvdMode?: CVDMode
  onClick?: (node: GraphNode) => void
  groupColors?: Record<string, string>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowMatRef = useRef<THREE.ShaderMaterial>(null)
  const uncertaintyMatRef = useRef<THREE.ShaderMaterial>(null)
  const [hovered, setHovered] = useState(false)
  const resolvedColors = groupColors ?? GROUP_COLORS
  const color = node.color ?? resolvedColors[node.group ?? 'default'] ?? resolvedColors.default ?? GROUP_COLORS.default

  // Visual-encoding: encoding overrides take precedence over direct node properties
  const emissiveBase = useMemo(() => {
    const trend = node.encoding?.trend ?? node.trend
    return trend ? trendToEmissive(trend) : MATERIAL.emissiveIdle
  }, [node.encoding, node.trend])

  const glowIntensity = useMemo(() => {
    const seriousness = node.encoding?.seriousness ?? node.seriousness
    return seriousness !== undefined ? seriousnessToGlow(seriousness) * 10 : GLOW.defaultIntensity
  }, [node.encoding, node.seriousness])

  // Resolve effective confidence for the uncertainty shader.
  // encoding.ciWidth → confidenceToDissolve() → invert to confidence scale (1 - dissolve).
  // Falls back to node.confidence for direct confidence-driven dissolution.
  const effectiveConfidence = useMemo(() => {
    if (node.encoding?.ciWidth !== undefined) {
      return 1 - confidenceToDissolve(node.encoding.ciWidth)
    }
    return node.confidence
  }, [node.encoding, node.confidence])

  // Physical material opacity (only when NOT in dissolve mode).
  // encoding.ciWidth in fully-confident context → confidenceToOpacity for gentle transparency.
  const materialOpacity = useMemo(() => {
    if (effectiveConfidence !== undefined && effectiveConfidence < 1.0) return undefined
    if (node.encoding?.ciWidth !== undefined) return confidenceToOpacity(node.encoding.ciWidth)
    return undefined
  }, [node.encoding, effectiveConfidence])

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const s = hovered ? size * ANIMATION.hoverScale : size
      meshRef.current.scale.setScalar(s + Math.sin(clock.elapsedTime * ANIMATION.idleOscFreq + seededRandom(hashString(node.id)) * ANIMATION.randomPhaseMultiplier) * ANIMATION.idleOscAmp)
    }
    if (glowMatRef.current) {
      glowMatRef.current.uniforms.time.value = clock.elapsedTime
    }
    if (uncertaintyMatRef.current) {
      uncertaintyMatRef.current.uniforms.time.value = clock.elapsedTime
    }
  })

  const handleClick = useCallback(() => {
    onClick?.(node)
  }, [node, onClick])

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {cvdMode !== 'normal' && node.dataType ? (
          <primitive object={getNodeGeometry(node.dataType, cvdMode ?? 'normal')} attach="geometry" />
        ) : (
          <sphereGeometry args={[1, ...GEOMETRY.sphereDetail]} />
        )}
        {effectiveConfidence !== undefined && effectiveConfidence < 1.0 ? (
          <uncertaintyShaderMaterial
            ref={uncertaintyMatRef}
            baseColor={color}
            confidence={effectiveConfidence}
            signalStrength={hovered ? 0.5 : 0.0}
            transparent
            depthWrite={false}
          />
        ) : (
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? MATERIAL.emissiveHover : emissiveBase}
            roughness={MATERIAL.roughnessSmooth}
            metalness={MATERIAL.metalnessHigh}
            clearcoat={MATERIAL.clearcoat}
            clearcoatRoughness={MATERIAL.clearcoatRoughness}
            transmission={MATERIAL.transmission}
            thickness={MATERIAL.thickness}
            ior={MATERIAL.ior}
            envMapIntensity={MATERIAL.envMapIntensity}
            transparent={materialOpacity !== undefined}
            opacity={materialOpacity ?? 1.0}
          />
        )}
      </mesh>
      {/* Glow sphere — HDR rim shader with bloom interaction */}
      <mesh scale={GLOW.nodeSphereScale}>
        <sphereGeometry args={[1, ...GEOMETRY.sphereDetailLow]} />
        <glowShaderMaterial
          ref={glowMatRef}
          color={color}
          intensity={hovered ? GLOW.opacityHover * 10 : glowIntensity}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      {showLabel && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text
            font="/fonts/inter-latin.woff2"
            position={[0, size + LABEL.offsetY, 0]}
            fontSize={LABEL.fontSize}
            color={COLORS.textPrimary}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={LABEL.outlineWidth}
            outlineColor={LABEL.outlineColor}
          >
            {node.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}

function GraphEdgeLine({
  start,
  end,
  weight,
  opacity,
  color,
}: {
  start: THREE.Vector3
  end: THREE.Vector3
  weight: number
  opacity: number
  color: string
}) {
  const mid = useMemo(() => {
    const m = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    m.y += ARC.liftFactor
    return m
  }, [start, end])

  return (
    <Line
      points={[start, mid, end]}
      color={color}
      lineWidth={Math.max(ARC.minLineWidth, weight * ARC.weightMultiplier)}
      transparent
      opacity={opacity * ARC.opacityMultiplier}
    />
  )
}

export function ForceGraph3D({
  nodes,
  edges,
  onNodeClick,
  nodeSize = GEOMETRY.nodeSizeDefault,
  edgeOpacity = GEOMETRY.edgeOpacityDefault,
  showLabels = true,
  colorScheme = 'cyan',
  layout = 'force',
  cvdMode = 'normal',
  externalPositions,
  zoomLevel,
  groupColors,
  signalRange,
}: ForceGraph3DProps) {
  const positions = useMemo(() => {
    if (externalPositions) {
      const map = new Map<string, THREE.Vector3>()
      for (const [id, [x, y, z]] of externalPositions) {
        map.set(id, new THREE.Vector3(x, y, z))
      }
      return map
    }
    return computeLayoutForMode(layout, nodes, edges)
  }, [layout, nodes, edges, externalPositions])

  // Theme-aware group colors — prop overrides the constant
  const resolvedGroupColors = groupColors ?? GROUP_COLORS

  const edgeColor = colorScheme === 'gold' ? COLORS.gold : colorScheme === 'mixed' ? COLORS.textSecondary : COLORS.cyan

  // Compute value range for perceptual sizing (node.value path)
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity, max = -Infinity
    for (const n of nodes) {
      const v = n.value ?? 1
      if (v < min) min = v
      if (v > max) max = v
    }
    return { minVal: min, maxVal: max }
  }, [nodes])

  // Compute signal strength range for encoding path (auto-derived or from prop)
  const { signalMin, signalMax } = useMemo(() => {
    if (signalRange) return { signalMin: signalRange.min, signalMax: signalRange.max }
    let min = Infinity, max = -Infinity
    let found = false
    for (const n of nodes) {
      const s = n.encoding?.signalStrength
      if (s !== undefined) {
        found = true
        if (s < min) min = s
        if (s > max) max = s
      }
    }
    return found ? { signalMin: min, signalMax: max } : { signalMin: 0, signalMax: 1 }
  }, [nodes, signalRange])

  // Use instanced rendering for large datasets (>50 nodes)
  const useInstanced = nodes.length > 50

  // Build instanced node data
  const instancedNodes = useMemo(() => {
    if (!useInstanced) return []
    return nodes.map((node) => {
      const pos = positions.get(node.id)
      return {
        id: node.id,
        position: (pos ? [pos.x, pos.y, pos.z] : [0, 0, 0]) as [number, number, number],
        value: node.value ?? 1,
        confidence: node.confidence ?? 1.0,
        color: node.color ?? resolvedGroupColors[node.group ?? 'default'] ?? resolvedGroupColors.default ?? GROUP_COLORS.default,
      }
    })
  }, [nodes, positions, useInstanced, resolvedGroupColors])

  return (
    <group>
      {/* Edges — animated energy tubes for small graphs, Line fallback for large */}
      {edges.map((edge, i) => {
        const start = positions.get(edge.source)
        const end = positions.get(edge.target)
        if (!start || !end) return null
        if (edges.length <= 100) {
          return (
            <EnergyEdge
              key={`edge-${i}`}
              start={start}
              end={end}
              weight={edge.weight ?? 1}
              color={edgeColor}
              opacity={edgeOpacity * ARC.opacityMultiplier}
            />
          )
        }
        return (
          <GraphEdgeLine
            key={`edge-${i}`}
            start={start}
            end={end}
            weight={edge.weight ?? 1}
            opacity={edgeOpacity}
            color={edgeColor}
          />
        )
      })}

      {/* Nodes — instanced for large datasets, individual for small */}
      {useInstanced ? (
        <InstancedSignalCloud
          nodes={instancedNodes}
          minValue={minVal}
          maxValue={maxVal}
        />
      ) : (
        nodes.map((node) => {
          const pos = positions.get(node.id)
          if (!pos) return null
          // Encoding-aware size: signalStrength takes precedence over node.value
          const signalStr = node.encoding?.signalStrength
          const pSize = signalStr !== undefined
            ? perceptualRadius(signalStr, signalMin, signalMax, 0.15, 1.0)
            : perceptualRadius(node.value ?? 1, minVal, maxVal, nodeSize * 0.5, nodeSize * 2)
          const color = node.color ?? resolvedGroupColors[node.group ?? 'default'] ?? resolvedGroupColors.default ?? GROUP_COLORS.default
          if (zoomLevel !== undefined) {
            return (
              <AdaptiveNode
                key={node.id}
                position={pos}
                label={node.label}
                size={pSize}
                color={color}
                zoomLevel={zoomLevel}
                onClick={onNodeClick ? () => onNodeClick(node) : undefined}
              />
            )
          }
          return (
            <GraphNodeMesh
              key={node.id}
              node={node}
              position={pos}
              size={pSize}
              showLabel={showLabels}
              cvdMode={cvdMode}
              onClick={onNodeClick}
              groupColors={resolvedGroupColors}
            />
          )
        })
      )}
    </group>
  )
}
