/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Mock Firebase auth before importing the hook
const mockOnAuthStateChanged = jest.fn();
const mockOnIdTokenChanged = jest.fn();
const mockGetIdToken = jest.fn().mockResolvedValue('mock-token');

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  onIdTokenChanged: (...args: unknown[]) => mockOnIdTokenChanged(...args),
}));

jest.mock('@/lib/firebase', () => ({
  auth: {},
}));

jest.mock('@/lib/sync-user', () => ({
  syncUserToFirestore: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    scope: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

// Mock fetch for token sync
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
});

import { AuthProvider, useAuth } from '../use-auth';

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation - calls callback with null (no user)
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });
    mockOnIdTokenChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('initial state', () => {
    it('returns null user when not authenticated', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });

    it('starts in loading state', () => {
      // Don't call callback immediately to test loading state
      mockOnAuthStateChanged.mockImplementation(() => jest.fn());

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
    });
  });

  describe('authenticated state', () => {
    it('returns user when authenticated', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        getIdToken: mockGetIdToken,
      };

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
      mockOnIdTokenChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.uid).toBe('test-uid');
      expect(result.current.user?.email).toBe('test@example.com');
    });

    it('syncs token to server on sign in', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        getIdToken: mockGetIdToken,
      };

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
      mockOnIdTokenChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/token', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'mock-token' }),
        }));
      });
    });
  });

  describe('sign out', () => {
    it('clears token on sign out', async () => {
      // Start authenticated
      const mockUser = {
        uid: 'test-uid',
        getIdToken: mockGetIdToken,
      };

      let authCallback: ((user: unknown) => void) | null = null;
      let tokenCallback: ((user: unknown) => void) | null = null;

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        callback(mockUser);
        return jest.fn();
      });
      mockOnIdTokenChanged.mockImplementation((auth, callback) => {
        tokenCallback = callback;
        callback(mockUser);
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });

      // Simulate sign out
      act(() => {
        if (authCallback) authCallback(null);
        if (tokenCallback) tokenCallback(null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/token', expect.objectContaining({
        method: 'DELETE',
      }));
    });
  });

  describe('cleanup', () => {
    it('unsubscribes on unmount', () => {
      const unsubscribeAuth = jest.fn();
      const unsubscribeToken = jest.fn();

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return unsubscribeAuth;
      });
      mockOnIdTokenChanged.mockImplementation((auth, callback) => {
        callback(null);
        return unsubscribeToken;
      });

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      unmount();

      expect(unsubscribeAuth).toHaveBeenCalled();
      expect(unsubscribeToken).toHaveBeenCalled();
    });
  });
});
