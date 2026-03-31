/**
 * Tests for pv-compute/signal-detection.ts
 *
 * Covers all 5 disproportionality algorithms:
 *   PRR (Proportional Reporting Ratio)
 *   ROR (Reporting Odds Ratio) with 95% CI
 *   IC / IC025 (Information Component)
 *   EBGM / EB05 (Empirical Bayes Geometric Mean)
 *   Chi-Square with Yates correction
 *
 * Reference thresholds per CLAUDE.md:
 *   PRR >= 2.0, ROR lower CI > 1.0, IC025 > 0, EB05 >= 2.0, chi-sq >= 3.841
 */

import { computeSignals } from '../signal-detection';
import type { ContingencyTable, SignalResult } from '../signal-detection';

// ── Fixtures ────────────────────────────────────────────────────────────────

const STRONG_SIGNAL: ContingencyTable = { a: 150, b: 50, c: 100, d: 10000 };
const NO_SIGNAL: ContingencyTable    = { a: 10,  b: 500, c: 200, d: 10000 };
const MODERATE: ContingencyTable     = { a: 50,  b: 100, c: 200, d: 5000  };

// ── computeSignals — return shape ───────────────────────────────────────────

describe('computeSignals return shape', () => {
  test('returns all required numeric fields', () => {
    const result: SignalResult = computeSignals(STRONG_SIGNAL);

    expect(typeof result.prr).toBe('number');
    expect(typeof result.ror).toBe('number');
    expect(typeof result.ror_lower).toBe('number');
    expect(typeof result.ror_upper).toBe('number');
    expect(typeof result.ic).toBe('number');
    expect(typeof result.ic025).toBe('number');
    expect(typeof result.ebgm).toBe('number');
    expect(typeof result.eb05).toBe('number');
    expect(typeof result.chi_square).toBe('number');
  });

  test('returns all required boolean signal flags', () => {
    const result: SignalResult = computeSignals(STRONG_SIGNAL);

    expect(typeof result.prr_signal).toBe('boolean');
    expect(typeof result.ror_signal).toBe('boolean');
    expect(typeof result.ic_signal).toBe('boolean');
    expect(typeof result.ebgm_signal).toBe('boolean');
    expect(typeof result.chi_signal).toBe('boolean');
    expect(typeof result.any_signal).toBe('boolean');
  });
});

// ── PRR ─────────────────────────────────────────────────────────────────────

describe('PRR (Proportional Reporting Ratio)', () => {
  test('strong signal table produces PRR well above 2.0', () => {
    // PRR = [150/200] / [100/10100] = 0.75 / ~0.009901 ≈ 75.75
    const { prr, prr_signal } = computeSignals(STRONG_SIGNAL);

    expect(prr).toBeGreaterThan(2.0);
    expect(prr_signal).toBe(true);
  });

  test('no-signal table produces PRR at or below threshold', () => {
    // PRR = [10/510] / [200/10200] ≈ 1.0
    const { prr, prr_signal } = computeSignals(NO_SIGNAL);

    expect(prr).toBeLessThan(2.0);
    expect(prr_signal).toBe(false);
  });

  test('PRR formula matches [a/(a+b)] / [c/(c+d)]', () => {
    const t = STRONG_SIGNAL;
    const expected = (t.a / (t.a + t.b)) / (t.c / (t.c + t.d));
    const { prr } = computeSignals(t);

    expect(prr).toBeCloseTo(expected, 4);
  });

  test('zero control rate (c>0, d=0) produces Infinity PRR', () => {
    // c/(c+d) where c=1, d=0 → otherRate = 1/1 = 1, not zero path
    // To get otherRate===0 we need c=0 with d>0: c/(c+d) = 0/(d) = 0 → Infinity
    const t: ContingencyTable = { a: 10, b: 5, c: 0, d: 1000 };
    const { prr } = computeSignals(t);

    expect(prr).toBe(Infinity);
  });

  test('PRR is exactly 1.0 when drug and background rates are equal', () => {
    // a/(a+b) == c/(c+d): a=100, b=100, c=100, d=100
    const t: ContingencyTable = { a: 100, b: 100, c: 100, d: 100 };
    const { prr } = computeSignals(t);

    expect(prr).toBeCloseTo(1.0, 4);
  });
});

// ── ROR ─────────────────────────────────────────────────────────────────────

