/**
 * Semantic Scholar Client Tests
 *
 * Tests for the Semantic Scholar API client with mocked responses
 */

import {
  SemanticScholarClient,
  SemanticScholarError,
  SemanticScholarNotFoundError,
  SemanticScholarRateLimitError,
  fetchSemanticScholarCitations,
  enrichWithSemanticScholar,
} from '../semantic-scholar-client';
import type { SemanticScholarPaper } from '../api-integration-architecture';

// =============================================================================
// TEST DATA
// =============================================================================

const mockPaper: SemanticScholarPaper = {
  paperId: 'abc123def456',
  externalIds: {
    DOI: '10.1038/s41586-021-03819-2',
    ArXiv: '2107.08956',
  },
  title: 'Highly accurate protein structure prediction with AlphaFold',
  abstract: 'Proteins are essential to life...',
  year: 2021,
  venue: 'Nature',
  citationCount: 15000,
  referenceCount: 50,
  influentialCitationCount: 2500,
  isOpenAccess: true,
  authors: [
    { authorId: 'a1', name: 'John Jumper' },
    { authorId: 'a2', name: 'Demis Hassabis' },
  ],
};

const mockCitationsResponse = {
  data: [
    {
      citingPaper: {
        paperId: 'cite1',
        title: 'Applications of AlphaFold in drug discovery',
        year: 2023,
      },
      isInfluential: true,
      contexts: [
        'We used AlphaFold [1] to predict the structure of...',
        'Following the approach of Jumper et al. [1], we...',
      ],
      intents: ['methodology', 'background'],
    },
    {
      citingPaper: {
        paperId: 'cite2',
        title: 'Comparing protein folding methods',
        year: 2022,
      },
      isInfluential: false,
      contexts: ['AlphaFold achieved state-of-the-art results [1]'],
      intents: ['result_comparison'],
    },
  ],
  next: undefined,
};

const mockReferencesResponse = {
  data: [
    {
      citedPaper: {
        paperId: 'ref1',
        title: 'Attention is all you need',
        year: 2017,
      },
      isInfluential: true,
      intents: ['methodology'],
    },
    {
      citedPaper: {
        paperId: 'ref2',
        title: 'Deep learning',
        year: 2016,
      },
      isInfluential: false,
      intents: ['background'],
    },
  ],
  next: undefined,
};

// =============================================================================
// MOCK SETUP
// =============================================================================

const originalFetch = global.fetch;

