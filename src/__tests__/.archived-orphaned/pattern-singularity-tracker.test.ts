/**
 * Pattern Fitness Tracker Tests
 */

import {
  PatternFitnessTracker,
  createSuccessEvent,
  createFailureEvent,
} from '../../packages/pattern-singularity/tracker';
import { GENERATION_0_PATTERNS } from '../../packages/pattern-singularity/catalog';

describe('PatternFitnessTracker', () => {
  let tracker: PatternFitnessTracker;

  beforeEach(() => {
    tracker = new PatternFitnessTracker();
  });

  describe('recordUsage', () => {
    it('should record successful usage and increase fitness', () => {
      const event = createSuccessEvent(
        'test-pattern-1',
        { repo: 'test-repo', file: 'test.ts' }
      );

      const fitness = tracker.recordUsage(event);

      expect(fitness.usageCount).toBe(1);
      expect(fitness.successRate).toBeGreaterThan(0.5);
      expect(fitness.score).toBeGreaterThan(0);
    });

    it('should decrease fitness on failure', () => {
      // First, establish baseline with success
      tracker.recordUsage(createSuccessEvent(
        'test-pattern-2',
        { repo: 'test-repo', file: 'test.ts' }
      ));

      const firstFitness = tracker.getFitness('test-pattern-2');
      expect(firstFitness).toBeDefined();

      // Then record failure
      const fitness = tracker.recordUsage(createFailureEvent(
        'test-pattern-2',
        { repo: 'test-repo', file: 'test.ts' },
        true,
        'Build failed'
      ));

      expect(fitness.usageCount).toBe(2);
      expect(fitness.successRate).toBeLessThan(firstFitness?.successRate ?? 1);
    });

    it('should apply bug penalty', () => {
      // Record usage with bug
      const fitness = tracker.recordUsage(createFailureEvent(
        'test-pattern-3',
        { repo: 'test-repo', file: 'test.ts' },
        true // hadBugs
      ));

      expect(fitness.bugCount).toBe(1);
      expect(fitness.score).toBeLessThan(1);
    });
  });

  describe('getTopPerformers', () => {
    it('should return patterns sorted by fitness', () => {
      // Create patterns with different fitness levels
      for (let i = 0; i < 5; i++) {
        tracker.recordUsage(createSuccessEvent(
          `high-performer-${i}`,
          { repo: 'test', file: 'test.ts' }
        ));
      }

      tracker.recordUsage(createFailureEvent(
        'low-performer',
        { repo: 'test', file: 'test.ts' },
        true
      ));

      const top = tracker.getTopPerformers(3);
      expect(top.length).toBe(3);
      expect(top[0].fitness.score).toBeGreaterThanOrEqual(top[1].fitness.score);
    });
  });

  describe('getUnderperformers', () => {
    it('should return patterns below threshold with sufficient usage', () => {
      // Create underperformer with multiple uses
      for (let i = 0; i < 3; i++) {
        tracker.recordUsage(createFailureEvent(
          'underperformer',
          { repo: 'test', file: 'test.ts' },
          true
        ));
      }

      const under = tracker.getUnderperformers(0.5);
      expect(under.length).toBe(1);
      expect(under[0].id).toBe('underperformer');
    });

    it('should not include patterns with insufficient usage', () => {
      // Single failure shouldn't flag as underperformer
      tracker.recordUsage(createFailureEvent(
        'single-failure',
        { repo: 'test', file: 'test.ts' },
        true
      ));

      const under = tracker.getUnderperformers(0.5);
      expect(under.find(p => p.id === 'single-failure')).toBeUndefined();
    });
  });

  describe('getStatistics', () => {
    it('should calculate aggregate stats', () => {
      tracker.recordUsage(createSuccessEvent('p1', { repo: 'test', file: 'a.ts' }));
      tracker.recordUsage(createSuccessEvent('p2', { repo: 'test', file: 'b.ts' }));
      tracker.recordUsage(createFailureEvent('p3', { repo: 'test', file: 'c.ts' }, true));

      const stats = tracker.getStatistics();

      expect(stats.totalPatterns).toBe(3);
      expect(stats.totalUsages).toBe(3);
      expect(stats.totalBugs).toBe(1);
      expect(stats.averageFitness).toBeGreaterThan(0);
    });

    it('should handle empty tracker', () => {
      const stats = tracker.getStatistics();

      expect(stats.totalPatterns).toBe(0);
      expect(stats.totalUsages).toBe(0);
      expect(stats.averageFitness).toBe(0);
    });
  });

  describe('initializeFromCatalog', () => {
    it('should import fitness from catalog patterns', () => {
      tracker.initializeFromCatalog(GENERATION_0_PATTERNS);

      const allFitness = tracker.getAllFitness();
      expect(Object.keys(allFitness).length).toBe(GENERATION_0_PATTERNS.length);
    });
  });

  describe('export/import', () => {
    it('should round-trip state', () => {
      tracker.recordUsage(createSuccessEvent('p1', { repo: 'test', file: 'a.ts' }));

      const exported = tracker.export();
      const newTracker = new PatternFitnessTracker();
      newTracker.import(exported);

      const fitness = newTracker.getFitness('p1');
      expect(fitness).toBeDefined();
      expect(fitness?.usageCount).toBe(1);
    });
  });
});
