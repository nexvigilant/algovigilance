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
  Scale,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  resolveDrug,
  searchFaers,
  getFaersOutcomes,
  getDrugLabel,
  searchClinicalTrials,
  type DrugIdentity,
  type FaersEvent,
  type LabelSection,
  type ClinicalTrial,
  type StepStatus,
} from "../station-client";
import {
  createBenefitRiskMeta,
  generateBenefitRiskReport,
  openReport,
  downloadJSON,
} from "../report-generator";

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<Step, string> = {
  1: "Identify Drug",
  2: "Benefits (Trials)",
  3: "Risks (FAERS)",
  4: "Label Review",
  5: "Assessment & Report",
};

export default function BenefitRiskPage() {
  const [drugInput, setDrugInput] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [steps, setSteps] = useState<Record<Step, StepStatus>>({
    1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" },
    4: { status: "pending" }, 5: { status: "pending" },
  });

  const [drugIdentity, setDrugIdentity] = useState<DrugIdentity | null>(null);
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [faersEvents, setFaersEvents] = useState<FaersEvent[]>([]);
  const [outcomes, setOutcomes] = useState<{ serious: number; deaths: number; hospitalizations: number; total: number } | null>(null);
  const [labelSections, setLabelSections] = useState<LabelSection[]>([]);

  const update = useCallback((step: Step, u: Partial<StepStatus>) => {
    setSteps((p) => ({ ...p, [step]: { ...p[step], ...u } }));
  }, []);

  const runPipeline = useCallback(async (name: string) => {
    setDrugInput(name);
    // Step 1
    setCurrentStep(1);
    update(1, { status: "loading", startedAt: Date.now() });
    const id = await resolveDrug(name);
    if (!id) { update(1, { status: "error", error: `Could not resolve "${name}"` }); return; }
    setDrugIdentity(id);
    update(1, { status: "done", completedAt: Date.now() });

    // Step 2: Benefits — clinical trials
    setCurrentStep(2);
    update(2, { status: "loading", startedAt: Date.now() });
    const trialResults = await searchClinicalTrials(name, 10);
    setTrials(trialResults);
    update(2, { status: "done", completedAt: Date.now() });

    // Step 3: Risks — FAERS
    setCurrentStep(3);
    update(3, { status: "loading", startedAt: Date.now() });
    const [events, out] = await Promise.all([searchFaers(name, 15), getFaersOutcomes(name)]);
    setFaersEvents(events);
    setOutcomes(out);
    update(3, { status: "done", completedAt: Date.now() });

    // Step 4: Label
    setCurrentStep(4);
    update(4, { status: "loading", startedAt: Date.now() });
    const labels = await getDrugLabel(name);
    setLabelSections(labels);
    update(4, { status: "done", completedAt: Date.now() });

    // Step 5: Ready
    setCurrentStep(5);
    update(5, { status: "done", startedAt: Date.now(), completedAt: Date.now() });
  }, [update]);

  const generateReport = useCallback(() => {
    if (!drugIdentity) return;
    const benefits = trials.slice(0, 5).map((t) => ({
      metric: t.title.slice(0, 80),
      value: `Phase ${t.phase ?? "N/A"}, ${t.enrollment ?? "N/A"} enrolled`,
      source: `ClinicalTrials.gov ${t.nctId}`,
    }));
    const risks = faersEvents.slice(0, 10).map((e) => ({
      event: e.term,
      frequency: `${e.count} reports`,
      seriousness: "See FAERS data",
    }));
    const seriousRate = outcomes ? (outcomes.serious / Math.max(outcomes.total, 1) * 100).toFixed(1) : "N/A";
    openReport(generateBenefitRiskReport({
      meta: createBenefitRiskMeta(drugIdentity.name),
      drug: drugIdentity.name,
      benefits,
      risks,
      recommendation: `Based on ${trials.length} clinical trials and ${faersEvents.length} adverse event categories from FAERS (${seriousRate}% serious rate), a quantitative benefit-risk assessment should weigh clinical efficacy endpoints against the observed safety profile.`,
    }));
  }, [drugIdentity, trials, faersEvents, outcomes]);

  const reset = useCallback(() => {
    setDrugInput(""); setCurrentStep(1);
    setSteps({ 1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" }, 4: { status: "pending" }, 5: { status: "pending" } });
    setDrugIdentity(null); setTrials([]); setFaersEvents([]); setOutcomes(null); setLabelSections([]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <Scale className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Benefit-Risk Assessment</h1>
            <p className="text-sm text-muted-foreground">Weigh benefits against safety risks</p>
          </div>
        </div>
        <Link href="/dashboards" className="text-sm text-muted-foreground hover:text-primary">All Dashboards</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1 rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Steps</p>
          {([1,2,3,4,5] as Step[]).map((s) => (
            <div key={s} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              s === currentStep && "bg-primary/10 text-primary font-medium",
              steps[s].status === "done" && "text-green-500",
              s !== currentStep && steps[s].status !== "done" && "text-muted-foreground")}>
              {steps[s].status === "done" ? <CheckCircle2 className="h-4 w-4" /> :
               steps[s].status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> :
               <span className="flex h-4 w-4 items-center justify-center rounded-full border text-xs">{s}</span>}
              {STEP_LABELS[s]}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {currentStep === 1 && steps[1].status !== "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 1: Choose a Drug</h2>
              <div className="flex gap-2">
                <input type="text" value={drugInput} onChange={(e) => setDrugInput(e.target.value)}
                  placeholder="Enter drug name..." className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter" && drugInput.trim()) runPipeline(drugInput.trim()); }} />
                <button onClick={() => drugInput.trim() && runPipeline(drugInput.trim())}
                  disabled={!drugInput.trim() || steps[1].status === "loading"}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {steps[1].status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Assess
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Semaglutide", "Metformin", "Atorvastatin", "Omeprazole"].map((d) => (
                  <button key={d} onClick={() => runPipeline(d)} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">{d}</button>
                ))}
              </div>
            </div>
          )}

          {drugIdentity && steps[1].status === "done" && (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="font-medium">{drugIdentity.name} (RxCUI: {drugIdentity.rxcui})</p>
              <button onClick={reset} className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          )}

          {steps[2].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 2: Clinical Trial Evidence (Benefits)</h2>
              {trials.length > 0 ? (
                <div className="space-y-2">
                  {trials.map((t) => (
                    <div key={t.nctId} className="flex items-start gap-3 rounded-md border p-3">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t.title.slice(0, 120)}{t.title.length > 120 ? "..." : ""}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.nctId} | {t.status} | Phase {t.phase ?? "N/A"} | {t.enrollment ?? "N/A"} enrolled
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No clinical trials found.</p>}
            </div>
          )}

          {steps[3].status === "done" && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 3: Safety Profile (Risks)</h2>
              {outcomes && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total", value: outcomes.total },
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
                {faersEvents.slice(0, 12).map((ev) => (
                  <div key={ev.term} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span className="truncate">{ev.term}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">{ev.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {steps[4].status === "done" && labelSections.length > 0 && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 4: FDA Label Review</h2>
              {labelSections.map((s) => (
                <div key={s.section}>
                  <h3 className="text-sm font-medium">{s.section}</h3>
                  <p className="max-h-32 overflow-y-auto rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                    {s.text.slice(0, 1200)}{s.text.length > 1200 && "..."}
                  </p>
                </div>
              ))}
            </div>
          )}

          {steps[5].status === "done" && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-semibold">Step 5: Benefit-Risk Report Ready</h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={generateReport}
                  className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  <Download className="h-4 w-4" /> Download Report
                </button>
                <button onClick={() => downloadJSON(
                  { drug: drugIdentity?.name, trials, faersEvents, outcomes, labelSections },
                  `benefit-risk-${drugIdentity?.name.toLowerCase()}-${Date.now()}.json`,
                )} className="flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted">
                  <FileText className="h-4 w-4" /> Export JSON
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-3 w-3" /> New assessment
                </button>
                <Link href="/dashboards/regulatory" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  Next: Regulatory Intelligence <ArrowRight className="h-4 w-4" />
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
