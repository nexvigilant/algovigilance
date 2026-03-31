/**
 * Test Factories - Barrel Export
 *
 * Centralized exports for all test mocks, fixtures, and factories.
 * Import from this file to access any test data or mock utilities.
 *
 * @example
 * ```tsx
 * import {
 *   createMockUser,
 *   testUsers,
 *   testCourses,
 *   renderWithProviders,
 * } from '@/__tests__/factories';
 *
 * test('shows user courses', () => {
 *   const { getByText } = renderWithProviders(
 *     <CourseList courses={[testCourses.basic]} />,
 *     { user: testUsers.professional }
 *   );
 *   expect(getByText('Basic Capability')).toBeInTheDocument();
 * });
 * ```
 */

// ============================================================================
// Mock Utilities
// ============================================================================

export {
  createMockUser,
  createMockUserData,
  type MockUserOptions,
  type MockUserData,
} from '../utils/mock-auth';

export {
  createMockDocumentSnapshot,
  createMockQueryDocumentSnapshot,
  createMockQuerySnapshot,
  mockCollection,
  mockDocument,
  getMockData,
  setupFirestoreMocks,
  teardownFirestoreMocks,
  clearMockFirestoreData,
} from '../utils/mock-firestore';

// ============================================================================
// Test Providers & Render Helpers
// ============================================================================

export {
  renderWithProviders,
  renderWithUser,
  renderWithAuthLoading,
  renderWithoutAuth,
  createMockAdminUser,
  createMockProfessionalUser,
  waitForLoadingToComplete,
  useMockAuth,
  type ProviderOptions,
} from '../utils/test-providers';

// ============================================================================
// Fixtures
// ============================================================================

export { testUsers } from '../fixtures/users';
export { testCourses } from '../fixtures/courses';

// ============================================================================
// API Test Utilities
// ============================================================================

// Export when available
// export * from '../helpers/api-test-utils';

// ============================================================================
// Interaction Helpers
// ============================================================================

// Export when available
// export * from '../helpers/interaction';
