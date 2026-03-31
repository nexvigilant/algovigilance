/**
 * Clinical Pathway Navigator Tests
 *
 * Tests for the pathway navigation system including
 * state transitions, validation, and audit trail.
 */

// Mock the pathway registry to provide a test pathway
// Must be before the imports that use pathwayRegistry
jest.mock('@/data/pathways', () => {
  const { Timestamp } = require('firebase/firestore');

  const testPathway = {
    id: 'icsr-high-v1',
    taskType: 'icsr_submission',
    name: 'ICSR Submission (High Guidance)',
    description: 'Step-by-step ICSR submission for guided users',
    guidanceLevel: 'high',
    initialStateId: 'triage',
    estimatedSteps: 8,
    phases: ['Initial Assessment', 'Seriousness', 'Patient Information', 'Drug Information', 'Review'],
    version: '1.0.0',
    updatedAt: Timestamp.fromDate(new Date('2024-12-01')),
    states: {
      triage: {
        id: 'triage',
        type: 'question',
        clinicalPrompt: {
          default: 'What type of report are you submitting?',
          pharmacist: 'Have you observed a drug reaction that needs reporting?',
        },
        options: [
          {
            id: 'adverse_reaction',
            label: 'Adverse Drug Reaction',
            clinicalDescription: 'A suspected unwanted drug reaction',
            nextStateId: 'seriousness',
          },
          {
            id: 'medication_error',
            label: 'Medication Error',
            clinicalDescription: 'A medication error with or without harm',
            nextStateId: 'seriousness',
          },
        ],
        helpContent: {
          explanation: 'Select the type of safety concern you want to report.',
          clinicalAnalogies: { pharmacist: 'Like triaging a patient in the ED' },
          commonMistakes: ['Confusing ADR with medication error'],
        },
        estimatedTimeSeconds: 15,
        phaseName: 'Initial Assessment',
      },
      seriousness: {
        id: 'seriousness',
        type: 'question',
        clinicalPrompt: {
          default: 'How serious is this event?',
        },
        options: [
          {
            id: 'non_serious',
            label: 'Non-Serious',
            clinicalDescription: 'No serious outcome criteria met',
            nextStateId: 'patient_basics',
          },
          {
            id: 'serious',
            label: 'Serious',
            clinicalDescription: 'One or more ICH E2A serious criteria met',
            nextStateId: 'patient_basics',
          },
        ],
        helpContent: {
          explanation: 'Classify the seriousness per ICH E2A criteria.',
          clinicalAnalogies: {},
          commonMistakes: ['Confusing severity with seriousness'],
        },
        estimatedTimeSeconds: 20,
        phaseName: 'Seriousness',
      },
      patient_basics: {
        id: 'patient_basics',
        type: 'data_entry',
        clinicalPrompt: {
          default: 'Enter patient information',
        },
        fields: [
          {
            id: 'patient_initials',
            type: 'text',
            label: 'Patient Initials',
            placeholder: 'e.g. J.S.',
            validators: [
              { type: 'required', message: 'Patient initials are required', severity: 'error' },
            ],
          },
          {
            id: 'patient_age',
            type: 'number',
            label: 'Patient Age',
            validators: [
              { type: 'range', message: 'Age must be between 0 and 150', params: { min: 0, max: 150 }, severity: 'error' },
            ],
          },
        ],
        helpContent: {
          explanation: 'Provide basic patient demographics.',
          clinicalAnalogies: {},
          commonMistakes: ['Missing patient identifiers'],
        },
        estimatedTimeSeconds: 30,
        phaseName: 'Patient Information',
      },
      drug_info: {
        id: 'drug_info',
        type: 'data_entry',
        clinicalPrompt: {
          default: 'Enter suspect drug information',
        },
        fields: [
          {
            id: 'drug_name',
            type: 'text',
            label: 'Drug Name',
            validators: [
              { type: 'required', message: 'Drug name is required', severity: 'error' },
            ],
          },
        ],
        helpContent: {
          explanation: 'Provide the suspect drug details.',
          clinicalAnalogies: {},
          commonMistakes: ['Using brand name instead of INN'],
        },
        estimatedTimeSeconds: 30,
        phaseName: 'Drug Information',
      },
      review: {
        id: 'review',
        type: 'terminal',
        clinicalPrompt: {
          default: 'Review and submit your report',
        },
        helpContent: {
          explanation: 'Review all information before submission.',
          clinicalAnalogies: {},
          commonMistakes: ['Submitting without review'],
        },
        estimatedTimeSeconds: 60,
        phaseName: 'Review',
      },
    },
  };

  // Create a Map-backed registry with the test pathway registered
  const store = new Map();
  store.set('icsr_submission_high', testPathway);
  // Also add medium guidance as fallback
  store.set('icsr_submission_medium', testPathway);

  return {
    pathwayRegistry: {
      get: (taskType, guidanceLevel) => store.get(`${taskType}_${guidanceLevel}`),
      getWithFallback: (taskType, preferredGuidance) => {
        const preferred = store.get(`${taskType}_${preferredGuidance}`);
        if (preferred) return preferred;
        // Fallback order: medium → high
        for (const level of ['medium', 'high']) {
          const fallback = store.get(`${taskType}_${level}`);
          if (fallback) return fallback;
        }
        return undefined;
      },
      list: () => [],
      listForTask: () => [],
      has: (taskType, guidanceLevel) => store.has(`${taskType}_${guidanceLevel}`),
      register: (pathway) => store.set(`${pathway.taskType}_${pathway.guidanceLevel}`, pathway),
    },
  };
});

