import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
  onSnapshot,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ZodSchema } from 'zod';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('lib/firestore-utils');

// ============================================================================
// Collection Name Constants (Single Source of Truth)
// ============================================================================

/**
 * Firestore collection names.
 * These map canonical type names to the actual Firestore collection paths.
 * Collection paths are NOT renamed in Firestore (data migration required).
 * Use these constants instead of hardcoded strings.
 */
export const COLLECTIONS = {
  /** CapabilityPathway documents (Firestore path: 'courses') */
  PATHWAYS: 'courses',
  /** PathwayEnrollment documents (Firestore path: 'enrollments') */
  ENROLLMENTS: 'enrollments',
  /** CapabilityVerification documents (Firestore path: 'certificates') */
  VERIFICATIONS: 'certificates',
  /** PathwayBuilderDraft documents (Firestore path: 'course_drafts') */
  PATHWAY_DRAFTS: 'course_drafts',
  /** Pathway review documents (Firestore path: 'course_reviews') */
  PATHWAY_REVIEWS: 'course_reviews',
  /** Activity notes (Firestore path: 'lesson_notes') */
  ACTIVITY_NOTES: 'lesson_notes',
  /** Activity bookmarks (Firestore path: 'lesson_bookmarks') */
  ACTIVITY_BOOKMARKS: 'lesson_bookmarks',
  /** User profiles */
  USERS: 'users',
  /** Community posts */
  COMMUNITY_POSTS: 'community_posts',
  /** PV domains with capability components */
  PV_DOMAINS: 'pv_domains',
} as const;

/**
 * Firestore subcollection names within pathways.
 */
export const SUBCOLLECTIONS = {
  /** CapabilityStage documents within a pathway (Firestore: 'modules') */
  STAGES: 'modules',
  /** Capability components within a PV domain */
  CAPABILITY_COMPONENTS: 'capability_components',
} as const;

// ============================================================================
// Generic CRUD Operations
// ============================================================================

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
function removeUndefined<T extends DocumentData>(obj: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned as Partial<T>;
}

/**
 * Create a new document in a collection
 *
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID
 * @param data - Document data
 * @param schema - Optional Zod schema for validation
 */
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: T,
  schema?: ZodSchema<T>
): Promise<void> {
  if (schema) {
    schema.parse(data); // Validate before write
  }

  const docRef = doc(db, collectionName, id);
  const cleanedData = removeUndefined(data);
  await setDoc(docRef, {
    ...cleanedData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get a single document by ID
 *
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID
 * @param schema - Optional Zod schema for validation
 * @returns Document data or null if not found
 */
export async function getDocument<T>(
  collectionName: string,
  id: string,
  schema?: ZodSchema<T>
): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = { id: docSnap.id, ...docSnap.data() } as T;

  if (schema) {
    return schema.parse(data);
  }

  return data;
}

/**
 * Update an existing document
 *
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID
 * @param data - Partial document data to update
 * @param schema - Optional Zod schema for validation
 */
export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>,
  schema?: ZodSchema<Partial<T>>
): Promise<void> {
  if (schema) {
    schema.parse(data);
  }

  const docRef = doc(db, collectionName, id);
  const cleanedData = removeUndefined(data as DocumentData);
  await updateDoc(docRef, {
    ...cleanedData,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a document from a collection
 *
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID
 */
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Query documents with constraints
 *
 * @param collectionName - Name of the Firestore collection
 * @param constraints - Array of Firestore query constraints
 * @param schema - Optional Zod schema for validation
 * @returns Array of documents matching the query
 */
export async function queryDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  schema?: ZodSchema<T>
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...constraints);
  const querySnapshot = await getDocs(q);

  const results = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];

  if (schema) {
    return results.map((item) => schema.parse(item));
  }

  return results;
}

/**
 * Get all documents from a collection
 *
 * @param collectionName - Name of the Firestore collection
 * @param schema - Optional Zod schema for validation
 * @returns Array of all documents in the collection
 */
export async function getAllDocuments<T>(
  collectionName: string,
  schema?: ZodSchema<T>
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const querySnapshot = await getDocs(collectionRef);

  const results = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];

  if (schema) {
    return results.map((item) => schema.parse(item));
  }

  return results;
}

// ============================================================================
// Real-time Listeners
// ============================================================================

/**
 * Subscribe to a single document in real-time
 *
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID
 * @param callback - Function to call when document changes
 * @param schema - Optional Zod schema for validation
 * @returns Unsubscribe function
 */
export function subscribeToDocument<T>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void,
  schema?: ZodSchema<T>
): Unsubscribe {
  const docRef = doc(db, collectionName, id);

  return onSnapshot(docRef, (docSnap: DocumentSnapshot) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }

    const data = { id: docSnap.id, ...docSnap.data() } as T;

    if (schema) {
      try {
        callback(schema.parse(data));
      } catch (error) {
        log.error('Schema validation failed for document:', error);
        callback(null);
      }
    } else {
      callback(data);
    }
  });
}

/**
 * Subscribe to a query in real-time
 *
 * @param collectionName - Name of the Firestore collection
 * @param constraints - Array of Firestore query constraints
 * @param callback - Function to call when query results change
 * @param schema - Optional Zod schema for validation
 * @returns Unsubscribe function
 */
