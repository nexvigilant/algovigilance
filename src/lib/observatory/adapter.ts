/**
 * Observatory Adapter Interface — Generalized contract for data source → 3D scene mapping.
 *
 * Every explorer's data adapter implements this interface. The adapter:
 * 1. Fetches raw data from a NexCore REST endpoint via /api/nexcore/ proxy
 * 2. Transforms domain-specific response into Observatory graph/surface format
 * 3. Returns a typed Dataset with STEM provenance metadata
 *
 * Primitive formula: adapter = μ(→) — mapping applied to causal data flow.
 */

import type { GraphNode, GraphEdge } from '@/components/observatory'
import type { ObservatoryExplorerType } from './explorer-registry'

// ─── STEM Provenance ────────────────────────────────────────────────────────

export interface DatasetStem {
  /** STEM cognitive trait: Classify, Relate, Sequence, Measure, Model, Transform */
  trait: string
  /** STEM domain: Science, Technology, Engineering, Mathematics */
  domain: string
  /** T1 primitive in play */
  t1: string
  /** Cross-domain transfer description */
  transfer: string
  /** Source Rust crate */
  crate: string
  /** MCP tools invoked by the backend */
  tools: string[]
}

// ─── Unified Dataset ────────────────────────────────────────────────────────

export interface ObservatoryDataset {
  /** Display label for the dataset */
  label: string
  /** Human-readable description */
  description: string
  /** Graph nodes (for ForceGraph3D / StateOrbit3D / SurfacePlot3D) */
  nodes: GraphNode[]
  /** Graph edges (for ForceGraph3D) */
  edges: GraphEdge[]
  /** Spatial dimensionality */
  dimension: number
  /** STEM provenance metadata */
  stem: DatasetStem
  /** Which explorer this dataset is designed for */
  explorerType: ObservatoryExplorerType
}

// ─── Adapter Contract ───────────────────────────────────────────────────────

export interface ObservatoryAdapter<TParams = void, TResponse = unknown> {
  /** Unique identifier matching the explorer type */
  explorerType: ObservatoryExplorerType
  /** NexCore API endpoint path (after /api/nexcore/) */
  endpoint: string
  /** Fetch raw data from the backend */
  fetch: (params: TParams, signal?: AbortSignal) => Promise<TResponse>
  /** Transform backend response into Observatory dataset */
  transform: (response: TResponse) => ObservatoryDataset
}

// ─── Adapter Factory ────────────────────────────────────────────────────────

/**
 * Create a standardized adapter that fetches from /api/nexcore/{path}
 * and transforms the response into an ObservatoryDataset.
 */
export function createAdapter<TParams, TResponse>(config: {
  explorerType: ObservatoryExplorerType
  endpoint: string
  buildQuery: (params: TParams) => string
  transform: (response: TResponse) => ObservatoryDataset
}): ObservatoryAdapter<TParams, TResponse> {
  return {
    explorerType: config.explorerType,
    endpoint: config.endpoint,
    fetch: async (params: TParams, signal?: AbortSignal): Promise<TResponse> => {
      const query = config.buildQuery(params)
      const res = await fetch(
        `/api/nexcore/${config.endpoint}${query ? `?${query}` : ''}`,
        { signal },
      )
      if (!res.ok) {
        throw new Error(`${config.explorerType} adapter: ${res.status}`)
      }
      return res.json() as Promise<TResponse>
    },
    transform: config.transform,
  }
}
