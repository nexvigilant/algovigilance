/**
 * Parallel Execution Utilities
 *
 * Centralized utilities for parallel async operations with proper error handling,
 * controlled concurrency, and timeout support.
 *
 * @module lib/parallel-utils
 */

import { logger } from './logger';

const log = logger.scope('parallel-utils');

/**
 * Result of a settled promise with metadata
 */
export interface SettledResult<T> {
  status: 'fulfilled' | 'rejected';
  value?: T;
  reason?: Error;
  index: number;
  durationMs: number;
}

/**
 * Execute multiple async operations in parallel with detailed results
 *
 * Unlike Promise.all, this never throws - it returns status for each operation.
 * Unlike Promise.allSettled, this includes timing and index metadata.
 *
 * @example
 * const results = await fetchAllParallel([
 *   () => fetchUser(1),
 *   () => fetchUser(2),
 *   () => fetchUser(3),
 * ]);
 *
 * const successful = results.filter(r => r.status === 'fulfilled');
 * const failed = results.filter(r => r.status === 'rejected');
 */
export async function fetchAllParallel<T>(
  operations: Array<() => Promise<T>>,
  options: {
    /** Label for logging */
    label?: string;
    /** Log individual failures */
    logFailures?: boolean;
  } = {}
): Promise<SettledResult<T>[]> {
  const { label = 'parallel-fetch', logFailures = true } = options;
  const startTime = Date.now();

  const results = await Promise.all(
    operations.map(async (op, index) => {
      const opStart = Date.now();
      try {
        const value = await op();
        return {
          status: 'fulfilled' as const,
          value,
          index,
          durationMs: Date.now() - opStart,
        };
      } catch (error) {
        const result: SettledResult<T> = {
          status: 'rejected' as const,
          reason: error instanceof Error ? error : new Error(String(error)),
          index,
          durationMs: Date.now() - opStart,
        };
        if (logFailures) {
          log.warn(`${label}[${index}] failed: ${result.reason?.message}`);
        }
        return result;
      }
    })
  );

  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.status === 'fulfilled').length;

  log.debug(`${label} completed`, {
    total: operations.length,
    success: successCount,
    failed: operations.length - successCount,
    durationMs: totalDuration,
  });

  return results;
}

/**
 * Process items in batches with controlled concurrency
 *
 * Useful for rate-limited APIs or when you need to control resource usage.
 *
 * @example
 * // Process 100 items, 5 at a time
 * const results = await batchProcess(userIds, async (id) => {
 *   return await fetchUser(id);
 * }, { concurrency: 5 });
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: {
    /** Max concurrent operations (default: 5) */
    concurrency?: number;
    /** Continue processing on individual failures */
    continueOnError?: boolean;
    /** Label for logging */
    label?: string;
  } = {}
): Promise<SettledResult<R>[]> {
  const { concurrency = 5, continueOnError = true, label = 'batch' } = options;
  const results: SettledResult<R>[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchStart = Date.now();

    const batchResults = await fetchAllParallel(
      batch.map((item, batchIndex) => () => processor(item, i + batchIndex)),
      { label: `${label}-batch-${Math.floor(i / concurrency)}`, logFailures: continueOnError }
    );

    // Adjust indices to be absolute
    const adjustedResults = batchResults.map(r => ({
      ...r,
      index: i + r.index,
    }));

    results.push(...adjustedResults);

    // Check for failures if not continuing on error
    if (!continueOnError) {
      const failure = adjustedResults.find(r => r.status === 'rejected');
      if (failure) {
        throw failure.reason;
      }
    }

    log.debug(`${label} batch ${Math.floor(i / concurrency) + 1} complete`, {
      processed: Math.min(i + concurrency, items.length),
      total: items.length,
      batchDurationMs: Date.now() - batchStart,
    });
  }

  return results;
}

