/**
 * Tests for PMID Watchlist
 *
 * @module pmid-watchlist.test
 */

import {
  PMIDWatchlist,
  createWatchlist,
  type _WatchedArticle,
  type WatchlistExport,
} from '../pmid-watchlist';

// =============================================================================
// Mocks
// =============================================================================

// Mock the pubmed-enricher module
jest.mock('../pubmed-enricher', () => ({
  fetchArticlesByPMID: jest.fn(),
}));

// Mock global fetch for elink API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import mocked function for assertions
import { fetchArticlesByPMID } from '../pubmed-enricher';
const mockFetchArticlesByPMID = fetchArticlesByPMID as jest.MockedFunction<typeof fetchArticlesByPMID>;

// =============================================================================
// Test Fixtures
// =============================================================================

const samplePubMedArticle = {
  pmid: '12345678',
  title: 'Cardiovascular outcomes with GLP-1 receptor agonists',
  authors: [
    { name: 'Smith J', affiliation: 'Harvard Medical School' },
    { name: 'Jones M', affiliation: 'MIT' },
  ],
  journal: 'New England Journal of Medicine',
  year: '2024',
  volume: '390',
  issue: '12',
  pages: '1234-1245',
  abstract: 'Background: GLP-1 receptor agonists have shown promise...',
  doi: '10.1056/NEJMoa2402392',
  pubDate: '2024-03-15',
  meshTerms: ['Diabetes Mellitus, Type 2', 'GLP-1 Receptor Agonists'],
};

const samplePubMedArticle2 = {
  pmid: '87654321',
  title: 'SGLT2 inhibitors and renal outcomes',
  authors: [{ name: 'Brown K', affiliation: 'Stanford' }],
  journal: 'JAMA',
  year: '2024',
  abstract: 'Methods: This randomized controlled trial...',
  doi: '10.1001/jama.2024.5678',
  pubDate: '2024-04-01',
  meshTerms: ['Kidney Diseases', 'SGLT2 Inhibitors'],
};

// Mock elink response for citing articles
const mockElinkResponse = {
  linksets: [
    {
      linksetdbs: [
        {
          links: ['11111111', '22222222', '33333333'],
        },
      ],
    },
  ],
};

// =============================================================================
// Setup and Teardown
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
  mockFetchArticlesByPMID.mockReset();
});

// =============================================================================
// Constructor Tests
// =============================================================================

describe('PMIDWatchlist constructor', () => {
  it('should create an empty watchlist', () => {
    const watchlist = new PMIDWatchlist();
    expect(watchlist.size).toBe(0);
  });

  it('should accept API key in options', () => {
    const watchlist = new PMIDWatchlist({ apiKey: 'test-key' });
    expect(watchlist).toBeInstanceOf(PMIDWatchlist);
  });
});

// =============================================================================
// Core Operations Tests
// =============================================================================

