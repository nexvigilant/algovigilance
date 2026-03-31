/**
 * Firebase Admin SDK Mock
 *
 * Provides mock implementations for Firebase Admin SDK to enable
 * unit testing of API routes and server actions without real Firebase.
 */

import type { DecodedIdToken } from 'firebase-admin/auth';

// Mock decoded token for testing
export const mockDecodedToken: DecodedIdToken = {
  uid: 'test-user-123',
  email: 'test@example.com',
  email_verified: true,
  aud: 'test-project',
  auth_time: Math.floor(Date.now() / 1000) - 3600,
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  iss: 'https://securetoken.google.com/test-project',
  sub: 'test-user-123',
  firebase: {
    identities: { email: ['test@example.com'] },
    sign_in_provider: 'password',
  },
};

// Mock auth object
export const mockAdminAuth = {
  verifyIdToken: jest.fn().mockResolvedValue(mockDecodedToken),
  getUser: jest.fn().mockResolvedValue({
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    disabled: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
  }),
  createUser: jest.fn().mockResolvedValue({ uid: 'new-user-123' }),
  updateUser: jest.fn().mockResolvedValue({}),
  deleteUser: jest.fn().mockResolvedValue(undefined),
  createCustomToken: jest.fn().mockResolvedValue('mock-custom-token'),
  setCustomUserClaims: jest.fn().mockResolvedValue(undefined),
};

// Mock Firestore types
export const mockTimestamp = {
  now: () => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
  fromDate: (date: Date) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  }),
};

// Mock document reference
const createMockDocRef = (id: string, data: Record<string, unknown> | null = null) => ({
  id,
  get: jest.fn().mockResolvedValue({
    exists: data !== null,
    id,
    data: () => data,
    ref: { id },
  }),
  set: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
});

// Mock collection reference
const createMockCollectionRef = () => ({
  doc: jest.fn((id: string) => createMockDocRef(id)),
  add: jest.fn().mockResolvedValue({ id: 'new-doc-123' }),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({
    empty: true,
    docs: [],
    size: 0,
    forEach: jest.fn(),
  }),
});

// Mock Firestore object
export const mockAdminDb = {
  collection: jest.fn(() => createMockCollectionRef()),
  doc: jest.fn((path: string) => createMockDocRef(path.split('/').pop() || 'doc')),
  batch: jest.fn(() => ({
    set: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
  runTransaction: jest.fn((callback) =>
    callback({
      get: jest.fn().mockResolvedValue({ exists: false, data: () => null }),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })
  ),
};

// Reset all mocks helper
export function resetFirebaseAdminMocks() {
  mockAdminAuth.verifyIdToken.mockClear();
  mockAdminAuth.getUser.mockClear();
  mockAdminAuth.createUser.mockClear();
  mockAdminAuth.updateUser.mockClear();
  mockAdminAuth.deleteUser.mockClear();
  mockAdminAuth.createCustomToken.mockClear();
  mockAdminAuth.setCustomUserClaims.mockClear();
  mockAdminDb.collection.mockClear();
  mockAdminDb.doc.mockClear();
  mockAdminDb.batch.mockClear();
  mockAdminDb.runTransaction.mockClear();
}

// Configure mock to throw for invalid tokens
export function mockInvalidToken() {
  mockAdminAuth.verifyIdToken.mockRejectedValueOnce(
    new Error('Firebase ID token has expired')
  );
}

// Configure mock to return specific user data
export function mockUserToken(userData: Partial<DecodedIdToken>) {
  mockAdminAuth.verifyIdToken.mockResolvedValueOnce({
    ...mockDecodedToken,
    ...userData,
  });
}
