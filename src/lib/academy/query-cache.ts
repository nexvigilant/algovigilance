/**
 * Query Cache for Academy Analytics
 *
 * Provides short-lived caching (5-15 min TTL) for expensive Firestore queries
 * to improve dashboard load times and reduce read costs.
 *
 * Uses Firestore documents as the cache layer for simplicity and persistence
 * across server instances.
 *
 * @module lib/academy/query-cache
 */

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

const log = logger.scope('query-cache');

const CACHE_COLLECTION = 'query_cache';

/**
 * Cache entry structure stored in Firestore
 */
interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** When the cache was created */
  cachedAt: FirebaseFirestore.Timestamp;
  /** Time-to-live in seconds */
  ttlSeconds: number;
  /** Optional metadata about the cached query */
  metadata?: {
    queryType?: string;
    userId?: string;
    domainId?: string;
  };
}

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  avgLatencySavedMs: number;
}

// In-memory stats tracking (reset on server restart)
let cacheHits = 0;
let cacheMisses = 0;
let totalLatencySaved = 0;

/**
 * Generates a cache key from parameters
 *
 * @example
 * generateCacheKey('fsrs_stats', 'user123') // 'fsrs_stats_user123'
 * generateCacheKey('domain_mastery', 'user123', 'D01') // 'domain_mastery_user123_D01'
 */
export function generateCacheKey(...parts: string[]): string {
  return parts.filter(Boolean).join('_');
}

/**
 * Gets a cached value or computes it if not present/expired
 *
 * This is the primary API for caching expensive queries.
 *
 * @param cacheKey - Unique key for this cached value
 * @param ttlSeconds - How long to cache the result (default: 300 = 5 minutes)
 * @param computeFn - Async function to compute the value if cache miss
 * @param options - Additional options
 * @returns The cached or computed value
 *
 * @example
 * const stats = await getCachedOrCompute(
 *   `fsrs_stats_${userId}`,
 *   300, // 5 minute TTL
 *   async () => computeExpensiveFSRSStats(userId)
 * );
 */
export async function getCachedOrCompute<T>(
  cacheKey: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>,
  options: {
    metadata?: CacheEntry<T>['metadata'];
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const startTime = Date.now();

  // Check cache first (unless force refresh)
  if (!options.forceRefresh) {
    try {
      const cacheRef = adminDb.collection(CACHE_COLLECTION).doc(cacheKey);
      const docSnap = await cacheRef.get();

      if (docSnap.exists) {
        const entry = docSnap.data() as CacheEntry<T>;
        const ageSeconds = (Date.now() - entry.cachedAt.toMillis()) / 1000;

        if (ageSeconds < entry.ttlSeconds) {
          // Cache hit!
          cacheHits++;
          const latencySaved = Date.now() - startTime;
          totalLatencySaved += latencySaved;

          log.debug(`Cache hit for ${cacheKey}`, {
            ageSeconds: Math.round(ageSeconds),
            ttlSeconds: entry.ttlSeconds,
          });

          return entry.data;
        }

        log.debug(`Cache expired for ${cacheKey}`, {
          ageSeconds: Math.round(ageSeconds),
          ttlSeconds: entry.ttlSeconds,
        });
      }
    } catch (error) {
      log.warn(`Cache read error for ${cacheKey}`, { error });
      // Continue to compute on cache read error
    }
  }

  // Cache miss or expired - recompute
  cacheMisses++;
  const computeStart = Date.now();
  const data = await computeFn();
  const computeDuration = Date.now() - computeStart;

  // Save to cache
  try {
    const cacheRef = adminDb.collection(CACHE_COLLECTION).doc(cacheKey);
    await cacheRef.set({
      data,
      cachedAt: adminTimestamp.now(),
      ttlSeconds,
      metadata: options.metadata,
    });

    log.debug(`Cache set for ${cacheKey}`, {
      ttlSeconds,
      computeDurationMs: computeDuration,
    });
  } catch (error) {
    log.warn(`Cache write error for ${cacheKey}`, { error });
    // Continue - cache write failure is non-critical
  }

  return data;
}

/**
 * Invalidates a specific cache entry
 *
 * Call this when the underlying data changes.
 *
 * @example
 * // After user completes an FSRS review
 * await invalidateCache(`fsrs_stats_${userId}`);
 */
export async function invalidateCache(cacheKey: string): Promise<void> {
  try {
    await adminDb.collection(CACHE_COLLECTION).doc(cacheKey).delete();
    log.debug(`Cache invalidated for ${cacheKey}`);
  } catch (error) {
    log.warn(`Cache invalidation error for ${cacheKey}`, { error });
  }
}

/**
 * Invalidates all cache entries matching a pattern prefix
 *
 * Uses Firestore's GreaterThan/LessThan for prefix matching.
 *
 * @example
 * // Invalidate all user's cached stats
 * await invalidateCacheByPattern(`user123_`);
 */
export async function invalidateCacheByPattern(pattern: string): Promise<number> {
  try {
    const snapshot = await adminDb
      .collection(CACHE_COLLECTION)
      .where('__name__', '>=', pattern)
      .where('__name__', '<=', pattern + '\uf8ff')
      .limit(500)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    log.info(`Invalidated ${snapshot.size} cache entries matching pattern ${pattern}`);
    return snapshot.size;
  } catch (error) {
    log.error('Cache pattern invalidation error', { pattern, error });
    return 0;
  }
}

/**
 * Gets cache statistics for monitoring
 */
export function getCacheStats(): CacheStats {
  const total = cacheHits + cacheMisses;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: total > 0 ? cacheHits / total : 0,
    avgLatencySavedMs: cacheHits > 0 ? totalLatencySaved / cacheHits : 0,
  };
}

