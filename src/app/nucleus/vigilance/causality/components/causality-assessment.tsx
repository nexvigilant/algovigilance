'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search, Loader2, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { computeNaranjo, computeWhoUmc, type NaranjoResult, type WhoUmcInput, type WhoUmcResult } from '@/lib/pv-compute';

interface NexCoreVerification {
  category: string;
  score?: number;
  description?: string;
  source: 'nexcore';
}

// ---------- Naranjo ----------

const NARANJO_QUESTIONS = [
  'Are there previous conclusive reports on this reaction?',
  'Did the adverse event appear after the suspected drug was administered?',
  'Did the adverse reaction improve when the drug was discontinued (dechallenge)?',
  'Did the adverse reaction reappear when the drug was readministered (rechallenge)?',
  'Are there alternative causes that could on their own have caused the reaction?',
  'Did the reaction reappear when a placebo was given?',
  'Was the drug detected in blood/fluids in concentrations known to be toxic?',
  'Was the reaction more severe with increased dose, or less severe with decreased dose?',
  'Did the patient have a similar reaction to the same or similar drugs previously?',
  'Was the adverse event confirmed by any objective evidence?',
];

function naranjoCategory(score: number): string {
  if (score >= 9) return 'Definite';
  if (score >= 5) return 'Probable';
  if (score >= 1) return 'Possible';
  return 'Doubtful';
}

function categoryColor(cat: string): string {
  switch (cat) {
    case 'Definite': case 'Certain': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'Probable': case 'Probable/Likely': return 'text-gold bg-gold/10 border-gold/20';
    case 'Possible': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    default: return 'text-slate-dim/60 bg-slate-dim/5 border-slate-dim/20';
  }
}

// ---------- WHO-UMC ----------

const WHO_CRITERIA = [
  {
    id: 'temporal',
    label: 'Temporal Relationship',
    description: 'Was there a reasonable time relationship between drug administration and event onset?',
    options: [
      { value: 'reasonable', label: 'Reasonable temporal association' },
      { value: 'possible', label: 'Possible but uncertain' },
      { value: 'unlikely', label: 'Unlikely temporal association' },
      { value: 'unknown', label: 'Cannot be assessed' },
    ],
  },
  {
    id: 'dechallenge',
    label: 'Dechallenge',
    description: 'Did the reaction improve when the drug was withdrawn?',
    options: [
      { value: 'positive', label: 'Positive — resolved on withdrawal' },
      { value: 'negative', label: 'Negative — persisted' },
      { value: 'not_done', label: 'Not done / Not applicable' },
      { value: 'unknown', label: 'Unknown' },
    ],
  },
  {
    id: 'rechallenge',
    label: 'Rechallenge',
    description: 'Did the reaction recur when the drug was reintroduced?',
    options: [
      { value: 'positive', label: 'Positive — reaction recurred' },
      { value: 'negative', label: 'Negative — did not recur' },
      { value: 'not_done', label: 'Not done / Not applicable' },
      { value: 'unknown', label: 'Unknown' },
    ],
  },
  {
    id: 'alternatives',
    label: 'Alternative Causes',
    description: 'Could the reaction be explained by other factors (disease, other drugs, etc.)?',
    options: [
      { value: 'unlikely', label: 'Unlikely — no plausible alternatives' },
      { value: 'possible', label: 'Possible — some alternatives exist' },
      { value: 'probable', label: 'Probable — alternative likely' },
      { value: 'unknown', label: 'Cannot be determined' },
    ],
  },
];

