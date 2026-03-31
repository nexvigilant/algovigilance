'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Network, Sigma, Orbit, Briefcase, GraduationCap,
  FlaskConical, Scale, GitBranch, Clock, Users, Atom,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSemanticZoom } from './semantic-zoom'
import type { CVDMode, SemanticZoomLevel } from '@/lib/observatory/types'

// ─── Explorer Nav ────────────────────────────────────────────────────
// Inter-explorer navigation — jump between explorers without returning to Hub.

export type ExplorerKey =
  | 'graph' | 'math' | 'state' | 'careers' | 'learning'
  | 'chemistry' | 'molecule' | 'regulatory' | 'causality' | 'timeline' | 'epidemiology'

interface ExplorerLink {
  key: ExplorerKey
  label: string
  href: string
  icon: LucideIcon
  color: string
  activeColor: string
}

const EXPLORER_LINKS: ExplorerLink[] = [
  // Drug Lifecycle
  { key: 'chemistry', label: 'Chem', href: '/observatory/chemistry', icon: FlaskConical, color: 'text-slate-dim/50 hover:text-rose-400', activeColor: 'text-rose-400 border-rose-500/40 bg-rose-500/5' },
  { key: 'molecule', label: 'Mol', href: '/observatory/molecule', icon: Atom, color: 'text-slate-dim/50 hover:text-fuchsia-400', activeColor: 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/5' },
  { key: 'regulatory', label: 'Reg', href: '/observatory/regulatory', icon: Scale, color: 'text-slate-dim/50 hover:text-amber-400', activeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/5' },
  { key: 'causality', label: 'Causal', href: '/observatory/causality', icon: GitBranch, color: 'text-slate-dim/50 hover:text-orange-400', activeColor: 'text-orange-400 border-orange-500/40 bg-orange-500/5' },
  { key: 'timeline', label: 'Time', href: '/observatory/timeline', icon: Clock, color: 'text-slate-dim/50 hover:text-sky-400', activeColor: 'text-sky-400 border-sky-500/40 bg-sky-500/5' },
  { key: 'epidemiology', label: 'Epi', href: '/observatory/epidemiology', icon: Users, color: 'text-slate-dim/50 hover:text-teal-400', activeColor: 'text-teal-400 border-teal-500/40 bg-teal-500/5' },
  // Platform
  { key: 'graph', label: 'Graph', href: '/observatory/graph', icon: Network, color: 'text-slate-dim/50 hover:text-cyan', activeColor: 'text-cyan border-cyan/40 bg-cyan/5' },
  { key: 'math', label: 'Math', href: '/observatory/math', icon: Sigma, color: 'text-slate-dim/50 hover:text-gold', activeColor: 'text-gold border-gold/40 bg-gold/5' },
  { key: 'state', label: 'State', href: '/observatory/state', icon: Orbit, color: 'text-slate-dim/50 hover:text-emerald', activeColor: 'text-emerald border-emerald/40 bg-emerald/5' },
  { key: 'careers', label: 'Careers', href: '/observatory/careers', icon: Briefcase, color: 'text-slate-dim/50 hover:text-gold-bright', activeColor: 'text-gold-bright border-gold-bright/40 bg-gold-bright/5' },
  { key: 'learning', label: 'Learning', href: '/observatory/learning', icon: GraduationCap, color: 'text-slate-dim/50 hover:text-violet', activeColor: 'text-violet border-violet/40 bg-violet/5' },
]

interface ExplorerNavProps {
  current: ExplorerKey
}

export function ExplorerNav({ current }: ExplorerNavProps) {
  return (
    <nav aria-label="Observatory explorers" className="flex items-center gap-1 mb-golden-3">
      {EXPLORER_LINKS.map(({ key, label, href, icon: Icon, color, activeColor }) => {
        const isCurrent = key === current
        if (isCurrent) {
          return (
            <span
              key={key}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border ${activeColor}`}
              aria-current="page"
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
              {label}
            </span>
          )
        }
        return (
          <Link
            key={key}
            href={href}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border border-transparent transition-colors ${color}`}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

// ─── Zoom Level Bridge ───────────────────────────────────────────────
// Must render inside R3F Canvas because useSemanticZoom calls useThree()

interface ZoomLevelBridgeProps {
  onZoomChange: (level: SemanticZoomLevel) => void
}

export function ZoomLevelBridge({ onZoomChange }: ZoomLevelBridgeProps) {
  const level = useSemanticZoom()
  const onZoomChangeRef = useRef(onZoomChange)
  onZoomChangeRef.current = onZoomChange
  useEffect(() => { onZoomChangeRef.current(level) }, [level])
  return null
}

// ─── CVD Options ─────────────────────────────────────────────────────

export const CVD_OPTIONS: { value: CVDMode; label: string }[] = [
  { value: 'normal',       label: 'Normal' },
  { value: 'deuteranopia', label: 'Deuteranopia' },
  { value: 'protanopia',   label: 'Protanopia' },
  { value: 'tritanopia',   label: 'Tritanopia' },
]

// ─── Zoom Level Labels ──────────────────────────────────────────────

export const ZOOM_LEVEL_LABELS: Record<SemanticZoomLevel, string> = {
  1: 'Cluster Clouds',
  2: 'Individual Nodes',
  3: 'Node Detail',
  4: 'Single-Node Focus',
}