describe('add', () => {
  it('should add a PMID with default options', () => {
    const watchlist = new PMIDWatchlist();

    watchlist.add('12345678');

    expect(watchlist.size).toBe(1);
    const article = watchlist.get('12345678');
    expect(article).toBeDefined();
    expect(article?.pmid).toBe('12345678');
    expect(article?.priority).toBe('medium'); // Default
    expect(article?.tags).toEqual([]);
  });

  it('should add a PMID with custom options', () => {
    const watchlist = new PMIDWatchlist();

    watchlist.add('12345678', {
      reason: 'Key safety study',
      priority: 'high',
      tags: ['GLP-1', 'cardiovascular'],
    });

    const article = watchlist.get('12345678');
    expect(article?.reason).toBe('Key safety study');
    expect(article?.priority).toBe('high');
    expect(article?.tags).toContain('GLP-1');
    expect(article?.tags).toContain('cardiovascular');
  });

  it('should update existing entry when adding duplicate PMID', () => {
    const watchlist = new PMIDWatchlist();

    watchlist.add('12345678', { priority: 'low', tags: ['original'] });
    watchlist.add('12345678', { priority: 'high', tags: ['updated'] });

    expect(watchlist.size).toBe(1); // Still only 1 entry
    const article = watchlist.get('12345678');
    expect(article?.priority).toBe('high');
    expect(article?.tags).toContain('original');
    expect(article?.tags).toContain('updated');
  });

  it('should set addedAt date', () => {
    const watchlist = new PMIDWatchlist();
    const before = new Date();

    watchlist.add('12345678');

    const article = watchlist.get('12345678');
    expect(article?.addedAt).toBeInstanceOf(Date);
    expect(article?.addedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('remove', () => {
  it('should remove an existing PMID', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    const result = watchlist.remove('12345678');

    expect(result).toBe(true);
    expect(watchlist.size).toBe(0);
  });

  it('should return false when removing non-existent PMID', () => {
    const watchlist = new PMIDWatchlist();

    const result = watchlist.remove('nonexistent');

    expect(result).toBe(false);
  });
});

describe('get', () => {
  it('should return watched article by PMID', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678', { reason: 'Test' });

    const article = watchlist.get('12345678');

    expect(article).toBeDefined();
    expect(article?.pmid).toBe('12345678');
    expect(article?.reason).toBe('Test');
  });

  it('should return undefined for non-existent PMID', () => {
    const watchlist = new PMIDWatchlist();

    const article = watchlist.get('nonexistent');

    expect(article).toBeUndefined();
  });
});

describe('list', () => {
  beforeEach(() => {
    // Create a watchlist with various articles for list tests
  });

  it('should list all articles sorted by priority', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('111', { priority: 'low' });
    watchlist.add('222', { priority: 'high' });
    watchlist.add('333', { priority: 'medium' });

    const articles = watchlist.list();

    expect(articles.length).toBe(3);
    expect(articles[0].priority).toBe('high');
    expect(articles[1].priority).toBe('medium');
    expect(articles[2].priority).toBe('low');
  });

  it('should filter by priority', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('111', { priority: 'low' });
    watchlist.add('222', { priority: 'high' });
    watchlist.add('333', { priority: 'high' });

    const highPriority = watchlist.list({ priority: 'high' });

    expect(highPriority.length).toBe(2);
    expect(highPriority.every((a) => a.priority === 'high')).toBe(true);
  });

  it('should filter by tags', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('111', { tags: ['GLP-1', 'safety'] });
    watchlist.add('222', { tags: ['SGLT2'] });
    watchlist.add('333', { tags: ['GLP-1', 'efficacy'] });

    const glp1Articles = watchlist.list({ tags: ['GLP-1'] });

    expect(glp1Articles.length).toBe(2);
  });

  it('should filter by multiple tags (OR logic)', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('111', { tags: ['GLP-1'] });
    watchlist.add('222', { tags: ['SGLT2'] });
    watchlist.add('333', { tags: ['DPP4'] });

    const filtered = watchlist.list({ tags: ['GLP-1', 'SGLT2'] });

    expect(filtered.length).toBe(2);
  });

  it('should combine filters', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('111', { priority: 'high', tags: ['GLP-1'] });
    watchlist.add('222', { priority: 'low', tags: ['GLP-1'] });
    watchlist.add('333', { priority: 'high', tags: ['SGLT2'] });

    const filtered = watchlist.list({ priority: 'high', tags: ['GLP-1'] });

    expect(filtered.length).toBe(1);
    expect(filtered[0].pmid).toBe('111');
  });

  it('should return empty array when no matches', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('111', { priority: 'low' });

    const filtered = watchlist.list({ priority: 'high' });

    expect(filtered).toEqual([]);
  });
});

describe('size', () => {
  it('should return 0 for empty watchlist', () => {
    const watchlist = new PMIDWatchlist();
    expect(watchlist.size).toBe(0);
  });

  it('should return correct count', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('111');
    watchlist.add('222');
    watchlist.add('333');

    expect(watchlist.size).toBe(3);
  });
});

// =============================================================================
// Metadata Operations Tests
// =============================================================================

describe('refreshMetadata', () => {
  it('should fetch and cache metadata for all articles', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');
    watchlist.add('87654321');

    mockFetchArticlesByPMID.mockResolvedValue([samplePubMedArticle, samplePubMedArticle2]);

    await watchlist.refreshMetadata();

    expect(mockFetchArticlesByPMID).toHaveBeenCalledWith(['12345678', '87654321'], expect.anything());

    const article1 = watchlist.get('12345678');
    expect(article1?.metadata?.title).toBe('Cardiovascular outcomes with GLP-1 receptor agonists');
    expect(article1?.lastChecked).toBeInstanceOf(Date);

    const article2 = watchlist.get('87654321');
    expect(article2?.metadata?.title).toBe('SGLT2 inhibitors and renal outcomes');
  });

  it('should do nothing for empty watchlist', async () => {
    const watchlist = new PMIDWatchlist();

    await watchlist.refreshMetadata();

    expect(mockFetchArticlesByPMID).not.toHaveBeenCalled();
  });

  it('should pass API key when available', async () => {
    const watchlist = new PMIDWatchlist({ apiKey: 'test-api-key' });
    watchlist.add('12345678');

    mockFetchArticlesByPMID.mockResolvedValue([samplePubMedArticle]);

    await watchlist.refreshMetadata();

    expect(mockFetchArticlesByPMID).toHaveBeenCalledWith(
      ['12345678'],
      expect.objectContaining({ apiKey: 'test-api-key' })
    );
  });
});

