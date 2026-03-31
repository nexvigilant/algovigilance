/**
 * PV Extraction Patterns Tests
 *
 * Unit tests for signal detection algorithms and E2B mapping functions
 * extracted from FAERS-Database and OpenRIMS-PV repositories.
 *
 * Test vectors derived from published pharmacovigilance literature:
 * - Evans et al. (PRR thresholds)
 * - van Puijenbroek (ROR methodology)
 * - WHO Uppsala (IC/BCPNN)
 *
 * @see /docs/junkyard/EXTRACTION-CATALOG.md for algorithm documentation
 */

import {
  // Signal Detection
  calculatePRR,
  calculateROR,
  calculateIC,
  calculateHaldaneOR,
  calculateRelativeRisk,
  assessSignal,
  analyzeDisproportionality,
  DEFAULT_SIGNAL_THRESHOLDS,
  type ContingencyTable,
  type ContingencyAnalysisResult,
  type SignalThresholds,

  // E2B Mapping
  mapSeriousnessToE2BFlags,
  determineDrugCharacterization,
  calculateAgeGroup,
  mapDoseUnit,
  DOSE_UNIT_MAP,
} from '../pv-extraction-patterns';

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Standard test contingency table
 * Based on example from FAERS signal detection literature
 *
 * Table layout:
 *                Has Event    No Event
 * Drug              50          100       (150 total with drug)
 * Other Drugs      200         5000      (5200 total without drug)
 * Total            250         5100      (5350 grand total)
 */
const STANDARD_TABLE: ContingencyTable = {
  a: 50,   // Drug + Event
  b: 100,  // Drug + No Event
  c: 200,  // No Drug + Event
  d: 5000, // No Drug + No Event
};

/**
 * Strong signal table - clear disproportionality
 */
const STRONG_SIGNAL_TABLE: ContingencyTable = {
  a: 150,
  b: 50,
  c: 100,
  d: 10000,
};

/**
 * No signal table - no disproportionality
 */
const NO_SIGNAL_TABLE: ContingencyTable = {
  a: 10,
  b: 500,
  c: 200,
  d: 10000,
};

/**
 * Zero-cell table - needs continuity correction
 */
const ZERO_CELL_TABLE: ContingencyTable = {
  a: 5,
  b: 0,
  c: 10,
  d: 1000,
};

/**
 * Edge case: very small numbers
 */
const SMALL_TABLE: ContingencyTable = {
  a: 2,
  b: 3,
  c: 4,
  d: 100,
};

// =============================================================================
// PRR TESTS
// =============================================================================

describe('calculatePRR', () => {
  it('calculates PRR correctly for standard table', () => {
    const result = calculatePRR(STANDARD_TABLE);

    // PRR = [A/(A+B)] / [(A+C)/N]
    // PRR = [50/150] / [250/5350]
    // PRR = 0.3333 / 0.0467 = 7.13
    expect(result.prr).toBeCloseTo(7.13, 1);
    expect(result.isSignal).toBe(true);
  });

  it('returns signal=true when Evans criteria met', () => {
    // Evans criteria: PRR >= 2, Chi² >= 4, A >= 3
    const result = calculatePRR(STANDARD_TABLE);

    expect(result.prr).toBeGreaterThanOrEqual(2.0);
    expect(result.chiSquare).toBeGreaterThanOrEqual(4.0);
    expect(STANDARD_TABLE.a).toBeGreaterThanOrEqual(3);
    expect(result.isSignal).toBe(true);
  });

  it('returns signal=false when PRR < 2', () => {
    const result = calculatePRR(NO_SIGNAL_TABLE);
    expect(result.prr).toBeLessThan(2.0);
    expect(result.isSignal).toBe(false);
  });

  it('returns signal=false when A < 3', () => {
    const lowCaseTable: ContingencyTable = { a: 2, b: 100, c: 50, d: 5000 };
    const result = calculatePRR(lowCaseTable);
    expect(result.isSignal).toBe(false);
  });

  it('calculates 95% confidence interval', () => {
    const result = calculatePRR(STANDARD_TABLE);

    expect(result.ciLow).toBeLessThan(result.prr);
    expect(result.ciHigh).toBeGreaterThan(result.prr);
    // CI should be reasonable (not NaN or Infinity for valid data)
    expect(Number.isFinite(result.ciLow)).toBe(true);
    expect(Number.isFinite(result.ciHigh)).toBe(true);
  });

  it('handles custom thresholds', () => {
    const strictThresholds: SignalThresholds = {
      ...DEFAULT_SIGNAL_THRESHOLDS,
      minPRR: 5.0, // Stricter than default 2.0
    };

    const result = calculatePRR(STANDARD_TABLE, strictThresholds);
    // PRR ~7.13 should still be a signal with PRR >= 5 threshold
    expect(result.isSignal).toBe(true);
  });

  it('handles division by zero gracefully', () => {
    const emptyTable: ContingencyTable = { a: 0, b: 0, c: 0, d: 0 };
    const result = calculatePRR(emptyTable);

    expect(result.prr).toBe(0);
    expect(result.isSignal).toBe(false);
  });

  it('handles zero in denominator', () => {
    const zeroDenomTable: ContingencyTable = { a: 10, b: 0, c: 0, d: 100 };
    const result = calculatePRR(zeroDenomTable);

    // When c=0, denominator (A+C)/N is very small but not zero
    expect(Number.isFinite(result.prr) || result.prr === Infinity).toBe(true);
  });
});

