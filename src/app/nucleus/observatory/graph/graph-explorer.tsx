'use client'

import { useState, useCallback, useMemo } from 'react'
import { useExplorerEffects } from '@/lib/observatory/use-explorer-effects'
import { useObservatoryPreferences } from '@/lib/observatory/use-observatory-preferences'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Network, Search, Loader2, AlertTriangle } from 'lucide-react'
import type { GraphNode, GraphLayout } from '@/components/observatory'
import { GROUP_COLORS, STRINGS, CAMERA, LAYOUT } from '@/components/observatory'
import { useCVDMode } from '@/components/observatory/cvd-geometry'
import type { SemanticZoomLevel } from '@/lib/observatory/types'
import { ZoomLevelBridge, CVD_OPTIONS, ZOOM_LEVEL_LABELS, ExplorerNav } from '@/components/observatory/explorer-shared'
import { DATASETS, type DatasetKey } from './graph-datasets'
import { useSignalData } from './use-signal-data'
import { useWorkerLayout } from '@/lib/observatory/use-worker-layout'

const SceneContainer = dynamic(
  () => import('@/components/observatory/scene-container').then(m => ({ default: m.SceneContainer })),
  {
    ssr: false,
    loading: () => <div className="h-[600px] flex items-center justify-center border border-nex-border bg-nex-surface animate-pulse"><p className="text-xs text-slate-dim/50 font-mono">Loading 3D scene...</p></div>,
  }
)
const ForceGraph3D = dynamic(
  () => import('@/components/observatory/force-graph-3d').then(m => ({ default: m.ForceGraph3D })),
  { ssr: false }
)

// Datasets extracted to graph-datasets.ts

