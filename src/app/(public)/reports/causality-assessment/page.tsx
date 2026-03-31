"use client";

import { useState, useCallback } from "react";
import { ClipboardCheck, Scale, FileText, Download, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  computeNaranjo,
  computeWhoUmc,
  searchCaseReports,
  getFaersContext,
  type NaranjoResult,
  type WhoUmcResult,
  type CaseReport,
} from "@/lib/glass-station-client";
import { generateAndDownload, type ReportConfig, type AssessorInfo } from "@/lib/pv-report-generator";
import { AssessorForm } from "@/components/pv-for-nexvigilants";

// ─── Naranjo Questions ────────────────────────────────────────────────────────

const NARANJO_QUESTIONS: {
  id: string;
  label: string;
  tooltip: string;
  yes: number;
  no: number;
  unknown: number;
}[] = [
  {
    id: "q1",
    label: "Has this reaction been reported before?",
    tooltip: "Are there previous conclusive reports in the medical literature documenting this drug causing this specific reaction?",
    yes: 1, no: 0, unknown: 0,
  },
  {
    id: "q2",
    label: "Did the reaction appear after the drug was given?",
    tooltip: "Temporal sequence: did the adverse event occur after the patient started taking the suspected drug? A clear 'yes' here strongly supports causation.",
    yes: 2, no: -1, unknown: 0,
  },
  {
    id: "q3",
    label: "Did the reaction improve when the drug was stopped?",
    tooltip: "Dechallenge: did symptoms improve or resolve after the drug was discontinued or a reversal agent was given? This is a key causality indicator.",
    yes: 1, no: 0, unknown: 0,
  },
  {
    id: "q4",
    label: "Did the reaction return when the drug was restarted?",
    tooltip: "Rechallenge: did the adverse event reappear when the same drug was given again? A positive rechallenge is one of the strongest causality indicators.",
    yes: 2, no: -1, unknown: 0,
  },
  {
    id: "q5",
    label: "Could another cause have produced this reaction?",
    tooltip: "Alternative causes: could the patient's disease, another drug, or another factor have independently caused this reaction? If yes, it weakens the drug-causality argument.",
    yes: -1, no: 2, unknown: 0,
  },
  {
    id: "q6",
    label: "Did the reaction occur with a placebo?",
    tooltip: "Placebo reaction: if the patient received an inactive substance and had the same reaction, it suggests the drug is not the cause.",
    yes: -1, no: 1, unknown: 0,
  },
  {
    id: "q7",
    label: "Was the drug detected at toxic levels in blood or body fluids?",
    tooltip: "Toxic concentration: laboratory evidence of drug overdose or toxic levels can confirm exposure and support causation.",
    yes: 1, no: 0, unknown: 0,
  },
  {
    id: "q8",
    label: "Was the reaction worse with a higher dose or better with a lower dose?",
    tooltip: "Dose-response relationship: if increasing the dose worsens the reaction and decreasing the dose improves it, this supports a causal link.",
    yes: 1, no: 0, unknown: 0,
  },
  {
    id: "q9",
    label: "Has the patient had a similar reaction to this drug before?",
    tooltip: "Prior similar reaction: a history of the same adverse event with this drug or a drug in the same class adds strong support for causation.",
    yes: 1, no: 0, unknown: 0,
  },
  {
    id: "q10",
    label: "Was the adverse event confirmed by objective evidence?",
    tooltip: "Objective confirmation: lab results, imaging, biopsy, or other measurable findings that confirm the adverse event occurred — not just patient-reported symptoms.",
    yes: 1, no: 0, unknown: 0,
  },
];

// ─── Score interpretation helpers ────────────────────────────────────────────

function naranjoCategory(score: number): string {
  if (score >= 9) return "Definite";
  if (score >= 5) return "Probable";
  if (score >= 1) return "Possible";
  return "Doubtful";
}

function naranjoSignal(score: number): boolean {
  return score >= 5;
}

function naranjoColor(score: number): string {
  if (score >= 9) return "text-red-400 bg-red-500/10 border-red-500/20";
  if (score >= 5) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (score >= 1) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return "text-slate-400 bg-slate-500/10 border-slate-500/20";
}

