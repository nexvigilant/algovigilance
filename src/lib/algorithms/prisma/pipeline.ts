/**
 * PRISMA Screening Pipeline
 *
 * Core processing pipeline implementing the PRISMA 2020 flow.
 * Implements a finite state machine for literature screening.
 *
 * Mathematical Basis:
 * - State machine: S = {IDENTIFIED, SCREENED, ELIGIBLE, INCLUDED, EXCLUDED}
 * - Transition function: δ: (S × Decision) → S
 */

import type {
  LiteratureRecord,
  ScreeningConfig,
  PRISMAFlowDiagram,
  PRISMAPhase,
  PipelineResult,
} from './types';
import { generateFingerprint, screenAbstract, assessEligibility } from './screening';

/**
 * Process literature records through the PRISMA pipeline
 *
 * Implements a finite state machine where records transition through:
 * IDENTIFIED → SCREENED → ELIGIBLE → INCLUDED (or EXCLUDED at any stage)
 *
 * Mathematical Invariant:
 * At any point, ∀r ∈ records: r.phase ∈ S ∧ phase_order(current) ≥ phase_order(previous)
 *
 * @param records - Array of literature records to process
 * @param config - Screening configuration
 * @returns Pipeline result with flow diagram and statistics
 *
 * @complexity Time: O(n), Space: O(n) for deduplication set
 */
export function processScreeningPipeline(
  records: LiteratureRecord[],
  config: ScreeningConfig
): PipelineResult {
  const startTime = performance.now();

  // Initialize flow diagram
  const flowDiagram: PRISMAFlowDiagram = {
    identification: {
      databases: 0,
      registers: 0,
      otherMethods: 0,
      duplicatesRemoved: 0,
      automationExcluded: 0,
      otherRemovals: 0,
    },
    screening: {
      recordsScreened: 0,
      recordsExcluded: 0,
    },
    eligibility: {
      reportsSought: 0,
      reportsNotRetrieved: 0,
      reportsAssessed: 0,
      reportsExcluded: new Map(),
    },
    included: {
      studies: 0,
      inMetaAnalysis: null,
    },
    generatedAt: new Date(),
  };

  // Deduplication set
  const seenFingerprints = new Set<string>();
  const deduplicationFields = config.deduplicationFields || ['title', 'doi'];

  // Process each record through the pipeline
  const processedRecords: LiteratureRecord[] = [];

  // =========================================================================
  // PHASE 1: IDENTIFICATION with source categorization and deduplication
  // =========================================================================
  for (const record of records) {
    const processed = { ...record, phase: 'IDENTIFIED' as PRISMAPhase };

    // Count by source type
    switch (record.source) {
      case 'database':
        flowDiagram.identification.databases++;
        break;
      case 'register':
        flowDiagram.identification.registers++;
        break;
      default:
        flowDiagram.identification.otherMethods++;
    }

    // Deduplication
    if (config.deduplication) {
      const fingerprint = generateFingerprint(processed, deduplicationFields);

      if (seenFingerprints.has(fingerprint)) {
        processed.phase = 'EXCLUDED';
        processed.exclusionReason = 'Duplicate';
        flowDiagram.identification.duplicatesRemoved++;
        processedRecords.push(processed);
        continue;
      }

      seenFingerprints.add(fingerprint);
    }

    processedRecords.push(processed);
  }

  // =========================================================================
  // PHASE 2: SCREENING (Title/Abstract)
  // =========================================================================
  for (const record of processedRecords) {
    if (record.phase !== 'IDENTIFIED') continue;

    const decision = screenAbstract(record, config.abstractCriteria);
    flowDiagram.screening.recordsScreened++;

    if (decision.type === 'INCLUDE') {
      record.phase = 'SCREENED';
    } else {
      record.phase = 'EXCLUDED';
      record.exclusionReason = decision.type === 'EXCLUDE' ? decision.reason : 'Pending';
      flowDiagram.screening.recordsExcluded++;
    }
  }

  // =========================================================================
  // PHASE 3: ELIGIBILITY (Full Text)
  // =========================================================================
  for (const record of processedRecords) {
    if (record.phase !== 'SCREENED') continue;

    flowDiagram.eligibility.reportsSought++;

    if (!record.fullText) {
      record.phase = 'EXCLUDED';
      record.exclusionReason = 'Full text not retrieved';
      flowDiagram.eligibility.reportsNotRetrieved++;
      continue;
    }

    flowDiagram.eligibility.reportsAssessed++;
    const decision = assessEligibility(record, config.fullTextCriteria);

    if (decision.type === 'INCLUDE') {
      record.phase = 'ELIGIBLE';
    } else {
      record.phase = 'EXCLUDED';
      record.exclusionReason = decision.type === 'EXCLUDE' ? decision.reason : 'Unknown';

      // Track exclusion reasons
      const reason = record.exclusionReason;
      const currentCount = flowDiagram.eligibility.reportsExcluded.get(reason) || 0;
      flowDiagram.eligibility.reportsExcluded.set(reason, currentCount + 1);
    }
  }

  // =========================================================================
  // PHASE 4: INCLUSION
  // =========================================================================
  let inMetaAnalysis = 0;

  for (const record of processedRecords) {
    if (record.phase !== 'ELIGIBLE') continue;

    record.phase = 'INCLUDED';
    flowDiagram.included.studies++;

    if (record.hasQuantitativeData) {
      inMetaAnalysis++;
    }
  }

  flowDiagram.included.inMetaAnalysis = inMetaAnalysis > 0 ? inMetaAnalysis : null;

  // =========================================================================
  // Calculate statistics
  // =========================================================================
  const totalIdentified =
    flowDiagram.identification.databases +
    flowDiagram.identification.registers +
    flowDiagram.identification.otherMethods;

  const totalExcluded = processedRecords.filter((r) => r.phase === 'EXCLUDED').length;
  const totalIncluded = flowDiagram.included.studies;

  return {
    records: processedRecords,
    flowDiagram,
    statistics: {
      totalIdentified,
      totalExcluded,
      totalIncluded,
      inclusionRate: totalIdentified > 0 ? totalIncluded / totalIdentified : 0,
      processingTimeMs: performance.now() - startTime,
    },
  };
}
