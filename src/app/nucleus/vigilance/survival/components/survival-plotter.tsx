'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Plus, X, Calculator, Download } from 'lucide-react';
import {
  computeKaplanMeier,
  type KaplanMeierResult,
  type KaplanMeierStep,
} from '@/lib/pv-compute';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

interface Observation {
  id: number;
  time: string;
  event: boolean;
}

let nextId = 1;
function makeObs(): Observation {
  return { id: nextId++, time: '', event: true };
}

const PRESETS = {
  clinical: {
    label: 'Clinical trial (20 patients)',
    data: [
      { time: 1, event: true }, { time: 2, event: true }, { time: 3, event: false },
      { time: 3, event: true }, { time: 5, event: false }, { time: 6, event: true },
      { time: 7, event: true }, { time: 8, event: false }, { time: 8, event: true },
      { time: 10, event: false }, { time: 11, event: true }, { time: 12, event: true },
      { time: 14, event: false }, { time: 15, event: true }, { time: 16, event: false },
      { time: 18, event: true }, { time: 20, event: false }, { time: 22, event: true },
      { time: 24, event: false }, { time: 30, event: false },
    ],
  },
  rapid: {
    label: 'Rapid onset (10 patients)',
    data: [
      { time: 0.5, event: true }, { time: 1, event: true }, { time: 1.5, event: true },
      { time: 2, event: true }, { time: 2, event: false }, { time: 3, event: true },
      { time: 4, event: true }, { time: 5, event: false }, { time: 7, event: true },
      { time: 10, event: false },
    ],
  },
  chronic: {
    label: 'Chronic exposure (15 patients)',
    data: [
      { time: 30, event: false }, { time: 60, event: true }, { time: 90, event: false },
      { time: 120, event: true }, { time: 150, event: false }, { time: 180, event: true },
      { time: 210, event: false }, { time: 240, event: true }, { time: 270, event: false },
      { time: 300, event: true }, { time: 330, event: false }, { time: 360, event: true },
      { time: 365, event: false }, { time: 365, event: false }, { time: 365, event: false },
    ],
  },
};

function ChartTooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload: KaplanMeierStep }> }) {
  if (!active || !payload?.length) return null;
  const step = payload[0].payload;
  return (
    <div className="bg-nex-deep border border-nex-light rounded-lg p-3 shadow-xl text-sm">
      <p className="font-mono text-cyan">Time: {step.time}</p>
      <p className="text-slate-light">S(t): {(step.survival * 100).toFixed(1)}%</p>
      <p className="text-slate-dim text-xs">
        CI: {(step.ci_lower * 100).toFixed(1)}% – {(step.ci_upper * 100).toFixed(1)}%
      </p>
      <p className="text-slate-dim text-xs">At risk: {step.at_risk}</p>
      {step.events > 0 && <p className="text-red-400 text-xs">{step.events} event(s)</p>}
      {step.censored > 0 && <p className="text-slate-dim text-xs">{step.censored} censored</p>}
    </div>
  );
}

