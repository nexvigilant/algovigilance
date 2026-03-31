/**
 * Client-side flywheel computation functions.
 *
 * Three-node flywheel bridge: Live / Staging / Draft tiers.
 * Computes velocity, composite health, and node promotion readiness.
 *
 * ALL computation is client-side — pure functions, no async, no server calls.
 * Data arrives from flywheel_status MCP response; these functions compute FROM that data.
 *
 * T1 primitives: ν(Frequency) + ∂(Boundary) + κ(Comparison) + σ(Selection)
 */

/** Tier classification from flywheel_status MCP response */
export type FlywheelTier = "live" | "staging" | "draft";

/** Node operational status */
export type FlywheelStatus = "active" | "wiring" | "dormant";

/** Single flywheel node from flywheel_status MCP response */
export interface FlywheelNode {
  name: string;
  tier: FlywheelTier;
  status: FlywheelStatus;
  /** Number of Rust crates wired to this node */
  crate_count: number;
  /** Whether a consumer (e.g. nucleus page or MCP caller) is actively wired */
  has_consumer_integration: boolean;
}

/** Result of computeFlywheelVelocity */
export interface FlywheelVelocity {
  /** Inverse of average repair time in ms^-1 */
  velocity: number;
  /** Human-readable classification band */
  classification: "exceptional" | "target" | "acceptable" | "slow";
  /** Average repair time in milliseconds */
  avgRepairMs: number;
  /** Number of paired failure/fix events used */
  pairCount: number;
}

/** Result of computeFlywheelComposite */
export interface CompositeHealth {
  /** Weighted average of (tier_score * status_score) across all nodes */
  composite: number;
  /** Human-readable health band */
  classification: "healthy" | "degraded" | "critical";
  liveCount: number;
  stagingCount: number;
  draftCount: number;
}

/** Result of computeNodeReadiness */
export interface ReadinessScore {
  ready: boolean;
  /** 0–1 score based on how many readiness checks pass */
  score: number;
  /** List of unmet conditions blocking promotion */
  blockers: string[];
}

// ─── Scoring tables ───────────────────────────────────────────────────────────

const TIER_SCORE: Record<FlywheelTier, number> = {
  live: 1.0,
  staging: 0.5,
  draft: 0.1,
};

const STATUS_SCORE: Record<FlywheelStatus, number> = {
  active: 1.0,
  wiring: 0.7,
  dormant: 0.3,
};

/** Velocity band thresholds in milliseconds */
const MS_4H = 4 * 60 * 60 * 1000;
const MS_24H = 24 * 60 * 60 * 1000;
const MS_72H = 72 * 60 * 60 * 1000;

// ─── Public functions ─────────────────────────────────────────────────────────

/**
 * Compute flywheel repair velocity from paired failure/fix timestamps.
 *
 * velocity = 1 / avg(fix - failure) in ms⁻¹
 * Pairs are matched by index position (failureTimestamps[i] ↔ fixTimestamps[i]).
 * Unpaired entries are ignored.
 */
export function computeFlywheelVelocity(
  failureTimestamps: number[],
  fixTimestamps: number[],
): FlywheelVelocity {
  const pairCount = Math.min(failureTimestamps.length, fixTimestamps.length);

  if (pairCount === 0) {
    return {
      velocity: 0,
      classification: "slow",
      avgRepairMs: Infinity,
      pairCount: 0,
    };
  }

  let totalRepairMs = 0;
  for (let i = 0; i < pairCount; i++) {
    totalRepairMs += fixTimestamps[i] - failureTimestamps[i];
  }

  const avgRepairMs = totalRepairMs / pairCount;
  const velocity = avgRepairMs > 0 ? 1 / avgRepairMs : Infinity;

  let classification: FlywheelVelocity["classification"];
  if (avgRepairMs < MS_4H) {
    classification = "exceptional";
  } else if (avgRepairMs < MS_24H) {
    classification = "target";
  } else if (avgRepairMs < MS_72H) {
    classification = "acceptable";
  } else {
    classification = "slow";
  }

  return { velocity, classification, avgRepairMs, pairCount };
}

