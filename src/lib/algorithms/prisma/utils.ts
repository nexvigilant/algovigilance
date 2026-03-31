/**
 * PRISMA Utility Functions
 *
 * Helper functions for creating records, statistics, validation, and quick API access.
 */

import type {
  LiteratureRecord,
  RecordSource,
  PRISMAFlowDiagram,
  PipelineResult,
  SystematicReviewReport,
} from './types';
import { processScreeningPipeline } from './pipeline';
import { validatePRISMACompliance } from './compliance';

// =============================================================================
// Record Creation
// =============================================================================

/**
 * Create an empty literature record with defaults
 */
export function createRecord(
  id: string,
  title: string,
  source: RecordSource,
  metadata: Partial<LiteratureRecord['metadata']> = {}
): LiteratureRecord {
  return {
    id,
    title,
    source,
    metadata: {
      authors: metadata.authors || [],
      year: metadata.year || new Date().getFullYear(),
      journal: metadata.journal || null,
      doi: metadata.doi || null,
      pmid: metadata.pmid || null,
      volume: metadata.volume || null,
      issue: metadata.issue || null,
      pages: metadata.pages || null,
    },
    phase: 'IDENTIFIED',
    exclusionReason: null,
    hasQuantitativeData: false,
  };
}

// =============================================================================
// Statistics
// =============================================================================

/**
 * Get exclusion statistics from pipeline result
 */
export function getExclusionStatistics(result: PipelineResult): {
  byPhase: Record<string, number>;
  byReason: Record<string, number>;
  total: number;
} {
  const byPhase: Record<string, number> = {
    identification: 0,
    screening: 0,
    eligibility: 0,
  };
  const byReason: Record<string, number> = {};

  for (const record of result.records) {
    if (record.phase !== 'EXCLUDED') continue;

    // Determine which phase the exclusion occurred
    if (record.exclusionReason === 'Duplicate') {
      byPhase.identification++;
    } else if (
      record.exclusionReason?.includes('keyword') ||
      record.exclusionReason?.includes('year')
    ) {
      byPhase.screening++;
    } else {
      byPhase.eligibility++;
    }

    // Count by reason
    const reason = record.exclusionReason || 'Unknown';
    byReason[reason] = (byReason[reason] || 0) + 1;
  }

  return {
    byPhase,
    byReason,
    total: result.statistics.totalExcluded,
  };
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate flow diagram consistency (sum conservation)
 *
 * Mathematical invariant:
 * databases + registers + other - duplicates = screened + screening_excluded
 */
export function validateFlowConsistency(flowDiagram: PRISMAFlowDiagram): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { identification, screening, eligibility, included } = flowDiagram;

  // Check identification → screening transition
  const totalIdentified =
    identification.databases + identification.registers + identification.otherMethods;
  const afterDedup = totalIdentified - identification.duplicatesRemoved;
  const screeningTotal = screening.recordsScreened + screening.recordsExcluded;

  // Note: This check may be off due to automation exclusions
  if (Math.abs(afterDedup - screeningTotal) > identification.automationExcluded) {
    errors.push(
      `Identification/Screening mismatch: ${afterDedup} identified (after dedup) vs ${screeningTotal} in screening`
    );
  }

  // Check screening → eligibility transition
  const passedScreening = screening.recordsScreened - screening.recordsExcluded;
  if (passedScreening < 0) {
    errors.push('Screening: more excluded than screened');
  }

  // Check eligibility → included transition
  const totalExcludedAtEligibility = Array.from(
    eligibility.reportsExcluded.values()
  ).reduce((sum, count) => sum + count, 0);
  const expectedIncluded =
    eligibility.reportsAssessed - totalExcludedAtEligibility;

  if (expectedIncluded !== included.studies) {
    errors.push(
      `Eligibility/Included mismatch: expected ${expectedIncluded} included, got ${included.studies}`
    );
  }

  // Meta-analysis subset check
  if (
    included.inMetaAnalysis !== null &&
    included.inMetaAnalysis > included.studies
  ) {
    errors.push('Meta-analysis count exceeds total included studies');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// Quick API Functions
// =============================================================================

/**
 * Quick screening - process records with default configuration
 */
export function quickScreen(
  records: LiteratureRecord[],
  inclusionKeywords: string[] = [],
  exclusionKeywords: string[] = []
): PipelineResult {
  return processScreeningPipeline(records, {
    deduplication: true,
    deduplicationFields: ['title', 'doi'],
    abstractCriteria: {
      inclusionKeywords,
      exclusionKeywords,
    },
    fullTextCriteria: {
      inclusionKeywords: [],
      exclusionKeywords,
    },
  });
}

/**
 * Quick compliance check - validate report with default threshold
 */
export function quickComplianceCheck(
  report: SystematicReviewReport
): { compliant: boolean; score: number; criticalIssues: string[] } {
  const result = validatePRISMACompliance(report);
  return {
    compliant: result.isCompliant,
    score: result.score,
    criticalIssues: result.criticalFailures.map(
      (f) => `Item ${f.itemNumber}: ${f.topic}`
    ),
  };
}