describe('ROR (Reporting Odds Ratio)', () => {
  test('strong signal table produces ROR lower CI well above 1.0', () => {
    // ROR = (150*10000)/(50*100) = 300
    const { ror, ror_lower, ror_upper, ror_signal } = computeSignals(STRONG_SIGNAL);

    expect(ror).toBeGreaterThan(1.0);
    expect(ror_lower).toBeGreaterThan(1.0);
    expect(ror_upper).toBeGreaterThan(ror_lower);
    expect(ror_signal).toBe(true);
  });

  test('no-signal table produces ROR lower CI at or below 1.0', () => {
    const { ror_lower, ror_signal } = computeSignals(NO_SIGNAL);

    expect(ror_lower).toBeLessThanOrEqual(1.0);
    expect(ror_signal).toBe(false);
  });

  test('ROR formula matches (a*d)/(b*c)', () => {
    const t = STRONG_SIGNAL;
    const expected = (t.a * t.d) / (t.b * t.c);
    const { ror } = computeSignals(t);

    expect(ror).toBeCloseTo(expected, 4);
  });

  test('b*c=0 produces Infinity ROR', () => {
    // b=0 → b*c = 0 → guard returns Infinity
    const t: ContingencyTable = { a: 10, b: 0, c: 50, d: 1000 };
    const { ror, ror_lower, ror_upper } = computeSignals(t);

    expect(ror).toBe(Infinity);
    expect(ror_lower).toBe(Infinity);
    expect(ror_upper).toBe(Infinity);
  });

  test('upper CI is always >= lower CI', () => {
    const { ror_lower, ror_upper } = computeSignals(MODERATE);

    expect(ror_upper).toBeGreaterThanOrEqual(ror_lower);
  });
});

// ── IC / IC025 ───────────────────────────────────────────────────────────────

describe('IC and IC025 (Information Component)', () => {
  test('strong signal table produces IC025 well above 0', () => {
    const { ic, ic025, ic_signal } = computeSignals(STRONG_SIGNAL);

    expect(ic).toBeGreaterThan(0);
    expect(ic025).toBeGreaterThan(0);
    expect(ic_signal).toBe(true);
  });

  test('no-signal table produces IC025 at or below 0', () => {
    const { ic025, ic_signal } = computeSignals(NO_SIGNAL);

    expect(ic025).toBeLessThanOrEqual(0);
    expect(ic_signal).toBe(false);
  });

  test('IC025 is always <= IC (conservative lower bound)', () => {
    const { ic, ic025 } = computeSignals(STRONG_SIGNAL);

    expect(ic025).toBeLessThanOrEqual(ic);
  });

  test('IC025 is always <= IC for no-signal table', () => {
    const { ic, ic025 } = computeSignals(NO_SIGNAL);

    expect(ic025).toBeLessThanOrEqual(ic);
  });

  test('zero expected count (a+b=0 handled by guard, c+d=0 path) produces Infinity IC', () => {
    // (a+b)*(a+c)/N: if a+b=0, guard throws; if c+d=0 AND a+b>0 then expected>0
    // To get expected=0: need (a+b)=0 — but that throws. So test c=0, d=0 → expected=(a+b)*a/N
    // Actually: if a=0,c=0 → expected=0 → Infinity
    const t: ContingencyTable = { a: 0, b: 10, c: 0, d: 100 };
    const { ic } = computeSignals(t);

    // ic = log2(0/0) or log2(0/expected) — expected ≠ 0 here since a+b=10,a+c=0 → expected=0
    expect(ic).toBe(Infinity);
  });
});

// ── EBGM / EB05 ─────────────────────────────────────────────────────────────

describe('EBGM and EB05 (Empirical Bayes Geometric Mean)', () => {
  test('strong signal table produces EB05 >= 2.0', () => {
    const { ebgm, eb05, ebgm_signal } = computeSignals(STRONG_SIGNAL);

    expect(ebgm).toBeGreaterThan(0);
    expect(eb05).toBeGreaterThan(0);
    expect(eb05).toBeGreaterThanOrEqual(2.0);
    expect(ebgm_signal).toBe(true);
  });

  test('no-signal table produces EB05 below 2.0', () => {
    const { eb05, ebgm_signal } = computeSignals(NO_SIGNAL);

    expect(eb05).toBeLessThan(2.0);
    expect(ebgm_signal).toBe(false);
  });

  test('EB05 is always <= EBGM (conservative lower bound)', () => {
    const { ebgm, eb05 } = computeSignals(STRONG_SIGNAL);

    expect(eb05).toBeLessThanOrEqual(ebgm);
  });

  test('EB05 is always <= EBGM for no-signal table', () => {
    const { ebgm, eb05 } = computeSignals(NO_SIGNAL);

    expect(eb05).toBeLessThanOrEqual(ebgm);
  });
});

// ── Chi-Square ───────────────────────────────────────────────────────────────

