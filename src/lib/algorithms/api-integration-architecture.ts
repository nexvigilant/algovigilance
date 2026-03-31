/**
 * Research Validation API Integration Architecture
 *
 * This module defines types and utilities for integrating external APIs
 * with the CMER v2.0 research validation framework and CIDRE cartel detection.
 *
 * ## API Categories
 *
 * ### 1. Citation Data APIs (for CIDRE network analysis)
 * - OpenAlex (Recommended): Free, 240M+ works, excellent coverage
 * - CrossRef: DOI registry, source of truth for publication metadata
 * - Semantic Scholar: AI-powered, rich citation context
 * - PubMed/PubMed Central: Medical/life sciences focus
 *
 * ### 2. Google Cloud APIs (for research validation)
 * - Fact Check Tools API: ClaimReview search, fact verification
 * - Cloud Natural Language API: Entity extraction, sentiment, salience
 * - Document AI: Extract data from research PDFs
 * - Enterprise Knowledge Graph: Entity disambiguation
 * - Cloud Healthcare API: FHIR for medical research data
 *
 * ### 3. BigQuery Public Datasets
 * - PubMed Central archive
 * - AlphaFold Protein Structure Database
 * - National Library of Medicine GUDID
 *
 * @see https://docs.openalex.org/
 * @see https://api.crossref.org/swagger-ui/index.html
 * @see https://api.semanticscholar.org/
 * @see https://developers.google.com/fact-check/tools/api
 */

// =============================================================================
// CITATION API TYPES
// =============================================================================

/**
 * OpenAlex Work entity (research publication)
 * @see https://docs.openalex.org/api-entities/works
 */
export interface OpenAlexWork {
  id: string; // OpenAlex ID (e.g., "W2741809807")
  doi?: string;
  title: string;
  publication_date?: string;
  publication_year?: number;
  type: string; // "journal-article", "book-chapter", etc.
  cited_by_count: number;
  is_retracted: boolean;
  is_paratext: boolean;

  // Citation relationships (for CIDRE)
  referenced_works: string[]; // OpenAlex IDs of cited works
  related_works: string[]; // Semantically similar works

  // Author information
  authorships: Array<{
    author_position: 'first' | 'middle' | 'last';
    author: {
      id: string;
      display_name: string;
      orcid?: string;
    };
    institutions: Array<{
      id: string;
      display_name: string;
      country_code?: string;
    }>;
  }>;

  // Venue/journal
  primary_location?: {
    source?: {
      id: string;
      display_name: string;
      issn_l?: string;
      is_oa: boolean;
      type: string;
    };
    pdf_url?: string;
    is_oa: boolean;
  };

  // Metrics for validation
  counts_by_year: Array<{
    year: number;
    cited_by_count: number;
  }>;

  // Concepts/topics
  concepts: Array<{
    id: string;
    display_name: string;
    score: number;
  }>;
}

/**
 * CrossRef Work metadata
 * @see https://api.crossref.org/swagger-ui/index.html
 */
export interface CrossRefWork {
  DOI: string;
  title: string[];
  'container-title'?: string[];
  type: string;
  'is-referenced-by-count': number;
  'references-count'?: number;
  published?: { 'date-parts': number[][] };

  // References for CIDRE
  reference?: Array<{
    DOI?: string;
    'article-title'?: string;
    author?: string;
    year?: string;
  }>;

  // Author information
  author?: Array<{
    given?: string;
    family?: string;
    ORCID?: string;
    affiliation?: Array<{ name: string }>;
  }>;

  // Licensing
  license?: Array<{
    URL: string;
    'content-version': string;
    'delay-in-days': number;
  }>;

  // Assertions (peer review status, etc.)
  assertion?: Array<{
    label: string;
    name: string;
    value?: string;
  }>;
}

/**
 * Semantic Scholar Paper
 * @see https://api.semanticscholar.org/api-docs/
 */
export interface SemanticScholarPaper {
  paperId: string;
  externalIds?: {
    DOI?: string;
    PubMed?: string;
    ArXiv?: string;
  };
  title: string;
  abstract?: string;
  year?: number;
  venue?: string;
  citationCount: number;
  referenceCount: number;
  influentialCitationCount: number;
  isOpenAccess: boolean;

