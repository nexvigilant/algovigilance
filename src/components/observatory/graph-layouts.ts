/**
 * Graph Layout Algorithms — Pure computation, no React dependency.
 *
 * Extracted from force-graph-3d.tsx for the 500-line file limit.
 */

import * as THREE from 'three'
import { PHYSICS } from './observatory-constants'
import type { GraphNode, GraphEdge, GraphLayout } from './force-graph-3d'

// ─── Helpers ────────────────────────────────────────────────────────────────

export function seededRandom(seed: number) {
  let h = seed | 0
  h = ((h >> 16) ^ h) * 0x45d9f3b
  h = ((h >> 16) ^ h) * 0x45d9f3b
  h = (h >> 16) ^ h
  const x = Math.sin(h) * 10000
  return x - Math.floor(x)
}

export function hashString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0
  }
  return hash
}

// ─── Force-Directed Layout ──────────────────────────────────────────────────

function computeLayout(nodes: GraphNode[], edges: GraphEdge[]): Map<string, THREE.Vector3> {
  const positions = new Map<string, THREE.Vector3>()
  const n = nodes.length

  nodes.forEach((node, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const r = PHYSICS.baseSphereRadius + (node.value ?? 1) * PHYSICS.valueSizeMultiplier
    positions.set(node.id, new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ))
  })

  const diff = new THREE.Vector3()
  const forceVec = new THREE.Vector3()

  for (let iter = 0; iter < PHYSICS.iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const pi = positions.get(nodes[i].id);
        const pj = positions.get(nodes[j].id);
        if (!pi || !pj) continue;
        diff.subVectors(pi, pj)
        const dist = Math.max(diff.length(), PHYSICS.minDistance)
        diff.normalize().multiplyScalar(PHYSICS.repulsionStrength / (dist * dist))
        forceVec.copy(diff).multiplyScalar(PHYSICS.forceApplyFactor)
        pi.add(forceVec)
        forceVec.copy(diff).multiplyScalar(PHYSICS.forceApplyFactor)
        pj.sub(forceVec)
      }
    }

    for (const edge of edges) {
      const ps = positions.get(edge.source)
      const pt = positions.get(edge.target)
      if (!ps || !pt) continue
      diff.subVectors(pt, ps)
      const dist = diff.length()
      diff.normalize().multiplyScalar((dist - PHYSICS.targetEdgeLength) * PHYSICS.springConstant)
      forceVec.copy(diff).multiplyScalar(PHYSICS.forceApplyFactor)
      ps.add(forceVec)
      forceVec.copy(diff).multiplyScalar(PHYSICS.forceApplyFactor)
      pt.sub(forceVec)
    }
  }

  return positions
}

// ─── Hierarchy Layout (DAG layers) ──────────────────────────────────────────

const BASE_LAYER_ORDER: Readonly<Record<string, number>> = {
  foundation: 0, domain: 1, orchestration: 2, service: 3,
  source: 0, detection: 1, assessment: 2, action: 3, outcome: 4,
} as const

function computeHierarchyLayout(nodes: GraphNode[], _edges: GraphEdge[]): Map<string, THREE.Vector3> {
  const positions = new Map<string, THREE.Vector3>()
  const layerOrder: Record<string, number> = { ...BASE_LAYER_ORDER }
  let nextLayer = Object.keys(layerOrder).length

  const layers = new Map<number, GraphNode[]>()

  for (const node of nodes) {
    const group = (node.group ?? 'default').toLowerCase()
    let layer = layerOrder[group]
    if (layer === undefined) {
      layerOrder[group] = nextLayer
      layer = nextLayer
      nextLayer++
    }
    const existing = layers.get(layer) ?? []
    existing.push(node)
    layers.set(layer, existing)
  }

  const sortedLayers = Array.from(layers.entries()).sort((a, b) => a[0] - b[0])
  const totalLayers = sortedLayers.length
  const layerSpacing = 3.5
  const totalHeight = (totalLayers - 1) * layerSpacing
  const yOffset = totalHeight / 2

  for (let li = 0; li < totalLayers; li++) {
    const [, layerNodes] = sortedLayers[li]
    const y = (totalLayers - 1 - li) * layerSpacing - yOffset
    const count = layerNodes.length
    const spread = Math.max(count - 1, 1) * 2

    for (let ni = 0; ni < count; ni++) {
      const x = count === 1 ? 0 : -spread / 2 + ni * (spread / (count - 1))
      const z = (Math.sin(ni * 1.7) * 0.5)
      positions.set(layerNodes[ni].id, new THREE.Vector3(x, y, z))
    }
  }

  return positions
}

// ─── Radial Layout (concentric rings) ───────────────────────────────────────

function computeRadialLayout(nodes: GraphNode[], _edges: GraphEdge[]): Map<string, THREE.Vector3> {
  const positions = new Map<string, THREE.Vector3>()
  const layerOrder: Record<string, number> = { ...BASE_LAYER_ORDER }
  let nextLayer = Object.keys(layerOrder).length

  const layers = new Map<number, GraphNode[]>()

  for (const node of nodes) {
    const group = (node.group ?? 'default').toLowerCase()
    let layer = layerOrder[group]
    if (layer === undefined) {
      layerOrder[group] = nextLayer
      layer = nextLayer
      nextLayer++
    }
    const existing = layers.get(layer) ?? []
    existing.push(node)
    layers.set(layer, existing)
  }

  const sortedLayers = Array.from(layers.entries()).sort((a, b) => a[0] - b[0])
  const ringSpacing = 2.5

  for (let li = 0; li < sortedLayers.length; li++) {
    const [, layerNodes] = sortedLayers[li]
    const radius = (li + 1) * ringSpacing
    const count = layerNodes.length

    for (let ni = 0; ni < count; ni++) {
      const angle = (ni / count) * Math.PI * 2
      const x = radius * Math.cos(angle)
      const z = radius * Math.sin(angle)
      const y = Math.sin(angle * 0.5) * 0.3
      positions.set(layerNodes[ni].id, new THREE.Vector3(x, y, z))
    }
  }

  return positions
}

// ─── Grid Layout ────────────────────────────────────────────────────────────

function computeGridLayout(nodes: GraphNode[], _edges: GraphEdge[]): Map<string, THREE.Vector3> {
  const positions = new Map<string, THREE.Vector3>()
  const cols = Math.ceil(Math.sqrt(nodes.length))
  const spacing = 2.5

  for (let i = 0; i < nodes.length; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    const x = (col - (cols - 1) / 2) * spacing
    const z = (row - (Math.ceil(nodes.length / cols) - 1) / 2) * spacing
    positions.set(nodes[i].id, new THREE.Vector3(x, 0, z))
  }

  return positions
}

// ─── Layout Dispatcher ──────────────────────────────────────────────────────

export function computeLayoutForMode(
  mode: GraphLayout,
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, THREE.Vector3> {
  switch (mode) {
    case 'hierarchy': return computeHierarchyLayout(nodes, edges)
    case 'radial': return computeRadialLayout(nodes, edges)
    case 'grid': return computeGridLayout(nodes, edges)
    case 'force':
    default: return computeLayout(nodes, edges)
  }
}
