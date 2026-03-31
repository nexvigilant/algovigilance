/**
 * Integration tests for compute-engine dual-engine (Rust primary + TS fallback).
 *
 * Validates:
 *   1. TS fallback triggers when fetch (Rust) is unreachable
 *   2. ComputeResult<T> wrapper shape (data + _meta)
 *   3. Rust engine returns 'rust' engine tag when available
 *   4. Divergence detection between Rust and TS results
 *   5. Kill switch (NEXT_PUBLIC_RUST_COMPUTE=disabled) forces TS-only
 *   6. All 3 compute modules work through the async path
 *
 * T1 primitives: ∂(Boundary) + κ(Comparison) + →(Causality)
 */

import { computeSignals } from '../signal-detection';
import { computeNaranjo, computeWhoUmc } from '../causality';
import { computeQbri } from '../benefit-risk';
import type { ContingencyTable } from '../signal-detection';
import type { WhoUmcInput } from '../causality';
import type { BenefitRiskFactor } from '../benefit-risk';

// ── Fixtures ────────────────────────────────────────────────────────────────

const SIGNAL_TABLE: ContingencyTable = { a: 150, b: 50, c: 100, d: 10000 };
const NARANJO_ANSWERS = [1, 1, 1, 1, -1, -1, 1, 1, 1, 1]; // Definite (score=13)
const WHO_INPUT: WhoUmcInput = {
  temporal: 'reasonable',
  dechallenge: 'positive',
  rechallenge: 'positive',
  alternatives: 'unlikely',
};
const BENEFITS: BenefitRiskFactor[] = [{ name: 'Efficacy', weight: 1.0, score: 10.0 }];
const RISKS: BenefitRiskFactor[] = [{ name: 'Nausea', weight: 1.0, score: 2.0 }];

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Save and restore env var */
function withEnv(key: string, value: string | undefined, fn: () => Promise<void>) {
  return async () => {
    const original = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
    try {
      await fn();
    } finally {
      if (original === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original;
      }
    }
  };
}

// ── ComputeResult shape (fallback path) ─────────────────────────────────────
//
// In test environment, fetch is not defined → Rust call fails → TS fallback.
// This validates the fallback path produces correct ComputeResult shape.

describe('compute-engine fallback path (no fetch)', () => {
  test('computeSignals returns ComputeResult with _meta', async () => {
    const result = await computeSignals(SIGNAL_TABLE);

    // Shape check: data + _meta
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('_meta');
    expect(result._meta).toHaveProperty('engine');
    expect(result._meta).toHaveProperty('durationMs');
    expect(result._meta).toHaveProperty('verification');
  });

  test('fallback engine is typescript-fallback', async () => {
    const result = await computeSignals(SIGNAL_TABLE);

    expect(result._meta.engine).toBe('typescript-fallback');
  });

  test('fallback verification is skipped', async () => {
    const result = await computeSignals(SIGNAL_TABLE);

    expect(result._meta.verification).toBe('skipped');
  });

  test('fallback durationMs is a non-negative number', async () => {
    const result = await computeSignals(SIGNAL_TABLE);

    expect(typeof result._meta.durationMs).toBe('number');
    expect(result._meta.durationMs).toBeGreaterThanOrEqual(0);
  });

  test('data contains correct signal detection results', async () => {
    const result = await computeSignals(SIGNAL_TABLE);
    const { data } = result;

    // PRR = [150/200] / [100/10100] ≈ 75.75
    expect(typeof data.prr).toBe('number');
    expect(data.prr).toBeGreaterThan(2.0);
    expect(data.prr_signal).toBe(true);
  });
});

// ── All 3 modules through async path ────────────────────────────────────────

describe('all compute modules via async dual-engine', () => {
  test('computeSignals async returns correct data shape', async () => {
    const result = await computeSignals(SIGNAL_TABLE);

    expect(typeof result.data.prr).toBe('number');
    expect(typeof result.data.ror).toBe('number');
    expect(typeof result.data.ror_lower).toBe('number');
    expect(typeof result.data.ror_upper).toBe('number');
    expect(typeof result.data.ic).toBe('number');
    expect(typeof result.data.ic025).toBe('number');
    expect(typeof result.data.ebgm).toBe('number');
    expect(typeof result.data.eb05).toBe('number');
    expect(typeof result.data.chi_square).toBe('number');
    expect(typeof result.data.prr_signal).toBe('boolean');
    expect(typeof result.data.ror_signal).toBe('boolean');
    expect(typeof result.data.ic_signal).toBe('boolean');
    expect(typeof result.data.ebgm_signal).toBe('boolean');
    expect(typeof result.data.chi_signal).toBe('boolean');
    expect(typeof result.data.any_signal).toBe('boolean');
  });

  test('computeNaranjo async returns correct data shape', async () => {
    const result = await computeNaranjo(NARANJO_ANSWERS);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('_meta');
    expect(typeof result.data.score).toBe('number');
    expect(result.data.score).toBe(13);
    expect(result.data.category).toBe('Definite');
    expect(result._meta.engine).toBe('typescript-fallback');
  });

  test('computeWhoUmc async returns correct data shape', async () => {
    const result = await computeWhoUmc(WHO_INPUT);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('_meta');
    expect(typeof result.data.category).toBe('string');
    expect(result.data.category).toBe('Certain');
    expect(typeof result.data.description).toBe('string');
    expect(result._meta.engine).toBe('typescript-fallback');
  });

  test('computeQbri async returns correct data shape', async () => {
    const result = await computeQbri(BENEFITS, RISKS);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('_meta');
    expect(typeof result.data.qbri).toBe('number');
    expect(result.data.qbri).toBeCloseTo(5.0, 4);
    expect(result.data.category).toBe('favorable');
    expect(result._meta.engine).toBe('typescript-fallback');
  });
});

