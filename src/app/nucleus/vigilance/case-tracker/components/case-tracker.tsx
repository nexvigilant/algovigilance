"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Inbox,
  Filter,
  ClipboardCheck,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TipBox,
  RememberBox,
  WarningBox,
  JargonBuster,
  TrafficLight,
} from "@/components/pv-for-nexvigilants";
import {
  getSeriousnessLevel,
  getSeriousnessLabel,
  getPriorityBadge,
} from "@/lib/pv-compute";
import {
  getCases,
  transitionCase,
  type CaseLifecycle,
  type CaseStage as PvosCaseStage,
} from "@/lib/pvos-client";

/* ------------------------------------------------------------------ */
/*  PVOS FSM Stage Types                                                */
/* ------------------------------------------------------------------ */

type CaseStage = "new" | "triage" | "assessment" | "reporting" | "closed";

type CaseSeriousness = "serious" | "non_serious" | "pending";

type CasePriority = "expedited" | "standard" | "follow_up";

interface SafetyCase {
  id: string;
  title: string;
  drug: string;
  event: string;
  stage: CaseStage;
  seriousness: CaseSeriousness;
  priority: CasePriority;
  receivedDate: string;
  deadlineDate: string | null;
  daysInStage: number;
  narrative: string;
}

/* ------------------------------------------------------------------ */
/*  Pipeline stage configuration                                        */
/* ------------------------------------------------------------------ */

interface StageConfig {
  stage: CaseStage;
  label: string;
  description: string;
  icon: typeof Inbox;
  color: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
}

const PIPELINE_STAGES: StageConfig[] = [
  {
    stage: "new",
    label: "New",
    description: "Received but not yet reviewed",
    icon: Inbox,
    color: "text-cyan",
    borderColor: "border-cyan/30",
    bgColor: "bg-cyan/5",
    glowColor: "shadow-[0_0_20px_rgba(0,200,255,0.08)]",
  },
  {
    stage: "triage",
    label: "Triage",
    description: "Being classified for seriousness and priority",
    icon: Filter,
    color: "text-amber-400",
    borderColor: "border-amber-400/30",
    bgColor: "bg-amber-400/5",
    glowColor: "shadow-[0_0_20px_rgba(245,158,11,0.08)]",
  },
  {
    stage: "assessment",
    label: "Assessment",
    description: "Causality and signal evaluation in progress",
    icon: ClipboardCheck,
    color: "text-purple-400",
    borderColor: "border-purple-400/30",
    bgColor: "bg-purple-400/5",
    glowColor: "shadow-[0_0_20px_rgba(168,85,247,0.08)]",
  },
  {
    stage: "reporting",
    label: "Reporting",
    description: "Being prepared for regulatory submission",
    icon: Send,
    color: "text-red-400",
    borderColor: "border-red-400/30",
    bgColor: "bg-red-400/5",
    glowColor: "shadow-[0_0_20px_rgba(239,68,68,0.08)]",
  },
  {
    stage: "closed",
    label: "Closed",
    description: "Submitted or archived",
    icon: CheckCircle2,
    color: "text-emerald-400",
    borderColor: "border-emerald-400/30",
    bgColor: "bg-emerald-400/5",
    glowColor: "shadow-[0_0_20px_rgba(16,185,129,0.08)]",
  },
];

/* ------------------------------------------------------------------ */
/*  Adapter: CaseLifecycle (pvos-client) → SafetyCase (local UI)       */
/* ------------------------------------------------------------------ */

const PVOS_STAGE_MAP: Record<PvosCaseStage, CaseStage> = {
  new: "new",
  triage: "triage",
  assessment: "assessment",
  reporting: "reporting",
  closed: "closed",
};

function adaptCaseLifecycle(lc: CaseLifecycle): SafetyCase {
  const priorityMap: Record<string, CasePriority> = {
    p0: "expedited",
    p1: "expedited",
    p2: "standard",
    p3: "standard",
  };

  let deadlineDate: string | null = null;
  if (lc.deadline_days !== undefined && lc.deadline_days !== null) {
    const d = new Date();
    d.setDate(d.getDate() + lc.deadline_days);
    deadlineDate = d.toISOString().split("T")[0];
  }

  return {
    id: lc.case_id,
    title: `${lc.event} with ${lc.drug}`,
    drug: lc.drug,
    event: lc.event,
    stage: PVOS_STAGE_MAP[lc.stage],
    seriousness: lc.serious ? "serious" : "non_serious",
    priority: priorityMap[lc.priority] ?? "standard",
    receivedDate: new Date().toISOString().split("T")[0],
    deadlineDate,
    daysInStage: lc.days_in_stage,
    narrative: lc.narrative ?? "",
  };
}

