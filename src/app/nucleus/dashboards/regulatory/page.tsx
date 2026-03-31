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
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  resolveDrug,
  getDrugLabel,
  searchICHGuidelines,
  searchFDAApprovals,
  getEMASafetySignals,
  type DrugIdentity,
  type LabelSection,
  type RegulatoryGuideline,
  type StepStatus,
} from "../station-client";
import { openReport, downloadJSON } from "../report-generator";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Identify Drug",
  2: "ICH Guidelines",
  3: "FDA & EMA",
  4: "Report",
};

function reportStyles(): string {
  return `<style>
    @page { margin: 1in; size: A4; }
    @media print { .no-print { display: none !important; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a2e; background: #fff; max-width: 900px; margin: 0 auto; padding: 40px 24px; }
    .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24pt; margin-bottom: 4px; }
    .brand { color: #6366f1; font-weight: 600; }
    section { margin-bottom: 28px; }
    h2 { font-size: 14pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; }
    .disclaimer { margin-top: 40px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 9pt; color: #64748b; }
    .footer { margin-top: 30px; text-align: center; font-size: 9pt; color: #94a3b8; }
    .actions { position: fixed; top: 16px; right: 16px; display: flex; gap: 8px; z-index: 100; }
    .actions button { padding: 8px 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 10pt; }
    .actions button.primary { background: #6366f1; color: white; border-color: #6366f1; }
    .label-text { background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 10pt; max-height: 200px; overflow-y: auto; white-space: pre-wrap; }
  </style>`;
}

