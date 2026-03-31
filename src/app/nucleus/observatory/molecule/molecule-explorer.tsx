'use client'

import { useState, useCallback, useMemo } from 'react'
import { useExplorerEffects } from '@/lib/observatory/use-explorer-effects'
import { useObservatoryPreferences } from '@/lib/observatory/use-observatory-preferences'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Atom, Loader2, AlertTriangle } from 'lucide-react'
import type { GraphNode, GraphLayout } from '@/components/observatory'
import { STRINGS, CAMERA, LAYOUT } from '@/components/observatory'
import { useCVDMode } from '@/components/observatory/cvd-geometry'
import type { SemanticZoomLevel } from '@/lib/observatory/types'
import { ZoomLevelBridge, CVD_OPTIONS, ZOOM_LEVEL_LABELS, ExplorerNav } from '@/components/observatory/explorer-shared'
import { useMoleculeData } from './use-molecule-data'

// ─── Dynamic Imports ─────────────────────────────────────────────────────────

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

// ─── CPK Color Legend ─────────────────────────────────────────────────────────

const ELEMENT_LEGEND = [
  { label: 'Carbon',   color: '#909090' },
  { label: 'Hydrogen', color: '#ffffff' },
  { label: 'Nitrogen', color: '#3050F8' },
  { label: 'Oxygen',   color: '#FF0D0D' },
  { label: 'Sulfur',   color: '#FFFF30' },
]

// ─── View Mode Config ─────────────────────────────────────────────────────────

type MoleculeViewMode = 'force' | 'radial' | 'hierarchy'

interface ViewModeOption {
  value: MoleculeViewMode
  label: string
  layout: GraphLayout
}

const VIEW_MODES: ViewModeOption[] = [
  { value: 'force',     label: 'Ball-Stick',  layout: 'force'     },
  { value: 'radial',    label: 'Radial',      layout: 'radial'    },
  { value: 'hierarchy', label: 'Space-Fill',  layout: 'hierarchy' },
]

// ─── Preset Molecule Buttons Config ──────────────────────────────────────────

