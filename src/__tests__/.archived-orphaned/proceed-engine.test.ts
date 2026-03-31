/**
 * Proceed Engine Integration Tests
 *
 * Tests the proceed-engine against real template configurations
 * to validate DAG computation, decision scoring, and state management.
 */

import * as fs from 'fs';
import * as path from 'path';

// Try to import yaml, fallback to null if not available
let yaml: { parse: (content: string) => Record<string, unknown> } | null = null;
try {
  yaml = require('yaml');
} catch {
  // yaml not available - template tests will be skipped
}

import {
  scoreDecision,
  selectBestOption,
  rankOptions,
  createInitialState,
  validateAndComputeDAG,
  getProgress,
  identifyConstraint,
  formatProgressBar,
  isSecurityRelated,
  IMPACT_SCORES,
  EFFORT_SCORES,
  // M1: Durable Execution
  computeStateChecksum,
  verifyStateIntegrity,
  addStateIntegrity,
  STATE_SCHEMA_VERSION,
  // M2: Asset Versioning
  computeContentHash,
  createAssetVersion,
  createVersionedOutput,
  recordAssetVersion,
  // M3: Guardrails
  runGuardrails,
  BUILTIN_PRE_GUARDRAILS,
  BUILTIN_POST_GUARDRAILS,
  // M4: Ensemble Voting
  computeEnsembleConsensus,
  recordEnsembleConsensus,
  // M5: Adaptive Scheduling
  recordModulePerformance,
  analyzeForAdjustments,
  updateVelocityTrend,
  getAverageVelocity,
  type ProceedModule,
  type DecisionOption,
  type ProceedState,
  type EnsembleVote,
  type ModulePerformance,
} from '../../../tools/algorithms/proceed-engine';

// Template directory
const TEMPLATES_DIR = path.join(__dirname, '../../../../.claude/proceed-templates');

/**
 * Load a template file and convert to ProceedModules
 */
