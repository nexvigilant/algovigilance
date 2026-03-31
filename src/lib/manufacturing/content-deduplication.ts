/**
 * Content Similarity Detection for ALO Manufacturing
 *
 * Prevents generating nearly-identical activities for similar KSBs.
 * Uses text embeddings and heuristics to detect duplicates before
 * expensive AI generation.
 *
 * @module lib/manufacturing/content-deduplication
 */

import { logger } from '@/lib/logger';
import type { ALOGenerationInput } from '@/lib/ai/flows/generate-alo-content';

const log = logger.scope('content-deduplication');

/**
 * Similarity check result
 */
export interface SimilarityCheckResult {
  /** Whether this is likely a duplicate */
  isDuplicate: boolean;
  /** Similarity score (0-1) */
  similarityScore: number;
  /** Matching ALO ID if duplicate found */
  matchingAloId?: string;
  /** Matching KSB ID */
  matchingKsbId?: string;
  /** Recommendation for how to proceed */
  recommendation: 'generate_new' | 'reuse_existing' | 'modify_existing' | 'review_required';
  /** Reason for the recommendation */
  reason: string;
}

/**
 * ALO summary for comparison (lightweight)
 */
export interface ALOSummary {
  id: string;
  ksbId: string;
  domainId: string;
  title: string;
  description: string;
  engineType: string;
  keywords?: string[];
  bloomLevel?: string;
}

/**
 * Similarity thresholds
 */
const THRESHOLDS = {
  /** Above this = definite duplicate, reuse existing */
  DUPLICATE: 0.95,
  /** Above this = very similar, consider modification */
  HIGH_SIMILARITY: 0.85,
  /** Above this = worth reviewing */
  REVIEW_THRESHOLD: 0.70,
};

/**
 * Content Deduplication Service
 *
 * Detects similar content before ALO generation to avoid duplicates.
 */
export class ContentDeduplicationService {
  private embeddingCache: Map<string, number[]> = new Map();
  private aloCache: Map<string, ALOSummary> = new Map();

  /**
   * Checks similarity between a new KSB input and existing ALOs
   *
   * @param input - New ALO generation input
   * @param existingALOs - ALOs in the same domain to compare against
   */
  async checkSimilarity(
    input: ALOGenerationInput,
    existingALOs: ALOSummary[]
  ): Promise<SimilarityCheckResult> {
    // Filter to same domain
    const domainALOs = existingALOs.filter(
      (alo) => alo.domainId === input.domainId
    );

    if (domainALOs.length === 0) {
      return {
        isDuplicate: false,
        similarityScore: 0,
        recommendation: 'generate_new',
        reason: 'No existing ALOs in this domain',
      };
    }

    // Create text representation of new input
    const newText = this.createTextRepresentation(input);

    let highestSimilarity = 0;
    let mostSimilarAlo: ALOSummary | undefined;

    // Compare against each existing ALO
    for (const alo of domainALOs) {
      const existingText = `${alo.title} ${alo.description}`;
      const similarity = this.calculateSimilarity(newText, existingText);

      // Also check keyword overlap
      const keywordSimilarity = this.calculateKeywordOverlap(
        input.ksbEntry.keywords || [],
        alo.keywords || []
      );

      // Weighted combination
      const combinedSimilarity = similarity * 0.7 + keywordSimilarity * 0.3;

      if (combinedSimilarity > highestSimilarity) {
        highestSimilarity = combinedSimilarity;
        mostSimilarAlo = alo;
      }
    }

    // Determine recommendation based on similarity
    let recommendation: SimilarityCheckResult['recommendation'];
    let reason: string;

    if (highestSimilarity >= THRESHOLDS.DUPLICATE) {
      recommendation = 'reuse_existing';
      reason = `Very high similarity (${(highestSimilarity * 100).toFixed(1)}%) with existing ALO`;
    } else if (highestSimilarity >= THRESHOLDS.HIGH_SIMILARITY) {
      recommendation = 'modify_existing';
      reason = `High similarity (${(highestSimilarity * 100).toFixed(1)}%) - consider adapting existing ALO`;
    } else if (highestSimilarity >= THRESHOLDS.REVIEW_THRESHOLD) {
      recommendation = 'review_required';
      reason = `Moderate similarity (${(highestSimilarity * 100).toFixed(1)}%) - manual review recommended`;
    } else {
      recommendation = 'generate_new';
      reason = `Low similarity (${(highestSimilarity * 100).toFixed(1)}%) - unique content`;
    }

    const result: SimilarityCheckResult = {
      isDuplicate: highestSimilarity >= THRESHOLDS.DUPLICATE,
      similarityScore: highestSimilarity,
      matchingAloId: mostSimilarAlo?.id,
      matchingKsbId: mostSimilarAlo?.ksbId,
      recommendation,
      reason,
    };

    log.debug('Similarity check complete', {
      ksbId: input.ksbEntry.id,
      similarity: highestSimilarity,
      recommendation,
      matchingKsbId: mostSimilarAlo?.ksbId,
    });

    return result;
  }

