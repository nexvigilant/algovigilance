/**
 * PVOS Client — typed client for the PV Operating System API.
 *
 * All calls route through the catch-all proxy at /api/nexcore/[...path]
 * which forwards to nexcore-api (port 3030).
 *
 * Graceful degradation: if nexcore-api is unreachable, returns mock data
 * so the UI remains functional in development/demo mode.
 */

const PVOS_BASE = "/api/nexcore/api/v1/pvos";

// ── Types matching PVOS kernel syscall types ────────────────────────────────

export type Algorithm =
  | "prr"
  | "ror"
  | "ic"
  | "ebgm"
  | "chi_squared"
  | "fisher";
export type CaseStage =
  | "new"
  | "triage"
  | "assessment"
  | "reporting"
  | "closed";
export type Priority = "p0" | "p1" | "p2" | "p3";
export type SignalLevel = "green" | "yellow" | "red";
export type DriftSeverity = "stable" | "minor" | "moderate" | "critical";
export type AlertState = "ok" | "pending" | "firing" | "resolved";

export interface SignalResult {
  drug: string;
  event: string;
  algorithm: Algorithm;
  statistic: number;
  signal_detected: boolean;
  ci_lower?: number;
  ci_upper?: number;
}

export interface CaseLifecycle {
  case_id: string;
  drug: string;
  event: string;
  stage: CaseStage;
  priority: Priority;
  serious: boolean;
  days_in_stage: number;
  deadline_days?: number;
  narrative?: string;
}

export interface DashboardMetrics {
  cases_by_stage: Record<CaseStage, number>;
  active_signals: ActiveSignal[];
  deadlines: Deadline[];
  system_health: SystemHealth[];
}

export interface ActiveSignal {
  drug: string;
  event: string;
  level: SignalLevel;
  prr: number;
  ror?: number;
  trend: "rising" | "stable" | "declining";
}

export interface Deadline {
  case_id: string;
  type: string;
  due_date: string;
  days_remaining: number;
  overdue: boolean;
}

export interface SystemHealth {
  subsystem: string;
  status: "healthy" | "degraded" | "down";
  score: number;
  last_check: string;
}

export interface AuditEntry {
  timestamp: string;
  case_id: string;
  action: string;
  actor: string;
  from_state?: CaseStage;
  to_state?: CaseStage;
  detail?: string;
  has_snapshot: boolean;
}

export interface DriftResult {
  drug: string;
  event: string;
  metric: string;
  severity: DriftSeverity;
  previous_value: number;
  current_value: number;
  change_pct: number;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  kind: "detect" | "triage" | "assess" | "report" | "review";
  description: string;
}

// ── API Client Functions ────────────────────────────────────────────────────

async function pvosGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${PVOS_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    // nexcore-api unreachable — return mock/fallback data
    return fallback;
  }
}

