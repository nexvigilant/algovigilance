'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Monitor, Zap, ChevronRight, Wifi, WifiOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OS_TOOLS, DOMAIN_META, TOOL_COUNT, DOMAIN_COUNT, type OSDomain, type OSTool } from './os-config';

type FilterDomain = OSDomain | 'all';

interface NexCoreHealth {
  status: 'online' | 'offline' | 'checking';
  latency?: number;
}

export function NexCoreOS() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDomain, setActiveDomain] = useState<FilterDomain>('all');
  const [health, setHealth] = useState<NexCoreHealth>({ status: 'checking' });

  // Check NexCore backend health
  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      const start = performance.now();
      try {
        const res = await fetch('/api/nexcore/guardian?action=status', {
          signal: AbortSignal.timeout(5000),
        });
        if (!cancelled) {
          setHealth({
            status: res.ok ? 'online' : 'offline',
            latency: Math.round(performance.now() - start),
          });
        }
      } catch {
        if (!cancelled) {
          setHealth({ status: 'offline' });
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Filter tools by search and domain
  const filteredTools = useMemo(() => {
    let tools = OS_TOOLS;

    if (activeDomain !== 'all') {
      tools = tools.filter((t) => t.domain === activeDomain);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tools = tools.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q))
      );
    }

    return tools;
  }, [searchQuery, activeDomain]);

  // Group by domain for display
  const groupedTools = useMemo(() => {
    const groups = new Map<OSDomain, OSTool[]>();
    for (const tool of filteredTools) {
      const existing = groups.get(tool.domain) || [];
      existing.push(tool);
      groups.set(tool.domain, existing);
    }
    return groups;
  }, [filteredTools]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const domains: FilterDomain[] = ['all', 'vigilance', 'guardian', 'engineering', 'foundation', 'science'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <Monitor className="h-5 w-5 text-gold" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-gold/60">
                AlgoVigilance
              </p>
              <HealthBadge health={health} />
            </div>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Operating System
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          {TOOL_COUNT} tools across {DOMAIN_COUNT} domains — powered by 175 Rust crates and 369 MCP endpoints
        </p>
      </header>

      {/* Search + Domain Filter */}
      <div className="mb-golden-3 space-y-golden-2">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-dim/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tools — signal detection, faers, causality, pvdsl..."
            className="w-full bg-black/20 border border-white/[0.08] pl-10 pr-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-dim/30 focus:border-cyan/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-dim/40 hover:text-white text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {/* Domain tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {domains.map((domain) => {
            const isActive = activeDomain === domain;
            const count = domain === 'all'
              ? OS_TOOLS.length
              : OS_TOOLS.filter((t) => t.domain === domain).length;
            const meta = domain !== 'all' ? DOMAIN_META[domain] : null;

            return (
              <button
                key={domain}
                onClick={() => setActiveDomain(domain)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest
                  border transition-all whitespace-nowrap shrink-0
                  ${isActive
                    ? 'border-cyan/40 bg-cyan/10 text-cyan'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-dim/50 hover:text-white/70 hover:border-white/[0.15]'
                  }
                `}
              >
                {meta && <meta.icon className="h-3 w-3" />}
                {domain === 'all' ? 'All' : meta?.label}
                <span className={`tabular-nums ${isActive ? 'text-cyan/60' : 'text-slate-dim/30'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-golden-3 mb-golden-3 text-[10px] font-mono uppercase tracking-widest text-slate-dim/40">
        <span>{filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}</span>
        <span className="text-white/[0.08]">|</span>
        <span>{groupedTools.size} domain{groupedTools.size !== 1 ? 's' : ''}</span>
        {health.latency && (
          <>
            <span className="text-white/[0.08]">|</span>
            <span className="tabular-nums">{health.latency}ms latency</span>
          </>
        )}
      </div>

      {/* Tool Grid — grouped by domain */}
      <div className="space-y-golden-3">
        <AnimatePresence mode="popLayout">
          {Array.from(groupedTools.entries()).map(([domain, tools]) => {
            const meta = DOMAIN_META[domain];
            return (
              <motion.section
                key={domain}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                aria-label={meta.label}
              >
                <div className={`flex items-center gap-2 mb-golden-2 pb-2 border-b ${meta.borderColor}`}>
                  <meta.icon className={`h-4 w-4 ${meta.color}`} />
                  <h2 className={`text-xs font-mono uppercase tracking-widest ${meta.color}`}>
                    {meta.label}
                  </h2>
                  <span className="text-[9px] font-mono text-slate-dim/30 tabular-nums">
                    {tools.length}
                  </span>
                </div>

                <div className="grid gap-golden-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {tools.map((tool, i) => (
                    <ToolCard key={tool.id} tool={tool} index={i} backendOnline={health.status === 'online'} />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </AnimatePresence>

        {filteredTools.length === 0 && (
          <div className="py-16 text-center">
            <Search className="h-8 w-8 text-slate-dim/15 mx-auto mb-3" />
            <p className="text-sm text-slate-dim/40 font-mono">
              No tools match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-golden-5 border border-white/[0.08] bg-white/[0.02] p-golden-3 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-dim/40 text-[10px] font-mono uppercase tracking-widest">
          <Zap className="h-3 w-3" />
          <span>Powered by NexCore — 175 Rust crates, 369 MCP tools, zero Python</span>
        </div>
      </footer>
    </div>
  );
}

function ToolCard({ tool, index, backendOnline }: { tool: OSTool; index: number; backendOnline: boolean }) {
  const Icon = tool.icon;
  const needsBackend = !!tool.backendEndpoint;
  const isAvailable = !needsBackend || backendOnline;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link
        href={tool.href}
        className={`
          group flex flex-col h-full border p-golden-3 transition-all
          ${isAvailable
            ? 'border-white/[0.08] bg-white/[0.03] hover:border-cyan/30 hover:bg-cyan/5'
            : 'border-white/[0.05] bg-white/[0.01] opacity-60'
          }
        `}
      >
        <div className="flex items-start justify-between mb-golden-2">
          <div className={`${tool.color} group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1.5">
            {needsBackend && (
              <div className={`h-1.5 w-1.5 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-red-400'}`}
                title={backendOnline ? 'Backend connected' : 'Backend offline'}
              />
            )}
            <TierBadge tier={tool.tier} />
          </div>
        </div>

        <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">
          {tool.title}
        </h3>
        <p className="text-[11px] text-slate-dim/60 leading-golden flex-1">
          {tool.description}
        </p>

        <div className="mt-golden-2 flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {tool.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[8px] font-mono text-slate-dim/30 border border-white/[0.06] px-1.5 py-0.5">
                {tag}
              </span>
            ))}
          </div>
          <ChevronRight className="h-3 w-3 text-slate-dim/20 group-hover:text-cyan/60 transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}

function TierBadge({ tier }: { tier: OSTool['tier'] }) {
  const styles = {
    explorer: 'text-emerald-400/60 border-emerald-400/20',
    accelerator: 'text-gold/60 border-gold/20',
    enterprise: 'text-violet-400/60 border-violet-400/20',
  };

  return (
    <span className={`text-[7px] font-mono uppercase tracking-widest border px-1 py-0.5 ${styles[tier]}`}>
      {tier}
    </span>
  );
}

function HealthBadge({ health }: { health: NexCoreHealth }) {
  if (health.status === 'checking') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-dim/40 uppercase tracking-widest">
        <div className="h-1.5 w-1.5 rounded-full bg-slate-dim/30 animate-pulse" />
        Connecting
      </span>
    );
  }

  const isOnline = health.status === 'online';

  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest ${isOnline ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
      {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {isOnline ? 'NexCore Online' : 'NexCore Offline'}
      {health.latency && (
        <span className="text-slate-dim/30 tabular-nums">{health.latency}ms</span>
      )}
    </span>
  );
}
