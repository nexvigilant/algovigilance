/**
 * Community Timestamp Types
 *
 * Serialization types for Firestore timestamps in the community module.
 *
 * @module types/community/timestamps
 */

import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// SERIALIZATION TYPES
// ============================================================================

/**
 * Serialized representation of a Firestore Timestamp.
 * Used when returning data from server actions to clients.
 */
export interface SerializedTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

// ============================================================================
// FLEXIBLE TIMESTAMP
// ============================================================================

/**
 * Flexible timestamp type that works with both client and admin SDK Timestamps,
 * as well as serialized forms from server actions and JSON.
 *
 * @remarks
 * Use this for any timestamp field that may come from different sources:
 * - Firestore Timestamp (client or admin SDK)
 * - Serialized timestamp from server actions
 * - Date objects
 * - ISO date strings
 */
export type FlexibleTimestamp =
  | Timestamp
  | { seconds: number; nanoseconds: number; toDate?: () => Date }
  | Date
  | string;
