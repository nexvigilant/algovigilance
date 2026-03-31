"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Building2, Search, Filter } from "lucide-react";
import { PHARMA_COMPANIES, type PharmaCompany } from "./lib/company-registry";

const COLORS: Record<string, string> = {
  pfizer: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  novartis: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
  roche: "bg-red-500/10 border-red-500/30 text-red-400",
  jnj: "bg-red-600/10 border-red-600/30 text-red-300",
  merck: "bg-teal-500/10 border-teal-500/30 text-teal-400",
  astrazeneca: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  gsk: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  sanofi: "bg-violet-500/10 border-violet-500/30 text-violet-400",
  abbvie: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
  lilly: "bg-red-400/10 border-red-400/30 text-red-300",
  bms: "bg-pink-500/10 border-pink-500/30 text-pink-400",
  novonordisk: "bg-sky-500/10 border-sky-500/30 text-sky-400",
  amgen: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  gilead: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  bayer: "bg-lime-500/10 border-lime-500/30 text-lime-400",
  takeda: "bg-rose-500/10 border-rose-500/30 text-rose-400",
};

// Collect all unique therapeutic areas
const ALL_AREAS = [
  ...new Set(
    Object.values(PHARMA_COMPANIES).flatMap((c) => c.therapeuticAreas),
  ),
].sort();

export default function PharmaIndexPage() {
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return Object.entries(PHARMA_COMPANIES).filter(
      ([, company]: [string, PharmaCompany]) => {
        const matchesSearch =
          !q ||
          company.name.toLowerCase().includes(q) ||
          company.description.toLowerCase().includes(q) ||
          company.therapeuticAreas.some((a) => a.toLowerCase().includes(q));

        const matchesArea =
          !selectedArea || company.therapeuticAreas.includes(selectedArea);

        return matchesSearch && matchesArea;
      },
    );
  }, [search, selectedArea]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Company Intelligence / Pharma Portfolio &amp; Safety
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Pharma Company Intelligence
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-xl">
          Explore portfolio, clinical pipeline, and safety dashboards for
          leading pharmaceutical companies. Data sourced from public regulatory
          filings, FAERS, and clinical trial registries.
        </p>
      </header>

      {/* Search + Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name or therapeutic area..."
            className="w-full rounded-md border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan/40"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <button
            type="button"
            onClick={() => setSelectedArea(null)}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
              !selectedArea
                ? "border-cyan/40 bg-cyan/10 text-cyan"
                : "border-white/10 text-slate-500 hover:border-white/20"
            }`}
          >
            All ({Object.keys(PHARMA_COMPANIES).length})
          </button>
          {ALL_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() =>
                setSelectedArea(selectedArea === area ? null : area)
              }
              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                selectedArea === area
                  ? "border-cyan/40 bg-cyan/10 text-cyan"
                  : "border-white/10 text-slate-500 hover:border-white/20"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Step description — For AlgoVigilances pattern */}
      <div className="border border-white/[0.08] bg-white/[0.02] p-3 sm:p-4 mb-8 grid grid-cols-2 sm:flex sm:gap-4 gap-3">
        {[
          {
            step: "1",
            label: "Pick a company",
            detail: `Choose from ${filtered.length} pharmaceutical compan${filtered.length === 1 ? "y" : "ies"} below`,
          },
          {
            step: "2",
            label: "See their products",
            detail: "Approved drugs, routes of administration, and drug class",
          },
          {
            step: "3",
            label: "Review the pipeline",
            detail: "Active clinical trials by phase and therapeutic area",
          },
          {
            step: "4",
            label: "Check the safety record",
            detail: "Top adverse reactions and FAERS report counts",
          },
        ].map(({ step, label, detail }) => (
          <div key={step} className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-6 h-6 border border-cyan/30 bg-cyan/10 flex items-center justify-center text-[10px] font-mono font-bold text-cyan">
              {step}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-white">{label}</p>
              <p className="text-[10px] text-slate-dim/50 mt-0.5">{detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Company grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(([key, company]) => (
          <Link
            key={key}
            href={`/nucleus/vigilance/pharma/${key}`}
            className="group block border border-white/[0.10] bg-white/[0.03] hover:border-white/[0.20] hover:bg-white/[0.06] transition-all"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-10 h-10 border flex items-center justify-center text-sm font-bold font-mono ${COLORS[key] || "bg-white/5 border-white/10 text-slate-400"}`}
                >
                  {company.name.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-white leading-tight group-hover:text-white/90 truncate">
                    {company.name}
                  </h2>
                  <p className="text-[10px] text-slate-dim/50 mt-1 line-clamp-2 leading-relaxed">
                    {company.description}
                  </p>
                </div>
              </div>

              {/* Therapeutic area tags */}
              <div className="mt-2 flex flex-wrap gap-1">
                {company.therapeuticAreas.slice(0, 3).map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-white/5 bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-slate-500"
                  >
                    {area}
                  </span>
                ))}
                {company.therapeuticAreas.length > 3 && (
                  <span className="text-[9px] text-slate-600">
                    +{company.therapeuticAreas.length - 3}
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/30">
                  Portfolio &middot; Pipeline &middot; Safety
                </span>
                <span className="text-[9px] font-mono text-cyan/40 group-hover:text-cyan/70 transition-colors">
                  View &rarr;
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          No companies match your search. Try a different term or clear the
          filter.
        </div>
      )}

      {/* Footer note */}
      <div className="mt-8 border border-white/[0.06] bg-white/[0.01] px-4 py-3 flex items-center gap-2">
        <Building2 className="h-3 w-3 text-slate-dim/30 flex-shrink-0" />
        <p className="text-[10px] font-mono text-slate-dim/40">
          Data sourced from company public disclosures, ClinicalTrials.gov, FDA
          FAERS, and DailyMed. Not a substitute for official regulatory
          submissions.
        </p>
      </div>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Pharma competitive intelligence from 13 company configs. AI agents query pipelines and safety profiles at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass Signal Lab
        </a>
      </div>
    </div>
  );
}
