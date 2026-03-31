"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  Scale,
  Search,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  resolveDrug,
  searchFaers,
  computeNaranjo,
  computeWhoUmc,
  searchCaseReports,
  type DrugIdentity,
  type FaersEvent,
  type NaranjoResult,
  type WhoUmcResult,
  type CaseReport,
} from "../station-client";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface StepState {
  status: "pending" | "loading" | "done" | "error";
  error?: string;
}

// ─── Naranjo Questions ──────────────────────────────────────────────────────

const NARANJO_QUESTIONS = [
  {
    id: "previous_reports",
    question: "Are there previous conclusive reports on this reaction?",
    yes: 1, no: 0, unknown: 0,
  },
  {
    id: "after_drug",
    question: "Did the adverse event appear after the suspected drug was given?",
    yes: 2, no: -1, unknown: 0,
  },
  {
    id: "improved_on_withdrawal",
    question: "Did the reaction improve when the drug was discontinued or a specific antagonist was given?",
    yes: 1, no: 0, unknown: 0,
  },
  {
    id: "reappeared_on_rechallenge",
    question: "Did the reaction reappear when the drug was re-administered?",
    yes: 2, no: -1, unknown: 0,
  },
  {
    id: "alternative_causes",
    question: "Are there alternative causes that could have caused the reaction on their own?",
    yes: -1, no: 2, unknown: 0,
  },
  {
    id: "placebo_reaction",
    question: "Did the reaction appear when a placebo was given?",
    yes: -1, no: 1, unknown: 0,
  },
  {
    id: "drug_in_blood",
    question: "Was the drug detected in the blood (or other fluids) in toxic concentrations?",
    yes: 1, no: 0, unknown: 0,
  },
  {
    id: "dose_related",
    question: "Was the reaction more severe when the dose was increased, or less severe when decreased?",
    yes: 1, no: 0, unknown: 0,
  },
  {
    id: "previous_exposure",
    question: "Did the patient have a similar reaction to the same or similar drug previously?",
    yes: 1, no: 0, unknown: 0,
  },
  {
    id: "objective_evidence",
    question: "Was the adverse event confirmed by any objective evidence?",
    yes: 1, no: 0, unknown: 0,
  },
];

// ─── Preset Cases ───────────────────────────────────────────────────────────

const PRESET_CASES = [
  { drug: "Semaglutide", event: "Muscle atrophy", hint: "Strong unlabeled signal — PRR 3.95, 182 cases" },
  { drug: "Metformin", event: "Lactic acidosis", hint: "Classic serious ADR" },
  { drug: "Lisinopril", event: "Angioedema", hint: "ACE inhibitor class effect" },
  { drug: "Amoxicillin", event: "Rash", hint: "Common antibiotic reaction" },
  { drug: "Warfarin", event: "Haemorrhage", hint: "Dose-dependent bleeding" },
];

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({
  step,
  current,
  label,
  state,
}: {
  step: number;
  current: number;
  label: string;
  state: StepState;
}) {
  const isActive = step === current;
  const isDone = state.status === "done";
  const isLoading = state.status === "loading";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive && "bg-primary/10 text-primary font-medium",
        isDone && "text-green-500",
        !isActive && !isDone && "text-muted-foreground"
      )}
    >
      {isDone ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <span className="flex h-4 w-4 items-center justify-center rounded-full border text-xs">
          {step}
        </span>
      )}
      {label}
    </div>
  );
}

// ─── Naranjo Category Color ─────────────────────────────────────────────────

function naranjoColor(score: number): string {
  if (score >= 9) return "text-red-500 bg-red-500/10 border-red-500/20";
  if (score >= 5) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  if (score >= 1) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  return "text-gray-500 bg-gray-500/10 border-gray-500/20";
}

