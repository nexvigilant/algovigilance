import { type NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { runValidation } from '@/lib/content-validation';
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { verifyCronSecret } from '@/lib/cron-auth';
import type { ContentType } from '@/types/intelligence';

import { logger } from '@/lib/logger';
const log = logger.scope('validate-content/route');

/**
 * GET /api/cron/validate-content
 *
 * Vercel Cron Job endpoint that runs daily to validate Intelligence content
 * using Perplexity Sonar for fact-checking and source verification.
 *
 * Schedule: Daily at 4 AM UTC (configured in vercel.json)
 *
 * Security: Protected by CRON_SECRET from Secret Manager
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security (fail-closed)
  const authError = await verifyCronSecret(request, 'validate-content');
  if (authError) return authError;

  log.debug('[Cron] Starting daily content validation job...');
  const startTime = Date.now();

  try {
    // Run validation on all eligible content
    // Perplexity API key is fetched from Secret Manager inside the validation service
    const run = await runValidation({
      // Exclude podcasts from validation (less fact-checkable)
      contentTypes: ['publication', 'perspective', 'field-note', 'signal'] as ContentType[],
    });

    const duration = Date.now() - startTime;

    log.debug(
      `[Cron] Validation completed in ${duration}ms. ` +
      `${run.articlesWithIssues}/${run.totalArticles} articles have issues. ` +
      `${run.criticalIssues} critical issues found.`
    );

    // Send notifications if there are critical issues
    if (run.criticalIssues > 0 || run.articlesNeedingAttention.length > 0) {
      await sendNotifications(run);

      // Update run record
      if (run.id) {
        await adminDb.collection('validation_runs').doc(run.id).update({
          notificationsSent: true,
        });
        revalidatePath('/nucleus/admin/content-validation');
      }
    }

    return NextResponse.json({
      success: true,
      message: `Validated ${run.totalArticles} articles`,
      runId: run.id,
      summary: {
        totalArticles: run.totalArticles,
        articlesWithIssues: run.articlesWithIssues,
        totalIssues: run.totalIssues,
        criticalIssues: run.criticalIssues,
        articlesNeedingAttention: run.articlesNeedingAttention,
      },
      duration: `${duration}ms`,
    });
  } catch (error) {
    log.error('[Cron] Error in content validation job:', error);
    return NextResponse.json(
      {
        error: 'Content validation job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for manual triggering with options
 */
export async function POST(request: NextRequest) {
  // Verify cron secret for security (fail-closed)
  const authError = await verifyCronSecret(request, 'validate-content-post');
  if (authError) return authError;

  try {
    const body = await request.json();
    const { slugs, force, contentTypes } = body;

    log.debug('[API] Starting manual content validation...');
    const startTime = Date.now();

    const run = await runValidation({
      slugs,
      force,
      contentTypes: contentTypes || ['publication', 'perspective', 'field-note', 'signal'],
    });

    const duration = Date.now() - startTime;

    // Send notifications if requested
    if ((run.criticalIssues > 0 || run.articlesNeedingAttention.length > 0) && body.sendNotifications !== false) {
      await sendNotifications(run);

      if (run.id) {
        await adminDb.collection('validation_runs').doc(run.id).update({
          notificationsSent: true,
        });
        revalidatePath('/nucleus/admin/content-validation');
      }
    }

    return NextResponse.json({
      success: true,
      message: `Validated ${run.totalArticles} articles`,
      runId: run.id,
      summary: {
        totalArticles: run.totalArticles,
        articlesWithIssues: run.articlesWithIssues,
        totalIssues: run.totalIssues,
        criticalIssues: run.criticalIssues,
        articlesNeedingAttention: run.articlesNeedingAttention,
      },
      duration: `${duration}ms`,
    });
  } catch (error) {
    log.error('[API] Error in manual content validation:', error);
    return NextResponse.json(
      {
        error: 'Content validation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Send notifications for validation issues
 * Uses Firestore for in-app notifications
 */
async function sendNotifications(run: {
  id?: string;
  criticalIssues: number;
  totalIssues: number;
  articlesNeedingAttention: readonly string[];
}) {
  log.debug('[Notification] Sending alerts for validation issues...');

  // Store notification in Firestore for admin UI to display
  await adminDb.collection('admin_notifications').add({
    type: 'content_validation',
    title: `Content Validation: ${run.criticalIssues} Critical Issues Found`,
    message: `Daily validation found ${run.totalIssues} issues across ${run.articlesNeedingAttention.length} articles. ` +
      `${run.criticalIssues} require immediate attention.`,
    severity: run.criticalIssues > 0 ? 'critical' : 'warning',
    data: {
      runId: run.id,
      criticalIssues: run.criticalIssues,
      totalIssues: run.totalIssues,
      articlesNeedingAttention: run.articlesNeedingAttention,
    },
    read: false,
    createdAt: adminTimestamp.now(),
  });

  log.debug('[Notification] Admin notification created in Firestore');
}
