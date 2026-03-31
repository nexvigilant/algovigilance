import { type NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyCronSecret } from '@/lib/cron-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('cleanup-rate-limits/route');

/**
 * GET /api/cron/cleanup-rate-limits
 *
 * Vercel Cron Job endpoint that runs daily to clean up expired rate limit documents.
 * Removes documents from rate_limits_public that are older than 24 hours.
 *
 * Schedule: Daily at 2 AM UTC (configured in vercel.json)
 *
 * Security: Protected by CRON_SECRET from Secret Manager
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security (fail-closed)
  const authError = await verifyCronSecret(request, 'cleanup-rate-limits');
  if (authError) return authError;

  log.debug('[Cron] Starting rate limits cleanup job...');
  const startTime = Date.now();

  try {
    // Calculate cutoff time (24 hours ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Query for expired rate limit documents
    const expiredDocs = await adminDb
      .collection('rate_limits_public')
      .where('windowStart', '<', cutoffTime)
      .limit(500) // Process in batches to avoid timeout
      .get();

    if (expiredDocs.empty) {
      log.debug('[Cron] No expired rate limit documents to clean up');
      return NextResponse.json({
        success: true,
        message: 'No expired documents found',
        deleted: 0,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    // Delete in batches
    const batch = adminDb.batch();
    let deletedCount = 0;

    expiredDocs.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();

    const duration = Date.now() - startTime;
    log.debug(`[Cron] Cleaned up ${deletedCount} expired rate limit documents in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired rate limit documents`,
      deleted: deletedCount,
      duration: `${duration}ms`,
    });
  } catch (error) {
    log.error('[Cron] Error in rate limits cleanup job:', error);
    return NextResponse.json(
      {
        error: 'Rate limits cleanup job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for manual triggering
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
