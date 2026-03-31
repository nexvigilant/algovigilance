"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

const STATION_RPC = "https://mcp.nexvigilant.com/rpc";

interface DisproportionalityResult {
  prr: { value: number; ci_lower: number; ci_upper: number; signal: boolean };
  ror: { value: number; ci_lower: number; ci_upper: number; signal: boolean };
  ic: { value: number; ci_lower: number; ci_upper: number; signal: boolean };
  ebgm: { value: number; eb05: number; eb95: number; signal: boolean };
  contingency_table: { a: number; b: number; c: number; d: number };
  signal_count: number;
  consensus: string;
}

type Status = "idle" | "loading" | "success" | "error";

async function callStation(
  tool: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(STATION_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name: tool, arguments: args },
    }),
  });

  if (!res.ok) {
    throw new Error(`Station returned ${res.status}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message || "Station error");
  }

  // MCP tools/call returns { result: { content: [{ type: "text", text: "..." }] } }
  const content = data.result?.content;
  if (Array.isArray(content) && content.length > 0 && content[0].text) {
    return JSON.parse(content[0].text);
  }

  return data.result;
}

export function SignalDetectionForm() {
  const [drug, setDrug] = useState("");
  const [event, setEvent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DisproportionalityResult | null>(null);
  const [error, setError] = useState("");

  const runDetection = useCallback(async () => {
    if (!drug.trim() || !event.trim()) return;

    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const data = (await callStation(
        "open-vigil_fr_compute_disproportionality",
        { drug: drug.trim(), event: event.trim() },
      )) as {
        scores: Record<string, number>;
        contingency_table: Record<string, number>;
        signal_assessment: string;
      };

      // Map OpenVigil response to our result shape
      const s = data.scores;
      const ct = data.contingency_table;

      setResult({
        prr: {
          value: s.PRR,
          ci_lower: s.PRR_CI_lower,
          ci_upper: s.PRR_CI_upper,
          signal: s.PRR >= 2.0,
        },
        ror: {
          value: s.ROR,
          ci_lower: s.ROR_CI_lower,
          ci_upper: s.ROR_CI_upper,
          signal: s.ROR >= 2.0,
        },
        ic: {
          value: s.IC,
          ci_lower: s.IC025,
          ci_upper: s.IC975,
          signal: s.IC >= 0,
        },
        ebgm: {
          value: s.IC, // OpenVigil doesn't return EBGM directly — use IC as proxy note
          eb05: s.IC025,
          eb95: s.IC975,
          signal: s.IC >= 0,
        },
        contingency_table: {
          a: ct.a_drug_event,
          b: ct.b_drug_noevent,
          c: ct.c_nodrug_event,
          d: ct.d_nodrug_noevent,
        },
        signal_count:
          (s.PRR >= 2.0 ? 1 : 0) +
          (s.ROR >= 2.0 ? 1 : 0) +
          (s.IC >= 0 ? 1 : 0) +
          (s.chi_squared >= 4.0 ? 1 : 0),
        consensus:
          data.signal_assessment === "signal_detected" ? "signal" : "no_signal",
      });
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }, [drug, event]);

  const signalStrength =
    result &&
    (result.signal_count >= 3
      ? "Strong"
      : result.signal_count >= 2
        ? "Moderate"
        : result.signal_count >= 1
          ? "Weak"
          : "Noise");

  const strengthColor =
    signalStrength === "Strong"
      ? "text-red-400"
      : signalStrength === "Moderate"
        ? "text-amber-400"
        : signalStrength === "Weak"
          ? "text-yellow-400"
          : "text-slate-400";

  return (
    <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-6">
      <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">
        Try It — Live Signal Detection
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Enter any drug-event combination. Results are computed live from the FDA
        FAERS database via{" "}
        <code className="text-cyan-400 text-[10px] bg-slate-800 px-1 py-0.5 rounded">
          mcp.nexvigilant.com
        </code>
      </p>

      {/* Input form */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={drug}
          onChange={(e) => setDrug(e.target.value)}
          placeholder="Drug name (e.g., metformin)"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
          onKeyDown={(e) => e.key === "Enter" && runDetection()}
        />
        <input
          type="text"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          placeholder="Adverse event (e.g., lactic acidosis)"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
          onKeyDown={(e) => e.key === "Enter" && runDetection()}
        />
        <button
          onClick={runDetection}
          disabled={status === "loading" || !drug.trim() || !event.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Detect
        </button>
      </div>

      {/* Error state */}
      {status === "error" && (
        <div className="rounded border border-red-500/30 bg-red-950/20 p-3 mb-4">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Signal verdict */}
          <div className="flex items-center gap-2">
            {result.consensus === "signal" ? (
              <AlertTriangle className={`h-5 w-5 ${strengthColor}`} />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            )}
            <span className={`text-lg font-bold ${strengthColor}`}>
              {signalStrength} Signal
            </span>
            <span className="text-xs text-slate-500 ml-2">
              {result.signal_count}/4 methods agree
            </span>
          </div>

          {/* Scores table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-1.5 pr-4 text-slate-500 font-medium">
                    Metric
                  </th>
                  <th className="text-right py-1.5 pr-4 text-slate-500 font-medium">
                    Value
                  </th>
                  <th className="text-right py-1.5 pr-4 text-slate-500 font-medium">
                    95% CI
                  </th>
                  <th className="text-right py-1.5 text-slate-500 font-medium">
                    Signal?
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "PRR", ...result.prr },
                  { label: "ROR", ...result.ror },
                  { label: "IC", ...result.ic },
                ].map((row, i) => (
                  <tr
                    key={row.label}
                    className={i < 2 ? "border-b border-slate-800" : ""}
                  >
                    <td className="py-1.5 pr-4 text-white">{row.label}</td>
                    <td
                      className={`text-right py-1.5 pr-4 font-bold ${row.signal ? "text-red-400" : "text-slate-400"}`}
                    >
                      {row.value.toFixed(2)}
                    </td>
                    <td className="text-right py-1.5 pr-4 text-slate-500">
                      {row.ci_lower.toFixed(2)}-{row.ci_upper.toFixed(2)}
                    </td>
                    <td className="text-right py-1.5">
                      {row.signal ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-red-400 inline" />
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Contingency table */}
          <div className="text-[10px] text-slate-500">
            Contingency: a={result.contingency_table.a.toLocaleString()} b=
            {result.contingency_table.b.toLocaleString()} c=
            {result.contingency_table.c.toLocaleString()} d=
            {result.contingency_table.d.toLocaleString()} | Source: FAERS via
            OpenVigil
          </div>
        </div>
      )}

      {/* Idle hint */}
      {status === "idle" && (
        <p className="text-[10px] text-slate-600 italic">
          Try: metformin + lactic acidosis, or ibuprofen + gastrointestinal
          hemorrhage
        </p>
      )}
    </div>
  );
}