// =============================================================================
// ROR TESTS
// =============================================================================

describe('calculateROR', () => {
  it('calculates ROR correctly for standard table', () => {
    const result = calculateROR(STANDARD_TABLE);

    // ROR = (A*D) / (B*C)
    // ROR = (50 * 5000) / (100 * 200)
    // ROR = 250000 / 20000 = 12.5
    expect(result.ror).toBeCloseTo(12.5, 1);
    expect(result.isSignal).toBe(true);
  });

  it('returns signal=true when CI lower bound > 1', () => {
    const result = calculateROR(STRONG_SIGNAL_TABLE);

    expect(result.ciLow).toBeGreaterThan(1.0);
    expect(result.isSignal).toBe(true);
  });

  it('returns signal=false when CI includes 1', () => {
    const result = calculateROR(NO_SIGNAL_TABLE);

    expect(result.ciLow).toBeLessThanOrEqual(1.0);
    expect(result.isSignal).toBe(false);
  });

  it('calculates 95% confidence interval', () => {
    const result = calculateROR(STANDARD_TABLE);

    expect(result.ciLow).toBeLessThan(result.ror);
    expect(result.ciHigh).toBeGreaterThan(result.ror);
    expect(Number.isFinite(result.ciLow)).toBe(true);
    expect(Number.isFinite(result.ciHigh)).toBe(true);
  });

  it('handles zero in B cell', () => {
    const zeroBTable: ContingencyTable = { a: 10, b: 0, c: 50, d: 1000 };
    const result = calculateROR(zeroBTable);

    expect(result.ror).toBe(Infinity);
    expect(result.isSignal).toBe(false);
  });

  it('handles zero in C cell', () => {
    const zeroCTable: ContingencyTable = { a: 10, b: 100, c: 0, d: 1000 };
    const result = calculateROR(zeroCTable);

    expect(result.ror).toBe(Infinity);
    expect(result.isSignal).toBe(false);
  });
});

// =============================================================================
// IC (BCPNN) TESTS
// =============================================================================

