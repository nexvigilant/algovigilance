/**
 * PRISMA-Integrated Systematic Literature Review
 *
 * Combines Deep Research Agent's autonomous search capabilities with
 * PRISMA 2020 systematic review methodology for regulatory-compliant
 * literature reviews.
 *
 * This is a DEDICATED tool for systematic reviews - regular research
 * queries should use the standard DeepResearchClient.research() method.
 *
 * @example
 * ```ts
 * import { conductSystematicReview } from '@/lib/deep-research/systematic-review';
 *
 * const result = await conductSystematicReview({
 *   topic: 'GLP-1 agonist cardiovascular safety signals',
 *   picoFramework: {
 *     population: 'Adults with type 2 diabetes',
 *     intervention: 'GLP-1 receptor agonists',
 *     comparator: 'Placebo or other antidiabetics',
 *     outcome: 'Major adverse cardiovascular events',
 *   },
 *   dateRange: { from: 2020, to: 2025 },
 * });
 *
 * log.info(result.flowDiagram); // PRISMA 2020 compliant
 * log.info(result.includedStudies);
 * ```
 */

import { logger } from '@/lib/logger';
import { getDeepResearchClient, type ResearchResult } from './index';
import {
  processScreeningPipeline,
  generateFlowDiagramText,
  generateFlowDiagramJSON,
  validatePRISMACompliance,
  type LiteratureRecord,
  type RecordSource,
  type ScreeningConfig,
  type PipelineResult,
  type ComplianceReport,
  type SystematicReviewReport,
} from '@/lib/algorithms/prisma';

const log = logger.scope('SystematicReview');

// =============================================================================
// Types
// =============================================================================

/**
 * PICO framework for systematic review questions
 */
export interface PICOFramework {
  /** Population or patient group */
  population: string;
  /** Intervention being studied */
  intervention: string;
  /** Comparator or control */
  comparator?: string;
  /** Outcome of interest */
  outcome: string;
  /** Time frame (optional) */
  timeframe?: string;
  /** Study setting (optional) */
  setting?: string;
}

/**
 * Configuration for systematic literature review
 */
export interface SystematicReviewConfig {
  /** Research topic or question */
  topic: string;

  /** Structured PICO framework (recommended for rigorous reviews) */
  picoFramework?: PICOFramework;

  /** Date range for literature search */
  dateRange?: {
    from: number;
    to: number;
  };

  /** Specific databases to prioritize */
  databases?: ('pubmed' | 'embase' | 'cochrane' | 'clinicaltrials' | 'fda' | 'ema')[];

  /** Inclusion keywords for screening */
  inclusionKeywords?: string[];

  /** Exclusion keywords for screening */
  exclusionKeywords?: string[];

  /** Language restrictions (defaults to English) */
  languages?: string[];

  /** Study types to include */
  studyTypes?: (
    | 'randomized_controlled_trial'
    | 'cohort_study'
    | 'case_control'
    | 'case_report'
    | 'systematic_review'
    | 'meta_analysis'
    | 'pharmacovigilance_report'
  )[];

  /** Maximum number of records to process (for resource management) */
  maxRecords?: number;

  /** Whether to include grey literature (conference abstracts, preprints) */
  includeGreyLiterature?: boolean;

  /** Custom screening predicate for complex eligibility criteria */
  customScreening?: (record: LiteratureRecord) => boolean;
}

/**
 * Reference extracted from Deep Research results
 */
export interface ExtractedReference {
  title: string;
  authors: string[];
  year: number;
  source: string;
  abstract?: string;
  doi?: string;
  pmid?: string;
  url?: string;
  journal?: string;
}

/**
 * Result of a systematic literature review
 */
export interface SystematicReviewResult {
  /** Unique identifier for this review */
  reviewId: string;

  /** Original configuration */
  config: SystematicReviewConfig;

  /** Raw research result from Deep Research Agent */
  researchResult: ResearchResult;

  /** References extracted from research */
  extractedReferences: ExtractedReference[];

  /** PRISMA pipeline processing result */
  pipelineResult: PipelineResult;

  /** PRISMA flow diagram as ASCII text */
  flowDiagramText: string;

  /** PRISMA flow diagram as structured JSON */
  flowDiagramJSON: ReturnType<typeof generateFlowDiagramJSON>;

