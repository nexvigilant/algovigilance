import { type NextRequest, NextResponse } from 'next/server';
import { processDueScheduledBatches } from '@/app/nucleus/admin/academy/content-pipeline/scheduling-actions';
import { verifyCronSecret } from '@/lib/cron-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('process-scheduled-batches/route');
// Vercel Cron configuration
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

/**
 * Cron job to process scheduled batches.
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-scheduled-batches",
 *     "schedule": "0 * * * *"  // Every hour
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security (fail-closed)
  const authError = await verifyCronSecret(request, 'process-scheduled-batches');
  if (authError) return authError;

  try {
    log.debug('[process-scheduled-batches] Starting scheduled batch processing...');

    const result = await processDueScheduledBatches();

    if (result.success) {
      log.debug(`[process-scheduled-batches] Processed ${result.processed} batches`);

      if (result.errors.length > 0) {
        log.warn('[process-scheduled-batches] Errors:', result.errors);
      }

      return NextResponse.json({
        success: true,
        processed: result.processed,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });
    } else {
      log.error('[process-scheduled-batches] Failed:', result.errors);
      return NextResponse.json(
        {
          success: false,
          errors: result.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error('[process-scheduled-batches] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
