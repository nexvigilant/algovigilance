/**
 * CIDRE Algorithm - Citation cartel Indirect REciprocity Detection
 *
 * Detects citation manipulation networks by analyzing indirect reciprocity patterns
 * in citation graphs. Based on the principle that citation cartels exhibit unusual
 * levels of reciprocal citation (A cites B, B cites A) and indirect reciprocity
 * (A cites B, B cites C, C cites A - forming citation triangles).
 *
 * References:
 * - Fister et al. (2016): "Toward the Discovery of Citation Cartels in Citation Networks"
 * - Heneberg (2016): "From Excessive Journal Self-Citation to Citation Stacking"
 * - García et al. (2019): "Detecting Citation Cartels in Academic Networks"
 */

// =============================================================================
// TYPES - GRAPH DATA STRUCTURES
// =============================================================================

export interface CitationNode {
  /** Unique identifier for the node (paper DOI, author ID, etc.) */
  id: string;
  /** Type of node */
  type: 'paper' | 'author' | 'journal';
  /** Display name */
  name?: string;
  /** Year of publication (for papers) */
  year?: number;
  /** Associated metadata */
  metadata?: Record<string, unknown>;
}

export interface CitationEdge {
  /** Source node ID (the citing entity) */
  source: string;
  /** Target node ID (the cited entity) */
  target: string;
  /** Weight of the edge (number of citations if aggregated) */
  weight: number;
  /** Year of the citation */
  year?: number;
}

export interface CitationGraph {
  /** All nodes in the graph */
  nodes: Map<string, CitationNode>;
  /** Adjacency list: source -> [targets] */
  outEdges: Map<string, CitationEdge[]>;
  /** Reverse adjacency list: target -> [sources] */
  inEdges: Map<string, CitationEdge[]>;
  /** Total edge count */
  edgeCount: number;
}

export interface CartelCluster {
  /** Nodes identified as part of this cartel */
  members: string[];
  /** CIDRE score for this cluster (0-1, higher = more suspicious) */
  cidreScore: number;
  /** Internal citation density */
  internalDensity: number;
  /** External citation ratio */
  externalRatio: number;
  /** Reciprocity index within cluster */
  reciprocityIndex: number;
  /** Confidence in this detection */
  confidence: number;
}

export interface CIDREResult {
  /** Individual node cartel centrality scores */
  nodeCentrality: Map<string, number>;
  /** Detected cartel clusters */
  clusters: CartelCluster[];
  /** Overall graph metrics */
  graphMetrics: {
    globalReciprocity: number;
    globalClustering: number;
    avgCartelScore: number;
    suspiciousNodeCount: number;
  };
  /** Analysis metadata */
  metadata: {
    nodeCount: number;
    edgeCount: number;
    analysisTime: number;
    version: string;
  };
}

// =============================================================================
// GRAPH CONSTRUCTION
// =============================================================================

/**
 * Create an empty citation graph
 */
export function createGraph(): CitationGraph {
  return {
    nodes: new Map(),
    outEdges: new Map(),
    inEdges: new Map(),
    edgeCount: 0,
  };
}

/**
 * Add a node to the graph
 */
export function addNode(graph: CitationGraph, node: CitationNode): void {
  if (!graph.nodes.has(node.id)) {
    graph.nodes.set(node.id, node);
    graph.outEdges.set(node.id, []);
    graph.inEdges.set(node.id, []);
  }
}

/**
 * Add a directed edge (citation) to the graph
 */
export function addEdge(
  graph: CitationGraph,
  source: string,
  target: string,
  weight: number = 1,
  year?: number
): void {
  // Ensure nodes exist
  if (!graph.nodes.has(source)) {
    addNode(graph, { id: source, type: 'paper' });
  }
  if (!graph.nodes.has(target)) {
    addNode(graph, { id: target, type: 'paper' });
  }

  // Check for existing edge
  const existingEdge = graph.outEdges.get(source)?.find((e) => e.target === target);
  if (existingEdge) {
    existingEdge.weight += weight;
    return;
  }

  const edge: CitationEdge = { source, target, weight, year };
  const outList = graph.outEdges.get(source);
  const inList = graph.inEdges.get(target);
  if (!outList || !inList) {
    throw new Error(`Node adjacency lists missing for edge ${source} -> ${target}`);
  }
  outList.push(edge);
  inList.push(edge);
  graph.edgeCount++;
}

/**
 * Build citation graph from array of citation relationships
 */
export function buildGraph(
  citations: Array<{ source: string; target: string; weight?: number; year?: number }>
): CitationGraph {
  const graph = createGraph();

  for (const citation of citations) {
    addEdge(graph, citation.source, citation.target, citation.weight ?? 1, citation.year);
  }

  return graph;
}

