'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertTriangle, Info, Clock, Plus, X } from 'lucide-react';
import {
  computeKaplanMeier,
  type KaplanMeierResult,
} from '@/lib/pv-compute';
import { cn } from '@/lib/utils';

interface Observation {
  id: number;
  time: string;
  event: boolean;
}

let nextId = 1;

function makeObs(): Observation {
  return { id: nextId++, time: '', event: true };
}

export function SurvivalCalculator() {
  const [observations, setObservations] = useState<Observation[]>(() => [
    makeObs(), makeObs(), makeObs(),
  ]);
  const [result, setResult] = useState<KaplanMeierResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addRow = useCallback(() => {
    setObservations(prev => [...prev, makeObs()]);
  }, []);

  const removeRow = useCallback((id: number) => {
    setObservations(prev => prev.length > 1 ? prev.filter(o => o.id !== id) : prev);
  }, []);

  const updateTime = useCallback((id: number, time: string) => {
    setObservations(prev => prev.map(o => o.id === id ? { ...o, time } : o));
  }, []);

  const toggleEvent = useCallback((id: number) => {
    setObservations(prev => prev.map(o => o.id === id ? { ...o, event: !o.event } : o));
  }, []);

  const loadExample = useCallback(() => {
    nextId = 100;
    setObservations([
      { id: nextId++, time: '1', event: true },
      { id: nextId++, time: '2', event: true },
      { id: nextId++, time: '3', event: false },
      { id: nextId++, time: '4', event: true },
      { id: nextId++, time: '5', event: false },
      { id: nextId++, time: '6', event: true },
      { id: nextId++, time: '7', event: true },
      { id: nextId++, time: '8', event: false },
      { id: nextId++, time: '10', event: true },
      { id: nextId++, time: '12', event: true },
    ]);
    setResult(null);
    setError(null);
  }, []);

  const compute = useCallback(() => {
    setError(null);
    try {
      const times: number[] = [];
      const events: boolean[] = [];

      for (const obs of observations) {
        const t = parseFloat(obs.time);
        if (isNaN(t)) {
          setError('All observations must have a valid time');
          return;
        }
        times.push(t);
        events.push(obs.event);
      }

      setResult(computeKaplanMeier(times, events));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Computation error');
    }
  }, [observations]);

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            Kaplan-Meier Survival
          </CardTitle>
          <CardDescription className="text-slate-dim">
            Enter time-to-event observations (event or censored)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_80px_32px] gap-2 text-xs text-slate-dim font-medium">
            <div>Time</div>
            <div className="text-center">Status</div>
            <div />
          </div>

          {/* Observation rows */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {observations.map(obs => (
              <div key={obs.id} className="grid grid-cols-[1fr_80px_32px] gap-2 items-center">
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={obs.time}
                  onChange={e => updateTime(obs.id, e.target.value)}
                  placeholder="t"
                  className="bg-nex-dark border-nex-border text-cyan font-mono text-center h-8 text-sm"
                />
                <button
                  type="button"
                  onClick={() => toggleEvent(obs.id)}
                  className={cn(
                    'h-8 rounded text-xs font-medium transition-colors',
                    obs.event
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-slate-500/20 text-slate-dim border border-slate-500/30'
                  )}
                >
                  {obs.event ? 'Event' : 'Censored'}
                </button>
                <button
                  type="button"
                  onClick={() => removeRow(obs.id)}
                  className="h-8 w-8 flex items-center justify-center rounded text-slate-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
              className="border-nex-border text-slate-dim hover:text-slate-light"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Row
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadExample}
              className="border-nex-border text-slate-dim hover:text-slate-light"
            >
              Load Example
            </Button>
          </div>

          <Button onClick={compute} className="w-full bg-emerald-500 text-nex-deep hover:bg-emerald-400 font-medium">
            <Calculator className="h-4 w-4 mr-2" />
            Compute Kaplan-Meier
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-nex-light/20 space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-dim">
              <Info className="h-3 w-3" />
              PV Transfer: 0.82 → Weibull time-to-onset
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light">Survival Curve</CardTitle>
          <CardDescription className="text-slate-dim">
            Product-limit estimator with Greenwood 95% CI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-slate-dim/50 mb-3" />
              <p className="text-sm text-slate-dim">Enter observations and click compute</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-emerald-400/30 text-emerald-400">
                  Events: {result.total_events}
                </Badge>
                <Badge variant="outline" className="border-slate-500/30 text-slate-dim">
                  Censored: {result.total_censored}
                </Badge>
                {result.median_survival !== null && (
                  <Badge variant="outline" className="border-cyan/30 text-cyan">
                    Median: {result.median_survival}
                  </Badge>
                )}
              </div>

              {/* Step table */}
              <div className="rounded-lg border border-nex-light overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-nex-light/30">
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-dim">Time</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-dim">S(t)</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-dim">95% CI</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-dim">At Risk</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-dim">d / c</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.steps.map((step, i) => (
                      <tr
                        key={i}
                        className={cn(
                          'border-t border-nex-light/50',
                          step.events > 0 && 'bg-red-500/5'
                        )}
                      >
                        <td className="px-3 py-1.5 font-mono text-cyan">{step.time}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-light">{pct(step.survival)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-dim text-xs">
                          {pct(step.ci_lower)} – {pct(step.ci_upper)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-dim">{step.at_risk}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-dim">
                          {step.events > 0 && <span className="text-red-400">{step.events}d</span>}
                          {step.events > 0 && step.censored > 0 && ' '}
                          {step.censored > 0 && <span>{step.censored}c</span>}
                          {step.events === 0 && step.censored === 0 && '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ASCII survival curve */}
              <div className="p-3 rounded-lg bg-nex-dark border border-nex-border">
                <p className="text-xs text-slate-dim mb-2 font-medium">Survival Curve (text)</p>
                <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                  {renderAsciiCurve(result)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function renderAsciiCurve(result: KaplanMeierResult): string {
  const steps = result.steps;
  if (steps.length <= 1) return 'No events to plot';

  const maxTime = Math.max(...steps.map(s => s.time));
  const width = 40;
  const height = 10;
  const lines: string[] = [];

  for (let row = 0; row <= height; row++) {
    const survLevel = 1 - row / height;
    let line = `${(survLevel * 100).toFixed(0).padStart(3)}% |`;

    for (let col = 0; col < width; col++) {
      const t = (col / width) * maxTime;
      const step = [...steps].reverse().find(s => s.time <= t) ?? steps[0];
      const survAtCol = step.survival;

      if (Math.abs(survAtCol - survLevel) < 0.05) {
        line += '━';
      } else if (survAtCol > survLevel) {
        line += ' ';
      } else {
        line += ' ';
      }
    }
    lines.push(line);
  }

  const timeAxis = '     +' + '─'.repeat(width);
  const labels = '      0' + ' '.repeat(width - 6) + maxTime.toFixed(0);
  lines.push(timeAxis);
  lines.push(labels);

  return lines.join('\n');
}
