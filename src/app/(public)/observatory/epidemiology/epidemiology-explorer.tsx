'use client'

import { useState, useMemo } from 'react'
import { useExplorerEffects } from '@/lib/observatory/use-explorer-effects'
import { useObservatoryPreferences } from '@/lib/observatory/use-observatory-preferences'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Users, Loader2, AlertTriangle } from 'lucide-react'
import { STRINGS, CAMERA, LAYOUT } from '@/components/observatory'
import { ExplorerNav } from '@/components/observatory/explorer-shared'
import { useEpidemiologyData } from './use-epidemiology-data'

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

// ─── Cohort Names ─────────────────────────────────────────────────────────────

const COHORT_NAMES = [
  'General Population',
  'Elderly (65+)',
  'Pediatric (<18)',
  'Renal Impairment',
  'Hepatic Impairment',
] as const

// ─── STEM Grounding ───────────────────────────────────────────────────────────

const STEM = {
  trait: 'Measure',
  domain: 'Science',
  t1: 'N Quantity',
  transfer:
    'Population\u2192Risk\u2192Survival \u2014 epidemiological cohort analysis as risk surfaces',
  crate: 'nexcore-vigilance',
  tools: [
    'epidemiology_relative_risk',
    'epidemiology_odds_ratio',
    'epidemiology_attributable_fraction',
  ],
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPopulation(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function formatRate(r: number): string {
  return `${(r * 100).toFixed(2)}%`
}

function computeNnt(rr: number, baseIncidence: number): string {
  const generalIncidence = 0.05
  const rrDiff = (rr - 1) * generalIncidence
  if (Math.abs(rrDiff) < 0.0001) return 'N/A'
  const nnt = 1 / Math.abs(rrDiff * baseIncidence)
  return Number.isFinite(nnt) ? nnt.toFixed(0) : 'N/A'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EpidemiologyExplorer() {
  const [cohort, setCohort] = useState('')
  const [wireframe, setWireframe] = useState(false)
  const [colorMode, setColorMode] = useState<'height' | 'gradient' | 'contour'>('height')
  const [resolution, setResolution] = useState<32 | 64 | 96>(64)
  const [selectedCohortIndex, setSelectedCohortIndex] = useState(0)

  const { data, loading, error, refetch } = useEpidemiologyData(cohort)

  const { preferences } = useObservatoryPreferences()
  const {
    enableBloom, setEnableBloom,
    enableSSAO, setEnableSSAO,
    enableVignette, setEnableVignette,
    enableDoF, setEnableDoF,
    enableChromaticAberration, setEnableChromaticAberration,
    postProcessing, theme,
  } = useExplorerEffects()

  const selectedCohort = useMemo(
    () => data.cohorts[selectedCohortIndex] ?? data.cohorts[0],
    [data.cohorts, selectedCohortIndex],
  )

  const nnt = useMemo(() => {
    if (!selectedCohort) return 'N/A'
    return computeNnt(selectedCohort.relativeRisk, selectedCohort.incidenceRate)
  }, [selectedCohort])

  function handleCohortSelect(index: number) {
    setSelectedCohortIndex(index)
    const name = COHORT_NAMES[index]
    if (name && name.length >= 2) setCohort(name)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">
      {/* Header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <Link
            href="/observatory"
            className="text-slate-dim/70 hover:text-cyan transition-colors text-sm"
          >
            Observatory
          </Link>
          <span className="text-nex-light">/</span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-teal-500/30 bg-teal-500/5">
            <Users className="h-4 w-4 text-teal-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-teal-400/70">
              {STRINGS.brandSubtitle}
            </p>
            <h1 className="text-sm font-semibold text-white">Epidemiology</h1>
          </div>
        </div>
      </header>

      <ExplorerNav current="epidemiology" />

      {/* Cohort selector */}
      <div className="flex flex-wrap items-center gap-golden-1 mb-golden-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">
          Cohort
        </span>
        {COHORT_NAMES.map((name, i) => (
          <button
            key={name}
            onClick={() => handleCohortSelect(i)}
            aria-pressed={selectedCohortIndex === i}
            className={`px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              selectedCohortIndex === i
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                : 'bg-nex-surface text-slate-dim/70 border border-nex-light hover:border-teal-500/30 hover:text-white'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-golden-2 mb-golden-3">
          <Loader2 className="h-4 w-4 text-teal-400 animate-spin" aria-hidden="true" />
          <span className="text-sm text-slate-dim/70">
            Fetching epidemiology data for <em className="text-white">{cohort}</em>...
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
            className="text-sm text-teal-400 hover:text-white transition-colors ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
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
          className="bg-nex-surface border border-nex-light text-slate-dim/70 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <option value="height">Height</option>
          <option value="gradient">Gradient</option>
          <option value="contour">Contour</option>
        </select>
        <select
          value={resolution}
          onChange={(e) => setResolution(Number(e.target.value) as typeof resolution)}
          aria-label="Resolution"
          className="bg-nex-surface border border-nex-light text-slate-dim/70 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
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
            className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              value
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-teal-500/30 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3D Scene */}
      <div style={{ height: LAYOUT.sceneHeightCSS }}>
        <SceneContainer
          sceneLabel={`Population risk surface — ${selectedCohort?.name ?? 'Epidemiology'}`}
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
              ? (preferences.atmosphere as 'deep-space' | 'clinical' | 'war-room' | 'blueprint')
              : undefined
          }
        >
          <SurfacePlot3D
            fn={data.surfaceFn}
            range={[-5, 5]}
            resolution={resolution}
            wireframe={wireframe}
            colorMode={colorMode}
            labels={{ x: 'Time (years)', y: 'Risk Factor', z: 'Survival Prob.' }}
            title="Population Risk Surface"
          />
        </SceneContainer>
      </div>

      {/* Cohort info panel */}
      {selectedCohort && (
        <div className="mt-golden-3 p-golden-2 border border-teal-500/30 bg-teal-500/5">
          <div className="flex items-baseline gap-golden-2 mb-golden-2 flex-wrap">
            <span className="text-lg font-semibold text-white">{selectedCohort.name}</span>
            <code className="text-sm font-mono text-teal-400">Kaplan-Meier survival surface</code>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-golden-2">
            <div className="border border-teal-500/20 bg-teal-500/5 p-golden-1">
              <span className="text-[10px] font-mono uppercase text-teal-400/70 block">Population</span>
              <p className="text-lg font-semibold text-white">
                {formatPopulation(selectedCohort.population)}
              </p>
            </div>
            <div className="border border-teal-500/20 bg-teal-500/5 p-golden-1">
              <span className="text-[10px] font-mono uppercase text-teal-400/70 block">Incidence</span>
              <p className="text-lg font-semibold text-white">
                {formatRate(selectedCohort.incidenceRate)}
              </p>
              <span className="text-[10px] text-slate-dim/70">per year</span>
            </div>
            <div className="border border-teal-500/20 bg-teal-500/5 p-golden-1">
              <span className="text-[10px] font-mono uppercase text-teal-400/70 block">Prevalence</span>
              <p className="text-lg font-semibold text-white">
                {formatRate(selectedCohort.prevalence)}
              </p>
            </div>
            <div className="border border-teal-500/20 bg-teal-500/5 p-golden-1">
              <span className="text-[10px] font-mono uppercase text-teal-400/70 block">Relative Risk</span>
              <p className="text-lg font-semibold text-white">
                {selectedCohort.relativeRisk.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-dim/70">vs. general pop.</span>
            </div>
            <div className="border border-teal-500/20 bg-teal-500/5 p-golden-1">
              <span className="text-[10px] font-mono uppercase text-teal-400/70 block">Attr. Fraction</span>
              <p className="text-lg font-semibold text-white">
                {(selectedCohort.attributableFraction * 100).toFixed(1)}%
              </p>
              <span className="text-[10px] text-slate-dim/70">NNT: {nnt}</span>
            </div>
          </div>
        </div>
      )}

      {/* STEM Grounding Panel */}
      <div className="mt-golden-2 border border-cyan/20 bg-cyan/5 p-golden-2">
        <div className="flex items-center gap-golden-1 mb-golden-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan/60">
            STEM Grounding
          </span>
          <span className="text-[10px] font-mono text-cyan/60">{STEM.crate}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-golden-2">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">
              Primary Trait
            </span>
            <span className="text-sm font-semibold text-white">{STEM.trait}</span>
            <span className="text-xs text-slate-dim/70 block">{STEM.domain}</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">
              T1 Primitive
            </span>
            <span className="text-sm font-mono text-cyan">{STEM.t1}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">
              Transfer
            </span>
            <span className="text-xs text-slate-dim/70 leading-golden">{STEM.transfer}</span>
          </div>
        </div>
        <div className="mt-golden-1 flex items-center gap-golden-1 flex-wrap">
          <span className="text-[10px] font-mono uppercase text-slate-dim/70">MCP Tools:</span>
          {STEM.tools.map((t) => (
            <code
              key={t}
              className="text-[10px] font-mono px-1.5 py-0.5 bg-nex-surface border border-nex-light text-gold/70"
            >
              {t}
            </code>
          ))}
        </div>
      </div>

      {/* Cohort comparison table */}
      <div className="mt-golden-2 border border-teal-500/20 bg-teal-500/5">
        <div className="px-golden-2 py-golden-1 border-b border-teal-500/20">
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400/70">
            Cohort Comparison
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono" aria-label="Cohort comparison">
            <thead>
              <tr className="border-b border-teal-500/10">
                <th className="text-left px-golden-2 py-1.5 text-slate-dim/50 font-normal uppercase tracking-wider">
                  Cohort
                </th>
                <th className="text-right px-golden-2 py-1.5 text-slate-dim/50 font-normal uppercase tracking-wider">
                  Population
                </th>
                <th className="text-right px-golden-2 py-1.5 text-slate-dim/50 font-normal uppercase tracking-wider">
                  Incidence
                </th>
                <th className="text-right px-golden-2 py-1.5 text-slate-dim/50 font-normal uppercase tracking-wider">
                  Prevalence
                </th>
                <th className="text-right px-golden-2 py-1.5 text-slate-dim/50 font-normal uppercase tracking-wider">
                  RR
                </th>
                <th className="text-right px-golden-2 py-1.5 text-slate-dim/50 font-normal uppercase tracking-wider">
                  AF%
                </th>
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map((c, i) => {
                const isSelected = i === selectedCohortIndex
                return (
                  <tr
                    key={c.name}
                    onClick={() => handleCohortSelect(i)}
                    className={`border-b border-teal-500/10 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-teal-500/10 text-teal-400'
                        : 'text-slate-dim/70 hover:bg-teal-500/5 hover:text-white'
                    }`}
                  >
                    <td className="px-golden-2 py-1.5 font-medium">{c.name}</td>
                    <td className="px-golden-2 py-1.5 text-right">
                      {formatPopulation(c.population)}
                    </td>
                    <td className="px-golden-2 py-1.5 text-right">{formatRate(c.incidenceRate)}</td>
                    <td className="px-golden-2 py-1.5 text-right">{formatRate(c.prevalence)}</td>
                    <td className={`px-golden-2 py-1.5 text-right font-semibold ${
                      c.relativeRisk > 2
                        ? 'text-red-400'
                        : c.relativeRisk > 1
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}>
                      {c.relativeRisk.toFixed(2)}
                    </td>
                    <td className="px-golden-2 py-1.5 text-right">
                      {(c.attributableFraction * 100).toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