// =============================================================================
// GRAPH METRICS
// =============================================================================

/**
 * Calculate out-degree (citations made)
 */
export function outDegree(graph: CitationGraph, nodeId: string): number {
  return graph.outEdges.get(nodeId)?.length ?? 0;
}

/**
 * Calculate in-degree (citations received)
 */
export function inDegree(graph: CitationGraph, nodeId: string): number {
  return graph.inEdges.get(nodeId)?.length ?? 0;
}

/**
 * Check if edge exists from source to target
 */
export function hasEdge(graph: CitationGraph, source: string, target: string): boolean {
  return graph.outEdges.get(source)?.some((e) => e.target === target) ?? false;
}

/**
 * Get neighbors (outgoing citations)
 */
export function getNeighbors(graph: CitationGraph, nodeId: string): string[] {
  return graph.outEdges.get(nodeId)?.map((e) => e.target) ?? [];
}

/**
 * Get in-neighbors (incoming citations)
 */
export function getInNeighbors(graph: CitationGraph, nodeId: string): string[] {
  return graph.inEdges.get(nodeId)?.map((e) => e.source) ?? [];
}

/**
 * Calculate direct reciprocity for a node
 * Reciprocity = (2 * mutual links) / total links
 */
export function nodeReciprocity(graph: CitationGraph, nodeId: string): number {
  const outNeighbors = new Set(getNeighbors(graph, nodeId));
  const inNeighbors = new Set(getInNeighbors(graph, nodeId));

  const totalDegree = outNeighbors.size + inNeighbors.size;
  if (totalDegree === 0) return 0;

  let mutualCount = 0;
  for (const neighbor of outNeighbors) {
    if (inNeighbors.has(neighbor)) {
      mutualCount++;
    }
  }

  return (2 * mutualCount) / totalDegree;
}

/**
 * Calculate global reciprocity of the graph
 */
export function globalReciprocity(graph: CitationGraph): number {
  let mutualEdges = 0;

  for (const [source, edges] of graph.outEdges) {
    for (const edge of edges) {
      if (hasEdge(graph, edge.target, source)) {
        mutualEdges++;
      }
    }
  }

  // Each mutual pair is counted twice, so divide by 2
  // Then divide by total edges for ratio
  if (graph.edgeCount === 0) return 0;
  return mutualEdges / graph.edgeCount;
}

/**
 * Calculate local clustering coefficient for a node
 * Measures how interconnected a node's neighbors are
 */
export function localClusteringCoefficient(graph: CitationGraph, nodeId: string): number {
  const neighbors = new Set([...getNeighbors(graph, nodeId), ...getInNeighbors(graph, nodeId)]);
  neighbors.delete(nodeId); // Remove self if present

  const k = neighbors.size;
  if (k < 2) return 0;

  let triangles = 0;
  const neighborArray = Array.from(neighbors);

  for (let i = 0; i < neighborArray.length; i++) {
    for (let j = i + 1; j < neighborArray.length; j++) {
      const n1 = neighborArray[i];
      const n2 = neighborArray[j];
      // Check if neighbors are connected (in either direction)
      if (hasEdge(graph, n1, n2) || hasEdge(graph, n2, n1)) {
        triangles++;
      }
    }
  }

  // Maximum possible triangles = k * (k - 1) / 2
  const maxTriangles = (k * (k - 1)) / 2;
  return triangles / maxTriangles;
}

/**
 * Calculate average clustering coefficient for entire graph
 */
