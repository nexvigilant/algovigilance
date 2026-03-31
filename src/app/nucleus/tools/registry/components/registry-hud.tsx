'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, Loader2, Search } from 'lucide-react';

interface CrateInfo {
  name: string;
  max_version: string;
  description?: string;
  total_downloads?: number;
  last_updated?: string;
}

interface RegistryData {
  crates: CrateInfo[];
  total: number;
  error?: string;
}

const ACTION_COLORS: Record<string, string> = {
  published: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  indexed: 'text-cyan border-cyan/30 bg-cyan/5',
  yanked: 'text-red-400 border-red-500/30 bg-red-500/5',
};

export function RegistryHud() {
  const [data, setData] = useState<RegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRegistry = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/nexcore/registry');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData({ crates: [], total: 0, error: `HTTP ${res.status}` });
      }
    } catch {
      setData({ crates: [], total: 0, error: 'Registry unavailable' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);

  const crates = data?.crates || [];
  const filtered = search
    ? crates.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : crates;

  const nexcoreCrates = crates.filter(c => c.name.startsWith('nexcore-')).length;
  const stemCrates = crates.filter(c => c.name.startsWith('stem-')).length;
  const otherCrates = crates.length - nexcoreCrates - stemCrates;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Crate Registry / Kellnr</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Registry HUD
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Monitor the Kellnr crate registry at crates.nexvigilant.com
        </p>
      </header>

      {data?.error && (
        <div className="border border-amber-500/30 bg-amber-500/5 p-3 mb-6">
          <p className="text-amber-400/80 text-xs font-mono">{data.error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Registry Health */}
        <div className="space-y-4">
          <div className="border border-white/[0.12] bg-white/[0.06] p-6">
            <div className="flex items-center gap-2 mb-5">
              <Database className="h-3.5 w-3.5 text-emerald-400/60" />
              <span className="intel-label">Registry Status</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 text-cyan/40 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-dim/50 font-mono">Kellnr</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${data?.error ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs text-white font-bold">{data?.error ? 'Degraded' : 'Online'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-dim/50 font-mono">API</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${data?.error ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs text-white font-bold">{data?.error ? 'Unreachable' : 'Active'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border border-white/[0.12] bg-white/[0.06] p-6">
            <h3 className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest mb-4 font-mono">Distribution</h3>
            <div className="space-y-3">
              {[
                { label: 'nexcore-*', count: nexcoreCrates, color: 'bg-cyan/30' },
                { label: 'stem-*', count: stemCrates, color: 'bg-emerald-500/30' },
                { label: 'other', count: otherCrates, color: 'bg-amber-500/30' },
              ].map(cat => {
                const pct = crates.length > 0 ? (cat.count / crates.length) * 100 : 0;
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-slate-dim/50">{cat.label}</span>
                      <span className="text-[9px] font-mono text-slate-dim/40">{cat.count}</span>
                    </div>
                    <div className="h-2 bg-black/20 overflow-hidden">
                      <div className={`h-full ${cat.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-white/[0.12] bg-white/[0.06] p-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">Total Crates</p>
                <p className="text-xl font-extrabold text-white font-mono tabular-nums">{crates.length || '—'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">NexCore</p>
                <p className="text-xl font-extrabold text-cyan font-mono tabular-nums">{nexcoreCrates || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crate List */}
        <div className="lg:col-span-2">
          <div className="border border-white/[0.12] bg-white/[0.06] flex flex-col h-[700px]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
              <span className="intel-label">Crate Registry</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
              <button onClick={fetchRegistry} disabled={loading} className="text-slate-dim/30 hover:text-white transition-colors">
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-2 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-dim/30" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter crates..."
                  className="w-full bg-black/20 border border-white/[0.08] pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-slate-dim/20 focus:border-cyan/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 text-cyan/40 animate-spin mr-2" />
                  <span className="text-[10px] font-mono text-slate-dim/40">Loading registry...</span>
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((crate) => (
                  <div
                    key={crate.name}
                    className="px-4 py-3 border border-white/[0.06] bg-black/20 hover:border-white/[0.12] transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 border border-white/[0.08] bg-black/30 flex items-center justify-center text-[10px] font-extrabold text-slate-dim/30 font-mono">
                        {crate.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white tracking-tight">{crate.name}</span>
                          <span className="text-[10px] text-slate-dim/40 font-mono">v{crate.max_version}</span>
                        </div>
                        {crate.description && (
                          <p className="text-[9px] text-slate-dim/40 font-mono mt-0.5 truncate max-w-md">{crate.description}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 border text-[9px] font-bold font-mono uppercase tracking-widest ${ACTION_COLORS.published}`}>
                      published
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <Database className="h-6 w-6 text-slate-dim/15 mx-auto mb-3" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
                    {search ? 'No matching crates' : 'No crates loaded'}
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/[0.06] text-[9px] font-mono text-slate-dim/30 text-center">
              {filtered.length} of {crates.length} crates
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
