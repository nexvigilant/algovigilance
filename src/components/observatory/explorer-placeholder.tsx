'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Construction } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { EXPLORER_REGISTRY, type ObservatoryExplorerType } from '@/lib/observatory/explorer-registry'

interface ExplorerPlaceholderProps {
  explorerType: ObservatoryExplorerType
  title: string
  description: string
  icon: LucideIcon
  accentClass: string
  tools: string[]
}

/**
 * Placeholder component for Observatory explorers under construction.
 * Shows lifecycle stage, planned tools, and data pipeline status.
 */
export function ExplorerPlaceholder({
  explorerType,
  title,
  description,
  icon: Icon,
  accentClass,
  tools,
}: ExplorerPlaceholderProps) {
  const prefersReducedMotion = useReducedMotion()
  const caps = EXPLORER_REGISTRY[explorerType]

  return (
    <div className="mx-auto max-w-3xl px-4 py-golden-4">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        className="border border-nex-light bg-nex-surface p-golden-4"
      >
        <div className="flex items-center gap-golden-2 mb-golden-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center border ${accentClass} bg-nex-surface`}>
            <Icon className={`h-6 w-6 ${accentClass.replace('border-', 'text-').replace('/30', '')}`} aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-slate-dim/60">
              {caps.lifecycleStage} stage
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-dim/70 leading-golden mb-golden-3">
          {description}
        </p>

        <div className="flex items-center gap-golden-2 mb-golden-3 p-golden-2 border border-amber-500/20 bg-amber-500/5">
          <Construction className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
          <p className="text-xs text-amber-300/80 font-mono">
            Under construction — backend integration in progress
          </p>
        </div>

        <div className="grid grid-cols-2 gap-golden-2 mb-golden-3">
          <div className="border border-nex-light p-golden-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-1">
              3D Component
            </p>
            <p className="text-sm text-white font-mono">{caps.component}</p>
          </div>
          <div className="border border-nex-light p-golden-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-1">
              Live Data
            </p>
            <p className="text-sm text-white font-mono">{caps.liveData ? 'Planned' : 'Static'}</p>
          </div>
        </div>

        <div className="border border-nex-light p-golden-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-golden-1">
            MCP Tools ({tools.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {tools.map(tool => (
              <span
                key={tool}
                className="text-[10px] font-mono px-1.5 py-0.5 bg-nex-deep border border-nex-light text-slate-dim/70"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
