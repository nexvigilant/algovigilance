"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Radio,
  Clock,
  HeartPulse,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Activity,
} from "lucide-react";
import {
  TipBox,
  RememberBox,
  WarningBox,
  TechnicalStuffBox,
  TrafficLight,
  ScoreMeter,
  JargonBuster,
} from "@/components/pv-for-nexvigilants";
import { getDashboard, type DashboardMetrics } from "@/lib/pvos-client";
import {
  classifyDeadlineUrgency,
  classifySignalStrength,
  classifyHealthTraffic,
} from "@/lib/pv-compute";

// ---------------------------------------------------------------------------
// PVOS-aligned TypeScript interfaces
// ---------------------------------------------------------------------------

/** Seriousness classification per ICH E2A */
type Seriousness =
  | "fatal"
  | "life-threatening"
  | "hospitalization"
  | "disability"
  | "other-serious"
  | "non-serious";

/** Case processing status within PVOS workflow */
type CaseStatus = "intake" | "triage" | "assessment" | "reporting" | "closed";

/** Signal strength classification */
type SignalStrength = "strong" | "moderate" | "weak" | "none";

interface ActiveCase {
  id: string;
  drugName: string;
  event: string;
  seriousness: Seriousness;
  status: CaseStatus;
  daysOpen: number;
  assignee: string;
}

interface WatchedSignal {
  id: string;
  drugName: string;
  event: string;
  prr: number;
  ror: number;
  caseCount: number;
  strength: SignalStrength;
  trend: "rising" | "stable" | "declining";
}

interface Deadline {
  id: string;
  caseId: string;
  type:
    | "7-day initial"
    | "15-day initial"
    | "15-day follow-up"
    | "90-day periodic";
  dueDate: string;
  daysRemaining: number;
  seriousness: Seriousness;
}

interface SystemHealthMetric {
  name: string;
  score: number;
  status: "healthy" | "degraded" | "down";
}

// ---------------------------------------------------------------------------
// Mock data — will be replaced by PVOS kernel + MCP calls
// ---------------------------------------------------------------------------

const MOCK_CASES: ActiveCase[] = [
  {
    id: "ICSR-2024-0847",
    drugName: "Metformin",
    event: "Lactic acidosis",
    seriousness: "life-threatening",
    status: "assessment",
    daysOpen: 3,
    assignee: "Dr. Chen",
  },
  {
    id: "ICSR-2024-0851",
    drugName: "Atorvastatin",
    event: "Rhabdomyolysis",
    seriousness: "hospitalization",
    status: "triage",
    daysOpen: 1,
    assignee: "Unassigned",
  },
  {
    id: "ICSR-2024-0852",
    drugName: "Lisinopril",
    event: "Angioedema",
    seriousness: "other-serious",
    status: "intake",
    daysOpen: 0,
    assignee: "Unassigned",
  },
  {
    id: "ICSR-2024-0849",
    drugName: "Warfarin",
    event: "GI hemorrhage",
    seriousness: "fatal",
    status: "reporting",
    daysOpen: 5,
    assignee: "Dr. Patel",
  },
  {
    id: "ICSR-2024-0853",
    drugName: "Amoxicillin",
    event: "Anaphylaxis",
    seriousness: "life-threatening",
    status: "assessment",
    daysOpen: 2,
    assignee: "Dr. Chen",
  },
];

const MOCK_SIGNALS: WatchedSignal[] = [
  {
    id: "SIG-101",
    drugName: "DrugX-401",
    event: "Hepatotoxicity",
    prr: 4.2,
    ror: 5.1,
    caseCount: 28,
    strength: "strong",
    trend: "rising",
  },
  {
    id: "SIG-102",
    drugName: "Metformin",
    event: "Lactic acidosis",
    prr: 2.8,
    ror: 3.2,
    caseCount: 15,
    strength: "moderate",
    trend: "stable",
  },
  {
    id: "SIG-103",
    drugName: "DrugY-220",
    event: "QT prolongation",
    prr: 1.9,
    ror: 2.1,
    caseCount: 7,
    strength: "weak",
    trend: "declining",
  },
  {
    id: "SIG-104",
    drugName: "Atorvastatin",
    event: "Rhabdomyolysis",
    prr: 3.5,
    ror: 4.0,
    caseCount: 42,
    strength: "strong",
    trend: "stable",
  },
];