describe('getMetadata', () => {
  it('should fetch fresh metadata', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    mockFetchArticlesByPMID.mockResolvedValue([samplePubMedArticle]);

    const metadata = await watchlist.getMetadata('12345678');

    expect(metadata?.title).toBe('Cardiovascular outcomes with GLP-1 receptor agonists');
    expect(mockFetchArticlesByPMID).toHaveBeenCalled();
  });

  it('should return cached metadata if fresh', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    // First call - fetches fresh
    mockFetchArticlesByPMID.mockResolvedValue([samplePubMedArticle]);
    await watchlist.getMetadata('12345678');

    // Clear mock to verify second call uses cache
    mockFetchArticlesByPMID.mockClear();

    // Second call - should use cache
    const metadata = await watchlist.getMetadata('12345678');

    expect(metadata?.title).toBe('Cardiovascular outcomes with GLP-1 receptor agonists');
    expect(mockFetchArticlesByPMID).not.toHaveBeenCalled(); // Used cache
  });

  it('should return null for non-existent PMID', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    mockFetchArticlesByPMID.mockResolvedValue([]);

    const metadata = await watchlist.getMetadata('12345678');

    expect(metadata).toBeNull();
  });
});

// =============================================================================
// Citation & Related Articles Tests
// =============================================================================

describe('getCitingArticles', () => {
  it('should return citing articles', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    // Mock elink response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockElinkResponse,
    });

    // Mock fetchArticlesByPMID for the cited articles
    mockFetchArticlesByPMID.mockResolvedValue([
      { ...samplePubMedArticle, pmid: '11111111', title: 'Citing article 1' },
      { ...samplePubMedArticle, pmid: '22222222', title: 'Citing article 2' },
      { ...samplePubMedArticle, pmid: '33333333', title: 'Citing article 3' },
    ]);

    const citing = await watchlist.getCitingArticles('12345678');

    expect(citing.length).toBe(3);
    expect(citing[0].relationship).toBe('cited_by');
    expect(citing[0].pmid).toBe('11111111');
  });

  it('should return empty array on API error', async () => {
    const watchlist = new PMIDWatchlist();

    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    const citing = await watchlist.getCitingArticles('12345678');

    expect(citing).toEqual([]);
  });

  it('should return empty array when no citations', async () => {
    const watchlist = new PMIDWatchlist();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ linksets: [{ linksetdbs: [] }] }),
    });

    const citing = await watchlist.getCitingArticles('12345678');

    expect(citing).toEqual([]);
  });
});

describe('getSimilarArticles', () => {
  it('should return similar articles with decreasing scores', async () => {
    const watchlist = new PMIDWatchlist();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockElinkResponse,
    });

    mockFetchArticlesByPMID.mockResolvedValue([
      { ...samplePubMedArticle, pmid: '11111111', title: 'Similar 1' },
      { ...samplePubMedArticle, pmid: '22222222', title: 'Similar 2' },
    ]);

    const similar = await watchlist.getSimilarArticles('12345678', 2);

    expect(similar.length).toBe(2);
    expect(similar[0].relationship).toBe('similar');
    expect(similar[0].score).toBeGreaterThan(similar[1].score);
  });

  it('should limit results', async () => {
    const watchlist = new PMIDWatchlist();

    // Return 10 PMIDs
    const manyLinks = {
      linksets: [
        {
          linksetdbs: [
            {
              links: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            },
          ],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => manyLinks,
    });

    mockFetchArticlesByPMID.mockResolvedValue([
      { ...samplePubMedArticle, pmid: '1', title: 'Article 1' },
      { ...samplePubMedArticle, pmid: '2', title: 'Article 2' },
      { ...samplePubMedArticle, pmid: '3', title: 'Article 3' },
    ]);

    const _similar = await watchlist.getSimilarArticles('12345678', 3);

    // Should respect the limit in the call
    expect(mockFetchArticlesByPMID).toHaveBeenCalledWith(
      expect.arrayContaining(['1', '2', '3']),
      expect.anything()
    );
  });
});

