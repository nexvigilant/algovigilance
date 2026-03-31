"use client";

import { useState, useCallback } from "react";
import { Activity, Crosshair, Globe, Loader2, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeSignals, type SignalResult } from "@/lib/pv-compute";

interface NexCoreSignalResult {
  prr: number;
  ror: number;
  ror_lower: number;
  ic025: number;
  ebgm: number;
  eb05: number;
  chi_square: number;
  any_signal: boolean;
  source: "nexcore";
}

interface StationResult {
  drug: string;
  event: string;
  contingencyTable: { a: number; b: number; c: number; d: number };
  signalResult: SignalResult;
  source: "station";
}

const METRICS = [
  { key: "prr", label: "PRR", signalKey: "prr_signal", threshold: ">= 2.0" },
  {
    key: "ror",
    label: "ROR",
    signalKey: "ror_signal",
    threshold: "CI > 1.0",
    ciKey: "ror_lower",
  },
  {
    key: "ic025",
    label: "IC (0.25)",
    signalKey: "ic_signal",
    threshold: "> 0",
  },
  {
    key: "ebgm",
    label: "EBGM",
    signalKey: "ebgm_signal",
    threshold: "EB05 >= 2.0",
    ciKey: "eb05",
  },
  {
    key: "chi_square",
    label: "Chi-Square",
    signalKey: "chi_signal",
    threshold: ">= 3.841",
  },
] as const;

