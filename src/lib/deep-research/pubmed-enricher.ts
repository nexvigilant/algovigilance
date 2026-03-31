/**
 * PubMed E-utilities Integration
 *
 * Enriches references with metadata from PubMed using NCBI's free E-utilities API.
 * No API key required for basic usage (rate limited to 3 requests/second).
 * With API key: 10 requests/second.
 *
 * @see https://www.ncbi.nlm.nih.gov/books/NBK25500/
 *
 * @example
 * ```ts
 * import { enrichWithPubMed, searchPubMed } from '@/lib/deep-research/pubmed-enricher';
 *
 * // Enrich a single reference by PMID
 * const enriched = await enrichByPMID('12345678');
 *
 * // Search PubMed and get enriched results
 * const results = await searchPubMed('semaglutide cardiovascular safety');
 *
 * // Bulk enrich multiple PMIDs
 * const refs = await enrichMultiplePMIDs(['12345678', '87654321']);
 * ```
 */

import type { ParsedReference } from './reference-parser';

import { logger } from '@/lib/logger';
const log = logger.scope('deep-research/pubmed-enricher');

// =============================================================================
// Types
// =============================================================================

export interface PubMedArticle {
  pmid: string;
  doi: string | null;
  title: string;
  abstract: string | null;
  authors: PubMedAuthor[];
  journal: {
    name: string;
    abbreviation: string | null;
    issn: string | null;
  };
  publication: {
    year: number | null;
    month: string | null;
    day: string | null;
    volume: string | null;
    issue: string | null;
    pages: string | null;
  };
  meshTerms: string[];
  keywords: string[];
  publicationType: string[];
  affiliations: string[];
  pmc: string | null; // PMC ID for open access
  url: string; // PubMed URL
}

export interface PubMedAuthor {
  lastName: string;
  foreName: string | null;
  initials: string | null;
  affiliation: string | null;
  orcid: string | null;
}

export interface PubMedSearchResult {
  query: string;
  count: number;
  pmids: string[];
  articles: PubMedArticle[];
}

export interface EnrichmentResult {
  original: ParsedReference;
  enriched: PubMedArticle | null;
  matched: boolean;
  matchMethod: 'pmid' | 'doi' | 'title' | 'none';
}

export interface EnrichmentOptions {
  /** API key for higher rate limits (optional) */
  apiKey?: string;
  /** Tool name for NCBI tracking */
  tool?: string;
  /** Contact email for NCBI (recommended) */
  email?: string;
  /** Max concurrent requests */
  maxConcurrent?: number;
  /** Delay between requests in ms (default: 334ms = 3/sec) */
  requestDelay?: number;
}

// =============================================================================
// Constants
// =============================================================================

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const DEFAULT_TOOL = 'AlgoVigilance-DeepResearch';
const DEFAULT_EMAIL = 'api@nexvigilant.com';

// Rate limiting: 3 requests/sec without key, 10/sec with key
const DEFAULT_DELAY_MS = 334; // ~3 requests per second

// =============================================================================
// Core API Functions
// =============================================================================

/**
 * Search PubMed by query string
 */
export async function searchPubMed(
  query: string,
  options: EnrichmentOptions & { maxResults?: number } = {}
): Promise<PubMedSearchResult> {
  const { maxResults = 20, apiKey, tool = DEFAULT_TOOL, email = DEFAULT_EMAIL } = options;

  // Build search URL
  const params = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmax: String(maxResults),
    retmode: 'json',
    tool,
    email,
  });
  if (apiKey) params.set('api_key', apiKey);

  const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?${params}`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`PubMed search failed: ${response.status}`);
    }

    const data = await response.json();
    const pmids: string[] = data.esearchresult?.idlist || [];
    const count = parseInt(data.esearchresult?.count || '0', 10);

    // Fetch full details for returned PMIDs
    const articles = pmids.length > 0 ? await fetchArticlesByPMID(pmids, options) : [];

    return {
      query,
      count,
      pmids,
      articles,
    };
  } catch (error) {
    log.error('PubMed search error:', error);
    return {
      query,
      count: 0,
      pmids: [],
      articles: [],
    };
  }
}

/**
 * Fetch full article details by PMID(s)
 */
export async function fetchArticlesByPMID(
  pmids: string | string[],
  options: EnrichmentOptions = {}
): Promise<PubMedArticle[]> {
  const pmidList = Array.isArray(pmids) ? pmids : [pmids];
  if (pmidList.length === 0) return [];

  const { apiKey, tool = DEFAULT_TOOL, email = DEFAULT_EMAIL } = options;

  // Build fetch URL (efetch returns XML)
  const params = new URLSearchParams({
    db: 'pubmed',
    id: pmidList.join(','),
    retmode: 'xml',
    rettype: 'abstract',
    tool,
    email,
  });
  if (apiKey) params.set('api_key', apiKey);

  const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?${params}`;

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`PubMed fetch failed: ${response.status}`);
    }

    const xml = await response.text();
    return parseArticlesXML(xml);
  } catch (error) {
    log.error('PubMed fetch error:', error);
    return [];
  }
}

