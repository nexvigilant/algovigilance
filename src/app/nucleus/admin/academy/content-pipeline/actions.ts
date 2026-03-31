'use server';


import { logger } from '@/lib/logger';
const log = logger.scope('content-pipeline/actions');
import { requireAdmin } from '@/lib/admin-auth';
import {
  createContentBatch,
  processBatch,
  cancelBatch,
  getBatchProgress,
  listBatches,
  getBatchJobs,
  generateMissingContent,
  regenerateLowQualityContent,
  getOrchestrationStats,
  type ContentJob,
  type BatchProgress,
  type OrchestrationStats,
  type ActivityEngine,
  type JobPriority,
  type BatchConfig,
  type BatchStatus,
} from '@/lib/content-orchestrator';
import { getDomains, getKSBsForBuilder, type DomainInfo } from '@/lib/actions/ksb-builder';
import type { CapabilityComponent } from '@/types/pv-curriculum';

// ============================================================================
// Types for Client
// ============================================================================

export interface DomainWithStats extends DomainInfo {
  ksbCount: number;
  withContent: number;
  missingContent: number;
  published: number;
}

export interface BatchListItem {
  id: string;
  name: string;
  domainName: string;
  status: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  progress: number;
  createdAt: string;
}

// ============================================================================
// Domain & KSB Queries
// ============================================================================

export async function getDomainsWithStats(): Promise<{
  success: boolean;
  domains?: DomainWithStats[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const domainsResult = await getDomains();
    if (!domainsResult.success || !domainsResult.domains) {
      return { success: false, error: 'Failed to fetch domains' };
    }

    // Get stats for each domain
    const domainsWithStats: DomainWithStats[] = await Promise.all(
      domainsResult.domains.map(async (domain) => {
        const ksbsResult = await getKSBsForBuilder(domain.id);
        const ksbs = ksbsResult.ksbs || [];

        const withContent = ksbs.filter(
          (k) => k.hook && k.concept && k.activity && k.reflection
        ).length;

        const published = ksbs.filter((k) => k.status === 'published').length;

        return {
          ...domain,
          ksbCount: ksbs.length,
          withContent,
          missingContent: ksbs.length - withContent,
          published,
        };
      })
    );

    return { success: true, domains: domainsWithStats };
  } catch (error) {
    log.error('Error getting domains with stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch domains',
    };
  }
}

export async function getDomainKSBs(domainId: string): Promise<{
  success: boolean;
  ksbs?: CapabilityComponent[];
  error?: string;
}> {
  try {
    await requireAdmin();
    return await getKSBsForBuilder(domainId);
  } catch (error) {
    log.error('Error getting KSBs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch KSBs',
    };
  }
}

// ============================================================================
// Batch Creation Actions
// ============================================================================

export async function createBatch(
  domainId: string,
  ksbIds: string[],
  activityEngine: ActivityEngine,
  options?: {
    name?: string;
    description?: string;
    priority?: JobPriority;
    bypassQualityGates?: boolean;
  }
): Promise<{ success: boolean; batchId?: string; error?: string }> {
  try {
    const user = await requireAdmin();

    const config: Partial<BatchConfig> = {
      bypassQualityGates: options?.bypassQualityGates || false,
    };

    const result = await createContentBatch(
      domainId,
      ksbIds,
      activityEngine,
      user.uid,
      {
        name: options?.name,
        description: options?.description,
        priority: options?.priority,
        config,
      }
    );

    return {
      success: result.success,
      batchId: result.batchId,
      error: result.error,
    };
  } catch (error) {
    log.error('Error creating batch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create batch',
    };
  }
}

