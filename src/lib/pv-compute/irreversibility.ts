/**
 * Irreversibility (∝) — PV Action Point-of-No-Return Classification.
 *
 * Classifies pharmacovigilance regulatory actions by their reversibility,
 * computes temporal irreversibility scores, and identifies point-of-no-return
 * thresholds where actions transition from reversible to irreversible.
 *
 * T1 primitives: ∝(Irreversibility) + ∂(Boundary) + ς(State) + →(Causality)
 *                + N(Quantity) + κ(Comparison) + σ(Sequence) + ∅(Nothing)
 *                + ∃(Existence) + ν(Frequency)
 *
 * Conservation: ∃ = ∂(×(ς, ∅)) — an action exists as irreversible when
 * the temporal boundary crosses the state threshold into the void (no return).
 *
 * (source: ~/Projects/Active/Notebook/primitives/primitives.ipynb, Part II)
 */

// ── Action Categories ────────────────────────────────────────────────────────

export type ReversibilityLevel = "reversible" | "conditional" | "irreversible";

export type PvActionCategory =
  | "case_draft"
  | "case_submission"
  | "signal_assessment"
  | "signal_closure"
  | "periodic_report"
  | "label_change"
  | "market_withdrawal"
  | "dear_hcp_letter"
  | "rems_modification"
  | "study_termination"
  | "regulatory_response"
  | "deadline_expiry";

export interface PvAction {
  category: PvActionCategory;
  name: string;
  reversibilityLevel: ReversibilityLevel;
  consequences: string;
  undoWindow: number | null; // hours, null = no undo possible
}

/**
 * PV action catalog with reversibility classifications.
 *
 * Reporting obligation sources:
 * - (source: ICH E2A Section IV — expedited reporting requirements)
 * - (source: ICH E2D Section III — post-approval safety reporting)
 * - (source: 21 CFR 314.80(c) — FDA postmarketing reporting)
 * - (source: EU GVP Module VI — periodic safety update reports)
 *
 * Undo window values are operational estimates [unverified] — actual
 * windows depend on company SOPs and regulatory authority response times.
 */
const PV_ACTIONS: PvAction[] = [
  {
    category: "case_draft",
    name: "Draft ICSR",
    reversibilityLevel: "reversible",
    consequences: "Internal only — can be edited or deleted before submission",
    undoWindow: null, // unlimited while draft
  },
  {
    category: "case_submission",
    name: "Submit ICSR to Regulator",
    reversibilityLevel: "irreversible",
    // (source: ICH E2D Section III.B — follow-up reports amend, never retract)
    consequences:
      "Filed with regulatory authority. Can only amend via follow-up, never retract.",
    undoWindow: null,
  },
  {
    category: "signal_assessment",
    name: "Open Signal Assessment",
    reversibilityLevel: "conditional",
    // (source: EU GVP Module IX.C.3 — signal validation timeline)
    consequences:
      "Assessment can be updated or redirected. Closing requires documented rationale.",
    undoWindow: 720, // ~30 days [unverified] — operational estimate
  },
  {
    category: "signal_closure",
    name: "Close Signal Without Action",
    reversibilityLevel: "conditional",
    consequences:
      "Can be reopened if new evidence emerges, but closure rationale is permanent record.",
    undoWindow: 168, // ~7 days [unverified] — operational estimate
  },
  {
    category: "periodic_report",
    name: "Submit PSUR/PBRER",
    reversibilityLevel: "irreversible",
    // (source: ICH E2C(R2) Section 3 — data lock point finality)
    consequences:
      "Periodic report filed. Data lock point is final. Corrections only via addendum.",
    undoWindow: null,
  },
  {
    category: "label_change",
    name: "Safety Label Update",
    reversibilityLevel: "conditional",
    consequences:
      "Label can be updated again, but previous version is permanent regulatory record.",
    undoWindow: 2160, // ~90 days [unverified] — operational estimate
  },
  {
    category: "market_withdrawal",
    name: "Market Withdrawal",
    reversibilityLevel: "irreversible",
    // (source: 21 CFR 314.150 — withdrawal of approval; reintroduction requires new NDA)
    consequences:
      "Product removed from market. Reintroduction requires new regulatory approval.",
    undoWindow: null,
  },
  {
    category: "dear_hcp_letter",
    name: "Dear Healthcare Professional Letter",
    reversibilityLevel: "irreversible",
    // (source: EU GVP Module XV — safety communication distribution)
    consequences:
      "Communication sent to prescribers. Cannot be unsent. Correction letters possible but original persists.",
    undoWindow: null,
  },
  {
    category: "rems_modification",
    name: "REMS Program Modification",
    reversibilityLevel: "conditional",
    // (source: 21 CFR 314.520 — REMS assessment schedule)
    consequences:
      "REMS changes can be further modified but each version is a permanent regulatory commitment.",
    undoWindow: 4320, // ~180 days [unverified] — operational estimate
  },
  {
    category: "study_termination",
    name: "Terminate Clinical Study for Safety",
    reversibilityLevel: "irreversible",
    // (source: ICH E6(R2) Section 4.12 — premature termination procedures)
    consequences:
      "Study stopped. Subjects unblinded. Data integrity compromised for restart. Cannot be undone.",
    undoWindow: null,
  },
  {
    category: "regulatory_response",
    name: "Response to Regulatory Query",
    reversibilityLevel: "irreversible",
    consequences:
      "Official response to authority. Becomes part of regulatory dossier permanently.",
    undoWindow: null,
  },
  {
    category: "deadline_expiry",
    name: "Regulatory Deadline Passed",
    reversibilityLevel: "irreversible",
    // (source: 21 CFR 314.80(c)(1) — 15-day expedited reporting requirement)
    consequences:
      "Missed deadline is a compliance violation. Late submission documented but original deadline breach is permanent.",
    undoWindow: null,
  },
];

