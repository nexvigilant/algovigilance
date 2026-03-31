/**
 * CIDRE Algorithm Tests
 *
 * Tests for citation cartel detection using synthetic networks
 */

import {
  createGraph,
  addNode,
  addEdge,
  buildGraph,
  outDegree,
  inDegree,
  hasEdge,
  getNeighbors,
  getInNeighbors,
  nodeReciprocity,
  globalReciprocity,
  localClusteringCoefficient,
  globalClusteringCoefficient,
  indirectReciprocityScore,
  nodeCIDREScore,
  findStronglyConnectedComponents,
  analyzeCluster,
  analyzeCIDRE,
  getCartelCentrality,
  isInCartelCluster,
  getNodeCluster,
  quickCartelCheck,
  type CitationGraph,
  type _CitationNode,
} from '../cidre-algorithm';

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Create a simple cartel network (A -> B -> C -> A triangle)
 */
function createCartelTriangle(): CitationGraph {
  const graph = createGraph();
  addNode(graph, { id: 'A', type: 'paper', name: 'Paper A' });
  addNode(graph, { id: 'B', type: 'paper', name: 'Paper B' });
  addNode(graph, { id: 'C', type: 'paper', name: 'Paper C' });
  addEdge(graph, 'A', 'B');
  addEdge(graph, 'B', 'C');
  addEdge(graph, 'C', 'A');
  return graph;
}

/**
 * Create a fully connected cartel (everyone cites everyone)
 */
function createFullCartel(size: number = 4): CitationGraph {
  const graph = createGraph();
  const nodes = Array.from({ length: size }, (_, i) => `N${i}`);

  for (const id of nodes) {
    addNode(graph, { id, type: 'paper', name: `Paper ${id}` });
  }

  // Every node cites every other node
  for (const source of nodes) {
    for (const target of nodes) {
      if (source !== target) {
        addEdge(graph, source, target);
      }
    }
  }

  return graph;
}

/**
 * Create a legitimate citation network (star topology - one influential paper)
 */
function createLegitimateNetwork(): CitationGraph {
  const graph = createGraph();

  // Central paper with many citations
  addNode(graph, { id: 'center', type: 'paper', name: 'Seminal Paper' });

  // Many papers cite the center, but don't cite each other
  for (let i = 0; i < 10; i++) {
    const id = `citing_${i}`;
    addNode(graph, { id, type: 'paper', name: `Citing Paper ${i}` });
    addEdge(graph, id, 'center');
  }

  return graph;
}

/**
 * Create a mixed network with both cartel and legitimate patterns
 */
function createMixedNetwork(): CitationGraph {
  const graph = createGraph();

  // Cartel cluster (A, B, C form reciprocal citations)
  addNode(graph, { id: 'cartel_A', type: 'paper' });
  addNode(graph, { id: 'cartel_B', type: 'paper' });
  addNode(graph, { id: 'cartel_C', type: 'paper' });
  addEdge(graph, 'cartel_A', 'cartel_B');
  addEdge(graph, 'cartel_B', 'cartel_A'); // Reciprocal
  addEdge(graph, 'cartel_B', 'cartel_C');
  addEdge(graph, 'cartel_C', 'cartel_B'); // Reciprocal
  addEdge(graph, 'cartel_C', 'cartel_A');
  addEdge(graph, 'cartel_A', 'cartel_C'); // Reciprocal

  // Legitimate cluster (D, E, F, G - hierarchical)
  addNode(graph, { id: 'legit_D', type: 'paper' });
  addNode(graph, { id: 'legit_E', type: 'paper' });
  addNode(graph, { id: 'legit_F', type: 'paper' });
  addNode(graph, { id: 'legit_G', type: 'paper' });
  addEdge(graph, 'legit_E', 'legit_D');
  addEdge(graph, 'legit_F', 'legit_D');
  addEdge(graph, 'legit_G', 'legit_D');
  addEdge(graph, 'legit_G', 'legit_E');

  return graph;
}

/**
 * Create a self-citation network (journal or author gaming)
 */
