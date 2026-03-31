/**
 * Tests for Adverse Event Domain Model
 *
 * Based on OpenRIMS-PV ReportInstance aggregate patterns and
 * ICH E2B(R3) ICSR domain structure.
 *
 * Domain Model Components:
 * - ReportInstance: The case/report aggregate root
 * - PatientClinicalEvent: Adverse event within a case
 * - ReportMedication: Drug associated with a case
 * - ReportTask: Workflow task for case processing
 * - ActivityLog: Audit trail entry
 */

import {
  // Workflow States
  ReportClassification,
  WorkflowStatus,
  TaskType,
  TaskStatus,
  EventOutcome,
  ActionTaken,
  // Factory Functions
  createReportInstance,
  createPatientClinicalEvent,
  createReportMedication,
  createReportTask,
  // Validation
  validateReportForE2B,
  isReportComplete,
  // State Transitions
  canTransitionTo,
  getNextAllowedStatuses,
} from '../domain';

describe('ReportInstance (Case Aggregate Root)', () => {
  describe('createReportInstance', () => {
    it('should create a new report with default values', () => {
      const report = createReportInstance({
        patientIdentifier: 'PAT-001',
        sourceIdentifier: 'SRC-2023-001',
      });

      expect(report.id).toBeDefined();
      expect(report.guid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(report.patientIdentifier).toBe('PAT-001');
      expect(report.sourceIdentifier).toBe('SRC-2023-001');
      expect(report.classification).toBe(ReportClassification.Unclassified);
      expect(report.workflowStatus).toBe(WorkflowStatus.New);
      expect(report.clinicalEvents).toEqual([]);
      expect(report.medications).toEqual([]);
      expect(report.tasks).toEqual([]);
      expect(report.activityLog.length).toBe(1);
      expect(report.activityLog[0].action).toBe('created');
      expect(report.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique identifier based on workflow and sequence', () => {
      const report = createReportInstance({
        patientIdentifier: 'PAT-001',
        sourceIdentifier: 'SRC-001',
        workflowId: 'SPONT',
        sequenceNumber: 42,
      });

      const year = new Date().getUTCFullYear();
      expect(report.identifier).toBe(`SPONT/${year}/000042`);
    });

    it('should set initial classification when provided', () => {
      const report = createReportInstance({
        patientIdentifier: 'PAT-001',
        sourceIdentifier: 'SRC-001',
        classification: ReportClassification.SAE,
      });

      expect(report.classification).toBe(ReportClassification.SAE);
    });
  });

  describe('ReportClassification', () => {
    it('should have correct classification values', () => {
      expect(ReportClassification.Unclassified).toBe('unclassified');
      expect(ReportClassification.AESI).toBe('aesi');
      expect(ReportClassification.SAE).toBe('sae');
      expect(ReportClassification.ClinicallySignificant).toBe('clinically_significant');
    });
  });
});

describe('WorkflowStatus (E2B Progression)', () => {
  it('should have correct workflow status values', () => {
    expect(WorkflowStatus.New).toBe('new');
    expect(WorkflowStatus.Confirmed).toBe('confirmed');
    expect(WorkflowStatus.CausalitySet).toBe('causality_set');
    expect(WorkflowStatus.CausalityConfirmed).toBe('causality_confirmed');
    expect(WorkflowStatus.E2BGenerated).toBe('e2b_generated');
    expect(WorkflowStatus.E2BSubmitted).toBe('e2b_submitted');
    expect(WorkflowStatus.Closed).toBe('closed');
  });

  describe('canTransitionTo', () => {
    it('should allow New -> Confirmed', () => {
      expect(canTransitionTo(WorkflowStatus.New, WorkflowStatus.Confirmed)).toBe(true);
    });

    it('should allow Confirmed -> CausalitySet', () => {
      expect(canTransitionTo(WorkflowStatus.Confirmed, WorkflowStatus.CausalitySet)).toBe(true);
    });

    it('should allow CausalitySet -> CausalityConfirmed', () => {
      expect(canTransitionTo(WorkflowStatus.CausalitySet, WorkflowStatus.CausalityConfirmed)).toBe(true);
    });

    it('should allow CausalityConfirmed -> E2BGenerated', () => {
      expect(canTransitionTo(WorkflowStatus.CausalityConfirmed, WorkflowStatus.E2BGenerated)).toBe(true);
    });

    it('should allow E2BGenerated -> E2BSubmitted', () => {
      expect(canTransitionTo(WorkflowStatus.E2BGenerated, WorkflowStatus.E2BSubmitted)).toBe(true);
    });

    it('should allow E2BSubmitted -> Closed', () => {
      expect(canTransitionTo(WorkflowStatus.E2BSubmitted, WorkflowStatus.Closed)).toBe(true);
    });

    it('should NOT allow skipping states (New -> E2BGenerated)', () => {
      expect(canTransitionTo(WorkflowStatus.New, WorkflowStatus.E2BGenerated)).toBe(false);
    });

    it('should NOT allow backward transitions (E2BSubmitted -> New)', () => {
      expect(canTransitionTo(WorkflowStatus.E2BSubmitted, WorkflowStatus.New)).toBe(false);
    });

    it('should allow any status to transition to Closed', () => {
      expect(canTransitionTo(WorkflowStatus.New, WorkflowStatus.Closed)).toBe(true);
      expect(canTransitionTo(WorkflowStatus.Confirmed, WorkflowStatus.Closed)).toBe(true);
    });
  });

  describe('getNextAllowedStatuses', () => {
    it('should return allowed next statuses for New', () => {
      const allowed = getNextAllowedStatuses(WorkflowStatus.New);
      expect(allowed).toContain(WorkflowStatus.Confirmed);
      expect(allowed).toContain(WorkflowStatus.Closed);
      expect(allowed).not.toContain(WorkflowStatus.E2BGenerated);
    });

    it('should return empty array for Closed', () => {
      const allowed = getNextAllowedStatuses(WorkflowStatus.Closed);
      expect(allowed).toEqual([]);
    });
  });
});

describe('PatientClinicalEvent', () => {
  describe('createPatientClinicalEvent', () => {
    it('should create a clinical event with required fields', () => {
      const event = createPatientClinicalEvent({
        reportInstanceId: 'RPT-001',
        description: 'Severe headache after medication',
        onsetDate: new Date('2023-05-01'),
      });

      expect(event.id).toBeDefined();
      expect(event.reportInstanceId).toBe('RPT-001');
      expect(event.description).toBe('Severe headache after medication');
      expect(event.onsetDate).toEqual(new Date('2023-05-01'));
      expect(event.outcome).toBe(EventOutcome.Unknown);
    });

    it('should include MedDRA coding when provided', () => {
      const event = createPatientClinicalEvent({
        reportInstanceId: 'RPT-001',
        description: 'Headache',
        onsetDate: new Date('2023-05-01'),
        meddraLLT: 'Headache',
        meddraLLTCode: '10019211',
        meddraPT: 'Headache',
        meddraPTCode: '10019211',
      });

      expect(event.meddraLLT).toBe('Headache');
      expect(event.meddraLLTCode).toBe('10019211');
      expect(event.meddraPT).toBe('Headache');
      expect(event.meddraPTCode).toBe('10019211');
    });

    it('should include seriousness criteria when provided', () => {
      const event = createPatientClinicalEvent({
        reportInstanceId: 'RPT-001',
        description: 'Anaphylaxis',
        onsetDate: new Date('2023-05-01'),
        isSerious: true,
        seriousnessCriteria: ['life_threatening', 'hospitalization'],
      });

      expect(event.isSerious).toBe(true);
      expect(event.seriousnessCriteria).toContain('life_threatening');
      expect(event.seriousnessCriteria).toContain('hospitalization');
    });

    it('should set resolution date and outcome', () => {
      const event = createPatientClinicalEvent({
        reportInstanceId: 'RPT-001',
        description: 'Rash',
        onsetDate: new Date('2023-05-01'),
        resolutionDate: new Date('2023-05-10'),
        outcome: EventOutcome.Recovered,
      });

      expect(event.resolutionDate).toEqual(new Date('2023-05-10'));
      expect(event.outcome).toBe(EventOutcome.Recovered);
    });
  });

  describe('EventOutcome', () => {
    it('should have correct outcome values matching E2B', () => {
      expect(EventOutcome.Recovered).toBe('recovered');
      expect(EventOutcome.Recovering).toBe('recovering');
      expect(EventOutcome.NotRecovered).toBe('not_recovered');
      expect(EventOutcome.RecoveredWithSequelae).toBe('recovered_with_sequelae');
      expect(EventOutcome.Fatal).toBe('fatal');
      expect(EventOutcome.Unknown).toBe('unknown');
    });
  });
});

describe('ReportMedication', () => {
  describe('createReportMedication', () => {
    it('should create a medication with required fields', () => {
      const med = createReportMedication({
        reportInstanceId: 'RPT-001',
        medicinalProduct: 'Aspirin 100mg',
        characterization: 'suspect',
      });

      expect(med.id).toBeDefined();
      expect(med.reportInstanceId).toBe('RPT-001');
      expect(med.medicinalProduct).toBe('Aspirin 100mg');
      expect(med.characterization).toBe('suspect');
    });

    it('should include dosage information', () => {
      const med = createReportMedication({
        reportInstanceId: 'RPT-001',
        medicinalProduct: 'Metformin',
        characterization: 'suspect',
        dose: 500,
        doseUnit: 'mg',
        frequency: 'twice daily',
        route: 'oral',
      });

      expect(med.dose).toBe(500);
      expect(med.doseUnit).toBe('mg');
      expect(med.frequency).toBe('twice daily');
      expect(med.route).toBe('oral');
    });

    it('should include treatment dates', () => {
      const med = createReportMedication({
        reportInstanceId: 'RPT-001',
        medicinalProduct: 'Drug A',
        characterization: 'suspect',
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-04-10'),
      });

      expect(med.startDate).toEqual(new Date('2023-04-01'));
      expect(med.endDate).toEqual(new Date('2023-04-10'));
    });

    it('should include causality assessment', () => {
      const med = createReportMedication({
        reportInstanceId: 'RPT-001',
        medicinalProduct: 'Drug B',
        characterization: 'suspect',
        naranjoCausality: 'probable',
        whoCausality: 'probable',
      });

      expect(med.naranjoCausality).toBe('probable');
      expect(med.whoCausality).toBe('probable');
    });

    it('should include action taken', () => {
      const med = createReportMedication({
        reportInstanceId: 'RPT-001',
        medicinalProduct: 'Drug C',
        characterization: 'suspect',
        actionTaken: ActionTaken.Withdrawn,
      });

      expect(med.actionTaken).toBe(ActionTaken.Withdrawn);
    });
  });

  describe('ActionTaken', () => {
    it('should have correct action values', () => {
      expect(ActionTaken.Withdrawn).toBe('withdrawn');
      expect(ActionTaken.DoseReduced).toBe('dose_reduced');
      expect(ActionTaken.DoseIncreased).toBe('dose_increased');
      expect(ActionTaken.DoseNotChanged).toBe('dose_not_changed');
      expect(ActionTaken.Unknown).toBe('unknown');
      expect(ActionTaken.NotApplicable).toBe('not_applicable');
    });
  });
});

describe('ReportTask', () => {
  describe('createReportTask', () => {
    it('should create a task with required fields', () => {
      const task = createReportTask({
        reportInstanceId: 'RPT-001',
        taskType: TaskType.CausalityReview,
      });

      expect(task.id).toBeDefined();
      expect(task.reportInstanceId).toBe('RPT-001');
      expect(task.taskType).toBe(TaskType.CausalityReview);
      expect(task.status).toBe(TaskStatus.New);
      expect(task.createdAt).toBeInstanceOf(Date);
    });

    it('should include assignee when provided', () => {
      const task = createReportTask({
        reportInstanceId: 'RPT-001',
        taskType: TaskType.MedDRACoding,
        assignedTo: 'user-123',
      });

      expect(task.assignedTo).toBe('user-123');
    });

    it('should include due date when provided', () => {
      const dueDate = new Date('2023-06-01');
      const task = createReportTask({
        reportInstanceId: 'RPT-001',
        taskType: TaskType.RegulatorySubmission,
        dueDate,
      });

      expect(task.dueDate).toEqual(dueDate);
    });
  });

  describe('TaskType', () => {
    it('should have correct task types', () => {
      expect(TaskType.DataQuality).toBe('data_quality');
      expect(TaskType.CausalityReview).toBe('causality_review');
      expect(TaskType.MedDRACoding).toBe('meddra_coding');
      expect(TaskType.RegulatorySubmission).toBe('regulatory_submission');
      expect(TaskType.FollowUp).toBe('follow_up');
      expect(TaskType.MedicalReview).toBe('medical_review');
    });
  });

  describe('TaskStatus', () => {
    it('should have correct task statuses', () => {
      expect(TaskStatus.New).toBe('new');
      expect(TaskStatus.Acknowledged).toBe('acknowledged');
      expect(TaskStatus.InProgress).toBe('in_progress');
      expect(TaskStatus.OnHold).toBe('on_hold');
      expect(TaskStatus.Completed).toBe('completed');
      expect(TaskStatus.Cancelled).toBe('cancelled');
    });
  });
});

describe('Report Validation', () => {
  describe('validateReportForE2B', () => {
    it('should return valid for complete report', () => {
      const report = createReportInstance({
        patientIdentifier: 'PAT-001',
        sourceIdentifier: 'SRC-001',
      });

      // Add required data
      report.clinicalEvents.push(
        createPatientClinicalEvent({
          reportInstanceId: report.id,
          description: 'Adverse event',
          onsetDate: new Date('2023-05-01'),
          meddraLLT: 'Event',
          meddraLLTCode: '10000001',
        })
      );

      report.medications.push(
        createReportMedication({
          reportInstanceId: report.id,
          medicinalProduct: 'Drug A',
          characterization: 'suspect',
        })
      );

      const validation = validateReportForE2B(report);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should return errors for missing clinical events', () => {
      const report = createReportInstance({
        patientIdentifier: 'PAT-001',
        sourceIdentifier: 'SRC-001',
      });

      const validation = validateReportForE2B(report);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('At least one clinical event is required');
    });

    it('should return errors for missing suspect medication', () => {
      const report = createReportInstance({
        patientIdentifier: 'PAT-001',
        sourceIdentifier: 'SRC-001',
      });

      report.clinicalEvents.push(
        createPatientClinicalEvent({
          reportInstanceId: report.id,
          description: 'Event',
          onsetDate: new Date('2023-05-01'),
        })
      );

      const validation = validateReportForE2B(report);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('At least one suspect medication is required');
    });

    it('should return errors for missing MedDRA coding', () => {
      const report = createReportInstance({
        patientIdentifier: 'PAT-001',
        sourceIdentifier: 'SRC-001',
      });

      report.clinicalEvents.push(
        createPatientClinicalEvent({
          reportInstanceId: report.id,
          description: 'Event without coding',
          onsetDate: new Date('2023-05-01'),
          // No MedDRA coding
        })
      );

      report.medications.push(
        createReportMedication({
          reportInstanceId: report.id,
          medicinalProduct: 'Drug A',
          characterization: 'suspect',
        })
      );

      const validation = validateReportForE2B(report);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('All clinical events must have MedDRA coding');
    });
  });

  describe('isReportComplete', () => {
    it('should return true when all required fields are present', () => {
      const report = createReportInstance({
        patientIdentifier: 'PAT-001',
        sourceIdentifier: 'SRC-001',
      });

      report.clinicalEvents.push(
        createPatientClinicalEvent({
          reportInstanceId: report.id,
          description: 'Event',
          onsetDate: new Date('2023-05-01'),
          meddraLLT: 'Event',
          meddraLLTCode: '10000001',
          outcome: EventOutcome.Recovered,
        })
      );

      report.medications.push(
        createReportMedication({
          reportInstanceId: report.id,
          medicinalProduct: 'Drug A',
          characterization: 'suspect',
          naranjoCausality: 'probable',
        })
      );

      expect(isReportComplete(report)).toBe(true);
    });

    it('should return false when causality assessment is missing', () => {
      const report = createReportInstance({
        patientIdentifier: 'PAT-001',
        sourceIdentifier: 'SRC-001',
      });

      report.clinicalEvents.push(
        createPatientClinicalEvent({
          reportInstanceId: report.id,
          description: 'Event',
          onsetDate: new Date('2023-05-01'),
          meddraLLT: 'Event',
          meddraLLTCode: '10000001',
        })
      );

      report.medications.push(
        createReportMedication({
          reportInstanceId: report.id,
          medicinalProduct: 'Drug A',
          characterization: 'suspect',
          // No causality assessment
        })
      );

      expect(isReportComplete(report)).toBe(false);
    });
  });
});

describe('ActivityLog (Audit Trail)', () => {
  it('should log activity when report is created', () => {
    const report = createReportInstance({
      patientIdentifier: 'PAT-001',
      sourceIdentifier: 'SRC-001',
    });

    expect(report.activityLog.length).toBe(1);
    expect(report.activityLog[0].action).toBe('created');
    expect(report.activityLog[0].timestamp).toBeInstanceOf(Date);
  });
});
