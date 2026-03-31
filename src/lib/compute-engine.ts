/**
 * Deterministic Rust Computation Engine.
 *
 * Every PV, epidemiological, and scientific computation flows:
 *   Browser -> REST gateway -> Rust -> Display
 * with TypeScript as independent verification/fallback.
 *
 * Kill switch: NEXT_PUBLIC_RUST_COMPUTE=disabled
 *
 * T1 primitives: →(Causality) + κ(Comparison) + ∂(Boundary) + π(Persistence)
 */

import { nexcore } from '@/lib/nexcore-client';
import { compareResults } from '@/lib/compute-compare';
import { logger } from '@/lib/logger';

const log = logger.scope('compute-engine');

// ── Types ────────────────────────────────────────────────────────────────────

export interface ComputeMeta {
  /** Which engine produced the primary result */
  engine: 'rust' | 'typescript-fallback';
  /** Time to compute (ms) */
  durationMs: number;
  /** Verification status */
  verification: 'match' | 'divergence' | 'skipped' | 'ts-only';
  /** Divergence detail if any */
  divergenceDetail?: string;
}

export interface ComputeResult<T> {
  data: T;
  _meta: ComputeMeta;
}

interface ComputeWithRustOptions<TInput, TOutput> {
  /** Proxy route (e.g. '/api/nexcore/signal') */
  route: string;
  /** Request body to send to Rust */
  rustInput: Record<string, unknown>;
  /** TypeScript fallback computation */
  tsFallback: (input: TInput) => TOutput;
  /** Original input for TS fallback */
  tsInput: TInput;
  /** Numeric fields to compare between Rust and TS results */
  compareFields: string[];
  /** Relative tolerance for numeric comparison (default 1e-4) */
  rtol?: number;
  /** Label for logging */
  label: string;
}

interface ComputeMethodDispatchOptions<TInput, TOutput> {
  /** Proxy route (e.g. '/api/nexcore/epi') */
  route: string;
  /** Method name for dispatch */
  method: string;
  /** Request params to send to Rust */
  rustParams: Record<string, unknown>;
  /** TypeScript fallback computation */
  tsFallback: (input: TInput) => TOutput;
  /** Original input for TS fallback */
  tsInput: TInput;
  /** Numeric fields to compare between Rust and TS results */
  compareFields: string[];
  /** Relative tolerance for numeric comparison (default 1e-4) */
  rtol?: number;
  /** Label for logging */
  label: string;
}

// ── Kill Switch ──────────────────────────────────────────────────────────────

function isRustEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return process.env.NEXT_PUBLIC_RUST_COMPUTE !== 'disabled';
}

// ── MCP Response Unwrapping ──────────────────────────────────────────────────

/**
 * Extract data from MCP bridge response.
 * MCP tools return { content: [{ type: 'text', text: '...' }] }
 * The text field contains JSON-serialized result.
 */
function extractMcpResult<T>(response: Record<string, unknown>): T {
  // Direct result (dedicated REST endpoints like /api/v1/pv/signal/complete)
  if (!('content' in response)) return response as T;

  const content = response.content;
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error('Empty MCP response content');
  }

  const first = content[0] as Record<string, unknown>;
  if (typeof first.text !== 'string') {
    throw new Error('MCP response missing text field');
  }

  return JSON.parse(first.text) as T;
}

// ── Core Engine ──────────────────────────────────────────────────────────────

/**
 * Execute computation via Rust (primary) with TS verification fallback.
 * Falls back to TS if Rust is unreachable or disabled.
 */
export async function computeWithRust<TInput, TOutput>(
  opts: ComputeWithRustOptions<TInput, TOutput>,
): Promise<ComputeResult<TOutput>> {
  const start = performance.now();

  // Kill switch: TS only
  if (!isRustEnabled()) {
    const tsResult = opts.tsFallback(opts.tsInput);
    return {
      data: tsResult,
      _meta: {
        engine: 'typescript-fallback',
        durationMs: Math.round(performance.now() - start),
        verification: 'ts-only',
      },
    };
  }

  try {
    // Run Rust primary + TS verification in parallel
    const [rustRaw, tsResult] = await Promise.all([
      nexcore.post<Record<string, unknown>>(opts.route, opts.rustInput),
      Promise.resolve(opts.tsFallback(opts.tsInput)),
    ]);

    const rustResult = extractMcpResult<TOutput>(rustRaw);
    const durationMs = Math.round(performance.now() - start);

    // Compare results
    const divergence = compareResults(
      rustResult as Record<string, unknown>,
      tsResult as Record<string, unknown>,
      opts.compareFields,
      opts.rtol ?? 1e-4,
    );

    if (divergence) {
      log.warn(`Computation divergence detected [${opts.label}]: ${divergence}`);
    }

    return {
      data: rustResult,
      _meta: {
        engine: 'rust',
        durationMs,
        verification: divergence ? 'divergence' : 'match',
        divergenceDetail: divergence ?? undefined,
      },
    };
  } catch (err) {
    // Rust unavailable — fall back to TS
    const tsResult = opts.tsFallback(opts.tsInput);
    const durationMs = Math.round(performance.now() - start);

    log.warn(`Rust compute failed [${opts.label}], using TS fallback:`, err);

    return {
      data: tsResult,
      _meta: {
        engine: 'typescript-fallback',
        durationMs,
        verification: 'skipped',
      },
    };
  }
}

/**
 * Execute computation via method-dispatch pattern.
 * Used for routes that multiplex multiple tools (e.g. /api/nexcore/epi).
 */
export async function computeWithRustDispatch<TInput, TOutput>(
  opts: ComputeMethodDispatchOptions<TInput, TOutput>,
): Promise<ComputeResult<TOutput>> {
  const start = performance.now();

  // Kill switch: TS only
  if (!isRustEnabled()) {
    const tsResult = opts.tsFallback(opts.tsInput);
    return {
      data: tsResult,
      _meta: {
        engine: 'typescript-fallback',
        durationMs: Math.round(performance.now() - start),
        verification: 'ts-only',
      },
    };
  }

  try {
    // Run Rust primary + TS verification in parallel
    const [rustRaw, tsResult] = await Promise.all([
      nexcore.dispatch<Record<string, unknown>>(opts.route, opts.method, opts.rustParams),
      Promise.resolve(opts.tsFallback(opts.tsInput)),
    ]);

    const rustResult = extractMcpResult<TOutput>(rustRaw);
    const durationMs = Math.round(performance.now() - start);

    // Compare results
    const divergence = compareResults(
      rustResult as Record<string, unknown>,
      tsResult as Record<string, unknown>,
      opts.compareFields,
      opts.rtol ?? 1e-4,
    );

    if (divergence) {
      log.warn(`Computation divergence detected [${opts.label}]: ${divergence}`);
    }

    return {
      data: rustResult,
      _meta: {
        engine: 'rust',
        durationMs,
        verification: divergence ? 'divergence' : 'match',
        divergenceDetail: divergence ?? undefined,
      },
    };
  } catch (err) {
    // Rust unavailable — fall back to TS
    const tsResult = opts.tsFallback(opts.tsInput);
    const durationMs = Math.round(performance.now() - start);

    log.warn(`Rust compute failed [${opts.label}], using TS fallback:`, err);

    return {
      data: tsResult,
      _meta: {
        engine: 'typescript-fallback',
        durationMs,
        verification: 'skipped',
      },
    };
  }
}
