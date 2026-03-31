/**
 * Auth Errors Unit Tests
 *
 * Tests Firebase error handling utilities including type guards,
 * error code extraction, and user-friendly message translation.
 * These are critical for secure and helpful authentication UX.
 */

import { describe, it, expect } from '@jest/globals';
import {
  isFirebaseError,
  getFirebaseErrorCode,
  getErrorMessage,
  translateAuthError,
  type FirebaseError,
} from '@/lib/auth-errors';

describe('Auth Errors', () => {
  describe('isFirebaseError', () => {
    it('should return true for valid Firebase error object', () => {
      const error: FirebaseError = { code: 'auth/user-not-found' };
      expect(isFirebaseError(error)).toBe(true);
    });

    it('should return true for Firebase error with message', () => {
      const error = { code: 'auth/wrong-password', message: 'Wrong password' };
      expect(isFirebaseError(error)).toBe(true);
    });

    it('should return true for Firebase error with name', () => {
      const error = { code: 'auth/invalid-email', name: 'FirebaseError' };
      expect(isFirebaseError(error)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isFirebaseError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isFirebaseError(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isFirebaseError('auth/error')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isFirebaseError(404)).toBe(false);
    });

    it('should return false for array', () => {
      expect(isFirebaseError(['auth/error'])).toBe(false);
    });

    it('should return false for object without code', () => {
      expect(isFirebaseError({ message: 'Error' })).toBe(false);
    });

    it('should return false for object with non-string code', () => {
      expect(isFirebaseError({ code: 123 })).toBe(false);
    });

    it('should return false for Error instance without code', () => {
      expect(isFirebaseError(new Error('Something failed'))).toBe(false);
    });
  });

  describe('getFirebaseErrorCode', () => {
    it('should extract code from Firebase error', () => {
      const error = { code: 'auth/user-not-found' };
      expect(getFirebaseErrorCode(error)).toBe('auth/user-not-found');
    });

    it('should return internal-error for null', () => {
      expect(getFirebaseErrorCode(null)).toBe('auth/internal-error');
    });

    it('should return internal-error for undefined', () => {
      expect(getFirebaseErrorCode(undefined)).toBe('auth/internal-error');
    });

    it('should return internal-error for string error', () => {
      expect(getFirebaseErrorCode('Something went wrong')).toBe('auth/internal-error');
    });

    it('should return internal-error for Error instance', () => {
      expect(getFirebaseErrorCode(new Error('Failed'))).toBe('auth/internal-error');
    });

    it('should return internal-error for object without code', () => {
      expect(getFirebaseErrorCode({ message: 'Error' })).toBe('auth/internal-error');
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Database connection failed');
      expect(getErrorMessage(error)).toBe('Database connection failed');
    });

    it('should return string error directly', () => {
      expect(getErrorMessage('Something went wrong')).toBe('Something went wrong');
    });

    it('should translate Firebase error code', () => {
      const error = { code: 'auth/wrong-password' };
      expect(getErrorMessage(error)).toBe('Invalid email or password. Please try again.');
    });

    it('should return default message for null', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should return default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should return default message for number', () => {
      expect(getErrorMessage(404)).toBe('An unexpected error occurred. Please try again.');
    });

    it('should return default message for array', () => {
      expect(getErrorMessage(['error'])).toBe('An unexpected error occurred. Please try again.');
    });

    it('should return default message for empty object', () => {
      expect(getErrorMessage({})).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle TypeError', () => {
      const error = new TypeError('Cannot read property of undefined');
      expect(getErrorMessage(error)).toBe('Cannot read property of undefined');
    });

    it('should handle RangeError', () => {
      const error = new RangeError('Invalid array length');
      expect(getErrorMessage(error)).toBe('Invalid array length');
    });
  });

  describe('translateAuthError', () => {
    describe('Sign-in errors (security: generic messages)', () => {
      it('should translate wrong-password with generic message', () => {
        expect(translateAuthError('auth/wrong-password')).toBe(
          'Invalid email or password. Please try again.'
        );
      });

      it('should translate user-not-found with generic message', () => {
        // SECURITY: Same message as wrong-password to prevent account enumeration
        expect(translateAuthError('auth/user-not-found')).toBe(
          'Invalid email or password. Please try again.'
        );
      });

      it('should translate invalid-credential with generic message', () => {
        expect(translateAuthError('auth/invalid-credential')).toBe(
          'Invalid email or password. Please try again.'
        );
      });

      it('should translate invalid-email', () => {
        expect(translateAuthError('auth/invalid-email')).toBe(
          'Please enter a valid email address.'
        );
      });

      it('should translate user-disabled', () => {
        expect(translateAuthError('auth/user-disabled')).toBe(
          'This account has been disabled. Please contact support.'
        );
      });
    });

    describe('Sign-up errors', () => {
      it('should translate email-already-in-use with vague message', () => {
        // SECURITY: Vague message to prevent email enumeration
        expect(translateAuthError('auth/email-already-in-use')).toBe(
          'Unable to create account. If you already have an account, try signing in instead.'
        );
      });

      it('should translate weak-password', () => {
        expect(translateAuthError('auth/weak-password')).toBe(
          'Password is too weak. Please use at least 8 characters.'
        );
      });

      it('should translate operation-not-allowed', () => {
        expect(translateAuthError('auth/operation-not-allowed')).toBe(
          'Email/password accounts are not enabled. Please contact support.'
        );
      });
    });

    describe('Network/system errors', () => {
      it('should translate network-request-failed', () => {
        expect(translateAuthError('auth/network-request-failed')).toBe(
          'Network error. Please check your connection and try again.'
        );
      });

      it('should translate too-many-requests', () => {
        expect(translateAuthError('auth/too-many-requests')).toBe(
          'Too many failed attempts. Please try again later or reset your password.'
        );
      });

      it('should translate internal-error', () => {
        expect(translateAuthError('auth/internal-error')).toBe(
          'An unexpected error occurred. Please try again.'
        );
      });
    });

    describe('Token/session errors', () => {
      it('should translate expired-action-code', () => {
        expect(translateAuthError('auth/expired-action-code')).toBe(
          'This link has expired. Please request a new one.'
        );
      });

      it('should translate invalid-action-code', () => {
        expect(translateAuthError('auth/invalid-action-code')).toBe(
          'This link is invalid. Please request a new one.'
        );
      });

      it('should translate user-token-expired', () => {
        expect(translateAuthError('auth/user-token-expired')).toBe(
          'Your session has expired. Please sign in again.'
        );
      });
    });

    describe('Password reset errors', () => {
      it('should translate missing-email', () => {
        expect(translateAuthError('auth/missing-email')).toBe(
          'Please enter your email address.'
        );
      });
    });

    describe('OAuth errors', () => {
      it('should translate account-exists-with-different-credential', () => {
        expect(translateAuthError('auth/account-exists-with-different-credential')).toBe(
          'An account already exists with this email using a different sign-in method.'
        );
      });

      it('should translate popup-closed-by-user', () => {
        expect(translateAuthError('auth/popup-closed-by-user')).toBe(
          'Sign-in window was closed. Please try again.'
        );
      });

      it('should translate popup-blocked', () => {
        expect(translateAuthError('auth/popup-blocked')).toBe(
          'Pop-up was blocked by your browser. Please allow pop-ups and try again.'
        );
      });

      it('should translate unauthorized-domain', () => {
        expect(translateAuthError('auth/unauthorized-domain')).toBe(
          'This domain is not authorized for OAuth operations. Add localhost:9002 to Firebase Console → Authentication → Settings → Authorized domains.'
        );
      });
    });

    describe('Verification errors', () => {
      it('should translate invalid-verification-code', () => {
        expect(translateAuthError('auth/invalid-verification-code')).toBe(
          'Invalid verification code. Please try again.'
        );
      });

      it('should translate invalid-verification-id', () => {
        expect(translateAuthError('auth/invalid-verification-id')).toBe(
          'Invalid verification ID. Please try again.'
        );
      });
    });

    describe('Unknown errors', () => {
      it('should return default message for unknown error code', () => {
        expect(translateAuthError('auth/some-unknown-error')).toBe(
          'An unexpected error occurred. Please try again.'
        );
      });

      it('should return default message for empty string', () => {
        expect(translateAuthError('')).toBe(
          'An unexpected error occurred. Please try again.'
        );
      });

      it('should return default message for non-auth error code', () => {
        expect(translateAuthError('firestore/permission-denied')).toBe(
          'An unexpected error occurred. Please try again.'
        );
      });
    });
  });
});
