/**
 * Web Worker — Barnes-Hut Force-Directed Layout Engine
 *
 * Section 2.4 of the Observatory 3D Rendering Architecture.
 *
 * Runs entirely off the main thread. Receives node/edge data via
 * postMessage, computes O(n log n) force-directed positions using
 * an octree for spatial partitioning.
 *
 * Message protocol:
 *   init  → { type: 'init', nodes, edges, config }
 *   tick  → { type: 'tick' }
 *   configure → { type: 'configure', config }
 *
 * Outputs:
 *   positions → { type: 'positions', positions: Float32Array, converged: boolean }
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LayoutConfig {
  algorithm: 'barnes-hut' | 'simple'
  repulsion: number
  attraction: number
  damping: number
  barnesHutTheta: number
  maxIterations: number
  convergenceThreshold: number
}

export interface LayoutMessage {
  type: 'init' | 'tick' | 'configure'
  nodes?: Array<{ id: string; mass: number }>
  edges?: Array<{ source: number; target: number; weight: number }>
  config?: Partial<LayoutConfig>
}

export interface LayoutResult {
  type: 'positions'
  positions: Float32Array
  converged: boolean
  iteration: number
}

// ─── Default Config ──────────────────────────────────────────────────────────

const DEFAULT_CONFIG: LayoutConfig = {
  algorithm: 'barnes-hut',
  repulsion: 2.0,
  attraction: 0.05,
  damping: 0.95,
  barnesHutTheta: 0.5,
  maxIterations: 300,
  convergenceThreshold: 0.001,
}

// ─── Octree Node ─────────────────────────────────────────────────────────────

interface OctreeNode {
  centerX: number
  centerY: number
  centerZ: number
  halfSize: number
  mass: number
  comX: number
  comY: number
  comZ: number
  bodyIndex: number // -1 if internal node
  children: (OctreeNode | null)[]
}

function createOctreeNode(cx: number, cy: number, cz: number, halfSize: number): OctreeNode {
  return {
    centerX: cx,
    centerY: cy,
    centerZ: cz,
    halfSize,
    mass: 0,
    comX: 0,
    comY: 0,
    comZ: 0,
    bodyIndex: -1,
    children: [null, null, null, null, null, null, null, null],
  }
}

function octant(node: OctreeNode, x: number, y: number, z: number): number {
  let idx = 0
  if (x > node.centerX) idx |= 1
  if (y > node.centerY) idx |= 2
  if (z > node.centerZ) idx |= 4
  return idx
}

function insertBody(
  node: OctreeNode,
  index: number,
  x: number,
  y: number,
  z: number,
  mass: number,
  depth: number,
): void {
  if (depth > 40) return // Safety limit

  if (node.mass === 0 && node.bodyIndex === -1) {
    // Empty leaf — place body here
    node.bodyIndex = index
    node.mass = mass
    node.comX = x
    node.comY = y
    node.comZ = z
    return
  }

  if (node.bodyIndex !== -1) {
    // Leaf with existing body — subdivide
    const existingIdx = node.bodyIndex
    const ex = node.comX
    const ey = node.comY
    const ez = node.comZ
    const em = node.mass

    node.bodyIndex = -1

    // Re-insert existing body
    const eOct = octant(node, ex, ey, ez)
    const hs = node.halfSize / 2
    if (node.children[eOct] === null) {
      node.children[eOct] = createOctreeNode(
        node.centerX + (eOct & 1 ? hs : -hs),
        node.centerY + (eOct & 2 ? hs : -hs),
        node.centerZ + (eOct & 4 ? hs : -hs),
        hs,
      )
    }
    const eChild = node.children[eOct]
    if (eChild) insertBody(eChild, existingIdx, ex, ey, ez, em, depth + 1)
  }

  // Insert new body
  const oct = octant(node, x, y, z)
  const hs = node.halfSize / 2
  if (node.children[oct] === null) {
    node.children[oct] = createOctreeNode(
      node.centerX + (oct & 1 ? hs : -hs),
      node.centerY + (oct & 2 ? hs : -hs),
      node.centerZ + (oct & 4 ? hs : -hs),
      hs,
    )
  }
  const child = node.children[oct]
  if (child) insertBody(child, index, x, y, z, mass, depth + 1)

  // Update center of mass
  const totalMass = node.mass + mass
  node.comX = (node.comX * node.mass + x * mass) / totalMass
  node.comY = (node.comY * node.mass + y * mass) / totalMass
  node.comZ = (node.comZ * node.mass + z * mass) / totalMass
  node.mass = totalMass
}

// ─── Barnes-Hut Force Calculation ────────────────────────────────────────────

function computeForceBarnesHut(
  nodeIndex: number,
  tree: OctreeNode,
  positions: Float32Array,
  forces: Float32Array,
  theta: number,
  repulsion: number,
): void {
  const px = positions[nodeIndex * 3]
  const py = positions[nodeIndex * 3 + 1]
  const pz = positions[nodeIndex * 3 + 2]

  function traverse(treeNode: OctreeNode): void {
    if (treeNode.mass === 0) return

    const dx = treeNode.comX - px
    const dy = treeNode.comY - py
    const dz = treeNode.comZ - pz
    const distSq = dx * dx + dy * dy + dz * dz + 0.01 // Softening
    const dist = Math.sqrt(distSq)

    // Single body or far enough to approximate
    if (treeNode.bodyIndex !== -1 && treeNode.bodyIndex !== nodeIndex) {
      const force = -repulsion * treeNode.mass / distSq
      forces[nodeIndex * 3] += force * dx / dist
      forces[nodeIndex * 3 + 1] += force * dy / dist
      forces[nodeIndex * 3 + 2] += force * dz / dist
      return
    }

    if (treeNode.bodyIndex === nodeIndex) return

    // Barnes-Hut criterion: s/d < theta → treat as single body
    const s = treeNode.halfSize * 2
    if (s / dist < theta) {
      const force = -repulsion * treeNode.mass / distSq
      forces[nodeIndex * 3] += force * dx / dist
      forces[nodeIndex * 3 + 1] += force * dy / dist
      forces[nodeIndex * 3 + 2] += force * dz / dist
      return
    }

    // Otherwise recurse into children
    for (const child of treeNode.children) {
      if (child !== null) traverse(child)
    }
  }

  traverse(tree)
}

// ─── Worker State ────────────────────────────────────────────────────────────

let positions: Float32Array = new Float32Array(0)
let velocities: Float32Array = new Float32Array(0)
let forces: Float32Array = new Float32Array(0)
let masses: Float32Array = new Float32Array(0)
let edges: Array<{ source: number; target: number; weight: number }> = []
let config: LayoutConfig = { ...DEFAULT_CONFIG }
let nodeCount = 0
let iteration = 0

function init(
  nodes: Array<{ id: string; mass: number }>,
  edgeList: Array<{ source: number; target: number; weight: number }>,
  cfg: Partial<LayoutConfig>,
): void {
  config = { ...DEFAULT_CONFIG, ...cfg }
  nodeCount = nodes.length
  positions = new Float32Array(nodeCount * 3)
  velocities = new Float32Array(nodeCount * 3)
  forces = new Float32Array(nodeCount * 3)
  masses = new Float32Array(nodeCount)
  edges = edgeList
  iteration = 0

  // Fibonacci sphere initial placement
  for (let i = 0; i < nodeCount; i++) {
    masses[i] = nodes[i].mass
    const phi = Math.acos(1 - (2 * (i + 0.5)) / nodeCount)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const r = 3 + masses[i] * 0.5
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
}

function tick(): { positions: Float32Array; converged: boolean } {
  // Reset forces
  forces.fill(0)

  // Build octree
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (let i = 0; i < nodeCount; i++) {
    const x = positions[i * 3]
    const y = positions[i * 3 + 1]
    const z = positions[i * 3 + 2]
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
  }

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const cz = (minZ + maxZ) / 2
  const halfSize = Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2 + 1

  const tree = createOctreeNode(cx, cy, cz, halfSize)

  for (let i = 0; i < nodeCount; i++) {
    insertBody(tree, i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2], masses[i], 0)
  }

  // Repulsion via Barnes-Hut
  for (let i = 0; i < nodeCount; i++) {
    computeForceBarnesHut(i, tree, positions, forces, config.barnesHutTheta, config.repulsion)
  }

  // Attraction along edges
  for (const edge of edges) {
    const si = edge.source * 3
    const ti = edge.target * 3
    const dx = positions[ti] - positions[si]
    const dy = positions[ti + 1] - positions[si + 1]
    const dz = positions[ti + 2] - positions[si + 2]
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (dist < 0.01) continue

    const targetDist = 2 // Target edge length
    const f = config.attraction * (dist - targetDist) * edge.weight
    const fx = f * dx / dist
    const fy = f * dy / dist
    const fz = f * dz / dist

    forces[si] += fx; forces[si + 1] += fy; forces[si + 2] += fz
    forces[ti] -= fx; forces[ti + 1] -= fy; forces[ti + 2] -= fz
  }

  // Apply forces with damping
  let totalDelta = 0
  for (let i = 0; i < nodeCount; i++) {
    const idx = i * 3
    velocities[idx] = (velocities[idx] + forces[idx]) * config.damping
    velocities[idx + 1] = (velocities[idx + 1] + forces[idx + 1]) * config.damping
    velocities[idx + 2] = (velocities[idx + 2] + forces[idx + 2]) * config.damping

    positions[idx] += velocities[idx]
    positions[idx + 1] += velocities[idx + 1]
    positions[idx + 2] += velocities[idx + 2]

    totalDelta += Math.abs(velocities[idx]) + Math.abs(velocities[idx + 1]) + Math.abs(velocities[idx + 2])
  }

  iteration++
  const converged = totalDelta < config.convergenceThreshold || iteration >= config.maxIterations

  return { positions: new Float32Array(positions), converged }
}

// ─── Message Handler ─────────────────────────────────────────────────────────

const ctx: Worker = self as unknown as Worker

ctx.onmessage = (e: MessageEvent<LayoutMessage>) => {
  const msg = e.data

  switch (msg.type) {
    case 'init':
      if (msg.nodes && msg.edges) {
        init(msg.nodes, msg.edges, msg.config ?? {})
        // Run first tick immediately
        const result = tick()
        ctx.postMessage({
          type: 'positions',
          positions: result.positions,
          converged: result.converged,
          iteration,
        } satisfies LayoutResult, { transfer: [result.positions.buffer] })
      }
      break

    case 'tick': {
      const result = tick()
      ctx.postMessage({
        type: 'positions',
        positions: result.positions,
        converged: result.converged,
        iteration,
      } satisfies LayoutResult, { transfer: [result.positions.buffer] })
      break
    }

    case 'configure':
      if (msg.config) {
        config = { ...config, ...msg.config }
      }
      break
  }
}