describe('checkForNewCitations', () => {
  it('should detect new citations', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    // First check - establishes baseline
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        linksets: [{ linksetdbs: [{ links: ['111'] }] }],
      }),
    });
    mockFetchArticlesByPMID.mockResolvedValueOnce([
      { ...samplePubMedArticle, pmid: '111', title: 'Citation 1' },
    ]);

    await watchlist.checkForNewCitations();

    // Second check - finds new citations
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        linksets: [{ linksetdbs: [{ links: ['111', '222', '333'] }] }],
      }),
    });
    mockFetchArticlesByPMID.mockResolvedValueOnce([
      { ...samplePubMedArticle, pmid: '111', title: 'Citation 1' },
      { ...samplePubMedArticle, pmid: '222', title: 'Citation 2' },
      { ...samplePubMedArticle, pmid: '333', title: 'Citation 3' },
    ]);

    const updates = await watchlist.checkForNewCitations();

    expect(updates.length).toBe(1);
    expect(updates[0].updateType).toBe('new_citation');
    expect(updates[0].details).toBe('2 new citation(s) found');
  }, 10000);

  it('should return empty array when no new citations', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    // Same citations both times
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        linksets: [{ linksetdbs: [{ links: ['111'] }] }],
      }),
    });
    mockFetchArticlesByPMID.mockResolvedValue([
      { ...samplePubMedArticle, pmid: '111', title: 'Citation 1' },
    ]);

    await watchlist.checkForNewCitations();
    const updates = await watchlist.checkForNewCitations();

    expect(updates.length).toBe(0);
  }, 10000);

  it('should update lastKnownCitations', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        linksets: [{ linksetdbs: [{ links: ['111', '222'] }] }],
      }),
    });
    mockFetchArticlesByPMID.mockResolvedValueOnce([
      { ...samplePubMedArticle, pmid: '111' },
      { ...samplePubMedArticle, pmid: '222' },
    ]);

    await watchlist.checkForNewCitations();

    const article = watchlist.get('12345678');
    expect(article?.lastKnownCitations).toBe(2);
  });
});

// =============================================================================
// Bulk Operations Tests
// =============================================================================

describe('addBulk', () => {
  it('should add multiple PMIDs at once', () => {
    const watchlist = new PMIDWatchlist();

    watchlist.addBulk(['111', '222', '333'], {
      priority: 'high',
      tags: ['bulk-import'],
    });

    expect(watchlist.size).toBe(3);
    expect(watchlist.get('111')?.priority).toBe('high');
    expect(watchlist.get('222')?.tags).toContain('bulk-import');
  });

  it('should handle empty array', () => {
    const watchlist = new PMIDWatchlist();

    watchlist.addBulk([]);

    expect(watchlist.size).toBe(0);
  });
});

describe('importFromReferences', () => {
  it('should import PMIDs from reference array', () => {
    const watchlist = new PMIDWatchlist();

    const refs = [
      { structured: { pmid: '111', title: 'Article 1' } },
      { structured: { pmid: '222', title: 'Article 2' } },
      { structured: { pmid: null, title: 'No PMID' } },
      { structured: { title: 'Also no PMID' } },
    ];

    const count = watchlist.importFromReferences(refs, {
      reason: 'From literature review',
      priority: 'medium',
    });

    expect(count).toBe(2);
    expect(watchlist.size).toBe(2);
    expect(watchlist.get('111')?.reason).toBe('From literature review');
  });

  it('should return 0 for empty refs', () => {
    const watchlist = new PMIDWatchlist();

    const count = watchlist.importFromReferences([]);

    expect(count).toBe(0);
  });

  it('should skip refs without PMID', () => {
    const watchlist = new PMIDWatchlist();

    const refs = [
      { structured: { title: 'No PMID article' } },
      { structured: { pmid: undefined } },
    ];

    const count = watchlist.importFromReferences(refs);

    expect(count).toBe(0);
    expect(watchlist.size).toBe(0);
  });
});

// =============================================================================
// Export & Import Tests
// =============================================================================

