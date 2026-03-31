'use client';

import { useState, useCallback } from 'react';
import { Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { computeQbri, type QbriResult } from '@/lib/pv-compute';

function qbriColor(q: number): string {
  if (q > 2.0) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
  if (q > 1.0) return 'text-gold border-gold/30 bg-gold/5';
  return 'text-red-400 border-red-500/30 bg-red-500/5';
}

export function QbriCalculator() {
  const [benefitName, setBenefitName] = useState('');
  const [benefitWeight, setBenefitWeight] = useState('1.0');
  const [benefitScore, setBenefitScore] = useState('0.5');
  const [riskName, setRiskName] = useState('');
  const [riskWeight, setRiskWeight] = useState('1.0');
  const [riskScore, setRiskScore] = useState('0.3');
  const [result, setResult] = useState<QbriResult | null>(null);

  const handleCalculate = useCallback(() => {
    const bw = parseFloat(benefitWeight) || 1.0;
    const bs = parseFloat(benefitScore) || 0.0;
    const rw = parseFloat(riskWeight) || 1.0;
    const rs = parseFloat(riskScore) || 0.0;

    setResult(computeQbri(
      [{ name: benefitName || 'Benefit', weight: bw, score: bs }],
      [{ name: riskName || 'Risk', weight: rw, score: rs }],
    ));
  }, [benefitName, benefitWeight, benefitScore, riskName, riskWeight, riskScore]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Benefit-Risk Analysis / QBRI Calculator</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          QBRI Assessment
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Quantitative Benefit-Risk Index — client-side computation
        </p>
        <p className="text-[9px] font-mono text-cyan/30 mt-1">Client-side computation — no server dependency</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Benefit input */}
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <Scale className="h-3.5 w-3.5 text-emerald-400/60" />
            <span className="intel-label">Benefit</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">Name</label>
              <input
                type="text"
                value={benefitName}
                onChange={(e) => setBenefitName(e.target.value)}
                placeholder="e.g., Efficacy"
                className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-emerald-500/40 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">Weight</label>
                <input
                  type="number"
                  step="0.1"
                  value={benefitWeight}
                  onChange={(e) => setBenefitWeight(e.target.value)}
                  className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white focus:border-emerald-500/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">Score (0-1)</label>
                <input
                  type="number"
                  step="0.1"
                  value={benefitScore}
                  onChange={(e) => setBenefitScore(e.target.value)}
                  className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white focus:border-emerald-500/40 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Risk input */}
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <Scale className="h-3.5 w-3.5 text-red-400/60" />
            <span className="intel-label">Risk</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">Name</label>
              <input
                type="text"
                value={riskName}
                onChange={(e) => setRiskName(e.target.value)}
                placeholder="e.g., Adverse Events"
                className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-red-500/40 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">Weight</label>
                <input
                  type="number"
                  step="0.1"
                  value={riskWeight}
                  onChange={(e) => setRiskWeight(e.target.value)}
                  className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white focus:border-red-500/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">Score (0-1)</label>
                <input
                  type="number"
                  step="0.1"
                  value={riskScore}
                  onChange={(e) => setRiskScore(e.target.value)}
                  className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white focus:border-red-500/40 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculate */}
      <div className="mt-4">
        <Button
          onClick={handleCalculate}
          className="w-full bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest py-3"
        >
          Calculate QBRI
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className={`mt-4 p-6 border text-center ${qbriColor(result.qbri)}`}>
          <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-3">QBRI</p>
          <p className="text-4xl font-extrabold font-mono tabular-nums text-white">
            {isFinite(result.qbri) ? result.qbri.toFixed(3) : '∞'}
          </p>
          <p className={`mt-2 text-sm font-bold font-mono ${qbriColor(result.qbri).split(' ')[0]}`}>
            {result.interpretation}
          </p>
          <div className="mt-3 flex justify-center gap-4 text-[9px] font-mono text-slate-dim/30">
            <span>Favorable <span className="text-emerald-400">&gt;2.0</span></span>
            <span>Marginal <span className="text-gold">1.0-2.0</span></span>
            <span>Unfavorable <span className="text-red-400">&lt;1.0</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
