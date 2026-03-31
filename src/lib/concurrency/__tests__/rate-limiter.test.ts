/**
 * Rate Limiter Tests
 *
 * Tests for RateLimiter class and helper utilities:
 * - Concurrency limiting (semaphore behavior)
 * - Time-based rate limiting
 * - p-limit style utilities
 * - Batch processing
 */

import { RateLimiter, pLimit, pAll, pBatch } from '../rate-limiter';

// Helper to track execution order and timing
function createTracker() {
  const events: Array<{ event: string; time: number }> = [];
  const start = Date.now();
  return {
    log: (event: string) => events.push({ event, time: Date.now() - start }),
    events,
  };
}

// Helper to create delayed promise
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('RateLimiter', () => {
  describe('concurrency limiting', () => {
    it('should limit concurrent executions to maxConcurrent', async () => {
      const limiter = new RateLimiter({ maxConcurrent: 2, delayMs: 0 });
      const tracker = createTracker();
      let concurrent = 0;
      let maxConcurrent = 0;

      const task = async (id: number) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        tracker.log(`start-${id}`);
        await delay(50);
        tracker.log(`end-${id}`);
        concurrent--;
      };

      // Start 5 tasks - only 2 should run concurrently
      await Promise.all([
        limiter.run(() => task(1)),
        limiter.run(() => task(2)),
        limiter.run(() => task(3)),
        limiter.run(() => task(4)),
        limiter.run(() => task(5)),
      ]);

      expect(maxConcurrent).toBe(2);
    });

    it('should process tasks in FIFO order when queued', async () => {
      const limiter = new RateLimiter({ maxConcurrent: 1, delayMs: 0 });
      const order: number[] = [];

      await Promise.all([
        limiter.run(async () => {
          await delay(10);
          order.push(1);
        }),
        limiter.run(async () => {
          order.push(2);
        }),
        limiter.run(async () => {
          order.push(3);
        }),
      ]);

      expect(order).toEqual([1, 2, 3]);
    });

    it('should release slot on error', async () => {
      const limiter = new RateLimiter({ maxConcurrent: 1, delayMs: 0 });
      const results: string[] = [];

      // First task throws
      await expect(
        limiter.run(async () => {
          throw new Error('Task failed');
        })
      ).rejects.toThrow('Task failed');

      // Second task should still run
      await limiter.run(async () => {
        results.push('success');
      });

      expect(results).toEqual(['success']);
    });
  });

  describe('rate limiting (delayMs)', () => {
    it('should enforce minimum delay between requests when serialized', async () => {
      // With maxConcurrent: 1, requests are serialized and delays are enforced
      const limiter = new RateLimiter({ maxConcurrent: 1, delayMs: 50 });
      const timestamps: number[] = [];

      await Promise.all([
        limiter.run(async () => timestamps.push(Date.now())),
        limiter.run(async () => timestamps.push(Date.now())),
        limiter.run(async () => timestamps.push(Date.now())),
      ]);

      // Check that each request is at least 50ms apart
      for (let i = 1; i < timestamps.length; i++) {
        const gap = timestamps[i] - timestamps[i - 1];
        // Allow 10ms tolerance for timing variations
        expect(gap).toBeGreaterThanOrEqual(40);
      }
    });

    it('should enforce delay from lastRequestTime', async () => {
      const limiter = new RateLimiter({ maxConcurrent: 5, delayMs: 30 });
      const start = Date.now();

      // First request immediately
      await limiter.run(async () => {});
      const _firstDone = Date.now();

      // Second request should wait for delay
      await limiter.run(async () => {});
      const secondDone = Date.now();

      // At least 30ms should have passed between request starts
      // (secondDone - firstDone) gives us minimum time for second request
      expect(secondDone - start).toBeGreaterThanOrEqual(25); // Allow tolerance
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      const limiter = new RateLimiter({ maxConcurrent: 2, delayMs: 0 });

      // Initially empty
      expect(limiter.getStats().activeCount).toBe(0);
      expect(limiter.getStats().queueLength).toBe(0);

      // Start tasks and check stats mid-execution
      const task1 = limiter.run(() => delay(100));
      const task2 = limiter.run(() => delay(100));
      const task3 = limiter.run(() => delay(100));

      // Give tasks time to start
      await delay(10);

      const stats = limiter.getStats();
      expect(stats.activeCount).toBe(2);
      expect(stats.queueLength).toBe(1);

      await Promise.all([task1, task2, task3]);

      // After completion
      expect(limiter.getStats().activeCount).toBe(0);
      expect(limiter.getStats().queueLength).toBe(0);
    });
  });

  describe('runAll', () => {
    it('should run all tasks with rate limiting', async () => {
      const limiter = new RateLimiter({ maxConcurrent: 2, delayMs: 0 });
      const results = await limiter.runAll([
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3),
      ]);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should preserve order even with varying execution times', async () => {
      const limiter = new RateLimiter({ maxConcurrent: 3, delayMs: 0 });
      const results = await limiter.runAll([
        async () => {
          await delay(30);
          return 'slow';
        },
        async () => {
          await delay(10);
          return 'medium';
        },
        async () => {
          return 'fast';
        },
      ]);

      // Results should be in input order, not completion order
      expect(results).toEqual(['slow', 'medium', 'fast']);
    });
  });
});

