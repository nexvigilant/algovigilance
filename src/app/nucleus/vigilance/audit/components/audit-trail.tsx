"use client";

import type { DeadlineUrgencyResult } from "@/lib/pv-compute/operations";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  ChevronDown,
  ChevronRight,
  Inbox,
  Filter,
  ClipboardCheck,
  Send,
  CheckCircle2,
  Camera,
  ArrowRight,
  Clock,
  User,
  FileText,
  Eye,
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TipBox,
  RememberBox,
  TechnicalStuffBox,
  JargonBuster,
  TrafficLight,
  type TrafficLevel,
} from "@/components/pv-for-nexvigilants";
import {
  getAuditTrail,
  type AuditEntry as PvosAuditEntry,
  type CaseStage as PvosCaseStage,
} from "@/lib/pvos-client";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

// Local display stage — superset of pvos CaseStage for rendering
type CaseStage = "ingested" | "triaged" | "assessed" | "reported" | "closed";

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  fromStage: CaseStage | null;
  toStage: CaseStage;
  detail: string;
  snapshotAvailable: boolean;
}

interface AuditCase {
  id: string;
  title: string;
  drug: string;
  event: string;
  currentStage: CaseStage;
  seriousness: "serious" | "non_serious";
  timeline: AuditEntry[];
}

/* ------------------------------------------------------------------ */
/*  Adapter — pvos-client AuditEntry → local AuditEntry               */
/* ------------------------------------------------------------------ */

function pvosStageToLocal(stage: PvosCaseStage | undefined): CaseStage {
  const map: Record<PvosCaseStage, CaseStage> = {
    new: "ingested",
    triage: "triaged",
    assessment: "assessed",
    reporting: "reported",
    closed: "closed",
  };
  return stage ? (map[stage] ?? "ingested") : "ingested";
}

function adaptPvosEntries(entries: PvosAuditEntry[]): AuditCase[] {
  // Group flat entries by case_id
  const byCase = new Map<string, PvosAuditEntry[]>();
  for (const e of entries) {
    const arr = byCase.get(e.case_id) ?? [];
    arr.push(e);
    byCase.set(e.case_id, arr);
  }

  const cases: AuditCase[] = [];
  for (const [caseId, caseEntries] of byCase) {
    const sorted = [...caseEntries].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const last = sorted[sorted.length - 1];
    const currentStage = pvosStageToLocal(last?.to_state);

    const timeline: AuditEntry[] = sorted.map((e, i) => ({
      id: `${caseId}-${i}`,
      timestamp: e.timestamp,
      action: e.action,
      actor: e.actor,
      fromStage: e.from_state ? pvosStageToLocal(e.from_state) : null,
      toStage: pvosStageToLocal(e.to_state),
      detail: e.detail ?? "",
      snapshotAvailable: e.has_snapshot,
    }));

    // Infer drug/event from action text if needed (fallback to caseId)
    cases.push({
      id: caseId,
      title: `Case ${caseId}`,
      drug: "—",
      event: "—",
      currentStage,
      seriousness: "serious",
      timeline,
    });
  }
  return cases;
}

/* ------------------------------------------------------------------ */
/*  FSM stage configuration                                             */
/* ------------------------------------------------------------------ */

interface StageNode {
  stage: CaseStage;
  label: string;
  icon: typeof Inbox;
  color: string;
  borderColor: string;
  bgColor: string;
}

const FSM_STAGES: StageNode[] = [
  {
    stage: "ingested",
    label: "Ingested",
    icon: Inbox,
    color: "text-cyan",
    borderColor: "border-cyan/30",
    bgColor: "bg-cyan/5",
  },
  {
    stage: "triaged",
    label: "Triaged",
    icon: Filter,
    color: "text-amber-400",
    borderColor: "border-amber-400/30",
    bgColor: "bg-amber-400/5",
  },
  {
    stage: "assessed",
    label: "Assessed",
    icon: ClipboardCheck,
    color: "text-purple-400",
    borderColor: "border-purple-400/30",
    bgColor: "bg-purple-400/5",
  },
  {
    stage: "reported",
    label: "Reported",
    icon: Send,
    color: "text-red-400",
    borderColor: "border-red-400/30",
    bgColor: "bg-red-400/5",
  },
  {
    stage: "closed",
    label: "Closed",
    icon: CheckCircle2,
    color: "text-emerald-400",
    borderColor: "border-emerald-400/30",
    bgColor: "bg-emerald-400/5",
  },
];

