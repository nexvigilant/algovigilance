'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Telescope, Network, Sigma, Orbit, Briefcase, GraduationCap,
  FlaskConical, Scale, GitBranch, Clock, Users, Atom, Dna,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useObservatoryPreferences } from '@/lib/observatory/use-observatory-preferences'
import { ObservatorySettings } from '@/components/observatory/observatory-settings'
import type { ObservatoryExplorerType } from '@/lib/observatory/explorer-registry'
import { AtmosphereLayers, ATMOSPHERE_DEEP_SPACE } from '@/components/ui/branded/atmosphere-layers'
import { CircuitBackground, CIRCUIT_PRESET_DEEP_SPACE } from '@/components/ui/branded/circuit-background'
import { SPHERE_PRESET_OBSERVATORY } from '@/components/ui/branded/shader-sphere'

const ShaderSphere = dynamic(
  () => import('@/components/ui/branded/shader-sphere').then(m => ({ default: m.ShaderSphere })),
  { ssr: false, loading: () => <div className="h-[160px] w-[160px] rounded-full bg-nex-dark/50 animate-pulse" /> }
)

interface Section {
  title: string
  description: string
  href: string
  explorerType: ObservatoryExplorerType
  icon: LucideIcon
  borderClass: string
  bgClass: string
  textClass: string
  dimClass: string
  badge?: string
}

// ─── Drug Lifecycle Explorers ─────────────────────────────────────────────────

const LIFECYCLE_SECTIONS: Section[] = [
  {
    title: 'Chemistry',
    description: 'Pre-clinical compound analysis. ADME profiles, Hill dose-response, binding landscapes, and saturation kinetics as 3D energy surfaces.',
    href: '/observatory/chemistry',
    explorerType: 'chemistry',
    icon: FlaskConical,
    borderClass: 'border-rose-500/30',
    bgClass: 'bg-rose-500/5',
    textClass: 'text-rose-400',
    dimClass: 'text-rose-400/60',
    badge: 'Pre-clinical',
  },
  {
    title: 'Molecule',
    description: 'Atom-bond graphs with CPK coloring, charge distribution glow, and conformational energy landscapes. CVD-safe element encoding.',
    href: '/observatory/molecule',
    explorerType: 'molecule',
    icon: Atom,
    borderClass: 'border-fuchsia-500/30',
    bgClass: 'bg-fuchsia-500/5',
    textClass: 'text-fuchsia-400',
    dimClass: 'text-fuchsia-400/60',
    badge: 'Pre-clinical',
  },
  {
    title: 'Regulatory',
    description: 'ICH guideline milestones, FDA compliance checkpoints, and approval dependencies as force-directed pipeline graphs. 2,794 guidance docs.',
    href: '/observatory/regulatory',
    explorerType: 'regulatory',
    icon: Scale,
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-500/5',
    textClass: 'text-amber-400',
    dimClass: 'text-amber-400/60',
    badge: 'Regulatory',
  },
  {
    title: 'Causality',
    description: 'Bradford Hill criteria, Naranjo scoring, and WHO-UMC causality classification as 3D evidence networks. Signal-to-causality mapping.',
    href: '/observatory/causality',
    explorerType: 'causality',
    icon: GitBranch,
    borderClass: 'border-orange-500/30',
    bgClass: 'bg-orange-500/5',
    textClass: 'text-orange-400',
    dimClass: 'text-orange-400/60',
    badge: 'Post-market',
  },
  {
    title: 'Timeline',
    description: 'Signal velocity and distribution drift across the drug lifecycle. KS test, PSI, and JSD statistical drift detection on temporal axes.',
    href: '/observatory/timeline',
    explorerType: 'timeline',
    icon: Clock,
    borderClass: 'border-sky-500/30',
    bgClass: 'bg-sky-500/5',
    textClass: 'text-sky-400',
    dimClass: 'text-sky-400/60',
    badge: 'Post-market',
  },
  {
    title: 'Epidemiology',
    description: 'Kaplan-Meier survival surfaces, incidence rate topography, and population risk contours. NNT, attributable fraction, and SMR computation.',
    href: '/observatory/epidemiology',
    explorerType: 'epidemiology',
    icon: Users,
    borderClass: 'border-teal-500/30',
    bgClass: 'bg-teal-500/5',
    textClass: 'text-teal-400',
    dimClass: 'text-teal-400/60',
    badge: 'Population',
  },
]

