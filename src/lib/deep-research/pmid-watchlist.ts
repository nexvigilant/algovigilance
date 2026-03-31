/**
 * PMID Watchlist
 *
 * Track specific PubMed articles for updates, citations, and related articles.
 * Useful for monitoring key safety literature and emerging research.
 *
 * @example
 * ```ts
 * import { PMIDWatchlist } from '@/lib/deep-research/pmid-watchlist';
 *
 * const watchlist = new PMIDWatchlist();
 *
 * // Add articles to watch
 * watchlist.add('12345678', { reason: 'Key GLP-1 safety study', priority: 'high' });
 *
 * // Check for new citing articles
 * const updates = await watchlist.checkForCitations();
 *
 * // Get related articles
 * const related = await watchlist.getRelatedArticles('12345678');
 * ```
 */

import { fetchArticlesByPMID, type PubMedArticle } from './pubmed-enricher';

// =============================================================================
// Types
// =============================================================================

export interface WatchedArticle {
  pmid: string;
  /** Why we're watching this article */
  reason?: string;
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  /** When it was added to watchlist */
  addedAt: Date;
  /** Last time we checked for updates */
  lastChecked?: Date;
  /** Cached article metadata */
  metadata?: PubMedArticle;
  /** Tags for filtering */
  tags: string[];
  /** Known citation count at last check */
  lastKnownCitations?: number;
}

export interface WatchlistUpdate {
  pmid: string;
  updateType: 'new_citation' | 'related_article' | 'correction' | 'retraction';
  title: string;
  details: string;
  detectedAt: Date;
}

export interface RelatedArticle {
  pmid: string;
  title: string;
  score: number; // Relevance score
  relationship: 'cites' | 'cited_by' | 'similar' | 'same_authors';
}

export interface WatchlistExport {
  version: string;
  exportedAt: string;
  articles: WatchedArticle[];
}

// =============================================================================
// Constants
// =============================================================================

const ELINK_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
const DEFAULT_TOOL = 'AlgoVigilance-Watchlist';
const DEFAULT_EMAIL = 'api@nexvigilant.com';

// =============================================================================
// PMIDWatchlist Class
// =============================================================================

export class PMIDWatchlist {
  private articles: Map<string, WatchedArticle> = new Map();
  private updates: WatchlistUpdate[] = [];
  private apiKey?: string;

  constructor(options: { apiKey?: string } = {}) {
    this.apiKey = options.apiKey;
  }

  // ===========================================================================
  // Core Operations
  // ===========================================================================

  /**
   * Add a PMID to the watchlist
   */
  add(
    pmid: string,
    options: {
      reason?: string;
      priority?: 'high' | 'medium' | 'low';
      tags?: string[];
    } = {}
  ): void {
    if (this.articles.has(pmid)) {
      // Update existing entry
      const existing = this.articles.get(pmid);
      if (!existing) return;
      if (options.reason) existing.reason = options.reason;
      if (options.priority) existing.priority = options.priority;
      if (options.tags) existing.tags = [...new Set([...existing.tags, ...options.tags])];
      return;
    }

    this.articles.set(pmid, {
      pmid,
      reason: options.reason,
      priority: options.priority || 'medium',
      addedAt: new Date(),
      tags: options.tags || [],
    });
  }

  /**
   * Remove a PMID from the watchlist
   */
  remove(pmid: string): boolean {
    return this.articles.delete(pmid);
  }

  /**
   * Get a watched article
   */
  get(pmid: string): WatchedArticle | undefined {
    return this.articles.get(pmid);
  }

