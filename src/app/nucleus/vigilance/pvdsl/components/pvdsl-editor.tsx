"use client";

import { useState, useCallback, useMemo } from "react";
import { Code2, Play, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeSignals, type ContingencyTable } from "@/lib/pv-compute";

interface PvdslResult {
  success: boolean;
  output: string;
}

const DEFAULT_CODE = `// PVDSL Signal Logic
\u03bb a = 15
\u03bb b = 100
\u03bb c = 20
\u03bb d = 10000

\u03bc check_signal(a, b, c, d) \u2192 B {
    prr(a, b, c, d) \u03ba> 2.0
}

check_signal(a, b, c, d)`;

export function PvdslEditor() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [result, setResult] = useState<PvdslResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract contingency table from PVDSL code for client-side verification
  const extractedTable: ContingencyTable | null = useMemo(() => {
    const aMatch = code.match(/λ\s*a\s*=\s*(\d+)/);
    const bMatch = code.match(/λ\s*b\s*=\s*(\d+)/);
    const cMatch = code.match(/λ\s*c\s*=\s*(\d+)/);
    const dMatch = code.match(/λ\s*d\s*=\s*(\d+)/);
    if (aMatch && bMatch && cMatch && dMatch) {
      return {
        a: parseInt(aMatch[1], 10),
        b: parseInt(bMatch[1], 10),
        c: parseInt(cMatch[1], 10),
        d: parseInt(dMatch[1], 10),
      };
    }
    return null;
  }, [code]);

  const clientSignals = useMemo(() => {
    if (!extractedTable) return null;
    return computeSignals(extractedTable);
  }, [extractedTable]);

  const handleExecute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nexcore/pvdsl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PvdslResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setLoading(false);
    }
  }, [code]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="intel-status-active" />
            <span className="intel-label">
              Domain Language / Programmable Vigilance
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-white tracking-tight">
            PVDSL Studio
          </h1>
          <p className="text-sm text-slate-dim/60 mt-1">
            Domain-specific language for programmable pharmacovigilance
          </p>
        </div>
        <Button
          onClick={handleExecute}
          disabled={loading}
          className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-2" />
              Run Code
            </>
          )}
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div className="border border-white/[0.12] bg-white/[0.06] flex flex-col h-[600px]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <Code2 className="h-3.5 w-3.5 text-cyan/60" />
            <span className="intel-label">Editor</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[8px] font-mono text-cyan/40">
              PRIMA-ENGINE v1.0
            </span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-4 bg-transparent text-cyan-50 font-mono text-sm resize-none focus:outline-none leading-relaxed"
          />
        </div>

        {/* Output terminal */}
        <div className="border border-white/[0.12] bg-black/40 flex flex-col h-[600px]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <span className="intel-label">Output Terminal</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
            <div className="flex gap-1.5">
              <div className="h-2 w-2 bg-slate-dim/20" />
              <div className="h-2 w-2 bg-slate-dim/20" />
              <div className="h-2 w-2 bg-slate-dim/20" />
            </div>
          </div>
          <div className="flex-1 p-4 font-mono text-sm overflow-y-auto">
            {error && (
              <p className="text-red-400">! EXECUTION ERROR: {error}</p>
            )}

            {result ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                      result.success
                        ? "text-emerald-400 border-emerald-500/30"
                        : "text-red-400 border-red-500/30"
                    }`}
                  >
                    {result.success ? "SUCCESS" : "FAILED"}
                  </span>
                </div>
                <pre className="text-slate-300/80 whitespace-pre-wrap leading-relaxed">
                  {result.output}
                </pre>
              </div>
            ) : !error ? (
              <p className="text-slate-dim/20 animate-pulse">
                WAITING FOR EXECUTION...
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Client-side signal verification */}
      {clientSignals && (
        <div className="mt-4 border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60">
              pv-compute verification
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="text-center">
              <p className="text-white/30">PRR</p>
              <p className="text-lg font-bold text-violet-300">
                {clientSignals.prr.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-white/30">ROR</p>
              <p className="text-lg font-bold text-violet-300">
                {clientSignals.ror.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-white/30">IC</p>
              <p className="text-lg font-bold text-violet-300">
                {clientSignals.ic.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-white/30">Chi²</p>
              <p className="text-lg font-bold text-violet-300">
                {clientSignals.chi_square.toFixed(1)}
              </p>
            </div>
          </div>
          <p className="text-[9px] text-violet-300/40 mt-2">
            Extracted table: a={extractedTable?.a} b={extractedTable?.b} c=
            {extractedTable?.c} d={extractedTable?.d} — computed via
            @/lib/pv-compute
          </p>
        </div>
      )}
    </div>
  );
}
