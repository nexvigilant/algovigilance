'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Telescope, Dna, FlaskConical, Swords,
  Building2, Music, Stethoscope, Lock, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DOMAIN_LENSES,
  SYSTEM_COMPONENTS,
  type DomainLens,
  type SystemComponent,
} from '@/lib/observatory/domain-translations'

const LENS_ICONS: Record<string, typeof Dna> = {
  biology: Dna,
  clinical: Stethoscope,
  chemistry: FlaskConical,
  military: Swords,
  city: Building2,
  orchestra: Music,
}

/** Confidence badge color */
function confidenceColor(c: number): string {
  if (c >= 0.95) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
  if (c >= 0.90) return 'text-cyan bg-cyan/10 border-cyan/30'
  if (c >= 0.85) return 'text-amber-400 bg-amber-400/10 border-amber-400/30'
  return 'text-slate-dim bg-nex-surface border-nex-light'
}

const COMPONENT_ORDER: SystemComponent[] = [
  'foundation', 'domain', 'orchestration', 'service', 'eventFlow',
  'security', 'dataPipeline', 'frontend', 'configuration', 'compute',
]

export function AtlasExplorer() {
  const [activeLens, setActiveLens] = useState<string>('biology')
  const [compareLens, setCompareLens] = useState<string | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<SystemComponent | null>(null)
  const prefersReducedMotion = useReducedMotion()

  const lens = DOMAIN_LENSES.find(l => l.id === activeLens)
  const compare = compareLens ? DOMAIN_LENSES.find(l => l.id === compareLens) : null

  const selectLens = useCallback((id: string) => {
    const target = DOMAIN_LENSES.find(l => l.id === id)
    if (!target?.available) return
    if (compareLens === id) {
      setCompareLens(null)
    } else if (activeLens === id && compareLens) {
      setActiveLens(compareLens)
      setCompareLens(null)
    } else {
      setActiveLens(id)
    }
  }, [activeLens, compareLens])

  const toggleCompare = useCallback((id: string) => {
    if (id === activeLens) return
    const target = DOMAIN_LENSES.find(l => l.id === id)
    if (!target?.available) return
    setCompareLens(prev => prev === id ? null : id)
  }, [activeLens])

  if (!lens) return null

  return (
    <div className="min-h-screen bg-nex-deep">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-nex-light bg-nex-deep/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link
            href="/observatory"
            className="flex h-8 w-8 items-center justify-center border border-nex-light hover:border-cyan/40 transition-colors"
            aria-label="Back to Observatory"
          >
            <ArrowLeft className="h-4 w-4 text-slate-dim" />
          </Link>
          <Telescope className="h-5 w-5 text-cyan/60" aria-hidden="true" />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Domain Atlas</h1>
            <p className="text-xs text-slate-dim">Cross-domain architecture translation</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan/10 text-cyan border border-cyan/30 rounded-sm">
            Preview
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Lens Selector */}
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
            Select Domain Lens
          </p>
          <div className="flex flex-wrap gap-2">
            {DOMAIN_LENSES.map((l) => {
              const Icon = LENS_ICONS[l.id] ?? Sparkles
              const isActive = l.id === activeLens
              const isCompare = l.id === compareLens
              return (
                <button
                  key={l.id}
                  onClick={() => selectLens(l.id)}
                  onContextMenu={(e) => { e.preventDefault(); toggleCompare(l.id) }}
                  disabled={!l.available}
                  className={cn(
                    'group relative flex items-center gap-2 px-3 py-2 border text-sm font-medium transition-all rounded-sm',
                    isActive
                      ? 'border-current bg-current/10 text-current'
                      : isCompare
                        ? 'border-current/50 bg-current/5 text-current/80'
                        : l.available
                          ? 'border-nex-light text-slate-dim hover:text-slate-light hover:border-slate-dim/50'
                          : 'border-nex-light/50 text-slate-dim/40 cursor-not-allowed'
                  )}
                  style={isActive || isCompare ? { color: l.color } : undefined}
                  title={l.available ? `${l.tagline}${l.id !== activeLens ? ' — right-click to compare' : ''}` : 'Coming soon'}
                >
                  {!l.available && <Lock className="h-3 w-3" aria-hidden="true" />}
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{l.name}</span>
                  {isActive && (
                    <span className="text-[9px] font-mono opacity-60">Active</span>
                  )}
                  {isCompare && (
                    <span className="text-[9px] font-mono opacity-60">vs</span>
                  )}
                  {!l.available && (
                    <span className="text-[9px] font-mono px-1 py-0.5 bg-nex-light rounded-sm">Soon</span>
                  )}
                </button>
              )
            })}
          </div>
          {compareLens && (
            <p className="mt-2 text-xs text-slate-dim">
              Comparing <span style={{ color: lens.color }}>{lens.name}</span> vs{' '}
              <span style={{ color: compare?.color }}>{compare?.name}</span>
              {' '}— right-click a lens to change comparison
            </p>
          )}
        </div>

        {/* Main Translation Grid */}
        <div className="mb-8">
          <div className="grid gap-3">
            {/* Header row */}
            <div className={cn(
              'grid gap-3',
              compare ? 'grid-cols-[180px_1fr_1fr]' : 'grid-cols-[180px_1fr]'
            )}>
              <div className="text-xs font-mono uppercase tracking-widest text-slate-dim/50 self-end pb-1">
                System Component
              </div>
              <div className="text-xs font-mono uppercase tracking-widest self-end pb-1" style={{ color: lens.color }}>
                {lens.name} Lens
              </div>
              {compare && (
                <div className="text-xs font-mono uppercase tracking-widest self-end pb-1" style={{ color: compare.color }}>
                  {compare.name} Lens
                </div>
              )}
            </div>

            {/* Translation rows */}
            <AnimatePresence mode="wait">
              {COMPONENT_ORDER.map((comp, i) => {
                const sys = SYSTEM_COMPONENTS[comp]
                const t = lens.translations[comp]
                const ct = compare?.translations[comp]
                const isHovered = hoveredComponent === comp
                return (
                  <motion.div
                    key={`${activeLens}-${compareLens}-${comp}`}
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className={cn(
                      'grid gap-3 group',
                      compare ? 'grid-cols-[180px_1fr_1fr]' : 'grid-cols-[180px_1fr]'
                    )}
                    onMouseEnter={() => setHoveredComponent(comp)}
                    onMouseLeave={() => setHoveredComponent(null)}
                  >
                    {/* Component name */}
                    <div className={cn(
                      'border border-nex-light p-3 transition-colors',
                      isHovered && 'border-slate-dim/40 bg-nex-surface'
                    )}>
                      <p className="text-sm font-medium text-slate-light">{sys.name}</p>
                      <p className="text-[10px] font-mono text-slate-dim/60 mt-0.5">{sys.crate}</p>
                    </div>

                    {/* Primary translation */}
                    <TranslationCard
                      translation={t}
                      color={lens.color}
                      isHovered={isHovered}
                    />

                    {/* Compare translation */}
                    {compare && ct && (
                      <TranslationCard
                        translation={ct}
                        color={compare.color}
                        isHovered={isHovered}
                      />
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Primitive Decomposition Legend */}
        <PrimitiveDecomposition lens={lens} compare={compare ?? undefined} />

        {/* Bottom: Domain Translator CTA */}
        <div className="mt-8 border border-cyan/20 bg-cyan/5 p-6 text-center">
          <Sparkles className="h-6 w-6 text-cyan mx-auto mb-2" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-white mb-1">Domain Translator Engine</h3>
          <p className="text-sm text-slate-dim max-w-lg mx-auto mb-3">
            Powered by T1 primitive decomposition. Every concept in any domain can be
            decomposed to 15 irreducible primitives, then recomposed in a target domain —
            preserving structural relationships while swapping vocabulary.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-dim">
            <span>6 domain lenses</span>
            <span className="text-nex-light">|</span>
            <span>10 system components</span>
            <span className="text-nex-light">|</span>
            <span>60 translations</span>
            <span className="text-nex-light">|</span>
            <span>15 T1 primitives</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TranslationCard({
  translation,
  color,
  isHovered,
}: {
  translation: { name: string; description: string; primitives: string[]; confidence: number }
  color: string
  isHovered: boolean
}) {
  return (
    <div
      className={cn(
        'border p-3 transition-all',
        isHovered ? 'bg-current/5 border-current/30' : 'border-nex-light bg-nex-surface/50'
      )}
      style={isHovered ? { borderColor: `${color}40`, backgroundColor: `${color}08` } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color }}>
            {translation.name}
          </p>
          <p className="text-xs text-slate-dim/70 mt-0.5 leading-relaxed">
            {translation.description}
          </p>
        </div>
        <span className={cn(
          'text-[10px] font-mono px-1.5 py-0.5 border rounded-sm shrink-0',
          confidenceColor(translation.confidence)
        )}>
          {Math.round(translation.confidence * 100)}%
        </span>
      </div>
      <div className="flex gap-1 mt-2">
        {translation.primitives.map((p) => (
          <span
            key={p}
            className="text-[10px] font-mono px-1 py-0.5 bg-nex-light/50 text-slate-dim rounded-sm"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}

function PrimitiveDecomposition({ lens, compare }: { lens: DomainLens; compare?: DomainLens }) {
  // Collect all unique primitives used across translations
  const primitiveCounts: Record<string, number> = {}
  for (const t of Object.values(lens.translations)) {
    for (const p of t.primitives) {
      primitiveCounts[p] = (primitiveCounts[p] ?? 0) + 1
    }
  }
  if (compare) {
    for (const t of Object.values(compare.translations)) {
      for (const p of t.primitives) {
        primitiveCounts[p] = (primitiveCounts[p] ?? 0) + 1
      }
    }
  }

  const PRIMITIVE_NAMES: Record<string, string> = {
    '→': 'Causality', 'N': 'Quantity', '∃': 'Existence', 'κ': 'Comparison',
    'ς': 'State', 'μ': 'Mapping', 'σ': 'Sequence', 'ρ': 'Recursion',
    '∅': 'Void', '∂': 'Boundary', 'ν': 'Frequency', 'λ': 'Location',
    'π': 'Persistence', '∝': 'Irreversibility', 'Σ': 'Sum',
  }

  const sorted = Object.entries(primitiveCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="border border-nex-light bg-nex-surface p-4">
      <h3 className="text-sm font-semibold text-white mb-3">
        Primitive Decomposition — Why These Translations Work
      </h3>
      <p className="text-xs text-slate-dim/70 mb-3">
        Each translation is grounded in shared T1 primitives. The more primitives
        two concepts share, the higher the translation confidence.
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map(([p, count]) => (
          <div
            key={p}
            className="flex items-center gap-1.5 border border-nex-light px-2 py-1 rounded-sm"
          >
            <span className="text-cyan font-mono font-bold text-sm">{p}</span>
            <span className="text-xs text-slate-dim">{PRIMITIVE_NAMES[p]}</span>
            <span className="text-[10px] font-mono text-slate-dim/50 ml-1">
              {count}x
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