  // Citation context (rich data for validation)
  citations?: Array<{
    paperId: string;
    title: string;
    isInfluential: boolean;
    contexts: string[]; // Sentences where citation appears
    intents: string[]; // "background", "methodology", "result_comparison"
  }>;

  references?: Array<{
    paperId: string;
    title: string;
    isInfluential: boolean;
    intents: string[];
  }>;

  // Authors
  authors: Array<{
    authorId: string;
    name: string;
  }>;

  // Embedding for similarity
  embedding?: {
    model: string;
    vector: number[];
  };

  // TL;DR summary
  tldr?: {
    model: string;
    text: string;
  };
}

// =============================================================================
// GOOGLE CLOUD API TYPES
// =============================================================================

/**
 * Google Fact Check ClaimReview result
 * @see https://developers.google.com/fact-check/tools/api
 */
export interface FactCheckClaimReview {
  text: string; // The claim being fact-checked
  claimant?: string; // Who made the claim
  claimDate?: string;

  claimReview: Array<{
    publisher: {
      name: string;
      site: string;
    };
    url: string;
    title: string;
    reviewDate?: string;
    textualRating: string; // "False", "Mostly False", "True", etc.
    languageCode: string;
  }>;
}

/**
 * Google Cloud Natural Language API Entity
 * @see https://cloud.google.com/natural-language/docs/analyzing-entities
 */
export interface NLPEntity {
  name: string;
  type: EntityType;
  metadata: Record<string, string>; // wikipedia_url, mid, etc.
  salience: number; // 0-1, importance to the text
  mentions: Array<{
    text: { content: string; beginOffset: number };
    type: 'PROPER' | 'COMMON';
    sentiment?: { magnitude: number; score: number };
  }>;
}

export type EntityType =
  | 'UNKNOWN'
  | 'PERSON'
  | 'LOCATION'
  | 'ORGANIZATION'
  | 'EVENT'
  | 'WORK_OF_ART'
  | 'CONSUMER_GOOD'
  | 'OTHER'
  | 'PHONE_NUMBER'
  | 'ADDRESS'
  | 'DATE'
  | 'NUMBER'
  | 'PRICE';

// =============================================================================
// CIDRE INTEGRATION TYPES
// =============================================================================

/**
 * Citation relationship for building CIDRE graphs
 */
export interface CitationRelationship {
  /** Citing work ID (DOI or OpenAlex ID) */
  source: string;
  /** Cited work ID */
  target: string;
  /** Year of the citation */
  year?: number;
  /** Citation context (from Semantic Scholar) */
  context?: string;
  /** Citation intent */
  intent?: 'background' | 'methodology' | 'result' | 'comparison';
  /** Is this an influential citation? */
  isInfluential?: boolean;
}

/**
 * Author network node for author-level cartel detection
 */
export interface AuthorNode {
  id: string; // ORCID or OpenAlex author ID
  name: string;
  affiliations: string[];
  hIndex?: number;
  paperCount: number;
  citationCount: number;
}

/**
 * Options for fetching citation network data
 */
export interface FetchCitationNetworkOptions {
  /** DOI or OpenAlex ID of the work */
  workId: string;
  /** Depth of citation network (1 = direct citations, 2 = citations of citations) */
  depth?: number;
  /** Maximum nodes to include */
  maxNodes?: number;
  /** Include author network */
  includeAuthors?: boolean;
  /** Filter by year range */
  yearRange?: { start: number; end: number };
  /** API to use */
  api?: 'openalex' | 'crossref' | 'semanticscholar';
}

// =============================================================================
// API INTEGRATION UTILITIES (STUBS - TO BE IMPLEMENTED)
// =============================================================================

/**
 * API client configuration
 */
export interface APIClientConfig {
  openAlex?: {
    email?: string; // Polite pool access
    perPage?: number;
  };
  crossRef?: {
    mailto?: string; // Polite pool access
  };
  semanticScholar?: {
    apiKey?: string; // Optional, for higher rate limits
  };
  googleCloud?: {
    projectId: string;
    credentials?: string; // Path to service account JSON
  };
}