export function SignalCalculator() {
  const [cells, setCells] = useState({
    a: "15",
    b: "100",
    c: "20",
    d: "10000",
  });
  const [result, setResult] = useState<SignalResult | null>(null);
  const [nexcoreResult, setNexcoreResult] =
    useState<NexCoreSignalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [stationDrug, setStationDrug] = useState("metformin");
  const [stationEvent, setStationEvent] = useState("lactic acidosis");
  const [stationResult, setStationResult] = useState<StationResult | null>(
    null,
  );
  const [stationLoading, setStationLoading] = useState(false);
  const [stationError, setStationError] = useState<string | null>(null);

  const handleAnalyze = useCallback(() => {
    setError(null);
    try {
      const table = {
        a: parseInt(cells.a) || 0,
        b: parseInt(cells.b) || 0,
        c: parseInt(cells.c) || 0,
        d: parseInt(cells.d) || 0,
      };
      setResult(computeSignals(table));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    }
  }, [cells]);

  const handleVerify = useCallback(() => {
    setVerifying(true);
    const table = {
      a: parseInt(cells.a) || 0,
      b: parseInt(cells.b) || 0,
      c: parseInt(cells.c) || 0,
      d: parseInt(cells.d) || 0,
    };
    fetch("/api/nexcore/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(table),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setNexcoreResult({ ...data, source: "nexcore" });
        }
      })
      .catch(() => {
        /* silently fail */
      })
      .finally(() => setVerifying(false));
  }, [cells]);

  const handleStationLookup = useCallback(() => {
    if (!stationDrug.trim() || !stationEvent.trim()) return;
    setStationLoading(true);
    setStationError(null);
    fetch("/api/station", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "open-vigil_fr_compute_disproportionality",
        args: { drug: stationDrug.trim(), event: stationEvent.trim() },
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) throw new Error(data.error || "Station call failed");
        // MCP tools/call returns { content: [{ type, text }] }
        const content = data.result?.content;
        const text = content?.[0]?.type === "text" ? content[0].text : null;
        if (!text) throw new Error("No content in station response");
        const parsed = JSON.parse(text);
        if (parsed.status !== "ok")
          throw new Error(parsed.error || "OpenVigil query failed");
        const ct = parsed.contingency_table;
        const table = {
          a: ct.a_drug_event || 0,
          b: ct.b_drug_noevent || 0,
          c: ct.c_nodrug_event || 0,
          d: ct.d_nodrug_noevent || 0,
        };
        // Feed station data through pv-compute (Physiology)
        const signals = computeSignals(table);
        setStationResult({
          drug: parsed.drug,
          event: parsed.event,
          contingencyTable: table,
          signalResult: signals,
          source: "station",
        });
        // Also populate the main result and cells for comparison
        setCells({
          a: String(table.a),
          b: String(table.b),
          c: String(table.c),
          d: String(table.d),
        });
        setResult(signals);
      })
      .catch((err) => {
        setStationError(
          err instanceof Error ? err.message : "Station lookup failed",
        );
      })
      .finally(() => setStationLoading(false));
  }, [stationDrug, stationEvent]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Disproportionality Analysis / Signal Intelligence
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Signal Detection
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          PRR, ROR, IC, EBGM, Chi-square from 2x2 contingency tables
        </p>
        <p className="text-[9px] font-mono text-cyan/30 mt-1">
          Client-side computation — no server dependency
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Input Matrix */}
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <Crosshair className="h-3.5 w-3.5 text-gold/60" />
            <span className="intel-label">Contingency Table</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="p-4 space-y-4">
            {/* 2x2 grid labels */}
            <div className="grid grid-cols-3 gap-2 text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
              <div />
              <div className="text-center">Event (+)</div>
              <div className="text-center">No Event (-)</div>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-[9px] font-mono uppercase tracking-widest text-cyan/60">
                Drug
              </div>
              <CellInput
                label="a"
                value={cells.a}
                onChange={(v) => setCells((p) => ({ ...p, a: v }))}
              />
              <CellInput
                label="b"
                value={cells.b}
                onChange={(v) => setCells((p) => ({ ...p, b: v }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                Other
              </div>
              <CellInput
                label="c"
                value={cells.c}
                onChange={(v) => setCells((p) => ({ ...p, c: v }))}
              />
              <CellInput
                label="d"
                value={cells.d}
                onChange={(v) => setCells((p) => ({ ...p, d: v }))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAnalyze}
                className="flex-1 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
              >
                <Activity className="h-3.5 w-3.5 mr-2" />
                Analyze
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verifying}
                className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-dim/60 border border-white/[0.12] font-mono text-[10px] uppercase tracking-widest"
              >
                {verifying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Server className="h-3.5 w-3.5 mr-1" />
                )}
                NexCore
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <Activity className="h-3.5 w-3.5 text-cyan/60" />
            <span className="intel-label">Analysis Result</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="p-4">
            {error && (
              <div className="border border-red-500/30 bg-red-500/5 p-3 mb-4">
                <p className="text-red-400/80 text-xs font-mono">{error}</p>
              </div>
            )}

            {result ? (
              <div className="space-y-2">
                {METRICS.map((metric) => {
                  const { key, label, signalKey, threshold } = metric;
                  const ciKey = "ciKey" in metric ? metric.ciKey : undefined;
                  const value = result[key as keyof SignalResult] as number;
                  const isSignal = result[
                    signalKey as keyof SignalResult
                  ] as boolean;
                  const ci = ciKey
                    ? (result[ciKey as keyof SignalResult] as number)
                    : null;
                  return (
                    <div
                      key={key}
                      className="flex justify-between items-center py-2 border-b border-white/[0.06]"
                    >
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/40">
                          {label}
                        </span>
                        <span className="text-[8px] font-mono text-slate-dim/20 ml-2">
                          {threshold}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-sm tabular-nums ${isSignal ? "text-red-400" : "text-slate-300/80"}`}
                        >
                          {isFinite(value) ? value.toFixed(2) : "∞"}
                        </span>
                        {ci !== null && (
                          <span className="text-[8px] font-mono text-slate-dim/30 ml-1.5">
                            ({isFinite(ci) ? ci.toFixed(2) : "∞"})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {nexcoreResult && (
                  <div className="mt-4 pt-4 border-t border-cyan/20">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-cyan/40 mb-2">
                      <Server className="h-3 w-3 inline mr-1" />
                      NexCore Comparison
                    </p>
                    {METRICS.map(({ key, label }) => {
                      const clientVal = result[
                        key as keyof SignalResult
                      ] as number;
                      const serverVal = nexcoreResult[
                        key as keyof NexCoreSignalResult
                      ] as number;
                      const delta =
                        serverVal != null &&
                        isFinite(clientVal) &&
                        isFinite(serverVal)
                          ? Math.abs(clientVal - serverVal)
                          : null;
                      return (
                        <div
                          key={`nx-${key}`}
                          className="flex justify-between items-center py-1 text-[10px] font-mono"
                        >
                          <span className="text-slate-dim/40">{label}</span>
                          <div className="flex gap-3">
                            <span className="text-slate-dim/30">
                              {isFinite(clientVal) ? clientVal.toFixed(3) : "∞"}
                            </span>
                            <span className="text-cyan/50">
                              {serverVal != null && isFinite(serverVal)
                                ? serverVal.toFixed(3)
                                : "—"}
                            </span>
                            {delta !== null && (
                              <span
                                className={
                                  delta < 0.01
                                    ? "text-emerald-400/60"
                                    : "text-gold/60"
                                }
                              >
                                Δ{delta.toFixed(3)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/[0.08]">
                  {result.any_signal ? (
                    <div className="border border-red-500/30 bg-red-500/5 p-4 text-center">
                      <p className="text-red-400 font-bold font-mono text-sm uppercase tracking-widest">
                        Signal Detected
                      </p>
                      <p className="text-[8px] font-mono text-red-400/40 mt-1">
                        {[
                          result.prr_signal && "PRR",
                          result.ror_signal && "ROR",
                          result.ic_signal && "IC",
                          result.ebgm_signal && "EBGM",
                          result.chi_signal && "χ²",
                        ]
                          .filter(Boolean)
                          .join(" + ")}{" "}
                        threshold(s) exceeded
                      </p>
                    </div>
                  ) : (
                    <div className="border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                      <p className="text-emerald-400 font-bold font-mono text-sm uppercase tracking-widest">
                        No Signal
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Crosshair className="h-6 w-6 text-slate-dim/15 mx-auto mb-3" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
                  Awaiting contingency data
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Station Lookup — Anatomy↔Station wire */}
      <div className="mt-4 border border-emerald-500/20 bg-emerald-500/[0.03]">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-500/10">
          <Globe className="h-3.5 w-3.5 text-emerald-400/60" />
          <span className="intel-label">Station Lookup</span>
          <span className="text-[8px] font-mono text-emerald-400/30 ml-auto">
            AlgoVigilance Station / OpenVigil
          </span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[10px] font-mono text-slate-dim/50">
            Fetch real disproportionality data from FAERS via AlgoVigilance
            Station, then analyze with pv-compute
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] font-mono uppercase tracking-widest text-emerald-400/40 block mb-1">
                Drug
              </label>
              <input
                type="text"
                value={stationDrug}
                onChange={(e) => setStationDrug(e.target.value)}
                placeholder="e.g. metformin"
                className="w-full bg-black/20 border border-emerald-500/20 px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-emerald-400/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[8px] font-mono uppercase tracking-widest text-emerald-400/40 block mb-1">
                Event (MedDRA PT)
              </label>
              <input
                type="text"
                value={stationEvent}
                onChange={(e) => setStationEvent(e.target.value)}
                placeholder="e.g. lactic acidosis"
                className="w-full bg-black/20 border border-emerald-500/20 px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-emerald-400/40 focus:outline-none"
              />
            </div>
          </div>
          <Button
            onClick={handleStationLookup}
            disabled={
              stationLoading || !stationDrug.trim() || !stationEvent.trim()
            }
            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] uppercase tracking-widest"
          >
            {stationLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <Globe className="h-3.5 w-3.5 mr-2" />
            )}
            Fetch from Station
          </Button>

          {stationError && (
            <div className="border border-red-500/30 bg-red-500/5 p-3">
              <p className="text-red-400/80 text-xs font-mono">
                {stationError}
              </p>
            </div>
          )}

          {stationResult && (
            <div className="border border-emerald-500/20 bg-emerald-500/[0.02] p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/50">
                  {stationResult.drug} + {stationResult.event}
                </span>
                <span className="text-[8px] font-mono text-emerald-400/30">
                  via AlgoVigilance Station
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[9px] font-mono">
                <div className="text-center">
                  <div className="text-slate-dim/30">a</div>
                  <div className="text-white font-bold">
                    {stationResult.contingencyTable.a.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-dim/30">b</div>
                  <div className="text-white font-bold">
                    {stationResult.contingencyTable.b.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-dim/30">c</div>
                  <div className="text-white font-bold">
                    {stationResult.contingencyTable.c.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-dim/30">d</div>
                  <div className="text-white font-bold">
                    {stationResult.contingencyTable.d.toLocaleString()}
                  </div>
                </div>
              </div>
              <p className="text-[8px] font-mono text-emerald-400/30 text-center">
                Contingency table auto-loaded into calculator above
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CellInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute top-1 left-2 text-[8px] font-mono text-cyan/30">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/20 border border-white/[0.08] px-3 pt-4 pb-2 text-sm font-mono text-white focus:border-cyan/40 focus:outline-none"
      />
    </div>
  );
}
