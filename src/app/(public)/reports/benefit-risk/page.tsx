"use client";

import { useState, useCallback } from "react";
import {
  Scale,
  ShieldAlert,
  TrendingUp,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster, AssessorForm } from "@/components/pv-for-nexvigilants";
import {
  callStation,
  searchFaers,
  getDrugLabel,
  computeDisproportionality,
  type FaersEvent,
  type LabelSection,
  type DisproportionalityResult,
} from "@/lib/glass-station-client";
import { generateAndDownload, type ReportConfig, type AssessorInfo } from "@/lib/pv-report-generator";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StepState {
  status: "pending" | "loading" | "done" | "error";
  label: string;
}

interface SeriousnessResult {
  event: string;
  classification: string;
  serious: boolean;
}

interface BenefitRiskResult {
  benefit_risk_ratio: number;
  interpretation: string;
}

interface Trial {
  nct_id?: string;
  title?: string;
  status?: string;
  phase?: string;
}

interface ReportData {
  drug: string;
  indication: string;
  faersEvents: FaersEvent[];
  labelSections: LabelSection[];
  trials: Trial[];
  seriousness: SeriousnessResult[];
  benefitRisk: BenefitRiskResult | null;
  disproportionality: DisproportionalityResult[];
  generatedAt: string;
}

// ─── Presets ─────────────────────────────────────────────────────────────────

const PRESETS = [
  { drug: "Metformin", indication: "type 2 diabetes" },
  { drug: "Semaglutide", indication: "obesity" },
  { drug: "Warfarin", indication: "atrial fibrillation" },
  { drug: "Nivolumab", indication: "non-small cell lung cancer" },
];

