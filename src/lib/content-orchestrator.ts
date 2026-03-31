/**
 * Content Orchestrator
 *
 * AI-powered content pipeline automation system.
 * Coordinates batch content generation across KSBs with
 * quality gates, progress tracking, and automatic retries.
 */

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { generateALOContent, getKSBsForBuilder, getKSBForBuilder } from '@/lib/actions/ksb-builder';
import {
  notifyBatchComplete,
  notifyReviewNeeded,
} from '@/app/nucleus/admin/academy/operations/notifications-actions';
import { getDomainAssignment } from '@/app/nucleus/admin/academy/operations/team-assignments-actions';
import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';

const log = logger.scope('content-orchestrator');

// ============================================================================
// Types
// ============================================================================

export type BatchStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ActivityEngine = 'red_pen' | 'triage' | 'synthesis';

export interface ContentJob {
  id: string;
  batchId: string;
  domainId: string;
  ksbId: string;
  ksbTitle: string;
  activityEngine: ActivityEngine;
  status: BatchStatus;
  priority: JobPriority;
  progress: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface ContentBatch {
  id: string;
  name: string;
  description?: string;
  domainId: string;
  domainName: string;
  status: BatchStatus;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  activityEngine: ActivityEngine;
  priority: JobPriority;
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  config: BatchConfig;
}

export interface BatchConfig {
  bypassQualityGates: boolean;
  maxConcurrent: number;
  maxRetries: number;
  delayBetweenMs: number;
  autoPublish: boolean;
  notifyOnComplete: boolean;
}

export interface BatchProgress {
  batchId: string;
  status: BatchStatus;
  total: number;
  completed: number;
  failed: number;
  processing: number;
  queued: number;
  percentComplete: number;
  estimatedRemainingMs: number;
  currentJob?: {
    ksbId: string;
    ksbTitle: string;
    progress: number;
  };
}

export interface OrchestrationResult {
  success: boolean;
  batchId?: string;
  message?: string;
  error?: string;
}

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  bypassQualityGates: false,
  maxConcurrent: 3, // Parallel execution - API rate limits handled by RateLimiter utility
  maxRetries: 2,
  delayBetweenMs: 1000, // 1 second stagger between job starts
  autoPublish: false,
  notifyOnComplete: true,
};

// ============================================================================
// Batch Creation
// ============================================================================

/**
 * Create a new content generation batch for a domain
 */
