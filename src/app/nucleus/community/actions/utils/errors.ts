/**
 * AlgoVigilance Action Error Handling
 * 
 * Centralized error management for server actions to ensure consistent 
 * feedback and 'Guardian Protocol' audit logging.
 */

import { logger } from '@/lib/logger';

const log = logger.scope('actions/utils/errors');

import type { ActionResponse } from '@/types/actions';

/** @deprecated Use ActionResponse from @/types/actions */
export type ActionResult<T = unknown> = ActionResponse<T>;

/**
 * Handles action errors with logging and user-friendly messaging.
 */
export function handleActionError<T = unknown>(error: unknown, context: string): ActionResponse<T> {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  log.error(`Action failed in ${context}`, { error });

  // Map common error codes/patterns to user-friendly messages
  if (message.includes('permission-denied') || message.includes('Unauthorized')) {
    return { success: false, error: 'You do not have permission to perform this action.', code: 'UNAUTHORIZED' };
  }

  if (message.includes('too-many-requests')) {
    return { success: false, error: 'Too many requests. Please slow down.', rateLimited: true, code: 'RATE_LIMITED' };
  }

  return { success: false, error: message };
}

export function createSuccessResult<T>(data?: T): ActionResponse<T> {
  return { success: true, data };
}
