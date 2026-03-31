'use client';

import { useState, useCallback } from 'react';
import {
  FileText,
  Loader2,
  AlertTriangle,
  Activity,
  Shield,
  Scale,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { computeSignals, type SignalResult } from '@/lib/pv-compute';

// ── Types ────────────────────────────────────────────────────────────────────

interface DossierState {
  drug: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error?: string;
  faers?: FaersSection;
  guidelines?: GuidelineSection;
  competitors?: CompetitorSection;
}

interface FaersSection {
  total_reports: number;
  events: EventSignal[];
  signal_count: number;
  serious_signals: EventSignal[];
}

interface EventSignal {
  event: string;
  count: number;
  signals: SignalResult;
}

interface GuidelineHit {
  id: string;
  title: string;
  source: string;
  relevance: number;
}

interface GuidelineSection {
  hits: GuidelineHit[];
}

interface CompetitorDrug {
  name: string;
  total_reports: number;
  signal_count: number;
  top_signal?: string;
}

interface CompetitorSection {
  drugs: CompetitorDrug[];
}

type SectionId = 'faers' | 'guidelines' | 'competitors';

// ── Presets ──────────────────────────────────────────────────────────────────

const PRESET_DRUGS = [
  'Nivolumab', 'Adalimumab', 'Methotrexate', 'Warfarin',
  'Carbamazepine', 'Infliximab', 'Atorvastatin', 'Pembrolizumab',
  'Dupilumab', 'Cannabidiol', 'Ustekinumab', 'Empagliflozin',
];

// Map drugs to therapeutic class for competitive analysis
const THERAPEUTIC_CLASS: Record<string, string[]> = {
  nivolumab: ['Pembrolizumab', 'Atezolizumab', 'Ipilimumab'],
  pembrolizumab: ['Nivolumab', 'Atezolizumab', 'Durvalumab'],
  adalimumab: ['Infliximab', 'Etanercept', 'Certolizumab'],
  infliximab: ['Adalimumab', 'Etanercept', 'Golimumab'],
  ustekinumab: ['Risankizumab', 'Guselkumab', 'Tildrakizumab'],
  dupilumab: ['Tralokinumab', 'Omalizumab', 'Mepolizumab'],
  methotrexate: ['Leflunomide', 'Azathioprine', 'Mycophenolate'],
  warfarin: ['Rivaroxaban', 'Apixaban', 'Dabigatran'],
  carbamazepine: ['Oxcarbazepine', 'Lamotrigine', 'Phenytoin'],
  atorvastatin: ['Rosuvastatin', 'Simvastatin', 'Pravastatin'],
  empagliflozin: ['Dapagliflozin', 'Canagliflozin', 'Ertugliflozin'],
  cannabidiol: ['Stiripentol', 'Clobazam', 'Valproate'],
};

// ── Component ────────────────────────────────────────────────────────────────

export function DrugDossier() {
  const [input, setInput] = useState('');
  const [dossier, setDossier] = useState<DossierState>({ drug: '', status: 'idle' });
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['faers']));

  const toggleSection = useCallback((id: SectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const generateDossier = useCallback(async (drugName: string) => {
    const name = drugName.trim();
    if (!name) return;

    setInput(name);
    setDossier({ drug: name, status: 'loading' });
    setExpandedSections(new Set(['faers']));

    try {
      // Phase 1: FAERS + Guidelines in parallel
      const [faersRes, guidelinesRes] = await Promise.allSettled([
        fetch(`/api/nexcore/faers?drug=${encodeURIComponent(name)}&limit=25`).then(r => r.ok ? r.json() : null),
        fetch(`/api/nexcore/guidelines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'search', query: name, limit: 10 }),
        }).then(r => r.ok ? r.json() : null),
      ]);

      // Process FAERS
      let faers: FaersSection | undefined;
      if (faersRes.status === 'fulfilled' && faersRes.value) {
        const raw = faersRes.value;
        const totalReports: number = raw.total_reports ?? 0;
        const rawEvents: { event: string; count: number }[] = raw.events ?? [];
        const totalDb = 20_000_000;

        const events: EventSignal[] = rawEvents.map(r => {
          const a = r.count;
          const b = Math.max(totalReports - a, 0);
          const c = Math.round(a * (totalDb / Math.max(totalReports, 1)) * 0.1);
          const dCell = Math.max(totalDb - a - b - c, 0);
          return { event: r.event, count: a, signals: computeSignals({ a, b, c, d: dCell }) };
        });

        const signalEvents = events.filter(e => e.signals.any_signal);
        const seriousTerms = ['death', 'hospitalisation', 'disability', 'life-threatening', 'congenital', 'fatal'];
        const seriousSignals = signalEvents.filter(e =>
          seriousTerms.some(t => e.event.toLowerCase().includes(t)),
        );

        faers = { total_reports: totalReports, events, signal_count: signalEvents.length, serious_signals: seriousSignals };
      }

      // Process Guidelines
      let guidelines: GuidelineSection | undefined;
      if (guidelinesRes.status === 'fulfilled' && guidelinesRes.value?.results) {
        guidelines = {
          hits: guidelinesRes.value.results.slice(0, 8).map((r: { id: string; title: string; source: string; score: number }) => ({
            id: r.id,
            title: r.title,
            source: r.source,
            relevance: r.score ?? 0.5,
          })),
        };
      }

      // Phase 2: Competitive landscape
      const classKey = name.toLowerCase();
      const competitorNames = THERAPEUTIC_CLASS[classKey] ?? [];
      let competitors: CompetitorSection | undefined;

      if (competitorNames.length > 0) {
        const compResults = await Promise.allSettled(
          competitorNames.map(async (comp) => {
            const res = await fetch(`/api/nexcore/faers?drug=${encodeURIComponent(comp)}&limit=10`);
            if (!res.ok) return null;
            return { name: comp, data: await res.json() };
          }),
        );

        const drugs: CompetitorDrug[] = compResults
          .filter((r): r is PromiseFulfilledResult<{ name: string; data: { total_reports: number; events: { event: string; count: number }[] } } | null> => r.status === 'fulfilled')
          .filter((r): r is PromiseFulfilledResult<NonNullable<typeof r.value>> => r.value !== null)
          .map(r => {
            const raw = r.value;
            const totalReports: number = raw.data.total_reports ?? 0;
            const rawEvents: { event: string; count: number }[] = raw.data.events ?? [];
            const totalDb = 20_000_000;

            const events = rawEvents.map(ev => {
              const a = ev.count;
              const b = Math.max(totalReports - a, 0);
              const c = Math.round(a * (totalDb / Math.max(totalReports, 1)) * 0.1);
              const dCell = Math.max(totalDb - a - b - c, 0);
              return { ...ev, signals: computeSignals({ a, b, c, d: dCell }) };
            });

            const signalEvents = events.filter(e => e.signals.any_signal);
            return {
              name: raw.name,
              total_reports: totalReports,
              signal_count: signalEvents.length,
              top_signal: signalEvents.sort((a, b) => b.signals.prr - a.signals.prr)[0]?.event,
            };
          });

        if (drugs.length > 0) {
          competitors = { drugs };
        }
      }

      setDossier({
        drug: name,
        status: 'loaded',
        faers,
        guidelines,
        competitors,
      });
    } catch (err) {
      setDossier({
        drug: name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Dossier generation failed',
      });
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Drug Intelligence / Safety Dossier</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Drug Intelligence Dossier
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Comprehensive safety intelligence — FAERS signals, regulatory cross-reference, and competitive landscape in one view
        </p>
      </header>

      {/* Search */}
      <div className="border border-white/[0.12] bg-white/[0.06] p-6 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input.trim() && generateDossier(input)}
            placeholder="Enter drug name (e.g., Nivolumab)"
            className="flex-1 border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white focus:border-cyan focus:outline-none font-mono placeholder:text-slate-dim/30"
          />
          <Button
            onClick={() => generateDossier(input)}
            disabled={dossier.status === 'loading' || !input.trim()}
            className="bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 font-mono text-[10px] uppercase tracking-widest px-8"
          >
            {dossier.status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><FileText className="h-4 w-4 mr-2" />Generate Dossier</>
            )}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESET_DRUGS.map(d => (
            <button
              key={d}
              onClick={() => generateDossier(d)}
              className="px-2.5 py-1 border border-white/[0.08] bg-black/20 text-[10px] font-bold text-slate-dim/40 font-mono hover:border-gold/40 hover:text-gold transition-all"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {dossier.status === 'loading' && (
        <div className="border border-cyan/20 bg-cyan/5 p-8">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-gold animate-spin" />
            <div>
              <p className="text-gold font-bold font-mono text-sm">GENERATING DOSSIER: {dossier.drug}</p>
              <p className="text-[10px] text-slate-dim/40 font-mono mt-1">
                Querying FAERS → Signal detection → Regulatory cross-reference → Competitive analysis...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {dossier.status === 'error' && (
        <div className="border border-red-500/30 bg-red-500/10 p-4 mb-6 text-red-400 text-sm font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {dossier.error}
        </div>
      )}

      {/* Dossier content */}
      {dossier.status === 'loaded' && (
        <div className="space-y-4">
          {/* Dossier header */}
          <div className="border border-gold/30 bg-gold/5 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-gold/60 mb-1">Drug Intelligence Dossier</p>
                <h2 className="text-2xl font-extrabold font-headline text-white">{dossier.drug}</h2>
                <p className="text-[10px] font-mono text-slate-dim/40 mt-1">
                  Generated {new Date().toLocaleDateString()} — Client-side analysis + NexCore backend
                </p>
              </div>
              <div className="text-right">
                {dossier.faers && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[8px] font-mono text-slate-dim/40 uppercase">Reports</p>
                      <p className="text-lg font-black font-mono text-cyan tabular-nums">
                        {dossier.faers.total_reports.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-slate-dim/40 uppercase">Signals</p>
                      <p className={`text-lg font-black font-mono tabular-nums ${
                        dossier.faers.signal_count > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {dossier.faers.signal_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-slate-dim/40 uppercase">Serious</p>
                      <p className={`text-lg font-black font-mono tabular-nums ${
                        dossier.faers.serious_signals.length > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {dossier.faers.serious_signals.length}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FAERS Section */}
          <CollapsibleSection
            id="faers"
            icon={Activity}
            title="FAERS Signal Profile"
            subtitle={`${dossier.faers?.signal_count ?? 0} active signals from ${dossier.faers?.events.length ?? 0} events`}
            expanded={expandedSections.has('faers')}
            onToggle={() => toggleSection('faers')}
            alertCount={dossier.faers?.signal_count ?? 0}
          >
            {dossier.faers && (
              <div className="space-y-4">
                {/* Signal events table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="bg-white/[0.04]">
                        <th className="text-left px-3 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">Event</th>
                        <th className="text-right px-2 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">Count</th>
                        <th className="text-right px-2 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">PRR</th>
                        <th className="text-right px-2 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">ROR</th>
                        <th className="text-right px-2 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">IC025</th>
                        <th className="text-right px-2 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">EB05</th>
                        <th className="text-right px-2 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">Chi2</th>
                        <th className="text-center px-2 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">Signal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossier.faers.events
                        .sort((a, b) => {
                          // Signals first, then by PRR
                          if (a.signals.any_signal !== b.signals.any_signal) return a.signals.any_signal ? -1 : 1;
                          return b.signals.prr - a.signals.prr;
                        })
                        .slice(0, 20)
                        .map(ev => (
                          <tr key={ev.event} className="border-t border-white/[0.06]">
                            <td className="px-3 py-1.5 text-white/80">{ev.event}</td>
                            <td className="text-right px-2 py-1.5 text-slate-dim/60 tabular-nums">{ev.count.toLocaleString()}</td>
                            <td className={`text-right px-2 py-1.5 font-bold tabular-nums ${ev.signals.prr_signal ? 'text-red-400' : 'text-slate-dim/40'}`}>
                              {ev.signals.prr.toFixed(2)}
                            </td>
                            <td className={`text-right px-2 py-1.5 tabular-nums ${ev.signals.ror_signal ? 'text-red-400' : 'text-slate-dim/40'}`}>
                              {ev.signals.ror.toFixed(2)}
                            </td>
                            <td className={`text-right px-2 py-1.5 tabular-nums ${ev.signals.ic_signal ? 'text-red-400' : 'text-slate-dim/40'}`}>
                              {ev.signals.ic025.toFixed(2)}
                            </td>
                            <td className={`text-right px-2 py-1.5 tabular-nums ${ev.signals.ebgm_signal ? 'text-red-400' : 'text-slate-dim/40'}`}>
                              {ev.signals.eb05.toFixed(2)}
                            </td>
                            <td className={`text-right px-2 py-1.5 tabular-nums ${ev.signals.chi_signal ? 'text-red-400' : 'text-slate-dim/40'}`}>
                              {ev.signals.chi_square.toFixed(1)}
                            </td>
                            <td className="text-center px-2 py-1.5">
                              {ev.signals.any_signal
                                ? <span className="inline-block h-2.5 w-2.5 bg-red-500 animate-pulse" />
                                : <span className="inline-block h-2.5 w-2.5 bg-white/[0.08]" />
                              }
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Serious signals callout */}
                {dossier.faers.serious_signals.length > 0 && (
                  <div className="border border-red-500/30 bg-red-500/5 p-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-red-400/60 mb-2">
                      <AlertTriangle className="inline h-3 w-3 mr-1" />
                      Serious Signal Alerts — ICH E2A Criteria
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dossier.faers.serious_signals.map(s => (
                        <span key={s.event} className="px-2 py-1 border border-red-500/40 bg-red-500/10 text-[10px] font-mono text-red-300">
                          {s.event} (PRR {s.signals.prr.toFixed(1)})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>

          {/* Guidelines Section */}
          <CollapsibleSection
            id="guidelines"
            icon={BookOpen}
            title="Regulatory Cross-Reference"
            subtitle={`${dossier.guidelines?.hits.length ?? 0} relevant guidelines`}
            expanded={expandedSections.has('guidelines')}
            onToggle={() => toggleSection('guidelines')}
          >
            {dossier.guidelines && dossier.guidelines.hits.length > 0 ? (
              <div className="space-y-2">
                {dossier.guidelines.hits.map(g => (
                  <div key={g.id} className="flex items-start gap-3 p-3 border border-white/[0.06] bg-black/20">
                    <Scale className="h-4 w-4 text-blue-400/60 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-white font-mono font-bold">{g.title}</p>
                      <p className="text-[10px] text-slate-dim/40 font-mono mt-0.5">{g.source} — {g.id}</p>
                    </div>
                    <div className="shrink-0">
                      <div className="h-1.5 w-16 bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full bg-blue-400/60"
                          style={{ width: `${Math.min(g.relevance * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] font-mono text-slate-dim/30 py-4 text-center">
                No matching guidelines found — try a different drug name or generic name
              </p>
            )}
          </CollapsibleSection>

          {/* Competitive Section */}
          <CollapsibleSection
            id="competitors"
            icon={Shield}
            title="Competitive Safety Landscape"
            subtitle={dossier.competitors ? `${dossier.competitors.drugs.length} class comparators` : 'No class data'}
            expanded={expandedSections.has('competitors')}
            onToggle={() => toggleSection('competitors')}
          >
            {dossier.competitors && dossier.competitors.drugs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-white/[0.04]">
                      <th className="text-left px-3 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">Drug</th>
                      <th className="text-right px-3 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">FAERS Reports</th>
                      <th className="text-right px-3 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">Signals</th>
                      <th className="text-left px-3 py-2 text-[9px] uppercase tracking-widest text-slate-dim/50">Top Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Index drug first */}
                    <tr className="border-t border-gold/30 bg-gold/5">
                      <td className="px-3 py-2 text-gold font-bold">
                        {dossier.drug} <span className="text-[8px] text-gold/40">(index)</span>
                      </td>
                      <td className="text-right px-3 py-2 text-gold tabular-nums">
                        {dossier.faers?.total_reports.toLocaleString() ?? '—'}
                      </td>
                      <td className={`text-right px-3 py-2 font-bold tabular-nums ${
                        (dossier.faers?.signal_count ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {dossier.faers?.signal_count ?? 0}
                      </td>
                      <td className="px-3 py-2 text-gold/60">
                        {dossier.faers?.events.filter(e => e.signals.any_signal).sort((a, b) => b.signals.prr - a.signals.prr)[0]?.event ?? '—'}
                      </td>
                    </tr>
                    {/* Competitors */}
                    {dossier.competitors.drugs
                      .sort((a, b) => b.signal_count - a.signal_count)
                      .map(comp => (
                        <tr key={comp.name} className="border-t border-white/[0.06]">
                          <td className="px-3 py-2 text-white/80">{comp.name}</td>
                          <td className="text-right px-3 py-2 text-slate-dim/60 tabular-nums">
                            {comp.total_reports.toLocaleString()}
                          </td>
                          <td className={`text-right px-3 py-2 font-bold tabular-nums ${
                            comp.signal_count > 0 ? 'text-red-400' : 'text-slate-dim/40'
                          }`}>
                            {comp.signal_count}
                          </td>
                          <td className="px-3 py-2 text-slate-dim/50">{comp.top_signal ?? '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[10px] font-mono text-slate-dim/30 py-4 text-center">
                No therapeutic class mapping available for this drug — competitive analysis requires class data
              </p>
            )}
          </CollapsibleSection>
        </div>
      )}

      {/* Empty state */}
      {dossier.status === 'idle' && (
        <div className="border border-white/[0.12] bg-white/[0.04] p-12 text-center">
          <FileText className="w-8 h-8 text-slate-dim/15 mx-auto mb-4" />
          <p className="text-slate-dim/40 text-sm font-mono">
            Enter a drug name to generate a comprehensive safety intelligence dossier
          </p>
          <p className="text-[9px] font-mono text-slate-dim/20 mt-2">
            Aggregates FAERS signals, regulatory guidelines, and competitive landscape
          </p>
        </div>
      )}
    </div>
  );
}

// ── Collapsible Section ──────────────────────────────────────────────────────

function CollapsibleSection({
  id: _id,
  icon: Icon,
  title,
  subtitle,
  expanded,
  onToggle,
  alertCount,
  children,
}: {
  id: string;
  icon: typeof Activity;
  title: string;
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
  alertCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/[0.12] bg-white/[0.06]">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-cyan/40" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-dim/30" />
        )}
        <Icon className="h-4 w-4 text-cyan/60" />
        <span className="text-xs font-bold text-white font-mono uppercase tracking-widest">{title}</span>
        <span className="text-[10px] text-slate-dim/40 font-mono">{subtitle}</span>
        <div className="flex-1" />
        {alertCount !== undefined && alertCount > 0 && (
          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-mono font-bold">
            {alertCount} SIGNAL{alertCount !== 1 ? 'S' : ''}
          </span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-white/[0.08] p-4">
          {children}
        </div>
      )}
    </div>
  );
}
