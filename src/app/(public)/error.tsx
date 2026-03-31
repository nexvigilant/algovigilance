'use client';

import { useEffect } from 'react';
import { VoiceErrorBoundary } from '@/components/voice';
import { reportError } from '@/lib/error-reporting';

/**
 * PublicError - Error boundary for public-facing pages.
 *
 * Captures errors in the (public) route group and:
 * 1. Reports to telemetry (production) or console (dev)
 * 2. Displays user-friendly error UI via VoiceErrorBoundary
 * 3. Provides reset functionality for error recovery
 *
 * @see error-reporting.ts for telemetry integration points
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report error with context for production monitoring
    reportError(error, {
      component: 'PublicError',
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      digest: error.digest,
      metadata: {
        routeGroup: '(public)',
      },
    });
  }, [error]);

  return <VoiceErrorBoundary error={error} reset={reset} type="generic" />;
}
