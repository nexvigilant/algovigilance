'use client';

import { cn } from '@/lib/utils';
import { findPrimitive, type PrimitiveInfo } from '@/types/stoichiometry';

interface PrimitiveBadgeProps {
  /** Primitive name (e.g., "Causality") or a PrimitiveInfo object */
  primitive: string | PrimitiveInfo;
  /** Show name alongside symbol */
  showName?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Optional count (coefficient) */
  count?: number;
  className?: string;
}

/**
 * Color map: Tailwind classes keyed by primitive color name.
 * Static classes ensure Tailwind JIT picks them up during build.
 */
const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  rose:    { bg: 'bg-rose-500/20',    text: 'text-rose-400',    border: 'border-rose-500/30' },
  amber:   { bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  sky:     { bg: 'bg-sky-500/20',     text: 'text-sky-400',     border: 'border-sky-500/30' },
  violet:  { bg: 'bg-violet-500/20',  text: 'text-violet-400',  border: 'border-violet-500/30' },
  orange:  { bg: 'bg-orange-500/20',  text: 'text-orange-400',  border: 'border-orange-500/30' },
  teal:    { bg: 'bg-teal-500/20',    text: 'text-teal-400',    border: 'border-teal-500/30' },
  pink:    { bg: 'bg-pink-500/20',    text: 'text-pink-400',    border: 'border-pink-500/30' },
  slate:   { bg: 'bg-slate-500/20',   text: 'text-slate-400',   border: 'border-slate-500/30' },
  cyan:    { bg: 'bg-cyan-500/20',    text: 'text-cyan-400',    border: 'border-cyan-500/30' },
  yellow:  { bg: 'bg-yellow-500/20',  text: 'text-yellow-400',  border: 'border-yellow-500/30' },
  lime:    { bg: 'bg-lime-500/20',    text: 'text-lime-400',    border: 'border-lime-500/30' },
  indigo:  { bg: 'bg-indigo-500/20',  text: 'text-indigo-400',  border: 'border-indigo-500/30' },
  red:     { bg: 'bg-red-500/20',     text: 'text-red-400',     border: 'border-red-500/30' },
  purple:  { bg: 'bg-purple-500/20',  text: 'text-purple-400',  border: 'border-purple-500/30' },
};

const FALLBACK_COLORS = { bg: 'bg-white/10', text: 'text-white/60', border: 'border-white/20' };

export function PrimitiveBadge({ primitive, showName = false, size = 'sm', count, className }: PrimitiveBadgeProps) {
  const info: PrimitiveInfo | undefined = typeof primitive === 'string' ? findPrimitive(primitive) : primitive;

  if (!info) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono',
        FALLBACK_COLORS.bg, FALLBACK_COLORS.text, FALLBACK_COLORS.border,
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        className,
      )}>
        {typeof primitive === 'string' ? primitive : '?'}
      </span>
    );
  }

  const colors = COLOR_MAP[info.color] ?? FALLBACK_COLORS;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-mono transition-colors',
        colors.bg,
        colors.text,
        colors.border,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
      title={`${info.name} (${info.symbol})`}
    >
      {count != null && count > 1 && (
        <span className="font-bold tabular-nums">{count}</span>
      )}
      <span className="font-bold">{info.symbol}</span>
      {showName && <span className="opacity-80">{info.name}</span>}
    </span>
  );
}
