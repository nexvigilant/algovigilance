/**
 * Firebase error interface
 */
export interface FirebaseError {
  code: string;
  message?: string;
  name?: string;
}

/**
 * Type guard to check if an error is a Firebase error
 */
export function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Get Firebase error code safely from unknown error
 */
export function getFirebaseErrorCode(error: unknown): string {
  if (isFirebaseError(error)) {
    return error.code;
  }
  return 'auth/internal-error';
}

/**
 * Get error message safely from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (isFirebaseError(error)) {
    return translateAuthError(error.code);
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Translates Firebase Auth error codes to user-friendly messages
 */
export function translateAuthError(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    // Sign-in errors
    // SECURITY: Use generic messages to prevent account enumeration
    'auth/wrong-password': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'Invalid email or password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',

    // Sign-up errors
    // SECURITY: Use vague message to prevent email enumeration
    'auth/email-already-in-use': 'Unable to create account. If you already have an account, try signing in instead.',
    'auth/weak-password': 'Password is too weak. Please use at least 8 characters.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',

    // Network/system errors
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later or reset your password.',
    'auth/internal-error': 'An unexpected error occurred. Please try again.',

    // Token/session errors
    'auth/expired-action-code': 'This link has expired. Please request a new one.',
    'auth/invalid-action-code': 'This link is invalid. Please request a new one.',
    'auth/user-token-expired': 'Your session has expired. Please sign in again.',

    // Password reset errors
    'auth/missing-email': 'Please enter your email address.',

    // OAuth errors
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    'auth/popup-closed-by-user': 'Sign-in window was closed. Please try again.',
    'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations. Add localhost:9002 to Firebase Console → Authentication → Settings → Authorized domains.',
    'auth/cancelled-popup-request': 'Multiple sign-in popups were opened. Please wait and try again.',
    'auth/credential-already-in-use': 'This credential is already associated with a different account.',
    'auth/operation-not-supported-in-this-environment': 'This operation is not supported in your current environment. Ensure you are running on localhost or an HTTPS domain.',
    'auth/timeout': 'The operation has timed out. Please try again.',
    'auth/missing-android-pkg-name': 'Missing Android package name configuration.',
    'auth/missing-continue-uri': 'Missing continue URL in the request.',
    'auth/missing-ios-bundle-id': 'Missing iOS bundle ID configuration.',
    'auth/invalid-continue-uri': 'The continue URL is invalid.',
    'auth/unauthorized-continue-uri': 'The continue URL domain is not whitelisted.',
    'auth/web-storage-unsupported': 'Your browser does not support web storage or has it disabled.',
    'auth/invalid-api-key': 'Invalid Firebase API key. Check NEXT_PUBLIC_FIREBASE_API_KEY in your environment.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Firebase API key is missing or invalid. Verify NEXT_PUBLIC_FIREBASE_API_KEY is set correctly in your .env.local file.',
    'auth/app-deleted': 'The Firebase app has been deleted.',
    'auth/invalid-user-token': 'Your session is invalid. Please sign in again.',
    'auth/user-mismatch': 'The credential does not match the previously signed in user.',
    'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.',
    'auth/provider-already-linked': 'This account is already linked to another account.',
    'auth/no-such-provider': 'This provider is not linked to this account.',
    'auth/invalid-oauth-provider': 'Google OAuth is not properly configured. Check Firebase Console → Authentication → Sign-in method.',
    'auth/invalid-oauth-client-id': 'Invalid OAuth client ID. Check Google Cloud Console OAuth configuration.',
    'auth/redirect-cancelled-by-user': 'The redirect sign-in was cancelled.',
    'auth/redirect-operation-pending': 'A redirect sign-in operation is already pending.',

    // Email verification errors
    'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
    'auth/invalid-verification-id': 'Invalid verification ID. Please try again.',
  };

  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
}
