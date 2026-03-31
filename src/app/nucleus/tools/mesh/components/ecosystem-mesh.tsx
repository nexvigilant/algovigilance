'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MeshNode {
  label: string;
  href: string;
  zone: string;
}

const NODES: MeshNode[] = [
  { label: 'Academy', href: '/nucleus/academy', zone: 'Enablement' },
  { label: 'Community', href: '/nucleus/community', zone: 'Enablement' },
  { label: 'Careers', href: '/nucleus/careers', zone: 'Enablement' },
  { label: 'Vigilance', href: '/nucleus/vigilance', zone: 'Safety' },
  { label: 'Regulatory', href: '/nucleus/regulatory', zone: 'Safety' },
  { label: 'Guardian', href: '/nucleus/guardian', zone: 'Safety' },
  { label: 'Insights', href: '/nucleus/insights', zone: 'Intelligence' },
  { label: 'Solutions', href: '/nucleus/solutions', zone: 'Intelligence' },
  { label: 'Tools', href: '/nucleus/tools', zone: 'Engineering' },
  { label: 'Forge', href: '/nucleus/forge', zone: 'Engineering' },
  { label: 'Admin', href: '/nucleus/admin', zone: 'Control' },
  { label: 'Profile', href: '/nucleus/profile', zone: 'Identity' },
];

const ZONE_COLORS: Record<string, string> = {
  Enablement: 'text-amber-400',
  Safety: 'text-red-400',
  Intelligence: 'text-cyan',
  Engineering: 'text-emerald-400',
  Control: 'text-violet-400',
  Identity: 'text-slate-dim/50',
};

export function EcosystemMesh() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const nodeCount = NODES.length;
  const edgeCount = nodeCount * (nodeCount - 1);
  const selected = NODES[selectedIdx];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Ecosystem Mesh</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Ecosystem Mesh
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Direct node-to-node pathways across the full ecosystem. Every domain can hop to every other domain.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Node List */}
        <div className="border border-white/[0.12] bg-white/[0.06] p-5">
          <h2 className="text-[11px] font-bold font-mono text-cyan uppercase tracking-[0.2em] mb-4">Mesh Nodes</h2>
          <div className="space-y-2">
            {NODES.map((node, idx) => (
              <button
                key={node.label}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full border px-3 py-2 text-left transition-all ${
                  selectedIdx === idx
                    ? 'border-cyan/40 bg-cyan/10'
                    : 'border-white/[0.08] bg-black/20 hover:border-white/[0.12]'
                }`}
              >
                <div className="text-sm font-semibold text-white">{node.label}</div>
                <div className={`text-[10px] uppercase tracking-widest ${ZONE_COLORS[node.zone] ?? 'text-slate-dim/40'}`}>{node.zone}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Links from selected node */}
        <div className="lg:col-span-2 border border-white/[0.12] bg-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-bold font-mono text-cyan uppercase tracking-[0.2em]">
              Direct Links From Selected Node
            </h2>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/40">
              {nodeCount} nodes | {edgeCount} directed edges | active: {selected?.label}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {NODES.filter((_, idx) => idx !== selectedIdx).map((node) => (
              <Link
                key={node.label}
                href={node.href}
                className="border border-white/[0.08] bg-black/20 px-4 py-3 hover:border-cyan/30 transition-colors"
              >
                <div className="text-sm font-semibold text-white">{node.label}</div>
                <div className={`text-[10px] uppercase tracking-widest ${ZONE_COLORS[node.zone] ?? 'text-slate-dim/40'}`}>{node.zone}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
