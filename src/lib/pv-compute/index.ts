/**
 * PV Compute — Client-side pharmacovigilance computation library.
 *
 * All STEM domain math runs in the browser.
 * Zero server dependency. Instant results. Verifiable.
 *
 * Modules:
 *   signal-detection  — PRR, ROR, IC, EBGM, Chi-Square (5 algorithms)
 *   causality          — Naranjo ADR Scale, WHO-UMC System, RUCAM
 *   benefit-risk       — QBRI Calculator
 *   seriousness        — Seriousness classification, reporting deadlines
 *   severity           — CTCAE severity grading
 *   harm               — Harm type classification (A-H taxonomy)
 *   risk-score         — Multi-factor risk scoring
 *   safety-margin      — Safety margin zones
 *   irreversibility    — Action reversibility, point-of-no-return
 *   expectedness       — Expected vs unexpected event classification
 *   workflow           — Case workflow routing
 *   icsr               — ICSR triage, validation, completeness
 *   pbrer              — PBRER section assessment
 *   pmr-compliance     — PMR delay classification
 *   reporting          — Reporting deadlines and priorities
 *   surveillance       — Signal validation and triage
 *   comparator         — Drug comparison
 *   dossier            — Dossier completeness scoring
 *   portfolio          — Portfolio risk classification
 *   drift              — Drift direction and coverage
 *   operations         — Deadline urgency, signal strength, health traffic
 *   intelligence       — Intelligence state accumulation
 *   primitive-canvas   — Primitive composition and distance
 *   nexcore-census     — Data strings, boundaries, epistemic levels
 *   onboarding         — PV readiness assessment
 *   epidemiology       — RR, OR, AR, NNT, AF, PAF, incidence, prevalence, KM, SMR
 */

// ─── Signal Detection ────────────────────────────────────────────────────────
export { computeSignals } from "./signal-detection";
export type { ContingencyTable, SignalResult } from "./signal-detection";

/** Sync alias — computeSignals is already synchronous */
export { computeSignals as computeSignalsSync } from "./signal-detection";

// ─── Grounded Uncertainty ───────────────────────────────────────────────────
export {
  confidenceBand,
  deriveConfidence,
  prrUncertain,
  rorUncertain,
  evaluateAllUncertain,
} from "./uncertain";
export type { ConfidenceBand, UncertainValue } from "./uncertain";

// ─── Causality ───────────────────────────────────────────────────────────────
export { computeNaranjo, computeWhoUmc } from "./causality";
export type {
  NaranjoResult,
  TemporalRelationship,
  DechallengeResult,
  RechallengeResult,
  AlternativeCauses,
  WhoUmcInput,
  WhoUmcResult,
} from "./causality";

/** Sync aliases — these functions are already synchronous */
export { computeNaranjo as computeNaranjoSync } from "./causality";
export { computeWhoUmc as computeWhoUmcSync } from "./causality";

// ─── RUCAM Causality ─────────────────────────────────────────────────────────
export { computeRucam } from "./rucam";
export type {
  RucamReactionType,
  RucamCategory,
  RucamSerologyResult,
  RucamYesNoNa,
  RucamRechallengeResult,
  RucamBreakdown,
  RucamInput,
  RucamResult,
} from "./rucam";

/** Sync alias */
export { computeRucam as computeRucamSync } from "./rucam";

// ─── Benefit-Risk ────────────────────────────────────────────────────────────
export { computeQbri } from "./benefit-risk";
export type { BenefitRiskFactor, QbriResult } from "./benefit-risk";

/** Sync alias */
export { computeQbri as computeQbriSync } from "./benefit-risk";

// ─── Seriousness ─────────────────────────────────────────────────────────────
export {
  classifySeriousness,
  computeReportingDeadline,
  isSeriousEvent,
  getSeriousnessLevel,
  getSeriousnessLabel,
  getPriorityBadge,
} from "./seriousness";
export type {
  SeriousnessCriteria,
  SeriousnessClassification,
  SeriousnessCriterion,
  SeriousnessResult,
  DeadlineType,
  DeadlineInput,
  DeadlineResult,
  SeriousnessBoolResult,
  TrackerSeriousness,
  TrackerPriority,
  TrackerTrafficLevel,
  PriorityBadgeConfig,
} from "./seriousness";

