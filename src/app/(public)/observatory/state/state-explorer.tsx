'use client'

import { useState, useMemo, useCallback } from 'react'
import { useExplorerEffects } from '@/lib/observatory/use-explorer-effects'
import { useObservatoryPreferences } from '@/lib/observatory/use-observatory-preferences'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Orbit } from 'lucide-react'
import type { StateNode, StateTransition, StateLayout } from '@/components/observatory'
import { COLORS, STRINGS, CAMERA, LAYOUT } from '@/components/observatory'
import { ExplorerNav } from '@/components/observatory/explorer-shared'

const SceneContainer = dynamic(
  () => import('@/components/observatory/scene-container').then(m => ({ default: m.SceneContainer })),
  {
    ssr: false,
    loading: () => <div className="h-[600px] flex items-center justify-center border border-nex-border bg-nex-surface animate-pulse"><p className="text-xs text-slate-dim/50 font-mono">Loading 3D scene...</p></div>,
  }
)
const StateOrbit3D = dynamic(
  () => import('@/components/observatory/state-orbit-3d').then(m => ({ default: m.StateOrbit3D })),
  { ssr: false }
)

type MachineKey = 'guardian' | 'gestation' | 'meiosis' | 'session' | 'signal-lifecycle' | 'tov-assessment'

interface MachineStem {
  trait: string
  domain: string
  t1: string
  transfer: string
  crate: string
  tools: string[]
}

interface MachineDef {
  label: string
  description: string
  centralLabel: string
  states: StateNode[]
  transitions: StateTransition[]
  /** STEM grounding — traces state machine to STEM primitives */
  stem?: MachineStem
}

