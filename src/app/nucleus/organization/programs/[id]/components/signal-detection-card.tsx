'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  runSignalDetection,
  listSignals,
  type SignalResult,
  type ContingencyTable,
} from '@/lib/actions/signals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STRENGTH_COLORS } from './constants';

export function SignalDetectionCard({ tenantId, programId, userId, targetName, codeName }: {
  tenantId: string;
  programId: string;
  userId: string;
  targetName: string;
  codeName: string;
}) {
  const [signals, setSignals] = useState<SignalResult[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for 2x2 contingency table
  const [drugName, setDrugName] = useState(codeName);
  const [eventName, setEventName] = useState('');
  const [cellA, setCellA] = useState('');
  const [cellB, setCellB] = useState('');
  const [cellC, setCellC] = useState('');
  const [cellD, setCellD] = useState('');

  const loadSignals = useCallback(async () => {
    if (!tenantId) return;
    const result = await listSignals(tenantId, programId);
    if (result.success && result.signals) {
      setSignals(result.signals);
    }
  }, [tenantId, programId]);

  useEffect(() => { loadSignals(); }, [loadSignals]);

  async function handleRunDetection() {
    if (!eventName.trim()) return;
    setRunning(true);
    setError(null);

    const table: ContingencyTable = {
      a: parseInt(cellA) || 0,
      b: parseInt(cellB) || 0,
      c: parseInt(cellC) || 0,
      d: parseInt(cellD) || 0,
    };

    const result = await runSignalDetection(
      tenantId, programId, userId,
      drugName.trim(), eventName.trim(), table
    );

    if (result.success) {
      setShowForm(false);
      setEventName('');
      setCellA(''); setCellB(''); setCellC(''); setCellD('');
      loadSignals();
    } else {
      setError(result.error || 'Detection failed');
    }
    setRunning(false);
  }

  return (
    <Card className="bg-nex-surface border-nex-light">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-light">Signal Detection</CardTitle>
            <CardDescription className="text-slate-dim">
              Disproportionality analysis for {targetName}
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 bg-transparent"
          >
            <Shield className="h-4 w-4 mr-1" />
            {showForm ? 'Cancel' : 'New Analysis'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Analysis Form */}
        {showForm && (
          <div className="p-4 rounded-lg border border-cyan/20 bg-cyan/5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-dim text-xs">Drug / Compound</Label>
                <Input
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  className="bg-nex-dark border-nex-light text-slate-light text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-dim text-xs">Adverse Event (PT)</Label>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Hepatotoxicity"
                  className="bg-nex-dark border-nex-light text-slate-light text-sm"
                />
              </div>
            </div>

            {/* 2x2 Table Input */}
            <div>
              <p className="text-xs text-slate-dim mb-2 font-medium">2x2 Contingency Table</p>
              <div className="grid grid-cols-3 gap-1 text-xs max-w-sm">
                <div />
                <div className="text-center text-slate-dim py-1">Event+</div>
                <div className="text-center text-slate-dim py-1">Event-</div>

                <div className="text-slate-dim py-2 pr-2 text-right">Drug+</div>
                <Input
                  type="number"
                  min="0"
                  value={cellA}
                  onChange={(e) => setCellA(e.target.value)}
                  placeholder="a"
                  className="bg-nex-dark border-nex-light text-slate-light text-sm text-center h-9"
                />
                <Input
                  type="number"
                  min="0"
                  value={cellB}
                  onChange={(e) => setCellB(e.target.value)}
                  placeholder="b"
                  className="bg-nex-dark border-nex-light text-slate-light text-sm text-center h-9"
                />

                <div className="text-slate-dim py-2 pr-2 text-right">Drug-</div>
                <Input
                  type="number"
                  min="0"
                  value={cellC}
                  onChange={(e) => setCellC(e.target.value)}
                  placeholder="c"
                  className="bg-nex-dark border-nex-light text-slate-light text-sm text-center h-9"
                />
                <Input
                  type="number"
                  min="0"
                  value={cellD}
                  onChange={(e) => setCellD(e.target.value)}
                  placeholder="d"
                  className="bg-nex-dark border-nex-light text-slate-light text-sm text-center h-9"
                />
              </div>

              {/* Live N calculation */}
              {(cellA || cellB || cellC || cellD) && (
                <p className="text-[10px] text-slate-dim mt-2">
                  N = {(parseInt(cellA) || 0) + (parseInt(cellB) || 0) + (parseInt(cellC) || 0) + (parseInt(cellD) || 0)} reports
                  {' | '}
                  Expected = {(((parseInt(cellA) || 0) + (parseInt(cellB) || 0)) * ((parseInt(cellA) || 0) + (parseInt(cellC) || 0)) / Math.max((parseInt(cellA) || 0) + (parseInt(cellB) || 0) + (parseInt(cellC) || 0) + (parseInt(cellD) || 0), 1)).toFixed(1)}
                </p>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleRunDetection}
              disabled={running || !eventName.trim() || !(parseInt(cellA) > 0)}
              className="border-cyan text-cyan hover:bg-cyan/10 bg-transparent w-full"
            >
              {running ? 'Computing 5 algorithms...' : 'Run Signal Detection (PRR + ROR + IC + EBGM + Chi\u00B2)'}
            </Button>
          </div>
        )}

        {/* Results */}
        {signals.length === 0 && !showForm ? (
          <div className="text-center py-8 border border-dashed border-nex-light rounded-lg">
            <Shield className="mx-auto h-8 w-8 text-slate-dim mb-3" />
            <p className="text-slate-dim mb-1">No signals analyzed yet</p>
            <p className="text-xs text-slate-dim">
              Run disproportionality analysis with a 2x2 contingency table
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map(sig => {
              const strengthColor = STRENGTH_COLORS[sig.signalStrength] || STRENGTH_COLORS.none;
              return (
                <div key={sig.id} className="p-3 rounded-lg bg-nex-dark border border-nex-light">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-light">
                        {sig.drugName} + {sig.eventName}
                      </span>
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
                        strengthColor.bg, strengthColor.border, strengthColor.text
                      )}>
                        {sig.signalStrength.toUpperCase()} ({sig.signalCount}/5)
                      </span>
                    </div>
                    {sig.overallSignal && (
                      <TrendingUp className="h-4 w-4 text-red-400" />
                    )}
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {Object.values(sig.metrics).map(m => (
                      <div key={m.name} className={cn(
                        'text-center p-2 rounded border',
                        m.signal
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-nex-surface border-nex-light text-slate-dim'
                      )}>
                        <p className="font-medium text-[10px] mb-0.5">{m.name}</p>
                        <p className="text-sm font-bold">{m.value}</p>
                        <p className="text-[9px] opacity-70">
                          [{m.lowerCI}, {m.upperCI}]
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Contingency Table Summary */}
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-dim">
                    <span>a={sig.table.a} b={sig.table.b} c={sig.table.c} d={sig.table.d}</span>
                    <span>N={sig.table.a + sig.table.b + sig.table.c + sig.table.d}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