export async function createContentBatch(
  domainId: string,
  ksbIds: string[],
  activityEngine: ActivityEngine,
  userId: string,
  options?: {
    name?: string;
    description?: string;
    priority?: JobPriority;
    config?: Partial<BatchConfig>;
  }
): Promise<OrchestrationResult> {
  try {
    // Get domain info
    const domainDoc = await adminDb.collection('pv_domains').doc(domainId).get();
    if (!domainDoc.exists) {
      return { success: false, error: 'Domain not found' };
    }
    const domainName = domainDoc.data()?.name || `Domain ${domainId}`;

    // Create batch document
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const config = { ...DEFAULT_BATCH_CONFIG, ...options?.config };

    const batch: Omit<ContentBatch, 'id'> = {
      name: options?.name || `${domainName} - ${activityEngine} Generation`,
      description: options?.description,
      domainId,
      domainName,
      status: 'queued',
      totalJobs: ksbIds.length,
      completedJobs: 0,
      failedJobs: 0,
      activityEngine,
      priority: options?.priority || 'normal',
      createdBy: userId,
      createdAt: new Date(),
      config,
    };

    // Save batch
    await adminDb.collection('content_batches').doc(batchId).set({
      ...batch,
      createdAt: adminTimestamp.now(),
    });

    // Create individual jobs
    const jobPromises = ksbIds.map(async (ksbId, index) => {
      // Get KSB title
      const ksbResult = await getKSBForBuilder(domainId, ksbId);
      const ksbTitle = ksbResult.ksb?.itemName || ksbId;

      const job: Omit<ContentJob, 'id'> = {
        batchId,
        domainId,
        ksbId,
        ksbTitle,
        activityEngine,
        status: 'queued',
        priority: options?.priority || 'normal',
        progress: 0,
        createdAt: new Date(),
        retryCount: 0,
        maxRetries: config.maxRetries,
      };

      const jobId = `job_${batchId}_${index}`;
      await adminDb.collection('content_jobs').doc(jobId).set({
        id: jobId,
        ...job,
        createdAt: adminTimestamp.now(),
      });

      return jobId;
    });

    await Promise.all(jobPromises);

    return {
      success: true,
      batchId,
      message: `Created batch with ${ksbIds.length} jobs`,
    };
  } catch (error) {
    log.error('Error creating content batch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create batch',
    };
  }
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Process a content generation batch
 * This function is designed to be called from a background job or API route
 */
export async function processBatch(
  batchId: string,
  userId: string
): Promise<OrchestrationResult> {
  try {
    // Get batch
    const batchDoc = await adminDb.collection('content_batches').doc(batchId).get();
    if (!batchDoc.exists) {
      return { success: false, error: 'Batch not found' };
    }

    const batch = batchDoc.data() as ContentBatch;
    if (batch.status !== 'queued' && batch.status !== 'processing') {
      return { success: false, error: `Batch is ${batch.status}, cannot process` };
    }

    // Update batch status
    await adminDb.collection('content_batches').doc(batchId).update({
      status: 'processing',
      startedAt: adminTimestamp.now(),
    });

    // Get all queued jobs for this batch
    const jobsSnapshot = await adminDb
      .collection('content_jobs')
      .where('batchId', '==', batchId)
      .where('status', '==', 'queued')
      .orderBy('createdAt')
      .get();

    const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentJob));

    // Process jobs sequentially (respecting rate limits)
    let completedCount = 0;
    let failedCount = 0;

    for (const job of jobs) {
      try {
        // Update job status
        await adminDb.collection('content_jobs').doc(job.id).update({
          status: 'processing',
          startedAt: adminTimestamp.now(),
        });

        // Generate content
        const result = await generateALOContent(
          job.domainId,
          job.ksbId,
          job.activityEngine,
          userId,
          { bypassQualityGates: batch.config.bypassQualityGates }
        );

        if (result.success) {
          completedCount++;
          await adminDb.collection('content_jobs').doc(job.id).update({
            status: 'completed',
            progress: 100,
            completedAt: adminTimestamp.now(),
          });
        } else {
          // Check if we should retry
          if (job.retryCount < job.maxRetries) {
            await adminDb.collection('content_jobs').doc(job.id).update({
              status: 'queued',
              retryCount: job.retryCount + 1,
              error: result.error,
            });
          } else {
            failedCount++;
            await adminDb.collection('content_jobs').doc(job.id).update({
              status: 'failed',
              error: result.error,
              completedAt: adminTimestamp.now(),
            });
          }
        }

        // Update batch progress
        await adminDb.collection('content_batches').doc(batchId).update({
          completedJobs: completedCount,
          failedJobs: failedCount,
        });

        // Delay between jobs
        if (batch.config.delayBetweenMs > 0) {
          await delay(batch.config.delayBetweenMs);
        }
      } catch (jobError) {
        log.error(`Error processing job ${job.id}:`, jobError);
        failedCount++;
        await adminDb.collection('content_jobs').doc(job.id).update({
          status: 'failed',
          error: jobError instanceof Error ? jobError.message : 'Unknown error',
          completedAt: adminTimestamp.now(),
        });
      }
    }

    // Check for any remaining queued jobs (from retries)
    const remainingJobs = await adminDb
      .collection('content_jobs')
      .where('batchId', '==', batchId)
      .where('status', '==', 'queued')
      .get();

    const finalStatus = remainingJobs.empty ? 'completed' : 'processing';

    // Update batch final status
    await adminDb.collection('content_batches').doc(batchId).update({
      status: finalStatus,
      completedJobs: completedCount,
      failedJobs: failedCount,
      completedAt: finalStatus === 'completed' ? adminTimestamp.now() : null,
    });

    // Send notification when batch completes
    if (finalStatus === 'completed') {
      await notifyBatchComplete({
        userId,
        batchId,
        successCount: completedCount,
        failedCount,
      });

      // Also notify the domain assignee to review the content
      const assignmentResult = await getDomainAssignment(batch.domainId);
      if (assignmentResult.success && assignmentResult.assignment) {
        await notifyReviewNeeded({
          userId: assignmentResult.assignment.assigneeId,
          domainId: batch.domainId,
          domainName: batch.domainName,
          ksbId: '',
          ksbName: `${completedCount} KSBs in ${batch.domainName}`,
        });
      }
    }

    return {
      success: true,
      message: `Processed ${completedCount} jobs, ${failedCount} failed`,
    };
  } catch (error) {
    log.error('Error processing batch:', error);

    // Mark batch as failed
    await adminDb.collection('content_batches').doc(batchId).update({
      status: 'failed',
      completedAt: adminTimestamp.now(),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process batch',
    };
  }
}

