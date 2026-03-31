/**
 * Mock Authentication Utilities
 *
 * Provides utilities for mocking Firebase authentication in tests.
 * Makes it easy to test components that depend on auth state.
 *
 * @example
 * ```tsx
 * import { renderWithAuth, createMockUser } from '@/__tests__/utils/mock-auth';
 *
 * test('displays user email', () => {
 *   const user = createMockUser({ email: 'test@example.com' });
 *   const { getByText } = renderWithAuth(<MyComponent />, { user });
 *
 *   expect(getByText('test@example.com')).toBeInTheDocument();
 * });
 * ```
 */

import React from 'react';
// Requires @testing-library/react and firebase/auth in the test environment
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import type { User } from 'firebase/auth';

// ============================================================================
// Mock User Helpers
// ============================================================================

export interface MockUserOptions {
  uid?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
  phoneNumber?: string | null;
}

export interface MockUserData {
  role?: 'user' | 'practitioner' | 'professional' | 'moderator' | 'admin';
  displayName?: string;
  bio?: string;
  location?: string;
  createdAt?: string;
  [key: string]: any;
}

/**
 * Creates a mock Firebase User object
 *
 * @param options - User properties to override
 * @returns Mock User object
 *
 * @example
 * ```tsx
 * const user = createMockUser({
 *   email: 'admin@example.com',
 *   displayName: 'Admin User'
 * });
 * ```
 */
export function createMockUser(options: MockUserOptions = {}): User {
  const {
    uid = 'test-user-id',
    email = 'test@example.com',
    displayName = 'Test User',
    photoURL = null,
    emailVerified = true,
    phoneNumber = null,
  } = options;

  return {
    uid,
    email,
    displayName,
    photoURL,
    emailVerified,
    phoneNumber,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: jest.fn().mockResolvedValue(undefined),
    getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
    getIdTokenResult: jest.fn().mockResolvedValue({
      token: 'mock-id-token',
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      signInProvider: 'password',
      signInSecondFactor: null,
      claims: {},
    }),
    reload: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn().mockReturnValue({
      uid,
      email,
      displayName,
      photoURL,
      emailVerified,
      phoneNumber,
    }),
    providerId: 'firebase',
  } as User;
}

/**
 * Creates mock user data (Firestore document)
 *
 * @param options - User data properties to override
 * @returns Mock user data object
 *
 * @example
 * ```tsx
 * const userData = createMockUserData({
 *   role: 'admin',
 *   displayName: 'Admin User'
 * });
 * ```
 */
export function createMockUserData(options: MockUserData = {}): MockUserData {
  return {
    role: 'user',
    displayName: 'Test User',
    bio: '',
    location: '',
    createdAt: new Date().toISOString(),
    ...options,
  };
}

// ============================================================================
// Mock Auth Context
// ============================================================================

export interface MockAuthContextValue {
  user: User | null;
  userData: MockUserData | null;
  loading: boolean;
  signIn?: jest.Mock;
  signUp?: jest.Mock;
  signOut?: jest.Mock;
  updateProfile?: jest.Mock;
}

/**
 * Creates a mock auth context value
 *
 * @param overrides - Values to override
 * @returns Mock auth context
 */
export function createMockAuthContext(
  overrides: Partial<MockAuthContextValue> = {}
): MockAuthContextValue {
  return {
    user: null,
    userData: null,
    loading: false,
    signIn: jest.fn().mockResolvedValue({ success: true }),
    signUp: jest.fn().mockResolvedValue({ success: true }),
    signOut: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
}

// ============================================================================
// Render Helpers
// ============================================================================

export interface RenderWithAuthOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null;
  userData?: MockUserData | null;
  loading?: boolean;
}

/**
 * Mock AuthProvider for testing
 */
function MockAuthProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: MockAuthContextValue;
}) {
  // Create a mock context
  const AuthContext = React.createContext<MockAuthContextValue>(value);

  // Mock the useAuth hook
  jest.mock('@/hooks/use-auth', () => ({
    useAuth: () => React.useContext(AuthContext),
  }));

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Renders a component with mocked authentication
 *
 * @param ui - Component to render
 * @param options - Render options with auth state
 * @returns Render result
 *
 * @example
 * ```tsx
 * const user = createMockUser({ email: 'test@example.com' });
 * const userData = createMockUserData({ role: 'admin' });
 *
 * const { getByText } = renderWithAuth(<MyComponent />, {
 *   user,
 *   userData
 * });
 * ```
 */
export function renderWithAuth(
  ui: React.ReactElement,
  options: RenderWithAuthOptions = {}
) {
  const {
    user = null,
    userData = null,
    loading = false,
    ...renderOptions
  } = options;

  const authContextValue = createMockAuthContext({
    user,
    userData,
    loading,
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockAuthProvider value={authContextValue}>
      {children}
    </MockAuthProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    authContextValue,
  };
}

/**
 * Renders a component with an authenticated user
 *
 * @param ui - Component to render
 * @param options - User options
 * @returns Render result with user
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithUser(<MyComponent />, {
 *   email: 'test@example.com',
 *   role: 'admin'
 * });
 * ```
 */
export function renderWithUser(
  ui: React.ReactElement,
  userOptions: MockUserOptions & MockUserData = {}
) {
  const user = createMockUser(userOptions);
  const userData = createMockUserData(userOptions);

  return renderWithAuth(ui, { user, userData });
}

/**
 * Renders a component with loading auth state
 *
 * @param ui - Component to render
 * @returns Render result
 */
export function renderWithAuthLoading(ui: React.ReactElement) {
  return renderWithAuth(ui, { loading: true });
}

/**
 * Renders a component with unauthenticated state
 *
 * @param ui - Component to render
 * @returns Render result
 */
export function renderWithoutAuth(ui: React.ReactElement) {
  return renderWithAuth(ui, { user: null, userData: null });
}