  /**
   * List all watched articles
   */
  list(filter?: { priority?: string; tags?: string[] }): WatchedArticle[] {
    let articles = Array.from(this.articles.values());

    if (filter?.priority) {
      articles = articles.filter((a) => a.priority === filter.priority);
    }

    if (filter?.tags && filter.tags.length > 0) {
      articles = articles.filter((a) =>
        (filter.tags ?? []).some((tag) => a.tags.includes(tag))
      );
    }

    return articles.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get count of watched articles
   */
  get size(): number {
    return this.articles.size;
  }

  // ===========================================================================
  // Metadata Operations
  // ===========================================================================

  /**
   * Fetch and cache metadata for all watched articles
   */
  async refreshMetadata(): Promise<void> {
    const pmids = Array.from(this.articles.keys());
    if (pmids.length === 0) return;

    const fetchedArticles = await fetchArticlesByPMID(pmids, {
      apiKey: this.apiKey,
    });

    for (const article of fetchedArticles) {
      const watched = this.articles.get(article.pmid);
      if (watched) {
        watched.metadata = article;
        watched.lastChecked = new Date();
      }
    }
  }

  /**
   * Get metadata for a specific PMID
   */
  async getMetadata(pmid: string): Promise<PubMedArticle | null> {
    const watched = this.articles.get(pmid);

    // Return cached if fresh (< 1 hour old)
    if (watched?.metadata && watched.lastChecked) {
      const age = Date.now() - watched.lastChecked.getTime();
      if (age < 3600000) {
        return watched.metadata;
      }
    }

    // Fetch fresh
    const [article] = await fetchArticlesByPMID(pmid, { apiKey: this.apiKey });
    if (article && watched) {
      watched.metadata = article;
      watched.lastChecked = new Date();
    }
    return article || null;
  }

  // ===========================================================================
  // Citation & Related Articles
  // ===========================================================================

  /**
   * Get articles that cite a watched PMID
   */
  async getCitingArticles(pmid: string): Promise<RelatedArticle[]> {
    const params = new URLSearchParams({
      dbfrom: 'pubmed',
      db: 'pubmed',
      id: pmid,
      linkname: 'pubmed_pubmed_citedin',
      retmode: 'json',
      tool: DEFAULT_TOOL,
      email: DEFAULT_EMAIL,
    });
    if (this.apiKey) params.set('api_key', this.apiKey);

    try {
      const response = await fetch(`${ELINK_BASE}?${params}`);
      if (!response.ok) return [];

      const data = await response.json();
      const linkedPmids = extractLinkedPmids(data);

      if (linkedPmids.length === 0) return [];

      // Fetch titles for the citing articles
      const articles = await fetchArticlesByPMID(linkedPmids.slice(0, 20), {
        apiKey: this.apiKey,
      });

      return articles.map((a) => ({
        pmid: a.pmid,
        title: a.title,
        score: 1.0,
        relationship: 'cited_by' as const,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get similar articles (PubMed's "similar articles" feature)
   */
  async getSimilarArticles(pmid: string, limit = 10): Promise<RelatedArticle[]> {
    const params = new URLSearchParams({
      dbfrom: 'pubmed',
      db: 'pubmed',
      id: pmid,
      linkname: 'pubmed_pubmed',
      retmode: 'json',
      tool: DEFAULT_TOOL,
      email: DEFAULT_EMAIL,
    });
    if (this.apiKey) params.set('api_key', this.apiKey);

    try {
      const response = await fetch(`${ELINK_BASE}?${params}`);
      if (!response.ok) return [];

      const data = await response.json();
      const linkedPmids = extractLinkedPmids(data).slice(0, limit);

      if (linkedPmids.length === 0) return [];

      const articles = await fetchArticlesByPMID(linkedPmids, {
        apiKey: this.apiKey,
      });

      return articles.map((a, i) => ({
        pmid: a.pmid,
        title: a.title,
        score: 1 - i * 0.05, // Decreasing score by position
        relationship: 'similar' as const,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Check all watched articles for new citations
   */
  async checkForNewCitations(): Promise<WatchlistUpdate[]> {
    const newUpdates: WatchlistUpdate[] = [];

    for (const [pmid, watched] of this.articles) {
      const citing = await this.getCitingArticles(pmid);

      // If we have a previous count, check for new citations
      if (watched.lastKnownCitations !== undefined) {
        const newCount = citing.length;
        if (newCount > watched.lastKnownCitations) {
          const diff = newCount - watched.lastKnownCitations;
          newUpdates.push({
            pmid,
            updateType: 'new_citation',
            title: watched.metadata?.title || `PMID: ${pmid}`,
            details: `${diff} new citation(s) found`,
            detectedAt: new Date(),
          });
        }
      }

      watched.lastKnownCitations = citing.length;
      watched.lastChecked = new Date();

      // Rate limiting
      await delay(334);
    }

    this.updates.push(...newUpdates);
    return newUpdates;
  }

  // ===========================================================================
  // Bulk Operations
  // ===========================================================================

  /**
   * Add multiple PMIDs at once
   */
  addBulk(
    pmids: string[],
    options: {
      reason?: string;
      priority?: 'high' | 'medium' | 'low';
      tags?: string[];
    } = {}
  ): void {
    for (const pmid of pmids) {
      this.add(pmid, options);
    }
  }

  /**
   * Import from extracted references
   */
  importFromReferences(
    refs: Array<{ structured: { pmid?: string | null } }>,
    options: { reason?: string; priority?: 'high' | 'medium' | 'low'; tags?: string[] } = {}
  ): number {
    let imported = 0;

    for (const ref of refs) {
      if (ref.structured.pmid) {
        this.add(ref.structured.pmid, options);
        imported++;
      }
    }

    return imported;
  }

  // ===========================================================================
  // Export & Import
  // ===========================================================================

  /**
   * Export watchlist to JSON
   */
  export(): WatchlistExport {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      articles: Array.from(this.articles.values()),
    };
  }

  /**
   * Import watchlist from JSON
   */
  import(data: WatchlistExport): void {
    for (const article of data.articles) {
      this.articles.set(article.pmid, {
        ...article,
        addedAt: new Date(article.addedAt),
        lastChecked: article.lastChecked ? new Date(article.lastChecked) : undefined,
      });
    }
  }

  /**
   * Get recent updates
   */
  getUpdates(since?: Date): WatchlistUpdate[] {
    if (!since) return this.updates;
    return this.updates.filter((u) => u.detectedAt >= since);
  }

  /**
   * Clear all updates
   */
  clearUpdates(): void {
    this.updates = [];
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract linked PMIDs from elink response
 */
function extractLinkedPmids(data: unknown): string[] {
  try {
    const linksets = (data as { linksets?: Array<{ linksetdbs?: Array<{ links?: string[] }> }> })
      ?.linksets;
    if (!linksets || linksets.length === 0) return [];

    const linksetdbs = linksets[0]?.linksetdbs;
    if (!linksetdbs || linksetdbs.length === 0) return [];

    return linksetdbs[0]?.links || [];
  } catch {
    return [];
  }
}

/**
 * Simple delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new PMID watchlist
 */
export function createWatchlist(options: { apiKey?: string } = {}): PMIDWatchlist {
  return new PMIDWatchlist(options);
}
