'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { executeWorkflow } from '@/lib/actions/workflow-automation';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('operations/deadline-actions');

// ============================================================================
// Deadline Types
// ============================================================================

export interface ContentDeadline {
  id: string;
  entityType: 'domain' | 'ksb';
  entityId: string;
  entityName: string;
  domainId: string;
  domainName: string;
  assigneeId?: string;
  assigneeName?: string;
  deadline: string; // ISO date
  createdBy: string;
  createdAt: string;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  completedAt?: string;
  notes?: string;
}

export interface DeadlineStats {
  total: number;
  upcoming: number;    // Due in next 7 days
  overdue: number;
  completed: number;
  byAssignee: Record<string, {
    name: string;
    upcoming: number;
    overdue: number;
  }>;
}

// ============================================================================
// Create Deadline
// ============================================================================

export async function createDeadline(params: {
  entityType: 'domain' | 'ksb';
  entityId: string;
  entityName: string;
  domainId: string;
  domainName: string;
  assigneeId?: string;
  assigneeName?: string;
  deadline: string;
  createdBy: string;
  notes?: string;
}): Promise<{
  success: boolean;
  deadlineId?: string;
  error?: string;
}> {
  try {
    await requireAdmin();

    // Check for existing active deadline
    const existingSnapshot = await adminDb
      .collection('content_deadlines')
      .where('entityType', '==', params.entityType)
      .where('entityId', '==', params.entityId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      // Update existing deadline instead of creating new
      const existingDoc = existingSnapshot.docs[0];
      await existingDoc.ref.update({
        deadline: params.deadline,
        assigneeId: params.assigneeId || null,
        assigneeName: params.assigneeName || null,
        notes: params.notes || null,
        updatedAt: adminTimestamp.now(),
        updatedBy: params.createdBy,
      });
      return { success: true, deadlineId: existingDoc.id };
    }

    const docRef = await adminDb.collection('content_deadlines').add({
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      domainId: params.domainId,
      domainName: params.domainName,
      assigneeId: params.assigneeId || null,
      assigneeName: params.assigneeName || null,
      deadline: params.deadline,
      createdBy: params.createdBy,
      createdAt: adminTimestamp.now(),
      status: 'active',
      notes: params.notes || null,
    });

    return { success: true, deadlineId: docRef.id };
  } catch (error) {
    log.error('[createDeadline] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create deadline',
    };
  }
}

// ============================================================================
// Get Deadlines
// ============================================================================

export async function getDeadlines(filters?: {
  assigneeId?: string;
  domainId?: string;
  status?: 'active' | 'completed' | 'overdue';
  upcoming?: boolean; // Due within 7 days
}): Promise<{
  success: boolean;
  deadlines?: ContentDeadline[];
  error?: string;
}> {
  try {
    let query = adminDb.collection('content_deadlines') as FirebaseFirestore.Query;

    if (filters?.assigneeId) {
      query = query.where('assigneeId', '==', filters.assigneeId);
    }
    if (filters?.domainId) {
      query = query.where('domainId', '==', filters.domainId);
    }
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    const snapshot = await query.orderBy('deadline', 'asc').get();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let deadlines: ContentDeadline[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const deadlineDate = new Date(data.deadline);

      // Auto-update status if overdue
      let status = data.status;
      if (status === 'active' && deadlineDate < now) {
        status = 'overdue';
      }

      return {
        id: doc.id,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        domainId: data.domainId,
        domainName: data.domainName,
        assigneeId: data.assigneeId,
        assigneeName: data.assigneeName,
        deadline: data.deadline,
        createdBy: data.createdBy,
        createdAt: toDateFromSerialized(data.createdAt)?.toISOString() || new Date().toISOString(),
        status,
        completedAt: toDateFromSerialized(data.completedAt)?.toISOString(),
        notes: data.notes,
      };
    });

    // Filter for upcoming if requested
    if (filters?.upcoming) {
      deadlines = deadlines.filter((d) => {
        const deadlineDate = new Date(d.deadline);
        return d.status === 'active' && deadlineDate <= sevenDaysFromNow;
      });
    }

    return { success: true, deadlines };
  } catch (error) {
    log.error('[getDeadlines] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deadlines',
    };
  }
}

// ============================================================================
// Get Deadline Stats
// ============================================================================

export async function getDeadlineStats(): Promise<{
  success: boolean;
  stats?: DeadlineStats;
  error?: string;
}> {
  try {
    const snapshot = await adminDb.collection('content_deadlines').get();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats: DeadlineStats = {
      total: 0,
      upcoming: 0,
      overdue: 0,
      completed: 0,
      byAssignee: {},
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const deadlineDate = new Date(data.deadline);
      const isActive = data.status === 'active';
      const isOverdue = isActive && deadlineDate < now;
      const isUpcoming = isActive && !isOverdue && deadlineDate <= sevenDaysFromNow;

      stats.total++;

      if (data.status === 'completed') {
        stats.completed++;
      } else if (isOverdue) {
        stats.overdue++;
      } else if (isUpcoming) {
        stats.upcoming++;
      }

      // Track by assignee
      if (data.assigneeId) {
        if (!stats.byAssignee[data.assigneeId]) {
          stats.byAssignee[data.assigneeId] = {
            name: data.assigneeName || 'Unknown',
            upcoming: 0,
            overdue: 0,
          };
        }
        if (isOverdue) {
          stats.byAssignee[data.assigneeId].overdue++;
        } else if (isUpcoming) {
          stats.byAssignee[data.assigneeId].upcoming++;
        }
      }
    });

    return { success: true, stats };
  } catch (error) {
    log.error('[getDeadlineStats] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deadline stats',
    };
  }
}