export function subscribeToQuery<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void,
  schema?: ZodSchema<T>
): Unsubscribe {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...constraints);

  return onSnapshot(q, (querySnapshot: QuerySnapshot) => {
    const results = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    if (schema) {
      try {
        callback(results.map((item) => schema.parse(item)));
      } catch (error) {
        log.error('Schema validation failed for query results:', error);
        callback([]);
      }
    } else {
      callback(results);
    }
  });
}

// ============================================================================
// Timestamp Helpers
// ============================================================================

/**
 * Timestamp-like object from serialized data (server actions, JSON)
 */
interface TimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

/**
 * Parse various timestamp formats into a JavaScript Date
 * Handles: Firestore Timestamp, serialized timestamp objects, Date strings, Date objects
 *
 * @param value - The timestamp value in various formats
 * @param fallback - Optional fallback date (defaults to current date)
 * @returns JavaScript Date
 */
export function parseTimestamp(
  value: Timestamp | TimestampLike | Date | string | null | undefined,
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

  // Firestore Timestamp instance
  if (value instanceof Timestamp) {
    return toDateFromSerialized(value);
  }

  // Timestamp-like object with toDate method (Firestore Timestamp from query)
  if (typeof (value as TimestampLike).toDate === 'function') {
    return (value as TimestampLike).toDate?.() ?? new Date();
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

/**
 * Convert a JavaScript Date to Firestore Timestamp
 */
export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Convert a Firestore Timestamp to JavaScript Date
 */
export function fromTimestamp(timestamp: Timestamp): Date {
  return toDateFromSerialized(timestamp);
}

/**
 * Get the current Firestore server timestamp
 */
export function nowTimestamp(): Timestamp {
  return Timestamp.now();
}

/**
 * Check if a value is a Firestore Timestamp
 */
export function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

// ============================================================================
// Subcollection Helpers
// ============================================================================

/**
 * Build a subcollection path
 *
 * @param parentCollection - Parent collection name
 * @param parentId - Parent document ID
 * @param subcollection - Subcollection name
 * @returns Full path to subcollection
 */
export function getSubcollectionPath(
  parentCollection: string,
  parentId: string,
  subcollection: string
): string {
  return `${parentCollection}/${parentId}/${subcollection}`;
}

/**
 * Create a document in a subcollection
 *
 * @param parentCollection - Parent collection name
 * @param parentId - Parent document ID
 * @param subcollection - Subcollection name
 * @param docId - Document ID in subcollection
 * @param data - Document data
 * @param schema - Optional Zod schema for validation
 */
export async function createSubcollectionDocument<T extends DocumentData>(
  parentCollection: string,
  parentId: string,
  subcollection: string,
  docId: string,
  data: T,
  schema?: ZodSchema<T>
): Promise<void> {
  const path = getSubcollectionPath(parentCollection, parentId, subcollection);
  await createDocument(path, docId, data, schema);
}

/**
 * Get a document from a subcollection
 *
 * @param parentCollection - Parent collection name
 * @param parentId - Parent document ID
 * @param subcollection - Subcollection name
 * @param docId - Document ID in subcollection
 * @param schema - Optional Zod schema for validation
 * @returns Document data or null if not found
 */
export async function getSubcollectionDocument<T>(
  parentCollection: string,
  parentId: string,
  subcollection: string,
  docId: string,
  schema?: ZodSchema<T>
): Promise<T | null> {
  const path = getSubcollectionPath(parentCollection, parentId, subcollection);
  return getDocument(path, docId, schema);
}

/**
 * Query a subcollection
 *
 * @param parentCollection - Parent collection name
 * @param parentId - Parent document ID
 * @param subcollection - Subcollection name
 * @param constraints - Array of Firestore query constraints
 * @param schema - Optional Zod schema for validation
 * @returns Array of documents matching the query
 */
export async function querySubcollection<T>(
  parentCollection: string,
  parentId: string,
  subcollection: string,
  constraints: QueryConstraint[],
  schema?: ZodSchema<T>
): Promise<T[]> {
  const path = getSubcollectionPath(parentCollection, parentId, subcollection);
  return queryDocuments(path, constraints, schema);
}

/**
 * Update a document in a subcollection
 *
 * @param parentCollection - Parent collection name
 * @param parentId - Parent document ID
 * @param subcollection - Subcollection name
 * @param docId - Document ID in subcollection
 * @param data - Partial document data to update
 * @param schema - Optional Zod schema for validation
 */
export async function updateSubcollectionDocument<T extends DocumentData>(
  parentCollection: string,
  parentId: string,
  subcollection: string,
  docId: string,
  data: Partial<T>,
  schema?: ZodSchema<Partial<T>>
): Promise<void> {
  const path = getSubcollectionPath(parentCollection, parentId, subcollection);
  await updateDocument(path, docId, data, schema);
}

/**
 * Delete a document from a subcollection
 *
 * @param parentCollection - Parent collection name
 * @param parentId - Parent document ID
 * @param subcollection - Subcollection name
 * @param docId - Document ID in subcollection
 */
export async function deleteSubcollectionDocument(
  parentCollection: string,
  parentId: string,
  subcollection: string,
  docId: string
): Promise<void> {
  const path = getSubcollectionPath(parentCollection, parentId, subcollection);
  await deleteDocument(path, docId);
}

// ============================================================================
// Batch Operations (coming soon)
// ============================================================================

// TODO: Implement batch write operations when needed
// TODO: Implement transaction operations when needed

// ============================================================================
// Export Re-exports (for convenience)
// ============================================================================

export { where, orderBy, limit, Timestamp };
export type { QueryConstraint, Unsubscribe };
