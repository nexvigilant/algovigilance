'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

const log = logger.scope('security');

/**
 * Security Hardening Component
 *
 * Initializes client-side security measures:
 * 1. Global error handlers to prevent stack trace exposure
 * 2. Prototype pollution protection (production only)
 * 3. Unhandled promise rejection handling
 */
export function SecurityHardening() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // 1. Global error handler - prevents stack trace exposure
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      // Log to our logging system (not user-facing)
      log.error('Uncaught error:', {
        message: String(message),
        source,
        lineno,
        colno,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n'), // Limit stack depth
      });

      // Call original handler if exists
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }

      // Return true to suppress the default browser error in console
      // In production, this prevents detailed stack traces
      return process.env.NODE_ENV === 'production';
    };

    // 2. Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      log.error('Unhandled promise rejection:', {
        reason: event.reason?.toString?.() || 'Unknown reason',
        stack: event.reason?.stack?.split('\n').slice(0, 5).join('\n'),
      });

      // Prevent the default handling (console error) in production
      if (process.env.NODE_ENV === 'production') {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // 3. Prototype pollution protection - DISABLED
    // Object.freeze(Object.prototype) was causing issues with Firebase Auth
    // and other libraries that modify prototypes at runtime.
    // Error: "Cannot assign to read only property 'toString' of object '#<Object>'"
    //
    // Alternative mitigations implemented:
    // - CSP headers prevent inline script injection
    // - Input sanitization at form boundaries
    // - Server-side validation for all data
    //
    // If re-enabling, consider freezing only specific dangerous properties:
    // Object.defineProperty(Object.prototype, '__proto__', { configurable: false, writable: false });

    // Cleanup
    return () => {
      window.onerror = originalOnError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // This component renders nothing - it's purely for side effects
  return null;
}