  /**
   * Batch similarity check for multiple inputs
   */
  async checkBatchSimilarity(
    inputs: ALOGenerationInput[],
    existingALOs: ALOSummary[]
  ): Promise<Map<string, SimilarityCheckResult>> {
    const results = new Map<string, SimilarityCheckResult>();

    // Group by domain for efficiency
    const domainGroups = new Map<string, ALOSummary[]>();
    for (const alo of existingALOs) {
      const group = domainGroups.get(alo.domainId) || [];
      group.push(alo);
      domainGroups.set(alo.domainId, group);
    }

    for (const input of inputs) {
      const domainALOs = domainGroups.get(input.domainId) || [];
      const result = await this.checkSimilarity(input, domainALOs);
      results.set(input.ksbEntry.id, result);
    }

    return results;
  }

  /**
   * Creates a text representation for similarity comparison
   */
  private createTextRepresentation(input: ALOGenerationInput): string {
    return [
      input.ksbEntry.title,
      input.ksbEntry.description,
      ...(input.ksbEntry.keywords || []),
      input.ksbType,
      input.bloomLevel || '',
    ]
      .join(' ')
      .toLowerCase();
  }

  /**
   * Calculates text similarity using TF-IDF-like approach
   *
   * Simple implementation without external ML libraries.
   * For production, consider using Gemini embeddings API.
   */
  private calculateSimilarity(text1: string, text2: string): number {
    // Tokenize
    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);

    if (tokens1.length === 0 || tokens2.length === 0) {
      return 0;
    }

    // Create term frequency vectors
    const tf1 = this.getTermFrequency(tokens1);
    const tf2 = this.getTermFrequency(tokens2);

    // Get all unique terms
    const allTerms = new Set([...tf1.keys(), ...tf2.keys()]);

    // Calculate cosine similarity
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const term of allTerms) {
      const freq1 = tf1.get(term) || 0;
      const freq2 = tf2.get(term) || 0;

      dotProduct += freq1 * freq2;
      magnitude1 += freq1 * freq1;
      magnitude2 += freq2 * freq2;
    }

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
  }

  /**
   * Calculates keyword overlap using Jaccard similarity
   */
  private calculateKeywordOverlap(
    keywords1: string[],
    keywords2: string[]
  ): number {
    if (keywords1.length === 0 && keywords2.length === 0) {
      return 0;
    }

    const set1 = new Set(keywords1.map((k) => k.toLowerCase()));
    const set2 = new Set(keywords2.map((k) => k.toLowerCase()));

    const intersection = new Set([...set1].filter((k) => set2.has(k)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Tokenizes text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  }

  /**
   * Creates term frequency map
   */
  private getTermFrequency(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }
    return tf;
  }

  /**
   * Clears the embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
    this.aloCache.clear();
    log.debug('Deduplication cache cleared');
  }

  /**
   * Pre-loads ALO summaries into cache
   */
  preloadCache(alos: ALOSummary[]): void {
    for (const alo of alos) {
      this.aloCache.set(alo.id, alo);
    }
    log.debug(`Preloaded ${alos.length} ALOs into deduplication cache`);
  }
}

/**
 * Common English stop words to exclude from similarity
 */
