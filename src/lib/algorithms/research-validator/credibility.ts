/**
 * CMER Framework — Credibility Assessment
 *
 * Evaluates source authority, citation quality, author credentials,
 * source diversity, and recency of references.
 */

import type { Author, Citation, DimensionResult, ResearchMetadata, ValidationFlag } from './types';
import { clamp, CURRENT_YEAR, mean } from './types';

// =============================================================================
// CREDIBILITY ASSESSMENT
// =============================================================================

export function evaluateCitationQuality(citation: Citation): number {
  let score = 0;

  // Peer review status (30%)
  if (citation.isPeerReviewed) {
    score += 0.3;
  }

  // Source type (25%)
  const sourceTypeScores: Record<Citation['sourceType'], number> = {
    journal: 1.0,
    conference: 0.8,
    book: 0.75,
    report: 0.6,
    preprint: 0.5,
    website: 0.3,
    other: 0.2,
  };
  score += 0.25 * (sourceTypeScores[citation.sourceType] || 0.2);

  // Impact factor (20%)
  if (citation.impactFactor !== undefined) {
    const impactScore = Math.min(citation.impactFactor / 10, 1);
    score += 0.2 * impactScore;
  } else if (citation.isPeerReviewed) {
    score += 0.1; // Partial credit for peer-reviewed without IF
  }

  // Citation count (15%)
  if (citation.citationCount !== undefined) {
    const citationScore = Math.min(citation.citationCount / 100, 1);
    score += 0.15 * citationScore;
  }

  // Recency (10%)
  const age = CURRENT_YEAR - citation.year;
  const recencyScore = Math.max(0, 1 - age / 20);
  score += 0.1 * recencyScore;

  return clamp(score, 0, 1);
}

export function calculateSourceDiversity(citations: Citation[]): number {
  if (citations.length === 0) return 0;
  if (citations.length === 1) return 0.5;

  // Unique authors
  const allAuthors = new Set<string>();
  citations.forEach((c) => c.authors.forEach((a) => allAuthors.add(a.toLowerCase())));
  const authorDiversity = Math.min(allAuthors.size / (citations.length * 2), 1);

  // Unique journals/sources
  const sources = new Set(citations.map((c) => c.journal || c.sourceType));
  const sourceDiversity = Math.min(sources.size / citations.length, 1);

  // Year spread
  const years = citations.map((c) => c.year);
  const yearSpread = years.length > 1 ? (Math.max(...years) - Math.min(...years)) / 20 : 0;
  const yearDiversity = Math.min(yearSpread, 1);

  return 0.4 * authorDiversity + 0.4 * sourceDiversity + 0.2 * yearDiversity;
}

export function calculateRecencyScore(citations: Citation[], field: string): number {
  if (citations.length === 0) return 0;

  // Fast-moving fields require more recent citations
  const fastMovingFields = ['ai', 'machine learning', 'covid', 'technology', 'software'];
  const isFastMoving = fastMovingFields.some((f) => field.toLowerCase().includes(f));
  const recencyThreshold = isFastMoving ? 5 : 10;

  const recentCount = citations.filter((c) => CURRENT_YEAR - c.year <= recencyThreshold).length;
  return recentCount / citations.length;
}

export function evaluateAuthorCredibility(authors: Author[]): number {
  if (authors.length === 0) return 0.5;

  const authorScores = authors.map((author) => {
    let score = 0.5; // Base score

    // H-index contribution
    if (author.hIndex !== undefined) {
      score += 0.25 * Math.min(author.hIndex / 50, 1);
    }

    // Publication count
    if (author.publicationCount !== undefined) {
      score += 0.15 * Math.min(author.publicationCount / 100, 1);
    }

    // Affiliation bonus
    if (author.affiliation) {
      score += 0.1;
    }

    return clamp(score, 0, 1);
  });

  // Weight towards highest-credibility author
  authorScores.sort((a, b) => b - a);
  const weights = authorScores.map((_, i) => 1 / (i + 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  return authorScores.reduce((sum, score, i) => sum + score * weights[i], 0) / totalWeight;
}

export function assessCredibility(citations: Citation[], metadata: ResearchMetadata): DimensionResult {
  const flags: ValidationFlag[] = [];
  const details: Record<string, number> = {};

  // Citation quality scores
  const citationScores = citations.map(evaluateCitationQuality);
  details.avgCitationQuality = mean(citationScores);

  // Flag low-quality citations
  citationScores.forEach((score, i) => {
    if (score < 0.3) {
      flags.push({
        code: 'LOW_QUALITY_CITATION',
        severity: 'warning',
        message: `Citation "${citations[i].title}" has low quality score (${(score * 100).toFixed(0)}%)`,
        dimension: 'credibility',
        relatedItemId: citations[i].id,
      });
    }
  });

  // Source diversity
  details.sourceDiversity = calculateSourceDiversity(citations);
  if (details.sourceDiversity < 0.5) {
    flags.push({
      code: 'LOW_SOURCE_DIVERSITY',
      severity: 'warning',
      message: 'Sources lack diversity - consider citing from more varied sources',
      dimension: 'credibility',
    });
  }

  // Recency
  details.recencyScore = calculateRecencyScore(citations, metadata.field);
  if (details.recencyScore < 0.3) {
    flags.push({
      code: 'OUTDATED_CITATIONS',
      severity: 'info',
      message: 'Most citations are not recent - ensure findings are still relevant',
      dimension: 'credibility',
    });
  }

  // Author credibility
  details.authorCredibility = evaluateAuthorCredibility(metadata.authors);

  // Check for conflicts of interest
  const hasConflicts = metadata.authors.some((a) => a.conflictOfInterest);
  if (hasConflicts) {
    flags.push({
      code: 'CONFLICT_OF_INTEREST',
      severity: 'warning',
      message: 'Authors have declared conflicts of interest',
      dimension: 'credibility',
    });
  }

  // Insufficient citations
  if (citations.length < 5) {
    flags.push({
      code: 'INSUFFICIENT_CITATIONS',
      severity: 'warning',
      message: `Only ${citations.length} citations - consider expanding literature review`,
      dimension: 'credibility',
    });
  }

  // Calculate final score
  const finalScore =
    0.35 * details.avgCitationQuality +
    0.25 * details.sourceDiversity +
    0.2 * details.recencyScore +
    0.2 * details.authorCredibility;

  return {
    score: clamp(finalScore, 0, 1),
    flags,
    details,
  };
}