const STEP_LABELS = [
  "Search FAERS for top adverse events",
  "Get drug label (ADRs + boxed warning)",
  "Search clinical trials for efficacy data",
  "Classify seriousness of top 5 ADRs",
  "Compute benefit-risk ratio",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function verdictFromRatio(ratio: number): {
  text: string;
  confidence: "high" | "moderate" | "low";
  action: string;
  color: string;
} {
  if (ratio > 2) {
    return {
      text: "Favorable Benefit-Risk Profile",
      confidence: "high",
      action: "Maintain current labeling",
      color: "emerald",
    };
  }
  if (ratio >= 1) {
    return {
      text: "Acceptable Benefit-Risk with Monitoring",
      confidence: "moderate",
      action: "Enhanced monitoring recommended",
      color: "amber",
    };
  }
  return {
    text: "Unfavorable Benefit-Risk Profile",
    confidence: "high",
    action: "Urgent regulatory review recommended",
    color: "red",
  };
}

function buildRiskMinimization(
  labelSections: LabelSection[],
  seriousness: SeriousnessResult[],
  disproportionality: DisproportionalityResult[],
): string {
  const recommendations: string[] = [];

  const hasBoxedWarning = labelSections.some(
    (s) => s.section === "Boxed Warning" && !s.text.includes("No boxed warning"),
  );
  if (hasBoxedWarning) {
    recommendations.push("Implement REMS-equivalent monitoring program");
  }

  const hasSerious = seriousness.some((s) => s.serious);
  if (hasSerious) {
    recommendations.push(
      "Enhanced pharmacovigilance with expedited reporting",
    );
  }

  const hasHighPrr = disproportionality.some(
    (d) => d.prr !== undefined && d.prr > 5,
  );
  if (hasHighPrr) {
    recommendations.push(
      "Consider label update and Dear Healthcare Professional communication",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Continue routine pharmacovigilance activities");
  }

  return recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n");
}

function buildReportConfig(data: ReportData): ReportConfig {
  const ratio = data.benefitRisk?.benefit_risk_ratio ?? 0;
  const verdict = verdictFromRatio(ratio);
  const riskMin = buildRiskMinimization(
    data.labelSections,
    data.seriousness,
    data.disproportionality,
  );

  const adrSection = data.labelSections.find((s) => s.section === "Adverse Reactions");
  const boxedSection = data.labelSections.find((s) => s.section === "Boxed Warning");

  const trialsText =
    data.trials.length > 0
      ? data.trials
          .slice(0, 3)
          .map(
            (t) =>
              `${t.title ?? "Unnamed trial"} (${t.status ?? "Unknown status"}, Phase ${t.phase ?? "N/A"})`,
          )
          .join("; ")
      : "No clinical trial data retrieved. Refer to regulatory submission dossier for efficacy evidence.";

  const benefitText = `Clinical evidence: ${trialsText}. ${
    data.indication
      ? `Approved indication: ${data.indication}. `
      : ""
  }Consult approved label for full efficacy profile and benefit characterization.`;

  return {
    title: `Benefit-Risk Assessment: ${data.drug}`,
    subtitle: `Indication: ${data.indication || "Not specified"}`,
    reportType: "Benefit-Risk Assessment Report",
    ichReference: "ICH E2C(R2) Section 4",
    drug: data.drug,
    generatedAt: data.generatedAt,
    sections: [
      {
        type: "key-value",
        title: "Drug Profile",
        entries: [
          { key: "Drug Name", value: data.drug },
          { key: "Indication", value: data.indication || "Not specified" },
          { key: "Assessment Date", value: data.generatedAt },
          {
            key: "Data Sources",
            value: "FDA FAERS, DailyMed, ClinicalTrials.gov, AlgoVigilance Station",
          },
        ],
      },
      {
        type: "text",
        title: "Benefit Summary",
        body: benefitText,
      },
      {
        type: "table",
        title: "Risk Summary — Top Adverse Events (FAERS)",
        headers: ["Adverse Event", "Reports (N)", "Seriousness"],
        rows: data.faersEvents.slice(0, 10).map((e) => {
          const s = data.seriousness.find(
            (sr) => sr.event.toLowerCase() === e.term.toLowerCase(),
          );
          return [
            e.term,
            String(e.count),
            s ? s.classification : "Not classified",
          ];
        }),
      },
      {
        type: "scores",
        title: "Disproportionality for Top Risks",
        scores: data.disproportionality.slice(0, 3).map((d) => ({
          label: `PRR — ${d.event}`,
          value: d.prr !== undefined ? Number(d.prr.toFixed(2)) : "N/A",
          threshold: 2,
          signal: d.signal,
          interpretation: d.signal
            ? `Signal detected for ${d.event} (PRR > 2)`
            : `No disproportionality signal for ${d.event}`,
        })),
      },
      {
        type: "text",
        title: "Label Safety Information",
        body: [
          adrSection ? `ADVERSE REACTIONS:\n${adrSection.text}` : "",
          boxedSection ? `\nBOXED WARNING:\n${boxedSection.text}` : "",
        ]
          .filter(Boolean)
          .join("\n\n") || "No label safety data retrieved.",
      },
      {
        type: "scores",
        title: "Quantitative Benefit-Risk",
        scores: [
          {
            label: "Benefit-Risk Ratio",
            value:
              data.benefitRisk
                ? Number(data.benefitRisk.benefit_risk_ratio.toFixed(2))
                : "N/A",
            threshold: 1,
            signal: data.benefitRisk
              ? data.benefitRisk.benefit_risk_ratio < 1
              : false,
            interpretation: data.benefitRisk
              ? data.benefitRisk.interpretation
              : "Benefit-risk computation unavailable",
          },
        ],
      },
      {
        type: "text",
        title: "Risk Minimization Recommendations",
        body: riskMin,
      },
      {
        type: "verdict",
        title: "Overall Assessment",
        verdict: verdict.text,
        confidence: verdict.confidence,
        action: verdict.action,
        rationale: data.benefitRisk
          ? `Computed benefit-risk ratio: ${data.benefitRisk.benefit_risk_ratio.toFixed(2)}. ${data.benefitRisk.interpretation}`
          : "Benefit-risk ratio could not be computed. Manual assessment required.",
      },
    ],
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BenefitRiskReportPage() {
  const [drug, setDrug] = useState("");
  const [indication, setIndication] = useState("");
  const [steps, setSteps] = useState<StepState[]>(
    STEP_LABELS.map((label) => ({ status: "pending", label })),
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const updateStep = (index: number, status: StepState["status"]) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s)),
    );
  };

  const runReport = useCallback(
    async (drugName: string, indicationText: string) => {
      setIsRunning(true);
      setReportData(null);
      setSteps(STEP_LABELS.map((label) => ({ status: "pending", label })));

      const generatedAt = new Date().toISOString().slice(0, 10);

      // Step 0: FAERS
      updateStep(0, "loading");
      const faersEvents = await searchFaers(drugName, 15);
      updateStep(0, "done");

      // Step 1: Drug label
      updateStep(1, "loading");
      const labelSections = await getDrugLabel(drugName);
      updateStep(1, "done");

      // Step 2: Clinical trials
      updateStep(2, "loading");
      let trials: Trial[] = [];
      const trialsResult = await callStation(
        "clinicaltrials_gov_search_trials",
        { condition: indicationText || drugName, intervention: drugName },
      );
      if (trialsResult) {
        const raw = (trialsResult.trials ??
          trialsResult.studies ??
          trialsResult.results) as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(raw)) {
          trials = raw.slice(0, 5).map((t) => ({
            nct_id: t.nct_id ? String(t.nct_id) : undefined,
            title: t.title ? String(t.title) : undefined,
            status: t.status ? String(t.status) : undefined,
            phase: t.phase ? String(t.phase) : undefined,
          }));
        }
      }
      updateStep(2, "done");

      // Step 3: Seriousness of top 5 ADRs
      updateStep(3, "loading");
      const top5Events = faersEvents.slice(0, 5);
      const seriousnessResults: SeriousnessResult[] = [];
      await Promise.all(
        top5Events.map(async (e) => {
          const result = await callStation(
            "calculate_nexvigilant_com_classify_seriousness",
            { event: e.term },
          );
          seriousnessResults.push({
            event: e.term,
            classification: result
              ? String(
                  result.classification ??
                    result.seriousness_category ??
                    "Unknown",
                )
              : "Unknown",
            serious: result
              ? Boolean(result.serious ?? result.is_serious ?? false)
              : false,
          });
        }),
      );
      updateStep(3, "done");

      // Step 4: Benefit-risk computation
      updateStep(4, "loading");
      const benefits = top5Events.slice(0, 3).map((e) => e.term);
      const risks = top5Events.slice(0, 5).map((e) => e.term);
      let benefitRisk: BenefitRiskResult | null = null;
      const brResult = await callStation(
        "calculate_nexvigilant_com_compute_benefit_risk",
        { drug: drugName, benefits, risks },
      );
      if (brResult) {
        const ratio = Number(
          brResult.benefit_risk_ratio ??
            brResult.ratio ??
            brResult.value ??
            0,
        );
        benefitRisk = {
          benefit_risk_ratio: ratio,
          interpretation: String(
            brResult.interpretation ??
              brResult.description ??
              (ratio > 2
                ? "Benefits substantially outweigh risks"
                : ratio >= 1
                  ? "Benefits and risks are closely balanced"
                  : "Risks outweigh benefits"),
          ),
        };
      } else {
        // Fallback: derive ratio from seriousness data
        const seriousCount = seriousnessResults.filter((s) => s.serious).length;
        const ratio =
          top5Events.length > 0
            ? Math.max(0.1, (top5Events.length - seriousCount) / Math.max(seriousCount, 1))
            : 1;
        benefitRisk = {
          benefit_risk_ratio: ratio,
          interpretation:
            ratio > 2
              ? "Benefits substantially outweigh risks (estimated)"
              : ratio >= 1
                ? "Benefits and risks are closely balanced (estimated)"
                : "Risks outweigh benefits (estimated)",
        };
      }

      // Disproportionality for top 3 events
      const dispResults: DisproportionalityResult[] = [];
      await Promise.all(
        faersEvents.slice(0, 3).map(async (e) => {
          const d = await computeDisproportionality(drugName, e.term);
          if (d) dispResults.push(d);
        }),
      );
      updateStep(4, "done");

      setReportData({
        drug: drugName,
        indication: indicationText,
        faersEvents,
        labelSections,
        trials,
        seriousness: seriousnessResults,
        benefitRisk,
        disproportionality: dispResults,
        generatedAt,
      });
      setIsRunning(false);
    },
    [],
  );

  const handleAssessorDownload = useCallback((assessor: AssessorInfo) => {
    if (!reportData) return;
    const config = buildReportConfig(reportData);
    config.assessor = assessor;
    generateAndDownload(
      config,
      `benefit-risk-${reportData.drug.toLowerCase().replace(/\s+/g, "-")}-${reportData.generatedAt}.pdf`,
    );
  }, [reportData]);

  const ratio = reportData?.benefitRisk?.benefit_risk_ratio ?? null;
  const verdict = ratio !== null ? verdictFromRatio(ratio) : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-16">
      {/* Header */}
      <header className="mb-8 text-center pt-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-blue-400" />
          <span className="text-xs font-mono uppercase tracking-widest text-white/40">
            Reports
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
          Benefit-Risk Assessment Report
        </h1>
        <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
          Enter a drug and indication to generate a professional{" "}
          <JargonBuster
            term="ICH E2C(R2)"
            definition="International Council for Harmonisation guideline on Periodic Benefit-Risk Evaluation Reports (PBRERs) — the global standard for structured benefit-risk assessment"
          >
            ICH E2C(R2)
          </JargonBuster>
          -aligned benefit-risk report, ready to download as PDF.
        </p>
      </header>

      <div className="max-w-3xl mx-auto px-4 space-y-5">
        {/* Input form */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Drug Name
              </label>
              <input
                type="text"
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && drug.trim() && !isRunning && runReport(drug, indication)
                }
                placeholder="e.g. Warfarin"
                className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Indication / Condition
              </label>
              <input
                type="text"
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && drug.trim() && !isRunning && runReport(drug, indication)
                }
                placeholder="e.g. atrial fibrillation"
                className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Preset chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.drug}
                onClick={() => {
                  setDrug(p.drug);
                  setIndication(p.indication);
                }}
                className="rounded border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/40 hover:border-blue-500/30 hover:text-blue-300 transition-colors"
              >
                {p.drug}
              </button>
            ))}
          </div>

          <button
            onClick={() => drug.trim() && !isRunning && runReport(drug, indication)}
            disabled={!drug.trim() || isRunning}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Scale className="h-4 w-4" />
            )}
            {isRunning ? "Generating Report..." : "Generate Report"}
          </button>
        </div>

        {/* Progress steps */}
        {steps.some((s) => s.status !== "pending") && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
            <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
              Processing
            </p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-5 w-5 flex items-center justify-center flex-shrink-0",
                    step.status === "done"
                      ? "text-emerald-400"
                      : step.status === "loading"
                        ? "text-blue-400"
                        : "text-white/20",
                  )}
                >
                  {step.status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : step.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs",
                    step.status === "done"
                      ? "text-white/70"
                      : step.status === "loading"
                        ? "text-white/90"
                        : "text-white/25",
                  )}
                >
                  Step {i + 1}: {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Report preview */}
        {reportData && verdict && (
          <>
            {/* Overall verdict banner */}
            <div
              className={cn(
                "rounded-xl border p-5",
                verdict.color === "emerald"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : verdict.color === "amber"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-red-500/30 bg-red-500/5",
              )}
            >
              <div className="flex items-start gap-4">
                <Scale
                  className={cn(
                    "h-6 w-6 mt-0.5 flex-shrink-0",
                    verdict.color === "emerald"
                      ? "text-emerald-400"
                      : verdict.color === "amber"
                        ? "text-amber-400"
                        : "text-red-400",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h2 className="text-base font-bold text-white">
                      {verdict.text}
                    </h2>
                    <span
                      className={cn(
                        "text-xs font-mono px-2 py-0.5 rounded-full border",
                        verdict.color === "emerald"
                          ? "border-emerald-500/40 text-emerald-400"
                          : verdict.color === "amber"
                            ? "border-amber-500/40 text-amber-400"
                            : "border-red-500/40 text-red-400",
                      )}
                    >
                      Confidence: {verdict.confidence}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">{verdict.action}</p>
                  {ratio !== null && (
                    <p className="text-xs font-mono text-white/40 mt-1">
                      B/R ratio:{" "}
                      <span className="text-white/70">{ratio.toFixed(2)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section previews */}
            <div className="space-y-3">
              {/* Drug profile */}
              <PreviewSection title="Drug Profile" icon={FileText}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {[
                    ["Drug", reportData.drug],
                    ["Indication", reportData.indication || "Not specified"],
                    ["Date", reportData.generatedAt],
                    ["Sources", "FAERS, DailyMed, ClinicalTrials.gov"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs">
                      <span className="text-white/40 min-w-[80px]">{k}</span>
                      <span className="text-white/70">{v}</span>
                    </div>
                  ))}
                </div>
              </PreviewSection>

              {/* Risk summary table */}
              <PreviewSection title="Risk Summary — Top Adverse Events" icon={ShieldAlert}>
                {reportData.faersEvents.length === 0 ? (
                  <p className="text-xs text-white/40">No FAERS data retrieved.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-1.5 text-white/40 font-medium">Event</th>
                        <th className="text-right py-1.5 text-white/40 font-medium">Reports</th>
                        <th className="text-right py-1.5 text-white/40 font-medium">Seriousness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.faersEvents.slice(0, 10).map((e, i) => {
                        const s = reportData.seriousness.find(
                          (sr) => sr.event.toLowerCase() === e.term.toLowerCase(),
                        );
                        return (
                          <tr key={i} className="border-b border-white/5">
                            <td className="py-1.5 text-white/70 truncate max-w-[180px]">
                              {e.term}
                            </td>
                            <td className="py-1.5 text-right font-mono text-white/60">
                              {e.count}
                            </td>
                            <td className="py-1.5 text-right">
                              {s ? (
                                <span
                                  className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded",
                                    s.serious
                                      ? "bg-red-500/15 text-red-400"
                                      : "bg-white/5 text-white/40",
                                  )}
                                >
                                  {s.classification}
                                </span>
                              ) : (
                                <span className="text-white/25">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </PreviewSection>

              {/* Disproportionality */}
              {reportData.disproportionality.length > 0 && (
                <PreviewSection title="Disproportionality — Top 3 Events" icon={TrendingUp}>
                  <div className="space-y-2">
                    {reportData.disproportionality.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span
                          className={cn(
                            "text-xs font-mono px-2 py-1 rounded font-bold min-w-[48px] text-center",
                            d.signal
                              ? "bg-red-500/15 text-red-400"
                              : "bg-emerald-500/10 text-emerald-400",
                          )}
                        >
                          {d.prr !== undefined ? d.prr.toFixed(1) : "N/A"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white/70 truncate">{d.event}</div>
                          <div className="text-[10px] text-white/30">
                            PRR threshold: 2.0 —{" "}
                            {d.signal ? "Signal detected" : "No signal"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </PreviewSection>
              )}

              {/* Risk minimization */}
              <PreviewSection title="Risk Minimization Recommendations" icon={ShieldAlert}>
                <p className="text-xs text-white/60 whitespace-pre-line leading-relaxed">
                  {buildRiskMinimization(
                    reportData.labelSections,
                    reportData.seriousness,
                    reportData.disproportionality,
                  )}
                </p>
              </PreviewSection>
            </div>

            {/* Download with Assessor Form */}
            <AssessorForm onDownload={handleAssessorDownload} />

            <p className="text-[10px] text-white/25 text-center">
              ICH E2C(R2) Section 4 — data sourced from mcp.nexvigilant.com
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PreviewSection ───────────────────────────────────────────────────────────

function PreviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-blue-400" />
        <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