const PRESET_LABELS: { key: string; label: string }[] = [
  { key: 'aspirin',   label: 'Aspirin'   },
  { key: 'caffeine',  label: 'Caffeine'  },
  { key: 'ibuprofen', label: 'Ibuprofen' },
  { key: 'water',     label: 'Water'     },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function MoleculeExplorer() {
  const [molecule, setMolecule]       = useState<string>('aspirin')
  const [inputValue, setInputValue]   = useState<string>('')
  const [viewMode, setViewMode]       = useState<MoleculeViewMode>('force')
  const [selected, setSelected]       = useState<GraphNode | null>(null)
  const [cvdMode, setCvdMode]         = useCVDMode()
  const [zoomLevel, setZoomLevel]     = useState<SemanticZoomLevel>(2)

  const graphLayout = VIEW_MODES.find(v => v.value === viewMode)?.layout ?? 'force'

  const { data, loading, error, refetch } = useMoleculeData(molecule)
  const { preferences } = useObservatoryPreferences()
  const {
    enableBloom, setEnableBloom,
    enableSSAO, setEnableSSAO,
    enableVignette, setEnableVignette,
    enableDoF, setEnableDoF,
    enableChromaticAberration, setEnableChromaticAberration,
    postProcessing, theme,
  } = useExplorerEffects()

  const moleculeInfo = useMemo(() => {
    if (!data) return null
    const match = data.description.match(/MW ([\d.]+)/)
    const mw = match ? parseFloat(match[1]) : null
    return {
      formula: data.label,
      molecularWeight: mw,
      atomCount: data.nodes.length,
      bondCount: data.edges.length,
    }
  }, [data])

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelected(node)
  }, [])

  const handleZoomChange = useCallback((level: SemanticZoomLevel) => {
    setZoomLevel(level)
  }, [])

  const handlePreset = useCallback((key: string) => {
    setMolecule(key)
    setInputValue('')
    setSelected(null)
  }, [])

  const handleCustomSubmit = useCallback(() => {
    const trimmed = inputValue.trim()
    if (trimmed.length >= 2) {
      setMolecule(trimmed)
      setSelected(null)
    }
  }, [inputValue])

  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">
      {/* Header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <Link
            href="/nucleus/observatory"
            className="text-slate-dim/70 hover:text-fuchsia-400 transition-colors text-sm"
          >
            Observatory
          </Link>
          <span className="text-nex-light">/</span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-fuchsia-500/30 bg-fuchsia-500/5">
            <Atom className="h-4 w-4 text-fuchsia-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-fuchsia-400/70">
              {STRINGS.brandSubtitle}
            </p>
            <h1 className="text-sm font-semibold text-white">Molecule Viewer</h1>
          </div>
        </div>
      </header>

      <ExplorerNav current="molecule" />

      {/* Preset Molecule Buttons */}
      <div className="flex items-center gap-golden-1 mb-golden-2 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">
          Presets
        </span>
        {PRESET_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            aria-pressed={molecule === key}
            className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
              molecule === key
                ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/40'
                : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-fuchsia-500/30 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom Molecule Input */}
      <div className="flex items-center gap-golden-2 mb-golden-3">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit() }}
          placeholder="Enter molecular formula..."
          aria-label="Enter molecular formula"
          className="flex-1 max-w-xs px-3 py-1.5 text-xs font-mono bg-nex-surface border border-fuchsia-500/30 text-white placeholder:text-slate-dim/40 focus:outline-none focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/30"
        />
        <button
          onClick={handleCustomSubmit}
          disabled={inputValue.trim().length < 2}
          className="px-3 py-1.5 text-xs font-mono bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/40 hover:bg-fuchsia-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
        >
          Visualise
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center gap-golden-2 mb-golden-3">
          <Loader2 className="h-4 w-4 text-fuchsia-400 animate-spin" aria-hidden="true" />
          <span className="text-sm text-slate-dim/70">Loading molecule data...</span>
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-center gap-golden-2 mb-golden-3 p-golden-2 border border-red-500/30 bg-red-500/5">
          <AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" />
          <span className="text-sm text-red-400">{error} — showing demo data</span>
          <button
            onClick={refetch}
            className="text-sm text-fuchsia-400 hover:text-white transition-colors ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
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
            {VIEW_MODES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setViewMode(value)}
                aria-pressed={viewMode === value}
                className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
                  viewMode === value
                    ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/40'
                    : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-fuchsia-500/30 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Effects + CVD */}
          <div className="flex items-center gap-golden-1 mb-golden-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">Effects</span>
            {(
              [
                { key: 'bloom',    label: 'Bloom',    value: enableBloom,    set: setEnableBloom },
                { key: 'ssao',     label: 'SSAO',     value: enableSSAO,     set: setEnableSSAO },
                { key: 'vignette', label: 'Vignette', value: enableVignette, set: setEnableVignette },
                { key: 'dof',      label: 'DoF',      value: enableDoF,      set: setEnableDoF },
                { key: 'ca',       label: 'CA',       value: enableChromaticAberration, set: setEnableChromaticAberration },
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
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 ml-golden-2 mr-golden-1">
              Color Vision
            </span>
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

          {/* 3D Scene */}
          <div style={{ height: LAYOUT.sceneHeightCSS }}>
            <SceneContainer
              sceneLabel="3D molecular structure visualization showing atoms as nodes and bonds as edges"
              cameraPosition={
                graphLayout === 'hierarchy' ? [0, 4, 16] :
                graphLayout === 'radial'    ? [0, 8, 10] :
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

          {/* Molecule Info Panel */}
          {moleculeInfo && (
            <div className="mt-golden-3 grid grid-cols-2 md:grid-cols-5 gap-golden-2">
              <div className="border border-fuchsia-500/20 bg-fuchsia-500/5 p-golden-1">
                <span className="text-[10px] font-mono uppercase text-fuchsia-400/70">Formula</span>
                <p className="text-lg font-semibold text-white">{moleculeInfo.formula}</p>
              </div>
              <div className="border border-fuchsia-500/20 bg-fuchsia-500/5 p-golden-1">
                <span className="text-[10px] font-mono uppercase text-fuchsia-400/70">Mol. Weight</span>
                <p className="text-lg font-semibold text-white">
                  {moleculeInfo.molecularWeight != null
                    ? `${moleculeInfo.molecularWeight.toFixed(2)} g/mol`
                    : '—'}
                </p>
              </div>
              <div className="border border-fuchsia-500/20 bg-fuchsia-500/5 p-golden-1">
                <span className="text-[10px] font-mono uppercase text-fuchsia-400/70">Atoms |V|</span>
                <p className="text-lg font-semibold text-white">{moleculeInfo.atomCount}</p>
              </div>
              <div className="border border-fuchsia-500/20 bg-fuchsia-500/5 p-golden-1">
                <span className="text-[10px] font-mono uppercase text-fuchsia-400/70">Bonds |E|</span>
                <p className="text-lg font-semibold text-white">{moleculeInfo.bondCount}</p>
              </div>
              <div className="border border-violet/20 bg-violet/5 p-golden-1">
                <span className="text-[10px] font-mono uppercase text-violet/70">Zoom</span>
                <p className="text-sm font-semibold text-white">
                  {zoomLevel} — {ZOOM_LEVEL_LABELS[zoomLevel]}
                </p>
              </div>
            </div>
          )}

          {/* STEM Grounding */}
          {data.stem && (
            <div className="mt-golden-2 border border-gold/20 bg-gold/5 p-golden-2">
              <div className="flex items-center gap-golden-1 mb-golden-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gold/60">STEM Grounding</span>
                <span className="text-[10px] font-mono text-gold/60">{data.stem.crate}</span>
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
                {data.stem.tools.map(t => (
                  <code
                    key={t}
                    className="text-[10px] font-mono px-1.5 py-0.5 bg-nex-surface border border-nex-light text-gold/70"
                  >
                    {t}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Selection Panel */}
          {selected && (
            <div className="mt-golden-2 p-golden-2 border border-fuchsia-500/30 bg-fuchsia-500/5">
              <div className="flex items-center gap-golden-2">
                <div className="w-3 h-3" style={{ backgroundColor: selected.color ?? '#e879f9' }} />
                <span className="text-base font-semibold text-white">{selected.label}</span>
                <span className="text-xs px-2 py-0.5 border border-nex-light bg-nex-surface text-slate-dim/70">
                  {selected.group}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Dismiss selection"
                  className="ml-auto text-slate-dim/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 px-1"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="mt-golden-1 grid grid-cols-2 md:grid-cols-3 gap-golden-1 text-sm">
                <div>
                  <span className="text-[10px] font-mono uppercase text-fuchsia-400/70 block">Element</span>
                  <span className="text-white">{selected.group ?? '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-fuchsia-400/70 block">Bonds</span>
                  <span className="text-white">
                    {data.edges.filter(e => e.source === selected.id || e.target === selected.id).length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-fuchsia-400/70 block">Atomic Size</span>
                  <span className="text-white">{selected.value?.toFixed(1) ?? '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* CPK Color Legend */}
          <div className="mt-golden-3 flex flex-wrap gap-golden-3 text-sm text-slate-dim/70">
            {ELEMENT_LEGEND.map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 border border-white/10"
                  style={{ backgroundColor: color }}
                />
                {label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
