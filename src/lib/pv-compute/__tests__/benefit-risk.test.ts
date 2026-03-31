/**
 * Tests for pv-compute/benefit-risk.ts
 *
 * Covers computeQbri — Quantitative Benefit-Risk Index
 *
 * Formula: QBRI = Σ(benefit_weight × benefit_score) / Σ(risk_weight × risk_score)
 *
 * Thresholds:
 *   > 2.0  → favorable
 *   > 1.0  → marginal
 *   <= 1.0 → unfavorable
 */

import { computeQbri } from '../benefit-risk';
import type { BenefitRiskFactor, QbriResult } from '../benefit-risk';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Single benefit factor: weight=1, score=10 → total=10 */
const SINGLE_BENEFIT: BenefitRiskFactor[] = [
  { name: 'Efficacy', weight: 1.0, score: 10.0 },
];

/** Single risk factor: weight=1, score=2 → total=2 */
const SMALL_RISK: BenefitRiskFactor[] = [
  { name: 'Nausea', weight: 1.0, score: 2.0 },
];

/** Risk factor producing QBRI just below 2 */
const MEDIUM_RISK: BenefitRiskFactor[] = [
  { name: 'Nausea', weight: 1.0, score: 6.0 },
];

/** Risk factor producing QBRI > 1 (marginal) */
const MODERATE_RISK: BenefitRiskFactor[] = [
  { name: 'Hepatotoxicity', weight: 1.0, score: 8.0 },
];

/** Large risk → QBRI < 1 (unfavorable) */
const HIGH_RISK: BenefitRiskFactor[] = [
  { name: 'Mortality Risk', weight: 1.0, score: 20.0 },
];

// ── Favorable (QBRI > 2.0) ────────────────────────────────────────────────────

describe('computeQbri — favorable profile (QBRI > 2.0)', () => {
  test('benefit total much larger than risk total produces favorable result', () => {
    // QBRI = 10 / 2 = 5.0 → favorable
    const result: QbriResult = computeQbri(SINGLE_BENEFIT, SMALL_RISK);

    expect(result.qbri).toBeCloseTo(5.0, 4);
    expect(result.category).toBe('favorable');
    expect(result.interpretation).toContain('Favorable');
  });

  test('QBRI > 2.0 yields favorable category', () => {
    const benefits: BenefitRiskFactor[] = [
      { name: 'Efficacy',   weight: 0.7, score: 8.0 },
      { name: 'QoL Gain',  weight: 0.3, score: 6.0 },
    ];
    const risks: BenefitRiskFactor[] = [
      { name: 'Nausea',    weight: 0.5, score: 2.0 },
      { name: 'Headache',  weight: 0.5, score: 1.0 },
    ];
    // benefitTotal = 0.7*8 + 0.3*6 = 5.6 + 1.8 = 7.4
    // riskTotal    = 0.5*2 + 0.5*1 = 1.0 + 0.5 = 1.5
    // QBRI = 7.4 / 1.5 ≈ 4.93 → favorable
    const result: QbriResult = computeQbri(benefits, risks);

    expect(result.qbri).toBeGreaterThan(2.0);
    expect(result.category).toBe('favorable');
  });

  test('benefitTotal and riskTotal are reported correctly', () => {
    // 10 / 2 = 5
    const result: QbriResult = computeQbri(SINGLE_BENEFIT, SMALL_RISK);

    expect(result.benefitTotal).toBeCloseTo(10.0, 4);
    expect(result.riskTotal).toBeCloseTo(2.0, 4);
  });
});

// ── Marginal (1.0 < QBRI <= 2.0) ─────────────────────────────────────────────