describe('calculateIC', () => {
  it('calculates IC correctly for standard table', () => {
    const result = calculateIC(STANDARD_TABLE);

    // IC = log2(observed / expected)
    // Expected = (A+B) * (A+C) / N = 150 * 250 / 5350 = 7.01
    // IC = log2((50 + 0.5) / (7.01 + 0.5)) ≈ 2.76
    expect(result.ic).toBeGreaterThan(2.0);
    expect(result.isSignal).toBe(true);
  });

  it('returns signal=true when IC025 > 0 (lower CI > 0)', () => {
    const result = calculateIC(STRONG_SIGNAL_TABLE);

    expect(result.ciLow).toBeGreaterThan(0);
    expect(result.isSignal).toBe(true);
  });

  it('returns signal=false when IC025 <= 0', () => {
    const result = calculateIC(NO_SIGNAL_TABLE);

    expect(result.ciLow).toBeLessThanOrEqual(0);
    expect(result.isSignal).toBe(false);
  });

  it('calculates variance correctly', () => {
    const result = calculateIC(STANDARD_TABLE);

    expect(result.variance).toBeGreaterThan(0);
    expect(Number.isFinite(result.variance)).toBe(true);
  });

  it('applies continuity correction', () => {
    // Test with custom continuity value
    const result1 = calculateIC(STANDARD_TABLE, 0.5);
    const result2 = calculateIC(STANDARD_TABLE, 1.0);

    // Different continuity should give slightly different results
    expect(result1.ic).not.toEqual(result2.ic);
  });

  it('handles empty table gracefully', () => {
    const emptyTable: ContingencyTable = { a: 0, b: 0, c: 0, d: 0 };
    const result = calculateIC(emptyTable);

    expect(result.ic).toBe(0);
    expect(result.isSignal).toBe(false);
  });

  it('handles small counts with continuity correction', () => {
    const result = calculateIC(SMALL_TABLE);

    expect(Number.isFinite(result.ic)).toBe(true);
    expect(Number.isFinite(result.ciLow)).toBe(true);
    expect(Number.isFinite(result.ciHigh)).toBe(true);
  });
});

// =============================================================================
// HALDANE'S OR TESTS
// =============================================================================

describe('calculateHaldaneOR', () => {
  it('calculates Haldane OR with continuity correction', () => {
    const result = calculateHaldaneOR(STANDARD_TABLE);

    // HOR = [(A+0.5) * (D+0.5)] / [(B+0.5) * (C+0.5)]
    // HOR = [50.5 * 5000.5] / [100.5 * 200.5]
    // HOR ≈ 12.54 (slightly different from ROR due to correction)
    expect(result.ror).toBeCloseTo(12.5, 0);
  });

  it('handles zero cells without errors', () => {
    const result = calculateHaldaneOR(ZERO_CELL_TABLE);

    // Should not throw or return NaN/Infinity
    expect(Number.isFinite(result.ror)).toBe(true);
    expect(Number.isFinite(result.ciLow)).toBe(true);
    expect(Number.isFinite(result.ciHigh)).toBe(true);
  });

  it('is similar to ROR for large counts', () => {
    const ror = calculateROR(STANDARD_TABLE);
    const haldane = calculateHaldaneOR(STANDARD_TABLE);

    // For large counts, Haldane should be very close to regular ROR
    expect(Math.abs(ror.ror - haldane.ror)).toBeLessThan(0.5);
  });

  it('differs more from ROR for small counts', () => {
    const ror = calculateROR(SMALL_TABLE);
    const haldane = calculateHaldaneOR(SMALL_TABLE);

    // For small counts, the continuity correction has more effect
    // The values should be different
    expect(ror.ror).not.toEqual(haldane.ror);
  });

  it('returns signal=true when CI excludes 1', () => {
    const result = calculateHaldaneOR(STRONG_SIGNAL_TABLE);

    expect(result.ciLow).toBeGreaterThan(1.0);
    expect(result.isSignal).toBe(true);
  });
});

// =============================================================================
// RELATIVE RISK TESTS
// =============================================================================

describe('calculateRelativeRisk', () => {
  it('calculates RR correctly', () => {
    // Using standard table values
    const result = calculateRelativeRisk(50, 100, 200, 5000);

    // Exposed IR = 50/150 * 1000 = 333.3
    // Non-exposed IR = 200/5200 * 1000 = 38.46
    // RR = 333.3 / 38.46 = 8.67
    expect(result.rr).toBeGreaterThan(8);
    expect(result.rr).toBeLessThan(10);
  });

  it('returns 95% confidence interval', () => {
    const result = calculateRelativeRisk(50, 100, 200, 5000);

    expect(result.ciLow).toBeLessThan(result.rr);
    expect(result.ciHigh).toBeGreaterThan(result.rr);
    expect(Number.isFinite(result.ciLow)).toBe(true);
    expect(Number.isFinite(result.ciHigh)).toBe(true);
  });

  it('handles zero exposed population', () => {
    const result = calculateRelativeRisk(0, 0, 100, 1000);

    expect(result.rr).toBe(0);
    expect(result.ciLow).toBe(0);
    expect(result.ciHigh).toBe(0);
  });

  it('handles zero non-exposed rate', () => {
    const result = calculateRelativeRisk(50, 100, 0, 1000);

    expect(result.rr).toBe(Infinity);
  });
});