/**
 * Compute composite health score across all flywheel nodes.
 *
 * composite = avg(tier_score * status_score) for each node
 * Scores: live=1.0, staging=0.5, draft=0.1 × active=1.0, wiring=0.7, dormant=0.3
 */
export function computeFlywheelComposite(
  nodes: FlywheelNode[],
): CompositeHealth {
  let liveCount = 0;
  let stagingCount = 0;
  let draftCount = 0;

  if (nodes.length === 0) {
    return {
      composite: 0,
      classification: "critical",
      liveCount: 0,
      stagingCount: 0,
      draftCount: 0,
    };
  }

  let totalScore = 0;
  for (const node of nodes) {
    totalScore += TIER_SCORE[node.tier] * STATUS_SCORE[node.status];
    if (node.tier === "live") liveCount++;
    else if (node.tier === "staging") stagingCount++;
    else draftCount++;
  }

  const composite = totalScore / nodes.length;

  let classification: CompositeHealth["classification"];
  if (composite >= 0.7) {
    classification = "healthy";
  } else if (composite >= 0.4) {
    classification = "degraded";
  } else {
    classification = "critical";
  }

  return { composite, classification, liveCount, stagingCount, draftCount };
}

/**
 * Evaluate a single node's readiness for tier promotion.
 *
 * Readiness checks:
 *   1. crate_count >= 2
 *   2. status === 'active'
 *   3. has_consumer_integration === true
 *
 * score = passing_checks / total_checks
 * ready = score === 1.0 (all checks pass)
 */
export function computeNodeReadiness(node: FlywheelNode): ReadinessScore {
  const blockers: string[] = [];

  if (node.crate_count < 2) {
    blockers.push(
      `crate_count ${node.crate_count} < 2 — wire at least 2 crates`,
    );
  }

  if (node.status !== "active") {
    blockers.push(`status is '${node.status}' — must be 'active'`);
  }

  if (!node.has_consumer_integration) {
    blockers.push(
      "no consumer integration — wire a nucleus page or MCP caller",
    );
  }

  const totalChecks = 3;
  const passingChecks = totalChecks - blockers.length;
  const score = passingChecks / totalChecks;
  const ready = blockers.length === 0;

  return { ready, score, blockers };
}

// ─── Loop result types ────────────────────────────────────────────────────────

export type RimState = "thriving" | "critical" | "disintegrated";
export type MomentumClass = "high" | "normal" | "low" | "stalled";
export type FrictionClass = "acceptable" | "warning" | "critical";
export type GyroscopicState =
  | "stable"
  | "precessing"
  | "gimbal_lock"
  | "no_stability";
export type ElasticState =
  | "nominal"
  | "yield_exceeded"
  | "fatigue_failure_imminent";

export interface RimIntegrityResult {
  state: RimState;
  tensileStrength: number;
  centrifugalForce: number;
  margin: number;
}

export interface MomentumResult {
  L: number;
  classification: MomentumClass;
  aboveCritical: boolean;
}

export interface FrictionResult {
  netDrain: number;
  contactFriction: number;
  aeroDrag: number;
  classification: FrictionClass;
}

export interface GyroscopicResult {
  score: number;
  state: GyroscopicState;
  stabilityRatio: number;
}

export interface ElasticResult {
  state: ElasticState;
  strain: number;
  cyclesRemaining: number;
}

// ─── FlywheelVitals — 15-field health snapshot ────────────────────────────────

export interface FlywheelVitals {
  // Loop 1: Rim Integrity
  valueDensity: number;
  churnRate: number;
  switchingCostIndex: number;
  // Loop 2: Momentum
  knowledgeBaseGrowth: number;
  executionVelocity: number;
  momentum: number;
  // Loop 3: Friction
  automationCoverage: number;
  manualTouchpoints: number;
  overheadRatio: number;
  // Loop 4: Gyroscopic Stability
  missionAlignmentScore: number;
  scopeCreepIncidents: number;
  pivotResistance: number;
  // Loop 5: Elastic Equilibrium
  contributorLoad: number;
  fatigueCycleCount: number;
  recoveryTimeDays: number;
}

