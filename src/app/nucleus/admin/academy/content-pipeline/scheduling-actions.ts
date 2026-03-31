'use server';


import { logger } from '@/lib/logger';
const log = logger.scope('content-pipeline/scheduling-actions');
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import type { ActivityEngine, JobPriority } from '@/lib/content-orchestrator';
import { toDateFromSerialized } from '@/types/academy';

// ============================================================================
// Scheduled Batch Types
// ============================================================================

export type ScheduleStatus = 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface ScheduledBatch {
  id: string;
  name: string;
  description?: string;
  domainId: string;
  domainName: string;
  ksbIds: string[];
  activityEngine: ActivityEngine;
  priority: JobPriority;

  // Schedule configuration
  scheduledFor: Date;
  recurrence: RecurrenceType;
  nextRunAt?: Date;
  lastRunAt?: Date;
  runCount: number;

  // Options
  bypassQualityGates: boolean;
  notifyOnComplete: boolean;

  // Metadata
  status: ScheduleStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Execution tracking
  executedBatchId?: string;
  errorMessage?: string;
}

export interface ScheduledBatchListItem {
  id: string;
  name: string;
  domainName: string;
  activityEngine: ActivityEngine;
  scheduledFor: string;
  recurrence: RecurrenceType;
  status: ScheduleStatus;
  ksbCount: number;
  runCount: number;
  createdAt: string;
}

// ============================================================================
// Create Scheduled Batch
// ============================================================================

export async function createScheduledBatch(params: {
  name: string;
  description?: string;
  domainId: string;
  domainName: string;
  ksbIds: string[];
  activityEngine: ActivityEngine;
  priority?: JobPriority;
  scheduledFor: string; // ISO date string
  recurrence?: RecurrenceType;
  bypassQualityGates?: boolean;
  notifyOnComplete?: boolean;
}): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
  try {
    const user = await requireAdmin();

    const scheduledFor = new Date(params.scheduledFor);
    if (scheduledFor <= new Date()) {
      return { success: false, error: 'Scheduled time must be in the future' };
    }

    if (params.ksbIds.length === 0) {
      return { success: false, error: 'At least one KSB must be selected' };
    }

    const scheduleData = {
      name: params.name,
      description: params.description || null,
      domainId: params.domainId,
      domainName: params.domainName,
      ksbIds: params.ksbIds,
      activityEngine: params.activityEngine,
      priority: params.priority || 'normal',
      scheduledFor: adminTimestamp.fromDate(scheduledFor),
      recurrence: params.recurrence || 'none',
      nextRunAt: adminTimestamp.fromDate(scheduledFor),
      lastRunAt: null,
      runCount: 0,
      bypassQualityGates: params.bypassQualityGates || false,
      notifyOnComplete: params.notifyOnComplete ?? true,
      status: 'scheduled' as ScheduleStatus,
      createdBy: user.uid,
      createdAt: adminTimestamp.now(),
      updatedAt: adminTimestamp.now(),
      executedBatchId: null,
      errorMessage: null,
    };

    const docRef = await adminDb.collection('scheduled_batches').add(scheduleData);

    log.debug(`[createScheduledBatch] Created schedule ${docRef.id} for ${scheduledFor.toISOString()}`);

    return { success: true, scheduleId: docRef.id };
  } catch (error) {
    log.error('[createScheduledBatch] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create scheduled batch',
    };
  }
}

// ============================================================================
// List Scheduled Batches
// ============================================================================

export async function listScheduledBatches(options?: {
  status?: ScheduleStatus;
  domainId?: string;
  limit?: number;
}): Promise<{ success: boolean; schedules?: ScheduledBatchListItem[]; error?: string }> {
  try {
    await requireAdmin();

    let query: FirebaseFirestore.Query = adminDb.collection('scheduled_batches');

    if (options?.status) {
      query = query.where('status', '==', options.status);
    }

    if (options?.domainId) {
      query = query.where('domainId', '==', options.domainId);
    }

    query = query.orderBy('scheduledFor', 'asc').limit(options?.limit || 50);

    const snapshot = await query.get();

    const schedules: ScheduledBatchListItem[] = snapshot.docs.map(doc => {
      const data = doc.data();
      const scheduledFor = toDateFromSerialized(data.scheduledFor) || data.scheduledFor;
      const createdAt = toDateFromSerialized(data.createdAt) || data.createdAt;

      return {
        id: doc.id,
        name: data.name,
        domainName: data.domainName,
        activityEngine: data.activityEngine,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : '',
        recurrence: data.recurrence || 'none',
        status: data.status,
        ksbCount: data.ksbIds?.length || 0,
        runCount: data.runCount || 0,
        createdAt: createdAt ? new Date(createdAt).toISOString() : '',
      };
    });

    return { success: true, schedules };
  } catch (error) {
    log.error('[listScheduledBatches] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list scheduled batches',
    };
  }
}