const WHO_CATEGORIES = [
  { label: 'Certain', color: 'text-red-400 border-red-500/30 bg-red-500/5' },
  { label: 'Probable', color: 'text-gold border-gold/30 bg-gold/5' },
  { label: 'Possible', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' },
  { label: 'Unlikely', color: 'text-slate-dim/60 border-slate-dim/30 bg-slate-dim/5' },
];

export function CausalityAssessment() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Causality Analysis / Drug-Event Evaluation</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Causality Assessment
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Scientific evaluation of the relationship between drug exposure and adverse events
        </p>
      </header>

      <Tabs defaultValue="naranjo">
        <TabsList className="w-full justify-center bg-transparent border-b border-white/[0.08] rounded-none p-0 mb-6">
          <TabsTrigger
            value="naranjo"
            className="data-[state=active]:bg-cyan/8 data-[state=active]:text-cyan data-[state=active]:border-b data-[state=active]:border-cyan/40 font-mono text-[10px] uppercase tracking-widest text-slate-dim/60 transition-all rounded-none px-6 py-2.5"
          >
            Naranjo Algorithm
          </TabsTrigger>
          <TabsTrigger
            value="who_umc"
            className="data-[state=active]:bg-cyan/8 data-[state=active]:text-cyan data-[state=active]:border-b data-[state=active]:border-cyan/40 font-mono text-[10px] uppercase tracking-widest text-slate-dim/60 transition-all rounded-none px-6 py-2.5"
          >
            WHO-UMC System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="naranjo">
          <NaranjoTab />
        </TabsContent>
        <TabsContent value="who_umc">
          <WhoUmcTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===================== NARANJO TAB =====================

function NaranjoTab() {
  const [answers, setAnswers] = useState<number[]>(new Array(10).fill(0));
  const [result, setResult] = useState<NaranjoResult | null>(null);
  const [nexcoreResult, setNexcoreResult] = useState<NexCoreVerification | null>(null);
  const [verifying, setVerifying] = useState(false);

  const score = useMemo(() => answers.reduce((a, b) => a + b, 0), [answers]);
  const liveCategory = useMemo(() => naranjoCategory(score), [score]);

  const setAnswer = useCallback((index: number, value: number) => {
    setAnswers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleAssess = useCallback(() => {
    setResult(computeNaranjo(answers));
  }, [answers]);

  const handleVerify = useCallback(() => {
    setVerifying(true);
    fetch('/api/nexcore/causality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'naranjo', answers }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setNexcoreResult({ category: data.category, score: data.score, description: data.description, source: 'nexcore' });
        }
      })
      .catch(() => { /* silently fail */ })
      .finally(() => setVerifying(false));
  }, [answers]);

  return (
    <div className="border border-white/[0.12] bg-white/[0.06]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <Search className="h-3.5 w-3.5 text-cyan/60" />
        <span className="intel-label">Naranjo Algorithm</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[8px] font-mono text-slate-dim/30">ADR Probability Scale (-4 to +13)</span>
      </div>
      <div className="p-4 space-y-1">
        {NARANJO_QUESTIONS.map((q, i) => (
          <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-2 py-3 border-b border-white/[0.06]">
            <div className="flex items-start gap-3">
              <span className="text-[10px] font-mono text-cyan/30 mt-0.5">Q{String(i + 1).padStart(2, '0')}</span>
              <p className="text-xs text-slate-300/80 max-w-xl">{q}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {([['Yes', 1], ['No', -1], ['N/A', 0]] as const).map(([label, val]) => (
                <button
                  key={label}
                  onClick={() => setAnswer(i, val)}
                  className={`px-4 py-1.5 border text-[10px] font-bold font-mono uppercase transition-all ${
                    answers[i] === val
                      ? 'bg-cyan/10 text-cyan border-cyan/40'
                      : 'bg-black/20 text-slate-dim/40 border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Live score */}
        <div className="flex items-center justify-between pt-4">
          <div className="border border-white/[0.12] bg-white/[0.04] px-4 py-2">
            <span className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40">Running Score</span>
            <span className="text-lg font-bold font-mono tabular-nums text-white ml-3">{score}</span>
            <span className={`text-xs font-mono ml-2 ${categoryColor(liveCategory).split(' ')[0]}`}>
              {liveCategory}
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAssess}
              className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
            >
              Run Assessment
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verifying}
              className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-dim/60 border border-white/[0.12] font-mono text-[10px] uppercase tracking-widest"
            >
              {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Server className="h-3.5 w-3.5 mr-1.5" />}
              Verify with NexCore
            </Button>
          </div>
        </div>

        {result && (
          <div className="mt-4 p-6 border border-white/[0.08] bg-black/20">
            <div className={`grid ${nexcoreResult ? 'grid-cols-2 gap-6' : 'grid-cols-1'}`}>
              <div className="text-center">
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-3">Client-Side Result</p>
                <div className={`inline-block px-6 py-2 border font-bold font-mono text-xl tracking-tight ${categoryColor(result.category)}`}>
                  {result.category.toUpperCase()}
                </div>
                <p className="mt-3 text-xs text-slate-dim/50">
                  Score: <span className="text-white font-mono font-bold">{result.score}</span> / 13
                </p>
              </div>
              {nexcoreResult && (
                <div className="text-center border-l border-white/[0.08] pl-6">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-cyan/40 mb-3">
                    <Server className="h-3 w-3 inline mr-1" />NexCore Verification
                  </p>
                  <div className={`inline-block px-6 py-2 border font-bold font-mono text-xl tracking-tight ${categoryColor(nexcoreResult.category)}`}>
                    {nexcoreResult.category.toUpperCase()}
                  </div>
                  {nexcoreResult.score != null && (
                    <p className="mt-3 text-xs text-slate-dim/50">
                      Score: <span className="text-white font-mono font-bold">{nexcoreResult.score}</span> / 13
                    </p>
                  )}
                  {nexcoreResult.description && (
                    <p className="mt-2 text-[10px] text-slate-dim/40">{nexcoreResult.description}</p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-center gap-4 text-[9px] font-mono text-slate-dim/30">
              <span>Definite <span className="text-red-400">&ge;9</span></span>
              <span>Probable <span className="text-gold">5-8</span></span>
              <span>Possible <span className="text-yellow-400">1-4</span></span>
              <span>Doubtful <span className="text-slate-dim/50">&le;0</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== WHO-UMC TAB =====================

function WhoUmcTab() {
  const [selections, setSelections] = useState<WhoUmcInput>({
    temporal: 'reasonable',
    dechallenge: 'positive',
    rechallenge: 'not_done',
    alternatives: 'unlikely',
  });
  const [result, setResult] = useState<WhoUmcResult | null>(null);
  const [nexcoreResult, setNexcoreResult] = useState<NexCoreVerification | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleAssess = useCallback(() => {
    setResult(computeWhoUmc(selections));
  }, [selections]);

  const handleVerify = useCallback(() => {
    setVerifying(true);
    fetch('/api/nexcore/causality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'who-umc', ...selections }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setNexcoreResult({ category: data.category, description: data.description, source: 'nexcore' });
        }
      })
      .catch(() => { /* silently fail */ })
      .finally(() => setVerifying(false));
  }, [selections]);

  return (
    <div className="border border-white/[0.12] bg-white/[0.06]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <Search className="h-3.5 w-3.5 text-gold/60" />
        <span className="intel-label">WHO-UMC System</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[8px] font-mono text-slate-dim/30">Uppsala Monitoring Centre</span>
      </div>
      <div className="p-4 space-y-6">
        {WHO_CRITERIA.map((criterion) => (
          <div key={criterion.id} className="border-b border-white/[0.06] pb-5">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">{criterion.label}</h3>
            <p className="text-[10px] text-slate-dim/40 mt-1 mb-3">{criterion.description}</p>
            <div className="grid gap-2">
              {criterion.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelections(prev => ({ ...prev, [criterion.id]: opt.value } as WhoUmcInput))}
                  className={`w-full text-left px-4 py-2.5 border text-xs font-mono transition-all ${
                    selections[criterion.id as keyof WhoUmcInput] === opt.value
                      ? 'border-cyan/40 bg-cyan/8 text-cyan/80'
                      : 'border-white/[0.08] bg-black/20 text-slate-dim/50 hover:border-white/[0.15]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Reference categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {WHO_CATEGORIES.map((cat) => (
            <div key={cat.label} className={`text-center py-2 border text-[10px] font-bold font-mono uppercase ${cat.color}`}>
              {cat.label}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleAssess}
            className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
          >
            Run Assessment
          </Button>
          <Button
            onClick={handleVerify}
            disabled={verifying}
            className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-dim/60 border border-white/[0.12] font-mono text-[10px] uppercase tracking-widest"
          >
            {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Server className="h-3.5 w-3.5 mr-1.5" />}
            Verify with NexCore
          </Button>
        </div>

        {result && (
          <div className="p-6 border border-white/[0.08] bg-black/20">
            <div className={`grid ${nexcoreResult ? 'grid-cols-2 gap-6' : 'grid-cols-1'}`}>
              <div className="text-center">
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-3">Client-Side Result</p>
                <div className={`inline-block px-6 py-2 border font-bold font-mono text-xl tracking-tight ${categoryColor(result.category)}`}>
                  {result.category.toUpperCase()}
                </div>
                {result.description && (
                  <p className="mt-3 text-xs text-slate-dim/50 max-w-md mx-auto">{result.description}</p>
                )}
              </div>
              {nexcoreResult && (
                <div className="text-center border-l border-white/[0.08] pl-6">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-cyan/40 mb-3">
                    <Server className="h-3 w-3 inline mr-1" />NexCore Verification
                  </p>
                  <div className={`inline-block px-6 py-2 border font-bold font-mono text-xl tracking-tight ${categoryColor(nexcoreResult.category)}`}>
                    {nexcoreResult.category.toUpperCase()}
                  </div>
                  {nexcoreResult.description && (
                    <p className="mt-3 text-xs text-slate-dim/50 max-w-md mx-auto">{nexcoreResult.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