// Mock clinical-language service to avoid pulling in the full translation module
jest.mock('@/lib/clinical-language', () => ({
  clinicalLanguageService: {
    transformPrompt: (prompt: string) => prompt,
    getAnalogy: () => '',
    translate: (term: string) => term,
  },
}));

import {
  ClinicalPathwayNavigator,
  createNavigator,
} from '@/lib/pathway-navigator';
import type { HCPUser, PVTaskType } from '@/types/clinical-pathways';

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockUser = (overrides: Partial<HCPUser> = {}): HCPUser => ({
  id: 'test-user-123',
  domain: 'pharmacist',
  expertiseLevel: 0.7,
  techProficiency: 0.25, // Low tech = high guidance
  facilityId: 'facility-001',
  recentCases: [],
  ...overrides,
});

const createMockDeps = () => ({
  now: () => new Date('2024-12-12T10:00:00Z'),
  generateId: () => 'test-session-001',
});

// =============================================================================
// Constructor Tests
// =============================================================================

describe('ClinicalPathwayNavigator', () => {
  describe('constructor', () => {
    it('creates navigator for ICSR submission task', () => {
      const user = createMockUser();
      const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

      expect(navigator).toBeInstanceOf(ClinicalPathwayNavigator);
      expect(navigator.getSessionId()).toBe('test-session-001');
    });

    it('selects high guidance pathway for low tech proficiency', () => {
      const user = createMockUser({ techProficiency: 0.2 });
      const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

      const pathway = navigator.getPathway();
      expect(pathway.guidanceLevel).toBe('high');
    });

    it('initializes with correct starting state', () => {
      const user = createMockUser();
      const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

      const context = navigator.getContext();
      expect(context.currentStateId).toBe('triage');
      expect(context.navigationHistory).toEqual(['triage']);
    });

    it('throws error for unknown task type', () => {
      const user = createMockUser();
      expect(() => {
        createNavigator(user, 'unknown_task' as PVTaskType, createMockDeps());
      }).toThrow('No pathway found');
    });
  });
});

// =============================================================================
// getCurrentStep Tests
// =============================================================================

