'use client';

import { useState } from 'react';

const METRICS = [
  { label: 'Latencies', value: 'v Frequency' },
  { label: 'Throughput', value: 'S Sum' },
  { label: 'Allocation', value: 'N Quantity' },
  { label: 'State', value: 's State' },
];

export function PerfAnalyzer() {
  const [profile, setProfile] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!profile.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/nexcore/brain/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze the following performance profile/code for bottlenecks and optimization opportunities. Focus on async overhead, memory allocation, and instruction efficiency:\n\n${profile}`,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setResult(data.content ?? data.response ?? JSON.stringify(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Performance Analyzer</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Performance Analyzer
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Optimize async workflows and high-throughput data pipelines.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <div className="border border-white/[0.12] bg-white/[0.06] p-6">
            <label className="block text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono mb-3">
              Code / Performance Profile
            </label>
            <textarea
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className="w-full h-64 bg-black/20 border border-white/[0.08] p-4 text-sm text-emerald-300 focus:border-emerald-500 focus:outline-none transition-all font-mono leading-relaxed resize-none"
              placeholder="Paste your performance metrics, flamegraph data, or hot path code here..."
            />
            <button
              onClick={analyze}
              disabled={loading || !profile.trim()}
              className="w-full mt-4 py-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-black font-mono uppercase tracking-widest text-[11px] hover:bg-emerald-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'COMPUTING...' : 'OPTIMIZE ARCHITECTURE'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {METRICS.map((m) => (
              <div key={m.label} className="border border-white/[0.12] bg-white/[0.06] p-4">
                <p className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest mb-1 font-mono">{m.label}</p>
                <p className="text-xs font-bold text-slate-dim/50 font-mono">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        <div className="border border-white/[0.12] bg-black/20 flex flex-col h-[600px]">
          <div className="bg-white/[0.04] px-4 py-2 border-b border-white/[0.08] flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">Optimization Report</span>
            <span className={`h-2 w-2 rounded-full ${loading ? 'bg-emerald-500 animate-pulse' : 'bg-white/[0.08]'}`} />
          </div>
          <div className="flex-1 p-6 overflow-y-auto text-sm leading-relaxed">
            {error && <p className="text-red-500 font-mono text-xs">! ERROR: {error}</p>}
            {result && (
              <div className="text-slate-300">
                <h3 className="text-emerald-400 font-mono text-xs uppercase mb-4 font-bold tracking-widest">System Strategy</h3>
                <div className="whitespace-pre-wrap text-[13px]">{result}</div>
              </div>
            )}
            {!result && !error && (
              <p className="text-slate-dim/20 font-mono uppercase tracking-widest text-xs">Processing profile...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