async function pvosPost<T>(
  path: string,
  body: unknown,
  fallback: T,
): Promise<T> {
  try {
    const res = await fetch(`${PVOS_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Get full dashboard metrics (cases, signals, deadlines, health) */
export async function getDashboard(): Promise<DashboardMetrics> {
  return pvosGet("/dashboard", MOCK_DASHBOARD);
}

/** Get all cases with lifecycle state */
export async function getCases(): Promise<CaseLifecycle[]> {
  return pvosGet("/cases", MOCK_CASES);
}

/** Get case audit trail */
export async function getAuditTrail(caseId?: string): Promise<AuditEntry[]> {
  const path = caseId ? `/audit?case_id=${caseId}` : "/audit";
  return pvosGet(path, MOCK_AUDIT);
}

/** Detect signals for a drug-event pair */
export async function detectSignal(
  drug: string,
  event: string,
  a: number,
  b: number,
  c: number,
  d: number,
): Promise<SignalResult> {
  return pvosPost(
    "/detect",
    { drug, event, a, b, c, d },
    {
      drug,
      event,
      algorithm: "prr" as Algorithm,
      statistic: 0,
      signal_detected: false,
    },
  );
}

/** Get drift alerts */
export async function getDriftAlerts(): Promise<DriftResult[]> {
  return pvosGet("/drift", MOCK_DRIFT);
}

/** Advance a case through its lifecycle FSM */
export async function transitionCase(
  caseId: string,
  event: string,
): Promise<{ success: boolean; new_state: CaseStage }> {
  return pvosPost(
    "/fsm/transition",
    { entity_id: caseId, event },
    {
      success: false,
      new_state: "new" as CaseStage,
    },
  );
}

/** Define a new workflow */
export async function defineWorkflow(
  workflow: WorkflowDefinition,
): Promise<{ success: boolean; workflow_id: string }> {
  return pvosPost("/workflow/define", workflow, {
    success: false,
    workflow_id: "",
  });
}

/** Get system health */
export async function getSystemHealth(): Promise<SystemHealth[]> {
  return pvosGet("/health", MOCK_HEALTH);
}

// ── Mock Data (used when nexcore-api is unreachable) ────────────────────────

const MOCK_CASES: CaseLifecycle[] = [
  {
    case_id: "ICSR-2026-001",
    drug: "Lamotrigine",
    event: "Stevens-Johnson Syndrome",
    stage: "reporting",
    priority: "p0",
    serious: true,
    days_in_stage: 2,
    deadline_days: 5,
    narrative: "Severe skin reaction after dose increase",
  },
  {
    case_id: "ICSR-2026-002",
    drug: "Rosuvastatin",
    event: "Rhabdomyolysis",
    stage: "assessment",
    priority: "p1",
    serious: true,
    days_in_stage: 4,
    deadline_days: 11,
    narrative: "Muscle pain and elevated CK after dose adjustment",
  },
  {
    case_id: "ICSR-2026-003",
    drug: "Atorvastatin",
    event: "Hepatotoxicity",
    stage: "triage",
    priority: "p2",
    serious: true,
    days_in_stage: 1,
    narrative: "Elevated ALT/AST on routine monitoring",
  },
  {
    case_id: "ICSR-2026-004",
    drug: "Metformin",
    event: "Lactic Acidosis",
    stage: "new",
    priority: "p1",
    serious: true,
    days_in_stage: 0,
    narrative: "Presenting with metabolic acidosis",
  },
  {
    case_id: "ICSR-2026-005",
    drug: "Ibuprofen",
    event: "GI Bleeding",
    stage: "closed",
    priority: "p3",
    serious: false,
    days_in_stage: 30,
    narrative: "Minor GI discomfort, resolved on discontinuation",
  },
];

const MOCK_DASHBOARD: DashboardMetrics = {
  cases_by_stage: { new: 1, triage: 1, assessment: 1, reporting: 1, closed: 1 },
  active_signals: [
    {
      drug: "Lamotrigine",
      event: "SJS",
      level: "red",
      prr: 8.2,
      trend: "rising",
    },
    {
      drug: "Rosuvastatin",
      event: "Rhabdomyolysis",
      level: "yellow",
      prr: 3.1,
      trend: "stable",
    },
    {
      drug: "Atorvastatin",
      event: "Hepatotoxicity",
      level: "yellow",
      prr: 2.4,
      trend: "declining",
    },
    {
      drug: "Metformin",
      event: "Lactic Acidosis",
      level: "green",
      prr: 1.2,
      trend: "stable",
    },
  ],
  deadlines: [
    {
      case_id: "ICSR-2026-001",
      type: "7-day expedited",
      due_date: "2026-03-08",
      days_remaining: 5,
      overdue: false,
    },
    {
      case_id: "ICSR-2026-002",
      type: "15-day expedited",
      due_date: "2026-03-14",
      days_remaining: 11,
      overdue: false,
    },
  ],
  system_health: [
    {
      subsystem: "Detection Engine",
      status: "healthy",
      score: 98,
      last_check: "2026-03-03T09:00:00Z",
    },
    {
      subsystem: "Triage Scheduler",
      status: "healthy",
      score: 95,
      last_check: "2026-03-03T09:00:00Z",
    },
    {
      subsystem: "FAERS Pipeline",
      status: "degraded",
      score: 72,
      last_check: "2026-03-03T08:45:00Z",
    },
    {
      subsystem: "Audit Logger",
      status: "healthy",
      score: 100,
      last_check: "2026-03-03T09:00:00Z",
    },
  ],
};

const MOCK_AUDIT: AuditEntry[] = [
  {
    timestamp: "2026-03-03T08:00:00Z",
    case_id: "ICSR-2026-001",
    action: "Case ingested",
    actor: "System",
    to_state: "new",
    detail: "Auto-ingested from FAERS feed",
    has_snapshot: false,
  },
  {
    timestamp: "2026-03-03T08:05:00Z",
    case_id: "ICSR-2026-001",
    action: "Triaged as SERIOUS",
    actor: "System",
    from_state: "new",
    to_state: "triage",
    detail: "ICH E2A: life-threatening reaction",
    has_snapshot: true,
  },
  {
    timestamp: "2026-03-03T08:30:00Z",
    case_id: "ICSR-2026-001",
    action: "Causality assessed",
    actor: "Dr. Smith",
    from_state: "triage",
    to_state: "assessment",
    detail: "Naranjo score: 7 (Probable)",
    has_snapshot: true,
  },
  {
    timestamp: "2026-03-03T09:00:00Z",
    case_id: "ICSR-2026-001",
    action: "Moved to reporting",
    actor: "Dr. Smith",
    from_state: "assessment",
    to_state: "reporting",
    detail: "7-day expedited report initiated",
    has_snapshot: true,
  },
];

const MOCK_DRIFT: DriftResult[] = [
  {
    drug: "Lamotrigine",
    event: "SJS",
    metric: "PRR",
    severity: "critical",
    previous_value: 4.1,
    current_value: 8.2,
    change_pct: 100,
  },
  {
    drug: "Rosuvastatin",
    event: "Rhabdomyolysis",
    metric: "PRR",
    severity: "minor",
    previous_value: 2.8,
    current_value: 3.1,
    change_pct: 10.7,
  },
  {
    drug: "Metformin",
    event: "Lactic Acidosis",
    metric: "PRR",
    severity: "stable",
    previous_value: 1.3,
    current_value: 1.2,
    change_pct: -7.7,
  },
];

const MOCK_HEALTH: SystemHealth[] = MOCK_DASHBOARD.system_health;
