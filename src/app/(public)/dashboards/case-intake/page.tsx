"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Clock,
  Shield,
  User,
  Pill,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  callStation,
  type StepStatus,
  type ICSRValidationResult,
  type SeriousnessResult,
  type ExpeditedReportResult,
  type SubmissionDeadlineResult,
  type NaranjoResult,
} from "../station-client";
import { openReport, downloadJSON } from "../report-generator";

// ─── Types ──────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS: Record<Step, string> = {
  1: "Reporter & Patient",
  2: "Drug & Event",
  3: "ICSR Validation",
  4: "Seriousness",
  5: "Reporting Deadline",
  6: "Case Report",
};

interface CaseData {
  reporter_name: string;
  reporter_qualification: string;
  reporter_country: string;
  patient_initials: string;
  patient_age: string;
  patient_sex: string;
  suspect_drug: string;
  dose: string;
  route: string;
  indication: string;
  adverse_event: string;
  event_date: string;
  event_description: string;
  outcome: string;
  dechallenge: string;
  rechallenge: string;
  awareness_date: string;
  region: string;
}

const EMPTY_CASE: CaseData = {
  reporter_name: "",
  reporter_qualification: "healthcare_professional",
  reporter_country: "",
  patient_initials: "",
  patient_age: "",
  patient_sex: "",
  suspect_drug: "",
  dose: "",
  route: "oral",
  indication: "",
  adverse_event: "",
  event_date: "",
  event_description: "",
  outcome: "",
  dechallenge: "unknown",
  rechallenge: "unknown",
  awareness_date: new Date().toISOString().split("T")[0],
  region: "fda",
};

// ─── Step Indicator ─────────────────────────────────────────────────────────

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

// ─── Report Generator ───────────────────────────────────────────────────────