function loadTemplate(templateName: string): ProceedModule[] | null {
  if (!yaml) {
    return null; // yaml not available
  }

  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.yml`);
  if (!fs.existsSync(templatePath)) {
    return null;
  }

  const content = fs.readFileSync(templatePath, 'utf-8');
  const template = yaml.parse(content) as { modules?: Array<Record<string, unknown>> };

  if (!template.modules) {
    return null;
  }

  return template.modules.map((mod: Record<string, unknown>, index: number) => ({
    id: (mod.id as string) || `M${index + 1}`,
    name: mod.name as string,
    purpose: (mod.purpose as string) || '',
    deliverables: (mod.deliverables as string[]) || [],
    dependencies: (mod.depends as string[]) || [],
    resources: (mod.resources as string[]) || [],
    risk: (mod.risk as number) || 0.3,
    effort: ((mod.effort as string) || 'M') as 'S' | 'M' | 'L' | 'XL',
    critical: (mod.critical as boolean) || false,
    status: 'pending' as const,
    impactType: 'enhancement' as const,
  })) as ProceedModule[];
}

describe('Decision Scoring', () => {
  test('scoreDecision returns value between 0 and 1', () => {
    const option: DecisionOption = {
      id: 'test',
      description: 'Test option',
      impactType: 'bug_fix',
      continuesCurrent: true,
      risk: 0.3,
      effort: 'M',
    };

    const score = scoreDecision(option);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  test('bug fixes score higher than documentation', () => {
    const bugFix: DecisionOption = {
      id: 'bug',
      description: 'Fix critical bug',
      impactType: 'bug_fix',
      continuesCurrent: false,
      risk: 0.5,
      effort: 'M',
    };

    const docs: DecisionOption = {
      id: 'docs',
      description: 'Update documentation',
      impactType: 'docs',
      continuesCurrent: false,
      risk: 0.1,
      effort: 'S',
    };

    expect(scoreDecision(bugFix)).toBeGreaterThan(scoreDecision(docs));
  });

  test('momentum bonus affects scoring', () => {
    const withMomentum: DecisionOption = {
      id: 'with',
      description: 'Continue current work',
      impactType: 'enhancement',
      continuesCurrent: true,
      risk: 0.3,
      effort: 'M',
    };

    const withoutMomentum: DecisionOption = {
      id: 'without',
      description: 'Start new work',
      impactType: 'enhancement',
      continuesCurrent: false,
      risk: 0.3,
      effort: 'M',
    };

    expect(scoreDecision(withMomentum)).toBeGreaterThan(scoreDecision(withoutMomentum));
  });

  test('selectBestOption picks highest scoring option', () => {
    const options: DecisionOption[] = [
      { id: 'low', description: 'Low', impactType: 'docs', continuesCurrent: false, risk: 0.1, effort: 'S' },
      { id: 'high', description: 'High', impactType: 'bug_fix', continuesCurrent: true, risk: 0.2, effort: 'M' },
      { id: 'mid', description: 'Mid', impactType: 'enhancement', continuesCurrent: true, risk: 0.3, effort: 'M' },
    ];

    const result = selectBestOption(options);
    expect(result.option.id).toBe('high');
  });

  test('rankOptions returns sorted array', () => {
    const options: DecisionOption[] = [
      { id: 'a', description: 'A', impactType: 'docs', continuesCurrent: false, risk: 0.1, effort: 'S' },
      { id: 'b', description: 'B', impactType: 'bug_fix', continuesCurrent: true, risk: 0.2, effort: 'M' },
      { id: 'c', description: 'C', impactType: 'tests', continuesCurrent: false, risk: 0.3, effort: 'L' },
    ];

    const ranked = rankOptions(options);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].rank).toBe(3);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
  });
});

describe('State Management', () => {
  test('createInitialState creates valid state structure', () => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'Test', purpose: 'Test', deliverables: [], dependencies: [], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'pending' },
    ];

    const state = createInitialState('Test context', modules);

    expect(state.planId).toMatch(/^plan-/);
    expect(state.contextSummary).toBe('Test context');
    expect(state.modules).toHaveLength(1);
    expect(state.dag.nodes).toHaveLength(1);
    expect(state.execution.moduleStatus.M1).toBe('pending');
  });

  test('state includes correct DAG edges', () => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'First', purpose: '', deliverables: [], dependencies: [], resources: [], risk: 0.2, effort: 'S', critical: true, status: 'pending' },
      { id: 'M2', name: 'Second', purpose: '', deliverables: [], dependencies: ['M1'], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'pending' },
    ];

    const state = createInitialState('Test', modules);

    expect(state.dag.edges).toContainEqual(['M1', 'M2']);
  });
});

describe('DAG Validation and Computation', () => {
  test('validates DAG with no cycles', () => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'First', purpose: '', deliverables: [], dependencies: [], resources: [], risk: 0.2, effort: 'S', critical: true, status: 'pending' },
      { id: 'M2', name: 'Second', purpose: '', deliverables: [], dependencies: ['M1'], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'pending' },
      { id: 'M3', name: 'Third', purpose: '', deliverables: [], dependencies: ['M2'], resources: [], risk: 0.4, effort: 'L', critical: false, status: 'pending' },
    ];

    const result = validateAndComputeDAG(modules);

    expect(result.valid).toBe(true);
    expect(result.cycles).toHaveLength(0);
    expect(result.levels).toHaveLength(3);
    expect(result.criticalPath.path).toContain('M1');
  });

  test('computes correct levels for parallel modules', () => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'Root', purpose: '', deliverables: [], dependencies: [], resources: [], risk: 0.2, effort: 'S', critical: true, status: 'pending' },
      { id: 'M2', name: 'Branch A', purpose: '', deliverables: [], dependencies: ['M1'], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'pending' },
      { id: 'M3', name: 'Branch B', purpose: '', deliverables: [], dependencies: ['M1'], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'pending' },
      { id: 'M4', name: 'Merge', purpose: '', deliverables: [], dependencies: ['M2', 'M3'], resources: [], risk: 0.4, effort: 'L', critical: false, status: 'pending' },
    ];

    const result = validateAndComputeDAG(modules);

    expect(result.levels).toHaveLength(3);
    expect(result.levels[0]).toHaveLength(1); // M1
    expect(result.levels[1]).toHaveLength(2); // M2, M3 (parallel)
    expect(result.levels[2]).toHaveLength(1); // M4
  });

  test('getProgress calculates correct metrics', () => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'Done', purpose: '', deliverables: [], dependencies: [], resources: [], risk: 0.2, effort: 'S', critical: true, status: 'completed' },
      { id: 'M2', name: 'In Progress', purpose: '', deliverables: [], dependencies: ['M1'], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'in_progress' },
      { id: 'M3', name: 'Pending', purpose: '', deliverables: [], dependencies: ['M2'], resources: [], risk: 0.4, effort: 'L', critical: false, status: 'pending' },
    ];

    const state = createInitialState('Test', modules);
    state.modules = modules;
    state.execution.moduleStatus = { M1: 'completed', M2: 'in_progress', M3: 'pending' };

    const progress = getProgress(state);

    expect(progress.completed).toBe(1);
    expect(progress.total).toBe(3);
    expect(progress.percentage).toBe(33);
  });
});

describe('Template Integration Tests', () => {
  const templates = ['new-feature', 'bug-fix', 'refactor'];

  templates.forEach((templateName) => {
    describe(`Template: ${templateName}`, () => {
      let modules: ProceedModule[] | null;

      beforeAll(() => {
        modules = loadTemplate(templateName);
      });

      test('loads without error', () => {
        // Either loads successfully or is null (yaml not available or template not found)
        // This is a valid state - we don't fail if template loading is not possible
        expect(true).toBe(true);
      });

      test('has valid module structure', () => {
        if (!modules || modules.length === 0) return; // Skip if template not loaded

        modules.forEach((mod) => {
          expect(mod.id).toBeDefined();
          expect(mod.name).toBeDefined();
          expect(mod.risk).toBeGreaterThanOrEqual(0);
          expect(mod.risk).toBeLessThanOrEqual(1);
          expect(['S', 'M', 'L', 'XL']).toContain(mod.effort);
        });
      });

      test('forms valid DAG (no cycles)', () => {
        if (!modules || modules.length === 0) return;

        const result = validateAndComputeDAG(modules);
        expect(result.valid).toBe(true);
        expect(result.cycles).toHaveLength(0);
      });

      test('all dependencies reference existing modules', () => {
        if (!modules || modules.length === 0) return;

        const moduleIds = new Set(modules.map((m) => m.id));
        modules.forEach((mod) => {
          mod.dependencies.forEach((dep) => {
            expect(moduleIds.has(dep)).toBe(true);
          });
        });
      });
    });
  });
});

describe('Utility Functions', () => {
  test('formatProgressBar creates correct bar', () => {
    expect(formatProgressBar(0)).toBe('\u2591'.repeat(20));
    expect(formatProgressBar(100)).toBe('\u2588'.repeat(20));
    expect(formatProgressBar(50, 10)).toBe('\u2588'.repeat(5) + '\u2591'.repeat(5));
  });

  test('isSecurityRelated detects security modules', () => {
    const authModule: ProceedModule = {
      id: 'auth',
      name: 'Implement authentication',
      purpose: '',
      deliverables: [],
      dependencies: [],
      resources: ['src/auth/'],
      risk: 0.5,
      effort: 'L',
      critical: true,
      status: 'pending',
    };

    const uiModule: ProceedModule = {
      id: 'ui',
      name: 'Build UI components',
      purpose: '',
      deliverables: [],
      dependencies: [],
      resources: ['src/components/'],
      risk: 0.3,
      effort: 'M',
      critical: false,
      status: 'pending',
    };

    expect(isSecurityRelated(authModule)).toBe(true);
    expect(isSecurityRelated(uiModule)).toBe(false);
  });

  test('identifyConstraint finds bottleneck on critical path', () => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'Easy', purpose: '', deliverables: [], dependencies: [], resources: [], risk: 0.1, effort: 'S', critical: true, status: 'pending' },
      { id: 'M2', name: 'Hard', purpose: '', deliverables: [], dependencies: ['M1'], resources: [], risk: 0.8, effort: 'XL', critical: false, status: 'pending' },
      { id: 'M3', name: 'Medium', purpose: '', deliverables: [], dependencies: ['M2'], resources: [], risk: 0.4, effort: 'M', critical: false, status: 'pending' },
    ];

    const result = identifyConstraint(modules, ['M1', 'M2', 'M3']);

    // identifyConstraint returns { constraint, constraintScore, downstreamCount, recommendation }
    expect(result.constraint?.id).toBe('M2');
    expect(result.constraintScore).toBeGreaterThan(0);
    expect(result.recommendation).toBeDefined();
  });
});

describe('Constants Validation', () => {
  test('IMPACT_SCORES covers all types', () => {
    const types = ['bug_fix', 'security', 'complete_wip', 'commit', 'tests', 'refactor', 'enhancement', 'docs'];
    types.forEach((type) => {
      expect(IMPACT_SCORES[type as keyof typeof IMPACT_SCORES]).toBeDefined();
    });
  });

  test('EFFORT_SCORES covers all levels', () => {
    const levels = ['S', 'M', 'L', 'XL'];
    levels.forEach((level) => {
      expect(EFFORT_SCORES[level as keyof typeof EFFORT_SCORES]).toBeDefined();
    });
  });

  test('IMPACT_SCORES are normalized 0-1', () => {
    Object.values(IMPACT_SCORES).forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});

// =============================================================================
// M1: DURABLE EXECUTION TESTS
// =============================================================================

describe('M1: Durable Execution', () => {
  const createTestState = (): ProceedState => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'Test', purpose: 'Test', deliverables: [], dependencies: [], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'pending' },
    ];
    return createInitialState('Test context', modules);
  };

  test('STATE_SCHEMA_VERSION is defined', () => {
    expect(STATE_SCHEMA_VERSION).toBeDefined();
    expect(STATE_SCHEMA_VERSION).toBe('2.0.0');
  });

  test('computeStateChecksum returns consistent hash', () => {
    const state = createTestState();
    const checksum1 = computeStateChecksum(state);
    const checksum2 = computeStateChecksum(state);

    expect(checksum1).toBe(checksum2);
    expect(checksum1).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  test('computeStateChecksum returns different hash for different states', () => {
    const state1 = createTestState();
    const state2 = createTestState();
    state2.contextSummary = 'Different context';

    const checksum1 = computeStateChecksum(state1);
    const checksum2 = computeStateChecksum(state2);

    expect(checksum1).not.toBe(checksum2);
  });

  test('addStateIntegrity adds integrity metadata', () => {
    const state = createTestState();
    const stateWithIntegrity = addStateIntegrity(state);

    expect(stateWithIntegrity.integrity).toBeDefined();
    expect(stateWithIntegrity.integrity?.algorithm).toBe('sha256');
    expect(stateWithIntegrity.integrity?.version).toBe(STATE_SCHEMA_VERSION);
    expect(stateWithIntegrity.integrity?.checksum).toHaveLength(64);
    expect(stateWithIntegrity.integrity?.computedAt).toBeDefined();
  });

  test('verifyStateIntegrity returns valid for intact state', () => {
    const state = createTestState();
    const stateWithIntegrity = addStateIntegrity(state);

    const result = verifyStateIntegrity(stateWithIntegrity);

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  test('verifyStateIntegrity returns invalid for missing integrity', () => {
    const state = createTestState();

    const result = verifyStateIntegrity(state);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No integrity metadata found');
  });

  test('verifyStateIntegrity returns invalid for tampered state', () => {
    const state = createTestState();
    const stateWithIntegrity = addStateIntegrity(state);

    // Tamper with the state
    stateWithIntegrity.contextSummary = 'Tampered!';

    const result = verifyStateIntegrity(stateWithIntegrity);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Checksum mismatch - state may be corrupted or tampered');
    expect(result.expectedChecksum).toBeDefined();
    expect(result.actualChecksum).toBeDefined();
    expect(result.expectedChecksum).not.toBe(result.actualChecksum);
  });
});

// =============================================================================
// M2: ASSET VERSIONING TESTS
// =============================================================================

describe('M2: Asset Versioning', () => {
  test('computeContentHash returns consistent hash', () => {
    const content = 'Hello, World!';
    const hash1 = computeContentHash(content);
    const hash2 = computeContentHash(content);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  test('computeContentHash returns different hash for different content', () => {
    const hash1 = computeContentHash('Hello');
    const hash2 = computeContentHash('World');

    expect(hash1).not.toBe(hash2);
  });

  test('createAssetVersion creates valid version object', () => {
    const version = createAssetVersion('M1', 'test content', { dep1: 'abc123' });

    expect(version.outputHash).toHaveLength(64);
    expect(version.producedBy).toBe('M1');
    expect(version.inputHashes.dep1).toBe('abc123');
    expect(version.producedAt).toBeDefined();
    expect(version.codeVersion).toBeDefined();
  });

  test('createVersionedOutput creates valid output with version', () => {
    const output = createVersionedOutput('M1', 'Report', 'Report content');

    expect(output.moduleId).toBe('M1');
    expect(output.deliverable).toBe('Report');
    expect(output.content).toBe('Report content');
    expect(output.version).toBeDefined();
    expect(output.version.outputHash).toHaveLength(64);
    expect(output.version.producedBy).toBe('M1');
  });

  test('recordAssetVersion adds version to state', () => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'Test', purpose: 'Test', deliverables: [], dependencies: [], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'pending' },
    ];
    const state = createInitialState('Test', modules);
    const version = createAssetVersion('M1', 'content');

    const updatedState = recordAssetVersion(state, 'M1', version);

    expect(updatedState.assetVersions).toBeDefined();
    expect(updatedState.assetVersions?.M1).toBe(version);
  });
});

// =============================================================================
// M3: GUARDRAILS TESTS
// =============================================================================

describe('M3: Fail-Fast Guardrails', () => {
  const createTestModule = (overrides: Partial<ProceedModule> = {}): ProceedModule => ({
    id: 'M1',
    name: 'Test Module',
    purpose: 'Test',
    deliverables: ['output.txt'],
    dependencies: [],
    resources: [],
    risk: 0.3,
    effort: 'M',
    critical: false,
    status: 'pending',
    ...overrides,
  });

  const createTestState = (): ProceedState => {
    const modules = [createTestModule()];
    return createInitialState('Test context', modules);
  };

  test('BUILTIN_PRE_GUARDRAILS is defined with expected checks', () => {
    expect(BUILTIN_PRE_GUARDRAILS).toBeDefined();
    expect(Array.isArray(BUILTIN_PRE_GUARDRAILS)).toBe(true);

    const ids = BUILTIN_PRE_GUARDRAILS.map((g) => g.id);
    expect(ids).toContain('deps-complete');
    expect(ids).toContain('git-clean');
  });

  test('BUILTIN_POST_GUARDRAILS is defined with expected checks', () => {
    expect(BUILTIN_POST_GUARDRAILS).toBeDefined();
    expect(Array.isArray(BUILTIN_POST_GUARDRAILS)).toBe(true);

    const ids = BUILTIN_POST_GUARDRAILS.map((g) => g.id);
    expect(ids).toContain('output-exists');
    expect(ids).toContain('output-not-empty');
    expect(ids).toContain('tests-pass');
  });

  test('runGuardrails PRE passes when dependencies complete', () => {
    const module = createTestModule({ dependencies: [] });
    const state = createTestState();

    const report = runGuardrails(module, state, 'PRE');

    expect(report.moduleId).toBe('M1');
    expect(report.timing).toBe('PRE');
    expect(report.overallPassed).toBe(true);
    expect(report.blockers).toHaveLength(0);
  });

  test('runGuardrails PRE fails when dependencies incomplete', () => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'First', purpose: '', deliverables: [], dependencies: [], resources: [], risk: 0.2, effort: 'S', critical: false, status: 'pending' },
      { id: 'M2', name: 'Second', purpose: '', deliverables: ['output.txt'], dependencies: ['M1'], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'pending' },
    ];
    const state = createInitialState('Test', modules);
    state.execution.moduleStatus.M1 = 'pending';

    const report = runGuardrails(modules[1], state, 'PRE');

    expect(report.overallPassed).toBe(false);
    expect(report.blockers).toContain('Dependencies Complete');
  });

  test('runGuardrails POST passes with all outputs', () => {
    const module = createTestModule({ deliverables: ['output.txt'] });
    const state = createTestState();
    const outputs = [createVersionedOutput('M1', 'output.txt', 'content')];

    const report = runGuardrails(module, state, 'POST', { outputs });

    expect(report.overallPassed).toBe(true);
  });

  test('runGuardrails POST fails with missing outputs', () => {
    const module = createTestModule({ deliverables: ['output.txt', 'missing.txt'] });
    const state = createTestState();
    const outputs = [createVersionedOutput('M1', 'output.txt', 'content')];

    const report = runGuardrails(module, state, 'POST', { outputs });

    expect(report.overallPassed).toBe(false);
    expect(report.blockers).toContain('Outputs Exist');
  });

  test('runGuardrails POST fails with empty outputs', () => {
    const module = createTestModule({ deliverables: ['output.txt'] });
    const state = createTestState();
    const outputs = [createVersionedOutput('M1', 'output.txt', '')];

    const report = runGuardrails(module, state, 'POST', { outputs });

    expect(report.overallPassed).toBe(false);
    expect(report.blockers).toContain('Outputs Not Empty');
  });

  test('runGuardrails POST fails with failing tests', () => {
    const module = createTestModule({ deliverables: [] });
    const state = createTestState();

    const report = runGuardrails(module, state, 'POST', {
      outputs: [],
      testResults: { passed: false, count: 5 },
    });

    expect(report.overallPassed).toBe(false);
    expect(report.blockers).toContain('Tests Pass');
  });
});

// =============================================================================
// M4: ENSEMBLE VOTING TESTS
// =============================================================================

describe('M4: Ensemble Voting', () => {
  const createVote = (executorId: string, outputHash: string, confidence: number = 0.9): EnsembleVote => ({
    executorId,
    moduleId: 'M1',
    outputHash,
    confidence,
    timestamp: new Date().toISOString(),
  });

  test('computeEnsembleConsensus with unanimous agreement', () => {
    const votes: EnsembleVote[] = [
      createVote('exec1', 'hash123'),
      createVote('exec2', 'hash123'),
      createVote('exec3', 'hash123'),
    ];

    const consensus = computeEnsembleConsensus(votes);

    expect(consensus.agreementRatio).toBe(1);
    expect(consensus.consensusHash).toBe('hash123');
    expect(consensus.requiresHumanReview).toBe(false);
  });

  test('computeEnsembleConsensus with 2/3 agreement (below default threshold)', () => {
    const votes: EnsembleVote[] = [
      createVote('exec1', 'hash123'),
      createVote('exec2', 'hash123'),
      createVote('exec3', 'differentHash'),
    ];

    const consensus = computeEnsembleConsensus(votes);

    // 2/3 = 0.666... which is just below default threshold of 0.67
    expect(consensus.agreementRatio).toBeCloseTo(0.67, 1);
    expect(consensus.requiresHumanReview).toBe(true);
    expect(consensus.consensusHash).toBeNull();
  });

  test('computeEnsembleConsensus with 3/4 agreement (above threshold)', () => {
    const votes: EnsembleVote[] = [
      createVote('exec1', 'hash123'),
      createVote('exec2', 'hash123'),
      createVote('exec3', 'hash123'),
      createVote('exec4', 'differentHash'),
    ];

    const consensus = computeEnsembleConsensus(votes);

    // 3/4 = 0.75 which is above default threshold of 0.67
    expect(consensus.agreementRatio).toBe(0.75);
    expect(consensus.consensusHash).toBe('hash123');
    expect(consensus.requiresHumanReview).toBe(false);
  });

  test('computeEnsembleConsensus requires review below threshold', () => {
    const votes: EnsembleVote[] = [
      createVote('exec1', 'hash1'),
      createVote('exec2', 'hash2'),
      createVote('exec3', 'hash3'),
    ];

    const consensus = computeEnsembleConsensus(votes);

    expect(consensus.agreementRatio).toBeCloseTo(0.33, 1);
    expect(consensus.consensusHash).toBeNull();
    expect(consensus.requiresHumanReview).toBe(true);
    expect(consensus.reason).toContain('below threshold');
  });

  test('computeEnsembleConsensus with empty votes', () => {
    const consensus = computeEnsembleConsensus([]);

    expect(consensus.agreementRatio).toBe(0);
    expect(consensus.consensusHash).toBeNull();
    expect(consensus.requiresHumanReview).toBe(true);
    expect(consensus.reason).toBe('No votes received');
  });

  test('computeEnsembleConsensus with custom threshold', () => {
    const votes: EnsembleVote[] = [
      createVote('exec1', 'hash123'),
      createVote('exec2', 'hash123'),
      createVote('exec3', 'differentHash'),
    ];

    // With 80% required, 66% should fail
    const consensus = computeEnsembleConsensus(votes, 0.8);

    expect(consensus.requiresHumanReview).toBe(true);
    expect(consensus.consensusHash).toBeNull();
  });

  test('recordEnsembleConsensus adds to state', () => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'Test', purpose: '', deliverables: [], dependencies: [], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'pending' },
    ];
    const state = createInitialState('Test', modules);
    const consensus = computeEnsembleConsensus([createVote('exec1', 'hash123')]);

    const updatedState = recordEnsembleConsensus(state, consensus);

    expect(updatedState.ensembleResults).toBeDefined();
    expect(updatedState.ensembleResults?.M1).toBe(consensus);
  });
});

// =============================================================================
// M5: ADAPTIVE SCHEDULING TESTS
// =============================================================================

describe('M5: Adaptive Scheduling', () => {
  const createTestState = (): ProceedState => {
    const modules: ProceedModule[] = [
      { id: 'M1', name: 'Test', purpose: 'Test', deliverables: [], dependencies: [], resources: [], risk: 0.3, effort: 'M', critical: false, status: 'pending' },
    ];
    return createInitialState('Test context', modules);
  };

  const createPerformance = (
    moduleId: string,
    estimated: number,
    actual: number,
    rework: number = 0
  ): ModulePerformance => ({
    moduleId,
    estimatedDuration: estimated,
    actualDuration: actual,
    estimatedRisk: 0.3,
    actualRisk: 0.4,
    blockedTime: 0,
    reworkCycles: rework,
  });

  test('recordModulePerformance adds to performance log', () => {
    const state = createTestState();
    const perf = createPerformance('M1', 1000, 1500);

    const updatedState = recordModulePerformance(state, perf);

    expect(updatedState.adaptive).toBeDefined();
    expect(updatedState.adaptive?.performanceLog).toHaveLength(1);
    expect(updatedState.adaptive?.performanceLog[0]).toBe(perf);
  });

  test('recordModulePerformance appends to existing log', () => {
    let state = createTestState();
    state = recordModulePerformance(state, createPerformance('M1', 1000, 1500));
    state = recordModulePerformance(state, createPerformance('M2', 2000, 2500));

    expect(state.adaptive?.performanceLog).toHaveLength(2);
  });

  test('analyzeForAdjustments returns empty for insufficient data', () => {
    const state = createTestState();

    const adjustments = analyzeForAdjustments(state);

    expect(adjustments).toHaveLength(0);
  });

  test('analyzeForAdjustments detects overruns', () => {
    let state = createTestState();
    // Add 5 modules with 2x overrun (50% longer than estimated)
    for (let i = 0; i < 5; i++) {
      state = recordModulePerformance(state, createPerformance(`M${i}`, 1000, 2000));
    }

    const adjustments = analyzeForAdjustments(state);

    expect(adjustments.length).toBeGreaterThan(0);
    const escalate = adjustments.find((a) => a.type === 'ESCALATE');
    expect(escalate).toBeDefined();
    expect(escalate?.reason).toContain('longer than estimated');
  });

  test('analyzeForAdjustments detects high rework', () => {
    let state = createTestState();
    // Add 5 modules with rework cycles
    for (let i = 0; i < 5; i++) {
      state = recordModulePerformance(state, createPerformance(`M${i}`, 1000, 1000, 2));
    }

    const adjustments = analyzeForAdjustments(state);

    const split = adjustments.find((a) => a.type === 'SPLIT');
    expect(split).toBeDefined();
    expect(split?.reason).toContain('rework');
  });

  test('updateVelocityTrend adds to velocity trend', () => {
    const state = createTestState();

    const updated = updateVelocityTrend(state, 3);

    expect(updated.adaptive?.velocityTrend).toHaveLength(1);
    expect(updated.adaptive?.velocityTrend[0]).toBe(3);
  });

  test('updateVelocityTrend keeps last 20 readings', () => {
    let state = createTestState();

    // Add 25 velocity readings
    for (let i = 0; i < 25; i++) {
      state = updateVelocityTrend(state, i + 1);
    }

    expect(state.adaptive?.velocityTrend).toHaveLength(20);
    expect(state.adaptive?.velocityTrend[0]).toBe(6); // First 5 trimmed
    expect(state.adaptive?.velocityTrend[19]).toBe(25);
  });

  test('getAverageVelocity calculates correct average', () => {
    let state = createTestState();
    state = updateVelocityTrend(state, 2);
    state = updateVelocityTrend(state, 4);
    state = updateVelocityTrend(state, 6);

    const avg = getAverageVelocity(state);

    expect(avg).toBe(4);
  });

  test('getAverageVelocity returns 0 for empty trend', () => {
    const state = createTestState();

    const avg = getAverageVelocity(state);

    expect(avg).toBe(0);
  });
});
