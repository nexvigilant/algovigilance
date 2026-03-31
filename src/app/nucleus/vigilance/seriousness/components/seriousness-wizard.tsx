"use client";

import { useState, useCallback, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Skull,
  Hospital,
  Accessibility,
  Heart,
  Baby,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Clock,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  StepWizard,
  TrafficLight,
  JargonBuster,
  WarningBox,
  TipBox,
} from "@/components/pv-for-nexvigilants";
import type { Step } from "@/components/pv-for-nexvigilants";
import {
  callStation,
  type StationNaranjoResult,
} from "@/lib/station-client";
import {
  classifySeriousness,
  computeReportingDeadline,
  type SeriousnessCriteria,
  type SeriousnessResult,
  type DeadlineResult,
} from "@/lib/pv-compute";

// ─── Criterion definitions ────────────────────────────────────────────────────

interface CriterionDef {
  key: keyof SeriousnessCriteria;
  label: string;
  plain: string;
  icon: LucideIcon;
  example: string;
}

const CRITERIA: CriterionDef[] = [
  {
    key: "death",
    label: "Death",
    plain: "Did the adverse event result in death?",
    icon: Skull,
    example:
      "Patient died during treatment or as a consequence of the adverse reaction.",
  },
  {
    key: "hospitalization",
    label: "Hospitalization",
    plain: "Did it require or extend a hospital stay?",
    icon: Hospital,
    example:
      "Patient was admitted to hospital, or an existing hospital stay was prolonged because of the event.",
  },
  {
    key: "disability",
    label: "Disability / Incapacity",
    plain: "Did it cause lasting disability or inability to function?",
    icon: Accessibility,
    example:
      "Patient developed persistent hearing loss, vision impairment, or mobility limitation.",
  },
  {
    key: "life_threatening",
    label: "Life-Threatening",
    plain: "Was the patient at immediate risk of death?",
    icon: Heart,
    example:
      "Patient experienced anaphylaxis, cardiac arrest, or respiratory failure requiring emergency intervention.",
  },
  {
    key: "congenital_anomaly",
    label: "Congenital Anomaly",
    plain: "Did it cause a birth defect?",
    icon: Baby,
    example:
      "Exposure during pregnancy resulted in a structural or functional defect in the newborn.",
  },
  {
    key: "medically_important",
    label: "Medically Important",
    plain:
      "Was it a significant medical event that may not fit the criteria above?",
    icon: ShieldAlert,
    example:
      "Bronchospasm requiring ER treatment, blood dyscrasia, seizures, or drug dependency.",
  },
];

// ─── Step sub-components ──────────────────────────────────────────────────────

function StepIntroContent() {
  return (
    <div className="flex flex-col gap-5">
      <TipBox>
        <strong>For AlgoVigilances:</strong> Seriousness is the{" "}
        <strong>first question</strong> in every pharmacovigilance case. It
        determines how fast you must report and to whom. This is not about
        severity (how bad) &mdash; it is about regulatory category (which
        bucket).
      </TipBox>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          What is{" "}
          <JargonBuster
            term="ICH E2A"
            definition="International guidelines that define when an adverse event is 'serious' — these are the global standard used by FDA, EMA, and all regulators"
          >
            ICH E2A
          </JargonBuster>
          ?
        </h4>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The ICH E2A guideline is the global standard that defines exactly when
          an adverse event is &ldquo;serious.&rdquo; If any one of six criteria
          is met, the case is serious &mdash; and serious cases trigger stricter
          reporting obligations.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          In the next step, you&apos;ll check which criteria apply to your case.
          Even one criterion is enough. We&apos;ll compute your reporting
          deadline automatically.
        </p>
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <p className="text-sm text-cyan-300">
          <strong>This wizard covers:</strong> ICH E2A criteria check &rarr;
          Seriousness verdict &rarr; Reporting deadline calculation
        </p>
      </div>
    </div>
  );
}