// ─── Platform Explorers ───────────────────────────────────────────────────────

const PLATFORM_SECTIONS: Section[] = [
  {
    title: 'Graph Theory',
    description: 'Force-directed networks in 3D. Dependency graphs, signal detection pipelines, Theory of Vigilance harm taxonomies, and string theory dimensional structures.',
    href: '/observatory/graph',
    explorerType: 'graph',
    icon: Network,
    borderClass: 'border-cyan/30',
    bgClass: 'bg-cyan/5',
    textClass: 'text-cyan',
    dimClass: 'text-cyan/60',
  },
  {
    title: 'Mathematics',
    description: 'Parametric surfaces spanning classical analysis, string theory manifolds, and PV signal theory. IC surfaces, safety margin d(s), Bayesian evidence, Calabi-Yau projections.',
    href: '/observatory/math',
    explorerType: 'math',
    icon: Sigma,
    borderClass: 'border-gold/30',
    bgClass: 'bg-gold/5',
    textClass: 'text-gold',
    dimClass: 'text-gold/60',
  },
  {
    title: 'State Machines',
    description: 'Orbital state dynamics with probabilistic transitions. Signal lifecycle, ToV harm assessment, Guardian homeostasis, and session lifecycle.',
    href: '/observatory/state',
    explorerType: 'state',
    icon: Orbit,
    borderClass: 'border-emerald/30',
    bgClass: 'bg-emerald/5',
    textClass: 'text-emerald',
    dimClass: 'text-emerald/60',
  },
  {
    title: 'Career Pathways',
    description: 'Explore pharmacovigilance career transitions and skill relationships. KSB similarity drives transition probability. Y-axis maps salary.',
    href: '/observatory/careers',
    explorerType: 'career',
    icon: Briefcase,
    borderClass: 'border-gold-bright/30',
    bgClass: 'bg-gold-bright/5',
    textClass: 'text-gold-bright',
    dimClass: 'text-gold-bright/60',
  },
  {
    title: 'Learning Landscapes',
    description: 'Visualize your learning progression as a 3D terrain. Prerequisite DAG with competency levels, completion state, and unlockable activities.',
    href: '/observatory/learning',
    explorerType: 'learning',
    icon: GraduationCap,
    borderClass: 'border-violet/30',
    bgClass: 'bg-violet/5',
    textClass: 'text-violet',
    dimClass: 'text-violet/60',
  },
  {
    title: 'Domain Atlas',
    description: 'Cross-domain architecture translation. See the same system through Biology, Clinical Trials, Chemistry, Military, and more professional lenses powered by T1 primitive decomposition.',
    href: '/observatory/atlas',
    explorerType: 'atlas',
    icon: Dna,
    borderClass: 'border-teal-500/30',
    bgClass: 'bg-teal-500/5',
    textClass: 'text-teal-400',
    dimClass: 'text-teal-400/60',
    badge: 'Preview',
  },
]