const MOCK_DEADLINES: Deadline[] = [
  {
    id: "DL-1",
    caseId: "ICSR-2024-0849",
    type: "7-day initial",
    dueDate: "2024-12-10",
    daysRemaining: 2,
    seriousness: "fatal",
  },
  {
    id: "DL-2",
    caseId: "ICSR-2024-0847",
    type: "15-day initial",
    dueDate: "2024-12-18",
    daysRemaining: 10,
    seriousness: "life-threatening",
  },
  {
    id: "DL-3",
    caseId: "ICSR-2024-0853",
    type: "15-day initial",
    dueDate: "2024-12-20",
    daysRemaining: 12,
    seriousness: "life-threatening",
  },
  {
    id: "DL-4",
    caseId: "ICSR-2024-0851",
    type: "15-day follow-up",
    dueDate: "2024-12-25",
    daysRemaining: 17,
    seriousness: "hospitalization",
  },
];

const MOCK_HEALTH: SystemHealthMetric[] = [
  { name: "FAERS Pipeline", score: 97, status: "healthy" },
  { name: "Signal Detection", score: 92, status: "healthy" },
  { name: "MedDRA Coding", score: 88, status: "healthy" },
  { name: "Reporting Gateway", score: 64, status: "degraded" },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function seriousnessColor(s: Seriousness): string {
  switch (s) {
    case "fatal":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "life-threatening":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    case "hospitalization":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "disability":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    case "other-serious":
      return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    case "non-serious":
      return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  }
}

function seriousnessLabel(s: Seriousness): string {
  switch (s) {
    case "fatal":
      return "Fatal";
    case "life-threatening":
      return "Life-threatening";
    case "hospitalization":
      return "Hospitalization";
    case "disability":
      return "Disability";
    case "other-serious":
      return "Other serious";
    case "non-serious":
      return "Non-serious";
  }
}

function statusLabel(s: CaseStatus): string {
  switch (s) {
    case "intake":
      return "Intake";
    case "triage":
      return "Triage";
    case "assessment":
      return "Assessment";
    case "reporting":
      return "Reporting";
    case "closed":
      return "Closed";
  }
}

function signalStrengthColor(s: SignalStrength): string {
  switch (s) {
    case "strong":
      return "text-red-400";
    case "moderate":
      return "text-amber-400";
    case "weak":
      return "text-blue-400";
    case "none":
      return "text-slate-400";
  }
}

function trendIcon(trend: "rising" | "stable" | "declining"): string {
  switch (trend) {
    case "rising":
      return "\u2191";
    case "stable":
      return "\u2192";
    case "declining":
      return "\u2193";
  }
}

function deadlineUrgencyLevel(
  daysRemaining: number,
): "green" | "yellow" | "red" {
  return classifyDeadlineUrgency(daysRemaining).trafficLevel;
}

function healthToTrafficLevel(status: string): "green" | "yellow" | "red" {
  return classifyHealthTraffic(status).trafficLevel;
}

// ---------------------------------------------------------------------------
// Initial mock dashboard (used as graceful-degradation seed state)
// ---------------------------------------------------------------------------

const INITIAL_DASHBOARD: DashboardMetrics = {
  cases_by_stage: { new: 1, triage: 1, assessment: 2, reporting: 1, closed: 1 },
  active_signals: [
    {
      drug: "DrugX-401",
      event: "Hepatotoxicity",
      level: "red",
      prr: 4.2,
      trend: "rising",
    },
    {
      drug: "Metformin",
      event: "Lactic acidosis",
      level: "yellow",
      prr: 2.8,
      trend: "stable",
    },
    {
      drug: "DrugY-220",
      event: "QT prolongation",
      level: "green",
      prr: 1.9,
      trend: "declining",
    },
    {
      drug: "Atorvastatin",
      event: "Rhabdomyolysis",
      level: "red",
      prr: 3.5,
      trend: "stable",
    },
  ],
  deadlines: [
    {
      case_id: "ICSR-2024-0849",
      type: "7-day initial",
      due_date: "2024-12-10",
      days_remaining: 2,
      overdue: false,
    },
    {
      case_id: "ICSR-2024-0847",
      type: "15-day initial",
      due_date: "2024-12-18",
      days_remaining: 10,
      overdue: false,
    },
    {
      case_id: "ICSR-2024-0853",
      type: "15-day initial",
      due_date: "2024-12-20",
      days_remaining: 12,
      overdue: false,
    },
    {
      case_id: "ICSR-2024-0851",
      type: "15-day follow-up",
      due_date: "2024-12-25",
      days_remaining: 17,
      overdue: false,
    },
  ],
  system_health: [
    {
      subsystem: "FAERS Pipeline",
      score: 97,
      status: "healthy",
      last_check: "",
    },
    {
      subsystem: "Signal Detection",
      score: 92,
      status: "healthy",
      last_check: "",
    },
    {
      subsystem: "MedDRA Coding",
      score: 88,
      status: "healthy",
      last_check: "",
    },
    {
      subsystem: "Reporting Gateway",
      score: 64,
      status: "degraded",
      last_check: "",
    },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PvosOperations() {
  const [activeTab, setActiveTab] = useState<
    "cases" | "signals" | "deadlines" | "health"
  >("cases");
  const [dashboard, setDashboard] =
    useState<DashboardMetrics>(INITIAL_DASHBOARD);

  useEffect(() => {
    getDashboard().then(setDashboard);
  }, []);

  const urgentDeadlines = dashboard.deadlines.filter(
    (d) => d.days_remaining <= 3,
  ).length;
  const activeCaseCount = Object.entries(dashboard.cases_by_stage)
    .filter(([stage]) => stage !== "closed")
    .reduce((sum, [, count]) => sum + count, 0);
  const strongSignals = dashboard.active_signals.filter(
    (s) => s.level === "red",
  ).length;
  const systemScore =
    dashboard.system_health.length > 0
      ? Math.round(
          dashboard.system_health.reduce((sum, h) => sum + h.score, 0) /
            dashboard.system_health.length,
        )
      : 0;

  const panels = [
    {
      key: "cases" as const,
      label: "Active Cases",
      icon: Briefcase,
      value: activeCaseCount,
      accent: "text-blue-400 border-blue-500/30",
    },
    {
      key: "signals" as const,
      label: "Signal Watch",
      icon: Radio,
      value: `${strongSignals} strong`,
      accent: "text-amber-400 border-amber-500/30",
    },
    {
      key: "deadlines" as const,
      label: "Deadlines",
      icon: Clock,
      value: `${urgentDeadlines} urgent`,
      accent:
        urgentDeadlines > 0
          ? "text-red-400 border-red-500/30"
          : "text-emerald-400 border-emerald-500/30",
    },
    {
      key: "health" as const,
      label: "System Health",
      icon: HeartPulse,
      value: `${systemScore}%`,
      accent:
        systemScore >= 85
          ? "text-emerald-400 border-emerald-500/30"
          : "text-amber-400 border-amber-500/30",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400/70">
            Pharmacovigilance Operations
          </span>
        </div>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Your PV Operations Center
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Think of this as your{" "}
          <JargonBuster
            term="PV Operations"
            definition="The day-to-day activities that keep drug safety monitoring running smoothly — processing cases, watching for signals, and meeting regulatory deadlines."
          >
            PV command center
          </JargonBuster>
          . Everything you need to keep patients safe, in one place.
        </p>
      </header>

      {/* Welcome tip */}
      <TipBox className="mb-6">
        Welcome to your operations dashboard! Each panel below gives you a quick
        snapshot of one part of your PV work. Click any panel to dive deeper.
        Green means all good, yellow means take a look, red means act now.
      </TipBox>

      {/* 4-Panel Summary Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {panels.map((panel) => {
          const Icon = panel.icon;
          const isActive = activeTab === panel.key;
          return (
            <button
              key={panel.key}
              onClick={() => setActiveTab(panel.key)}
              className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? `${panel.accent} bg-white/[0.08] ring-1 ring-white/10`
                  : "border-white/[0.08] bg-white/[0.04] hover:border-white/[0.16] hover:bg-white/[0.06]"
              }`}
              aria-pressed={isActive}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? panel.accent.split(" ")[0] : "text-muted-foreground"}`}
              />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {panel.label}
              </span>
              <span
                className={`text-2xl font-bold tabular-nums ${isActive ? "text-white" : "text-foreground"}`}
              >
                {panel.value}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail Section */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6">
        {activeTab === "cases" && <CasesPanel />}
        {activeTab === "signals" && (
          <SignalsPanel signals={dashboard.active_signals} />
        )}
        {activeTab === "deadlines" && (
          <DeadlinesPanel deadlines={dashboard.deadlines} />
        )}
        {activeTab === "health" && (
          <HealthPanel health={dashboard.system_health} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Active Cases
// ---------------------------------------------------------------------------

function CasesPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Active Cases</h2>
        <Link
          href="/nucleus/vigilance/icsr"
          className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Open ICSR Manager <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <RememberBox>
        Each case here represents a real patient experience. The seriousness
        level determines your{" "}
        <JargonBuster
          term="Reporting deadline"
          definition="The maximum time allowed to submit a safety report to regulators. Fatal/life-threatening = 7 days, other serious = 15 days."
        >
          reporting deadline
        </JargonBuster>{" "}
        &mdash; fatal and life-threatening cases are always top priority.
      </RememberBox>

      {/* Case table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-white/[0.08] text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Case ID</th>
              <th className="px-3 py-2">Drug</th>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Seriousness</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Days Open</th>
              <th className="px-3 py-2">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CASES.map((c) => (
              <tr
                key={c.id}
                className="border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors"
              >
                <td className="px-3 py-3 font-mono text-xs text-cyan-400">
                  {c.id}
                </td>
                <td className="px-3 py-3 font-medium text-white">
                  {c.drugName}
                </td>
                <td className="px-3 py-3 text-foreground">{c.event}</td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${seriousnessColor(c.seriousness)}`}
                  >
                    {seriousnessLabel(c.seriousness)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs text-muted-foreground">
                    {statusLabel(c.status)}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono text-xs tabular-nums text-foreground">
                  {c.daysOpen}d
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {c.assignee}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TechnicalStuffBox>
        Cases flow through the PVOS state machine: Intake &rarr; Triage &rarr;
        Assessment &rarr; Reporting &rarr; Closed. Each transition is governed
        by the PVOS kernel&apos;s FSM, ensuring no case skips a required step.
      </TechnicalStuffBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Signal Watch
// ---------------------------------------------------------------------------

function signalLevelToStrength(
  level: "green" | "yellow" | "red",
): SignalStrength {
  return classifySignalStrength(level).strength;
}

function SignalsPanel({
  signals,
}: {
  signals: import("@/lib/pvos-client").ActiveSignal[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Signal Watch</h2>
        <Link
          href="/nucleus/vigilance/signals"
          className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Open Signal Detection <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <TipBox>
        Signals are early warnings that a drug might be causing a particular
        side effect more often than expected. We watch for them using
        statistical methods that compare how often things happen versus how
        often we&apos;d expect.
      </TipBox>

      {/* Signal cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {signals.map((sig) => {
          const strength = signalLevelToStrength(sig.level);
          return (
            <div
              key={`${sig.drug}-${sig.event}`}
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{sig.drug}</p>
                  <p className="text-xs text-muted-foreground">{sig.event}</p>
                </div>
                <span
                  className={`text-xs font-bold uppercase ${signalStrengthColor(strength)}`}
                >
                  {strength} {trendIcon(sig.trend)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-white/[0.04] p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <JargonBuster
                      term="PRR"
                      definition="Proportional Reporting Ratio — compares how often a drug-event pair is reported versus what you'd expect. PRR >= 2.0 is a signal."
                    >
                      PRR
                    </JargonBuster>
                  </p>
                  <p className="text-lg font-bold tabular-nums text-white">
                    {sig.prr.toFixed(1)}
                  </p>
                </div>
                {sig.ror !== undefined ? (
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <JargonBuster
                        term="ROR"
                        definition="Reporting Odds Ratio — another way to measure if a drug-event pair is reported more than expected. ROR lower CI > 1.0 is a signal."
                      >
                        ROR
                      </JargonBuster>
                    </p>
                    <p className="text-lg font-bold tabular-nums text-white">
                      {sig.ror.toFixed(1)}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-white/[0.04] p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Level
                    </p>
                    <p
                      className={`text-lg font-bold tabular-nums uppercase ${signalStrengthColor(strength)}`}
                    >
                      {sig.level}
                    </p>
                  </div>
                )}
              </div>

              {sig.level === "red" && sig.trend === "rising" && (
                <WarningBox>
                  This signal is strong AND rising. Consider prioritizing a
                  formal evaluation before the next review cycle.
                </WarningBox>
              )}
            </div>
          );
        })}
      </div>

      <TechnicalStuffBox>
        Signal detection uses{" "}
        <JargonBuster
          term="Disproportionality analysis"
          definition="Statistical methods that compare the observed frequency of a drug-event combination against what you'd expect if the drug and event were independent."
        >
          disproportionality analysis
        </JargonBuster>{" "}
        from FAERS data. Strong signals meet Evans criteria: PRR &ge; 2.0,
        Chi-squared &ge; 3.841, and at least 3 cases. All computation runs
        client-side via pv-compute.
      </TechnicalStuffBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Deadlines
// ---------------------------------------------------------------------------

function DeadlinesPanel({
  deadlines,
}: {
  deadlines: import("@/lib/pvos-client").Deadline[];
}) {
  const sorted = [...deadlines].sort(
    (a, b) => a.days_remaining - b.days_remaining,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Upcoming Deadlines</h2>
        <Link
          href="/nucleus/vigilance/reporting"
          className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Open Reporting <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {sorted.some((d) => d.days_remaining <= 3 || d.overdue) && (
        <WarningBox>
          You have deadlines due within 3 days! Fatal and life-threatening cases
          must have initial reports filed within 7 days of awareness. Missing a
          deadline can trigger regulatory action.
        </WarningBox>
      )}

      <RememberBox>
        Deadlines are set by{" "}
        <JargonBuster
          term="ICH E2B"
          definition="The international standard for electronic transmission of Individual Case Safety Reports (ICSRs). It defines timelines: 7 days for fatal/life-threatening, 15 days for other serious events."
        >
          ICH guidelines
        </JargonBuster>
        . They start from the moment your company becomes aware of the case
        &mdash; not from when you receive the report.
      </RememberBox>

      {/* Deadline list */}
      <div className="space-y-3">
        {sorted.map((dl) => (
          <div
            key={dl.case_id}
            className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4"
          >
            <TrafficLight
              level={
                dl.overdue ? "red" : deadlineUrgencyLevel(dl.days_remaining)
              }
              label={dl.overdue ? "Overdue" : `${dl.days_remaining} days left`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-cyan-400">
                  {dl.case_id}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{dl.type}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums text-white">
                {dl.due_date}
              </p>
              {dl.overdue || dl.days_remaining <= 3 ? (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3" />{" "}
                  {dl.overdue ? "Overdue" : "Urgent"}
                </span>
              ) : dl.days_remaining <= 7 ? (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <Timer className="h-3 w-3" /> Soon
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> On track
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <TipBox>
        Pro tip: Set up notifications for the 5-day and 2-day marks. That gives
        you enough buffer to handle last-minute complications without missing
        the regulatory window.
      </TipBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: System Health
// ---------------------------------------------------------------------------

function HealthPanel({
  health,
}: {
  health: import("@/lib/pvos-client").SystemHealth[];
}) {
  const overallScore =
    health.length > 0
      ? Math.round(health.reduce((sum, h) => sum + h.score, 0) / health.length)
      : 0;
  const degradedSystems = health.filter((h) => h.status !== "healthy");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">System Health</h2>
        <Link
          href="/nucleus/vigilance/dashboard"
          className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Full Dashboard <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <TipBox>
        System health tells you if all the behind-the-scenes machinery is
        working correctly. Think of it like the dashboard lights in your car
        &mdash; green means everything is humming along.
      </TipBox>

      {/* Overall score */}
      <ScoreMeter
        score={overallScore}
        label="Overall System Health"
        zones={[
          { label: "Degraded", min: 0, max: 70, color: "bg-red-500" },
          { label: "Fair", min: 70, max: 85, color: "bg-amber-500" },
          { label: "Healthy", min: 85, max: 100, color: "bg-emerald-500" },
        ]}
      />

      {/* Individual system statuses */}
      <div className="grid gap-4 md:grid-cols-2">
        {health.map((h) => (
          <div
            key={h.subsystem}
            className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] p-4"
          >
            <TrafficLight
              level={healthToTrafficLevel(h.status)}
              label={h.subsystem}
            />
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums text-white">
                {h.score}%
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {h.status}
              </p>
            </div>
          </div>
        ))}
      </div>

      {degradedSystems.length > 0 && (
        <WarningBox>
          {degradedSystems.length} system
          {degradedSystems.length > 1 ? "s are" : " is"} running below optimal.
          This might slow down some operations but won&apos;t affect the
          accuracy of your PV computations &mdash; those run locally in your
          browser.
        </WarningBox>
      )}

      <TechnicalStuffBox>
        Health scores are computed from API response times, error rates, and
        data freshness. The PVOS kernel monitors these through its{" "}
        <JargonBuster
          term="Homeostasis loop"
          definition="A biological metaphor for how the system self-regulates. Like your body maintaining temperature, the system constantly checks and adjusts its own health."
        >
          homeostasis loop
        </JargonBuster>
        , which runs a sense-decide-respond-feedback cycle every 30 seconds. PV
        computations (signal detection, causality scores) always run client-side
        and are unaffected by backend health.
      </TechnicalStuffBox>

      <RememberBox>
        Even if a system shows &ldquo;degraded,&rdquo; your signal calculations
        and causality assessments still work perfectly. Those computations
        happen right in your browser &mdash; no server needed.
      </RememberBox>
    </div>
  );
}