// ── Kill switch ─────────────────────────────────────────────────────────────

describe('kill switch (NEXT_PUBLIC_RUST_COMPUTE=disabled)', () => {
  test(
    'forces ts-only verification mode',
    withEnv('NEXT_PUBLIC_RUST_COMPUTE', 'disabled', async () => {
      const result = await computeSignals(SIGNAL_TABLE);

      expect(result._meta.engine).toBe('typescript-fallback');
      expect(result._meta.verification).toBe('ts-only');
    }),
  );

  test(
    'still produces correct computation results',
    withEnv('NEXT_PUBLIC_RUST_COMPUTE', 'disabled', async () => {
      const result = await computeSignals(SIGNAL_TABLE);

      expect(result.data.prr).toBeGreaterThan(2.0);
      expect(result.data.prr_signal).toBe(true);
    }),
  );

  test(
    'no divergenceDetail when kill switch active',
    withEnv('NEXT_PUBLIC_RUST_COMPUTE', 'disabled', async () => {
      const result = await computeSignals(SIGNAL_TABLE);

      expect(result._meta.divergenceDetail).toBeUndefined();
    }),
  );
});

// ── Mocked nexcore: Rust engine path ────────────────────────────────────────
//
// We mock at the nexcore-client module boundary since that's the real
// integration point. The compute-engine calls nexcore.post() which calls fetch.

// Use jest.mock with dynamic factory for nexcore-client
const mockPost = jest.fn();
jest.mock('@/lib/nexcore-client', () => ({
  nexcore: {
    post: (...args: unknown[]) => mockPost(...args),
    dispatch: (...args: unknown[]) => mockPost(...args),
  },
}));

// Re-import after mock is set up — use require to get the mocked version
const { computeSignals: computeSignalsMocked } = require('../signal-detection') as {
  computeSignals: typeof computeSignals;
};

describe('rust engine path (mocked nexcore)', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  test('returns rust engine when nexcore.post succeeds with matching data', async () => {
    const { computeSignalsSync } = await import('../signal-detection');
    const tsResult = computeSignalsSync(SIGNAL_TABLE);

    // Mock nexcore.post to return TS-matching values (direct response, no MCP envelope)
    mockPost.mockResolvedValueOnce(tsResult);

    const result = await computeSignalsMocked(SIGNAL_TABLE);

    expect(result._meta.engine).toBe('rust');
    expect(result._meta.verification).toBe('match');
    expect(typeof result.data.prr).toBe('number');
  });

  test('detects divergence when Rust and TS results differ', async () => {
    // Mock nexcore.post to return deliberately different PRR
    const { computeSignalsSync } = await import('../signal-detection');
    const tsResult = computeSignalsSync(SIGNAL_TABLE);
    const divergentResult = { ...tsResult, prr: 999.0 };

    mockPost.mockResolvedValueOnce(divergentResult);

    const result = await computeSignalsMocked(SIGNAL_TABLE);

    expect(result._meta.engine).toBe('rust');
    expect(result._meta.verification).toBe('divergence');
    expect(result._meta.divergenceDetail).toContain('prr');
  });

  test('reports match when Rust and TS agree within tolerance', async () => {
    const { computeSignalsSync } = await import('../signal-detection');
    const tsResult = computeSignalsSync(SIGNAL_TABLE);

    mockPost.mockResolvedValueOnce({ ...tsResult });

    const result = await computeSignalsMocked(SIGNAL_TABLE);

    expect(result._meta.engine).toBe('rust');
    expect(result._meta.verification).toBe('match');
    expect(result._meta.divergenceDetail).toBeUndefined();
  });

  test('falls back to TS when nexcore.post throws', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network unreachable'));

    const result = await computeSignalsMocked(SIGNAL_TABLE);

    expect(result._meta.engine).toBe('typescript-fallback');
    expect(result._meta.verification).toBe('skipped');
    // Data should still be correct from TS fallback
    expect(result.data.prr).toBeGreaterThan(2.0);
  });
});

// ── MCP response unwrapping ─────────────────────────────────────────────────

describe('MCP response format handling', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  test('unwraps MCP content[0].text JSON envelope', async () => {
    const { computeSignalsSync } = await import('../signal-detection');
    const tsResult = computeSignalsSync(SIGNAL_TABLE);

    // MCP format: { content: [{ type: 'text', text: JSON.stringify(result) }] }
    const mcpResponse = {
      content: [{ type: 'text', text: JSON.stringify(tsResult) }],
    };

    mockPost.mockResolvedValueOnce(mcpResponse);

    const result = await computeSignalsMocked(SIGNAL_TABLE);

    expect(result._meta.engine).toBe('rust');
    expect(result.data.prr).toBeCloseTo(tsResult.prr, 4);
  });
});
