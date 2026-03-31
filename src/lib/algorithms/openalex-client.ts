/**
 * OpenAlex API Client
 *
 * HTTP client for OpenAlex scholarly metadata API with:
 * - Polite pool access (higher rate limits with email)
 * - Request rate limiting
 * - Automatic pagination
 * - Error handling with retries
 *
 * @see https://docs.openalex.org/
 */

import {
  type OpenAlexWork,
  type CitationRelationship,
  type FetchCitationNetworkOptions,
  API_ENDPOINTS,
} from './api-integration-architecture';
import {
  type CitationGraph,
  type CitationNode,
  createGraph,
  addNode,
  addEdge,
} from './cidre-algorithm';
import { RateLimiter } from '@/lib/concurrency';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG = {
  /** Base URL for OpenAlex API */
  baseUrl: API_ENDPOINTS.openAlex.base,
  /** Email for polite pool access (100k requests/day vs 10k) */
  email: 'api@nexvigilant.com',
  /** Results per page (max 200) */
  perPage: 100,
  /** Maximum concurrent requests */
  maxConcurrent: 5,
  /** Delay between requests in ms (polite pool allows ~10 req/s) */
  requestDelayMs: 100,
  /** Maximum retries on failure */
  maxRetries: 3,
  /** Base delay for exponential backoff in ms */
  retryDelayMs: 1000,
  /** Request timeout in ms */
  timeoutMs: 30000,
};

export type OpenAlexConfig = Partial<typeof DEFAULT_CONFIG>;

// RateLimiter imported from @/lib/concurrency

// =============================================================================
// ERROR TYPES
// =============================================================================

export class OpenAlexError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'OpenAlexError';
  }
}

