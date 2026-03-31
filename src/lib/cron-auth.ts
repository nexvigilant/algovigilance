'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { getSecret, SecretNames } from '@/lib/secrets';
import { logger } from '@/lib/logger';

const log = logger.scope('lib/cron-auth');

/**
 * Check if we're in a production-like environment
 * Uses multiple signals to prevent misconfiguration bypasses
 */
function isProductionEnvironment(): boolean {
  // Primary check: NODE_ENV
  if (process.env.NODE_ENV === 'production') return true;

  // Secondary check: Vercel deployment (VERCEL_ENV is set automatically)
  // This catches preview deployments that might not have NODE_ENV=production
  if (process.env.VERCEL_ENV === 'production') return true;
  if (process.env.VERCEL_ENV === 'preview') return true;

  // Tertiary check: If running on Vercel at all, require auth
  // VERCEL is set to "1" on all Vercel deployments
  if (process.env.VERCEL === '1') return true;

  return false;
}

/**
 * Verify CRON_SECRET for cron job endpoints
 *
 * Security: Fail-closed - rejects if:
 * - No secret configured (in production)
 * - Secret mismatch
 * - Missing Authorization header (in production)
 *
 * Development behavior:
 * - Allows access without auth ONLY if explicitly local (not on Vercel)
 * - If CRON_SECRET is set locally, it will still be validated
 *
 * @param request - NextRequest with Authorization header
 * @param jobName - Name of the cron job for logging
 * @returns null if authorized, NextResponse with 401 if unauthorized
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const authError = await verifyCronSecret(request, 'my-cron-job');
 *   if (authError) return authError;
 *
 *   // Proceed with cron job logic
 * }
 * ```
 */
export async function verifyCronSecret(
  request: NextRequest,
  jobName: string
): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');
  const isProduction = isProductionEnvironment();

  // Get the secret (try secret manager first, fall back to env var)
  let cronSecret: string | undefined;
  try {
    cronSecret = await getSecret(SecretNames.CRON_SECRET);
  } catch {
    // Fallback to environment variable
    cronSecret = process.env.CRON_SECRET;
  }

  // In development without a secret configured, allow access
  // This only works for truly local dev (not Vercel preview/prod)
  if (!isProduction && !cronSecret) {
    log.debug(`[Cron] Dev mode bypass for ${jobName} (no secret configured)`);
    return null;
  }

  // If we have a secret (even in dev), validate it
  // This allows testing cron auth locally
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return null;
  }

  // Fail-closed: reject in all other cases
  log.warn(`[Cron] Unauthorized request to ${jobName}`, {
    isProduction,
    hasSecret: !!cronSecret,
    hasAuthHeader: !!authHeader,
  });
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