describe('Chi-Square (Yates corrected)', () => {
  test('strong signal table produces chi-square >= 3.841', () => {
    const { chi_square, chi_signal } = computeSignals(STRONG_SIGNAL);

    expect(chi_square).toBeGreaterThanOrEqual(3.841);
    expect(chi_signal).toBe(true);
  });

  test('no-signal table produces chi-square below 3.841', () => {
    const { chi_square, chi_signal } = computeSignals(NO_SIGNAL);

    expect(chi_square).toBeLessThan(3.841);
    expect(chi_signal).toBe(false);
  });

  test('chi-square threshold 3.841 is the exact signal boundary (p < 0.05, df=1)', () => {
    // Verify the threshold is encoded correctly
    const strong = computeSignals(STRONG_SIGNAL);
    const noSig  = computeSignals(NO_SIGNAL);

    expect(strong.chi_signal).toBe(strong.chi_square >= 3.841);
    expect(noSig.chi_signal).toBe(noSig.chi_square >= 3.841);
  });

  test('zero marginals (all same drug column) produce chi-square of 0', () => {
    // denom = (a+b)*(c+d)*(a+c)*(b+d): if c+d=0 → denom=0 → returns 0
    const t: ContingencyTable = { a: 10, b: 5, c: 0, d: 0 };
    const { chi_square } = computeSignals(t);

    expect(chi_square).toBe(0);
  });
});

// ── any_signal aggregation ───────────────────────────────────────────────────

describe('any_signal aggregation', () => {
  test('any_signal is true when all individual signals are true', () => {
    const result = computeSignals(STRONG_SIGNAL);

    expect(result.any_signal).toBe(true);
    // Verify it equals the OR of all individual signals
    const expected = result.prr_signal || result.ror_signal || result.ic_signal
      || result.ebgm_signal || result.chi_signal;
    expect(result.any_signal).toBe(expected);
  });

  test('any_signal is false when all individual signals are false', () => {
    const result = computeSignals(NO_SIGNAL);

    expect(result.prr_signal).toBe(false);
    expect(result.ror_signal).toBe(false);
    expect(result.ic_signal).toBe(false);
    expect(result.chi_signal).toBe(false);
    expect(result.any_signal).toBe(false);
  });

  test('any_signal is true when at least one algorithm signals', () => {
    // Table with b*c=0 → ROR=Infinity → ror_signal=true regardless of other algorithms
    const t: ContingencyTable = { a: 1, b: 0, c: 500, d: 5000 };
    const result = computeSignals(t);

    // ror_lower = Infinity > 1.0 → ror_signal = true
    expect(result.ror_signal).toBe(true);
    expect(result.any_signal).toBe(true);
  });

  test('any_signal matches logical OR of all individual flags', () => {
    for (const table of [STRONG_SIGNAL, NO_SIGNAL, MODERATE]) {
      const r = computeSignals(table);
      const manual = r.prr_signal || r.ror_signal || r.ic_signal || r.ebgm_signal || r.chi_signal;
      expect(r.any_signal).toBe(manual);
    }
  });
});

// ── Guards ───────────────────────────────────────────────────────────────────

describe('input guards', () => {
  test('negative a throws Error', () => {
    expect(() => computeSignals({ a: -1, b: 10, c: 10, d: 100 }))
      .toThrow('non-negative');
  });

  test('negative b throws Error', () => {
    expect(() => computeSignals({ a: 10, b: -1, c: 10, d: 100 }))
      .toThrow('non-negative');
  });

  test('negative c throws Error', () => {
    expect(() => computeSignals({ a: 10, b: 10, c: -5, d: 100 }))
      .toThrow('non-negative');
  });

  test('negative d throws Error', () => {
    expect(() => computeSignals({ a: 10, b: 10, c: 10, d: -1 }))
      .toThrow('non-negative');
  });

  test('a + b = 0 throws Error (empty drug group)', () => {
    expect(() => computeSignals({ a: 0, b: 0, c: 100, d: 5000 }))
      .toThrow('empty');
  });

  test('does not throw when only a=0 but b>0', () => {
    // a+b = b > 0 — valid, no throw
    expect(() => computeSignals({ a: 0, b: 10, c: 50, d: 1000 }))
      .not.toThrow();
  });

  test('does not throw with all-zero c and d', () => {
    // a+b > 0 is the only guard — c=d=0 is not blocked
    expect(() => computeSignals({ a: 5, b: 5, c: 0, d: 0 }))
      .not.toThrow();
  });
});

// ── Moderate signal case ──────────────────────────────────────────────────────

describe('moderate signal case', () => {
  test('moderate table produces positive prr', () => {
    // a=50, b=100, c=200, d=5000
    // PRR = [50/150] / [200/5200] ≈ 0.333 / 0.0385 ≈ 8.67 > 2.0 → signal
    const { prr, prr_signal } = computeSignals(MODERATE);

    expect(prr).toBeGreaterThan(2.0);
    expect(prr_signal).toBe(true);
  });

  test('any_signal reflects combined algorithm results for moderate table', () => {
    const result = computeSignals(MODERATE);
    const manual = result.prr_signal || result.ror_signal || result.ic_signal
      || result.ebgm_signal || result.chi_signal;

    expect(result.any_signal).toBe(manual);
  });
});
