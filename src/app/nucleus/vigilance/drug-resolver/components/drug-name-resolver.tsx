"use client";

import type { SignalResult } from "@/lib/pv-compute/signal-detection";
import { useState, useCallback } from "react";
import { Pill, Search, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResolvedDrug {
  input: string;
  generic_name: string;
  brand_names: string[];
  match_confidence: number;
  source: string;
}

const EXAMPLE_PAIRS = [
  { trade: "Tylenol", inn: "Acetaminophen" },
  { trade: "Advil", inn: "Ibuprofen" },
  { trade: "Lipitor", inn: "Atorvastatin" },
  { trade: "Humira", inn: "Adalimumab" },
  { trade: "Remicade", inn: "Infliximab" },
  { trade: "Coumadin", inn: "Warfarin" },
  { trade: "Glucophage", inn: "Metformin" },
  { trade: "Prilosec", inn: "Omeprazole" },
];

export function DrugNameResolver() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<ResolvedDrug[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);

  const handleResolve = useCallback(
    async (drugName?: string) => {
      const target = drugName || input;
      if (!target.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const names = batchMode
          ? target
              .split("\n")
              .map((n) => n.trim())
              .filter(Boolean)
          : [target.trim()];

        const resolved: ResolvedDrug[] = [];

        for (const name of names) {
          // Query FAERS to resolve drug names — it returns brand/generic pairs
          const res = await fetch(
            `/api/nexcore/faers?drug=${encodeURIComponent(name)}&limit=1`,
          );
          if (res.ok) {
            const data = await res.json();
            resolved.push({
              input: name,
              generic_name: data.drug || name,
              brand_names: data.brand_names || [],
              match_confidence: data.drug ? 0.95 : 0.5,
              source: "FAERS/openFDA",
            });
          } else {
            resolved.push({
              input: name,
              generic_name: name,
              brand_names: [],
              match_confidence: 0,
              source: "Not resolved",
            });
          }
        }

        setResults(resolved);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Resolution failed");
      } finally {
        setLoading(false);
      }
    },
    [input, batchMode],
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Drug Identification / WHO Drug Dictionary Analog
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Drug Name Resolver
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Resolve trade names to INN (International Nonproprietary Names) for
          consistent aggregation across reports
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Input */}
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <Pill className="h-3.5 w-3.5 text-gold/60" />
            <span className="intel-label">Drug Input</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
            <button
              onClick={() => setBatchMode(!batchMode)}
              className={`text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 border transition-all ${
                batchMode
                  ? "border-cyan/30 text-cyan bg-cyan/5"
                  : "border-white/[0.08] text-slate-dim/40"
              }`}
            >
              {batchMode ? "Batch" : "Single"}
            </button>
          </div>
          <div className="p-4 space-y-3">
            {batchMode ? (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="One drug per line:&#10;Tylenol&#10;Lipitor&#10;Humira"
                rows={6}
                className="w-full bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/30 focus:border-cyan/40 focus:outline-none resize-none"
              />
            ) : (
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResolve()}
                placeholder="e.g., Tylenol, Lipitor, Humira..."
                className="w-full bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/30 focus:border-cyan/40 focus:outline-none"
              />
            )}

            <Button
              onClick={() => handleResolve()}
              disabled={loading}
              className="w-full bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 mr-2" />
                  Resolve Names
                </>
              )}
            </Button>

            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-2">
                Quick Examples
              </p>
              <div className="flex flex-wrap gap-1">
                {EXAMPLE_PAIRS.map((p) => (
                  <button
                    key={p.trade}
                    onClick={() => {
                      setInput(p.trade);
                      setBatchMode(false);
                      handleResolve(p.trade);
                    }}
                    className="px-2 py-1 text-[9px] font-mono border border-white/[0.08] text-slate-dim/50 hover:border-gold/30 hover:text-gold/60 transition-all"
                  >
                    {p.trade}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400/60" />
            <span className="intel-label">Resolved Names</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="p-4">
            {error && (
              <div className="border border-red-500/30 bg-red-500/5 p-3 mb-4">
                <p className="text-red-400/80 text-xs font-mono">{error}</p>
              </div>
            )}

            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((r, i) => (
                  <div key={i} className="border border-white/[0.08] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-dim/50 font-mono">
                        {r.input}
                      </span>
                      <ArrowRight className="h-3 w-3 text-cyan/40" />
                      <span className="text-sm text-white font-mono font-bold">
                        {r.generic_name}
                      </span>
                    </div>
                    {r.brand_names.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {r.brand_names.slice(0, 5).map((bn) => (
                          <span
                            key={bn}
                            className="px-1.5 py-0.5 text-[8px] font-mono bg-gold/5 border border-gold/20 text-gold/60"
                          >
                            {bn}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[8px] font-mono uppercase tracking-widest ${
                          r.match_confidence >= 0.9
                            ? "text-emerald-400/60"
                            : r.match_confidence >= 0.5
                              ? "text-yellow-400/60"
                              : "text-red-400/60"
                        }`}
                      >
                        {(r.match_confidence * 100).toFixed(0)}% confidence
                      </span>
                      <span className="text-[8px] font-mono text-slate-dim/30">
                        {r.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Pill className="h-6 w-6 text-slate-dim/15 mx-auto mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
                  Enter a drug name to resolve
                </p>
                <p className="text-[9px] font-mono text-slate-dim/20 mt-2 max-w-xs mx-auto">
                  Maps trade names (Tylenol, Panadol) to active substance
                  (acetaminophen) for aggregation consistency
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Drug name resolution via RxNav (RxCUI, NDC, ingredients, interactions). AI agents resolve names at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass Signal Lab
        </a>
      </div>
    </div>
  );
}
