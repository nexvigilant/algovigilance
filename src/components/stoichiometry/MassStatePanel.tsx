'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, Gauge, Flame, Snowflake, Scale } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PrimitiveBadge } from './PrimitiveBadge';
import type { MassStateInfo } from '@/types/stoichiometry';

interface MassStatePanelProps {
  /** Pass data directly instead of fetching */
  data?: MassStateInfo | null;
  /** Trigger refetch */
  refreshKey?: number;
  className?: string;
}

export function MassStatePanel({ data: externalData, refreshKey = 0, className }: MassStatePanelProps) {
  const [massState, setMassState] = useState<MassStateInfo | null>(externalData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMassState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/nexcore/stoichiometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'mass_state' }),
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        setError(result.error ?? 'Failed to fetch mass state');
        return;
      }
      setMassState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (externalData) {
      setMassState(externalData);
    } else {
      fetchMassState();
    }
  }, [externalData, fetchMassState, refreshKey]);

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-cyan/40" />
          <span className="ml-2 text-[10px] font-mono text-white/30 uppercase tracking-widest">
            Loading mass state...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="border border-red-500/30 bg-red-500/5 p-3">
          <p className="text-red-400/80 text-xs font-mono">{error}</p>
        </div>
      </div>
    );
  }

  if (!massState) return null;

  const entropyPercentage = massState.max_entropy > 0
    ? (massState.entropy / massState.max_entropy) * 100
    : 0;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Scale className="h-3.5 w-3.5 text-cyan/60" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-cyan/60">
          Mass State
        </span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Total Mass */}
        <div className="border border-white/[0.08] bg-white/[0.04] p-3 rounded-md">
          <div className="flex items-center gap-1.5 mb-1">
            <Gauge className="h-3 w-3 text-gold/60" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
              Total Mass
            </span>
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-gold">
            {massState.total_mass.toFixed(1)}
          </p>
        </div>

        {/* Gibbs Free Energy */}
        <div className="border border-white/[0.08] bg-white/[0.04] p-3 rounded-md">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="h-3 w-3 text-orange-400/60" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
              Gibbs Free Energy
            </span>
          </div>
          <p className="text-xl font-bold font-mono tabular-nums text-orange-400">
            {massState.gibbs_free_energy.toFixed(2)}
          </p>
        </div>

        {/* Entropy */}
        <div className="col-span-2 border border-white/[0.08] bg-white/[0.04] p-3 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Snowflake className="h-3 w-3 text-violet-400/60" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                Entropy
              </span>
            </div>
            <span className="text-[9px] font-mono text-white/30 tabular-nums">
              {massState.entropy.toFixed(2)} / {massState.max_entropy.toFixed(2)}
            </span>
          </div>
          <Progress
            value={entropyPercentage}
            className="h-2"
            indicatorClassName="bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
          />
        </div>

        {/* Equilibrium status */}
        <div className="col-span-2 border border-white/[0.08] bg-white/[0.04] p-3 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
              Equilibrium
            </span>
            <span className={
              massState.is_equilibrium
                ? 'text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider'
                : 'text-red-400 text-xs font-mono font-bold uppercase tracking-wider'
            }>
              {massState.is_equilibrium ? 'Stable' : 'Unstable'}
            </span>
          </div>
        </div>
      </div>

      {/* Depleted / Saturated primitives */}
      {(massState.depleted.length > 0 || massState.saturated.length > 0) && (
        <div className="mt-4 space-y-3">
          {massState.depleted.length > 0 && (
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-red-400/60 mb-1 block">
                Depleted
              </span>
              <div className="flex flex-wrap gap-1">
                {massState.depleted.map((prim) => (
                  <PrimitiveBadge
                    key={prim}
                    primitive={prim}
                    showName
                    className="border-red-500/40 bg-red-500/10"
                  />
                ))}
              </div>
            </div>
          )}
          {massState.saturated.length > 0 && (
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-yellow-400/60 mb-1 block">
                Saturated
              </span>
              <div className="flex flex-wrap gap-1">
                {massState.saturated.map((prim) => (
                  <PrimitiveBadge
                    key={prim}
                    primitive={prim}
                    showName
                    className="border-yellow-500/40 bg-yellow-500/10"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
