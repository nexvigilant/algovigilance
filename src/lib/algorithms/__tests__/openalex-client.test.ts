/**
 * OpenAlex Client Tests
 *
 * Tests for the OpenAlex API client with mocked responses
 */

import {
  OpenAlexClient,
  OpenAlexError,
  OpenAlexNotFoundError,
  OpenAlexRateLimitError,
  fetchOpenAlexCitationNetwork,
  buildCitationGraphFromOpenAlex,
} from '../openalex-client';
import type { OpenAlexWork } from '../api-integration-architecture';

// =============================================================================
// TEST DATA
// =============================================================================

const mockWork: OpenAlexWork = {
  id: 'https://openalex.org/W2741809807',
  doi: '10.1038/s41586-021-03819-2',
  title: 'Highly accurate protein structure prediction with AlphaFold',
  publication_date: '2021-07-15',
  publication_year: 2021,
  type: 'journal-article',
  cited_by_count: 15000,
  is_retracted: false,
  is_paratext: false,
  referenced_works: [
    'https://openalex.org/W2963954245',
    'https://openalex.org/W2912349877',
    'https://openalex.org/W2035678923',
  ],
  related_works: ['https://openalex.org/W3030445678'],
  authorships: [
    {
      author_position: 'first',
      author: {
        id: 'https://openalex.org/A2208157607',
        display_name: 'John Jumper',
        orcid: 'https://orcid.org/0000-0001-6169-6580',
      },
      institutions: [
        {
          id: 'https://openalex.org/I114027590',
          display_name: 'DeepMind',
          country_code: 'GB',
        },
      ],
    },
    {
      author_position: 'last',
      author: {
        id: 'https://openalex.org/A2563754795',
        display_name: 'Demis Hassabis',
      },
      institutions: [
        {
          id: 'https://openalex.org/I114027590',
          display_name: 'DeepMind',
          country_code: 'GB',
        },
      ],
    },
  ],
  primary_location: {
    source: {
      id: 'https://openalex.org/S137773608',
      display_name: 'Nature',
      issn_l: '0028-0836',
      is_oa: false,
      type: 'journal',
    },
    is_oa: true,
    pdf_url: 'https://www.nature.com/articles/s41586-021-03819-2.pdf',
  },
  counts_by_year: [
    { year: 2024, cited_by_count: 5000 },
    { year: 2023, cited_by_count: 6000 },
    { year: 2022, cited_by_count: 3500 },
    { year: 2021, cited_by_count: 500 },
  ],
  concepts: [
    { id: 'C185592680', display_name: 'Protein structure', score: 0.95 },
    { id: 'C41008148', display_name: 'Machine learning', score: 0.85 },
  ],
};

const mockCitingWork: OpenAlexWork = {
  id: 'https://openalex.org/W4123456789',
  title: 'Applications of AlphaFold in drug discovery',
  publication_year: 2023,
  type: 'journal-article',
  cited_by_count: 50,
  is_retracted: false,
  is_paratext: false,
  referenced_works: ['https://openalex.org/W2741809807'],
  related_works: [],
  authorships: [],
  counts_by_year: [],
  concepts: [],
};

const mockListResponse = {
  meta: {
    count: 1,
    db_response_time_ms: 42,
    page: 1,
    per_page: 100,
  },
  results: [mockCitingWork],
};

// =============================================================================
// MOCK SETUP
// =============================================================================

const originalFetch = global.fetch;

function mockFetch(
  responses: Record<string, { status: number; body: unknown; headers?: Record<string, string> }>
) {
  global.fetch = jest.fn().mockImplementation(async (url: string) => {
    // Find matching response
    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        if (response.status !== 200) {
          return {
            ok: false,
            status: response.status,
            statusText: response.status === 404 ? 'Not Found' : 'Error',
            headers: new Headers(response.headers ?? {}),
            text: async () => JSON.stringify(response.body),
            json: async () => response.body,
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(response.headers ?? {}),
          json: async () => response.body,
        };
      }
    }
    // Default 404
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
      text: async () => 'Not found',
    };
  });
}

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

// =============================================================================
// TESTS
// =============================================================================

