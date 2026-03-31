"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  resolveDrug,
  searchFaers,
  computeDisproportionality,
  searchClinicalTrials,
  searchPubMed,
  type DrugIdentity,
  type FaersEvent,
  type DisproportionalityResult,
  type ClinicalTrial,
  type PubMedArticle,
  type StepStatus,
} from "../station-client";
import { openReport, downloadJSON } from "../report-generator";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Select Drugs",
  2: "Compare Safety",
  3: "Pipeline & Literature",
  4: "Report",
};

interface DrugComparison {
  identity: DrugIdentity;
  events: FaersEvent[];
  signals: DisproportionalityResult[];
  trials: ClinicalTrial[];
}

function reportStyles(): string {
  return `<style>
    @page { margin: 1in; size: A4 landscape; }
    @media print { .no-print { display: none !important; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a2e; background: #fff; max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
    .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 22pt; margin-bottom: 4px; }
    .brand { color: #6366f1; font-weight: 600; }
    section { margin-bottom: 28px; }
    h2 { font-size: 14pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; }
    .signal { background: #fffbeb; }
    .disclaimer { margin-top: 40px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 9pt; color: #64748b; }
    .footer { margin-top: 30px; text-align: center; font-size: 9pt; color: #94a3b8; }
    .actions { position: fixed; top: 16px; right: 16px; display: flex; gap: 8px; z-index: 100; }
    .actions button { padding: 8px 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 10pt; }
    .actions button.primary { background: #6366f1; color: white; border-color: #6366f1; }
  </style>`;
}