// ─── Severity ────────────────────────────────────────────────────────────────
export { classifySeverity, ctcaeGradeToScore } from "./severity";
export type { SeverityTier, SeverityResult } from "./severity";

// ─── Harm Classification ─────────────────────────────────────────────────────
export { classifyHarmType } from "./harm";
export type {
  HarmTypeLetter,
  HarmProtocol,
  HarmSeverity,
  HarmTypeInput,
  HarmTypeResult,
} from "./harm";

// ─── Risk Score ──────────────────────────────────────────────────────────────
export { computeRiskScore, FACTOR_META, classifyHarmLevel } from "./risk-score";
export type {
  HarmLevel,
  RiskFactorMeta,
  RiskFactor,
  RiskScoreInput,
  RiskScoreResult,
} from "./risk-score";

// ─── Safety Margin ───────────────────────────────────────────────────────────
export {
  computeSafetyMargin,
  marginToScore,
  SAFETY_MARGIN_ZONES,
} from "./safety-margin";
export type { SafetyZone, SafetyMarginResult } from "./safety-margin";

// ─── Irreversibility ─────────────────────────────────────────────────────────
export {
  getAction,
  getAllActions,
  classifyReversibility,
  computeIrreversibilityScore,
  findPointOfNoReturn,
  getDeadlinePreset,
  STANDARD_FACTORS,
  DEADLINE_PRESETS,
} from "./irreversibility";
export type {
  ReversibilityLevel,
  PvActionCategory,
  PvAction,
  ReversibilityResult,
  IrreversibilityFactor,
  IrreversibilityScoreResult,
  UrgencyLevel,
  PointOfNoReturnResult,
  DeadlinePreset,
  DeadlinePresetConfig,
} from "./irreversibility";

// ─── Expectedness ────────────────────────────────────────────────────────────
export { checkExpectedness, isExpectedEvent } from "./expectedness";
export type {
  ExpectednessClassification,
  ExpectednessInput,
  ExpectednessResult,
  ExpectednessBoolResult,
} from "./expectedness";

// ─── Workflow ────────────────────────────────────────────────────────────────
export { routeWorkflow, routeFullCase } from "./workflow";
export type {
  WorkflowTaskType,
  WorkflowStartPoint,
  WorkflowInput,
  WorkflowRoute,
  CaseNextAction,
  CasePriority,
  CaseData,
  CaseRoute,
} from "./workflow";

// ─── ICSR Processing ─────────────────────────────────────────────────────────
export {
  triageCase,
  validateCaseIngest,
  checkCaseValidity,
  assessDataCompleteness,
  routeIntakeToTriage,
} from "./icsr";
export type {
  IcsrTriageInput,
  IcsrTriageResult,
  CaseIngestInput,
  CaseIngestResult,
  CaseValidityInput,
  CaseValidityResult,
  DataCompletenessInput,
  DataCompletenessResult,
  IntakeToTriageInput,
  IntakeToTriageResult,
} from "./icsr";

// ─── PBRER Assessment ────────────────────────────────────────────────────────
export { assessPbrerSection, assessAllPbrerSections } from "./pbrer";
export type {
  PbrerSectionId,
  PbrerSectionStatus,
  PbrerSectionInput,
  PbrerSectionResult,
  PbrerOverallResult,
} from "./pbrer";

// ─── PMR Compliance ──────────────────────────────────────────────────────────
export { classifyPmrDelay, classifyApplicantRisk } from "./pmr-compliance";
export type {
  PmrStatus,
  PmrClassification,
  PmrDelayInput,
  PmrDelayResult,
  ApplicantRiskLevel,
  ApplicantRiskResult,
} from "./pmr-compliance";

