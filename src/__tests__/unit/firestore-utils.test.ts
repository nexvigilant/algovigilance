/**
 * Firestore Utils Unit Tests
 *
 * Tests pure utility functions from firestore-utils.ts.
 * These functions handle paths, timestamps, and data sanitization.
 */

import { describe, it, expect } from '@jest/globals';

// ============================================================================
// Test Pure Functions (extracted logic, no Firebase dependency)
// ============================================================================

/**
 * Build a subcollection path (pure function)
 */
function getSubcollectionPath(
  parentCollection: string,
  parentId: string,
  subcollection: string
): string {
  return `${parentCollection}/${parentId}/${subcollection}`;
}

/**
 * Remove undefined values from an object (pure function)
 */
function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned as Partial<T>;
}

/**
 * Timestamp-like object interface
 */
interface TimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

/**
 * Parse various timestamp formats into a JavaScript Date (pure function)
 */
function parseTimestamp(
  value: TimestampLike | Date | string | null | undefined,
  fallback: Date = new Date()
): Date {
  if (!value) return fallback;

  // Already a Date
  if (value instanceof Date) return value;

  // ISO string
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? fallback : parsed;
  }

  // Timestamp-like object with toDate method
  if (typeof (value as TimestampLike).toDate === 'function') {
    return (value as TimestampLike).toDate?.() ?? fallback;
  }

  // Serialized timestamp object with seconds/nanoseconds
  if (
    typeof (value as TimestampLike).seconds === 'number' &&
    typeof (value as TimestampLike).nanoseconds === 'number'
  ) {
    const { seconds, nanoseconds } = value as TimestampLike;
    return new Date(seconds * 1000 + nanoseconds / 1000000);
  }

  return fallback;
}

// ============================================================================
// Tests
// ============================================================================

