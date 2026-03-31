"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Loader2,
  BookOpen,
  ExternalLink,
  FileText,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Guideline {
  id: string;
  title: string;
  category: string;
  description?: string;
  source?: string;
  url?: string;
  sections?: string[];
}

interface SearchResult {
  results: Guideline[];
  total: number;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "ich", label: "ICH" },
  { id: "cioms", label: "CIOMS" },
  { id: "ema", label: "EMA" },
  { id: "fda", label: "FDA" },
  { id: "who", label: "WHO" },
];

const QUICK_SEARCHES = [
  "signal detection",
  "periodic safety",
  "expedited reporting",
  "benefit-risk",
  "causality assessment",
  "PSUR",
  "PBRER",
  "individual case safety",
  "risk management",
  "GVP",
];

export function GuidelinesSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState<Guideline[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Guideline | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = searchQuery || query;
      if (!q.trim()) return;

      setLoading(true);
      setError(null);
      setSelected(null);

      try {
        const params = new URLSearchParams({ query: q });
        if (category !== "all") params.set("category", category);

        const res = await fetch(`/api/nexcore/guidelines?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: SearchResult = await res.json();
        setResults(data.results || []);
        setTotal(data.total || data.results?.length || 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [query, category],
  );

  const categoryColor = (cat: string): string => {
    switch (cat.toLowerCase()) {
      case "ich":
        return "text-cyan border-cyan/30 bg-cyan/5";
      case "cioms":
        return "text-gold border-gold/30 bg-gold/5";
      case "ema":
        return "text-blue-400 border-blue-500/30 bg-blue-500/5";
      case "fda":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
      case "who":
        return "text-purple-400 border-purple-500/30 bg-purple-500/5";
      default:
        return "text-slate-dim/60 border-slate-dim/20 bg-slate-dim/5";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Regulatory Intelligence / Guidelines Database
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Regulatory Guidelines
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Search ICH, CIOMS, EMA, FDA, and WHO pharmacovigilance guidelines —
          powered by NexCore
        </p>
      </header>

      {/* Search bar */}
      <div className="border border-white/[0.12] bg-white/[0.06] mb-6">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
          <Search className="h-3.5 w-3.5 text-cyan/60" />
          <span className="intel-label">Search Guidelines</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
          {total > 0 && (
            <span className="text-[8px] font-mono text-slate-dim/30">
              {total} results
            </span>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g., signal detection, expedited reporting, PBRER..."
              className="flex-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/30 focus:border-cyan/40 focus:outline-none"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-all ${
                  category === cat.id
                    ? "border-cyan/40 bg-cyan/10 text-cyan"
                    : "border-white/[0.12] text-slate-dim/40 hover:border-white/[0.2]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick searches */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-2">
              Quick Search
            </p>
            <div className="flex flex-wrap gap-1">
              {QUICK_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    handleSearch(term);
                  }}
                  className="px-2 py-1 text-[9px] font-mono border border-white/[0.08] text-slate-dim/50 hover:border-gold/30 hover:text-gold/60 transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/5 p-3 mb-4">
          <p className="text-red-400/80 text-xs font-mono">{error}</p>
        </div>
      )}

      {/* Results + Detail split */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Results list */}
        <div className="lg:col-span-2 border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <FileText className="h-3.5 w-3.5 text-gold/60" />
            <span className="intel-label">Results</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {results.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {results.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelected(g)}
                    className={`w-full text-left px-4 py-3 transition-all ${
                      selected?.id === g.id
                        ? "bg-cyan/5 border-l-2 border-l-cyan"
                        : "hover:bg-white/[0.04] border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-white truncate">
                          {g.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest border ${categoryColor(g.category)}`}
                          >
                            {g.category}
                          </span>
                          <span className="text-[8px] font-mono text-slate-dim/30">
                            {g.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : !loading && query ? (
              <div className="py-12 text-center">
                <Search className="h-6 w-6 text-slate-dim/15 mx-auto mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
                  No guidelines found
                </p>
              </div>
            ) : !loading ? (
              <div className="py-12 text-center">
                <BookOpen className="h-6 w-6 text-slate-dim/15 mx-auto mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
                  Search to browse guidelines
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3 border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <BookOpen className="h-3.5 w-3.5 text-cyan/60" />
            <span className="intel-label">Guideline Detail</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="p-4">
            {selected ? (
              <div className="space-y-5">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border ${categoryColor(selected.category)}`}
                    >
                      {selected.category}
                    </span>
                    <span className="text-[9px] font-mono text-slate-dim/30">
                      {selected.id}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {selected.title}
                  </h2>
                  {selected.source && (
                    <p className="text-[10px] font-mono text-slate-dim/40 mt-1">
                      Source: {selected.source}
                    </p>
                  )}
                </div>

                {/* Description */}
                {selected.description && (
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-2">
                      Description
                    </p>
                    <p className="text-sm text-slate-300/80 leading-relaxed">
                      {selected.description}
                    </p>
                  </div>
                )}

                {/* Sections */}
                {selected.sections && selected.sections.length > 0 && (
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-2">
                      Key Sections
                    </p>
                    <div className="space-y-1">
                      {selected.sections.map((section, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 py-1.5 px-3 border border-white/[0.06] bg-black/20"
                        >
                          <Tag className="h-3 w-3 text-cyan/30 mt-0.5 shrink-0" />
                          <span className="text-xs text-slate-300/80 font-mono">
                            {section}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* URL link */}
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-cyan/30 bg-cyan/5 text-cyan text-xs font-mono hover:bg-cyan/10 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Full Document
                  </a>
                )}
              </div>
            ) : (
              <div className="py-16 text-center">
                <BookOpen className="h-8 w-8 text-slate-dim/15 mx-auto mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
                  Select a guideline to view details
                </p>
                <p className="text-[9px] font-mono text-slate-dim/20 mt-2 max-w-sm mx-auto">
                  Search across ICH E2A-E2F, CIOMS I-X, EMA GVP Modules, FDA
                  guidance documents, and WHO standards
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
