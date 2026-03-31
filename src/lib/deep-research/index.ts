/**
 * Gemini Deep Research Agent
 *
 * Autonomous research agent powered by Gemini 3 Pro that can:
 * - Plan multi-step research tasks
 * - Search the web and your own documents
 * - Read and analyze multiple sources
 * - Synthesize comprehensive reports with citations
 *
 * @example
 * ```ts
 * import { getDeepResearchClient } from '@/lib/deep-research';
 *
 * const client = getDeepResearchClient();
 *
 * // Simple research
 * const result = await client.research('Analyze the safety profile of Ozempic');
 *
 * // With streaming progress
 * for await (const event of client.researchStream('Drug safety trends 2025')) {
 *   log.info(event.type, event.content);
 * }
 *
 * // PV-specific research
 * const pvResult = await client.pvResearch({
 *   query: 'Analyze emerging safety signals',
 *   context: { drugNames: ['semaglutide'], therapeuticAreas: ['diabetes'] },
 *   outputFormat: { includeDataTables: true, targetAudience: 'technical' }
 * });
 * ```
 *
 * @see https://ai.google.dev/gemini-api/docs/deep-research
 */

// Client and factory functions
export {
  DeepResearchClient,
  getDeepResearchClient,
  createDeepResearchClient,
} from './client';

// Report saving utilities
export {
  saveResearchReport,
  listResearchReports,
} from './report-saver';

export type {
  SaveReportOptions,
  SaveReportResult,
} from './report-saver';

// Types
export type {
  InteractionStatus,
  DeepResearchConfig,
  FileSearchTool,
  DeepResearchTool,
  InteractionOutput,
  Interaction,
  CreateInteractionOptions,
  StreamEventType,
  StreamDelta,
  StreamEvent,
  ResearchProgress,
  ResearchResult,
  PVResearchRequest,
  PVResearchResult,
} from './types';

// =============================================================================
// PRISMA Systematic Review Integration
// =============================================================================

/**
 * PRISMA-compliant systematic literature review functions.
 *
 * Use these for formal systematic reviews requiring:
 * - PICO-structured research questions
 * - Multi-stage screening (abstract → full-text)
 * - PRISMA 2020 flow diagrams
 * - Compliance validation
 *
 * For quick, informal literature searches, use the standard
 * DeepResearchClient.research() method instead.
 *
 * @example
 * ```ts
 * import { conductSystematicReview } from '@/lib/deep-research';
 *
 * const result = await conductSystematicReview({
 *   topic: 'GLP-1 agonist cardiovascular safety',
 *   picoFramework: {
 *     population: 'Adults with type 2 diabetes',
 *     intervention: 'GLP-1 receptor agonists',
 *     outcome: 'Major adverse cardiovascular events',
 *   },
 * });
 *
 * log.info(result.flowDiagramText); // PRISMA 2020 flow diagram
 * log.info(result.includedStudies); // Studies passing screening
 * ```
 */
export {
  conductSystematicReview,
  validateReviewCompliance,
  quickLiteratureSearch,
} from './systematic-review';

export type {
  PICOFramework,
  SystematicReviewConfig,
  ExtractedReference,
  SystematicReviewResult,
  // Re-exported from PRISMA algorithm
  LiteratureRecord,
  RecordSource,
  PRISMAPhase,
  PipelineResult,
  PRISMAFlowDiagram,
  ComplianceReport,
  SystematicReviewReport,
} from './systematic-review';

// =============================================================================
// Reference Extraction Parser
// =============================================================================

/**
 * Parse citations from research reports into structured data.
 *
 * Handles multiple formats (APA, IEEE, Vancouver) and extracts:
 * - Authors, title, year
 * - DOI, PMID, URL
 * - Journal, volume, pages
 *
 * @example
 * ```ts
 * import { extractReferences, toBibTeX } from '@/lib/deep-research';
 *
 * const result = extractReferences(researchReport);
 * log.info(result.stats); // { total: 25, parsed: 22, avgConfidence: 0.75 }
 *
 * // Export to bibliography format
 * const bibtex = toBibTeX(result.references);
 * ```
 */
export {
  extractReferences,
  toBibTeX,
  toRIS,
  toCSV,
} from './reference-parser';

export type {
  ParsedReference,
  CitationFormat,
  ExtractionResult,
  ParserOptions,
} from './reference-parser';

// =============================================================================
// PubMed Enrichment
// =============================================================================

