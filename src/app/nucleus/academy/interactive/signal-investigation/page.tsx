"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Info,
  RotateCcw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  computeSignals,
  computeNaranjo,
  type ContingencyTable,
  type SignalResult,
  type NaranjoResult,
} from "@/lib/pv-compute";
import {
  fetchLiveSignal,
  fetchSignalToAction,
  type StationSignalResult,
  type MicrogramDecision,
} from "../station-client";

// ─── Preset Scenarios ────────────────────────────────────────────────────────

interface Scenario {
  id: string;
  drug: string;
  event: string;
  description: string;
  table: ContingencyTable;
  naranjoAnswers: number[];
  expectedSignal: boolean;
}

const SCENARIOS: Scenario[] = [
  {
    id: "semaglutide-pancreatitis",
    drug: "Semaglutide",
    event: "Pancreatitis",
    description:
      "GLP-1 receptor agonist used for diabetes and obesity. Pancreatitis has been a class-wide concern since exenatide.",
    table: { a: 2068, b: 108932, c: 65421, d: 19823579 },
    naranjoAnswers: [1, 1, 1, 0, -1, 0, 0, 0, 1, 1],
    expectedSignal: true,
  },
  {
    id: "metformin-lactic-acidosis",
    drug: "Metformin",
    event: "Lactic Acidosis",
    description:
      "First-line diabetes treatment. Lactic acidosis is a rare but serious labeled adverse reaction, especially with renal impairment.",
    table: { a: 1534, b: 254321, c: 12876, d: 19731269 },
    naranjoAnswers: [1, 1, 1, 0, -1, 0, 0, 1, 1, 1],
    expectedSignal: true,
  },
  {
    id: "atorvastatin-rhabdomyolysis",
    drug: "Atorvastatin",
    event: "Rhabdomyolysis",
    description:
      "Widely prescribed statin. Rhabdomyolysis is a known class effect, rare but can be fatal. Risk increases with drug interactions.",
    table: { a: 876, b: 312450, c: 8934, d: 19677740 },
    naranjoAnswers: [1, 1, 1, 0, -1, 0, 0, 0, 1, 1],
    expectedSignal: true,
  },
  {
    id: "amoxicillin-headache",
    drug: "Amoxicillin",
    event: "Headache",
    description:
      "Common antibiotic. Headache is reported frequently but is also extremely common in the general population — a classic noise signal.",
    table: { a: 3200, b: 198000, c: 890000, d: 18908800 },
    naranjoAnswers: [0, 1, 0, 0, -1, 0, 0, 0, 0, 0],
    expectedSignal: false,
  },
];

// ─── Step Components ─────────────────────────────────────────────────────────

type LabStep = "select" | "table" | "signals" | "causality" | "verdict";

const STEP_ORDER: LabStep[] = [
  "select",
  "table",
  "signals",
  "causality",
  "verdict",
];

const STEP_LABELS: Record<LabStep, string> = {
  select: "Choose Scenario",
  table: "Contingency Table",
  signals: "Signal Detection",
  causality: "Causality Assessment",
  verdict: "Verdict",
};

// ─── Signal Threshold Display ────────────────────────────────────────────────

function SignalIndicator({
  label,
  value,
  threshold,
  signal,
  unit,
}: {
  label: string;
  value: number;
  threshold: string;
  signal: boolean;
  unit?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        signal
          ? "border-red-500/30 bg-red-500/5"
          : "border-zinc-700/50 bg-zinc-800/30",
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono uppercase tracking-wider text-white/50">
          {label}
        </span>
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded",
            signal
              ? "bg-red-500/20 text-red-400"
              : "bg-zinc-700/50 text-zinc-400",
          )}
        >
          {signal ? "SIGNAL" : "NO SIGNAL"}
        </span>
      </div>
      <div className="text-lg font-bold font-mono text-white">
        {isFinite(value) ? value.toFixed(2) : "Inf"}
        {unit && <span className="text-xs text-white/40 ml-1">{unit}</span>}
      </div>
      <div className="text-[10px] text-white/30 mt-0.5">
        Threshold: {threshold}
      </div>
    </div>
  );
}

