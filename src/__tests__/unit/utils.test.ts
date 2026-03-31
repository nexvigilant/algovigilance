/**
 * Core Utils Unit Tests
 *
 * Tests core utility functions including:
 * - cn() - Tailwind CSS classname merger
 * - toDate() - Flexible timestamp converter
 */

import { describe, it, expect } from '@jest/globals';
import { cn, toDate } from '@/lib/utils';

describe('Core Utils', () => {
  describe('cn (classname merger)', () => {
    it('should merge simple class strings', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    it('should handle null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar');
    });

    it('should handle boolean false', () => {
      const condition = false;
      expect(cn('foo', condition && 'hidden', 'bar')).toBe('foo bar');
    });

    it('should include class when boolean true', () => {
      const condition = true;
      expect(cn('foo', condition && 'visible', 'bar')).toBe('foo visible bar');
    });

    it('should handle empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle object syntax', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should handle mixed syntax', () => {
      expect(cn('base', ['array'], { object: true })).toBe('base array object');
    });

    describe('Tailwind merge behavior', () => {
      it('should merge conflicting padding classes', () => {
        expect(cn('p-4', 'p-2')).toBe('p-2');
      });

      it('should merge conflicting margin classes', () => {
        expect(cn('m-4', 'm-8')).toBe('m-8');
      });

      it('should merge conflicting text colors', () => {
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      });

      it('should merge conflicting background colors', () => {
        expect(cn('bg-white', 'bg-gray-100')).toBe('bg-gray-100');
      });

      it('should merge conflicting display classes', () => {
        expect(cn('block', 'flex')).toBe('flex');
      });

      it('should keep non-conflicting classes', () => {
        expect(cn('p-4', 'm-4', 'text-lg')).toBe('p-4 m-4 text-lg');
      });

      it('should handle responsive prefixes', () => {
        expect(cn('p-4', 'md:p-6', 'lg:p-8')).toBe('p-4 md:p-6 lg:p-8');
      });

      it('should merge responsive conflicts', () => {
        expect(cn('md:p-4', 'md:p-6')).toBe('md:p-6');
      });

      it('should handle state prefixes', () => {
        expect(cn('hover:bg-blue-500', 'hover:bg-red-500')).toBe('hover:bg-red-500');
      });

      it('should handle complex component patterns', () => {
        const base = 'px-4 py-2 rounded bg-blue-500 text-white';
        const override = 'bg-red-500 py-3';
        expect(cn(base, override)).toBe('px-4 rounded text-white bg-red-500 py-3');
      });
    });

    describe('Edge cases', () => {
      it('should return empty string for no arguments', () => {
        expect(cn()).toBe('');
      });

      it('should return empty string for all falsy', () => {
        expect(cn(undefined, null, false, '')).toBe('');
      });

      it('should handle deeply nested arrays', () => {
        expect(cn(['foo', ['bar', ['baz']]])).toBe('foo bar baz');
      });

      it('should handle number 0 (falsy but valid index)', () => {
        // clsx treats 0 as falsy
        expect(cn('foo', 0, 'bar')).toBe('foo bar');
      });
    });
  });

  describe('toDate (timestamp converter)', () => {
    describe('Date object input', () => {
      it('should return same Date object', () => {
        const date = new Date('2024-01-15T12:00:00Z');
        const result = toDate(date);
        expect(result).toBe(date);
      });

      it('should handle Date with specific time', () => {
        const date = new Date('2024-06-15T14:30:00Z');
        expect(toDate(date).toISOString()).toBe('2024-06-15T14:30:00.000Z');
      });
    });

    describe('String input', () => {
      it('should parse ISO string', () => {
        const result = toDate('2024-01-15T12:00:00Z');
        expect(result.toISOString()).toBe('2024-01-15T12:00:00.000Z');
      });

      it('should parse date-only string', () => {
        const result = toDate('2024-01-15');
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(0); // January
        // Note: Date parsing of 'YYYY-MM-DD' is timezone-sensitive
        // getUTCDate() is more reliable for testing
        expect(result.getUTCDate()).toBe(15);
      });

      it('should parse datetime string', () => {
        const result = toDate('January 15, 2024 12:00:00');
        expect(result.getFullYear()).toBe(2024);
      });
    });

    describe('Number input (timestamp)', () => {
      it('should parse millisecond timestamp', () => {
        const timestamp = 1705320000000; // 2024-01-15T12:00:00Z
        const result = toDate(timestamp);
        expect(result.getTime()).toBe(timestamp);
      });

      it('should return current date for 0 (falsy number)', () => {
        // 0 is falsy, so toDate(0) returns new Date() per the implementation
        // This is intentional - 0 timestamps are treated as "no value"
        const before = Date.now();
        const result = toDate(0);
        const after = Date.now();

        expect(result.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.getTime()).toBeLessThanOrEqual(after);
      });

      it('should handle large timestamp', () => {
        const timestamp = 2000000000000; // 2033
        const result = toDate(timestamp);
        expect(result.getTime()).toBe(timestamp);
      });
    });

    describe('Firestore Timestamp object', () => {
      it('should call toDate method if present', () => {
        const expectedDate = new Date('2024-01-15T12:00:00Z');
        const firestoreTimestamp = {
          toDate: () => expectedDate,
          seconds: 1705320000,
          nanoseconds: 0,
        };

        const result = toDate(firestoreTimestamp);
        expect(result).toBe(expectedDate);
      });
    });

    describe('Serialized timestamp with seconds', () => {
      it('should parse object with seconds property', () => {
        const serialized = { seconds: 1705320000 }; // 2024-01-15T12:00:00Z
        const result = toDate(serialized);
        expect(result.getTime()).toBe(1705320000000);
      });

      it('should handle seconds = 0', () => {
        const serialized = { seconds: 0 };
        const result = toDate(serialized);
        expect(result.getTime()).toBe(0);
      });
    });

    describe('Serialized timestamp with _seconds', () => {
      it('should parse object with _seconds property', () => {
        const serialized = { _seconds: 1705320000 }; // 2024-01-15T12:00:00Z
        const result = toDate(serialized);
        expect(result.getTime()).toBe(1705320000000);
      });

      it('should handle _seconds = 0', () => {
        const serialized = { _seconds: 0 };
        const result = toDate(serialized);
        expect(result.getTime()).toBe(0);
      });
    });

    describe('Falsy and invalid input', () => {
      it('should return current date for null', () => {
        const before = Date.now();
        const result = toDate(null);
        const after = Date.now();

        expect(result.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.getTime()).toBeLessThanOrEqual(after);
      });

      it('should return current date for undefined', () => {
        const before = Date.now();
        const result = toDate(undefined);
        const after = Date.now();

        expect(result.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.getTime()).toBeLessThanOrEqual(after);
      });

      it('should return current date for empty string', () => {
        const before = Date.now();
        const result = toDate('');
        const after = Date.now();

        expect(result.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.getTime()).toBeLessThanOrEqual(after);
      });

      it('should return current date for empty object', () => {
        const before = Date.now();
        const result = toDate({});
        const after = Date.now();

        expect(result.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.getTime()).toBeLessThanOrEqual(after);
      });

      it('should return current date for object without timestamp properties', () => {
        const before = Date.now();
        const result = toDate({ foo: 'bar' });
        const after = Date.now();

        expect(result.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.getTime()).toBeLessThanOrEqual(after);
      });

      it('should return current date for array', () => {
        const before = Date.now();
        const result = toDate([2024, 1, 15]);
        const after = Date.now();

        expect(result.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.getTime()).toBeLessThanOrEqual(after);
      });

      it('should return current date for boolean', () => {
        const before = Date.now();
        const result = toDate(true);
        const after = Date.now();

        expect(result.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.getTime()).toBeLessThanOrEqual(after);
      });
    });

    describe('Priority of conversions', () => {
      it('should prefer toDate method over seconds property', () => {
        const expectedDate = new Date('2024-06-15T00:00:00Z');
        const hybrid = {
          toDate: () => expectedDate,
          seconds: 1705320000, // Different date
        };

        const result = toDate(hybrid);
        expect(result).toBe(expectedDate);
      });

      it('should prefer seconds over _seconds', () => {
        const obj = {
          seconds: 1705320000,
          _seconds: 1609459200, // Different timestamp
        };

        const result = toDate(obj);
        expect(result.getTime()).toBe(1705320000000);
      });
    });
  });
});