export function getAction(category: PvActionCategory): PvAction | undefined {
  return PV_ACTIONS.find((a) => a.category === category);
}

export function getAllActions(): PvAction[] {
  return [...PV_ACTIONS];
}

// ── Reversibility Classification ─────────────────────────────────────────────

export interface ReversibilityResult {
  action: PvAction;
  level: ReversibilityLevel;
  canUndo: boolean;
  undoWindowHours: number | null;
  explanation: string;
}

/**
 * Classify the reversibility of a PV action.
 *
 * (source: ICH E2A Section IV — reporting obligations define which
 * actions create irreversible regulatory commitments)
 */
export function classifyReversibility(
  category: PvActionCategory,
): ReversibilityResult {
  const action = getAction(category);
  if (!action) {
    return {
      action: {
        category,
        name: category,
        reversibilityLevel: "conditional",
        consequences: "Unknown action category",
        undoWindow: null,
      },
      level: "conditional",
      canUndo: false,
      undoWindowHours: null,
      explanation: `Action "${category}" not found in PV action catalog. Treating as conditionally reversible — verify with regulatory affairs.`,
    };
  }

  const canUndo = action.reversibilityLevel !== "irreversible";
  const explanation =
    action.reversibilityLevel === "irreversible"
      ? `${action.name} is irreversible. ${action.consequences}`
      : action.reversibilityLevel === "conditional"
        ? `${action.name} is conditionally reversible within ${action.undoWindow ?? "unknown"} hours. ${action.consequences}`
        : `${action.name} is fully reversible. ${action.consequences}`;

  return {
    action,
    level: action.reversibilityLevel,
    canUndo,
    undoWindowHours: action.undoWindow,
    explanation,
  };
}

// ── Irreversibility Score ────────────────────────────────────────────────────

export interface IrreversibilityFactor {
  name: string;
  weight: number; // 0-1
  present: boolean;
}

export interface IrreversibilityScoreResult {
  score: number; // 0-1 (0 = fully reversible, 1 = fully irreversible)
  level: ReversibilityLevel;
  factors: IrreversibilityFactor[];
  dominantFactor: string;
}

/**
 * Standard irreversibility factors for PV regulatory actions.
 * Weights are operational estimates [unverified] — derived from
 * relative impact analysis of ICH E2A/E2D regulatory obligations.
 */
export const STANDARD_FACTORS: Omit<IrreversibilityFactor, "present">[] = [
  { name: "Submitted to regulator", weight: 0.35 },
  { name: "Patient safety impacted", weight: 0.25 },
  { name: "Public communication issued", weight: 0.2 },
  { name: "Regulatory deadline passed", weight: 0.15 },
  { name: "Third-party dependency", weight: 0.05 },
];

/**
 * Compute an irreversibility score from a set of weighted factors.
 *
 * The score is a weighted sum where each factor contributes its weight
 * when present. Thresholds: >= 0.7 = irreversible, >= 0.3 = conditional,
 * below 0.3 = reversible. Weights normalized if they don't sum to 1.0.
 */
export function computeIrreversibilityScore(
  factors: IrreversibilityFactor[],
): IrreversibilityScoreResult {
  if (factors.length === 0) {
    return {
      score: 0,
      level: "reversible",
      factors: [],
      dominantFactor: "none",
    };
  }

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const normalizer = totalWeight > 0 ? totalWeight : 1;

  const score = factors.reduce(
    (sum, f) => sum + (f.present ? f.weight / normalizer : 0),
    0,
  );

  const clampedScore = Math.min(1, Math.max(0, score));

  const level: ReversibilityLevel =
    clampedScore >= 0.7
      ? "irreversible"
      : clampedScore >= 0.3
        ? "conditional"
        : "reversible";

  const presentFactors = factors.filter((f) => f.present);
  const dominantFactor =
    presentFactors.length > 0
      ? presentFactors.reduce((a, b) => (a.weight > b.weight ? a : b)).name
      : "none";

  return {
    score: clampedScore,
    level,
    factors,
    dominantFactor,
  };
}

// ── Point of No Return ───────────────────────────────────────────────────────

export type UrgencyLevel = "safe" | "warning" | "critical" | "expired";

