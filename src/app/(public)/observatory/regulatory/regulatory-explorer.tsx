'use client'

import { useState, useCallback, useMemo } from 'react'
import { useExplorerEffects } from '@/lib/observatory/use-explorer-effects'
import { useObservatoryPreferences } from '@/lib/observatory/use-observatory-preferences'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Scale, Loader2, AlertTriangle } from 'lucide-react'
import type { GraphNode, GraphLayout } from '@/components/observatory'
import { STRINGS, CAMERA, LAYOUT } from '@/components/observatory'
import { useCVDMode } from '@/components/observatory/cvd-geometry'
import type { SemanticZoomLevel } from '@/lib/observatory/types'
import { ZoomLevelBridge, CVD_OPTIONS, ZOOM_LEVEL_LABELS, ExplorerNav } from '@/components/observatory/explorer-shared'
import { useRegulatoryData } from './use-regulatory-data'

// ─── Dynamic Imports ──────────────────────────────────────────────────────────

const SceneContainer = dynamic(
  () => import('@/components/observatory/scene-container').then(m => ({ default: m.SceneContainer })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center border border-nex-border bg-nex-surface animate-pulse">
        <p className="text-xs text-slate-dim/50 font-mono">Loading 3D scene...</p>
      </div>
    ),
  },
)
const ForceGraph3D = dynamic(
  () => import('@/components/observatory/force-graph-3d').then(m => ({ default: m.ForceGraph3D })),
  { ssr: false },
)

// ─── Phase Legend ─────────────────────────────────────────────────────────────

