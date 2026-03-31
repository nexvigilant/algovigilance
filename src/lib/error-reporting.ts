/**
 * Client-Side Error Reporting with Selective Amplification
 *
 * Engineering source: Williams 1909, Ch 7 — Tuned Circuit / Selective Amplifier
 * T1 Primitives: ν(Frequency) + κ(Comparison) + ∂(Boundary) + N(Quantity)
 *
 * Principle: A tuned circuit amplifies signals at a target frequency and
 * attenuates everything else. Applied to error reporting: novel/critical
 * errors are amplified (reported immediately), while known/repetitive
 * errors are attenuated (rate-limited) to prevent alert fatigue.
 *
 * Usage:
 *   import { reportError } from '@/lib/error-reporting';
 *
 *   // In error boundary or catch block
 *   reportError(error, { component: 'PublicError', route: '/about' });
 *
 * Modes:
 *   - Development: Logs to console with detailed info
 *   - Production: Logs + sends to telemetry endpoint (extensible)
 *
 * Integration points (for future enhancement):
 *   - Sentry: Replace sendToTelemetry with Sentry.captureException
 *   - Custom API: POST to /api/telemetry/errors
 *   - Vercel: Already captures via Analytics, this adds structured context
 */

import { logger } from '@/lib/logger';

const log = logger.scope('ErrorReporting');

// ── Selective Amplification (Ch 7 Tuned Circuit) ────────────────────────

type ErrorSeverity = 'critical' | 'warning' | 'noise';

interface ErrorFingerprint {
  count: number;
  firstSeen: number;
  lastSeen: number;
  severity: ErrorSeverity;
}

/**
 * Sliding window of error fingerprints for rate-limiting.
 * Known, frequent errors get attenuated; novel errors get amplified.
 */
const errorWindow = new Map<string, ErrorFingerprint>();
const ERROR_WINDOW_MS = 5 * 60_000; // 5 minute window
const ATTENUATION_THRESHOLD = 3;    // After 3 occurrences, attenuate
const NOISE_THRESHOLD = 10;         // After 10, classify as noise

/**
 * Generate a stable fingerprint for an error (name + first line of message).
 * Same logical error from different call sites produces the same key.
 */
function fingerprintError(error: Error, context: ErrorContext): string {
  const msgPrefix = error.message.slice(0, 80);
  return `${error.name}:${context.component || '_'}:${msgPrefix}`;
}

/**
 * Classify error severity based on frequency and characteristics.
 * Novel errors = critical (amplify). Repeated = warning. Flood = noise (attenuate).
 */
function classifyError(
  error: Error,
  context: ErrorContext
): { severity: ErrorSeverity; shouldReport: boolean; occurrences: number } {
  const key = fingerprintError(error, context);
  const now = Date.now();

  // Prune stale entries
  for (const [k, fp] of errorWindow) {
    if (now - fp.lastSeen > ERROR_WINDOW_MS) {
      errorWindow.delete(k);
    }
  }

  const existing = errorWindow.get(key);

  if (!existing) {
    // Novel error — amplify (tuned circuit resonance)
    errorWindow.set(key, {
      count: 1,
      firstSeen: now,
      lastSeen: now,
      severity: 'critical',
    });
    return { severity: 'critical', shouldReport: true, occurrences: 1 };
  }

  // Update existing
  existing.count++;
  existing.lastSeen = now;

  if (existing.count >= NOISE_THRESHOLD) {
    existing.severity = 'noise';
    // Only report every 10th noise error (90% attenuation)
    return {
      severity: 'noise',
      shouldReport: existing.count % 10 === 0,
      occurrences: existing.count,
    };
  }

  if (existing.count >= ATTENUATION_THRESHOLD) {
    existing.severity = 'warning';
    // Report every 3rd warning (67% attenuation)
    return {
      severity: 'warning',
      shouldReport: existing.count % 3 === 0,
      occurrences: existing.count,
    };
  }

  // Still novel-ish — report all
  return { severity: 'critical', shouldReport: true, occurrences: existing.count };
}

export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** Route/URL where error occurred */
  route?: string;
  /** User ID if authenticated (never include PII) */
  userId?: string;
  /** Additional context data */
  metadata?: Record<string, unknown>;
  /** Error digest from Next.js (for correlation) */
  digest?: string;
}