export interface FlywheelThresholds {
  minCommunitySize: number;
  minMomentumForStability: number;
  maxOverheadRatio: number;
  maxFatigueCycles: number;
  maxChurnRate: number;
}

export const DEFAULT_THRESHOLDS: FlywheelThresholds = {
  minCommunitySize: 100,
  minMomentumForStability: 50.0,
  maxOverheadRatio: 0.4,
  maxFatigueCycles: 1000,
  maxChurnRate: 0.15,
};

// ─── Loop functions ───────────────────────────────────────────────────────────

/**
 * Loop 1 — Rim Integrity.
 *
 * centrifugal_force = competition_pull × alternatives_count
 * tensile_strength  = switching_cost + community_identity + value_density
 * thriving   → tensile > centrifugal
 * critical   → tensile within 10% of centrifugal (tensile >= centrifugal × 0.9)
 * disintegrated → tensile < centrifugal × 0.9
 */
export function computeRimIntegrity(
  competitionPull: number,
  alternativesCount: number,
  switchingCost: number,
  communityIdentity: number,
  valueDensity: number,
): RimIntegrityResult {
  const centrifugalForce = competitionPull * alternativesCount;
  const tensileStrength = switchingCost + communityIdentity + valueDensity;
  const margin = tensileStrength - centrifugalForce;

  let state: RimState;
  if (tensileStrength > centrifugalForce) {
    state = "thriving";
  } else if (tensileStrength >= centrifugalForce * 0.9) {
    state = "critical";
  } else {
    state = "disintegrated";
  }

  return { state, tensileStrength, centrifugalForce, margin };
}

/**
 * Loop 2 — Momentum Conservation.
 *
 * L = momentOfInertia × angularVelocity − frictionPerStep
 * high    → L > 2 × criticalThreshold
 * normal  → L > criticalThreshold
 * low     → L > 0.5 × criticalThreshold
 * stalled → else
 */
export function computeMomentum(
  momentOfInertia: number,
  angularVelocity: number,
  frictionPerStep: number,
  criticalThreshold: number,
): MomentumResult {
  const L = momentOfInertia * angularVelocity - frictionPerStep;
  const aboveCritical = L >= criticalThreshold;

  let classification: MomentumClass;
  if (L > 2 * criticalThreshold) {
    classification = "high";
  } else if (L > criticalThreshold) {
    classification = "normal";
  } else if (L > 0.5 * criticalThreshold) {
    classification = "low";
  } else {
    classification = "stalled";
  }

  return { L, classification, aboveCritical };
}

/**
 * Loop 3 — Friction Dissipation.
 *
 * contact_friction = manual_processes × human_touchpoints
 * aero_drag        = velocity³ × surface_area × 0.001
 * net_drain        = total_drain × (1 − automation_coverage)
 * acceptable → net < 10, warning → net < 50, critical → else
 */
export function computeFriction(
  manualProcesses: number,
  humanTouchpoints: number,
  velocity: number,
  surfaceArea: number,
  automationCoverage: number,
): FrictionResult {
  const contactFriction = manualProcesses * humanTouchpoints;
  const aeroDrag = Math.pow(velocity, 3) * surfaceArea * 0.001;
  const totalDrain = contactFriction + aeroDrag;
  const netDrain = totalDrain - automationCoverage * totalDrain;

  let classification: FrictionClass;
  if (netDrain < 10) {
    classification = "acceptable";
  } else if (netDrain < 50) {
    classification = "warning";
  } else {
    classification = "critical";
  }

  return { netDrain, contactFriction, aeroDrag, classification };
}

/**
 * Loop 4 — Gyroscopic Stability.
 *
 * IF |L| < critical_momentum → score=0, state="no_stability"
 * stability_ratio = |L| / |perturbation_torque|
 * IF ratio > 1.0 → score = 1.0 − |perturbation| / |L|, state="stable"
 * ELSE → score=0, state="gimbal_lock"
 */
