"use client";

import { useState, useCallback } from "react";
import { Search, Pill, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classifyPrrStrength } from "@/lib/pv-compute";

interface DrugEvent {
  event: string;
  count: number;
  prr?: number;
  ror?: number;
  signal?: boolean;
}

interface FaersResult {
  drug: string;
  total_reports: number;
  events: DrugEvent[];
  signals_detected: number;
}

const PRR_STRENGTH_COLOR: Record<string, string> = {
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
  signal: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  subthreshold: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

const QUICK_DRUGS = [
  "Aspirin",
  "Metformin",
  "Atorvastatin",
  "Lisinopril",
  "Omeprazole",
  "Warfarin",
  "Methotrexate",
  "Infliximab",
];

export function FaersDrugSearch() {
  const [drug, setDrug] = useState("");
  const [limit, setLimit] = useState("10");
  const [result, setResult] = useState<FaersResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (searchDrug?: string) => {
      const target = searchDrug || drug;
      if (!target.trim()) return;

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/nexcore/faers?drug=${encodeURIComponent(target)}&limit=${limit}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setResult(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [drug, limit],
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            FAERS Intelligence / Drug-Event Profiles
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Drug Safety
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Search FDA Adverse Event Reporting System for drug-event associations
        </p>
      </header>

      {/* Search panel */}
      <div className="border border-white/[0.12] bg-white/[0.06] mb-6">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
          <Pill className="h-3.5 w-3.5 text-gold/60" />
          <span className="intel-label">Drug Query</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-dim/30" />
              <input
                type="text"
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter drug name..."
                className="w-full bg-black/20 border border-white/[0.08] pl-9 pr-3 py-2.5 text-sm font-mono text-white placeholder:text-slate-dim/30 focus:border-cyan/40 focus:outline-none"
              />
            </div>
            <div className="relative w-20">
              <span className="absolute top-1 left-2 text-[8px] font-mono text-cyan/30">
                limit
              </span>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full bg-black/20 border border-white/[0.08] px-3 pt-4 pb-2 text-sm font-mono text-white focus:border-cyan/40 focus:outline-none"
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={loading || !drug.trim()}
              className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Quick select */}
          <div className="flex flex-wrap gap-2">
            {QUICK_DRUGS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDrug(d);
                  handleSearch(d);
                }}
                className="px-3 py-1.5 border border-white/[0.08] bg-black/20 text-[10px] font-mono text-slate-dim/50 hover:border-cyan/30 hover:text-cyan/60 transition-all"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/5 p-3 mb-4">
          <p className="text-red-400/80 text-xs font-mono">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <Search className="h-3.5 w-3.5 text-cyan/60" />
            <span className="intel-label">Results</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 p-4 border-b border-white/[0.06]">
            <div className="text-center">
              <p className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40">
                Drug
              </p>
              <p className="text-sm font-bold font-mono text-white mt-1">
                {result.drug}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40">
                Total Reports
              </p>
              <p className="text-sm font-bold font-mono text-white mt-1">
                {result.total_reports?.toLocaleString() ?? "—"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40">
                Signals
              </p>
              <p
                className={`text-sm font-bold font-mono mt-1 ${(result.signals_detected ?? 0) > 0 ? "text-red-400" : "text-emerald-400"}`}
              >
                {result.signals_detected ?? 0}
              </p>
            </div>
          </div>

          {/* Events table */}
          <div className="p-4">
            {result.events && result.events.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 border-b border-white/[0.06]">
                    <th className="text-left py-2">Event</th>
                    <th className="text-right py-2">Reports</th>
                    <th className="text-right py-2">PRR</th>
                    <th className="text-right py-2">Strength</th>
                    <th className="text-right py-2">ROR</th>
                    <th className="text-right py-2">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {result.events.map((ev, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      <td className="py-2 text-xs text-slate-300/80 font-mono">
                        {ev.event}
                      </td>
                      <td className="py-2 text-xs text-white font-mono text-right tabular-nums">
                        {ev.count}
                      </td>
                      <td className="py-2 text-xs text-white font-mono text-right tabular-nums">
                        {ev.prr?.toFixed(2) ?? "—"}
                      </td>
                      <td className="py-2 text-right">
                        {ev.prr != null ? (
                          (() => {
                            const strength = classifyPrrStrength(ev.prr);
                            return (
                              <span
                                className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border ${PRR_STRENGTH_COLOR[strength.strength] ?? "text-white border-white/[0.12]"}`}
                              >
                                {strength.strength}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-[9px] font-mono text-slate-dim/30">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-xs text-white font-mono text-right tabular-nums">
                        {ev.ror?.toFixed(2) ?? "—"}
                      </td>
                      <td className="py-2 text-right">
                        {ev.signal ? (
                          <span className="text-[9px] font-mono font-bold text-red-400 border border-red-500/30 bg-red-500/10 px-2 py-0.5">
                            SIGNAL
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-dim/30">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-[10px] font-mono text-slate-dim/30 py-8">
                No events returned
              </p>
            )}
          </div>
        </div>
      )}

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Drug safety data from openFDA FAERS. Run the same queries at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass Signal Lab
        </a>
      </div>
    </div>
  );
}