describe('computeQbri — marginal profile (1.0 < QBRI <= 2.0)', () => {
  test('benefit just above risk produces marginal result', () => {
    // QBRI = 10 / 6 ≈ 1.667 → marginal
    const result: QbriResult = computeQbri(SINGLE_BENEFIT, MEDIUM_RISK);

    expect(result.qbri).toBeGreaterThan(1.0);
    expect(result.qbri).toBeLessThanOrEqual(2.0);
    expect(result.category).toBe('marginal');
    expect(result.interpretation).toContain('Marginal');
  });

  test('QBRI just above 1.0 is marginal', () => {
    // benefit=1.01, risk=1.0 → QBRI=1.01
    const benefits: BenefitRiskFactor[] = [{ name: 'B', weight: 1.0, score: 1.01 }];
    const risks: BenefitRiskFactor[]    = [{ name: 'R', weight: 1.0, score: 1.0  }];
    const result: QbriResult = computeQbri(benefits, risks);

    expect(result.qbri).toBeCloseTo(1.01, 4);
    expect(result.category).toBe('marginal');
  });

  test('QBRI exactly 2.0 is marginal (> 2.0 is the favorable threshold)', () => {
    // benefit=2, risk=1 → QBRI=2.0, which is NOT > 2.0 → marginal
    const benefits: BenefitRiskFactor[] = [{ name: 'B', weight: 1.0, score: 2.0 }];
    const risks: BenefitRiskFactor[]    = [{ name: 'R', weight: 1.0, score: 1.0 }];
    const result: QbriResult = computeQbri(benefits, risks);

    expect(result.qbri).toBeCloseTo(2.0, 4);
    expect(result.category).toBe('marginal');
  });

  test('marginal result includes monitoring recommendation in interpretation', () => {
    const result: QbriResult = computeQbri(SINGLE_BENEFIT, MEDIUM_RISK);

    expect(result.interpretation).toContain('monitoring');
  });
});

// ── Unfavorable (QBRI <= 1.0) ─────────────────────────────────────────────────

