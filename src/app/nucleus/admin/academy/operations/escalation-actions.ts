'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { createOperationalNotification } from './notifications-actions';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('operations/escalation-actions');

// ============================================================================
// Escalation Types
// ============================================================================

export type EscalationLevel = 'L1' | 'L2' | 'L3';

export type EscalationReason =
  | 'deadline_passed'
  | 'stale_content'
  | 'review_timeout'
  | 'quality_issue'
  | 'manual';

export interface Escalation {
  id: string;
  entityType: 'ksb' | 'domain';
  entityId: string;
  entityName: string;
  domainId: string;
  domainName: string;
  reason: EscalationReason;
  level: EscalationLevel;
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  originalAssigneeId?: string;
  originalAssigneeName?: string;
  escalatedToId: string;
  escalatedToName: string;
  escalatedBy: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  notes?: string;
  daysOverdue?: number;
}

export interface EscalationStats {
  open: number;
  acknowledged: number;
  byLevel: {
    L1: number;
    L2: number;
    L3: number;
  };
  byReason: Record<EscalationReason, number>;
  avgResolutionTime: number; // hours
}

export interface EscalationConfig {
  id: string;
  level: EscalationLevel;
  triggerAfterDays: number;
  notifyUserIds: string[];
  autoEscalateAfterDays: number; // 0 = no auto-escalation
  enabled: boolean;
}

// ============================================================================
// Default Escalation Configuration
// ============================================================================

const DEFAULT_ESCALATION_CONFIG: Omit<EscalationConfig, 'id'>[] = [
  {
    level: 'L1',
    triggerAfterDays: 3,
    notifyUserIds: [], // Assignee's manager
    autoEscalateAfterDays: 5,
    enabled: true,
  },
  {
    level: 'L2',
    triggerAfterDays: 7,
    notifyUserIds: [], // All moderators
    autoEscalateAfterDays: 10,
    enabled: true,
  },
  {
    level: 'L3',
    triggerAfterDays: 14,
    notifyUserIds: [], // All admins
    autoEscalateAfterDays: 0, // Final level
    enabled: true,
  },
];

// ============================================================================
// Create Escalation
// ============================================================================

export async function createEscalation(params: {
  entityType: 'ksb' | 'domain';
  entityId: string;
  entityName: string;
  domainId: string;
  domainName: string;
  reason: EscalationReason;
  level: EscalationLevel;
  originalAssigneeId?: string;
  originalAssigneeName?: string;
  escalatedToId: string;
  escalatedToName: string;
  escalatedBy: string;
  notes?: string;
  daysOverdue?: number;
}): Promise<{
  success: boolean;
  escalationId?: string;
  error?: string;
}> {
  try {
    // Check for existing open escalation
    const existingSnapshot = await adminDb
      .collection('escalations')
      .where('entityType', '==', params.entityType)
      .where('entityId', '==', params.entityId)
      .where('status', 'in', ['open', 'acknowledged'])
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      // Update existing escalation level instead of creating new
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data();

      // Only upgrade if new level is higher
      const levelOrder = { L1: 1, L2: 2, L3: 3 };
      if (levelOrder[params.level] > levelOrder[existingData.level as EscalationLevel]) {
        await existingDoc.ref.update({
          level: params.level,
          escalatedToId: params.escalatedToId,
          escalatedToName: params.escalatedToName,
          levelUpgradedAt: adminTimestamp.now(),
          notes: params.notes
            ? `${existingData.notes || ''}\n[Upgraded to ${params.level}] ${params.notes}`
            : existingData.notes,
        });

        // Notify new escalation target
        await createOperationalNotification({
          type: 'deadline_approaching',
          userId: params.escalatedToId,
          title: `Escalation Upgraded to ${params.level}`,
          message: `${params.entityName} has been escalated to ${params.level}. ${params.daysOverdue ? `${params.daysOverdue} days overdue.` : ''}`,
          metadata: {
            domainId: params.domainId,
            domainName: params.domainName,
            actionUrl: '/nucleus/admin/academy/operations',
          },
        });

        return { success: true, escalationId: existingDoc.id };
      }

      return { success: true, escalationId: existingDoc.id };
    }

    // Create new escalation
    const docRef = await adminDb.collection('escalations').add({
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      domainId: params.domainId,
      domainName: params.domainName,
      reason: params.reason,
      level: params.level,
      status: 'open',
      originalAssigneeId: params.originalAssigneeId || null,
      originalAssigneeName: params.originalAssigneeName || null,
      escalatedToId: params.escalatedToId,
      escalatedToName: params.escalatedToName,
      escalatedBy: params.escalatedBy,
      createdAt: adminTimestamp.now(),
      notes: params.notes || null,
      daysOverdue: params.daysOverdue || null,
    });

    // Notify escalation target
    await createOperationalNotification({
      type: 'deadline_approaching',
      userId: params.escalatedToId,
      title: `New ${params.level} Escalation`,
      message: `${params.entityName} requires your attention. Reason: ${params.reason.replace(/_/g, ' ')}.`,
      metadata: {
        domainId: params.domainId,
        domainName: params.domainName,
        actionUrl: '/nucleus/admin/academy/operations',
      },
    });

    return { success: true, escalationId: docRef.id };
  } catch (error) {
    log.error('[createEscalation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create escalation',
    };
  }
}