function createSelfCitationNetwork(): CitationGraph {
  const graph = createGraph();

  // Author/journal that heavily self-cites
  for (let i = 0; i < 5; i++) {
    addNode(graph, { id: `author_paper_${i}`, type: 'paper' });
  }

  // Each paper cites previous papers from same author
  for (let i = 1; i < 5; i++) {
    for (let j = 0; j < i; j++) {
      addEdge(graph, `author_paper_${i}`, `author_paper_${j}`);
    }
  }

  // Also cite a few external papers
  addNode(graph, { id: 'external_1', type: 'paper' });
  addNode(graph, { id: 'external_2', type: 'paper' });
  addEdge(graph, 'author_paper_2', 'external_1');
  addEdge(graph, 'author_paper_4', 'external_2');

  return graph;
}

// =============================================================================
// GRAPH CONSTRUCTION TESTS
// =============================================================================

describe('CIDRE Algorithm', () => {
  describe('graph construction', () => {
    test('creates empty graph', () => {
      const graph = createGraph();
      expect(graph.nodes.size).toBe(0);
      expect(graph.edgeCount).toBe(0);
    });

    test('adds nodes correctly', () => {
      const graph = createGraph();
      addNode(graph, { id: 'test', type: 'paper', name: 'Test Paper' });
      expect(graph.nodes.size).toBe(1);
      expect(graph.nodes.get('test')?.name).toBe('Test Paper');
    });

    test('adds edges correctly', () => {
      const graph = createGraph();
      addEdge(graph, 'A', 'B');
      expect(graph.edgeCount).toBe(1);
      expect(hasEdge(graph, 'A', 'B')).toBe(true);
      expect(hasEdge(graph, 'B', 'A')).toBe(false);
    });

    test('auto-creates nodes when adding edges', () => {
      const graph = createGraph();
      addEdge(graph, 'X', 'Y');
      expect(graph.nodes.has('X')).toBe(true);
      expect(graph.nodes.has('Y')).toBe(true);
    });

    test('aggregates weight for duplicate edges', () => {
      const graph = createGraph();
      addEdge(graph, 'A', 'B', 1);
      addEdge(graph, 'A', 'B', 2);
      expect(graph.edgeCount).toBe(1); // Still one edge
      const edge = graph.outEdges.get('A')?.find((e) => e.target === 'B');
      expect(edge?.weight).toBe(3); // Aggregated weight
    });

    test('buildGraph constructs from array', () => {
      const citations = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' },
        { source: 'C', target: 'A' },
      ];
      const graph = buildGraph(citations);
      expect(graph.nodes.size).toBe(3);
      expect(graph.edgeCount).toBe(3);
    });
  });

  // ===========================================================================
  // GRAPH METRICS TESTS
  // ===========================================================================

  describe('graph metrics', () => {
    test('calculates out-degree', () => {
      const graph = createCartelTriangle();
      expect(outDegree(graph, 'A')).toBe(1);
      expect(outDegree(graph, 'B')).toBe(1);
      expect(outDegree(graph, 'nonexistent')).toBe(0);
    });

    test('calculates in-degree', () => {
      const graph = createCartelTriangle();
      expect(inDegree(graph, 'A')).toBe(1);
      expect(inDegree(graph, 'B')).toBe(1);
    });

    test('gets neighbors correctly', () => {
      const graph = createCartelTriangle();
      expect(getNeighbors(graph, 'A')).toEqual(['B']);
      expect(getInNeighbors(graph, 'A')).toEqual(['C']);
    });

    test('calculates node reciprocity for mutual citations', () => {
      const graph = createGraph();
      addEdge(graph, 'A', 'B');
      addEdge(graph, 'B', 'A'); // Reciprocal
      expect(nodeReciprocity(graph, 'A')).toBeCloseTo(1.0);
    });

    test('calculates node reciprocity for one-way citations', () => {
      const graph = createCartelTriangle();
      // A->B but B does not cite A
      expect(nodeReciprocity(graph, 'A')).toBeCloseTo(0);
    });

    test('calculates global reciprocity', () => {
      const graph = createGraph();
      addEdge(graph, 'A', 'B');
      addEdge(graph, 'B', 'A');
      // 2 edges, both reciprocal = 2/2 = 1.0
      expect(globalReciprocity(graph)).toBeCloseTo(1.0);
    });

    test('global reciprocity is 0 for no reciprocal edges', () => {
      const graph = createCartelTriangle();
      expect(globalReciprocity(graph)).toBeCloseTo(0);
    });

    test('calculates local clustering coefficient', () => {
      const fullCartel = createFullCartel(4);
      // In a fully connected graph, clustering should be 1.0
      const clustering = localClusteringCoefficient(fullCartel, 'N0');
      expect(clustering).toBeCloseTo(1.0);
    });

    test('local clustering is 0 for star topology', () => {
      const star = createLegitimateNetwork();
      // Center has many neighbors but they don't connect to each other
      const clustering = localClusteringCoefficient(star, 'center');
      expect(clustering).toBeCloseTo(0);
    });

    test('calculates global clustering coefficient', () => {
      const fullCartel = createFullCartel(4);
      expect(globalClusteringCoefficient(fullCartel)).toBeGreaterThan(0.8);
    });
  });

  // ===========================================================================
  // CIDRE CORE ALGORITHM TESTS
  // ===========================================================================

  describe('CIDRE core algorithm', () => {
    test('calculates indirect reciprocity for triangle', () => {
      const graph = createCartelTriangle();
      // A->B->C->A forms a cycle
      const score = indirectReciprocityScore(graph, 'A');
      expect(score).toBeGreaterThan(0);
    });

    test('indirect reciprocity is 0 for star topology', () => {
      const star = createLegitimateNetwork();
      const score = indirectReciprocityScore(star, 'center');
      expect(score).toBeCloseTo(0);
    });

    test('calculates node CIDRE score', () => {
      const cartel = createFullCartel(4);
      const score = nodeCIDREScore(cartel, 'N0');
      expect(score).toBeGreaterThan(0.5); // Full cartel should be suspicious
    });

    test('node CIDRE score is low for legitimate network', () => {
      const legit = createLegitimateNetwork();
      const score = nodeCIDREScore(legit, 'center');
      expect(score).toBeLessThan(0.3);
    });

    test('finds strongly connected components', () => {
      const graph = createCartelTriangle();
      const sccs = findStronglyConnectedComponents(graph);
      // Triangle is one SCC
      expect(sccs.length).toBe(1);
      expect(sccs[0].length).toBe(3);
    });

    test('finds no SCCs in star topology', () => {
      const star = createLegitimateNetwork();
      const sccs = findStronglyConnectedComponents(star);
      // Star has no cycles, so no SCCs
      expect(sccs.length).toBe(0);
    });

    test('finds multiple SCCs in mixed network', () => {
      const mixed = createMixedNetwork();
      const sccs = findStronglyConnectedComponents(mixed);
      // Cartel cluster forms an SCC
      expect(sccs.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // CLUSTER ANALYSIS TESTS
  // ===========================================================================

  describe('cluster analysis', () => {
    test('analyzes cartel cluster', () => {
      const graph = createFullCartel(4);
      const members = ['N0', 'N1', 'N2', 'N3'];
      const cluster = analyzeCluster(graph, members);

      expect(cluster.cidreScore).toBeGreaterThan(0.5);
      expect(cluster.internalDensity).toBeCloseTo(1.0);
      expect(cluster.reciprocityIndex).toBeGreaterThan(0.8);
      expect(cluster.members).toHaveLength(4);
    });

    test('legitimate cluster has lower CIDRE score', () => {
      const legit = createLegitimateNetwork();
      const members = ['citing_0', 'citing_1', 'citing_2'];
      const cluster = analyzeCluster(legit, members);

      expect(cluster.cidreScore).toBeLessThan(0.3);
      expect(cluster.internalDensity).toBeCloseTo(0);
    });

    test('cluster external ratio is calculated correctly', () => {
      const mixed = createMixedNetwork();
      const cartelMembers = ['cartel_A', 'cartel_B', 'cartel_C'];
      const cluster = analyzeCluster(mixed, cartelMembers);

      // Cartel has mostly internal citations, low external ratio
      expect(cluster.externalRatio).toBeLessThan(0.2);
    });
  });

  // ===========================================================================
  // FULL CIDRE ANALYSIS TESTS
  // ===========================================================================

  describe('full CIDRE analysis', () => {
    test('analyzes full cartel network', () => {
      const cartel = createFullCartel(4);
      const result = analyzeCIDRE(cartel);

      expect(result.graphMetrics.avgCartelScore).toBeGreaterThan(0.5);
      expect(result.graphMetrics.suspiciousNodeCount).toBeGreaterThanOrEqual(3);
      expect(result.clusters.length).toBeGreaterThanOrEqual(1);
      expect(result.metadata.version).toBe('1.0.0');
    });

    test('analyzes legitimate network', () => {
      const legit = createLegitimateNetwork();
      const result = analyzeCIDRE(legit);

      expect(result.graphMetrics.avgCartelScore).toBeLessThan(0.3);
      expect(result.clusters.length).toBe(0); // No suspicious clusters
    });

    test('detects cartel in mixed network', () => {
      const mixed = createMixedNetwork();
      const result = analyzeCIDRE(mixed);

      // Should find the cartel cluster
      const cartelCluster = result.clusters.find((c) =>
        c.members.includes('cartel_A')
      );
      expect(cartelCluster).toBeDefined();
      expect(cartelCluster?.cidreScore).toBeGreaterThan(0.3);
    });

    test('returns correct metadata', () => {
      const graph = createCartelTriangle();
      const result = analyzeCIDRE(graph);

      expect(result.metadata.nodeCount).toBe(3);
      expect(result.metadata.edgeCount).toBe(3);
      expect(result.metadata.analysisTime).toBeGreaterThanOrEqual(0);
    });
  });

  // ===========================================================================
  // UTILITY FUNCTION TESTS
  // ===========================================================================

  describe('utility functions', () => {
    test('getCartelCentrality returns score for node', () => {
      const graph = createFullCartel(4);
      const result = analyzeCIDRE(graph);
      const score = getCartelCentrality(result, 'N0');
      expect(score).toBeGreaterThan(0);
    });

    test('getCartelCentrality returns 0 for unknown node', () => {
      const graph = createGraph();
      const result = analyzeCIDRE(graph);
      expect(getCartelCentrality(result, 'unknown')).toBe(0);
    });

    test('isInCartelCluster detects cluster membership', () => {
      const cartel = createFullCartel(4);
      const result = analyzeCIDRE(cartel);
      expect(isInCartelCluster(result, 'N0')).toBe(true);
    });

    test('isInCartelCluster returns false for legitimate node', () => {
      const legit = createLegitimateNetwork();
      const result = analyzeCIDRE(legit);
      expect(isInCartelCluster(result, 'center')).toBe(false);
    });

    test('getNodeCluster returns cluster for cartel member', () => {
      const cartel = createFullCartel(4);
      const result = analyzeCIDRE(cartel);
      const cluster = getNodeCluster(result, 'N0');
      expect(cluster).toBeDefined();
      expect(cluster?.members).toContain('N0');
    });
  });

  // ===========================================================================
  // QUICK CARTEL CHECK TESTS
  // ===========================================================================

  describe('quickCartelCheck', () => {
    test('detects suspicious citation pattern', () => {
      const citations = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'A' }, // Reciprocal
        { source: 'B', target: 'C' },
        { source: 'C', target: 'B' }, // Reciprocal
        { source: 'C', target: 'A' },
        { source: 'A', target: 'C' }, // Reciprocal
      ];
      const result = quickCartelCheck(citations);
      expect(result.suspicious).toBe(true);
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.reason).toBeDefined();
    });

    test('returns not suspicious for normal citations', () => {
      const citations = [
        { source: 'A', target: 'seminal' },
        { source: 'B', target: 'seminal' },
        { source: 'C', target: 'seminal' },
        { source: 'D', target: 'seminal' },
      ];
      const result = quickCartelCheck(citations);
      expect(result.suspicious).toBe(false);
      expect(result.score).toBeLessThan(0.3);
    });

    test('returns safe for small networks', () => {
      const citations = [{ source: 'A', target: 'B' }];
      const result = quickCartelCheck(citations);
      expect(result.suspicious).toBe(false);
      expect(result.score).toBe(0);
    });

    test('detects high reciprocity', () => {
      const citations = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'A' },
        { source: 'C', target: 'D' },
        { source: 'D', target: 'C' },
        { source: 'A', target: 'C' },
      ];
      const result = quickCartelCheck(citations);
      // High reciprocity should be flagged
      expect(result.score).toBeGreaterThan(0.3);
    });
  });

  // ===========================================================================
  // INTEGRATION WITH VALIDATOR TESTS
  // ===========================================================================

  describe('integration with validator', () => {
    // These tests verify the CIDRE output format works with the validator
    test('produces scores in valid range', () => {
      const graph = createFullCartel(10);
      const result = analyzeCIDRE(graph);

      for (const score of result.nodeCentrality.values()) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }

      for (const cluster of result.clusters) {
        expect(cluster.cidreScore).toBeGreaterThanOrEqual(0);
        expect(cluster.cidreScore).toBeLessThanOrEqual(1);
      }
    });

    test('graph metrics are normalized', () => {
      const graph = createMixedNetwork();
      const result = analyzeCIDRE(graph);

      expect(result.graphMetrics.globalReciprocity).toBeGreaterThanOrEqual(0);
      expect(result.graphMetrics.globalReciprocity).toBeLessThanOrEqual(1);
      expect(result.graphMetrics.globalClustering).toBeGreaterThanOrEqual(0);
      expect(result.graphMetrics.globalClustering).toBeLessThanOrEqual(1);
      expect(result.graphMetrics.avgCartelScore).toBeGreaterThanOrEqual(0);
      expect(result.graphMetrics.avgCartelScore).toBeLessThanOrEqual(1);
    });

    test('quickCartelCheck output matches validator expectations', () => {
      const citations = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'A' },
        { source: 'C', target: 'A' },
      ];
      const result = quickCartelCheck(citations);

      // Should have all required fields
      expect(typeof result.score).toBe('number');
      expect(typeof result.suspicious).toBe('boolean');
      expect(result.reason === undefined || typeof result.reason === 'string').toBe(true);
    });
  });

  // ===========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ===========================================================================

  describe('edge cases', () => {
    test('handles empty graph', () => {
      const graph = createGraph();
      const result = analyzeCIDRE(graph);
      expect(result.nodeCentrality.size).toBe(0);
      expect(result.clusters).toHaveLength(0);
      expect(result.graphMetrics.avgCartelScore).toBe(0);
    });

    test('handles single node graph', () => {
      const graph = createGraph();
      addNode(graph, { id: 'alone', type: 'paper' });
      const result = analyzeCIDRE(graph);
      expect(result.nodeCentrality.size).toBe(1);
      expect(getCartelCentrality(result, 'alone')).toBe(0);
    });

    test('handles self-citation pattern', () => {
      const graph = createSelfCitationNetwork();
      const result = analyzeCIDRE(graph);
      // Self-citation shouldn't trigger high cartel scores
      expect(result.graphMetrics.avgCartelScore).toBeLessThan(0.5);
    });

    test('handles large graph efficiently', () => {
      const citations = [];
      for (let i = 0; i < 100; i++) {
        citations.push({ source: `node_${i}`, target: `node_${(i + 1) % 100}` });
      }
      const graph = buildGraph(citations);
      const start = Date.now();
      const result = analyzeCIDRE(graph);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.metadata.nodeCount).toBe(100);
    });
  });
});
