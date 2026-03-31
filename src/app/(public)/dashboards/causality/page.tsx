"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  resolveDrug,
  computeNaranjo,
  computeWhoUmc,
  searchCaseReports,
  type DrugIdentity,
  type NaranjoResult,
  type WhoUmcResult,
  type PubMedArticle,
  type StepStatus,
} from "../station-client";
import {
  createCausalityMeta,
  generateCausalityReport,
  openReport,
  downloadJSON,
} from "../report-generator";

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<Step, string> = {
  1: "Drug & Event",
  2: "Naranjo Algorithm",
  3: "WHO-UMC Assessment",
  4: "Case Reports",
  5: "Report",
};

// Naranjo questions
const NARANJO_QUESTIONS = [
  { id: "q1", text: "Are there previous conclusive reports on this reaction?", yes: 1, no: 0, dk: 0 },
  { id: "q2", text: "Did the adverse event appear after the suspected drug was given?", yes: 2, no: -1, dk: 0 },
  { id: "q3", text: "Did the adverse reaction improve when the drug was discontinued or a specific antagonist was given?", yes: 1, no: 0, dk: 0 },
  { id: "q4", text: "Did the adverse reaction reappear when the drug was readministered?", yes: 2, no: -1, dk: 0 },
  { id: "q5", text: "Are there alternative causes that could have caused the reaction?", yes: -1, no: 2, dk: 0 },
  { id: "q6", text: "Did the reaction reappear when a placebo was given?", yes: -1, no: 1, dk: 0 },
  { id: "q7", text: "Was the drug detected in the blood in concentrations known to be toxic?", yes: 1, no: 0, dk: 0 },
  { id: "q8", text: "Was the reaction more severe when the dose was increased, or less severe when decreased?", yes: 1, no: 0, dk: 0 },
  { id: "q9", text: "Did the patient have a similar reaction to the same or similar drugs in a previous exposure?", yes: 1, no: 0, dk: 0 },
  { id: "q10", text: "Was the adverse event confirmed by any objective evidence?", yes: 1, no: 0, dk: 0 },
];

function StepBar({ step, current, state }: { step: Step; current: Step; state: StepStatus }) {
  const isDone = state.status === "done";
  const isLoading = state.status === "loading";
  const isActive = step === current;
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
      isActive && "bg-primary/10 text-primary font-medium",
      isDone && "text-green-500",
      !isActive && !isDone && "text-muted-foreground",
    )}>
      {isDone ? <CheckCircle2 className="h-4 w-4" /> :
       isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
       <span className="flex h-4 w-4 items-center justify-center rounded-full border text-xs">{step}</span>}
      {STEP_LABELS[step]}
    </div>
  );
}

function getCausalityClass(score: number): string {
  if (score >= 9) return "Definite";
  if (score >= 5) return "Probable";
  if (score >= 1) return "Possible";
  return "Doubtful";
}