/**
 * Fetch citation network from OpenAlex
 * @stub Implementation pending
 */
export async function fetchOpenAlexCitationNetwork(
  _workId: string,
  _options?: Partial<FetchCitationNetworkOptions>
): Promise<CitationRelationship[]> {
  // TODO: Implement OpenAlex API integration
  // Endpoint: https://api.openalex.org/works/{id}?select=id,referenced_works
  throw new Error('Not implemented: fetchOpenAlexCitationNetwork');
}

/**
 * Fetch references from CrossRef
 * @stub Implementation pending
 */
export async function fetchCrossRefReferences(
  _doi: string
): Promise<CitationRelationship[]> {
  // TODO: Implement CrossRef API integration
  // Endpoint: https://api.crossref.org/works/{doi}
  throw new Error('Not implemented: fetchCrossRefReferences');
}

// NOTE: fetchSemanticScholarCitations is now implemented in semantic-scholar-client.ts

/**
 * Search fact checks for a claim
 * @stub Implementation pending
 */
export async function searchFactChecks(
  _query: string,
  _options?: { languageCode?: string; maxAgeDays?: number }
): Promise<FactCheckClaimReview[]> {
  // TODO: Implement Google Fact Check Tools API integration
  // Endpoint: https://factchecktools.googleapis.com/v1alpha1/claims:search
  throw new Error('Not implemented: searchFactChecks');
}

/**
 * Extract entities from text using Cloud NLP
 * @stub Implementation pending
 */
export async function extractEntities(
  _text: string
): Promise<NLPEntity[]> {
  // TODO: Implement Cloud Natural Language API integration
  // Endpoint: https://language.googleapis.com/v1/documents:analyzeEntities
  throw new Error('Not implemented: extractEntities');
}

// =============================================================================
// API COMPARISON MATRIX
// =============================================================================

/**
 * API Comparison for reference
 *
 * | API              | Coverage        | Rate Limit        | Cost     | Best For                  |
 * |------------------|-----------------|-------------------|----------|---------------------------|
 * | OpenAlex         | 240M+ works     | 100k/day (polite) | Free     | Comprehensive coverage    |
 * | CrossRef         | 140M+ DOIs      | ~50 req/s         | Free     | DOI metadata, references  |
 * | Semantic Scholar | 200M+ papers    | 100 req/5min free | Free/$$  | Citation context, AI      |
 * | Google Fact Check| Varies          | Varies            | Free     | Claim verification        |
 * | Cloud NLP        | N/A             | 600k/month free   | $/1k     | Entity extraction         |
 * | Document AI      | N/A             | 1k pages/month    | $/page   | PDF extraction            |
 *
 * Recommendation:
 * - Primary: OpenAlex (best coverage, truly open)
 * - Enrichment: Semantic Scholar (citation context, influential citations)
 * - Verification: CrossRef (DOI validation, canonical metadata)
 * - Fact-checking: Google Fact Check Tools API
 */

export const API_ENDPOINTS = {
  openAlex: {
    base: 'https://api.openalex.org',
    works: '/works',
    authors: '/authors',
    sources: '/sources',
    docs: 'https://docs.openalex.org/',
  },
  crossRef: {
    base: 'https://api.crossref.org',
    works: '/works',
    docs: 'https://api.crossref.org/swagger-ui/index.html',
  },
  semanticScholar: {
    base: 'https://api.semanticscholar.org/graph/v1',
    paper: '/paper',
    author: '/author',
    docs: 'https://api.semanticscholar.org/api-docs/',
  },
  googleFactCheck: {
    base: 'https://factchecktools.googleapis.com/v1alpha1',
    claimsSearch: '/claims:search',
    docs: 'https://developers.google.com/fact-check/tools/api',
  },
  googleNLP: {
    base: 'https://language.googleapis.com/v1',
    analyzeEntities: '/documents:analyzeEntities',
    analyzeSentiment: '/documents:analyzeSentiment',
    docs: 'https://cloud.google.com/natural-language/docs',
  },
} as const;