// ============================================================================
// Batch Management
// ============================================================================

/**
 * Cancel a running batch
 */
export async function cancelBatch(batchId: string): Promise<OrchestrationResult> {
  try {
    // Update batch status
    await adminDb.collection('content_batches').doc(batchId).update({
      status: 'cancelled',
      completedAt: adminTimestamp.now(),
    });

    // Cancel all queued jobs
    const queuedJobs = await adminDb
      .collection('content_jobs')
      .where('batchId', '==', batchId)
      .where('status', 'in', ['queued', 'processing'])
      .get();

    const cancelPromises = queuedJobs.docs.map(doc =>
      doc.ref.update({
        status: 'cancelled',
        completedAt: adminTimestamp.now(),
      })
    );

    await Promise.all(cancelPromises);

    return {
      success: true,
      message: `Cancelled batch and ${queuedJobs.size} jobs`,
    };
  } catch (error) {
    log.error('Error cancelling batch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel batch',
    };
  }
}

/**
 * Get batch progress
 */
export async function getBatchProgress(batchId: string): Promise<BatchProgress | null> {
  try {
    const batchDoc = await adminDb.collection('content_batches').doc(batchId).get();
    if (!batchDoc.exists) return null;

    const batch = batchDoc.data() as ContentBatch;

    // Get job counts by status
    const jobsSnapshot = await adminDb
      .collection('content_jobs')
      .where('batchId', '==', batchId)
      .get();

    const jobs = jobsSnapshot.docs.map(doc => doc.data() as ContentJob);

    const statusCounts = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    let currentJob: BatchProgress['currentJob'];

    jobs.forEach(job => {
      statusCounts[job.status]++;
      if (job.status === 'processing') {
        currentJob = {
          ksbId: job.ksbId,
          ksbTitle: job.ksbTitle,
          progress: job.progress,
        };
      }
    });

    const percentComplete = batch.totalJobs > 0
      ? Math.round(((statusCounts.completed + statusCounts.failed) / batch.totalJobs) * 100)
      : 0;

    // Estimate remaining time (rough estimate based on average job time)
    const remainingJobs = statusCounts.queued + statusCounts.processing;
    const averageJobMs = 30000; // 30 seconds average
    const estimatedRemainingMs = remainingJobs * averageJobMs;

    return {
      batchId,
      status: batch.status,
      total: batch.totalJobs,
      completed: statusCounts.completed,
      failed: statusCounts.failed,
      processing: statusCounts.processing,
      queued: statusCounts.queued,
      percentComplete,
      estimatedRemainingMs,
      currentJob,
    };
  } catch (error) {
    log.error('Error getting batch progress:', error);
    return null;
  }
}

/**
 * List recent batches
 */
export async function listBatches(options?: {
  limit?: number;
  status?: BatchStatus;
  domainId?: string;
}): Promise<ContentBatch[]> {
  try {
    let query = adminDb.collection('content_batches')
      .orderBy('createdAt', 'desc')
      .limit(options?.limit || 20);

    if (options?.status) {
      query = query.where('status', '==', options.status);
    }

    if (options?.domainId) {
      query = query.where('domainId', '==', options.domainId);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDateFromSerialized(data.createdAt) || new Date(),
        startedAt: toDateFromSerialized(data.startedAt),
        completedAt: toDateFromSerialized(data.completedAt),
      } as ContentBatch;
    });
  } catch (error) {
    log.error('Error listing batches:', error);
    return [];
  }
}

/**
 * Get jobs for a batch
 */
export async function getBatchJobs(batchId: string): Promise<ContentJob[]> {
  try {
    const snapshot = await adminDb
      .collection('content_jobs')
      .where('batchId', '==', batchId)
      .orderBy('createdAt')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: toDateFromSerialized(data.createdAt) || new Date(),
        startedAt: toDateFromSerialized(data.startedAt),
        completedAt: toDateFromSerialized(data.completedAt),
      } as ContentJob;
    });
  } catch (error) {
    log.error('Error getting batch jobs:', error);
    return [];
  }
}

// ============================================================================
// Quick Actions
// ============================================================================

/**
 * Generate content for all KSBs in a domain that are missing content
 */
