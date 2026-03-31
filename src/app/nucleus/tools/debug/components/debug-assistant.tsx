'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const CAPABILITIES = [
  'Logical Anomaly Detection',
  'Memory Leak Analysis',
  'Concurrency Deadlock Identification',
  'Async State Trace',
];

export function DebugAssistant() {
  const [logs, setLogs] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!logs.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/nexcore/brain/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze the following logs/stack trace for logical errors, performance bottlenecks, or system anomalies. Suggest a fix:\n\n${logs}`,
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
          <span className="intel-label">Debug Assistant</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Debug Assistant
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Analyze stack traces and logs to identify root causes and anomalies.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <div className="border border-white/[0.12] bg-white/[0.06] p-6">
            <label className="block text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono mb-3">
              System Logs / Stack Trace
            </label>
            <textarea
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              className="w-full h-64 bg-black/20 border border-white/[0.08] p-4 text-[12px] text-red-300 focus:border-red-500 focus:outline-none transition-all font-mono leading-relaxed resize-none"
              placeholder="Paste your error logs or stack trace here..."
            />
            <button
              onClick={analyze}
              disabled={loading || !logs.trim()}
              className="w-full mt-4 py-3 bg-red-600/20 border border-red-500/30 text-red-400 font-black font-mono uppercase tracking-widest text-[11px] hover:bg-red-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'ANALYZING...' : 'RUN DIAGNOSTICS'}
            </button>
          </div>

          <div className="border border-white/[0.12] bg-white/[0.06] p-5">
            <p className="text-[10px] font-bold text-slate-dim/40 uppercase tracking-[0.2em] mb-3 font-mono">Capabilities</p>
            <ul className="space-y-2">
              {CAPABILITIES.map((c) => (
                <li key={c} className="flex items-center gap-2 text-[11px] text-slate-dim/50">
                  <CheckCircle2 className="w-3 h-3 text-red-400 flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Output */}
        <div className="border border-white/[0.12] bg-black/20 flex flex-col h-[600px]">
          <div className="bg-white/[0.04] px-4 py-2 border-b border-white/[0.08] flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">Diagnostic Output</span>
            <span className={`h-2 w-2 rounded-full ${loading ? 'bg-red-500 animate-pulse' : 'bg-white/[0.08]'}`} />
          </div>
          <div className="flex-1 p-6 overflow-y-auto text-sm leading-relaxed">
            {error && <p className="text-red-500 font-mono text-xs">! ERROR: {error}</p>}
            {result && (
              <div className="text-slate-300">
                <h3 className="text-cyan font-mono text-xs uppercase mb-4 font-bold tracking-widest">Analysis Complete</h3>
                <div className="whitespace-pre-wrap text-[13px]">{result}</div>
              </div>
            )}
            {!result && !error && (
              <p className="text-slate-dim/20 font-mono uppercase tracking-widest text-xs">Waiting for telemetry...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