export function SurvivalPlotter() {
  const [observations, setObservations] = useState<Observation[]>(() =>
    Array.from({ length: 5 }, () => makeObs())
  );
  const [result, setResult] = useState<KaplanMeierResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addRows = useCallback((count: number) => {
    setObservations(prev => [...prev, ...Array.from({ length: count }, () => makeObs())]);
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

  const loadPreset = useCallback((key: keyof typeof PRESETS) => {
    nextId = 200;
    const preset = PRESETS[key];
    setObservations(preset.data.map(d => ({
      id: nextId++,
      time: String(d.time),
      event: d.event,
    })));
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

  const chartData = useMemo(() => {
    if (!result) return [];
    // Build step function data for recharts
    const data: Array<KaplanMeierStep & { ci_range: [number, number] }> = [];
    for (let i = 0; i < result.steps.length; i++) {
      const step = result.steps[i];
      data.push({
        ...step,
        ci_range: [step.ci_lower, step.ci_upper],
      });
      // Add a point just before next step to create step function
      if (i + 1 < result.steps.length) {
        const nextStep = result.steps[i + 1];
        data.push({
          ...step,
          time: nextStep.time - 0.001,
          ci_range: [step.ci_lower, step.ci_upper],
        });
      }
    }
    return data;
  }, [result]);

  const exportCSV = useCallback(() => {
    if (!result) return;
    const header = 'time,survival,ci_lower,ci_upper,at_risk,events,censored\n';
    const rows = result.steps.map(s =>
      `${s.time},${s.survival},${s.ci_lower},${s.ci_upper},${s.at_risk},${s.events},${s.censored}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kaplan-meier.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-400/10">
            <Clock className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-light">
              Survival Curve Plotter
            </h1>
            <p className="text-slate-dim text-sm">
              Kaplan-Meier product-limit estimator with Greenwood 95% CI
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="border-emerald-400/30 text-emerald-400">PV Transfer: 0.82 → Weibull TTO</Badge>
          <Badge variant="outline" className="border-cyan/30 text-cyan">Client-Side</Badge>
          <Badge variant="outline" className="border-slate-500/30 text-slate-dim">T1: σ+N+∂+ν</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Data Entry */}
        <Card className="bg-nex-surface border border-nex-light">
          <CardHeader>
            <CardTitle className="text-slate-light flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-400" />
              Observations
            </CardTitle>
            <CardDescription className="text-slate-dim">
              Enter time-to-event data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset(key as keyof typeof PRESETS)}
                  className="border-nex-border text-slate-dim hover:text-slate-light text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_70px_28px] gap-1.5 text-xs text-slate-dim font-medium">
              <div>Time</div>
              <div className="text-center">Status</div>
              <div />
            </div>

            {/* Observation rows */}
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {observations.map(obs => (
                <div key={obs.id} className="grid grid-cols-[1fr_70px_28px] gap-1.5 items-center">
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={obs.time}
                    onChange={e => updateTime(obs.id, e.target.value)}
                    placeholder="t"
                    className="bg-nex-dark border-nex-border text-cyan font-mono text-center h-7 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => toggleEvent(obs.id)}
                    className={cn(
                      'h-7 rounded text-xs font-medium transition-colors',
                      obs.event
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-500/20 text-slate-dim border border-slate-500/30'
                    )}
                  >
                    {obs.event ? 'Event' : 'Cens.'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(obs.id)}
                    className="h-7 w-7 flex items-center justify-center rounded text-slate-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addRows(1)} className="border-nex-border text-slate-dim hover:text-slate-light">
                <Plus className="h-3.5 w-3.5 mr-1" /> +1
              </Button>
              <Button variant="outline" size="sm" onClick={() => addRows(5)} className="border-nex-border text-slate-dim hover:text-slate-light">
                +5
              </Button>
              <Button variant="outline" size="sm" onClick={() => addRows(10)} className="border-nex-border text-slate-dim hover:text-slate-light">
                +10
              </Button>
            </div>

            <Button onClick={compute} className="w-full bg-emerald-500 text-nex-deep hover:bg-emerald-400 font-medium">
              <Calculator className="h-4 w-4 mr-2" />
              Plot Survival Curve
            </Button>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart + Results */}
        <div className="xl:col-span-2 space-y-6">
          {/* Chart */}
          <Card className="bg-nex-surface border border-nex-light">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-light">Kaplan-Meier Curve</CardTitle>
                <CardDescription className="text-slate-dim">
                  Step function with 95% Greenwood CI bands
                </CardDescription>
              </div>
              {result && (
                <Button variant="outline" size="sm" onClick={exportCSV} className="border-nex-border text-slate-dim hover:text-slate-light">
                  <Download className="h-3.5 w-3.5 mr-1" /> CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Clock className="h-12 w-12 text-slate-dim/50 mb-3" />
                  <p className="text-sm text-slate-dim">Enter observations and click Plot</p>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        label={{ value: 'Time', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                      />
                      <YAxis
                        domain={[0, 1]}
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                        label={{ value: 'S(t)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      <ReferenceLine y={0.5} stroke="#64748b" strokeDasharray="5 5" label={{ value: 'Median', fill: '#64748b', fontSize: 11 }} />
                      <Area
                        dataKey="ci_range"
                        fill="#34d399"
                        fillOpacity={0.1}
                        stroke="none"
                      />
                      <Line
                        type="stepAfter"
                        dataKey="survival"
                        stroke="#34d399"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#34d399' }}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="ci_lower"
                        stroke="#34d399"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        dot={false}
                        strokeOpacity={0.4}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="ci_upper"
                        stroke="#34d399"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        dot={false}
                        strokeOpacity={0.4}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary + Table */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Summary */}
              <Card className="bg-nex-surface border border-nex-light">
                <CardHeader>
                  <CardTitle className="text-slate-light text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between p-2 rounded bg-nex-light/30">
                    <span className="text-sm text-slate-dim">Total observations</span>
                    <span className="font-mono text-cyan">{result.total_events + result.total_censored}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-nex-light/30">
                    <span className="text-sm text-slate-dim">Events</span>
                    <span className="font-mono text-red-400">{result.total_events}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-nex-light/30">
                    <span className="text-sm text-slate-dim">Censored</span>
                    <span className="font-mono text-slate-dim">{result.total_censored}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-emerald-400/5 border border-emerald-400/20">
                    <span className="text-sm text-slate-dim">Median survival</span>
                    <span className="font-mono text-emerald-400">
                      {result.median_survival !== null ? result.median_survival : 'Not reached'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-nex-light/30">
                    <span className="text-sm text-slate-dim">Final S(t)</span>
                    <span className="font-mono text-cyan">
                      {(result.steps[result.steps.length - 1].survival * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Life Table */}
              <Card className="bg-nex-surface border border-nex-light">
                <CardHeader>
                  <CardTitle className="text-slate-light text-base">Life Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-nex-light overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0">
                        <tr className="bg-nex-light/30">
                          <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-dim">t</th>
                          <th className="px-2 py-1.5 text-right text-xs font-medium text-slate-dim">S(t)</th>
                          <th className="px-2 py-1.5 text-right text-xs font-medium text-slate-dim">CI</th>
                          <th className="px-2 py-1.5 text-right text-xs font-medium text-slate-dim">n</th>
                          <th className="px-2 py-1.5 text-right text-xs font-medium text-slate-dim">d/c</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.steps.map((step, i) => (
                          <tr key={i} className={cn(
                            'border-t border-nex-light/50',
                            step.events > 0 && 'bg-red-500/5'
                          )}>
                            <td className="px-2 py-1 font-mono text-cyan text-xs">{step.time}</td>
                            <td className="px-2 py-1 text-right font-mono text-slate-light text-xs">
                              {(step.survival * 100).toFixed(1)}%
                            </td>
                            <td className="px-2 py-1 text-right font-mono text-slate-dim text-xs">
                              {(step.ci_lower * 100).toFixed(0)}-{(step.ci_upper * 100).toFixed(0)}
                            </td>
                            <td className="px-2 py-1 text-right font-mono text-slate-dim text-xs">{step.at_risk}</td>
                            <td className="px-2 py-1 text-right text-xs">
                              {step.events > 0 && <span className="text-red-400">{step.events}d</span>}
                              {step.events > 0 && step.censored > 0 && '/'}
                              {step.censored > 0 && <span className="text-slate-dim">{step.censored}c</span>}
                              {step.events === 0 && step.censored === 0 && <span className="text-slate-dim">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
