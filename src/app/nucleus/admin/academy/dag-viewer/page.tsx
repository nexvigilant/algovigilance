import type { Metadata } from 'next';
import { Network } from 'lucide-react';
import { DagCanvas } from './components/dag-canvas';
import { TOV_SAMPLE_PATHWAY } from './sample-data';
import { integrationGap } from '@/lib/integration-signals';

export const metadata: Metadata = {
  title: 'ALO DAG Viewer | Academy Admin',
  description: 'Visualize atomized learning pathway dependency graphs',
};

// ─── Legend ───────────────────────────────────────────────────────────────────

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2.5 w-2.5 rounded-sm border ${className}`} />
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

function EdgeLegend({
  stroke,
  dash,
  label,
}: {
  stroke: string;
  dash?: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="24" height="10">
        <line
          x1="2"
          y1="5"
          x2="22"
          y2="5"
          stroke={stroke}
          strokeWidth="1.5"
          strokeDasharray={dash}
        />
      </svg>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DagViewerPage() {
  const pathway = integrationGap(
    TOV_SAMPLE_PATHWAY,
    { page: '/nucleus/admin/academy/dag-viewer', detail: 'Real pathway dependency data' }
  );

  const { alos, edges, title } = pathway;

  const counts = alos.reduce<Record<string, number>>(
    (acc, a) => ({ ...acc, [a.alo_type]: (acc[a.alo_type] ?? 0) + 1 }),
    {},
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-nex-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <Network className="h-5 w-5 text-gold" />
          <div>
            <h1 className="text-lg font-bold text-gold">ALO DAG Viewer</h1>
            <p className="text-xs text-slate-dim">
              {title} &mdash; {alos.length} nodes · {edges.length} edges
            </p>
          </div>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-medium text-amber-400">
            {counts['hook'] ?? 0} hooks
          </span>
          <span className="text-[11px] font-medium text-blue-400">
            {counts['concept'] ?? 0} concepts
          </span>
          <span className="text-[11px] font-medium text-emerald-400">
            {counts['activity'] ?? 0} activities
          </span>
          <span className="text-[11px] font-medium text-purple-400">
            {counts['reflection'] ?? 0} reflections
          </span>
        </div>
      </div>

      {/* ── Legend bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-slate-800/60 bg-slate-900/40 px-6 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          Nodes
        </span>
        <LegendDot className="border-amber-500/50 bg-amber-950/30" label="Hook" />
        <LegendDot className="border-blue-500/50 bg-blue-950/30" label="Concept" />
        <LegendDot className="border-emerald-500/50 bg-emerald-950/30" label="Activity" />
        <LegendDot className="border-purple-500/50 bg-purple-950/30" label="Reflection" />

        <span className="ml-4 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          Edges
        </span>
        <EdgeLegend stroke="#64748b" label="Prereq" />
        <EdgeLegend stroke="#60a5fa" dash="6 3" label="Extends" />
        <EdgeLegend stroke="#fbbf24" dash="2 3" label="Assesses" />
        <EdgeLegend stroke="#34d399" label="Strengthens" />
        <EdgeLegend stroke="#c084fc" dash="5 2" label="Coreq" />
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <DagCanvas pathway={pathway} />
      </div>
    </div>
  );
}