const MACHINES: Record<MachineKey, MachineDef> = {
  guardian: {
    label: 'Guardian Homeostasis',
    description: 'The Guardian control loop: SENSE \u2192 DECIDE \u2192 RESPOND \u2192 FEEDBACK, maintaining system health through continuous monitoring and threat escalation.',
    centralLabel: 'Homeostasis',
    stem: {
      trait: 'Harmonize',
      domain: 'Chemistry',
      t1: '\u03c2 State',
      transfer: 'System \u2192 Equilibrium \u2014 the control loop drives toward homeostatic balance through feedback',
      crate: 'stem-chem',
      tools: ['guardian_homeostasis_tick', 'guardian_status'],
    },
    states: [
      { id: 'sense', label: 'SENSE', color: '#7B95B5', active: true, size: 0.5 },
      { id: 'decide', label: 'DECIDE', color: '#94ABC5', size: 0.45 },
      { id: 'respond', label: 'RESPOND', color: '#D4AF37', size: 0.45 },
      { id: 'feedback', label: 'FEEDBACK', color: '#F4D03F', size: 0.4 },
      { id: 'alert', label: 'ALERT', color: '#ef4444', size: 0.35 },
      { id: 'cooldown', label: 'COOLDOWN', color: '#22c55e', size: 0.35 },
    ],
    transitions: [
      { from: 'sense', to: 'decide', label: 'signals collected', probability: 0.95 },
      { from: 'decide', to: 'respond', label: 'action chosen', probability: 0.85 },
      { from: 'respond', to: 'feedback', label: 'action taken', probability: 0.90 },
      { from: 'feedback', to: 'sense', label: 'loop complete', probability: 0.80 },
      { from: 'decide', to: 'alert', label: 'threat detected', probability: 0.15 },
      { from: 'alert', to: 'respond', label: 'escalated', probability: 0.70 },
      { from: 'respond', to: 'cooldown', label: 'resolved', probability: 0.10 },
      { from: 'cooldown', to: 'sense', label: 'stabilized', probability: 0.95 },
    ],
  },
  gestation: {
    label: 'Trimester Gestation',
    description: 'Release candidate lifecycle: Conception \u2192 T1 (fmt/lint) \u2192 T2 (test) \u2192 T3 (build) \u2192 Birth. Probabilistic gate at each trimester boundary.',
    centralLabel: 'Release',
    stem: {
      trait: 'Experiment',
      domain: 'Science',
      t1: '\u03c3 Sequence',
      transfer: 'Action \u2192 Outcome \u2014 each trimester is a sequential gate testing release fitness',
      crate: 'stem-core',
      tools: ['cargo_check', 'cargo_clippy', 'cargo_test', 'cargo_build'],
    },
    states: [
      { id: 'conception', label: 'Conception', color: '#a855f7', size: 0.4 },
      { id: 't1', label: 'Trimester 1', color: '#7B95B5', active: true, size: 0.5 },
      { id: 't2', label: 'Trimester 2', color: '#94ABC5', size: 0.5 },
      { id: 't3', label: 'Trimester 3', color: '#D4AF37', size: 0.5 },
      { id: 'birth', label: 'Birth', color: '#22c55e', size: 0.55 },
      { id: 'miscarriage', label: 'Miscarriage', color: '#ef4444', size: 0.35 },
    ],
    transitions: [
      { from: 'conception', to: 't1', label: 'branch created', probability: 0.95 },
      { from: 't1', to: 't2', label: 'fmt+clippy pass', probability: 0.85 },
      { from: 't2', to: 't3', label: 'tests pass', probability: 0.80 },
      { from: 't3', to: 'birth', label: 'build passes', probability: 0.90 },
      { from: 't1', to: 'miscarriage', label: 'lint fail', probability: 0.15 },
      { from: 't2', to: 'miscarriage', label: 'test fail', probability: 0.20 },
      { from: 't3', to: 'miscarriage', label: 'build fail', probability: 0.10 },
    ],
  },
  meiosis: {
    label: 'Meiotic Division',
    description: 'Sexual reproduction: two parents combine genetic material through phased recombination. Models crate cross-pollination and feature merging.',
    centralLabel: 'Recombination',
    stem: {
      trait: 'Transform',
      domain: 'Chemistry',
      t1: '\u03bc Mapping',
      transfer: 'Reactants \u2192 Products \u2014 genetic material transforms through phased recombination stages',
      crate: 'stem-chem',
      tools: ['stem_chem_rate', 'stem_chem_fraction'],
    },
    states: [
      { id: 'prophase', label: 'Prophase I', color: '#a855f7', size: 0.45 },
      { id: 'crossing', label: 'Crossing Over', color: '#7B95B5', active: true, size: 0.5 },
      { id: 'metaphase', label: 'Metaphase I', color: '#94ABC5', size: 0.45 },
      { id: 'anaphase', label: 'Anaphase I', color: '#D4AF37', size: 0.45 },
      { id: 'telophase', label: 'Telophase I', color: '#F4D03F', size: 0.4 },
      { id: 'meiosis2', label: 'Meiosis II', color: '#22c55e', size: 0.45 },
      { id: 'complete', label: 'Complete', color: '#10b981', size: 0.5 },
    ],
    transitions: [
      { from: 'prophase', to: 'crossing', label: 'homologs paired', probability: 0.95 },
      { from: 'crossing', to: 'metaphase', label: 'genes exchanged', probability: 0.90 },
      { from: 'metaphase', to: 'anaphase', label: 'aligned', probability: 0.95 },
      { from: 'anaphase', to: 'telophase', label: 'separated', probability: 0.90 },
      { from: 'telophase', to: 'meiosis2', label: 'first division', probability: 0.85 },
      { from: 'meiosis2', to: 'complete', label: 'haploid', probability: 0.90 },
    ],
  },
  session: {
    label: 'Claude Session Lifecycle',
    description: 'Session lifecycle: Start \u2192 hooks fire \u2192 work \u2192 compact \u2192 stop \u2192 handoff. State transitions driven by context pressure and user interaction.',
    centralLabel: 'Session',
    stem: {
      trait: 'Regulate',
      domain: 'Chemistry',
      t1: '\u03c1 Recursion',
      transfer: 'Inhibitor \u2192 Rate decrease \u2014 context pressure regulates session throughput via compaction feedback',
      crate: 'stem-chem',
      tools: ['hooks_for_event', 'hooks_stats'],
    },
    states: [
      { id: 'start', label: 'SessionStart', color: '#7B95B5', size: 0.45 },
      { id: 'bootstrap', label: 'Bootstrap', color: '#94ABC5', size: 0.4 },
      { id: 'active', label: 'Active Work', color: '#22c55e', active: true, size: 0.55 },
      { id: 'compact', label: 'PreCompact', color: '#D4AF37', size: 0.4 },
      { id: 'stop', label: 'Stop', color: '#F4D03F', size: 0.45 },
      { id: 'handoff', label: 'Handoff', color: '#a855f7', size: 0.4 },
    ],
    transitions: [
      { from: 'start', to: 'bootstrap', label: '7 hooks fire', probability: 0.95 },
      { from: 'bootstrap', to: 'active', label: 'ready', probability: 0.90 },
      { from: 'active', to: 'compact', label: 'context full', probability: 0.30 },
      { from: 'compact', to: 'active', label: 'compressed', probability: 0.95 },
      { from: 'active', to: 'stop', label: 'user exits', probability: 0.70 },
      { from: 'stop', to: 'handoff', label: '7 hooks fire', probability: 0.85 },
    ],
  },
  'signal-lifecycle': {
    label: 'Signal Lifecycle',
    description: 'PV signal lifecycle: Detection \u2192 Validation \u2192 Assessment \u2192 Communication \u2192 Action \u2192 Monitoring. Each transition is gated by statistical thresholds (PRR \u2265 2.0, \u03c7\u00b2 \u2265 3.84, IC\u2080\u2082\u2085 > 0).',
    centralLabel: 'Signal',
    stem: {
      trait: 'Classify',
      domain: 'Science',
      t1: '\u03bc Mapping',
      transfer: 'Signal \u2192 Category \u2014 each gate maps statistical evidence to signal/noise classification',
      crate: 'stem-core',
      tools: ['pv_signal_prr', 'pv_signal_ror', 'pv_signal_ic', 'pv_chi_square'],
    },
    states: [
      { id: 'noise', label: 'Noise', color: '#64748b', size: 0.4 },
      { id: 'detected', label: 'Detected', color: '#f97316', size: 0.45 },
      { id: 'validated', label: 'Validated', color: '#7B95B5', active: true, size: 0.5 },
      { id: 'confirmed', label: 'Confirmed', color: '#D4AF37', size: 0.5 },
      { id: 'assessed', label: 'Assessed', color: '#a855f7', size: 0.45 },
      { id: 'communicated', label: 'Communicated', color: '#94ABC5', size: 0.4 },
      { id: 'action', label: 'Action', color: '#22c55e', size: 0.55 },
      { id: 'monitoring', label: 'Monitoring', color: '#F4D03F', size: 0.4 },
    ],
    transitions: [
      { from: 'noise', to: 'detected', label: 'PRR \u2265 2.0', probability: 0.15 },
      { from: 'detected', to: 'validated', label: '\u03c7\u00b2 \u2265 3.84', probability: 0.60 },
      { from: 'detected', to: 'noise', label: 'below threshold', probability: 0.40 },
      { from: 'validated', to: 'confirmed', label: 'IC\u2080\u2082\u2085 > 0', probability: 0.75 },
      { from: 'confirmed', to: 'assessed', label: 'Naranjo score', probability: 0.85 },
      { from: 'assessed', to: 'communicated', label: 'risk evaluated', probability: 0.90 },
      { from: 'communicated', to: 'action', label: 'regulatory decision', probability: 0.70 },
      { from: 'action', to: 'monitoring', label: 'measure impact', probability: 0.95 },
      { from: 'monitoring', to: 'noise', label: 'signal resolved', probability: 0.50 },
      { from: 'monitoring', to: 'detected', label: 'signal persists', probability: 0.50 },
    ],
  },
  'tov-assessment': {
    label: 'ToV Assessment',
    description: 'Theory of Vigilance harm assessment flow: Screen \u2192 Classify harm type (A\u2013H) \u2192 Measure safety distance d(s) \u2192 Score with Guardian-AV \u2192 Decide \u2192 Act. The 8 harm types form the complete taxonomy of pharmaceutical harm.',
    centralLabel: 'Vigilance',
    stem: {
      trait: 'Sense',
      domain: 'Science',
      t1: '\u03bc Mapping',
      transfer: 'Environment \u2192 Signal \u2014 ToV senses harm through 8 irreducible types, maps to safety distance d(s)',
      crate: 'stem-core',
      tools: ['vigilance_safety_margin', 'vigilance_risk_score', 'vigilance_harm_types', 'guardian_evaluate_pv'],
    },
    states: [
      { id: 'screen', label: 'Screen', color: '#7B95B5', size: 0.45 },
      { id: 'classify', label: 'Classify A\u2013H', color: '#f97316', active: true, size: 0.5 },
      { id: 'measure', label: 'Measure d(s)', color: '#a855f7', size: 0.5 },
      { id: 'score', label: 'Guardian Score', color: '#D4AF37', size: 0.5 },
      { id: 'decide', label: 'Risk Decision', color: '#94ABC5', size: 0.45 },
      { id: 'act', label: 'Mitigate', color: '#22c55e', size: 0.5 },
      { id: 'escalate', label: 'Escalate', color: '#ef4444', size: 0.4 },
    ],
    transitions: [
      { from: 'screen', to: 'classify', label: 'signal confirmed', probability: 0.85 },
      { from: 'classify', to: 'measure', label: 'harm type assigned', probability: 0.90 },
      { from: 'measure', to: 'score', label: 'd(s) computed', probability: 0.95 },
      { from: 'score', to: 'decide', label: 'risk quantified', probability: 0.85 },
      { from: 'decide', to: 'act', label: 'acceptable risk', probability: 0.60 },
      { from: 'decide', to: 'escalate', label: 'unacceptable risk', probability: 0.40 },
      { from: 'escalate', to: 'act', label: 'urgent action', probability: 0.90 },
      { from: 'act', to: 'screen', label: 'monitor outcome', probability: 0.80 },
    ],
  },
}