/**
 * Enrich a single reference by PMID
 */
export async function enrichByPMID(
  pmid: string,
  options: EnrichmentOptions = {}
): Promise<PubMedArticle | null> {
  const articles = await fetchArticlesByPMID(pmid, options);
  return articles[0] || null;
}

/**
 * Enrich multiple PMIDs with rate limiting
 */
export async function enrichMultiplePMIDs(
  pmids: string[],
  options: EnrichmentOptions = {}
): Promise<Map<string, PubMedArticle>> {
  const { requestDelay = DEFAULT_DELAY_MS } = options;
  const results = new Map<string, PubMedArticle>();

  // Batch PMIDs to reduce API calls (max 200 per request)
  const batchSize = 200;
  for (let i = 0; i < pmids.length; i += batchSize) {
    const batch = pmids.slice(i, i + batchSize);
    const articles = await fetchArticlesByPMID(batch, options);

    for (const article of articles) {
      results.set(article.pmid, article);
    }

    // Rate limiting between batches
    if (i + batchSize < pmids.length) {
      await delay(requestDelay);
    }
  }

  return results;
}

/**
 * Search PubMed by DOI
 */
export async function searchByDOI(
  doi: string,
  options: EnrichmentOptions = {}
): Promise<PubMedArticle | null> {
  // Clean DOI
  const cleanDOI = doi.replace(/^https?:\/\/doi\.org\//, '').trim();
  const result = await searchPubMed(`${cleanDOI}[DOI]`, { ...options, maxResults: 1 });
  return result.articles[0] || null;
}

/**
 * Enrich parsed references with PubMed data
 */
export async function enrichReferences(
  references: ParsedReference[],
  options: EnrichmentOptions = {}
): Promise<EnrichmentResult[]> {
  const { requestDelay = DEFAULT_DELAY_MS } = options;
  const results: EnrichmentResult[] = [];

  // First pass: collect all PMIDs and DOIs
  const pmidsToFetch: string[] = [];
  const doisToSearch: Array<{ ref: ParsedReference; doi: string }> = [];

  for (const ref of references) {
    if (ref.structured.pmid) {
      pmidsToFetch.push(ref.structured.pmid);
    } else if (ref.structured.doi) {
      doisToSearch.push({ ref, doi: ref.structured.doi });
    }
  }

  // Batch fetch by PMID
  const pmidArticles = await enrichMultiplePMIDs(pmidsToFetch, options);

  // Search by DOI (one at a time due to search limitations)
  const doiArticles = new Map<string, PubMedArticle>();
  for (const { doi } of doisToSearch) {
    const article = await searchByDOI(doi, options);
    if (article) {
      doiArticles.set(doi, article);
    }
    await delay(requestDelay);
  }

  // Build results
  for (const ref of references) {
    let enriched: PubMedArticle | null = null;
    let matchMethod: EnrichmentResult['matchMethod'] = 'none';

    if (ref.structured.pmid && pmidArticles.has(ref.structured.pmid)) {
      enriched = pmidArticles.get(ref.structured.pmid) ?? null;
      matchMethod = 'pmid';
    } else if (ref.structured.doi && doiArticles.has(ref.structured.doi)) {
      enriched = doiArticles.get(ref.structured.doi) ?? null;
      matchMethod = 'doi';
    }

    results.push({
      original: ref,
      enriched,
      matched: enriched !== null,
      matchMethod,
    });
  }

  return results;
}

// =============================================================================
// XML Parsing
// =============================================================================

/**
 * Parse PubMed XML response into structured articles
 */
function parseArticlesXML(xml: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  // Simple regex-based XML parsing (avoids dependency on DOM parser in Node)
  const articleMatches = xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g);

  for (const match of articleMatches) {
    const articleXml = match[1];
    const article = parseArticleXML(articleXml);
    if (article) {
      articles.push(article);
    }
  }

  return articles;
}

/**
 * Parse a single PubMed article from XML
 */
function parseArticleXML(xml: string): PubMedArticle | null {
  const pmid = extractTag(xml, 'PMID');
  if (!pmid) return null;

  // Extract ArticleTitle
  const title = extractTag(xml, 'ArticleTitle') || '';

  // Extract abstract
  const abstractText = extractTag(xml, 'AbstractText');

  // Extract DOI from ArticleIdList
  const doiMatch = xml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
  const doi = doiMatch?.[1] || null;

  // Extract PMC ID
  const pmcMatch = xml.match(/<ArticleId IdType="pmc">([^<]+)<\/ArticleId>/);
  const pmc = pmcMatch?.[1] || null;

  // Extract authors
  const authors = parseAuthors(xml);

  // Extract journal info
  const journalName = extractTag(xml, 'Title') || extractTag(xml, 'ISOAbbreviation') || '';
  const journalAbbrev = extractTag(xml, 'ISOAbbreviation') || null;
  const issn = extractTag(xml, 'ISSN') || null;

  // Extract publication info
  const year = extractTag(xml, 'Year');
  const month = extractTag(xml, 'Month');
  const day = extractTag(xml, 'Day');
  const volume = extractTag(xml, 'Volume');
  const issue = extractTag(xml, 'Issue');
  const pages = extractTag(xml, 'MedlinePgn');

  // Extract MeSH terms
  const meshTerms = parseMeshTerms(xml);

  // Extract keywords
  const keywords = parseKeywords(xml);

  // Extract publication types
  const publicationType = parsePublicationTypes(xml);

  // Extract affiliations
  const affiliations = parseAffiliations(xml);

  return {
    pmid,
    doi,
    title,
    abstract: abstractText,
    authors,
    journal: {
      name: journalName,
      abbreviation: journalAbbrev,
      issn,
    },
    publication: {
      year: year ? parseInt(year, 10) : null,
      month,
      day,
      volume,
      issue,
      pages,
    },
    meshTerms,
    keywords,
    publicationType,
    affiliations,
    pmc,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
  };
}