export function computeGyroscopicStability(
  angularMomentum: number,
  perturbationTorque: number,
  criticalMomentum: number,
): GyroscopicResult {
  const absL = Math.abs(angularMomentum);
  const absPerturbation = Math.abs(perturbationTorque);

  if (absL < criticalMomentum) {
    return { score: 0, state: "no_stability", stabilityRatio: 0 };
  }

  const stabilityRatio =
    absPerturbation > 0 ? absL / absPerturbation : Infinity;

  if (stabilityRatio > 1.0) {
    const score = 1.0 - absPerturbation / absL;
    return { score, state: "stable", stabilityRatio };
  }

  return { score: 0, state: "gimbal_lock", stabilityRatio };
}

/**
 * Loop 5 — Elastic Equilibrium.
 *
 * strain = stress / elastic_modulus (default 1.0)
 * nominal → stress < yield_point
 * yield_exceeded → stress >= yield_point
 * fatigue_failure_imminent → fatigue_cycles > fatigue_limit (overrides above)
 */
export function computeElasticEquilibrium(
  stress: number,
  yieldPoint: number,
  fatigueCycles: number,
  fatigueLimit: number,
  elasticModulus: number = 1.0,
): ElasticResult {
  const strain = stress / elasticModulus;
  const cyclesRemaining = Math.max(0, fatigueLimit - fatigueCycles);

  let state: ElasticState = stress < yieldPoint ? "nominal" : "yield_exceeded";

  if (fatigueCycles > fatigueLimit) {
    state = "fatigue_failure_imminent";
  }

  return { state, strain, cyclesRemaining };
}

/**
 * Compute all 5 autonomous loop results from the 15-field FlywheelVitals snapshot.
 *
 * Field mapping:
 *   Loop 1 — churnRate → competition_pull, switchingCostIndex → switching_cost,
 *             valueDensity → value_density, community_identity fixed at 1.0
 *   Loop 2 — knowledgeBaseGrowth → inertia, executionVelocity → ω,
 *             overheadRatio → friction_per_step
 *   Loop 3 — overheadRatio → manual_processes, manualTouchpoints → human_touchpoints,
 *             executionVelocity → velocity, surface_area fixed at 1.0
 *   Loop 4 — L from Loop 2, scopeCreepIncidents → perturbation_torque
 *   Loop 5 — contributorLoad → stress, yield_point fixed at 1.0,
 *             fatigueCycleCount → fatigue_cycles
 */
export function computeFlywheelVitals(
  vitals: FlywheelVitals,
  thresholds: FlywheelThresholds = DEFAULT_THRESHOLDS,
): {
  rim: RimIntegrityResult;
  momentum: MomentumResult;
  friction: FrictionResult;
  gyroscopic: GyroscopicResult;
  elastic: ElasticResult;
} {
  const rim = computeRimIntegrity(
    vitals.churnRate,
    1,
    vitals.switchingCostIndex,
    1.0,
    vitals.valueDensity,
  );

  const momentum = computeMomentum(
    vitals.knowledgeBaseGrowth,
    vitals.executionVelocity,
    vitals.overheadRatio,
    thresholds.minMomentumForStability,
  );

  const friction = computeFriction(
    vitals.overheadRatio,
    vitals.manualTouchpoints,
    vitals.executionVelocity,
    1.0,
    vitals.automationCoverage,
  );

  const gyroscopic = computeGyroscopicStability(
    momentum.L,
    vitals.scopeCreepIncidents,
    thresholds.minMomentumForStability,
  );

  const elastic = computeElasticEquilibrium(
    vitals.contributorLoad,
    1.0,
    vitals.fatigueCycleCount,
    thresholds.maxFatigueCycles,
  );

  return { rim, momentum, friction, gyroscopic, elastic };
}

// ============================================================================
// VDAG Reality Gradient — Evidence Grading + Learning Loops
// ============================================================================

export type EvidenceQuality = "none" | "weak" | "moderate" | "strong";
export type RealityRating =
  | "testing_theater"
  | "safety_validated"
  | "efficacy_demonstrated"
  | "scale_confirmed"
  | "production_ready";
export type LearningLoopType = "single" | "double" | "triple";

