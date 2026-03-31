/**
 * Timestamp Conversion Utilities
 *
 * Centralized utilities for converting Firebase Admin SDK Timestamps
 * to ISO strings for client component compatibility.
 *
 * @module actions/utils/timestamp
 */

import type { Timestamp } from 'firebase-admin/firestore';
import { toDateFromSerialized } from '@/types/academy';

/**
 * Represents a Firebase Admin SDK Timestamp shape
 */
interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

/**
 * Type guard to check if a value is a Firestore timestamp
 */
function isFirestoreTimestamp(value: unknown): value is FirestoreTimestamp {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_seconds' in value &&
    '_nanoseconds' in value &&
    typeof (value as FirestoreTimestamp)._seconds === 'number'
  );
}

/**
 * Type guard to check if a value is a Firebase Admin Timestamp instance
 */
function isTimestampInstance(value: unknown): value is Timestamp {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as Timestamp).toDate === 'function'
  );
}

/**
 * Convert Admin SDK Timestamps to ISO strings for client component compatibility.
 *
 * Handles:
 * - Raw Firestore timestamp objects ({ _seconds, _nanoseconds })
 * - Firebase Admin Timestamp instances (with toDate method)
 * - Nested objects and arrays
 * - Null/undefined values
 *
 * @param data - The data to convert (can be any shape)
 * @param depth - Current recursion depth (internal use)
 * @returns The same data structure with timestamps converted to ISO strings
 *
 * @example
 * ```typescript
 * const doc = await adminDb.collection('posts').doc(id).get();
 * const data = doc.data();
 * const serializable = convertTimestamps(data);
 * // All timestamp fields are now ISO strings
 * ```
 */
export function convertTimestamps<T>(data: T, depth = 0): T {
  // Safety check for deep nesting or circular references
  if (depth > 10) {
    return data;
  }

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Firestore timestamp objects
  if (isFirestoreTimestamp(data)) {
    return new Date(data._seconds * 1000).toISOString() as T;
  }

  // Handle Timestamp instances (from Admin SDK)
  if (isTimestampInstance(data)) {
    return toDateFromSerialized(data).toISOString() as T;
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString() as T;
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => convertTimestamps(item, depth + 1)) as T;
  }

  // Handle objects
  const result: Record<string, unknown> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      result[key] = convertTimestamps((data as Record<string, unknown>)[key], depth + 1);
    }
  }
  return result as T;
}

/**
 * Convert a single timestamp value to ISO string.
 * Returns null if the value is not a valid timestamp.
 *
 * @param value - The timestamp value to convert
 * @returns ISO string or null
 */
export function timestampToISO(value: unknown): string | null {
  if (!value) return null;

  if (isFirestoreTimestamp(value)) {
    return new Date(value._seconds * 1000).toISOString();
  }

  if (isTimestampInstance(value)) {
    return toDateFromSerialized(value).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    // Already a string, validate it's a valid date
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return value;
    }
  }

  return null;
}

/**
 * Parse a flexible timestamp (ISO string, Date, or Firestore Timestamp) to Date.
 *
 * @param value - The timestamp value to parse
 * @returns Date object or null if invalid
 */
export function parseTimestamp(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (isFirestoreTimestamp(value)) {
    return new Date(value._seconds * 1000);
  }

  if (isTimestampInstance(value)) {
    return toDateFromSerialized(value);
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}