export async function createBatchForMissingContent(
  domainId: string,
  activityEngine: ActivityEngine,
  options?: {
    priority?: JobPriority;
    bypassQualityGates?: boolean;
  }
): Promise<{ success: boolean; batchId?: string; message?: string; error?: string }> {
  try {
    const user = await requireAdmin();

    const result = await generateMissingContent(domainId, activityEngine, user.uid, {
      priority: options?.priority,
      config: {
        bypassQualityGates: options?.bypassQualityGates || false,
      },
    });

    return {
      success: result.success,
      batchId: result.batchId,
      message: result.message,
      error: result.error,
    };
  } catch (error) {
    log.error('Error creating batch for missing content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create batch',
    };
  }
}

export async function createBatchForLowQuality(
  domainId: string,
  activityEngine: ActivityEngine,
  minQualityScore: number,
  options?: {
    priority?: JobPriority;
    bypassQualityGates?: boolean;
  }
): Promise<{ success: boolean; batchId?: string; message?: string; error?: string }> {
  try {
    const user = await requireAdmin();

    const result = await regenerateLowQualityContent(
      domainId,
      activityEngine,
      user.uid,
      {
        minQualityScore,
        priority: options?.priority,
        config: {
          bypassQualityGates: options?.bypassQualityGates || false,
        },
      }
    );

    return {
      success: result.success,
      batchId: result.batchId,
      message: result.message,
      error: result.error,
    };
  } catch (error) {
    log.error('Error creating batch for low quality:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create batch',
    };
  }
}

// ============================================================================
// Batch Processing Actions
// ============================================================================

export async function startBatchProcessing(
  batchId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAdmin();

    // Start processing in background
    // Note: In production, this would trigger a Cloud Function or background job
    // For now, we process synchronously (not ideal for long batches)
    const result = await processBatch(batchId, user.uid);

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    log.error('Error starting batch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start batch',
    };
  }
}

export async function cancelBatchProcessing(
  batchId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const result = await cancelBatch(batchId);

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    log.error('Error cancelling batch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel batch',
    };
  }
}

// ============================================================================
// Batch Monitoring Actions
// ============================================================================

export async function fetchBatchProgress(
  batchId: string
): Promise<{ success: boolean; progress?: BatchProgress; error?: string }> {
  try {
    await requireAdmin();

    const progress = await getBatchProgress(batchId);
    if (!progress) {
      return { success: false, error: 'Batch not found' };
    }

    return { success: true, progress };
  } catch (error) {
    log.error('Error fetching batch progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch progress',
    };
  }
}

export async function fetchBatches(options?: {
  limit?: number;
  status?: BatchStatus;
  domainId?: string;
}): Promise<{ success: boolean; batches?: BatchListItem[]; error?: string }> {
  try {
    await requireAdmin();

    const batches = await listBatches({
      limit: options?.limit,
      status: options?.status,
      domainId: options?.domainId,
    });

    const batchItems: BatchListItem[] = batches.map((batch) => ({
      id: batch.id,
      name: batch.name,
      domainName: batch.domainName,
      status: batch.status,
      totalJobs: batch.totalJobs,
      completedJobs: batch.completedJobs,
      failedJobs: batch.failedJobs,
      progress: batch.totalJobs > 0
        ? Math.round(((batch.completedJobs + batch.failedJobs) / batch.totalJobs) * 100)
        : 0,
      createdAt: batch.createdAt.toISOString(),
    }));

    return { success: true, batches: batchItems };
  } catch (error) {
    log.error('Error fetching batches:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch batches',
    };
  }
}

export async function fetchBatchJobs(
  batchId: string
): Promise<{ success: boolean; jobs?: ContentJob[]; error?: string }> {
  try {
    await requireAdmin();

    const jobs = await getBatchJobs(batchId);

    return { success: true, jobs };
  } catch (error) {
    log.error('Error fetching batch jobs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch jobs',
    };
  }
}

// ============================================================================
// Stats Action
// ============================================================================

export async function fetchOrchestrationStats(): Promise<{
  success: boolean;
  stats?: OrchestrationStats;
  error?: string;
}> {
  try {
    await requireAdmin();

    const stats = await getOrchestrationStats();

    return { success: true, stats };
  } catch (error) {
    log.error('Error fetching stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}