function StepCriteriaContent({
  criteria,
  onToggle,
}: {
  criteria: SeriousnessCriteria;
  onToggle: (key: keyof SeriousnessCriteria) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <TipBox>
        If you&apos;re unsure about a criterion, it&apos;s safer to check it
        &mdash; regulators prefer over-reporting to under-reporting.
      </TipBox>

      <div className="grid gap-4 sm:grid-cols-2">
        {CRITERIA.map((c) => {
          const Icon = c.icon;
          const isActive = !!criteria[c.key];

          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onToggle(c.key)}
              className={`group flex flex-col gap-3 rounded-xl border p-5 text-left transition-all duration-200 ${
                isActive
                  ? "border-red-500/50 bg-red-500/10 ring-1 ring-red-500/30"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-red-500/20 text-red-400"
                      : "bg-white/5 text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {c.label === "Life-Threatening" ? (
                        <JargonBuster
                          term="Life-Threatening"
                          definition="The patient was at real risk of dying at the time of the event — not that the drug COULD theoretically cause death"
                        >
                          {c.label}
                        </JargonBuster>
                      ) : c.label === "Congenital Anomaly" ? (
                        <JargonBuster
                          term="Congenital Anomaly"
                          definition="A birth defect — if the patient was pregnant and the baby was affected"
                        >
                          {c.label}
                        </JargonBuster>
                      ) : c.label === "Hospitalization" ? (
                        <JargonBuster
                          term="Hospitalization"
                          definition="The patient had to be admitted to a hospital or their stay was extended because of this event"
                        >
                          {c.label}
                        </JargonBuster>
                      ) : c.label === "Medically Important" ? (
                        <JargonBuster
                          term="Important Medical Event"
                          definition="A catch-all for events that don't meet the other criteria but still require medical judgment"
                        >
                          {c.label}
                        </JargonBuster>
                      ) : (
                        c.label
                      )}
                    </span>
                    {isActive && (
                      <CheckCircle2 className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{c.plain}</p>
              <p className="text-xs italic text-muted-foreground/70">
                Example: {c.example}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepVerdictContent({
  criteria,
  result,
  deadline,
}: {
  criteria: SeriousnessCriteria;
  result: SeriousnessResult;
  deadline: DeadlineResult;
}) {
  const isSerious = result.seriousness === "SERIOUS";
  const activeCriteria = CRITERIA.filter((c) => criteria[c.key]);

  return (
    <div className="flex flex-col gap-5">
      {/* Traffic light verdict */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <TrafficLight
          level={isSerious ? "red" : "green"}
          label={isSerious ? "SERIOUS" : "Non-Serious"}
        />
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            ICH E2A Classification
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {result.regulatory_reference}
          </p>
        </div>
      </div>

      {/* Serious case warning */}
      {isSerious && (
        <WarningBox>
          This case is <strong>serious</strong> and triggers{" "}
          <JargonBuster
            term="Expedited Reporting"
            definition="A faster reporting deadline (usually 15 days instead of 90) required for serious cases"
          >
            expedited reporting
          </JargonBuster>{" "}
          obligations. You have{" "}
          <strong>{deadline.deadline_days} calendar days</strong> to submit your
          initial report.
        </WarningBox>
      )}

      {/* Non-serious case */}
      {!isSerious && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <p className="text-sm text-emerald-200">
              No ICH E2A seriousness criteria were met. This case follows
              standard (non-expedited) reporting timelines.
            </p>
          </div>
        </div>
      )}

      {/* Reporting obligations */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-4 w-4" />
          Reporting Obligations
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs text-muted-foreground">Reportable</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {result.reportable ? "Yes" : "No"}
            </p>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs text-muted-foreground">Expedited</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {result.expedited ? "Yes" : "No"}
            </p>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs text-muted-foreground">Deadline</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {deadline.deadline_days} days
            </p>
            <p className="text-xs text-muted-foreground">
              {deadline.deadline_type.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Regulatory basis */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">
            Regulatory Basis
          </h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {deadline.regulatory_basis}
        </p>
      </div>

      {/* Primary criterion */}
      {result.criterion && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Highest-priority criterion
          </p>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="font-medium text-red-300">
              {result.criterion.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}

      {/* Active criteria summary */}
      {activeCriteria.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Criteria Met
          </h3>
          <ul className="space-y-1">
            {activeCriteria.map((c) => {
              const Icon = c.icon;
              return (
                <li
                  key={c.key}
                  className="flex items-center gap-2 text-sm text-red-300"
                >
                  <Icon className="h-4 w-4" />
                  {c.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Next step */}
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
        <p className="text-sm text-cyan-300">
          <strong>What&apos;s next?</strong> After classifying seriousness, the
          PV workflow routes to <strong>causality assessment</strong> (Naranjo
          or WHO-UMC) to determine whether the drug caused the event. Use the{" "}
          <a
            href="/nucleus/vigilance/causality"
            className="underline hover:text-cyan-200"
          >
            Causality Assessment
          </a>{" "}
          tools.
        </p>
      </div>

      {/* Station cross-check */}
      <SeriousnessStationVerification />

      {/* Reset */}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 self-start rounded-lg border border-white/10 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
      >
        <RotateCcw className="h-4 w-4" />
        Assess another case
      </button>
    </div>
  );
}

// ─── Station Verification ───────────────────────────────────────────────────

function SeriousnessStationVerification() {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stationResult, setStationResult] = useState<Record<string, unknown> | null>(null);

  const verify = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callStation("calculate_nexvigilant_com_classify_seriousness", {
        fatal: false,
        life_threatening: false,
        hospitalization: true,
        disability: false,
        congenital_anomaly: false,
        other_serious: false,
      });
      setStationResult(res);
      setVerified(true);
    } catch {
      // Station unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
      <h4 className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-2">
        Cross-check with AlgoVigilance Station
      </h4>
      {!verified ? (
        <button
          type="button"
          onClick={verify}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
              Classifying on mcp.nexvigilant.com...
            </>
          ) : (
            <>
              <ShieldAlert className="h-4 w-4" />
              Verify Seriousness with Live Engine
            </>
          )}
        </button>
      ) : stationResult ? (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-white/50">Station Classification</span>
            <span className="font-mono text-violet-300">
              {String(stationResult.classification ?? stationResult.seriousness ?? "—")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Serious?</span>
            <span className={`font-mono ${stationResult.is_serious ? "text-rose-400" : "text-emerald-400"}`}>
              {stationResult.is_serious ? "YES" : "NO"}
            </span>
          </div>
          <p className="text-[10px] text-white/30 mt-1">
            Powered by mcp.nexvigilant.com — the same engine AI agents use.
          </p>
        </div>
      ) : (
        <p className="text-xs text-white/40">Station unavailable — local classification stands.</p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SeriousnessWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [criteria, setCriteria] = useState<SeriousnessCriteria>({});

  const toggleCriterion = useCallback((key: keyof SeriousnessCriteria) => {
    setCriteria((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const result: SeriousnessResult = useMemo(
    () => classifySeriousness(criteria),
    [criteria],
  );

  const deadline: DeadlineResult = useMemo(
    () =>
      computeReportingDeadline({
        is_fatal: criteria.death,
        is_life_threatening: criteria.life_threatening,
        is_serious: result.seriousness === "SERIOUS",
        is_unexpected: true,
      }),
    [criteria.death, criteria.life_threatening, result.seriousness],
  );

  const handleNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, 2));
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const steps: Step[] = useMemo(
    () => [
      {
        title: "What Are We Checking?",
        description:
          "A quick overview of the ICH E2A seriousness criteria and what this wizard will do.",
        content: <StepIntroContent />,
      },
      {
        title: "Check the Criteria",
        description:
          "Select every ICH E2A criterion that applies to this adverse event. Even one means the case is serious.",
        content: (
          <StepCriteriaContent criteria={criteria} onToggle={toggleCriterion} />
        ),
      },
      {
        title: "Your Verdict",
        description:
          "Here is your seriousness classification and reporting deadline based on ICH E2A.",
        content: (
          <StepVerdictContent
            criteria={criteria}
            result={result}
            deadline={deadline}
          />
        ),
      },
    ],
    [criteria, toggleCriterion, result, deadline],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
      />
    </div>
  );
}