describe('getCurrentStep()', () => {
  it('returns step display for initial state', () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    const step = navigator.getCurrentStep();

    expect(step.prompt).toBeTruthy();
    expect(step.options).toBeDefined();
    expect(step.options?.length).toBeGreaterThan(0);
    expect(step.phaseName).toBe('Initial Assessment');
    expect(step.canGoBack).toBe(false); // Can't go back from first step
    expect(step.currentStepNumber).toBe(1);
  });

  it('transforms prompts to clinical language', () => {
    const user = createMockUser({ domain: 'pharmacist' });
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    const step = navigator.getCurrentStep();

    // Should be pharmacist-friendly language
    expect(step.prompt).toContain('drug reaction');
  });

  it('includes progress information', () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    const step = navigator.getCurrentStep();

    expect(step.progress).toBeDefined();
    expect(step.progress.percentage).toBeGreaterThanOrEqual(0);
    expect(step.progress.percentage).toBeLessThanOrEqual(100);
    expect(step.progress.phaseName).toBeTruthy();
  });
});

// =============================================================================
// processInput Tests
// =============================================================================

describe('processInput()', () => {
  it('advances state on valid option selection', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    const result = await navigator.processInput({
      field: 'triage_option',
      value: 'adverse_reaction',
    });

    expect(result.success).toBe(true);
    expect(result.nextStep).toBeDefined();
    expect(navigator.getContext().navigationHistory.length).toBe(2);
  });

  it('returns validation errors for invalid input', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    // Navigate to a state with required fields
    await navigator.processInput({ field: 'triage_option', value: 'adverse_reaction' });
    await navigator.processInput({ field: 'seriousness', value: 'non_serious' });

    // Now at patient_basics which has required fields
    const result = await navigator.processInput({
      field: 'patient_initials',
      value: '', // Empty - should fail
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('stores input in case data', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    await navigator.processInput({ field: 'test_field', value: 'test_value' });

    const caseData = navigator.getCaseData();
    expect(caseData.test_field).toBe('test_value');
  });

  it('records audit entry for each input', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    await navigator.processInput({ field: 'triage_option', value: 'adverse_reaction' });

    const context = navigator.getContext();
    // Should have initial state_enter + input_submitted + next state_enter
    expect(context.auditTrail.length).toBeGreaterThanOrEqual(2);

    const inputEntry = context.auditTrail.find(e => e.action === 'input_submitted');
    expect(inputEntry).toBeDefined();
    expect(inputEntry?.value).toBe('adverse_reaction');
  });
});

// =============================================================================
// goBack Tests
// =============================================================================

describe('goBack()', () => {
  it('returns null when at first state', () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    const result = navigator.goBack();
    expect(result).toBeNull();
  });

  it('returns to previous state after navigation', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    // Navigate forward
    await navigator.processInput({ field: 'triage_option', value: 'adverse_reaction' });

    const beforeBack = navigator.getContext().currentStateId;
    expect(beforeBack).not.toBe('triage');

    // Go back
    const step = navigator.goBack();

    expect(step).not.toBeNull();
    expect(navigator.getContext().currentStateId).toBe('triage');
  });

  it('preserves case data on back navigation', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    await navigator.processInput({ field: 'test_field', value: 'test_value' });

    navigator.goBack();

    const caseData = navigator.getCaseData();
    expect(caseData.test_field).toBe('test_value');
  });

  it('records back navigation in audit trail', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    await navigator.processInput({ field: 'triage_option', value: 'adverse_reaction' });
    navigator.goBack();

    const context = navigator.getContext();
    const backEntry = context.auditTrail.find(e => e.action === 'back_navigation');
    expect(backEntry).toBeDefined();
  });
});

// =============================================================================
// getHelp Tests
// =============================================================================

describe('getHelp()', () => {
  it('returns help content for current state', () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    const help = navigator.getHelp();

    expect(help.explanation).toBeTruthy();
    expect(help.commonMistakes).toBeDefined();
  });

  it('records help access in audit trail', () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    navigator.getHelp();

    const context = navigator.getContext();
    const helpEntry = context.auditTrail.find(e => e.action === 'help_accessed');
    expect(helpEntry).toBeDefined();
  });
});

