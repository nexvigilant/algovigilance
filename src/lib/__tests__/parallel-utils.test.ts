/**
 * Tests for parallel-utils.ts
 *
 * @module lib/__tests__/parallel-utils.test.ts
 */

import {
  fetchAllParallel,
  batchProcess,
  withTimeout,
  withRetry,
  getSuccessfulValues,
  getFailedResults,
  type SettledResult,
} from '../parallel-utils';

// Helper to create delayed promises
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to create a resolved promise after delay
const delayedResolve = <T>(value: T, ms: number): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), ms));

// Helper to create a rejected promise after delay
const _delayedReject = (error: Error, ms: number): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(error), ms));

describe('parallel-utils', () => {
  describe('fetchAllParallel', () => {
    it('returns all successful results with metadata', async () => {
      const operations = [
        () => Promise.resolve('a'),
        () => Promise.resolve('b'),
        () => Promise.resolve('c'),
      ];

      const results = await fetchAllParallel(operations, { logFailures: false });

      expect(results).toHaveLength(3);
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);
      expect(results.map(r => r.value)).toEqual(['a', 'b', 'c']);
      expect(results.every(r => typeof r.durationMs === 'number')).toBe(true);
      expect(results.map(r => r.index)).toEqual([0, 1, 2]);
    });

    it('handles mixed success and failure', async () => {
      const operations = [
        () => Promise.resolve('success'),
        () => Promise.reject(new Error('failure')),
        () => Promise.resolve('also success'),
      ];

      const results = await fetchAllParallel(operations, { logFailures: false });

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[0].value).toBe('success');
      expect(results[1].status).toBe('rejected');
      expect(results[1].reason?.message).toBe('failure');
      expect(results[2].status).toBe('fulfilled');
      expect(results[2].value).toBe('also success');
    });

    it('handles empty array', async () => {
      const results = await fetchAllParallel([]);
      expect(results).toEqual([]);
    });

    it('runs operations in parallel (not sequential)', async () => {
      const startTime = Date.now();
      const operations = [
        () => delayedResolve('a', 50),
        () => delayedResolve('b', 50),
        () => delayedResolve('c', 50),
      ];

      await fetchAllParallel(operations, { logFailures: false });

      // If sequential, would take ~150ms. Parallel should be ~50ms (+buffer)
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(100); // Should be around 50ms
    });

    it('converts non-Error rejections to Error objects', async () => {
      const operations = [
        () => Promise.reject('string error'),
      ];

      const results = await fetchAllParallel(operations, { logFailures: false });

      expect(results[0].status).toBe('rejected');
      expect(results[0].reason).toBeInstanceOf(Error);
      expect(results[0].reason?.message).toBe('string error');
    });
  });

  describe('batchProcess', () => {
    it('processes items in batches with correct concurrency', async () => {
      const processed: number[] = [];
      const items = [1, 2, 3, 4, 5, 6, 7];

      const results = await batchProcess(
        items,
        async (item) => {
          processed.push(item);
          return item * 2;
        },
        { concurrency: 3, label: 'test' }
      );

      // All items should be processed
      expect(processed.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);

      // All results should be fulfilled
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);
      expect(getSuccessfulValues(results).sort((a, b) => a - b)).toEqual([2, 4, 6, 8, 10, 12, 14]);

      // Indices should be absolute (not batch-relative)
      expect(results.map(r => r.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('respects concurrency limit', async () => {
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const items = Array.from({ length: 10 }, (_, i) => i);

      await batchProcess(
        items,
        async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await delay(20);
          concurrentCount--;
          return true;
        },
        { concurrency: 3 }
      );

      // Should never exceed the concurrency limit
      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });

    it('continues on error when continueOnError is true', async () => {
      const items = [1, 2, 3, 4, 5];

      const results = await batchProcess(
        items,
        async (item) => {
          if (item === 3) throw new Error('item 3 failed');
          return item;
        },
        { concurrency: 2, continueOnError: true }
      );

      const successful = getSuccessfulValues(results);
      const failed = getFailedResults(results);

      expect(successful).toEqual([1, 2, 4, 5]);
      expect(failed).toHaveLength(1);
      expect(failed[0].index).toBe(2); // Item 3 is at index 2
    });

    it('throws on first error when continueOnError is false', async () => {
      const items = [1, 2, 3, 4, 5];

      await expect(
        batchProcess(
          items,
          async (item) => {
            if (item === 2) throw new Error('item 2 failed');
            return item;
          },
          { concurrency: 5, continueOnError: false }
        )
      ).rejects.toThrow('item 2 failed');
    });

    it('handles empty array', async () => {
      const results = await batchProcess([], async () => 'never called', { concurrency: 3 });
      expect(results).toEqual([]);
    });
  });

  describe('withTimeout', () => {
    it('returns result when operation completes before timeout', async () => {
      const result = await withTimeout(
        delayedResolve('success', 10),
        100
      );
      expect(result).toBe('success');
    });

    it('throws when operation exceeds timeout', async () => {
      await expect(
        withTimeout(delayedResolve('too slow', 100), 10)
      ).rejects.toThrow('timed out');
    });

    it('uses custom error message', async () => {
      await expect(
        withTimeout(delayedResolve('slow', 100), 10, { message: 'Custom timeout' })
      ).rejects.toThrow('Custom timeout');
    });

    it('uses label in default error message', async () => {
      await expect(
        withTimeout(delayedResolve('slow', 100), 10, { label: 'MyOperation' })
      ).rejects.toThrow('MyOperation timed out after 10ms');
    });

    it('propagates original error if operation fails before timeout', async () => {
      await expect(
        withTimeout(Promise.reject(new Error('original error')), 1000)
      ).rejects.toThrow('original error');
    });
  });

  describe('withRetry', () => {
    it('returns result on first successful attempt', async () => {
      let attempts = 0;
      const result = await withRetry(async () => {
        attempts++;
        return 'success';
      }, { maxAttempts: 3 });

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('retries on failure and succeeds', async () => {
      let attempts = 0;
      const result = await withRetry(
        async () => {
          attempts++;
          if (attempts < 3) throw new Error(`attempt ${attempts} failed`);
          return 'success on 3rd try';
        },
        { maxAttempts: 3, baseDelayMs: 1 } // Short delay for tests
      );

      expect(result).toBe('success on 3rd try');
      expect(attempts).toBe(3);
    });

    it('throws after exhausting retries', async () => {
      let attempts = 0;

      await expect(
        withRetry(
          async () => {
            attempts++;
            throw new Error(`attempt ${attempts} failed`);
          },
          { maxAttempts: 3, baseDelayMs: 1 }
        )
      ).rejects.toThrow('attempt 3 failed');

      expect(attempts).toBe(3);
    });

    it('respects shouldRetry predicate', async () => {
      let attempts = 0;

      await expect(
        withRetry(
          async () => {
            attempts++;
            throw new Error('non-retryable');
          },
          {
            maxAttempts: 5,
            baseDelayMs: 1,
            shouldRetry: (error) => !error.message.includes('non-retryable'),
          }
        )
      ).rejects.toThrow('non-retryable');

      // Should only attempt once because shouldRetry returns false
      expect(attempts).toBe(1);
    });

    it('applies exponential backoff with max cap', async () => {
      const delays: number[] = [];
      let lastTime = Date.now();

      try {
        await withRetry(
          async () => {
            const now = Date.now();
            delays.push(now - lastTime);
            lastTime = now;
            throw new Error('always fails');
          },
          {
            maxAttempts: 4,
            baseDelayMs: 10,
            maxDelayMs: 25,
          }
        );
      } catch {
        // Expected
      }

      // First delay is negligible (immediate first attempt)
      // Second delay should be ~10ms (baseDelayMs * 2^0)
      // Third delay should be ~20ms (baseDelayMs * 2^1)
      // Fourth delay would be 40ms but capped at 25ms
      expect(delays.length).toBe(4);
      expect(delays[1]).toBeGreaterThanOrEqual(8); // ~10ms
      expect(delays[2]).toBeGreaterThanOrEqual(18); // ~20ms
      expect(delays[3]).toBeLessThanOrEqual(30); // Capped at ~25ms
    });
  });

  describe('getSuccessfulValues', () => {
    it('extracts only fulfilled values', () => {
      const results: SettledResult<string>[] = [
        { status: 'fulfilled', value: 'a', index: 0, durationMs: 10 },
        { status: 'rejected', reason: new Error('failed'), index: 1, durationMs: 5 },
        { status: 'fulfilled', value: 'c', index: 2, durationMs: 15 },
      ];

      const values = getSuccessfulValues(results);
      expect(values).toEqual(['a', 'c']);
    });

    it('returns empty array when all failed', () => {
      const results: SettledResult<string>[] = [
        { status: 'rejected', reason: new Error('1'), index: 0, durationMs: 5 },
        { status: 'rejected', reason: new Error('2'), index: 1, durationMs: 5 },
      ];

      const values = getSuccessfulValues(results);
      expect(values).toEqual([]);
    });

    it('handles empty array', () => {
      expect(getSuccessfulValues([])).toEqual([]);
    });
  });

  describe('getFailedResults', () => {
    it('extracts only failed results with index and error', () => {
      const results: SettledResult<string>[] = [
        { status: 'fulfilled', value: 'a', index: 0, durationMs: 10 },
        { status: 'rejected', reason: new Error('error 1'), index: 1, durationMs: 5 },
        { status: 'fulfilled', value: 'c', index: 2, durationMs: 15 },
        { status: 'rejected', reason: new Error('error 3'), index: 3, durationMs: 8 },
      ];

      const failed = getFailedResults(results);

      expect(failed).toHaveLength(2);
      expect(failed[0]).toEqual({ index: 1, error: expect.any(Error) });
      expect(failed[0].error.message).toBe('error 1');
      expect(failed[1]).toEqual({ index: 3, error: expect.any(Error) });
      expect(failed[1].error.message).toBe('error 3');
    });

    it('returns empty array when all succeeded', () => {
      const results: SettledResult<string>[] = [
        { status: 'fulfilled', value: 'a', index: 0, durationMs: 10 },
        { status: 'fulfilled', value: 'b', index: 1, durationMs: 15 },
      ];

      const failed = getFailedResults(results);
      expect(failed).toEqual([]);
    });
  });
});
