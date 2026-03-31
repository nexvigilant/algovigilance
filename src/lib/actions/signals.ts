'use server';

/**
 * Signal Detection Server Actions
 *
 * Computes pharmacovigilance signal metrics from 2x2 contingency tables.
 * All five standard disproportionality measures are calculated:
 *   PRR  — Proportional Reporting Ratio
 *   ROR  — Reporting Odds Ratio
 *   IC   — Information Component (Bayesian)
 *   EBGM — Empirical Bayes Geometric Mean
 *   Chi² — Chi-square statistic
 *
 * Signal thresholds (default):
 *   PRR >= 2.0, Chi² >= 3.841, ROR lower CI > 1.0, IC025 > 0, EB05 >= 2.0
 *
 * Firestore: /tenants/{tenantId}/programs/{programId}/signals/{signalId}
 */

import {
  adminDb,
  adminFieldValue,
} from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

const log = logger.scope('actions/signals');

// ============================================================================
// Types
// ============================================================================

/** 2x2 contingency table for disproportionality analysis */
export interface ContingencyTable {
  a: number; // drug + event
  b: number; // drug + no event
  c: number; // no drug + event
  d: number; // no drug + no event
}

/** Individual signal metric result */
export interface SignalMetric {
  name: string;
  value: number;
  lowerCI: number;
  upperCI: number;
  signal: boolean;
  threshold: number;
}

/** Full signal detection result */
export interface SignalResult {
  id: string;
  programId: string;
  tenantId: string;
  drugName: string;
  eventName: string;
  table: ContingencyTable;
  metrics: {
    prr: SignalMetric;
    ror: SignalMetric;
    ic: SignalMetric;
    ebgm: SignalMetric;
    chiSquare: SignalMetric;
  };
  overallSignal: boolean;
  signalCount: number;      // how many of 5 algorithms flagged
  signalStrength: 'none' | 'weak' | 'moderate' | 'strong';
  createdBy: string;
  createdAt: FirebaseFirestore.FieldValue;
}

// ============================================================================
// Signal Detection Thresholds
// ============================================================================

const THRESHOLDS = {
  prr: 2.0,
  chiSquare: 3.841,   // p < 0.05 (1 df)
  rorLowerCI: 1.0,
  ic025: 0.0,
  eb05: 2.0,
};

// ============================================================================
// Math Utilities
// ============================================================================

/**
 * Proportional Reporting Ratio
 * PRR = (a / (a+b)) / (c / (c+d))
 * 95% CI: exp(ln(PRR) +/- 1.96 * sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d)))
 */
function computePRR(t: ContingencyTable): SignalMetric {
  const { a, b, c, d } = t;
  if (a === 0 || c === 0) {
    return { name: 'PRR', value: 0, lowerCI: 0, upperCI: 0, signal: false, threshold: THRESHOLDS.prr };
  }

  const prr = (a / (a + b)) / (c / (c + d));
  const lnSE = Math.sqrt(1 / a - 1 / (a + b) + 1 / c - 1 / (c + d));
  const lnPRR = Math.log(prr);
  const lower = Math.exp(lnPRR - 1.96 * lnSE);
  const upper = Math.exp(lnPRR + 1.96 * lnSE);

  return {
    name: 'PRR',
    value: round(prr, 3),
    lowerCI: round(lower, 3),
    upperCI: round(upper, 3),
    signal: prr >= THRESHOLDS.prr,
    threshold: THRESHOLDS.prr,
  };
}

/**
 * Reporting Odds Ratio
 * ROR = (a*d) / (b*c)
 * 95% CI: exp(ln(ROR) +/- 1.96 * sqrt(1/a + 1/b + 1/c + 1/d))
 */
function computeROR(t: ContingencyTable): SignalMetric {
  const { a, b, c, d } = t;
  if (a === 0 || b === 0 || c === 0 || d === 0) {
    return { name: 'ROR', value: 0, lowerCI: 0, upperCI: 0, signal: false, threshold: THRESHOLDS.rorLowerCI };
  }

  const ror = (a * d) / (b * c);
  const lnSE = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  const lnROR = Math.log(ror);
  const lower = Math.exp(lnROR - 1.96 * lnSE);
  const upper = Math.exp(lnROR + 1.96 * lnSE);

  return {
    name: 'ROR',
    value: round(ror, 3),
    lowerCI: round(lower, 3),
    upperCI: round(upper, 3),
    signal: lower > THRESHOLDS.rorLowerCI,
    threshold: THRESHOLDS.rorLowerCI,
  };
}