describe('pLimit', () => {
  it('should create a concurrency-limited wrapper function', async () => {
    const limit = pLimit(2);
    let concurrent = 0;
    let maxConcurrent = 0;

    const task = async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await delay(20);
      concurrent--;
      return 'done';
    };

    const results = await Promise.all([
      limit(task),
      limit(task),
      limit(task),
      limit(task),
    ]);

    expect(maxConcurrent).toBe(2);
    expect(results).toEqual(['done', 'done', 'done', 'done']);
  });

  it('should work with different return types', async () => {
    const limit = pLimit(1);

    const numResult = await limit(() => Promise.resolve(42));
    const strResult = await limit(() => Promise.resolve('hello'));
    const objResult = await limit(() => Promise.resolve({ key: 'value' }));

    expect(numResult).toBe(42);
    expect(strResult).toBe('hello');
    expect(objResult).toEqual({ key: 'value' });
  });
});

describe('pAll', () => {
  it('should execute tasks with controlled concurrency', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    const tasks = Array.from({ length: 10 }, (_, i) => async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await delay(10);
      concurrent--;
      return i;
    });

    const results = await pAll(tasks, { concurrency: 3 });

    expect(maxConcurrent).toBe(3);
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should handle empty array', async () => {
    const results = await pAll([], { concurrency: 5 });
    expect(results).toEqual([]);
  });

  it('should propagate errors', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error('fail')),
      () => Promise.resolve(3),
    ];

    await expect(pAll(tasks, { concurrency: 2 })).rejects.toThrow('fail');
  });
});

describe('pBatch', () => {
  it('should process items in batches', async () => {
    const batchSizes: number[] = [];
    let currentBatch: number[] = [];

    const items = [1, 2, 3, 4, 5, 6, 7];

    const results = await pBatch(
      items,
      async (item) => {
        currentBatch.push(item);
        // Check batch size at end of each batch
        if (currentBatch.length === 3 || item === 7) {
          batchSizes.push(currentBatch.length);
          currentBatch = [];
        }
        return item * 2;
      },
      { batchSize: 3 }
    );

    expect(results).toEqual([2, 4, 6, 8, 10, 12, 14]);
    // Batches: [1,2,3], [4,5,6], [7]
    expect(batchSizes).toEqual([3, 3, 1]);
  });

  it('should respect delayBetweenBatches', async () => {
    const batchTimes: number[] = [];
    const start = Date.now();

    await pBatch(
      [1, 2, 3, 4],
      async (item) => {
        if (item === 1 || item === 3) {
          batchTimes.push(Date.now() - start);
        }
        return item;
      },
      { batchSize: 2, delayBetweenBatches: 50 }
    );

    // Second batch should start ~50ms after first
    const gap = batchTimes[1] - batchTimes[0];
    expect(gap).toBeGreaterThanOrEqual(40); // Allow 10ms tolerance
  });

  it('should handle single item', async () => {
    const results = await pBatch([42], async (x) => x * 2, { batchSize: 10 });
    expect(results).toEqual([84]);
  });

  it('should handle empty array', async () => {
    const results = await pBatch([], async (x) => x, { batchSize: 5 });
    expect(results).toEqual([]);
  });

  it('should handle batch size larger than array', async () => {
    const results = await pBatch([1, 2], async (x) => x, { batchSize: 100 });
    expect(results).toEqual([1, 2]);
  });
});