interface ErrorReport {
  message: string;
  name: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

/**
 * Serialize error to a safe, transmittable format
 */
function serializeError(error: Error & { digest?: string }): Pick<ErrorReport, 'message' | 'name' | 'stack'> {
  return {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
    // Limit stack trace to prevent large payloads
    stack: error.stack?.split('\n').slice(0, 10).join('\n'),
  };
}

/**
 * Send error report to Sentry via @sentry/nextjs.
 *
 * Wired 2026-03-31. Replaces the previous no-op stub.
 * 44 error boundaries across Nucleus call reportError() → this function.
 * When NEXT_PUBLIC_SENTRY_DSN is not set, falls back to console logging.
 */
async function sendToTelemetry(report: ErrorReport): Promise<void> {
  try {
    const Sentry = await import('@sentry/nextjs');

    const error = new Error(report.message);
    error.name = report.name;
    if (report.stack) error.stack = report.stack;

    Sentry.captureException(error, {
      extra: {
        ...report.context.metadata,
        route: report.context.route,
        digest: report.context.digest,
        url: report.url,
      },
      tags: {
        component: report.context.component ?? 'unknown',
        platform: 'nucleus',
        severity: (report.context.metadata?.severity as string) ?? 'unknown',
      },
      ...(report.context.userId ? { user: { id: report.context.userId } } : {}),
    });
  } catch {
    // Sentry not loaded (DSN not set) or import failed — log locally
    log.debug('Sentry not available, error logged locally only', {
      message: report.message,
      component: report.context.component,
    });
  }
}

/**
 * Report an error with context for monitoring and debugging
 *
 * @param error - The error object to report
 * @param context - Additional context about where/how the error occurred
 *
 * @example
 * ```tsx
 * // In error boundary
 * useEffect(() => {
 *   reportError(error, {
 *     component: 'PublicError',
 *     route: window.location.pathname,
 *     digest: error.digest,
 *   });
 * }, [error]);
 * ```
 */
export async function reportError(
  error: Error & { digest?: string },
  context: ErrorContext = {}
): Promise<void> {
  // Selective amplification: classify before reporting
  const { severity, shouldReport, occurrences } = classifyError(error, context);

  const serialized = serializeError(error);

  const report: ErrorReport = {
    ...serialized,
    context: {
      ...context,
      digest: error.digest || context.digest,
      metadata: {
        ...context.metadata,
        severity,
        occurrences,
        attenuated: !shouldReport,
      },
    },
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };

  // Always log locally — but severity determines log level
  if (severity === 'critical') {
    log.error(`[${context.component || 'Unknown'}] ${serialized.message}`, {
      stack: serialized.stack,
      context,
      digest: error.digest,
    });
  } else if (severity === 'warning') {
    log.warn(`[${context.component || 'Unknown'}] ${serialized.message} (×${occurrences})`, {
      context,
    });
  } else {
    // noise — minimal logging
    log.debug(`[${context.component || 'Unknown'}] ${serialized.message} (×${occurrences}, attenuated)`);
  }

  // Only send to telemetry if amplification filter passes
  if (process.env.NODE_ENV === 'production' && shouldReport) {
    try {
      await sendToTelemetry(report);
    } catch (telemetryError) {
      // Don't let telemetry failure cascade - just log locally
      log.warn('Failed to send error telemetry', telemetryError);
    }
  }
}

/**
 * Report a non-Error exception (e.g., thrown strings, objects)
 *
 * Converts non-Error values to Error objects for consistent handling.
 */
export async function reportException(
  exception: unknown,
  context: ErrorContext = {}
): Promise<void> {
  if (exception instanceof Error) {
    return reportError(exception, context);
  }

  // Convert non-Error to Error
  const error = new Error(
    typeof exception === 'string' ? exception : JSON.stringify(exception)
  );
  error.name = 'NonErrorException';

  return reportError(error, {
    ...context,
    metadata: {
      ...context.metadata,
      originalValue: typeof exception === 'object' ? '[object]' : String(exception),
    },
  });
}

/**
 * Extracts a human-readable message from any error object
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}

/**
 * Get current error amplification stats (for monitoring dashboards).
 * Shows which errors are being amplified vs attenuated.
 */
export function getErrorStats(): {
  tracked: number;
  critical: number;
  warning: number;
  noise: number;
} {
  let critical = 0;
  let warning = 0;
  let noise = 0;

  for (const fp of errorWindow.values()) {
    switch (fp.severity) {
      case 'critical': critical++; break;
      case 'warning': warning++; break;
      case 'noise': noise++; break;
    }
  }

  return { tracked: errorWindow.size, critical, warning, noise };
}
