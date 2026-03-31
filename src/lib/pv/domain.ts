/**
 * Adverse Event Domain Model
 *
 * Domain-driven design types and factories for pharmacovigilance case management.
 * Based on OpenRIMS-PV ReportInstance aggregate patterns and ICH E2B(R3) structure.
 *
 * @module lib/pv/domain
 */

import { randomUUID } from 'crypto';
import type {
  SeriousnessCriterion,
  NaranjoCausality,
  WHOUMCCausality,
  DrugCharacterization,
} from './types';

// ============================================================================
// ENUMS / CONSTANTS
// ============================================================================

/**
 * Report classification levels
 * ICH E2D severity categories
 */
export const ReportClassification = {
  Unclassified: 'unclassified',
  AESI: 'aesi', // Adverse Event of Special Interest
  SAE: 'sae', // Serious Adverse Event
  ClinicallySignificant: 'clinically_significant',
} as const;

export type ReportClassificationValue =
  (typeof ReportClassification)[keyof typeof ReportClassification];

/**
 * Workflow status for E2B case progression
 * OpenRIMS ActivityExecutionStatus pattern
 */
export const WorkflowStatus = {
  New: 'new',
  Confirmed: 'confirmed',
  CausalitySet: 'causality_set',
  CausalityConfirmed: 'causality_confirmed',
  E2BGenerated: 'e2b_generated',
  E2BSubmitted: 'e2b_submitted',
  Closed: 'closed',
} as const;

export type WorkflowStatusValue =
  (typeof WorkflowStatus)[keyof typeof WorkflowStatus];

/**
 * Task types for case processing workflow
 */
export const TaskType = {
  DataQuality: 'data_quality',
  CausalityReview: 'causality_review',
  MedDRACoding: 'meddra_coding',
  RegulatorySubmission: 'regulatory_submission',
  FollowUp: 'follow_up',
  MedicalReview: 'medical_review',
} as const;

export type TaskTypeValue = (typeof TaskType)[keyof typeof TaskType];

/**
 * Task status for workflow tracking
 */
export const TaskStatus = {
  New: 'new',
  Acknowledged: 'acknowledged',
  InProgress: 'in_progress',
  OnHold: 'on_hold',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const;

export type TaskStatusValue = (typeof TaskStatus)[keyof typeof TaskStatus];

/**
 * Adverse event outcome
 * ICH E2B E.i.7
 */
export const EventOutcome = {
  Recovered: 'recovered',
  Recovering: 'recovering',
  NotRecovered: 'not_recovered',
  RecoveredWithSequelae: 'recovered_with_sequelae',
  Fatal: 'fatal',
  Unknown: 'unknown',
} as const;

export type EventOutcomeValue = (typeof EventOutcome)[keyof typeof EventOutcome];

/**
 * Action taken with drug
 * ICH E2B G.k.8
 */
export const ActionTaken = {
  Withdrawn: 'withdrawn',
  DoseReduced: 'dose_reduced',
  DoseIncreased: 'dose_increased',
  DoseNotChanged: 'dose_not_changed',
  Unknown: 'unknown',
  NotApplicable: 'not_applicable',
} as const;

export type ActionTakenValue = (typeof ActionTaken)[keyof typeof ActionTaken];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Activity log entry for audit trail
 * 21 CFR Part 11 compliance
 */
export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  userId?: string;
  details?: Record<string, unknown>;
}

/**
 * Report task for case processing
 * OpenRIMS ReportInstanceTask pattern
 */
