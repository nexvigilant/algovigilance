'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, AlertTriangle, Info, BarChart3, PieChart, Target } from 'lucide-react';
import {
  computeIncidenceRate,
  computePrevalence,
  computeSMR,
  type IncidenceRateResult,
  type PrevalenceResult,
  type SMRResult,
} from '@/lib/pv-compute';
import { cn } from '@/lib/utils';

function ResultRow({ label, value, ci, signal, detail }: {
  label: string;
  value: string;
  ci?: string;
  signal?: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg bg-nex-light/30">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-light">{label}</p>
        {detail && <p className="text-xs text-slate-dim mt-0.5">{detail}</p>}
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className="text-lg font-bold font-mono text-cyan">{value}</p>
        {ci && <p className="text-xs text-slate-dim">{ci}</p>}
        {signal !== undefined && (
          <Badge
            variant="outline"
            className={cn(
              'mt-1 text-xs',
              signal ? 'border-emerald-400/30 text-emerald-400' : 'border-slate-500/30 text-slate-dim'
            )}
          >
            {signal ? 'Significant' : 'Not significant'}
          </Badge>
        )}
      </div>
    </div>
  );
}

const fmt = (n: number) => isFinite(n) ? n.toFixed(4) : '∞';

function IncidenceRatePanel() {
  const [events, setEvents] = useState('');
  const [personTime, setPersonTime] = useState('');
  const [perUnit, setPerUnit] = useState('1000');
  const [result, setResult] = useState<IncidenceRateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(() => {
    setError(null);
    try {
      const e = parseInt(events, 10);
      const pt = parseFloat(personTime);
      const pu = parseFloat(perUnit);
      if (isNaN(e) || isNaN(pt)) {
        setError('Events and person-time are required');
        return;
      }
      setResult(computeIncidenceRate(e, pt, isNaN(pu) ? 1000 : pu));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Computation error');
    }
  }, [events, personTime, perUnit]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Incidence Rate
          </CardTitle>
          <CardDescription className="text-slate-dim">
            IR = events / person-time (Poisson CI)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-slate-dim">Number of events</Label>
            <Input
              type="number"
              min={0}
              value={events}
              onChange={e => setEvents(e.target.value)}
              placeholder="e.g. 45"
              className="bg-nex-dark border-nex-border text-cyan font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-slate-dim">Person-time (e.g. person-years)</Label>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={personTime}
              onChange={e => setPersonTime(e.target.value)}
              placeholder="e.g. 5000"
              className="bg-nex-dark border-nex-border text-cyan font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-slate-dim">Per unit (multiplier)</Label>
            <Input
              type="number"
              min={1}
              value={perUnit}
              onChange={e => setPerUnit(e.target.value)}
              placeholder="1000"
              className="bg-nex-dark border-nex-border text-cyan font-mono w-32"
            />
          </div>
          <Button onClick={compute} className="w-full bg-emerald-500 text-nex-deep hover:bg-emerald-400 font-medium">
            <Calculator className="h-4 w-4 mr-2" />
            Compute Incidence Rate
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
              PV Transfer: 0.92 → Reporting rate
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-slate-dim/50 mb-3" />
              <p className="text-sm text-slate-dim">Enter values and click compute</p>
            </div>
          ) : (
            <div className="space-y-3">
              <ResultRow
                label="Incidence Rate"
                value={fmt(result.rate)}
                ci={`95% CI: ${fmt(result.ci_lower)} – ${fmt(result.ci_upper)}`}
                detail={`Per ${result.per_unit} person-time`}
              />
              <ResultRow
                label="Events"
                value={String(result.events)}
                detail={`Person-time: ${result.person_time}`}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PrevalencePanel() {
  const [cases, setCases] = useState('');
  const [total, setTotal] = useState('');
  const [result, setResult] = useState<PrevalenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(() => {
    setError(null);
    try {
      const c = parseInt(cases, 10);
      const t = parseInt(total, 10);
      if (isNaN(c) || isNaN(t)) {
        setError('Cases and total population are required');
        return;
      }
      setResult(computePrevalence(c, t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Computation error');
    }
  }, [cases, total]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light flex items-center gap-2">
            <PieChart className="h-5 w-5 text-emerald-400" />
            Point Prevalence
          </CardTitle>
          <CardDescription className="text-slate-dim">
            P = cases / total (Wilson CI)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-slate-dim">Number of cases</Label>
            <Input
              type="number"
              min={0}
              value={cases}
              onChange={e => setCases(e.target.value)}
              placeholder="e.g. 120"
              className="bg-nex-dark border-nex-border text-cyan font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-slate-dim">Total population</Label>
            <Input
              type="number"
              min={1}
              value={total}
              onChange={e => setTotal(e.target.value)}
              placeholder="e.g. 5000"
              className="bg-nex-dark border-nex-border text-cyan font-mono"
            />
          </div>
          <Button onClick={compute} className="w-full bg-emerald-500 text-nex-deep hover:bg-emerald-400 font-medium">
            <Calculator className="h-4 w-4 mr-2" />
            Compute Prevalence
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
              PV Transfer: 0.90 → Background rate
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PieChart className="h-12 w-12 text-slate-dim/50 mb-3" />
              <p className="text-sm text-slate-dim">Enter values and click compute</p>
            </div>
          ) : (
            <div className="space-y-3">
              <ResultRow
                label="Point Prevalence"
                value={`${(result.prevalence * 100).toFixed(2)}%`}
                ci={`95% CI: ${(result.ci_lower * 100).toFixed(2)}% – ${(result.ci_upper * 100).toFixed(2)}%`}
              />
              <ResultRow
                label="Raw Proportion"
                value={fmt(result.prevalence)}
                detail={`${result.cases} cases out of ${result.total}`}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SMRPanel() {
  const [observed, setObserved] = useState('');
  const [expected, setExpected] = useState('');
  const [result, setResult] = useState<SMRResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(() => {
    setError(null);
    try {
      const o = parseInt(observed, 10);
      const e = parseFloat(expected);
      if (isNaN(o) || isNaN(e)) {
        setError('Observed and expected counts are required');
        return;
      }
      setResult(computeSMR(o, e));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Computation error');
    }
  }, [observed, expected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            Standardized Mortality Ratio
          </CardTitle>
          <CardDescription className="text-slate-dim">
            SMR = observed / expected (Byar CI)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-slate-dim">Observed count</Label>
            <Input
              type="number"
              min={0}
              value={observed}
              onChange={e => setObserved(e.target.value)}
              placeholder="e.g. 85"
              className="bg-nex-dark border-nex-border text-cyan font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-slate-dim">Expected count</Label>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={expected}
              onChange={e => setExpected(e.target.value)}
              placeholder="e.g. 60.5"
              className="bg-nex-dark border-nex-border text-cyan font-mono"
            />
          </div>
          <Button onClick={compute} className="w-full bg-emerald-500 text-nex-deep hover:bg-emerald-400 font-medium">
            <Calculator className="h-4 w-4 mr-2" />
            Compute SMR
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
              PV Transfer: 0.93 → EBGM O/E ratio
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-slate-dim/50 mb-3" />
              <p className="text-sm text-slate-dim">Enter values and click compute</p>
            </div>
          ) : (
            <div className="space-y-3">
              <ResultRow
                label="SMR"
                value={fmt(result.smr)}
                ci={`95% CI: ${fmt(result.ci_lower)} – ${fmt(result.ci_upper)}`}
                signal={result.significant}
                detail={result.smr > 1 ? 'Excess mortality/morbidity' : 'Below expected'}
              />
              <ResultRow
                label="Observed / Expected"
                value={`${result.observed} / ${fmt(result.expected)}`}
                detail={`Ratio: ${fmt(result.smr)}`}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function RateCalculator() {
  const [activeTab, setActiveTab] = useState('incidence');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-nex-dark border border-nex-border">
          <TabsTrigger value="incidence" className="data-[state=active]:bg-emerald-400/10 data-[state=active]:text-emerald-400 gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Incidence Rate
          </TabsTrigger>
          <TabsTrigger value="prevalence" className="data-[state=active]:bg-emerald-400/10 data-[state=active]:text-emerald-400 gap-1.5">
            <PieChart className="h-3.5 w-3.5" />
            Prevalence
          </TabsTrigger>
          <TabsTrigger value="smr" className="data-[state=active]:bg-emerald-400/10 data-[state=active]:text-emerald-400 gap-1.5">
            <Target className="h-3.5 w-3.5" />
            SMR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidence" className="mt-4">
          <IncidenceRatePanel />
        </TabsContent>
        <TabsContent value="prevalence" className="mt-4">
          <PrevalencePanel />
        </TabsContent>
        <TabsContent value="smr" className="mt-4">
          <SMRPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