/**
 * Information Component (Bayesian shrinkage)
 * IC = log2(observed / expected)
 * where expected = ((a+b) * (a+c)) / (a+b+c+d)
 * IC025 = IC - 1.96 * sqrt(1 / (a + 0.5))  (approximate lower CI)
 */
function computeIC(t: ContingencyTable): SignalMetric {
  const { a, b, c, d } = t;
  const N = a + b + c + d;
  if (N === 0 || a === 0) {
    return { name: 'IC', value: 0, lowerCI: 0, upperCI: 0, signal: false, threshold: THRESHOLDS.ic025 };
  }

  const expected = ((a + b) * (a + c)) / N;
  if (expected === 0) {
    return { name: 'IC', value: 0, lowerCI: 0, upperCI: 0, signal: false, threshold: THRESHOLDS.ic025 };
  }

  const ic = Math.log2(a / expected);
  // Approximate 95% CI using shrinkage
  const se = Math.sqrt(1 / (a + 0.5)) / Math.LN2;
  const lower = ic - 1.96 * se;
  const upper = ic + 1.96 * se;

  return {
    name: 'IC',
    value: round(ic, 3),
    lowerCI: round(lower, 3),
    upperCI: round(upper, 3),
    signal: lower > THRESHOLDS.ic025,
    threshold: THRESHOLDS.ic025,
  };
}

/**
 * Empirical Bayes Geometric Mean
 * Simplified EBGM using gamma-Poisson shrinkage:
 *   E = ((a+b)*(a+c))/N
 *   EBGM = (a + 0.5) / (E + 0.5)
 *   EB05 = exp(ln(EBGM) - 1.645 * sqrt(1/(a+0.5)))
 */
function computeEBGM(t: ContingencyTable): SignalMetric {
  const { a, b, c, d } = t;
  const N = a + b + c + d;
  if (N === 0) {
    return { name: 'EBGM', value: 0, lowerCI: 0, upperCI: 0, signal: false, threshold: THRESHOLDS.eb05 };
  }

  const expected = ((a + b) * (a + c)) / N;
  const ebgm = (a + 0.5) / (expected + 0.5);
  const lnSE = Math.sqrt(1 / (a + 0.5));
  const eb05 = Math.exp(Math.log(ebgm) - 1.645 * lnSE);
  const eb95 = Math.exp(Math.log(ebgm) + 1.645 * lnSE);

  return {
    name: 'EBGM',
    value: round(ebgm, 3),
    lowerCI: round(eb05, 3),
    upperCI: round(eb95, 3),
    signal: eb05 >= THRESHOLDS.eb05,
    threshold: THRESHOLDS.eb05,
  };
}

/**
 * Chi-square statistic (Yates corrected)
 * χ² = Σ (|O-E| - 0.5)² / E for each cell
 * Signal: χ² >= 3.841 (p < 0.05, 1df)
 */
function computeChiSquare(t: ContingencyTable): SignalMetric {
  const { a, b, c, d } = t;
  const N = a + b + c + d;
  if (N === 0) {
    return { name: 'Chi²', value: 0, lowerCI: 0, upperCI: 0, signal: false, threshold: THRESHOLDS.chiSquare };
  }

  // Expected values
  const eA = ((a + b) * (a + c)) / N;
  const eB = ((a + b) * (b + d)) / N;
  const eC = ((c + d) * (a + c)) / N;
  const eD = ((c + d) * (b + d)) / N;

  // Yates correction
  const chi2 =
    yatesCell(a, eA) + yatesCell(b, eB) + yatesCell(c, eC) + yatesCell(d, eD);

  return {
    name: 'Chi²',
    value: round(chi2, 3),
    lowerCI: round(chi2, 3), // chi-square doesn't have a CI in the same sense
    upperCI: round(chi2, 3),
    signal: chi2 >= THRESHOLDS.chiSquare,
    threshold: THRESHOLDS.chiSquare,
  };
}

function yatesCell(observed: number, expected: number): number {
  if (expected === 0) return 0;
  const diff = Math.abs(observed - expected) - 0.5;
  return (diff > 0 ? diff * diff : 0) / expected;
}

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/**
 * Classify signal strength based on how many of the 5 algorithms flagged
 */
