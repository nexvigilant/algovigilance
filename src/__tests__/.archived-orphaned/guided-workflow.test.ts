/**
 * Guided Workflow Engine Tests
 */

import {
  createGuidedWorkflow,
  createLinearWorkflow,
  type WorkflowConfig,
  type WorkflowContext,
} from '../../tools/algorithms/guided-workflow';

// =============================================================================
// Test Fixtures
// =============================================================================

type TestData = {
  name?: string;
  email?: string;
  age?: number;
  choice?: string;
};

const createTestWorkflow = () => {
  const config: WorkflowConfig<WorkflowContext<TestData>> = {
    id: 'test-workflow',
    name: 'Test Workflow',
    initialState: 'start',
    states: {
      start: {
        id: 'start',
        type: 'info',
        prompt: 'Welcome to the test workflow',
        defaultNext: 'name_entry',
      },
      name_entry: {
        id: 'name_entry',
        type: 'data_entry',
        prompt: 'Enter your name',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
          },
        ],
        defaultNext: 'choice',
      },
      choice: {
        id: 'choice',
        type: 'question',
        prompt: 'Choose an option',
        options: [
          { id: 'option_a', label: 'Option A', nextState: 'complete' },
          { id: 'option_b', label: 'Option B', nextState: 'age_entry' },
        ],
      },
      age_entry: {
        id: 'age_entry',
        type: 'data_entry',
        prompt: 'Enter your age',
        fields: [
          {
            id: 'age',
            type: 'number',
            label: 'Age',
            validation: [
              { type: 'range', message: 'Age must be 0-120', params: { min: 0, max: 120 } },
            ],
          },
        ],
        defaultNext: 'complete',
      },
      complete: {
        id: 'complete',
        type: 'terminal',
        prompt: 'All done!',
      },
    },
  };

  return createGuidedWorkflow<TestData>(config);
};

// =============================================================================
// Constructor Tests
// =============================================================================

describe('createGuidedWorkflow', () => {
  it('creates workflow with initial state', () => {
    const workflow = createTestWorkflow();
    const step = workflow.getCurrentStep();

    expect(step.stateId).toBe('start');
    expect(step.prompt).toBe('Welcome to the test workflow');
  });

  it('initializes with empty data', () => {
    const workflow = createTestWorkflow();
    const data = workflow.getData();

    expect(data).toEqual({});
  });

  it('starts history with initial state', () => {
    const workflow = createTestWorkflow();
    const history = workflow.getHistory();

    expect(history).toEqual(['start']);
  });
});

// =============================================================================
// getCurrentStep Tests
// =============================================================================

describe('getCurrentStep()', () => {
  it('returns step display with all fields', () => {
    const workflow = createTestWorkflow();
    const step = workflow.getCurrentStep();

    expect(step).toHaveProperty('stateId');
    expect(step).toHaveProperty('prompt');
    expect(step).toHaveProperty('progress');
    expect(step).toHaveProperty('canGoBack');
    expect(step).toHaveProperty('stepNumber');
  });

  it('indicates cannot go back from first state', () => {
    const workflow = createTestWorkflow();
    const step = workflow.getCurrentStep();

    expect(step.canGoBack).toBe(false);
  });

  it('calculates progress percentage', () => {
    const workflow = createTestWorkflow();
    const step = workflow.getCurrentStep();

    expect(step.progress.percentage).toBeGreaterThanOrEqual(0);
    expect(step.progress.percentage).toBeLessThanOrEqual(100);
  });
});

// =============================================================================
// processInput Tests
// =============================================================================

