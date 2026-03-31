/**
 * Rate Limiter - Concurrent Request Control
 *
 * Combines concurrency limiting (semaphore) with time-based rate limiting.
 * Used by API clients to respect rate limits while maximizing throughput.
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter({ maxConcurrent: 5, delayMs: 100 });
 *
 * // Wrap each API call
 * await limiter.acquire();
 * try {
 *   const result = await fetch(url);
 *   return result;
 * } finally {
 *   limiter.release();
 * }
 *
 * // Or use the convenience wrapper
 * const result = await limiter.run(() => fetch(url));
 * ```
 */

export interface RateLimiterConfig {
  /** Maximum concurrent requests allowed */
  maxConcurrent: number;
  /** Minimum delay between requests in milliseconds */
  delayMs: number;
}

export interface RateLimiterStats {
  /** Current number of active requests */
  activeCount: number;
  /** Number of requests waiting in queue */
  queueLength: number;
  /** Time since last request in milliseconds */
  timeSinceLastRequest: number;
}

/**
 * Rate limiter implementing a counting semaphore with time-based delays.
 *
 * Guarantees:
 * - At most `maxConcurrent` requests execute simultaneously
 * - At least `delayMs` milliseconds between request starts
 * - FIFO ordering for waiting requests
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private activeCount = 0;
  private lastRequestTime = 0;
  private readonly maxConcurrent: number;
  private readonly delayMs: number;

  constructor(config: RateLimiterConfig) {
    this.maxConcurrent = config.maxConcurrent;
    this.delayMs = config.delayMs;
  }

  /**
   * Acquire a slot for executing a request.
   * Blocks until a slot is available and rate limit allows.
   */
  async acquire(): Promise<void> {
    // Wait for available slot (counting semaphore)
    while (this.activeCount >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    // Enforce minimum delay between requests (rate limiting)
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.delayMs) {
      await this.sleep(this.delayMs - timeSinceLastRequest);
    }

    this.activeCount++;
    this.lastRequestTime = Date.now();
  }

  /**
   * Release a slot after request completes.
   * Wakes up the next waiting request if any.
   */
  release(): void {
    this.activeCount--;
    const next = this.queue.shift();
    if (next) next();
  }

  /**
   * Get current limiter statistics.
   */
  getStats(): RateLimiterStats {
    return {
      activeCount: this.activeCount,
      queueLength: this.queue.length,
      timeSinceLastRequest: Date.now() - this.lastRequestTime,
    };
  }

  /**
   * Execute a function with automatic acquire/release.
   * Ensures release is called even if the function throws.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /**
   * Execute multiple functions with rate limiting.
   * More efficient than wrapping each in run() individually.
   */
  async runAll<T>(fns: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(fns.map((fn) => this.run(fn)));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a rate limiter with common API presets.
 */
export function createRateLimiter(
  preset: 'aggressive' | 'polite' | 'conservative' | RateLimiterConfig
): RateLimiter {
  const presets: Record<string, RateLimiterConfig> = {
    aggressive: { maxConcurrent: 10, delayMs: 50 },
    polite: { maxConcurrent: 5, delayMs: 100 },
    conservative: { maxConcurrent: 2, delayMs: 500 },
  };

  const config = typeof preset === 'string' ? presets[preset] : preset;
  return new RateLimiter(config);
}

/**
 * p-limit style concurrency limiter.
 *
 * Creates a function that limits concurrent execution of promises.
 * Simpler API than RateLimiter when you don't need time-based rate limiting.
 *
 * @example
 * ```typescript
 * const limit = pLimit(3); // max 3 concurrent
 *
 * const results = await Promise.all(
 *   urls.map(url => limit(() => fetch(url)))
 * );
 * ```
 */
export function pLimit(concurrency: number): <T>(fn: () => Promise<T>) => Promise<T> {
  const limiter = new RateLimiter({ maxConcurrent: concurrency, delayMs: 0 });
  return <T>(fn: () => Promise<T>) => limiter.run(fn);
}

/**
 * Execute promises with controlled concurrency.
 *
 * Alternative to Promise.all when you need to limit parallelism.
 *
 * @example
 * ```typescript
 * const results = await pAll(
 *   urls.map(url => () => fetch(url)),
 *   { concurrency: 5 }
 * );
 * ```
 */
export async function pAll<T>(
  tasks: Array<() => Promise<T>>,
  options: { concurrency: number }
): Promise<T[]> {
  const limiter = new RateLimiter({ maxConcurrent: options.concurrency, delayMs: 0 });
  return limiter.runAll(tasks);
}

/**
 * Execute promises in batches.
 *
 * Processes items in fixed-size batches sequentially.
 * Useful when you need clear batch boundaries.
 *
 * @example
 * ```typescript
 * const results = await pBatch(
 *   items,
 *   async (item) => processItem(item),
 *   { batchSize: 10, delayBetweenBatches: 1000 }
 * );
 * ```
 */
export async function pBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: { batchSize: number; delayBetweenBatches?: number }
): Promise<R[]> {
  const results: R[] = [];
  const { batchSize, delayBetweenBatches = 0 } = options;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // Delay between batches (not after the last batch)
    if (i + batchSize < items.length && delayBetweenBatches > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}