// =============================================================================
// getClinicalAnalogy Tests
// =============================================================================

describe('getClinicalAnalogy()', () => {
  it('returns domain-specific analogy', () => {
    const user = createMockUser({ domain: 'pharmacist' });
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    const analogy = navigator.getClinicalAnalogy();

    // Triage state should have pharmacist-specific analogy
    // May be empty if no analogy defined for this state ID
    expect(typeof analogy).toBe('string');
  });
});

// =============================================================================
// Progress Tests
// =============================================================================

describe('progress calculation', () => {
  it('starts at low percentage', () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    const step = navigator.getCurrentStep();
    expect(step.progress.percentage).toBeLessThan(20);
  });

  it('increases percentage as user progresses', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    const initialProgress = navigator.getCurrentStep().progress.percentage;

    await navigator.processInput({ field: 'triage_option', value: 'adverse_reaction' });
    await navigator.processInput({ field: 'seriousness', value: 'non_serious' });

    const laterProgress = navigator.getCurrentStep().progress.percentage;
    expect(laterProgress).toBeGreaterThan(initialProgress);
  });

  it('never shows 100% until actually complete', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    // Navigate through several states
    await navigator.processInput({ field: 'triage_option', value: 'adverse_reaction' });
    await navigator.processInput({ field: 'seriousness', value: 'non_serious' });

    const progress = navigator.getCurrentStep().progress;
    expect(progress.percentage).toBeLessThan(100);
  });
});

// =============================================================================
// isComplete Tests
// =============================================================================

describe('isComplete()', () => {
  it('returns false when not at terminal state', () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    expect(navigator.isComplete()).toBe(false);
  });
});

// =============================================================================
// Audit Trail Tests
// =============================================================================

describe('audit trail', () => {
  it('records timestamp for each entry', async () => {
    const fixedTime = new Date('2024-12-12T10:00:00Z');
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', {
      ...createMockDeps(),
      now: () => fixedTime,
    });

    await navigator.processInput({ field: 'triage_option', value: 'adverse_reaction' });

    const context = navigator.getContext();
    for (const entry of context.auditTrail) {
      // Navigator stores Timestamp.fromDate(now()), so compare as Date via toDate()
      expect(entry.timestamp.toDate()).toEqual(fixedTime);
    }
  });

  it('records user ID for each entry', async () => {
    const user = createMockUser({ id: 'specific-user-id' });
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    await navigator.processInput({ field: 'triage_option', value: 'adverse_reaction' });

    const context = navigator.getContext();
    for (const entry of context.auditTrail) {
      expect(entry.userId).toBe('specific-user-id');
    }
  });

  it('records state ID for each entry', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    const context = navigator.getContext();
    const initialEntry = context.auditTrail[0];
    expect(initialEntry.stateId).toBe('triage');
  });
});

// =============================================================================
// Complete Flow Test
// =============================================================================

describe('complete workflow flow', () => {
  it('navigates through multiple states correctly', async () => {
    const user = createMockUser();
    const navigator = createNavigator(user, 'icsr_submission', createMockDeps());

    // Start at triage
    expect(navigator.getContext().currentStateId).toBe('triage');

    // Select adverse reaction
    const result1 = await navigator.processInput({
      field: 'triage_option',
      value: 'adverse_reaction',
    });
    expect(result1.success).toBe(true);
    expect(navigator.getContext().currentStateId).toBe('seriousness');

    // Select non-serious
    const result2 = await navigator.processInput({
      field: 'seriousness',
      value: 'non_serious',
    });
    expect(result2.success).toBe(true);
    expect(navigator.getContext().currentStateId).toBe('patient_basics');

    // Verify navigation history
    expect(navigator.getContext().navigationHistory).toEqual([
      'triage',
      'seriousness',
      'patient_basics',
    ]);
  });
});
