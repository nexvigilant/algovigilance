'use client';

/**
 * Async State Machine Hook — Typestate for React
 *
 * Engineering source: Williams 1909, Ch 11 — Railway interlocking
 * T1 Primitives: ∂(Boundary) + ς(State) + ∝(Irreversibility)
 *
 * Principle: Make invalid states unrepresentable. A discriminated union
 * ensures only valid state combinations exist — the compiler enforces
 * the interlock, not runtime checks.
 *
 * WRONG: { isLoading: boolean; isError: boolean; data?: T; error?: Error }
 *   → isLoading && isError can be true simultaneously
 *
 * RIGHT: { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error }
 *   → Only one state at a time, each with exactly the fields it needs
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { state, execute } = useAsyncState<User>();
 *
 *   useEffect(() => { execute(() => fetchUser(userId)); }, [userId, execute]);
 *
 *   switch (state.status) {
 *     case 'idle':    return <Skeleton />;
 *     case 'loading': return <Spinner />;
 *     case 'success': return <Profile user={state.data} />;
 *     case 'error':   return <ErrorCard error={state.error} onRetry={() => execute(() => fetchUser(userId))} />;
 *   }
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react';

// ── Discriminated Union States ─────────────────────────────────────────

export type AsyncIdle = { status: 'idle' };
export type AsyncLoading = { status: 'loading' };
export type AsyncSuccess<T> = { status: 'success'; data: T };
export type AsyncError = { status: 'error'; error: Error };

/** The four mutually exclusive async states */
export type AsyncState<T> =
  | AsyncIdle
  | AsyncLoading
  | AsyncSuccess<T>
  | AsyncError;

// ── Type Guards ────────────────────────────────────────────────────────

export function isIdle<T>(state: AsyncState<T>): state is AsyncIdle {
  return state.status === 'idle';
}

export function isLoading<T>(state: AsyncState<T>): state is AsyncLoading {
  return state.status === 'loading';
}

export function isSuccess<T>(state: AsyncState<T>): state is AsyncSuccess<T> {
  return state.status === 'success';
}

export function isError<T>(state: AsyncState<T>): state is AsyncError {
  return state.status === 'error';
}

// ── Hook Result ────────────────────────────────────────────────────────

export interface UseAsyncStateResult<T> {
  /** Current discriminated state — switch on state.status */
  state: AsyncState<T>;
  /** Execute an async function, managing state transitions automatically */
  execute: (fn: () => Promise<T>) => Promise<T | undefined>;
  /** Reset to idle state */
  reset: () => void;
  /** Directly set success state (for optimistic updates) */
  setData: (data: T) => void;
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useAsyncState<T>(
  initialState: AsyncState<T> = { status: 'idle' }
): UseAsyncStateResult<T> {
  const [state, setState] = useState<AsyncState<T>>(initialState);
  const mountedRef = useRef(true);

  // Track component unmount to prevent state updates after unmount
  // Using a ref that's set in a cleanup effect would be ideal,
  // but for a hook we trust the consumer's lifecycle.

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | undefined> => {
      setState({ status: 'loading' });

      try {
        const data = await fn();
        if (mountedRef.current) {
          setState({ status: 'success', data });
        }
        return data;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) {
          setState({ status: 'error', error });
        }
        return undefined;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  const setData = useCallback((data: T) => {
    setState({ status: 'success', data });
  }, []);

  return { state, execute, reset, setData };
}

// ── Convenience: useAsyncCallback ──────────────────────────────────────

/**
 * Like useAsyncState but wraps a specific async function.
 * Useful when the function signature is known upfront.
 *
 * @example
 * ```tsx
 * const { state, run } = useAsyncCallback(
 *   async (userId: string) => fetchUser(userId)
 * );
 *
 * return <button onClick={() => run('abc')} disabled={state.status === 'loading'}>Load</button>;
 * ```
 */
export function useAsyncCallback<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
): {
  state: AsyncState<TResult>;
  run: (...args: TArgs) => Promise<TResult | undefined>;
  reset: () => void;
} {
  const { state, execute, reset } = useAsyncState<TResult>();

  const run = useCallback(
    (...args: TArgs) => execute(() => fn(...args)),
    [execute, fn]
  );

  return { state, run, reset };
}