// ============================================================================
// Get Escalations
// ============================================================================

export async function getEscalations(filters?: {
  status?: 'open' | 'acknowledged' | 'resolved';
  level?: EscalationLevel;
  escalatedToId?: string;
}): Promise<{
  success: boolean;
  escalations?: Escalation[];
  error?: string;
}> {
  try {
    let query = adminDb.collection('escalations') as FirebaseFirestore.Query;

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters?.level) {
      query = query.where('level', '==', filters.level);
    }
    if (filters?.escalatedToId) {
      query = query.where('escalatedToId', '==', filters.escalatedToId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();

    const escalations: Escalation[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        domainId: data.domainId,
        domainName: data.domainName,
        reason: data.reason,
        level: data.level,
        status: data.status,
        originalAssigneeId: data.originalAssigneeId,
        originalAssigneeName: data.originalAssigneeName,
        escalatedToId: data.escalatedToId,
        escalatedToName: data.escalatedToName,
        escalatedBy: data.escalatedBy,
        createdAt: toDateFromSerialized(data.createdAt)?.toISOString() || new Date().toISOString(),
        acknowledgedAt: toDateFromSerialized(data.acknowledgedAt)?.toISOString(),
        resolvedAt: toDateFromSerialized(data.resolvedAt)?.toISOString(),
        resolution: data.resolution,
        notes: data.notes,
        daysOverdue: data.daysOverdue,
      };
    });

    return { success: true, escalations };
  } catch (error) {
    log.error('[getEscalations] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch escalations',
    };
  }
}

// ============================================================================
// Get Escalation Stats
// ============================================================================

export async function getEscalationStats(): Promise<{
  success: boolean;
  stats?: EscalationStats;
  error?: string;
}> {
  try {
    const snapshot = await adminDb.collection('escalations').get();

    const stats: EscalationStats = {
      open: 0,
      acknowledged: 0,
      byLevel: { L1: 0, L2: 0, L3: 0 },
      byReason: {
        deadline_passed: 0,
        stale_content: 0,
        review_timeout: 0,
        quality_issue: 0,
        manual: 0,
      },
      avgResolutionTime: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();

      if (data.status === 'open') stats.open++;
      if (data.status === 'acknowledged') stats.acknowledged++;

      if (data.status !== 'dismissed' && data.status !== 'resolved') {
        stats.byLevel[data.level as EscalationLevel]++;
        stats.byReason[data.reason as EscalationReason]++;
      }

      if (data.status === 'resolved' && data.resolvedAt && data.createdAt) {
        const created = toDateFromSerialized(data.createdAt);
        const resolved = toDateFromSerialized(data.resolvedAt);
        totalResolutionTime += (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
        resolvedCount++;
      }
    });

    stats.avgResolutionTime = resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount) : 0;

    return { success: true, stats };
  } catch (error) {
    log.error('[getEscalationStats] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch escalation stats',
    };
  }
}

// ============================================================================
// Acknowledge Escalation
// ============================================================================

export async function acknowledgeEscalation(
  escalationId: string,
  acknowledgedBy: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await adminDb.collection('escalations').doc(escalationId).update({
      status: 'acknowledged',
      acknowledgedAt: adminTimestamp.now(),
      acknowledgedBy,
    });

    return { success: true };
  } catch (error) {
    log.error('[acknowledgeEscalation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acknowledge escalation',
    };
  }
}

// ============================================================================
// Resolve Escalation
// ============================================================================