function mockFetch(
  responses: Record<string, { status: number; body: unknown }>
) {
  global.fetch = jest.fn().mockImplementation(async (url: string) => {
    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        if (response.status !== 200) {
          return {
            ok: false,
            status: response.status,
            statusText: response.status === 404 ? 'Not Found' : 'Error',
            headers: new Headers(),
            text: async () => JSON.stringify(response.body),
            json: async () => response.body,
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => response.body,
        };
      }
    }
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

describe('SemanticScholarClient', () => {
  describe('getPaper', () => {
    it('should fetch a paper by S2 ID', async () => {
      mockFetch({
        '/paper/abc123def456': { status: 200, body: mockPaper },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });
      const paper = await client.getPaper('abc123def456');

      expect(paper.title).toBe(mockPaper.title);
      expect(paper.citationCount).toBe(15000);
      expect(paper.authors).toHaveLength(2);
    });

    it('should fetch a paper by DOI', async () => {
      mockFetch({
        // DOI is URL-encoded: doi:10.1038 becomes doi%3A10.1038
        'doi%3A10.1038': { status: 200, body: mockPaper },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });
      const paper = await client.getPaper('doi:10.1038/s41586-021-03819-2');

      expect(paper.title).toBe(mockPaper.title);
    });

    it('should throw SemanticScholarNotFoundError for non-existent paper', async () => {
      mockFetch({
        '/paper/nonexistent': { status: 404, body: { error: 'Not found' } },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });

      await expect(client.getPaper('nonexistent')).rejects.toThrow(
        SemanticScholarNotFoundError
      );
    });
  });

  describe('getCitations', () => {
    it('should fetch citations with context', async () => {
      mockFetch({
        '/citations': { status: 200, body: mockCitationsResponse },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });
      const result = await client.getCitations('abc123def456');

      expect(result.data).toHaveLength(2);
      expect(result.data[0].isInfluential).toBe(true);
      expect(result.data[0].contexts).toHaveLength(2);
      expect(result.data[0].intents).toContain('methodology');
    });

    it('should identify influential citations', async () => {
      mockFetch({
        '/citations': { status: 200, body: mockCitationsResponse },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });
      const result = await client.getCitations('abc123def456');

      const influential = result.data.filter((c) => c.isInfluential);
      expect(influential).toHaveLength(1);
      expect(influential[0].title).toBe(
        'Applications of AlphaFold in drug discovery'
      );
    });
  });

  describe('getAllCitations', () => {
    it('should paginate through all citations', async () => {
      const page1 = {
        data: [mockCitationsResponse.data[0]],
        next: 1,
      };
      const page2 = {
        data: [mockCitationsResponse.data[1]],
        next: undefined,
      };

      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(async (_url: string) => {
        callCount++;
        const body = callCount === 1 ? page1 : page2;
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => body,
        };
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });
      const citations = await client.getAllCitations('abc123def456', 500);

      expect(citations).toHaveLength(2);
      expect(callCount).toBe(2);
    });

    it('should respect maxCitations limit', async () => {
      mockFetch({
        '/citations': { status: 200, body: mockCitationsResponse },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });
      const citations = await client.getAllCitations('abc123def456', 1);

      expect(citations).toHaveLength(1);
    });
  });

  describe('getReferences', () => {
    it('should fetch references with intents', async () => {
      mockFetch({
        '/references': { status: 200, body: mockReferencesResponse },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });
      const result = await client.getReferences('abc123def456');

      expect(result.data).toHaveLength(2);
      expect(result.data[0].isInfluential).toBe(true);
      expect(result.data[0].intents).toContain('methodology');
    });
  });

  describe('enrichCitationRelationships', () => {
    it('should enrich relationships with S2 context', async () => {
      mockFetch({
        '/citations': { status: 200, body: mockCitationsResponse },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });

      const relationships = [
        { source: 'cite1', target: 'abc123def456', year: 2023 },
        { source: 'cite2', target: 'abc123def456', year: 2022 },
        { source: 'unknown', target: 'abc123def456', year: 2021 },
      ];

      const enriched = await client.enrichCitationRelationships(
        relationships,
        'abc123def456'
      );

      expect(enriched).toHaveLength(3);

      // First citation should be enriched
      expect(enriched[0].isInfluential).toBe(true);
      expect(enriched[0].intents).toContain('methodology');
      expect(enriched[0].contexts.length).toBeGreaterThan(0);

      // Unknown citation should have defaults
      expect(enriched[2].isInfluential).toBe(false);
      expect(enriched[2].intents).toEqual([]);
      expect(enriched[2].contexts).toEqual([]);
    });
  });

  describe('getCitationContextStats', () => {
    it('should calculate citation statistics', async () => {
      mockFetch({
        '/citations': { status: 200, body: mockCitationsResponse },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });
      const stats = await client.getCitationContextStats('abc123def456');

      expect(stats.totalCitations).toBe(2);
      expect(stats.influentialCitations).toBe(1);
      expect(stats.intentBreakdown).toHaveProperty('methodology');
      expect(stats.intentBreakdown).toHaveProperty('background');
      expect(stats.intentBreakdown).toHaveProperty('result_comparison');
      expect(stats.averageContextsPerCitation).toBe(1.5); // (2 + 1) / 2
    });
  });

  describe('error handling', () => {
    it('should throw SemanticScholarRateLimitError on 429', async () => {
      mockFetch({
        '/paper/abc': { status: 429, body: { error: 'Rate limited' } },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });

      await expect(client.getPaper('abc')).rejects.toThrow(
        SemanticScholarRateLimitError
      );
    });

    it('should throw SemanticScholarError on other HTTP errors', async () => {
      mockFetch({
        '/paper/abc': { status: 500, body: { error: 'Server error' } },
      });

      const client = new SemanticScholarClient({
        maxRetries: 1,
        requestDelayMs: 0,
      });

      await expect(client.getPaper('abc')).rejects.toThrow(SemanticScholarError);
    });

    it('should include API key in header when configured', async () => {
      mockFetch({
        '/paper/abc123': { status: 200, body: mockPaper },
      });

      const client = new SemanticScholarClient({
        apiKey: 'test-api-key',
        maxRetries: 1,
        requestDelayMs: 0,
      });

      await client.getPaper('abc123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
          }),
        })
      );
    });
  });
});

describe('convenience functions', () => {
  describe('fetchSemanticScholarCitations', () => {
    it('should return citation relationships', async () => {
      mockFetch({
        '/citations': { status: 200, body: mockCitationsResponse },
      });

      const relationships = await fetchSemanticScholarCitations('abc123def456');

      expect(relationships).toHaveLength(2);
      expect(relationships[0].target).toBe('abc123def456');
      expect(relationships[0].isInfluential).toBe(true);
    });
  });

  describe('enrichWithSemanticScholar', () => {
    it('should enrich existing relationships', async () => {
      mockFetch({
        '/citations': { status: 200, body: mockCitationsResponse },
      });

      const basic = [{ source: 'cite1', target: 'abc123def456', year: 2023 }];
      const enriched = await enrichWithSemanticScholar(basic, 'abc123def456');

      expect(enriched[0].isInfluential).toBe(true);
      expect(enriched[0].contexts.length).toBeGreaterThan(0);
    });
  });
});