describe('OpenAlexClient', () => {
  describe('getWork', () => {
    it('should fetch a single work by OpenAlex ID', async () => {
      mockFetch({
        '/works/W2741809807': { status: 200, body: mockWork },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });
      const work = await client.getWork('W2741809807');

      expect(work.title).toBe(mockWork.title);
      expect(work.doi).toBe(mockWork.doi);
      expect(work.referenced_works).toHaveLength(3);
    });

    it('should fetch a work by DOI', async () => {
      mockFetch({
        'doi.org/10.1038': { status: 200, body: mockWork },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });
      const work = await client.getWork('10.1038/s41586-021-03819-2');

      expect(work.title).toBe(mockWork.title);
    });

    it('should throw OpenAlexNotFoundError for non-existent work', async () => {
      mockFetch({
        '/works/W9999999999': { status: 404, body: { error: 'Not found' } },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });

      await expect(client.getWork('W9999999999')).rejects.toThrow(
        OpenAlexNotFoundError
      );
    });

    it('should include email in requests for polite pool', async () => {
      mockFetch({
        '/works/W2741809807': { status: 200, body: mockWork },
      });

      const client = new OpenAlexClient({
        email: 'test@example.com',
        maxRetries: 1,
      });
      await client.getWork('W2741809807');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('mailto=test%40example.com'),
        expect.any(Object)
      );
    });
  });

  describe('getWorks', () => {
    it('should fetch multiple works by IDs', async () => {
      mockFetch({
        'filter=openalex': {
          status: 200,
          body: { ...mockListResponse, results: [mockWork, mockCitingWork] },
        },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });
      const works = await client.getWorks(['W2741809807', 'W4123456789']);

      expect(works).toHaveLength(2);
    });

    it('should return empty array for empty input', async () => {
      const mockFn = jest.fn();
      global.fetch = mockFn;

      const client = new OpenAlexClient({ maxRetries: 1 });
      const works = await client.getWorks([]);

      expect(works).toEqual([]);
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('getCitingWorks', () => {
    it('should fetch works that cite a given work', async () => {
      mockFetch({
        'filter=cites': { status: 200, body: mockListResponse },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });
      const citing = await client.getCitingWorks('W2741809807', {
        maxResults: 10,
      });

      expect(citing).toHaveLength(1);
      expect(citing[0].title).toBe(mockCitingWork.title);
    });
  });

  describe('getReferencedWorks', () => {
    it('should fetch works referenced by a given work', async () => {
      const refWork: OpenAlexWork = {
        ...mockWork,
        id: 'https://openalex.org/W2963954245',
        title: 'Referenced Work',
      };

      mockFetch({
        '/works/W2741809807': { status: 200, body: mockWork },
        'filter=openalex': {
          status: 200,
          body: { ...mockListResponse, results: [refWork] },
        },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });
      const refs = await client.getReferencedWorks('W2741809807');

      expect(refs.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array if work has no references', async () => {
      const workNoRefs: OpenAlexWork = {
        ...mockWork,
        referenced_works: [],
      };

      mockFetch({
        '/works/W2741809807': { status: 200, body: workNoRefs },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });
      const refs = await client.getReferencedWorks('W2741809807');

      expect(refs).toEqual([]);
    });
  });

  describe('fetchCitationNetwork', () => {
    it('should build citation relationships from a work', async () => {
      mockFetch({
        '/works/W2741809807': { status: 200, body: mockWork },
        'filter=cites%3AW2741809807': { status: 200, body: mockListResponse },
        // Referenced works
        '/works/W2963954245': {
          status: 200,
          body: { ...mockWork, id: 'W2963954245', referenced_works: [] },
        },
        '/works/W2912349877': {
          status: 200,
          body: { ...mockWork, id: 'W2912349877', referenced_works: [] },
        },
        '/works/W2035678923': {
          status: 200,
          body: { ...mockWork, id: 'W2035678923', referenced_works: [] },
        },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });
      const relationships = await client.fetchCitationNetwork({
        workId: 'W2741809807',
        depth: 1,
        maxNodes: 10,
      });

      // Should have relationships from the seed work to its references
      expect(relationships.length).toBeGreaterThan(0);

      // Check that source/target are present
      const hasValidRelationships = relationships.every(
        (r) => r.source && r.target
      );
      expect(hasValidRelationships).toBe(true);
    });

    it('should respect maxNodes limit', async () => {
      mockFetch({
        '/works/W2741809807': { status: 200, body: mockWork },
        'filter=cites': { status: 200, body: { meta: mockListResponse.meta, results: [] } },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });
      const relationships = await client.fetchCitationNetwork({
        workId: 'W2741809807',
        depth: 1,
        maxNodes: 5,
      });

      // Should not exceed maxNodes
      const uniqueNodes = new Set<string>();
      relationships.forEach((r) => {
        uniqueNodes.add(r.source);
        uniqueNodes.add(r.target);
      });
      expect(uniqueNodes.size).toBeLessThanOrEqual(5);
    });
  });

  describe('buildCitationGraph', () => {
    it('should build a CIDRE-ready CitationGraph', async () => {
      mockFetch({
        '/works/W2741809807': { status: 200, body: mockWork },
        'filter=cites': { status: 200, body: { meta: mockListResponse.meta, results: [] } },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });
      const graph = await client.buildCitationGraph({
        workId: 'W2741809807',
        depth: 1,
        maxNodes: 10,
      });

      expect(graph.nodes.size).toBeGreaterThan(0);
      expect(graph.edgeCount).toBeGreaterThan(0);

      // Each node should have id, type, and metadata with citation counts
      for (const node of graph.nodes.values()) {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('type');
        expect(node.metadata).toHaveProperty('citationCount');
        expect(node.metadata).toHaveProperty('referenceCount');
      }
    });
  });

  describe('error handling', () => {
    it('should throw OpenAlexRateLimitError on 429', async () => {
      mockFetch({
        '/works/W2741809807': {
          status: 429,
          body: { error: 'Rate limit exceeded' },
          headers: { 'Retry-After': '60' },
        },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });

      await expect(client.getWork('W2741809807')).rejects.toThrow(
        OpenAlexRateLimitError
      );
    });

    it('should throw OpenAlexError on other HTTP errors', async () => {
      mockFetch({
        '/works/W2741809807': {
          status: 500,
          body: { error: 'Internal server error' },
        },
      });

      const client = new OpenAlexClient({ maxRetries: 1 });

      await expect(client.getWork('W2741809807')).rejects.toThrow(OpenAlexError);
    });

    it('should retry on failure with exponential backoff', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return {
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers(),
            text: async () => 'Service unavailable',
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => mockWork,
        };
      });

      const client = new OpenAlexClient({
        maxRetries: 3,
        retryDelayMs: 10, // Fast for testing
      });

      const work = await client.getWork('W2741809807');

      expect(work.title).toBe(mockWork.title);
      expect(callCount).toBe(3);
    });
  });
});

describe('convenience functions', () => {
  describe('fetchOpenAlexCitationNetwork', () => {
    it('should fetch citation network using default client', async () => {
      mockFetch({
        '/works/W2741809807': { status: 200, body: mockWork },
        'filter=cites': { status: 200, body: { meta: mockListResponse.meta, results: [] } },
      });

      const relationships = await fetchOpenAlexCitationNetwork('W2741809807', {
        depth: 1,
        maxNodes: 5,
      });

      expect(Array.isArray(relationships)).toBe(true);
    });
  });

  describe('buildCitationGraphFromOpenAlex', () => {
    it('should build graph using default client', async () => {
      mockFetch({
        '/works/W2741809807': { status: 200, body: mockWork },
        'filter=cites': { status: 200, body: { meta: mockListResponse.meta, results: [] } },
      });

      const graph = await buildCitationGraphFromOpenAlex('W2741809807', {
        depth: 1,
        maxNodes: 5,
      });

      expect(graph).toHaveProperty('nodes');
      expect(graph).toHaveProperty('edgeCount');
      expect(graph).toHaveProperty('outEdges');
      expect(graph).toHaveProperty('inEdges');
    });
  });
});