function ExplorerCard({ section, index, defaultExplorer, prefersReducedMotion }: {
  section: Section
  index: number
  defaultExplorer: string
  prefersReducedMotion: boolean | null
}) {
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : index * 0.06 }}
    >
      <Link href={section.href} className="block group">
        <div className={`relative overflow-hidden border ${section.explorerType === defaultExplorer ? 'border-cyan/40' : section.borderClass} ${section.bgClass} p-golden-3 h-full transition-all duration-300 hover:scale-[1.02]`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${section.borderClass} ${section.bgClass} mb-golden-2`}>
            <section.icon className={`h-5 w-5 ${section.textClass}`} aria-hidden="true" />
          </div>
          <div className="flex items-center gap-golden-1 mb-golden-1">
            <h2 className="text-lg font-semibold text-white group-hover:text-cyan transition-colors">
              {section.title}
            </h2>
            {section.explorerType === defaultExplorer && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-cyan/10 text-cyan/70 border border-cyan/20">
                Default
              </span>
            )}
            {section.badge && (
              <span className={`text-[9px] font-mono px-1.5 py-0.5 ${section.bgClass} ${section.dimClass} border ${section.borderClass}`}>
                {section.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-dim/70 leading-golden">
            {section.description}
          </p>
          <div className={`mt-golden-2 ${section.textClass} text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
            Explore →
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function ObservatoryHub() {
  const { preferences, updatePreference, resetToDetected, isDetected } = useObservatoryPreferences()
  const prefersReducedMotion = useReducedMotion()
  const { defaultExplorer } = preferences

  return (
    <div className="mx-auto max-w-5xl px-4 py-golden-4">
      {/* Deep-space atmosphere + circuit traces + sphere hero */}
      <div className="relative mb-golden-4 h-[220px] overflow-hidden border border-nex-light bg-nex-deep">
        <AtmosphereLayers config={ATMOSPHERE_DEEP_SPACE} layers={['glow', 'grid', 'vignette', 'particles']} />
        <CircuitBackground config={CIRCUIT_PRESET_DEEP_SPACE} />
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <ShaderSphere config={{ ...SPHERE_PRESET_OBSERVATORY, size: [120, 160] }} />
        </div>
      </div>

      <motion.header
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        className="mb-golden-4"
      >
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/5">
            <Telescope className="h-5 w-5 text-cyan" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/60">
              AlgoVigilance Observatory
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Observatory
            </h1>
          </div>
          <ObservatorySettings
            preferences={preferences}
            onUpdate={updatePreference}
            onReset={resetToDetected}
            isDetected={isDetected}
          />
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          End-to-end drug lifecycle visualization — from pre-clinical chemistry through
          population epidemiology. 92+ computational tools rendered across 11 immersive 3D explorers.
        </p>
      </motion.header>

      {/* Drug Lifecycle Section */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
        className="mb-golden-3"
      >
        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-dim/50 mb-golden-2 flex items-center gap-golden-1">
          <span className="h-px flex-1 bg-nex-light" />
          Drug Lifecycle
          <span className="h-px flex-1 bg-nex-light" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-golden-3">
          {LIFECYCLE_SECTIONS.map((section, i) => (
            <ExplorerCard
              key={section.href}
              section={section}
              index={i}
              defaultExplorer={defaultExplorer}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </motion.div>

      {/* Platform Section */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.3 }}
        className="mb-golden-3"
      >
        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-dim/50 mb-golden-2 flex items-center gap-golden-1">
          <span className="h-px flex-1 bg-nex-light" />
          Platform
          <span className="h-px flex-1 bg-nex-light" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-golden-3">
          {PLATFORM_SECTIONS.map((section, i) => (
            <ExplorerCard
              key={section.href}
              section={section}
              index={i + LIFECYCLE_SECTIONS.length}
              defaultExplorer={defaultExplorer}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </motion.div>

      {/* Dimensional Framework */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.5 }}
        className="mt-golden-4 border border-nex-light bg-nex-surface p-golden-3"
      >
        <h3 className="text-sm font-semibold text-white mb-golden-2">Dimensional Framework</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-golden-2 text-xs">
          <div className="border border-cyan/20 bg-cyan/5 p-golden-1">
            <span className="text-cyan font-mono font-medium">D = 3</span>
            <p className="text-slate-dim/70 mt-1">Euclidean — force graphs, surface plots</p>
          </div>
          <div className="border border-gold/20 bg-gold/5 p-golden-1">
            <span className="text-gold font-mono font-medium">D = 4</span>
            <p className="text-slate-dim/70 mt-1">Spacetime — state dynamics, worldsheets</p>
          </div>
          <div className="border border-violet/20 bg-violet/5 p-golden-1">
            <span className="text-violet font-mono font-medium">D = 6</span>
            <p className="text-slate-dim/70 mt-1">Calabi-Yau — compactified dimensions</p>
          </div>
          <div className="border border-emerald/20 bg-emerald/5 p-golden-1">
            <span className="text-emerald font-mono font-medium">D = 10</span>
            <p className="text-slate-dim/70 mt-1">Superstring — full dimensional manifold</p>
          </div>
          <div className="border border-rose-500/20 bg-rose-500/5 p-golden-1">
            <span className="text-rose-400 font-mono font-medium">ToV</span>
            <p className="text-slate-dim/70 mt-1">Signal — 8 harm types, d(s) safety margin</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