export interface ReportTask {
  id: string;
  reportInstanceId: string;
  taskType: TaskTypeValue;
  status: TaskStatusValue;
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Medication associated with a case
 * OpenRIMS ReportInstanceMedication pattern
 * ICH E2B G.k structure
 */
export interface ReportMedication {
  id: string;
  reportInstanceId: string;
  medicinalProduct: string;
  characterization: DrugCharacterization;
  dose?: number;
  doseUnit?: string;
  frequency?: string;
  route?: string;
  indication?: string;
  startDate?: Date;
  endDate?: Date;
  batchNumber?: string;
  naranjoCausality?: NaranjoCausality;
  whoCausality?: WHOUMCCausality;
  actionTaken?: ActionTakenValue;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Clinical event (adverse event) within a case
 * OpenRIMS PatientClinicalEvent pattern
 * ICH E2B E.i structure
 */
export interface PatientClinicalEvent {
  id: string;
  reportInstanceId: string;
  description: string;
  onsetDate: Date;
  resolutionDate?: Date;
  outcome: EventOutcomeValue;
  isSerious?: boolean;
  seriousnessCriteria?: SeriousnessCriterion[];
  meddraLLT?: string;
  meddraLLTCode?: string;
  meddraPT?: string;
  meddraPTCode?: string;
  meddraSOC?: string;
  meddraSOCCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Report instance (case) aggregate root
 * OpenRIMS ReportInstance pattern
 * ICH E2B ICSR structure
 */
export interface ReportInstance {
  id: string;
  guid: string;
  identifier: string;
  patientIdentifier: string;
  sourceIdentifier: string;
  classification: ReportClassificationValue;
  workflowStatus: WorkflowStatusValue;
  workflowId?: string;
  sequenceNumber?: number;
  clinicalEvents: PatientClinicalEvent[];
  medications: ReportMedication[];
  tasks: ReportTask[];
  activityLog: ActivityLog[];
  createdAt: Date;
  updatedAt: Date;
  finishedAt?: Date;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Options for creating a ReportInstance
 */
export interface CreateReportInstanceOptions {
  patientIdentifier: string;
  sourceIdentifier: string;
  classification?: ReportClassificationValue;
  workflowId?: string;
  sequenceNumber?: number;
}

/**
 * Creates a new ReportInstance (case aggregate root)
 */
export function createReportInstance(
  options: CreateReportInstanceOptions
): ReportInstance {
  const now = new Date();
  const id = randomUUID();
  const year = now.getUTCFullYear();
  const seq = options.sequenceNumber ?? 1;
  const workflowId = options.workflowId ?? 'SPONT';

  const identifier = `${workflowId}/${year}/${String(seq).padStart(6, '0')}`;

  const report: ReportInstance = {
    id,
    guid: randomUUID(),
    identifier,
    patientIdentifier: options.patientIdentifier,
    sourceIdentifier: options.sourceIdentifier,
    classification: options.classification ?? ReportClassification.Unclassified,
    workflowStatus: WorkflowStatus.New,
    workflowId,
    sequenceNumber: seq,
    clinicalEvents: [],
    medications: [],
    tasks: [],
    activityLog: [
      {
        id: randomUUID(),
        timestamp: now,
        action: 'created',
        details: {
          patientIdentifier: options.patientIdentifier,
          sourceIdentifier: options.sourceIdentifier,
        },
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  return report;
}

/**
 * Options for creating a PatientClinicalEvent
 */
export interface CreatePatientClinicalEventOptions {
  reportInstanceId: string;
  description: string;
  onsetDate: Date;
  resolutionDate?: Date;
  outcome?: EventOutcomeValue;
  isSerious?: boolean;
  seriousnessCriteria?: SeriousnessCriterion[];
  meddraLLT?: string;
  meddraLLTCode?: string;
  meddraPT?: string;
  meddraPTCode?: string;
  meddraSOC?: string;
  meddraSOCCode?: string;
}

/**
 * Creates a new PatientClinicalEvent (adverse event)
 */
export function createPatientClinicalEvent(
  options: CreatePatientClinicalEventOptions
): PatientClinicalEvent {
  const now = new Date();

  return {
    id: randomUUID(),
    reportInstanceId: options.reportInstanceId,
    description: options.description,
    onsetDate: options.onsetDate,
    resolutionDate: options.resolutionDate,
    outcome: options.outcome ?? EventOutcome.Unknown,
    isSerious: options.isSerious,
    seriousnessCriteria: options.seriousnessCriteria,
    meddraLLT: options.meddraLLT,
    meddraLLTCode: options.meddraLLTCode,
    meddraPT: options.meddraPT,
    meddraPTCode: options.meddraPTCode,
    meddraSOC: options.meddraSOC,
    meddraSOCCode: options.meddraSOCCode,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Options for creating a ReportMedication
 */
export interface CreateReportMedicationOptions {
  reportInstanceId: string;
  medicinalProduct: string;
  characterization: DrugCharacterization;
  dose?: number;
  doseUnit?: string;
  frequency?: string;
  route?: string;
  indication?: string;
  startDate?: Date;
  endDate?: Date;
  batchNumber?: string;
  naranjoCausality?: NaranjoCausality;
  whoCausality?: WHOUMCCausality;
  actionTaken?: ActionTakenValue;
}

/**
 * Creates a new ReportMedication
 */
export function createReportMedication(
  options: CreateReportMedicationOptions
): ReportMedication {
  const now = new Date();

  return {
    id: randomUUID(),
    reportInstanceId: options.reportInstanceId,
    medicinalProduct: options.medicinalProduct,
    characterization: options.characterization,
    dose: options.dose,
    doseUnit: options.doseUnit,
    frequency: options.frequency,
    route: options.route,
    indication: options.indication,
    startDate: options.startDate,
    endDate: options.endDate,
    batchNumber: options.batchNumber,
    naranjoCausality: options.naranjoCausality,
    whoCausality: options.whoCausality,
    actionTaken: options.actionTaken,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Options for creating a ReportTask
 */
export interface CreateReportTaskOptions {
  reportInstanceId: string;
  taskType: TaskTypeValue;
  assignedTo?: string;
  dueDate?: Date;
  comments?: string;
}

/**
 * Creates a new ReportTask
 */
export function createReportTask(options: CreateReportTaskOptions): ReportTask {
  const now = new Date();

  return {
    id: randomUUID(),
    reportInstanceId: options.reportInstanceId,
    taskType: options.taskType,
    status: TaskStatus.New,
    assignedTo: options.assignedTo,
    dueDate: options.dueDate,
    comments: options.comments,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// WORKFLOW STATE MACHINE
// ============================================================================

/**
 * Valid workflow transitions
 * Defines the allowed state machine paths
 */
const WORKFLOW_TRANSITIONS: Record<WorkflowStatusValue, WorkflowStatusValue[]> = {
  [WorkflowStatus.New]: [WorkflowStatus.Confirmed, WorkflowStatus.Closed],
  [WorkflowStatus.Confirmed]: [WorkflowStatus.CausalitySet, WorkflowStatus.Closed],
  [WorkflowStatus.CausalitySet]: [
    WorkflowStatus.CausalityConfirmed,
    WorkflowStatus.Closed,
  ],
  [WorkflowStatus.CausalityConfirmed]: [
    WorkflowStatus.E2BGenerated,
    WorkflowStatus.Closed,
  ],
  [WorkflowStatus.E2BGenerated]: [WorkflowStatus.E2BSubmitted, WorkflowStatus.Closed],
  [WorkflowStatus.E2BSubmitted]: [WorkflowStatus.Closed],
  [WorkflowStatus.Closed]: [],
};

/**
 * Checks if a workflow status transition is valid
 */
export function canTransitionTo(
  fromStatus: WorkflowStatusValue,
  toStatus: WorkflowStatusValue
): boolean {
  const allowedTransitions = WORKFLOW_TRANSITIONS[fromStatus];
  return allowedTransitions.includes(toStatus);
}

/**
 * Gets the next allowed workflow statuses
 */
export function getNextAllowedStatuses(
  currentStatus: WorkflowStatusValue
): WorkflowStatusValue[] {
  return WORKFLOW_TRANSITIONS[currentStatus] ?? [];
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * E2B validation result
 */
export interface E2BValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validates a report for E2B submission readiness
 */
export function validateReportForE2B(report: ReportInstance): E2BValidationResult {
  const errors: string[] = [];

  // Must have at least one clinical event
  if (report.clinicalEvents.length === 0) {
    errors.push('At least one clinical event is required');
  }

  // Must have at least one suspect medication
  const suspectMeds = report.medications.filter(
    (m) => m.characterization === 'suspect'
  );
  if (suspectMeds.length === 0) {
    errors.push('At least one suspect medication is required');
  }

  // All clinical events must have MedDRA coding
  const uncodedEvents = report.clinicalEvents.filter(
    (e) => !e.meddraLLT || !e.meddraLLTCode
  );
  if (uncodedEvents.length > 0) {
    errors.push('All clinical events must have MedDRA coding');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if a report is complete (ready for E2B generation)
 */
export function isReportComplete(report: ReportInstance): boolean {
  // Basic validation must pass
  const validation = validateReportForE2B(report);
  if (!validation.isValid) {
    return false;
  }

  // All suspect medications must have causality assessment
  const suspectMeds = report.medications.filter(
    (m) => m.characterization === 'suspect'
  );
  const hasAllCausality = suspectMeds.every(
    (m) => m.naranjoCausality || m.whoCausality
  );
  if (!hasAllCausality) {
    return false;
  }

  return true;
}