export async function generateMissingContent(
  domainId: string,
  activityEngine: ActivityEngine,
  userId: string,
  options?: {
    priority?: JobPriority;
    config?: Partial<BatchConfig>;
  }
): Promise<OrchestrationResult> {
  try {
    // Get all KSBs in domain
    const ksbsResult = await getKSBsForBuilder(domainId);
    if (!ksbsResult.success || !ksbsResult.ksbs) {
      return { success: false, error: 'Failed to fetch KSBs' };
    }

    // Filter to only those missing content
    const missingContent = ksbsResult.ksbs.filter(ksb => {
      const hasContent = ksb.hook && ksb.concept && ksb.activity && ksb.reflection;
      return !hasContent;
    });

    if (missingContent.length === 0) {
      return {
        success: true,
        message: 'All KSBs already have content',
      };
    }

    const ksbIds = missingContent.map(ksb => ksb.id);

    return createContentBatch(domainId, ksbIds, activityEngine, userId, {
      name: `Auto-fill Missing Content`,
      description: `Generating content for ${ksbIds.length} KSBs missing content`,
      ...options,
    });
  } catch (error) {
    log.error('Error generating missing content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate missing content',
    };
  }
}

/**
 * Regenerate content for KSBs that failed quality checks
 */
export async function regenerateLowQualityContent(
  domainId: string,
  activityEngine: ActivityEngine,
  userId: string,
  options?: {
    minQualityScore?: number;
    priority?: JobPriority;
    config?: Partial<BatchConfig>;
  }
): Promise<OrchestrationResult> {
  try {
    const minScore = options?.minQualityScore || 70;

    // Get all KSBs in domain
    const ksbsResult = await getKSBsForBuilder(domainId);
    if (!ksbsResult.success || !ksbsResult.ksbs) {
      return { success: false, error: 'Failed to fetch KSBs' };
    }

    // Filter to low quality
    const lowQuality = ksbsResult.ksbs.filter(ksb => {
      const coverageScore = ksb.coverageScore?.overall || 0;
      return coverageScore < minScore && ksb.status !== 'published';
    });

    if (lowQuality.length === 0) {
      return {
        success: true,
        message: `No KSBs below quality threshold (${minScore}%)`,
      };
    }

    const ksbIds = lowQuality.map(ksb => ksb.id);

    return createContentBatch(domainId, ksbIds, activityEngine, userId, {
      name: `Regenerate Low Quality Content`,
      description: `Regenerating ${ksbIds.length} KSBs below ${minScore}% quality`,
      ...options,
    });
  } catch (error) {
    log.error('Error regenerating low quality content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate content',
    };
  }
}

// ============================================================================
// Helpers
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Stats
// ============================================================================

export interface OrchestrationStats {
  activeBatches: number;
  totalJobsToday: number;
  completedToday: number;
  failedToday: number;
  averageJobDurationMs: number;
  queueDepth: number;
}

export async function getOrchestrationStats(): Promise<OrchestrationStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all stats in parallel
    const [activeBatches, jobsToday, queuedJobs] = await Promise.all([
      // Active batches
      adminDb
        .collection('content_batches')
        .where('status', 'in', ['queued', 'processing'])
        .get(),
      // Jobs today
      adminDb
        .collection('content_jobs')
        .where('createdAt', '>=', today)
        .get(),
      // Queue depth
      adminDb
        .collection('content_jobs')
        .where('status', '==', 'queued')
        .get(),
    ]);

    const jobs = jobsToday.docs.map(doc => doc.data() as ContentJob);
    const completedToday = jobs.filter(j => j.status === 'completed').length;
    const failedToday = jobs.filter(j => j.status === 'failed').length;

    // Calculate average duration for completed jobs
    const completedWithDuration = jobs.filter(j =>
      j.status === 'completed' && j.startedAt && j.completedAt
    );
    const totalDuration = completedWithDuration.reduce((sum, job) => {
      const start = new Date(job.startedAt ?? '').getTime();
      const end = new Date(job.completedAt ?? '').getTime();
      return sum + (end - start);
    }, 0);
    const averageJobDurationMs = completedWithDuration.length > 0
      ? Math.round(totalDuration / completedWithDuration.length)
      : 30000;

    return {
      activeBatches: activeBatches.size,
      totalJobsToday: jobs.length,
      completedToday,
      failedToday,
      averageJobDurationMs,
      queueDepth: queuedJobs.size,
    };
  } catch (error) {
    log.error('Error getting orchestration stats:', error);
    return {
      activeBatches: 0,
      totalJobsToday: 0,
      completedToday: 0,
      failedToday: 0,
      averageJobDurationMs: 30000,
      queueDepth: 0,
    };
  }
}