/**
 * Resets cache statistics (for testing)
 */
export function resetCacheStats(): void {
  cacheHits = 0;
  cacheMisses = 0;
  totalLatencySaved = 0;
}

/**
 * Cleans up expired cache entries
 *
 * Should be run periodically (e.g., every 6 hours via Cloud Scheduler).
 * Deletes entries older than their TTL.
 *
 * @param maxAge - Maximum age in seconds (default: 1 hour)
 */
export async function cleanupExpiredCache(maxAge: number = 3600): Promise<{ deleted: number }> {
  try {
    const cutoffTime = new Date(Date.now() - maxAge * 1000);

    const snapshot = await adminDb
      .collection(CACHE_COLLECTION)
      .where('cachedAt', '<', cutoffTime)
      .limit(500)
      .get();

    if (snapshot.empty) {
      return { deleted: 0 };
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    log.info(`Cleaned up ${snapshot.size} expired cache entries`);
    return { deleted: snapshot.size };
  } catch (error) {
    log.error('Cache cleanup error', { error });
    throw error;
  }
}

/**
 * Pre-defined TTL values for common query types
 */
export const CACHE_TTL = {
  /** User dashboard stats - frequently updated, short cache */
  USER_STATS: 60, // 1 minute

  /** FSRS card statistics - updates on review completion */
  FSRS_STATS: 300, // 5 minutes

  /** Domain mastery - updates on activity completion */
  DOMAIN_MASTERY: 300, // 5 minutes

  /** EPA progress - less frequent updates */
  EPA_PROGRESS: 600, // 10 minutes

  /** Leaderboard data - can tolerate staleness */
  LEADERBOARD: 900, // 15 minutes

  /** Aggregated analytics - expensive queries */
  ANALYTICS: 900, // 15 minutes

  /** Course catalog - rarely changes */
  COURSE_CATALOG: 3600, // 1 hour
} as const;

/**
 * Wraps a function with caching
 *
 * Creates a cached version of any async function.
 *
 * @example
 * const cachedGetStats = withCache(
 *   (userId: string) => `fsrs_stats_${userId}`,
 *   CACHE_TTL.FSRS_STATS,
 *   getExpensiveFSRSStats
 * );
 *
 * const stats = await cachedGetStats('user123');
 */
export function withCache<TArgs extends unknown[], TResult>(
  keyGenerator: (...args: TArgs) => string,
  ttlSeconds: number,
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const cacheKey = keyGenerator(...args);
    return getCachedOrCompute(cacheKey, ttlSeconds, () => fn(...args));
  };
}

/**
 * Decorator for class methods with caching
 *
 * Note: TypeScript decorators require experimental flag.
 * Use withCache() for function wrapping instead.
 */
export function cached(
  keyPrefix: string,
  ttlSeconds: number
): MethodDecorator {
  return function (
    _target: unknown,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = `${keyPrefix}_${String(propertyKey)}_${JSON.stringify(args)}`;
      return getCachedOrCompute(cacheKey, ttlSeconds, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}
