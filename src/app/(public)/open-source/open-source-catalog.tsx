"use client";

import { useState, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Package,
  ExternalLink,
  GitBranch,
  Search,
  Layers,
  Code2,
  Scale,
  BookOpen,
} from "lucide-react";
import {
  getAllCrates,
  getCratesByLayer,
  searchCrates,
  getManifestMeta,
} from "@/lib/crate-registry";
import { LAYER_CONFIG } from "@/types/crate-registry";
import type { CrateLayer, CrateRecord } from "@/types/crate-registry";

const LAYERS: CrateLayer[] = [
  "foundation",
  "domain",
  "orchestration",
  "service",
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function CrateCard({ crate }: { crate: CrateRecord }) {
  const layer = LAYER_CONFIG[crate.layer];
  const cratesIoUrl = `https://crates.io/crates/${crate.name}`;
  const docsRsUrl = `https://docs.rs/${crate.name}`;

  return (
    <div className="group relative rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-cyan/20 hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 shrink-0 text-cyan" />
            <h3 className="truncate font-mono text-sm font-medium text-white">
              {crate.name}
            </h3>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-slate-400">
            {crate.description}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${layer.bgClass} ${layer.textClass} ${layer.borderClass}`}
        >
          {layer.label}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
        <span className="font-mono">v{crate.version}</span>
        {crate.fanIn > 0 && (
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {crate.fanIn} dependents
          </span>
        )}
        {crate.loc > 0 && (
          <span className="flex items-center gap-1">
            <Code2 className="h-3 w-3" />
            {formatNumber(crate.loc)} loc
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <a
          href={cratesIoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[11px] text-slate-400 transition-colors hover:border-cyan/30 hover:text-cyan"
        >
          crates.io <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={docsRsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[11px] text-slate-400 transition-colors hover:border-emerald-500/30 hover:text-emerald-400"
        >
          docs.rs <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function OpenSourceCatalog() {
  const [query, setQuery] = useState("");
  const [activeLayer, setActiveLayer] = useState<CrateLayer | "all">("all");
  const meta = getManifestMeta();

  const allCrates = useMemo(() => getAllCrates(), []);

  const totalLoc = useMemo(
    () => allCrates.reduce((sum, c) => sum + c.loc, 0),
    [allCrates],
  );

  const crates = useMemo(() => {
    let results: CrateRecord[];
    if (query.length > 1) {
      results = searchCrates(query);
    } else if (activeLayer !== "all") {
      results = getCratesByLayer(activeLayer);
    } else {
      results = allCrates;
    }
    return results.sort((a, b) => b.fanIn - a.fanIn);
  }, [query, activeLayer, allCrates]);

  const layerCounts = useMemo(() => {
    const counts = { all: 0, foundation: 0, domain: 0, orchestration: 0, service: 0 };
    for (const c of allCrates) {
      counts.all++;
      counts[c.layer]++;
    }
    return counts;
  }, [allCrates]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan">
          <Layers className="h-4 w-4" />
          Open Source
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          NexCore
        </h1>
        <p className="mt-1 text-sm font-medium text-cyan/80">
          Your Open-Source Pharmacovigilant
        </p>
        <p className="mt-2 max-w-2xl text-base text-slate-400">
          {meta.crateCount} Rust crates for signal detection, causality
          assessment, benefit-risk analysis, and intelligent safety automation.
          Built for patient safety. Open for everyone.
        </p>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Crates"
            value={meta.crateCount.toString()}
            icon={Package}
          />
          <StatCard
            label="Lines of Code"
            value={formatNumber(totalLoc)}
            icon={Code2}
          />
          <StatCard label="License" value="MIT / Apache-2.0" icon={Scale} />
          <StatCard
            label="Documentation"
            value="docs.rs"
            icon={BookOpen}
          />
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://github.com/nexvigilant/nexcore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-cyan/30 hover:bg-white/10"
          >
            <GitBranch className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://crates.io/teams/github:nexvigilant:owners"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-orange-500/30 hover:bg-white/10"
          >
            <Package className="h-4 w-4" />
            crates.io
          </a>
          <a
            href="https://docs.rs/releases/search?query=nexcore"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-emerald-500/30 hover:bg-white/10"
          >
            <BookOpen className="h-4 w-4" />
            Documentation
          </a>
        </div>
      </div>

      {/* Search + Layer Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crates by name, description, or tag..."
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan/40"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveLayer("all")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeLayer === "all"
                ? "bg-cyan/10 text-cyan border border-cyan/30"
                : "text-slate-400 border border-white/5 hover:border-white/10"
            }`}
          >
            All ({layerCounts.all})
          </button>
          {LAYERS.map((layer) => {
            const config = LAYER_CONFIG[layer];
            return (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeLayer === layer
                    ? `${config.bgClass} ${config.textClass} border ${config.borderClass}`
                    : "text-slate-400 border border-white/5 hover:border-white/10"
                }`}
              >
                {config.label} ({layerCounts[layer]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs text-slate-500">
        {crates.length} crate{crates.length !== 1 ? "s" : ""} — sorted by
        dependents
      </p>

      {/* Crate Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {crates.map((crate) => (
          <CrateCard key={crate.name} crate={crate} />
        ))}
      </div>

      {crates.length === 0 && (
        <div className="py-12 text-center">
          <Package className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm text-slate-500">
            {query
              ? <>No crates match &quot;{query}&quot;</>
              : activeLayer !== "all"
                ? <>No crates in the {LAYER_CONFIG[activeLayer].label} layer</>
                : <>No crates found</>}
          </p>
          <button
            onClick={() => {
              setQuery("");
              setActiveLayer("all");
            }}
            className="mt-2 text-xs text-cyan hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
