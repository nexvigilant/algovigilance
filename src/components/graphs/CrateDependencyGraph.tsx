'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type {
  GraphNode,
  GraphEdge,
  GraphCanvasRef,
  InternalGraphNode,
  CollapseProps,
} from 'reagraph'

// ─── Dynamic import — reagraph uses WebGL (Three.js), SSR incompatible ────────
const GraphCanvas = dynamic(
  () => import('reagraph').then((m) => ({ default: m.GraphCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-cyan-400" />
        <span className="ml-2 text-sm text-slate-400">Loading graph…</span>
      </div>
    ),
  }
)

// ─── Types ────────────────────────────────────────────────────────────────────
interface CrateNodeData {
  layer: 'service' | 'orchestration' | 'domain' | 'foundation'
  description: string
}

// ─── Layer colours matching the AlgoVigilance brand palette ────────────────────
const LAYER_COLORS = {
  service: '#22d3ee',      // cyan   — service layer
  orchestration: '#fbbf24', // gold   — orchestration
  domain: '#10b981',        // emerald — domain
  foundation: '#f97316',    // orange  — foundation
} as const satisfies Record<string, string>

type LayerKey = keyof typeof LAYER_COLORS

// ─── Mock data: 6-node NexCore crate dependency graph ─────────────────────────
export const MOCK_CRATE_NODES: GraphNode[] = [
  {
    id: 'nexcore-mcp',
    label: 'nexcore-mcp',
    fill: LAYER_COLORS.service,
    size: 11,
    data: {
      layer: 'service',
      description: '458 MCP tools, 76 internal deps',
    } satisfies CrateNodeData,
  },
  {
    id: 'nexcore-api',
    label: 'nexcore-api',
    fill: LAYER_COLORS.service,
    size: 9,
    data: {
      layer: 'service',
      description: 'REST API, 84+ routes',
    } satisfies CrateNodeData,
  },
  {
    id: 'nexcore-brain',
    label: 'nexcore-brain',
    fill: LAYER_COLORS.orchestration,
    size: 8,
    data: {
      layer: 'orchestration',
      description: 'Sessions, artifacts, working memory',
    } satisfies CrateNodeData,
  },
  {
    id: 'nexcore-friday',
    label: 'nexcore-friday',
    fill: LAYER_COLORS.orchestration,
    size: 8,
    data: {
      layer: 'orchestration',
      description: 'Event bus, Vigil orchestrator',
    } satisfies CrateNodeData,
  },
  {
    id: 'nexcore-vigilance',
    label: 'nexcore-vigilance',
    fill: LAYER_COLORS.domain,
    size: 10,
    data: {
      layer: 'domain',
      description: '57 modules, 76 PVOS — domain monolith',
    } satisfies CrateNodeData,
  },
  {
    id: 'nexcore-primitives',
    label: 'nexcore-primitives',
    fill: LAYER_COLORS.foundation,
    size: 7,
    data: {
      layer: 'foundation',
      description: 'Core types, T1 Lex Primitiva',
    } satisfies CrateNodeData,
  },
]

export const MOCK_CRATE_EDGES: GraphEdge[] = [
  { id: 'e-mcp-brain',       source: 'nexcore-mcp',        target: 'nexcore-brain',       interpolation: 'curved' },
  { id: 'e-mcp-vigilance',   source: 'nexcore-mcp',        target: 'nexcore-vigilance',   interpolation: 'curved' },
  { id: 'e-mcp-primitives',  source: 'nexcore-mcp',        target: 'nexcore-primitives',  interpolation: 'curved' },
  { id: 'e-api-vigilance',   source: 'nexcore-api',        target: 'nexcore-vigilance',   interpolation: 'curved' },
  { id: 'e-api-primitives',  source: 'nexcore-api',        target: 'nexcore-primitives',  interpolation: 'curved' },
  { id: 'e-brain-vig',       source: 'nexcore-brain',      target: 'nexcore-vigilance',   interpolation: 'curved' },
  { id: 'e-brain-prim',      source: 'nexcore-brain',      target: 'nexcore-primitives',  interpolation: 'curved' },
  { id: 'e-friday-vig',      source: 'nexcore-friday',     target: 'nexcore-vigilance',   interpolation: 'curved' },
  { id: 'e-vig-prim',        source: 'nexcore-vigilance',  target: 'nexcore-primitives',  interpolation: 'curved' },
]

// ─── Props ────────────────────────────────────────────────────────────────────
export interface CrateDependencyGraphProps {
  nodes?: GraphNode[]
  edges?: GraphEdge[]
  className?: string
  /** Auto-select this node on mount (for detail page centering) */
  centerNode?: string
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CrateDependencyGraph({
  nodes = MOCK_CRATE_NODES,
  edges = MOCK_CRATE_EDGES,
  className = '',
  centerNode,
}: CrateDependencyGraphProps) {
  const graphRef = useRef<GraphCanvasRef>(null)
  const [selections, setSelections] = useState<string[]>(centerNode ? [centerNode] : [])
  const [actives, setActives] = useState<string[]>(() => {
    if (!centerNode) return []
    return edges
      .filter((e) => e.source === centerNode || e.target === centerNode)
      .flatMap((e) => [e.source, e.target])
      .filter((id) => id !== centerNode)
  })

  const selectedNode = nodes.find((n) => n.id === selections[0])
  const selectedData = selectedNode?.data as CrateNodeData | undefined

  function handleNodeClick(node: InternalGraphNode, _props?: CollapseProps) {
    setSelections((prev) =>
      prev[0] === node.id ? [] : [node.id]
    )
    // Highlight neighbours via actives
    const connected = edges
      .filter((e) => e.source === node.id || e.target === node.id)
      .flatMap((e) => [e.source, e.target])
    setActives(connected.filter((id) => id !== node.id))
  }

  function handleCanvasClick() {
    setSelections([])
    setActives([])
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Layer legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(LAYER_COLORS) as [LayerKey, string][]).map(
          ([layer, color]) => (
            <span key={layer} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs capitalize text-slate-400">{layer}</span>
            </span>
          )
        )}
      </div>

      {/* Graph viewport */}
      <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#080c18]">
        <GraphCanvas
          ref={graphRef}
          nodes={nodes}
          edges={edges}
          layoutType="forceDirected2d"
          selections={selections}
          actives={actives}
          onNodeClick={handleNodeClick}
          onCanvasClick={handleCanvasClick}
          labelType="all"
          edgeInterpolation="curved"
          draggable
          animated
        />
      </div>

      {/* Selection detail panel */}
      {selectedNode !== undefined && (
        <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3">
          <span
            className="mt-0.5 inline-block size-3 shrink-0 rounded-full"
            style={{
              backgroundColor:
                LAYER_COLORS[selectedData?.layer ?? 'foundation'],
            }}
          />
          <div>
            <p className="font-mono text-sm font-semibold text-cyan-300">
              {selectedNode.label ?? selectedNode.id}
            </p>
            {selectedData?.layer !== undefined && (
              <p className="mt-0.5 text-[11px] capitalize text-slate-500">
                {selectedData.layer} layer
              </p>
            )}
            {selectedData?.description !== undefined && (
              <p className="mt-1 text-xs text-slate-400">
                {selectedData.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