export function GraphExplorer() {
  const { preferences } = useObservatoryPreferences()
  const [dataset, setDataset] = useState<DatasetKey>('nexcore-layers')
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [graphLayout, setGraphLayout] = useState<GraphLayout>(preferences.defaultLayout as GraphLayout)

  // Live FAERS data mode
  const [liveMode, setLiveMode] = useState(false)
  const [drugQuery, setDrugQuery] = useState('')
  const { data: liveData, loading: liveLoading, error: liveError } = useSignalData(liveMode ? drugQuery : '')

  // Per-effect toggles seeded from quality presets
  const {
    enableBloom, setEnableBloom,
    enableSSAO, setEnableSSAO,
    enableVignette, setEnableVignette,
    enableDoF, setEnableDoF,
    enableChromaticAberration, setEnableChromaticAberration,
    postProcessing, theme,
  } = useExplorerEffects()

  const [useGPULayout, setUseGPULayout] = useState(preferences.enableWorkerLayout)

  // CVD mode (persisted to localStorage by useCVDMode)
  const [cvdMode, setCvdMode] = useCVDMode()

  // Zoom level reported from inside Canvas via bridge
  const [zoomLevel, setZoomLevel] = useState<SemanticZoomLevel>(2)

  const staticData = useMemo(() => DATASETS[dataset], [dataset])
  const data = liveMode && liveData ? liveData : staticData
  const dataSource: 'STATIC' | 'LIVE' = liveMode && liveData ? 'LIVE' : 'STATIC'

  // Worker layout — offloads force computation to Web Worker
  const workerNodes = useMemo(() =>
    data.nodes.map(n => ({ id: n.id, mass: n.value ?? 1 })),
    [data.nodes],
  )
  const workerEdges = useMemo(() =>
    data.edges.map(e => ({ source: e.source, target: e.target, weight: e.weight ?? 1 })),
    [data.edges],
  )
  const { positionsRef: workerPositions, converged, iteration } = useWorkerLayout(
    useGPULayout ? workerNodes : [],
    useGPULayout ? workerEdges : [],
  )

  // Convert Float32Array to Map for ForceGraph3D
  const externalPositions = useMemo(() => {
    if (!useGPULayout || !converged) return undefined
    const map = new Map<string, [number, number, number]>()
    const pos = workerPositions.current
    for (let i = 0; i < workerNodes.length; i++) {
      map.set(workerNodes[i].id, [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]])
    }
    return map
  }, [useGPULayout, converged, workerNodes, workerPositions])

  const metrics = useMemo(() => {
    const n = data.nodes.length
    const e = data.edges.length
    const maxEdges = n * (n - 1) / 2
    const density = maxEdges > 0 ? e / maxEdges : 0
    const avgDegree = n > 0 ? (2 * e) / n : 0
    return { nodes: n, edges: e, density, avgDegree }
  }, [data])

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelected(node)
  }, [])

  const handleZoomChange = useCallback((level: SemanticZoomLevel) => {
    setZoomLevel(level)
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">
      {/* Header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <Link href="/nucleus/observatory" className="text-slate-dim/70 hover:text-cyan transition-colors text-sm">
            Observatory
          </Link>
          <span className="text-nex-light">/</span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/5">
            <Network className="h-4 w-4 text-cyan" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-cyan/70">{STRINGS.brandSubtitle}</p>
            <h1 className="text-sm font-semibold text-white">Graph Theory</h1>
          </div>
        </div>
      </header>

      <ExplorerNav current="graph" />

      {/* Data Source Toggle */}
      <div className="flex items-center gap-golden-2 mb-golden-2">
        <button
          onClick={() => { setLiveMode(false); setSelected(null) }}
          aria-pressed={!liveMode}
          className={`px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            !liveMode
              ? 'bg-cyan/20 text-cyan border border-cyan/40'
              : 'bg-nex-surface text-slate-dim/70 border border-nex-light hover:border-cyan/30 hover:text-white'
          }`}
        >
          Static Datasets
        </button>
        <button
          onClick={() => { setLiveMode(true); setSelected(null) }}
          aria-pressed={liveMode}
          className={`px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            liveMode
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-nex-surface text-slate-dim/70 border border-nex-light hover:border-emerald-500/30 hover:text-white'
          }`}
        >
          Live FAERS
        </button>
        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 ${
          dataSource === 'LIVE' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-dim/50 bg-nex-surface border border-nex-light'
        }`}>
          {dataSource}
        </span>
      </div>

      {/* Live Drug Search */}
      {liveMode && (
        <div className="flex items-center gap-golden-2 mb-golden-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-dim/50" aria-hidden="true" />
            <input
              type="text"
              value={drugQuery}
              onChange={(e) => setDrugQuery(e.target.value)}
              placeholder="Search drug name (e.g., aspirin, ibuprofen)..."
              aria-label="Search drug name"
              className="w-full pl-8 pr-3 py-2 text-sm bg-nex-surface border border-nex-light text-white placeholder:text-slate-dim/40 focus:border-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </div>
          {liveLoading && <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" aria-hidden="true" />}
          {liveError && (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              {liveError}
            </div>
          )}
        </div>
      )}

      {/* Dataset selector (static mode only) */}
      {!liveMode && (
        <div className="flex flex-wrap items-center gap-golden-1 mb-golden-3">
          {(Object.keys(DATASETS) as DatasetKey[]).map((key) => (
            <button
              key={key}
              onClick={() => { setDataset(key); setSelected(null) }}
              aria-pressed={dataset === key}
              className={`px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                dataset === key
                  ? 'bg-cyan/20 text-cyan border border-cyan/40'
                  : 'bg-nex-surface text-slate-dim/70 border border-nex-light hover:border-cyan/30 hover:text-white'
              }`}
            >
              {DATASETS[key].label}
            </button>
          ))}
        </div>
      )}

      {/* View Mode */}
      <div className="flex items-center gap-golden-1 mb-golden-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">View</span>
        {(['force', 'hierarchy', 'radial', 'grid'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setGraphLayout(mode)}
            aria-pressed={graphLayout === mode}
            className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              graphLayout === mode
                ? 'bg-gold/20 text-gold border border-gold/40'
                : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-gold/30 hover:text-white'
            }`}
          >
            {mode === 'force' ? 'Force' : mode === 'hierarchy' ? 'Hierarchy' : mode === 'radial' ? 'Radial' : 'Grid'}
          </button>
        ))}
        <button
          onClick={() => setUseGPULayout(!useGPULayout)}
          aria-pressed={useGPULayout}
          className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ml-golden-2 ${
            useGPULayout
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-emerald-500/30 hover:text-white'
          }`}
        >
          {useGPULayout ? `Worker ${converged ? '✓' : `(${iteration})`}` : 'Worker Off'}
        </button>
      </div>

      {/* Post-Processing Controls — per-effect toggles */}
      <div className="flex items-center gap-golden-1 mb-golden-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">Effects</span>
        {(
          [
            { key: 'bloom',    label: 'Bloom',    value: enableBloom,    set: setEnableBloom },
            { key: 'ssao',     label: 'SSAO',     value: enableSSAO,     set: setEnableSSAO },
            { key: 'vignette', label: 'Vignette', value: enableVignette, set: setEnableVignette },
            { key: 'dof',      label: 'DoF',      value: enableDoF,      set: setEnableDoF },
            { key: 'ca',       label: 'CA',        value: enableChromaticAberration, set: setEnableChromaticAberration },
          ] satisfies { key: string; label: string; value: boolean; set: (v: boolean) => void }[]
        ).map(({ key, label, value, set }) => (
          <button
            key={key}
            onClick={() => set(!value)}
            aria-pressed={value}
            className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              value
                ? 'bg-cyan/20 text-cyan border border-cyan/40'
                : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-cyan/30 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* CVD Mode Selector */}
      <div className="flex items-center gap-golden-1 mb-golden-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">Color Vision</span>
        {CVD_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCvdMode(value)}
            aria-pressed={cvdMode === value}
            className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              cvdMode === value
                ? 'bg-violet/20 text-violet border border-violet/40'
                : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-violet/30 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scene */}
      <div style={{ height: LAYOUT.sceneHeightCSS }}>
        <SceneContainer
          sceneLabel={`3D force-directed graph visualization of ${liveMode ? 'live FAERS drug data' : DATASETS[dataset].label}`}
          cameraPosition={
            graphLayout === 'hierarchy' ? [0, 3, 24] :
            graphLayout === 'radial' ? [0, 10, 10] :
            graphLayout === 'grid' ? [0, 12, 6] :
            [...CAMERA.graphPosition]
          }
          postProcessing={postProcessing}
          enableBloom={enableBloom}
          enableSSAO={enableSSAO}
          enableVignette={enableVignette}
          enableDoF={enableDoF}
          enableChromaticAberration={enableChromaticAberration}
          theme={theme}
          atmosphereId={preferences.atmosphere !== 'auto' ? preferences.atmosphere as 'deep-space' | 'clinical' | 'war-room' | 'blueprint' : undefined}
        >
          <ZoomLevelBridge onZoomChange={handleZoomChange} />
          <ForceGraph3D
            nodes={data.nodes}
            edges={data.edges}
            onNodeClick={handleNodeClick}
            colorScheme="mixed"
            layout={graphLayout}
            cvdMode={cvdMode}
            externalPositions={externalPositions}
            zoomLevel={zoomLevel}
            groupColors={theme.groupColors}
          />
        </SceneContainer>
      </div>

      {/* Graph Metrics */}
      <div className="mt-golden-3 grid grid-cols-2 md:grid-cols-6 gap-golden-2">
        <div className="border border-cyan/20 bg-cyan/5 p-golden-1">
          <span className="text-[10px] font-mono uppercase text-cyan/70">Nodes |V|</span>
          <p className="text-lg font-semibold text-white">{metrics.nodes}</p>
        </div>
        <div className="border border-cyan/20 bg-cyan/5 p-golden-1">
          <span className="text-[10px] font-mono uppercase text-cyan/70">Edges |E|</span>
          <p className="text-lg font-semibold text-white">{metrics.edges}</p>
        </div>
        <div className="border border-cyan/20 bg-cyan/5 p-golden-1">
          <span className="text-[10px] font-mono uppercase text-cyan/70">Density</span>
          <p className="text-lg font-semibold text-white">{metrics.density.toFixed(3)}</p>
        </div>
        <div className="border border-cyan/20 bg-cyan/5 p-golden-1">
          <span className="text-[10px] font-mono uppercase text-cyan/70">Avg Degree</span>
          <p className="text-lg font-semibold text-white">{metrics.avgDegree.toFixed(1)}</p>
        </div>
        <div className="border border-violet/20 bg-violet/5 p-golden-1">
          <span className="text-[10px] font-mono uppercase text-violet/70">Embedding</span>
          <p className="text-lg font-semibold text-white">D = {data.dimension}</p>
        </div>
        <div className="border border-gold/20 bg-gold/5 p-golden-1">
          <span className="text-[10px] font-mono uppercase text-gold/70">Zoom Level</span>
          <p className="text-sm font-semibold text-white">{zoomLevel} — {ZOOM_LEVEL_LABELS[zoomLevel]}</p>
        </div>
      </div>

      {/* Dataset description */}
      <div className="mt-golden-2 border border-nex-light bg-nex-surface p-golden-2">
        <p className="text-sm text-slate-dim/70 leading-golden">{data.description}</p>
      </div>

      {/* STEM Grounding */}
      {data.stem && (
        <div className="mt-golden-2 border border-cyan/20 bg-cyan/5 p-golden-2">
          <div className="flex items-center gap-golden-1 mb-golden-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan/60">STEM Grounding</span>
            <span className="text-[10px] font-mono text-cyan/60">{data.stem.crate}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-golden-2">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">Trait</span>
              <span className="text-sm font-semibold text-white">{data.stem.trait}</span>
              <span className="text-xs text-slate-dim/70 block">{data.stem.domain} &middot; {data.stem.t1}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">Transfer</span>
              <span className="text-xs text-slate-dim/70 leading-golden">{data.stem.transfer}</span>
            </div>
          </div>
          <div className="mt-golden-1 flex items-center gap-golden-1 flex-wrap">
            <span className="text-[10px] font-mono uppercase text-slate-dim/70">MCP Tools:</span>
            {data.stem.tools.map(t => (
              <code key={t} className="text-[10px] font-mono px-1.5 py-0.5 bg-nex-surface border border-nex-light text-gold/70">{t}</code>
            ))}
          </div>
        </div>
      )}

      {/* Selection Panel */}
      {selected && (
        <div className="mt-golden-2 p-golden-2 border border-cyan/30 bg-cyan/5">
          <div className="flex items-center gap-golden-2">
            <div className="w-3 h-3 bg-cyan" />
            <span className="text-base font-semibold text-white">{selected.label}</span>
            <span className="text-xs px-2 py-0.5 border border-nex-light bg-nex-surface text-slate-dim/70">
              {selected.group}
            </span>
            <button
              onClick={() => setSelected(null)}
              aria-label="Dismiss selection"
              className="ml-auto text-slate-dim/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 px-1"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <p className="text-sm text-slate-dim/70 mt-golden-1">
            Connected edges: {data.edges.filter(e => e.source === selected.id || e.target === selected.id).length} |
            Value: {selected.value?.toFixed(1)}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-golden-3 flex flex-wrap gap-golden-3 text-sm text-slate-dim/70">
        {Object.entries(GROUP_COLORS).filter(([k]) => k !== 'default').map(([layer, color]) => (
          <div key={layer} className="flex items-center gap-2">
            <div className="w-3 h-3" style={{ backgroundColor: color }} />
            {layer.charAt(0).toUpperCase() + layer.slice(1)}
          </div>
        ))}
      </div>
    </div>
  )
}