describe('export', () => {
  it('should export watchlist to JSON format', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('111', { reason: 'Test', priority: 'high', tags: ['tag1'] });
    watchlist.add('222', { priority: 'low' });

    const exported = watchlist.export();

    expect(exported.version).toBe('1.0');
    expect(exported.exportedAt).toBeDefined();
    expect(exported.articles.length).toBe(2);
    expect(exported.articles.find((a) => a.pmid === '111')?.reason).toBe('Test');
  });

  it('should include all article properties', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('111', {
      reason: 'Test reason',
      priority: 'high',
      tags: ['tag1', 'tag2'],
    });

    const exported = watchlist.export();
    const article = exported.articles[0];

    expect(article.pmid).toBe('111');
    expect(article.reason).toBe('Test reason');
    expect(article.priority).toBe('high');
    expect(article.tags).toEqual(['tag1', 'tag2']);
    expect(article.addedAt).toBeInstanceOf(Date);
  });
});

describe('import', () => {
  it('should import watchlist from JSON', () => {
    const watchlist = new PMIDWatchlist();

    const data: WatchlistExport = {
      version: '1.0',
      exportedAt: '2024-01-01T00:00:00Z',
      articles: [
        {
          pmid: '111',
          reason: 'Imported',
          priority: 'high',
          addedAt: new Date('2024-01-01'),
          tags: ['imported'],
        },
        {
          pmid: '222',
          priority: 'medium',
          addedAt: new Date('2024-01-02'),
          tags: [],
        },
      ],
    };

    watchlist.import(data);

    expect(watchlist.size).toBe(2);
    expect(watchlist.get('111')?.reason).toBe('Imported');
    expect(watchlist.get('222')?.priority).toBe('medium');
  });

  it('should convert date strings to Date objects', () => {
    const watchlist = new PMIDWatchlist();

    const data: WatchlistExport = {
      version: '1.0',
      exportedAt: '2024-01-01T00:00:00Z',
      articles: [
        {
          pmid: '111',
          priority: 'medium',
          addedAt: new Date('2024-01-01T10:00:00Z'),
          lastChecked: new Date('2024-01-02T15:00:00Z'),
          tags: [],
        },
      ],
    };

    watchlist.import(data);

    const article = watchlist.get('111');
    expect(article?.addedAt).toBeInstanceOf(Date);
    expect(article?.lastChecked).toBeInstanceOf(Date);
  });

  it('should merge with existing watchlist', () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('existing', { priority: 'low' });

    const data: WatchlistExport = {
      version: '1.0',
      exportedAt: '2024-01-01T00:00:00Z',
      articles: [
        {
          pmid: 'imported',
          priority: 'high',
          addedAt: new Date('2024-01-01'),
          tags: [],
        },
      ],
    };

    watchlist.import(data);

    expect(watchlist.size).toBe(2);
    expect(watchlist.get('existing')).toBeDefined();
    expect(watchlist.get('imported')).toBeDefined();
  });
});

describe('getUpdates', () => {
  it('should return all updates when no date filter', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    // First check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        linksets: [{ linksetdbs: [{ links: ['111'] }] }],
      }),
    });
    mockFetchArticlesByPMID.mockResolvedValueOnce([{ ...samplePubMedArticle, pmid: '111' }]);
    await watchlist.checkForNewCitations();

    // Second check with new citations
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        linksets: [{ linksetdbs: [{ links: ['111', '222'] }] }],
      }),
    });
    mockFetchArticlesByPMID.mockResolvedValueOnce([
      { ...samplePubMedArticle, pmid: '111' },
      { ...samplePubMedArticle, pmid: '222' },
    ]);
    await watchlist.checkForNewCitations();

    const updates = watchlist.getUpdates();

    expect(updates.length).toBe(1);
    expect(updates[0].updateType).toBe('new_citation');
  }, 10000);

  it('should filter updates by date', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    const futureDate = new Date(Date.now() + 100000);

    // First check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ linksets: [{ linksetdbs: [{ links: ['111'] }] }] }),
    });
    mockFetchArticlesByPMID.mockResolvedValueOnce([{ ...samplePubMedArticle, pmid: '111' }]);
    await watchlist.checkForNewCitations();

    // Second check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ linksets: [{ linksetdbs: [{ links: ['111', '222'] }] }] }),
    });
    mockFetchArticlesByPMID.mockResolvedValueOnce([
      { ...samplePubMedArticle, pmid: '111' },
      { ...samplePubMedArticle, pmid: '222' },
    ]);
    await watchlist.checkForNewCitations();

    const updates = watchlist.getUpdates(futureDate);

    expect(updates.length).toBe(0); // No updates after future date
  }, 10000);
});

