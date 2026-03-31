/**
 * Career Adapter — Maps Rust career_transitions API response to Observatory Dataset.
 *
 * Node layout:
 *   Y-axis = salary (from value-mining)
 *   X/Z = skill similarity (from force layout, Rust-computed or client-side)
 *   Color: navy=healthcare-focused, cyan=industry, gold=consulting/leadership
 *   Edge thickness = transition probability
 */

import type { GraphNode, GraphEdge } from '@/components/observatory'
import type { DataType } from '@/components/observatory/cvd-geometry'

// ─── Rust API Response Types ─────────────────────────────────────────────────

interface CareerRoleNode {
  id: string
  label: string
  ksb_count: number
  salary_median?: number
  salary_trend?: number
}

interface CareerTransitionEdge {
  source: string
  target: string
  probability: number
  difficulty: number
}

export interface CareerTransitionsResponse {
  nodes: CareerRoleNode[]
  edges: CareerTransitionEdge[]
  similarity_matrix_size: number
}

// ─── Dataset Types ───────────────────────────────────────────────────────────

export interface CareerDatasetStem {
  trait: string
  domain: string
  t1: string
  transfer: string
  crate: string
  tools: string[]
}

export interface CareerDataset {
  label: string
  description: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  dimension: number
  stem: CareerDatasetStem
}

// ─── Color Assignment ────────────────────────────────────────────────────────

function roleColor(id: string): string {
  // Leadership/executive roles → gold
  if (id.includes('director') || id.includes('chief') || id.includes('qppv')) {
    return '#eab308'
  }
  // Technical/systems roles → cyan
  if (id.includes('systems') || id.includes('analyst') || id.includes('benefit-risk')) {
    return '#06b6d4'
  }
  // Operational/clinical roles → navy/slate
  return '#7B95B5'
}

// ─── Build Dataset ───────────────────────────────────────────────────────────

export function buildCareerDataset(data: CareerTransitionsResponse): CareerDataset {
  // Normalize salary for Y-axis positioning
  const salaries = data.nodes
    .map(n => n.salary_median ?? 0)
    .filter(s => s > 0)
  const minSalary = Math.min(...salaries, 40000)
  const maxSalary = Math.max(...salaries, 200000)
  const salaryRange = maxSalary - minSalary || 1

  const nodes: GraphNode[] = data.nodes.map((role) => {
    const salaryNorm = role.salary_median
      ? (role.salary_median - minSalary) / salaryRange
      : 0.5
    const nodeValue = 0.8 + (role.ksb_count / 60) * 2.0

    return {
      id: role.id,
      label: role.label,
      group: role.salary_median && role.salary_median > 100000 ? 'service' : 'domain',
      value: nodeValue,
      color: roleColor(role.id),
      dataType: 'career-node' as DataType,
      // Store salary in custom field for Y-axis mapping
      fx: undefined,
      fy: salaryNorm * 10 - 5, // Map to [-5, 5] range for 3D space
      fz: undefined,
    }
  })

  const edges: GraphEdge[] = data.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    weight: edge.probability * 3, // Scale for visual thickness
    label: `${(edge.probability * 100).toFixed(0)}% match`,
  }))

  return {
    label: 'Career Pathways',
    description: `${data.nodes.length} pharmacovigilance career roles with ${data.edges.length} transition paths. Y-axis represents salary. Edge thickness indicates transition probability.`,
    nodes,
    edges,
    dimension: 3,
    stem: {
      trait: 'Relate',
      domain: 'Science',
      t1: 'κ Comparison',
      transfer: 'Cosine similarity over KSB component vectors → career transition probability',
      crate: 'nexcore-mcp',
      tools: ['career_transitions', 'graph_layout_converge'],
    },
  }
}
