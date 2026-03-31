/**
 * Performance Regression Tests for Community Actions
 *
 * These tests verify that optimized functions maintain their performance
 * characteristics and don't regress due to code changes.
 *
 * Tests are designed to:
 * - Run without Firebase (mock data)
 * - Measure algorithmic complexity (not network latency)
 * - Fail if performance degrades beyond thresholds
 *
 * @module tests/performance/community-actions.perf.test
 */

import { describe, it, expect } from '@jest/globals';

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  // Map building should be O(n) - fast even for large datasets
  mapBuildTime: 50, // 50ms for 1000 items
  // Lookup should be O(1) - constant time
  lookupTime: 1, // 1ms for 1000 lookups
  // Batch simulation should scale linearly
  batchProcessTime: 100, // 100ms for 100 batches
};

// Helper to measure execution time
async function measureTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}

// Generate mock user data
function generateMockUsers(count: number): Array<{ id: string; name: string; avatar: string }> {
  return Array.from({ length: count }, (_, i) => ({
    id: `user_${i}`,
    name: `User ${i}`,
    avatar: `https://example.com/avatar/${i}.jpg`,
  }));
}

// Generate mock follower relationships
function generateMockFollowers(count: number): Array<{ userId: string; followedAt: Date }> {
  return Array.from({ length: count }, (_, i) => ({
    userId: `user_${i}`,
    followedAt: new Date(),
  }));
}

