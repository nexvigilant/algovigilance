'use client';

/**
 * Client-Side Circuit Breaker Hook
 *
 * Engineering source: Williams 1909, Ch 10 — Vacuum brakes, safety valves
 * T1 Primitives: ∂(Boundary) + ς(State) + ν(Frequency)
 *
 * Principle: After N failures in window T, stop trying and fail fast.
 * Auto-reset after cooldown. Three states:
 *   - Closed: requests flow through normally
 *   - Open: all requests rejected instantly (fail-fast)
 *   - HalfOpen: allow one probe request to test recovery
 *
 * @example
 * ```tsx
 * const breaker = useCircuitBreaker({ failureThreshold: 3, cooldownMs: 30000 });
 *
 * async function fetchData() {
 *   if (!breaker.canRequest) {
 *     return { error: 'Service unavailable — circuit open' };
 *   }
 *   try {
 *     const result = await fetch('/api/data');
 *     breaker.recordSuccess();
 *     return result;
 *   } catch (err) {
 *     breaker.recordFailure();
 *     throw err;
 *   }
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  /** Number of failures before circuit opens (default: 5) */
  failureThreshold?: number;
  /** Time in ms before circuit transitions from open to half-open (default: 30000) */
  cooldownMs?: number;
  /** Time window in ms to count failures (default: 60000). Failures outside the window are pruned. */
  failureWindowMs?: number;
}

export interface CircuitBreakerState {
  /** Current circuit state */
  state: CircuitState;
  /** Whether a request can be made (closed or half-open) */
  canRequest: boolean;
  /** Number of failures in the current window */
  failureCount: number;
  /** Record a successful request */
  recordSuccess: () => void;
  /** Record a failed request */
  recordFailure: () => void;
  /** Manually reset the circuit to closed */
  reset: () => void;
  /** Time remaining until circuit transitions to half-open (0 if not open) */
  cooldownRemaining: number;
}

// ── Constants ──────────────────────────────────────────────────────────

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_COOLDOWN_MS = 30_000;
const DEFAULT_FAILURE_WINDOW_MS = 60_000;

// ── Hook ───────────────────────────────────────────────────────────────

export function useCircuitBreaker(
  config: CircuitBreakerConfig = {}
): CircuitBreakerState {
  const {
    failureThreshold = DEFAULT_FAILURE_THRESHOLD,
    cooldownMs = DEFAULT_COOLDOWN_MS,
    failureWindowMs = DEFAULT_FAILURE_WINDOW_MS,
  } = config;

  const [state, setState] = useState<CircuitState>('closed');
  const [failureCount, setFailureCount] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Track failure timestamps for windowed counting
  const failureTimestamps = useRef<number[]>([]);
  const openedAt = useRef<number>(0);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (cooldownTimer.current) {
      clearTimeout(cooldownTimer.current);
      cooldownTimer.current = null;
    }
    if (tickTimer.current) {
      clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
  }, []);

  const transitionToOpen = useCallback(() => {
    openedAt.current = Date.now();
    setState('open');
    setCooldownRemaining(cooldownMs);

    // Tick countdown every second for UI display
    tickTimer.current = setInterval(() => {
      const elapsed = Date.now() - openedAt.current;
      const remaining = Math.max(0, cooldownMs - elapsed);
      setCooldownRemaining(remaining);
      if (remaining <= 0 && tickTimer.current) {
        clearInterval(tickTimer.current);
        tickTimer.current = null;
      }
    }, 1000);

    // Transition to half-open after cooldown
    cooldownTimer.current = setTimeout(() => {
      setState('half-open');
      setCooldownRemaining(0);
    }, cooldownMs);
  }, [cooldownMs]);

  const pruneOldFailures = useCallback(() => {
    const cutoff = Date.now() - failureWindowMs;
    failureTimestamps.current = failureTimestamps.current.filter(
      (ts) => ts > cutoff
    );
  }, [failureWindowMs]);

  const recordSuccess = useCallback(() => {
    clearTimers();
    failureTimestamps.current = [];
    setFailureCount(0);
    setCooldownRemaining(0);
    setState('closed');
  }, [clearTimers]);

  const recordFailure = useCallback(() => {
    const now = Date.now();
    failureTimestamps.current.push(now);
    pruneOldFailures();

    const currentCount = failureTimestamps.current.length;
    setFailureCount(currentCount);

    if (currentCount >= failureThreshold) {
      transitionToOpen();
    }
  }, [failureThreshold, pruneOldFailures, transitionToOpen]);

  const reset = useCallback(() => {
    clearTimers();
    failureTimestamps.current = [];
    openedAt.current = 0;
    setFailureCount(0);
    setCooldownRemaining(0);
    setState('closed');
  }, [clearTimers]);

  const canRequest = state === 'closed' || state === 'half-open';

  return {
    state,
    canRequest,
    failureCount,
    recordSuccess,
    recordFailure,
    reset,
    cooldownRemaining,
  };
}

// ── Standalone (non-React) circuit breaker for nexcore-api.ts ──────────

interface BreakerInternals {
  state: CircuitState;
  failureTimestamps: number[];
  openedAt: number;
  cooldownTimer: ReturnType<typeof setTimeout> | null;
}

export class CircuitBreaker {
  private internals: BreakerInternals;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly failureWindowMs: number;

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.cooldownMs = config.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    this.failureWindowMs = config.failureWindowMs ?? DEFAULT_FAILURE_WINDOW_MS;
    this.internals = {
      state: 'closed',
      failureTimestamps: [],
      openedAt: 0,
      cooldownTimer: null,
    };
  }

  get state(): CircuitState {
    return this.internals.state;
  }

  get canRequest(): boolean {
    // Check if cooldown has elapsed for open state
    if (this.internals.state === 'open') {
      const elapsed = Date.now() - this.internals.openedAt;
      if (elapsed >= this.cooldownMs) {
        this.internals.state = 'half-open';
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.internals.state = 'closed';
    this.internals.failureTimestamps = [];
    if (this.internals.cooldownTimer) {
      clearTimeout(this.internals.cooldownTimer);
      this.internals.cooldownTimer = null;
    }
  }

  recordFailure(): void {
    const now = Date.now();
    this.internals.failureTimestamps.push(now);

    // Prune old failures
    const cutoff = now - this.failureWindowMs;
    this.internals.failureTimestamps = this.internals.failureTimestamps.filter(
      (ts) => ts > cutoff
    );

    if (this.internals.failureTimestamps.length >= this.failureThreshold) {
      this.internals.state = 'open';
      this.internals.openedAt = now;
    }
  }

  reset(): void {
    this.internals.state = 'closed';
    this.internals.failureTimestamps = [];
    this.internals.openedAt = 0;
    if (this.internals.cooldownTimer) {
      clearTimeout(this.internals.cooldownTimer);
      this.internals.cooldownTimer = null;
    }
  }

  /** Wrap an async function with circuit breaker protection */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canRequest) {
      throw new CircuitBreakerOpenError(this.cooldownMs);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(public cooldownMs: number) {
    super(`Circuit breaker is open. Retry after ${Math.ceil(cooldownMs / 1000)}s cooldown.`);
    this.name = 'CircuitBreakerOpenError';
  }
}