export default function CausalityPage() {
  const [drugInput, setDrugInput] = useState("");
  const [eventInput, setEventInput] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [steps, setSteps] = useState<Record<Step, StepStatus>>({
    1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" },
    4: { status: "pending" }, 5: { status: "pending" },
  });

  const [drugIdentity, setDrugIdentity] = useState<DrugIdentity | null>(null);
  const [naranjoAnswers, setNaranjoAnswers] = useState<Record<string, "yes" | "no" | "dk">>({});
  const [naranjoResult, setNaranjoResult] = useState<NaranjoResult | null>(null);
  const [whoUmcResult, setWhoUmcResult] = useState<WhoUmcResult | null>(null);
  const [caseReports, setCaseReports] = useState<PubMedArticle[]>([]);

  const update = useCallback((step: Step, u: Partial<StepStatus>) => {
    setSteps((p) => ({ ...p, [step]: { ...p[step], ...u } }));
  }, []);

  // Step 1: Resolve drug
  const runStep1 = useCallback(async () => {
    if (!drugInput.trim() || !eventInput.trim()) return;
    update(1, { status: "loading", startedAt: Date.now() });
    const id = await resolveDrug(drugInput.trim());
    if (!id) { update(1, { status: "error", error: `Could not resolve "${drugInput}"` }); return; }
    setDrugIdentity(id);
    update(1, { status: "done", completedAt: Date.now() });
    setCurrentStep(2);
  }, [drugInput, eventInput, update]);

  // Step 2: Naranjo scoring
  const runNaranjo = useCallback(async () => {
    update(2, { status: "loading", startedAt: Date.now() });
    const answers: Record<string, number> = {};
    for (const q of NARANJO_QUESTIONS) {
      const answer = naranjoAnswers[q.id];
      answers[q.id] = answer === "yes" ? q.yes : answer === "no" ? q.no : q.dk;
    }
    const result = await computeNaranjo(drugInput, eventInput, answers);
    if (result) {
      setNaranjoResult(result);
      update(2, { status: "done", completedAt: Date.now() });
    } else {
      // Compute locally if Station fails
      const localScore = Object.values(answers).reduce((a, b) => a + b, 0);
      setNaranjoResult({ score: localScore, category: getCausalityClass(localScore), answers });
      update(2, { status: "done", completedAt: Date.now() });
    }
    setCurrentStep(3);
  }, [drugInput, eventInput, naranjoAnswers, update]);

  // Step 3: WHO-UMC
  const [whoParams, setWhoParams] = useState({
    time_relationship: false,
    dechallenge: false,
    rechallenge: false,
    alternative_causes: false,
  });

  const runWhoUmc = useCallback(async () => {
    update(3, { status: "loading", startedAt: Date.now() });
    const result = await computeWhoUmc(drugInput, eventInput, whoParams);
    if (result) setWhoUmcResult(result);
    update(3, { status: "done", completedAt: Date.now() });

    // Step 4: Case reports
    setCurrentStep(4);
    update(4, { status: "loading", startedAt: Date.now() });
    const reports = await searchCaseReports(drugInput, eventInput, 5);
    setCaseReports(reports);
    update(4, { status: "done", completedAt: Date.now() });

    setCurrentStep(5);
    update(5, { status: "done", startedAt: Date.now(), completedAt: Date.now() });
  }, [drugInput, eventInput, whoParams, update]);

  const generateReport = useCallback(() => {
    if (!drugIdentity) return;
    openReport(generateCausalityReport({
      meta: createCausalityMeta(drugInput, eventInput),
      drug: drugInput,
      event: eventInput,
      naranjo: naranjoResult ?? undefined,
      whoUmc: whoUmcResult ?? undefined,
      caseReports,
    }));
  }, [drugIdentity, drugInput, eventInput, naranjoResult, whoUmcResult, caseReports]);

  const reset = useCallback(() => {
    setDrugInput(""); setEventInput(""); setCurrentStep(1);
    setSteps({ 1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" }, 4: { status: "pending" }, 5: { status: "pending" } });
    setDrugIdentity(null); setNaranjoAnswers({}); setNaranjoResult(null);
    setWhoUmcResult(null); setCaseReports([]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Search className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Causality Assessment</h1>
            <p className="text-sm text-muted-foreground">Determine if a drug caused an adverse event</p>
          </div>
        </div>
        <Link href="/dashboards" className="text-sm text-muted-foreground hover:text-primary">All Dashboards</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1 rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Steps</p>
          {([1,2,3,4,5] as Step[]).map((s) => <StepBar key={s} step={s} current={currentStep} state={steps[s]} />)}
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          {currentStep === 1 && steps[1].status !== "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 1: Drug and Event</h2>
              <p className="text-sm text-muted-foreground">
                Enter the suspected drug and the adverse event you want to assess causality for.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Drug Name</label>
                  <input type="text" value={drugInput} onChange={(e) => setDrugInput(e.target.value)}
                    placeholder="e.g., Semaglutide" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Adverse Event</label>
                  <input type="text" value={eventInput} onChange={(e) => setEventInput(e.target.value)}
                    placeholder="e.g., Pancreatitis" className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") runStep1(); }} />
                </div>
              </div>
              <button onClick={runStep1}
                disabled={!drugInput.trim() || !eventInput.trim() || steps[1].status === "loading"}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {steps[1].status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Begin Assessment
              </button>
              {steps[1].error && <p className="text-sm text-destructive">{steps[1].error}</p>}
            </div>
          )}

          {/* Drug identity */}
          {drugIdentity && steps[1].status === "done" && (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{drugIdentity.name} + {eventInput}</p>
                <p className="text-sm text-muted-foreground">RxCUI: {drugIdentity.rxcui}</p>
              </div>
              <button onClick={reset} className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          )}

          {/* Step 2: Naranjo */}
          {currentStep === 2 && steps[1].status === "done" && steps[2].status !== "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">
                Step 2:{" "}
                <JargonBuster term="Naranjo Algorithm" definition="A 10-question standardized scoring system that categorizes the likelihood of an adverse drug reaction as Definite, Probable, Possible, or Doubtful">
                  Naranjo Algorithm
                </JargonBuster>
              </h2>
              <p className="text-sm text-muted-foreground">Answer each question about the drug-event relationship.</p>

              <div className="space-y-3">
                {NARANJO_QUESTIONS.map((q, i) => (
                  <div key={q.id} className="rounded-md border p-3">
                    <p className="mb-2 text-sm"><span className="font-medium">Q{i + 1}:</span> {q.text}</p>
                    <div className="flex gap-2">
                      {(["yes", "no", "dk"] as const).map((opt) => (
                        <button key={opt} onClick={() => setNaranjoAnswers((p) => ({ ...p, [q.id]: opt }))}
                          className={cn("rounded-md border px-3 py-1 text-sm",
                            naranjoAnswers[q.id] === opt ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                          {opt === "dk" ? "Don't Know" : opt === "yes" ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={runNaranjo}
                disabled={Object.keys(naranjoAnswers).length < 10 || steps[2].status === "loading"}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {steps[2].status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Score ({Object.keys(naranjoAnswers).length}/10 answered)
              </button>
            </div>
          )}

          {/* Naranjo Result */}
          {naranjoResult && steps[2].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Naranjo Result</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className={cn("rounded-lg border p-4 text-center",
                  naranjoResult.score >= 9 ? "border-red-500/30 bg-red-500/5" :
                  naranjoResult.score >= 5 ? "border-amber-500/30 bg-amber-500/5" :
                  naranjoResult.score >= 1 ? "border-yellow-500/30 bg-yellow-500/5" :
                  "border-green-500/30 bg-green-500/5")}>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-3xl font-bold">{naranjoResult.score}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-xl font-bold">{naranjoResult.category}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: WHO-UMC */}
          {currentStep === 3 && steps[2].status === "done" && steps[3].status !== "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">
                Step 3:{" "}
                <JargonBuster term="WHO-UMC" definition="World Health Organization Uppsala Monitoring Centre causality categories — Certain, Probable, Possible, Unlikely, Conditional, Unassessable">
                  WHO-UMC Assessment
                </JargonBuster>
              </h2>
              <div className="space-y-3">
                {[
                  { key: "time_relationship" as const, label: "Reasonable time relationship between drug and event?" },
                  { key: "dechallenge" as const, label: "Event improved when drug was stopped (positive dechallenge)?" },
                  { key: "rechallenge" as const, label: "Event recurred when drug was restarted (positive rechallenge)?" },
                  { key: "alternative_causes" as const, label: "Can alternative causes be ruled out?" },
                ].map((q) => (
                  <div key={q.key} className="flex items-center justify-between rounded-md border p-3">
                    <p className="text-sm">{q.label}</p>
                    <button onClick={() => setWhoParams((p) => ({ ...p, [q.key]: !p[q.key] }))}
                      className={cn("rounded-md border px-4 py-1 text-sm font-medium",
                        whoParams[q.key] ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                      {whoParams[q.key] ? "Yes" : "No"}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={runWhoUmc}
                disabled={steps[3].status === "loading"}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {steps[3].status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Assess
              </button>
            </div>
          )}

          {/* WHO-UMC Result */}
          {whoUmcResult && steps[3].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">WHO-UMC Result</h2>
              <div className="rounded-lg border p-4">
                <p className="text-xl font-bold">{whoUmcResult.category}</p>
                <p className="text-sm text-muted-foreground">{whoUmcResult.description}</p>
              </div>
            </div>
          )}

          {/* Step 4: Case Reports */}
          {steps[4].status === "done" && caseReports.length > 0 && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 4: Published Case Reports</h2>
              {caseReports.map((a) => (
                <div key={a.pmid} className="flex items-start gap-3 rounded-md border p-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.journal ?? ""} {a.year ? `(${a.year})` : ""} PMID: {a.pmid}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Report */}
          {steps[5].status === "done" && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-semibold">Step 5: Causality Report Ready</h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={generateReport}
                  className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  <Download className="h-4 w-4" /> Download Causality Report
                </button>
                <button onClick={() => downloadJSON(
                  { drug: drugInput, event: eventInput, naranjo: naranjoResult, whoUmc: whoUmcResult, caseReports },
                  `causality-${drugInput.toLowerCase()}-${eventInput.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.json`,
                )} className="flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted">
                  <FileText className="h-4 w-4" /> Export JSON
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-3 w-3" /> New assessment
                </button>
                <Link href="/dashboards/benefit-risk" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  Next: Benefit-Risk <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {Object.values(steps).some((s) => s.status === "loading") && (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
