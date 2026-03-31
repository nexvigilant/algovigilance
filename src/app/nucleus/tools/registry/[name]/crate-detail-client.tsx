'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Box, GitBranch, GitMerge, Wrench, ExternalLink, ChevronDown, ChevronUp, FolderOpen, Users } from 'lucide-react';
import { getCrateByName, getToolsForCrate, buildDependencyGraph, getCratesByFamily } from '@/lib/crate-registry';
import { LayerBadge } from '@/components/registry/layer-badge';
import type { KellnrEnrichment } from '@/types/crate-registry';

const CrateDependencyGraph = dynamic(
  () => import('@/components/graphs/CrateDependencyGraph').then(m => ({ default: m.CrateDependencyGraph })),
  { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center text-slate-500 text-xs font-mono">Loading graph...</div> }
);

interface CrateDetailClientProps {
  name: string;
}

export function CrateDetailClient({ name }: CrateDetailClientProps) {
  const crate = getCrateByName(name);
  const [enrichment, setEnrichment] = useState<KellnrEnrichment | null>(null);
  const [showAllTools, setShowAllTools] = useState(false);
  const [showAllDeps, setShowAllDeps] = useState(false);
  const [showAllDependents, setShowAllDependents] = useState(false);

  // Attempt live Kellnr enrichment
  useEffect(() => {
    async function fetchEnrichment() {
      try {
        const res = await fetch('/api/nexcore/registry');
        if (!res.ok) return;
        const data = await res.json();
        const found = data.crates?.find((c: { name: string }) => c.name === name);
        if (found) {
          setEnrichment({
            total_downloads: found.total_downloads ?? 0,
            max_version: found.max_version ?? '',
            last_updated: found.last_updated ?? '',
            versions: [],
          });
        }
      } catch {
        // Kellnr offline — graceful degradation, manifest data is sufficient
      }
    }
    fetchEnrichment();
  }, [name]);

  if (!crate) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/nucleus/tools/registry" className="inline-flex items-center gap-1.5 text-xs text-slate-400/60 hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-3 w-3" /> Registry
        </Link>
        <div className="border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <Box className="h-8 w-8 text-amber-400/40 mx-auto mb-3" />
          <p className="text-sm font-bold text-amber-400">Crate not found: {name}</p>
          <p className="text-xs text-slate-400/40 mt-1 font-mono">
            Not in static manifest. Run <code>npx tsx scripts/generate-crate-manifest.ts</code> to regenerate.
          </p>
        </div>
      </div>
    );
  }

  const tools = getToolsForCrate(name);
  const graph = buildDependencyGraph(name, 2);
  const familyCrates = getCratesByFamily(crate.family).filter(c => c.name !== name);
  const version = enrichment?.max_version ?? crate.version;

  const INITIAL_SHOW = 12;
  const visibleTools = showAllTools ? tools : tools.slice(0, INITIAL_SHOW);
  const visibleDeps = showAllDeps ? crate.dependencies : crate.dependencies.slice(0, INITIAL_SHOW);
  const visibleDependents = showAllDependents ? crate.dependents : crate.dependents.slice(0, INITIAL_SHOW);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400/40 mb-6">
        <Link href="/nucleus/tools/registry" className="hover:text-white transition-colors">Registry</Link>
        <span>/</span>
        <span className="text-white">{crate.name}</span>
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <h1 className="text-2xl md:text-3xl font-extrabold font-headline text-white tracking-tight">{crate.name}</h1>
          <span className="text-xs text-slate-400/40 font-mono">v{version}</span>
          <LayerBadge layer={crate.layer} size="md" />
        </div>
        <p className="text-sm text-slate-400/60 max-w-2xl">{crate.description}</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="LOC" value={formatNumber(crate.loc)} icon={<Box className="h-3.5 w-3.5" />} />
        <StatCard label="Used By (fan-in)" value={String(crate.fanIn)} icon={<GitMerge className="h-3.5 w-3.5" />} />
        <StatCard label="Uses (fan-out)" value={String(crate.fanOut)} icon={<GitBranch className="h-3.5 w-3.5" />} />
        <StatCard label="MCP Tools" value={String(tools.length)} icon={<Wrench className="h-3.5 w-3.5" />} />
      </div>

      {/* MCP Tools Panel */}
      {tools.length > 0 && (
        <section className="mb-8">
          <SectionHeader title={`MCP Tools (${tools.length})`} />
          <div className="border border-white/[0.08] bg-black/20 p-4">
            <div className="flex flex-wrap gap-2">
              {visibleTools.map(tool => (
                <span
                  key={tool}
                  className="px-2.5 py-1 text-[10px] font-mono font-bold text-cyan-400/80 bg-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                >
                  {tool}
                </span>
              ))}
            </div>
            {tools.length > INITIAL_SHOW && (
              <button
                onClick={() => setShowAllTools(v => !v)}
                className="mt-3 flex items-center gap-1 text-[10px] font-mono text-slate-400/40 hover:text-white transition-colors"
              >
                {showAllTools ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showAllTools ? 'Show less' : `Show all ${tools.length}`}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Dependency Graph */}
      {graph.nodes.length > 1 && (
        <section className="mb-8">
          <SectionHeader title="Dependency Graph (2-degree neighborhood)" />
          <CrateDependencyGraph
            nodes={graph.nodes}
            edges={graph.edges}
            centerNode={name}
            className=""
          />
        </section>
      )}

      {/* Dependencies + Dependents side-by-side */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Dependencies */}
        <section>
          <SectionHeader title={`Dependencies (${crate.dependencies.length})`} />
          <div className="space-y-1.5">
            {visibleDeps.length > 0 ? (
              visibleDeps.map(dep => (
                <DepLink key={dep} name={dep} />
              ))
            ) : (
              <p className="text-[10px] font-mono text-slate-400/30 py-4 text-center">No workspace dependencies</p>
            )}
            {crate.dependencies.length > INITIAL_SHOW && (
              <ExpandButton
                expanded={showAllDeps}
                total={crate.dependencies.length}
                onToggle={() => setShowAllDeps(v => !v)}
              />
            )}
          </div>
        </section>

        {/* Dependents */}
        <section>
          <SectionHeader title={`Used By (${crate.dependents.length})`} />
          <div className="space-y-1.5">
            {visibleDependents.length > 0 ? (
              visibleDependents.map(dep => (
                <DepLink key={dep} name={dep} />
              ))
            ) : (
              <p className="text-[10px] font-mono text-slate-400/30 py-4 text-center">No workspace dependents (leaf crate)</p>
            )}
            {crate.dependents.length > INITIAL_SHOW && (
              <ExpandButton
                expanded={showAllDependents}
                total={crate.dependents.length}
                onToggle={() => setShowAllDependents(v => !v)}
              />
            )}
          </div>
        </section>
      </div>

      {/* Metadata Footer */}
      <footer className="border-t border-white/[0.06] pt-6 space-y-3">
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] font-mono text-slate-400/40">
          <span className="flex items-center gap-1.5">
            <FolderOpen className="h-3 w-3" />
            Source: {crate.path}/
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            Family: {crate.family}-* ({familyCrates.length} siblings)
          </span>
          {crate.tags.length > 0 && (
            <span>Tags: {crate.tags.join(', ')}</span>
          )}
        </div>
        {enrichment && enrichment.total_downloads > 0 && (
          <p className="text-[9px] font-mono text-slate-400/30">
            Kellnr: {enrichment.total_downloads} downloads | Last updated: {enrichment.last_updated}
          </p>
        )}
      </footer>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="flex items-center gap-2 text-slate-400/40 mb-2">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-widest font-mono">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-white font-mono tabular-nums">{value}</p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-[10px] font-bold text-slate-400/40 uppercase tracking-widest font-mono mb-3">{title}</h2>
  );
}

function DepLink({ name }: { name: string }) {
  const crate = getCrateByName(name);
  return (
    <Link
      href={`/nucleus/tools/registry/${encodeURIComponent(name)}`}
      className="flex items-center justify-between px-3 py-2 border border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all group"
    >
      <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">{name}</span>
      <div className="flex items-center gap-2">
        {crate && <LayerBadge layer={crate.layer} size="sm" />}
        <ExternalLink className="h-3 w-3 text-slate-400/20 group-hover:text-cyan-400/60 transition-colors" />
      </div>
    </Link>
  );
}

function ExpandButton({ expanded, total, onToggle }: { expanded: boolean; total: number; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-center gap-1 py-2 text-[10px] font-mono text-slate-400/40 hover:text-white transition-colors"
    >
      {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      {expanded ? 'Show less' : `Show all ${total}`}
    </button>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}