function generateCaseReport(
  caseData: CaseData,
  validation: ICSRValidationResult,
  seriousness: SeriousnessResult,
  reporting: ExpeditedReportResult,
  deadline: SubmissionDeadlineResult,
  naranjo: NaranjoResult | null,
): string {
  const criteriaRows = seriousness.criteria_met
    .map((c) => `<tr><td>${c.criterion.replace(/_/g, " ")}</td><td>${c.description}</td></tr>`)
    .join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>ICSR Case Intake: ${caseData.suspect_drug} — ${caseData.adverse_event}</title>
  <style>
    @page { margin: 1in; size: A4; }
    @media print { .no-print { display: none !important; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a2e; background: #fff; max-width: 900px; margin: 0 auto; padding: 40px 24px; }
    .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 22pt; margin-bottom: 4px; }
    .brand { color: #6366f1; font-weight: 600; }
    .urgent { color: #dc2626; font-weight: 700; border: 2px solid #dc2626; padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 8px; }
    .routine { color: #059669; font-weight: 600; }
    section { margin-bottom: 24px; }
    h2 { font-size: 14pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10pt; }
    th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; width: 35%; }
    .metric { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 11pt; }
    .metric-red { background: #fecaca; color: #991b1b; }
    .metric-amber { background: #fed7aa; color: #9a3412; }
    .metric-green { background: #d1fae5; color: #065f46; }
    .disclaimer { margin-top: 40px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 9pt; color: #64748b; }
    .footer { margin-top: 20px; text-align: center; font-size: 9pt; color: #94a3b8; }
    .actions { position: fixed; top: 16px; right: 16px; display: flex; gap: 8px; z-index: 100; }
    .actions button { padding: 8px 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 10pt; }
    .actions button.primary { background: #6366f1; color: white; border-color: #6366f1; }
  </style></head><body>
    <div class="actions no-print"><button onclick="window.print()" class="primary">Download PDF</button><button onclick="window.close()">Close</button></div>
    <div class="header">
      <h1>Individual Case Safety Report</h1>
      <p>Generated by <span class="brand">AlgoVigilance Station</span> on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      ${reporting.is_expedited ? `<div class="urgent">${reporting.report_type.toUpperCase()} EXPEDITED — ${reporting.deadline_days} Calendar Days</div>` : `<div class="routine">Non-Expedited — Periodic Report</div>`}
    </div>

    <section>
      <h2>Reporter Information</h2>
      <table>
        <tr><th>Name</th><td>${caseData.reporter_name || "Not provided"}</td></tr>
        <tr><th>Qualification</th><td>${caseData.reporter_qualification.replace(/_/g, " ")}</td></tr>
        <tr><th>Country</th><td>${caseData.reporter_country || "Not provided"}</td></tr>
      </table>
    </section>

    <section>
      <h2>Patient Information</h2>
      <table>
        <tr><th>Initials</th><td>${caseData.patient_initials || "Not provided"}</td></tr>
        <tr><th>Age</th><td>${caseData.patient_age || "Not provided"}</td></tr>
        <tr><th>Sex</th><td>${caseData.patient_sex || "Not provided"}</td></tr>
      </table>
    </section>

    <section>
      <h2>Suspect Drug</h2>
      <table>
        <tr><th>Drug Name</th><td><strong>${caseData.suspect_drug}</strong></td></tr>
        <tr><th>Dose</th><td>${caseData.dose || "Not specified"}</td></tr>
        <tr><th>Route</th><td>${caseData.route}</td></tr>
        <tr><th>Indication</th><td>${caseData.indication || "Not specified"}</td></tr>
      </table>
    </section>

    <section>
      <h2>Adverse Event</h2>
      <table>
        <tr><th>Event Term</th><td><strong>${caseData.adverse_event}</strong></td></tr>
        <tr><th>Event Date</th><td>${caseData.event_date || "Unknown"}</td></tr>
        <tr><th>Description</th><td>${caseData.event_description || "Not provided"}</td></tr>
        <tr><th>Outcome</th><td>${caseData.outcome || "Unknown"}</td></tr>
        <tr><th>Dechallenge</th><td>${caseData.dechallenge}</td></tr>
        <tr><th>Rechallenge</th><td>${caseData.rechallenge}</td></tr>
      </table>
    </section>

    <section>
      <h2>ICSR Validation (ICH E2B)</h2>
      <table>
        <tr><th>Status</th><td><span class="metric ${validation.is_valid ? "metric-green" : "metric-red"}">${validation.status.toUpperCase()}</span></td></tr>
        <tr><th>Completeness</th><td>${(validation.completeness_score * 100).toFixed(0)}% (${validation.elements_present.length}/4 elements)</td></tr>
        ${validation.elements_missing.length > 0 ? `<tr><th>Missing</th><td>${validation.elements_missing.join(", ")}</td></tr>` : ""}
      </table>
    </section>

    <section>
      <h2>Seriousness Assessment (ICH E2A)</h2>
      <table>
        <tr><th>Serious</th><td><span class="metric ${seriousness.is_serious ? "metric-red" : "metric-green"}">${seriousness.is_serious ? "YES — SERIOUS" : "Non-serious"}</span></td></tr>
        ${seriousness.highest_criterion ? `<tr><th>Highest Criterion</th><td>${seriousness.highest_criterion.replace(/_/g, " ")}</td></tr>` : ""}
      </table>
      ${criteriaRows ? `<h3 style="font-size:11pt;margin:8px 0;">Criteria Met</h3><table><tr><th>Criterion</th><th>Description</th></tr>${criteriaRows}</table>` : ""}
    </section>

    <section>
      <h2>Regulatory Determination</h2>
      <table>
        <tr><th>Report Type</th><td><strong>${reporting.report_type.replace(/_/g, " ").toUpperCase()}</strong></td></tr>
        <tr><th>Deadline</th><td>${reporting.deadline_days} calendar days</td></tr>
        <tr><th>Expedited</th><td>${reporting.is_expedited ? "Yes" : "No"}</td></tr>
        <tr><th>Region</th><td>${reporting.region.toUpperCase()}</td></tr>
        <tr><th>Rationale</th><td>${reporting.rationale}</td></tr>
      </table>
    </section>

    <section>
      <h2>Submission Timeline</h2>
      <table>
        <tr><th>Day 0 (Awareness)</th><td>${deadline.awareness_date}</td></tr>
        <tr><th>Deadline</th><td><strong>${deadline.deadline_date}</strong></td></tr>
        <tr><th>Status</th><td><span class="metric ${deadline.is_overdue ? "metric-red" : "metric-green"}">${deadline.is_overdue ? "OVERDUE" : `${deadline.days_remaining} days remaining`}</span></td></tr>
      </table>
    </section>

    ${naranjo ? `
    <section>
      <h2>Causality Assessment (Naranjo)</h2>
      <table>
        <tr><th>Score</th><td><strong>${naranjo.score}</strong> / 13</td></tr>
        <tr><th>Category</th><td><span class="metric ${naranjo.score >= 9 ? "metric-red" : naranjo.score >= 5 ? "metric-amber" : "metric-green"}">${naranjo.category}</span></td></tr>
      </table>
    </section>
    ` : ""}

    <div class="disclaimer"><strong>Disclaimer:</strong> This report is generated for educational and research purposes using AlgoVigilance Station. It does not constitute an official regulatory filing. All data should be independently verified.</div>
    <div class="footer">AlgoVigilance — Pharmacovigilance for AlgoVigilances — nexvigilant.com<br/>Case ID: ICSR-${Date.now().toString(36).toUpperCase()}</div>
  </body></html>`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CaseIntakePage() {
  const [caseData, setCaseData] = useState<CaseData>({ ...EMPTY_CASE });
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [steps, setSteps] = useState<Record<Step, StepStatus>>({
    1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" },
    4: { status: "pending" }, 5: { status: "pending" }, 6: { status: "pending" },
  });

  const [validation, setValidation] = useState<ICSRValidationResult | null>(null);
  const [seriousness, setSeriousness] = useState<SeriousnessResult | null>(null);
  const [reporting, setReporting] = useState<ExpeditedReportResult | null>(null);
  const [deadline, setDeadline] = useState<SubmissionDeadlineResult | null>(null);
  const [naranjo, setNaranjo] = useState<NaranjoResult | null>(null);

  const update = useCallback((step: Step, u: Partial<StepStatus>) => {
    setSteps((p) => ({ ...p, [step]: { ...p[step], ...u } }));
  }, []);

  const updateField = useCallback((field: keyof CaseData, value: string) => {
    setCaseData((p) => ({ ...p, [field]: value }));
  }, []);

  // Step 1 → 2: Just advance (form collection)
  const advanceTo2 = useCallback(() => {
    if (!caseData.reporter_name && !caseData.reporter_country) return;
    if (!caseData.patient_initials && !caseData.patient_age && !caseData.patient_sex) return;
    update(1, { status: "done" });
    setCurrentStep(2);
  }, [caseData, update]);

  // Step 2 → 3-6: Run the full pipeline
  const runPipeline = useCallback(async () => {
    if (!caseData.suspect_drug || !caseData.adverse_event) return;
    update(2, { status: "done" });

    // Step 3: ICSR Validation
    setCurrentStep(3);
    update(3, { status: "loading", startedAt: Date.now() });
    const valResult = await callStation("pv-engine_nexvigilant_com_validate_icsr_minimum", {
      reporter_name: caseData.reporter_name,
      reporter_country: caseData.reporter_country,
      patient_initials: caseData.patient_initials,
      patient_age: caseData.patient_age,
      patient_sex: caseData.patient_sex,
      suspect_drug: caseData.suspect_drug,
      adverse_event: caseData.adverse_event,
      event_date: caseData.event_date,
    });
    const val: ICSRValidationResult = valResult ? {
      status: String(valResult.status ?? "invalid"),
      is_valid: Boolean(valResult.is_valid),
      elements_present: Array.isArray(valResult.elements_present) ? valResult.elements_present.map(String) : [],
      elements_missing: Array.isArray(valResult.elements_missing) ? valResult.elements_missing.map(String) : [],
      completeness_score: Number(valResult.completeness_score ?? 0),
    } : { status: "error", is_valid: false, elements_present: [], elements_missing: ["all"], completeness_score: 0 };
    setValidation(val);
    update(3, { status: "done", completedAt: Date.now() });

    // Step 4: Seriousness
    setCurrentStep(4);
    update(4, { status: "loading", startedAt: Date.now() });
    const serResult = await callStation("pv-engine_nexvigilant_com_classify_seriousness", {
      event_description: caseData.event_description || caseData.adverse_event,
      resulted_in_death: caseData.outcome === "death",
      life_threatening: caseData.outcome === "life_threatening",
      hospitalization: caseData.outcome === "hospitalization",
      disability: caseData.outcome === "disability",
    });
    const ser: SeriousnessResult = serResult ? {
      is_serious: Boolean(serResult.is_serious),
      criteria_met: Array.isArray(serResult.criteria_met) ? serResult.criteria_met as { criterion: string; description: string }[] : [],
      highest_criterion: serResult.highest_criterion ? String(serResult.highest_criterion) : null,
    } : { is_serious: false, criteria_met: [], highest_criterion: null };
    setSeriousness(ser);
    update(4, { status: "done", completedAt: Date.now() });

    // Step 5: Expedited Reporting + Deadline
    setCurrentStep(5);
    update(5, { status: "loading", startedAt: Date.now() });
    const [repResult, dlResult] = await Promise.all([
      callStation("pv-engine_nexvigilant_com_determine_expedited_reporting", {
        is_serious: ser.is_serious,
        is_unexpected: true, // Conservative — treat as unexpected unless known
        is_fatal: caseData.outcome === "death",
        is_life_threatening: caseData.outcome === "life_threatening",
        region: caseData.region,
        context: "post_marketing",
      }),
      callStation("pv-engine_nexvigilant_com_calculate_submission_deadline", {
        awareness_date: caseData.awareness_date,
        report_type: ser.is_serious ? "15_day" : "non_expedited",
        region: caseData.region,
      }),
    ]);

    const rep: ExpeditedReportResult = repResult ? {
      report_type: String(repResult.report_type ?? "non_expedited"),
      deadline_days: Number(repResult.deadline_days ?? 0),
      is_expedited: Boolean(repResult.is_expedited),
      rationale: String(repResult.rationale ?? ""),
      criteria_met: Array.isArray(repResult.criteria_met) ? repResult.criteria_met.map(String) : [],
      region: String(repResult.region ?? "ich"),
    } : { report_type: "non_expedited", deadline_days: 0, is_expedited: false, rationale: "", criteria_met: [], region: "ich" };
    setReporting(rep);

    const dl: SubmissionDeadlineResult = dlResult ? {
      awareness_date: String(dlResult.awareness_date ?? ""),
      deadline_date: String(dlResult.deadline_date ?? ""),
      calendar_days: Number(dlResult.calendar_days ?? 0),
      is_overdue: Boolean(dlResult.is_overdue),
      days_remaining: dlResult.days_remaining != null ? Number(dlResult.days_remaining) : null,
    } : { awareness_date: "", deadline_date: "", calendar_days: 0, is_overdue: false, days_remaining: null };
    setDeadline(dl);
    update(5, { status: "done", completedAt: Date.now() });

    // Quick Naranjo (partial — from dechallenge/rechallenge info)
    if (caseData.dechallenge !== "unknown" || caseData.rechallenge !== "unknown") {
      const narResult = await callStation("pv-engine_nexvigilant_com_assess_naranjo", {
        drug: caseData.suspect_drug,
        event: caseData.adverse_event,
        q1_previous_reports: "unknown",
        q2_temporal_relationship: caseData.event_date ? "yes" : "unknown",
        q3_dechallenge: caseData.dechallenge === "yes" ? "yes" : caseData.dechallenge === "no" ? "no" : "unknown",
        q4_rechallenge: caseData.rechallenge === "yes" ? "yes" : caseData.rechallenge === "no" ? "no" : "unknown",
        q5_alternative_causes: "unknown",
        q6_placebo_response: "unknown",
        q7_drug_concentration: "unknown",
        q8_dose_response: "unknown",
        q9_previous_experience: "unknown",
        q10_objective_evidence: "unknown",
      });
      if (narResult) {
        setNaranjo({
          score: Number(narResult.score ?? 0),
          category: String(narResult.category ?? "Unknown"),
          answers: {},
        });
      }
    }

    // Step 6: Report ready
    setCurrentStep(6);
    update(6, { status: "done", startedAt: Date.now(), completedAt: Date.now() });
  }, [caseData, update]);

  const downloadReport = useCallback(() => {
    if (!validation || !seriousness || !reporting || !deadline) return;
    openReport(generateCaseReport(caseData, validation, seriousness, reporting, deadline, naranjo));
  }, [caseData, validation, seriousness, reporting, deadline, naranjo]);

  const reset = useCallback(() => {
    setCaseData({ ...EMPTY_CASE });
    setCurrentStep(1);
    setSteps({ 1: { status: "pending" }, 2: { status: "pending" }, 3: { status: "pending" }, 4: { status: "pending" }, 5: { status: "pending" }, 6: { status: "pending" } });
    setValidation(null); setSeriousness(null); setReporting(null); setDeadline(null); setNaranjo(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
            <ClipboardList className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Case Intake</h1>
            <p className="text-sm text-muted-foreground">Submit an adverse event report with automated regulatory triage</p>
          </div>
        </div>
        <Link href="/dashboards" className="text-sm text-muted-foreground hover:text-primary">All Dashboards</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Step Sidebar */}
        <div className="space-y-1 rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Steps</p>
          {([1, 2, 3, 4, 5, 6] as Step[]).map((s) => (
            <StepBar key={s} step={s} current={currentStep} state={steps[s]} />
          ))}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Step 1: Reporter & Patient */}
          {currentStep === 1 && (
            <div className="space-y-6 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 1: Reporter & Patient Information</h2>
              <p className="text-sm text-muted-foreground">
                Enter the{" "}
                <JargonBuster term="minimum data elements" definition="ICH E2B(R3) requires 4 elements: identifiable reporter, identifiable patient, suspect product, and suspect reaction">
                  minimum case data
                </JargonBuster>{" "}
                required for a valid ICSR.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium"><User className="h-4 w-4" /> Reporter</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Name</label>
                    <input type="text" value={caseData.reporter_name} onChange={(e) => updateField("reporter_name", e.target.value)}
                      placeholder="Dr. Jane Smith" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Qualification</label>
                    <select value={caseData.reporter_qualification} onChange={(e) => updateField("reporter_qualification", e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="healthcare_professional">Healthcare Professional</option>
                      <option value="consumer">Consumer/Patient</option>
                      <option value="lawyer">Lawyer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Country</label>
                    <input type="text" value={caseData.reporter_country} onChange={(e) => updateField("reporter_country", e.target.value)}
                      placeholder="United States" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium"><Activity className="h-4 w-4" /> Patient</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Initials</label>
                    <input type="text" value={caseData.patient_initials} onChange={(e) => updateField("patient_initials", e.target.value)}
                      placeholder="JS" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Age</label>
                    <input type="text" value={caseData.patient_age} onChange={(e) => updateField("patient_age", e.target.value)}
                      placeholder="45" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Sex</label>
                    <select value={caseData.patient_sex} onChange={(e) => updateField("patient_sex", e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>
              </div>

              <button onClick={advanceTo2}
                disabled={(!caseData.reporter_name && !caseData.reporter_country) || (!caseData.patient_initials && !caseData.patient_age && !caseData.patient_sex)}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                Next: Drug & Event
              </button>
            </div>
          )}

          {/* Step 2: Drug & Event */}
          {currentStep === 2 && (
            <div className="space-y-6 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 2: Suspect Drug & Adverse Event</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium"><Pill className="h-4 w-4" /> Suspect Drug</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Drug Name *</label>
                    <input type="text" value={caseData.suspect_drug} onChange={(e) => updateField("suspect_drug", e.target.value)}
                      placeholder="Semaglutide" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Dose</label>
                    <input type="text" value={caseData.dose} onChange={(e) => updateField("dose", e.target.value)}
                      placeholder="0.5 mg weekly" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4" /> Adverse Event</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Event Term *</label>
                    <input type="text" value={caseData.adverse_event} onChange={(e) => updateField("adverse_event", e.target.value)}
                      placeholder="Pancreatitis" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Event Date</label>
                    <input type="date" value={caseData.event_date} onChange={(e) => updateField("event_date", e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Description</label>
                  <textarea value={caseData.event_description} onChange={(e) => updateField("event_description", e.target.value)}
                    placeholder="Patient presented with severe abdominal pain 3 weeks after starting semaglutide..."
                    rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Outcome</label>
                    <select value={caseData.outcome} onChange={(e) => updateField("outcome", e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="">Select...</option>
                      <option value="recovered">Recovered</option>
                      <option value="recovering">Recovering</option>
                      <option value="not_recovered">Not Recovered</option>
                      <option value="hospitalization">Hospitalization</option>
                      <option value="disability">Disability</option>
                      <option value="life_threatening">Life-Threatening</option>
                      <option value="death">Death</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Dechallenge</label>
                    <select value={caseData.dechallenge} onChange={(e) => updateField("dechallenge", e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="unknown">Unknown</option>
                      <option value="yes">Positive (improved)</option>
                      <option value="no">Negative (no change)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Region</label>
                    <select value={caseData.region} onChange={(e) => updateField("region", e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="fda">FDA (US)</option>
                      <option value="ema">EMA (EU)</option>
                      <option value="pmda">PMDA (Japan)</option>
                      <option value="hc">Health Canada</option>
                      <option value="ich">ICH (Default)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button onClick={runPipeline}
                disabled={!caseData.suspect_drug || !caseData.adverse_event || steps[3].status === "loading"}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {steps[3].status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Process Case
              </button>
            </div>
          )}

          {/* Step 3: ICSR Validation Result */}
          {validation && steps[3].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 3: ICSR Validation</h2>
              <div className={cn("flex items-center gap-3 rounded-md p-3", validation.is_valid ? "bg-green-500/10" : "bg-red-500/10")}>
                {validation.is_valid ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-red-500" />}
                <div>
                  <p className="font-medium">{validation.is_valid ? "Valid ICSR" : "Incomplete ICSR"} — {(validation.completeness_score * 100).toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">{validation.elements_present.length}/4 minimum elements present</p>
                </div>
              </div>
              {validation.elements_missing.length > 0 && (
                <p className="text-sm text-amber-600">Missing: {validation.elements_missing.join(", ")}</p>
              )}
            </div>
          )}

          {/* Step 4: Seriousness */}
          {seriousness && steps[4].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 4: Seriousness Classification</h2>
              <div className={cn("flex items-center gap-3 rounded-md p-3", seriousness.is_serious ? "bg-red-500/10" : "bg-green-500/10")}>
                {seriousness.is_serious ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />}
                <div>
                  <p className="font-medium">{seriousness.is_serious ? "SERIOUS" : "Non-serious"}</p>
                  {seriousness.highest_criterion && (
                    <p className="text-sm text-muted-foreground">Highest: {seriousness.highest_criterion.replace(/_/g, " ")}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Reporting */}
          {reporting && deadline && steps[5].status === "done" && (
            <div className="space-y-3 rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Step 5: Regulatory Determination</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className={cn("rounded-lg border p-4 text-center", reporting.is_expedited ? "border-red-500/30 bg-red-500/5" : "bg-muted/30")}>
                  <p className="text-xs text-muted-foreground">Report Type</p>
                  <p className="text-lg font-bold">{reporting.report_type.replace(/_/g, " ").toUpperCase()}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="text-lg font-bold">{deadline.deadline_date}</p>
                </div>
                <div className={cn("rounded-lg border p-4 text-center", deadline.is_overdue ? "border-red-500/30 bg-red-500/5" : "bg-muted/30")}>
                  <p className="text-xs text-muted-foreground">Days Remaining</p>
                  <p className="text-lg font-bold">{deadline.is_overdue ? "OVERDUE" : deadline.days_remaining}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{reporting.rationale}</p>
            </div>
          )}

          {/* Step 6: Report */}
          {steps[6].status === "done" && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-semibold">Step 6: Case Report Ready</h2>
              <p className="text-sm text-muted-foreground">
                Case intake complete for <strong>{caseData.suspect_drug}</strong> + <strong>{caseData.adverse_event}</strong>.
                Download the structured ICSR report.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={downloadReport}
                  className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  <Download className="h-4 w-4" /> Download Case Report
                </button>
                <button onClick={() => downloadJSON(
                  { caseData, validation, seriousness, reporting, deadline, naranjo },
                  `icsr-${caseData.suspect_drug.toLowerCase()}-${Date.now()}.json`,
                )} className="flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted">
                  <FileText className="h-4 w-4" /> Export JSON
                </button>
              </div>
              <button onClick={reset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3" /> New case
              </button>
            </div>
          )}

          {/* Loading */}
          {Object.values(steps).some((s) => s.status === "loading") && (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing case through Guardian PV Engine...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
