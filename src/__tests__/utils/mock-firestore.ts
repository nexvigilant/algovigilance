/**
 * Mock Firestore Utilities
 *
 * Provides utilities for mocking Firestore operations in tests.
 * Makes it easy to test components that interact with Firestore.
 *
 * Requires firebase/firestore types in the test environment.
 *
 * @example
 * ```tsx
 * import { mockFirestoreData, mockCollection } from '@/__tests__/utils/mock-firestore';
 *
 * test('fetches posts', async () => {
 *   const posts = [
 *     { id: '1', title: 'Post 1' },
 *     { id: '2', title: 'Post 2' }
 *   ];
 *
 *   mockCollection('community_posts', posts);
 *
 *   // Your test code here
 * });
 * ```
 */

import type {
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  CollectionReference,
  Query,
  QuerySnapshot,
} from 'firebase/firestore';

// ============================================================================
// Mock Document Helpers
// ============================================================================

/**
 * Creates a mock Firestore document snapshot
 *
 * @param id - Document ID
 * @param data - Document data
 * @returns Mock document snapshot
 */
export function createMockDocumentSnapshot<T extends DocumentData>(
  id: string,
  data: T
): Partial<DocumentSnapshot<T>> {
  return {
    id,
    exists: (() => true) as any,
    data: () => data,
    get: (field: string) => (data as any)[field],
    ref: {
      id,
      path: `mock-collection/${id}`,
    } as any,
  };
}

/**
 * Creates a mock Firestore query document snapshot
 *
 * @param id - Document ID
 * @param data - Document data
 * @returns Mock query document snapshot
 */
export function createMockQueryDocumentSnapshot<T extends DocumentData>(
  id: string,
  data: T
): Partial<QueryDocumentSnapshot<T>> {
  return {
    id,
    exists: (() => true) as any,
    data: () => data,
    get: (field: string) => (data as any)[field],
    ref: {
      id,
      path: `mock-collection/${id}`,
    } as any,
  };
}

/**
 * Creates a mock Firestore query snapshot
 *
 * @param documents - Array of documents
 * @returns Mock query snapshot
 */
export function createMockQuerySnapshot<T extends DocumentData>(
  documents: Array<{ id: string; data: T }>
): Partial<QuerySnapshot<T>> {
  const docs = documents.map(({ id, data }) =>
    createMockQueryDocumentSnapshot(id, data)
  ) as QueryDocumentSnapshot<T>[];

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback) => docs.forEach(callback),
    docChanges: () => [],
  };
}

// ============================================================================
// Firestore Mock Data Store
// ============================================================================

interface MockDataStore {
  [collection: string]: {
    [docId: string]: DocumentData;
  };
}

const mockDataStore: MockDataStore = {};

/**
 * Clears all mock Firestore data
 */
export function clearMockFirestoreData() {
  Object.keys(mockDataStore).forEach((key) => delete mockDataStore[key]);
}

/**
 * Sets mock data for a Firestore collection
 *
 * @param collectionName - Name of the collection
 * @param documents - Array of documents (with id property)
 *
 * @example
 * ```tsx
 * mockCollection('community_posts', [
 *   { id: '1', title: 'Post 1', content: 'Content 1' },
 *   { id: '2', title: 'Post 2', content: 'Content 2' }
 * ]);
 * ```
 */
export function mockCollection<T extends { id: string }>(
  collectionName: string,
  documents: T[]
) {
  mockDataStore[collectionName] = {};

  documents.forEach((doc) => {
    const { id, ...data } = doc;
    mockDataStore[collectionName][id] = data;
  });
}

/**
 * Sets mock data for a single Firestore document
 *
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @param data - Document data
 *
 * @example
 * ```tsx
 * mockDocument('users', 'user-123', {
 *   email: 'test@example.com',
 *   displayName: 'Test User'
 * });
 * ```
 */
export function mockDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
) {
  if (!mockDataStore[collectionName]) {
    mockDataStore[collectionName] = {};
  }

  mockDataStore[collectionName][docId] = data;
}

/**
 * Gets mock data from Firestore
 *
 * @param collectionName - Name of the collection
 * @param docId - Optional document ID
 * @returns Mock data
 */
export function getMockData(collectionName: string, docId?: string): any {
  if (!mockDataStore[collectionName]) {
    return docId ? undefined : [];
  }

  if (docId) {
    return mockDataStore[collectionName][docId];
  }

  return Object.entries(mockDataStore[collectionName]).map(([id, data]) => ({
    id,
    ...data,
  }));
}

// ============================================================================
// Firestore Operation Mocks
// ============================================================================