describe('processInput()', () => {
  it('advances to next state on valid input', () => {
    const workflow = createTestWorkflow();

    // Start → name_entry (info state auto-advances on any input)
    const result = workflow.processInput({ field: 'continue', value: true });

    expect(result.success).toBe(true);
    expect(result.nextStep?.stateId).toBe('name_entry');
  });

  it('stores input value in data', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true }); // → name_entry
    workflow.processInput({ field: 'name', value: 'John' });

    const data = workflow.getData();
    expect(data.name).toBe('John');
  });

  it('returns errors for invalid required field', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true }); // → name_entry

    // Empty required field
    const result = workflow.processInput({ field: 'name', value: '' });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('validates range constraints', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true }); // → name_entry
    workflow.processInput({ field: 'name', value: 'John' }); // → choice
    workflow.processInput({ field: 'choice', value: 'option_b' }); // → age_entry

    const result = workflow.processInput({ field: 'age', value: 150 });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('follows option-based transitions', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true }); // → name_entry
    workflow.processInput({ field: 'name', value: 'John' }); // → choice

    // Option A goes directly to complete
    const result = workflow.processInput({ field: 'choice', value: 'option_a' });

    expect(result.success).toBe(true);
    expect(result.nextStep?.stateId).toBe('complete');
    expect(result.isComplete).toBe(true);
  });

  it('updates history on state change', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true });

    const history = workflow.getHistory();
    expect(history).toContain('name_entry');
  });
});

// =============================================================================
// goBack Tests
// =============================================================================

describe('goBack()', () => {
  it('returns null when at first state', () => {
    const workflow = createTestWorkflow();
    const result = workflow.goBack();

    expect(result).toBeNull();
  });

  it('returns to previous state', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true }); // → name_entry
    expect(workflow.getCurrentStep().stateId).toBe('name_entry');

    const prevStep = workflow.goBack();

    expect(prevStep).not.toBeNull();
    expect(prevStep?.stateId).toBe('start');
  });

  it('preserves data after going back', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true });
    workflow.processInput({ field: 'name', value: 'John' });
    workflow.goBack();

    const data = workflow.getData();
    expect(data.name).toBe('John');
  });

  it('allows canGoBack after navigation', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true });

    const step = workflow.getCurrentStep();
    expect(step.canGoBack).toBe(true);
  });
});

// =============================================================================
// isComplete Tests
// =============================================================================

describe('isComplete()', () => {
  it('returns false initially', () => {
    const workflow = createTestWorkflow();
    expect(workflow.isComplete()).toBe(false);
  });

  it('returns true at terminal state', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true });
    workflow.processInput({ field: 'name', value: 'John' });
    workflow.processInput({ field: 'choice', value: 'option_a' });

    expect(workflow.isComplete()).toBe(true);
  });
});

// =============================================================================
// reset Tests
// =============================================================================

describe('reset()', () => {
  it('returns to initial state', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true });
    workflow.processInput({ field: 'name', value: 'John' });
    workflow.reset();

    expect(workflow.getCurrentStep().stateId).toBe('start');
  });

  it('clears collected data', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true });
    workflow.processInput({ field: 'name', value: 'John' });
    workflow.reset();

    const data = workflow.getData();
    expect(data).toEqual({});
  });

  it('resets history', () => {
    const workflow = createTestWorkflow();

    workflow.processInput({ field: 'continue', value: true });
    workflow.reset();

    const history = workflow.getHistory();
    expect(history).toEqual(['start']);
  });
});

// =============================================================================
// createLinearWorkflow Tests
// =============================================================================

describe('createLinearWorkflow()', () => {
  it('creates workflow from step array', () => {
    const workflow = createLinearWorkflow('linear', 'Linear Workflow', [
      { id: 'step1', prompt: 'Step 1', field: { id: 'field1', type: 'text', label: 'Field 1' } },
      { id: 'step2', prompt: 'Step 2', field: { id: 'field2', type: 'text', label: 'Field 2' } },
    ]);

    expect(workflow.getCurrentStep().stateId).toBe('step1');
  });

  it('progresses through steps in order', () => {
    const workflow = createLinearWorkflow('linear', 'Linear Workflow', [
      { id: 'step1', prompt: 'Step 1', field: { id: 'field1', type: 'text', label: 'Field 1' } },
      { id: 'step2', prompt: 'Step 2', field: { id: 'field2', type: 'text', label: 'Field 2' } },
    ]);

    workflow.processInput({ field: 'field1', value: 'value1' });

    expect(workflow.getCurrentStep().stateId).toBe('step2');
  });
});