/** Advance a case to the next PVOS FSM stage. Wires transitionCase from
 *  pvos-client for use by future stage-action buttons in this component. */
export { transitionCase as advanceCaseStage };

/* ------------------------------------------------------------------ */
/*  Mock case data (matches PVOS FSM states)                            */
/* ------------------------------------------------------------------ */

const MOCK_CASES: SafetyCase[] = [
  {
    id: "ICSR-2026-0042",
    title: "Hepatotoxicity following atorvastatin initiation",
    drug: "Atorvastatin",
    event: "Drug-induced liver injury",
    stage: "new",
    seriousness: "pending",
    priority: "standard",
    receivedDate: "2026-03-01",
    deadlineDate: null,
    daysInStage: 2,
    narrative:
      "67-year-old male developed elevated ALT/AST (5x ULN) two weeks after starting atorvastatin 40mg. No prior liver disease.",
  },
  {
    id: "ICSR-2026-0041",
    title: "Stevens-Johnson Syndrome with lamotrigine",
    drug: "Lamotrigine",
    event: "Stevens-Johnson Syndrome",
    stage: "triage",
    seriousness: "serious",
    priority: "expedited",
    receivedDate: "2026-02-27",
    deadlineDate: "2026-03-06",
    daysInStage: 4,
    narrative:
      "32-year-old female with blistering skin lesions covering >10% BSA, 3 weeks after lamotrigine dose increase to 200mg.",
  },
  {
    id: "ICSR-2026-0039",
    title: "QT prolongation on methadone",
    drug: "Methadone",
    event: "QT prolongation",
    stage: "triage",
    seriousness: "serious",
    priority: "expedited",
    receivedDate: "2026-02-25",
    deadlineDate: "2026-03-04",
    daysInStage: 6,
    narrative:
      "55-year-old male on methadone 120mg/day found to have QTc of 520ms on routine ECG. Concomitant fluconazole.",
  },
  {
    id: "ICSR-2026-0037",
    title: "Rhabdomyolysis with rosuvastatin + cyclosporine",
    drug: "Rosuvastatin",
    event: "Rhabdomyolysis",
    stage: "assessment",
    seriousness: "serious",
    priority: "expedited",
    receivedDate: "2026-02-20",
    deadlineDate: "2026-03-07",
    daysInStage: 11,
    narrative:
      "Transplant patient on cyclosporine developed CK >10,000 U/L, dark urine, and muscle pain after rosuvastatin 10mg was added.",
  },
  {
    id: "ICSR-2026-0035",
    title: "Agranulocytosis with clozapine",
    drug: "Clozapine",
    event: "Agranulocytosis",
    stage: "assessment",
    seriousness: "serious",
    priority: "expedited",
    receivedDate: "2026-02-18",
    deadlineDate: "2026-03-05",
    daysInStage: 13,
    narrative:
      "45-year-old schizophrenia patient, ANC dropped to 200/mm3 at week 8 of clozapine therapy. Drug discontinued, G-CSF started.",
  },
  {
    id: "ICSR-2026-0033",
    title: "Tendon rupture with levofloxacin",
    drug: "Levofloxacin",
    event: "Achilles tendon rupture",
    stage: "reporting",
    seriousness: "serious",
    priority: "standard",
    receivedDate: "2026-02-10",
    deadlineDate: "2026-02-25",
    daysInStage: 5,
    narrative:
      "72-year-old female on levofloxacin and prednisone for pneumonia experienced spontaneous Achilles tendon rupture while walking.",
  },
  {
    id: "ICSR-2026-0028",
    title: "Serotonin syndrome with tramadol + sertraline",
    drug: "Tramadol",
    event: "Serotonin syndrome",
    stage: "closed",
    seriousness: "serious",
    priority: "expedited",
    receivedDate: "2026-01-20",
    deadlineDate: "2026-02-04",
    daysInStage: 0,
    narrative:
      "40-year-old male on sertraline 100mg developed agitation, clonus, hyperthermia after tramadol was added post-surgery. Resolved after both discontinued.",
  },
  {
    id: "ICSR-2026-0025",
    title: "Peripheral neuropathy with metformin",
    drug: "Metformin",
    event: "Peripheral neuropathy",
    stage: "closed",
    seriousness: "non_serious",
    priority: "standard",
    receivedDate: "2026-01-15",
    deadlineDate: null,
    daysInStage: 0,
    narrative:
      "Type 2 diabetes patient on metformin 2000mg/day for 3 years developed B12-deficient neuropathy. Resolved with B12 supplementation.",
  },
];