export async function resolveEscalation(
  escalationId: string,
  resolution: string,
  resolvedBy: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await adminDb.collection('escalations').doc(escalationId).update({
      status: 'resolved',
      resolution,
      resolvedAt: adminTimestamp.now(),
      resolvedBy,
    });

    // Notify original assignee if exists
    const escalationDoc = await adminDb.collection('escalations').doc(escalationId).get();
    const data = escalationDoc.data();

    if (data?.originalAssigneeId) {
      await createOperationalNotification({
        type: 'content_published',
        userId: data.originalAssigneeId,
        title: 'Escalation Resolved',
        message: `The escalation for "${data.entityName}" has been resolved: ${resolution}`,
        metadata: {
          domainId: data.domainId,
          domainName: data.domainName,
        },
      });
    }

    return { success: true };
  } catch (error) {
    log.error('[resolveEscalation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve escalation',
    };
  }
}

// ============================================================================
// Dismiss Escalation
// ============================================================================

export async function dismissEscalation(
  escalationId: string,
  reason: string,
  dismissedBy: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await adminDb.collection('escalations').doc(escalationId).update({
      status: 'dismissed',
      dismissedReason: reason,
      dismissedAt: adminTimestamp.now(),
      dismissedBy,
    });

    return { success: true };
  } catch (error) {
    log.error('[dismissEscalation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dismiss escalation',
    };
  }
}

// ============================================================================
// Process Auto-Escalations (Cron Job)
// ============================================================================

export async function processAutoEscalations(): Promise<{
  success: boolean;
  processed: number;
  error?: string;
}> {
  try {
    const now = new Date();

    // Get all open/acknowledged escalations that might need upgrading
    const snapshot = await adminDb
      .collection('escalations')
      .where('status', 'in', ['open', 'acknowledged'])
      .get();

    let processed = 0;

    // Get admin users for L3 escalations
    const adminsSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'admin')
      .limit(10)
      .get();

    const adminIds = adminsSnapshot.docs.map((doc) => doc.id);
    const adminNames = adminsSnapshot.docs.map((doc) => doc.data().displayName || doc.data().email || 'Admin');

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const createdAt = toDateFromSerialized(data.createdAt) || new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const currentLevel = data.level as EscalationLevel;
      const config = DEFAULT_ESCALATION_CONFIG.find((c) => c.level === currentLevel);

      if (!config || config.autoEscalateAfterDays === 0) continue;

      // Check if it's time to escalate
      if (daysSinceCreation >= config.autoEscalateAfterDays) {
        const nextLevel = currentLevel === 'L1' ? 'L2' : currentLevel === 'L2' ? 'L3' : null;

        if (nextLevel) {
          // Get escalation target for next level
          let targetId = adminIds[0] || 'system';
          let targetName = adminNames[0] || 'System';

          if (nextLevel === 'L2') {
            // Get moderators
            const modsSnapshot = await adminDb
              .collection('users')
              .where('role', '==', 'moderator')
              .limit(1)
              .get();
            if (!modsSnapshot.empty) {
              targetId = modsSnapshot.docs[0].id;
              targetName = modsSnapshot.docs[0].data().displayName || 'Moderator';
            }
          }

          await createEscalation({
            entityType: data.entityType,
            entityId: data.entityId,
            entityName: data.entityName,
            domainId: data.domainId,
            domainName: data.domainName,
            reason: data.reason,
            level: nextLevel,
            originalAssigneeId: data.originalAssigneeId,
            originalAssigneeName: data.originalAssigneeName,
            escalatedToId: targetId,
            escalatedToName: targetName,
            escalatedBy: 'system',
            notes: `Auto-escalated from ${currentLevel} after ${daysSinceCreation} days`,
            daysOverdue: data.daysOverdue,
          });

          processed++;
        }
      }
    }

    return { success: true, processed };
  } catch (error) {
    log.error('[processAutoEscalations] Error:', error);
    return {
      success: false,
      processed: 0,
      error: error instanceof Error ? error.message : 'Failed to process auto-escalations',
    };
  }
}

// ============================================================================
// Get My Escalations
// ============================================================================

export async function getMyEscalations(userId: string): Promise<{
  success: boolean;
  escalations?: Escalation[];
  stats?: { open: number; acknowledged: number };
  error?: string;
}> {
  try {
    const result = await getEscalations({ escalatedToId: userId });

    if (!result.success) {
      return result;
    }

    const escalations = result.escalations || [];
    const stats = {
      open: escalations.filter((e) => e.status === 'open').length,
      acknowledged: escalations.filter((e) => e.status === 'acknowledged').length,
    };

    return { success: true, escalations, stats };
  } catch (error) {
    log.error('[getMyEscalations] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch escalations',
    };
  }
}
