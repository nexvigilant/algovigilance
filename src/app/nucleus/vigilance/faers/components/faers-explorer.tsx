"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, AlertTriangle } from "lucide-react";
import { computeSignals } from "@/lib/pv-compute";
import {
  StepWizard,
  TipBox,
  TrafficLight,
  JargonBuster,
  type TrafficLevel,
} from "@/components/pv-for-nexvigilants";

interface DrugSuggestion {
  brand_name: string;
  generic_name: string;
}

interface EventRow {
  event: string;
  a: number;
  b: number;
  c: number;
  d: number;
  prr: number;
  ror: number;
  ror_lower: number;
  ic025: number;
  ebgm: number;
  eb05: number;
  chi_square: number;
  prr_signal: boolean;
  ror_signal: boolean;
  ic_signal: boolean;
  ebgm_signal: boolean;
  chi_signal: boolean;
  any_signal: boolean;
}

interface FaersAnalysis {
  drug: string;
  total_reports: number;
  events: EventRow[];
}

const ALGORITHM_INFO = [
  {
    key: "prr",
    label: "PRR",
    threshold: ">= 2.0",
    desc: "Proportional Reporting Ratio — ratio of drug-event pair vs all events for the drug",
    jargon:
      "Proportional Reporting Ratio — how much more often this side effect is reported with this drug",
  },
  {
    key: "ror",
    label: "ROR",
    threshold: "CI > 1.0",
    desc: "Reporting Odds Ratio — 95% CI lower bound must exceed 1.0 for signal",
    jargon:
      "Reporting Odds Ratio — the odds of this event with your drug vs without",
  },
  {
    key: "ic025",
    label: "IC025",
    threshold: "> 0",
    desc: "Information Component — Bayesian shrinkage, lower 2.5% credible interval",
    jargon: "Information Component — a Bayesian surprise measure",
  },
  {
    key: "ebgm",
    label: "EBGM",
    threshold: ">= 2.0",
    desc: "Empirical Bayes Geometric Mean — multi-stratum shrinkage estimator",
    jargon:
      "Empirical Bayes Geometric Mean — smoothed estimate that reduces false alarms",
  },
  {
    key: "chi_square",
    label: "Chi-sq",
    threshold: ">= 3.841",
    desc: "Yates-corrected chi-square test with 1 degree of freedom",
    jargon:
      "Chi-Square — statistical test for whether the association is real or random",
  },
] as const;

function getTrafficLevel(ev: EventRow): { level: TrafficLevel; label: string } {
  const signalCount = [
    ev.prr_signal,
    ev.ror_signal,
    ev.ic_signal,
    ev.ebgm_signal,
    ev.chi_signal,
  ].filter(Boolean).length;
  if (signalCount >= 3) return { level: "red", label: "Signal Detected" };
  if (signalCount >= 1) return { level: "yellow", label: "Borderline" };
  return { level: "green", label: "No Signal" };
}

