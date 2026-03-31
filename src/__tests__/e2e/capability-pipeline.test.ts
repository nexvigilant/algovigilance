/**
 * End-to-End Capability Pipeline Tests
 *
 * Tests the complete capability pipeline from KSB definition through
 * portfolio artifact generation.
 *
 * Run with: npm test -- --testPathPattern=capability-pipeline
 */

import {
  createMockCapability,
  createMockCapabilities,
  createMockProgress,
  createMockArtifact,
  createMockTriageActivity,
  createMockRedPenActivity,
  createMockSynthesisActivity,
} from '../mocks/capability-mocks';

import {
  validateCapability,
  validateCapabilities,
  formatCapabilityReport,
  type CapabilityConfig,
} from '../frameworks/capability-validation';

import type {
  CapabilityComponent,
  TriageConfig,
  RedPenConfig,
  SynthesisConfig,
} from '@/types/pv-curriculum';

// ============================================================================
// Test Suite: Capability Structure
// ============================================================================

describe('Capability Structure', () => {
  let capability: CapabilityComponent;

  beforeEach(() => {
    capability = createMockCapability();
  });

  test('should have all required sections', () => {
    expect(capability.hook).toBeDefined();
    expect(capability.concept).toBeDefined();
    expect(capability.activity).toBeDefined();
    expect(capability.reflection).toBeDefined();
    expect(capability.activityMetadata).toBeDefined();
  });

  test('should have valid proficiency level', () => {
    const validLevels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+', 'L5++'];
    expect(validLevels).toContain(capability.proficiencyLevel);
  });

  test('should have competency tags', () => {
    expect(capability.competencyTags).toBeDefined();
    expect(capability.competencyTags.length).toBeGreaterThan(0);
  });

  test('should have domain mapping', () => {
    expect(capability.domainId).toBeDefined();
    expect(capability.domainId).toMatch(/^domain-\d+$/);
  });

  test('hook should have scenario and content', () => {
    expect(capability.hook?.scenarioType).toBeDefined();
    expect(capability.hook?.content).toBeDefined();
    expect(capability.hook?.content.length).toBeGreaterThan(50);
  });

  test('concept should have key points and examples', () => {
    expect(capability.concept?.keyPoints).toBeDefined();
    expect(capability.concept?.keyPoints.length).toBeGreaterThanOrEqual(3);
    expect(capability.concept?.examples).toBeDefined();
    expect(capability.concept?.examples.length).toBeGreaterThan(0);
  });

  test('reflection should have prompt and portfolio artifact config', () => {
    expect(capability.reflection?.prompt).toBeDefined();
    expect(capability.reflection?.prompt.length).toBeGreaterThan(20);
    expect(capability.reflection?.portfolioArtifact).toBeDefined();
    expect(capability.reflection?.portfolioArtifact.artifactType).toBeDefined();
  });

  test('metadata should have learning objectives', () => {
    expect(capability.activityMetadata?.learningObjectives).toBeDefined();
    expect(capability.activityMetadata?.learningObjectives.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test Suite: Activity Engines
// ============================================================================

describe('Activity Engine Configurations', () => {
  describe('Triage Engine', () => {
    let activity: CapabilityComponent['activity'];

    beforeEach(() => {
      activity = createMockTriageActivity();
    });

    test('should have valid engine type', () => {
      expect(activity?.engineType).toBe('triage');
    });

    test('should have items with categories', () => {
      const config = activity?.config as TriageConfig;
      expect(config.items).toBeDefined();
      expect(config.items.length).toBeGreaterThan(0);
      expect(config.categories).toBeDefined();
      expect(config.categories.length).toBeGreaterThan(0);
    });

    test('should have valid scoring (total 100 points)', () => {
      const config = activity?.config as TriageConfig;
      const totalPoints = config.items.reduce((sum, item) => sum + item.points, 0);
      expect(totalPoints).toBe(100);
    });

    test('each item should have explanation', () => {
      const config = activity?.config as TriageConfig;
      config.items.forEach((item) => {
        expect(item.explanation).toBeDefined();
        expect(item.explanation.length).toBeGreaterThan(10);
      });
    });

    test('items should map to valid categories', () => {
      const config = activity?.config as TriageConfig;
      const categoryIds = config.categories.map((c) => c.id);
      config.items.forEach((item) => {
        expect(categoryIds).toContain(item.correctCategory);
      });
    });
  });

  describe('Red Pen Engine', () => {
    let activity: CapabilityComponent['activity'];

    beforeEach(() => {
      activity = createMockRedPenActivity();
    });

    test('should have valid engine type', () => {
      expect(activity?.engineType).toBe('red_pen');
    });

    test('should have document with errors', () => {
      const config = activity?.config as RedPenConfig;
      expect(config.document).toBeDefined();
      expect(config.document.content).toBeDefined();
      expect(config.errors).toBeDefined();
      expect(config.errors.length).toBeGreaterThan(0);
    });

    test('should have valid scoring', () => {
      const config = activity?.config as RedPenConfig;
      const totalPoints = config.errors.reduce((sum, error) => sum + error.points, 0);
      expect(totalPoints).toBeGreaterThan(0);
      expect(totalPoints).toBeLessThanOrEqual(100);
    });

    test('each error should have correction', () => {
      const config = activity?.config as RedPenConfig;
      config.errors.forEach((error) => {
        expect(error.correctVersion).toBeDefined();
        expect(error.explanation).toBeDefined();
      });
    });

    test('errors should have severity levels', () => {
      const config = activity?.config as RedPenConfig;
      const validSeverities = ['low', 'medium', 'high'];
      config.errors.forEach((error) => {
        expect(validSeverities).toContain(error.severity);
      });
    });
  });

  describe('Synthesis Engine', () => {
    let activity: CapabilityComponent['activity'];

    beforeEach(() => {
      activity = createMockSynthesisActivity();
    });

    test('should have valid engine type', () => {
      expect(activity?.engineType).toBe('synthesis');
    });

    test('should have prompt with scenario and task', () => {
      const config = activity?.config as SynthesisConfig;
      expect(config.prompt).toBeDefined();
      expect(config.prompt.scenario).toBeDefined();
      expect(config.prompt.task).toBeDefined();
    });

    test('should have rubric with criteria', () => {
      const config = activity?.config as SynthesisConfig;
      expect(config.rubric).toBeDefined();
      expect(config.rubric.length).toBeGreaterThan(0);
    });

    test('rubric should total 100 points', () => {
      const config = activity?.config as SynthesisConfig;
      const totalPoints = config.rubric.reduce((sum, criterion) => sum + criterion.maxPoints, 0);
      expect(totalPoints).toBe(100);
    });

    test('each rubric criterion should have levels', () => {
      const config = activity?.config as SynthesisConfig;
      config.rubric.forEach((criterion) => {
        expect(criterion.levels).toBeDefined();
        expect(criterion.levels.length).toBeGreaterThan(0);
      });
    });

    test('should have word limit and time limit', () => {
      const config = activity?.config as SynthesisConfig;
      expect(config.wordLimit).toBeDefined();
      expect(config.wordLimit).toBeGreaterThan(0);
      expect(config.timeLimit).toBeDefined();
      expect(config.timeLimit).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Test Suite: Progress Tracking
// ============================================================================

describe('Progress Tracking', () => {
  const userId = 'user-test-001';
  const ksbId = 'ksb-test-001';

  test('should create valid progress record', () => {
    const progress = createMockProgress(userId, ksbId);

    expect(progress.id).toBe(`${userId}_${ksbId}`);
    expect(progress.odUserId).toBe(userId);
    expect(progress.ksbId).toBe(ksbId);
    expect(progress.status).toBe('not_started');
  });

  test('should track section completion', () => {
    const progress = createMockProgress(userId, ksbId, {
      sectionsCompleted: {
        hook: true,
        concept: true,
        activity: false,
        reflection: false,
      },
      status: 'in_progress',
    });

    expect(progress.sectionsCompleted.hook).toBe(true);
    expect(progress.sectionsCompleted.concept).toBe(true);
    expect(progress.sectionsCompleted.activity).toBe(false);
    expect(progress.status).toBe('in_progress');
  });

  test('should track completion with score', () => {
    const progress = createMockProgress(userId, ksbId, {
      sectionsCompleted: {
        hook: true,
        concept: true,
        activity: true,
        reflection: true,
      },
      status: 'completed',
      bestScore: 85,
      totalTimeSpent: 480,
      completedAt: new Date(),
    });

    expect(progress.status).toBe('completed');
    expect(progress.bestScore).toBe(85);
    expect(progress.totalTimeSpent).toBe(480);
    expect(progress.completedAt).toBeDefined();
  });

  test('should calculate progress percentage', () => {
    const progress = createMockProgress(userId, ksbId, {
      sectionsCompleted: {
        hook: true,
        concept: true,
        activity: false,
        reflection: false,
      },
    });

    const sections = Object.values(progress.sectionsCompleted);
    const completed = sections.filter(Boolean).length;
    const percentage = (completed / sections.length) * 100;

    expect(percentage).toBe(50);
  });
});

// ============================================================================
// Test Suite: Portfolio Artifact Generation
// ============================================================================

describe('Portfolio Artifact Generation', () => {
  const userId = 'user-test-001';
  const ksbId = 'ksb-test-001';

  test('should create valid artifact', () => {
    const artifact = createMockArtifact(userId, ksbId);

    expect(artifact.id).toBeDefined();
    expect(artifact.odUserId).toBe(userId);
    expect(artifact.ksbId).toBe(ksbId);
    expect(artifact.status).toBe('submitted');
  });

  test('should have valid artifact type', () => {
    const artifact = createMockArtifact(userId, ksbId);
    const validTypes = ['completion', 'creation', 'analysis', 'decision_log'];

    expect(validTypes).toContain(artifact.artifactType);
  });

  test('should include activity results', () => {
    const artifact = createMockArtifact(userId, ksbId);

    expect(artifact.activityResults).toBeDefined();
    expect(artifact.activityResults?.score).toBeDefined();
    expect(artifact.activityResults?.engineType).toBeDefined();
  });

  test('should include reflection response', () => {
    const artifact = createMockArtifact(userId, ksbId);

    expect(artifact.reflectionResponse).toBeDefined();
    expect(artifact.reflectionResponse.length).toBeGreaterThan(0);
  });

  test('should have competency tags', () => {
    const artifact = createMockArtifact(userId, ksbId);

    expect(artifact.competencyTags).toBeDefined();
    expect(artifact.competencyTags.length).toBeGreaterThan(0);
  });

  test('artifact content should be valid JSON', () => {
    const artifact = createMockArtifact(userId, ksbId);

    expect(() => JSON.parse(artifact.content)).not.toThrow();

    const content = JSON.parse(artifact.content);
    expect(content.reflectionResponse).toBeDefined();
    expect(content.activityResult).toBeDefined();
  });
});

// ============================================================================
// Test Suite: Capability Validation Framework
// ============================================================================

describe('Capability Validation Framework', () => {
  let capability: CapabilityComponent;

  beforeEach(() => {
    capability = createMockCapability();
  });

  test('should validate complete capability', () => {
    const config: Partial<CapabilityConfig> = {
      hasErrorHandling: true,
      hasLoadingStates: true,
      hasAccessibility: true,
      hasTestCoverage: true,
      isExtensible: true,
      hasStrictTyping: true,
      hasDocumentation: true,
      followsPatterns: true,
    };

    const report = validateCapability(capability, config);

    expect(report.capabilityId).toBe(capability.id);
    expect(report.totalChecks).toBeGreaterThan(0);
    expect(report.overallScore).toBeGreaterThan(0);
  });

  test('should calculate scores by category', () => {
    const report = validateCapability(capability);

    expect(report.strategicScore).toBeDefined();
    expect(report.deliveryScore).toBeDefined();
    expect(report.maintenanceScore).toBeDefined();
    expect(report.innovationScore).toBeDefined();
  });

  test('should generate mission alignment report', () => {
    const report = validateCapability(capability);

    expect(report.missionAlignment).toBeDefined();
    expect(report.missionAlignment.alignmentScore).toBeDefined();
    expect(report.missionAlignment.patientFocus).toBeDefined();
    expect(report.missionAlignment.safetyCommitment).toBeDefined();
  });

  test('should format report for output', () => {
    const report = validateCapability(capability);
    const formatted = formatCapabilityReport(report);

    expect(formatted).toContain('CAPABILITY VALIDATION REPORT');
    expect(formatted).toContain(capability.itemName);
    expect(formatted).toContain('Strategic Alignment');
    expect(formatted).toContain('MISSION ALIGNMENT');
  });

  test('should validate batch capabilities', () => {
    const capabilities = createMockCapabilities(5);
    const { reports, summary } = validateCapabilities(capabilities);

    expect(reports.length).toBe(5);
    expect(summary).toContain('CAPABILITY PORTFOLIO SUMMARY');
    expect(summary).toContain('Total Capabilities: 5');
  });

  test('should identify capabilities needing attention', () => {
    // Create capability with missing sections
    const incompleteCapability = createMockCapability({
      hook: undefined,
      concept: undefined,
    });

    const report = validateCapability(incompleteCapability);

    expect(report.failed).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test Suite: End-to-End Pipeline Flow
// ============================================================================

describe('End-to-End Pipeline Flow', () => {
  const userId = 'user-test-001';

  test('should complete full pipeline: KSB -> Progress -> Artifact', () => {
    // 1. Create capability
    const capability = createMockCapability();
    expect(capability.id).toBeDefined();

    // 2. Initialize progress
    const progress = createMockProgress(userId, capability.id);
    expect(progress.status).toBe('not_started');

    // 3. Complete sections
    const updatedProgress = createMockProgress(userId, capability.id, {
      sectionsCompleted: {
        hook: true,
        concept: true,
        activity: true,
        reflection: true,
      },
      status: 'completed',
      bestScore: 85,
      totalTimeSpent: 480,
      completedAt: new Date(),
    });
    expect(updatedProgress.status).toBe('completed');

    // 4. Generate artifact
    const artifact = createMockArtifact(userId, capability.id, {
      proficiencyLevel: capability.proficiencyLevel,
      competencyTags: capability.competencyTags,
    });
    expect(artifact.status).toBe('submitted');

    // 5. Validate capability
    const report = validateCapability(capability, {
      hasErrorHandling: true,
      hasAccessibility: true,
      hasTestCoverage: true,
      isExtensible: true,
    });
    expect(report.overallScore).toBeGreaterThan(50);
  });

  test('should handle all activity engine types', () => {
    const engines = [
      { type: 'triage', create: createMockTriageActivity },
      { type: 'red_pen', create: createMockRedPenActivity },
      { type: 'synthesis', create: createMockSynthesisActivity },
    ];

    engines.forEach(({ type, create }) => {
      const capability = createMockCapability({ activity: create() });

      expect(capability.activity?.engineType).toBe(type);
      expect(capability.activity?.config).toBeDefined();

      const report = validateCapability(capability);
      expect(report.deliveryScore).toBeGreaterThan(0);
    });
  });

  test('should track multiple attempts', () => {
    const capability = createMockCapability();

    // First attempt
    const attempt1 = createMockProgress(userId, capability.id, {
      attempts: 1,
      bestScore: 65,
      status: 'in_progress',
    });

    // Second attempt with better score
    const attempt2 = createMockProgress(userId, capability.id, {
      attempts: 2,
      bestScore: 85,
      status: 'completed',
    });

    expect(attempt2.attempts).toBe(2);
    expect(attempt2.bestScore).toBeGreaterThan(attempt1.bestScore ?? 0);
  });

  test('should validate artifact status transitions', () => {
    const capability = createMockCapability();

    // Draft
    const draft = createMockArtifact(userId, capability.id, { status: 'draft' });
    expect(draft.status).toBe('draft');

    // Submitted
    const submitted = createMockArtifact(userId, capability.id, { status: 'submitted' });
    expect(submitted.status).toBe('submitted');

    // Verified
    const verified = createMockArtifact(userId, capability.id, {
      status: 'verified',
      verifiedAt: new Date(),
      verifiedBy: 'admin-001',
    });
    expect(verified.status).toBe('verified');
    expect(verified.verifiedBy).toBeDefined();
  });
});

// ============================================================================
// Test Suite: Mission Alignment Scoring
// ============================================================================

describe('Mission Alignment Scoring', () => {
  test('should score patient-focused capabilities higher', () => {
    const patientFocused = createMockCapability({
      itemName: 'Patient Safety Assessment',
      itemDefinition: 'Understanding patient safety monitoring and adverse event protection.',
    });

    const report = validateCapability(patientFocused);
    expect(report.missionAlignment.patientFocus).toBe(true);
  });

  test('should validate transparency levels', () => {
    const capability = createMockCapability();
    const report = validateCapability(capability);

    const validLevels = ['high', 'medium', 'low'];
    expect(validLevels).toContain(report.missionAlignment.transparencyLevel);
  });

  test('should calculate alignment score', () => {
    const capability = createMockCapability();
    const report = validateCapability(capability);

    expect(report.missionAlignment.alignmentScore).toBeGreaterThanOrEqual(0);
    expect(report.missionAlignment.alignmentScore).toBeLessThanOrEqual(100);
  });
});
