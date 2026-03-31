'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireModerator, requireAuth } from '@/lib/admin-auth';
import { serializeForClient } from '@/lib/serialization-utils';

import { logger } from '@/lib/logger';
const log = logger.scope('moderation/actions');

// Auth handled by requireModerator/requireAuth from admin-auth

/**
 * Get moderation queue
 */
export async function getModerationQueue(filters: {
  status?: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  type?: 'post' | 'reply';
  limit?: number;
} = {}) {
  try {
    try {
      await requireModerator();
    } catch {
      return { success: false, error: 'Unauthorized' };
    }

    const { status, type, limit = 50 } = filters;

    let query: FirebaseFirestore.Query = adminDb.collection('moderation_queue');

    if (status) {
      query = query.where('status', '==', status);
    }
    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    // Serialize timestamps for server-to-client boundary safety
    const items = snapshot.docs.map((doc) =>
      serializeForClient({
        id: doc.id,
        ...doc.data(),
      })
    );

    return { success: true, items };
  } catch (error) {
    log.error('Error getting moderation queue:', error);
    return { success: false, error: 'Failed to get moderation queue' };
  }
}

/**
 * Report content for moderation
 */
export async function reportContent(input: {
  type: 'post' | 'reply';
  itemId: string;
  reason: 'spam' | 'harassment' | 'off-topic' | 'other';
  details?: string;
}) {
  try {
    let userId: string;
    try {
      const ctx = await requireAuth();
      userId = ctx.uid;
    } catch {
      return { success: false, error: 'Not authenticated' };
    }

    const reportRef = adminDb.collection('moderation_queue').doc();
    await reportRef.set({
      id: reportRef.id,
      type: input.type,
      itemId: input.itemId,
      reportedBy: userId,
      reason: input.reason,
      details: input.details || null,
      status: 'pending',
      createdAt: adminTimestamp.now(),
    });

    return { success: true, reportId: reportRef.id };
  } catch (error) {
    log.error('Error reporting content:', error);
    return { success: false, error: 'Failed to report content' };
  }
}

/**
 * Hide content (soft delete)
 */
