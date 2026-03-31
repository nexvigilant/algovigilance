'use server';

/**
 * Research Validation Server Actions
 *
 * Secure server-side actions for citation network analysis and CIDRE cartel detection.
 */

import { z } from 'zod';

import { logger } from '@/lib/logger';
const log = logger.scope('actions');
import {
  OpenAlexClient,
  OpenAlexError,
  OpenAlexNotFoundError,
  analyzeCIDRE,
  enrichWithSemanticScholar,
  SemanticScholarError,
  type CIDREResult,
  type CitationGraph,
  type FetchCitationNetworkOptions,
  type EnrichedCitationRelationship,
} from '@/lib/algorithms';

// =============================================================================
// SCHEMAS
// =============================================================================

const AnalyzeCitationsInputSchema = z.object({
  /** DOI or OpenAlex Work ID (e.g., "10.1038/s41586-021-03819-2" or "W2741809807") */
  workId: z.string().min(1, 'Work ID is required'),
  /** Depth of citation network to analyze (1-3) */
  depth: z.number().int().min(1).max(3).default(1),
  /** Maximum nodes to include in the network */
  maxNodes: z.number().int().min(10).max(1000).default(200),
  /** CIDRE detection threshold (0-1) */
  cidreThreshold: z.number().min(0).max(1).default(0.5),
  /** Enable Semantic Scholar enrichment for citation context */
  enableS2Enrichment: z.boolean().default(false),
});

export type AnalyzeCitationsInput = z.infer<typeof AnalyzeCitationsInputSchema>;

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Citation context data from Semantic Scholar enrichment
 */
export interface CitationContextData {
  /** Citing paper ID */
  source: string;
  /** Cited paper ID */
  target: string;
  /** Whether this is an influential citation */
  isInfluential: boolean;
  /** Citation intents (background, methodology, result_comparison) */
  intents: string[];
  /** Text snippets where the citation appears */
  contexts: string[];
}

export interface AnalyzeCitationsResult {
  success: true;
  /** The analyzed work's metadata */
  work: {
    id: string;
    doi?: string;
    title: string;
    year?: number;
    citedByCount: number;
    isRetracted: boolean;
  };
  /** Citation graph data for visualization */
  graph: SerializedCitationGraph;
  /** CIDRE cartel detection results */
  cidre: CIDREResult;
  /** Semantic Scholar citation context (when enableS2Enrichment is true) */
  citationContexts?: CitationContextData[];
  /** Analysis metadata */
  meta: {
    analysisTimeMs: number;
    nodeCount: number;
    edgeCount: number;
    depth: number;
    s2EnrichmentEnabled: boolean;
    s2EnrichmentStatus?: 'success' | 'partial' | 'failed';
    s2EnrichmentError?: string;
  };
}

export interface AnalyzeCitationsError {
  success: false;
  error: string;
  code: 'NOT_FOUND' | 'RATE_LIMIT' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN';
}

export type AnalyzeCitationsResponse = AnalyzeCitationsResult | AnalyzeCitationsError;

/**
 * Serialized version of CitationGraph for client transport
 * (Maps are not serializable, so we convert to arrays)
 */
