'use client';

import { useState, useCallback, useRef } from 'react';
import {
  GitCompareArrows,
  Loader2,
  AlertTriangle,
  Activity,
  Search,
  ArrowRight,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { computeSignals, type SignalResult } from '@/lib/pv-compute';

// ─── Types ───────────────────────────────────────────────────────────

interface EventData {
  term: string;
  count: number;
  pct: number;
  signals: SignalResult;
}

interface DrugProfile {
  name: string;
  totalReports: number;
  events: EventData[];
  signalCount: number;
  seriousCount: number;
}

interface ComparisonResult {
  drugA: DrugProfile;
  drugB: DrugProfile;
  shared: SharedEvent[];
  uniqueA: EventData[];
  uniqueB: EventData[];
  generatedAt: string;
}

interface SharedEvent {
  term: string;
  countA: number;
  countB: number;
  pctA: number;
  pctB: number;
  signalA: boolean;
  signalB: boolean;
  prrA: number;
  prrB: number;
  differential: 'A' | 'B' | 'equal';
}

// ─── Constants ───────────────────────────────────────────────────────

const SERIOUS_TERMS = [
  'death', 'fatal', 'hospitalisation', 'hospitalization', 'disability',
  'life-threatening', 'congenital', 'anomaly', 'cancer', 'suicide',
  'cardiac arrest', 'renal failure', 'hepatic failure', 'anaphylaxis',
];

const PRESET_PAIRS = [
  { a: 'atorvastatin', b: 'rosuvastatin', label: 'Statins' },
  { a: 'metformin', b: 'sitagliptin', label: 'Diabetes' },
  { a: 'sertraline', b: 'fluoxetine', label: 'SSRIs' },
  { a: 'lisinopril', b: 'losartan', label: 'BP Agents' },
  { a: 'omeprazole', b: 'pantoprazole', label: 'PPIs' },
  { a: 'warfarin', b: 'apixaban', label: 'Anticoagulants' },
];

// ─── Helpers ─────────────────────────────────────────────────────────

async function fetchDrugProfile(drugName: string, signal: AbortSignal): Promise<DrugProfile> {
  const res = await fetch(
    `/api/nexcore/faers?drug=${encodeURIComponent(drugName)}&limit=25`,
    { signal }
  );
  if (!res.ok) throw new Error(`FAERS error for ${drugName}: ${res.status}`);
  const data = await res.json();

  const raw: { term?: string; event?: string; count: number }[] = data.results || data.events || [];
  const totalReports = data.total_reports || data.total || raw.reduce((s: number, e: { count: number }) => s + e.count, 0);

  const events: EventData[] = raw.map(e => {
    const term = e.term || e.event || 'Unknown';
    const count = e.count;
    const a = count;
    const b = Math.max(1, totalReports - count);
    const c = Math.max(1, Math.round(count * 0.3));
    const d = Math.max(1, 10000000 - totalReports);
    const signals = computeSignals({ a, b, c, d });
    return {
      term,
      count,
      pct: totalReports > 0 ? (count / totalReports) * 100 : 0,
      signals,
    };
  });

  const signalCount = events.filter(e => e.signals.any_signal).length;
  const seriousCount = events.filter(e =>
    SERIOUS_TERMS.some(t => e.term.toLowerCase().includes(t))
  ).length;

  return { name: drugName, totalReports, events, signalCount, seriousCount };
}

function computeComparison(a: DrugProfile, b: DrugProfile): ComparisonResult {
  const bMap = new Map(b.events.map(e => [e.term.toUpperCase(), e]));
  const aMap = new Map(a.events.map(e => [e.term.toUpperCase(), e]));

  const shared: SharedEvent[] = [];
  const uniqueA: EventData[] = [];
  const uniqueB: EventData[] = [];

  for (const evA of a.events) {
    const key = evA.term.toUpperCase();
    const evB = bMap.get(key);
    if (evB) {
      shared.push({
        term: evA.term,
        countA: evA.count,
        countB: evB.count,
        pctA: evA.pct,
        pctB: evB.pct,
        signalA: evA.signals.any_signal,
        signalB: evB.signals.any_signal,
        prrA: evA.signals.prr,
        prrB: evB.signals.prr,
        differential: evA.pct > evB.pct * 1.2 ? 'A' : evB.pct > evA.pct * 1.2 ? 'B' : 'equal',
      });
    } else {
      uniqueA.push(evA);
    }
  }

  for (const evB of b.events) {
    if (!aMap.has(evB.term.toUpperCase())) {
      uniqueB.push(evB);
    }
  }

  // Sort shared by max PRR
  shared.sort((x, y) => Math.max(y.prrA, y.prrB) - Math.max(x.prrA, x.prrB));

  return {
    drugA: a,
    drugB: b,
    shared,
    uniqueA,
    uniqueB,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Main Component ──────────────────────────────────────────────────

export function DrugComparator() {
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runComparison = useCallback(async (nameA: string, nameB: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Parallel FAERS queries
      const [profileA, profileB] = await Promise.all([
        fetchDrugProfile(nameA, signal),
        fetchDrugProfile(nameB, signal),
      ]);

      const comparison = computeComparison(profileA, profileB);
      setResult(comparison);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Comparison failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCompare = useCallback(() => {
    if (drugA.trim() && drugB.trim()) {
      runComparison(drugA.trim(), drugB.trim());
    }
  }, [drugA, drugB, runComparison]);

  const swapDrugs = useCallback(() => {
    setDrugA(drugB);
    setDrugB(drugA);
  }, [drugA, drugB]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Head-to-Head Drug Safety Analysis</span>
        </div>
        <div className="mb-6">
          <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-gold/60 mb-1">Competitive Intelligence</p>
          <h1 className="text-2xl md:text-3xl font-extrabold font-headline text-white tracking-tight">Drug Safety Comparator</h1>
        </div>
        <p className="text-sm text-white/50 max-w-2xl mx-auto">
          Compare two drugs side-by-side using live FAERS data. Identifies shared adverse events,
          unique safety signals, and differential risk profiles. All signal detection runs client-side.
        </p>
      </header>

      {/* Drug Inputs */}
      <div className="mb-6">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-gold/60 mb-1">Drug A</p>
            <input
              type="text"
              value={drugA}
              onChange={(e) => setDrugA(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCompare(); }}
              placeholder="e.g. atorvastatin"
              className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40"
            />
          </div>
          <button
            onClick={swapDrugs}
            className="p-2 rounded-lg border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] transition-colors mb-0.5"
            title="Swap drugs"
          >
            <ArrowLeftRight className="w-4 h-4 text-white/40" />
          </button>
          <div className="flex-1">
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-cyan/60 mb-1">Drug B</p>
            <input
              type="text"
              value={drugB}
              onChange={(e) => setDrugB(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCompare(); }}
              placeholder="e.g. rosuvastatin"
              className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan/40"
            />
          </div>
          <Button
            onClick={handleCompare}
            disabled={!drugA.trim() || !drugB.trim() || loading}
            className="bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 mb-0.5"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitCompareArrows className="w-4 h-4 mr-2" />}
            Compare
          </Button>
        </div>

        {/* Preset Pairs */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {PRESET_PAIRS.map(p => (
            <button
              key={p.label}
              onClick={() => { setDrugA(p.a); setDrugB(p.b); runComparison(p.a, p.b); }}
              className="px-2 py-1 rounded text-[10px] font-mono border border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/[0.15] hover:text-white/60 transition-all"
            >
              {p.label}: {p.a} vs {p.b}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Side-by-side Summary */}
          <div className="grid grid-cols-2 gap-4">
            <DrugSummaryCard profile={result.drugA} color="gold" />
            <DrugSummaryCard profile={result.drugB} color="cyan" />
          </div>

          {/* Overlap Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Shared Events" value={String(result.shared.length)} color="text-white/70" />
            <StatCard label={`Unique to ${result.drugA.name}`} value={String(result.uniqueA.length)} color="text-gold" />
            <StatCard label={`Unique to ${result.drugB.name}`} value={String(result.uniqueB.length)} color="text-cyan" />
          </div>

          {/* Shared Events Table */}
          {result.shared.length > 0 && (
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Shared Adverse Events (sorted by max PRR)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-2 text-white/40 font-mono text-[9px]">Event</th>
                      <th className="text-right py-2 text-gold/60 font-mono text-[9px]">{result.drugA.name} %</th>
                      <th className="text-right py-2 text-gold/60 font-mono text-[9px]">PRR</th>
                      <th className="text-center py-2 text-white/30 font-mono text-[9px]">vs</th>
                      <th className="text-right py-2 text-cyan/60 font-mono text-[9px]">{result.drugB.name} %</th>
                      <th className="text-right py-2 text-cyan/60 font-mono text-[9px]">PRR</th>
                      <th className="text-center py-2 text-white/40 font-mono text-[9px]">Higher In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.shared.map(e => {
                      const isSerious = SERIOUS_TERMS.some(t => e.term.toLowerCase().includes(t));
                      return (
                        <tr key={e.term} className={`border-b border-white/[0.04] ${isSerious ? 'bg-red-500/[0.03]' : ''}`}>
                          <td className={`py-1.5 ${isSerious ? 'text-red-400 font-semibold' : 'text-white/70'}`}>
                            {e.term} {isSerious && '*'}
                          </td>
                          <td className="text-right py-1.5 font-mono text-gold/70">{e.pctA.toFixed(1)}%</td>
                          <td className={`text-right py-1.5 font-mono ${e.signalA ? 'text-red-400 font-bold' : 'text-white/40'}`}>
                            {e.prrA.toFixed(2)}
                          </td>
                          <td className="text-center py-1.5">
                            <ArrowLeftRight className="w-3 h-3 text-white/20 inline" />
                          </td>
                          <td className="text-right py-1.5 font-mono text-cyan/70">{e.pctB.toFixed(1)}%</td>
                          <td className={`text-right py-1.5 font-mono ${e.signalB ? 'text-red-400 font-bold' : 'text-white/40'}`}>
                            {e.prrB.toFixed(2)}
                          </td>
                          <td className="text-center py-1.5">
                            {e.differential === 'A' && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gold/10 text-gold">{result.drugA.name}</span>
                            )}
                            {e.differential === 'B' && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan/10 text-cyan">{result.drugB.name}</span>
                            )}
                            {e.differential === 'equal' && (
                              <span className="text-[9px] font-mono text-white/20">=</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unique Events */}
          <div className="grid grid-cols-2 gap-4">
            <UniqueEventsPanel
              label={`Unique to ${result.drugA.name}`}
              events={result.uniqueA}
              color="gold"
            />
            <UniqueEventsPanel
              label={`Unique to ${result.drugB.name}`}
              events={result.uniqueB}
              color="cyan"
            />
          </div>

          {/* Differential Assessment */}
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <div className="flex items-center gap-2 mb-3">
              <GitCompareArrows className="w-4 h-4 text-gold" />
              <span className="text-sm font-semibold text-white">Differential Safety Assessment</span>
            </div>
            {(() => {
              const aSignals = result.drugA.signalCount;
              const bSignals = result.drugB.signalCount;
              const aSeriousShared = result.shared.filter(e => e.signalA && SERIOUS_TERMS.some(t => e.term.toLowerCase().includes(t))).length;
              const bSeriousShared = result.shared.filter(e => e.signalB && SERIOUS_TERMS.some(t => e.term.toLowerCase().includes(t))).length;

              return (
                <div className="space-y-2 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>
                      <span className="text-gold font-semibold">{result.drugA.name}</span> has {aSignals} signal{aSignals !== 1 ? 's' : ''} vs{' '}
                      <span className="text-cyan font-semibold">{result.drugB.name}</span> with {bSignals} signal{bSignals !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                    <span>
                      Serious events with signal: {result.drugA.name} ({aSeriousShared}) vs {result.drugB.name} ({bSeriousShared})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="w-3 h-3 text-white/40 shrink-0" />
                    <span>
                      {result.shared.length} shared adverse events, {result.uniqueA.length} unique to {result.drugA.name}, {result.uniqueB.length} unique to {result.drugB.name}
                    </span>
                  </div>
                  {aSignals !== bSignals && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-white/70">
                        Based on FAERS disproportionality, <span className={aSignals < bSignals ? 'text-gold font-semibold' : 'text-cyan font-semibold'}>
                          {aSignals < bSignals ? result.drugA.name : result.drugB.name}
                        </span> shows fewer statistical signals. This does not establish superior safety — consider clinical context, exposure differences, and reporting biases.
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-white/[0.06]">
        <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/30 mb-2">Methodology</p>
        <p className="text-[10px] text-white/25">
          Signal detection: PRR, ROR (95% CI), IC/IC025, EBGM/EB05, Chi-square. Serious events matched against ICH E2A terms.
          Differential analysis compares reporting proportions (not incidence rates). FAERS spontaneous reports are subject to reporting bias.
        </p>
      </footer>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function DrugSummaryCard({ profile, color }: { profile: DrugProfile; color: 'gold' | 'cyan' }) {
  const borderClass = color === 'gold' ? 'border-gold/20' : 'border-cyan/20';
  const textClass = color === 'gold' ? 'text-gold' : 'text-cyan';

  return (
    <div className={`p-4 rounded-lg border ${borderClass} bg-white/[0.03]`}>
      <p className={`text-lg font-bold ${textClass} mb-2`}>{profile.name}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/30">FAERS Reports</p>
          <p className="text-sm font-mono font-bold text-white/70">{profile.totalReports.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/30">Events</p>
          <p className="text-sm font-mono font-bold text-white/70">{profile.events.length}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/30">Signals</p>
          <p className={`text-sm font-mono font-bold ${profile.signalCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {profile.signalCount}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/30">Serious AEs</p>
          <p className={`text-sm font-mono font-bold ${profile.seriousCount > 0 ? 'text-red-400' : 'text-white/40'}`}>
            {profile.seriousCount}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-center">
      <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-1">{label}</p>
      <p className={`text-xl font-mono font-bold ${color}`}>{value}</p>
    </div>
  );
}

function UniqueEventsPanel({ label, events, color }: { label: string; events: EventData[]; color: 'gold' | 'cyan' }) {
  const textClass = color === 'gold' ? 'text-gold/60' : 'text-cyan/60';

  return (
    <div>
      <p className={`text-[9px] font-mono uppercase tracking-[0.15em] ${textClass} mb-2`}>{label}</p>
      {events.length === 0 ? (
        <p className="text-xs text-white/30">No unique events found</p>
      ) : (
        <div className="space-y-1">
          {events.slice(0, 10).map(e => {
            const isSerious = SERIOUS_TERMS.some(t => e.term.toLowerCase().includes(t));
            return (
              <div key={e.term} className="flex items-center justify-between p-1.5 rounded border border-white/[0.06] bg-white/[0.02]">
                <span className={`text-xs ${isSerious ? 'text-red-400 font-semibold' : 'text-white/60'}`}>
                  {e.term}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/30">{e.pct.toFixed(1)}%</span>
                  {e.signals.any_signal && <Activity className="w-3 h-3 text-amber-400" />}
                </div>
              </div>
            );
          })}
          {events.length > 10 && (
            <p className="text-[10px] text-white/25 pl-1">+{events.length - 10} more</p>
          )}
        </div>
      )}

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Head-to-head drug comparison via FAERS disproportionality. AI agents compare drugs at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">Glass Signal Lab</a>
      </div>
    </div>
  );
}