describe('computeQbri — unfavorable profile (QBRI <= 1.0)', () => {
  test('risk much larger than benefit produces unfavorable result', () => {
    // QBRI = 10 / 20 = 0.5 → unfavorable
    const result: QbriResult = computeQbri(SINGLE_BENEFIT, HIGH_RISK);

    expect(result.qbri).toBeLessThan(1.0);
    expect(result.category).toBe('unfavorable');
    expect(result.interpretation).toContain('Unfavorable');
  });

  test('QBRI exactly 1.0 is unfavorable (not marginal)', () => {
    // benefit=5, risk=5 → QBRI=1.0, which is NOT > 1.0 → unfavorable
    const benefits: BenefitRiskFactor[] = [{ name: 'B', weight: 1.0, score: 5.0 }];
    const risks: BenefitRiskFactor[]    = [{ name: 'R', weight: 1.0, score: 5.0 }];
    const result: QbriResult = computeQbri(benefits, risks);

    expect(result.qbri).toBeCloseTo(1.0, 4);
    expect(result.category).toBe('unfavorable');
  });

  test('QBRI <= 0.5 is unfavorable', () => {
    // SINGLE_BENEFIT total=10, HIGH_RISK total=20 → QBRI = 10/20 = 0.5 → unfavorable
    const result: QbriResult = computeQbri(SINGLE_BENEFIT, HIGH_RISK);

    expect(result.qbri).toBeLessThanOrEqual(0.5);
    expect(result.category).toBe('unfavorable');
  });

  test('unfavorable interpretation mentions risk outweighs benefit', () => {
    const result: QbriResult = computeQbri(SINGLE_BENEFIT, HIGH_RISK);

    expect(result.interpretation.toLowerCase()).toContain('risk');
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('computeQbri — edge cases', () => {
  test('zero risk total produces Infinity QBRI (favorable)', () => {
    // riskTotal = 0 → QBRI = Infinity → favorable
    const benefits: BenefitRiskFactor[] = [{ name: 'Efficacy', weight: 1.0, score: 5.0 }];
    const risks: BenefitRiskFactor[]    = [{ name: 'None',     weight: 0.0, score: 0.0 }];
    const result: QbriResult = computeQbri(benefits, risks);

    expect(result.qbri).toBe(Infinity);
    expect(result.category).toBe('favorable');
    expect(result.riskTotal).toBeCloseTo(0, 4);
  });

  test('empty risk array produces Infinity QBRI (favorable)', () => {
    const benefits: BenefitRiskFactor[] = [{ name: 'Efficacy', weight: 1.0, score: 5.0 }];
    const result: QbriResult = computeQbri(benefits, []);

    expect(result.qbri).toBe(Infinity);
    expect(result.category).toBe('favorable');
  });

  test('empty benefits array produces QBRI = 0 (unfavorable)', () => {
    // benefitTotal = 0, riskTotal > 0 → QBRI = 0/riskTotal = 0 → unfavorable
    const risks: BenefitRiskFactor[] = [{ name: 'Nausea', weight: 1.0, score: 3.0 }];
    const result: QbriResult = computeQbri([], risks);

    expect(result.qbri).toBeCloseTo(0, 4);
    expect(result.category).toBe('unfavorable');
    expect(result.benefitTotal).toBeCloseTo(0, 4);
  });

  test('both empty arrays produce QBRI = Infinity (zero risk → favorable)', () => {
    // benefitTotal = 0, riskTotal = 0 → 0/0... but code returns Infinity when riskTotal=0
    const result: QbriResult = computeQbri([], []);

    expect(result.qbri).toBe(Infinity);
    expect(result.category).toBe('favorable');
  });

  test('single factor each: weight * score accumulates correctly', () => {
    const benefits: BenefitRiskFactor[] = [{ name: 'B', weight: 3.0, score: 4.0 }];
    const risks: BenefitRiskFactor[]    = [{ name: 'R', weight: 2.0, score: 3.0 }];
    // benefitTotal = 12, riskTotal = 6, QBRI = 2.0 → marginal
    const result: QbriResult = computeQbri(benefits, risks);

    expect(result.benefitTotal).toBeCloseTo(12.0, 4);
    expect(result.riskTotal).toBeCloseTo(6.0, 4);
    expect(result.qbri).toBeCloseTo(2.0, 4);
    expect(result.category).toBe('marginal');
  });
});

// ── Multiple factors ──────────────────────────────────────────────────────────

describe('computeQbri — multiple weighted factors', () => {
  test('correctly sums multiple benefit factors', () => {
    const benefits: BenefitRiskFactor[] = [
      { name: 'Survival Benefit', weight: 0.6, score: 9.0 },
      { name: 'QoL Improvement',  weight: 0.4, score: 7.0 },
    ];
    const risks: BenefitRiskFactor[] = [
      { name: 'Nausea',          weight: 0.5, score: 3.0 },
      { name: 'Fatigue',         weight: 0.5, score: 2.0 },
    ];
    // benefitTotal = 0.6*9 + 0.4*7 = 5.4 + 2.8 = 8.2
    // riskTotal    = 0.5*3 + 0.5*2 = 1.5 + 1.0 = 2.5
    // QBRI = 8.2 / 2.5 = 3.28 → favorable
    const result: QbriResult = computeQbri(benefits, risks);

    expect(result.benefitTotal).toBeCloseTo(8.2, 4);
    expect(result.riskTotal).toBeCloseTo(2.5, 4);
    expect(result.qbri).toBeCloseTo(3.28, 4);
    expect(result.category).toBe('favorable');
  });

  test('result always has all required fields', () => {
    const result: QbriResult = computeQbri(SINGLE_BENEFIT, SMALL_RISK);

    expect(result).toHaveProperty('qbri');
    expect(result).toHaveProperty('benefitTotal');
    expect(result).toHaveProperty('riskTotal');
    expect(result).toHaveProperty('interpretation');
    expect(result).toHaveProperty('category');
  });

  test('QBRI formula: benefitTotal / riskTotal', () => {
    const benefits: BenefitRiskFactor[] = [{ name: 'B', weight: 2.0, score: 5.0 }];
    const risks: BenefitRiskFactor[]    = [{ name: 'R', weight: 1.0, score: 3.0 }];
    const result: QbriResult = computeQbri(benefits, risks);

    // benefitTotal = 10, riskTotal = 3, QBRI = 10/3 ≈ 3.333
    expect(result.qbri).toBeCloseTo(result.benefitTotal / result.riskTotal, 4);
  });
});
