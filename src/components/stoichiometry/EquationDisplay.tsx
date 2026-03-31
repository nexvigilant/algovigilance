'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { PrimitiveBadge } from './PrimitiveBadge';
import type { BalancedEquation } from '@/types/stoichiometry';

interface EquationDisplayProps {
  equation: BalancedEquation;
  /** Compact mode hides individual reactant breakdowns */
  compact?: boolean;
  className?: string;
}

export function EquationDisplay({ equation, compact = false, className }: EquationDisplayProps) {
  const { concept, reactants, balance } = equation;
  const isBalanced = balance.is_balanced;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Balance status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isBalanced ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <span className={cn(
            'text-[10px] font-mono uppercase tracking-widest',
            isBalanced ? 'text-emerald-400' : 'text-red-400',
          )}>
            {isBalanced ? 'Balanced' : `Imbalanced (\u0394${balance.delta.toFixed(1)})`}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-slate-400/60">
          <span>LHS: {balance.reactant_mass.toFixed(1)}</span>
          <span>RHS: {balance.product_mass.toFixed(1)}</span>
        </div>
      </div>

      {/* Equation visualization */}
      <div className="flex items-center gap-4 overflow-x-auto py-2">
        {/* Left side: reactants */}
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          {reactants.map((reactant, idx) => (
            <div key={`${reactant.word}-${idx}`} className="flex items-center gap-2">
              {idx > 0 && <span className="text-white/30 text-sm font-mono">+</span>}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-mono text-white/80 whitespace-nowrap">
                  {reactant.word}
                </span>
                {!compact && (
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {reactant.formula.primitives.map((prim, pidx) => (
                      <PrimitiveBadge key={`${prim}-${pidx}`} primitive={prim} />
                    ))}
                  </div>
                )}
                {!compact && (
                  <span className="text-[8px] font-mono text-white/30 tabular-nums">
                    w={reactant.formula.weight.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center px-2 shrink-0">
          <ArrowRight className="h-5 w-5 text-cyan/60" />
          {!compact && (
            <span className="text-[7px] font-mono text-white/20 mt-0.5">yields</span>
          )}
        </div>

        {/* Right side: concept (product) */}
        <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
          <span className="text-sm font-bold text-gold whitespace-nowrap">
            {concept.name}
          </span>
          <div className="flex flex-wrap gap-0.5 justify-center">
            {concept.formula.primitives.map((prim, pidx) => (
              <PrimitiveBadge key={`${prim}-${pidx}`} primitive={prim} />
            ))}
          </div>
          <span className="text-[8px] font-mono text-white/30 tabular-nums">
            w={concept.formula.weight.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Primitive inventory comparison */}
      {!compact && balance.primitive_inventory && (
        <div className="border-t border-white/[0.08] pt-3">
          <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-2">
            Primitive Inventory
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="text-[9px] font-mono text-white/40">Reactants</div>
            <div className="text-[9px] font-mono text-white/40">Product</div>
            {balance.primitive_inventory.reactant_counts.map((count, idx) => {
              const productCount = balance.primitive_inventory.product_counts[idx] ?? 0;
              const isMatch = count === productCount;
              return (
                <div key={idx} className="contents">
                  <span className={cn(
                    'text-[10px] font-mono tabular-nums',
                    isMatch ? 'text-white/50' : 'text-red-400/70',
                  )}>
                    {count}
                  </span>
                  <span className={cn(
                    'text-[10px] font-mono tabular-nums',
                    isMatch ? 'text-white/50' : 'text-red-400/70',
                  )}>
                    {productCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
