/**
 * Semantic Scholar API Client
 *
 * HTTP client for Semantic Scholar API with:
 * - Rate limiting (100 requests/5 minutes for free tier)
 * - Citation context retrieval
 * - Influential citations detection
 * - Paper embeddings for similarity
 *
 * @see https://api.semanticscholar.org/api-docs/
 */

import {
  type SemanticScholarPaper,
  type CitationRelationship,
  API_ENDPOINTS,
} from './api-integration-architecture';
import { RateLimiter } from '@/lib/concurrency';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG = {
  /** Base URL for Semantic Scholar API */
  baseUrl: API_ENDPOINTS.semanticScholar.base,
  /** API key for higher rate limits (optional) */
  apiKey: undefined as string | undefined,
  /** Maximum concurrent requests */
  maxConcurrent: 2,
  /** Delay between requests in ms (free tier: 100 req/5min = 3s between) */
  requestDelayMs: 3000,
  /** Maximum retries on failure */
  maxRetries: 3,
  /** Base delay for exponential backoff in ms */
  retryDelayMs: 2000,
  /** Request timeout in ms */
  timeoutMs: 30000,
};

export type SemanticScholarConfig = Partial<typeof DEFAULT_CONFIG>;

// RateLimiter imported from @/lib/concurrency

// =============================================================================
// ERROR TYPES
// =============================================================================

export class SemanticScholarError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'SemanticScholarError';
  }
}

export class SemanticScholarRateLimitError extends SemanticScholarError {
  constructor() {
    super('Rate limit exceeded. Please wait before making more requests.');
    this.name = 'SemanticScholarRateLimitError';
  }
}

export class SemanticScholarNotFoundError extends SemanticScholarError {
  constructor(paperId: string) {
    super(`Paper not found: ${paperId}`);
    this.name = 'SemanticScholarNotFoundError';
  }
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Citation with context information
 */
export interface CitationWithContext {
  /** Citing paper ID */
  paperId: string;
  /** Citing paper title */
  title: string;
  /** Year of citation */
  year?: number;
  /** Whether this is an influential citation */
  isInfluential: boolean;
  /** Text snippets where the citation appears */
  contexts: string[];
  /** Citation intents (background, methodology, result_comparison) */
  intents: string[];
}

/**
 * Reference with context information
 */
export interface ReferenceWithContext {
  /** Referenced paper ID */
  paperId: string;
  /** Referenced paper title */
  title: string;
  /** Year of referenced paper */
  year?: number;
  /** Whether this is an influential reference */
  isInfluential: boolean;
  /** Citation intents */
  intents: string[];
}

/**
 * Enriched citation relationship with S2 context
 */
export interface EnrichedCitationRelationship extends CitationRelationship {
  /** Whether this is an influential citation */
  isInfluential: boolean;
  /** Citation intents */
  intents: string[];
  /** Text contexts where citation appears */
  contexts: string[];
}

// =============================================================================
// CLIENT CLASS
// =============================================================================

export class SemanticScholarClient {
  private config: typeof DEFAULT_CONFIG;
  private rateLimiter: RateLimiter;

  constructor(config?: SemanticScholarConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rateLimiter = new RateLimiter({
      maxConcurrent: this.config.maxConcurrent,
      delayMs: this.config.requestDelayMs,
    });
  }

  // ---------------------------------------------------------------------------
  // Core Fetch Methods
  // ---------------------------------------------------------------------------

  private async request<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
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

        const headers: Record<string, string> = {
          Accept: 'application/json',
        };

        if (this.config.apiKey) {
          headers['x-api-key'] = this.config.apiKey;
        }