  /** Records that passed all screening and were included */
  includedStudies: LiteratureRecord[];

  /** Records excluded with reasons */
  excludedStudies: Array<{ record: LiteratureRecord; reason: string }>;

  /** Compliance report (if systematic review report structure provided) */
  complianceReport?: ComplianceReport;

  /** Timing information */
  timing: {
    startedAt: Date;
    researchCompletedAt: Date;
    pipelineCompletedAt: Date;
    totalDurationMs: number;
  };
}

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Conduct a PRISMA-compliant systematic literature review
 *
 * This function:
 * 1. Uses Deep Research Agent to autonomously search literature
 * 2. Extracts structured references from the research report
 * 3. Processes references through PRISMA screening pipeline
 * 4. Generates PRISMA 2020 compliant flow diagram
 *
 * @param config - Systematic review configuration
 * @returns Complete systematic review result with PRISMA compliance
 */
export async function conductSystematicReview(
  config: SystematicReviewConfig
): Promise<SystematicReviewResult> {
  const startedAt = new Date();
  const reviewId = generateReviewId();

  log.info('Starting systematic literature review', {
    reviewId,
    topic: config.topic,
    hasPICO: !!config.picoFramework,
  });

  // Step 1: Build research prompt for Deep Research Agent
  const researchPrompt = buildSystematicSearchPrompt(config);
  log.debug('Built research prompt', { promptLength: researchPrompt.length });

  // Step 2: Execute Deep Research
  const client = getDeepResearchClient();
  const researchResult = await client.research(researchPrompt);
  const researchCompletedAt = new Date();

  if (researchResult.status === 'failed') {
    throw new Error(`Deep Research failed: ${researchResult.error}`);
  }

  log.info('Deep Research completed', {
    reviewId,
    reportLength: researchResult.report.length,
  });

  // Step 3: Extract references from research report
  const extractedReferences = extractReferencesFromReport(researchResult.report);
  log.info('References extracted', {
    reviewId,
    count: extractedReferences.length,
  });

  // Step 4: Convert to LiteratureRecord format
  const literatureRecords = convertToLiteratureRecords(extractedReferences, config.maxRecords);

  // Step 5: Build screening configuration
  const screeningConfig = buildScreeningConfig(config);

  // Step 6: Process through PRISMA pipeline
  const pipelineResult = processScreeningPipeline(literatureRecords, screeningConfig);
  const pipelineCompletedAt = new Date();

  log.info('PRISMA pipeline completed', {
    reviewId,
    identified: pipelineResult.statistics.totalIdentified,
    included: pipelineResult.statistics.totalIncluded,
    inclusionRate: pipelineResult.statistics.inclusionRate.toFixed(2),
  });

  // Step 7: Generate flow diagrams
  const flowDiagramText = generateFlowDiagramText(pipelineResult.flowDiagram);
  const flowDiagramJSON = generateFlowDiagramJSON(pipelineResult.flowDiagram);

  // Step 8: Categorize records
  const includedStudies = pipelineResult.records.filter((r) => r.phase === 'INCLUDED');
  const excludedStudies = pipelineResult.records
    .filter((r) => r.phase === 'EXCLUDED')
    .map((r) => ({
      record: r,
      reason: r.exclusionReason ?? 'Unknown',
    }));

  // Step 9: Compile result
  const result: SystematicReviewResult = {
    reviewId,
    config,
    researchResult,
    extractedReferences,
    pipelineResult,
    flowDiagramText,
    flowDiagramJSON,
    includedStudies,
    excludedStudies,
    timing: {
      startedAt,
      researchCompletedAt,
      pipelineCompletedAt,
      totalDurationMs: pipelineCompletedAt.getTime() - startedAt.getTime(),
    },
  };

  log.info('Systematic review completed', {
    reviewId,
    totalDurationMs: result.timing.totalDurationMs,
    includedCount: includedStudies.length,
  });

  return result;
}

/**
 * Validate a systematic review report for PRISMA compliance
 *
 * @param report - The systematic review report to validate
 * @param threshold - Minimum compliance score (0-1, default 0.9)
 * @returns Compliance report with detailed item-level results
 */
export function validateReviewCompliance(
  report: SystematicReviewReport,
  threshold = 0.9
): ComplianceReport {
  return validatePRISMACompliance(report, threshold);
}