function classifyStrength(count: number): 'none' | 'weak' | 'moderate' | 'strong' {
  if (count === 0) return 'none';
  if (count <= 2) return 'weak';
  if (count <= 4) return 'moderate';
  return 'strong';
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Run signal detection for a drug-event pair within a program
 *
 * Accepts a 2x2 contingency table and runs all 5 disproportionality algorithms.
 * Results are persisted to Firestore under the program's signals subcollection.
 */
export async function runSignalDetection(
  tenantId: string,
  programId: string,
  userId: string,
  drugName: string,
  eventName: string,
  table: ContingencyTable,
): Promise<{ success: boolean; result?: SignalResult; error?: string }> {
  try {
    // Validate inputs
    if (table.a < 0 || table.b < 0 || table.c < 0 || table.d < 0) {
      return { success: false, error: 'Contingency table values must be non-negative' };
    }

    const N = table.a + table.b + table.c + table.d;
    if (N === 0) {
      return { success: false, error: 'Contingency table cannot be all zeros' };
    }

    // Run all 5 algorithms
    const prr = computePRR(table);
    const ror = computeROR(table);
    const ic = computeIC(table);
    const ebgm = computeEBGM(table);
    const chiSquare = computeChiSquare(table);

    const metrics = { prr, ror, ic, ebgm, chiSquare };
    const signalFlags = [prr.signal, ror.signal, ic.signal, ebgm.signal, chiSquare.signal];
    const signalCount = signalFlags.filter(Boolean).length;
    const overallSignal = signalCount >= 2; // at least 2 of 5 must flag

    // Store in Firestore
    const signalRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .doc(programId)
      .collection('signals')
      .doc();

    const result: SignalResult = {
      id: signalRef.id,
      programId,
      tenantId,
      drugName: drugName.trim(),
      eventName: eventName.trim(),
      table,
      metrics,
      overallSignal,
      signalCount,
      signalStrength: classifyStrength(signalCount),
      createdBy: userId,
      createdAt: adminFieldValue.serverTimestamp(),
    };

    await signalRef.set(result);

    log.info('Signal detection completed', {
      tenantId,
      programId,
      drugName,
      eventName,
      signalCount,
      strength: result.signalStrength,
    });

    return { success: true, result };
  } catch (error) {
    log.error('Error running signal detection', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run signal detection',
    };
  }
}

/**
 * List all signal detection results for a program
 */
export async function listSignals(
  tenantId: string,
  programId: string,
): Promise<{ success: boolean; signals?: SignalResult[]; error?: string }> {
  try {
    const snapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .doc(programId)
      .collection('signals')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const signals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SignalResult[];

    return { success: true, signals };
  } catch (error) {
    log.error('Error listing signals', { error });
    return { success: false, error: 'Failed to load signals' };
  }
}

/**
 * Get signal detection summary stats for a program
 */
export async function getSignalSummary(
  tenantId: string,
  programId: string,
): Promise<{
  totalAnalyses: number;
  signalsDetected: number;
  strongSignals: number;
  latestStrength: 'none' | 'weak' | 'moderate' | 'strong';
}> {
  try {
    const snapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .doc(programId)
      .collection('signals')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    if (snapshot.empty) {
      return { totalAnalyses: 0, signalsDetected: 0, strongSignals: 0, latestStrength: 'none' };
    }

    const signals = snapshot.docs.map(d => d.data());
    const detected = signals.filter(s => s.overallSignal).length;
    const strong = signals.filter(s => s.signalStrength === 'strong').length;
    const latest = signals[0];

    return {
      totalAnalyses: signals.length,
      signalsDetected: detected,
      strongSignals: strong,
      latestStrength: (latest?.signalStrength || 'none') as 'none' | 'weak' | 'moderate' | 'strong',
    };
  } catch (error) {
    log.error('Error getting signal summary', { error });
    return { totalAnalyses: 0, signalsDetected: 0, strongSignals: 0, latestStrength: 'none' };
  }
}

/**
 * Delete a signal result
 */
export async function deleteSignal(
  tenantId: string,
  programId: string,
  signalId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('programs')
      .doc(programId)
      .collection('signals')
      .doc(signalId)
      .delete();

    log.info('Signal deleted', { tenantId, programId, signalId });
    return { success: true };
  } catch (error) {
    log.error('Error deleting signal', { error });
    return { success: false, error: 'Failed to delete signal' };
  }
}
