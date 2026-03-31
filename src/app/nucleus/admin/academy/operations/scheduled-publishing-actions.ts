'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { createOperationalNotification } from './notifications-actions';
import { triggerContentPublished } from '@/lib/actions/workflow-automation';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('operations/scheduled-publishing-actions');

// ============================================================================
// Scheduled Publishing Types
// ============================================================================

export interface ScheduledPublish {
  id: string;
  entityType: 'ksb' | 'domain_batch';
  items: ScheduledItem[];
  scheduledFor: string; // ISO date-time
  scheduledBy: string;
  scheduledByName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  processedAt?: string;
  successCount?: number;
  failedCount?: number;
  error?: string;
  notes?: string;
}

export interface ScheduledItem {
  domainId: string;
  domainName: string;
  ksbId: string;
  ksbName: string;
  status: 'pending' | 'published' | 'failed';
  error?: string;
}

export interface ScheduledPublishStats {
  pending: number;
  completedToday: number;
  scheduledThisWeek: number;
  failedRecently: number;
}

// ============================================================================
// Create Scheduled Publish
// ============================================================================

export async function createScheduledPublish(params: {
  items: Array<{
    domainId: string;
    domainName: string;
    ksbId: string;
    ksbName: string;
  }>;
  scheduledFor: string;
  scheduledBy: string;
  scheduledByName: string;
  notes?: string;
}): Promise<{
  success: boolean;
  scheduleId?: string;
  error?: string;
}> {
  try {
    await requireAdmin();

    const scheduledItems: ScheduledItem[] = params.items.map((item) => ({
      ...item,
      status: 'pending' as const,
    }));

    const docRef = await adminDb.collection('scheduled_publishes').add({
      entityType: params.items.length > 1 ? 'domain_batch' : 'ksb',
      items: scheduledItems,
      scheduledFor: params.scheduledFor,
      scheduledBy: params.scheduledBy,
      scheduledByName: params.scheduledByName,
      status: 'pending',
      createdAt: adminTimestamp.now(),
      notes: params.notes || null,
    });

    return { success: true, scheduleId: docRef.id };
  } catch (error) {
    log.error('[createScheduledPublish] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create scheduled publish',
    };
  }
}

// ============================================================================
// Get Scheduled Publishes
// ============================================================================

export async function getScheduledPublishes(filters?: {
  status?: 'pending' | 'completed' | 'failed';
  upcoming?: boolean;
}): Promise<{
  success: boolean;
  schedules?: ScheduledPublish[];
  error?: string;
}> {
  try {
    let query = adminDb.collection('scheduled_publishes') as FirebaseFirestore.Query;

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    query = query.orderBy('scheduledFor', 'asc');

    const snapshot = await query.limit(50).get();

    const now = new Date();
    let schedules: ScheduledPublish[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        entityType: data.entityType,
        items: data.items || [],
        scheduledFor: data.scheduledFor,
        scheduledBy: data.scheduledBy,
        scheduledByName: data.scheduledByName,
        status: data.status,
        createdAt: toDateFromSerialized(data.createdAt)?.toISOString() || new Date().toISOString(),
        processedAt: toDateFromSerialized(data.processedAt)?.toISOString(),
        successCount: data.successCount,
        failedCount: data.failedCount,
        error: data.error,
        notes: data.notes,
      };
    });

    // Filter for upcoming if requested
    if (filters?.upcoming) {
      schedules = schedules.filter((s) => {
        const scheduledDate = new Date(s.scheduledFor);
        return s.status === 'pending' && scheduledDate > now;
      });
    }

    return { success: true, schedules };
  } catch (error) {
    log.error('[getScheduledPublishes] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch scheduled publishes',
    };
  }
}

// ============================================================================
// Get Scheduled Publish Stats
// ============================================================================

export async function getScheduledPublishStats(): Promise<{
  success: boolean;
  stats?: ScheduledPublishStats;
  error?: string;
}> {
  try {
    const snapshot = await adminDb.collection('scheduled_publishes').get();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const stats: ScheduledPublishStats = {
      pending: 0,
      completedToday: 0,
      scheduledThisWeek: 0,
      failedRecently: 0,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const scheduledDate = new Date(data.scheduledFor);
      const processedDate = toDateFromSerialized(data.processedAt);

      if (data.status === 'pending') {
        stats.pending++;
        if (scheduledDate <= endOfWeek) {
          stats.scheduledThisWeek++;
        }
      }

      if (data.status === 'completed' && processedDate && processedDate >= startOfDay) {
        stats.completedToday++;
      }

      if (data.status === 'failed' && processedDate && processedDate >= twoDaysAgo) {
        stats.failedRecently++;
      }
    });

    return { success: true, stats };
  } catch (error) {
    log.error('[getScheduledPublishStats] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch scheduled publish stats',
    };
  }
}