const PHASE_COLORS: { label: string; color: string }[] = [
  { label: 'Pre-clinical', color: '#818cf8' },
  { label: 'Phase 1',      color: '#06b6d4' },
  { label: 'Phase 2',      color: '#22c55e' },
  { label: 'Phase 3',      color: '#eab308' },
  { label: 'NDA',          color: '#f97316' },
  { label: 'Approval',     color: '#ef4444' },
  { label: 'Post-market',  color: '#a855f7' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function RegulatoryExplorer() {
  const [drug, setDrug] = useState('')
  const { data, loading, error, refetch } = useRegulatoryData(drug)
  const [selected, setSelected]       = useState<GraphNode | null>(null)
  const [graphLayout, setGraphLayout] = useState<GraphLayout>('force')
  const [cvdMode, setCvdMode]         = useCVDMode()
  const [zoomLevel, setZoomLevel]     = useState<SemanticZoomLevel>(2)

  const { preferences } = useObservatoryPreferences()
  const {
    enableBloom, setEnableBloom,
    enableSSAO, setEnableSSAO,
    enableVignette, setEnableVignette,
    enableDoF, setEnableDoF,
    enableChromaticAberration, setEnableChromaticAberration,
    postProcessing, theme,
  } = useExplorerEffects()

  const metrics = useMemo(() => {
    if (!data) return { nodes: 0, edges: 0, density: 0, avgDegree: 0 }
    const n = data.nodes.length
    const e = data.edges.length
    const maxEdges = n * (n - 1) / 2
    const density  = maxEdges > 0 ? e / maxEdges : 0
    const avgDegree = n > 0 ? (2 * e) / n : 0
    return { nodes: n, edges: e, density, avgDegree }
  }, [data])

  const handleNodeClick  = useCallback((node: GraphNode) => { setSelected(node) }, [])
  const handleZoomChange = useCallback((level: SemanticZoomLevel) => { setZoomLevel(level) }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">

      {/* Header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <Link
            href="/observatory"
            className="text-slate-dim/70 hover:text-amber-400 transition-colors text-sm"
          >
            Observatory
          </Link>
          <span className="text-nex-light">/</span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-amber-500/30 bg-amber-500/5">
            <Scale className="h-4 w-4 text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-amber-400/70">
              {STRINGS.brandSubtitle}
            </p>
            <h1 className="text-sm font-semibold text-white">Regulatory Pathway</h1>
          </div>
        </div>
      </header>

      <ExplorerNav current="regulatory" />

      {/* Drug Input */}
      <div className="mb-golden-3">
        <label htmlFor="regulatory-drug-input" className="sr-only">
          Drug name for regulatory pathway search
        </label>
        <input
          id="regulatory-drug-input"
          type="text"
          value={drug}
          onChange={(e) => setDrug(e.target.value)}
          placeholder="Enter drug name..."
          className="w-full max-w-sm bg-nex-surface border border-amber-500/30 px-3 py-1.5 text-sm text-white placeholder:text-slate-dim/50 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 font-mono transition-colors"
        />
        <p className="mt-1 text-[10px] font-mono text-slate-dim/50">
          Type 2+ characters to search FDA guidelines. Demo DAG shown by default.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-golden-2 mb-golden-3">
          <Loader2 className="h-4 w-4 text-amber-400 animate-spin" aria-hidden="true" />
          <span className="text-sm text-slate-dim/70">Searching regulatory guidelines...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-center gap-golden-2 mb-golden-3 p-golden-2 border border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <span className="text-sm text-amber-400/90">{error} — showing demo data</span>
          <button
            onClick={refetch}
            className="text-sm text-amber-400 hover:text-white transition-colors ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {/* View Mode */}
          <div className="flex items-center gap-golden-1 mb-golden-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">View</span>
            {(['force', 'hierarchy', 'radial'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setGraphLayout(mode)}
                aria-pressed={graphLayout === mode}
                className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  graphLayout === mode
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-amber-500/30 hover:text-white'
                }`}
              >
                {mode === 'force' ? 'Force' : mode === 'hierarchy' ? 'Timeline' : 'Radial'}
              </button>
            ))}
          </div>

          {/* Effects + CVD */}
          <div className="flex items-center gap-golden-1 mb-golden-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">Effects</span>
            {(
              [
                { key: 'bloom',    label: 'Bloom',    value: enableBloom,               set: setEnableBloom },
                { key: 'ssao',     label: 'SSAO',     value: enableSSAO,                set: setEnableSSAO },
                { key: 'vignette', label: 'Vignette', value: enableVignette,            set: setEnableVignette },
                { key: 'dof',      label: 'DoF',      value: enableDoF,                 set: setEnableDoF },
                { key: 'ca',       label: 'CA',       value: enableChromaticAberration, set: setEnableChromaticAberration },
              ] satisfies { key: string; label: string; value: boolean; set: (v: boolean) => void }[]
            ).map(({ key, label, value, set }) => (
              <button
                key={key}
                onClick={() => set(!value)}
                aria-pressed={value}
                className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  value
                    ? 'bg-cyan/20 text-cyan border border-cyan/40'
                    : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-cyan/30 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 ml-golden-2 mr-golden-1">Color Vision</span>
            {CVD_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCvdMode(value)}
                aria-pressed={cvdMode === value}
                className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  cvdMode === value
                    ? 'bg-violet/20 text-violet border border-violet/40'
                    : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-violet/30 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 3D Scene */}
          <div style={{ height: LAYOUT.sceneHeightCSS }}>
            <SceneContainer
              sceneLabel="3D regulatory pathway visualization showing FDA approval milestones and dependencies"
              cameraPosition={
                graphLayout === 'hierarchy' ? [0, 3, 24] :
                graphLayout === 'radial'    ? [0, 10, 10] :
                [...CAMERA.graphPosition]
              }
              postProcessing={postProcessing}
              enableBloom={enableBloom}
              enableSSAO={enableSSAO}
              enableVignette={enableVignette}
              enableDoF={enableDoF}
              enableChromaticAberration={enableChromaticAberration}
              theme={theme}
              atmosphereId={
                preferences.atmosphere !== 'auto'
                  ? preferences.atmosphere as 'deep-space' | 'clinical' | 'war-room' | 'blueprint'
                  : undefined
              }
            >
              <ZoomLevelBridge onZoomChange={handleZoomChange} />
              <ForceGraph3D
                nodes={data.nodes}
                edges={data.edges}
                onNodeClick={handleNodeClick}
                colorScheme="mixed"
                layout={graphLayout}
                cvdMode={cvdMode}
                zoomLevel={zoomLevel}
                groupColors={theme.groupColors}
              />
            </SceneContainer>
          </div>

          {/* Graph Metrics */}
          <div className="mt-golden-3 grid grid-cols-2 md:grid-cols-5 gap-golden-2">
            <div className="border border-amber-500/20 bg-amber-500/5 p-golden-1">
              <span className="text-[10px] font-mono uppercase text-amber-400/70">Milestones |V|</span>
              <p className="text-lg font-semibold text-white">{metrics.nodes}</p>
            </div>
            <div className="border border-amber-500/20 bg-amber-500/5 p-golden-1">
              <span className="text-[10px] font-mono uppercase text-amber-400/70">Dependencies |E|</span>
              <p className="text-lg font-semibold text-white">{metrics.edges}</p>
            </div>
            <div className="border border-amber-500/20 bg-amber-500/5 p-golden-1">
              <span className="text-[10px] font-mono uppercase text-amber-400/70">Density</span>
              <p className="text-lg font-semibold text-white">{metrics.density.toFixed(3)}</p>
            </div>
            <div className="border border-amber-500/20 bg-amber-500/5 p-golden-1">
              <span className="text-[10px] font-mono uppercase text-amber-400/70">Avg Degree</span>
              <p className="text-lg font-semibold text-white">{metrics.avgDegree.toFixed(1)}</p>
            </div>
            <div className="border border-violet/20 bg-violet/5 p-golden-1">
              <span className="text-[10px] font-mono uppercase text-violet/70">Zoom</span>
              <p className="text-sm font-semibold text-white">{zoomLevel} — {ZOOM_LEVEL_LABELS[zoomLevel]}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-golden-2 border border-nex-light bg-nex-surface p-golden-2">
            <p className="text-sm text-slate-dim/70 leading-golden">{data.description}</p>
          </div>

          {/* STEM Grounding */}
          {data.stem && (
            <div className="mt-golden-2 border border-amber-500/20 bg-amber-500/5 p-golden-2">
              <div className="flex items-center gap-golden-1 mb-golden-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/60">STEM Grounding</span>
                <span className="text-[10px] font-mono text-amber-400/60">{data.stem.crate}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-golden-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">Trait</span>
                  <span className="text-sm font-semibold text-white">{data.stem.trait}</span>
                  <span className="text-xs text-slate-dim/70 block">
                    {data.stem.domain} &middot; {data.stem.t1}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">Transfer</span>
                  <span className="text-xs text-slate-dim/70 leading-golden">{data.stem.transfer}</span>
                </div>
              </div>
              <div className="mt-golden-1 flex items-center gap-golden-1 flex-wrap">
                <span className="text-[10px] font-mono uppercase text-slate-dim/70">MCP Tools:</span>
                {data.stem.tools.map((t) => (
                  <code
                    key={t}
                    className="text-[10px] font-mono px-1.5 py-0.5 bg-nex-surface border border-nex-light text-amber-400/70"
                  >
                    {t}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Selection Panel */}
          {selected && (
            <div className="mt-golden-2 p-golden-2 border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-golden-2">
                <div className="w-3 h-3" style={{ backgroundColor: selected.color ?? '#f59e0b' }} />
                <span className="text-base font-semibold text-white">{selected.label}</span>
                <span className="text-xs px-2 py-0.5 border border-nex-light bg-nex-surface text-slate-dim/70">
                  {selected.group}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Dismiss selection"
                  className="ml-auto text-slate-dim/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 px-1"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <p className="text-sm text-slate-dim/70 mt-golden-1">
                Dependencies: {data.edges.filter(e => e.source === selected.id || e.target === selected.id).length} |
                Relevance: {selected.value?.toFixed(2)}
              </p>
            </div>
          )}

          {/* Phase Legend */}
          <div className="mt-golden-3 flex flex-wrap gap-golden-3 text-sm text-slate-dim/70">
            {PHASE_COLORS.map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3" style={{ backgroundColor: color }} />
                {label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