export default function CompetitivePage() {
  const [drug1Input, setDrug1Input] = useState("");
  const [drug2Input, setDrug2Input] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [steps, setSteps] = useState<Record<Step, StepStatus>>({
    1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" }, 4: { status: "pending" },
  });

  const [drug1, setDrug1] = useState<DrugComparison | null>(null);
  const [drug2, setDrug2] = useState<DrugComparison | null>(null);
  const [literature, setLiterature] = useState<PubMedArticle[]>([]);

  const update = useCallback((step: Step, u: Partial<StepStatus>) => {
    setSteps((p) => ({ ...p, [step]: { ...p[step], ...u } }));
  }, []);

  const runComparison = useCallback(async () => {
    if (!drug1Input.trim() || !drug2Input.trim()) return;

    // Step 1: Resolve both drugs
    setCurrentStep(1);
    update(1, { status: "loading", startedAt: Date.now() });
    const [id1, id2] = await Promise.all([resolveDrug(drug1Input), resolveDrug(drug2Input)]);
    if (!id1 || !id2) {
      update(1, { status: "error", error: `Could not resolve one or both drugs` });
      return;
    }
    update(1, { status: "done", completedAt: Date.now() });

    // Step 2: Compare safety (FAERS + signals)
    setCurrentStep(2);
    update(2, { status: "loading", startedAt: Date.now() });
    const [events1, events2] = await Promise.all([
      searchFaers(drug1Input, 10),
      searchFaers(drug2Input, 10),
    ]);

    // Compute signals on shared top events
    const allEvents = [...new Set([...events1.slice(0, 3).map((e) => e.term), ...events2.slice(0, 3).map((e) => e.term)])];
    const [signals1, signals2] = await Promise.all([
      Promise.all(allEvents.slice(0, 3).map((ev) => computeDisproportionality(drug1Input, ev))),
      Promise.all(allEvents.slice(0, 3).map((ev) => computeDisproportionality(drug2Input, ev))),
    ]);

    setDrug1({ identity: id1, events: events1, signals: signals1.filter((s): s is DisproportionalityResult => s !== null), trials: [] });
    setDrug2({ identity: id2, events: events2, signals: signals2.filter((s): s is DisproportionalityResult => s !== null), trials: [] });
    update(2, { status: "done", completedAt: Date.now() });

    // Step 3: Clinical trials + literature
    setCurrentStep(3);
    update(3, { status: "loading", startedAt: Date.now() });
    const [trials1, trials2, pubs] = await Promise.all([
      searchClinicalTrials(drug1Input, 5),
      searchClinicalTrials(drug2Input, 5),
      searchPubMed(drug1Input, drug2Input, 5),
    ]);
    setDrug1((prev) => prev ? { ...prev, trials: trials1 } : prev);
    setDrug2((prev) => prev ? { ...prev, trials: trials2 } : prev);
    setLiterature(pubs);
    update(3, { status: "done", completedAt: Date.now() });

    setCurrentStep(4);
    update(4, { status: "done", startedAt: Date.now(), completedAt: Date.now() });
  }, [drug1Input, drug2Input, update]);

  const generateReport = useCallback(() => {
    if (!drug1 || !drug2) return;
    const signalRows = (d: DrugComparison) => d.signals.map((s) =>
      `<tr${s.signal ? ' class="signal"' : ''}><td>${s.event}</td><td>${s.prr?.toFixed(2) ?? "—"}</td><td>${s.ror?.toFixed(2) ?? "—"}</td><td>${s.ic?.toFixed(2) ?? "—"}</td><td>${s.ebgm?.toFixed(2) ?? "—"}</td><td>${s.signal ? "Yes" : "No"}</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Competitive Landscape: ${drug1.identity.name} vs ${drug2.identity.name}</title>${reportStyles()}</head><body>
      <div class="actions no-print"><button onclick="window.print()" class="primary">Download PDF</button><button onclick="window.close()">Close</button></div>
      <div class="header"><h1>Competitive Landscape: ${drug1.identity.name} vs ${drug2.identity.name}</h1><p>Generated by <span class="brand">AlgoVigilance Station</span> on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p></div>

      <section><h2>${drug1.identity.name} — Safety Signal Profile</h2>
        <table><tr><th>Event</th><th>PRR</th><th>ROR</th><th>IC</th><th>EBGM</th><th>Signal?</th></tr>${signalRows(drug1)}</table>
        <p style="font-size:10pt;color:#64748b;">Top events: ${drug1.events.slice(0, 5).map((e) => `${e.term} (${e.count})`).join(", ")}</p>
      </section>

      <section><h2>${drug2.identity.name} — Safety Signal Profile</h2>
        <table><tr><th>Event</th><th>PRR</th><th>ROR</th><th>IC</th><th>EBGM</th><th>Signal?</th></tr>${signalRows(drug2)}</table>
        <p style="font-size:10pt;color:#64748b;">Top events: ${drug2.events.slice(0, 5).map((e) => `${e.term} (${e.count})`).join(", ")}</p>
      </section>

      <section><h2>Clinical Trial Pipeline</h2>
        <table><tr><th>Drug</th><th>Trial</th><th>Phase</th><th>Status</th><th>Enrollment</th></tr>
        ${[...drug1.trials.map((t) => `<tr><td>${drug1.identity.name}</td><td>${t.title.slice(0, 60)}</td><td>${t.phase ?? "N/A"}</td><td>${t.status}</td><td>${t.enrollment ?? "N/A"}</td></tr>`),
           ...drug2.trials.map((t) => `<tr><td>${drug2.identity.name}</td><td>${t.title.slice(0, 60)}</td><td>${t.phase ?? "N/A"}</td><td>${t.status}</td><td>${t.enrollment ?? "N/A"}</td></tr>`)].join("")}
        </table>
      </section>

      ${literature.length > 0 ? `<section><h2>Comparative Literature</h2>${literature.map((a) => `<p style="margin:6px 0;font-size:10pt;"><strong>${a.title}</strong><br/><span style="color:#64748b;">${a.journal ?? ""} ${a.year ? `(${a.year})` : ""} PMID: ${a.pmid}</span></p>`).join("")}</section>` : ""}

      <div class="disclaimer"><strong>Disclaimer:</strong> This report is for research purposes using publicly available data via AlgoVigilance Station.</div>
      <div class="footer">AlgoVigilance — nexvigilant.com</div>
    </body></html>`;
    openReport(html);
  }, [drug1, drug2, literature]);

  const reset = useCallback(() => {
    setDrug1Input(""); setDrug2Input(""); setCurrentStep(1);
    setSteps({ 1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" }, 4: { status: "pending" } });
    setDrug1(null); setDrug2(null); setLiterature([]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
            <Swords className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Competitive Landscape</h1>
            <p className="text-sm text-muted-foreground">Head-to-head drug safety comparison</p>
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
              <h2 className="text-lg font-semibold">Step 1: Select Two Drugs to Compare</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Drug A</label>
                  <input type="text" value={drug1Input} onChange={(e) => setDrug1Input(e.target.value)}
                    placeholder="e.g., Semaglutide" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Drug B</label>
                  <input type="text" value={drug2Input} onChange={(e) => setDrug2Input(e.target.value)}
                    placeholder="e.g., Tirzepatide" className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") runComparison(); }} />
                </div>
              </div>
              <button onClick={runComparison}
                disabled={!drug1Input.trim() || !drug2Input.trim() || steps[1].status === "loading"}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {steps[1].status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Compare
              </button>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Quick comparisons:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { a: "Semaglutide", b: "Tirzepatide" },
                    { a: "Metformin", b: "Glipizide" },
                    { a: "Atorvastatin", b: "Rosuvastatin" },
                  ].map((p) => (
                    <button key={`${p.a}-${p.b}`}
                      onClick={() => { setDrug1Input(p.a); setDrug2Input(p.b); }}
                      className="rounded-full border px-3 py-1 text-sm hover:bg-muted">
                      {p.a} vs {p.b}
                    </button>
                  ))}
                </div>
              </div>
              {steps[1].error && <p className="text-sm text-destructive">{steps[1].error}</p>}
            </div>
          )}

          {drug1 && drug2 && steps[1].status === "done" && (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="font-medium">{drug1.identity.name} vs {drug2.identity.name}</p>
              <button onClick={reset} className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          )}

          {steps[2].status === "done" && drug1 && drug2 && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 2: Safety Profile Comparison</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {[drug1, drug2].map((d) => (
                  <div key={d.identity.rxcui} className="space-y-2 rounded-lg border p-4">
                    <h3 className="font-medium">{d.identity.name}</h3>
                    <div className="space-y-1">
                      {d.events.slice(0, 5).map((e) => (
                        <div key={e.term} className="flex justify-between text-sm">
                          <span className="truncate">{e.term}</span>
                          <span className="text-xs text-muted-foreground">{e.count}</span>
                        </div>
                      ))}
                    </div>
                    {d.signals.length > 0 && (
                      <div className="space-y-1 pt-2">
                        {d.signals.map((s) => (
                          <div key={s.event} className="flex items-center gap-2 text-sm">
                            {s.signal ? <AlertTriangle className="h-3 w-3 text-amber-500" /> : <CheckCircle2 className="h-3 w-3 text-green-500" />}
                            <span>{s.event}: PRR={s.prr?.toFixed(1) ?? "—"} ROR={s.ror?.toFixed(1) ?? "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {steps[3].status === "done" && drug1 && drug2 && (
            <div className="space-y-4 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 3: Clinical Pipeline & Literature</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {[drug1, drug2].map((d) => (
                  <div key={d.identity.rxcui} className="space-y-2">
                    <h3 className="text-sm font-medium">{d.identity.name} — {d.trials.length} trials</h3>
                    {d.trials.slice(0, 3).map((t) => (
                      <div key={t.nctId} className="rounded-md border p-2 text-xs">
                        <p className="font-medium">{t.title.slice(0, 80)}</p>
                        <p className="text-muted-foreground">{t.nctId} | Phase {t.phase ?? "N/A"} | {t.status}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {literature.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-medium">Comparative Literature</h3>
                  {literature.map((a) => (
                    <div key={a.pmid} className="flex items-start gap-2 text-sm">
                      <FileText className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">PMID: {a.pmid}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {steps[4].status === "done" && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-semibold">Step 4: Competitive Report Ready</h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={generateReport}
                  className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  <Download className="h-4 w-4" /> Download Report
                </button>
                <button onClick={() => downloadJSON(
                  { drug1, drug2, literature },
                  `competitive-${drug1?.identity.name.toLowerCase()}-vs-${drug2?.identity.name.toLowerCase()}-${Date.now()}.json`,
                )} className="flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted">
                  <FileText className="h-4 w-4" /> Export JSON
                </button>
              </div>
              <button onClick={reset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3" /> New comparison
              </button>
            </div>
          )}

          {Object.values(steps).some((s) => s.status === "loading") && (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Comparing drugs via AlgoVigilance Station...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