// ============================================================================
// Cancel Scheduled Publish
// ============================================================================

export async function cancelScheduledPublish(scheduleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await adminDb.collection('scheduled_publishes').doc(scheduleId).update({
      status: 'cancelled',
      cancelledAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('[cancelScheduledPublish] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel scheduled publish',
    };
  }
}

// ============================================================================
// Process Scheduled Publishes (Cron Job)
// ============================================================================

export async function processScheduledPublishes(): Promise<{
  success: boolean;
  processed: number;
  error?: string;
}> {
  try {
    const now = new Date();

    // Get all pending schedules that are due
    const snapshot = await adminDb
      .collection('scheduled_publishes')
      .where('status', '==', 'pending')
      .where('scheduledFor', '<=', now.toISOString())
      .get();

    let processed = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const items = data.items as ScheduledItem[];

      let successCount = 0;
      let failedCount = 0;
      const updatedItems: ScheduledItem[] = [];

      // Update status to processing
      await doc.ref.update({ status: 'processing' });

      // Process each item
      for (const item of items) {
        try {
          // Update KSB status to published
          await adminDb
            .collection('pv_domains')
            .doc(item.domainId)
            .collection('capability_components')
            .doc(item.ksbId)
            .update({
              'alo_content.status': 'published',
              'alo_content.publishedAt': adminTimestamp.now(),
              'alo_content.publishedBy': data.scheduledBy,
              'alo_content.publishNotes': `Scheduled publish by ${data.scheduledByName}`,
            });

          // Trigger workflow
          await triggerContentPublished({
            domainId: item.domainId,
            domainName: item.domainName,
            ksbId: item.ksbId,
            ksbName: item.ksbName,
            publishedBy: data.scheduledByName,
          });

          updatedItems.push({ ...item, status: 'published' });
          successCount++;
        } catch (itemError) {
          log.error(`[processScheduledPublishes] Failed to publish ${item.ksbId}:`, itemError);
          updatedItems.push({
            ...item,
            status: 'failed',
            error: itemError instanceof Error ? itemError.message : 'Unknown error',
          });
          failedCount++;
        }
      }

      // Update schedule with results
      await doc.ref.update({
        status: failedCount === items.length ? 'failed' : 'completed',
        items: updatedItems,
        processedAt: adminTimestamp.now(),
        successCount,
        failedCount,
      });

      // Notify scheduler
      await createOperationalNotification({
        type: failedCount === 0 ? 'content_published' : 'batch_failed',
        userId: data.scheduledBy,
        title: failedCount === 0 ? 'Scheduled Publish Complete' : 'Scheduled Publish Had Failures',
        message: `Published ${successCount} of ${items.length} items.${failedCount > 0 ? ` ${failedCount} failed.` : ''}`,
        metadata: {
          actionUrl: '/nucleus/admin/academy/operations',
        },
      });

      processed++;
    }

    return { success: true, processed };
  } catch (error) {
    log.error('[processScheduledPublishes] Error:', error);
    return {
      success: false,
      processed: 0,
      error: error instanceof Error ? error.message : 'Failed to process scheduled publishes',
    };
  }
}

// ============================================================================
// Quick Schedule (Schedule for specific time today/tomorrow)
// ============================================================================

export async function quickSchedulePublish(params: {
  items: Array<{
    domainId: string;
    domainName: string;
    ksbId: string;
    ksbName: string;
  }>;
  when: 'in_1_hour' | 'end_of_day' | 'tomorrow_morning' | 'next_week';
  scheduledBy: string;
  scheduledByName: string;
}): Promise<{
  success: boolean;
  scheduleId?: string;
  scheduledFor?: string;
  error?: string;
}> {
  const now = new Date();
  let scheduledFor: Date;

  switch (params.when) {
    case 'in_1_hour':
      scheduledFor = new Date(now.getTime() + 60 * 60 * 1000);
      break;
    case 'end_of_day':
      scheduledFor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
      if (scheduledFor <= now) {
        scheduledFor = new Date(scheduledFor.getTime() + 24 * 60 * 60 * 1000);
      }
      break;
    case 'tomorrow_morning':
      scheduledFor = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
      break;
    case 'next_week':
      scheduledFor = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 9, 0, 0);
      break;
    default:
      scheduledFor = new Date(now.getTime() + 60 * 60 * 1000);
  }

  const result = await createScheduledPublish({
    items: params.items,
    scheduledFor: scheduledFor.toISOString(),
    scheduledBy: params.scheduledBy,
    scheduledByName: params.scheduledByName,
    notes: `Quick scheduled: ${params.when.replace(/_/g, ' ')}`,
  });

  return {
    ...result,
    scheduledFor: scheduledFor.toISOString(),
  };
}
