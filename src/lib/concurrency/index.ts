/**
 * Concurrency Utilities
 *
 * Tools for managing parallel execution, rate limiting, and async workflows.
 *
 * @example Basic rate limiting
 * ```typescript
 * import { RateLimiter } from '@/lib/concurrency';
 *
 * const limiter = new RateLimiter({ maxConcurrent: 5, delayMs: 100 });
 * const result = await limiter.run(() => fetch(url));
 * ```
 *
 * @example p-limit style
 * ```typescript
 * import { pLimit } from '@/lib/concurrency';
 *
 * const limit = pLimit(3);
 * const results = await Promise.all(urls.map(url => limit(() => fetch(url))));
 * ```
 *
 * @example Batch processing
 * ```typescript
 * import { pBatch } from '@/lib/concurrency';
 *
 * const results = await pBatch(items, processItem, { batchSize: 10 });
 * ```
 */

export {
  RateLimiter,
  createRateLimiter,
  pLimit,
  pAll,
  pBatch,
  type RateLimiterConfig,
  type RateLimiterStats,
} from './rate-limiter';
