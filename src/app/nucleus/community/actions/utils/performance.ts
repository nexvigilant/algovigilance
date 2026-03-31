/**
 * Performance Instrumentation Utilities
 *
 * Provides timing and measurement utilities for server actions
 * to establish baselines and track optimization impact.
 *
 * @module actions/utils/performance
 */

import { logger } from '@/lib/logger';

const log = logger.scope('performance');

/**
 * Performance measurement result
 */
export interface PerformanceMetric {
  action: string;
  duration: number;
  queryCount?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * In-memory metrics buffer (for development/debugging)
 * In production, these would be sent to a monitoring service
 */
const metricsBuffer: PerformanceMetric[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Wrap an async function with performance timing
 *
 * @param name - Name of the action being measured
 * @param fn - The async function to measure
 * @param metadata - Optional metadata to include in the metric
 * @returns The result of the function with timing logged
 *
 * @example
 * ```typescript
 * export async function getMemberDirectory(filters: Filters) {
 *   return withTiming('getMemberDirectory', async () => {
 *     // ... implementation
 *   }, { filters });
 * }
 * ```
 */
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    const metric: PerformanceMetric = {
      action: name,
      duration: Math.round(duration * 100) / 100, // 2 decimal places
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Log timing
    if (duration > 1000) {
      log.warn(`Slow action: ${name}`, { duration: `${metric.duration}ms`, metadata });
    } else if (duration > 500) {
      log.info(`Action timing: ${name}`, { duration: `${metric.duration}ms` });
    } else {
      log.debug(`Action timing: ${name}`, { duration: `${metric.duration}ms` });
    }

    // Buffer metric
    bufferMetric(metric);

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    log.error(`Action failed: ${name}`, {
      duration: `${Math.round(duration)}ms`,
      error,
      metadata,
    });
    throw error;
  }
}

/**
 * Create a timing context for manual start/stop measurement
 *
 * @param name - Name of the action being measured
 * @returns Object with start, mark, and end methods
 *
 * @example
 * ```typescript
 * const timer = createTimer('complexOperation');
 * timer.mark('step1');
 * await doStep1();
 * timer.mark('step2');
 * await doStep2();
 * timer.end({ queryCount: 5 });
 * ```
 */
export function createTimer(name: string) {
  const start = performance.now();
  const marks: { name: string; time: number }[] = [];

  return {
    mark(markName: string) {
      marks.push({ name: markName, time: performance.now() - start });
    },
    end(metadata?: Record<string, unknown>) {
      const duration = performance.now() - start;
      const metric: PerformanceMetric = {
        action: name,
        duration: Math.round(duration * 100) / 100,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          marks: marks.map(m => ({ name: m.name, at: `${Math.round(m.time)}ms` })),
        },
      };

      if (duration > 1000) {
        log.warn(`Slow action: ${name}`, metric);
      } else {
        log.info(`Action timing: ${name}`, { duration: `${metric.duration}ms`, marks });
      }

      bufferMetric(metric);
      return metric;
    },
  };
}

/**
 * Buffer a metric for later retrieval
 */
function bufferMetric(metric: PerformanceMetric): void {
  metricsBuffer.push(metric);
  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.shift(); // Remove oldest
  }
}

/**
 * Get recent performance metrics (for debugging/development)
 */
export function getRecentMetrics(): PerformanceMetric[] {
  return [...metricsBuffer];
}

/**
 * Get performance summary statistics
 */
export function getMetricsSummary(): Record<string, {
  count: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  p95Duration: number;
}> {
  const byAction = metricsBuffer.reduce((acc, m) => {
    if (!acc[m.action]) acc[m.action] = [];
    acc[m.action].push(m.duration);
    return acc;
  }, {} as Record<string, number[]>);

  const summary: Record<string, {
    count: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    p95Duration: number;
  }> = {};

  for (const [action, durations] of Object.entries(byAction)) {
    const sorted = [...durations].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    summary[action] = {
      count: durations.length,
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      p95Duration: sorted[p95Index] || sorted[sorted.length - 1],
    };
  }

  return summary;
}

/**
 * Clear metrics buffer (for testing)
 */
export function clearMetrics(): void {
  metricsBuffer.length = 0;
}

/**
 * Log a performance baseline comparison
 *
 * @param name - Name of the optimization
 * @param before - Baseline duration in ms
 * @param after - New duration in ms
 */
export function logOptimizationImpact(
  name: string,
  before: number,
  after: number
): void {
  const improvement = ((before - after) / before) * 100;
  const emoji = improvement > 50 ? '🚀' : improvement > 20 ? '⚡' : improvement > 0 ? '✅' : '⚠️';

  log.info(`${emoji} Optimization: ${name}`, {
    before: `${before}ms`,
    after: `${after}ms`,
    improvement: `${improvement.toFixed(1)}%`,
    saved: `${before - after}ms`,
  });
}