/**
 * Extract authors from PubMed XML
 */
function parseAuthors(xml: string): PubMedAuthor[] {
  const authors: PubMedAuthor[] = [];
  const authorMatches = xml.matchAll(/<Author[^>]*>([\s\S]*?)<\/Author>/g);

  for (const match of authorMatches) {
    const authorXml = match[1];
    const lastName = extractTag(authorXml, 'LastName');
    if (!lastName) continue;

    const foreName = extractTag(authorXml, 'ForeName');
    const initials = extractTag(authorXml, 'Initials');
    const affiliation = extractTag(authorXml, 'Affiliation');

    // Extract ORCID if present
    const orcidMatch = authorXml.match(/Identifier Source="ORCID">([^<]+)</);
    const orcid = orcidMatch?.[1] || null;

    authors.push({
      lastName,
      foreName,
      initials,
      affiliation,
      orcid,
    });
  }

  return authors;
}

/**
 * Extract MeSH terms from XML
 */
function parseMeshTerms(xml: string): string[] {
  const terms: string[] = [];
  const meshMatches = xml.matchAll(/<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/g);
  for (const match of meshMatches) {
    terms.push(match[1]);
  }
  return terms;
}

/**
 * Extract keywords from XML
 */
function parseKeywords(xml: string): string[] {
  const keywords: string[] = [];
  const keywordMatches = xml.matchAll(/<Keyword[^>]*>([^<]+)<\/Keyword>/g);
  for (const match of keywordMatches) {
    keywords.push(match[1]);
  }
  return keywords;
}

/**
 * Extract publication types from XML
 */
function parsePublicationTypes(xml: string): string[] {
  const types: string[] = [];
  const typeMatches = xml.matchAll(/<PublicationType[^>]*>([^<]+)<\/PublicationType>/g);
  for (const match of typeMatches) {
    types.push(match[1]);
  }
  return types;
}

/**
 * Extract all affiliations from XML
 */
function parseAffiliations(xml: string): string[] {
  const affiliations: string[] = [];
  const affMatches = xml.matchAll(/<Affiliation>([^<]+)<\/Affiliation>/g);
  for (const match of affMatches) {
    if (!affiliations.includes(match[1])) {
      affiliations.push(match[1]);
    }
  }
  return affiliations;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract content of an XML tag
 */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match?.[1]?.trim() || null;
}

/**
 * Simple delay function for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Conversion to ParsedReference
// =============================================================================

/**
 * Convert a PubMed article to a ParsedReference format
 */
export function pubmedToReference(article: PubMedArticle): ParsedReference {
  // Format author names
  const authorNames = article.authors.map((a) =>
    a.foreName ? `${a.lastName}, ${a.foreName}` : a.lastName
  );

  return {
    id: `pmid-${article.pmid}`,
    raw: formatCitation(article),
    structured: {
      authors: authorNames,
      title: article.title,
      year: article.publication.year,
      journal: article.journal.name,
      volume: article.publication.volume,
      issue: article.publication.issue,
      pages: article.publication.pages,
      doi: article.doi,
      pmid: article.pmid,
      url: article.url,
    },
    confidence: 1.0, // Direct PubMed data is authoritative
    format: 'pubmed',
    position: { line: null, section: null },
  };
}

/**
 * Format a citation string from PubMed article
 */
function formatCitation(article: PubMedArticle): string {
  const parts: string[] = [];

  // Authors
  if (article.authors.length > 0) {
    const authorStr =
      article.authors.length > 3
        ? `${article.authors[0].lastName} et al.`
        : article.authors.map((a) => a.lastName).join(', ');
    parts.push(authorStr);
  }

  // Title
  parts.push(article.title);

  // Journal info
  const journalParts: string[] = [article.journal.abbreviation || article.journal.name];
  if (article.publication.year) {
    journalParts.push(String(article.publication.year));
  }
  if (article.publication.volume) {
    let volStr = article.publication.volume;
    if (article.publication.issue) {
      volStr += `(${article.publication.issue})`;
    }
    journalParts.push(volStr);
  }
  if (article.publication.pages) {
    journalParts.push(article.publication.pages);
  }
  parts.push(journalParts.join('; '));

  // PMID
  parts.push(`PMID: ${article.pmid}`);

  return parts.join('. ') + '.';
}
