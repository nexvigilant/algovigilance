import { toDateFromSerialized } from '@/types/academy';
/**
 * Serialization Utilities
 *
 * Utilities for serializing Firestore data for Server Components.
 * Converts Firestore-specific types (Timestamps) to plain JavaScript objects
 * that can be safely passed to Client Components.
 */

/**
 * Deep serialize any value for client component compatibility.
 * Recursively converts all Firestore Timestamps to ISO strings and strips prototypes
 * to ensure plain objects are passed to Client Components.
 *
 * Handles:
 * - Firestore Admin Timestamps ({ _seconds, _nanoseconds })
 * - Firestore Client Timestamps (with toDate method)
 * - Date objects
 * - Arrays (recursive)
 * - Objects (recursive, strips prototype)
 * - Primitives (pass-through)
 *
 * @example
 * // In a server action
 * const data = doc.data();
 * return deepSerialize(data) as MyType;
 */
export function deepSerialize(value: unknown): unknown {
  // Handle null/undefined
  if (value == null) return value;

  // Handle Firestore Timestamps first (before other object checks)
  if (typeof value === 'object') {
    // Firestore Admin Timestamp ({ _seconds, _nanoseconds })
    if ('_seconds' in (value as object)) {
      const ts = value as { _seconds: number; _nanoseconds: number };
      return new Date(ts._seconds * 1000).toISOString();
    }
    // Timestamp with toDate method
    if ('toDate' in (value as object) && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return toDateFromSerialized(value as { toDate: () => Date }).toISOString();
    }
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle arrays - recursively serialize each element
  if (Array.isArray(value)) {
    return value.map(item => deepSerialize(item));
  }

  // Handle plain objects - recursively serialize each property
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as object)) {
      result[key] = deepSerialize((value as Record<string, unknown>)[key]);
    }
    return result;
  }

  // Primitives (string, number, boolean) pass through
  return value;
}

/**
 * Type-safe wrapper for deepSerialize that preserves the input type.
 * Use this when you want to maintain type information after serialization.
 *
 * @example
 * const epa = serializeForClient<EPAPathway>(doc.data());
 */
export function serializeForClient<T>(data: T): T {
  return deepSerialize(data) as T;
}

/**
 * Serialize a single timestamp value to ISO string.
 * Returns null if the value is not a valid timestamp.
 *
 * @example
 * const createdAt = serializeTimestamp(data.createdAt);
 */
export function serializeTimestamp(value: unknown): string | null {
  if (!value) return null;

  // Handle Firestore Admin Timestamp ({ _seconds, _nanoseconds })
  if (typeof value === 'object' && '_seconds' in (value as object)) {
    const ts = value as { _seconds: number; _nanoseconds: number };
    return new Date(ts._seconds * 1000).toISOString();
  }

  // Handle Timestamp with toDate method
  if (typeof value === 'object' && 'toDate' in (value as object) && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return toDateFromSerialized(value as { toDate: () => Date }).toISOString();
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Already a string (ISO format)
  if (typeof value === 'string') {
    return value;
  }

  return null;
}