export function globalClusteringCoefficient(graph: CitationGraph): number {
  if (graph.nodes.size === 0) return 0;

  let sum = 0;
  let count = 0;

  for (const nodeId of graph.nodes.keys()) {
    const degree = outDegree(graph, nodeId) + inDegree(graph, nodeId);
    if (degree >= 2) {
      sum += localClusteringCoefficient(graph, nodeId);
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}

// =============================================================================
// CIDRE ALGORITHM - CORE IMPLEMENTATION
// =============================================================================

/**
 * Calculate indirect reciprocity score for a node
 *
 * Indirect reciprocity measures citation triangles:
 * A -> B -> C -> A (cycle of length 3)
 *
 * This is the key metric for cartel detection because:
 * - Normal citations rarely form cycles
 * - Cartels create artificial citation loops
 */
export function indirectReciprocityScore(graph: CitationGraph, nodeId: string): number {
  const outNeighbors = getNeighbors(graph, nodeId);
  const inNeighbors = getInNeighbors(graph, nodeId);

  if (outNeighbors.length === 0 || inNeighbors.length === 0) {
    return 0;
  }

  let cycleCount = 0;
  let possibleCycles = 0;

  // For each A -> B edge
  for (const b of outNeighbors) {
    // Check if B -> ? -> A exists (indirect path back)
    const bOutNeighbors = getNeighbors(graph, b);

    for (const c of bOutNeighbors) {
      if (c === nodeId) continue; // Skip direct reciprocity

      possibleCycles++;

      // Check if C -> A exists
      if (hasEdge(graph, c, nodeId)) {
        cycleCount++;
      }
    }
  }

  // Normalize by possible cycles
  return possibleCycles > 0 ? cycleCount / possibleCycles : 0;
}

/**
 * Calculate CIDRE score for a single node
 *
 * Combines multiple signals:
 * 1. Direct reciprocity (A <-> B)
 * 2. Indirect reciprocity (A -> B -> C -> A)
 * 3. Local clustering (how interconnected neighbors are)
 * 4. Citation imbalance (unusual in/out degree ratio)
 */
export function nodeCIDREScore(graph: CitationGraph, nodeId: string): number {
  const weights = {
    directReciprocity: 0.25,
    indirectReciprocity: 0.35,
    localClustering: 0.25,
    imbalance: 0.15,
  };

  // 1. Direct reciprocity
  const directRec = nodeReciprocity(graph, nodeId);

  // 2. Indirect reciprocity (triangle closure)
  const indirectRec = indirectReciprocityScore(graph, nodeId);

  // 3. Local clustering coefficient
  const clustering = localClusteringCoefficient(graph, nodeId);

  // 4. Citation imbalance (suspicious if citations received >> citations made from close nodes)
  const outDeg = outDegree(graph, nodeId);
  const inDeg = inDegree(graph, nodeId);
  const totalDeg = outDeg + inDeg;

  // Imbalance is suspicious when high in-degree but citations are from a small clique
  let imbalance = 0;
  if (totalDeg > 0) {
    const uniqueInNeighbors = new Set(getInNeighbors(graph, nodeId)).size;
    const uniqueOutNeighbors = new Set(getNeighbors(graph, nodeId)).size;
    const neighborDiversity = (uniqueInNeighbors + uniqueOutNeighbors) / totalDeg;
    // Low diversity + high degree = suspicious
    imbalance = totalDeg > 5 ? 1 - neighborDiversity : 0;
  }

  // Weighted combination
  const score =
    weights.directReciprocity * directRec +
    weights.indirectReciprocity * indirectRec +
    weights.localClustering * clustering +
    weights.imbalance * imbalance;

  return Math.min(1, Math.max(0, score));
}

/**
 * Detect strongly connected components using Tarjan's algorithm
 * These are potential cartel clusters
 */
export function findStronglyConnectedComponents(graph: CitationGraph): string[][] {
  const index = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const components: string[][] = [];
  let currentIndex = 0;

  function strongConnect(nodeId: string): void {
    index.set(nodeId, currentIndex);
    lowlink.set(nodeId, currentIndex);
    currentIndex++;
    stack.push(nodeId);
    onStack.add(nodeId);

    for (const neighbor of getNeighbors(graph, nodeId)) {
      if (!index.has(neighbor)) {
        strongConnect(neighbor);
        const nodeLow = lowlink.get(nodeId) ?? 0;
        const neighborLow = lowlink.get(neighbor) ?? 0;
        lowlink.set(nodeId, Math.min(nodeLow, neighborLow));
      } else if (onStack.has(neighbor)) {
        const nodeLow = lowlink.get(nodeId) ?? 0;
        const neighborIdx = index.get(neighbor) ?? 0;
        lowlink.set(nodeId, Math.min(nodeLow, neighborIdx));
      }
    }

    if (lowlink.get(nodeId) === index.get(nodeId)) {
      const component: string[] = [];
      let w: string | undefined;
      do {
        w = stack.pop();
        if (w === undefined) break;
        onStack.delete(w);
        component.push(w);
      } while (w !== nodeId);

      if (component.length >= 2) {
        // Only report non-trivial components
        components.push(component);
      }
    }
  }

  for (const nodeId of graph.nodes.keys()) {
    if (!index.has(nodeId)) {
      strongConnect(nodeId);
    }
  }

  return components;
}

/**
 * Calculate metrics for a potential cartel cluster
 */
export function analyzeCluster(graph: CitationGraph, members: string[]): CartelCluster {
  const memberSet = new Set(members);

  let internalEdges = 0;
  let externalEdges = 0;
  let reciprocalPairs = 0;

  for (const member of members) {
    const outEdges = graph.outEdges.get(member) ?? [];
    for (const edge of outEdges) {
      if (memberSet.has(edge.target)) {
        internalEdges++;
        // Check reciprocity
        if (hasEdge(graph, edge.target, member)) {
          reciprocalPairs++;
        }
      } else {
        externalEdges++;
      }
    }
  }

  const maxInternalEdges = members.length * (members.length - 1);
  const internalDensity = maxInternalEdges > 0 ? internalEdges / maxInternalEdges : 0;
  const externalRatio = internalEdges + externalEdges > 0
    ? externalEdges / (internalEdges + externalEdges)
    : 1;
  const reciprocityIndex = internalEdges > 0 ? reciprocalPairs / internalEdges : 0;

  // CIDRE score for cluster
  // High internal density + high reciprocity + low external ratio = suspicious
  const cidreScore =
    0.4 * internalDensity +
    0.35 * reciprocityIndex +
    0.25 * (1 - externalRatio);

  // Confidence based on cluster size and edge count
  const confidence = Math.min(1, (members.length / 5) * (internalEdges / 10));

  return {
    members,
    cidreScore: Math.min(1, Math.max(0, cidreScore)),
    internalDensity,
    externalRatio,
    reciprocityIndex,
    confidence,
  };
}

/**
 * Main CIDRE analysis function
 *
 * Analyzes a citation graph and identifies:
 * 1. Individual node cartel centrality scores
 * 2. Suspicious clusters (potential cartels)
 * 3. Global graph metrics
 */
export function analyzeCIDRE(graph: CitationGraph): CIDREResult {
  const startTime = Date.now();

  // Calculate node-level CIDRE scores
  const nodeCentrality = new Map<string, number>();
  for (const nodeId of graph.nodes.keys()) {
    nodeCentrality.set(nodeId, nodeCIDREScore(graph, nodeId));
  }

  // Find strongly connected components (potential cartels)
  const sccs = findStronglyConnectedComponents(graph);

  // Analyze each component
  const clusters = sccs
    .map((members) => analyzeCluster(graph, members))
    .filter((cluster) => cluster.cidreScore > 0.3) // Only report suspicious clusters
    .sort((a, b) => b.cidreScore - a.cidreScore);

  // Calculate global metrics
  const globalRec = globalReciprocity(graph);
  const globalClust = globalClusteringCoefficient(graph);

  let scoreSum = 0;
  let suspiciousCount = 0;
  for (const score of nodeCentrality.values()) {
    scoreSum += score;
    if (score > 0.5) suspiciousCount++;
  }

  const avgScore = nodeCentrality.size > 0 ? scoreSum / nodeCentrality.size : 0;

  return {
    nodeCentrality,
    clusters,
    graphMetrics: {
      globalReciprocity: globalRec,
      globalClustering: globalClust,
      avgCartelScore: avgScore,
      suspiciousNodeCount: suspiciousCount,
    },
    metadata: {
      nodeCount: graph.nodes.size,
      edgeCount: graph.edgeCount,
      analysisTime: Date.now() - startTime,
      version: '1.0.0',
    },
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get cartel centrality for a specific node
 * Returns 0 if node not in graph
 */
export function getCartelCentrality(result: CIDREResult, nodeId: string): number {
  return result.nodeCentrality.get(nodeId) ?? 0;
}

/**
 * Check if a node is in any detected cartel cluster
 */
export function isInCartelCluster(result: CIDREResult, nodeId: string): boolean {
  return result.clusters.some((cluster) => cluster.members.includes(nodeId));
}

/**
 * Get the most suspicious cluster containing a node
 */
export function getNodeCluster(result: CIDREResult, nodeId: string): CartelCluster | undefined {
  return result.clusters.find((cluster) => cluster.members.includes(nodeId));
}

/**
 * Quick cartel check for a single paper based on its citation network
 * Useful for validating research without full graph analysis
 */
export function quickCartelCheck(
  citations: Array<{ source: string; target: string; sourceYear?: number; targetYear?: number }>
): { score: number; suspicious: boolean; reason?: string } {
  if (citations.length < 3) {
    return { score: 0, suspicious: false };
  }

  // Build mini-graph
  const graph = buildGraph(citations);

  // Calculate global metrics
  const reciprocity = globalReciprocity(graph);
  const clustering = globalClusteringCoefficient(graph);

  // Suspicious if high reciprocity AND high clustering
  const score = 0.5 * reciprocity + 0.5 * clustering;
  const suspicious = score > 0.5 || reciprocity > 0.4;

  let reason: string | undefined;
  if (suspicious) {
    if (reciprocity > 0.4) {
      reason = `High citation reciprocity (${(reciprocity * 100).toFixed(1)}%)`;
    } else if (clustering > 0.6) {
      reason = `High citation clustering (${(clustering * 100).toFixed(1)}%)`;
    }
  }

  return { score, suspicious, reason };
}
