'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLiveness } from '@/hooks/use-liveness';

import { logger } from '@/lib/logger';
const log = logger.scope('hooks/use-realtime-stat');

/**
 * Hook for subscribing to real-time stats from Firestore
 *
 * Includes dead-man switch liveness tracking (Williams 1909, Ch 10).
 * If no data arrives within the timeout, `isStale` signals consumers
 * to show a warning — the absence of a signal IS the signal.
 *
 * @param statName - The name of the stat document in system_stats collection
 * @param options - Optional liveness config
 * @returns Object containing the stat value, loading state, error, connection status, and staleness
 *
 * @example
 * ```tsx
 * const { value: memberCount, loading, isStale } = useRealtimeStat('community_members');
 *
 * if (loading) return <Skeleton />;
 * return (
 *   <>
 *     <span>Join {memberCount.toLocaleString()} members</span>
 *     {isStale && <Badge variant="warning">Data may be outdated</Badge>}
 *   </>
 * );
 * ```
 */
export function useRealtimeStat(
  statName: string,
  options?: { timeoutMs?: number }
) {
  const [value, setValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);

  const liveness = useLiveness({
    timeoutMs: options?.timeoutMs ?? 60_000,
    onStale: () => log.warn(`Stat '${statName}' data is stale — no updates received`),
    onRecover: () => log.info(`Stat '${statName}' data recovered`),
  });

  // Stable ref to avoid re-subscribing on every render
  const pingRef = useRef(liveness.ping);
  pingRef.current = liveness.ping;

  useEffect(() => {
    let mounted = true;
    const docRef = doc(db, 'system_stats', statName);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!mounted) return;

        if (snapshot.exists()) {
          const data = snapshot.data();
          setValue(data.value || 0);
          setLoading(false);
          setConnected(true);
          setError(null);
          pingRef.current(); // Dead-man switch: fresh data arrived
        } else {
          log.warn(`Stat '${statName}' not found in Firestore`);
          setValue(0);
          setLoading(false);
          setConnected(false);
        }
      },
      (err) => {
        if (!mounted) return;

        log.error(`Error listening to stat '${statName}':`, err);
        setError(err as Error);
        setLoading(false);
        setConnected(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      mounted = false;
      try {
        unsubscribe();
      } catch (e) {
        // Ignore cleanup errors during hot reload
        log.debug('Firestore listener cleanup (safe to ignore in dev):', e);
      }
    };
  }, [statName]);

  return {
    value,
    loading,
    error,
    connected,
    isStale: liveness.isStale,
    secondsSinceLastUpdate: liveness.secondsSinceLastPing,
  };
}

/**
 * Hook for subscribing to real-time stats with min/max bounds (e.g., "143 of 250")
 *
 * @param statName - The name of the stat document in system_stats collection
 * @returns Object containing current value, max value, loading state, and connection status
 *
 * @example
 * ```tsx
 * const { current, max, loading } = useRealtimeStatWithMax('founding_members');
 *
 * if (loading) return <Skeleton />;
 * return <span>{current} of {max} spots remaining</span>;
 * ```
 */
export function useRealtimeStatWithMax(
  statName: string,
  options?: { timeoutMs?: number }
) {
  const [current, setCurrent] = useState<number>(0);
  const [max, setMax] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);

  const liveness = useLiveness({
    timeoutMs: options?.timeoutMs ?? 60_000,
    onStale: () => log.warn(`Stat '${statName}' data is stale — no updates received`),
    onRecover: () => log.info(`Stat '${statName}' data recovered`),
  });

  // Stable ref to avoid re-subscribing on every render
  const pingRef = useRef(liveness.ping);
  pingRef.current = liveness.ping;

  useEffect(() => {
    let mounted = true;
    const docRef = doc(db, 'system_stats', statName);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!mounted) return;

        if (snapshot.exists()) {
          const data = snapshot.data();
          setCurrent(data.value || 0);
          setMax(data.max || 0);
          setLoading(false);
          setConnected(true);
          setError(null);
          pingRef.current(); // Dead-man switch: fresh data arrived
        } else {
          log.warn(`Stat '${statName}' not found in Firestore`);
          setCurrent(0);
          setMax(0);
          setLoading(false);
          setConnected(false);
        }
      },
      (err) => {
        if (!mounted) return;

        log.error(`Error listening to stat '${statName}':`, err);
        setError(err as Error);
        setLoading(false);
        setConnected(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      mounted = false;
      try {
        unsubscribe();
      } catch (e) {
        // Ignore cleanup errors during hot reload
        log.debug('Firestore listener cleanup (safe to ignore in dev):', e);
      }
    };
  }, [statName]);

  return {
    current,
    max,
    remaining: max - current,
    loading,
    error,
    connected,
    isStale: liveness.isStale,
    secondsSinceLastUpdate: liveness.secondsSinceLastPing,
  };
}