function whoUmcColor(category: string): string {
  if (category === "Certain") return "text-red-400 bg-red-500/10 border-red-500/20";
  if (category === "Probable") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (category === "Possible") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return "text-slate-400 bg-slate-500/10 border-slate-500/20";
}

// ─── Verdict computation ──────────────────────────────────────────────────────

function computeVerdict(
  naranjoScore: number,
  whoCategory: string,
): { verdict: string; confidence: "high" | "moderate" | "low"; action: string; rationale: string } {
  const isCertain = whoCategory === "Certain";
  const isProbableWho = whoCategory === "Probable";

  if (naranjoScore >= 5 && (isCertain || isProbableWho)) {
    return {
      verdict: "Causal Relationship Established",
      confidence: "high",
      action: "Report to regulatory authority; consider label update",
      rationale: `Both Naranjo (${naranjoScore} — ${naranjoCategory(naranjoScore)}) and WHO-UMC (${whoCategory}) independently converge on a causal relationship. Dual-method agreement at this level meets the threshold for regulatory reporting.`,
    };
  }
  if (naranjoScore >= 5 || isProbableWho) {
    return {
      verdict: "Probable Causal Association",
      confidence: "moderate",
      action: "Monitor closely; document in patient record",
      rationale: `At least one method supports probable causation: Naranjo score ${naranjoScore} (${naranjoCategory(naranjoScore)}), WHO-UMC: ${whoCategory}. Insufficient for definitive causal attribution but warrants clinical documentation and monitoring.`,
    };
  }
  if (naranjoScore >= 1 || whoCategory === "Possible") {
    return {
      verdict: "Possible Association — Further Investigation Needed",
      confidence: "moderate",
      action: "Gather more clinical data; consider dechallenge/rechallenge",
      rationale: `Current evidence suggests a possible association (Naranjo: ${naranjoScore}, WHO-UMC: ${whoCategory}). Additional clinical data — particularly dechallenge/rechallenge outcomes — would strengthen or refute the causal hypothesis.`,
    };
  }
  return {
    verdict: "Insufficient Evidence for Causal Association",
    confidence: "low",
    action: "Continue monitoring; evaluate alternative causes",
    rationale: `Evidence is insufficient to establish causation (Naranjo: ${naranjoScore} — ${naranjoCategory(naranjoScore)}, WHO-UMC: ${whoCategory}). Alternative causes should be systematically evaluated.`,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Answer = "yes" | "no" | "unknown";

interface AssessmentResults {
  naranjo: NaranjoResult;
  whoUmc: WhoUmcResult;
  caseReports: CaseReport[];
  faersCases: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CausalityAssessmentReportPage() {
  // Step 1: drug + event
  const [drug, setDrug] = useState("");
  const [event, setEvent] = useState("");

  // Step 2: Naranjo answers
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  // Step 3: WHO-UMC toggles
  const [timeRelationship, setTimeRelationship] = useState(false);
  const [dechallenge, setDechallenge] = useState(false);
  const [rechallenge, setRechallenge] = useState(false);
  const [altCausesExcluded, setAltCausesExcluded] = useState(false);

  // UI state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AssessmentResults | null>(null);

  // ── Computed Naranjo score ────────────────────────────────────────────────
  const localScore = NARANJO_QUESTIONS.reduce((sum, q) => {
    const a = answers[q.id];
    if (a === "yes") return sum + q.yes;
    if (a === "no") return sum + q.no;
    return sum + q.unknown;
  }, 0);

  const answeredCount = Object.keys(answers).length;

  // ── Handlers ────────────────────────────────────────────────────────────
  const setAnswer = useCallback((qId: string, val: Answer) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  }, []);

  const runAssessment = useCallback(async () => {
    setLoading(true);
    setStep(4);

    const scoreMap: Record<string, number> = {};
    for (const q of NARANJO_QUESTIONS) {
      const a = answers[q.id] ?? "unknown";
      scoreMap[q.id] = a === "yes" ? q.yes : a === "no" ? q.no : q.unknown;
    }

    const [naranjoRes, whoRes, caseRes, faersRes] = await Promise.all([
      computeNaranjo(drug, event, scoreMap),
      computeWhoUmc(drug, event, {
        time_relationship: timeRelationship,
        dechallenge,
        rechallenge,
        alternative_causes: altCausesExcluded,
      }),
      searchCaseReports(drug, event, 5),
      getFaersContext(drug, event),
    ]);

    const finalScore = naranjoRes?.score ?? localScore;
    const finalCat = naranjoRes?.category ?? naranjoCategory(localScore);

    // Derive WHO-UMC locally if Station unavailable
    let whoCategory = whoRes?.category ?? "Unassessable";
    let whoDesc = whoRes?.description ?? "";
    let whoCriteria = whoRes?.criteria_met ?? [];
    if (!whoRes) {
      if (timeRelationship && dechallenge && rechallenge && altCausesExcluded) whoCategory = "Certain";
      else if (timeRelationship && dechallenge && altCausesExcluded) whoCategory = "Probable";
      else if (timeRelationship) whoCategory = "Possible";
      else whoCategory = "Unlikely";
      whoDesc = `Derived from clinical criteria: time relationship ${timeRelationship ? "present" : "absent"}, dechallenge ${dechallenge ? "positive" : "negative"}, rechallenge ${rechallenge ? "positive" : "negative"}, alternative causes ${altCausesExcluded ? "excluded" : "present"}.`;
      whoCriteria = [
        ...(timeRelationship ? ["Plausible time relationship"] : []),
        ...(dechallenge ? ["Positive dechallenge"] : []),
        ...(rechallenge ? ["Positive rechallenge"] : []),
        ...(altCausesExcluded ? ["Alternative causes excluded"] : []),
      ];
    }

    setResults({
      naranjo: { score: finalScore, category: finalCat, answers: scoreMap },
      whoUmc: { category: whoCategory, description: whoDesc, criteria_met: whoCriteria },
      caseReports: caseRes,
      faersCases: faersRes?.cases ?? 0,
    });

    setLoading(false);
    setStep(5);
  }, [drug, event, answers, timeRelationship, dechallenge, rechallenge, altCausesExcluded, localScore]);

  function downloadPdfCore(assessorInfo?: AssessorInfo) {
    if (!results) return;

    const { naranjo, whoUmc, caseReports, faersCases } = results;
    const verdict = computeVerdict(naranjo.score, whoUmc.category);
    const now = new Date().toISOString().slice(0, 10);

    const config: ReportConfig = {
      title: `${drug} — ${event}`,
      subtitle: `Naranjo: ${naranjoCategory(naranjo.score)} (${naranjo.score}) | WHO-UMC: ${whoUmc.category}`,
      reportType: "Causality Assessment Report",
      ichReference: "WHO-UMC / Naranjo Algorithm",
      drug,
      event,
      generatedAt: now,
      sections: [
        {
          type: "key-value",
          title: "Case Summary",
          entries: [
            { key: "Drug", value: drug },
            { key: "Adverse Event", value: event },
            { key: "FAERS Cases", value: faersCases > 0 ? faersCases.toLocaleString() : "Not queried" },
            { key: "Assessment Date", value: now },
          ],
        },
        {
          type: "table",
          title: "Naranjo Algorithm — Question Answers",
          headers: ["#", "Question", "Answer", "Score"],
          rows: NARANJO_QUESTIONS.map((q, i) => {
            const a = answers[q.id] ?? "unknown";
            const score = a === "yes" ? q.yes : a === "no" ? q.no : 0;
            return [
              String(i + 1),
              q.label,
              a === "unknown" ? "Don't know" : a.charAt(0).toUpperCase() + a.slice(1),
              score >= 0 ? `+${score}` : String(score),
            ];
          }),
        },
        {
          type: "scores",
          title: "Naranjo Score",
          scores: [
            {
              label: `Naranjo Total — ${naranjoCategory(naranjo.score)}`,
              value: naranjo.score,
              threshold: 5,
              signal: naranjoSignal(naranjo.score),
              interpretation:
                naranjo.score >= 9
                  ? "Definite (≥9): Strong evidence of a causal relationship between the drug and the adverse event."
                  : naranjo.score >= 5
                  ? "Probable (5–8): Evidence suggests causation but is not conclusive."
                  : naranjo.score >= 1
                  ? "Possible (1–4): Causation is conceivable but weak evidence."
                  : "Doubtful (≤0): Little to no evidence of causation.",
            },
          ],
        },
        {
          type: "key-value",
          title: "WHO-UMC Assessment",
          entries: [
            { key: "Category", value: whoUmc.category },
            { key: "Description", value: whoUmc.description || "—" },
            { key: "Criteria Met", value: whoUmc.criteria_met.length > 0 ? whoUmc.criteria_met.join(", ") : "None" },
          ],
        },
        ...(caseReports.length > 0
          ? [
              {
                type: "table" as const,
                title: "Supporting Literature — Published Case Reports",
                headers: ["PMID", "Title", "Journal", "Year"],
                rows: caseReports.map((r) => [
                  r.pmid,
                  r.title.length > 60 ? r.title.slice(0, 60) + "..." : r.title,
                  r.journal ?? "—",
                  r.year ?? "—",
                ]),
              },
            ]
          : []),
        {
          type: "verdict",
          title: "Overall Causality Verdict",
          verdict: verdict.verdict,
          confidence: verdict.confidence,
          action: verdict.action,
          rationale: verdict.rationale,
        },
      ],
    };

    if (assessorInfo) config.assessor = assessorInfo;
    generateAndDownload(config, `causality-${drug.toLowerCase().replace(/\s+/g, "-")}-${event.toLowerCase().replace(/\s+/g, "-")}-${now}.pdf`);
  }

  const handleAssessorDownload = useCallback((assessor: AssessorInfo) => {
    downloadPdfCore(assessor);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, drug, event, answers]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Causality Assessment Report</h1>
          <p className="text-sm text-muted-foreground">
            Assess whether a drug caused an adverse event using{" "}
            <JargonBuster
              term="Naranjo algorithm"
              definition="A 10-question scoring system that estimates the probability that an adverse event was caused by a drug. Scores range from negative (doubtful) to ≥9 (definite)."
            >
              Naranjo
            </JargonBuster>{" "}
            and{" "}
            <JargonBuster
              term="WHO-UMC criteria"
              definition="The World Health Organization Uppsala Monitoring Centre system for standardized causality assessment. Categories: Certain, Probable, Possible, Unlikely, Conditional, Unassessable."
            >
              WHO-UMC
            </JargonBuster>
            , then download a professional PDF report.
          </p>
        </div>
      </div>

      {/* ── Step 1: Drug + Event ───────────────────────────────────────────── */}
      <section className="space-y-4 rounded-lg border p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            1
          </span>
          <h2 className="text-lg font-semibold">Drug and Adverse Event</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Drug name</label>
            <input
              type="text"
              value={drug}
              onChange={(e) => setDrug(e.target.value)}
              placeholder="e.g. Semaglutide"
              disabled={step > 1}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Adverse event</label>
            <input
              type="text"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="e.g. Muscle atrophy"
              disabled={step > 1}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>
        </div>

        {step === 1 && (
          <button
            onClick={() => drug.trim() && event.trim() && setStep(2)}
            disabled={!drug.trim() || !event.trim()}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Continue to Naranjo Questions
          </button>
        )}

        {step > 1 && (
          <p className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            {drug} — {event}
          </p>
        )}
      </section>

      {/* ── Step 2: Naranjo Questionnaire ─────────────────────────────────── */}
      {step >= 2 && (
        <section className="space-y-4 rounded-lg border p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <h2 className="text-lg font-semibold">
              <JargonBuster
                term="Naranjo Algorithm"
                definition="A validated 10-question adverse drug reaction probability scale developed by Naranjo et al. (1981). Scores are summed to classify causality as Definite (≥9), Probable (5–8), Possible (1–4), or Doubtful (≤0)."
              >
                Naranjo Algorithm
              </JargonBuster>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Answer each question about the relationship between <strong>{drug}</strong> and{" "}
            <strong>{event}</strong>. Use &quot;Don&apos;t know&quot; when the information is unavailable — it scores 0.
          </p>

          <div className="space-y-3">
            {NARANJO_QUESTIONS.map((q, i) => {
              const selected = answers[q.id];
              return (
                <div key={q.id} className={cn("rounded-md border p-4 transition-colors", selected && "border-primary/30 bg-primary/5")}>
                  <p className="mb-3 text-sm">
                    <span className="mr-2 font-bold text-muted-foreground">{i + 1}.</span>
                    <JargonBuster term={q.label} definition={q.tooltip}>
                      {q.label}
                    </JargonBuster>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {(["yes", "no", "unknown"] as Answer[]).map((val) => {
                      const score = val === "yes" ? q.yes : val === "no" ? q.no : 0;
                      const scoreStr = score > 0 ? `+${score}` : score === 0 ? "0" : String(score);
                      return (
                        <button
                          key={val}
                          onClick={() => setAnswer(q.id, val)}
                          disabled={step >= 3}
                          className={cn(
                            "rounded-md border px-4 py-1.5 text-sm transition-colors disabled:opacity-60",
                            selected === val
                              ? val === "yes"
                                ? "border-green-500 bg-green-500/15 text-green-400"
                                : val === "no"
                                ? "border-red-500 bg-red-500/15 text-red-400"
                                : "border-primary bg-primary/15 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          {val === "unknown" ? "Don't know" : val === "yes" ? "Yes" : "No"}
                          <span className="ml-1.5 text-xs opacity-60">({scoreStr})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Running score */}
          <div className={cn("flex items-center justify-between rounded-md border p-4", naranjoColor(localScore))}>
            <div>
              <p className="font-semibold">
                Current Score: {localScore} — {naranjoCategory(localScore)}
              </p>
              <p className="text-xs opacity-70">{answeredCount} / 10 questions answered</p>
            </div>
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={answeredCount < 5}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Continue to WHO-UMC
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── Step 3: WHO-UMC Parameters ────────────────────────────────────── */}
      {step >= 3 && (
        <section className="space-y-4 rounded-lg border p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <h2 className="text-lg font-semibold">
              <JargonBuster
                term="WHO-UMC Parameters"
                definition="The WHO-UMC system uses four clinical criteria to classify causality. Each criterion is toggled yes/no based on the clinical case information."
              >
                WHO-UMC Parameters
              </JargonBuster>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Toggle which clinical criteria apply to this case. These feed the WHO-UMC causality category.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                key: "time",
                label: "Plausible time relationship",
                tooltip: "The adverse event occurred within a time window that is biologically plausible for the drug to have caused it.",
                value: timeRelationship,
                set: setTimeRelationship,
              },
              {
                key: "dechallenge",
                label: "Positive dechallenge",
                tooltip: "The adverse event improved or resolved after the drug was stopped.",
                value: dechallenge,
                set: setDechallenge,
              },
              {
                key: "rechallenge",
                label: "Positive rechallenge",
                tooltip: "The adverse event reappeared when the drug was restarted.",
                value: rechallenge,
                set: setRechallenge,
              },
              {
                key: "altCauses",
                label: "Alternative causes excluded",
                tooltip: "Other drugs, diseases, or factors that could have caused the adverse event have been ruled out.",
                value: altCausesExcluded,
                set: setAltCausesExcluded,
              },
            ].map(({ key, label, tooltip, value, set }) => (
              <button
                key={key}
                onClick={() => step === 3 && set((v) => !v)}
                disabled={step > 3}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-4 text-left transition-colors disabled:opacity-60",
                  value
                    ? "border-green-500/40 bg-green-500/10"
                    : "hover:bg-muted"
                )}
              >
                <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border", value ? "border-green-500 bg-green-500" : "border-muted-foreground")}>
                  {value && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                </div>
                <JargonBuster term={label} definition={tooltip}>
                  <span className="text-sm font-medium">{label}</span>
                </JargonBuster>
              </button>
            ))}
          </div>

          {step === 3 && (
            <button
              onClick={runAssessment}
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Scale className="h-4 w-4" />
              )}
              Run Assessment
            </button>
          )}
        </section>
      )}

      {/* ── Step 4: Processing ────────────────────────────────────────────── */}
      {step === 4 && loading && (
        <div className="flex items-center gap-3 rounded-lg border p-5">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Running Naranjo, WHO-UMC, case report search, and FAERS context in parallel…
          </p>
        </div>
      )}

      {/* ── Step 5: Report Preview + Download ────────────────────────────── */}
      {step === 5 && results && (() => {
        const { naranjo, whoUmc, caseReports, faersCases } = results;
        const verdict = computeVerdict(naranjo.score, whoUmc.category);

        return (
          <div className="space-y-6">
            {/* Section: Case Summary */}
            <section className="rounded-lg border p-6">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Case Summary</h2>
              </div>
              <dl className="grid gap-2 sm:grid-cols-2">
                {[
                  { k: "Drug", v: drug },
                  { k: "Adverse Event", v: event },
                  { k: "FAERS Cases", v: faersCases > 0 ? faersCases.toLocaleString() : "Not retrieved" },
                  { k: "Assessment Date", v: new Date().toISOString().slice(0, 10) },
                ].map(({ k, v }) => (
                  <div key={k}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k}</dt>
                    <dd className="text-sm font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Section: Naranjo */}
            <section className="rounded-lg border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Naranjo Algorithm</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="pb-2 pr-4 text-left">#</th>
                      <th className="pb-2 pr-4 text-left">Question</th>
                      <th className="pb-2 pr-4 text-center">Answer</th>
                      <th className="pb-2 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {NARANJO_QUESTIONS.map((q, i) => {
                      const a = answers[q.id] ?? "unknown";
                      const score = a === "yes" ? q.yes : a === "no" ? q.no : 0;
                      return (
                        <tr key={q.id} className="py-2">
                          <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                          <td className="py-2 pr-4">{q.label}</td>
                          <td className="py-2 pr-4 text-center capitalize">{a === "unknown" ? "Don't know" : a}</td>
                          <td className={cn("py-2 text-center font-mono font-semibold", score > 0 ? "text-green-400" : score < 0 ? "text-red-400" : "text-muted-foreground")}>
                            {score >= 0 ? `+${score}` : String(score)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={cn("flex items-center gap-4 rounded-md border p-4", naranjoColor(naranjo.score))}>
                <div className="text-center">
                  <p className="text-3xl font-bold">{naranjo.score}</p>
                  <p className="text-xs font-medium">{naranjoCategory(naranjo.score)}</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">
                    {naranjo.score >= 9 && "Definite (≥9): Strong evidence of a causal relationship."}
                    {naranjo.score >= 5 && naranjo.score < 9 && "Probable (5–8): Evidence suggests causation but is not conclusive."}
                    {naranjo.score >= 1 && naranjo.score < 5 && "Possible (1–4): Causation is conceivable but weak evidence."}
                    {naranjo.score <= 0 && "Doubtful (≤0): Little to no evidence of causation."}
                  </p>
                  <p className="mt-1 text-xs opacity-70">Threshold for signal: score ≥ 5</p>
                </div>
              </div>
            </section>

            {/* Section: WHO-UMC */}
            <section className="rounded-lg border p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">WHO-UMC Assessment</h2>
              </div>
              <div className="flex items-start gap-4">
                <div className={cn("shrink-0 rounded-lg border px-6 py-4 text-center", whoUmcColor(whoUmc.category))}>
                  <p className="text-2xl font-bold">{whoUmc.category}</p>
                </div>
                <div className="space-y-2">
                  {whoUmc.description && (
                    <p className="text-sm text-muted-foreground">{whoUmc.description}</p>
                  )}
                  {whoUmc.criteria_met.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {whoUmc.criteria_met.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section: Case Reports */}
            {caseReports.length > 0 && (
              <section className="rounded-lg border p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Supporting Literature</h2>
                </div>
                <p className="text-xs text-muted-foreground">Published case reports of {event} associated with {drug} (PubMed)</p>
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
              </section>
            )}

            {/* Section: Verdict */}
            <section className="rounded-lg border p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Overall Causality Verdict</h2>
              </div>
              <div className={cn(
                "rounded-lg p-5",
                verdict.confidence === "high" ? "bg-red-500/15 border border-red-500/30" :
                verdict.confidence === "moderate" ? "bg-amber-500/15 border border-amber-500/30" :
                "bg-slate-500/15 border border-slate-500/30"
              )}>
                <p className={cn(
                  "text-xl font-bold",
                  verdict.confidence === "high" ? "text-red-400" :
                  verdict.confidence === "moderate" ? "text-amber-400" :
                  "text-slate-400"
                )}>
                  {verdict.verdict}
                </p>
                <p className="mt-1 text-sm font-medium">
                  Confidence: <span className="uppercase">{verdict.confidence}</span>
                  {" · "}
                  Recommended: {verdict.action}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{verdict.rationale}</p>
              </div>
            </section>

            {/* Download with Assessor Form */}
            <div className="mt-4">
              <AssessorForm onDownload={handleAssessorDownload} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