export default function RegulatoryPage() {
  const [drugInput, setDrugInput] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [steps, setSteps] = useState<Record<Step, StepStatus>>({
    1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" }, 4: { status: "pending" },
  });

  const [drugIdentity, setDrugIdentity] = useState<DrugIdentity | null>(null);
  const [guidelines, setGuidelines] = useState<RegulatoryGuideline[]>([]);
  const [fdaApprovals, setFdaApprovals] = useState<Record<string, unknown> | null>(null);
  const [emaSignals, setEmaSignals] = useState<Record<string, unknown> | null>(null);
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

    // Step 2: ICH Guidelines
    setCurrentStep(2);
    update(2, { status: "loading", startedAt: Date.now() });
    const guidelineResults = await searchICHGuidelines(name);
    setGuidelines(guidelineResults);
    update(2, { status: "done", completedAt: Date.now() });

    // Step 3: FDA + EMA + Label (parallel)
    setCurrentStep(3);
    update(3, { status: "loading", startedAt: Date.now() });
    const [fda, ema, labels] = await Promise.all([
      searchFDAApprovals(name),
      getEMASafetySignals(name),
      getDrugLabel(name),
    ]);
    setFdaApprovals(fda);
    setEmaSignals(ema);
    setLabelSections(labels);
    update(3, { status: "done", completedAt: Date.now() });

    // Step 4
    setCurrentStep(4);
    update(4, { status: "done", startedAt: Date.now(), completedAt: Date.now() });
  }, [update]);

  const generateReport = useCallback(() => {
    if (!drugIdentity) return;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Regulatory Intelligence Brief: ${drugIdentity.name}</title>${reportStyles()}</head><body>
      <div class="actions no-print"><button onclick="window.print()" class="primary">Download PDF</button><button onclick="window.close()">Close</button></div>
      <div class="header"><h1>Regulatory Intelligence Brief: ${drugIdentity.name}</h1><p>Generated by <span class="brand">AlgoVigilance Station</span> on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p></div>
      <section><h2>Drug Identification</h2><table><tr><th>Name</th><td>${drugIdentity.name}</td></tr><tr><th>RxCUI</th><td>${drugIdentity.rxcui}</td></tr></table></section>
      ${guidelines.length > 0 ? `<section><h2>Relevant ICH Guidelines</h2><table><tr><th>ID</th><th>Title</th><th>Summary</th></tr>${guidelines.map((g) => `<tr><td>${g.id}</td><td>${g.title}</td><td>${g.summary.slice(0, 200)}</td></tr>`).join("")}</table></section>` : ""}
      ${fdaApprovals ? `<section><h2>FDA Approval History</h2><pre style="background:#f8fafc;padding:12px;border-radius:6px;font-size:10pt;overflow-x:auto;">${JSON.stringify(fdaApprovals, null, 2).slice(0, 3000)}</pre></section>` : ""}
      ${emaSignals ? `<section><h2>EMA Safety Signals</h2><pre style="background:#f8fafc;padding:12px;border-radius:6px;font-size:10pt;overflow-x:auto;">${JSON.stringify(emaSignals, null, 2).slice(0, 3000)}</pre></section>` : ""}
      ${labelSections.length > 0 ? `<section><h2>FDA Drug Label</h2>${labelSections.map((s) => `<h3 style="font-size:12pt;margin:8px 0 4px;">${s.section}</h3><div class="label-text">${s.text.slice(0, 2000)}</div>`).join("")}</section>` : ""}
      <div class="disclaimer"><strong>Disclaimer:</strong> This brief is for research purposes using publicly available data via AlgoVigilance Station. It does not constitute regulatory advice.</div>
      <div class="footer">AlgoVigilance — nexvigilant.com</div>
    </body></html>`;
    openReport(html);
  }, [drugIdentity, guidelines, fdaApprovals, emaSignals, labelSections]);

  const reset = useCallback(() => {
    setDrugInput(""); setCurrentStep(1);
    setSteps({ 1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" }, 4: { status: "pending" } });
    setDrugIdentity(null); setGuidelines([]); setFdaApprovals(null); setEmaSignals(null); setLabelSections([]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <Shield className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Regulatory Intelligence</h1>
            <p className="text-sm text-muted-foreground">ICH guidelines, FDA approvals, EMA signals</p>
          </div>
        </div>
        <Link href="/nucleus/dashboards" className="text-sm text-muted-foreground hover:text-primary">All Dashboards</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1 rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Steps</p>
          {([1,2,3,4] as Step[]).map((s) => (
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
                  Research
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Semaglutide", "Ozempic", "Metformin", "Atorvastatin"].map((d) => (
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
              <h2 className="text-lg font-semibold">Step 2: ICH Guidelines</h2>
              {guidelines.length > 0 ? guidelines.map((g) => (
                <div key={g.id} className="flex items-start gap-3 rounded-md border p-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{g.id}: {g.title}</p>
                    <p className="text-xs text-muted-foreground">{g.summary.slice(0, 200)}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No specific ICH guidelines found for this drug.</p>}
            </div>
          )}

          {steps[3].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 3: FDA & EMA Intelligence</h2>
              {fdaApprovals && (
                <div>
                  <h3 className="text-sm font-medium">FDA Approval Data</h3>
                  <pre className="max-h-48 overflow-y-auto rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                    {JSON.stringify(fdaApprovals, null, 2).slice(0, 2000)}
                  </pre>
                </div>
              )}
              {emaSignals && (
                <div>
                  <h3 className="text-sm font-medium">EMA Safety Signals</h3>
                  <pre className="max-h-48 overflow-y-auto rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                    {JSON.stringify(emaSignals, null, 2).slice(0, 2000)}
                  </pre>
                </div>
              )}
              {labelSections.length > 0 && labelSections.map((s) => (
                <div key={s.section}>
                  <h3 className="text-sm font-medium">{s.section}</h3>
                  <p className="max-h-32 overflow-y-auto rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                    {s.text.slice(0, 1000)}{s.text.length > 1000 && "..."}
                  </p>
                </div>
              ))}
            </div>
          )}

          {steps[4].status === "done" && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-semibold">Step 4: Regulatory Brief Ready</h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={generateReport}
                  className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  <Download className="h-4 w-4" /> Download Brief
                </button>
                <button onClick={() => downloadJSON(
                  { drug: drugIdentity?.name, guidelines, fdaApprovals, emaSignals, labelSections },
                  `regulatory-${drugIdentity?.name.toLowerCase()}-${Date.now()}.json`,
                )} className="flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted">
                  <FileText className="h-4 w-4" /> Export JSON
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-3 w-3" /> New research
                </button>
                <Link href="/nucleus/dashboards/competitive" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  Next: Competitive Landscape <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {Object.values(steps).some((s) => s.status === "loading") && (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Querying regulatory databases...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