export function StateExplorer() {
  const [machineKey, setMachineKey] = useState<MachineKey>('guardian')
  const [selected, setSelected] = useState<StateNode | null>(null)
  const [stateLayout, setStateLayout] = useState<StateLayout>('orbital')
  const { preferences } = useObservatoryPreferences()
  const {
    enableBloom, setEnableBloom,
    enableSSAO, setEnableSSAO,
    enableVignette, setEnableVignette,
    enableDoF, setEnableDoF,
    enableChromaticAberration, setEnableChromaticAberration,
    postProcessing, theme,
  } = useExplorerEffects()

  const machine = useMemo(() => MACHINES[machineKey], [machineKey])

  const metrics = useMemo(() => {
    const n = machine.states.length
    const t = machine.transitions.length
    const avgProb = machine.transitions.reduce((sum, tr) => sum + (tr.probability ?? 0), 0) / t
    const activeCount = machine.states.filter(s => s.active).length
    return { states: n, transitions: t, avgProb, activeCount }
  }, [machine])

  const handleStateClick = useCallback((state: StateNode) => {
    setSelected(state)
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">
      {/* Header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <Link href="/observatory" className="text-slate-dim/70 hover:text-cyan transition-colors text-sm">
            Observatory
          </Link>
          <span className="text-nex-light">/</span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-emerald/30 bg-emerald/5">
            <Orbit className="h-4 w-4 text-emerald" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-emerald/70">{STRINGS.brandSubtitle}</p>
            <h1 className="text-sm font-semibold text-white">State Machines</h1>
          </div>
        </div>
      </header>

      <ExplorerNav current="state" />

      {/* Machine selector */}
      <div className="flex flex-wrap items-center gap-golden-1 mb-golden-3">
        {(Object.keys(MACHINES) as MachineKey[]).map((key) => (
          <button
            key={key}
            onClick={() => { setMachineKey(key); setSelected(null) }}
            aria-pressed={machineKey === key}
            className={`px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              machineKey === key
                ? 'bg-emerald/20 text-emerald border border-emerald/40'
                : 'bg-nex-surface text-slate-dim/70 border border-nex-light hover:border-emerald/30 hover:text-white'
            }`}
          >
            {MACHINES[key].label}
          </button>
        ))}
      </div>

      {/* View Mode */}
      <div className="flex items-center gap-golden-1 mb-golden-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/70 mr-golden-1">View</span>
        {(['orbital', 'flow', 'ring'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setStateLayout(mode)}
            aria-pressed={stateLayout === mode}
            className={`px-2.5 py-1 text-xs font-mono transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              stateLayout === mode
                ? 'bg-emerald/20 text-emerald border border-emerald/40'
                : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-emerald/30 hover:text-white'
            }`}
          >
            {mode === 'orbital' ? 'Orbital' : mode === 'flow' ? 'Flow' : 'Ring'}
          </button>
        ))}
      </div>

      {/* Effects */}
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

      {/* Scene */}
      <div style={{ height: LAYOUT.sceneHeightCSS }}>
        <SceneContainer
          sceneLabel={`3D orbital visualization of ${machine.label} state machine`}
          cameraPosition={
            stateLayout === 'flow' ? [0, 4, 18] :
            stateLayout === 'ring' ? [0, 8, 8] :
            [...CAMERA.statePosition]
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
          <StateOrbit3D
            states={machine.states}
            transitions={machine.transitions}
            onStateClick={handleStateClick}
            centralLabel={machine.centralLabel}
            orbitRadius={3.5}
            layout={stateLayout}
          />
        </SceneContainer>
      </div>

      {/* Metrics */}
      <div className="mt-golden-3 grid grid-cols-2 md:grid-cols-4 gap-golden-2">
        <div className="border border-emerald/20 bg-emerald/5 p-golden-1">
          <span className="text-[10px] font-mono uppercase text-emerald/70">States |S|</span>
          <p className="text-lg font-semibold text-white">{metrics.states}</p>
        </div>
        <div className="border border-emerald/20 bg-emerald/5 p-golden-1">
          <span className="text-[10px] font-mono uppercase text-emerald/70">Transitions</span>
          <p className="text-lg font-semibold text-white">{metrics.transitions}</p>
        </div>
        <div className="border border-emerald/20 bg-emerald/5 p-golden-1">
          <span className="text-[10px] font-mono uppercase text-emerald/70">Avg P(t)</span>
          <p className="text-lg font-semibold text-white">{(metrics.avgProb * 100).toFixed(0)}%</p>
        </div>
        <div className="border border-emerald/20 bg-emerald/5 p-golden-1">
          <span className="text-[10px] font-mono uppercase text-emerald/70">Active</span>
          <p className="text-lg font-semibold text-white">{metrics.activeCount}</p>
        </div>
      </div>

      {/* Info */}
      <div className="mt-golden-2 border border-nex-light bg-nex-surface p-golden-2">
        <h3 className="text-base font-semibold text-white mb-golden-1">{machine.label}</h3>
        <p className="text-sm text-slate-dim/70 leading-golden">{machine.description}</p>
      </div>

      {/* STEM Grounding */}
      {machine.stem && (
        <div className="mt-golden-2 border border-cyan/20 bg-cyan/5 p-golden-2">
          <div className="flex items-center gap-golden-1 mb-golden-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan/60">STEM Grounding</span>
            <span className="text-[10px] font-mono text-cyan/60">{machine.stem.crate}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-golden-2">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">Trait</span>
              <span className="text-sm font-semibold text-white">{machine.stem.trait}</span>
              <span className="text-xs text-slate-dim/70 block">{machine.stem.domain} &middot; {machine.stem.t1}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] font-mono uppercase text-slate-dim/70 block">Transfer</span>
              <span className="text-xs text-slate-dim/70 leading-golden">{machine.stem.transfer}</span>
            </div>
          </div>
          <div className="mt-golden-1 flex items-center gap-golden-1 flex-wrap">
            <span className="text-[10px] font-mono uppercase text-slate-dim/70">MCP Tools:</span>
            {machine.stem.tools.map(t => (
              <code key={t} className="text-[10px] font-mono px-1.5 py-0.5 bg-nex-surface border border-nex-light text-gold/70">{t}</code>
            ))}
          </div>
        </div>
      )}

      {/* Selected state detail */}
      {selected && (
        <div className="mt-golden-2 p-golden-2 border border-cyan/20 bg-cyan/5">
          <div className="flex items-center gap-golden-2">
            <div
              className="w-3 h-3"
              style={{ backgroundColor: selected.color ?? COLORS.cyan }}
            />
            <span className="text-base font-semibold text-white">{selected.label}</span>
            {selected.active && (
              <span className="text-xs px-2 py-0.5 border border-emerald/30 bg-emerald/10 text-emerald">
                Active
              </span>
            )}
            <button
              onClick={() => setSelected(null)}
              aria-label="Dismiss selection"
              className="ml-auto text-slate-dim/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 px-1"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="mt-golden-1 flex gap-golden-2 text-sm text-slate-dim/70">
            <span>
              Outgoing: {machine.transitions.filter(t => t.from === selected.id).length}
            </span>
            <span>
              Incoming: {machine.transitions.filter(t => t.to === selected.id).length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
