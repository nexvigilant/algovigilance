'use server';


import { logger } from '@/lib/logger';
const log = logger.scope('content-pipeline/analytics-actions');
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { toDateFromSerialized } from '@/types/academy';

// ============================================================================
// Firestore Timestamp Utility
// ============================================================================

/** Firestore Timestamp or Date - handles both server and client representations */
type FirestoreTimestampLike = Date | { toDate: () => Date } | undefined;

/** Convert Firestore Timestamp to Date safely */
function toDate(ts: FirestoreTimestampLike): Date | undefined {
  if (!ts) return undefined;
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object' && 'toDate' in ts && typeof ts.toDate === 'function') {
    return toDateFromSerialized(ts);
  }
  return undefined;
}

// ============================================================================
// Pipeline Analytics Types
// ============================================================================

export interface PipelineStats {
  overview: {
    totalBatches: number;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    successRate: number;
    avgJobDuration: number; // in seconds
  };
  byStatus: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  byEngine: {
    red_pen: { total: number; success: number; failed: number };
    triage: { total: number; success: number; failed: number };
    synthesis: { total: number; success: number; failed: number };
  };
  byDomain: Array<{
    domainId: string;
    domainName: string;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    successRate: number;
  }>;
  recentActivity: Array<{
    date: string;
    jobsCreated: number;
    jobsCompleted: number;
    jobsFailed: number;
  }>;
  qualityDistribution: {
    excellent: number;  // 80-100
    good: number;       // 60-79
    fair: number;       // 40-59
    needsWork: number;  // 0-39
  };
}

export interface TrendData {
  period: string;
  batches: number;
  jobs: number;
  successRate: number;
}

// ============================================================================
// Get Pipeline Analytics
// ============================================================================

