'use client';

/**
 * Engine badge — shows whether Rust or TypeScript produced the computation.
 *
 * Displays: engine source, verification status, duration.
 * Used across all Rust-primary computation consumers.
 *
 * T1 primitives: κ(Comparison) + ∂(Boundary)
 */

import { Server } from 'lucide-react';
import type { ComputeMeta } from '@/lib/compute-engine';

interface EngineBadgeProps {
  meta: ComputeMeta;
  className?: string;
}

export function EngineBadge({ meta, className }: EngineBadgeProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Server className="h-3 w-3 text-cyan/40" />
        <span className={`text-[9px] font-mono uppercase tracking-widest ${
          meta.engine === 'rust' ? 'text-cyan/60' : 'text-gold/60'
        }`}>
          {meta.engine === 'rust' ? 'Deterministic Rust' : 'TypeScript Fallback'}
        </span>
        <span className={`text-[8px] font-mono ${
          meta.verification === 'match' ? 'text-emerald-400/50' :
          meta.verification === 'divergence' ? 'text-red-400/50' :
          'text-slate-dim/30'
        }`}>
          {meta.verification === 'match' && '✓ verified'}
          {meta.verification === 'divergence' && '⚠ divergence'}
          {meta.verification === 'skipped' && '— fallback'}
          {meta.verification === 'ts-only' && '— offline'}
        </span>
        <span className="text-[8px] font-mono text-slate-dim/20 ml-auto">
          {meta.durationMs}ms
        </span>
      </div>
    </div>
  );
}