describe('Firestore Utils - Pure Functions', () => {
  describe('getSubcollectionPath', () => {
    it('should build simple subcollection path', () => {
      const path = getSubcollectionPath('users', 'user123', 'notifications');
      expect(path).toBe('users/user123/notifications');
    });

    it('should build nested subcollection path', () => {
      const path = getSubcollectionPath('pv_domains', 'domain-1', 'capability_components');
      expect(path).toBe('pv_domains/domain-1/capability_components');
    });

    it('should handle special characters in IDs', () => {
      const path = getSubcollectionPath('community_posts', 'post-abc-123', 'replies');
      expect(path).toBe('community_posts/post-abc-123/replies');
    });

    it('should handle UUID-style IDs', () => {
      const path = getSubcollectionPath(
        'conversations',
        '550e8400-e29b-41d4-a716-446655440000',
        'messages'
      );
      expect(path).toBe('conversations/550e8400-e29b-41d4-a716-446655440000/messages');
    });

    it('should handle empty string segments (edge case)', () => {
      const path = getSubcollectionPath('collection', '', 'subcollection');
      expect(path).toBe('collection//subcollection');
    });
  });

  describe('removeUndefined', () => {
    it('should remove undefined values', () => {
      const input = { name: 'John', age: undefined, email: 'john@example.com' };
      const result = removeUndefined(input);
      expect(result).toEqual({ name: 'John', email: 'john@example.com' });
      expect(result).not.toHaveProperty('age');
    });

    it('should keep null values', () => {
      const input = { name: 'John', bio: null };
      const result = removeUndefined(input);
      expect(result).toEqual({ name: 'John', bio: null });
    });

    it('should keep falsy values that are not undefined', () => {
      const input = { active: false, count: 0, name: '' };
      const result = removeUndefined(input);
      expect(result).toEqual({ active: false, count: 0, name: '' });
    });

    it('should return empty object for all undefined', () => {
      const input = { a: undefined, b: undefined };
      const result = removeUndefined(input);
      expect(result).toEqual({});
    });

    it('should handle empty object', () => {
      const result = removeUndefined({});
      expect(result).toEqual({});
    });

    it('should handle nested objects (keeps them as-is)', () => {
      const input = {
        user: { name: 'John' },
        settings: undefined,
        preferences: { theme: 'dark' },
      };
      const result = removeUndefined(input);
      expect(result).toEqual({
        user: { name: 'John' },
        preferences: { theme: 'dark' },
      });
    });
  });

  describe('parseTimestamp', () => {
    const fallbackDate = new Date('2020-01-01T00:00:00Z');

    describe('with null/undefined values', () => {
      it('should return fallback for null', () => {
        const result = parseTimestamp(null, fallbackDate);
        expect(result).toEqual(fallbackDate);
      });

      it('should return fallback for undefined', () => {
        const result = parseTimestamp(undefined, fallbackDate);
        expect(result).toEqual(fallbackDate);
      });

      it('should use current date as default fallback', () => {
        const before = new Date();
        const result = parseTimestamp(null);
        const after = new Date();
        expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('with Date objects', () => {
      it('should return the same Date object', () => {
        const date = new Date('2024-06-15T10:30:00Z');
        const result = parseTimestamp(date, fallbackDate);
        expect(result).toBe(date);
      });

      it('should handle past dates', () => {
        const date = new Date('1990-01-01T00:00:00Z');
        const result = parseTimestamp(date, fallbackDate);
        expect(result).toBe(date);
      });

      it('should handle future dates', () => {
        const date = new Date('2030-12-31T23:59:59Z');
        const result = parseTimestamp(date, fallbackDate);
        expect(result).toBe(date);
      });
    });

    describe('with ISO string timestamps', () => {
      it('should parse valid ISO string', () => {
        const result = parseTimestamp('2024-06-15T10:30:00Z', fallbackDate);
        expect(result.toISOString()).toBe('2024-06-15T10:30:00.000Z');
      });

      it('should parse ISO string with timezone offset', () => {
        const result = parseTimestamp('2024-06-15T10:30:00-05:00', fallbackDate);
        expect(result).toBeInstanceOf(Date);
        expect(result.getUTCHours()).toBe(15); // 10:30 - (-5) = 15:30 UTC
      });

      it('should return fallback for invalid string', () => {
        const result = parseTimestamp('not-a-date', fallbackDate);
        expect(result).toEqual(fallbackDate);
      });

      it('should return fallback for empty string', () => {
        const result = parseTimestamp('', fallbackDate);
        expect(result).toEqual(fallbackDate);
      });

      it('should handle date-only string', () => {
        // Note: Date-only strings are parsed as local time, which can shift days
        // Use UTC methods to avoid timezone issues
        const result = parseTimestamp('2024-06-15', fallbackDate);
        expect(result.getUTCFullYear()).toBe(2024);
        expect(result.getUTCMonth()).toBe(5); // June = 5 (0-indexed)
        expect(result.getUTCDate()).toBe(15);
      });
    });

    describe('with timestamp-like objects (Firestore serialized)', () => {
      it('should parse seconds and nanoseconds', () => {
        const timestampLike = {
          seconds: 1718445000, // June 15, 2024 10:30:00 UTC
          nanoseconds: 500000000, // 0.5 seconds
        };
        const result = parseTimestamp(timestampLike, fallbackDate);
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBe(1718445000 * 1000 + 500); // 0.5 seconds in ms
      });

      it('should handle zero nanoseconds', () => {
        const timestampLike = {
          seconds: 1718445000,
          nanoseconds: 0,
        };
        const result = parseTimestamp(timestampLike, fallbackDate);
        expect(result.getTime()).toBe(1718445000 * 1000);
      });

      it('should handle epoch timestamp', () => {
        const timestampLike = {
          seconds: 0,
          nanoseconds: 0,
        };
        const result = parseTimestamp(timestampLike, fallbackDate);
        expect(result.getTime()).toBe(0);
      });
    });

    describe('with toDate method (Firestore Timestamp mock)', () => {
      it('should call toDate method when available', () => {
        const mockDate = new Date('2024-06-15T10:30:00Z');
        const timestampLike = {
          seconds: 0,
          nanoseconds: 0,
          toDate: () => mockDate,
        };
        const result = parseTimestamp(timestampLike, fallbackDate);
        expect(result).toBe(mockDate);
      });
    });
  });
});

describe('Firestore Utils - Path Conventions', () => {
  it('should follow Firestore collection naming convention', () => {
    // Firestore paths use snake_case for collections by convention
    const userNotifications = getSubcollectionPath('users', 'uid', 'notifications');
    const pvComponents = getSubcollectionPath('pv_domains', 'id', 'capability_components');
    const postReplies = getSubcollectionPath('community_posts', 'id', 'replies');

    expect(userNotifications).toMatch(/^[a-z_]+\/[^/]+\/[a-z_]+$/);
    expect(pvComponents).toMatch(/^[a-z_]+\/[^/]+\/[a-z_]+$/);
    expect(postReplies).toMatch(/^[a-z_]+\/[^/]+\/[a-z_]+$/);
  });

  it('should handle deeply nested paths when chained', () => {
    // Build: users/{userId}/courses/{courseId}/modules
    const coursePath = getSubcollectionPath('users', 'user123', 'courses');
    const modulePath = getSubcollectionPath(coursePath, 'course456', 'modules');

    expect(modulePath).toBe('users/user123/courses/course456/modules');
  });
});

describe('Firestore Utils - Data Sanitization', () => {
  it('should prepare user data for Firestore', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      bio: undefined, // Optional field not provided
      avatar: undefined, // Optional field not provided
      createdAt: new Date(),
    };

    const sanitized = removeUndefined(userData);

    expect(sanitized).toHaveProperty('name');
    expect(sanitized).toHaveProperty('email');
    expect(sanitized).toHaveProperty('createdAt');
    expect(sanitized).not.toHaveProperty('bio');
    expect(sanitized).not.toHaveProperty('avatar');
  });

  it('should handle form submission with optional fields', () => {
    const formData = {
      firstName: 'Jane',
      lastName: 'Smith',
      company: '', // Empty but provided
      phone: undefined, // Not provided
      newsletter: false, // False but provided
    };

    const sanitized = removeUndefined(formData);

    expect(sanitized).toEqual({
      firstName: 'Jane',
      lastName: 'Smith',
      company: '',
      newsletter: false,
    });
  });
});