/**
 * Quick search for literature without full PRISMA processing
 *
 * Use this when you want to find relevant papers but don't need
 * the full systematic review methodology. For full PRISMA compliance,
 * use conductSystematicReview() instead.
 *
 * @param topic - Research topic
 * @param options - Optional search constraints
 * @returns Research result with extracted references
 */
export async function quickLiteratureSearch(
  topic: string,
  options?: {
    dateRange?: { from: number; to: number };
    databases?: string[];
    maxResults?: number;
  }
): Promise<{
  researchResult: ResearchResult;
  references: ExtractedReference[];
}> {
  const prompt = buildQuickSearchPrompt(topic, options);
  const client = getDeepResearchClient();
  const researchResult = await client.research(prompt);

  const references = extractReferencesFromReport(researchResult.report);
  const limitedRefs = options?.maxResults ? references.slice(0, options.maxResults) : references;

  return {
    researchResult,
    references: limitedRefs,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate unique review ID
 */
function generateReviewId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `SR-${timestamp}-${random}`.toUpperCase();
}

/**
 * Build a comprehensive search prompt for systematic review
 */
function buildSystematicSearchPrompt(config: SystematicReviewConfig): string {
  const parts: string[] = [];

  // Main instruction
  parts.push(`Conduct a comprehensive systematic literature search on the following topic:

**Research Topic:** ${config.topic}
`);

  // PICO framework if provided
  if (config.picoFramework) {
    const pico = config.picoFramework;
    parts.push(`**PICO Framework:**
- **Population:** ${pico.population}
- **Intervention:** ${pico.intervention}
- **Comparator:** ${pico.comparator ?? 'Standard care or placebo'}
- **Outcome:** ${pico.outcome}
${pico.timeframe ? `- **Timeframe:** ${pico.timeframe}` : ''}
${pico.setting ? `- **Setting:** ${pico.setting}` : ''}
`);
  }

  // Date range
  if (config.dateRange) {
    parts.push(`**Date Range:** ${config.dateRange.from} to ${config.dateRange.to}`);
  }

  // Databases
  const dbMap: Record<string, string> = {
    pubmed: 'PubMed/MEDLINE',
    embase: 'Embase',
    cochrane: 'Cochrane Library',
    clinicaltrials: 'ClinicalTrials.gov',
    fda: 'FDA databases (FAERS, drug labels)',
    ema: 'EMA databases (EudraVigilance)',
  };

  if (config.databases?.length) {
    const dbNames = config.databases.map((db) => dbMap[db] ?? db);
    parts.push(`**Prioritize these databases:** ${dbNames.join(', ')}`);
  }

  // Study types
  if (config.studyTypes?.length) {
    const typeNames = config.studyTypes.map((t) => t.replace(/_/g, ' '));
    parts.push(`**Include study types:** ${typeNames.join(', ')}`);
  }

  // Grey literature
  if (config.includeGreyLiterature) {
    parts.push(`**Include grey literature:** Conference abstracts, preprints, regulatory documents`);
  }

  // Language
  const languages = config.languages ?? ['English'];
  parts.push(`**Languages:** ${languages.join(', ')}`);

  // Output format instruction
  parts.push(`
**OUTPUT FORMAT - CRITICAL:**
For each relevant study found, provide in a consistent format:

### Study [Number]
- **Title:** [Full study title]
- **Authors:** [Author list with year]
- **Year:** [Publication year as 4-digit number]
- **Journal:** [Journal name]
- **PMID:** [PubMed ID if available]
- **DOI:** [DOI if available]
- **Study Type:** [RCT, cohort, case-control, etc.]
- **Abstract Summary:** [2-3 sentence summary of findings]
- **Relevance:** [Why this study is relevant to the research question]

After listing individual studies, provide:
1. **Search Strategy Summary** - Databases searched, search terms used
2. **Yield Summary** - Total records by source
3. **Key Findings Synthesis** - Major themes across studies

Aim to identify at least 20-50 relevant studies for a comprehensive review.
`);

  return parts.join('\n\n');
}

/**
 * Build a simpler prompt for quick literature searches
 */
function buildQuickSearchPrompt(
  topic: string,
  options?: {
    dateRange?: { from: number; to: number };
    databases?: string[];
    maxResults?: number;
  }
): string {
  const parts = [
    `Search for relevant scientific literature on: ${topic}`,
    options?.dateRange && `Published between ${options.dateRange.from} and ${options.dateRange.to}`,
    options?.databases?.length && `Focus on: ${options.databases.join(', ')}`,
    `
For each study found, provide:
- Title
- Authors (Year)
- Journal
- PMID/DOI if available
- Brief summary of findings

List the most relevant studies first.`,
  ];

  return parts.filter(Boolean).join('\n\n');
}

/**
 * Extract structured references from a research report
 *
 * Uses pattern matching to identify study citations in the report.
 * Handles various citation formats including:
 * - Numbered study entries (### Study 1, etc.)
 * - Author-year citations (Smith et al., 2023)
 * - PMID/DOI references
 */
function extractReferencesFromReport(report: string): ExtractedReference[] {
  const references: ExtractedReference[] = [];

  // Pattern 1: Structured study entries (### Study N format)
  const structuredPattern =
    /### Study \d+[\s\S]*?(?=### Study \d+|## |$)/g;
  const structuredMatches = report.matchAll(structuredPattern);

  for (const match of structuredMatches) {
    const block = match[0];
    const ref = parseStructuredStudyBlock(block);
    if (ref) {
      references.push(ref);
    }
  }

  // If no structured entries found, try alternative patterns
  if (references.length === 0) {
    // Pattern 2: Title/Author inline format
    const inlinePattern =
      /(?:[-•*]\s*)?[""]?([^""]+)[""]?\s*(?:[-–—]\s*)?([A-Z][a-z]+(?:\s+et\s+al\.?)?(?:,?\s*\d{4})?)/g;
    const inlineMatches = report.matchAll(inlinePattern);

    for (const match of inlineMatches) {
      const title = match[1]?.trim();
      const authorPart = match[2]?.trim();

      if (title && title.length > 20 && !isCommonPhrase(title)) {
        const yearMatch = authorPart?.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

        references.push({
          title,
          authors: authorPart ? [authorPart.replace(/,?\s*\d{4}/, '').trim()] : [],
          year,
          source: 'Deep Research',
        });
      }
    }
  }

  // Extract PMIDs and DOIs for enrichment
  const pmidPattern = /PMID[:\s]*(\d+)/gi;
  const doiPattern = /(?:DOI[:\s]*|https?:\/\/doi\.org\/)?(10\.\d{4,}\/[^\s]+)/gi;

  const pmids = [...report.matchAll(pmidPattern)];
  const dois = [...report.matchAll(doiPattern)];

  // Attempt to associate PMIDs/DOIs with references
  for (let i = 0; i < references.length && i < Math.max(pmids.length, dois.length); i++) {
    if (pmids[i]) {
      references[i].pmid = pmids[i][1];
    }
    if (dois[i]) {
      references[i].doi = dois[i][1];
    }
  }

  // Deduplicate by title similarity
  const uniqueRefs = deduplicateReferences(references);

  log.debug('Extracted references', {
    raw: references.length,
    deduplicated: uniqueRefs.length,
  });

  return uniqueRefs;
}

/**
 * Parse a structured study block into an ExtractedReference
 */
function parseStructuredStudyBlock(block: string): ExtractedReference | null {
  const titleMatch = block.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/i);
  const authorsMatch = block.match(/\*\*Authors:\*\*\s*(.+?)(?:\n|$)/i);
  const yearMatch = block.match(/\*\*Year:\*\*\s*(\d{4})/i);
  const journalMatch = block.match(/\*\*Journal:\*\*\s*(.+?)(?:\n|$)/i);
  const pmidMatch = block.match(/\*\*PMID:\*\*\s*(\d+)/i);
  const doiMatch = block.match(/\*\*DOI:\*\*\s*(10\.[^\s]+)/i);
  const abstractMatch = block.match(/\*\*Abstract(?:\s+Summary)?:\*\*\s*(.+?)(?=\*\*|$)/is);

  const title = titleMatch?.[1]?.trim();
  if (!title) return null;

  const authorsRaw = authorsMatch?.[1]?.trim() ?? '';
  const authors = authorsRaw
    .split(/,|;|and/)
    .map((a) => a.trim())
    .filter((a) => a.length > 0 && !a.match(/^\d{4}$/));

  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  return {
    title,
    authors,
    year,
    source: 'Deep Research',
    journal: journalMatch?.[1]?.trim(),
    pmid: pmidMatch?.[1],
    doi: doiMatch?.[1],
    abstract: abstractMatch?.[1]?.trim(),
  };
}