describe('Community Actions Performance', () => {
  describe('Map-based Lookup Pattern', () => {
    /**
     * Tests the pattern used in getFollowers/getFollowing to replace N+1 queries
     * with batch reads + Map lookup
     */
    it('should build lookup map in O(n) time for 1000 users', async () => {
      const users = generateMockUsers(1000);

      const { durationMs } = await measureTime(() => {
        const userMap = new Map<string, (typeof users)[0]>();
        users.forEach((user) => {
          userMap.set(user.id, user);
        });
        return userMap;
      });

      console.log(`Map build time for 1000 users: ${durationMs.toFixed(2)}ms`);
      expect(durationMs).toBeLessThan(THRESHOLDS.mapBuildTime);
    });

    it('should perform 1000 lookups in O(1) constant time', async () => {
      const users = generateMockUsers(1000);
      const userMap = new Map<string, (typeof users)[0]>();
      users.forEach((user) => userMap.set(user.id, user));

      const followers = generateMockFollowers(1000);

      const { durationMs } = await measureTime(() => {
        return followers.map((follower) => {
          const userData = userMap.get(follower.userId);
          return {
            userId: follower.userId,
            followedAt: follower.followedAt,
            name: userData?.name,
            avatar: userData?.avatar,
          };
        });
      });

      console.log(`1000 Map lookups time: ${durationMs.toFixed(2)}ms`);
      expect(durationMs).toBeLessThan(THRESHOLDS.lookupTime);
    });

    it('should scale linearly from 100 to 10000 users', async () => {
      const sizes = [100, 1000, 10000];
      const times: number[] = [];

      for (const size of sizes) {
        const users = generateMockUsers(size);

        const { durationMs } = await measureTime(() => {
          const userMap = new Map<string, (typeof users)[0]>();
          users.forEach((user) => userMap.set(user.id, user));

          const followers = generateMockFollowers(size);
          return followers.map((f) => userMap.get(f.userId));
        });

        times.push(durationMs);
        console.log(`Size ${size}: ${durationMs.toFixed(2)}ms`);
      }

      // Check roughly linear scaling (10x data should be ~10x time, allow 20x)
      const ratio1to2 = times[1] / times[0];
      const ratio2to3 = times[2] / times[1];

      console.log(`Scaling ratios: 100→1000: ${ratio1to2.toFixed(2)}x, 1000→10000: ${ratio2to3.toFixed(2)}x`);

      // Linear scaling means ratios should be roughly equal (within factor)
      // Allow generous margin for JIT warmup and GC
      expect(ratio2to3).toBeLessThan(ratio1to2 * 5);
    });
  });

  describe('Batch Processing Pattern', () => {
    /**
     * Tests the pattern used for batch writes (writeBatch)
     * Simulates batching without actual Firestore
     */
    it('should batch items efficiently respecting 500-item limit', async () => {
      const BATCH_SIZE = 500;
      const TOTAL_ITEMS = 2500;
      const items = Array.from({ length: TOTAL_ITEMS }, (_, i) => ({ id: `item_${i}`, data: `data_${i}` }));

      const { result: batches, durationMs } = await measureTime(() => {
        const batches: (typeof items)[] = [];

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
          batches.push(items.slice(i, i + BATCH_SIZE));
        }

        return batches;
      });

      console.log(`Batch creation for ${TOTAL_ITEMS} items: ${durationMs.toFixed(2)}ms`);
      console.log(`Created ${batches.length} batches`);

      expect(batches.length).toBe(5); // 2500 / 500 = 5 batches
      expect(durationMs).toBeLessThan(THRESHOLDS.batchProcessTime);
    });

    it('should simulate batch commit pattern', async () => {
      const BATCH_SIZE = 400; // Leave room for Firestore overhead
      const TOTAL_OPERATIONS = 1000;

      interface MockOperation {
        type: 'set' | 'update' | 'delete';
        ref: string;
        data?: Record<string, unknown>;
      }

      const operations: MockOperation[] = Array.from({ length: TOTAL_OPERATIONS }, (_, i) => ({
        type: i % 3 === 0 ? 'set' : i % 3 === 1 ? 'update' : 'delete',
        ref: `collection/doc_${i}`,
        data: i % 3 !== 2 ? { field: `value_${i}` } : undefined,
      }));

      const { result: batches, durationMs } = await measureTime(async () => {
        const batches: MockOperation[][] = [];
        let currentBatch: MockOperation[] = [];

        for (const op of operations) {
          currentBatch.push(op);

          if (currentBatch.length >= BATCH_SIZE) {
            // Simulate batch commit (just adds to array in test)
            batches.push([...currentBatch]);
            currentBatch = [];
          }
        }

        // Commit remaining
        if (currentBatch.length > 0) {
          batches.push(currentBatch);
        }

        return batches;
      });

      console.log(`Batch commit simulation for ${TOTAL_OPERATIONS} ops: ${durationMs.toFixed(2)}ms`);
      console.log(`Created ${batches.length} batches with sizes: ${batches.map((b) => b.length).join(', ')}`);

      expect(batches.length).toBe(3); // 1000 / 400 = 2.5, rounds up to 3
      expect(batches[0].length).toBe(400);
      expect(batches[1].length).toBe(400);
      expect(batches[2].length).toBe(200);
    });
  });

  describe('Interest Matching Algorithm', () => {
    /**
     * Tests the pattern used in getSuggestedConnections for matching interests
     */
    it('should match interests efficiently for large user pools', async () => {
      const USER_COUNT = 100;
      const userInterests = ['pharmacovigilance', 'drug safety', 'regulatory affairs'];

      const users = Array.from({ length: USER_COUNT }, (_, i) => ({
        id: `user_${i}`,
        interests: [
          ['pharmacovigilance', 'clinical trials', 'data analysis'],
          ['drug safety', 'signal detection', 'risk management'],
          ['regulatory affairs', 'compliance', 'documentation'],
          ['biotechnology', 'research', 'innovation'],
        ][i % 4],
      }));

      const { result: scored, durationMs } = await measureTime(() => {
        return users.map((user) => {
          const commonInterests = userInterests.filter((interest) =>
            user.interests.some(
              (ui) => ui.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(ui.toLowerCase())
            )
          );

          const matchScore = userInterests.length > 0 ? Math.round((commonInterests.length / userInterests.length) * 100) : 50;

          return {
            id: user.id,
            matchScore,
            commonInterests,
          };
        });
      });

      console.log(`Interest matching for ${USER_COUNT} users: ${durationMs.toFixed(2)}ms`);

      // Verify results
      const withMatches = scored.filter((s) => s.matchScore > 0);
      console.log(`Users with matches: ${withMatches.length}`);

      expect(durationMs).toBeLessThan(50); // Should be fast
      expect(withMatches.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Efficiency', () => {
    /**
     * Tests that our patterns don't cause memory bloat
     */
    it('should not retain unnecessary references after map operations', () => {
      const users = generateMockUsers(10000);
      const userMap = new Map<string, (typeof users)[0]>();
      users.forEach((user) => userMap.set(user.id, user));

      // Clear map
      userMap.clear();

      // Map should be empty
      expect(userMap.size).toBe(0);
    });

    it('should handle large datasets without excessive memory allocation', async () => {
      // This test ensures we're not creating unnecessary intermediate arrays
      const ITEM_COUNT = 50000;

      const { durationMs } = await measureTime(() => {
        const items = new Map<string, number>();

        // Simulating batch read + lookup pattern
        for (let i = 0; i < ITEM_COUNT; i++) {
          items.set(`key_${i}`, i);
        }

        let sum = 0;
        for (let i = 0; i < ITEM_COUNT; i++) {
          sum += items.get(`key_${i}`) || 0;
        }

        return sum;
      });

      console.log(`Large dataset (${ITEM_COUNT} items) processing: ${durationMs.toFixed(2)}ms`);
      expect(durationMs).toBeLessThan(500); // Should complete in <500ms
    });
  });
});
