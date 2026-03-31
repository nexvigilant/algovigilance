'use client';

/**
 * Adaptive Backoff Governor Hook
 *
 * Engineering source: Williams 1909, Ch 1-3 — Steam engine governor
 * T1 Primitives: ν(Frequency) + ∂(Boundary) + ς(State)
 *
 * Principle: The steam governor senses output speed and adjusts input.
 * When the engine runs too fast, centrifugal weights rise and throttle
 * the steam valve. When it slows, weights drop and open the valve.
 *
 * Applied to API calls: response latency is the "speed" signal.
 * High latency → exponential backoff (throttle). Recovery → reduce delay.
 * Jitter prevents thundering herd (multiple clients retrying simultaneously).
 *
 * @example
 * ```tsx
 * const governor = useAdaptiveBackoff();
 *
 * async function callAI(prompt: string) {
 *   await governor.waitForSlot();  // Blocks if backing off
 *   const start = Date.now();
 *   try {
 *     const result = await generateAIResponse(prompt);
 *     governor.recordLatency(Date.now() - start);
 *     return result;
 *   } catch (err) {
 *     governor.recordFailure();
 *     throw err;
 *   }
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

export interface AdaptiveBackoffConfig {
  /** Base delay in ms (default: 1000) */
  baseDelayMs?: number;
  /** Maximum delay in ms (default: 60000) */
  maxDelayMs?: number;
  /** Latency threshold in ms — above this triggers backoff increase (default: 5000) */
  latencyThresholdMs?: number;
  /** Number of consecutive good responses before reducing backoff (default: 3) */
  recoveryThreshold?: number;
  /** Jitter factor 0-1 — randomizes delay to prevent thundering herd (default: 0.3) */
  jitterFactor?: number;
}

type GovernorLevel = 'normal' | 'cautious' | 'throttled' | 'critical';

export interface AdaptiveBackoffState {
  /** Current governor level */
  level: GovernorLevel;
  /** Current delay in ms (0 = no delay) */
  currentDelayMs: number;
  /** Consecutive successful fast responses */
  consecutiveSuccesses: number;
  /** Consecutive failures or slow responses */
  consecutiveIssues: number;
  /** Whether currently waiting for backoff to clear */
  isBackingOff: boolean;
  /** Wait for the current backoff period to elapse (resolves immediately if no delay) */
  waitForSlot: () => Promise<void>;
  /** Record a response latency — governor adjusts delay based on this signal */
  recordLatency: (ms: number) => void;
  /** Record a failure — increases backoff exponentially */
  recordFailure: () => void;
  /** Reset governor to normal state */
  reset: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────

const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 60_000;
const DEFAULT_LATENCY_THRESHOLD_MS = 5000;
const DEFAULT_RECOVERY_THRESHOLD = 3;
const DEFAULT_JITTER_FACTOR = 0.3;

// ── Helpers ────────────────────────────────────────────────────────────

function addJitter(delayMs: number, jitterFactor: number): number {
  const jitter = delayMs * jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(delayMs + jitter));
}

function levelFromDelay(
  delayMs: number,
  baseDelayMs: number,
  maxDelayMs: number
): GovernorLevel {
  if (delayMs === 0) return 'normal';
  if (delayMs <= baseDelayMs * 2) return 'cautious';
  if (delayMs <= maxDelayMs / 2) return 'throttled';
  return 'critical';
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useAdaptiveBackoff(
  config: AdaptiveBackoffConfig = {}
): AdaptiveBackoffState {
  const {
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
    latencyThresholdMs = DEFAULT_LATENCY_THRESHOLD_MS,
    recoveryThreshold = DEFAULT_RECOVERY_THRESHOLD,
    jitterFactor = DEFAULT_JITTER_FACTOR,
  } = config;

  const [currentDelayMs, setCurrentDelayMs] = useState(0);
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const [consecutiveIssues, setConsecutiveIssues] = useState(0);
  const [isBackingOff, setIsBackingOff] = useState(false);

  const delayRef = useRef(0);

  const updateDelay = useCallback(
    (newDelay: number) => {
      const clamped = Math.min(newDelay, maxDelayMs);
      delayRef.current = clamped;
      setCurrentDelayMs(clamped);
    },
    [maxDelayMs]
  );

  const recordLatency = useCallback(
    (ms: number) => {
      if (ms > latencyThresholdMs) {
        // Slow response — increase backoff (governor weights rising)
        const newDelay = Math.max(delayRef.current * 2, baseDelayMs);
        updateDelay(newDelay);
        setConsecutiveSuccesses(0);
        setConsecutiveIssues((prev) => prev + 1);
      } else {
        // Fast response — count toward recovery
        setConsecutiveSuccesses((prev) => {
          const next = prev + 1;
          if (next >= recoveryThreshold && delayRef.current > 0) {
            // Recovery: halve the delay (governor weights dropping)
            const newDelay = Math.floor(delayRef.current / 2);
            updateDelay(newDelay <= baseDelayMs / 2 ? 0 : newDelay);
            return 0;
          }
          return next;
        });
        setConsecutiveIssues(0);
      }
    },
    [baseDelayMs, latencyThresholdMs, recoveryThreshold, updateDelay]
  );

  const recordFailure = useCallback(() => {
    // Failure — exponential backoff
    const newDelay = Math.max(delayRef.current * 2, baseDelayMs);
    updateDelay(newDelay);
    setConsecutiveSuccesses(0);
    setConsecutiveIssues((prev) => prev + 1);
  }, [baseDelayMs, updateDelay]);

  const waitForSlot = useCallback(async () => {
    const delay = delayRef.current;
    if (delay <= 0) return;

    setIsBackingOff(true);
    const jitteredDelay = addJitter(delay, jitterFactor);
    await new Promise<void>((resolve) => setTimeout(resolve, jitteredDelay));
    setIsBackingOff(false);
  }, [jitterFactor]);

  const reset = useCallback(() => {
    delayRef.current = 0;
    setCurrentDelayMs(0);
    setConsecutiveSuccesses(0);
    setConsecutiveIssues(0);
    setIsBackingOff(false);
  }, []);

  const level = levelFromDelay(currentDelayMs, baseDelayMs, maxDelayMs);

  return {
    level,
    currentDelayMs,
    consecutiveSuccesses,
    consecutiveIssues,
    isBackingOff,
    waitForSlot,
    recordLatency,
    recordFailure,
    reset,
  };
}