// =============================================================================
// SIGNAL ASSESSMENT TESTS
// =============================================================================

describe('assessSignal', () => {
  it('returns no signal when CI includes 1', () => {
    const analysisResult: ContingencyAnalysisResult = {
      drug: 'TestDrug',
      medicationId: 1,
      exposedCases: 10,
      exposedNonCases: 500,
      exposedPopulation: 510,
      exposedIncidenceRate: 19.6,
      nonExposedCases: 200,
      nonExposedNonCases: 10000,
      nonExposedPopulation: 10200,
      nonExposedIncidenceRate: 19.6,
      unadjustedRelativeRisk: 1.0,
      adjustedRelativeRisk: 1.0,
      confidenceIntervalLow: 0.5,
      confidenceIntervalHigh: 2.0,
    };

    const result = assessSignal(analysisResult);

    expect(result.isSignal).toBe(false);
    expect(result.strength).toBe('none');
  });

  it('returns weak signal for RR >= 1 but < 2', () => {
    const analysisResult: ContingencyAnalysisResult = {
      drug: 'TestDrug',
      medicationId: 1,
      exposedCases: 30,
      exposedNonCases: 470,
      exposedPopulation: 500,
      exposedIncidenceRate: 60,
      nonExposedCases: 200,
      nonExposedNonCases: 9800,
      nonExposedPopulation: 10000,
      nonExposedIncidenceRate: 20,
      unadjustedRelativeRisk: 1.5,
      adjustedRelativeRisk: 1.5,
      confidenceIntervalLow: 1.1, // CI excludes 1
      confidenceIntervalHigh: 2.0,
    };

    const result = assessSignal(analysisResult);

    expect(result.isSignal).toBe(true);
    expect(result.strength).toBe('weak');
  });

  it('returns moderate signal for RR >= 2 but < 4', () => {
    const analysisResult: ContingencyAnalysisResult = {
      drug: 'TestDrug',
      medicationId: 1,
      exposedCases: 60,
      exposedNonCases: 440,
      exposedPopulation: 500,
      exposedIncidenceRate: 120,
      nonExposedCases: 200,
      nonExposedNonCases: 9800,
      nonExposedPopulation: 10000,
      nonExposedIncidenceRate: 20,
      unadjustedRelativeRisk: 3.0,
      adjustedRelativeRisk: 3.0,
      confidenceIntervalLow: 2.2,
      confidenceIntervalHigh: 4.0,
    };

    const result = assessSignal(analysisResult);

    expect(result.isSignal).toBe(true);
    expect(result.strength).toBe('moderate');
  });

  it('returns strong signal for RR >= 4', () => {
    const analysisResult: ContingencyAnalysisResult = {
      drug: 'TestDrug',
      medicationId: 1,
      exposedCases: 100,
      exposedNonCases: 400,
      exposedPopulation: 500,
      exposedIncidenceRate: 200,
      nonExposedCases: 200,
      nonExposedNonCases: 9800,
      nonExposedPopulation: 10000,
      nonExposedIncidenceRate: 20,
      unadjustedRelativeRisk: 5.0,
      adjustedRelativeRisk: 5.0,
      confidenceIntervalLow: 4.0,
      confidenceIntervalHigh: 6.5,
    };

    const result = assessSignal(analysisResult);

    expect(result.isSignal).toBe(true);
    expect(result.strength).toBe('strong');
  });

  it('includes interpretation string', () => {
    const analysisResult: ContingencyAnalysisResult = {
      drug: 'TestDrug',
      medicationId: 1,
      exposedCases: 100,
      exposedNonCases: 400,
      exposedPopulation: 500,
      exposedIncidenceRate: 200,
      nonExposedCases: 200,
      nonExposedNonCases: 9800,
      nonExposedPopulation: 10000,
      nonExposedIncidenceRate: 20,
      unadjustedRelativeRisk: 5.0,
      adjustedRelativeRisk: 5.0,
      confidenceIntervalLow: 4.0,
      confidenceIntervalHigh: 6.5,
    };

    const result = assessSignal(analysisResult);

    expect(result.interpretation).toContain('RR=');
    expect(result.interpretation).toContain('95% CI');
  });
});

