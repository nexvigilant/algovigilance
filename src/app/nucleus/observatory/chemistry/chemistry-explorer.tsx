'use client'

import { useState, useMemo } from 'react'
import { useExplorerEffects } from '@/lib/observatory/use-explorer-effects'
import { useObservatoryPreferences } from '@/lib/observatory/use-observatory-preferences'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FlaskConical, Loader2, AlertTriangle } from 'lucide-react'
import type { GraphNode } from '@/components/observatory'
import { STRINGS, CAMERA, LAYOUT } from '@/components/observatory'
import { ExplorerNav } from '@/components/observatory/explorer-shared'
import { useChemistryData } from './use-chemistry-data'

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
  }
)

const SurfacePlot3D = dynamic(
  () => import('@/components/observatory/surface-plot-3d').then(m => ({ default: m.SurfacePlot3D })),
  { ssr: false }
)

// ─── Hill Surface Function ────────────────────────────────────────────────────

/**
 * Build a 3D surface function from dose-response data points.
 *
 * x maps to log10(dose) in [-3, 3] space (0.001 to 1000 µM).
 * y maps to Hill coefficient variation in [0.5, 3] range.
 * z = Hill response % at the given dose and Hill coefficient.
 *
 * When live data is available the EC50 and Emax are taken from the dataset
 * metadata embedded in the node values; otherwise sensible defaults apply.
 */
function buildHillSurface(
  ec50: number,
  emax: number,
): (x: number, y: number) => number {
  return (x: number, y: number): number => {
    // x = log10[dose], y = relative Hill coefficient (-1.5 to 1.5 → n = 0.5 to 3)
    const dose = Math.pow(10, x)
    const n = 1.75 + y * (2.5 / 3) // maps [-1.5,1.5] → [0.5, 3]
    const nClamped = Math.max(0.1, n)
    const ec50n = Math.pow(ec50, nClamped)
    const doseN = Math.pow(dose, nClamped)
    return (emax * doseN) / (ec50n + doseN)
  }
}

// ─── Compound Metrics ─────────────────────────────────────────────────────────

interface CompoundMetrics {
  ec50: number
  hillCoefficient: number
  emax: number
}