function naranjoCategory(score: number): string {
  if (score >= 9) return "Definite";
  if (score >= 5) return "Probable";
  if (score >= 1) return "Possible";
  return "Doubtful";
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CausalityLabPage() {
  const [drugInput, setDrugInput] = useState("");
  const [eventInput, setEventInput] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [steps, setSteps] = useState<Record<Step, StepState>>({
    1: { status: "pending" },
    2: { status: "pending" },
    3: { status: "pending" },
    4: { status: "pending" },
    5: { status: "pending" },
  });

  // Results
  const [drugIdentity, setDrugIdentity] = useState<DrugIdentity | null>(null);
  const [faersEvents, setFaersEvents] = useState<FaersEvent[]>([]);
  const [naranjoAnswers, setNaranjoAnswers] = useState<Record<string, "yes" | "no" | "unknown">>({});
  const [naranjoResult, setNaranjoResult] = useState<NaranjoResult | null>(null);
  const [whoUmcResult, setWhoUmcResult] = useState<WhoUmcResult | null>(null);
  const [caseReports, setCaseReports] = useState<CaseReport[]>([]);

  const updateStep = useCallback(
    (step: Step, state: Partial<StepState>) => {
      setSteps((prev) => ({ ...prev, [step]: { ...prev[step], ...state } }));
    },
    []
  );

  // Step 1: Resolve drug + get events
  const runStep1 = useCallback(
    async (drug: string, event?: string) => {
      setDrugInput(drug);
      if (event) setEventInput(event);
      setCurrentStep(1);
      updateStep(1, { status: "loading" });

      const identity = await resolveDrug(drug);
      if (identity) {
        setDrugIdentity(identity);
        updateStep(1, { status: "done" });

        if (event) {
          // Preset case — skip event selection
          setCurrentStep(3);
          updateStep(2, { status: "done" });
        } else {
          // Need event selection
          setCurrentStep(2);
          updateStep(2, { status: "loading" });
          const events = await searchFaers(drug);
          setFaersEvents(events);
          updateStep(2, { status: "done" });
        }
      } else {
        updateStep(1, {
          status: "error",
          error: `Could not resolve "${drug}". Try a different spelling.`,
        });
      }
    },
    [updateStep]
  );

  // Step 2: Select event
  const selectEvent = useCallback(
    (event: string) => {
      setEventInput(event);
      updateStep(2, { status: "done" });
      setCurrentStep(3);
    },
    [updateStep]
  );

  // Step 3: Run Naranjo
  const runNaranjo = useCallback(async () => {
    updateStep(3, { status: "loading" });

    // Compute local Naranjo score from answers
    let localScore = 0;
    const scoreMap: Record<string, number> = {};
    for (const q of NARANJO_QUESTIONS) {
      const answer = naranjoAnswers[q.id] ?? "unknown";
      const value = answer === "yes" ? q.yes : answer === "no" ? q.no : q.unknown;
      localScore += value;
      scoreMap[q.id] = value;
    }

    // Also call Station for official computation
    const stationResult = await computeNaranjo(drugInput, eventInput, scoreMap);

    const finalScore = stationResult?.score ?? localScore;
    setNaranjoResult({
      score: finalScore,
      category: stationResult?.category ?? naranjoCategory(finalScore),
      answers: scoreMap,
    });

    updateStep(3, { status: "done" });

    // Auto-advance to WHO-UMC
    setCurrentStep(4);
    updateStep(4, { status: "loading" });

    const timeRelated = naranjoAnswers["after_drug"] === "yes";
    const dechallenge = naranjoAnswers["improved_on_withdrawal"] === "yes";
    const rechallenge = naranjoAnswers["reappeared_on_rechallenge"] === "yes";
    const altCauses = naranjoAnswers["alternative_causes"] === "yes";

    const whoResult = await computeWhoUmc(drugInput, eventInput, {
      time_relationship: timeRelated,
      dechallenge,
      rechallenge,
      alternative_causes: altCauses,
    });

    if (whoResult) {
      setWhoUmcResult(whoResult);
    } else {
      // Derive locally
      let cat = "Possible";
      if (timeRelated && dechallenge && rechallenge && !altCauses) cat = "Certain";
      else if (timeRelated && dechallenge && !altCauses) cat = "Probable";
      else if (timeRelated) cat = "Possible";
      else cat = "Unlikely";

      setWhoUmcResult({
        category: cat,
        description: `Based on temporal relationship${dechallenge ? ", positive dechallenge" : ""}${rechallenge ? ", positive rechallenge" : ""}${altCauses ? ", alternative causes present" : ""}.`,
        criteria_met: [
          ...(timeRelated ? ["Temporal relationship"] : []),
          ...(dechallenge ? ["Positive dechallenge"] : []),
          ...(rechallenge ? ["Positive rechallenge"] : []),
          ...(!altCauses ? ["No alternative causes"] : []),
        ],
      });
    }

    updateStep(4, { status: "done" });

    // Step 5: Case reports
    setCurrentStep(5);
    updateStep(5, { status: "loading" });
    const reports = await searchCaseReports(drugInput, eventInput);
    setCaseReports(reports);
    updateStep(5, { status: "done" });
  }, [drugInput, eventInput, naranjoAnswers, updateStep]);

  // Reset
  const reset = useCallback(() => {
    setDrugInput("");
    setEventInput("");
    setCurrentStep(1);
    setSteps({
      1: { status: "pending" },
      2: { status: "pending" },
      3: { status: "pending" },
      4: { status: "pending" },
      5: { status: "pending" },
    });
    setDrugIdentity(null);
    setFaersEvents([]);
    setNaranjoAnswers({});
    setNaranjoResult(null);
    setWhoUmcResult(null);
    setCaseReports([]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Causality Assessment Lab</h1>
            <p className="text-sm text-muted-foreground">
              Evaluate whether a drug caused an adverse event
            </p>
          </div>
        </div>
        <Link
          href="/nucleus/academy/interactive/causality-assessment"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <BookOpen className="h-4 w-4" /> Learn the concepts
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Step Sidebar */}
        <div className="space-y-1 rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Assessment Steps
          </p>
          <StepIndicator step={1} current={currentStep} label="Identify Drug" state={steps[1]} />
          <StepIndicator step={2} current={currentStep} label="Select Event" state={steps[2]} />
          <StepIndicator step={3} current={currentStep} label="Naranjo Score" state={steps[3]} />
          <StepIndicator step={4} current={currentStep} label="WHO-UMC" state={steps[4]} />
          <StepIndicator step={5} current={currentStep} label="Case Reports" state={steps[5]} />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Step 1: Drug Input */}
          {currentStep === 1 && steps[1].status !== "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 1: Choose a Drug-Event Pair</h2>
              <p className="text-sm text-muted-foreground">
                Enter a drug name to investigate, or pick a preset case. We&apos;ll use the{" "}
                <JargonBuster term="Naranjo algorithm" definition="A 10-question scoring system that estimates the probability that an adverse event was caused by a drug. Scores range from -4 (doubtful) to +13 (definite).">
                  Naranjo algorithm
                </JargonBuster>{" "}
                and{" "}
                <JargonBuster term="WHO-UMC system" definition="The World Health Organization&apos;s standardized causality assessment system. Categories: Certain, Probable, Possible, Unlikely, Conditional, Unassessable.">
                  WHO-UMC criteria
                </JargonBuster>{" "}
                to assess causality.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={drugInput}
                  onChange={(e) => setDrugInput(e.target.value)}
                  placeholder="Enter drug name..."
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && drugInput.trim()) runStep1(drugInput.trim());
                  }}
                />
                <button
                  onClick={() => drugInput.trim() && runStep1(drugInput.trim())}
                  disabled={!drugInput.trim() || steps[1].status === "loading"}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {steps[1].status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Assess
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Or try a preset case:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CASES.map((c) => (
                    <button
                      key={`${c.drug}-${c.event}`}
                      onClick={() => runStep1(c.drug, c.event)}
                      className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
                      title={c.hint}
                    >
                      {c.drug} + {c.event}
                    </button>
                  ))}
                </div>
              </div>

              {steps[1].error && (
                <p className="text-sm text-destructive">{steps[1].error}</p>
              )}
            </div>
          )}

          {/* Step 1 Result */}
          {drugIdentity && steps[1].status === "done" && (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{drugIdentity.name}</p>
                <p className="text-sm text-muted-foreground">
                  RxCUI: {drugIdentity.rxcui}
                  {eventInput && ` — Event: ${eventInput}`}
                </p>
              </div>
              <button onClick={reset} className="ml-auto text-sm text-muted-foreground hover:text-foreground">
                Start over
              </button>
            </div>
          )}

          {/* Step 2: Event Selection */}
          {currentStep === 2 && steps[2].status === "done" && faersEvents.length > 0 && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 2: Select Adverse Event</h2>
              <p className="text-sm text-muted-foreground">
                Which event do you want to assess causality for? These are the most reported events for{" "}
                <strong>{drugInput}</strong> in FAERS.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {faersEvents.map((ev) => (
                  <button
                    key={ev.term}
                    onClick={() => selectEvent(ev.term)}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  >
                    <span className="truncate">{ev.term}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {ev.count.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Naranjo Assessment */}
          {currentStep === 3 && steps[3].status !== "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">
                Step 3:{" "}
                <JargonBuster term="Naranjo Algorithm" definition="A validated 10-question adverse drug reaction probability scale. Each question is scored and summed to classify causality as Definite (≥9), Probable (5-8), Possible (1-4), or Doubtful (≤0).">
                  Naranjo Algorithm
                </JargonBuster>
              </h2>
              <p className="text-sm text-muted-foreground">
                Answer each question about the relationship between <strong>{drugInput}</strong> and{" "}
                <strong>{eventInput}</strong>. Answer &quot;Don&apos;t know&quot; if unsure — it scores 0.
              </p>

              <div className="space-y-3">
                {NARANJO_QUESTIONS.map((q, i) => (
                  <div key={q.id} className="rounded-md border p-4">
                    <p className="mb-2 text-sm">
                      <span className="font-medium text-muted-foreground">{i + 1}.</span>{" "}
                      {q.question}
                    </p>
                    <div className="flex gap-2">
                      {(["yes", "no", "unknown"] as const).map((answer) => (
                        <button
                          key={answer}
                          onClick={() =>
                            setNaranjoAnswers((prev) => ({ ...prev, [q.id]: answer }))
                          }
                          className={cn(
                            "rounded-md border px-4 py-1.5 text-sm transition-colors",
                            naranjoAnswers[q.id] === answer
                              ? answer === "yes"
                                ? "border-green-500 bg-green-500/10 text-green-500"
                                : answer === "no"
                                ? "border-red-500 bg-red-500/10 text-red-500"
                                : "border-primary bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          {answer === "unknown" ? "Don't know" : answer === "yes" ? "Yes" : "No"}
                        </button>
                      ))}
                      <span className="ml-auto flex items-center text-xs text-muted-foreground">
                        {naranjoAnswers[q.id] === "yes" && `+${q.yes}`}
                        {naranjoAnswers[q.id] === "no" && (q.no >= 0 ? `+${q.no}` : `${q.no}`)}
                        {naranjoAnswers[q.id] === "unknown" && "+0"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Running score */}
              <div className="flex items-center justify-between rounded-md bg-muted/50 p-4">
                <div>
                  <p className="text-sm font-medium">
                    Current Score:{" "}
                    {NARANJO_QUESTIONS.reduce((sum, q) => {
                      const a = naranjoAnswers[q.id];
                      return sum + (a === "yes" ? q.yes : a === "no" ? q.no : 0);
                    }, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(naranjoAnswers).length}/10 questions answered
                  </p>
                </div>
                <button
                  onClick={runNaranjo}
                  disabled={Object.keys(naranjoAnswers).length < 5 || steps[3].status === "loading"}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {steps[3].status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Compute Assessment
                </button>
              </div>
            </div>
          )}

          {/* Step 3 Result: Naranjo Score */}
          {naranjoResult && steps[3].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">
                Naranjo Result: {drugInput} + {eventInput}
              </h2>
              <div className="flex items-center gap-6">
                <div className={cn("rounded-lg border p-6 text-center", naranjoColor(naranjoResult.score))}>
                  <p className="text-4xl font-bold">{naranjoResult.score}</p>
                  <p className="mt-1 text-sm font-medium">{naranjoCategory(naranjoResult.score)}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="inline-block w-20 font-medium">≥ 9</span>
                    <span className={cn(naranjoResult.score >= 9 ? "font-bold text-red-500" : "text-muted-foreground")}>
                      Definite
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-block w-20 font-medium">5 – 8</span>
                    <span className={cn(naranjoResult.score >= 5 && naranjoResult.score < 9 ? "font-bold text-amber-500" : "text-muted-foreground")}>
                      Probable
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-block w-20 font-medium">1 – 4</span>
                    <span className={cn(naranjoResult.score >= 1 && naranjoResult.score < 5 ? "font-bold text-blue-500" : "text-muted-foreground")}>
                      Possible
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-block w-20 font-medium">≤ 0</span>
                    <span className={cn(naranjoResult.score <= 0 ? "font-bold text-gray-500" : "text-muted-foreground")}>
                      Doubtful
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: WHO-UMC Result */}
          {whoUmcResult && steps[4].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">
                <JargonBuster term="WHO-UMC" definition="The World Health Organization&apos;s Uppsala Monitoring Centre system for standardized causality assessment. Uses clinical criteria rather than a scoring algorithm.">
                  WHO-UMC Assessment
                </JargonBuster>
              </h2>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "rounded-lg border px-6 py-4 text-center",
                  whoUmcResult.category === "Certain" ? "border-red-500/20 bg-red-500/10 text-red-500" :
                  whoUmcResult.category === "Probable" ? "border-amber-500/20 bg-amber-500/10 text-amber-500" :
                  whoUmcResult.category === "Possible" ? "border-blue-500/20 bg-blue-500/10 text-blue-500" :
                  "border-gray-500/20 bg-gray-500/10 text-gray-500"
                )}>
                  <p className="text-2xl font-bold">{whoUmcResult.category}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{whoUmcResult.description}</p>
                  {whoUmcResult.criteria_met.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {whoUmcResult.criteria_met.map((c) => (
                        <span key={c} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison */}
              {naranjoResult && (
                <div className="rounded-md bg-muted/50 p-4">
                  <p className="text-sm font-medium mb-2">Method Comparison</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Naranjo</p>
                      <p className="font-medium">{naranjoCategory(naranjoResult.score)} (score: {naranjoResult.score})</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">WHO-UMC</p>
                      <p className="font-medium">{whoUmcResult.category}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Case Reports + Verdict */}
          {steps[5].status === "done" && (
            <div className="space-y-4">
              {caseReports.length > 0 && (
                <div className="space-y-3 rounded-lg border p-6">
                  <h2 className="text-lg font-semibold">Supporting Case Reports</h2>
                  <p className="text-sm text-muted-foreground">
                    Published case reports of {eventInput} associated with {drugInput}
                  </p>
                  <div className="space-y-2">
                    {caseReports.map((r) => (
                      <div key={r.pmid} className="flex items-start gap-3 rounded-md border p-3">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.journal && `${r.journal} `}
                            {r.year && `(${r.year}) `}
                            {r.pmid && `PMID: ${r.pmid}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verdict */}
              <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
                <h2 className="text-lg font-semibold">Your Causality Assessment</h2>
                <p className="text-sm text-muted-foreground">
                  You&apos;ve completed the causality assessment for{" "}
                  <strong>{drugInput}</strong> and <strong>{eventInput}</strong>.
                  Two validated methods arrived at:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {naranjoResult && (
                    <div className={cn("rounded-lg border p-4 text-center", naranjoColor(naranjoResult.score))}>
                      <p className="text-sm font-medium">Naranjo</p>
                      <p className="text-2xl font-bold">{naranjoCategory(naranjoResult.score)}</p>
                      <p className="text-xs">Score: {naranjoResult.score}</p>
                    </div>
                  )}
                  {whoUmcResult && (
                    <div className={cn(
                      "rounded-lg border p-4 text-center",
                      whoUmcResult.category === "Certain" ? "border-red-500/20 bg-red-500/10 text-red-500" :
                      whoUmcResult.category === "Probable" ? "border-amber-500/20 bg-amber-500/10 text-amber-500" :
                      whoUmcResult.category === "Possible" ? "border-blue-500/20 bg-blue-500/10 text-blue-500" :
                      "border-gray-500/20 bg-gray-500/10 text-gray-500"
                    )}>
                      <p className="text-sm font-medium">WHO-UMC</p>
                      <p className="text-2xl font-bold">{whoUmcResult.category}</p>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <strong>Agreement:</strong> Do both methods converge on the same conclusion?
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <strong>Literature support:</strong> Do published case reports confirm the association?
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <strong>Clinical judgment:</strong> Algorithms inform but don&apos;t replace expert assessment.
                    </span>
                  </li>
                </ul>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={reset}
                    className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                  >
                    Assess Another Case
                  </button>
                  <Link
                    href="/nucleus/glass/benefit-risk-lab"
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Next: Benefit-Risk <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Loading states */}
          {Object.entries(steps).some(
            ([, s]) => s.status === "loading"
          ) && (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Querying AlgoVigilance Station...
              </p>
            </div>
          )}
        </div>
        {/* Link to full report */}
        <div className="mt-4 text-center">
          <Link
            href="/reports/causality-assessment"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Generate Full Causality PDF Report
          </Link>
        </div>
      </div>
    </div>
  );
}
