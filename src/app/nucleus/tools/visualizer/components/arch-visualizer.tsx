'use client';

import { useState } from 'react';

const PRIMITIVES = [
  { sym: '\u2192', label: 'Causality' },
  { sym: 'N', label: 'Quantity' },
  { sym: '\u2203', label: 'Existence' },
  { sym: '\u03BA', label: 'Comparison' },
  { sym: '\u03C2', label: 'State' },
  { sym: '\u03BC', label: 'Mapping' },
  { sym: '\u03C3', label: 'Sequence' },
  { sym: '\u03C1', label: 'Recursion' },
  { sym: '\u2205', label: 'Void' },
  { sym: '\u2202', label: 'Boundary' },
  { sym: '\u03BD', label: 'Frequency' },
  { sym: '\u03BB', label: 'Location' },
  { sym: '\u03C0', label: 'Persistence' },
  { sym: '\u221D', label: 'Irreversibility' },
  { sym: '\u03A3', label: 'Sum' },
  { sym: '\u00D7', label: 'Product' },
];

export function ArchVisualizer() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/nexcore/brain/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Perform a deep primitive analysis on the following architecture/code. Decompose it into the 16 T1 Lex Primitiva symbols and explain the grounding:\n\n${input}`,
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Architecture Visualizer</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Architecture Visualizer
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Decompose system designs into their fundamental primitives. Ground your architecture to the 16 Lex Primitiva.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <div className="border border-white/[0.12] bg-white/[0.06] p-6">
            <label className="block text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono mb-3">
              System Description / Rust Code
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-64 bg-black/20 border border-white/[0.08] p-4 text-sm text-cyan-300 focus:border-cyan-500 focus:outline-none transition-all font-mono leading-relaxed resize-none"
              placeholder="Paste architecture notes or a Rust module..."
            />
            <button
              onClick={analyze}
              disabled={loading || !input.trim()}
              className="w-full mt-4 py-3 bg-violet-600/20 border border-violet-500/30 text-violet-400 font-black font-mono uppercase tracking-widest text-[11px] hover:bg-violet-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'DECOMPOSING...' : 'MAP TO PRIMITIVES'}
            </button>
          </div>

          {/* Primitive Reference Grid */}
          <div className="grid grid-cols-8 gap-2">
            {PRIMITIVES.map((p) => (
              <div
                key={p.label}
                title={p.label}
                className="aspect-square border border-white/[0.12] bg-white/[0.06] flex items-center justify-center text-[11px] text-slate-dim/40 hover:text-cyan hover:border-cyan/30 transition-all cursor-help font-mono"
              >
                {p.sym}
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        <div className="border border-white/[0.12] bg-black/20 flex flex-col min-h-[600px]">
          <div className="bg-white/[0.04] px-4 py-2 border-b border-white/[0.08] flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">Grounding Report</span>
            <span className="text-[9px] font-bold text-cyan font-mono">T1 ANALYSIS ACTIVE</span>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {error && <p className="text-red-500 font-mono text-xs">! ERROR: {error}</p>}
            {result && (
              <div className="text-slate-300 whitespace-pre-wrap text-[13px] leading-relaxed">{result}</div>
            )}
            {!result && !error && (
              <p className="text-slate-dim/20 font-mono uppercase tracking-[0.2em] text-xs">Processing spectral composition...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