export interface LoopEvidence {
  loopName: string;
  quality: EvidenceQuality;
  score: number;
  weight: number;
  achievedTarget: boolean;
}

export interface RealityGradient {
  score: number;
  rating: RealityRating;
  executable: boolean;
  perLoop: LoopEvidence[];
}

export interface LearningLoopResult {
  loopType: LearningLoopType;
  action: string;
}

const EVIDENCE_SCORES: Record<EvidenceQuality, number> = {
  none: 0,
  weak: 0.33,
  moderate: 0.66,
  strong: 1.0,
};

/**
 * Grade a single loop's evidence quality based on its state and margin ratio.
 *
 * Maps loop state strings to evidence quality levels:
 * - "default" → None (no data)
 * - "disintegrated", "stalled", "gimbal_lock", "fatigue_failure_imminent" → Strong (clear signal)
 * - "critical", "low", "no_stability" → Weak (ambiguous)
 * - "warning" → Moderate
 * - Healthy states: margin >= 50 → Strong, >= 10 → Moderate, else Weak
 */
export function gradeLoopEvidence(
  loopName: string,
  state: string,
  marginRatio: number,
  weight: number = 0.2,
): LoopEvidence {
  let quality: EvidenceQuality;

  const failureStates = [
    "disintegrated",
    "stalled",
    "gimbal_lock",
    "fatigue_failure_imminent",
  ];
  const weakStates = ["critical", "low", "no_stability"];

  if (state === "default") {
    quality = "none";
  } else if (failureStates.includes(state)) {
    quality = "strong";
  } else if (weakStates.includes(state)) {
    quality = "weak";
  } else if (state === "warning") {
    quality = "moderate";
  } else if (marginRatio >= 50) {
    quality = "strong";
  } else if (marginRatio >= 10) {
    quality = "moderate";
  } else {
    quality = "weak";
  }

  return {
    loopName,
    quality,
    score: EVIDENCE_SCORES[quality],
    weight,
    achievedTarget:
      !failureStates.includes(state) && !weakStates.includes(state),
  };
}

/**
 * Compute the Reality Gradient from an array of loop evidence results.
 *
 * Reality = Σ(weight × score) / Σ(weight)
 * Rating thresholds: <0.20 TestingTheater, <0.50 SafetyValidated,
 *   <0.80 EfficacyDemonstrated, <0.95 ScaleConfirmed, >=0.95 ProductionReady
 */
export function computeRealityGradient(
  loopResults: LoopEvidence[],
): RealityGradient {
  const totalWeight = loopResults.reduce((sum, e) => sum + e.weight, 0);
  const weightedScore =
    totalWeight > 0
      ? loopResults.reduce((sum, e) => sum + e.weight * e.score, 0) /
        totalWeight
      : 0;

  let rating: RealityRating;
  if (weightedScore < 0.2) {
    rating = "testing_theater";
  } else if (weightedScore < 0.5) {
    rating = "safety_validated";
  } else if (weightedScore < 0.8) {
    rating = "efficacy_demonstrated";
  } else if (weightedScore < 0.95) {
    rating = "scale_confirmed";
  } else {
    rating = "production_ready";
  }

  return {
    score: weightedScore,
    rating,
    executable: weightedScore >= 0.2,
    perLoop: loopResults,
  };
}

/**
 * Determine which learning loop to activate based on failure rate and evaluation count.
 *
 * - Triple: every 5th evaluation (question the model itself)
 * - Double: failure rate > 20% (question thresholds)
 * - Single: default (fix execution errors)
 */
export function analyzeLearningLoop(
  failureRate: number,
  evaluationCount: number,
): LearningLoopResult {
  if (evaluationCount > 0 && evaluationCount % 5 === 0) {
    return {
      loopType: "triple",
      action:
        "Question the loop model itself — are loop weights and evidence grading still appropriate?",
    };
  }

  if (failureRate > 20) {
    return {
      loopType: "double",
      action:
        "Question thresholds — failure rate exceeds 20%, thresholds may be miscalibrated",
    };
  }

  return {
    loopType: "single",
    action:
      "Fix execution errors — identify and correct the most recent failure",
  };
}
