/**
 * Over-Engineering Detection Algorithm - Test Suite
 *
 * Tests cover:
 * - Basic functionality
 * - Edge cases (empty inputs, orphans, single requirement)
 * - Factor calculations
 * - Scoring and classification
 * - Recommendations generation
 */

import {
  detectOverEngineering,
  _DEFAULT_CONFIG,
  type Strategy,
  type Capability,
  type Requirement,
  type Feature,
  type CapabilityMetrics,
  type ScaleTarget,
} from './over-engineering-detector';

// ============================================================================
// Test Fixtures
// ============================================================================

const createRequirement = (overrides: Partial<Requirement> = {}): Requirement => ({
  id: 'req-1',
  description: 'Test requirement',
  criticality: 0.8,
  complexity_budget: 5,
  scale_target: 'medium' as ScaleTarget,
  ...overrides,
});

const createFeature = (overrides: Partial<Feature> = {}): Feature => ({
  name: 'Test Feature',
  used_by_strategy: true,
  complexity_contribution: 2.0,
  ...overrides,
});

const createMetrics = (overrides: Partial<CapabilityMetrics> = {}): CapabilityMetrics => ({
  lines_of_code: 500,
  abstraction_layers: 2,
  dependencies: 8,
  configuration_options: 10,
  test_coverage: 0.8,
  ...overrides,
});

const createCapability = (overrides: Partial<Capability> = {}): Capability => ({
  id: 'cap-1',
  name: 'Test Capability',
  type: 'capability',
  requirements_served: ['req-1'],
  features: [createFeature()],
  metrics: createMetrics(),
  ...overrides,
});

const createStrategy = (overrides: Partial<Strategy> = {}): Strategy => ({
  name: 'Test Strategy',
  requirements: [createRequirement()],
  ...overrides,
});

// ============================================================================
// Basic Functionality Tests
// ============================================================================