const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'been',
  'be',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'shall',
  'can',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'they',
  'them',
  'their',
  'he',
  'she',
  'him',
  'her',
  'his',
  'hers',
  'we',
  'us',
  'our',
  'you',
  'your',
  'i',
  'me',
  'my',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'also',
  'now',
  'here',
  'there',
  'when',
  'where',
  'why',
  'how',
  'which',
  'who',
  'whom',
  'what',
  'if',
  'then',
  'else',
  'because',
  'about',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'under',
  'again',
  'further',
  'once',
]);

/**
 * Singleton instance
 */
export const contentDeduplication = new ContentDeduplicationService();

/**
 * Filters inputs to remove likely duplicates
 */
export function filterDuplicates(
  inputs: ALOGenerationInput[],
  existingALOs: ALOSummary[],
  options: {
    threshold?: number;
    allowReview?: boolean;
  } = {}
): {
  unique: ALOGenerationInput[];
  duplicates: Array<{ input: ALOGenerationInput; result: SimilarityCheckResult }>;
  needsReview: Array<{ input: ALOGenerationInput; result: SimilarityCheckResult }>;
} {
  const threshold = options.threshold ?? THRESHOLDS.HIGH_SIMILARITY;
  const unique: ALOGenerationInput[] = [];
  const duplicates: Array<{ input: ALOGenerationInput; result: SimilarityCheckResult }> = [];
  const needsReview: Array<{ input: ALOGenerationInput; result: SimilarityCheckResult }> = [];

  // Group existing ALOs by domain
  const domainGroups = new Map<string, ALOSummary[]>();
  for (const alo of existingALOs) {
    const group = domainGroups.get(alo.domainId) || [];
    group.push(alo);
    domainGroups.set(alo.domainId, group);
  }

  for (const input of inputs) {
    const domainALOs = domainGroups.get(input.domainId) || [];

    // Synchronous similarity check (using simple algorithm)
    const _service = new ContentDeduplicationService();

    // Create result manually since we can't await in sync context
    const newText = [
      input.ksbEntry.title,
      input.ksbEntry.description,
      ...(input.ksbEntry.keywords || []),
    ].join(' ').toLowerCase();

    let highestSimilarity = 0;
    let mostSimilarAlo: ALOSummary | undefined;

    for (const alo of domainALOs) {
      const existingText = `${alo.title} ${alo.description}`;

      // Quick similarity check
      const tokens1 = newText.split(/\s+/).filter(w => w.length > 2);
      const tokens2 = existingText.toLowerCase().split(/\s+/).filter(w => w.length > 2);

      const set1 = new Set(tokens1);
      const set2 = new Set(tokens2);
      const intersection = [...set1].filter(t => set2.has(t)).length;
      const union = new Set([...set1, ...set2]).size;

      const similarity = union > 0 ? intersection / union : 0;

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        mostSimilarAlo = alo;
      }
    }

    const result: SimilarityCheckResult = {
      isDuplicate: highestSimilarity >= threshold,
      similarityScore: highestSimilarity,
      matchingAloId: mostSimilarAlo?.id,
      matchingKsbId: mostSimilarAlo?.ksbId,
      recommendation:
        highestSimilarity >= THRESHOLDS.DUPLICATE
          ? 'reuse_existing'
          : highestSimilarity >= threshold
          ? 'modify_existing'
          : highestSimilarity >= THRESHOLDS.REVIEW_THRESHOLD
          ? 'review_required'
          : 'generate_new',
      reason: `Similarity: ${(highestSimilarity * 100).toFixed(1)}%`,
    };

    if (result.recommendation === 'reuse_existing') {
      duplicates.push({ input, result });
    } else if (result.recommendation === 'review_required' && options.allowReview) {
      needsReview.push({ input, result });
    } else if (result.recommendation === 'generate_new') {
      unique.push(input);
    } else {
      // modify_existing or review_required without allowReview
      needsReview.push({ input, result });
    }
  }

  log.info('Duplicate filtering complete', {
    total: inputs.length,
    unique: unique.length,
    duplicates: duplicates.length,
    needsReview: needsReview.length,
  });

  return { unique, duplicates, needsReview };
}
