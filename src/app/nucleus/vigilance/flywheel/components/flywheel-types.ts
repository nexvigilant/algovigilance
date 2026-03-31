// ── Flywheel Dashboard Types ─────────────────────────────────────────────────
// All interfaces for the flywheel health dashboard.

/** Traffic light level used across all components. */
export type HealthLevel = "green" | "yellow" | "red";

/** Velocity band classification matching MCP formula.rs:275 thresholds. */
export type VelocityBand = "EXCEPTIONAL" | "TARGET" | "ACCEPTABLE" | "SLOW";

/** Momentum trend from session-velocity hook. */
export type MomentumTrend =
  | "ACCELERATING"
  | "MAINTAINING"
  | "DECELERATING"
  | "BASELINE";

/** Session band from session-velocity hook. */
export type SessionBand = "HIGH" | "MEDIUM" | "LOW" | "STALLED";

/** Flywheel node tier. */
export type NodeTier = "Live" | "Staging" | "Draft";

/** Composite action from computeComposite. */
export type CompositeAction =
  | "CELEBRATE"
  | "MONITOR"
  | "INVESTIGATE"
  | "INTERVENE";

/** Dimension that degraded performance. */
export type DegradedDimension = "velocity" | "health" | "coverage" | null;

// ── MCP Response Types ──────────────────────────────────────────────────────

/** Raw node from MCP flywheel_status. */
export interface FlywheelNodeRaw {
  name: string;
  tier: string; // lowercase from MCP: "live", "staging", "draft"
  status: "active" | "inactive" | "error" | "wiring" | "dormant";
  crates: string[];
}

/** Normalized node for UI display. */
export interface FlywheelNode {
  name: string;
  tier: NodeTier;
  status: "active" | "inactive" | "error" | "wiring" | "dormant";
  crates: string[];
}

/** Raw MCP response from flywheel_status. */
export interface FlywheelStatusRaw {
  nodes: FlywheelNodeRaw[];
  tier_counts: Record<string, number>;
  success: boolean;
}

/** Normalized status for UI. */
export interface FlywheelStatusResult {
  nodes: FlywheelNode[];
  tier_counts: Record<NodeTier, number>;
  total_nodes: number;
  active_nodes: number;
}

export interface VelocityResult {
  avg_delta_ms: number;
  avg_delta_hours: number;
  velocity_per_hour: number;
  classification: string;
  valid_pairs: number;
  invalid_pairs: number;
  min_delta_hours: number;
  max_delta_hours: number;
  formula: string;
  source: string;
  target: string;
}

// ── JSONL History Record ────────────────────────────────────────────────────

export interface HistoryRecord {
  ts: string;
  commits: number;
  files_modified: number;
  tool_calls: number;
  session_band: SessionBand;
  estimated_fix_time_ms: number;
  momentum: MomentumTrend;
}

// ── Client-Side Logic Results ───────────────────────────────────────────────

export interface EventHealthResult {
  level: HealthLevel;
  reason: string;
}

export interface CompositeResult {
  level: HealthLevel;
  action: CompositeAction;
  degraded: DegradedDimension;
  summary: string;
}

export interface ActionStep {
  label: string;
  detail: string;
  id: string;
}

export interface ActionRoute {
  strategy: string;
  steps: ActionStep[];
}

// ── Autonomous Loop Health ───────────────────────────────────────────────────

/** Health color for a single loop indicator. */
export type LoopHealthColor = "green" | "yellow" | "red";

/** Single loop health indicator for the loop health panel. */
export interface LoopHealthIndicator {
  loopNumber: number;
  loopName: string;
  friendlyName: string;
  stateLabel: string;
  metricLabel: string;
  metricValue: string;
  color: LoopHealthColor;
}

/** Governing equation display values. */
export interface GoverningEquationValues {
  /** Moment of inertia (I) — displayed in E = ½Iω² */
  momentOfInertia: number;
  /** Angular velocity (ω) — displayed in E = ½Iω² */
  angularVelocity: number;
  /** Computed kinetic energy E = ½Iω² */
  kineticEnergy: number;
}

// ── VDAG Reality Gradient ───────────────────────────────────────────────────

/** Evidence quality for a single loop from VDAG grading (matches Rust Display). */
export type EvidenceQuality = "none" | "weak" | "moderate" | "strong";

/** Reality rating threshold bands (matches Rust Display). */
export type RealityRating =
  | "testing_theater"
  | "safety_validated"
  | "efficacy_demonstrated"
  | "scale_confirmed"
  | "production_ready";

/** Learning loop type from VDAG analysis (matches Rust Display). */
export type LearningLoopType = "single" | "double" | "triple";

/** Per-loop evidence grading result. */
export interface LoopEvidenceResult {
  loopName: string;
  quality: EvidenceQuality;
  score: number;
  weight: number;
  achievedTarget: boolean;
}

/** Reality Gradient composite result. */
export interface RealityGradientResult {
  score: number;
  rating: RealityRating;
  executable: boolean;
  perLoop: LoopEvidenceResult[];
}

/** Learning insight from history analysis. */
export interface LearningInsightResult {
  loopType: LearningLoopType;
  observation: string;
  suggestedAdjustments: Array<{
    parameter: string;
    currentValue: number;
    suggestedValue: number;
    confidence: number;
    reason: string;
  }>;
}

// ── Dashboard Aggregate ─────────────────────────────────────────────────────

export interface FlywheelDashboardData {
  status: FlywheelStatusResult | null;
  velocity: VelocityResult | null;
  history: HistoryRecord[];
}