// ============================================================================
// Update Deadline
// ============================================================================

export async function updateDeadline(
  deadlineId: string,
  updates: {
    deadline?: string;
    assigneeId?: string;
    assigneeName?: string;
    status?: 'active' | 'completed' | 'cancelled';
    notes?: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    const updateData: Record<string, unknown> = {
      updatedAt: adminTimestamp.now(),
    };

    if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
    if (updates.assigneeId !== undefined) updateData.assigneeId = updates.assigneeId;
    if (updates.assigneeName !== undefined) updateData.assigneeName = updates.assigneeName;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === 'completed') {
        updateData.completedAt = adminTimestamp.now();
      }
    }

    await adminDb.collection('content_deadlines').doc(deadlineId).update(updateData);

    return { success: true };
  } catch (error) {
    log.error('[updateDeadline] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update deadline',
    };
  }
}

// ============================================================================
// Delete Deadline
// ============================================================================

export async function deleteDeadline(deadlineId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await adminDb.collection('content_deadlines').doc(deadlineId).delete();

    return { success: true };
  } catch (error) {
    log.error('[deleteDeadline] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete deadline',
    };
  }
}

// ============================================================================
// Check and Process Deadlines (Cron Job)
// ============================================================================

export async function processDeadlineAlerts(): Promise<{
  success: boolean;
  processed: number;
  error?: string;
}> {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Get all active deadlines
    const snapshot = await adminDb
      .collection('content_deadlines')
      .where('status', '==', 'active')
      .get();

    let processed = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const deadlineDate = new Date(data.deadline);
      const lastAlertSent = toDateFromSerialized(data.lastAlertSent) || null;
      const hoursSinceLastAlert = lastAlertSent
        ? (now.getTime() - lastAlertSent.getTime()) / (1000 * 60 * 60)
        : Infinity;

      // Skip if we sent an alert in the last 12 hours
      if (hoursSinceLastAlert < 12) continue;

      // Check if deadline has passed
      if (deadlineDate < now) {
        await executeWorkflow('deadline_passed', {
          domainId: data.domainId,
          domainName: data.domainName,
          entityType: data.entityType,
          entityId: data.entityId,
          entityName: data.entityName,
          assigneeId: data.assigneeId,
          daysOverdue: Math.floor((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24)),
        });

        // Update status to overdue
        await doc.ref.update({
          status: 'overdue',
          lastAlertSent: adminTimestamp.now(),
        });

        processed++;
      }
      // Check if deadline is within 1 day
      else if (deadlineDate <= oneDayFromNow) {
        await executeWorkflow('deadline_approaching', {
          domainId: data.domainId,
          domainName: data.domainName,
          entityType: data.entityType,
          entityId: data.entityId,
          entityName: data.entityName,
          assigneeId: data.assigneeId,
          daysRemaining: 1,
          message: `Urgent: ${data.entityName} is due tomorrow!`,
        });

        await doc.ref.update({ lastAlertSent: adminTimestamp.now() });
        processed++;
      }
      // Check if deadline is within 3 days
      else if (deadlineDate <= threeDaysFromNow) {
        await executeWorkflow('deadline_approaching', {
          domainId: data.domainId,
          domainName: data.domainName,
          entityType: data.entityType,
          entityId: data.entityId,
          entityName: data.entityName,
          assigneeId: data.assigneeId,
          daysRemaining: Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          message: `Reminder: ${data.entityName} is due in ${Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days.`,
        });

        await doc.ref.update({ lastAlertSent: adminTimestamp.now() });
        processed++;
      }
    }

    return { success: true, processed };
  } catch (error) {
    log.error('[processDeadlineAlerts] Error:', error);
    return {
      success: false,
      processed: 0,
      error: error instanceof Error ? error.message : 'Failed to process deadline alerts',
    };
  }
}

// ============================================================================
// Bulk Set Deadlines for Domain
// ============================================================================

export async function setDomainDeadline(params: {
  domainId: string;
  domainName: string;
  deadline: string;
  assigneeId?: string;
  assigneeName?: string;
  createdBy: string;
  notes?: string;
}): Promise<{
  success: boolean;
  deadlineId?: string;
  error?: string;
}> {
  return createDeadline({
    entityType: 'domain',
    entityId: params.domainId,
    entityName: params.domainName,
    domainId: params.domainId,
    domainName: params.domainName,
    assigneeId: params.assigneeId,
    assigneeName: params.assigneeName,
    deadline: params.deadline,
    createdBy: params.createdBy,
    notes: params.notes,
  });
}

// ============================================================================
// Get My Deadlines
// ============================================================================

export async function getMyDeadlines(userId: string): Promise<{
  success: boolean;
  deadlines?: ContentDeadline[];
  stats?: { upcoming: number; overdue: number };
  error?: string;
}> {
  try {
    const result = await getDeadlines({ assigneeId: userId, status: 'active' });

    if (!result.success) {
      return result;
    }

    const deadlines = result.deadlines || [];
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats = {
      upcoming: 0,
      overdue: 0,
    };

    deadlines.forEach((d) => {
      const deadlineDate = new Date(d.deadline);
      if (deadlineDate < now) {
        stats.overdue++;
      } else if (deadlineDate <= sevenDaysFromNow) {
        stats.upcoming++;
      }
    });

    return { success: true, deadlines, stats };
  } catch (error) {
    log.error('[getMyDeadlines] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deadlines',
    };
  }
}
