'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, AlertTriangle, Info } from 'lucide-react';
import {
  computeRelativeRisk,
  computeOddsRatio,
  computeAttributableRisk,
  computeNNT,
  computeAttributableFraction,
  computePopulationAF,
  type RelativeRiskResult,
  type OddsRatioResult,
  type AttributableRiskResult,
  type NNTResult,
  type AttributableFractionResult,
  type PopulationAFResult,
} from '@/lib/pv-compute';
import { cn } from '@/lib/utils';

interface CohortResults {
  rr: RelativeRiskResult;
  or: OddsRatioResult;
  ar: AttributableRiskResult;
  nnt: NNTResult;
  af: AttributableFractionResult;
  paf: PopulationAFResult;
}

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

export function CohortCalculator() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [d, setD] = useState('');
  const [pe, setPe] = useState('0.3');
  const [results, setResults] = useState<CohortResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(() => {
    setError(null);
    try {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      const nc = parseInt(c, 10);
      const nd = parseInt(d, 10);
      const npe = parseFloat(pe);

      if ([na, nb, nc, nd].some(isNaN)) {
        setError('All four cells must be valid numbers');
        return;
      }

      const rr = computeRelativeRisk(na, nb, nc, nd);
      const or = computeOddsRatio(na, nb, nc, nd);
      const ar = computeAttributableRisk(na, nb, nc, nd);
      const nnt = computeNNT(na, nb, nc, nd);
      const af = computeAttributableFraction(na, nb, nc, nd);
      const paf = computePopulationAF(na, nb, nc, nd, isNaN(npe) ? 0.3 : npe);

      setResults({ rr, or, ar, nnt, af, paf });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Computation error');
    }
  }, [a, b, c, d, pe]);

  const fmt = (n: number) => isFinite(n) ? n.toFixed(4) : '∞';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-400" />
            2×2 Contingency Table
          </CardTitle>
          <CardDescription className="text-slate-dim">
            Enter counts for exposed/unexposed × event/no-event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Table header */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-dim">
            <div />
            <div className="font-medium">Event (+)</div>
            <div className="font-medium">No Event (−)</div>
          </div>

          {/* Exposed row */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <Label className="text-sm text-slate-light font-medium">Exposed</Label>
            <Input
              type="number"
              min={0}
              value={a}
              onChange={e => setA(e.target.value)}
              placeholder="a"
              className="bg-nex-dark border-nex-border text-cyan font-mono text-center"
            />
            <Input
              type="number"
              min={0}
              value={b}
              onChange={e => setB(e.target.value)}
              placeholder="b"
              className="bg-nex-dark border-nex-border text-cyan font-mono text-center"
            />
          </div>

          {/* Unexposed row */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <Label className="text-sm text-slate-light font-medium">Unexposed</Label>
            <Input
              type="number"
              min={0}
              value={c}
              onChange={e => setC(e.target.value)}
              placeholder="c"
              className="bg-nex-dark border-nex-border text-cyan font-mono text-center"
            />
            <Input
              type="number"
              min={0}
              value={d}
              onChange={e => setD(e.target.value)}
              placeholder="d"
              className="bg-nex-dark border-nex-border text-cyan font-mono text-center"
            />
          </div>

          <Separator className="bg-nex-light" />

          {/* Population exposure prevalence for PAF */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-dim">
              Exposure prevalence (for PAF)
            </Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={pe}
              onChange={e => setPe(e.target.value)}
              placeholder="0.3"
              className="bg-nex-dark border-nex-border text-cyan font-mono w-32"
            />
          </div>

          <Button
            onClick={compute}
            className="w-full bg-emerald-500 text-nex-deep hover:bg-emerald-400 font-medium"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Compute All Measures
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Reference */}
          <div className="p-3 rounded-lg bg-nex-light/20 space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-dim">
              <Info className="h-3 w-3" />
              PV Transfer Confidence
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs border-emerald-400/20 text-emerald-400">RR→PRR: 0.95</Badge>
              <Badge variant="outline" className="text-xs border-emerald-400/20 text-emerald-400">OR→ROR: 0.98</Badge>
              <Badge variant="outline" className="text-xs border-cyan/20 text-cyan">AR: 0.90</Badge>
              <Badge variant="outline" className="text-xs border-cyan/20 text-cyan">NNT→B/R: 0.85</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light">Results</CardTitle>
          <CardDescription className="text-slate-dim">
            All 6 cohort measures with 95% CI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!results ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calculator className="h-12 w-12 text-slate-dim/50 mb-3" />
              <p className="text-sm text-slate-dim">Enter values and click compute</p>
            </div>
          ) : (
            <div className="space-y-3">
              <ResultRow
                label="Relative Risk (RR)"
                value={fmt(results.rr.relative_risk)}
                ci={`95% CI: ${fmt(results.rr.ci_lower)} – ${fmt(results.rr.ci_upper)}`}
                signal={results.rr.significant}
                detail={`Exposed: ${fmt(results.rr.risk_exposed)} | Unexposed: ${fmt(results.rr.risk_unexposed)}`}
              />
              <ResultRow
                label="Odds Ratio (OR)"
                value={fmt(results.or.odds_ratio)}
                ci={`95% CI: ${fmt(results.or.ci_lower)} – ${fmt(results.or.ci_upper)}`}
                signal={results.or.significant}
              />
              <ResultRow
                label="Attributable Risk (AR)"
                value={fmt(results.ar.attributable_risk)}
                ci={`95% CI: ${fmt(results.ar.ci_lower)} – ${fmt(results.ar.ci_upper)}`}
              />
              <ResultRow
                label={results.nnt.label}
                value={fmt(results.nnt.nnt)}
                ci={`95% CI: ${fmt(results.nnt.ci_lower)} – ${fmt(results.nnt.ci_upper)}`}
                detail={results.nnt.interpretation}
              />
              <ResultRow
                label="Attributable Fraction (AF)"
                value={`${(results.af.af_exposed * 100).toFixed(1)}%`}
                detail={results.af.interpretation}
              />
              <ResultRow
                label="Population AF (PAF)"
                value={`${(results.paf.paf * 100).toFixed(1)}%`}
                detail={results.paf.interpretation}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