function extractMetrics(nodes: GraphNode[]): CompoundMetrics {
  if (nodes.length === 0) return { ec50: 10, hillCoefficient: 1.5, emax: 100 }

  // Approximate EC50 as dose at half-max response using value midpoint node
  const midIdx = Math.floor(nodes.length / 2)
  const midNode = nodes[midIdx]

  // value is normalized 0–3, emax estimated from highest value node
  const maxValue = Math.max(...nodes.map(n => n.value ?? 0))
  const estimatedEmax = maxValue > 0 ? (maxValue / 3) * 100 : 100

  // EC50 is the dose label at half-max (value ≈ 1.5 i.e. 50% of 3)
  const halfMaxNode = nodes.find(n => (n.value ?? 0) >= 1.5) ?? midNode
  const labelStr = halfMaxNode?.label ?? '10'
  const parsed = parseFloat(labelStr)
  const ec50 = Number.isFinite(parsed) && parsed > 0 ? parsed : 10

  return {
    ec50,
    hillCoefficient: 1.5,
    emax: estimatedEmax,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChemistryExplorer() {
  const [compound, setCompound] = useState('aspirin')
  const [inputValue, setInputValue] = useState('aspirin')
  const [wireframe, setWireframe] = useState(false)
  const [colorMode, setColorMode] = useState<'height' | 'gradient' | 'contour'>('gradient')
  const [resolution, setResolution] = useState<32 | 64 | 96>(64)

  const { data, loading, error, refetch } = useChemistryData(compound)

  const { preferences } = useObservatoryPreferences()
  const {
    enableBloom, setEnableBloom,
    enableSSAO, setEnableSSAO,
    enableVignette, setEnableVignette,
    enableDoF, setEnableDoF,
    enableChromaticAberration, setEnableChromaticAberration,
    postProcessing, theme,
  } = useExplorerEffects()

  const metrics = useMemo(() => extractMetrics(data.nodes), [data.nodes])

  const surfaceFn = useMemo(
    () => buildHillSurface(metrics.ec50, metrics.emax),
    [metrics.ec50, metrics.emax],
  )

  function handleSearch() {
    const trimmed = inputValue.trim()
    if (trimmed.length >= 2) setCompound(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">
      {/* Header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <Link
            href="/nucleus/observatory"
            className="text-slate-dim/70 hover:text-cyan transition-colors text-sm"
          >
            Observatory
          </Link>
          <span className="text-nex-light">/</span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-rose-500/30 bg-rose-500/5">
            <FlaskConical className="h-4 w-4 text-rose-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-rose-400/70">
              {STRINGS.brandSubtitle}
            </p>
            <h1 className="text-sm font-semibold text-white">Chemistry</h1>
          </div>
        </div>
      </header>

      <ExplorerNav current="chemistry" />

      {/* Compound input */}
      <div className="flex items-center gap-golden-2 mb-golden-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter compound name..."
          aria-label="Compound name"
          className="flex-1 bg-nex-surface border border-rose-500/30 text-white placeholder:text-slate-dim/40 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-1.5 text-sm font-mono bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          Analyze
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-golden-2 mb-golden-3">
          <Loader2 className="h-4 w-4 text-rose-400 animate-spin" aria-hidden="true" />
          <span className="text-sm text-slate-dim/70">
            Fetching Hill response for <em className="text-white">{compound}</em>...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-golden-2 mb-golden-3 p-golden-2 border border-red-500/30 bg-red-500/5"
        >
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" aria-hidden="true" />
          <span className="text-sm text-red-400">{error} — showing demo data</span>
          <button
            onClick={refetch}
            className="text-sm text-rose-400 hover:text-white transition-colors ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            Retry
          </button>
        </div>
      )}

      {/* Display controls */}
      <div className="flex items-center gap-golden-2 mb-golden-3 text-sm flex-wrap">
        <label className="flex items-center gap-2 text-slate-dim/70 cursor-pointer">
          <input
            type="checkbox"
            checked={wireframe}
            onChange={(e) => setWireframe(e.target.checked)}
            className="border-nex-light"
          />
          Wireframe
        </label>
        <select
          value={colorMode}
          onChange={(e) => setColorMode(e.target.value as typeof colorMode)}
          aria-label="Color mode"
          className="bg-nex-surface border border-nex-light text-slate-dim/70 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <option value="height">Height</option>
          <option value="gradient">Gradient</option>
          <option value="contour">Contour</option>
        </select>
        <select
          value={resolution}
          onChange={(e) => setResolution(Number(e.target.value) as typeof resolution)}
          aria-label="Resolution"
          className="bg-nex-surface border border-nex-light text-slate-dim/70 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <option value={32}>Low (32)</option>
          <option value={64}>Medium (64)</option>
          <option value={96}>High (96)</option>
        </select>
      </div>

      {/* Effects */}
      <div className="flex items-center gap-golden-1 mb-golden-2 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">
          Effects
        </span>
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
            className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
              value
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-rose-500/30 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3D Scene */}
      <div style={{ height: LAYOUT.sceneHeightCSS }}>
        <SceneContainer
          sceneLabel={`Hill dose-response surface for ${compound}`}
          cameraPosition={[...CAMERA.mathPosition]}
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
          <SurfacePlot3D
            fn={surfaceFn}
            range={[-3, 3]}
            resolution={resolution}
            wireframe={wireframe}
            colorMode={colorMode}
            labels={{ x: 'log\u2081\u2080[Dose]', y: 'Hill coeff.', z: 'Response %' }}
            title={compound}
          />
        </SceneContainer>
      </div>

      {/* Info Panel */}
      <div className="mt-golden-3 p-golden-2 border border-rose-500/30 bg-rose-500/5">
        <div className="flex items-baseline gap-golden-2 mb-golden-1 flex-wrap">
          <span className="text-lg font-semibold text-white">{compound}</span>
          <code className="text-sm font-mono text-rose-400">
            Hill: E = Emax &middot; D^n / (EC50^n + D^n)
          </code>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-golden-2 mt-golden-1">
          <div className="border border-rose-500/20 bg-rose-500/5 p-golden-1">
            <span className="text-[10px] font-mono uppercase text-rose-400/70">Compound</span>
            <p className="text-sm font-semibold text-white capitalize">{compound}</p>
          </div>
          <div className="border border-rose-500/20 bg-rose-500/5 p-golden-1">
            <span className="text-[10px] font-mono uppercase text-rose-400/70">EC50</span>
            <p className="text-lg font-semibold text-white">{metrics.ec50.toFixed(2)}</p>
            <span className="text-[10px] text-slate-dim/70">µM</span>
          </div>
          <div className="border border-rose-500/20 bg-rose-500/5 p-golden-1">
            <span className="text-[10px] font-mono uppercase text-rose-400/70">Hill n</span>
            <p className="text-lg font-semibold text-white">{metrics.hillCoefficient.toFixed(2)}</p>
          </div>
          <div className="border border-rose-500/20 bg-rose-500/5 p-golden-1">
            <span className="text-[10px] font-mono uppercase text-rose-400/70">Emax</span>
            <p className="text-lg font-semibold text-white">{metrics.emax.toFixed(1)}</p>
            <span className="text-[10px] text-slate-dim/70">%</span>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 leading-golden mt-golden-1">
          Dose-response surface parameterized over log\u2081\u2080[Dose] \u00d7 Hill coefficient.
          x-axis: dose (0.001\u20131000 \u00b5M log-space). y-axis: Hill cooperativity (0.5\u20133).
          z-axis: response percentage (0\u2013{metrics.emax.toFixed(0)}%).
        </p>
      </div>

      {/* STEM Grounding Panel */}
      {data.stem && (
        <div className="mt-golden-2 border border-cyan/20 bg-cyan/5 p-golden-2">
          <div className="flex items-center gap-golden-1 mb-golden-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan/60">
              STEM Grounding
            </span>
            <span className="text-[10px] font-mono text-cyan/60">{data.stem.crate}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-golden-2">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">
                Primary Trait
              </span>
              <span className="text-sm font-semibold text-white">{data.stem.trait}</span>
              <span className="text-xs text-slate-dim/70 block">{data.stem.domain}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">
                T1 Primitive
              </span>
              <span className="text-sm font-mono text-cyan">{data.stem.t1}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">
                Transfer
              </span>
              <span className="text-xs text-slate-dim/70 leading-golden">
                {data.stem.transfer}
              </span>
            </div>
          </div>
          <div className="mt-golden-1 flex items-center gap-golden-1 flex-wrap">
            <span className="text-[10px] font-mono uppercase text-slate-dim/70">MCP Tools:</span>
            {data.stem.tools.map((t) => (
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
    </div>
  )
}