/**
 * Wrap a promise with a timeout
 *
 * @example
 * try {
 *   const result = await withTimeout(slowOperation(), 5000);
 * } catch (error) {
 *   if (error.message.includes('timed out')) {
 *     // Handle timeout
 *   }
 * }
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  options: {
    /** Custom error message */
    message?: string;
    /** Operation label for error message */
    label?: string;
  } = {}
): Promise<T> {
  const { message, label = 'Operation' } = options;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(message ?? `${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry an async operation with exponential backoff
 *
 * @example
 * const result = await withRetry(
 *   () => fetchFromFlakeyAPI(),
 *   { maxAttempts: 3, baseDelayMs: 1000 }
 * );
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    /** Max number of attempts (default: 3) */
    maxAttempts?: number;
    /** Base delay in ms, doubles each retry (default: 1000) */
    baseDelayMs?: number;
    /** Maximum delay cap in ms (default: 30000) */
    maxDelayMs?: number;
    /** Label for logging */
    label?: string;
    /** Should retry on this error? (default: all errors) */
    shouldRetry?: (error: Error, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    label = 'operation',
    shouldRetry = () => true,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      log.warn(`${label} attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: lastError.message,
        nextAttempt: attempt + 1,
        maxAttempts,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Extract successful values from settled results
 */
export function getSuccessfulValues<T>(results: SettledResult<T>[]): T[] {
  return results
    .filter((r): r is SettledResult<T> & { status: 'fulfilled'; value: T } =>
      r.status === 'fulfilled' && r.value !== undefined
    )
    .map(r => r.value);
}

/**
 * Extract errors from settled results
 */
export function getFailedResults<T>(results: SettledResult<T>[]): Array<{ index: number; error: Error }> {
  return results
    .filter((r): r is SettledResult<T> & { status: 'rejected'; reason: Error } =>
      r.status === 'rejected'
    )
    .map(r => ({ index: r.index, error: r.reason ?? new Error('Unknown error') }));
}

/**
 * Result from a timed operation
 */
export interface TimedResult<T> {
  result: T;
  durationMs: number;
}

/**
 * Wrap an async operation to track and log execution time
 *
 * Useful for performance monitoring and identifying slow operations.
 * Can be used inline or as a decorator pattern.
 *
 * @example
 * // Inline usage
 * const { result, durationMs } = await withTiming(
 *   () => fetchUserData(userId),
 *   { label: 'fetchUserData' }
 * );
 *
 * @example
 * // Conditional slow-operation warning
 * const { result, durationMs } = await withTiming(operation, {
 *   label: 'criticalPath',
 *   warnThresholdMs: 1000,
 * });
 */
export async function withTiming<T>(
  operation: () => Promise<T>,
  options: {
    /** Label for logging */
    label?: string;
    /** Log timing at debug level (default: true) */
    logTiming?: boolean;
    /** Warn if operation exceeds this threshold (ms) */
    warnThresholdMs?: number;
    /** Additional context for logs */
    context?: Record<string, unknown>;
  } = {}
): Promise<TimedResult<T>> {
  const {
    label = 'operation',
    logTiming = true,
    warnThresholdMs,
    context = {},
  } = options;

  const startTime = Date.now();

  try {
    const result = await operation();
    const durationMs = Date.now() - startTime;

    if (logTiming) {
      const logData = { durationMs, ...context };

      if (warnThresholdMs && durationMs > warnThresholdMs) {
        log.warn(`${label} slow operation`, {
          ...logData,
          threshold: warnThresholdMs,
          exceededBy: durationMs - warnThresholdMs,
        });
      } else {
        log.debug(`${label} completed`, logData);
      }
    }

    return { result, durationMs };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    if (logTiming) {
      log.error(`${label} failed after ${durationMs}ms`, {
        durationMs,
        error: error instanceof Error ? error.message : String(error),
        ...context,
      });
    }

    throw error;
  }
}

/**
 * Create a timed version of an async function
 *
 * Useful for wrapping multiple functions with consistent timing.
 *
 * @example
 * const timedFetch = createTimedFunction(fetchData, 'fetchData');
 * const { result, durationMs } = await timedFetch(userId);
 */
export function createTimedFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  label: string,
  options: {
    warnThresholdMs?: number;
    logTiming?: boolean;
  } = {}
): (...args: TArgs) => Promise<TimedResult<TResult>> {
  return async (...args: TArgs) => {
    return withTiming(() => fn(...args), { label, ...options });
  };
}