export interface SerializedCitationGraph {
  nodes: Array<{
    id: string;
    type: 'paper' | 'author' | 'journal';
    name?: string;
    year?: number;
    metadata?: Record<string, unknown>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight: number;
    year?: number;
  }>;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convert CitationGraph (with Maps) to serializable format
 */
function serializeGraph(graph: CitationGraph): SerializedCitationGraph {
  const nodes: SerializedCitationGraph['nodes'] = [];
  for (const node of graph.nodes.values()) {
    nodes.push({
      id: node.id,
      type: node.type,
      name: node.name,
      year: node.year,
      metadata: node.metadata,
    });
  }

  const edges: SerializedCitationGraph['edges'] = [];
  // Flatten outEdges Map into array
  for (const edgeList of graph.outEdges.values()) {
    for (const edge of edgeList) {
      edges.push({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        year: edge.year,
      });
    }
  }

  return { nodes, edges };
}

// =============================================================================
// SERVER ACTIONS
// =============================================================================

/**
 * Analyze a research paper's citation network for cartel patterns
 *
 * @param input - Work ID (DOI or OpenAlex ID) and analysis options
 * @returns Citation graph data and CIDRE cartel detection results
 */
export async function analyzeCitations(
  input: AnalyzeCitationsInput
): Promise<AnalyzeCitationsResponse> {
  const startTime = Date.now();

  // Validate input
  const parseResult = AnalyzeCitationsInputSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION',
    };
  }

  const { workId, depth, maxNodes, cidreThreshold: _cidreThreshold, enableS2Enrichment } = parseResult.data;

  try {
    // Initialize OpenAlex client
    const client = new OpenAlexClient({
      email: 'api@nexvigilant.com',
      maxRetries: 3,
    });

    // Fetch the main work metadata
    const work = await client.getWork(workId);

    // Build citation network
    const options: FetchCitationNetworkOptions = {
      workId: work.id,
      depth,
      maxNodes,
    };

    const graph = await client.buildCitationGraph(options);

    // Run CIDRE analysis
    // Note: cidreThreshold is used for filtering results in the UI, not in the algorithm
    const cidreResult = analyzeCIDRE(graph);

    // Serialize graph for transport
    const serializedGraph = serializeGraph(graph);

    // Optional: Enrich with Semantic Scholar citation context
    let citationContexts: CitationContextData[] | undefined;
    let s2EnrichmentStatus: 'success' | 'partial' | 'failed' | undefined;
    let s2EnrichmentError: string | undefined;

    if (enableS2Enrichment) {
      try {
        // Get S2 paper ID (prefer DOI format)
        const s2PaperId = work.doi ? `doi:${work.doi}` : work.id;

        // Build basic citation relationships from graph edges
        const relationships = serializedGraph.edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
          year: edge.year,
        }));

        // Enrich with S2 context
        const enriched = await enrichWithSemanticScholar(relationships, s2PaperId);

        // Transform to CitationContextData
        citationContexts = enriched.map((rel: EnrichedCitationRelationship) => ({
          source: rel.source,
          target: rel.target,
          isInfluential: rel.isInfluential,
          intents: rel.intents,
          contexts: rel.contexts,
        }));

        s2EnrichmentStatus = 'success';
      } catch (s2Error) {
        // S2 enrichment is optional - don't fail the whole analysis
        s2EnrichmentStatus = 'failed';
        s2EnrichmentError =
          s2Error instanceof SemanticScholarError
            ? s2Error.message
            : 'Failed to fetch citation context from Semantic Scholar';
        log.warn('S2 enrichment failed:', s2Error);
      }
    }

    const analysisTime = Date.now() - startTime;

    return {
      success: true,
      work: {
        id: work.id,
        doi: work.doi,
        title: work.title,
        year: work.publication_year,
        citedByCount: work.cited_by_count,
        isRetracted: work.is_retracted,
      },
      graph: serializedGraph,
      cidre: cidreResult,
      citationContexts,
      meta: {
        analysisTimeMs: analysisTime,
        nodeCount: graph.nodes.size,
        edgeCount: graph.edgeCount,
        depth,
        s2EnrichmentEnabled: enableS2Enrichment,
        s2EnrichmentStatus,
        s2EnrichmentError,
      },
    };
  } catch (error) {
    if (error instanceof OpenAlexNotFoundError) {
      return {
        success: false,
        error: `Work not found: "${workId}". Please check the DOI or OpenAlex ID.`,
        code: 'NOT_FOUND',
      };
    }

    if (error instanceof OpenAlexError) {
      if (error.message.includes('Rate limit')) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again in a few minutes.',
          code: 'RATE_LIMIT',
        };
      }
      return {
        success: false,
        error: `API error: ${error.message}`,
        code: 'NETWORK',
      };
    }

    log.error('Citation analysis error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during analysis.',
      code: 'UNKNOWN',
    };
  }
}

/**
 * Quick validation to check if a work ID exists
 */
export async function validateWorkId(
  workId: string
): Promise<{ valid: boolean; title?: string; error?: string }> {
  if (!workId || workId.trim().length === 0) {
    return { valid: false, error: 'Work ID is required' };
  }

  try {
    const client = new OpenAlexClient({
      email: 'api@nexvigilant.com',
      maxRetries: 2,
    });

    const work = await client.getWork(workId);
    return { valid: true, title: work.title };
  } catch (error) {
    if (error instanceof OpenAlexNotFoundError) {
      return { valid: false, error: 'Work not found' };
    }
    return { valid: false, error: 'Unable to validate work ID' };
  }
}
