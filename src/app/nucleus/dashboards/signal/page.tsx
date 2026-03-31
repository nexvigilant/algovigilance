"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
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
  searchFaers,
  computeDisproportionality,
  getDrugLabel,
  searchPubMed,
  searchCaseReports,
  type DrugIdentity,
  type FaersEvent,
  type DisproportionalityResult,
  type LabelSection,
  type PubMedArticle,
  type StepStatus,
} from "../station-client";
import {
  createSignalMeta,
  generateSignalReport,
  openReport,
  downloadJSON,
  type SignalReportData,
} from "../report-generator";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS: Record<Step, string> = {
  1: "Identify Drug",
  2: "Find Events",
  3: "Compute Signals",
  4: "Check Label",
  5: "Literature",
  6: "Verdict & Report",
};

const PRESETS = [
  { name: "Semaglutide", event: "Pancreatitis" },
  { name: "Metformin", event: "Lactic acidosis" },
  { name: "Lisinopril", event: "Angioedema" },
  { name: "Acetaminophen", event: "Hepatotoxicity" },
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

export default function SignalInvestigationPage() {
  const [drugInput, setDrugInput] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [steps, setSteps] = useState<Record<Step, StepStatus>>({
    1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" },
    4: { status: "pending" }, 5: { status: "pending" }, 6: { status: "pending" },
  });

  const [drugIdentity, setDrugIdentity] = useState<DrugIdentity | null>(null);
  const [faersEvents, setFaersEvents] = useState<FaersEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [dispro, setDispro] = useState<DisproportionalityResult | null>(null);
  const [labelSections, setLabelSections] = useState<LabelSection[]>([]);
  const [literature, setLiterature] = useState<PubMedArticle[]>([]);
  const [caseReports, setCaseReports] = useState<PubMedArticle[]>([]);

  const update = useCallback((step: Step, u: Partial<StepStatus>) => {
    setSteps((p) => ({ ...p, [step]: { ...p[step], ...u } }));
  }, []);

  const runStep1 = useCallback(async (name: string) => {
    setDrugInput(name);
    setCurrentStep(1);
    update(1, { status: "loading", startedAt: Date.now() });
    const id = await resolveDrug(name);
    if (!id) { update(1, { status: "error", error: `Could not resolve "${name}"`, completedAt: Date.now() }); return; }
    setDrugIdentity(id);
    update(1, { status: "done", completedAt: Date.now() });

    setCurrentStep(2);
    update(2, { status: "loading", startedAt: Date.now() });
    const events = await searchFaers(name, 15);
    setFaersEvents(events);
    update(2, { status: "done", completedAt: Date.now() });
    setCurrentStep(3);
  }, [update]);

  const runSignal = useCallback(async (event: string) => {
    setSelectedEvent(event);
    update(3, { status: "loading", startedAt: Date.now() });
    const result = await computeDisproportionality(drugInput, event);
    if (!result) { update(3, { status: "error", error: "Computation failed" }); return; }
    setDispro(result);
    update(3, { status: "done", completedAt: Date.now() });

    // Steps 4+5 in parallel
    setCurrentStep(4);
    update(4, { status: "loading", startedAt: Date.now() });
    update(5, { status: "loading", startedAt: Date.now() });

    const [labels, pubs, cases] = await Promise.all([
      getDrugLabel(drugInput),
      searchPubMed(drugInput, event, 8),
      searchCaseReports(drugInput, event, 5),
    ]);
    setLabelSections(labels);
    update(4, { status: "done", completedAt: Date.now() });
    setLiterature(pubs);
    setCaseReports(cases);
    update(5, { status: "done", completedAt: Date.now() });

    setCurrentStep(6);
    update(6, { status: "done", startedAt: Date.now(), completedAt: Date.now() });
  }, [drugInput, update]);

  const generateReport = useCallback(() => {
    if (!drugIdentity || !dispro) return;
    const metricsExceeded: string[] = [];
    if (dispro.prr !== undefined && dispro.prr > 2) metricsExceeded.push("PRR");
    if (dispro.ror !== undefined && dispro.ror > 2) metricsExceeded.push("ROR");
    if (dispro.ic !== undefined && dispro.ic > 0) metricsExceeded.push("IC");
    if (dispro.ebgm !== undefined && dispro.ebgm > 2) metricsExceeded.push("EBGM");

    const data: SignalReportData = {
      meta: createSignalMeta(drugIdentity.name, selectedEvent),
      drugIdentity,
      event: selectedEvent,
      disproportionality: dispro,
      labelSections,
      literature,
      caseReports,
      verdict: {
        signalDetected: dispro.signal,
        metricsExceeded,
        isLabeled: labelSections.some((s) =>
          s.text.toLowerCase().includes(selectedEvent.toLowerCase()),
        ),
        literatureSupport: literature.length,
      },
    };
    openReport(generateSignalReport(data));
  }, [drugIdentity, dispro, selectedEvent, labelSections, literature, caseReports]);

  const reset = useCallback(() => {
    setDrugInput(""); setCurrentStep(1);
    setSteps({ 1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" }, 4: { status: "pending" }, 5: { status: "pending" }, 6: { status: "pending" } });
    setDrugIdentity(null); setFaersEvents([]); setSelectedEvent("");
    setDispro(null); setLabelSections([]); setLiterature([]); setCaseReports([]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Activity className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Signal Investigation</h1>
            <p className="text-sm text-muted-foreground">Investigate a drug-event pair with full evidence chain</p>
          </div>
        </div>
        <Link href="/nucleus/dashboards" className="text-sm text-muted-foreground hover:text-primary">All Dashboards</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1 rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Steps</p>
          {([1,2,3,4,5,6] as Step[]).map((s) => <StepBar key={s} step={s} current={currentStep} state={steps[s]} />)}
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          {currentStep === 1 && steps[1].status !== "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 1: Choose a Drug</h2>
              <div className="flex gap-2">
                <input type="text" value={drugInput} onChange={(e) => setDrugInput(e.target.value)}
                  placeholder="Enter drug name..." className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter" && drugInput.trim()) runStep1(drugInput.trim()); }} />
                <button onClick={() => drugInput.trim() && runStep1(drugInput.trim())}
                  disabled={!drugInput.trim() || steps[1].status === "loading"}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {steps[1].status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Investigate
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick investigations:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button key={p.name} onClick={() => runStep1(p.name)}
                      className="rounded-full border px-3 py-1 text-sm hover:bg-muted">
                      {p.name} + {p.event}
                    </button>
                  ))}
                </div>
              </div>
              {steps[1].error && <p className="text-sm text-destructive">{steps[1].error}</p>}
            </div>
          )}

          {/* Drug identity result */}
          {drugIdentity && steps[1].status === "done" && (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{drugIdentity.name}</p>
                <p className="text-sm text-muted-foreground">RxCUI: {drugIdentity.rxcui}</p>
              </div>
              <button onClick={reset} className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          )}

          {/* Step 2/3: Events → pick → signal */}
          {steps[2].status === "done" && currentStep >= 3 && !dispro && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 2-3: Select an Event to Investigate</h2>
              <p className="text-sm text-muted-foreground">
                Top adverse events from{" "}
                <JargonBuster term="FAERS" definition="FDA Adverse Event Reporting System — the largest spontaneous reporting database">FAERS</JargonBuster>.
                Select one to compute signal scores.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {faersEvents.map((ev) => (
                  <button key={ev.term} onClick={() => runSignal(ev.term)}
                    disabled={steps[3].status === "loading"}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
                    <span className="truncate">{ev.term}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">{ev.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Signal scores */}
          {dispro && steps[3].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{drugIdentity?.name} + {selectedEvent}</h2>
                {dispro.signal ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                    <AlertTriangle className="h-3 w-3" /> Signal Detected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> No Signal
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {([
                  { label: "PRR", value: dispro.prr, threshold: 2 },
                  { label: "ROR", value: dispro.ror, threshold: 2 },
                  { label: "IC", value: dispro.ic, threshold: 0 },
                  { label: "EBGM", value: dispro.ebgm, threshold: 2 },
                ] as const).map((m) => {
                  const isHigh = m.value !== undefined && m.value > m.threshold;
                  return (
                    <div key={m.label} className={cn("rounded-lg border p-4 text-center", isHigh ? "border-amber-500/30 bg-amber-500/5" : "bg-muted/30")}>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-2xl font-bold">{m.value?.toFixed(2) ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">&gt;{m.threshold}</p>
                    </div>
                  );
                })}
              </div>
              {dispro.cases !== undefined && (
                <p className="text-sm text-muted-foreground">Based on {dispro.cases.toLocaleString()} cases</p>
              )}
            </div>
          )}

          {/* Label */}
          {steps[4].status === "done" && labelSections.length > 0 && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 4: Drug Label Review</h2>
              {labelSections.map((s) => (
                <div key={s.section} className="space-y-1">
                  <h3 className="text-sm font-medium">{s.section}</h3>
                  <p className="max-h-40 overflow-y-auto rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                    {s.text.slice(0, 1500)}{s.text.length > 1500 && "..."}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Literature */}
          {steps[5].status === "done" && (literature.length > 0 || caseReports.length > 0) && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 5: Literature & Case Reports</h2>
              {literature.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Safety Literature</h3>
                  {literature.map((a) => (
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
              {caseReports.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Published Case Reports</h3>
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
            </div>
          )}

          {/* Verdict & Report */}
          {steps[6].status === "done" && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-semibold">Step 6: Signal Assessment Complete</h2>
              <p className="text-sm text-muted-foreground">
                Full evidence chain collected for <strong>{drugIdentity?.name}</strong> + <strong>{selectedEvent}</strong>.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={generateReport}
                  className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  <Download className="h-4 w-4" /> Download Signal Report
                </button>
                <button onClick={() => downloadJSON(
                  { drugIdentity, selectedEvent, dispro, labelSections, literature, caseReports },
                  `signal-${drugIdentity?.name.toLowerCase()}-${selectedEvent.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.json`,
                )} className="flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted">
                  <FileText className="h-4 w-4" /> Export JSON
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-3 w-3" /> New investigation
                </button>
                <Link href="/nucleus/dashboards/causality" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  Next: Causality Assessment <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {Object.values(steps).some((s) => s.status === "loading") && (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Querying AlgoVigilance Station...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
