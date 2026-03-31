'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface EcosystemApp {
  name: string;
  description: string;
  href: string;
  tier: 'production' | 'experimental';
}

const APPS: EcosystemApp[] = [
  { name: 'Nucleus', description: 'Unified portal for vigilance, academy, community, and tools.', href: '/nucleus', tier: 'production' },
  { name: 'Guardian', description: 'Homeostasis control loop with immune-inspired safety monitoring.', href: '/nucleus/guardian', tier: 'production' },
  { name: 'Vigilance Suite', description: 'Signal detection, causality analysis, and drug safety tools.', href: '/nucleus/vigilance', tier: 'production' },
  { name: 'Academy', description: 'Capability pathways, GVP modules, and spaced review.', href: '/nucleus/academy', tier: 'production' },
  { name: 'Forge', description: 'Primitive Depths — collect Lex Primitiva, battle antipatterns, forge code.', href: '/nucleus/forge', tier: 'production' },
  { name: 'Brain Viewer', description: 'Working memory — sessions, artifacts, and code tracking.', href: '/nucleus/tools/brain', tier: 'experimental' },
  { name: 'Architecture Visualizer', description: 'Decompose systems into fundamental Lex Primitiva symbols.', href: '/nucleus/tools/visualizer', tier: 'experimental' },
];

const TIER_COLORS: Record<string, string> = {
  production: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  experimental: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

export function AppStore() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return APPS;
    return APPS.filter(
      (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">App Store</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Ecosystem App Store
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Browse available workspace applications from inside Nucleus.
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-dim/30" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search apps..."
          className="w-full border border-white/[0.12] bg-white/[0.06] pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-dim/20 focus:border-cyan/40 focus:outline-none"
        />
      </div>

      {/* App Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((app) => (
          <Link
            key={app.name}
            href={app.href}
            className="border border-white/[0.12] bg-white/[0.06] p-6 hover:border-cyan/30 transition-all"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-white">{app.name}</h2>
              <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-widest font-mono flex-shrink-0 ${TIER_COLORS[app.tier] ?? ''}`}>
                {app.tier}
              </span>
            </div>
            <p className="text-sm text-slate-dim/50">{app.description}</p>
            <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan font-mono">
              Open in Nucleus
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