// ============================================================================
// Cancel Scheduled Batch
// ============================================================================

export async function cancelScheduledBatch(
  scheduleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const docRef = adminDb.collection('scheduled_batches').doc(scheduleId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Scheduled batch not found' };
    }

    const data = doc.data();
    if (data?.status !== 'scheduled') {
      return { success: false, error: 'Can only cancel scheduled batches' };
    }

    await docRef.update({
      status: 'cancelled',
      updatedAt: adminTimestamp.now(),
    });

    log.debug(`[cancelScheduledBatch] Cancelled schedule ${scheduleId}`);

    return { success: true };
  } catch (error) {
    log.error('[cancelScheduledBatch] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel scheduled batch',
    };
  }
}

// ============================================================================
// Get Scheduled Batch Details
// ============================================================================

export async function getScheduledBatch(
  scheduleId: string
): Promise<{ success: boolean; schedule?: ScheduledBatch; error?: string }> {
  try {
    await requireAdmin();

    const doc = await adminDb.collection('scheduled_batches').doc(scheduleId).get();

    if (!doc.exists) {
      return { success: false, error: 'Scheduled batch not found' };
    }

    const data = doc.data();
    if (!data) return { success: false, error: 'Scheduled batch data is empty' };
    const scheduledFor = toDateFromSerialized(data.scheduledFor) || data.scheduledFor;
    const nextRunAt = toDateFromSerialized(data.nextRunAt) || data.nextRunAt;
    const lastRunAt = toDateFromSerialized(data.lastRunAt) || data.lastRunAt;
    const createdAt = toDateFromSerialized(data.createdAt) || data.createdAt;
    const updatedAt = toDateFromSerialized(data.updatedAt) || data.updatedAt;

    const schedule: ScheduledBatch = {
      id: doc.id,
      name: data.name,
      description: data.description,
      domainId: data.domainId,
      domainName: data.domainName,
      ksbIds: data.ksbIds || [],
      activityEngine: data.activityEngine,
      priority: data.priority || 'normal',
      scheduledFor: new Date(scheduledFor),
      recurrence: data.recurrence || 'none',
      nextRunAt: nextRunAt ? new Date(nextRunAt) : undefined,
      lastRunAt: lastRunAt ? new Date(lastRunAt) : undefined,
      runCount: data.runCount || 0,
      bypassQualityGates: data.bypassQualityGates || false,
      notifyOnComplete: data.notifyOnComplete ?? true,
      status: data.status,
      createdBy: data.createdBy,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
      executedBatchId: data.executedBatchId,
      errorMessage: data.errorMessage,
    };

    return { success: true, schedule };
  } catch (error) {
    log.error('[getScheduledBatch] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get scheduled batch',
    };
  }
}

// ============================================================================
// Process Due Scheduled Batches
// ============================================================================