// ─── Reporting ───────────────────────────────────────────────────────────────
export {
  computeReportDeadline,
  computeReportingPriority,
  computeExpeditedReporting,
} from "./reporting";
export type {
  ReportDeadlineInput,
  ReportDeadlineResult,
  CausalityCategory,
  ReportingPriorityLevel,
  ReportingPriorityInput,
  ReportingPriorityResult,
  StudyType,
  ExpeditedTimeline,
  ExpeditedReportType,
  ExpeditedReportingInput,
  ExpeditedReportingResult,
} from "./reporting";

// ─── Surveillance ────────────────────────────────────────────────────────────
export { validateSignal, triageToSignal } from "./surveillance";
export type {
  SignalValidationInput,
  SignalValidationResult,
  TriageInput,
  TriageRoute,
  TriageResult,
} from "./surveillance";

// ─── Drug Comparison ─────────────────────────────────────────────────────────
export { compareDrugs } from "./comparator";
export type {
  Differential,
  ComparisonConfidence,
  DrugComparisonInput,
  DrugComparisonResult,
} from "./comparator";

// ─── Dossier ─────────────────────────────────────────────────────────────────
export { scoreDossierCompleteness } from "./dossier";
export type {
  DossierCompleteness,
  DossierInput,
  DossierResult,
} from "./dossier";

// ─── Portfolio ───────────────────────────────────────────────────────────────
export { classifyPortfolioRisk } from "./portfolio";
export type {
  RiskTier,
  PortfolioRiskInput,
  PortfolioRiskResult,
} from "./portfolio";

// ─── Drift ───────────────────────────────────────────────────────────────────
export {
  classifyDriftDirection,
  classifyDriftLevel,
  classifyCoverageTier,
} from "./drift";
export type {
  DriftDirection,
  CoverageTier,
  CoverageColor,
  DriftDirectionResult,
  DriftSeverityResult,
  CoverageTierResult,
} from "./drift";

// ─── Operations ──────────────────────────────────────────────────────────────
export {
  classifyDeadlineUrgency,
  classifySignalStrength,
  classifyHealthTraffic,
} from "./operations";
export type {
  DeadlineUrgencyResult,
  SignalStrengthResult,
  HealthTrafficResult,
} from "./operations";

// ─── Intelligence ────────────────────────────────────────────────────────────
export {
  createIntelligenceState,
  accumulateSignals,
  accumulateCausality,
  getActiveSignals,
  getSignalsForDrug,
  getSignalsForClass,
  getUnassessedSignals,
  getRecentInsights,
  serializeState,
  deserializeState,
} from "./intelligence";
export type {
  SignalMemory,
  CausalityMemory,
  Insight,
  Recommendation,
  IntelligenceState,
  AccumulationResult,
  IntelligenceVelocity,
} from "./intelligence";

// ─── Primitive Canvas ────────────────────────────────────────────────────────
export {
  PRIMITIVES,
  getPrimitive,
  checkConservation,
  compose,
  computeDistance,
  createCanvasState,
  serializeCanvas,
  deserializeCanvas,
} from "./primitive-canvas";
export type {
  Primitive,
  ConservationVerdict,
  ConservationResult,
  CompositionTier,
  Composition,
  DistanceVerdict,
  DistanceResult,
  CanvasState,
} from "./primitive-canvas";

// ─── NexCore Census ──────────────────────────────────────────────────────────
export {
  DATA_STRINGS,
  getDataString,
  createBoundary,
  threadBoundary,
  reconcileHierarchy,
  compareEpistemicLevels,
} from "./nexcore-census";
export type {
  StringId,
  DataString,
  BoundaryType,
  Boundary,
  EpistemicLevel,
  IntersectionResult,
  ReconciliationResult,
  SignalComparison,
} from "./nexcore-census";

// ─── Onboarding ──────────────────────────────────────────────────────────────
export { assessReadiness } from "./onboarding";
export type {
  ReadinessLevel,
  ReadinessInput,
  ReadinessResult,
} from "./onboarding";