describe('clearUpdates', () => {
  it('should clear all updates', async () => {
    const watchlist = new PMIDWatchlist();
    watchlist.add('12345678');

    // Generate an update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ linksets: [{ linksetdbs: [{ links: ['111'] }] }] }),
    });
    mockFetchArticlesByPMID.mockResolvedValueOnce([{ ...samplePubMedArticle, pmid: '111' }]);
    await watchlist.checkForNewCitations();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ linksets: [{ linksetdbs: [{ links: ['111', '222'] }] }] }),
    });
    mockFetchArticlesByPMID.mockResolvedValueOnce([
      { ...samplePubMedArticle, pmid: '111' },
      { ...samplePubMedArticle, pmid: '222' },
    ]);
    await watchlist.checkForNewCitations();

    expect(watchlist.getUpdates().length).toBe(1);

    watchlist.clearUpdates();

    expect(watchlist.getUpdates().length).toBe(0);
  }, 10000);
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createWatchlist', () => {
  it('should create a new PMIDWatchlist instance', () => {
    const watchlist = createWatchlist();

    expect(watchlist).toBeInstanceOf(PMIDWatchlist);
    expect(watchlist.size).toBe(0);
  });

  it('should pass options to constructor', () => {
    const watchlist = createWatchlist({ apiKey: 'test-key' });

    expect(watchlist).toBeInstanceOf(PMIDWatchlist);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('integration', () => {
  it('should support full workflow: add -> refresh -> export -> import', async () => {
    const watchlist1 = new PMIDWatchlist();

    // Add articles
    watchlist1.add('12345678', {
      reason: 'Key study',
      priority: 'high',
      tags: ['GLP-1', 'safety'],
    });
    watchlist1.add('87654321', {
      reason: 'Secondary study',
      priority: 'medium',
      tags: ['SGLT2'],
    });

    // Refresh metadata
    mockFetchArticlesByPMID.mockResolvedValue([samplePubMedArticle, samplePubMedArticle2]);
    await watchlist1.refreshMetadata();

    // Export
    const exported = watchlist1.export();
    expect(exported.articles.length).toBe(2);

    // Import into new watchlist
    const watchlist2 = new PMIDWatchlist();
    watchlist2.import(exported);

    expect(watchlist2.size).toBe(2);
    expect(watchlist2.get('12345678')?.reason).toBe('Key study');
    expect(watchlist2.get('87654321')?.tags).toContain('SGLT2');
  });

  it('should handle bulk import from literature review', () => {
    const watchlist = new PMIDWatchlist();

    // Simulate parsed references from a literature review
    const parsedRefs = [
      { structured: { pmid: '111', title: 'Article 1', doi: '10.1000/a1' } },
      { structured: { pmid: '222', title: 'Article 2', doi: '10.1000/a2' } },
      { structured: { pmid: '333', title: 'Article 3' } },
      { structured: { title: 'No PMID article', doi: '10.1000/a4' } },
    ];

    const imported = watchlist.importFromReferences(parsedRefs, {
      reason: 'From CV safety review',
      priority: 'medium',
      tags: ['cv-review'],
    });

    expect(imported).toBe(3);
    expect(watchlist.size).toBe(3);

    // All imported should have the same metadata
    const articles = watchlist.list();
    expect(articles.every((a) => a.reason === 'From CV safety review')).toBe(true);
    expect(articles.every((a) => a.tags.includes('cv-review'))).toBe(true);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('edge cases', () => {
  it('should handle concurrent operations', async () => {
    const watchlist = new PMIDWatchlist();

    // Add multiple articles concurrently
    const adds = ['111', '222', '333', '444', '555'].map((pmid) =>
      Promise.resolve(watchlist.add(pmid))
    );

    await Promise.all(adds);

    expect(watchlist.size).toBe(5);
  });

  it('should handle special characters in reason/tags', () => {
    const watchlist = new PMIDWatchlist();

    watchlist.add('12345678', {
      reason: 'Test with "quotes" and special <chars>',
      tags: ['tag-with-dash', 'tag_with_underscore', 'tag.with.dots'],
    });

    const article = watchlist.get('12345678');
    expect(article?.reason).toBe('Test with "quotes" and special <chars>');
    expect(article?.tags).toContain('tag-with-dash');
  });

  it('should handle invalid elink response gracefully', async () => {
    const watchlist = new PMIDWatchlist();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'response' }),
    });

    const citing = await watchlist.getCitingArticles('12345678');

    expect(citing).toEqual([]);
  });
});
