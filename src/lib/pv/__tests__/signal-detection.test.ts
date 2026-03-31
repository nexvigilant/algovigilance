/**
 * Signal Detection Module Tests
 *
 * Tests for the high-level signal detection API in src/lib/pv/signal-detection.ts
 */

import {
  detectSignal,
  detectSignalBatch,
  isSignal,
  getSignalStrength,
  validateContingencyTable,
  EVANS_THRESHOLDS,
  CONSERVATIVE_THRESHOLDS,
  SENSITIVE_THRESHOLDS,
  WHO_THRESHOLDS,
  type ContingencyTable,
  type SignalDetectionInput,
} from '../signal-detection';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const STRONG_SIGNAL_TABLE: ContingencyTable = {
  a: 150,
  b: 50,
  c: 100,
  d: 10000,
};

const NO_SIGNAL_TABLE: ContingencyTable = {
  a: 10,
  b: 500,
  c: 200,
  d: 10000,
};

const MODERATE_SIGNAL_TABLE: ContingencyTable = {
  a: 50,
  b: 100,
  c: 200,
  d: 5000,
};

// =============================================================================
// detectSignal TESTS
// =============================================================================

describe('detectSignal', () => {
  it('detects strong signal correctly', () => {
    const input: SignalDetectionInput = {
      drug: 'ASPIRIN',
      event: 'GI Hemorrhage',
      table: STRONG_SIGNAL_TABLE,
    };

    const result = detectSignal(input);

    expect(result.drug).toBe('ASPIRIN');
    expect(result.event).toBe('GI Hemorrhage');
    expect(result.isSignal).toBe(true);
    expect(['strong', 'moderate']).toContain(result.strength);
    expect(result.interpretation).toContain('signal detected');
    expect(result.details).toBeDefined();
    expect(result.details.prr).toBeDefined();
    expect(result.details.ror).toBeDefined();
    expect(result.details.ic).toBeDefined();
  });

  it('returns no signal for non-significant association', () => {
    const input: SignalDetectionInput = {
      drug: 'PLACEBO',
      event: 'Headache',
      table: NO_SIGNAL_TABLE,
    };

    const result = detectSignal(input);

    expect(result.isSignal).toBe(false);
    expect(result.strength).toBe('none');
    expect(result.interpretation).toContain('No statistically significant');
  });

  it('accepts custom thresholds', () => {
    const input: SignalDetectionInput = {
      drug: 'DRUG',
      event: 'EVENT',
      table: MODERATE_SIGNAL_TABLE,
      thresholds: { minPRR: 10.0 }, // Very strict
    };

    const result = detectSignal(input);

    // With very strict thresholds, moderate signal should not be detected
    expect(result.isSignal).toBe(false);
  });

  it('includes detailed results in response', () => {
    const input: SignalDetectionInput = {
      drug: 'DRUG',
      event: 'EVENT',
      table: STRONG_SIGNAL_TABLE,
    };

    const result = detectSignal(input);

    expect(result.details.contingencyTable).toEqual(STRONG_SIGNAL_TABLE);
    expect(typeof result.details.prr.prr).toBe('number');
    expect(typeof result.details.ror.ror).toBe('number');
    expect(typeof result.details.ic.ic).toBe('number');
  });
});

// =============================================================================
// detectSignalBatch TESTS
// =============================================================================

describe('detectSignalBatch', () => {
  it('analyzes multiple pairs correctly', () => {
    const result = detectSignalBatch({
      pairs: [
        { drug: 'DrugA', event: 'Event1', table: STRONG_SIGNAL_TABLE },
        { drug: 'DrugA', event: 'Event2', table: NO_SIGNAL_TABLE },
        { drug: 'DrugB', event: 'Event1', table: MODERATE_SIGNAL_TABLE },
      ],
    });

    expect(result.results).toHaveLength(3);
    expect(result.summary.total).toBe(3);
    expect(result.summary.signalsDetected).toBeGreaterThanOrEqual(1);
  });

  it('provides accurate summary statistics', () => {
    const result = detectSignalBatch({
      pairs: [
        { drug: 'Drug1', event: 'Event', table: STRONG_SIGNAL_TABLE },
        { drug: 'Drug2', event: 'Event', table: STRONG_SIGNAL_TABLE },
        { drug: 'Drug3', event: 'Event', table: NO_SIGNAL_TABLE },
      ],
    });

    expect(result.summary.signalsDetected).toBe(2);
    expect(result.summary.total).toBe(3);
  });

  it('applies shared thresholds to all pairs', () => {
    const result = detectSignalBatch({
      pairs: [
        { drug: 'Drug1', event: 'Event', table: MODERATE_SIGNAL_TABLE },
        { drug: 'Drug2', event: 'Event', table: MODERATE_SIGNAL_TABLE },
      ],
      thresholds: { minPRR: 10.0 }, // Very strict - no signals
    });

    expect(result.summary.signalsDetected).toBe(0);
  });

  it('allows per-pair threshold overrides', () => {
    const result = detectSignalBatch({
      pairs: [
        { drug: 'Drug1', event: 'Event', table: MODERATE_SIGNAL_TABLE },
        { drug: 'Drug2', event: 'Event', table: MODERATE_SIGNAL_TABLE, thresholds: { minPRR: 1.0 } },
      ],
      thresholds: { minPRR: 10.0 }, // Strict default
    });

    // First pair should use strict thresholds (no signal)
    // Second pair should override with lenient threshold (signal)
    expect(result.results[0].isSignal).toBe(false);
    expect(result.results[1].isSignal).toBe(true);
  });
});

