'use client';

import { useState, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  Activity,
  Shield,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { computeSignals, type SignalResult } from '@/lib/pv-compute';

// ── Types ────────────────────────────────────────────────────────────────────

interface DrugEntry {
  name: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  faers?: FaersData;
  error?: string;
}

interface FaersData {
  total_reports: number;
  events: EventSignal[];
  signal_count: number;
  top_signal?: string;
}

interface EventSignal {
  event: string;
  count: number;
  signals: SignalResult;
}

type RiskTier = 'critical' | 'high' | 'medium' | 'low';

// ── Constants ────────────────────────────────────────────────────────────────

const PRESET_PORTFOLIOS: Record<string, string[]> = {
  'Oncology Focus': ['Nivolumab', 'Pembrolizumab', 'Atezolizumab', 'Ipilimumab', 'Trastuzumab'],
  'Immunology': ['Adalimumab', 'Infliximab', 'Ustekinumab', 'Risankizumab', 'Dupilumab'],
  'CNS/Neuro': ['Carbamazepine', 'Levetiracetam', 'Gabapentin', 'Stiripentol', 'Cannabidiol'],
  'Cardio-Metabolic': ['Atorvastatin', 'Warfarin', 'Metformin', 'Empagliflozin', 'Rivaroxaban'],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyRisk(drug: DrugEntry): RiskTier {
  if (!drug.faers) return 'low';
  const { signal_count, total_reports } = drug.faers;
  const signalRatio = signal_count / Math.max(drug.faers.events.length, 1);
  if (signal_count >= 10 || signalRatio > 0.6) return 'critical';
  if (signal_count >= 5 || signalRatio > 0.4) return 'high';
  if (signal_count >= 2 || total_reports > 50000) return 'medium';
  return 'low';
}

function _riskColor(tier: RiskTier): string {
  switch (tier) {
    case 'critical': return 'text-red-400 border-red-500/30 bg-red-500/5';
    case 'high': return 'text-gold border-gold/30 bg-gold/5';
    case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5';
    case 'low': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
  }
}

function riskBadgeColor(tier: RiskTier): string {
  switch (tier) {
    case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
    case 'high': return 'bg-gold/20 text-gold border-gold/40';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function PortfolioMonitor() {
  const [drugs, setDrugs] = useState<DrugEntry[]>([]);
  const [input, setInput] = useState('');
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const addDrug = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDrugs(prev => {
      if (prev.some(d => d.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, { name: trimmed, status: 'pending' }];
    });
    setInput('');
  }, []);

  const removeDrug = useCallback((name: string) => {
    setDrugs(prev => prev.filter(d => d.name !== name));
  }, []);

  const loadPreset = useCallback((key: string) => {
    const names = PRESET_PORTFOLIOS[key];
    if (!names) return;
    setDrugs(prev => {
      const existing = new Set(prev.map(d => d.name.toLowerCase()));
      const newEntries: DrugEntry[] = names
        .filter(n => !existing.has(n.toLowerCase()))
        .map(n => ({ name: n, status: 'pending' as const }));
      return [...prev, ...newEntries];
    });
  }, []);

  const scanPortfolio = useCallback(async () => {
    const pending = drugs.filter(d => d.status === 'pending' || d.status === 'error');
    if (pending.length === 0) return;

    setScanning(true);

    // Process drugs in parallel batches of 3
    const batchSize = 3;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);

      // Mark batch as loading
      setDrugs(prev => prev.map(d =>
        batch.some(b => b.name === d.name)
          ? { ...d, status: 'loading' as const }
          : d,
      ));

      const results = await Promise.allSettled(
        batch.map(async (drug) => {
          const res = await fetch(`/api/nexcore/faers?drug=${encodeURIComponent(drug.name)}&limit=25`);
          if (!res.ok) throw new Error(`FAERS returned ${res.status}`);
          return { name: drug.name, data: await res.json() };
        }),
      );

      setDrugs(prev => prev.map(d => {
        const result = results.find((_, idx) => batch[idx]?.name === d.name);
        if (!result) return d;

        if (result.status === 'rejected') {
          return { ...d, status: 'error' as const, error: result.reason?.message ?? 'Failed' };
        }

        const raw = result.value.data;
        const totalReports: number = raw.total_reports ?? 0;
        const rawEvents: { event: string; count: number }[] = raw.events ?? [];
        const totalDb = 20_000_000;

        const events: EventSignal[] = rawEvents.map(r => {
          const a = r.count;
          const b = Math.max(totalReports - a, 0);
          const c = Math.round(a * (totalDb / Math.max(totalReports, 1)) * 0.1);
          const dCell = Math.max(totalDb - a - b - c, 0);
          return {
            event: r.event,
            count: a,
            signals: computeSignals({ a, b, c, d: dCell }),
          };
        });

        const signalEvents = events.filter(e => e.signals.any_signal);

        return {
          ...d,
          status: 'loaded' as const,
          faers: {
            total_reports: totalReports,
            events,
            signal_count: signalEvents.length,
            top_signal: signalEvents[0]?.event,
          },
        };
      }));
    }

    setScanning(false);
  }, [drugs]);

  const loadedDrugs = drugs.filter(d => d.status === 'loaded');
  const totalSignals = loadedDrugs.reduce((sum, d) => sum + (d.faers?.signal_count ?? 0), 0);
  const totalReports = loadedDrugs.reduce((sum, d) => sum + (d.faers?.total_reports ?? 0), 0);
  const criticalCount = loadedDrugs.filter(d => classifyRisk(d) === 'critical').length;

  // Sort by risk tier
  const sortedDrugs = [...drugs].sort((a, b) => {
    const tiers: Record<RiskTier, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (tiers[classifyRisk(a)] ?? 4) - (tiers[classifyRisk(b)] ?? 4);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Portfolio Intelligence / Drug Safety Monitoring</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Drug Portfolio Monitor
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Continuous safety intelligence across your drug portfolio — aggregated FAERS signals, risk scoring, and signal prioritization
        </p>
        <p className="text-[9px] font-mono text-cyan/30 mt-1">Client-side signal detection — NexCore FAERS backend</p>
      </header>

      {/* Portfolio Input */}
      <div className="border border-white/[0.12] bg-white/[0.06] p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-4 w-4 text-gold/60" />
          <span className="intel-label">Build Portfolio</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[8px] font-mono text-slate-dim/30">{drugs.length} drug{drugs.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Drug input */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addDrug(input);
            }}
            placeholder="Enter drug name (e.g., Nivolumab)"
            className="flex-1 border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white focus:border-cyan focus:outline-none font-mono placeholder:text-slate-dim/30"
          />
          <Button
            onClick={() => addDrug(input)}
            disabled={!input.trim()}
            className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest px-6"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />Add
          </Button>
        </div>

        {/* Preset portfolios */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[9px] font-mono text-slate-dim/30 uppercase tracking-widest py-1">Presets:</span>
          {Object.keys(PRESET_PORTFOLIOS).map(key => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              className="px-3 py-1.5 border border-white/[0.08] bg-black/20 text-[10px] font-bold text-slate-dim/40 font-mono hover:border-gold/40 hover:text-gold transition-all"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Drug chips */}
        {drugs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {drugs.map(d => (
              <div
                key={d.name}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono font-bold ${
                  d.status === 'loaded'
                    ? riskBadgeColor(classifyRisk(d))
                    : d.status === 'loading'
                    ? 'border-cyan/30 bg-cyan/5 text-cyan/60'
                    : d.status === 'error'
                    ? 'border-red-500/30 bg-red-500/5 text-red-400/60'
                    : 'border-white/[0.12] bg-white/[0.04] text-slate-dim/50'
                }`}
              >
                {d.status === 'loading' && <Loader2 className="h-3 w-3 animate-spin" />}
                {d.status === 'loaded' && d.faers && d.faers.signal_count > 0 && (
                  <Activity className="h-3 w-3" />
                )}
                {d.name}
                <button onClick={() => removeDrug(d.name)} className="ml-1 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Scan button */}
        <Button
          onClick={scanPortfolio}
          disabled={scanning || drugs.filter(d => d.status === 'pending' || d.status === 'error').length === 0}
          className="w-full bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 font-mono text-[10px] uppercase tracking-widest py-3"
        >
          {scanning ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Scanning FAERS Database...</>
          ) : (
            <><Shield className="h-4 w-4 mr-2" />Scan Portfolio ({drugs.filter(d => d.status === 'pending' || d.status === 'error').length} pending)</>
          )}
        </Button>
      </div>

      {/* Portfolio Summary */}
      {loadedDrugs.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              label="Portfolio Size"
              value={loadedDrugs.length.toString()}
              sub={`${drugs.length} total`}
              color="text-white"
            />
            <SummaryCard
              label="Total FAERS Reports"
              value={totalReports.toLocaleString()}
              sub="Across all drugs"
              color="text-cyan"
            />
            <SummaryCard
              label="Active Signals"
              value={totalSignals.toString()}
              sub={`${loadedDrugs.length > 0 ? (totalSignals / loadedDrugs.length).toFixed(1) : '0'} avg/drug`}
              color={totalSignals > 0 ? 'text-red-400' : 'text-emerald-400'}
            />
            <SummaryCard
              label="Critical Risk"
              value={criticalCount.toString()}
              sub={criticalCount > 0 ? 'Requires immediate review' : 'No critical drugs'}
              color={criticalCount > 0 ? 'text-red-400' : 'text-emerald-400'}
            />
          </div>

          {/* Risk Heat Map */}
          <div className="border border-white/[0.12] bg-white/[0.06] mb-6">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
              <TrendingUp className="h-3.5 w-3.5 text-gold/60" />
              <span className="intel-label">Risk Matrix</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-[8px] font-mono text-slate-dim/30">Sorted by risk tier</span>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.12]">
                    <th className="text-left px-3 py-2 text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">Drug</th>
                    <th className="text-center px-3 py-2 text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">Risk</th>
                    <th className="text-right px-3 py-2 text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">Reports</th>
                    <th className="text-right px-3 py-2 text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">Signals</th>
                    <th className="text-right px-3 py-2 text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">Signal Rate</th>
                    <th className="text-left px-3 py-2 text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">Top Signal</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sortedDrugs.filter(d => d.status === 'loaded').map((drug) => {
                    const risk = classifyRisk(drug);
                    const eventCount = drug.faers?.events.length ?? 0;
                    const signalRate = eventCount > 0
                      ? ((drug.faers?.signal_count ?? 0) / eventCount * 100).toFixed(0)
                      : '0';
                    const isExpanded = expandedDrug === drug.name;

                    return (
                      <DrugRow
                        key={drug.name}
                        drug={drug}
                        risk={risk}
                        signalRate={signalRate}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedDrug(isExpanded ? null : drug.name)}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signal Heatmap Grid */}
          <div className="border border-white/[0.12] bg-white/[0.06]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
              <Activity className="h-3.5 w-3.5 text-red-400/60" />
              <span className="intel-label">Signal Heatmap</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-[8px] font-mono text-slate-dim/30">Top 5 events per drug, sorted by PRR</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <div className="grid gap-3">
                {sortedDrugs.filter(d => d.status === 'loaded' && d.faers).map(drug => {
                  const topEvents = [...(drug.faers?.events ?? [])]
                    .filter(e => e.signals.any_signal)
                    .sort((a, b) => b.signals.prr - a.signals.prr)
                    .slice(0, 5);

                  if (topEvents.length === 0) return null;

                  return (
                    <div key={drug.name} className="border border-white/[0.06] bg-black/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-white font-mono">{drug.name}</span>
                        <span className={`text-[8px] font-mono px-2 py-0.5 border ${riskBadgeColor(classifyRisk(drug))}`}>
                          {classifyRisk(drug).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {topEvents.map(ev => {
                          const intensity = Math.min(ev.signals.prr / 10, 1);
                          const opacity = (0.1 + intensity * 0.5).toFixed(2);
                          return (
                            <div
                              key={ev.event}
                              className="border border-red-500/30 px-2 py-1"
                              style={{ backgroundColor: `rgba(239, 68, 68, ${opacity})` }}
                              title={`PRR: ${ev.signals.prr.toFixed(2)}, Count: ${ev.count}`}
                            >
                              <span className="text-[9px] font-mono text-white/80">{ev.event}</span>
                              <span className="text-[8px] font-mono text-red-300/60 ml-1.5">
                                PRR {ev.signals.prr.toFixed(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {drugs.length === 0 && (
        <div className="border border-white/[0.12] bg-white/[0.04] p-12 text-center">
          <Briefcase className="w-8 h-8 text-slate-dim/15 mx-auto mb-4" />
          <p className="text-slate-dim/40 text-sm font-mono">Add drugs to your portfolio or select a preset to begin monitoring</p>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="border border-white/[0.12] bg-white/[0.06] p-4">
      <p className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">{label}</p>
      <p className={`text-2xl font-black font-mono tabular-nums mt-1 ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-dim/30 font-mono mt-0.5">{sub}</p>
    </div>
  );
}

function DrugRow({
  drug,
  risk,
  signalRate,
  isExpanded,
  onToggle,
}: {
  drug: DrugEntry;
  risk: RiskTier;
  signalRate: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-white/[0.06] hover:bg-white/[0.04] cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-3 py-3 text-white font-mono text-xs font-bold">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="h-3 w-3 text-cyan/40" /> : <ChevronRight className="h-3 w-3 text-slate-dim/30" />}
            {drug.name}
          </div>
        </td>
        <td className="text-center px-3 py-3">
          <span className={`inline-block px-2 py-0.5 border text-[9px] font-bold font-mono uppercase ${riskBadgeColor(risk)}`}>
            {risk}
          </span>
        </td>
        <td className="text-right px-3 py-3 text-slate-300/80 font-mono text-xs tabular-nums">
          {drug.faers?.total_reports.toLocaleString() ?? '—'}
        </td>
        <td className={`text-right px-3 py-3 font-mono text-xs font-bold tabular-nums ${
          (drug.faers?.signal_count ?? 0) > 0 ? 'text-red-400' : 'text-slate-dim/40'
        }`}>
          {drug.faers?.signal_count ?? 0}
        </td>
        <td className="text-right px-3 py-3 text-slate-dim/50 font-mono text-xs tabular-nums">
          {signalRate}%
        </td>
        <td className="px-3 py-3 text-[10px] text-gold/60 font-mono">
          {drug.faers?.top_signal ?? '—'}
        </td>
        <td className="px-3 py-3">
          {(drug.faers?.signal_count ?? 0) >= 5 && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-400/60" />
          )}
        </td>
      </tr>
      {isExpanded && drug.faers && (
        <tr>
          <td colSpan={7} className="px-3 pb-4">
            <div className="ml-5 border-l border-cyan/20 pl-4 pt-2">
              <p className="text-[9px] font-mono uppercase tracking-widest text-cyan/40 mb-2">
                Signal Details — {drug.faers.events.filter(e => e.signals.any_signal).length} active signals
              </p>
              <div className="grid gap-1">
                {drug.faers.events
                  .filter(e => e.signals.any_signal)
                  .sort((a, b) => b.signals.prr - a.signals.prr)
                  .slice(0, 10)
                  .map(ev => (
                    <div key={ev.event} className="flex items-center justify-between text-[10px] font-mono py-1 border-b border-white/[0.04]">
                      <span className="text-white/80">{ev.event}</span>
                      <div className="flex gap-4 text-slate-dim/40">
                        <span>n={ev.count.toLocaleString()}</span>
                        <span className={ev.signals.prr_signal ? 'text-red-400' : ''}>
                          PRR {ev.signals.prr.toFixed(2)}
                        </span>
                        <span className={ev.signals.ror_signal ? 'text-red-400' : ''}>
                          ROR {ev.signals.ror.toFixed(2)}
                        </span>
                        <span className={ev.signals.ic_signal ? 'text-red-400' : ''}>
                          IC025 {ev.signals.ic025.toFixed(2)}
                        </span>
                        <span className={ev.signals.ebgm_signal ? 'text-red-400' : ''}>
                          EB05 {ev.signals.eb05.toFixed(2)}
                        </span>
                        <span className={ev.signals.chi_signal ? 'text-red-400' : ''}>
                          Chi2 {ev.signals.chi_square.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
