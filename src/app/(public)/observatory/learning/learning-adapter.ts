/**
 * Learning Adapter — Maps Rust learning_dag_resolve API response to Observatory Dataset.
 *
 * Node layout:
 *   Vertical (Y) = topological level (competency depth)
 *   Horizontal (X/Z) = topic clusters (spread within each level)
 *   Color: emerald=completed, cyan=unlocked, slate=locked
 *   Node brightness = completion_pct
 */

import type { GraphNode, GraphEdge } from '@/components/observatory'
import type { DataType } from '@/components/observatory/cvd-geometry'

// ─── Rust API Response Types ─────────────────────────────────────────────────

interface LearningDagNode {
  id: string
  label: string
  level: number
  status: 'completed' | 'unlocked' | 'locked'
  completion_pct: number
  position: { x: number; y: number; z: number }
  height: number
}

interface LearningDagEdge {
  source: string
  target: string
  required: boolean
}

export interface LearningDagResponse {
  pathway_id: string
  pathway_label: string
  total_nodes: number
  completed_count: number
  nodes: LearningDagNode[]
  edges: LearningDagEdge[]
}

// ─── Dataset Types ───────────────────────────────────────────────────────────

export interface LearningDatasetStem {
  trait: string
  domain: string
  t1: string
  transfer: string
  crate: string
  tools: string[]
}

export interface LearningDataset {
  label: string
  description: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  dimension: number
  stem: LearningDatasetStem
}

// ─── Color Assignment ────────────────────────────────────────────────────────

function statusColor(status: string, completionPct: number): string {
  if (status === 'completed') return '#10b981' // emerald
  if (status === 'unlocked') {
    // Blend from cyan to emerald based on progress
    const t = completionPct / 100
    const r = Math.round(6 + t * (16 - 6))
    const g = Math.round(182 + t * (185 - 182))
    const b = Math.round(212 + t * (129 - 212))
    return `rgb(${r}, ${g}, ${b})`
  }
  return '#475569' // slate-600 for locked
}

// ─── Build Dataset ───────────────────────────────────────────────────────────

export function buildLearningDataset(data: LearningDagResponse): LearningDataset {
  const nodes: GraphNode[] = data.nodes.map((node) => {
    const nodeValue = 0.6 + (node.completion_pct / 100) * 2.0

    return {
      id: node.id,
      label: node.label,
      group: node.status === 'completed' ? 'service' : node.status === 'unlocked' ? 'domain' : 'foundation',
      value: nodeValue,
      color: statusColor(node.status, node.completion_pct),
      dataType: 'learning-node' as DataType,
      fx: node.position.x,
      fy: node.position.y,
      fz: node.position.z,
    }
  })

  const edges: GraphEdge[] = data.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    weight: edge.required ? 2 : 1,
    label: edge.required ? 'required' : 'optional',
  }))

  const completionPct = data.total_nodes > 0
    ? Math.round((data.completed_count / data.total_nodes) * 100)
    : 0

  return {
    label: data.pathway_label,
    description: `${data.total_nodes} learning activities across ${new Set(data.nodes.map(n => n.level)).size} competency levels. ${completionPct}% complete (${data.completed_count}/${data.total_nodes}). Y-axis represents competency depth.`,
    nodes,
    edges,
    dimension: 3,
    stem: {
      trait: 'Sequence',
      domain: 'Science',
      t1: 'σ Sequence',
      transfer: 'Topological sort over prerequisite DAG → competency level assignment',
      crate: 'nexcore-mcp',
      tools: ['learning_dag_resolve', 'graph_layout_converge'],
    },
  }
}
