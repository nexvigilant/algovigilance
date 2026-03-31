// ============================================================================
// SERIALIZATION TYPES
// ============================================================================
// Server actions cannot return Firestore Timestamp objects directly.
// These types represent the serialized form for client-server communication.

import { type Timestamp } from 'firebase/firestore';

/**
 * Serialized representation of a Firestore Timestamp.
 * Used when returning data from server actions to clients.
 */
export interface SerializedTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

/**
 * Convert a Firestore Timestamp to serializable format.
 * @param ts - Firestore Timestamp, null, or undefined
 * @returns SerializedTimestamp or undefined if input is null/undefined
 */
export function serializeTimestamp(ts: Timestamp | null | undefined): SerializedTimestamp | undefined {
  if (!ts) return undefined;
  return { seconds: ts.seconds, nanoseconds: ts.nanoseconds };
}

/**
 * Convert a SerializedTimestamp to milliseconds since epoch.
 * Safe to call on both SerializedTimestamp objects and Firestore Timestamps.
 * @param ts - SerializedTimestamp, Firestore Timestamp, null, or undefined
 * @returns Milliseconds since epoch, or 0 if timestamp is null/undefined
 */
export function toMillisFromSerialized(ts: SerializedTimestamp | Timestamp | Record<string, unknown> | null | undefined): number {
  if (!ts) return 0;
  const obj = ts as Record<string, unknown>;
  // Handle Firestore Timestamp
  if ('toMillis' in obj && typeof obj.toMillis === 'function') {
    return (obj.toMillis as () => number)();
  }
  // SerializedTimestamp: { seconds, nanoseconds }
  const seconds = typeof obj.seconds === 'number' ? obj.seconds : 0;
  const nanoseconds = typeof obj.nanoseconds === 'number' ? obj.nanoseconds : 0;
  return seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
}

/**
 * Convert a SerializedTimestamp to a JavaScript Date object.
 * Safe to call on both SerializedTimestamp objects and Firestore Timestamps.
 * @param ts - SerializedTimestamp, Firestore Timestamp, null, or undefined
 * @returns Date object, or current date if timestamp is null/undefined
 */
export function toDateFromSerialized(ts: SerializedTimestamp | Timestamp | Record<string, unknown> | null | undefined): Date {
  if (!ts) return new Date();
  const obj = ts as Record<string, unknown>;
  // Handle Firestore Timestamp
  if ('toDate' in obj && typeof obj.toDate === 'function') {
    return (obj.toDate as () => Date)();
  }
  // SerializedTimestamp: use milliseconds conversion
  return new Date(toMillisFromSerialized(ts));
}

/**
 * Format a SerializedTimestamp as a localized date string.
 * Safe to call on both SerializedTimestamp objects and Firestore Timestamps.
 * @param ts - SerializedTimestamp, Firestore Timestamp, null, or undefined
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Localized date string
 */
export function formatTimestamp(
  ts: SerializedTimestamp | Timestamp | Record<string, unknown> | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDateFromSerialized(ts);
  return date.toLocaleDateString(undefined, options);
}