// =============================================================================
// DISPROPORTIONALITY ANALYSIS TESTS
// =============================================================================

describe('analyzeDisproportionality', () => {
  it('performs complete multi-method analysis', () => {
    const result = analyzeDisproportionality('ASPIRIN', 'GI Hemorrhage', STANDARD_TABLE);

    expect(result.drug).toBe('ASPIRIN');
    expect(result.event).toBe('GI Hemorrhage');
    expect(result.contingencyTable).toEqual(STANDARD_TABLE);
    expect(result.prr).toBeDefined();
    expect(result.ror).toBeDefined();
    expect(result.ic).toBeDefined();
  });

  it('identifies strong signal when all methods agree', () => {
    const result = analyzeDisproportionality('DRUG', 'EVENT', STRONG_SIGNAL_TABLE);

    expect(result.prr.isSignal).toBe(true);
    expect(result.ror.isSignal).toBe(true);
    expect(result.ic.isSignal).toBe(true);
    expect(result.isSignal).toBe(true);
    expect(result.signalStrength).toBe('strong');
  });

  it('identifies no signal when methods agree on no signal', () => {
    const result = analyzeDisproportionality('DRUG', 'EVENT', NO_SIGNAL_TABLE);

    expect(result.isSignal).toBe(false);
    expect(result.signalStrength).toBe('none');
  });

  it('respects custom thresholds', () => {
    const strictThresholds: SignalThresholds = {
      minPRR: 10.0, // Very strict
      minChiSquare: 10.0,
      minCaseCount: 10,
      requireRORSignificance: true,
      requireICSignificance: true,
    };

    const result = analyzeDisproportionality('DRUG', 'EVENT', STANDARD_TABLE, strictThresholds);

    // With strict thresholds, this should not be a signal
    expect(result.isSignal).toBe(false);
  });

  it('requires ROR significance when configured', () => {
    const rorRequiredThresholds: SignalThresholds = {
      ...DEFAULT_SIGNAL_THRESHOLDS,
      requireRORSignificance: true,
    };

    // Create a table where PRR signals but ROR might not
    const prrOnlyTable: ContingencyTable = { a: 5, b: 5, c: 100, d: 5000 };
    const result = analyzeDisproportionality('DRUG', 'EVENT', prrOnlyTable, rorRequiredThresholds);

    // Overall signal depends on both PRR and ROR when requireRORSignificance is true
    if (result.prr.isSignal && !result.ror.isSignal) {
      expect(result.isSignal).toBe(false);
    }
  });

  it('classifies signal strength correctly', () => {
    // Strong signal
    const strongResult = analyzeDisproportionality('DRUG', 'EVENT', STRONG_SIGNAL_TABLE);
    expect(['strong', 'moderate']).toContain(strongResult.signalStrength);

    // No signal
    const noResult = analyzeDisproportionality('DRUG', 'EVENT', NO_SIGNAL_TABLE);
    expect(noResult.signalStrength).toBe('none');
  });
});

// =============================================================================
// E2B MAPPING TESTS
// =============================================================================

