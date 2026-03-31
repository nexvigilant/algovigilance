/**
 * Citation Analysis Server Action Tests
 *
 * Tests for the analyzeCitations server action with mocked OpenAlex responses
 */

import { analyzeCitations, validateWorkId } from './actions';

// =============================================================================
// MOCK DATA
// =============================================================================

const mockOpenAlexWork = {
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
  ],
  related_works: [],
  authorships: [],
  counts_by_year: [],
  concepts: [],
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

describe('analyzeCitations', () => {
  describe('input validation', () => {
    it('should reject empty work ID', async () => {
      const result = await analyzeCitations({
        workId: '',
        depth: 1,
        maxNodes: 100,
        cidreThreshold: 0.5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('VALIDATION');
        expect(result.error).toContain('required');
      }
    });

    it('should reject invalid depth', async () => {
      const result = await analyzeCitations({
        workId: 'W2741809807',
        depth: 5, // Max is 3
        maxNodes: 100,
        cidreThreshold: 0.5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('VALIDATION');
      }
    });

    it('should reject invalid threshold', async () => {
      const result = await analyzeCitations({
        workId: 'W2741809807',
        depth: 1,
        maxNodes: 100,
        cidreThreshold: 1.5, // Max is 1
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('VALIDATION');
      }
    });
  });

  describe('successful analysis', () => {
    it('should analyze a valid work and return results', async () => {
      mockFetch({
        '/works/W2741809807': { status: 200, body: mockOpenAlexWork },
        'filter=cites': {
          status: 200,
          body: { meta: { count: 0, page: 1, per_page: 100, db_response_time_ms: 10 }, results: [] },
        },
      });

      const result = await analyzeCitations({
        workId: 'W2741809807',
        depth: 1,
        maxNodes: 50,
        cidreThreshold: 0.5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.work.title).toBe(mockOpenAlexWork.title);
        expect(result.work.doi).toBe(mockOpenAlexWork.doi);
        expect(result.work.citedByCount).toBe(15000);
        expect(result.graph.nodes.length).toBeGreaterThan(0);
        expect(result.cidre).toBeDefined();
        expect(result.meta.analysisTimeMs).toBeGreaterThan(0);
      }
    });

    it('should handle DOI input format', async () => {
      mockFetch({
        'doi.org/10.1038': { status: 200, body: mockOpenAlexWork },
        'filter=cites': {
          status: 200,
          body: { meta: { count: 0, page: 1, per_page: 100, db_response_time_ms: 10 }, results: [] },
        },
      });

      const result = await analyzeCitations({
        workId: '10.1038/s41586-021-03819-2',
        depth: 1,
        maxNodes: 50,
        cidreThreshold: 0.5,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return NOT_FOUND for non-existent work', async () => {
      mockFetch({
        '/works/W9999999999': { status: 404, body: { error: 'Not found' } },
      });

      const result = await analyzeCitations({
        workId: 'W9999999999',
        depth: 1,
        maxNodes: 50,
        cidreThreshold: 0.5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('NOT_FOUND');
        expect(result.error).toContain('not found');
      }
    });

    it('should return RATE_LIMIT on 429 response', async () => {
      mockFetch({
        '/works/W2741809807': {
          status: 429,
          body: { error: 'Rate limit exceeded' },
        },
      });

      const result = await analyzeCitations({
        workId: 'W2741809807',
        depth: 1,
        maxNodes: 50,
        cidreThreshold: 0.5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('RATE_LIMIT');
      }
    });
  });
});

describe('S2 enrichment', () => {
  const mockS2CitationsResponse = {
    data: [
      {
        citingPaper: { paperId: 'W2963954245', title: 'Citing paper 1', year: 2022 },
        isInfluential: true,
        contexts: ['Used AlphaFold for structure prediction'],
        intents: ['methodology'],
      },
    ],
    next: undefined,
  };

  it('should include S2 enrichment when enabled', async () => {
    mockFetch({
      '/works/W2741809807': { status: 200, body: mockOpenAlexWork },
      'filter=cites': {
        status: 200,
        body: { meta: { count: 0, page: 1, per_page: 100, db_response_time_ms: 10 }, results: [] },
      },
      '/citations': { status: 200, body: mockS2CitationsResponse },
    });

    const result = await analyzeCitations({
      workId: 'W2741809807',
      depth: 1,
      maxNodes: 50,
      cidreThreshold: 0.5,
      enableS2Enrichment: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.meta.s2EnrichmentEnabled).toBe(true);
      expect(result.meta.s2EnrichmentStatus).toBe('success');
      expect(result.citationContexts).toBeDefined();
    }
  });

  it('should not include S2 enrichment when disabled', async () => {
    mockFetch({
      '/works/W2741809807': { status: 200, body: mockOpenAlexWork },
      'filter=cites': {
        status: 200,
        body: { meta: { count: 0, page: 1, per_page: 100, db_response_time_ms: 10 }, results: [] },
      },
    });

    const result = await analyzeCitations({
      workId: 'W2741809807',
      depth: 1,
      maxNodes: 50,
      cidreThreshold: 0.5,
      enableS2Enrichment: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.meta.s2EnrichmentEnabled).toBe(false);
      expect(result.meta.s2EnrichmentStatus).toBeUndefined();
      expect(result.citationContexts).toBeUndefined();
    }
  });

  it('should handle S2 enrichment failure gracefully', async () => {
    // Use 404 instead of 429 to avoid retry delays in the S2 client
    mockFetch({
      '/works/W2741809807': { status: 200, body: mockOpenAlexWork },
      'filter=cites': {
        status: 200,
        body: { meta: { count: 0, page: 1, per_page: 100, db_response_time_ms: 10 }, results: [] },
      },
      '/citations': { status: 404, body: { error: 'Paper not found' } },
    });

    const result = await analyzeCitations({
      workId: 'W2741809807',
      depth: 1,
      maxNodes: 50,
      cidreThreshold: 0.5,
      enableS2Enrichment: true,
    });

    // Analysis should still succeed even if S2 enrichment fails
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.meta.s2EnrichmentEnabled).toBe(true);
      expect(result.meta.s2EnrichmentStatus).toBe('failed');
      expect(result.meta.s2EnrichmentError).toBeDefined();
      expect(result.citationContexts).toBeUndefined();
    }
  });
});

describe('validateWorkId', () => {
  it('should return valid for existing work', async () => {
    mockFetch({
      '/works/W2741809807': { status: 200, body: mockOpenAlexWork },
    });

    const result = await validateWorkId('W2741809807');

    expect(result.valid).toBe(true);
    expect(result.title).toBe(mockOpenAlexWork.title);
  });

  it('should return invalid for non-existent work', async () => {
    mockFetch({
      '/works/W9999999999': { status: 404, body: { error: 'Not found' } },
    });

    const result = await validateWorkId('W9999999999');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Work not found');
  });

  it('should return error for empty input', async () => {
    const result = await validateWorkId('');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Work ID is required');
  });
});
