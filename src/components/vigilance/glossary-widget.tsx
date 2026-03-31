'use client';

import { useState, useMemo } from 'react';
import { BookOpen, X, Search } from 'lucide-react';

interface GlossaryEntry {
  term: string;
  pv: string;
  av: string;
  ap: string;
}

const GLOSSARY: GlossaryEntry[] = [
  { term: 'Signal', pv: 'Adverse event report', av: 'Model output anomaly', ap: 'Service metric anomaly' },
  { term: 'Case', pv: 'ICSR', av: 'AI incident report', ap: 'Incident ticket' },
  { term: 'Causality', pv: 'Drug-event relationship', av: 'Model-harm attribution', ap: 'Root cause analysis' },
  { term: 'Reporter', pv: 'Healthcare professional', av: 'AI operator', ap: 'SRE engineer' },
  { term: 'Seriousness', pv: 'Life-threatening criteria', av: 'Harm severity score', ap: 'Service impact level' },
  { term: 'Expectedness', pv: 'SmPC listed ADR', av: 'Known model limitation', ap: 'Expected degradation' },
  { term: 'Disproportionality', pv: 'PRR/ROR/EBGM', av: 'Bias ratio', ap: 'Error rate ratio' },
  { term: 'Benefit-Risk', pv: 'QBRI score', av: 'Utility-harm tradeoff', ap: 'Availability-cost tradeoff' },
  { term: 'Safety Manifold', pv: 'Drug safety profile', av: 'Model safety envelope', ap: 'Service reliability boundary' },
  { term: 'Surveillance', pv: 'PBRER/PSUR', av: 'Continuous monitoring', ap: 'Observability stack' },
  { term: 'Threshold', pv: 'Signal detection threshold', av: 'Harm boundary', ap: 'SLA boundary' },
  { term: 'Escalation', pv: 'SUSAR reporting', av: 'Critical harm alert', ap: 'P1 incident' },
  { term: 'Regulatory', pv: 'EMA/FDA/ICH', av: 'EU AI Act/NIST', ap: 'SOC2/ISO27001' },
];

export function GlossaryWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return GLOSSARY;
    const q = query.toLowerCase();
    return GLOSSARY.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.pv.toLowerCase().includes(q) ||
        e.av.toLowerCase().includes(q) ||
        e.ap.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center border border-cyan/30 bg-nex-deep/90 text-cyan/70 transition-all hover:border-cyan/60 hover:text-cyan hover:shadow-[0_0_20px_rgba(0,174,239,0.1)]"
        aria-label="Open vigilance glossary"
      >
        <BookOpen className="h-4.5 w-4.5" />
      </button>

      {/* Panel overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className="relative z-10 flex max-h-[80vh] w-[380px] flex-col border border-white/10 bg-nex-deep/95 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <h3 className="text-golden-xs font-mono uppercase tracking-widest text-white/80">
                Vigilance Glossary
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-dim/40 hover:text-white/70 transition-colors"
                aria-label="Close glossary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative border-b border-white/[0.06] px-4 py-2">
              <Search className="absolute left-6 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-dim/30" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search terms..."
                className="w-full bg-transparent pl-6 pr-2 py-1 text-xs font-mono text-white/80 placeholder:text-slate-dim/30 outline-none"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-nex-deep/95">
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-3 py-2 text-left font-mono uppercase tracking-wider text-cyan/60">Term</th>
                    <th className="px-2 py-2 text-left font-mono uppercase tracking-wider text-red-400/60">PV</th>
                    <th className="px-2 py-2 text-left font-mono uppercase tracking-wider text-violet-400/60">AV</th>
                    <th className="px-2 py-2 text-left font-mono uppercase tracking-wider text-amber-400/60">AP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry.term} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="px-3 py-2 font-mono font-semibold text-white/70">{entry.term}</td>
                      <td className="px-2 py-2 text-slate-dim/60">{entry.pv}</td>
                      <td className="px-2 py-2 text-slate-dim/60">{entry.av}</td>
                      <td className="px-2 py-2 text-slate-dim/60">{entry.ap}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-dim/30 font-mono">
                        No matching terms
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