export class OpenAlexRateLimitError extends OpenAlexError {
  constructor(retryAfter?: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter ?? 'unknown'} seconds`);
    this.name = 'OpenAlexRateLimitError';
  }
}

export class OpenAlexNotFoundError extends OpenAlexError {
  constructor(workId: string) {
    super(`Work not found: ${workId}`);
    this.name = 'OpenAlexNotFoundError';
  }
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

interface OpenAlexListResponse<T> {
  meta: {
    count: number;
    db_response_time_ms: number;
    page: number;
    per_page: number;
  };
  results: T[];
}

// =============================================================================
// CLIENT CLASS
// =============================================================================

export class OpenAlexClient {
  private config: typeof DEFAULT_CONFIG;
  private rateLimiter: RateLimiter;

  constructor(config?: OpenAlexConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rateLimiter = new RateLimiter({
      maxConcurrent: this.config.maxConcurrent,
      delayMs: this.config.requestDelayMs,
    });
  }

  // ---------------------------------------------------------------------------
  // Core Fetch Methods
  // ---------------------------------------------------------------------------

  /**
   * Make a request to the OpenAlex API
   */
  private async request<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);

    // Add query parameters
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    // Add email for polite pool access
    if (this.config.email) {
      url.searchParams.set('mailto', this.config.email);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        await this.rateLimiter.acquire();

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeoutMs
        );

        try {
          const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
              'User-Agent': 'AlgoVigilance-CMER/2.0 (api@nexvigilant.com)',
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            if (response.status === 429) {
              const retryAfter = response.headers.get('Retry-After');
              throw new OpenAlexRateLimitError(
                retryAfter ? parseInt(retryAfter, 10) : undefined
              );
            }
            if (response.status === 404) {
              throw new OpenAlexNotFoundError(endpoint);
            }
            throw new OpenAlexError(
              `HTTP ${response.status}: ${response.statusText}`,
              response.status,
              await response.text()
            );
          }

          return (await response.json()) as T;
        } finally {
          clearTimeout(timeoutId);
          this.rateLimiter.release();
        }
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 404 or abort
        if (
          error instanceof OpenAlexNotFoundError ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          throw error;
        }

        // Exponential backoff for retries
        if (attempt < this.config.maxRetries - 1) {
          const delay =
            this.config.retryDelayMs * Math.pow(2, attempt) +
            Math.random() * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new OpenAlexError('Request failed after retries');
  }

  // ---------------------------------------------------------------------------
  // Work Fetching
  // ---------------------------------------------------------------------------

  /**
   * Get a single work by ID (OpenAlex ID or DOI)
   */
  async getWork(workId: string): Promise<OpenAlexWork> {
    // Normalize ID format
    const normalizedId = this.normalizeWorkId(workId);
    return this.request<OpenAlexWork>(`/works/${normalizedId}`);
  }

  /**
   * Get multiple works by IDs
   */
  async getWorks(
    workIds: string[],
    options?: { select?: string[] }
  ): Promise<OpenAlexWork[]> {
    if (workIds.length === 0) return [];

    // OpenAlex supports filtering by multiple IDs with OR
    const normalizedIds = workIds.map((id) => this.normalizeWorkId(id));
    const filter = `openalex:${normalizedIds.join('|openalex:')}`;

    const params: Record<string, string | number> = {
      filter,
      per_page: Math.min(workIds.length, 200),
    };

    if (options?.select) {
      params.select = options.select.join(',');
    }

    const response = await this.request<OpenAlexListResponse<OpenAlexWork>>(
      '/works',
      params
    );
    return response.results;
  }

  /**
   * Get works that cite a given work
   */
  async getCitingWorks(
    workId: string,
    options?: { maxResults?: number; select?: string[] }
  ): Promise<OpenAlexWork[]> {
    const normalizedId = this.normalizeWorkId(workId);
    const maxResults = options?.maxResults ?? 1000;
    const results: OpenAlexWork[] = [];

    let cursor = '*';
    while (results.length < maxResults) {
      const params: Record<string, string | number> = {
        filter: `cites:${normalizedId}`,
        per_page: Math.min(this.config.perPage, maxResults - results.length),
        cursor,
      };

      if (options?.select) {
        params.select = options.select.join(',');
      }

      const response = await this.request<
        OpenAlexListResponse<OpenAlexWork> & { meta: { next_cursor?: string } }
      >('/works', params);

      results.push(...response.results);

      if (!response.meta.next_cursor || response.results.length === 0) {
        break;
      }
      cursor = response.meta.next_cursor;
    }

    return results;
  }

  /**
   * Get works cited by a given work (references)
   */
  async getReferencedWorks(
    workId: string,
    options?: { select?: string[] }
  ): Promise<OpenAlexWork[]> {
    // First, get the work to retrieve referenced_works IDs
    const work = await this.getWork(workId);

    if (!work.referenced_works || work.referenced_works.length === 0) {
      return [];
    }

    // Fetch referenced works in batches
    const batchSize = 50;
    const results: OpenAlexWork[] = [];

    for (let i = 0; i < work.referenced_works.length; i += batchSize) {
      const batch = work.referenced_works.slice(i, i + batchSize);
      const batchResults = await this.getWorks(batch, options);
      results.push(...batchResults);
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Citation Network Building
  // ---------------------------------------------------------------------------

  /**
   * Fetch citation network for building a CIDRE graph
   */
  async fetchCitationNetwork(
    options: FetchCitationNetworkOptions
  ): Promise<CitationRelationship[]> {
    const depth = options.depth ?? 1;
    const maxNodes = options.maxNodes ?? 500;
    const relationships: CitationRelationship[] = [];
    const visited = new Set<string>();
    const toVisit: Array<{ id: string; depth: number }> = [
      { id: options.workId, depth: 0 },
    ];

    while (toVisit.length > 0 && visited.size < maxNodes) {
      const current = toVisit.shift();
      if (!current) break;
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      try {
        const work = await this.getWork(current.id);

        // Add outgoing citations (this work cites others)
        for (const refId of work.referenced_works ?? []) {
          const normalizedRefId = this.extractOpenAlexId(refId);
          relationships.push({
            source: this.extractOpenAlexId(current.id),
            target: normalizedRefId,
            year: work.publication_year,
          });

          // Queue for deeper exploration
          if (current.depth < depth && !visited.has(normalizedRefId)) {
            toVisit.push({ id: normalizedRefId, depth: current.depth + 1 });
          }
        }

        // Get incoming citations (others cite this work)
        if (current.depth < depth) {
          const citingWorks = await this.getCitingWorks(current.id, {
            maxResults: Math.min(50, maxNodes - visited.size),
            select: ['id', 'publication_year', 'referenced_works'],
          });

          for (const citing of citingWorks) {
            const citingId = this.extractOpenAlexId(citing.id);
            relationships.push({
              source: citingId,
              target: this.extractOpenAlexId(current.id),
              year: citing.publication_year,
            });

            if (!visited.has(citingId)) {
              toVisit.push({ id: citingId, depth: current.depth + 1 });
            }
          }
        }
      } catch (error) {
        if (error instanceof OpenAlexNotFoundError) {
          // Skip works that don't exist
          continue;
        }
        throw error;
      }

      // Apply year filter if specified
      if (options.yearRange) {
        const { start, end } = options.yearRange;
        relationships.filter((r) => {
          if (!r.year) return true;
          return r.year >= start && r.year <= end;
        });
      }
    }

    // Deduplicate relationships
    const seen = new Set<string>();
    return relationships.filter((r) => {
      const key = `${r.source}→${r.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Build a CitationGraph from OpenAlex data for CIDRE analysis
   */
  async buildCitationGraph(
    options: FetchCitationNetworkOptions
  ): Promise<CitationGraph> {
    const relationships = await this.fetchCitationNetwork(options);

    // Create graph (addNode/addEdge mutate in place)
    const graph = createGraph();

    // Collect unique node IDs
    const nodeIds = new Set<string>();
    for (const rel of relationships) {
      nodeIds.add(rel.source);
      nodeIds.add(rel.target);
    }

    // Add nodes (mutates graph in place)
    for (const id of nodeIds) {
      const node: CitationNode = {
        id,
        type: 'paper',
        metadata: {
          citationCount: relationships.filter((r) => r.target === id).length,
          referenceCount: relationships.filter((r) => r.source === id).length,
        },
      };
      addNode(graph, node);
    }

    // Add edges (mutates graph in place)
    // addEdge signature: (graph, source, target, weight?, year?)
    for (const rel of relationships) {
      addEdge(graph, rel.source, rel.target, 1, rel.year);
    }

    return graph;
  }

  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------

  /**
   * Normalize a work ID to OpenAlex format
   */
  private normalizeWorkId(id: string): string {
    // If it's a DOI, use the DOI filter
    if (id.startsWith('10.') || id.includes('doi.org/')) {
      const doi = id.replace(/^https?:\/\/doi\.org\//, '');
      return `https://doi.org/${doi}`;
    }

    // If it's already an OpenAlex ID, extract just the ID part
    return this.extractOpenAlexId(id);
  }

  /**
   * Extract OpenAlex ID from full URL or return as-is
   */
  private extractOpenAlexId(id: string): string {
    // Handle full URLs like https://openalex.org/W2741809807
    const match = id.match(/W\d+$/);
    if (match) return match[0];

    // Handle DOI-based identifiers
    if (id.startsWith('10.') || id.includes('doi.org/')) {
      // Return as-is, will be handled by API
      return id;
    }

    return id;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let defaultClient: OpenAlexClient | null = null;

/**
 * Get the default OpenAlex client instance
 */
export function getOpenAlexClient(config?: OpenAlexConfig): OpenAlexClient {
  if (!defaultClient || config) {
    defaultClient = new OpenAlexClient(config);
  }
  return defaultClient;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Fetch citation network from OpenAlex (convenience wrapper)
 */
export async function fetchOpenAlexCitationNetwork(
  workId: string,
  options?: Partial<FetchCitationNetworkOptions>
): Promise<CitationRelationship[]> {
  const client = getOpenAlexClient();
  return client.fetchCitationNetwork({ workId, ...options });
}

/**
 * Build CIDRE-ready citation graph from OpenAlex
 */
export async function buildCitationGraphFromOpenAlex(
  workId: string,
  options?: Partial<FetchCitationNetworkOptions>
): Promise<CitationGraph> {
  const client = getOpenAlexClient();
  return client.buildCitationGraph({ workId, ...options });
}