/**
 * Creates a mock getDocs function
 *
 * @param collectionName - Collection to return data from
 * @returns Mock getDocs function
 */
export function mockGetDocs(collectionName: string) {
  return jest.fn().mockResolvedValue(
    createMockQuerySnapshot(
      Object.entries(mockDataStore[collectionName] || {}).map(([id, data]) => ({
        id,
        data,
      }))
    )
  );
}

/**
 * Creates a mock getDoc function
 *
 * @param collectionName - Collection name
 * @param docId - Document ID
 * @returns Mock getDoc function
 */
export function mockGetDoc(collectionName: string, docId: string) {
  const data = mockDataStore[collectionName]?.[docId];

  if (!data) {
    return jest.fn().mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    });
  }

  return jest.fn().mockResolvedValue(createMockDocumentSnapshot(docId, data));
}

/**
 * Creates a mock setDoc function
 *
 * @param collectionName - Collection name
 * @returns Mock setDoc function
 */
export function mockSetDoc(collectionName: string) {
  return jest.fn().mockImplementation((ref: any, data: any) => {
    const docId = ref.id || `mock-${Date.now()}`;
    mockDocument(collectionName, docId, data);
    return Promise.resolve();
  });
}

/**
 * Creates a mock addDoc function
 *
 * @param collectionName - Collection name
 * @returns Mock addDoc function
 */
export function mockAddDoc(collectionName: string) {
  return jest.fn().mockImplementation((ref: any, data: any) => {
    const docId = `mock-${Date.now()}`;
    mockDocument(collectionName, docId, data);
    return Promise.resolve({ id: docId });
  });
}

/**
 * Creates a mock updateDoc function
 *
 * @param collectionName - Collection name
 * @returns Mock updateDoc function
 */
export function mockUpdateDoc(collectionName: string) {
  return jest.fn().mockImplementation((ref: any, updates: any) => {
    const docId = ref.id;
    if (mockDataStore[collectionName]?.[docId]) {
      mockDataStore[collectionName][docId] = {
        ...mockDataStore[collectionName][docId],
        ...updates,
      };
    }
    return Promise.resolve();
  });
}

/**
 * Creates a mock deleteDoc function
 *
 * @param collectionName - Collection name
 * @returns Mock deleteDoc function
 */
export function mockDeleteDoc(collectionName: string) {
  return jest.fn().mockImplementation((ref: any) => {
    const docId = ref.id;
    if (mockDataStore[collectionName]?.[docId]) {
      delete mockDataStore[collectionName][docId];
    }
    return Promise.resolve();
  });
}

// ============================================================================
// Query Mocks
// ============================================================================

/**
 * Creates a mock where query that filters documents
 */
export function mockWhere() {
  return jest.fn().mockImplementation((field: string, operator: string, value: any) => {
    // Return a query object that can be chained
    return {
      where: mockWhere(),
      orderBy: mockOrderBy(),
      limit: mockLimit(),
    };
  });
}

/**
 * Creates a mock orderBy query
 */
export function mockOrderBy() {
  return jest.fn().mockImplementation((field: string, direction?: 'asc' | 'desc') => {
    return {
      where: mockWhere(),
      orderBy: mockOrderBy(),
      limit: mockLimit(),
    };
  });
}

/**
 * Creates a mock limit query
 */
export function mockLimit() {
  return jest.fn().mockImplementation((count: number) => {
    return {
      where: mockWhere(),
      orderBy: mockOrderBy(),
      limit: mockLimit(),
    };
  });
}

// ============================================================================
// Setup Helpers
// ============================================================================

/**
 * Sets up all Firestore mocks before tests
 *
 * Call this in your test setup (beforeEach)
 *
 * @example
 * ```tsx
 * beforeEach(() => {
 *   setupFirestoreMocks();
 * });
 * ```
 */
export function setupFirestoreMocks() {
  clearMockFirestoreData();

  // Mock Firestore functions
  jest.mock('firebase/firestore', () => ({
    ...jest.requireActual('firebase/firestore'),
    getDocs: mockGetDocs('default'),
    getDoc: mockGetDoc('default', 'default'),
    setDoc: mockSetDoc('default'),
    addDoc: mockAddDoc('default'),
    updateDoc: mockUpdateDoc('default'),
    deleteDoc: mockDeleteDoc('default'),
    where: mockWhere(),
    orderBy: mockOrderBy(),
    limit: mockLimit(),
  }));
}

/**
 * Tears down Firestore mocks after tests
 *
 * Call this in your test teardown (afterEach)
 */
export function teardownFirestoreMocks() {
  clearMockFirestoreData();
  jest.clearAllMocks();
}
