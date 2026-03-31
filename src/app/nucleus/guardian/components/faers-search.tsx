'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Database, AlertTriangle } from 'lucide-react';
import type { FaersDrugEventsResponse } from '@/types/nexcore';
import { faersDrugEvents } from '@/lib/nexcore-api';
import { useAdaptiveBackoff } from '@/hooks/use-adaptive-backoff';
import { useAsyncState } from '@/hooks/use-async-state';

export function FaersSearch() {
  const [drug, setDrug] = useState('aspirin');

  // Williams 1909, Ch 11: Typestate — impossible to be loading AND have an error
  const { state, execute } = useAsyncState<FaersDrugEventsResponse>();

  // Williams 1909, Ch 1-3: Governor throttles requests when openFDA rate-limits
  const governor = useAdaptiveBackoff({
    baseDelayMs: 2000,
    maxDelayMs: 30_000,
    latencyThresholdMs: 8000,
  });

  const handleSearch = useCallback(async () => {
    if (!drug.trim()) return;
    await execute(async () => {
      await governor.waitForSlot();
      const start = Date.now();
      try {
        const data = await faersDrugEvents(drug.trim(), 20);
        governor.recordLatency(Date.now() - start);
        return data;
      } catch (e) {
        governor.recordFailure();
        throw e;
      }
    });
  }, [drug, execute, governor]);

  const isLoading = state.status === 'loading';
  const result = state.status === 'success' ? state.data : null;
  const error = state.status === 'error' ? state.error.message : null;

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-nex-light/20">
          <Database className="h-3.5 w-3.5 text-gold/60" />
          <span className="intel-label">FDA FAERS Query Interface</span>
          <div className="h-px flex-1 bg-nex-light/20" />
        </div>
        <div className="p-4">
          <div className="flex gap-3">
            <Input
              value={drug}
              onChange={(e) => setDrug(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter drug name (e.g., aspirin, metformin)"
              className="bg-black/20 border-nex-light/40 text-white flex-1 font-mono text-sm"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading || !drug.trim()}
              className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 mr-2" />
                  Query
                </>
              )}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-red-400/80 font-mono">{error}</p>}
          {governor.level !== 'normal' && (
            <p className="mt-2 text-[10px] font-mono text-gold/60">
              Governor: {governor.level} — delay {Math.round(governor.currentDelayMs / 1000)}s
              {governor.isBackingOff && ' (waiting…)'}
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-nex-light/20">
            <AlertTriangle className="h-3.5 w-3.5 text-gold/60" />
            <span className="intel-label">Adverse Events: {result.drug}</span>
            <div className="h-px flex-1 bg-nex-light/20" />
            <span className="intel-stamp text-slate-dim/40">
              {result.total_reports.toLocaleString()} reports
            </span>
          </div>
          <div className="p-0">
            {result.events.length === 0 ? (
              <p className="text-slate-dim/50 text-sm font-mono p-4">No adverse events found for this drug.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-nex-light/20">
                      <th className="text-left py-2.5 px-4 text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 font-normal">#</th>
                      <th className="text-left py-2.5 px-2 text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 font-normal">Adverse Event</th>
                      <th className="text-right py-2.5 px-2 text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 font-normal">Count</th>
                      <th className="text-right py-2.5 px-2 text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 font-normal">Freq</th>
                      <th className="text-right py-2.5 px-4 text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 font-normal w-32">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.events.map((event, idx) => (
                      <tr key={event.event} className="border-b border-nex-light/10 hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 text-[10px] font-mono text-cyan/30">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-2 text-white/80 text-sm">{event.event}</td>
                        <td className="py-2.5 px-2 text-right text-white font-mono tabular-nums text-sm">
                          {event.count.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-dim/50 font-mono tabular-nums text-xs">
                          {event.percentage.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right w-32">
                          <SegmentedBar percentage={event.percentage} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentedBar({ percentage }: { percentage: number }) {
  const segments = 10;
  const filled = Math.round((Math.min(percentage, 100) / 100) * segments);
  return (
    <div className="flex gap-px justify-end">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 transition-colors ${
            i < filled
              ? percentage > 15
                ? 'bg-red-400/60'
                : percentage > 8
                  ? 'bg-gold/60'
                  : 'bg-cyan/60'
              : 'bg-nex-light/20'
          }`}
        />
      ))}
    </div>
  );
}
