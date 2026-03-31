/**
 * PRISMA Screening Functions
 *
 * Internal helper functions for the screening pipeline.
 * Implements fingerprinting for deduplication and screening logic.
 */

import type {
  LiteratureRecord,
  EligibilityCriteria,
  ScreeningDecision,
} from './types';

// =============================================================================
// Deduplication
// =============================================================================

/**
 * Generate a fingerprint for duplicate detection
 *
 * Uses normalized title + DOI/PMID for high-confidence matching
 *
 * @complexity O(|title|)
 */
export function generateFingerprint(
  record: LiteratureRecord,
  fields: ('title' | 'doi' | 'pmid')[] = ['title', 'doi']
): string {
  const parts: string[] = [];

  if (fields.includes('title') && record.title) {
    // Normalize: lowercase, remove punctuation, collapse whitespace
    const normalizedTitle = record.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    parts.push(normalizedTitle);
  }

  if (fields.includes('doi') && record.metadata.doi) {
    parts.push(record.metadata.doi.toLowerCase());
  }

  if (fields.includes('pmid') && record.metadata.pmid) {
    parts.push(record.metadata.pmid);
  }

  return parts.join('|');
}

// =============================================================================
// Abstract Screening
// =============================================================================

/**
 * Screen a record against abstract-level criteria
 *
 * @complexity O(k) where k = number of keywords
 */
export function screenAbstract(
  record: LiteratureRecord,
  criteria: EligibilityCriteria
): ScreeningDecision {
  // If custom predicate provided, use it
  if (criteria.customPredicate) {
    return criteria.customPredicate(record);
  }

  const searchText = `${record.title} ${record.abstract || ''}`.toLowerCase();

  // Check year bounds
  if (criteria.minYear && record.metadata.year < criteria.minYear) {
    return {
      type: 'EXCLUDE',
      reason: `Publication year ${record.metadata.year} < minimum ${criteria.minYear}`,
    };
  }

  if (criteria.maxYear && record.metadata.year > criteria.maxYear) {
    return {
      type: 'EXCLUDE',
      reason: `Publication year ${record.metadata.year} > maximum ${criteria.maxYear}`,
    };
  }

  // Check exclusion keywords first (higher priority)
  if (criteria.exclusionKeywords) {
    for (const keyword of criteria.exclusionKeywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return { type: 'EXCLUDE', reason: `Contains exclusion keyword: ${keyword}` };
      }
    }
  }

  // Check inclusion keywords
  if (criteria.inclusionKeywords && criteria.inclusionKeywords.length > 0) {
    const hasInclusionKeyword = criteria.inclusionKeywords.some((keyword) =>
      searchText.includes(keyword.toLowerCase())
    );
    if (!hasInclusionKeyword) {
      return {
        type: 'EXCLUDE',
        reason: 'Does not contain required inclusion keywords',
      };
    }
  }

  return { type: 'INCLUDE' };
}

// =============================================================================
// Full-Text Eligibility Assessment
// =============================================================================

/**
 * Assess full-text eligibility
 *
 * @complexity O(k) where k = number of keywords
 */
export function assessEligibility(
  record: LiteratureRecord,
  criteria: EligibilityCriteria
): ScreeningDecision {
  if (!record.fullText) {
    return { type: 'EXCLUDE', reason: 'Full text not available' };
  }

  // If custom predicate provided, use it
  if (criteria.customPredicate) {
    return criteria.customPredicate(record);
  }

  const searchText = record.fullText.toLowerCase();

  // Check exclusion keywords
  if (criteria.exclusionKeywords) {
    for (const keyword of criteria.exclusionKeywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return { type: 'EXCLUDE', reason: `Full text exclusion: ${keyword}` };
      }
    }
  }

  // Check study type if specified
  if (criteria.studyTypes && criteria.studyTypes.length > 0) {
    const hasValidStudyType = criteria.studyTypes.some((type) =>
      searchText.includes(type.toLowerCase())
    );
    if (!hasValidStudyType) {
      return { type: 'EXCLUDE', reason: 'Study type not in allowed list' };
    }
  }

  return { type: 'INCLUDE' };
}
