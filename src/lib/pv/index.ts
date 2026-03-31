/**
 * Pharmacovigilance Utilities
 *
 * Core PV calculation and reporting utilities extracted from
 * open-source implementations and adapted for TypeScript.
 *
 * @module lib/pv
 */

// Types
export * from './types';

// Age Group Calculator
export {
  calculateAgeGroup,
  getAgeGroupInfo,
  isPediatric,
  isGeriatric,
  AGE_GROUP_BOUNDARIES,
} from './age-groups';

// Seriousness Criteria
export {
  classifySeriousness,
  getSeriousnessE2BFields,
  isSeriousEvent,
  getCriterionInfo,
  parseOpenRIMSSeriousness,
  SERIOUSNESS_CRITERIA,
  type SeriousnessCriterionInfo,
  type SeriousnessE2BFields,
  type SeriousnessClassification,
} from './seriousness';

// E2B Report Structure
export {
  // Section Creators
  createE2BMessageHeader,
  createE2BSafetyReport,
  createE2BPrimarySource,
  createE2BPatient,
  createE2BReaction,
  createE2BDrug,
  // Mapping Functions
  mapReporterQualification,
  mapPatientSex,
  mapOutcomeToE2B,
  mapDrugCharacterization,
  // Constants
  E2B_ELEMENT_GUIDS,
  // Types
  type ReporterQualification,
  type PatientSex,
  type ReactionOutcome,
  type DrugCharacterization,
  type E2BMessageHeader,
  type E2BSafetyReport,
  type E2BPrimarySource,
  type E2BPatient,
  type E2BReaction,
  type E2BDrug,
} from './e2b';

// Domain Model (DDD Aggregates)
export {
  // Factory Functions
  createReportInstance,
  createPatientClinicalEvent,
  createReportMedication,
  createReportTask,
  // Workflow State Machine
  canTransitionTo,
  getNextAllowedStatuses,
  // Validation
  validateReportForE2B,
  isReportComplete,
  // Constants
  ReportClassification,
  WorkflowStatus,
  TaskType,
  TaskStatus,
  EventOutcome,
  ActionTaken,
  // Types
  type ReportClassificationValue,
  type WorkflowStatusValue,
  type TaskTypeValue,
  type TaskStatusValue,
  type EventOutcomeValue,
  type ActionTakenValue,
  type ReportInstance,
  type PatientClinicalEvent,
  type ReportMedication,
  type ReportTask,
  type ActivityLog,
  type E2BValidationResult,
  type CreateReportInstanceOptions,
  type CreatePatientClinicalEventOptions,
  type CreateReportMedicationOptions,
  type CreateReportTaskOptions,
} from './domain';

// MedDRA Hierarchy Navigator
export {
  // Constants
  MEDDRA_LEVELS,
  MEDDRA_LEVEL_ORDER,
  // Factory Functions
  createMedDRATerm,
  createMedDRAHierarchy,
  // Validation
  isValidMedDRACode,
  validateMedDRAHierarchy,
  // Utilities
  getMedDRALevelLabel,
  getMedDRALevelE2BCode,
  getParentLevel,
  getChildLevel,
  isAncestorOf,
  // Types
  type MedDRALevel,
  type MedDRATerm,
  type MedDRAHierarchy,
  type MedDRAValidationResult,
  type CreateMedDRATermOptions,
  type CreateMedDRAHierarchyOptions,
} from './meddra';

// Causality Assessment Algorithms
export {
  // Naranjo Algorithm
  NARANJO_QUESTIONS,
  calculateNaranjoScore,
  interpretNaranjoScore,
  createNaranjoAssessment,
  // WHO-UMC System
  WHO_UMC_CATEGORIES,
  assessWHOUMCCausality,
  getWHOUMCDescription,
  // Integration Utilities
  getCausalityStrength,
  compareCausalityMethods,
  // Types
  type NaranjoAnswer,
  type NaranjoQuestion,
  type NaranjoAssessment,
  type WHOUMCCriteria,
  type WHOUMCAssessment,
  type CausalityCategory,
  type CausalityComparison,
} from './causality';

// Signal Detection Algorithms
export {
  // High-Level API
  detectSignal,
  detectSignalBatch,
  isSignal,
  getSignalStrength,
  validateContingencyTable,
  // Core Calculation Functions
  calculatePRR,
  calculateROR,
  calculateIC,
  calculateHaldaneOR,
  calculateRelativeRisk,
  assessSignal,
  analyzeDisproportionality,
  // Threshold Presets
  DEFAULT_SIGNAL_THRESHOLDS,
  EVANS_THRESHOLDS,
  CONSERVATIVE_THRESHOLDS,
  SENSITIVE_THRESHOLDS,
  WHO_THRESHOLDS,
  // Types
  type ContingencyTable,
  type PRRResult,
  type RORResult,
  type ICResult,
  type BayesianResult,
  type DisproportionalityResult,
  type SignalThresholds,
  type SignalStrength,
  type SignalAssessment,
  type ContingencyAnalysisResult,
  type SignalDetectionInput,
  type SignalDetectionResult,
  type BatchSignalInput,
  type BatchSignalResult,
} from './signal-detection';