// =============================================================================
// isSignal TESTS
// =============================================================================

describe('isSignal', () => {
  it('returns true for strong signal', () => {
    expect(isSignal(STRONG_SIGNAL_TABLE)).toBe(true);
  });

  it('returns false for no signal', () => {
    expect(isSignal(NO_SIGNAL_TABLE)).toBe(false);
  });

  it('accepts custom thresholds', () => {
    expect(isSignal(MODERATE_SIGNAL_TABLE)).toBe(true);
    expect(isSignal(MODERATE_SIGNAL_TABLE, { minPRR: 10.0 })).toBe(false);
  });
});

// =============================================================================
// getSignalStrength TESTS
// =============================================================================

describe('getSignalStrength', () => {
  it('returns strength classification', () => {
    expect(['strong', 'moderate']).toContain(getSignalStrength(STRONG_SIGNAL_TABLE));
    expect(getSignalStrength(NO_SIGNAL_TABLE)).toBe('none');
  });

  it('accepts custom thresholds', () => {
    const strength = getSignalStrength(MODERATE_SIGNAL_TABLE);
    expect(['weak', 'moderate', 'strong']).toContain(strength);

    const strictStrength = getSignalStrength(MODERATE_SIGNAL_TABLE, { minPRR: 10.0 });
    expect(strictStrength).toBe('none');
  });
});

// =============================================================================
// validateContingencyTable TESTS
// =============================================================================

describe('validateContingencyTable', () => {
  it('validates correct table', () => {
    const result = validateContingencyTable(STRONG_SIGNAL_TABLE);

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('detects negative values', () => {
    const result = validateContingencyTable({ a: -1, b: 10, c: 10, d: 100 });

    expect(result.valid).toBe(false);
    expect(result.issues).toContain('All cell values must be non-negative');
  });

  it('detects empty table', () => {
    const result = validateContingencyTable({ a: 0, b: 0, c: 0, d: 0 });

    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Table cannot be empty (all zeros)');
  });

  it('warns when A = 0', () => {
    const result = validateContingencyTable({ a: 0, b: 10, c: 10, d: 100 });

    expect(result.valid).toBe(false);
    expect(result.issues).toContain('No cases with both drug and event (cell A = 0)');
  });

  it('warns when no drug reports', () => {
    const result = validateContingencyTable({ a: 0, b: 0, c: 10, d: 100 });

    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('A + B = 0'))).toBe(true);
  });

  it('warns when no event reports', () => {
    const result = validateContingencyTable({ a: 0, b: 10, c: 0, d: 100 });

    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('A + C = 0'))).toBe(true);
  });
});

// =============================================================================
// THRESHOLD PRESETS TESTS
// =============================================================================

describe('Threshold Presets', () => {
  it('EVANS_THRESHOLDS has correct values', () => {
    expect(EVANS_THRESHOLDS.minPRR).toBe(2.0);
    expect(EVANS_THRESHOLDS.minChiSquare).toBe(4.0);
    expect(EVANS_THRESHOLDS.minCaseCount).toBe(3);
  });

  it('CONSERVATIVE_THRESHOLDS is stricter', () => {
    expect(CONSERVATIVE_THRESHOLDS.minPRR).toBeGreaterThan(EVANS_THRESHOLDS.minPRR);
    expect(CONSERVATIVE_THRESHOLDS.minChiSquare).toBeGreaterThan(EVANS_THRESHOLDS.minChiSquare);
    expect(CONSERVATIVE_THRESHOLDS.requireICSignificance).toBe(true);
  });

  it('SENSITIVE_THRESHOLDS is more lenient', () => {
    expect(SENSITIVE_THRESHOLDS.minPRR).toBeLessThan(EVANS_THRESHOLDS.minPRR);
    expect(SENSITIVE_THRESHOLDS.minChiSquare).toBeLessThan(EVANS_THRESHOLDS.minChiSquare);
    expect(SENSITIVE_THRESHOLDS.requireRORSignificance).toBe(false);
  });

  it('WHO_THRESHOLDS requires IC significance', () => {
    expect(WHO_THRESHOLDS.requireICSignificance).toBe(true);
    expect(WHO_THRESHOLDS.requireRORSignificance).toBe(false);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration', () => {
  it('can import from @/lib/pv barrel', async () => {
    // This test verifies the barrel exports work
    const pv = await import('@/lib/pv');

    expect(pv.detectSignal).toBeDefined();
    expect(pv.detectSignalBatch).toBeDefined();
    expect(pv.calculatePRR).toBeDefined();
    expect(pv.calculateROR).toBeDefined();
    expect(pv.calculateIC).toBeDefined();
    expect(pv.EVANS_THRESHOLDS).toBeDefined();
  });

  it('produces consistent results across API levels', () => {
    const table = MODERATE_SIGNAL_TABLE;

    // High-level API
    const signalResult = detectSignal({
      drug: 'DRUG',
      event: 'EVENT',
      table,
    });

    // Low-level helper
    const isSignalResult = isSignal(table);
    const strengthResult = getSignalStrength(table);

    // Should be consistent
    expect(signalResult.isSignal).toBe(isSignalResult);
    expect(signalResult.strength).toBe(strengthResult);
  });
});
