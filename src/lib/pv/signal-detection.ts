/**
 * Signal Detection Algorithms
 *
 * Production-ready disproportionality analysis for pharmacovigilance
 * signal detection. Implements industry-standard algorithms from
 * FDA FAERS, WHO VigiBase, and European EudraVigilance.
 *
 * @module lib/pv/signal-detection
 *
 * @example
 * ```typescript
 * import { detectSignal, SignalDetectionInput } from '@/lib/pv/signal-detection';
 *
 * const input: SignalDetectionInput = {
 *   drug: 'ASPIRIN',
 *   event: 'GI Hemorrhage',
 *   table: { a: 50, b: 100, c: 200, d: 5000 }
 * };
 *
 * const result = detectSignal(input);
 * log.info(result.isSignal); // true
 * log.info(result.strength); // 'strong'
 * ```
 */

// Re-export core types and functions from extraction patterns
export {
  // Types
  type ContingencyTable,
  type PRRResult,
  type RORResult,
  type ICResult,
  type BayesianResult,
  type DisproportionalityResult,
  type SignalThresholds,
  type SignalStrength,
  type SignalAssessment,
  type ContingencyAnalysisResult,

  // Constants
  DEFAULT_SIGNAL_THRESHOLDS,

  // Core calculation functions
  calculatePRR,
  calculateROR,
  calculateIC,
  calculateHaldaneOR,
  calculateRelativeRisk,
  assessSignal,
  analyzeDisproportionality,
} from '@/types/pv-extraction-patterns';

import {
  type ContingencyTable,
  type DisproportionalityResult,
  type SignalThresholds,
  type SignalStrength,
  DEFAULT_SIGNAL_THRESHOLDS,
  analyzeDisproportionality,
} from '@/types/pv-extraction-patterns';

// =============================================================================
// HIGH-LEVEL API
// =============================================================================

/**
 * Input for signal detection analysis
 */
export interface SignalDetectionInput {
  /** Drug name or identifier */
  drug: string;
  /** Adverse event (preferably MedDRA PT) */
  event: string;
  /** 2x2 contingency table */
  table: ContingencyTable;
  /** Optional custom thresholds */
  thresholds?: Partial<SignalThresholds>;
}

/**
 * Simplified signal detection result
 */
export interface SignalDetectionResult {
  /** Drug analyzed */
  drug: string;
  /** Event analyzed */
  event: string;
  /** Whether a signal was detected */
  isSignal: boolean;
  /** Signal strength classification */
  strength: SignalStrength;
  /** Human-readable interpretation */
  interpretation: string;
  /** Detailed results from each algorithm */
  details: DisproportionalityResult;
}

/**
 * Batch input for multiple drug-event pairs
 */
export interface BatchSignalInput {
  /** Array of drug-event pairs to analyze */
  pairs: SignalDetectionInput[];
  /** Shared thresholds for all pairs (optional) */
  thresholds?: Partial<SignalThresholds>;
}

/**
 * Batch result with summary statistics
 */
export interface BatchSignalResult {
  /** Results for each pair */
  results: SignalDetectionResult[];
  /** Summary statistics */
  summary: {
    total: number;
    signalsDetected: number;
    strongSignals: number;
    moderateSignals: number;
    weakSignals: number;
  };
}

// =============================================================================
// HIGH-LEVEL FUNCTIONS
// =============================================================================

/**
 * Detect safety signal for a drug-event pair
 *
 * This is the primary entry point for signal detection. It performs
 * multi-method disproportionality analysis (PRR, ROR, IC) and returns
 * a simplified result with signal strength classification.
 *
 * @param input - Drug, event, and contingency table
 * @returns Signal detection result with interpretation
 *
 * @example
 * ```typescript
 * const result = detectSignal({
 *   drug: 'ATORVASTATIN',
 *   event: 'Rhabdomyolysis',
 *   table: { a: 45, b: 200, c: 150, d: 8000 }
 * });
 *
 * if (result.isSignal) {
 *   log.info(`${result.strength} signal: ${result.interpretation}`);
 * }
 * ```
 */
export function detectSignal(input: SignalDetectionInput): SignalDetectionResult {
  const thresholds: SignalThresholds = {
    ...DEFAULT_SIGNAL_THRESHOLDS,
    ...input.thresholds,
  };

  const details = analyzeDisproportionality(
    input.drug,
    input.event,
    input.table,
    thresholds
  );

  // Generate human-readable interpretation
  const interpretation = generateInterpretation(details);

  return {
    drug: input.drug,
    event: input.event,
    isSignal: details.isSignal,
    strength: details.signalStrength,
    interpretation,
    details,
  };
}

/**
 * Batch signal detection for multiple drug-event pairs
 *
 * Efficiently analyzes multiple pairs and provides summary statistics.
 * Useful for screening large datasets or monitoring drug portfolios.
 *
 * @param input - Array of drug-event pairs
 * @returns Results with summary statistics
 *
 * @example
 * ```typescript
 * const batch = detectSignalBatch({
 *   pairs: [
 *     { drug: 'DrugA', event: 'Event1', table: {...} },
 *     { drug: 'DrugA', event: 'Event2', table: {...} },
 *     { drug: 'DrugB', event: 'Event1', table: {...} },
 *   ]
 * });
 *
 * log.info(`Found ${batch.summary.signalsDetected} signals`);
 * ```
 */