        try {
          const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            if (response.status === 429) {
              throw new SemanticScholarRateLimitError();
            }
            if (response.status === 404) {
              throw new SemanticScholarNotFoundError(endpoint);
            }
            throw new SemanticScholarError(
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

        if (
          error instanceof SemanticScholarNotFoundError ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          throw error;
        }

        if (attempt < this.config.maxRetries - 1) {
          const delay =
            this.config.retryDelayMs * Math.pow(2, attempt) +
            Math.random() * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new SemanticScholarError('Request failed after retries');
  }

  // ---------------------------------------------------------------------------
  // Paper Methods
  // ---------------------------------------------------------------------------

  /**
   * Get a paper by its Semantic Scholar ID, DOI, ArXiv ID, etc.
   *
   * @param paperId - S2 paper ID, DOI (with doi: prefix), ArXiv (with arxiv: prefix)
   * @param fields - Fields to include in response
   */
  async getPaper(
    paperId: string,
    fields?: string[]
  ): Promise<SemanticScholarPaper> {
    const defaultFields = [
      'paperId',
      'externalIds',
      'title',
      'abstract',
      'year',
      'venue',
      'citationCount',
      'referenceCount',
      'influentialCitationCount',
      'isOpenAccess',
      'authors',
    ];

    return this.request<SemanticScholarPaper>(
      `/paper/${encodeURIComponent(paperId)}`,
      { fields: (fields ?? defaultFields).join(',') }
    );
  }

  /**
   * Get papers citing a given paper with context
   */
  async getCitations(
    paperId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ data: CitationWithContext[]; next?: number }> {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    interface S2CitationResponse {
      data: Array<{
        citingPaper: {
          paperId: string;
          title: string;
          year?: number;
        };
        isInfluential: boolean;
        contexts: string[];
        intents: string[];
      }>;
      next?: number;
    }

    const response = await this.request<S2CitationResponse>(
      `/paper/${encodeURIComponent(paperId)}/citations`,
      {
        fields: 'citingPaper,isInfluential,contexts,intents',
        limit,
        offset,
      }
    );

    return {
      data: response.data.map((c) => ({
        paperId: c.citingPaper.paperId,
        title: c.citingPaper.title,
        year: c.citingPaper.year,
        isInfluential: c.isInfluential,
        contexts: c.contexts ?? [],
        intents: c.intents ?? [],
      })),
      next: response.next,
    };
  }

  /**
   * Get all citations for a paper (paginated)
   */
  async getAllCitations(
    paperId: string,
    maxCitations: number = 500
  ): Promise<CitationWithContext[]> {
    const citations: CitationWithContext[] = [];
    let offset = 0;
    const limit = 100;

    while (citations.length < maxCitations) {
      const response = await this.getCitations(paperId, { limit, offset });
      citations.push(...response.data);

      if (!response.next || response.data.length === 0) {
        break;
      }
      offset = response.next;
    }

    return citations.slice(0, maxCitations);
  }

  /**
   * Get papers referenced by a given paper
   */
  async getReferences(
    paperId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ data: ReferenceWithContext[]; next?: number }> {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    interface S2ReferenceResponse {
      data: Array<{
        citedPaper: {
          paperId: string;
          title: string;
          year?: number;
        };
        isInfluential: boolean;
        intents: string[];
      }>;
      next?: number;
    }

    const response = await this.request<S2ReferenceResponse>(
      `/paper/${encodeURIComponent(paperId)}/references`,
      {
        fields: 'citedPaper,isInfluential,intents',
        limit,
        offset,
      }
    );

    return {
      data: response.data.map((r) => ({
        paperId: r.citedPaper.paperId,
        title: r.citedPaper.title,
        year: r.citedPaper.year,
        isInfluential: r.isInfluential,
        intents: r.intents ?? [],
      })),
      next: response.next,
    };
  }

  // ---------------------------------------------------------------------------
  // Citation Enrichment
  // ---------------------------------------------------------------------------

  /**
   * Enrich citation relationships with Semantic Scholar context
   *
   * @param relationships - Basic citation relationships from OpenAlex
   * @param targetPaperId - The paper whose citations to enrich
   * @returns Enriched relationships with context and influence data
   */
  async enrichCitationRelationships(
    relationships: CitationRelationship[],
    targetPaperId: string
  ): Promise<EnrichedCitationRelationship[]> {
    // Get citations with context from S2
    const citations = await this.getAllCitations(targetPaperId, 500);

    // Create lookup map
    const citationMap = new Map<string, CitationWithContext>();
    for (const c of citations) {
      citationMap.set(c.paperId, c);
    }

    // Enrich relationships
    return relationships.map((rel) => {
      const s2Data = citationMap.get(rel.source);
      return {
        ...rel,
        isInfluential: s2Data?.isInfluential ?? false,
        intents: s2Data?.intents ?? [],
        contexts: s2Data?.contexts ?? [],
      };
    });
  }

  /**
   * Get citation context statistics for a paper
   */
  async getCitationContextStats(paperId: string): Promise<{
    totalCitations: number;
    influentialCitations: number;
    intentBreakdown: Record<string, number>;
    averageContextsPerCitation: number;
  }> {
    const citations = await this.getAllCitations(paperId, 1000);

    const intentCounts: Record<string, number> = {};
    let totalContexts = 0;

    for (const c of citations) {
      totalContexts += c.contexts.length;
      for (const intent of c.intents) {
        intentCounts[intent] = (intentCounts[intent] ?? 0) + 1;
      }
    }

    return {
      totalCitations: citations.length,
      influentialCitations: citations.filter((c) => c.isInfluential).length,
      intentBreakdown: intentCounts,
      averageContextsPerCitation:
        citations.length > 0 ? totalContexts / citations.length : 0,
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let defaultClient: SemanticScholarClient | null = null;

/**
 * Get the default Semantic Scholar client instance
 */
export function getSemanticScholarClient(
  config?: SemanticScholarConfig
): SemanticScholarClient {
  if (!defaultClient || config) {
    defaultClient = new SemanticScholarClient(config);
  }
  return defaultClient;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Fetch citation context from Semantic Scholar (convenience wrapper)
 */
export async function fetchSemanticScholarCitations(
  paperId: string,
  maxCitations?: number
): Promise<CitationRelationship[]> {
  const client = getSemanticScholarClient();
  const citations = await client.getAllCitations(paperId, maxCitations);

  return citations.map((c) => ({
    source: c.paperId,
    target: paperId,
    year: c.year,
    isInfluential: c.isInfluential,
    intent: c.intents[0] as CitationRelationship['intent'],
    context: c.contexts[0],
  }));
}

/**
 * Enrich existing citation relationships with S2 context
 */
export async function enrichWithSemanticScholar(
  relationships: CitationRelationship[],
  targetPaperId: string
): Promise<EnrichedCitationRelationship[]> {
  const client = getSemanticScholarClient();
  return client.enrichCitationRelationships(relationships, targetPaperId);
}
