/**
 * Application Error Types
 *
 * Provides typed error handling for consistent error management across the application.
 *
 * @remarks
 * Use these types with toAppError() to ensure consistent error handling
 * in catch blocks throughout the application.
 */

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Application error codes for categorizing errors.
 */
export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'UNKNOWN';

/**
 * All valid error codes.
 */
export const ERROR_CODES: readonly ErrorCode[] = [
  'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'VALIDATION_ERROR',
  'NETWORK_ERROR', 'SERVER_ERROR', 'RATE_LIMITED', 'TIMEOUT', 'UNKNOWN'
] as const;

/**
 * Type guard for ErrorCode.
 */
export function isErrorCode(value: string): value is ErrorCode {
  return ERROR_CODES.includes(value as ErrorCode);
}

// ============================================================================
// APP ERROR INTERFACE
// ============================================================================

/**
 * Structured application error.
 *
 * @remarks
 * Provides a consistent error shape for handling errors
 * across the application with typed codes and optional context.
 */
export interface AppError {
  /** Error category code */
  readonly code: ErrorCode;
  /** Human-readable error message */
  readonly message: string;
  /** Additional error context */
  readonly details?: Readonly<Record<string, unknown>>;
  /** Original error cause */
  readonly cause?: unknown;
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Creates a typed AppError from an unknown error value.
 * Use this in catch blocks to ensure consistent error handling.
 *
 * @example
 * try {
 *   await someOperation();
 * } catch (err) {
 *   const appError = toAppError(err);
 *   log.error('Operation failed:', appError);
 *   return { success: false, error: appError.message };
 * }
 */
export function toAppError(error: unknown, defaultCode: ErrorCode = 'UNKNOWN'): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }

  // Standard Error object
  if (error instanceof Error) {
    return {
      code: inferErrorCode(error),
      message: error.message,
      cause: error,
    };
  }

  // String error
  if (typeof error === 'string') {
    return {
      code: defaultCode,
      message: error,
    };
  }

  // Object with message property
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      code: defaultCode,
      message: String((error as { message: unknown }).message),
      details: error as Record<string, unknown>,
    };
  }

  // Fallback for unknown types
  return {
    code: defaultCode,
    message: 'An unexpected error occurred',
    cause: error,
  };
}

/**
 * Type guard to check if a value is an AppError
 */
export function isAppError(value: unknown): value is AppError {
  return (
    value !== null &&
    typeof value === 'object' &&
    'code' in value &&
    'message' in value &&
    typeof (value as AppError).code === 'string' &&
    typeof (value as AppError).message === 'string'
  );
}

/**
 * Infers an error code from a standard Error based on common patterns
 */
function inferErrorCode(error: Error): ErrorCode {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (message.includes('unauthorized') || message.includes('unauthenticated') || name.includes('auth')) {
    return 'UNAUTHORIZED';
  }
  if (message.includes('forbidden') || message.includes('permission')) {
    return 'FORBIDDEN';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'NOT_FOUND';
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'VALIDATION_ERROR';
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'NETWORK_ERROR';
  }
  if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
    return 'RATE_LIMITED';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'TIMEOUT';
  }
  if (message.includes('server') || message.includes('500') || message.includes('internal')) {
    return 'SERVER_ERROR';
  }

  return 'UNKNOWN';
}

/**
 * Creates a user-friendly error message from an AppError
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.code) {
    case 'UNAUTHORIZED':
      return 'Please sign in to continue.';
    case 'FORBIDDEN':
      return 'You don\'t have permission to perform this action.';
    case 'NOT_FOUND':
      return 'The requested item could not be found.';
    case 'VALIDATION_ERROR':
      return error.message || 'Please check your input and try again.';
    case 'NETWORK_ERROR':
      return 'Unable to connect. Please check your internet connection.';
    case 'RATE_LIMITED':
      return 'Too many requests. Please wait a moment and try again.';
    case 'TIMEOUT':
      return 'The request took too long. Please try again.';
    case 'SERVER_ERROR':
      return 'Something went wrong on our end. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}