export async function processDueScheduledBatches(): Promise<{
  success: boolean;
  processed: number;
  errors: string[];
}> {
  try {
    await requireAdmin();

    const now = new Date();

    // Find all scheduled batches that are due
    const snapshot = await adminDb
      .collection('scheduled_batches')
      .where('status', '==', 'scheduled')
      .where('nextRunAt', '<=', adminTimestamp.fromDate(now))
      .limit(10)
      .get();

    if (snapshot.empty) {
      return { success: true, processed: 0, errors: [] };
    }

    const errors: string[] = [];
    let processed = 0;

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const scheduleId = doc.id;

        // Mark as processing
        await doc.ref.update({
          status: 'processing',
          updatedAt: adminTimestamp.now(),
        });

        // Import and call batch creation
        const { createContentBatch, processBatch } = await import('@/lib/content-orchestrator');

        // Create the actual batch
        const batchResult = await createContentBatch(
          data.domainId,
          data.ksbIds,
          data.activityEngine,
          data.createdBy,
          {
            name: `[Scheduled] ${data.name}`,
            description: `Auto-generated from schedule ${scheduleId}`,
            priority: data.priority,
            config: {
              bypassQualityGates: data.bypassQualityGates,
            },
          }
        );

        if (!batchResult.success || !batchResult.batchId) {
          throw new Error(batchResult.error || 'Failed to create batch');
        }

        // Start processing the batch
        await processBatch(batchResult.batchId, data.createdBy);

        // Calculate next run time for recurring schedules
        let nextStatus: ScheduleStatus = 'completed';
        let nextRunAt = null;

        if (data.recurrence && data.recurrence !== 'none') {
          nextStatus = 'scheduled';
          const scheduledDate = new Date(toDateFromSerialized(data.scheduledFor) || data.scheduledFor);

          switch (data.recurrence) {
            case 'daily':
              scheduledDate.setDate(scheduledDate.getDate() + 1);
              break;
            case 'weekly':
              scheduledDate.setDate(scheduledDate.getDate() + 7);
              break;
            case 'monthly':
              scheduledDate.setMonth(scheduledDate.getMonth() + 1);
              break;
          }

          nextRunAt = adminTimestamp.fromDate(scheduledDate);
        }

        // Update schedule with results
        await doc.ref.update({
          status: nextStatus,
          lastRunAt: adminTimestamp.now(),
          nextRunAt: nextRunAt,
          runCount: (data.runCount || 0) + 1,
          executedBatchId: batchResult.batchId,
          errorMessage: null,
          updatedAt: adminTimestamp.now(),
        });

        processed++;
        log.debug(`[processDueScheduledBatches] Processed schedule ${scheduleId}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Schedule ${doc.id}: ${errorMsg}`);

        // Mark as failed
        await doc.ref.update({
          status: 'failed',
          errorMessage: errorMsg,
          updatedAt: adminTimestamp.now(),
        });
      }
    }

    return { success: true, processed, errors };
  } catch (error) {
    log.error('[processDueScheduledBatches] Error:', error);
    return {
      success: false,
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Failed to process scheduled batches'],
    };
  }
}

// ============================================================================
// Update Scheduled Batch
// ============================================================================

export async function updateScheduledBatch(
  scheduleId: string,
  updates: {
    name?: string;
    description?: string;
    scheduledFor?: string;
    recurrence?: RecurrenceType;
    priority?: JobPriority;
    bypassQualityGates?: boolean;
    notifyOnComplete?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const docRef = adminDb.collection('scheduled_batches').doc(scheduleId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Scheduled batch not found' };
    }

    const data = doc.data();
    if (data?.status !== 'scheduled') {
      return { success: false, error: 'Can only update scheduled batches' };
    }

    const updateData: Record<string, unknown> = {
      updatedAt: adminTimestamp.now(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.bypassQualityGates !== undefined) updateData.bypassQualityGates = updates.bypassQualityGates;
    if (updates.notifyOnComplete !== undefined) updateData.notifyOnComplete = updates.notifyOnComplete;
    if (updates.recurrence !== undefined) updateData.recurrence = updates.recurrence;

    if (updates.scheduledFor) {
      const scheduledFor = new Date(updates.scheduledFor);
      if (scheduledFor <= new Date()) {
        return { success: false, error: 'Scheduled time must be in the future' };
      }
      updateData.scheduledFor = adminTimestamp.fromDate(scheduledFor);
      updateData.nextRunAt = adminTimestamp.fromDate(scheduledFor);
    }

    await docRef.update(updateData);

    return { success: true };
  } catch (error) {
    log.error('[updateScheduledBatch] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update scheduled batch',
    };
  }
}

// ============================================================================
// Get Schedule Statistics
// ============================================================================

export async function getScheduleStats(): Promise<{
  success: boolean;
  stats?: {
    total: number;
    scheduled: number;
    completed: number;
    failed: number;
    cancelled: number;
    nextDue?: string;
  };
  error?: string;
}> {
  try {
    await requireAdmin();

    const snapshot = await adminDb.collection('scheduled_batches').get();

    const stats = {
      total: snapshot.size,
      scheduled: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      nextDue: undefined as string | undefined,
    };

    let nextDueDate: Date | null = null;

    snapshot.docs.forEach(doc => {
      const data = doc.data();

      switch (data.status) {
        case 'scheduled': {
          stats.scheduled++;
          const nextRun = toDateFromSerialized(data.nextRunAt) || data.nextRunAt;
          if (nextRun) {
            const runDate = new Date(nextRun);
            if (!nextDueDate || runDate < nextDueDate) {
              nextDueDate = runDate;
            }
          }
          break;
        }
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
    });

    if (nextDueDate !== null) {
      stats.nextDue = (nextDueDate as Date).toISOString();
    }

    return { success: true, stats };
  } catch (error) {
    log.error('[getScheduleStats] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get schedule stats',
    };
  }
}
