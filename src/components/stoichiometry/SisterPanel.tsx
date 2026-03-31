'use client';

import { useState, useCallback } from 'react';
import { Loader2, GitCompareArrows, Dna } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PrimitiveBadge } from './PrimitiveBadge';
import type { SisterMatch } from '@/types/stoichiometry';

interface SisterPanelProps {
  /** Pre-set the concept name to search for sisters */
  conceptName?: string;
  className?: string;
}

export function SisterPanel({ conceptName: initialName, className }: SisterPanelProps) {
  const [conceptName, setConceptName] = useState(initialName ?? '');
  const [sisters, setSisters] = useState<SisterMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSisters = useCallback(async () => {
    if (!conceptName.trim()) return;
    setLoading(true);
    setError(null);
    setSisters([]);

    try {
      const response = await fetch('/api/nexcore/stoichiometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'sisters',
          name: conceptName.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error ?? 'Failed to find sister concepts');
        return;
      }
      if (Array.isArray(data.sisters)) {
        setSisters(data.sisters);
      } else if (Array.isArray(data)) {
        setSisters(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [conceptName]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <GitCompareArrows className="h-3.5 w-3.5 text-purple-400/60" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400/60">
          Sister Concepts
        </span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <Input
          value={conceptName}
          onChange={(e) => setConceptName(e.target.value)}
          placeholder="Concept name..."
          disabled={loading}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchSisters(); }}
        />
        <Button
          onClick={fetchSisters}
          disabled={loading || !conceptName.trim()}
          className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono text-[10px] uppercase tracking-widest shrink-0"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Find'
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/5 p-3 mb-4">
          <p className="text-red-400/80 text-xs font-mono">{error}</p>
        </div>
      )}

      {/* No results */}
      {!loading && sisters.length === 0 && !error && conceptName.trim() && (
        <div className="py-6 text-center">
          <GitCompareArrows className="h-5 w-5 text-white/15 mx-auto mb-2" />
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            No sister concepts found
          </p>
        </div>
      )}

      {/* Results */}
      {sisters.length > 0 && (
        <div className="space-y-3">
          {sisters.map((sister) => (
            <div
              key={sister.name}
              className="border border-white/[0.08] bg-white/[0.04] p-3 rounded-md"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white/80">{sister.name}</span>
                  {sister.is_isomer && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gold/10 border border-gold/30">
                      <Dna className="h-3 w-3 text-gold" />
                      <span className="text-[9px] font-mono text-gold uppercase tracking-widest">Isomer</span>
                    </span>
                  )}
                </div>
                <SimilarityBar value={sister.similarity} />
              </div>

              {/* Shared primitives */}
              {sister.shared_primitives.length > 0 && (
                <div className="mb-2">
                  <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">
                    Shared
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {sister.shared_primitives.map((prim, idx) => (
                      <PrimitiveBadge key={`shared-${prim}-${idx}`} primitive={prim} />
                    ))}
                  </div>
                </div>
              )}

              {/* Unique primitives */}
              <div className="flex gap-4">
                {sister.unique_to_self.length > 0 && (
                  <div>
                    <span className="text-[8px] font-mono text-cyan/30 uppercase tracking-widest">
                      Unique to self
                    </span>
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {sister.unique_to_self.map((prim, idx) => (
                        <PrimitiveBadge key={`self-${prim}-${idx}`} primitive={prim} />
                      ))}
                    </div>
                  </div>
                )}
                {sister.unique_to_other.length > 0 && (
                  <div>
                    <span className="text-[8px] font-mono text-orange-400/30 uppercase tracking-widest">
                      Unique to {sister.name}
                    </span>
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {sister.unique_to_other.map((prim, idx) => (
                        <PrimitiveBadge key={`other-${prim}-${idx}`} primitive={prim} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SimilarityBar({ value }: { value: number }) {
  const percentage = Math.round(value * 100);
  const color =
    percentage >= 80
      ? 'bg-emerald-400 text-emerald-400'
      : percentage >= 50
        ? 'bg-amber-400 text-amber-400'
        : 'bg-red-400 text-red-400';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color.split(' ')[0]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono font-bold tabular-nums ${color.split(' ')[1]}`}>
        {percentage}%
      </span>
    </div>
  );
}