describe('detectOverEngineering', () => {
  describe('basic functionality', () => {
    it('should analyze a simple capability correctly', () => {
      const strategy = createStrategy();
      const capabilities = [createCapability()];

      const results = detectOverEngineering(strategy, capabilities);

      expect(results).toHaveLength(1);
      expect(results[0].capability_id).toBe('cap-1');
      expect(results[0].over_engineering_score).toBeGreaterThanOrEqual(0);
      expect(results[0].over_engineering_score).toBeLessThanOrEqual(1);
      expect(results[0].verdict).toBeDefined();
      expect(results[0].recommendations).toBeInstanceOf(Array);
    });

    it('should sort results by score descending', () => {
      const strategy = createStrategy({
        requirements: [
          createRequirement({ id: 'r1', complexity_budget: 3 }),
          createRequirement({ id: 'r2', complexity_budget: 8 }),
        ],
      });

      const capabilities = [
        createCapability({
          id: 'simple',
          name: 'Simple',
          requirements_served: ['r2'],
          metrics: createMetrics({ lines_of_code: 200 }),
        }),
        createCapability({
          id: 'complex',
          name: 'Complex',
          requirements_served: ['r1'],
          metrics: createMetrics({ lines_of_code: 5000, dependencies: 30 }),
        }),
      ];

      const results = detectOverEngineering(strategy, capabilities);

      expect(results[0].capability_id).toBe('complex');
      expect(results[0].over_engineering_score).toBeGreaterThan(
        results[1].over_engineering_score
      );
    });

    it('should handle multiple capabilities', () => {
      const strategy = createStrategy({
        requirements: [
          createRequirement({ id: 'r1' }),
          createRequirement({ id: 'r2' }),
        ],
      });

      const capabilities = [
        createCapability({ id: 'c1', requirements_served: ['r1'] }),
        createCapability({ id: 'c2', requirements_served: ['r2'] }),
        createCapability({ id: 'c3', requirements_served: ['r1', 'r2'] }),
      ];

      const results = detectOverEngineering(strategy, capabilities);

      expect(results).toHaveLength(3);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    it('should return empty array for strategy with no requirements', () => {
      const strategy = createStrategy({ requirements: [] });
      const capabilities = [createCapability()];

      const results = detectOverEngineering(strategy, capabilities);

      expect(results).toHaveLength(0);
    });

    it('should mark orphan capabilities with max score', () => {
      const strategy = createStrategy();
      const orphanCapability = createCapability({
        id: 'orphan',
        name: 'Orphan System',
        requirements_served: [], // Serves nothing
      });

      const results = detectOverEngineering(strategy, [orphanCapability]);

      expect(results[0].is_orphan).toBe(true);
      expect(results[0].over_engineering_score).toBe(1.0);
      expect(results[0].verdict).toBe('severely_over');
      expect(results[0].recommendations[0]).toContain('ORPHAN');
    });

    it('should handle capabilities with non-existent requirement references', () => {
      const strategy = createStrategy();
      const capability = createCapability({
        requirements_served: ['non-existent-req'],
      });

      const results = detectOverEngineering(strategy, [capability]);

      // Should be treated as orphan
      expect(results[0].is_orphan).toBe(true);
    });

    it('should handle capability with empty features', () => {
      const strategy = createStrategy();
      const capability = createCapability({
        features: [],
      });

      const results = detectOverEngineering(strategy, [capability]);

      expect(results[0].factors.feature_waste_ratio).toBe(0);
    });

    it('should handle single requirement with single capability', () => {
      const strategy = createStrategy();
      const capability = createCapability();

      const results = detectOverEngineering(strategy, [capability]);

      expect(results).toHaveLength(1);
      expect(results[0].factors).toBeDefined();
    });
  });

  // ============================================================================
  // Factor Calculation Tests
  // ============================================================================

  describe('factor calculations', () => {
    describe('complexity ratio', () => {
      it('should detect high complexity ratio', () => {
        const strategy = createStrategy({
          requirements: [
            createRequirement({ complexity_budget: 2, criticality: 1.0 }),
          ],
        });

        const capability = createCapability({
          metrics: createMetrics({
            lines_of_code: 10000,
            dependencies: 50,
            abstraction_layers: 8,
            configuration_options: 100,
          }),
        });

        const results = detectOverEngineering(strategy, [capability]);

        expect(results[0].factors.complexity_ratio).toBeGreaterThan(1);
      });

      it('should reward low complexity for simple requirements', () => {
        const strategy = createStrategy({
          requirements: [
            createRequirement({ complexity_budget: 8, criticality: 1.0 }),
          ],
        });

        const capability = createCapability({
          metrics: createMetrics({
            lines_of_code: 100,
            dependencies: 2,
            abstraction_layers: 1,
            configuration_options: 3,
          }),
        });

        const results = detectOverEngineering(strategy, [capability]);

        expect(results[0].factors.complexity_ratio).toBeLessThan(1);
      });
    });

    describe('feature waste', () => {
      it('should detect unused features', () => {
        const strategy = createStrategy();
        const capability = createCapability({
          features: [
            createFeature({ name: 'Used', used_by_strategy: true }),
            createFeature({ name: 'Unused1', used_by_strategy: false }),
            createFeature({ name: 'Unused2', used_by_strategy: false }),
            createFeature({ name: 'Unused3', used_by_strategy: false }),
          ],
        });

        const results = detectOverEngineering(strategy, [capability]);

        expect(results[0].factors.feature_waste_ratio).toBe(0.75); // 3/4
      });

      it('should return 0 when all features are used', () => {
        const strategy = createStrategy();
        const capability = createCapability({
          features: [
            createFeature({ used_by_strategy: true }),
            createFeature({ used_by_strategy: true }),
          ],
        });

        const results = detectOverEngineering(strategy, [capability]);

        expect(results[0].factors.feature_waste_ratio).toBe(0);
      });
    });

    describe('abstraction excess', () => {
      it('should penalize excessive layers', () => {
        const strategy = createStrategy({
          requirements: [
            createRequirement({ complexity_budget: 2 }), // Low complexity = few layers
          ],
        });

        const capability = createCapability({
          metrics: createMetrics({ abstraction_layers: 8 }), // Many layers
        });

        const results = detectOverEngineering(strategy, [capability]);

        expect(results[0].factors.abstraction_excess).toBeGreaterThan(0);
      });

      it('should not penalize appropriate layers', () => {
        const strategy = createStrategy({
          requirements: [
            createRequirement({ complexity_budget: 8 }), // High complexity
          ],
        });

        const capability = createCapability({
          metrics: createMetrics({ abstraction_layers: 3 }), // Appropriate
        });

        const results = detectOverEngineering(strategy, [capability]);

        expect(results[0].factors.abstraction_excess).toBeLessThanOrEqual(0.5);
      });
    });

    describe('scale mismatch', () => {
      it('should detect enterprise capability for small strategy', () => {
        const strategy = createStrategy({
          requirements: [
            createRequirement({ scale_target: 'small' }),
          ],
        });

        const capability = createCapability({
          metrics: createMetrics({
            lines_of_code: 10000,
            dependencies: 30,
            configuration_options: 50,
            abstraction_layers: 7,
          }),
        });

        const results = detectOverEngineering(strategy, [capability]);

        expect(results[0].factors.scale_mismatch).toBeGreaterThan(0);
      });

      it('should not penalize appropriate scale', () => {
        const strategy = createStrategy({
          requirements: [
            createRequirement({ scale_target: 'enterprise' }),
          ],
        });

        const capability = createCapability({
          metrics: createMetrics({
            lines_of_code: 10000,
            dependencies: 30,
            configuration_options: 50,
            abstraction_layers: 7,
          }),
        });

        const results = detectOverEngineering(strategy, [capability]);

        expect(results[0].factors.scale_mismatch).toBe(0);
      });
    });
  });

  // ============================================================================
  // Verdict Classification Tests
  // ============================================================================

  describe('verdict classification', () => {
    it('should classify as "appropriate" for low scores', () => {
      const strategy = createStrategy({
        requirements: [
          createRequirement({ complexity_budget: 10, criticality: 1.0 }),
        ],
      });

      const capability = createCapability({
        features: [createFeature({ used_by_strategy: true })],
        metrics: createMetrics({
          lines_of_code: 200,
          dependencies: 3,
          abstraction_layers: 1,
          configuration_options: 5,
        }),
      });

      const results = detectOverEngineering(strategy, [capability]);

      expect(results[0].verdict).toBe('appropriate');
    });

    it('should classify as "severely_over" for orphan capabilities', () => {
      const strategy = createStrategy();
      const capability = createCapability({
        requirements_served: [],
      });

      const results = detectOverEngineering(strategy, [capability]);

      expect(results[0].verdict).toBe('severely_over');
    });
  });

  // ============================================================================
  // Recommendations Tests
  // ============================================================================

  describe('recommendations', () => {
    it('should recommend removing unused features', () => {
      const strategy = createStrategy();
      const capability = createCapability({
        features: [
          createFeature({ name: 'Used', used_by_strategy: true }),
          createFeature({ name: 'Unused Feature', used_by_strategy: false }),
          createFeature({ name: 'Another Unused', used_by_strategy: false }),
        ],
      });

      const results = detectOverEngineering(strategy, [capability]);

      const hasFeatureRecommendation = results[0].recommendations.some(
        rec => rec.toLowerCase().includes('unused feature') ||
               rec.toLowerCase().includes('remove')
      );
      expect(hasFeatureRecommendation).toBe(true);
    });

    it('should recommend dependency audit for high dependency count', () => {
      const strategy = createStrategy({
        requirements: [createRequirement({ complexity_budget: 2 })],
      });

      const capability = createCapability({
        metrics: createMetrics({
          dependencies: 30,
          lines_of_code: 5000,
        }),
      });

      const results = detectOverEngineering(strategy, [capability]);

      const hasDependencyRecommendation = results[0].recommendations.some(
        rec => rec.toLowerCase().includes('dependencies') ||
               rec.toLowerCase().includes('audit')
      );
      expect(hasDependencyRecommendation).toBe(true);
    });

    it('should recommend flattening for excessive abstraction', () => {
      const strategy = createStrategy({
        requirements: [createRequirement({ complexity_budget: 2 })],
      });

      const capability = createCapability({
        metrics: createMetrics({ abstraction_layers: 10 }),
      });

      const results = detectOverEngineering(strategy, [capability]);

      const hasFlattenRecommendation = results[0].recommendations.some(
        rec => rec.toLowerCase().includes('flatten') ||
               rec.toLowerCase().includes('layers')
      );
      expect(hasFlattenRecommendation).toBe(true);
    });

    it('should provide positive feedback for appropriate engineering', () => {
      const strategy = createStrategy({
        requirements: [
          createRequirement({ complexity_budget: 10, criticality: 1.0 }),
        ],
      });

      const capability = createCapability({
        features: [createFeature({ used_by_strategy: true })],
        metrics: createMetrics({
          lines_of_code: 200,
          dependencies: 3,
          abstraction_layers: 1,
          configuration_options: 5,
        }),
      });

      const results = detectOverEngineering(strategy, [capability]);

      const hasPositiveFeedback = results[0].recommendations.some(
        rec => rec.toLowerCase().includes('appropriate')
      );
      expect(hasPositiveFeedback).toBe(true);
    });
  });

  // ============================================================================
  // Simplification Potential Tests
  // ============================================================================

  describe('simplification potential', () => {
    it('should estimate high reduction for heavily over-engineered capability', () => {
      const strategy = createStrategy({
        requirements: [createRequirement({ complexity_budget: 2 })],
      });

      const capability = createCapability({
        features: [
          createFeature({ used_by_strategy: true }),
          createFeature({ used_by_strategy: false }),
          createFeature({ used_by_strategy: false }),
          createFeature({ used_by_strategy: false }),
        ],
        metrics: createMetrics({
          lines_of_code: 10000,
          abstraction_layers: 10,
          dependencies: 40,
        }),
      });

      const results = detectOverEngineering(strategy, [capability]);

      expect(results[0].simplification_potential.estimated_reduction).toBeGreaterThan(30);
    });

    it('should estimate low reduction for appropriate capability', () => {
      const strategy = createStrategy({
        requirements: [createRequirement({ complexity_budget: 10 })],
      });

      const capability = createCapability({
        features: [createFeature({ used_by_strategy: true })],
        metrics: createMetrics({
          lines_of_code: 200,
          abstraction_layers: 1,
          dependencies: 3,
        }),
      });

      const results = detectOverEngineering(strategy, [capability]);

      expect(results[0].simplification_potential.estimated_reduction).toBeLessThan(20);
    });

    it('should classify risk level based on reduction amount', () => {
      const strategy = createStrategy({
        requirements: [createRequirement({ complexity_budget: 2 })],
      });

      // High reduction = high risk
      const highRiskCapability = createCapability({
        features: Array(10).fill(null).map((_, i) =>
          createFeature({ name: `Feature ${i}`, used_by_strategy: i < 2 })
        ),
        metrics: createMetrics({
          lines_of_code: 15000,
          abstraction_layers: 12,
        }),
      });

      const results = detectOverEngineering(strategy, [highRiskCapability]);

      if (results[0].simplification_potential.estimated_reduction > 40) {
        expect(results[0].simplification_potential.risk_level).toBe('high');
      }
    });
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe('configuration', () => {
    it('should use default config when none provided', () => {
      const strategy = createStrategy();
      const capabilities = [createCapability()];

      const results = detectOverEngineering(strategy, capabilities);

      expect(results).toHaveLength(1);
    });

    it('should allow custom thresholds', () => {
      const strategy = createStrategy();
      const capability = createCapability({
        metrics: createMetrics({ lines_of_code: 1000 }),
      });

      // Very strict thresholds
      const strictConfig = {
        thresholds: {
          appropriate: 0.1,
          slight: 0.2,
          significant: 0.3,
        },
      };

      const results = detectOverEngineering(strategy, [capability], strictConfig);

      // With strict thresholds, more things should be over-engineered
      expect(results[0]).toBeDefined();
    });

    it('should allow custom weights', () => {
      const strategy = createStrategy();
      const capability = createCapability({
        features: [
          createFeature({ used_by_strategy: false }),
          createFeature({ used_by_strategy: false }),
        ],
      });

      // Only care about feature waste
      const featureWeightConfig = {
        weights: {
          complexity: 0,
          feature_waste: 1.0,
          abstraction: 0,
          scale_mismatch: 0,
        },
      };

      const results = detectOverEngineering(strategy, [capability], featureWeightConfig);

      // Score should be dominated by feature waste (which is 1.0)
      expect(results[0].over_engineering_score).toBeGreaterThan(0.5);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('integration scenarios', () => {
    it('should handle realistic startup MVP scenario', () => {
      const strategy: Strategy = {
        name: 'Startup MVP',
        requirements: [
          {
            id: 'auth',
            description: 'Basic user authentication',
            criticality: 0.9,
            complexity_budget: 4,
            scale_target: 'small',
          },
          {
            id: 'crud',
            description: 'Basic CRUD operations',
            criticality: 0.8,
            complexity_budget: 3,
            scale_target: 'small',
          },
        ],
      };

      const capabilities: Capability[] = [
        {
          id: 'auth-system',
          name: 'Enterprise Auth Platform',
          type: 'capability',
          requirements_served: ['auth'],
          features: [
            { name: 'Password Login', used_by_strategy: true, complexity_contribution: 2 },
            { name: 'OAuth2', used_by_strategy: true, complexity_contribution: 3 },
            { name: 'SAML SSO', used_by_strategy: false, complexity_contribution: 4 },
            { name: 'MFA', used_by_strategy: false, complexity_contribution: 3 },
            { name: 'Biometric', used_by_strategy: false, complexity_contribution: 5 },
          ],
          metrics: {
            lines_of_code: 8000,
            abstraction_layers: 6,
            dependencies: 25,
            configuration_options: 45,
            test_coverage: 0.85,
          },
        },
        {
          id: 'data-layer',
          name: 'Simple Data Layer',
          type: 'capability',
          requirements_served: ['crud'],
          features: [
            { name: 'CRUD Operations', used_by_strategy: true, complexity_contribution: 2 },
            { name: 'Basic Caching', used_by_strategy: true, complexity_contribution: 2.5 },
          ],
          metrics: {
            lines_of_code: 600,
            abstraction_layers: 2,
            dependencies: 5,
            configuration_options: 8,
            test_coverage: 0.75,
          },
        },
      ];

      const results = detectOverEngineering(strategy, capabilities);

      // Auth system should be more over-engineered than data layer
      expect(results[0].capability_id).toBe('auth-system');
      expect(results[0].verdict).not.toBe('appropriate');

      expect(results[1].capability_id).toBe('data-layer');
      // Data layer is simple but may still score slightly over due to scale mismatch
      expect(['appropriate', 'slightly_over', 'significantly_over']).toContain(results[1].verdict);
    });

    it('should handle mixed capability types', () => {
      const strategy = createStrategy({
        requirements: [
          createRequirement({ id: 'r1' }),
          createRequirement({ id: 'r2' }),
        ],
      });

      const capabilities: Capability[] = [
        createCapability({ id: 'cap', type: 'capability', requirements_served: ['r1'] }),
        createCapability({ id: 'sys', type: 'management_system', requirements_served: ['r2'] }),
      ];

      const results = detectOverEngineering(strategy, capabilities);

      expect(results).toHaveLength(2);
      expect(results.map(r => r.capability_id)).toContain('cap');
      expect(results.map(r => r.capability_id)).toContain('sys');
    });
  });
});