/**
 * Check if a string is a common phrase (not a real title)
 */
function isCommonPhrase(text: string): boolean {
  const commonPhrases = [
    'the study',
    'this review',
    'the results',
    'the findings',
    'the analysis',
    'we found',
    'in conclusion',
    'key findings',
    'summary',
    'introduction',
    'methods',
    'results',
    'discussion',
    'references',
  ];

  const lower = text.toLowerCase();
  return commonPhrases.some((phrase) => lower.startsWith(phrase));
}

/**
 * Deduplicate references by title similarity
 */
function deduplicateReferences(refs: ExtractedReference[]): ExtractedReference[] {
  const seen = new Set<string>();
  const unique: ExtractedReference[] = [];

  for (const ref of refs) {
    // Normalize title for comparison
    const normalized = ref.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);

    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(ref);
    }
  }

  return unique;
}

/**
 * Convert ExtractedReferences to LiteratureRecords for PRISMA pipeline
 */
function convertToLiteratureRecords(
  refs: ExtractedReference[],
  maxRecords?: number
): LiteratureRecord[] {
  const limited = maxRecords ? refs.slice(0, maxRecords) : refs;

  return limited.map((ref, index): LiteratureRecord => {
    // Determine source type
    let source: RecordSource = 'database';
    const sourceLower = ref.source.toLowerCase();
    if (sourceLower.includes('clinicaltrials')) {
      source = 'register';
    } else if (sourceLower.includes('fda') || sourceLower.includes('ema')) {
      source = 'website';
    } else if (sourceLower.includes('conference') || sourceLower.includes('preprint')) {
      source = 'grey_literature';
    }

    return {
      id: `REF-${Date.now()}-${index.toString().padStart(4, '0')}`,
      title: ref.title,
      abstract: ref.abstract ?? null,
      fullText: null,
      source,
      metadata: {
        authors: ref.authors,
        year: ref.year,
        journal: ref.journal ?? null,
        doi: ref.doi ?? null,
        pmid: ref.pmid ?? null,
        volume: null,
        issue: null,
        pages: null,
      },
      phase: 'IDENTIFIED',
      exclusionReason: null,
    };
  });
}

