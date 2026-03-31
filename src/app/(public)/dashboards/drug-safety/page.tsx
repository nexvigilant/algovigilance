"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSearch,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  resolveDrug,
  searchFaers,
  getFaersOutcomes,
  computeDisproportionality,
  getDrugLabel,
  searchPubMed,
  type DrugIdentity,
  type FaersEvent,
  type DisproportionalityResult,
  type LabelSection,
  type PubMedArticle,
  type StepStatus,
} from "../station-client";
import {
  createDrugSafetyMeta,
  generateDrugSafetyReport,
  openReport,
  downloadJSON,
  type DrugSafetyReportData,
} from "../report-generator";

// ─── Constants ──────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS: Record<Step, string> = {
  1: "Identify Drug",
  2: "FAERS Adverse Events",
  3: "Signal Detection",
  4: "Label Review",
  5: "Literature Search",
  6: "Generate Report",
};

const PRESET_DRUGS = [
  { name: "Semaglutide", hint: "GLP-1 agonist — pancreatitis, gastroparesis" },
  { name: "Metformin", hint: "First-line diabetes — lactic acidosis" },
  { name: "Acetaminophen", hint: "OTC analgesic — hepatotoxicity" },
  { name: "Lisinopril", hint: "ACE inhibitor — angioedema" },
  { name: "Atorvastatin", hint: "Statin — rhabdomyolysis" },
  { name: "Omeprazole", hint: "PPI — bone fractures, hypomagnesemia" },
];

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({
  step,
  current,
  state,
}: {
  step: Step;
  current: Step;
  state: StepStatus;
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
        !isActive && !isDone && "text-muted-foreground",
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
      {STEP_LABELS[step]}
      {state.completedAt && state.startedAt && (
        <span className="ml-auto text-xs text-muted-foreground">
          {((state.completedAt - state.startedAt) / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DrugSafetyPage() {
  const [drugInput, setDrugInput] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [steps, setSteps] = useState<Record<Step, StepStatus>>({
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
  const [outcomes, setOutcomes] = useState<{
    serious: number;
    deaths: number;
    hospitalizations: number;
    total: number;
  } | null>(null);
  const [signals, setSignals] = useState<DisproportionalityResult[]>([]);
  const [labelSections, setLabelSections] = useState<LabelSection[]>([]);
  const [articles, setArticles] = useState<PubMedArticle[]>([]);

  const updateStep = useCallback(
    (step: Step, update: Partial<StepStatus>) => {
      setSteps((prev) => ({ ...prev, [step]: { ...prev[step], ...update } }));
    },
    [],
  );

  // ── Run the full pipeline ─────────────────────────────────────────────────

  const runPipeline = useCallback(
    async (name: string) => {
      setDrugInput(name);
      setSignals([]);
      setArticles([]);
      setLabelSections([]);
      setFaersEvents([]);
      setOutcomes(null);
      setDrugIdentity(null);

      // Step 1: Resolve drug
      setCurrentStep(1);
      updateStep(1, { status: "loading", startedAt: Date.now() });
      const identity = await resolveDrug(name);
      if (!identity) {
        updateStep(1, {
          status: "error",
          error: `Could not resolve "${name}". Try a different spelling.`,
          completedAt: Date.now(),
        });
        return;
      }
      setDrugIdentity(identity);
      updateStep(1, { status: "done", completedAt: Date.now() });

      // Step 2: FAERS events + outcomes (parallel)
      setCurrentStep(2);
      updateStep(2, { status: "loading", startedAt: Date.now() });
      const [events, outcomesResult] = await Promise.all([
        searchFaers(name, 20),
        getFaersOutcomes(name),
      ]);
      setFaersEvents(events);
      setOutcomes(outcomesResult);
      updateStep(2, { status: "done", completedAt: Date.now() });

      // Step 3: Signal detection — run disproportionality on top 3 events
      setCurrentStep(3);
      updateStep(3, { status: "loading", startedAt: Date.now() });
      const topEvents = events.slice(0, 3);
      const signalResults = await Promise.all(
        topEvents.map((e) => computeDisproportionality(name, e.term)),
      );
      const validSignals = signalResults.filter(
        (s): s is DisproportionalityResult => s !== null,
      );
      setSignals(validSignals);
      updateStep(3, { status: "done", completedAt: Date.now() });

      // Step 4: Label review
      setCurrentStep(4);
      updateStep(4, { status: "loading", startedAt: Date.now() });
      const labels = await getDrugLabel(name);
      setLabelSections(labels);
      updateStep(4, { status: "done", completedAt: Date.now() });

      // Step 5: Literature
      setCurrentStep(5);
      updateStep(5, { status: "loading", startedAt: Date.now() });
      const topSignalEvent = validSignals.find((s) => s.signal)?.event ?? topEvents[0]?.term ?? name;
      const pubs = await searchPubMed(name, topSignalEvent, 10);
      setArticles(pubs);
      updateStep(5, { status: "done", completedAt: Date.now() });

      // Step 6: Report ready
      setCurrentStep(6);
      updateStep(6, { status: "done", startedAt: Date.now(), completedAt: Date.now() });
    },
    [updateStep],
  );

  // ── Generate report ───────────────────────────────────────────────────────

  const generateReport = useCallback(() => {
    if (!drugIdentity) return;
    const data: DrugSafetyReportData = {
      meta: createDrugSafetyMeta(drugIdentity.name),
      drugIdentity,
      topEvents: faersEvents,
      outcomes: outcomes ?? undefined,
      signals,
      labelSections,
      literature: articles,
    };
    openReport(generateDrugSafetyReport(data));
  }, [drugIdentity, faersEvents, outcomes, signals, labelSections, articles]);

  const exportJSON = useCallback(() => {
    if (!drugIdentity) return;
    downloadJSON(
      { drugIdentity, faersEvents, outcomes, signals, labelSections, articles },
      `drug-safety-${drugIdentity.name.toLowerCase()}-${Date.now()}.json`,
    );
  }, [drugIdentity, faersEvents, outcomes, signals, labelSections, articles]);

  // ── Reset ─────────────────────────────────────────────────────────────────

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
    setOutcomes(null);
    setSignals([]);
    setLabelSections([]);
    setArticles([]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <FileSearch className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Drug Safety Profile</h1>
            <p className="text-sm text-muted-foreground">
              Complete safety assessment with downloadable report
            </p>
          </div>
        </div>
        <Link
          href="/dashboards"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          All Dashboards
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Step Sidebar */}
        <div className="space-y-1 rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Workflow Steps
          </p>
          {([1, 2, 3, 4, 5, 6] as Step[]).map((s) => (
            <StepIndicator key={s} step={s} current={currentStep} state={steps[s]} />
          ))}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Step 1: Drug Input */}
          {currentStep === 1 && steps[1].status !== "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 1: Choose a Drug</h2>
              <p className="text-sm text-muted-foreground">
                Enter a drug name or pick a preset. We&apos;ll resolve it via{" "}
                <JargonBuster
                  term="RxNav"
                  definition="NIH drug name normalization service that maps trade names, generics, and ingredients to a standard identifier"
                >
                  RxNav
                </JargonBuster>{" "}
                and run a complete safety profile.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={drugInput}
                  onChange={(e) => setDrugInput(e.target.value)}
                  placeholder="Enter drug name..."
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && drugInput.trim()) runPipeline(drugInput.trim());
                  }}
                />
                <button
                  onClick={() => drugInput.trim() && runPipeline(drugInput.trim())}
                  disabled={!drugInput.trim() || steps[1].status === "loading"}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {steps[1].status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Run Profile
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick start:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_DRUGS.map((d) => (
                    <button
                      key={d.name}
                      onClick={() => runPipeline(d.name)}
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
                  {drugIdentity.synonym && ` — ${drugIdentity.synonym}`}
                </p>
              </div>
              <button
                onClick={reset}
                className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Start over
              </button>
            </div>
          )}

          {/* Step 2: FAERS Events */}
          {steps[2].status === "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 2: FAERS Adverse Event Profile</h2>

              {outcomes && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total Cases", value: outcomes.total },
                    { label: "Serious", value: outcomes.serious },
                    { label: "Deaths", value: outcomes.deaths },
                    { label: "Hospitalizations", value: outcomes.hospitalizations },
                  ].map((m) => (
                    <div key={m.label} className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-xl font-bold">{m.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {faersEvents.slice(0, 15).map((ev) => (
                  <div
                    key={ev.term}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="truncate">{ev.term}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {ev.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Signals */}
          {steps[3].status === "done" && signals.length > 0 && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 3: Disproportionality Analysis</h2>
              <p className="text-sm text-muted-foreground">
                Signal detection on the top reported events using four standard{" "}
                <JargonBuster
                  term="disproportionality"
                  definition="Statistical methods that compare how often a drug-event pair is reported versus how often expected by chance"
                >
                  disproportionality metrics
                </JargonBuster>
                .
              </p>

              {signals.map((s) => (
                <div key={s.event} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">
                      {drugIdentity?.name} + {s.event}
                    </h3>
                    {s.signal ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                        <AlertTriangle className="h-3 w-3" /> Signal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                        <CheckCircle2 className="h-3 w-3" /> No Signal
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "PRR", value: s.prr, threshold: 2 },
                      { label: "ROR", value: s.ror, threshold: 2 },
                      { label: "IC", value: s.ic, threshold: 0 },
                      { label: "EBGM", value: s.ebgm, threshold: 2 },
                    ].map((m) => {
                      const isHigh = m.value !== undefined && m.value > m.threshold;
                      return (
                        <div
                          key={m.label}
                          className={cn(
                            "rounded-lg border p-3 text-center",
                            isHigh ? "border-amber-500/30 bg-amber-500/5" : "bg-muted/30",
                          )}
                        >
                          <p className="text-xs text-muted-foreground">{m.label}</p>
                          <p className="text-lg font-bold">
                            {m.value?.toFixed(2) ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            &gt;{m.threshold}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Label */}
          {steps[4].status === "done" && labelSections.length > 0 && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 4: FDA Drug Label Review</h2>
              {labelSections.map((sec) => (
                <div key={sec.section} className="space-y-1">
                  <h3 className="text-sm font-medium">{sec.section}</h3>
                  <p className="max-h-40 overflow-y-auto rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                    {sec.text.slice(0, 1500)}
                    {sec.text.length > 1500 && "..."}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Literature */}
          {steps[5].status === "done" && articles.length > 0 && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 5: Published Literature</h2>
              <div className="space-y-2">
                {articles.map((a) => (
                  <div key={a.pmid} className="flex items-start gap-3 rounded-md border p-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.journal && `${a.journal} `}
                        {a.year && `(${a.year}) `}
                        PMID: {a.pmid}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Report */}
          {steps[6].status === "done" && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-semibold">
                Step 6: Your Drug Safety Profile is Ready
              </h2>
              <p className="text-sm text-muted-foreground">
                All data has been collected for <strong>{drugIdentity?.name}</strong>.
                Download your professional report or export the raw data.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={generateReport}
                  className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  <Download className="h-4 w-4" />
                  Download PDF Report
                </button>
                <button
                  onClick={exportJSON}
                  className="flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <FileText className="h-4 w-4" />
                  Export JSON Data
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={reset}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" /> Investigate another drug
                </button>
                <Link
                  href="/dashboards/signal"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Next: Signal Investigation <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {Object.values(steps).some((s) => s.status === "loading") && (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Querying AlgoVigilance Station — live data from FDA, NIH, and NLM...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
