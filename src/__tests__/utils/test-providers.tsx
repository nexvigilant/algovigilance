/**
 * Unified Test Providers
 *
 * Provides a single renderWithProviders() function that wraps components
 * with all necessary context providers for testing.
 *
 * @example
 * ```tsx
 * import { renderWithProviders, createMockUser } from '@/__tests__/utils/test-providers';
 *
 * test('displays user name', () => {
 *   const user = createMockUser({ displayName: 'Test User' });
 *   const { getByText } = renderWithProviders(<MyComponent />, { user });
 *   expect(getByText('Test User')).toBeInTheDocument();
 * });
 * ```
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { createMockUser, createMockUserData, MockUserOptions, MockUserData } from './mock-auth';

// Re-export mock utilities for convenience
export { createMockUser, createMockUserData } from './mock-auth';
export type { MockUserOptions, MockUserData } from './mock-auth';

// ============================================================================
// Mock Auth Context for Testing
// ============================================================================

interface MockAuthContextValue {
  user: User | null;
  loading: boolean;
}

const MockAuthContext = React.createContext<MockAuthContextValue>({
  user: null,
  loading: false,
});

/**
 * Hook to access mock auth context in tests
 */
export function useMockAuth() {
  return React.useContext(MockAuthContext);
}

// ============================================================================
// Provider Options
// ============================================================================

export interface ProviderOptions {
  /** Mock Firebase user - use createMockUser() to create */
  user?: User | null;
  /** Whether auth is in loading state */
  authLoading?: boolean;
  /** Initial route for testing navigation */
  initialRoute?: string;
  /** Additional wrapper components */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

// ============================================================================
// All Providers Wrapper
// ============================================================================

interface AllProvidersProps {
  children: React.ReactNode;
  options: ProviderOptions;
}

function AllProviders({ children, options }: AllProvidersProps) {
  const { user = null, authLoading = false, wrapper: Wrapper } = options;

  const authValue: MockAuthContextValue = {
    user,
    loading: authLoading,
  };

  let content = (
    <MockAuthContext.Provider value={authValue}>
      {children}
    </MockAuthContext.Provider>
  );

  // Wrap with additional wrapper if provided
  if (Wrapper) {
    content = <Wrapper>{content}</Wrapper>;
  }

  return content;
}

// ============================================================================
// Render Functions
// ============================================================================

/**
 * Renders a component with all test providers
 *
 * @param ui - The component to render
 * @param options - Provider configuration options
 * @param renderOptions - Additional RTL render options
 * @returns RTL render result with rerender helper
 *
 * @example
 * ```tsx
 * // Render with authenticated user
 * const user = createMockUser({ email: 'test@example.com' });
 * const { getByText } = renderWithProviders(<Profile />, { user });
 *
 * // Render with loading state
 * const { container } = renderWithProviders(<AuthGate />, { authLoading: true });
 *
 * // Render without auth (guest)
 * const { queryByText } = renderWithProviders(<Header />, { user: null });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions = {},
  renderOptions?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  const { wrapper: _ignoredWrapper, ...providerOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders options={options}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Renders a component with an authenticated user
 * Shorthand for renderWithProviders with a mock user
 */
export function renderWithUser(
  ui: ReactElement,
  userOptions?: MockUserOptions,
  providerOptions?: Omit<ProviderOptions, 'user'>,
  renderOptions?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  const user = createMockUser(userOptions);
  return renderWithProviders(ui, { ...providerOptions, user }, renderOptions);
}

/**
 * Renders a component in auth loading state
 */
export function renderWithAuthLoading(
  ui: ReactElement,
  renderOptions?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return renderWithProviders(ui, { authLoading: true }, renderOptions);
}

/**
 * Renders a component without authentication (guest user)
 */
export function renderWithoutAuth(
  ui: ReactElement,
  renderOptions?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return renderWithProviders(ui, { user: null, authLoading: false }, renderOptions);
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Creates a mock admin user for testing admin features
 */
export function createMockAdminUser(options?: Partial<MockUserOptions>): User {
  return createMockUser({
    uid: 'admin-user-id',
    email: 'admin@nexvigilant.com',
    displayName: 'Admin User',
    ...options,
  });
}

/**
 * Creates a mock professional user for testing member features
 */
export function createMockProfessionalUser(options?: Partial<MockUserOptions>): User {
  return createMockUser({
    uid: 'professional-user-id',
    email: 'professional@example.com',
    displayName: 'Professional User',
    ...options,
  });
}

/**
 * Waits for loading state to complete
 * Useful for components that show loading indicators
 */
export async function waitForLoadingToComplete(container: HTMLElement): Promise<void> {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    const loadingElements = container.querySelectorAll('[data-loading="true"], [aria-busy="true"]');
    if (loadingElements.length > 0) {
      throw new Error('Still loading');
    }
  });
}