// ─── Flywheel ────────────────────────────────────────────────────────────────
export {
  computeFlywheelVelocity,
  computeFlywheelComposite,
  computeNodeReadiness,
  DEFAULT_THRESHOLDS,
  computeRimIntegrity,
  computeMomentum,
  computeFriction,
  computeGyroscopicStability,
  computeElasticEquilibrium,
  computeFlywheelVitals,
  gradeLoopEvidence,
  computeRealityGradient,
  analyzeLearningLoop,
} from "./flywheel";
export type {
  FlywheelTier,
  FlywheelStatus,
  FlywheelNode,
  FlywheelVelocity,
  CompositeHealth,
  ReadinessScore,
  RimState,
  MomentumClass,
  FrictionClass,
  GyroscopicState,
  ElasticState,
  RimIntegrityResult,
  MomentumResult,
  FrictionResult,
  GyroscopicResult,
  ElasticResult,
  FlywheelVitals,
  FlywheelThresholds,
  EvidenceQuality,
  RealityRating,
  LearningLoopType,
  LoopEvidence,
  RealityGradient,
  LearningLoopResult,
} from "./flywheel";

// ─── Dashboard Metrics ───────────────────────────────────────────────────────
export { classifyMetric, metricHealthColor } from "./dashboard-metrics";
export type { MetricHealth, MetricClassification } from "./dashboard-metrics";

// ─── Signal Traffic ──────────────────────────────────────────────────────────
export { classifySignalCount, classifyEventAggregate } from "./signal-traffic";
export type { SignalCountResult, EventAggregateResult } from "./signal-traffic";

// ─── Risk Bridges ────────────────────────────────────────────────────────────
export { bridgeSignalToRisk, bridgeRiskToRegulatory } from "./risk-bridges";
export type {
  RiskInput,
  RegulatoryDecision,
  RegulatoryAction,
} from "./risk-bridges";

// ─── War Game ────────────────────────────────────────────────────────────────
export { classifyPrrStrength, classifyPayoffTier } from "./war-game";
export type {
  PrrStrength,
  PrrStrengthResult,
  PayoffTier,
  PayoffTierResult,
} from "./war-game";

// ─── Signal Fence ───────────────────────────────────────────────────────────
export {
  evaluateFence,
  computeFenceHealth,
  DEFAULT_FENCE_RULES,
  FENCE_METRIC_LABELS,
} from "./signal-fence";
export type {
  FenceMetricKey,
  FenceAction,
  FenceDecision,
  FenceRule,
  FenceSignal,
  FenceResult,
  FenceHealthStats,
} from "./signal-fence";

// ─── Signal Theory ──────────────────────────────────────────────────────────
export {
  computeA1DataGeneration,
  computeA2NoiseDominance,
  computeA3SignalExistence,
  assessAllAxioms,
} from "./signal-theory";
export type {
  AxiomVerdict,
  A1Result,
  A2Result,
  A3Result,
  CombinedAssessment,
} from "./signal-theory";

// ─── DataFrame ──────────────────────────────────────────────────────────────
export {
  parseCSV,
  isNumericColumn,
  groupByAndAggregate,
  sortGroupedRows,
} from "./dataframe";
export type { AggOp, AggSpec, ParsedTable, GroupedRow } from "./dataframe";

// ─── Epidemiology ───────────────────────────────────────────────────────────
export {
  computeRelativeRisk,
  computeOddsRatio,
  computeAttributableRisk,
  computeNNT,
  computeAttributableFraction,
  computePopulationAF,
  computeIncidenceRate,
  computePrevalence,
  computeKaplanMeier,
  computeSMR,
} from "../epi-compute";
export type {
  RelativeRiskResult,
  OddsRatioResult,
  AttributableRiskResult,
  NNTResult,
  AttributableFractionResult,
  PopulationAFResult,
  IncidenceRateResult,
  PrevalenceResult,
  KaplanMeierResult,
  KaplanMeierStep,
  SMRResult,
} from "../epi-compute";