export function detectSignalBatch(input: BatchSignalInput): BatchSignalResult {
  const results = input.pairs.map(pair => detectSignal({
    ...pair,
    thresholds: { ...input.thresholds, ...pair.thresholds },
  }));

  const summary = {
    total: results.length,
    signalsDetected: results.filter(r => r.isSignal).length,
    strongSignals: results.filter(r => r.strength === 'strong').length,
    moderateSignals: results.filter(r => r.strength === 'moderate').length,
    weakSignals: results.filter(r => r.strength === 'weak').length,
  };

  return { results, summary };
}

/**
 * Quick check if a drug-event pair is a signal
 *
 * Lightweight function that returns just a boolean.
 * Use when you only need a yes/no answer.
 *
 * @param table - Contingency table
 * @param thresholds - Optional custom thresholds
 * @returns True if signal detected
 */
export function isSignal(
  table: ContingencyTable,
  thresholds?: Partial<SignalThresholds>
): boolean {
  const mergedThresholds: SignalThresholds = {
    ...DEFAULT_SIGNAL_THRESHOLDS,
    ...thresholds,
  };

  const result = analyzeDisproportionality('', '', table, mergedThresholds);
  return result.isSignal;
}

/**
 * Get signal strength for a contingency table
 *
 * Returns the signal strength classification without full analysis details.
 *
 * @param table - Contingency table
 * @param thresholds - Optional custom thresholds
 * @returns Signal strength ('none' | 'weak' | 'moderate' | 'strong')
 */
export function getSignalStrength(
  table: ContingencyTable,
  thresholds?: Partial<SignalThresholds>
): SignalStrength {
  const mergedThresholds: SignalThresholds = {
    ...DEFAULT_SIGNAL_THRESHOLDS,
    ...thresholds,
  };

  const result = analyzeDisproportionality('', '', table, mergedThresholds);
  return result.signalStrength;
}

// =============================================================================
// THRESHOLD PRESETS
// =============================================================================

/**
 * Evans criteria (default) - balanced sensitivity/specificity
 * PRR ≥ 2.0, Chi² ≥ 4.0, A ≥ 3
 */
export const EVANS_THRESHOLDS: SignalThresholds = {
  ...DEFAULT_SIGNAL_THRESHOLDS,
};

/**
 * Conservative thresholds - fewer false positives
 * PRR ≥ 3.0, Chi² ≥ 6.0, A ≥ 5
 */
export const CONSERVATIVE_THRESHOLDS: SignalThresholds = {
  minPRR: 3.0,
  minChiSquare: 6.0,
  minCaseCount: 5,
  requireRORSignificance: true,
  requireICSignificance: true,
};

/**
 * Sensitive thresholds - fewer false negatives
 * PRR ≥ 1.5, Chi² ≥ 3.0, A ≥ 2
 */
export const SENSITIVE_THRESHOLDS: SignalThresholds = {
  minPRR: 1.5,
  minChiSquare: 3.0,
  minCaseCount: 2,
  requireRORSignificance: false,
  requireICSignificance: false,
};

/**
 * WHO Uppsala criteria - IC-focused
 * Requires IC025 > 0 (lower CI bound positive)
 */
export const WHO_THRESHOLDS: SignalThresholds = {
  minPRR: 2.0,
  minChiSquare: 4.0,
  minCaseCount: 3,
  requireRORSignificance: false,
  requireICSignificance: true,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate human-readable interpretation of signal detection result
 */
function generateInterpretation(result: DisproportionalityResult): string {
  if (!result.isSignal) {
    return 'No statistically significant disproportionality detected. ' +
           'The drug-event association does not exceed signal thresholds.';
  }

  const { prr, ror, ic, signalStrength } = result;
  const strengthLabel = signalStrength.charAt(0).toUpperCase() + signalStrength.slice(1);

  const parts: string[] = [
    `${strengthLabel} signal detected.`,
  ];

  // Add PRR interpretation
  if (prr.isSignal) {
    parts.push(
      `PRR = ${prr.prr.toFixed(2)} (95% CI: ${prr.ciLow.toFixed(2)}-${prr.ciHigh.toFixed(2)}), ` +
      `Chi² = ${prr.chiSquare.toFixed(1)}.`
    );
  }

  // Add ROR interpretation
  if (ror.isSignal) {
    parts.push(
      `ROR = ${ror.ror.toFixed(2)} (95% CI: ${ror.ciLow.toFixed(2)}-${ror.ciHigh.toFixed(2)}).`
    );
  }

  // Add IC interpretation
  if (ic.isSignal) {
    parts.push(
      `IC = ${ic.ic.toFixed(2)} (IC025 = ${ic.ciLow.toFixed(2)} > 0).`
    );
  }

  return parts.join(' ');
}

/**
 * Validate contingency table for analysis
 *
 * @param table - Table to validate
 * @returns Validation result with any issues
 */
export function validateContingencyTable(table: ContingencyTable): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (table.a < 0 || table.b < 0 || table.c < 0 || table.d < 0) {
    issues.push('All cell values must be non-negative');
  }

  if (table.a + table.b + table.c + table.d === 0) {
    issues.push('Table cannot be empty (all zeros)');
  }

  if (table.a === 0) {
    issues.push('No cases with both drug and event (cell A = 0)');
  }

  if (table.a + table.b === 0) {
    issues.push('No reports with the drug (A + B = 0)');
  }

  if (table.a + table.c === 0) {
    issues.push('No reports with the event (A + C = 0)');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
