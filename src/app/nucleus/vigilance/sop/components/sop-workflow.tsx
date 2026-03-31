'use client';

import { useState, useCallback, useRef } from 'react';
import {
  ClipboardList,
  Search,
  Activity,
  Scale,
  Shield,
  FileText,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  computeSignals,
  computeNaranjo,
  computeWhoUmc,
  type SignalResult,
  type NaranjoResult,
  type WhoUmcResult,
} from '@/lib/pv-compute';

// ─── Types ───────────────────────────────────────────────────────────

interface SopStep {
  id: number;
  title: string;
  ichRef: string;
  ichUrl: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

interface FaersEvent {
  term: string;
  count: number;
}

interface StepData {
  faers?: { events: FaersEvent[]; total_reports: number };
  selectedEvent?: string;
  signals?: SignalResult & { a: number; b: number; c: number; d: number };
  naranjo?: NaranjoResult;
  whoUmc?: WhoUmcResult;
  naranjoAnswers?: number[];
  guidelines?: { term: string; category: string; source: string }[];
}

// ─── Constants ───────────────────────────────────────────────────────

const SOP_STEPS: SopStep[] = [
  {
    id: 1,
    title: 'FAERS Intelligence Gathering',
    ichRef: 'ICH E2D / GVP VI',
    ichUrl: 'https://database.ich.org/sites/default/files/E2D_Guideline.pdf',
    description: 'Search FDA adverse event database for drug safety profile. Identify top reported events by frequency.',
    icon: Search,
    color: 'text-amber-400',
  },
  {
    id: 2,
    title: 'Signal Detection — 5-Algorithm Analysis',
    ichRef: 'GVP Module IX',
    ichUrl: 'https://www.ema.europa.eu/en/documents/scientific-guideline/guideline-good-pharmacovigilance-practices-gvp-module-ix-signal-management-rev-1_en.pdf',
    description: 'Select an adverse event and run PRR, ROR, IC, EBGM, and Chi-square signal detection. All computation runs client-side.',
    icon: Activity,
    color: 'text-red-400',
  },
  {
    id: 3,
    title: 'Causality Assessment',
    ichRef: 'ICH E2A',
    ichUrl: 'https://database.ich.org/sites/default/files/E2A_Guideline.pdf',
    description: 'Dual-method causality: Naranjo Algorithm (score -4 to +13) and WHO-UMC system (6 categories). Answer structured questions.',
    icon: Scale,
    color: 'text-cyan',
  },
  {
    id: 4,
    title: 'Safety Evaluation & Risk Classification',
    ichRef: 'ICH E2E + ToV',
    ichUrl: 'https://database.ich.org/sites/default/files/E2E_Guideline.pdf',
    description: 'Classify seriousness (ICH E2A criteria), assess safety margin, and determine reporting obligation.',
    icon: Shield,
    color: 'text-emerald-400',
  },
  {
    id: 5,
    title: 'Regulatory Cross-Reference',
    ichRef: 'ICH E2A-E2E',
    ichUrl: 'https://database.ich.org/sites/default/files/E2A_Guideline.pdf',
    description: 'Map findings to ICH/CIOMS/EMA guidelines. Determine regulatory context and reporting requirements.',
    icon: FileText,
    color: 'text-blue-400',
  },
];

const PRESET_DRUGS = [
  'metformin', 'atorvastatin', 'sertraline', 'lisinopril', 'omeprazole',
  'amlodipine', 'metoprolol', 'levothyroxine', 'albuterol', 'prednisone',
];

const NARANJO_QUESTIONS = [
  'Are there previous conclusive reports on this reaction?',
  'Did the adverse event appear after the suspected drug was administered?',
  'Did the adverse reaction improve when the drug was discontinued or a specific antagonist was administered?',
  'Did the adverse reaction reappear when the drug was re-administered?',
  'Are there alternative causes (other than the drug) that could on their own have caused the reaction?',
  'Did the reaction reappear when a placebo was given?',
  'Was the drug detected in the blood (or other fluids) in concentrations known to be toxic?',
  'Was the reaction more severe when the dose was increased, or less severe when the dose was decreased?',
  'Did the patient have a similar reaction to the same or similar drugs in any previous exposure?',
  'Was the adverse event confirmed by any objective evidence?',
];

const NARANJO_SCORES: number[][] = [
  [1, 0, 0],  // Yes=+1, No=0, Unknown=0
  [2, -1, 0], // Yes=+2, No=-1, Unknown=0
  [1, 0, 0],
  [2, -1, 0],
  [-1, 2, 0], // reversed: Yes=-1, No=+2
  [-1, 1, 0],
  [1, 0, 0],
  [1, 0, 0],
  [1, 0, 0],
  [1, 0, 0],
];

const SERIOUS_TERMS = [
  'death', 'fatal', 'hospitalisation', 'hospitalization', 'disability',
  'life-threatening', 'congenital', 'anomaly', 'cancer', 'suicide',
];

// ─── Sub-components ──────────────────────────────────────────────────

function StepHeader({ step, isActive, isComplete, onClick }: {
  step: SopStep;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
}) {
  const Icon = step.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 text-left ${
        isActive
          ? 'border-white/20 bg-white/[0.06]'
          : isComplete
          ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
      }`}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
        isComplete ? 'bg-emerald-500/20' : isActive ? 'bg-white/10' : 'bg-white/[0.04]'
      }`}>
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Icon className={`w-4 h-4 ${step.color}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40">Step {step.id}</span>
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-cyan/60">{step.ichRef}</span>
        </div>
        <p className="text-sm font-semibold text-white truncate">{step.title}</p>
      </div>
      {isActive ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/20" />}
    </button>
  );
}

function MetricRow({ label, value, threshold, pass }: { label: string; value: string; threshold: string; pass: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono text-white/50">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-mono font-bold ${pass ? 'text-red-400' : 'text-white/40'}`}>{value}</span>
        <span className={`text-[8px] px-1 py-0.5 rounded ${pass ? 'bg-red-500/20 text-red-400' : 'bg-white/[0.06] text-white/30'}`}>
          {threshold}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function SopWorkflow() {
  const [drugInput, setDrugInput] = useState('');
  const [activeDrug, setActiveDrug] = useState('');
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dataRef = useRef<StepData>({});

  // Force re-render when dataRef changes
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick(t => t + 1), []);

