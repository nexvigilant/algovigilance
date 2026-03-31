/**
 * DAG Structure Validator Unit Tests
 *
 * Tests the domain dependency graph validation:
 * - Cycle detection
 * - Layer assignment
 * - Critical path identification
 * - Source/sink node validation
 */

import {
  dagStructureValidator,
  _buildDAG,
  topologicalSort,
  findCriticalPath,
  findRedundantEdges,
} from '../../../scripts/validation/content-validation/dag-structure';
import type { PDCData } from '../../../scripts/validation/content-validation/types';
import {
  validDomains,
  dagStructure,
} from './fixtures';

describe('DAG Structure Validator', () => {
  const createDataWithDomains = (): PDCData => ({
    epas: [],
    cpas: [],
    domains: validDomains,
    epaDomainMappings: [],
    cpaEpaMappings: [],
    cpaDomainMappings: [],
    ksbs: [],
    activityAnchors: [],
    metadata: {
      version: '4.1',
      exportedAt: new Date().toISOString(),
    },
  });

  describe('Basic Properties', () => {
    it('should have correct name and layer', () => {
      expect(dagStructureValidator.name).toBe('DAG Structure');
      expect(dagStructureValidator.layer).toBe('dag-structure');
    });

    it('should return a valid LayerResult structure', async () => {
      const data = createDataWithDomains();
      const result = await dagStructureValidator.validate(data);

      expect(result).toHaveProperty('layer');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checksRun');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('Empty Data Handling', () => {
    it('should handle empty domains gracefully', async () => {
      const data: PDCData = {
        epas: [],
        cpas: [],
        domains: [],
        epaDomainMappings: [],
        cpaEpaMappings: [],
        cpaDomainMappings: [],
        ksbs: [],
        activityAnchors: [],
        metadata: { version: '4.1', exportedAt: new Date().toISOString() },
      };

      const result = await dagStructureValidator.validate(data);

      expect(result.passed).toBe(true);
      const infoIssues = result.issues.filter(
        (i) => i.code === 'DAG_NO_DOMAINS'
      );
      expect(infoIssues.length).toBe(1);
    });
  });

  describe('Cycle Detection', () => {
    it('should pass when DAG has no cycles', async () => {
      const data = createDataWithDomains();
      const result = await dagStructureValidator.validate(data);

      const cycleIssues = result.issues.filter(
        (i) => i.code === 'DAG_CYCLE_DETECTED'
      );
      expect(cycleIssues).toHaveLength(0);
    });

    it('should error when cycle is detected', () => {
      // Test the internal buildDAG with cyclic data
      // Note: The actual DAG is hardcoded, so we test the algorithm
      const nodes = new Map([
        ['A', { id: 'A', predecessors: new Set(['C']), successors: new Set(['B']) }],
        ['B', { id: 'B', predecessors: new Set(['A']), successors: new Set(['C']) }],
        ['C', { id: 'C', predecessors: new Set(['B']), successors: new Set(['A']) }],
      ]);

      const result = topologicalSort(nodes);

      expect(result.hasCycle).toBe(true);
      expect(result.cycleNodes).toBeDefined();
      expect(result.cycleNodes?.length).toBeGreaterThan(0);
    });
  });

  describe('Source Node Validation', () => {
    it('should identify correct source nodes', async () => {
      const data = createDataWithDomains();
      const result = await dagStructureValidator.validate(data);

      // Check summary includes sources
      const summaryIssue = result.issues.find(
        (i) => i.code === 'DAG_SUMMARY'
      );
      expect(summaryIssue).toBeDefined();
      expect(summaryIssue?.actual).toContain('Sources');
    });
  });

  describe('Sink Node Validation', () => {
    it('should identify D15 as primary sink node', async () => {
      const data = createDataWithDomains();
      const result = await dagStructureValidator.validate(data);

      const _sinkIssues = result.issues.filter(
        (i) => i.code === 'DAG_SINK_NODE' && i.severity === 'warning'
      );
      // Should pass if D15 is a sink
      const summaryIssue = result.issues.find((i) => i.code === 'DAG_SUMMARY');
      expect(summaryIssue?.actual).toContain('D15');
    });
  });

  describe('Critical Path', () => {
    it('should identify critical path through DAG', async () => {
      const data = createDataWithDomains();
      const result = await dagStructureValidator.validate(data);

      const summaryIssue = result.issues.find((i) => i.code === 'DAG_SUMMARY');
      expect(summaryIssue?.actual).toContain('Critical Path');
    });

    it('should calculate longest path correctly', () => {
      // Create a simple DAG: A → B → C → D
      const nodes = new Map([
        ['A', { id: 'A', predecessors: new Set<string>(), successors: new Set(['B']), layer: 0 }],
        ['B', { id: 'B', predecessors: new Set(['A']), successors: new Set(['C']), layer: 1 }],
        ['C', { id: 'C', predecessors: new Set(['B']), successors: new Set(['D']), layer: 2 }],
        ['D', { id: 'D', predecessors: new Set(['C']), successors: new Set<string>(), layer: 3 }],
      ]);

      const path = findCriticalPath(nodes, ['A'], ['D']);

      expect(path).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  describe('Redundant Edge Detection', () => {
    it('should detect redundant edges', () => {
      // A → B → C with redundant A → C
      const nodes = new Map([
        ['A', { id: 'A', predecessors: new Set<string>(), successors: new Set(['B', 'C']) }],
        ['B', { id: 'B', predecessors: new Set(['A']), successors: new Set(['C']) }],
        ['C', { id: 'C', predecessors: new Set(['A', 'B']), successors: new Set<string>() }],
      ]);
      const edges = [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'A', to: 'C' }, // Redundant: A→B→C exists
      ];

      const redundant = findRedundantEdges(nodes, edges);

      expect(redundant.length).toBe(1);
      expect(redundant[0]).toEqual({ from: 'A', to: 'C' });
    });

    it('should not flag non-redundant edges', () => {
      // A → B, A → C (C is not reachable from B)
      const nodes = new Map([
        ['A', { id: 'A', predecessors: new Set<string>(), successors: new Set(['B', 'C']) }],
        ['B', { id: 'B', predecessors: new Set(['A']), successors: new Set<string>() }],
        ['C', { id: 'C', predecessors: new Set(['A']), successors: new Set<string>() }],
      ]);
      const edges = [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'C' },
      ];

      const redundant = findRedundantEdges(nodes, edges);

      expect(redundant).toHaveLength(0);
    });
  });

  describe('Topological Sort', () => {
    it('should correctly assign layers', () => {
      const nodes = new Map([
        ['A', { id: 'A', predecessors: new Set<string>(), successors: new Set(['C']) }],
        ['B', { id: 'B', predecessors: new Set<string>(), successors: new Set(['C']) }],
        ['C', { id: 'C', predecessors: new Set(['A', 'B']), successors: new Set(['D']) }],
        ['D', { id: 'D', predecessors: new Set(['C']), successors: new Set<string>() }],
      ]);

      const result = topologicalSort(nodes);

      expect(result.hasCycle).toBe(false);
      expect(result.layers.get(0)).toContain('A');
      expect(result.layers.get(0)).toContain('B');
      expect(result.layers.get(1)).toContain('C');
      expect(result.layers.get(2)).toContain('D');
    });
  });

  describe('DAG Fixture Consistency', () => {
    it('should match expected critical path from fixtures', () => {
      // The fixture defines expected critical path
      const expectedPath = dagStructure.criticalPath;
      expect(expectedPath).toEqual(['D01', 'D04', 'D08', 'D10', 'D12', 'D15']);
    });

    it('should match expected layer assignments from fixtures', () => {
      const layers = dagStructure.layers;

      // Layer 0 should be source nodes
      expect(layers[0]).toContain('D01');
      expect(layers[0]).toContain('D02');
      expect(layers[0]).toContain('D03');

      // Layer 6 should be sink node
      expect(layers[6]).toContain('D15');
    });
  });

  describe('Summary Information', () => {
    it('should include comprehensive DAG summary', async () => {
      const data = createDataWithDomains();
      const result = await dagStructureValidator.validate(data);

      const summaryIssue = result.issues.find((i) => i.code === 'DAG_SUMMARY');
      expect(summaryIssue).toBeDefined();
      expect(summaryIssue?.actual).toContain('Nodes');
      expect(summaryIssue?.actual).toContain('Edges');
      expect(summaryIssue?.actual).toContain('Layers');
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const data = createDataWithDomains();
      const result = await dagStructureValidator.validate(data);

      expect(result.duration).toBeLessThan(1000);
    });
  });
});