export async function hideContent(input: {
  type: 'post' | 'reply';
  itemId: string;
  reason: string;
}) {
  try {
    try { await requireModerator(); } catch { return { success: false, error: "Unauthorized" }; }

    const { type, itemId, reason } = input;

    // Update the content to mark as hidden
    const collectionName = type === 'post' ? 'community_posts' : 'replies';
    const itemRef = adminDb.collection(collectionName).doc(itemId);

    await itemRef.update({
      isHidden: true,
      hiddenAt: adminTimestamp.now(),
      hiddenBy: '', // Will be set by caller context
      hiddenReason: reason,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error hiding content:', error);
    return { success: false, error: 'Failed to hide content' };
  }
}

/**
 * Delete content (hard delete)
 */
export async function deleteContent(input: {
  type: 'post' | 'reply';
  itemId: string;
  reason: string;
}) {
  try {
    try { await requireModerator(); } catch { return { success: false, error: "Unauthorized" }; }

    const { type, itemId, reason } = input;

    // Delete the content
    const collectionName = type === 'post' ? 'community_posts' : 'replies';
    const itemRef = adminDb.collection(collectionName).doc(itemId);

    // Store deletion record for audit trail
    await adminDb.collection('moderation_actions').doc(`${Date.now()}_${itemId}`).set({
      action: 'delete',
      type,
      itemId,
      deletedBy: '', // Will be set by caller context
      reason,
      deletedAt: adminTimestamp.now(),
    });

    // Delete the actual content
    await itemRef.delete();

    return { success: true };
  } catch (error) {
    log.error('Error deleting content:', error);
    return { success: false, error: 'Failed to delete content' };
  }
}

/**
 * Ban user
 */
export async function banUser(input: {
  userId: string;
  reason: string;
  duration?: 'permanent' | '7-days' | '30-days';
}) {
  try {
    try { await requireModerator(); } catch { return { success: false, error: "Unauthorized" }; }

    const { userId, reason, duration = 'permanent' } = input;

    // Calculate ban expiration
    let expiresAt = null;
    if (duration !== 'permanent') {
      const days = duration === '7-days' ? 7 : 30;
      expiresAt = adminTimestamp.fromDate(
        new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      );
    }

    // Create ban record and update user record in parallel
    await Promise.all([
      adminDb.collection('user_bans').doc(userId).set({
        userId,
        bannedBy: '', // Will be set by caller context
        reason,
        duration,
        expiresAt,
        bannedAt: adminTimestamp.now(),
        isActive: true,
      }),
      adminDb.collection('users').doc(userId).update({
        isBanned: true,
        bannedAt: adminTimestamp.now(),
        bannedReason: reason,
      }),
    ]);

    return { success: true };
  } catch (error) {
    log.error('Error banning user:', error);
    return { success: false, error: 'Failed to ban user' };
  }
}

/**
 * Unban user
 */
export async function unbanUser(userId: string) {
  try {
    try { await requireModerator(); } catch { return { success: false, error: "Unauthorized" }; }

    // Deactivate ban record and update user record in parallel
    await Promise.all([
      adminDb.collection('user_bans').doc(userId).update({
        isActive: false,
        unbannedBy: '', // Will be set by caller context
        unbannedAt: adminTimestamp.now(),
      }),
      adminDb.collection('users').doc(userId).update({
        isBanned: false,
        unbannedAt: adminTimestamp.now(),
      }),
    ]);

    return { success: true };
  } catch (error) {
    log.error('Error unbanning user:', error);
    return { success: false, error: 'Failed to unban user' };
  }
}

/**
 * Review and resolve moderation report
 */
export async function resolveReport(input: {
  reportId: string;
  action: 'hide' | 'delete' | 'ban_user' | 'dismiss';
  reason?: string;
}) {
  try {
    try { await requireModerator(); } catch { return { success: false, error: "Unauthorized" }; }

    const { reportId, action, reason } = input;

    // Get the report
    const reportDoc = await adminDb.collection('moderation_queue').doc(reportId).get();
    if (!reportDoc.exists) {
      return { success: false, error: 'Report not found' };
    }

    const report = reportDoc.data();
    if (!report) {
      return { success: false, error: 'Report data not found' };
    }

    // Take action based on decision
    if (action === 'hide') {
      await hideContent({
        type: report.type,
        itemId: report.itemId,
        reason: reason || 'Violation of community guidelines',
      });
    } else if (action === 'delete') {
      await deleteContent({
        type: report.type,
        itemId: report.itemId,
        reason: reason || 'Severe violation',
      });
    } else if (action === 'ban_user') {
      // Get the author of the reported content
      const collectionName =
        report.type === 'post' ? 'community_posts' : 'replies';
      const contentDoc = await adminDb.collection(collectionName).doc(report.itemId).get();
      const contentData = contentDoc.data();
      if (contentDoc.exists && contentData) {
        const authorId = contentData.authorId;
        await banUser({
          userId: authorId,
          reason: reason || 'Multiple community guideline violations',
        });
      }
    }

    // Update report status
    await adminDb.collection('moderation_queue').doc(reportId).update({
      status: action === 'dismiss' ? 'dismissed' : 'actioned',
      action,
      reviewedBy: '', // Will be set by caller context
      reviewedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error resolving report:', error);
    return { success: false, error: 'Failed to resolve report' };
  }
}

/**
 * Get moderation stats
 */
export async function getModerationStats() {
  try {
    try { await requireModerator(); } catch { return { success: false, error: "Unauthorized" }; }

    const sevenDaysAgo = adminTimestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // Fetch all stats in parallel
    const [pendingSnapshot, actionedSnapshot, bannedSnapshot] = await Promise.all([
      // Get pending reports count
      adminDb.collection('moderation_queue')
        .where('status', '==', 'pending')
        .get(),
      // Get actioned reports count (last 7 days)
      adminDb.collection('moderation_queue')
        .where('status', '==', 'actioned')
        .where('reviewedAt', '>=', sevenDaysAgo)
        .get(),
      // Get banned users count
      adminDb.collection('user_bans')
        .where('isActive', '==', true)
        .get(),
    ]);

    const pendingCount = pendingSnapshot.size;
    const actionedCount = actionedSnapshot.size;
    const bannedCount = bannedSnapshot.size;

    return {
      success: true,
      stats: {
        pending: pendingCount,
        actionedLast7Days: actionedCount,
        activeBans: bannedCount,
      },
    };
  } catch (error) {
    log.error('Error getting moderation stats:', error);
    return { success: false, error: 'Failed to get stats' };
  }
}
