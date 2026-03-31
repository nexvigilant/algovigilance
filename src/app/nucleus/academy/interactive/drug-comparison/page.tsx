"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FlaskConical,
  Info,
  Plus,
  Trash2,
  BarChart3,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  computeSignals,
  type ContingencyTable,
  type SignalResult,
} from "@/lib/pv-compute";
import { fetchLiveSignal, type StationSignalResult } from "../station-client";

// ─── Mock drug database ───────────────────────────────────────────────────────
// Pre-loaded profiles with real-world FAERS-derived contingency tables
// across five adverse events. Used without external API calls.

interface DrugEventProfile {
  event: string;
  table: ContingencyTable;
}

interface DrugProfile {
  name: string;
  class: string;
  events: DrugEventProfile[];
}

const DRUG_PROFILES: Record<string, DrugProfile> = {
  semaglutide: {
    name: "Semaglutide",
    class: "GLP-1 RA",
    events: [
      { event: "Pancreatitis", table: { a: 2068, b: 108932, c: 65421, d: 19823579 } },
      { event: "Nausea", table: { a: 18432, b: 92568, c: 234000, d: 19655000 } },
      { event: "Thyroid cancer", table: { a: 312, b: 110688, c: 4200, d: 19884800 } },
      { event: "Hypoglycemia", table: { a: 1040, b: 109960, c: 89200, d: 19799800 } },
      { event: "Injection site reaction", table: { a: 890, b: 110110, c: 12400, d: 19876600 } },
    ],
  },
  liraglutide: {
    name: "Liraglutide",
    class: "GLP-1 RA",
    events: [
      { event: "Pancreatitis", table: { a: 1834, b: 94166, c: 65421, d: 19838579 } },
      { event: "Nausea", table: { a: 16200, b: 79800, c: 234000, d: 19670000 } },
      { event: "Thyroid cancer", table: { a: 278, b: 95722, c: 4200, d: 19899800 } },
      { event: "Hypoglycemia", table: { a: 980, b: 95020, c: 89200, d: 19814800 } },
      { event: "Injection site reaction", table: { a: 1240, b: 94760, c: 12400, d: 19891600 } },
    ],
  },
  metformin: {
    name: "Metformin",
    class: "Biguanide",
    events: [
      { event: "Lactic acidosis", table: { a: 1534, b: 254321, c: 12876, d: 19731269 } },
      { event: "Nausea", table: { a: 22000, b: 233855, c: 234000, d: 19510145 } },
      { event: "Vitamin B12 deficiency", table: { a: 3200, b: 252655, c: 8900, d: 19735245 } },
      { event: "Hypoglycemia", table: { a: 2100, b: 253755, c: 89200, d: 19654945 } },
      { event: "Diarrhea", table: { a: 19800, b: 236055, c: 98000, d: 19646145 } },
    ],
  },
  atorvastatin: {
    name: "Atorvastatin",
    class: "Statin",
    events: [
      { event: "Rhabdomyolysis", table: { a: 876, b: 312450, c: 8934, d: 19677740 } },
      { event: "Myalgia", table: { a: 14200, b: 299126, c: 38000, d: 19648674 } },
      { event: "Liver toxicity", table: { a: 1240, b: 312086, c: 18000, d: 19668674 } },
      { event: "Nausea", table: { a: 8900, b: 304426, c: 234000, d: 19452674 } },
      { event: "Memory impairment", table: { a: 2340, b: 310986, c: 9800, d: 19676874 } },
    ],
  },
  rosuvastatin: {
    name: "Rosuvastatin",
    class: "Statin",
    events: [
      { event: "Rhabdomyolysis", table: { a: 634, b: 189366, c: 8934, d: 19801066 } },
      { event: "Myalgia", table: { a: 10800, b: 179200, c: 38000, d: 19772000 } },
      { event: "Liver toxicity", table: { a: 890, b: 189110, c: 18000, d: 19792000 } },
      { event: "Nausea", table: { a: 6700, b: 183300, c: 234000, d: 19576000 } },
      { event: "Memory impairment", table: { a: 1560, b: 188440, c: 9800, d: 19800200 } },
    ],
  },
  warfarin: {
    name: "Warfarin",
    class: "Anticoagulant",
    events: [
      { event: "Bleeding", table: { a: 34500, b: 111500, c: 89000, d: 19765000 } },
      { event: "Intracranial hemorrhage", table: { a: 4200, b: 141800, c: 8900, d: 19845100 } },
      { event: "Skin necrosis", table: { a: 680, b: 145320, c: 2100, d: 19851900 } },
      { event: "Nausea", table: { a: 7800, b: 138200, c: 234000, d: 19620000 } },
      { event: "Hair loss", table: { a: 2100, b: 143900, c: 12000, d: 19842000 } },
    ],
  },
  apixaban: {
    name: "Apixaban",
    class: "DOAC",
    events: [
      { event: "Bleeding", table: { a: 22100, b: 143900, c: 89000, d: 19745000 } },
      { event: "Intracranial hemorrhage", table: { a: 1800, b: 164200, c: 8900, d: 19825100 } },
      { event: "Skin necrosis", table: { a: 120, b: 165880, c: 2100, d: 19831900 } },
      { event: "Nausea", table: { a: 5600, b: 160400, c: 234000, d: 19600000 } },
      { event: "Hair loss", table: { a: 890, b: 165110, c: 12000, d: 19822000 } },
    ],
  },
  amoxicillin: {
    name: "Amoxicillin",
    class: "Antibiotic",
    events: [
      { event: "Anaphylaxis", table: { a: 2340, b: 198760, c: 4500, d: 19794400 } },
      { event: "Rash", table: { a: 12800, b: 188300, c: 28000, d: 19771900 } },
      { event: "Diarrhea", table: { a: 18400, b: 182700, c: 98000, d: 19700900 } },
      { event: "Nausea", table: { a: 9800, b: 192300, c: 234000, d: 19563900 } },
      { event: "C. difficile colitis", table: { a: 3400, b: 197700, c: 12000, d: 19786900 } },
    ],
  },
};