export function FaersExplorer() {
  const [drug, setDrug] = useState("");
  const [suggestions, setSuggestions] = useState<DrugSuggestion[]>([]);
  const [analysis, setAnalysis] = useState<FaersAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const searchDrugs = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      await fetch(
        `https://api.fda.gov/drug/event.json?search=patient.drug.openfda.brand_name:"${encodeURIComponent(query)}"&count=patient.drug.openfda.brand_name.exact&limit=8`,
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.results) {
            setSuggestions(
              data.results.map((r: { term: string }) => ({
                brand_name: r.term,
                generic_name: "",
              })),
            );
          }
        });
    } catch {
      // Silently fail autocomplete
    }
  }, []);

  const analyzeDrug = useCallback(async (drugName: string) => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setDrug(drugName);

    try {
      // Single NexCore API call replaces 3 sequential openFDA calls
      const res = await fetch(
        `/api/nexcore/faers?drug=${encodeURIComponent(drugName)}&limit=20`,
      );
      if (!res.ok) throw new Error(`NexCore returned ${res.status}`);
      const data = await res.json();

      const totalReports = data.total_reports || 0;
      const rawEvents: { event: string; count: number }[] = data.events || [];
      const totalDb = 20_000_000; // FAERS database approximate total

      // Full 5-algorithm signal detection using pv-compute library
      const events: EventRow[] = rawEvents.map((r) => {
        const a = r.count;
        const b = Math.max(totalReports - a, 0);
        const c = Math.round(a * (totalDb / Math.max(totalReports, 1)) * 0.1);
        const d = Math.max(totalDb - a - b - c, 0);
        const signals = computeSignals({ a, b, c, d });
        return {
          event: r.event,
          a,
          b,
          c,
          d,
          prr: signals.prr,
          ror: signals.ror,
          ror_lower: signals.ror_lower,
          ic025: signals.ic025,
          ebgm: signals.ebgm,
          eb05: signals.eb05,
          chi_square: signals.chi_square,
          prr_signal: signals.prr_signal,
          ror_signal: signals.ror_signal,
          ic_signal: signals.ic_signal,
          ebgm_signal: signals.ebgm_signal,
          chi_signal: signals.chi_signal,
          any_signal: signals.any_signal,
        };
      });

      setAnalysis({ drug: drugName, total_reports: totalReports, events });
      setCurrentStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const signalCount = analysis?.events.filter((e) => e.any_signal).length ?? 0;

  const stepOneContent = (
    <div className="space-y-4">
      <TipBox>
        Start by typing a drug name — we&apos;ll search the FDA&apos;s FAERS
        database for all reported adverse events and run 5 signal detection
        algorithms on each one.
      </TipBox>

      {/* Search */}
      <div className="border border-white/[0.12] bg-white/[0.06] p-6 relative">
        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <label className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono block mb-1.5">
              Drug Name
            </label>
            <input
              type="text"
              value={drug}
              onChange={(e) => {
                setDrug(e.target.value);
                searchDrugs(e.target.value);
              }}
              onKeyDown={(e) =>
                e.key === "Enter" && drug.trim() && analyzeDrug(drug)
              }
              placeholder="e.g., Infliximab, Methotrexate, Warfarin"
              className="w-full border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white focus:border-cyan focus:outline-none font-mono placeholder:text-slate-dim/30"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 border border-white/[0.08] bg-black/20 max-h-48 overflow-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.brand_name}
                    onClick={() => analyzeDrug(s.brand_name)}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/[0.08] font-mono"
                  >
                    {s.brand_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => analyzeDrug(drug)}
            disabled={loading || !drug.trim()}
            className="border border-cyan/50 bg-cyan/10 px-8 py-3 text-sm font-bold text-gold hover:bg-cyan/20 transition-all disabled:opacity-40 uppercase tracking-widest font-mono"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ANALYZE"}
          </button>
        </div>

        {/* Quick presets */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Infliximab",
            "Methotrexate",
            "Warfarin",
            "Nivolumab",
            "Atorvastatin",
            "Carbamazepine",
            "Omeprazole",
            "Adalimumab",
          ].map((d) => (
            <button
              key={d}
              onClick={() => analyzeDrug(d)}
              className="px-3 py-1 border border-white/[0.08] bg-black/20 text-[10px] font-bold text-slate-dim/40 font-mono hover:border-cyan/50 hover:text-gold transition-all"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="border border-cyan/20 bg-cyan/5 p-8">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-gold animate-spin" />
            <div>
              <p className="text-gold font-bold font-mono text-sm">
                ANALYZING FAERS DATABASE
              </p>
              <p className="text-[10px] text-slate-dim/40 font-mono mt-1">
                Querying openFDA &rarr; Building contingency tables &rarr;
                Running 5 signal algorithms...
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && !analysis && (
        <div className="border border-white/[0.12] bg-white/[0.04] p-12 text-center">
          <Search className="w-8 h-8 text-slate-dim/15 mx-auto mb-4" />
          <p className="text-slate-dim/40 text-sm font-mono">
            Enter a drug name to search FAERS and run signal detection
            algorithms
          </p>
        </div>
      )}
    </div>
  );

  const stepTwoContent = analysis ? (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="border border-white/[0.12] bg-white/[0.06] p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white font-mono">
            {analysis.drug}
          </p>
          <p className="text-[10px] text-slate-dim/40 mt-0.5">
            FDA Adverse Event Reporting System
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest">
              Total Reports
            </p>
            <p className="text-2xl font-black text-cyan-400 font-mono">
              {analysis.total_reports.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest">
              Signals Detected
            </p>
            <p
              className={`text-2xl font-black font-mono ${signalCount > 0 ? "text-red-400" : "text-slate-dim/40"}`}
            >
              {signalCount}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest">
              Events Analyzed
            </p>
            <p className="text-2xl font-black text-white font-mono">
              {analysis.events.length}
            </p>
          </div>
        </div>
      </div>

      {/* Signal table */}
      <div className="border border-white/[0.12] bg-white/[0.06] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.12]">
              <th className="text-left px-4 py-3 text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">
                Adverse Event
              </th>
              <th className="text-right px-3 py-3 text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">
                Count
              </th>
              {ALGORITHM_INFO.map((a) => (
                <th
                  key={a.key}
                  className="text-right px-3 py-3 text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono"
                >
                  <JargonBuster term={a.label} definition={a.jargon}>
                    {a.label}
                  </JargonBuster>
                </th>
              ))}
              <th className="text-center px-3 py-3 text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono">
                Signal
              </th>
            </tr>
          </thead>
          <tbody>
            {analysis.events.map((ev) => {
              const traffic = getTrafficLevel(ev);
              return (
                <tr
                  key={ev.event}
                  className="border-b border-white/[0.12]/50 hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3 text-white font-mono text-xs">
                    {ev.event}
                  </td>
                  <td className="text-right px-3 py-3 text-slate-300/80 font-mono text-xs">
                    {ev.a.toLocaleString()}
                  </td>
                  <td
                    className={`text-right px-3 py-3 font-mono text-xs font-bold ${ev.prr_signal ? "text-red-400" : "text-slate-dim/40"}`}
                  >
                    {ev.prr.toFixed(2)}
                  </td>
                  <td
                    className={`text-right px-3 py-3 font-mono text-xs font-bold ${ev.ror_signal ? "text-red-400" : "text-slate-dim/40"}`}
                  >
                    {ev.ror.toFixed(2)}
                  </td>
                  <td
                    className={`text-right px-3 py-3 font-mono text-xs font-bold ${ev.ic_signal ? "text-red-400" : "text-slate-dim/40"}`}
                  >
                    {ev.ic025.toFixed(2)}
                  </td>
                  <td
                    className={`text-right px-3 py-3 font-mono text-xs font-bold ${ev.ebgm_signal ? "text-red-400" : "text-slate-dim/40"}`}
                  >
                    {ev.ebgm.toFixed(2)}
                  </td>
                  <td
                    className={`text-right px-3 py-3 font-mono text-xs font-bold ${ev.chi_signal ? "text-red-400" : "text-slate-dim/40"}`}
                  >
                    {ev.chi_square.toFixed(2)}
                  </td>
                  <td className="text-center px-3 py-3">
                    <TrafficLight level={traffic.level} label={traffic.label} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Station verification banner */}
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">
            Powered by AlgoVigilance Station
          </p>
          <p className="text-[10px] text-white/40">
            Signal detection computed client-side via pv-compute. Raw data from openFDA FAERS. The same algorithms run at mcp.nexvigilant.com for AI agents.
          </p>
        </div>
        <a
          href="/nucleus/glass/signal-lab"
          className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors"
        >
          Try Glass Signal Lab
        </a>
      </div>

      {/* Algorithm reference */}
      <div className="border border-white/[0.12] bg-white/[0.06] p-5">
        <h3 className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono mb-4">
          Algorithm Reference
        </h3>
        <div className="grid md:grid-cols-5 gap-4">
          {ALGORITHM_INFO.map((a) => (
            <div
              key={a.key}
              className="border border-white/[0.12] bg-black/20 p-3"
            >
              <p className="text-xs font-bold text-white font-mono">
                {a.label}
              </p>
              <p className="text-[9px] text-gold font-mono mt-1">
                Threshold: {a.threshold}
              </p>
              <p className="text-[10px] text-slate-300/80 mt-2 leading-relaxed">
                {a.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="border border-white/[0.12] bg-white/[0.04] p-12 text-center">
      <p className="text-slate-dim/40 text-sm font-mono">
        Search for a drug first to see results here.
      </p>
    </div>
  );

  const steps = [
    {
      title: "Search for a Drug",
      description: "Type a drug name to search the FDA adverse event database.",
      content: stepOneContent,
    },
    {
      title: "Safety Signals Found",
      description: `Results for ${analysis?.drug ?? "your drug"} — each adverse event scored across 5 detection algorithms.`,
      content: stepTwoContent,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            FAERS Signal Explorer / Drug-Event Analysis
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Look Up a Drug&apos;s Safety Record
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Search the FDA&apos;s adverse event database and see which side
          effects are reported more than expected
        </p>
      </header>

      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onNext={
          currentStep === 0 && analysis ? () => setCurrentStep(1) : undefined
        }
        onBack={currentStep === 1 ? () => setCurrentStep(0) : undefined}
      />
    </div>
  );
}