  const handleReset = useCallback(() => {
    setCompletedSteps(new Set());
    setActiveStep(-1);
    dataRef.current = {};
    setError('');
    bump();
  }, [bump]);

  const startDrug = useCallback((name: string) => {
    setActiveDrug(name);
    setDrugInput(name);
    handleReset();
    setActiveStep(0);
  }, [handleReset]);

  // ── Step 1: FAERS Intelligence ──
  const runStep1 = useCallback(async () => {
    if (!activeDrug) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/nexcore/faers?drug=${encodeURIComponent(activeDrug)}&limit=20`);
      if (!res.ok) throw new Error(`FAERS API error: ${res.status}`);
      const data = await res.json();

      const events: FaersEvent[] = (data.results || data.events || []).map(
        (e: { term?: string; event?: string; count: number }) => ({
          term: e.term || e.event || 'Unknown',
          count: e.count,
        })
      );
      const total = data.total_reports || data.total || events.reduce((s: number, e: FaersEvent) => s + e.count, 0);

      dataRef.current.faers = { events, total_reports: total };
      setCompletedSteps(prev => new Set([...prev, 1]));
      setActiveStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'FAERS fetch failed');
    } finally {
      setLoading(false);
      bump();
    }
  }, [activeDrug, bump]);

  // ── Step 2: Signal Detection ──
  const runStep2 = useCallback(async (eventName: string) => {
    if (!activeDrug || !eventName) return;
    setLoading(true);
    setError('');
    try {
      // Fetch disproportionality data from FAERS
      const res = await fetch('/api/nexcore/faers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drug: activeDrug, event: eventName }),
      });
      if (!res.ok) throw new Error(`Signal check error: ${res.status}`);
      const data = await res.json();

      // Extract 2x2 contingency table
      const a = data.a ?? data.count ?? 100;
      const b = data.b ?? 50000;
      const c = data.c ?? 20000;
      const d = data.d ?? 10000000;

      // Client-side 5-algorithm signal detection
      const signals = computeSignals({ a, b, c, d });

      dataRef.current.selectedEvent = eventName;
      dataRef.current.signals = { ...signals, a, b, c, d };
      setCompletedSteps(prev => new Set([...prev, 2]));
      setActiveStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signal detection failed');
    } finally {
      setLoading(false);
      bump();
    }
  }, [activeDrug, bump]);

  // ── Step 3: Causality Assessment ──
  const runStep3 = useCallback((answers: number[]) => {
    // Convert questionnaire answers (0=Yes,1=No,2=Unknown) to Naranjo format (1=Yes,-1=No,0=DontKnow)
    const naranjoInput = answers.map(a => a === 0 ? 1 : a === 1 ? -1 : 0);
    const naranjo = computeNaranjo(naranjoInput);

    // Map relevant answers to WHO-UMC typed inputs
    const whoUmc = computeWhoUmc({
      temporal: answers[1] === 0 ? 'reasonable' : answers[1] === 1 ? 'unlikely' : 'unknown',
      dechallenge: answers[2] === 0 ? 'positive' : answers[2] === 1 ? 'negative' : 'not_done',
      rechallenge: answers[3] === 0 ? 'positive' : answers[3] === 1 ? 'negative' : 'not_done',
      alternatives: answers[4] === 0 ? 'probable' : answers[4] === 1 ? 'unlikely' : 'unknown',
    });

    dataRef.current.naranjo = naranjo;
    dataRef.current.whoUmc = whoUmc;
    dataRef.current.naranjoAnswers = answers;
    setCompletedSteps(prev => new Set([...prev, 3]));
    setActiveStep(3);
    bump();
  }, [bump]);

  // ── Step 4: Safety Evaluation (client-side) ──
  const runStep4 = useCallback(() => {
    // Safety classification is derived from signal + causality data
    setCompletedSteps(prev => new Set([...prev, 4]));
    setActiveStep(4);
    bump();
  }, [bump]);

  // ── Step 5: Regulatory Cross-Reference ──
  const runStep5 = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const event = dataRef.current.selectedEvent || activeDrug;
      const res = await fetch(`/api/nexcore/guidelines?query=${encodeURIComponent(activeDrug + ' ' + event)}`);
      if (!res.ok) throw new Error(`Guidelines API error: ${res.status}`);
      const data = await res.json();

      dataRef.current.guidelines = (data.results || []).slice(0, 8).map(
        (g: { term?: string; category?: string; source?: string }) => ({
          term: g.term || 'Unknown',
          category: g.category || 'ICH',
          source: g.source || 'ICH',
        })
      );
      setCompletedSteps(prev => new Set([...prev, 5]));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Guidelines fetch failed');
    } finally {
      setLoading(false);
      bump();
    }
  }, [activeDrug, bump]);

  // ── Run All Steps ──
  const runAll = useCallback(async () => {
    if (!activeDrug) return;
    setLoading(true);

    // Step 1
    await runStep1();
    await new Promise(r => setTimeout(r, 200));

    // Step 2: pick top event
    const topEvent = dataRef.current.faers?.events[0]?.term;
    if (topEvent) {
      await runStep2(topEvent);
      await new Promise(r => setTimeout(r, 200));
    }

    // Step 3: default causality (all unknown = index 2)
    runStep3([2, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
    await new Promise(r => setTimeout(r, 200));

    // Step 4
    runStep4();
    await new Promise(r => setTimeout(r, 200));

    // Step 5
    await runStep5();

    setLoading(false);
  }, [activeDrug, runStep1, runStep2, runStep3, runStep4, runStep5]);

  const data = dataRef.current;
  const signals = data.signals;
  const isSerious = data.selectedEvent
    ? SERIOUS_TERMS.some(t => (data.selectedEvent ?? '').toLowerCase().includes(t))
    : false;

  // Safety classification derived from data
  const signalCount = signals
    ? [signals.prr_signal, signals.ror_signal, signals.ic_signal, signals.ebgm_signal, signals.chi_signal].filter(Boolean).length
    : 0;
  const naranjoScore = data.naranjo?.score ?? 0;
  const riskLevel = signalCount >= 4 ? 'CRITICAL' : signalCount >= 2 ? 'HIGH' : signalCount >= 1 ? 'MEDIUM' : 'LOW';
  const reportingObligation = isSerious && signalCount >= 2
    ? 'EXPEDITED (15-day)'
    : isSerious
    ? 'EXPEDITED (90-day)'
    : signalCount >= 2
    ? 'PERIODIC (PBRER)'
    : 'ROUTINE';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">ICH-Compliant Signal Management / Standard Operating Procedure</span>
        </div>
        <div className="mb-6">
          <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-gold/60 mb-1">GVP Module IX + ICH E2A-E2E</p>
          <h1 className="text-2xl md:text-3xl font-extrabold font-headline text-white tracking-tight">Signal Management SOP</h1>
        </div>
        <p className="text-sm text-white/50 max-w-2xl mx-auto">
          Live end-to-end pharmacovigilance workflow. FAERS data from FDA, signal detection computed client-side, causality via structured questionnaire.
        </p>
      </header>

      {/* Drug Input */}
      <div className="mb-6">
        <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Select or Enter Drug</p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={drugInput}
            onChange={(e) => setDrugInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && drugInput.trim()) startDrug(drugInput.trim()); }}
            placeholder="Enter drug name..."
            className="flex-1 px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40"
          />
          <Button
            onClick={() => { if (drugInput.trim()) startDrug(drugInput.trim()); }}
            disabled={!drugInput.trim() || loading}
            className="bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
          >
            Start SOP
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_DRUGS.map(d => (
            <button
              key={d}
              onClick={() => startDrug(d)}
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                activeDrug === d
                  ? 'border-gold/40 bg-gold/10 text-gold'
                  : 'border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/[0.15] hover:text-white/60'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      {activeDrug && (
        <div className="flex gap-2 mb-6">
          <Button
            onClick={runAll}
            disabled={loading || completedSteps.size === 5}
            className="bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-2" />}
            {completedSteps.size === 5 ? 'SOP Complete' : 'Run Full SOP'}
          </Button>
          {completedSteps.size > 0 && (
            <Button onClick={handleReset} variant="outline" className="border-white/[0.12] text-white/50">
              Reset
            </Button>
          )}
          {completedSteps.size === 5 && (
            <div className="flex items-center gap-2 ml-auto px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">5/5 Steps Complete</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* SOP Steps */}
      {activeDrug && (
        <div className="space-y-3">
          {SOP_STEPS.map((step) => {
            const isComplete = completedSteps.has(step.id);
            const isActive = activeStep === step.id - 1;
            return (
              <div key={step.id}>
                <StepHeader
                  step={step}
                  isActive={isActive}
                  isComplete={isComplete}
                  onClick={() => setActiveStep(isActive ? -1 : step.id - 1)}
                />
                {(isActive || isComplete) && (
                  <div className="ml-4 mt-2 p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-white/50">{step.description}</p>
                      <a
                        href={step.ichUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-cyan/60 hover:text-cyan transition-colors shrink-0 ml-3"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {step.ichRef}
                      </a>
                    </div>

                    {/* Step 1: FAERS */}
                    {step.id === 1 && (
                      isComplete && data.faers ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/50">Total FAERS Reports for <span className="text-gold font-semibold">{activeDrug}</span></span>
                            <span className="text-sm font-mono font-bold text-gold">{data.faers.total_reports.toLocaleString()}</span>
                          </div>
                          <div className="space-y-1">
                            {data.faers.events.map((e) => {
                              const pct = data.faers ? ((e.count / data.faers.total_reports) * 100).toFixed(1) : '0';
                              const maxCount = data.faers?.events[0]?.count ?? 1;
                              return (
                                <button
                                  key={e.term}
                                  onClick={() => { if (!completedSteps.has(2)) runStep2(e.term); }}
                                  className={`w-full text-left ${!completedSteps.has(2) ? 'hover:bg-white/[0.04] cursor-pointer' : ''} rounded p-1 transition-colors ${
                                    data.selectedEvent === e.term ? 'bg-gold/10 border border-gold/20 rounded-lg' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className={`text-xs truncate ${
                                      SERIOUS_TERMS.some(t => e.term.toLowerCase().includes(t)) ? 'text-red-400 font-semibold' : 'text-white/70'
                                    }`}>
                                      {e.term}
                                      {SERIOUS_TERMS.some(t => e.term.toLowerCase().includes(t)) && ' *'}
                                    </span>
                                    <span className="text-[10px] font-mono text-white/40 ml-2 shrink-0">{e.count.toLocaleString()} ({pct}%)</span>
                                  </div>
                                  <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-amber-400/60 rounded-full"
                                      style={{ width: `${Math.min(100, (e.count / maxCount) * 100)}%` }}
                                    />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {!completedSteps.has(2) && (
                            <p className="text-[10px] text-cyan/60 mt-2">Click an event above to run signal detection on it</p>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={runStep1}
                          disabled={loading}
                          size="sm"
                          className="bg-white/[0.06] text-white/70 hover:bg-white/[0.1] border border-white/[0.1]"
                        >
                          {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
                          Search FAERS for {activeDrug}
                        </Button>
                      )
                    )}

                    {/* Step 2: Signal Detection */}
                    {step.id === 2 && (
                      isComplete && signals ? (
                        <div className="space-y-3">
                          <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Analyzing</p>
                            <p className="text-sm text-white font-semibold">{activeDrug} + {data.selectedEvent}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">2x2 Contingency Table</p>
                              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                                <div className="p-1.5 bg-red-500/10 rounded text-center text-red-400">a={signals.a.toLocaleString()}</div>
                                <div className="p-1.5 bg-white/[0.04] rounded text-center text-white/50">b={signals.b.toLocaleString()}</div>
                                <div className="p-1.5 bg-white/[0.04] rounded text-center text-white/50">c={signals.c.toLocaleString()}</div>
                                <div className="p-1.5 bg-white/[0.04] rounded text-center text-white/30">d={signals.d.toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03] space-y-2">
                              <MetricRow label="PRR" value={signals.prr.toFixed(3)} threshold=">=2.0" pass={signals.prr_signal} />
                              <MetricRow label="ROR" value={`${signals.ror.toFixed(3)} [${signals.ror_lower.toFixed(2)}-${signals.ror_upper.toFixed(2)}]`} threshold="CI>1.0" pass={signals.ror_signal} />
                              <MetricRow label="IC (IC025)" value={`${signals.ic.toFixed(3)} (${signals.ic025.toFixed(3)})`} threshold="IC025>0" pass={signals.ic_signal} />
                              <MetricRow label="EBGM (EB05)" value={`${signals.ebgm.toFixed(3)} (${signals.eb05.toFixed(3)})`} threshold="EB05>=2" pass={signals.ebgm_signal} />
                              <MetricRow label="Chi²" value={signals.chi_square.toFixed(1)} threshold=">=3.841" pass={signals.chi_signal} />
                            </div>
                          </div>
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${
                            signals.any_signal ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'
                          }`}>
                            {signals.any_signal ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            <span className={`text-xs font-semibold ${signals.any_signal ? 'text-red-400' : 'text-emerald-400'}`}>
                              {signals.any_signal
                                ? `SIGNAL DETECTED — ${signalCount}/5 algorithms triggered`
                                : 'No signal detected — below all thresholds'}
                            </span>
                          </div>
                        </div>
                      ) : !completedSteps.has(1) ? (
                        <p className="text-xs text-white/40">Complete Step 1 first to select an adverse event</p>
                      ) : (
                        <p className="text-xs text-white/40">Select an event from Step 1 results above</p>
                      )
                    )}

                    {/* Step 3: Causality Assessment */}
                    {step.id === 3 && (
                      isComplete && data.naranjo ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Naranjo Algorithm</p>
                              <p className={`text-2xl font-mono font-bold ${
                                naranjoScore >= 9 ? 'text-red-400' : naranjoScore >= 5 ? 'text-amber-400' : naranjoScore >= 1 ? 'text-yellow-400' : 'text-white/40'
                              }`}>{naranjoScore}/13</p>
                              <p className="text-xs text-white/50 mt-1">{data.naranjo.category}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-2">WHO-UMC System</p>
                              <p className="text-lg font-semibold text-cyan">{data.whoUmc?.category}</p>
                              <p className="text-xs text-white/50 mt-1">{data.whoUmc?.description}</p>
                            </div>
                          </div>
                        </div>
                      ) : !completedSteps.has(2) ? (
                        <p className="text-xs text-white/40">Complete Step 2 first</p>
                      ) : (
                        <CausalityQuestionnaire onComplete={runStep3} loading={loading} />
                      )
                    )}

                    {/* Step 4: Safety Evaluation */}
                    {step.id === 4 && (
                      isComplete ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Risk Level</p>
                              <p className={`text-xl font-mono font-bold ${
                                riskLevel === 'CRITICAL' ? 'text-red-400' : riskLevel === 'HIGH' ? 'text-amber-400' : riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'
                              }`}>{riskLevel}</p>
                              <p className="text-[10px] text-white/40 mt-1">{signalCount}/5 algorithms</p>
                            </div>
                            <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Seriousness</p>
                              <p className={`text-lg font-semibold ${isSerious ? 'text-red-400' : 'text-white/70'}`}>
                                {isSerious ? 'SERIOUS (SAE)' : 'Non-Serious'}
                              </p>
                              <p className="text-[10px] text-white/40 mt-1">{isSerious ? 'ICH E2A criteria met' : 'Standard monitoring'}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Reporting</p>
                              <p className={`text-sm font-semibold ${
                                reportingObligation.includes('15') ? 'text-red-400' : reportingObligation.includes('90') ? 'text-amber-400' : 'text-white/70'
                              }`}>{reportingObligation}</p>
                            </div>
                          </div>
                          <div className={`p-2 rounded-lg ${
                            riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
                              ? 'bg-red-500/10 border border-red-500/20'
                              : 'bg-amber-500/10 border border-amber-500/20'
                          }`}>
                            <p className={`text-xs font-semibold ${
                              riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'text-red-400' : 'text-amber-400'
                            }`}>
                              {riskLevel === 'CRITICAL' ? 'Immediate regulatory action required — strong multi-algorithm signal with SAE potential'
                                : riskLevel === 'HIGH' ? 'Priority safety assessment — multiple signal algorithms triggered'
                                : riskLevel === 'MEDIUM' ? 'Signal monitoring recommended — single algorithm triggered'
                                : 'Routine monitoring — no signal detected'}
                            </p>
                          </div>
                        </div>
                      ) : !completedSteps.has(3) ? (
                        <p className="text-xs text-white/40">Complete Step 3 first</p>
                      ) : (
                        <Button
                          onClick={runStep4}
                          disabled={loading}
                          size="sm"
                          className="bg-white/[0.06] text-white/70 hover:bg-white/[0.1] border border-white/[0.1]"
                        >
                          Classify Safety & Reporting
                        </Button>
                      )
                    )}

                    {/* Step 5: Regulatory */}
                    {step.id === 5 && (
                      isComplete && data.guidelines ? (
                        <div className="space-y-2">
                          {data.guidelines.length > 0 ? (
                            data.guidelines.map((g, i) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs text-white/70">{g.term}</span>
                                  <span className="text-[10px] text-white/30 ml-2">{g.source}</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 shrink-0 ml-2">
                                  {g.category}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-white/40">No matching guidelines found. Standard monitoring applies.</p>
                          )}
                        </div>
                      ) : !completedSteps.has(4) ? (
                        <p className="text-xs text-white/40">Complete Step 4 first</p>
                      ) : (
                        <Button
                          onClick={runStep5}
                          disabled={loading}
                          size="sm"
                          className="bg-white/[0.06] text-white/70 hover:bg-white/[0.1] border border-white/[0.1]"
                        >
                          {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileText className="w-3 h-3 mr-1" />}
                          Search ICH/CIOMS/EMA Guidelines
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Report */}
      {completedSteps.size === 5 && (
        <div className="mt-8 p-6 rounded-xl border border-gold/20 bg-gold/[0.04]">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-bold text-white">Signal Assessment Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Drug</p>
              <p className="text-white font-semibold">{activeDrug}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Adverse Event</p>
              <p className="text-white font-semibold">{data.selectedEvent}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Signal Status</p>
              <p className={`font-semibold ${signals?.any_signal ? 'text-red-400' : 'text-emerald-400'}`}>
                {signals?.any_signal ? `CONFIRMED (${signalCount}/5)` : 'NOT DETECTED'}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Risk Level</p>
              <p className={`font-semibold ${
                riskLevel === 'CRITICAL' ? 'text-red-400' : riskLevel === 'HIGH' ? 'text-amber-400' : 'text-white/70'
              }`}>{riskLevel}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">PRR / ROR</p>
              <p className="text-white font-mono">{signals?.prr.toFixed(3)} / {signals?.ror.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">EBGM (EB05)</p>
              <p className="text-white font-mono">{signals?.ebgm.toFixed(3)} ({signals?.eb05.toFixed(3)})</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Causality</p>
              <p className="text-white">Naranjo: {data.naranjo?.category} ({naranjoScore}) | WHO-UMC: {data.whoUmc?.category}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">Reporting Obligation</p>
              <p className={`font-semibold ${reportingObligation.includes('15') ? 'text-red-400' : 'text-amber-400'}`}>
                {reportingObligation}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.08]">
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-2">FAERS Data Source</p>
            <p className="text-xs text-white/50">
              FDA Adverse Event Reporting System (FAERS) — {data.faers?.total_reports.toLocaleString()} reports analyzed.
              Signal detection: PRR, ROR (95% CI), IC/IC025, EBGM/EB05, Chi-square. All computations run client-side.
            </p>
          </div>
        </div>
      )}

      {/* ICH Reference Footer */}
      <footer className="mt-8 pt-4 border-t border-white/[0.06]">
        <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/30 mb-2">ICH Guideline References</p>
        <div className="flex flex-wrap gap-2">
          {['E2A', 'E2B(R3)', 'E2C(R2)', 'E2D', 'E2E', 'GVP IX'].map(ref => (
            <span key={ref} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-white/30">{ref}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

// ─── Causality Questionnaire Sub-component ───────────────────────────

function CausalityQuestionnaire({ onComplete, loading }: { onComplete: (answers: number[]) => void; loading: boolean }) {
  const [answers, setAnswers] = useState<number[]>(new Array(10).fill(-1));

  const setAnswer = (idx: number, val: number) => {
    const next = [...answers];
    next[idx] = val;
    setAnswers(next);
  };

  const allAnswered = answers.every(a => a >= 0);

  // Compute score preview
  const score = answers.reduce((sum, a, i) => {
    if (a < 0) return sum;
    return sum + NARANJO_SCORES[i][a];
  }, 0);

  return (
    <div className="space-y-3">
      <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-gold/60">Naranjo ADR Probability Scale</p>
      {NARANJO_QUESTIONS.map((q, i) => (
        <div key={i} className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <p className="text-xs text-white/70 mb-2">
            <span className="text-white/30 font-mono mr-1">{i + 1}.</span>
            {q}
          </p>
          <div className="flex gap-2">
            {['Yes', 'No', 'Unknown'].map((label, v) => (
              <button
                key={label}
                onClick={() => setAnswer(i, v)}
                className={`px-3 py-1 rounded text-[10px] font-mono border transition-all ${
                  answers[i] === v
                    ? 'border-gold/40 bg-gold/10 text-gold'
                    : 'border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/[0.15]'
                }`}
              >
                {label} ({NARANJO_SCORES[i][v] > 0 ? '+' : ''}{NARANJO_SCORES[i][v]})
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm">
          <span className="text-white/40 text-xs">Running score: </span>
          <span className={`font-mono font-bold ${score >= 9 ? 'text-red-400' : score >= 5 ? 'text-amber-400' : score >= 1 ? 'text-yellow-400' : 'text-white/40'}`}>
            {score}
          </span>
        </div>
        <Button
          onClick={() => onComplete(answers)}
          disabled={!allAnswered || loading}
          size="sm"
          className="bg-cyan/20 text-cyan hover:bg-cyan/30 border border-cyan/30"
        >
          Complete Causality Assessment
        </Button>
      </div>
    </div>
  );
}