const DRUG_KEYS = Object.keys(DRUG_PROFILES);
const MAX_DRUGS = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "name" | "prr" | "ror" | "signals";
type SortDir = "asc" | "desc";

// ─── Signal cell ─────────────────────────────────────────────────────────────

function SignalBar({ value, max, signal }: { value: number; max: number; signal: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "text-xs font-mono font-bold tabular-nums w-12 text-right shrink-0",
          signal ? "text-red-400" : "text-white/40",
        )}
      >
        {isFinite(value) ? value.toFixed(2) : "Inf"}
      </span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            signal ? "bg-red-500/70" : "bg-zinc-600",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Drug row in comparison table ────────────────────────────────────────────

interface DrugRowData {
  key: string;
  profile: DrugProfile;
  signals: (SignalResult | null)[];
  signalCount: number;
  maxPrr: number;
  maxRor: number;
}

// ─── Drug selector pill ──────────────────────────────────────────────────────

function DrugPill({
  drugKey,
  onRemove,
}: {
  drugKey: string;
  onRemove: () => void;
}) {
  const profile = DRUG_PROFILES[drugKey];
  if (!profile) return null;
  return (
    <div className="flex items-center gap-1.5 rounded border border-cyan-500/30 bg-cyan-500/5 px-2 py-1">
      <span className="text-xs font-medium text-cyan-300">{profile.name}</span>
      <span className="text-[9px] text-cyan-400/40 font-mono">{profile.class}</span>
      <button
        onClick={onRemove}
        className="ml-1 text-white/20 hover:text-red-400 transition-colors"
        aria-label={`Remove ${profile.name}`}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DrugComparisonLab() {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>(["semaglutide", "liraglutide"]);
  const [sortKey, setSortKey] = useState<SortKey>("prr");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [liveResults, setLiveResults] = useState<Record<string, StationSignalResult>>({});
  const [liveLoading, setLiveLoading] = useState(false);

  const fetchLiveComparison = useCallback(async () => {
    setLiveLoading(true);
    try {
      const results: Record<string, StationSignalResult> = {};
      const pairs = selectedDrugs.flatMap((dk) => {
        const profile = DRUG_PROFILES[dk];
        if (!profile) return [];
        return profile.events.slice(0, 3).map((e) => ({
          key: `${dk}:${e.event}`,
          drug: profile.name.toLowerCase(),
          event: e.event.toLowerCase(),
        }));
      });
      const fetches = await Promise.all(
        pairs.map(async (p) => {
          const r = await fetchLiveSignal(p.drug, p.event);
          return { key: p.key, result: r };
        }),
      );
      for (const f of fetches) {
        if (f.result) results[f.key] = f.result;
      }
      setLiveResults(results);
    } finally {
      setLiveLoading(false);
    }
  }, [selectedDrugs]);

  // The set of events is the union of all selected drugs' events
  const allEvents = useMemo(() => {
    const eventSet = new Set<string>();
    selectedDrugs.forEach((dk) => {
      DRUG_PROFILES[dk]?.events.forEach((e) => eventSet.add(e.event));
    });
    return Array.from(eventSet);
  }, [selectedDrugs]);

  // Compute signals per drug per event
  const drugRows: DrugRowData[] = useMemo(() => {
    return selectedDrugs
      .map((dk) => {
        const profile = DRUG_PROFILES[dk];
        if (!profile) return null;
        const signals = allEvents.map((evt) => {
          const ep = profile.events.find((e) => e.event === evt);
          if (!ep) return null;
          try {
            return computeSignals(ep.table);
          } catch {
            return null;
          }
        });
        const signalCount = signals.filter((s) => s?.any_signal).length;
        const maxPrr = signals.reduce((m, s) => (s ? Math.max(m, isFinite(s.prr) ? s.prr : 0) : m), 0);
        const maxRor = signals.reduce((m, s) => (s ? Math.max(m, isFinite(s.ror) ? s.ror : 0) : m), 0);
        return { key: dk, profile, signals, signalCount, maxPrr, maxRor };
      })
      .filter((r): r is DrugRowData => r !== null);
  }, [selectedDrugs, allEvents]);

  // Sorted rows
  const sortedRows = useMemo(() => {
    return [...drugRows].sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.profile.name.localeCompare(b.profile.name);
      else if (sortKey === "prr") diff = a.maxPrr - b.maxPrr;
      else if (sortKey === "ror") diff = a.maxRor - b.maxRor;
      else if (sortKey === "signals") diff = a.signalCount - b.signalCount;
      return sortDir === "asc" ? diff : -diff;
    });
  }, [drugRows, sortKey, sortDir]);

  // Column max values for bar scaling
  const maxPrrAll = useMemo(
    () => Math.max(...drugRows.map((r) => r.maxPrr), 1),
    [drugRows],
  );

  const handleAddDrug = useCallback(
    (dk: string) => {
      if (selectedDrugs.length >= MAX_DRUGS) return;
      if (!selectedDrugs.includes(dk)) {
        setSelectedDrugs((prev) => [...prev, dk]);
      }
    },
    [selectedDrugs],
  );

  const handleRemoveDrug = useCallback((dk: string) => {
    setSelectedDrugs((prev) => prev.filter((d) => d !== dk));
  }, []);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  const availableToAdd = DRUG_KEYS.filter((dk) => !selectedDrugs.includes(dk));

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-golden-4">
      {/* Header */}
      <header className="mb-golden-3 text-center pt-golden-3">
        <div className="flex items-center justify-center gap-2 mb-golden-1">
          <FlaskConical className="h-5 w-5 text-cyan-400" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            Academy Lab
          </p>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
          Drug Safety Comparison Lab
        </h1>
        <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
          Compare{" "}
          <JargonBuster
            term="disproportionality"
            definition="Statistical methods comparing observed drug-event reporting frequency against the background rate. A high PRR or ROR suggests the drug is reported with the event more than expected."
          >
            disproportionality
          </JargonBuster>{" "}
          signals side-by-side across 2–4 drugs. All computations run in your
          browser using mock FAERS-derived data.
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-4 space-y-4">
        {/* Drug selector */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-white/40">
              Selected Drugs ({selectedDrugs.length}/{MAX_DRUGS})
            </h2>
            <span className="text-[10px] font-mono text-white/20">
              Select up to {MAX_DRUGS} to compare
            </span>
          </div>

          {/* Selected pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedDrugs.map((dk) => (
              <DrugPill
                key={dk}
                drugKey={dk}
                onRemove={() => handleRemoveDrug(dk)}
              />
            ))}
            {selectedDrugs.length === 0 && (
              <span className="text-xs text-white/20 italic">
                No drugs selected — add from the list below
              </span>
            )}
          </div>

          {/* Add drug buttons */}
          {availableToAdd.length > 0 && selectedDrugs.length < MAX_DRUGS && (
            <div>
              <p className="text-[10px] font-mono text-white/20 mb-2 uppercase tracking-wider">
                Add a drug
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableToAdd.map((dk) => {
                  const p = DRUG_PROFILES[dk];
                  return (
                    <button
                      key={dk}
                      onClick={() => handleAddDrug(dk)}
                      className="flex items-center gap-1 rounded border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-white/40 hover:text-white/70 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      {p.name}
                      <span className="text-[9px] text-white/20">{p.class}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
          <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-cyan-300/80 leading-relaxed">
            PRR and ROR are computed from mock FAERS-derived contingency tables.
            Signal threshold:{" "}
            <span className="font-mono">PRR &gt;= 2.0</span> or{" "}
            <span className="font-mono">ROR lower CI &gt; 1.0</span>.{" "}
            <span className="text-red-400/80">Red</span> = signal detected.
          </p>
        </div>

        {/* Summary cards */}
        {sortedRows.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sortedRows.map((row) => (
              <div
                key={row.key}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center"
              >
                <p className="text-sm font-semibold text-white truncate">
                  {row.profile.name}
                </p>
                <p className="text-[10px] font-mono text-white/30 mb-2">
                  {row.profile.class}
                </p>
                <div
                  className={cn(
                    "text-2xl font-bold font-mono tabular-nums",
                    row.signalCount > 2
                      ? "text-red-400"
                      : row.signalCount > 0
                        ? "text-amber-400"
                        : "text-emerald-400",
                  )}
                >
                  {row.signalCount}
                </div>
                <p className="text-[10px] text-white/30">
                  signal{row.signalCount !== 1 ? "s" : ""} detected
                </p>
                <p className="text-[10px] font-mono text-white/40 mt-1">
                  Max PRR:{" "}
                  <span className="text-white/60">
                    {row.maxPrr.toFixed(2)}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Event-by-event comparison table */}
        {sortedRows.length >= 2 && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
            {/* Sort controls */}
            <div className="flex items-center gap-1 border-b border-white/10 p-3">
              <BarChart3 className="h-4 w-4 text-white/40 shrink-0" />
              <span className="text-xs font-mono uppercase tracking-wider text-white/40 mr-3">
                Sort by
              </span>
              {(
                [
                  { key: "name" as SortKey, label: "Name" },
                  { key: "prr" as SortKey, label: "Max PRR" },
                  { key: "ror" as SortKey, label: "Max ROR" },
                  { key: "signals" as SortKey, label: "Signals" },
                ] as { key: SortKey; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSort(opt.key)}
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded transition-colors",
                    sortKey === opt.key
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "text-white/30 hover:text-white/50",
                  )}
                >
                  {opt.label}
                  {sortKey === opt.key && (
                    <ArrowUpDown className="h-2.5 w-2.5" />
                  )}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left font-mono uppercase tracking-wider text-white/30 p-3 w-40">
                      Adverse Event
                    </th>
                    {sortedRows.map((row) => (
                      <th
                        key={row.key}
                        className="text-center font-mono uppercase tracking-wider text-white/30 p-3 min-w-[140px]"
                      >
                        <div className="text-white/70 font-semibold">
                          {row.profile.name}
                        </div>
                        <div className="text-[9px] text-white/20">
                          {row.profile.class}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allEvents.map((evt, ei) => (
                    <tr
                      key={evt}
                      className={cn(
                        "border-b border-white/5",
                        ei % 2 === 0 ? "bg-white/[0.01]" : "",
                      )}
                    >
                      <td className="p-3 text-white/60 font-medium">{evt}</td>
                      {sortedRows.map((row) => {
                        const sig = row.signals[allEvents.indexOf(evt)];
                        if (!sig) {
                          return (
                            <td
                              key={row.key}
                              className="p-3 text-center text-white/15 font-mono"
                            >
                              —
                            </td>
                          );
                        }
                        return (
                          <td key={row.key} className="p-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-mono text-white/30 w-7">
                                  PRR
                                </span>
                                <SignalBar
                                  value={sig.prr}
                                  max={maxPrrAll}
                                  signal={sig.prr_signal}
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-mono text-white/30 w-7">
                                  ROR
                                </span>
                                <SignalBar
                                  value={sig.ror}
                                  max={maxPrrAll * 2}
                                  signal={sig.ror_signal}
                                />
                              </div>
                              {sig.any_signal && (
                                <div className="text-[9px] font-mono text-red-400/70 text-right">
                                  SIGNAL
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {selectedDrugs.length < 2 && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
            <BarChart3 className="h-8 w-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">
              Select at least 2 drugs to see the comparison table
            </p>
          </div>
        )}

        {/* Station verification — Academy→Glass bridge */}
        {selectedDrugs.length >= 2 && (
          <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-violet-400">
                Verify with AlgoVigilance Station
              </h3>
              {Object.keys(liveResults).length > 0 && (
                <span className="text-[10px] font-mono text-violet-400/50">
                  {Object.keys(liveResults).length} live results
                </span>
              )}
            </div>
            {Object.keys(liveResults).length === 0 ? (
              <button
                onClick={fetchLiveComparison}
                disabled={liveLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
              >
                {liveLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                    Querying live FAERS data...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    Compare with Live FAERS Data
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(liveResults).map(([key, r]) => {
                  const [drug, event] = key.split(":");
                  return (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-white/50">
                        {DRUG_PROFILES[drug]?.name ?? drug} × {event}
                      </span>
                      <span className="font-mono text-violet-300">
                        PRR {r.prr?.toFixed(2) ?? "—"}
                        {r.signal ? " ⚠" : ""}
                      </span>
                    </div>
                  );
                })}
                <p className="text-[10px] text-white/30 mt-1">
                  Live data from mcp.nexvigilant.com — the same API AI agents use.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Academy → Glass Bridge */}
        <Link
          href="/nucleus/glass/signal-lab"
          className="block w-full rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-violet-500/10 p-4 hover:from-amber-500/15 hover:to-violet-500/15 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-amber-400/70 mb-1">
                Ready for live comparison?
              </p>
              <p className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                Try it live in Glass Signal Lab
              </p>
              <p className="text-xs text-white/40 mt-1">
                Compare any drugs with live FAERS data from mcp.nexvigilant.com
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </Link>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-white/30">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500/70" />
            Signal detected
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-zinc-600" />
            No signal
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/20">—</span>
            Event not in profile
          </div>
        </div>
      </div>
    </div>
  );
}