/**
 * Build PRISMA screening configuration from review config
 */
function buildScreeningConfig(config: SystematicReviewConfig): ScreeningConfig {
  // Derive keywords from PICO if not explicitly provided
  const inclusionKeywords = config.inclusionKeywords ?? [];
  const exclusionKeywords = config.exclusionKeywords ?? [];

  if (config.picoFramework) {
    // Add PICO terms to inclusion keywords
    const pico = config.picoFramework;
    if (!inclusionKeywords.length) {
      const picoTerms = [
        pico.intervention,
        pico.outcome,
        pico.population.split(' ').slice(-1)[0], // Last word of population
      ].filter(Boolean);
      inclusionKeywords.push(...picoTerms);
    }
  }

  return {
    abstractCriteria: {
      inclusionKeywords: inclusionKeywords.length ? inclusionKeywords : undefined,
      exclusionKeywords: exclusionKeywords.length ? exclusionKeywords : undefined,
      minYear: config.dateRange?.from,
      maxYear: config.dateRange?.to,
      languages: config.languages,
      customPredicate: config.customScreening
        ? (record): { type: 'INCLUDE' } | { type: 'EXCLUDE'; reason: string } => {
            const passes = config.customScreening?.(record) ?? true;
            return passes
              ? { type: 'INCLUDE' }
              : { type: 'EXCLUDE', reason: 'Failed custom screening' };
          }
        : undefined,
    },
    fullTextCriteria: {
      // Full-text screening uses same base criteria
      // In practice, would add more specific criteria
      inclusionKeywords: inclusionKeywords.length ? inclusionKeywords : undefined,
      exclusionKeywords: exclusionKeywords.length ? exclusionKeywords : undefined,
    },
    deduplication: true,
    deduplicationFields: ['title', 'doi', 'pmid'],
  };
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type {
  LiteratureRecord,
  RecordSource,
  PRISMAPhase,
  PipelineResult,
  PRISMAFlowDiagram,
  ComplianceReport,
  SystematicReviewReport,
} from '@/lib/algorithms/prisma';
