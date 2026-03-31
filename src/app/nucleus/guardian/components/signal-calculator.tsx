'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, Loader2, Crosshair } from 'lucide-react';
import type { SignalCompleteResponse } from '@/types/nexcore';
import { signalComplete } from '@/lib/nexcore-api';
import { useAdaptiveBackoff } from '@/hooks/use-adaptive-backoff';
import { useAsyncState } from '@/hooks/use-async-state';

interface CellInput {
  a: string;
  b: string;
  c: string;
  d: string;
}

export function SignalCalculator() {
  const [cells, setCells] = useState<CellInput>({
    a: '15',
    b: '100',
    c: '20',
    d: '10000',
  });

  // Williams 1909, Ch 11: Typestate — impossible to be loading AND have an error
  const { state, execute } = useAsyncState<SignalCompleteResponse>();
  const governor = useAdaptiveBackoff({ latencyThresholdMs: 3000 });

  const handleSubmit = useCallback(async () => {
    await execute(async () => {
      await governor.waitForSlot();
      const start = Date.now();
      try {
        const data = await signalComplete(
          Number(cells.a),
          Number(cells.b),
          Number(cells.c),
          Number(cells.d)
        );
        governor.recordLatency(Date.now() - start);
        return data;
      } catch (e) {
        governor.recordFailure();
        throw e;
      }
    });
  }, [cells, execute, governor]);

  const isLoading = state.status === 'loading';
  const result = state.status === 'success' ? state.data : null;
  const error = state.status === 'error' ? state.error.message : null;

  return (
    <div className="space-y-6">
      {/* 2x2 Contingency Table Input */}
      <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-nex-light/20">
          <Crosshair className="h-3.5 w-3.5 text-cyan/60" />
          <span className="intel-label">2x2 Contingency Table</span>
          <div className="h-px flex-1 bg-nex-light/20" />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {/* Header row */}
            <div />
            <div className="text-center text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 py-1">Event (+)</div>
            <div className="text-center text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 py-1">Event (&minus;)</div>

            {/* Drug + row */}
            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 flex items-center">Drug (+)</div>
            <div>
              <Label htmlFor="cell-a" className="sr-only">a (Drug+Event)</Label>
              <Input
                id="cell-a"
                type="number"
                min="0"
                value={cells.a}
                onChange={(e) => setCells({ ...cells, a: e.target.value })}
                className="bg-black/20 border-nex-light/40 text-center text-white font-mono"
                placeholder="a"
              />
            </div>
            <div>
              <Label htmlFor="cell-b" className="sr-only">b (Drug+NoEvent)</Label>
              <Input
                id="cell-b"
                type="number"
                min="0"
                value={cells.b}
                onChange={(e) => setCells({ ...cells, b: e.target.value })}
                className="bg-black/20 border-nex-light/40 text-center text-white font-mono"
                placeholder="b"
              />
            </div>

            {/* Drug - row */}
            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 flex items-center">Drug (&minus;)</div>
            <div>
              <Label htmlFor="cell-c" className="sr-only">c (NoDrug+Event)</Label>
              <Input
                id="cell-c"
                type="number"
                min="0"
                value={cells.c}
                onChange={(e) => setCells({ ...cells, c: e.target.value })}
                className="bg-black/20 border-nex-light/40 text-center text-white font-mono"
                placeholder="c"
              />
            </div>
            <div>
              <Label htmlFor="cell-d" className="sr-only">d (NoDrug+NoEvent)</Label>
              <Input
                id="cell-d"
                type="number"
                min="0"
                value={cells.d}
                onChange={(e) => setCells({ ...cells, d: e.target.value })}
                className="bg-black/20 border-nex-light/40 text-center text-white font-mono"
                placeholder="d"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-4 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Computing...
              </>
            ) : (
              'Execute Signal Detection'
            )}
          </Button>

          {error && (
            <p className="mt-3 text-sm text-red-400/80 font-mono">{error}</p>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Overall signal indicator */}
          <div className={`border p-4 flex items-center gap-3 ${
            result.signal_detected
              ? 'border-red-500/30 bg-red-500/5'
              : 'border-emerald-500/30 bg-emerald-500/5'
          }`}>
            {result.signal_detected ? (
              <AlertTriangle className="h-5 w-5 text-red-400/80" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-400/80" />
            )}
            <div>
              <span className={`text-sm font-bold font-mono uppercase tracking-wide ${
                result.signal_detected ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {result.signal_detected ? 'Signal Detected' : 'No Signal Detected'}
              </span>
              <span className="text-[10px] font-mono text-slate-dim/40 ml-3">
                {result.signal_detected ? 'ALERT' : 'NOMINAL'}
              </span>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard
              name="PRR"
              fullName="Proportional Reporting Ratio"
              value={result.prr}
              ciLower={result.prr_ci_lower}
              ciUpper={result.prr_ci_upper}
              signal={result.prr_signal}
              threshold="≥ 2.0"
            />
            <MetricCard
              name="ROR"
              fullName="Reporting Odds Ratio"
              value={result.ror}
              ciLower={result.ror_ci_lower}
              ciUpper={result.ror_ci_upper}
              signal={result.ror_signal}
              threshold="CI lower > 1.0"
            />
            <MetricCard
              name="IC"
              fullName="Information Component"
              value={result.ic}
              ciLower={result.ic_ci_lower}
              signal={result.ic_signal}
              threshold="IC025 > 0"
            />
            <MetricCard
              name="EBGM"
              fullName="Empirical Bayes Geometric Mean"
              value={result.ebgm}
              ciLower={result.eb05}
              signal={result.ebgm_signal}
              threshold="EB05 ≥ 2.0"
            />
            <MetricCard
              name="Chi²"
              fullName="Chi-Square Statistic"
              value={result.chi_square}
              signal={result.chi_square >= 3.841}
              threshold="≥ 3.841"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  name,
  fullName,
  value,
  ciLower,
  ciUpper,
  signal,
  threshold,
}: {
  name: string;
  fullName: string;
  value: number;
  ciLower?: number;
  ciUpper?: number;
  signal: boolean;
  threshold: string;
}) {
  return (
    <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30 hover:border-cyan/20 transition-all duration-300 group">
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold font-mono text-cyan/70">{name}</span>
          {signal ? (
            <span className="intel-stamp bg-red-500/10 text-red-400/80 border border-red-500/20 px-2 py-0.5">
              SIGNAL
            </span>
          ) : (
            <span className="intel-stamp bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 px-2 py-0.5">
              CLEAR
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-dim/40 font-mono mb-3">{fullName}</p>
        <div className="text-2xl font-mono font-bold tabular-nums text-white">
          {value.toFixed(4)}
        </div>
        {(ciLower !== undefined || ciUpper !== undefined) && (
          <p className="text-[10px] text-slate-dim/40 mt-1 font-mono tabular-nums">
            CI: [{ciLower?.toFixed(4) ?? '—'}, {ciUpper?.toFixed(4) ?? '—'}]
          </p>
        )}
        <div className="mt-3 pt-2 border-t border-nex-light/10">
          <span className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/30">
            Threshold: {threshold}
          </span>
        </div>
      </div>
    </div>
  );
}
