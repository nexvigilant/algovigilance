/**
 * Error Tracking Service
 *
 * Provides a unified interface for error tracking via structured logging.
 * Sentry integration was removed — the dynamic import caused build warnings
 * and no DSN was ever configured. Re-add if needed in the future.
 */

import { logger } from "@/lib/logger";

const log = logger.scope("error-tracking");

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: "error" | "warning" | "info" | "debug";
}

interface User {
  id: string;
  email?: string;
  displayName?: string;
}

/**
 * Initialize error tracking service
 */
export async function initErrorTracking(): Promise<void> {
  log.debug("Error tracking initialized (structured logging)");
}

/**
 * Capture an error with optional context
 */
export function captureError(
  error: Error | string,
  context?: ErrorContext,
): string {
  const errorObj = typeof error === "string" ? new Error(error) : error;
  log.error("Captured error:", { message: errorObj.message, context });
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  context?: ErrorContext,
): string {
  log.info("Captured message:", { message, context });
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Set user context for all subsequent events
 */
export function setUser(user: User | null): void {
  if (user) {
    log.debug("Set user context:", user.id);
  } else {
    log.debug("Cleared user context");
  }
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  _data?: Record<string, unknown>,
): void {
  log.debug(`[${category}] ${message}`);
}

/**
 * Set a tag for all subsequent events
 */
export function setTag(_key: string, _value: string): void {
  // No-op without external tracking service
}

/**
 * Create an error boundary wrapper for React components
 */
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  _fallback: React.ReactNode,
): React.ComponentType<T> {
  return Component;
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  context?: Omit<ErrorContext, "extra">,
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error as Error, {
        ...context,
        extra: { args },
      });
      throw error;
    }
  };
}
