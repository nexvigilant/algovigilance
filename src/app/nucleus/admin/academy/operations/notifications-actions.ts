'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('operations/notifications-actions');

// ============================================================================
// Operational Notification Types
// ============================================================================

export type OperationalNotificationType =
  | 'assignment_new'        // New domain/KSB assigned
  | 'assignment_reassigned' // Work reassigned to someone else
  | 'review_needed'         // Content ready for review
  | 'content_published'     // Content was published
  | 'batch_complete'        // Batch generation completed
  | 'batch_failed'          // Batch generation failed
  | 'milestone_reached'     // Domain reached completion milestone
  | 'deadline_approaching'; // Deadline warning

export interface OperationalNotification {
  id: string;
  type: OperationalNotificationType;
  userId: string;
  title: string;
  message: string;
  metadata: {
    domainId?: string;
    domainName?: string;
    ksbId?: string;
    ksbName?: string;
    batchId?: string;
    milestone?: number;
    actionUrl?: string;
  };
  read: boolean;
  createdAt: string;
}

// ============================================================================
// Create Notification
// ============================================================================

export async function createOperationalNotification(params: {
  type: OperationalNotificationType;
  userId: string;
  title: string;
  message: string;
  metadata?: OperationalNotification['metadata'];
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const docRef = await adminDb.collection('operational_notifications').add({
      type: params.type,
      userId: params.userId,
      title: params.title,
      message: params.message,
      metadata: params.metadata || {},
      read: false,
      createdAt: adminTimestamp.now(),
    });

    return { success: true, notificationId: docRef.id };
  } catch (error) {
    log.error('[createOperationalNotification] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create notification',
    };
  }
}

// ============================================================================
// Get User Notifications
// ============================================================================

export async function getUserOperationalNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<{
  success: boolean;
  notifications?: OperationalNotification[];
  unreadCount?: number;
  error?: string;
}> {
  try {
    let query = adminDb
      .collection('operational_notifications')
      .where('userId', '==', userId) as FirebaseFirestore.Query;

    if (options?.unreadOnly) {
      query = query.where('read', '==', false);
    }

    query = query.orderBy('createdAt', 'desc').limit(options?.limit || 50);

    const snapshot = await query.get();

    const notifications: OperationalNotification[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        userId: data.userId,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        read: data.read,
        createdAt: toDateFromSerialized(data.createdAt)?.toISOString() || new Date().toISOString(),
      };
    });

    // Get unread count
    const unreadSnapshot = await adminDb
      .collection('operational_notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .count()
      .get();

    return {
      success: true,
      notifications,
      unreadCount: unreadSnapshot.data().count,
    };
  } catch (error) {
    log.error('[getUserOperationalNotifications] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch notifications',
    };
  }
}

// ============================================================================
// Mark Notification as Read
// ============================================================================

export async function markNotificationRead(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await adminDb.collection('operational_notifications').doc(notificationId).update({
      read: true,
      readAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('[markNotificationRead] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark notification read',
    };
  }
}

// ============================================================================
// Mark All Notifications as Read
// ============================================================================

export async function markAllNotificationsRead(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const snapshot = await adminDb
      .collection('operational_notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    if (snapshot.empty) {
      return { success: true };
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true, readAt: adminTimestamp.now() });
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    log.error('[markAllNotificationsRead] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark notifications read',
    };
  }
}

// ============================================================================
// Notification Triggers (Called from other actions)
// ============================================================================

/**
 * Notify user when assigned a new domain
 */
export async function notifyDomainAssignment(params: {
  assigneeId: string;
  assigneeName: string;
  domainId: string;
  domainName: string;
  assignedBy: string;
}): Promise<void> {
  await createOperationalNotification({
    type: 'assignment_new',
    userId: params.assigneeId,
    title: 'New Domain Assigned',
    message: `You have been assigned to work on ${params.domainName}.`,
    metadata: {
      domainId: params.domainId,
      domainName: params.domainName,
      actionUrl: `/nucleus/admin/academy/my-work`,
    },
  });
}

/**
 * Notify user when content is ready for review
 */
export async function notifyReviewNeeded(params: {
  userId: string;
  domainId: string;
  domainName: string;
  ksbId: string;
  ksbName: string;
}): Promise<void> {
  await createOperationalNotification({
    type: 'review_needed',
    userId: params.userId,
    title: 'Content Ready for Review',
    message: `AI-generated content for "${params.ksbName}" is ready for your review.`,
    metadata: {
      domainId: params.domainId,
      domainName: params.domainName,
      ksbId: params.ksbId,
      ksbName: params.ksbName,
      actionUrl: `/nucleus/admin/academy/ksb-builder?domain=${params.domainId}&ksb=${params.ksbId}`,
    },
  });
}

/**
 * Notify user when batch generation completes
 */
export async function notifyBatchComplete(params: {
  userId: string;
  batchId: string;
  successCount: number;
  failedCount: number;
}): Promise<void> {
  const status = params.failedCount === 0 ? 'successfully' : `with ${params.failedCount} failures`;

  await createOperationalNotification({
    type: params.failedCount === 0 ? 'batch_complete' : 'batch_failed',
    userId: params.userId,
    title: `Batch Generation ${params.failedCount === 0 ? 'Complete' : 'Finished'}`,
    message: `Batch processed ${params.successCount} items ${status}.`,
    metadata: {
      batchId: params.batchId,
      actionUrl: `/nucleus/admin/academy/content-pipeline`,
    },
  });
}

/**
 * Notify user when a domain reaches a milestone
 */
export async function notifyMilestoneReached(params: {
  userId: string;
  domainId: string;
  domainName: string;
  milestone: number; // e.g., 25, 50, 75, 100
}): Promise<void> {
  const message = params.milestone === 100
    ? `Congratulations! ${params.domainName} is 100% complete!`
    : `${params.domainName} has reached ${params.milestone}% completion.`;

  await createOperationalNotification({
    type: 'milestone_reached',
    userId: params.userId,
    title: `${params.milestone}% Milestone Reached`,
    message,
    metadata: {
      domainId: params.domainId,
      domainName: params.domainName,
      milestone: params.milestone,
      actionUrl: `/nucleus/admin/academy/my-work`,
    },
  });
}

// ============================================================================
// Delete Old Notifications (Cleanup)
// ============================================================================

export async function deleteOldNotifications(daysOld: number = 30): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    await requireAdmin();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const snapshot = await adminDb
      .collection('operational_notifications')
      .where('createdAt', '<', cutoffDate)
      .where('read', '==', true)
      .get();

    if (snapshot.empty) {
      return { success: true, deletedCount: 0 };
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true, deletedCount: snapshot.size };
  } catch (error) {
    log.error('[deleteOldNotifications] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete old notifications',
    };
  }
}
