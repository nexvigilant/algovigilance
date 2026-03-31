'use client';

/**
 * Dead-Man Switch / Liveness Probe Hook
 *
 * Engineering source: Williams 1909, Ch 10 — Dead-man pedal on trains
 * T1 Primitives: ν(Frequency) + ∂(Boundary) + →(Causality)
 *
 * Principle: A train's dead-man pedal must be held down continuously.
 * Release = emergency brake. The absence of a signal IS the signal.
 *
 * Applied to real-time connections: track when the last data arrived.
 * If no data arrives within the timeout, the connection is considered
 * stale and consumers can show a warning or take corrective action.
 *
 * @example
 * ```tsx
 * const liveness = useLiveness({ timeoutMs: 60_000 });
 *
 * // In your data handler:
 * onSnapshot(docRef, (snapshot) => {
 *   liveness.ping();  // Signal that fresh data arrived
 *   setData(snapshot.data());
 * });
 *
 * // In your UI:
 * {liveness.isStale && (
 *   <Banner variant="warning">
 *     Data may be outdated — last updated {liveness.secondsSinceLastPing}s ago
 *   </Banner>
 * )}
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

export interface LivenessConfig {
  /** Time in ms without a ping before data is considered stale (default: 60000) */
  timeoutMs?: number;
  /** How often to check staleness in ms (default: 5000) */
  checkIntervalMs?: number;
  /** Callback when data becomes stale */
  onStale?: () => void;
  /** Callback when data recovers from stale */
  onRecover?: () => void;
}

export interface LivenessState {
  /** Whether we've received at least one ping */
  isAlive: boolean;
  /** Whether the last ping is older than the timeout */
  isStale: boolean;
  /** Seconds since the last ping (0 if never pinged) */
  secondsSinceLastPing: number;
  /** Timestamp of last successful ping */
  lastPingAt: number | null;
  /** Signal that fresh data has arrived */
  ping: () => void;
  /** Reset liveness tracking */
  reset: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_CHECK_INTERVAL_MS = 5_000;

// ── Hook ───────────────────────────────────────────────────────────────

export function useLiveness(config: LivenessConfig = {}): LivenessState {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS,
    onStale,
    onRecover,
  } = config;

  const [lastPingAt, setLastPingAt] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [secondsSinceLastPing, setSecondsSinceLastPing] = useState(0);

  const wasStaleRef = useRef(false);
  const onStaleRef = useRef(onStale);
  const onRecoverRef = useRef(onRecover);
  onStaleRef.current = onStale;
  onRecoverRef.current = onRecover;

  const ping = useCallback(() => {
    setLastPingAt(Date.now());
  }, []);

  const reset = useCallback(() => {
    setLastPingAt(null);
    setIsStale(false);
    setSecondsSinceLastPing(0);
    wasStaleRef.current = false;
  }, []);

  // Periodic staleness check
  useEffect(() => {
    if (lastPingAt === null) return;

    const check = () => {
      const elapsed = Date.now() - lastPingAt;
      const stale = elapsed > timeoutMs;
      const seconds = Math.floor(elapsed / 1000);

      setSecondsSinceLastPing(seconds);
      setIsStale(stale);

      // Fire callbacks on state transitions
      if (stale && !wasStaleRef.current) {
        wasStaleRef.current = true;
        onStaleRef.current?.();
      } else if (!stale && wasStaleRef.current) {
        wasStaleRef.current = false;
        onRecoverRef.current?.();
      }
    };

    // Check immediately
    check();

    // Then periodically
    const interval = setInterval(check, checkIntervalMs);
    return () => clearInterval(interval);
  }, [lastPingAt, timeoutMs, checkIntervalMs]);

  return {
    isAlive: lastPingAt !== null,
    isStale,
    secondsSinceLastPing,
    lastPingAt,
    ping,
    reset,
  };
}