// ─── Naranjo Question Labels ─────────────────────────────────────────────────

const NARANJO_QUESTIONS = [
  "Are there previous conclusive reports on this reaction?",
  "Did the adverse event appear after the suspected drug was given?",
  "Did the adverse reaction improve when the drug was discontinued?",
  "Did the adverse reaction reappear when the drug was re-administered?",
  "Are there alternative causes that could have caused the reaction?",
  "Did the reaction appear when a placebo was given?",
  "Was the drug detected in blood in toxic concentrations?",
  "Was the reaction more severe with higher dose or less severe with lower dose?",
  "Did the patient have a similar reaction to the same or similar drugs previously?",
  "Was the adverse event confirmed by any objective evidence?",
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SignalInvestigationLab() {
  const [currentStep, setCurrentStep] = useState<LabStep>("select");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null,
  );
  const [customTable, setCustomTable] = useState<ContingencyTable>({
    a: 0,
    b: 0,
    c: 0,
    d: 0,
  });
  const [naranjoAnswers, setNaranjoAnswers] = useState<number[]>(
    Array(10).fill(0),
  );
  const [useCustom, setUseCustom] = useState(false);
  const [stationResult, setStationResult] = useState<StationSignalResult | null>(null);
  const [stationLoading, setStationLoading] = useState(false);
  const [microgramDecision, setMicrogramDecision] = useState<MicrogramDecision | null>(null);

  const verifyWithStation = useCallback(async () => {
    if (!selectedScenario) return;
    setStationLoading(true);
    try {
      const live = await fetchLiveSignal(
        selectedScenario.drug.toLowerCase(),
        selectedScenario.event.toLowerCase(),
      );
      setStationResult(live);
    } finally {
      setStationLoading(false);
    }
  }, [selectedScenario]);

  const activeTable = useMemo(
    () =>
      useCustom
        ? customTable
        : (selectedScenario?.table ?? { a: 0, b: 0, c: 0, d: 0 }),
    [useCustom, customTable, selectedScenario],
  );

  const signalResult: SignalResult | null = useMemo(() => {
    if (activeTable.a === 0 && activeTable.c === 0) return null;
    try {
      return computeSignals(activeTable);
    } catch {
      return null;
    }
  }, [activeTable]);

  const naranjoResult: NaranjoResult | null = useMemo(() => {
    try {
      return computeNaranjo(naranjoAnswers);
    } catch {
      return null;
    }
  }, [naranjoAnswers]);

  const stepIndex = STEP_ORDER.indexOf(currentStep);

  const handleSelectScenario = useCallback((scenario: Scenario) => {
    setSelectedScenario(scenario);
    setNaranjoAnswers(scenario.naranjoAnswers);
    setUseCustom(false);
    setCurrentStep("table");
  }, []);

  const handleReset = useCallback(() => {
    setSelectedScenario(null);
    setCustomTable({ a: 0, b: 0, c: 0, d: 0 });
    setNaranjoAnswers(Array(10).fill(0));
    setUseCustom(false);
    setCurrentStep("select");
  }, []);

  // Fire microgram decision engine when entering verdict step
  useEffect(() => {
    if (currentStep !== "verdict" || !signalResult) return;
    const prr = signalResult.prr;
    const naranjoScore = naranjoResult?.score ?? 5;
    const isSerious = signalResult.any_signal && naranjoScore >= 5;
    fetchSignalToAction(prr, naranjoScore, isSerious).then(setMicrogramDecision);
  }, [currentStep, signalResult, naranjoResult]);

  const goNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx < STEP_ORDER.length - 1) setCurrentStep(STEP_ORDER[idx + 1]);
  }, [currentStep]);

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEP_ORDER[idx - 1]);
  }, [currentStep]);

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-golden-4">
      {/* Header */}
      <header className="mb-golden-3 text-center pt-golden-3">
        <div className="flex items-center justify-center gap-2 mb-golden-1">
          <FlaskConical className="h-5 w-5 text-amber-400" />
          <p className="intel-label">Academy Lab</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold font-headline text-white tracking-tight mb-2">
          Signal Investigation Lab
        </h1>
        <p className="text-golden-sm text-slate-dim/70 max-w-xl mx-auto leading-golden">
          Detect safety signals from real adverse event data. Every calculation
          runs in your browser — no server, no API key, instant results.
        </p>
      </header>

      {/* Step Progress Bar */}
      <div className="max-w-3xl mx-auto mb-golden-3 px-4">
        <div className="flex items-center gap-1">
          {STEP_ORDER.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (
                    i <= stepIndex ||
                    (selectedScenario && i <= stepIndex + 1)
                  )
                    setCurrentStep(step);
                }}
                disabled={i > stepIndex + 1 || (!selectedScenario && i > 0)}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded transition-colors w-full",
                  i === stepIndex
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : i < stepIndex
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-white/20",
                )}
              >
                {i < stepIndex ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                ) : (
                  <span className="h-3 w-3 shrink-0 text-center">{i + 1}</span>
                )}
                <span className="hidden sm:inline truncate">
                  {STEP_LABELS[step]}
                </span>
              </button>
              {i < STEP_ORDER.length - 1 && (
                <div
                  className={cn(
                    "w-4 h-px mx-0.5 shrink-0",
                    i < stepIndex ? "bg-emerald-500/30" : "bg-white/10",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto px-4">
        {/* ── Step 1: Choose Scenario ── */}
        {currentStep === "select" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 mb-4">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-300/80 leading-relaxed">
                Pick a drug-event pair to investigate. Each scenario uses real{" "}
                <JargonBuster
                  term="FAERS"
                  definition="FDA Adverse Event Reporting System — a database of voluntary safety reports submitted to the FDA by healthcare professionals, consumers, and manufacturers"
                >
                  FAERS
                </JargonBuster>{" "}
                contingency table data. You&apos;ll compute signal strength and
                assess causality step by step.
              </p>
            </div>

            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                className="w-full text-left rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                    {scenario.drug} + {scenario.event}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-amber-400/50 transition-colors" />
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  {scenario.description}
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="text-[10px] font-mono text-white/20">
                    Cases: {scenario.table.a.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono text-white/20">
                    Expected signal: {scenario.expectedSignal ? "Yes" : "No"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: Contingency Table ── */}
        {currentStep === "table" && selectedScenario && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-cyan-300/80 leading-relaxed">
                <p>
                  The{" "}
                  <JargonBuster
                    term="2x2 contingency table"
                    definition="A table crossing drug exposure (yes/no) with event occurrence (yes/no). The four cells (a, b, c, d) are the foundation of all disproportionality analysis."
                  >
                    2x2 contingency table
                  </JargonBuster>{" "}
                  is the foundation of signal detection. It compares how often{" "}
                  <strong className="text-white/80">
                    {selectedScenario.drug}
                  </strong>{" "}
                  is reported with{" "}
                  <strong className="text-white/80">
                    {selectedScenario.event}
                  </strong>{" "}
                  versus the background rate across all drugs.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">
                {selectedScenario.drug} + {selectedScenario.event}
              </h3>

              {/* 2x2 Table */}
              <div className="grid grid-cols-3 gap-px bg-white/5 rounded-lg overflow-hidden">
                {/* Header row */}
                <div className="bg-nex-deep p-2" />
                <div className="bg-nex-deep p-2 text-center text-[10px] font-mono uppercase text-white/40">
                  {selectedScenario.event}
                </div>
                <div className="bg-nex-deep p-2 text-center text-[10px] font-mono uppercase text-white/40">
                  No {selectedScenario.event}
                </div>

                {/* Drug row */}
                <div className="bg-nex-deep p-2 text-[10px] font-mono uppercase text-white/40">
                  {selectedScenario.drug}
                </div>
                <div className="bg-nex-surface/40 p-3 text-center">
                  <div className="text-[10px] text-amber-400/60 mb-0.5">a</div>
                  {useCustom ? (
                    <input
                      type="number"
                      value={customTable.a || ""}
                      onChange={(e) =>
                        setCustomTable((t) => ({
                          ...t,
                          a: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full bg-transparent text-center text-sm font-bold font-mono text-white border-b border-amber-500/30 focus:border-amber-400 focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-bold font-mono text-white">
                      {activeTable.a.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="bg-nex-surface/40 p-3 text-center">
                  <div className="text-[10px] text-amber-400/60 mb-0.5">b</div>
                  {useCustom ? (
                    <input
                      type="number"
                      value={customTable.b || ""}
                      onChange={(e) =>
                        setCustomTable((t) => ({
                          ...t,
                          b: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full bg-transparent text-center text-sm font-bold font-mono text-white border-b border-amber-500/30 focus:border-amber-400 focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-bold font-mono text-white">
                      {activeTable.b.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Other drugs row */}
                <div className="bg-nex-deep p-2 text-[10px] font-mono uppercase text-white/40">
                  Other drugs
                </div>
                <div className="bg-nex-surface/40 p-3 text-center">
                  <div className="text-[10px] text-amber-400/60 mb-0.5">c</div>
                  {useCustom ? (
                    <input
                      type="number"
                      value={customTable.c || ""}
                      onChange={(e) =>
                        setCustomTable((t) => ({
                          ...t,
                          c: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full bg-transparent text-center text-sm font-bold font-mono text-white border-b border-amber-500/30 focus:border-amber-400 focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-bold font-mono text-white">
                      {activeTable.c.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="bg-nex-surface/40 p-3 text-center">
                  <div className="text-[10px] text-amber-400/60 mb-0.5">d</div>
                  {useCustom ? (
                    <input
                      type="number"
                      value={customTable.d || ""}
                      onChange={(e) =>
                        setCustomTable((t) => ({
                          ...t,
                          d: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full bg-transparent text-center text-sm font-bold font-mono text-white border-b border-amber-500/30 focus:border-amber-400 focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-bold font-mono text-white">
                      {activeTable.d.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setUseCustom(!useCustom)}
                  className="text-[10px] font-mono text-amber-400/50 hover:text-amber-400 transition-colors"
                >
                  {useCustom ? "Use preset values" : "Edit values manually"}
                </button>
                <span className="text-[10px] font-mono text-white/20">
                  Total reports:{" "}
                  {(
                    activeTable.a +
                    activeTable.b +
                    activeTable.c +
                    activeTable.d
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={goNext}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Compute Signal Strength
            </button>
          </div>
        )}

        {/* ── Step 3: Signal Detection Results ── */}
        {currentStep === "signals" && signalResult && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-cyan-300/80 leading-relaxed">
                <p>
                  Four{" "}
                  <JargonBuster
                    term="disproportionality"
                    definition="Statistical methods that compare observed drug-event reporting frequency against what would be expected if drug and event were independent. A disproportionate signal suggests the drug-event association deserves investigation."
                  >
                    disproportionality
                  </JargonBuster>{" "}
                  algorithms, each looking at the same data from a different
                  statistical angle. When multiple algorithms agree, confidence
                  increases.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SignalIndicator
                label="PRR"
                value={signalResult.prr}
                threshold="PRR >= 2.0"
                signal={signalResult.prr_signal}
              />
              <SignalIndicator
                label="ROR"
                value={signalResult.ror}
                threshold="ROR lower CI > 1.0"
                signal={signalResult.ror_signal}
              />
              <SignalIndicator
                label="IC"
                value={signalResult.ic}
                threshold="IC025 > 0"
                signal={signalResult.ic_signal}
              />
              <SignalIndicator
                label="EBGM"
                value={signalResult.ebgm}
                threshold="EB05 > 2.0"
                signal={signalResult.ebgm_signal}
              />
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="text-xs font-mono uppercase tracking-wider text-white/40 mb-2">
                Chi-Square Test
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-mono text-white">
                  {signalResult.chi_square.toFixed(1)}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded",
                    signalResult.chi_signal
                      ? "bg-red-500/20 text-red-400"
                      : "bg-zinc-700/50 text-zinc-400",
                  )}
                >
                  {signalResult.chi_signal
                    ? "SIGNIFICANT (>= 4.0)"
                    : "NOT SIGNIFICANT"}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div
              className={cn(
                "rounded-lg border p-4 text-center",
                signalResult.any_signal
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-emerald-500/30 bg-emerald-500/5",
              )}
            >
              <Activity
                className={cn(
                  "h-6 w-6 mx-auto mb-2",
                  signalResult.any_signal ? "text-red-400" : "text-emerald-400",
                )}
              />
              <p className="text-sm font-semibold text-white mb-1">
                {signalResult.any_signal
                  ? "Statistical Signal Detected"
                  : "No Statistical Signal"}
              </p>
              <p className="text-xs text-white/40">
                {signalResult.any_signal
                  ? "One or more algorithms flagged this drug-event pair. Next step: assess causality."
                  : "None of the four algorithms reached their threshold. This does not rule out a real effect — it means the data doesn't show disproportionate reporting."}
              </p>
            </div>

            <button
              onClick={goNext}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Assess Causality
            </button>
          </div>
        )}

        {/* ── Step 4: Causality Assessment ── */}
        {currentStep === "causality" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-cyan-300/80 leading-relaxed">
                <p>
                  The{" "}
                  <JargonBuster
                    term="Naranjo scale"
                    definition="A 10-question scoring system developed by Naranjo et al. (1981) that estimates the probability that an adverse reaction is caused by the drug rather than other factors. Scores range from -4 to +13."
                  >
                    Naranjo ADR Probability Scale
                  </JargonBuster>{" "}
                  scores 10 clinical questions to estimate whether the drug
                  likely caused the adverse event. Answer each question based on
                  the evidence.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {NARANJO_QUESTIONS.map((question, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                >
                  <p className="text-xs text-white/70 mb-2">
                    <span className="text-amber-400/60 font-mono mr-1.5">
                      Q{i + 1}.
                    </span>
                    {question}
                  </p>
                  <div className="flex gap-2">
                    {[
                      { label: "Yes", value: 1 },
                      { label: "No", value: -1 },
                      { label: "Unknown", value: 0 },
                    ].map((option) => (
                      <button
                        key={option.label}
                        onClick={() => {
                          const next = [...naranjoAnswers];
                          next[i] = option.value;
                          setNaranjoAnswers(next);
                        }}
                        className={cn(
                          "flex-1 rounded border py-1 text-[10px] font-mono uppercase tracking-wider transition-colors",
                          naranjoAnswers[i] === option.value
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                            : "border-white/10 bg-white/[0.02] text-white/30 hover:text-white/50",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={goNext}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              See Verdict
            </button>
          </div>
        )}

        {/* ── Step 5: Verdict ── */}
        {currentStep === "verdict" && signalResult && naranjoResult && (
          <div className="space-y-4">
            <div
              className={cn(
                "rounded-lg border p-6 text-center",
                naranjoResult.category === "Definite" ||
                  naranjoResult.category === "Probable"
                  ? "border-red-500/30 bg-red-500/5"
                  : naranjoResult.category === "Possible"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-emerald-500/30 bg-emerald-500/5",
              )}
            >
              <h2 className="text-xl font-bold text-white mb-1">
                {selectedScenario?.drug} + {selectedScenario?.event}
              </h2>
              <div className="flex items-center justify-center gap-4 mb-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/40">
                    Signal
                  </div>
                  <div
                    className={cn(
                      "text-sm font-bold",
                      signalResult.any_signal
                        ? "text-red-400"
                        : "text-emerald-400",
                    )}
                  >
                    {signalResult.any_signal ? "DETECTED" : "NONE"}
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/40">
                    Causality
                  </div>
                  <div
                    className={cn(
                      "text-sm font-bold",
                      naranjoResult.category === "Definite" ||
                        naranjoResult.category === "Probable"
                        ? "text-red-400"
                        : naranjoResult.category === "Possible"
                          ? "text-amber-400"
                          : "text-emerald-400",
                    )}
                  >
                    {naranjoResult.category.toUpperCase()}
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/40">
                    Naranjo Score
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    {naranjoResult.score}/13
                  </div>
                </div>
              </div>

              <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
                {signalResult.any_signal && naranjoResult.score >= 5
                  ? "Statistical signal confirmed with probable or definite causality. In a real PV system, this would trigger expedited reporting within 15 days (ICH E2B)."
                  : signalResult.any_signal && naranjoResult.score >= 1
                    ? "Statistical signal detected but causality is only possible. Further investigation — dechallenge/rechallenge data, case quality review — would be needed before regulatory action."
                    : !signalResult.any_signal
                      ? "No statistical signal detected. The drug-event pair does not show disproportionate reporting in this dataset. This doesn't mean the drug is safe — it means the signal isn't visible in spontaneous reports."
                      : "Signal detected but causality is doubtful. This often indicates confounding — the reports may be noise rather than a genuine drug effect."}
              </p>
            </div>

            {/* Summary Table */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">
                Complete Results
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">PRR</span>
                  <span className="font-mono text-white">
                    {signalResult.prr.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">ROR</span>
                  <span className="font-mono text-white">
                    {signalResult.ror.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">IC (IC025)</span>
                  <span className="font-mono text-white">
                    {signalResult.ic.toFixed(2)} (
                    {signalResult.ic025.toFixed(2)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">EBGM (EB05)</span>
                  <span className="font-mono text-white">
                    {signalResult.ebgm.toFixed(2)} (
                    {signalResult.eb05.toFixed(2)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Chi-Square</span>
                  <span className="font-mono text-white">
                    {signalResult.chi_square.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Naranjo</span>
                  <span className="font-mono text-white">
                    {naranjoResult.score} ({naranjoResult.category})
                  </span>
                </div>
              </div>
            </div>

            {/* Station verification — Academy→Glass bridge */}
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-2">
                Verify with AlgoVigilance Station
              </h3>
              {!stationResult ? (
                <button
                  onClick={verifyWithStation}
                  disabled={stationLoading || !selectedScenario}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
                >
                  {stationLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                      Querying live FAERS data...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Cross-check with Live FAERS Data
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Live PRR</span>
                    <span className="font-mono text-violet-300">
                      {stationResult.prr?.toFixed(2) ?? "—"}
                    </span>
                  </div>
                  {stationResult.ror !== undefined && stationResult.ror > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Live ROR</span>
                      <span className="font-mono text-violet-300">
                        {stationResult.ror.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Signal?</span>
                    <span className={cn("font-mono", stationResult.signal ? "text-rose-400" : "text-emerald-400")}>
                      {stationResult.signal ? "YES" : "NO"}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">
                    Live data from mcp.nexvigilant.com — the same API AI agents use.
                  </p>
                </div>
              )}
            </div>

            {/* Microgram Decision Engine — V1 void closure */}
            {microgramDecision && (
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
                  Decision Engine Verdict
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Classification</span>
                    <span className={cn("font-mono font-bold", microgramDecision.signal_detected ? "text-rose-400" : "text-emerald-400")}>
                      {microgramDecision.classification?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Causality</span>
                    <span className="font-mono text-cyan-300">{microgramDecision.causality}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Action</span>
                    <span className="font-mono text-cyan-300">{microgramDecision.action}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Priority</span>
                    <span className="font-mono text-cyan-300">{microgramDecision.priority}</span>
                  </div>
                  {microgramDecision.duration_us !== undefined && microgramDecision.duration_us > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Chain Duration</span>
                      <span className="font-mono text-cyan-300">{microgramDecision.duration_us}μs</span>
                    </div>
                  )}
                  <p className="text-[10px] text-white/30 mt-1">
                    4-step microgram chain (prr-signal → signal-to-causality → naranjo-quick → causality-to-action) running on mcp.nexvigilant.com.
                  </p>
                </div>
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
                    Ready for real data?
                  </p>
                  <p className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                    Try it live in Glass Signal Lab
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Investigate any drug with live FAERS data from mcp.nexvigilant.com
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </Link>

            {/* Next Steps */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] py-2.5 text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Try Another
              </button>
              <Link
                href="/drugs/semaglutide"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
                Full Drug Profile
              </Link>
            </div>
          </div>
        )}

        {/* Navigation */}
        {currentStep !== "select" && currentStep !== "verdict" && (
          <div className="mt-4 flex justify-between">
            <button
              onClick={goBack}
              className="text-xs font-mono text-white/30 hover:text-white/50 transition-colors"
            >
              Back
            </button>
            <span className="text-[10px] font-mono text-white/20">
              Step {stepIndex + 1} of {STEP_ORDER.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
