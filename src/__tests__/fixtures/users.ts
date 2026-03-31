/**
 * User Test Fixtures
 *
 * Provides pre-configured user data for testing.
 */

import type { User } from 'firebase/auth';
import { createMockUser, createMockUserData } from '../utils/mock-auth';
import type { MockUserData, MockUserOptions } from '../utils/mock-auth';

// ============================================================================
// Common Test Users
// ============================================================================

export const testUsers = {
  /**
   * Basic user with minimal data
   */
  basic: createMockUser({
    uid: 'user-basic',
    email: 'basic@example.com',
    displayName: 'Basic User',
  }),

  /**
   * Practitioner user
   */
  practitioner: createMockUser({
    uid: 'user-practitioner',
    email: 'practitioner@example.com',
    displayName: 'Practitioner User',
  }),

  /**
   * Professional user
   */
  professional: createMockUser({
    uid: 'user-professional',
    email: 'professional@example.com',
    displayName: 'Professional User',
  }),

  /**
   * Moderator user
   */
  moderator: createMockUser({
    uid: 'user-moderator',
    email: 'moderator@example.com',
    displayName: 'Moderator User',
  }),

  /**
   * Admin user
   */
  admin: createMockUser({
    uid: 'user-admin',
    email: 'admin@example.com',
    displayName: 'Admin User',
  }),

  /**
   * User without email verification
   */
  unverified: createMockUser({
    uid: 'user-unverified',
    email: 'unverified@example.com',
    displayName: 'Unverified User',
    emailVerified: false,
  }),
};

export const testUserData: Record<string, MockUserData> = {
  basic: createMockUserData({
    role: 'user',
    displayName: 'Basic User',
    bio: 'A basic test user',
  }),

  practitioner: createMockUserData({
    role: 'practitioner',
    displayName: 'Practitioner User',
    bio: 'A practitioner building capabilities',
  }),

  professional: createMockUserData({
    role: 'professional',
    displayName: 'Professional User',
    bio: 'An experienced pharmaceutical professional',
    location: 'Boston, MA',
  }),

  moderator: createMockUserData({
    role: 'moderator',
    displayName: 'Moderator User',
    bio: 'Community moderator',
  }),

  admin: createMockUserData({
    role: 'admin',
    displayName: 'Admin User',
    bio: 'Platform administrator',
  }),

  unverified: createMockUserData({
    role: 'user',
    displayName: 'Unverified User',
  }),
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a custom test user with specific properties
 */
export function createTestUser(overrides: MockUserOptions = {}) {
  return createMockUser(overrides);
}

/**
 * Creates a custom test user data with specific properties
 */
export function createTestUserData(overrides: Partial<MockUserData> = {}) {
  return createMockUserData(overrides);
}

/**
 * Gets a test user by role
 */
export function getUserByRole(role: 'user' | 'practitioner' | 'professional' | 'moderator' | 'admin') {
  // Map 'user' role to 'basic' key since testUsers uses 'basic' for the user role
  const key = role === 'user' ? 'basic' : role;
  return {
    user: testUsers[key as keyof typeof testUsers],
    userData: testUserData[key as keyof typeof testUserData],
  };
}