export async function getPipelineAnalytics(): Promise<{
  success: boolean;
  stats?: PipelineStats;
  error?: string;
}> {
  try {
    await requireAdmin();

    // Get all batches
    const batchesSnapshot = await adminDb.collection('content_batches').get();
    const batches = batchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as {
      id: string;
      domainId: string;
      domainName: string;
      totalJobs: number;
      completedJobs: number;
      failedJobs: number;
      status: string;
      createdAt: FirebaseFirestore.Timestamp;
    }));

    // Get all jobs
    const jobsSnapshot = await adminDb.collection('content_jobs').get();
    const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as {
      id: string;
      status: string;
      activityEngine: string;
      startedAt?: FirebaseFirestore.Timestamp;
      completedAt?: FirebaseFirestore.Timestamp;
      createdAt?: FirebaseFirestore.Timestamp;
    }));

    // Calculate overview stats
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const failedJobs = jobs.filter(j => j.status === 'failed').length;
    const totalJobs = jobs.length;

    // Calculate average job duration
    const completedJobsWithDuration = jobs.filter(
      j => j.status === 'completed' && j.startedAt && j.completedAt
    );
    const avgDuration = completedJobsWithDuration.length > 0
      ? completedJobsWithDuration.reduce((sum, j) => {
          const start = toDate(j.startedAt as FirestoreTimestampLike);
          const end = toDate(j.completedAt as FirestoreTimestampLike);
          if (start && end) {
            return sum + (end.getTime() - start.getTime()) / 1000;
          }
          return sum;
        }, 0) / completedJobsWithDuration.length
      : 0;

    // Status breakdown
    const byStatus = {
      queued: jobs.filter(j => j.status === 'queued').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: completedJobs,
      failed: failedJobs,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
    };

    // By activity engine
    const byEngine = {
      red_pen: {
        total: jobs.filter(j => j.activityEngine === 'red_pen').length,
        success: jobs.filter(j => j.activityEngine === 'red_pen' && j.status === 'completed').length,
        failed: jobs.filter(j => j.activityEngine === 'red_pen' && j.status === 'failed').length,
      },
      triage: {
        total: jobs.filter(j => j.activityEngine === 'triage').length,
        success: jobs.filter(j => j.activityEngine === 'triage' && j.status === 'completed').length,
        failed: jobs.filter(j => j.activityEngine === 'triage' && j.status === 'failed').length,
      },
      synthesis: {
        total: jobs.filter(j => j.activityEngine === 'synthesis').length,
        success: jobs.filter(j => j.activityEngine === 'synthesis' && j.status === 'completed').length,
        failed: jobs.filter(j => j.activityEngine === 'synthesis' && j.status === 'failed').length,
      },
    };

    // By domain
    const domainMap = new Map<string, {
      domainId: string;
      domainName: string;
      totalJobs: number;
      completedJobs: number;
      failedJobs: number;
    }>();

    for (const batch of batches) {
      const domainId = batch.domainId as string;
      const domainName = (batch.domainName as string) || 'Unknown';

      if (!domainMap.has(domainId)) {
        domainMap.set(domainId, {
          domainId,
          domainName,
          totalJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
        });
      }

      const entry = domainMap.get(domainId);
      if (!entry) continue;
      entry.totalJobs += (batch.totalJobs as number) || 0;
      entry.completedJobs += (batch.completedJobs as number) || 0;
      entry.failedJobs += (batch.failedJobs as number) || 0;
    }

    const byDomain = Array.from(domainMap.values())
      .map(d => ({
        ...d,
        successRate: d.totalJobs > 0 ? Math.round((d.completedJobs / d.totalJobs) * 100) : 0,
      }))
      .sort((a, b) => b.totalJobs - a.totalJobs)
      .slice(0, 10);

    // Recent activity (last 7 days)
    const now = new Date();
    const recentActivity: PipelineStats['recentActivity'] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayJobs = jobs.filter(j => {
        const createdAt = toDate(j.createdAt as FirestoreTimestampLike);
        if (!createdAt) return false;
        return createdAt.toISOString().split('T')[0] === dateStr;
      });

      recentActivity.push({
        date: dateStr,
        jobsCreated: dayJobs.length,
        jobsCompleted: dayJobs.filter(j => j.status === 'completed').length,
        jobsFailed: dayJobs.filter(j => j.status === 'failed').length,
      });
    }

    // Quality distribution (placeholder - would need actual quality scores)
    // For now, estimate based on completion status
    const qualityDistribution = {
      excellent: Math.round(completedJobs * 0.4),
      good: Math.round(completedJobs * 0.35),
      fair: Math.round(completedJobs * 0.20),
      needsWork: Math.round(completedJobs * 0.05),
    };

    return {
      success: true,
      stats: {
        overview: {
          totalBatches: batches.length,
          totalJobs,
          completedJobs,
          failedJobs,
          successRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
          avgJobDuration: Math.round(avgDuration),
        },
        byStatus,
        byEngine,
        byDomain,
        recentActivity,
        qualityDistribution,
      },
    };
  } catch (error) {
    log.error('[getPipelineAnalytics] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics',
    };
  }
}

// ============================================================================
// Get Trend Data
// ============================================================================

export async function getPipelineTrends(days: number = 30): Promise<{
  success: boolean;
  trends?: TrendData[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get batches within the time range
    const batchesSnapshot = await adminDb
      .collection('content_batches')
      .where('createdAt', '>=', cutoffDate)
      .orderBy('createdAt', 'asc')
      .get();

    // Group by week
    const weekMap = new Map<string, TrendData>();

    for (const doc of batchesSnapshot.docs) {
      const data = doc.data();
      const createdAt = toDateFromSerialized(data.createdAt) || data.createdAt;
      if (!createdAt) continue;

      const date = new Date(createdAt);
      // Get week start (Monday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          period: weekKey,
          batches: 0,
          jobs: 0,
          successRate: 0,
        });
      }

      const entry = weekMap.get(weekKey);
      if (!entry) continue;
      entry.batches++;
      entry.jobs += (data.totalJobs as number) || 0;

      const completed = (data.completedJobs as number) || 0;
      const total = (data.totalJobs as number) || 0;
      if (total > 0) {
        // Running average
        entry.successRate = Math.round(
          ((entry.successRate * (entry.batches - 1)) + (completed / total * 100)) / entry.batches
        );
      }
    }

    return {
      success: true,
      trends: Array.from(weekMap.values()),
    };
  } catch (error) {
    log.error('[getPipelineTrends] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trends',
    };
  }
}