function getStageNode(stage: CaseStage): StageNode {
  return FSM_STAGES.find((s) => s.stage === stage) ?? FSM_STAGES[0];
}

/* ------------------------------------------------------------------ */
/*  Mock data — realistic PV case timeline                              */
/* ------------------------------------------------------------------ */

const MOCK_CASES: AuditCase[] = [
  {
    id: "ICSR-2026-0041",
    title: "Stevens-Johnson Syndrome with lamotrigine",
    drug: "Lamotrigine",
    event: "Stevens-Johnson Syndrome",
    currentStage: "closed",
    seriousness: "serious",
    timeline: [
      {
        id: "e1",
        timestamp: "2026-02-27T09:14:00Z",
        action: "Case received via MedWatch",
        actor: "System (auto-ingest)",
        fromStage: null,
        toStage: "ingested",
        detail:
          "Spontaneous report from dermatologist. 32-year-old female with blistering skin lesions covering >10% BSA, 3 weeks after lamotrigine dose increase to 200mg. Auto-assigned ICSR-2026-0041.",
        snapshotAvailable: true,
      },
      {
        id: "e2",
        timestamp: "2026-02-27T10:02:00Z",
        action: "Seriousness classified: Serious (life-threatening)",
        actor: "Dr. Sarah Chen",
        fromStage: "ingested",
        toStage: "triaged",
        detail:
          "ICH E2A criteria met: life-threatening condition. Mucosal involvement confirmed. Priority set to expedited. 7-day initial report deadline: 2026-03-06.",
        snapshotAvailable: true,
      },
      {
        id: "e3",
        timestamp: "2026-02-28T14:30:00Z",
        action: "Naranjo causality assessment completed",
        actor: "Dr. James Okonkwo",
        fromStage: "triaged",
        toStage: "assessed",
        detail:
          "Naranjo score: 7 (Probable). Temporal relationship strong (+2), known ADR for lamotrigine (+1), dose-response with titration increase (+1), positive dechallenge after discontinuation (+2), alternative causes excluded (+1).",
        snapshotAvailable: true,
      },
      {
        id: "e4",
        timestamp: "2026-03-01T11:15:00Z",
        action: "E2B(R3) report generated and submitted to FDA",
        actor: "Regulatory Affairs Team",
        fromStage: "assessed",
        toStage: "reported",
        detail:
          "15-day expedited report submitted via FDA ESG gateway. Acknowledgment number: ESG-2026-ACK-88412. WHO-UMC causality: Probable.",
        snapshotAvailable: true,
      },
      {
        id: "e5",
        timestamp: "2026-03-02T16:45:00Z",
        action: "Case closed — patient recovered",
        actor: "Dr. Sarah Chen",
        fromStage: "reported",
        toStage: "closed",
        detail:
          "Follow-up from dermatologist: lesions resolving with supportive care. No re-challenge intended. Lamotrigine permanently discontinued. Case archived with full documentation.",
        snapshotAvailable: true,
      },
    ],
  },
  {
    id: "ICSR-2026-0037",
    title: "Rhabdomyolysis with rosuvastatin + cyclosporine",
    drug: "Rosuvastatin",
    event: "Rhabdomyolysis",
    currentStage: "assessed",
    seriousness: "serious",
    timeline: [
      {
        id: "e6",
        timestamp: "2026-02-20T08:30:00Z",
        action: "Case received from hospital pharmacist",
        actor: "System (auto-ingest)",
        fromStage: null,
        toStage: "ingested",
        detail:
          "Transplant patient on cyclosporine developed CK >10,000 U/L, dark urine, and muscle pain after rosuvastatin 10mg was added. Auto-assigned ICSR-2026-0037.",
        snapshotAvailable: true,
      },
      {
        id: "e7",
        timestamp: "2026-02-20T10:45:00Z",
        action: "Seriousness classified: Serious (hospitalization required)",
        actor: "Dr. James Okonkwo",
        fromStage: "ingested",
        toStage: "triaged",
        detail:
          "ICH E2A criteria met: required or prolonged hospitalization. Drug interaction flagged (statin + cyclosporine). Priority: expedited. 15-day deadline: 2026-03-07.",
        snapshotAvailable: true,
      },
      {
        id: "e8",
        timestamp: "2026-02-25T09:00:00Z",
        action: "Causality assessment in progress",
        actor: "Dr. Sarah Chen",
        fromStage: "triaged",
        toStage: "assessed",
        detail:
          "WHO-UMC assessment initiated. Known interaction between rosuvastatin and cyclosporine (inhibits OATP1B1 transporter). Naranjo score pending concomitant medication review. Awaiting lab trend data from hospital.",
        snapshotAvailable: false,
      },
    ],
  },
  {
    id: "ICSR-2026-0042",
    title: "Hepatotoxicity following atorvastatin initiation",
    drug: "Atorvastatin",
    event: "Drug-induced liver injury",
    currentStage: "ingested",
    seriousness: "serious",
    timeline: [
      {
        id: "e9",
        timestamp: "2026-03-01T14:20:00Z",
        action: "Case received from gastroenterologist",
        actor: "System (auto-ingest)",
        fromStage: null,
        toStage: "ingested",
        detail:
          "67-year-old male developed elevated ALT/AST (5x ULN) two weeks after starting atorvastatin 40mg. No prior liver disease. Awaiting triage.",
        snapshotAvailable: true,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getElapsedLabel(from: string, to: string): string {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(ms / (1000 * 60));
  return `${mins}m`;
}

/* ------------------------------------------------------------------ */
/*  FSM Diagram — connected stage nodes                                 */
/* ------------------------------------------------------------------ */

function FsmDiagram({ currentStage }: { currentStage: CaseStage }) {
  const currentIdx = FSM_STAGES.findIndex((s) => s.stage === currentStage);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {FSM_STAGES.map((node, i) => {
        const Icon = node.icon;
        const isActive = i <= currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <div key={node.stage} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border transition-all ${
                isCurrent
                  ? `${node.borderColor} ${node.bgColor} shadow-[0_0_12px_rgba(0,200,255,0.06)]`
                  : isActive
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-white/[0.06] bg-transparent"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${isActive ? node.color : "text-slate-dim/30"}`}
                aria-hidden="true"
              />
              <span
                className={`text-[10px] font-mono uppercase tracking-wider ${
                  isCurrent
                    ? node.color
                    : isActive
                      ? "text-white/60"
                      : "text-slate-dim/30"
                }`}
              >
                {node.label}
              </span>
            </div>
            {i < FSM_STAGES.length - 1 && (
              <ArrowRight
                className={`h-3 w-3 mx-0.5 shrink-0 ${
                  i < currentIdx ? "text-white/30" : "text-white/10"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline entry component                                            */
/* ------------------------------------------------------------------ */

function TimelineEntry({
  entry,
  isLast,
  prevTimestamp,
}: {
  entry: AuditEntry;
  isLast: boolean;
  prevTimestamp: string | null;
}) {
  const toNode = getStageNode(entry.toStage);
  const ToIcon = toNode.icon;

  return (
    <div className="relative flex gap-4">
      {/* Vertical line + node */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center border ${toNode.borderColor} ${toNode.bgColor}`}
        >
          <ToIcon className={`h-4 w-4 ${toNode.color}`} aria-hidden="true" />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-white/15 to-white/5 min-h-[2rem]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-white leading-snug">
                {entry.action}
              </h4>
              {entry.fromStage && (
                <Badge
                  variant="outline"
                  className={`text-[9px] font-mono uppercase tracking-wider ${toNode.borderColor} ${toNode.bgColor} ${toNode.color}`}
                >
                  {getStageNode(entry.fromStage).label} &rarr; {toNode.label}
                </Badge>
              )}
              {!entry.fromStage && (
                <Badge
                  variant="outline"
                  className={`text-[9px] font-mono uppercase tracking-wider ${toNode.borderColor} ${toNode.bgColor} ${toNode.color}`}
                >
                  {toNode.label}
                </Badge>
              )}
            </div>
          </div>

          {entry.snapshotAvailable && (
            <div
              className="flex items-center gap-1 text-[9px] font-mono text-cyan/60 border border-cyan/20 bg-cyan/5 px-1.5 py-0.5 shrink-0"
              title="Point-in-time snapshot available"
            >
              <Camera className="h-3 w-3" aria-hidden="true" />
              Snapshot
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-2 text-[10px] font-mono text-slate-dim/50">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatTimestamp(entry.timestamp)}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" aria-hidden="true" />
            {entry.actor}
          </span>
          {prevTimestamp && (
            <span className="text-white/30">
              +{getElapsedLabel(prevTimestamp, entry.timestamp)} since previous
            </span>
          )}
        </div>

        <p className="text-xs text-slate-dim/60 leading-relaxed">
          {entry.detail}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Case card with expandable timeline                                  */
/* ------------------------------------------------------------------ */

function AuditCaseCard({
  auditCase,
  isExpanded,
  onToggle,
}: {
  auditCase: AuditCase;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const stageNode = getStageNode(auditCase.currentStage);
  const totalElapsed =
    auditCase.timeline.length >= 2
      ? getElapsedLabel(
          auditCase.timeline[0].timestamp,
          auditCase.timeline[auditCase.timeline.length - 1].timestamp,
        )
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="border-white/[0.08] bg-white/[0.03] overflow-hidden">
        {/* Header — clickable */}
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left p-4 hover:bg-white/[0.02] transition-colors group"
          aria-expanded={isExpanded}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-dim/50">
                  {auditCase.id}
                </span>
                <TrafficLight
                  level={
                    auditCase.seriousness === "serious"
                      ? ("red" as TrafficLevel)
                      : ("green" as TrafficLevel)
                  }
                  label={
                    auditCase.seriousness === "serious"
                      ? "Serious"
                      : "Non-Serious"
                  }
                />
              </div>
              <h3 className="text-sm font-semibold text-white leading-snug">
                {auditCase.title}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-dim/50">
                <span>
                  <span className="text-slate-dim/40">Drug:</span>{" "}
                  <span className="text-white/70">{auditCase.drug}</span>
                </span>
                <span>
                  <span className="text-slate-dim/40">Event:</span>{" "}
                  <span className="text-white/70">{auditCase.event}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-mono uppercase tracking-wider ${stageNode.borderColor} ${stageNode.bgColor} ${stageNode.color}`}
                  >
                    {stageNode.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white/50 text-[9px] font-mono"
                  >
                    {auditCase.timeline.length}{" "}
                    {auditCase.timeline.length === 1 ? "event" : "events"}
                  </Badge>
                </div>
                {totalElapsed && (
                  <p className="text-[10px] font-mono text-slate-dim/40 mt-1">
                    Total: {totalElapsed}
                  </p>
                )}
              </div>
              <div className="text-slate-dim/40 group-hover:text-white/60 transition-colors">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
            </div>
          </div>

          {/* Compact FSM diagram */}
          <div className="mt-3">
            <FsmDiagram currentStage={auditCase.currentStage} />
          </div>
        </button>

        {/* Expandable timeline */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-4">
                  <History
                    className="h-4 w-4 text-cyan/60"
                    aria-hidden="true"
                  />
                  <h4 className="text-xs font-mono uppercase tracking-widest text-cyan/60">
                    Full Audit Trail
                  </h4>
                </div>
                <div className="ml-1">
                  {auditCase.timeline.map((entry, i) => (
                    <TimelineEntry
                      key={entry.id}
                      entry={entry}
                      isLast={i === auditCase.timeline.length - 1}
                      prevTimestamp={
                        i > 0 ? auditCase.timeline[i - 1].timestamp : null
                      }
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary stats                                                       */
/* ------------------------------------------------------------------ */

function AuditSummary({ cases }: { cases: AuditCase[] }) {
  const stats = useMemo(() => {
    const totalEvents = cases.reduce((sum, c) => sum + c.timeline.length, 0);
    const completedCases = cases.filter(
      (c) => c.currentStage === "closed",
    ).length;
    const snapshots = cases.reduce(
      (sum, c) => sum + c.timeline.filter((e) => e.snapshotAvailable).length,
      0,
    );
    const actors = new Set(
      cases.flatMap((c) => c.timeline.map((e) => e.actor)),
    );
    return {
      cases: cases.length,
      totalEvents,
      completedCases,
      snapshots,
      actors: actors.size,
    };
  }, [cases]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {[
        { label: "Cases", value: stats.cases, color: "text-white" },
        { label: "Events", value: stats.totalEvents, color: "text-cyan" },
        {
          label: "Completed",
          value: stats.completedCases,
          color: "text-emerald-400",
        },
        {
          label: "Snapshots",
          value: stats.snapshots,
          color: "text-purple-400",
        },
        { label: "Actors", value: stats.actors, color: "text-amber-400" },
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
/*  Main AuditTrail component                                           */
/* ------------------------------------------------------------------ */

export function AuditTrail() {
  const [cases, setCases] = useState<AuditCase[]>(MOCK_CASES);
  const [loading, setLoading] = useState(true);
  const [expandedCases, setExpandedCases] = useState<Set<string>>(
    new Set([MOCK_CASES[0].id]),
  );
  const [filterStage, setFilterStage] = useState<CaseStage | "all">("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAuditTrail()
      .then((entries) => {
        if (cancelled) return;
        const adapted = adaptPvosEntries(entries);
        // Only replace mock data if the server returned real entries
        if (adapted.length > 0) {
          setCases(adapted);
          setExpandedCases(new Set([adapted[0].id]));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCases = useMemo(() => {
    if (filterStage === "all") return cases;
    return cases.filter((c) => c.currentStage === filterStage);
  }, [filterStage, cases]);

  function toggleCase(id: string) {
    setExpandedCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
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
            <History className="h-5 w-5 text-cyan" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/60">
              AlgoVigilance Vigilance
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Case History
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          See exactly what happened, when, and why. Every{" "}
          <JargonBuster
            term="ICSR"
            definition="Individual Case Safety Report -- the standard format for documenting a single adverse event occurrence linked to a drug."
          >
            ICSR
          </JargonBuster>{" "}
          leaves a complete audit trail as it moves through the{" "}
          <JargonBuster
            term="FSM"
            definition="Finite State Machine -- the case progresses through a fixed sequence of stages (ingested, triaged, assessed, reported, closed) with no skipping."
          >
            case lifecycle
          </JargonBuster>
          .
        </p>
      </header>

      {/* For AlgoVigilances guidance */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-golden-4 space-y-golden-2"
      >
        <TipBox>
          Click any case to expand its full timeline. Each entry shows who did
          what, when they did it, and which stage the case moved to.
        </TipBox>
        <RememberBox>
          Audit trails are immutable. Once an action is recorded, it cannot be
          edited or deleted. This protects regulatory integrity and ensures you
          always have a complete history.
        </RememberBox>
      </motion.section>

      {/* Summary stats */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-golden-4"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-slate-dim/50">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="text-xs font-mono">Loading audit trail...</span>
          </div>
        ) : (
          <AuditSummary cases={cases} />
        )}
      </motion.section>

      {/* Stage filter */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="mb-golden-4"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Eye className="h-4 w-4 text-slate-dim/50" aria-hidden="true" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mr-1">
            Filter by stage:
          </span>
          <button
            type="button"
            onClick={() => setFilterStage("all")}
            className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
              filterStage === "all"
                ? "border-cyan/30 bg-cyan/10 text-cyan"
                : "border-white/10 bg-white/[0.03] text-slate-dim/50 hover:text-white/60"
            }`}
          >
            All
          </button>
          {FSM_STAGES.map((node) => (
            <button
              key={node.stage}
              type="button"
              onClick={() => setFilterStage(node.stage)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                filterStage === node.stage
                  ? `${node.borderColor} ${node.bgColor} ${node.color}`
                  : "border-white/10 bg-white/[0.03] text-slate-dim/50 hover:text-white/60"
              }`}
            >
              {node.label}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Case list with timelines */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mb-golden-4 space-y-golden-3"
        aria-label="Case audit trails"
      >
        <div className="flex items-center gap-2 mb-golden-2">
          <h2 className="font-headline text-lg font-bold text-white tracking-tight">
            Audit Trails
          </h2>
          <Badge
            variant="outline"
            className="border-white/10 bg-white/5 text-white/50 text-[10px] font-mono"
          >
            {filteredCases.length}{" "}
            {filteredCases.length === 1 ? "case" : "cases"}
          </Badge>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredCases.map((auditCase) => (
            <AuditCaseCard
              key={auditCase.id}
              auditCase={auditCase}
              isExpanded={expandedCases.has(auditCase.id)}
              onToggle={() => toggleCase(auditCase.id)}
            />
          ))}
        </AnimatePresence>

        {filteredCases.length === 0 && (
          <Card className="border-white/[0.08] bg-white/[0.03]">
            <CardContent className="p-8 text-center">
              <FileText
                className="h-8 w-8 mx-auto text-slate-dim/30 mb-3"
                aria-hidden="true"
              />
              <p className="text-sm text-slate-dim/50">
                No cases match this filter. Try selecting a different stage.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.section>

      {/* Technical context */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="mb-golden-4"
      >
        <TechnicalStuffBox>
          Each audit entry records the FSM state transition (from &rarr; to),
          the actor, a timestamp, and an optional point-in-time snapshot.
          Snapshots capture the complete case state at that moment, enabling
          reconstruction of exactly what was known when a decision was made.
          This follows ICH E2B(R3) traceability requirements.
        </TechnicalStuffBox>
      </motion.section>
    </div>
  );
}
