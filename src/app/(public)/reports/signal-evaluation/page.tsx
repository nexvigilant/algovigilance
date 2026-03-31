"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JargonBuster, AssessorForm } from "@/components/pv-for-nexvigilants";
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
} from "@/lib/glass-station-client";
import {
  generateAndDownload,
  type ReportConfig,
} from "@/lib/pv-report-generator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportData {
  drug: DrugIdentity;
  faersEvents: FaersEvent[];
  disproportionality: DisproportionalityResult[];
  labelSections: LabelSection[];
  literature: PubMedArticle[];
}

type StepStatus = "pending" | "running" | "done" | "error";

interface Step {
  id: number;
  label: string;
  description: string;
  status: StepStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_DRUGS = [
  "Semaglutide",
  "Metformin",
  "Ozempic",
  "Acetaminophen",
  "Lisinopril",
];

const INITIAL_STEPS: Step[] = [
  {
    id: 1,
    label: "Resolve",
    description: "Looking up drug identity...",
    status: "pending",
  },
  {
    id: 2,
    label: "FAERS",
    description: "Searching FDA adverse event reports...",
    status: "pending",
  },
  {
    id: 3,
    label: "Disproportionality",
    description: "Computing safety signal scores...",
    status: "pending",
  },
  {
    id: 4,
    label: "Label",
    description: "Retrieving drug label from DailyMed...",
    status: "pending",
  },
  {
    id: 5,
    label: "Literature",
    description: "Searching PubMed for safety studies...",
    status: "pending",
  },
  {
    id: 6,
    label: "Verdict",
    description: "Generating signal verdict...",
    status: "pending",
  },
];

// ─── Verdict Logic ────────────────────────────────────────────────────────────

function computeVerdict(results: DisproportionalityResult[]): {
  verdict: string;
  confidence: "high" | "moderate" | "low";
  action: string;
  rationale: string;
} {
  const signalCount = results.filter((r) => r.signal).length;
  const totalMetrics = results.reduce((acc, r) => {
    let count = 0;
    if (r.prr !== undefined && r.prr > 2) count++;
    if (r.ror !== undefined && r.ror > 2) count++;
    if (r.ic !== undefined && r.ic > 0) count++;
    if (r.ebgm !== undefined && r.ebgm > 2) count++;
    return acc + count;
  }, 0);

  if (signalCount >= 3 || totalMetrics >= 6) {
    return {
      verdict: "Strong Safety Signal Detected",
      confidence: "high",
      action: "Priority review and potential regulatory action recommended",
      rationale: `${signalCount} of ${results.length} adverse events showed disproportionate reporting with ${totalMetrics} signal-positive metric thresholds exceeded. ICH E2E criteria support escalation to formal signal evaluation.`,
    };
  }
  if (signalCount >= 1 || totalMetrics >= 2) {
    return {
      verdict: "Potential Safety Signal",
      confidence: "moderate",
      action: "Enhanced monitoring and further investigation recommended",
      rationale: `${signalCount} of ${results.length} adverse events showed elevated disproportionality scores. ${totalMetrics} metric thresholds exceeded. Continued surveillance is warranted per ICH E2E guidelines.`,
    };
  }
  return {
    verdict: "No Disproportionate Signal",
    confidence: "low",
    action: "Routine monitoring sufficient",
    rationale: `All disproportionality metrics (PRR, ROR, IC, EBGM) are within expected ranges for the events analyzed. No regulatory escalation required at this time. Continue routine pharmacovigilance per ICH E2E.`,
  };
}

// ─── Score Interpretation ─────────────────────────────────────────────────────

function interpretPrr(value: number): string {
  if (value >= 5)
    return "PRR is well above the signal threshold of 2.0 — this drug is reported with this event far more than expected compared to all other drugs in the database.";
  if (value >= 2)
    return "PRR exceeds the signal threshold of 2.0 — the drug-event combination is reported at least twice as often as expected, meeting Evans criteria for signal detection.";
  return "PRR is below the signal threshold of 2.0 — the reporting rate for this drug-event pair is within expected range.";
}

function interpretRor(value: number): string {
  if (value >= 5)
    return "ROR is substantially elevated — the odds of this event being reported with this drug are significantly higher than with other drugs.";
  if (value >= 2)
    return "ROR exceeds 2.0 — the reporting odds ratio supports a potential pharmacovigilance signal.";
  return "ROR is below 2.0 — no disproportionate odds of reporting detected.";
}

function interpretIc(value: number): string {
  if (value >= 1)
    return "IC (Information Component) is positive and above 1.0 — strong statistical association between drug and event in the WHO VigiBase methodology.";
  if (value > 0)
    return "IC is positive — the drug-event pair appears more frequently than expected by chance, meeting the WHO-UMC signal threshold.";
  return "IC is at or below 0 — no information gain above background rate; does not meet WHO-UMC signal criteria.";
}

function interpretEbgm(value: number): string {
  if (value >= 5)
    return "EBGM (Empirical Bayes Geometric Mean) is strongly elevated — this is the FDA's preferred Bayesian signal metric and indicates a robust statistical association.";
  if (value >= 2)
    return "EBGM exceeds 2.0 — the Bayesian multi-item gamma Poisson shrinker detects a reportable signal above background.";
  return "EBGM is below 2.0 — Bayesian analysis does not identify a disproportionate signal at this threshold.";
}

// ─── Build Report Config ──────────────────────────────────────────────────────

function buildReportConfig(drugName: string, data: ReportData): ReportConfig {
  const verdict = computeVerdict(data.disproportionality);
  const now = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return {
    title: `Signal Evaluation Report — ${data.drug.name}`,
    subtitle: "ICH E2E Pharmacovigilance Signal Detection",
    reportType: "Signal Evaluation",
    ichReference: "ICH E2E Pharmacovigilance Planning",
    drug: data.drug.name,
    generatedAt: now,
    sections: [
      {
        type: "key-value",
        title: "Drug Identification",
        entries: [
          { key: "Drug Name", value: data.drug.name },
          { key: "RxCUI", value: data.drug.rxcui || "Not resolved" },
          {
            key: "Synonyms",
            value: data.drug.synonym || "None recorded",
          },
          { key: "Report Generated", value: now },
          { key: "Data Source", value: "FDA FAERS + DailyMed + PubMed" },
        ],
      },
      {
        type: "table",
        title: "Top Adverse Events from FDA Reports",
        headers: ["Adverse Event", "Reported Cases", "Rank"],
        rows: data.faersEvents.slice(0, 15).map((e, i) => [
          e.term,
          String(e.count),
          String(i + 1),
        ]),
      },
      {
        type: "scores",
        title: "Disproportionality Analysis",
        scores: data.disproportionality.flatMap((result) => {
          const scores = [];
          if (result.prr !== undefined) {
            scores.push({
              label: `PRR — ${result.event}`,
              value: result.prr.toFixed(2),
              threshold: 2.0,
              signal: result.prr > 2,
              interpretation: interpretPrr(result.prr),
            });
          }
          if (result.ror !== undefined) {
            scores.push({
              label: `ROR — ${result.event}`,
              value: result.ror.toFixed(2),
              threshold: 2.0,
              signal: result.ror > 2,
              interpretation: interpretRor(result.ror),
            });
          }
          if (result.ic !== undefined) {
            scores.push({
              label: `IC — ${result.event}`,
              value: result.ic.toFixed(2),
              threshold: 0,
              signal: result.ic > 0,
              interpretation: interpretIc(result.ic),
            });
          }
          if (result.ebgm !== undefined) {
            scores.push({
              label: `EBGM — ${result.event}`,
              value: result.ebgm.toFixed(2),
              threshold: 2.0,
              signal: result.ebgm > 2,
              interpretation: interpretEbgm(result.ebgm),
            });
          }
          return scores;
        }),
      },
      ...data.labelSections.map((s) => ({
        type: "text" as const,
        title: `Label: ${s.section}`,
        body: s.text,
      })),
      {
        type: "table",
        title: "Published Safety Literature",
        headers: ["PMID", "Title", "Journal", "Year"],
        rows: data.literature.map((a) => [
          a.pmid,
          a.title,
          a.journal ?? "N/A",
          a.year ?? "N/A",
        ]),
      },
      {
        type: "verdict",
        title: "Signal Verdict & Recommended Action",
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        action: verdict.action,
        rationale: verdict.rationale,
      },
    ],
  };
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                step.status === "done" &&
                  "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40",
                step.status === "running" &&
                  "animate-pulse bg-blue-500/20 text-blue-300 ring-1 ring-blue-400",
                step.status === "error" &&
                  "bg-red-500/20 text-red-400 ring-1 ring-red-500/40",
                step.status === "pending" &&
                  "bg-slate-800 text-slate-500 ring-1 ring-slate-700",
              )}
            >
              {step.status === "done" ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : step.status === "error" ? (
                <span>!</span>
              ) : (
                <span>{step.id}</span>
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium transition-colors",
                step.status === "done" && "text-emerald-400",
                step.status === "running" && "text-blue-300",
                step.status === "error" && "text-red-400",
                step.status === "pending" && "text-slate-600",
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "mb-4 h-px w-6 flex-1 transition-colors duration-500",
                step.status === "done"
                  ? "bg-emerald-500/40"
                  : "bg-slate-700",
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Active Step Description ──────────────────────────────────────────────────

function ActiveStepDescription({ steps }: { steps: Step[] }) {
  const running = steps.find((s) => s.status === "running");
  if (!running) return null;
  return (
    <p className="mt-3 text-center text-sm text-blue-300/80 animate-pulse">
      {running.description}
    </p>
  );
}

// ─── Report Preview ───────────────────────────────────────────────────────────

function ReportPreview({
  data,
  drugName,
}: {
  data: ReportData;
  drugName: string;
}) {
  const verdict = computeVerdict(data.disproportionality);

  return (
    <div className="space-y-6">
      {/* Drug Identification */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Drug Identification
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Name</span>
            <p className="font-medium text-white">{data.drug.name}</p>
          </div>
          <div>
            <span className="text-slate-500">
              <JargonBuster
                term="RxCUI"
                definition="RxNorm Concept Unique Identifier — the FDA's standard drug code used across all federal health databases."
              >
                RxCUI
              </JargonBuster>
            </span>
            <p className="font-medium text-white">
              {data.drug.rxcui || "Not resolved"}
            </p>
          </div>
          {data.drug.synonym && (
            <div className="col-span-2">
              <span className="text-slate-500">Synonyms</span>
              <p className="font-medium text-white">{data.drug.synonym}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAERS Case Summary */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Top Adverse Events from{" "}
            <JargonBuster
              term="FDA FAERS"
              definition="FDA Adverse Event Reporting System — a database of voluntary reports submitted by patients, doctors, and drug companies about side effects from medications."
            >
              FDA Reports
            </JargonBuster>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.faersEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No FAERS data available.</p>
          ) : (
            <div className="space-y-1.5">
              {data.faersEvents.slice(0, 15).map((event, i) => (
                <div key={event.term} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-slate-600">
                    {i + 1}
                  </span>
                  <div className="flex flex-1 items-center gap-2">
                    <div
                      className="h-1.5 rounded-full bg-blue-500/60"
                      style={{
                        width: `${Math.max(8, (event.count / (data.faersEvents[0]?.count ?? 1)) * 100)}%`,
                        maxWidth: "60%",
                      }}
                    />
                    <span className="text-sm text-slate-300">{event.term}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {event.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disproportionality */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            <JargonBuster
              term="Disproportionality Analysis"
              definition="A statistical method to find drug-event combinations that are reported more often than expected by chance. Four metrics are used: PRR, ROR, IC, and EBGM."
            >
              Disproportionality Analysis
            </JargonBuster>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.disproportionality.length === 0 ? (
            <p className="text-sm text-slate-500">
              No disproportionality data computed.
            </p>
          ) : (
            data.disproportionality.map((result) => (
              <div
                key={result.event}
                className="rounded-lg border border-slate-700 bg-slate-900/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium text-white">{result.event}</span>
                  <Badge
                    className={cn(
                      "text-xs",
                      result.signal
                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                    )}
                    variant="outline"
                  >
                    {result.signal ? "Signal Detected" : "No Signal"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {result.prr !== undefined && (
                    <MetricBadge
                      label="PRR"
                      value={result.prr}
                      threshold={2}
                      definition="Proportional Reporting Ratio — compares how often a drug-event pair is reported relative to all other drugs reporting that event."
                    />
                  )}
                  {result.ror !== undefined && (
                    <MetricBadge
                      label="ROR"
                      value={result.ror}
                      threshold={2}
                      definition="Reporting Odds Ratio — the odds of a drug being associated with a specific adverse event compared to all other drugs in the database."
                    />
                  )}
                  {result.ic !== undefined && (
                    <MetricBadge
                      label="IC"
                      value={result.ic}
                      threshold={0}
                      definition="Information Component — a WHO metric measuring how much more often a drug-event pair is reported than expected if there were no association."
                    />
                  )}
                  {result.ebgm !== undefined && (
                    <MetricBadge
                      label="EBGM"
                      value={result.ebgm}
                      threshold={2}
                      definition="Empirical Bayes Geometric Mean — the FDA's preferred Bayesian signal detection score. Values above 2 indicate a potential safety signal."
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Label Cross-Reference */}
      {data.labelSections.length > 0 && (
        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Drug Label Cross-Reference
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.labelSections.map((section) => (
              <div key={section.section}>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {section.section}
                </h4>
                <p className="text-sm leading-relaxed text-slate-300 line-clamp-4">
                  {section.text}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Literature */}
      {data.literature.length > 0 && (
        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Published Safety Literature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.literature.map((article) => (
              <div
                key={article.pmid}
                className="rounded border border-slate-700 bg-slate-900/50 p-3"
              >
                <p className="text-sm font-medium text-white">
                  {article.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[article.journal, article.year]
                    .filter(Boolean)
                    .join(" · ")}{" "}
                  {article.pmid && (
                    <span className="text-slate-600">
                      PMID: {article.pmid}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Verdict */}
      <Card
        className={cn(
          "border",
          verdict.confidence === "high" &&
            "border-red-500/40 bg-red-950/30",
          verdict.confidence === "moderate" &&
            "border-amber-500/40 bg-amber-950/30",
          verdict.confidence === "low" &&
            "border-emerald-500/40 bg-emerald-950/30",
        )}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3
                className={cn(
                  "text-lg font-bold",
                  verdict.confidence === "high" && "text-red-300",
                  verdict.confidence === "moderate" && "text-amber-300",
                  verdict.confidence === "low" && "text-emerald-300",
                )}
              >
                {verdict.verdict}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{verdict.action}</p>
            </div>
            <Badge
              className={cn(
                "shrink-0 text-xs",
                verdict.confidence === "high" &&
                  "border-red-500/40 bg-red-500/20 text-red-300",
                verdict.confidence === "moderate" &&
                  "border-amber-500/40 bg-amber-500/20 text-amber-300",
                verdict.confidence === "low" &&
                  "border-emerald-500/40 bg-emerald-500/20 text-emerald-300",
              )}
              variant="outline"
            >
              {verdict.confidence.toUpperCase()} CONFIDENCE
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            {verdict.rationale}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Metric Badge ─────────────────────────────────────────────────────────────

function MetricBadge({
  label,
  value,
  threshold,
  definition,
}: {
  label: string;
  value: number;
  threshold: number;
  definition: string;
}) {
  const isSignal = value > threshold;
  return (
    <div
      className={cn(
        "rounded-lg p-3 text-center",
        isSignal
          ? "bg-red-500/10 ring-1 ring-red-500/30"
          : "bg-slate-800 ring-1 ring-slate-700",
      )}
    >
      <JargonBuster term={label} definition={definition}>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </JargonBuster>
      <p
        className={cn(
          "mt-1 text-xl font-bold tabular-nums",
          isSignal ? "text-red-300" : "text-white",
        )}
      >
        {value.toFixed(2)}
      </p>
      <p className="text-[10px] text-slate-600">&gt;{threshold} = signal</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignalEvaluationReportPage() {
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const urlDrug = searchParams.get("drug") ?? "";
  const [drugInput, setDrugInput] = React.useState(urlDrug);
  const [eventFilter, setEventFilter] = React.useState("");
  const [steps, setSteps] = React.useState<Step[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = React.useState(false);
  const [reportData, setReportData] = React.useState<ReportData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const autoRunRef = React.useRef(false);

  function setStepStatus(id: number, status: StepStatus) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  }

  // Auto-run if ?drug= is in URL
  React.useEffect(() => {
    if (urlDrug && !autoRunRef.current) {
      autoRunRef.current = true;
      runPipeline(urlDrug);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runPipeline(drugName: string) {
    if (!drugName.trim()) return;
    setIsRunning(true);
    setReportData(null);
    setError(null);
    setSteps(INITIAL_STEPS);

    try {
      // Step 1: Resolve
      setStepStatus(1, "running");
      const drug = await resolveDrug(drugName);
      if (!drug) throw new Error(`Could not resolve drug identity for "${drugName}".`);
      setStepStatus(1, "done");

      // Step 2: FAERS
      setStepStatus(2, "running");
      const faersEvents = await searchFaers(drugName, 15);
      setStepStatus(2, "done");

      // Step 3: Disproportionality — top 3 events
      setStepStatus(3, "running");
      const top3 = faersEvents.slice(0, 3);
      const filterEvent = eventFilter.trim();
      const eventsToScore = filterEvent
        ? [{ term: filterEvent, count: 0 }, ...top3].slice(0, 3)
        : top3;
      const dispResults = await Promise.all(
        eventsToScore.map((e: { term: string; count: number }) => computeDisproportionality(drugName, e.term)),
      );
      const disproportionality = dispResults.filter(
        (r: DisproportionalityResult | null): r is DisproportionalityResult => r !== null,
      );
      setStepStatus(3, "done");

      // Step 4: Label
      setStepStatus(4, "running");
      const labelSections = await getDrugLabel(drugName);
      setStepStatus(4, "done");

      // Step 5: Literature
      setStepStatus(5, "running");
      const eventForLit = filterEvent || top3[0]?.term || "adverse event";
      const literature = await searchPubMed(drugName, eventForLit, 5);
      setStepStatus(5, "done");

      // Step 6: Verdict (computed client-side)
      setStepStatus(6, "running");
      await new Promise((r) => setTimeout(r, 300)); // brief pause for UX
      setStepStatus(6, "done");

      setReportData({ drug, faersEvents, disproportionality, labelSections, literature });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      const runningStep = steps.find((s) => s.status === "running");
      if (runningStep) setStepStatus(runningStep.id, "error");
    } finally {
      setIsRunning(false);
    }
  }

  function handleDownload(assessor?: import("@/lib/pv-report-generator").AssessorInfo) {
    if (!reportData) return;
    const config = buildReportConfig(drugInput, reportData);
    if (assessor) config.assessor = assessor;
    generateAndDownload(config);
  }

  const isIdle = !isRunning && !reportData && !error;
  const isComplete = !isRunning && !!reportData;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-blue-500/40 bg-blue-500/10 text-blue-300 text-xs"
            >
              ICH E2E
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-600 text-slate-500 text-xs"
            >
              Pharmacovigilance Planning
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Signal Evaluation Report
          </h1>
          <p className="mt-2 text-slate-400">
            Enter a drug name and the agent will search FDA adverse event
            reports, compute disproportionality scores, cross-reference the drug
            label, and review published literature — then generate a
            downloadable PDF report.
          </p>
        </div>

        {/* Input Card */}
        <Card className="mb-6 border-slate-700 bg-slate-900">
          <CardContent className="pt-6 space-y-4">
            {/* Quick Select */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Quick Select
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_DRUGS.map((drug) => (
                  <button
                    key={drug}
                    type="button"
                    onClick={() => setDrugInput(drug)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      drugInput === drug
                        ? "border-blue-500/60 bg-blue-500/20 text-blue-300"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300",
                    )}
                  >
                    {drug}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label
                  htmlFor="drug-input"
                  className="mb-1.5 block text-xs font-medium text-slate-400"
                >
                  Drug Name
                  <span className="ml-1 text-red-400">*</span>
                </label>
                <Input
                  id="drug-input"
                  placeholder="e.g. Semaglutide, Metformin..."
                  value={drugInput}
                  onChange={(e) => setDrugInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isRunning) runPipeline(drugInput);
                  }}
                  disabled={isRunning}
                  className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="event-filter"
                  className="mb-1.5 block text-xs font-medium text-slate-400"
                >
                  Event Filter{" "}
                  <span className="text-slate-600">(optional)</span>
                </label>
                <Input
                  id="event-filter"
                  placeholder="e.g. pancreatitis, nausea..."
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  disabled={isRunning}
                  className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={() => runPipeline(drugInput)}
              disabled={isRunning || !drugInput.trim()}
              className="w-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Running Signal Pipeline...
                </span>
              ) : (
                "Generate Report"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        {(isRunning || isComplete || !!error) && (
          <Card className="mb-6 border-slate-700 bg-slate-900">
            <CardContent className="pt-6">
              <StepIndicator steps={steps} />
              {isRunning && <ActiveStepDescription steps={steps} />}
              {isComplete && (
                <p className="mt-3 text-center text-sm text-emerald-400">
                  Pipeline complete — report ready below.
                </p>
              )}
              {error && (
                <p className="mt-3 text-center text-sm text-red-400">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Report Preview */}
        {reportData && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Report Preview
              </h2>
              <span className="text-xs text-zinc-500">
                Scroll down to personalize &amp; download
              </span>
            </div>
            <ReportPreview data={reportData} drugName={drugInput} />
            <div className="mt-6">
              <AssessorForm onDownload={handleDownload} />
            </div>
          </>
        )}

        {/* Idle State */}
        {isIdle && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <svg
                className="h-6 w-6 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">
              Enter a drug name above to generate a signal evaluation report.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              The agent will run a 6-step pipeline across FDA FAERS, DailyMed,
              and PubMed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