describe('mapSeriousnessToE2BFlags', () => {
  it('maps Death correctly', () => {
    const result = mapSeriousnessToE2BFlags('Death');

    expect(result.seriousnessDeath).toBe('1=Yes');
    expect(result.seriousnessLifeThreatening).toBe('2=No');
    expect(result.seriousnessHospitalization).toBe('2=No');
    expect(result.seriousnessDisabling).toBe('2=No');
    expect(result.seriousnessCongenitalAnomaly).toBe('2=No');
    expect(result.seriousnessOther).toBe('2=No');
  });

  it('maps Life threatening correctly', () => {
    const result = mapSeriousnessToE2BFlags('Life threatening');

    expect(result.seriousnessDeath).toBe('2=No');
    expect(result.seriousnessLifeThreatening).toBe('1=Yes');
  });

  it('maps Hospitalization correctly', () => {
    const result = mapSeriousnessToE2BFlags('Initial or prolonged hospitalization');

    expect(result.seriousnessHospitalization).toBe('1=Yes');
  });

  it('maps Disability correctly', () => {
    const result = mapSeriousnessToE2BFlags('Persistent or significant disability or incapacity');

    expect(result.seriousnessDisabling).toBe('1=Yes');
  });

  it('maps Congenital anomaly correctly', () => {
    const result = mapSeriousnessToE2BFlags('A congenital anomaly or birth defect');

    expect(result.seriousnessCongenitalAnomaly).toBe('1=Yes');
  });

  it('maps Other medically important correctly', () => {
    const result = mapSeriousnessToE2BFlags('A medically important event');

    expect(result.seriousnessOther).toBe('1=Yes');
  });

  it('returns proper E2BSeriousnessFlags structure', () => {
    const result = mapSeriousnessToE2BFlags('Death');

    expect(Object.keys(result)).toEqual([
      'seriousnessDeath',
      'seriousnessLifeThreatening',
      'seriousnessHospitalization',
      'seriousnessDisabling',
      'seriousnessCongenitalAnomaly',
      'seriousnessOther',
    ]);
  });
});

describe('determineDrugCharacterization', () => {
  it('returns Suspect for valid Naranjo causality', () => {
    expect(determineDrugCharacterization('Possible', null)).toBe('1=Suspect');
    expect(determineDrugCharacterization('Probable', null)).toBe('1=Suspect');
    expect(determineDrugCharacterization('Definite', null)).toBe('1=Suspect');
  });

  it('returns Suspect for valid WHO causality', () => {
    expect(determineDrugCharacterization(null, 'Possible')).toBe('1=Suspect');
    expect(determineDrugCharacterization(null, 'Probable')).toBe('1=Suspect');
    expect(determineDrugCharacterization(null, 'Certain')).toBe('1=Suspect');
  });

  it('returns Concomitant for invalid/missing causality', () => {
    expect(determineDrugCharacterization(null, null)).toBe('2=Concomitant');
    expect(determineDrugCharacterization('Unlikely', null)).toBe('2=Concomitant');
    expect(determineDrugCharacterization(null, 'Unlikely')).toBe('2=Concomitant');
    expect(determineDrugCharacterization('Doubtful', 'Unlikely')).toBe('2=Concomitant');
  });

  it('prioritizes valid causality when both present', () => {
    // If either Naranjo OR WHO is valid, it's Suspect
    expect(determineDrugCharacterization('Possible', 'Unlikely')).toBe('1=Suspect');
    expect(determineDrugCharacterization('Unlikely', 'Certain')).toBe('1=Suspect');
  });
});

describe('calculateAgeGroup', () => {
  const createDate = (year: number, month: number, day: number) =>
    new Date(year, month - 1, day);

  it('returns empty string for null inputs', () => {
    expect(calculateAgeGroup(null, null)).toBe('');
    expect(calculateAgeGroup(new Date(), null)).toBe('');
    expect(calculateAgeGroup(null, new Date())).toBe('');
  });

  it('classifies Neonate (<= 1 month)', () => {
    const birthDate = createDate(2024, 1, 1);
    const onsetDate = createDate(2024, 1, 15); // 15 days old

    expect(calculateAgeGroup(onsetDate, birthDate)).toBe('Neonate <= 1 month');
  });

  it('classifies Infant (> 1 month and <= 4 years)', () => {
    const birthDate = createDate(2020, 1, 1);
    const onsetDate = createDate(2022, 1, 1); // 2 years old

    expect(calculateAgeGroup(onsetDate, birthDate)).toBe('Infant > 1 month and <= 4 years');
  });

  it('classifies Child (> 4 years and <= 11 years)', () => {
    const birthDate = createDate(2015, 1, 1);
    const onsetDate = createDate(2022, 1, 1); // 7 years old

    expect(calculateAgeGroup(onsetDate, birthDate)).toBe('Child > 4 years and <= 11 years');
  });

  it('classifies Adolescent (> 11 years and <= 16 years)', () => {
    const birthDate = createDate(2010, 1, 1);
    const onsetDate = createDate(2024, 1, 1); // 14 years old

    expect(calculateAgeGroup(onsetDate, birthDate)).toBe('Adolescent > 11 years and <= 16 years');
  });

  it('classifies Adult (> 16 years and <= 69 years)', () => {
    const birthDate = createDate(1980, 1, 1);
    const onsetDate = createDate(2024, 1, 1); // 44 years old

    expect(calculateAgeGroup(onsetDate, birthDate)).toBe('Adult > 16 years and <= 69 years');
  });

  it('classifies Elderly (> 69 years)', () => {
    const birthDate = createDate(1950, 1, 1);
    const onsetDate = createDate(2024, 1, 1); // 74 years old

    expect(calculateAgeGroup(onsetDate, birthDate)).toBe('Elderly > 69 years');
  });

  it('handles edge case at 69 years boundary', () => {
    const birthDate = createDate(1954, 1, 1);

    // Exactly 69 years (828 months) should still be Adult
    const onsetAt69Exact = createDate(2023, 1, 1); // Exactly 69 years
    expect(calculateAgeGroup(onsetAt69Exact, birthDate)).toBe('Adult > 16 years and <= 69 years');

    // One day past 69 years should be Elderly
    const onsetAt69Plus = createDate(2023, 2, 1); // 69 years + 1 month
    expect(calculateAgeGroup(onsetAt69Plus, birthDate)).toBe('Elderly > 69 years');
  });
});