/**
 * Enrich references with PubMed metadata.
 *
 * Uses NCBI E-utilities to fetch full article data including:
 * - Complete author lists with affiliations
 * - Abstracts and keywords
 * - MeSH terms for pharmacovigilance filtering
 * - DOIs for cross-referencing
 *
 * @example
 * ```ts
 * import { searchPubMed, enrichByPMID, enrichReferences } from '@/lib/deep-research';
 *
 * // Search PubMed
 * const results = await searchPubMed('semaglutide cardiovascular');
 *
 * // Enrich a single PMID
 * const article = await enrichByPMID('12345678');
 *
 * // Enrich parsed references
 * const enriched = await enrichReferences(parsedRefs);
 * ```
 */
export {
  searchPubMed,
  fetchArticlesByPMID,
  enrichByPMID,
  enrichMultiplePMIDs,
  searchByDOI,
  enrichReferences,
  pubmedToReference,
} from './pubmed-enricher';

export type {
  PubMedArticle,
  PubMedAuthor,
  PubMedSearchResult,
  EnrichmentResult,
  EnrichmentOptions,
} from './pubmed-enricher';

// =============================================================================
// Reference Deduplication
// =============================================================================

/**
 * Merge and deduplicate references from multiple sources.
 *
 * Use when combining bibliographies from multiple Deep Research outputs
 * or literature review sources into a unified, deduplicated set.
 *
 * @example
 * ```ts
 * import { mergeReferenceSets, findDuplicates } from '@/lib/deep-research';
 *
 * const result = mergeReferenceSets([
 *   { source: 'review-1.md', refs: refs1 },
 *   { source: 'review-2.md', refs: refs2 },
 * ]);
 *
 * log.info(result.stats); // { totalInput: 50, uniqueOutput: 35, ... }
 * ```
 */
export {
  mergeReferenceSets,
  findDuplicates,
  mergeDuplicateGroup,
  toAnnotatedBibTeX,
} from './reference-dedup';

export type {
  ReferenceSource,
  MergedReference,
  DuplicateGroup,
  MergeResult,
  DeduplicationOptions,
} from './reference-dedup';

// =============================================================================
// PMID Watchlist
// =============================================================================

/**
 * Track PubMed articles for citations and updates.
 *
 * Monitor key safety literature for new citations, related articles,
 * and potential retractions.
 *
 * @example
 * ```ts
 * import { createWatchlist } from '@/lib/deep-research';
 *
 * const watchlist = createWatchlist();
 * watchlist.add('12345678', { reason: 'Key GLP-1 study', priority: 'high' });
 *
 * const updates = await watchlist.checkForNewCitations();
 * ```
 */
export { PMIDWatchlist, createWatchlist } from './pmid-watchlist';

export type {
  WatchedArticle,
  WatchlistUpdate,
  RelatedArticle,
  WatchlistExport,
} from './pmid-watchlist';

// =============================================================================
// MeSH to FAERS Mapping
// =============================================================================

/**
 * Cross-reference MeSH terms with FAERS MedDRA reactions.
 *
 * Bridges literature (MeSH-indexed) with regulatory safety data (MedDRA-coded)
 * for comprehensive pharmacovigilance analysis.
 *
 * @example
 * ```ts
 * import { mapMeshToFaers, getRelevantFAERSCategories } from '@/lib/deep-research';
 *
 * const mapping = mapMeshToFaers('Cardiovascular Diseases');
 * log.info(mapping.meddraTerms); // ['Cardiac disorders', 'Vascular disorders']
 *
 * const categories = getRelevantFAERSCategories(enrichedRef.meshTerms);
 * ```
 */
export {
  mapMeshToFaers,
  findRelatedMedDRA,
  getMeshForSOC,
  getRelevantFAERSCategories,
  buildFAERSQuery,
  suggestMeshForReaction,
  getMappingStats,
  // FAERS API execution
  executeFAERSQuery,
  searchFAERSByMeSH,
  getFAERSReactionCounts,
  searchDrugByMeSHReactions,
  filterSeriousReports,
  extractDrugsFromReports,
} from './mesh-faers-mapping';

export type {
  MeshToMedDRAMapping,
  MedDRATerm,
  FAERSReactionCategory,
  // FAERS API types
  FAERSQueryOptions,
  FAERSResult,
  FAERSReport,
  FAERSReactionCount,
  FAERSSearchResult,
} from './mesh-faers-mapping';