/* ------------------------------------------------------------------ */
/*  Helper functions                                                    */
/* ------------------------------------------------------------------ */

// getSeriousnessLevel, getSeriousnessLabel, getPriorityBadge
// imported from @/lib/pv-compute (see imports above)

function isOverdue(deadlineDate: string | null): boolean {
  if (!deadlineDate) return false;
  return new Date(deadlineDate) < new Date();
}

/* ------------------------------------------------------------------ */
/*  CaseCard component                                                  */
/* ------------------------------------------------------------------ */

function CaseCard({ safetyCase }: { safetyCase: SafetyCase }) {
  const priority = getPriorityBadge(safetyCase.priority);
  const overdue = isOverdue(safetyCase.deadlineDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-dim/50">
                  {safetyCase.id}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] font-mono uppercase tracking-wider ${priority.className}`}
                >
                  {priority.label}
                </Badge>
              </div>
              <h4 className="text-sm font-semibold text-white leading-snug truncate">
                {safetyCase.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-3 text-xs text-slate-dim/60">
            <span>
              <span className="text-slate-dim/40">Drug:</span>{" "}
              <span className="text-white/80">{safetyCase.drug}</span>
            </span>
            <span>
              <span className="text-slate-dim/40">Event:</span>{" "}
              <span className="text-white/80">{safetyCase.event}</span>
            </span>
          </div>

          <p className="text-xs text-slate-dim/50 leading-relaxed mb-3 line-clamp-2">
            {safetyCase.narrative}
          </p>

          <div className="flex items-center justify-between">
            <TrafficLight
              level={getSeriousnessLevel(safetyCase.seriousness)}
              label={getSeriousnessLabel(safetyCase.seriousness)}
            />

            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-dim/50">
              {safetyCase.deadlineDate && (
                <span
                  className={`flex items-center gap-1 ${overdue ? "text-red-400" : ""}`}
                >
                  {overdue ? (
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Clock className="h-3 w-3" aria-hidden="true" />
                  )}
                  {overdue ? "OVERDUE" : `Due ${safetyCase.deadlineDate}`}
                </span>
              )}
              {safetyCase.stage !== "closed" && safetyCase.daysInStage > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" aria-hidden="true" />
                  {safetyCase.daysInStage}d in stage
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  PipelineStage component (expandable)                                */
/* ------------------------------------------------------------------ */

function PipelineStage({
  config,
  cases,
  isExpanded,
  onToggle,
}: {
  config: StageConfig;
  cases: SafetyCase[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = config.icon;
  const hasOverdue = cases.some((c) => isOverdue(c.deadlineDate));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-golden-2 p-4 border ${config.borderColor} ${config.bgColor} ${config.glowColor} transition-all duration-200 hover:bg-white/[0.04] group`}
        aria-expanded={isExpanded}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border ${config.borderColor} bg-black/20`}
        >
          <Icon className={`h-5 w-5 ${config.color}`} aria-hidden="true" />
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-sm ${config.color}`}>
              {config.label}
            </h3>
            <Badge
              variant="outline"
              className="border-white/10 bg-white/5 text-white/60 text-[10px] font-mono"
            >
              {cases.length} {cases.length === 1 ? "case" : "cases"}
            </Badge>
            {hasOverdue && (
              <Badge
                variant="outline"
                className="border-red-400/30 bg-red-400/10 text-red-300 text-[9px] font-mono uppercase tracking-wider"
              >
                Overdue
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-dim/50 mt-0.5">
            {config.description}
          </p>
        </div>

        <div className="text-slate-dim/40 group-hover:text-white/60 transition-colors">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && cases.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 border-x border-b border-white/[0.06] bg-white/[0.01]">
              {cases.map((c) => (
                <CaseCard key={c.id} safetyCase={c} />
              ))}
            </div>
          </motion.div>
        )}
        {isExpanded && cases.length === 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-6 border-x border-b border-white/[0.06] bg-white/[0.01] text-center">
              <p className="text-sm text-slate-dim/40">
                No cases in this stage right now. That&apos;s a good thing.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline connector (visual arrow between stages)                    */
/* ------------------------------------------------------------------ */

function PipelineConnector() {
  return (
    <div className="flex items-center justify-center py-1" aria-hidden="true">
      <div className="w-0.5 h-4 bg-gradient-to-b from-white/10 to-white/5" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary bar                                                         */
/* ------------------------------------------------------------------ */

function SummaryBar({ cases }: { cases: SafetyCase[] }) {
  const stats = useMemo(() => {
    const total = cases.length;
    const serious = cases.filter((c) => c.seriousness === "serious").length;
    const expedited = cases.filter((c) => c.priority === "expedited").length;
    const overdue = cases.filter((c) => isOverdue(c.deadlineDate)).length;
    const active = cases.filter((c) => c.stage !== "closed").length;
    return { total, serious, expedited, overdue, active };
  }, [cases]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {[
        { label: "Total Cases", value: stats.total, color: "text-white" },
        { label: "Active", value: stats.active, color: "text-cyan" },
        { label: "Serious", value: stats.serious, color: "text-red-400" },
        {
          label: "Expedited",
          value: stats.expedited,
          color: "text-amber-400",
        },
        {
          label: "Overdue",
          value: stats.overdue,
          color: stats.overdue > 0 ? "text-red-400" : "text-emerald-400",
        },
      ].map((stat) => (
        <Card key={stat.label} className="border-white/[0.08] bg-white/[0.03]">
          <CardContent className="p-3 text-center">
            <p className={`text-2xl font-bold font-mono ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mt-1">
              {stat.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main CaseTracker component                                          */
/* ------------------------------------------------------------------ */

export function CaseTracker() {
  const [expandedStages, setExpandedStages] = useState<Set<CaseStage>>(
    new Set(["new", "triage"]),
  );
  const [cases, setCases] = useState<SafetyCase[]>(MOCK_CASES);

  useEffect(() => {
    getCases().then((liveCases: CaseLifecycle[]) => {
      setCases(liveCases.map(adaptCaseLifecycle));
    });
  }, []);

  const casesByStage = useMemo(() => {
    const grouped = new Map<CaseStage, SafetyCase[]>();
    for (const stage of PIPELINE_STAGES) {
      grouped.set(
        stage.stage,
        cases.filter((c) => c.stage === stage.stage),
      );
    }
    return grouped;
  }, [cases]);

  function toggleStage(stage: CaseStage) {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/5">
            <FileText className="h-5 w-5 text-cyan" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/60">
              AlgoVigilance Vigilance
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Track Your Cases
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Follow every safety case from start to finish.{" "}
          <JargonBuster
            term="ICSR"
            definition="Individual Case Safety Report — the standard format for documenting a single adverse event occurrence linked to a drug."
          >
            ICSRs
          </JargonBuster>{" "}
          flow through five stages: intake, triage, assessment, reporting, and
          closure.
        </p>
      </header>

      {/* For AlgoVigilances welcome */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-golden-4 space-y-golden-2"
      >
        <TipBox>
          Where is my case? Right here. Each stage below shows exactly which
          cases are waiting and what happens next.
        </TipBox>
        <RememberBox>
          Cases move left-to-right through the pipeline. Expedited cases
          (serious unexpected reactions) have tight deadlines — 7 or 15 days
          depending on severity.
        </RememberBox>
      </motion.section>

      {/* Summary stats */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-golden-4"
      >
        <SummaryBar cases={cases} />
      </motion.section>

      {/* Visual pipeline */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mb-golden-4"
        aria-label="Case pipeline"
      >
        <div className="flex items-center gap-2 mb-golden-2">
          <h2 className="font-headline text-lg font-bold text-white tracking-tight">
            Case Pipeline
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/40">
            New &rarr; Triage &rarr; Assessment &rarr; Reporting &rarr; Closed
          </span>
        </div>

        <div className="space-y-0">
          {PIPELINE_STAGES.map((stageConfig, i) => (
            <div key={stageConfig.stage}>
              <PipelineStage
                config={stageConfig}
                cases={casesByStage.get(stageConfig.stage) ?? []}
                isExpanded={expandedStages.has(stageConfig.stage)}
                onToggle={() => toggleStage(stageConfig.stage)}
              />
              {i < PIPELINE_STAGES.length - 1 && <PipelineConnector />}
            </div>
          ))}
        </div>
      </motion.section>

      {/* Contextual guidance */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="mb-golden-4"
      >
        <WarningBox>
          Expedited reports for{" "}
          <JargonBuster
            term="Fatal/Life-threatening"
            definition="Cases where the patient died or was at immediate risk of death. These require initial reporting within 7 calendar days under ICH E2A."
          >
            fatal or life-threatening
          </JargonBuster>{" "}
          events must be submitted within 7 days. Check the Overdue badge on
          each stage — if you see one, that case needs immediate attention.
        </WarningBox>
      </motion.section>
    </div>
  );
}