describe('mapDoseUnit', () => {
  it('maps common UCUM units correctly', () => {
    expect(mapDoseUnit('mg')).toBe('003=Mg milligram(s)');
    expect(mapDoseUnit('g')).toBe('002=G gram(s)');
    expect(mapDoseUnit('kg')).toBe('001=kg kilogram(s)');
    expect(mapDoseUnit('mL')).toBe('012=ml millilitre(s)');
  });

  it('maps international units', () => {
    expect(mapDoseUnit('[iU]')).toBe('025=Iu international unit(s)');
    expect(mapDoseUnit('k[iU]')).toBe('026=Kiu iu(1000s)');
    expect(mapDoseUnit('M[iU]')).toBe('027=Miu iu(1,000,000s)');
  });

  it('maps radioactivity units', () => {
    expect(mapDoseUnit('Bq')).toBe('014=Bq becquerel(s)');
    expect(mapDoseUnit('Ci')).toBe('018=Ci curie(s)');
    expect(mapDoseUnit('MBq')).toBe('016=MBq megabecquerel(s)');
  });

  it('returns empty string for unknown units', () => {
    expect(mapDoseUnit('unknown')).toBe('');
    expect(mapDoseUnit('')).toBe('');
    expect(mapDoseUnit('not_a_unit')).toBe('');
  });

  it('handles special units', () => {
    expect(mapDoseUnit('%')).toBe('030=% percent');
    expect(mapDoseUnit('{DF}')).toBe('032=DF dosage form');
    expect(mapDoseUnit('[drp]')).toBe('031=Gtt drop(s)');
  });

  it('covers all DOSE_UNIT_MAP entries', () => {
    // Verify all entries in the map are accessible
    for (const [ucum, e2b] of Object.entries(DOSE_UNIT_MAP)) {
      expect(mapDoseUnit(ucum)).toBe(e2b);
    }
  });
});

// =============================================================================
// DEFAULT THRESHOLDS TESTS
// =============================================================================

describe('DEFAULT_SIGNAL_THRESHOLDS', () => {
  it('has correct Evans criteria defaults', () => {
    expect(DEFAULT_SIGNAL_THRESHOLDS.minPRR).toBe(2.0);
    expect(DEFAULT_SIGNAL_THRESHOLDS.minChiSquare).toBe(4.0);
    expect(DEFAULT_SIGNAL_THRESHOLDS.minCaseCount).toBe(3);
  });

  it('requires ROR significance by default', () => {
    expect(DEFAULT_SIGNAL_THRESHOLDS.requireRORSignificance).toBe(true);
  });

  it('does not require IC significance by default', () => {
    expect(DEFAULT_SIGNAL_THRESHOLDS.requireICSignificance).toBe(false);
  });
});
