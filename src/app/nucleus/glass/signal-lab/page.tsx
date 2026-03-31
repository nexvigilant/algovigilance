"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  resolveDrug,
  searchFaers,
  computeDisproportionality,
  getDrugLabel,
  searchPubMed,
  type DrugIdentity,
  type FaersEvent,
  type DisproportionalityResult,
  type LabelSection,
  type PubMedArticle,
} from "../station-client";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface StepState {
  status: "pending" | "loading" | "done" | "error";
  error?: string;
}

// ─── Preset Drugs ────────────────────────────────────────────────────────────

const PRESET_DRUGS = [
  { name: "Semaglutide", hint: "GLP-1 agonist — pancreatitis signals" },
  { name: "Metformin", hint: "First-line diabetes — lactic acidosis" },
  { name: "Ozempic", hint: "Brand semaglutide — gastroparesis reports" },
  { name: "Acetaminophen", hint: "OTC analgesic — hepatotoxicity" },
  { name: "Lisinopril", hint: "ACE inhibitor — angioedema" },
];

// ─── Step Components ─────────────────────────────────────────────────────────

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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SignalLabPage() {
  const [drugInput, setDrugInput] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [steps, setSteps] = useState<Record<Step, StepState>>({
    1: { status: "pending" },
    2: { status: "pending" },
    3: { status: "pending" },
    4: { status: "pending" },
    5: { status: "pending" },
    6: { status: "pending" },
  });

  // Results
  const [drugIdentity, setDrugIdentity] = useState<DrugIdentity | null>(null);
  const [faersEvents, setFaersEvents] = useState<FaersEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [dispro, setDispro] = useState<DisproportionalityResult | null>(null);
  const [labelSections, setLabelSections] = useState<LabelSection[]>([]);
  const [articles, setArticles] = useState<PubMedArticle[]>([]);

  const updateStep = useCallback(
    (step: Step, state: Partial<StepState>) => {
      setSteps((prev) => ({ ...prev, [step]: { ...prev[step], ...state } }));
    },
    []
  );

  // Step 1: Resolve drug
  const runStep1 = useCallback(
    async (name: string) => {
      setDrugInput(name);
      setCurrentStep(1);
      updateStep(1, { status: "loading" });

      const identity = await resolveDrug(name);
      if (identity) {
        setDrugIdentity(identity);
        updateStep(1, { status: "done" });
        // Auto-advance to step 2
        setCurrentStep(2);
        updateStep(2, { status: "loading" });
        const events = await searchFaers(name);
        setFaersEvents(events);
        updateStep(2, { status: "done" });
        setCurrentStep(3);
      } else {
        updateStep(1, {
          status: "error",
          error: `Could not resolve "${name}". Try a different spelling.`,
        });
      }
    },
    [updateStep]
  );

  // Step 3: Run disproportionality
  const runStep3 = useCallback(
    async (event: string) => {
      setSelectedEvent(event);
      updateStep(3, { status: "loading" });

      const result = await computeDisproportionality(drugInput, event);
      if (result) {
        setDispro(result);
        updateStep(3, { status: "done" });
        // Auto-advance to step 4
        setCurrentStep(4);
        updateStep(4, { status: "loading" });
        const labels = await getDrugLabel(drugInput);
        setLabelSections(labels);
        updateStep(4, { status: "done" });
        // Step 5
        setCurrentStep(5);
        updateStep(5, { status: "loading" });
        const pubs = await searchPubMed(drugInput, event);
        setArticles(pubs);
        updateStep(5, { status: "done" });
        setCurrentStep(6);
        updateStep(6, { status: "done" });
      } else {
        updateStep(3, { status: "error", error: "Disproportionality computation failed." });
      }
    },
    [drugInput, updateStep]
  );

  // Reset
  const reset = useCallback(() => {
    setDrugInput("");
    setCurrentStep(1);
    setSteps({
      1: { status: "pending" },
      2: { status: "pending" },
      3: { status: "pending" },
      4: { status: "pending" },
      5: { status: "pending" },
      6: { status: "pending" },
    });
    setDrugIdentity(null);
    setFaersEvents([]);
    setSelectedEvent("");
    setDispro(null);
    setLabelSections([]);
    setArticles([]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Signal Investigation Lab</h1>
            <p className="text-sm text-muted-foreground">
              Detect safety signals with real FDA data
            </p>
          </div>
        </div>
        <Link
          href="/nucleus/academy/interactive/signal-investigation"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <BookOpen className="h-4 w-4" /> Learn the concepts
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Step Sidebar */}
        <div className="space-y-1 rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Workflow Steps
          </p>
          <StepIndicator step={1} current={currentStep} label="Identify Drug" state={steps[1]} />
          <StepIndicator step={2} current={currentStep} label="Find Events" state={steps[2]} />
          <StepIndicator step={3} current={currentStep} label="Compute Signals" state={steps[3]} />
          <StepIndicator step={4} current={currentStep} label="Check Label" state={steps[4]} />
          <StepIndicator step={5} current={currentStep} label="Literature" state={steps[5]} />
          <StepIndicator step={6} current={currentStep} label="Verdict" state={steps[6]} />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Step 1: Drug Input */}
          {currentStep === 1 && steps[1].status !== "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 1: Choose a Drug</h2>
              <p className="text-sm text-muted-foreground">
                Enter a drug name or pick a preset. We&apos;ll resolve it via{" "}
                <JargonBuster term="RxNav" definition="NIH&apos;s drug name normalization service — ensures we&apos;re looking at the right substance">
                  RxNav
                </JargonBuster>{" "}
                to get the standard identifier.
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
                  Investigate
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Or try a preset:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_DRUGS.map((d) => (
                    <button
                      key={d.name}
                      onClick={() => runStep1(d.name)}
                      className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
                      title={d.hint}
                    >
                      {d.name}
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
                  {drugIdentity.synonym && ` — also known as ${drugIdentity.synonym}`}
                </p>
              </div>
              <button onClick={reset} className="ml-auto text-sm text-muted-foreground hover:text-foreground">
                Start over
              </button>
            </div>
          )}

          {/* Step 2: FAERS Events */}
          {steps[2].status === "done" && faersEvents.length > 0 && currentStep >= 3 && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">
                Step 2: Top Adverse Events in{" "}
                <JargonBuster term="FAERS" definition="FDA Adverse Event Reporting System — the largest spontaneous reporting database of drug side effects in the world">
                  FAERS
                </JargonBuster>
              </h2>
              <p className="text-sm text-muted-foreground">
                Select an event to investigate. We&apos;ll compute{" "}
                <JargonBuster term="disproportionality" definition="A statistical method that compares how often a drug-event pair is reported vs how often you&apos;d expect by chance. Higher = stronger signal.">
                  disproportionality scores
                </JargonBuster>{" "}
                to see if there&apos;s a signal.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {faersEvents.map((ev) => (
                  <button
                    key={ev.term}
                    onClick={() => runStep3(ev.term)}
                    disabled={steps[3].status === "loading"}
                    className={cn(
                      "flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
                      selectedEvent === ev.term
                        ? "border-primary bg-primary/10"
                        : "hover:bg-muted"
                    )}
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

          {/* Step 3: Disproportionality Results */}
          {dispro && steps[3].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">
                Step 3: Signal Scores — {drugInput} + {selectedEvent}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "PRR", value: dispro.prr, threshold: 2, desc: "Proportional Reporting Ratio" },
                  { label: "ROR", value: dispro.ror, threshold: 2, desc: "Reporting Odds Ratio" },
                  { label: "IC", value: dispro.ic, threshold: 0, desc: "Information Component" },
                  { label: "EBGM", value: dispro.ebgm, threshold: 2, desc: "Empirical Bayes Geometric Mean" },
                ].map((m) => {
                  const isSignal = m.value !== undefined && m.value > m.threshold;
                  return (
                    <div
                      key={m.label}
                      className={cn(
                        "rounded-lg border p-4",
                        isSignal ? "border-amber-500/30 bg-amber-500/5" : "bg-muted/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <JargonBuster term={m.label} definition={m.desc}>
                          <span className="text-sm font-medium">{m.label}</span>
                        </JargonBuster>
                        {isSignal && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      </div>
                      <p className="mt-1 text-2xl font-bold">
                        {m.value !== undefined ? m.value.toFixed(2) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Threshold: {"> "}{m.threshold}
                      </p>
                    </div>
                  );
                })}
              </div>
              {dispro.cases !== undefined && (
                <p className="text-sm text-muted-foreground">
                  Based on {dispro.cases.toLocaleString()} reported cases
                </p>
              )}
              {dispro.signal ? (
                <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  Statistical signal detected — further investigation warranted
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  No disproportionate signal detected at standard thresholds
                </div>
              )}
            </div>
          )}

          {/* Step 4: Label Check */}
          {labelSections.length > 0 && steps[4].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">
                Step 4: Drug Label Check
              </h2>
              <p className="text-sm text-muted-foreground">
                Is this event already listed in the{" "}
                <JargonBuster term="drug label" definition="The official prescribing information approved by the FDA. If an adverse event is already listed here, it&apos;s &apos;expected&apos; — if not, it&apos;s a potential new signal.">
                  drug label
                </JargonBuster>
                ?
              </p>
              {labelSections.map((sec) => (
                <div key={sec.section} className="space-y-1">
                  <h3 className="text-sm font-medium">{sec.section}</h3>
                  <p className="max-h-40 overflow-y-auto rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                    {sec.text.slice(0, 1000)}
                    {sec.text.length > 1000 && "..."}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Literature */}
          {articles.length > 0 && steps[5].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">
                Step 5: Published Literature
              </h2>
              <p className="text-sm text-muted-foreground">
                Case reports and safety studies from PubMed
              </p>
              <div className="space-y-2">
                {articles.map((a) => (
                  <div
                    key={a.pmid}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.journal && `${a.journal} `}
                        {a.year && `(${a.year}) `}
                        {a.pmid && `PMID: ${a.pmid}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Verdict */}
          {steps[6].status === "done" && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-semibold">
                Step 6: Your Assessment
              </h2>
              <p className="text-sm text-muted-foreground">
                You&apos;ve completed the signal investigation workflow for{" "}
                <strong>{drugInput}</strong> and <strong>{selectedEvent}</strong>.
                Review the evidence above and consider:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>Signal strength:</strong> How many metrics exceeded their thresholds?
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>Expectedness:</strong> Is this event already in the drug label?
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>Literature support:</strong> Do published studies support a causal relationship?
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>Clinical significance:</strong> Would this change prescribing behavior?
                  </span>
                </li>
              </ul>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={reset}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                >
                  Investigate Another Drug
                </button>
                <Link
                  href="/nucleus/glass/causality-lab"
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Next: Causality Assessment <ArrowRight className="h-4 w-4" />
                </Link>
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
        {drugInput && currentStep >= 6 && (
          <div className="mt-4 text-center">
            <Link
              href={`/reports/signal-evaluation?drug=${encodeURIComponent(drugInput)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Generate Full PDF Report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