export interface PointOfNoReturnResult {
  deadlineMs: number;
  nowMs: number;
  hoursRemaining: number;
  pastDeadline: boolean;
  urgency: UrgencyLevel;
  percentElapsed: number; // 0-1 of total window consumed
  explanation: string;
}

/**
 * Urgency thresholds for point-of-no-return classification.
 *
 * Warning at 48h and critical at 12h are operational thresholds [unverified]
 * chosen to align with typical PV department escalation procedures.
 * Actual ICH timelines: 7-day fatal SUSAR, 15-day serious unexpected ADR
 * (source: ICH E2A Section IV.A — expedited reporting timelines).
 */
const URGENCY_THRESHOLDS = {
  warningHours: 48,
  criticalHours: 12,
};

/**
 * Identify the point of no return for a regulatory deadline.
 *
 * Once past the deadline, the action transitions from ς (mutable state)
 * to ∝ (irreversible fact). The temporal boundary (∂) is the deadline itself.
 * (source: ~/Projects/Active/Notebook/primitives/primitives.ipynb, Part II Dictionary)
 *
 * @param deadlineMs - Deadline timestamp in milliseconds
 * @param nowMs - Current timestamp in milliseconds
 * @param windowStartMs - Optional: when the clock started (for percentElapsed)
 */
export function findPointOfNoReturn(
  deadlineMs: number,
  nowMs: number,
  windowStartMs?: number,
): PointOfNoReturnResult {
  const diffMs = deadlineMs - nowMs;
  const hoursRemaining = diffMs / (1000 * 60 * 60);
  const pastDeadline = diffMs <= 0;

  const urgency: UrgencyLevel = pastDeadline
    ? "expired"
    : hoursRemaining <= URGENCY_THRESHOLDS.criticalHours
      ? "critical"
      : hoursRemaining <= URGENCY_THRESHOLDS.warningHours
        ? "warning"
        : "safe";

  const totalWindowMs =
    windowStartMs !== undefined ? deadlineMs - windowStartMs : deadlineMs;
  const elapsedMs = windowStartMs !== undefined ? nowMs - windowStartMs : nowMs;
  const percentElapsed =
    totalWindowMs > 0
      ? Math.min(1, Math.max(0, elapsedMs / totalWindowMs))
      : pastDeadline
        ? 1
        : 0;

  const explanation = pastDeadline
    ? `Deadline passed ${Math.abs(hoursRemaining).toFixed(1)} hours ago. This action is now irreversible — the compliance violation is a permanent record.`
    : urgency === "critical"
      ? `CRITICAL: Only ${hoursRemaining.toFixed(1)} hours remain. Action transitions to irreversible at deadline. Act now or accept permanent consequences.`
      : urgency === "warning"
        ? `WARNING: ${hoursRemaining.toFixed(1)} hours until point of no return. Begin action immediately to preserve reversibility window.`
        : `SAFE: ${hoursRemaining.toFixed(1)} hours remaining. Action is still reversible within this window.`;

  return {
    deadlineMs,
    nowMs,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    pastDeadline,
    urgency,
    percentElapsed: Math.round(percentElapsed * 1000) / 1000,
    explanation,
  };
}

// ── Regulatory Deadline Presets ──────────────────────────────────────────────

export type DeadlinePreset =
  | "expedited_15_day"
  | "expedited_7_day"
  | "periodic_90_day"
  | "annual_psur"
  | "signal_validation_60_day";

export interface DeadlinePresetConfig {
  id: DeadlinePreset;
  name: string;
  windowHours: number;
  source: string;
}

/**
 * Standard regulatory deadline windows.
 * (source: ICH E2A Section IV.A — 7-day and 15-day expedited timelines)
 * (source: ICH E2C(R2) Section 3 — periodic report timelines)
 * (source: EU GVP Module IX.C.3 — signal validation 60-day timeline)
 */
export const DEADLINE_PRESETS: DeadlinePresetConfig[] = [
  {
    id: "expedited_7_day",
    name: "7-Day Expedited (Fatal/Life-threatening SUSAR)",
    windowHours: 7 * 24,
    source: "ICH E2A Section IV.A",
  },
  {
    id: "expedited_15_day",
    name: "15-Day Expedited (Serious Unexpected ADR)",
    windowHours: 15 * 24,
    source: "21 CFR 314.80(c)(1)(i)",
  },
  {
    id: "signal_validation_60_day",
    name: "60-Day Signal Validation",
    windowHours: 60 * 24,
    source: "EU GVP Module IX.C.3",
  },
  {
    id: "periodic_90_day",
    name: "90-Day Periodic Report",
    windowHours: 90 * 24,
    source: "ICH E2C(R2) Section 3",
  },
  {
    id: "annual_psur",
    name: "Annual PSUR/PBRER",
    windowHours: 365 * 24,
    source: "ICH E2C(R2)",
  },
];

export function getDeadlinePreset(
  id: DeadlinePreset,
): DeadlinePresetConfig | undefined {
  return DEADLINE_PRESETS.find((p) => p.id === id);
}
