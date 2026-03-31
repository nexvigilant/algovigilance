'use server';

import { toDate } from '@/lib/utils';
import { adminAuth, adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { logger } from '@/lib/logger';
const log = logger.scope('notifications/actions');

// Check if user is admin - verifies session AND role
async function checkAdmin() {
  const session = (await cookies()).get('session')?.value;
  if (!session) {
    throw new Error('Not authenticated');
  }

  try {
    const user = await adminAuth.verifySessionCookie(session, true);

    // SECURITY: Verify admin role in Firestore
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
      log.error(`[checkAdmin] User document not found for uid: ${user.uid}`);
      throw new Error('Unauthorized: User not found');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      log.error(`[checkAdmin] Unauthorized access attempt by user: ${user.uid}, role: ${userData?.role}`);
      throw new Error('Unauthorized: Admin access required');
    }

    return user;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      throw error;
    }
    throw new Error('Not authenticated');
  }
}

export interface NotificationAnalytics {
  totalNotificationsSent: number;
  notificationsToday: number;
  notificationsThisWeek: number;
  averageReadRate: number;
  typeDistribution: Record<string, number>;
  topNotificationTypes: Array<{ type: string; count: number }>;
  recentBroadcasts: Array<{
    id: string;
    title: string;
    recipientCount: number;
    readCount: number;
    createdAt: Date;
  }>;
}

export interface BroadcastNotification {
  title: string;
  message: string;
  type: 'announcement' | 'update' | 'alert' | 'promotion';
  actionUrl?: string;
  targetAudience: 'all' | 'active' | 'new' | 'premium';
}

export interface BroadcastHistory {
  id: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  recipientCount: number;
  readCount: number;
  adminId: string;
  adminName: string;
  createdAt: Date;
}

/**
 * Get notification analytics for admin dashboard
 */
export async function getNotificationAnalytics(): Promise<NotificationAnalytics> {
  try {
    await checkAdmin();

    // Get all users to analyze notifications
    const usersSnapshot = await adminDb.collection('users').limit(500).get();

    let totalNotifications = 0;
    let totalRead = 0;
    let notificationsToday = 0;
    let notificationsThisWeek = 0;
    const typeCount: Record<string, number> = {};

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Sample notifications from users
    for (const userDoc of usersSnapshot.docs) {
      const notificationsSnapshot = await adminDb
        .collection('users')
        .doc(userDoc.id)
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      for (const notifDoc of notificationsSnapshot.docs) {
        const notif = notifDoc.data();
        totalNotifications++;

        if (notif.read) {
          totalRead++;
        }

        const createdAt = toDate(notif.createdAt);
        if (createdAt >= todayStart) {
          notificationsToday++;
        }
        if (createdAt >= weekStart) {
          notificationsThisWeek++;
        }

        const type = notif.type || 'unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
      }
    }

    // Calculate read rate
    const averageReadRate = totalNotifications > 0
      ? Math.round((totalRead / totalNotifications) * 100)
      : 0;

    // Get top notification types
    const topNotificationTypes = Object.entries(typeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent broadcasts
    const broadcastsSnapshot = await adminDb
      .collection('notification_broadcasts')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentBroadcasts: NotificationAnalytics['recentBroadcasts'] = [];
    for (const broadcastDoc of broadcastsSnapshot.docs) {
      const broadcast = broadcastDoc.data();
      recentBroadcasts.push({
        id: broadcastDoc.id,
        title: broadcast.title,
        recipientCount: broadcast.recipientCount || 0,
        readCount: broadcast.readCount || 0,
        createdAt: toDate(broadcast.createdAt),
      });
    }

    return {
      totalNotificationsSent: totalNotifications,
      notificationsToday,
      notificationsThisWeek,
      averageReadRate,
      typeDistribution: typeCount,
      topNotificationTypes,
      recentBroadcasts,
    };
  } catch (error) {
    log.error('Error fetching notification analytics:', error);
    throw new Error('Failed to fetch analytics');
  }
}

/**
 * Send broadcast notification to users
 */
export async function sendBroadcastNotification(
  notification: BroadcastNotification
): Promise<{ success: boolean; recipientCount: number; error?: string }> {
  try {
    const admin = await checkAdmin();

    // Get target users based on audience
    let usersQuery: FirebaseFirestore.Query = adminDb.collection('users');

    // Filter based on target audience
    switch (notification.targetAudience) {
      case 'active': {
        // Users active in last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        usersQuery = adminDb
          .collection('users')
          .where('lastActiveAt', '>=', adminTimestamp.fromDate(weekAgo));
        break;
      }
      case 'new': {
        // Users joined in last 30 days
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        usersQuery = adminDb
          .collection('users')
          .where('createdAt', '>=', adminTimestamp.fromDate(monthAgo));
        break;
      }
      case 'premium':
        usersQuery = adminDb.collection('users').where('isPremium', '==', true);
        break;
      // 'all' uses default query
    }

    const usersSnapshot = await usersQuery.get();

    if (usersSnapshot.empty) {
      return { success: false, recipientCount: 0, error: 'No users match the target audience' };
    }

    // Send notification to each user
    const batch = adminDb.batch();
    let recipientCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const notificationRef = adminDb
        .collection('users')
        .doc(userDoc.id)
        .collection('notifications')
        .doc();
      batch.set(notificationRef, {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: false,
        actionUrl: notification.actionUrl || null,
        metadata: {
          isBroadcast: true,
          targetAudience: notification.targetAudience,
        },
        createdAt: adminTimestamp.now(),
      });
      recipientCount++;

      // Commit in batches of 500 (Firestore limit)
      if (recipientCount % 500 === 0) {
        await batch.commit();
      }
    }

    // Commit remaining
    if (recipientCount % 500 !== 0) {
      await batch.commit();
    }

    // Log broadcast for history
    await adminDb.collection('notification_broadcasts').add({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      targetAudience: notification.targetAudience,
      actionUrl: notification.actionUrl || null,
      recipientCount,
      readCount: 0,
      adminId: admin.uid,
      createdAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/notifications');
    return { success: true, recipientCount };
  } catch (error) {
    log.error('Error sending broadcast:', error);
    return { success: false, recipientCount: 0, error: 'Failed to send broadcast' };
  }
}

/**
 * Get broadcast history
 */
export async function getBroadcastHistory(): Promise<BroadcastHistory[]> {
  try {
    await checkAdmin();

    const snapshot = await adminDb
      .collection('notification_broadcasts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const history: BroadcastHistory[] = [];

    for (const broadcastDoc of snapshot.docs) {
      const broadcast = broadcastDoc.data();

      // Get admin name
      let adminName = 'Admin';
      if (broadcast.adminId) {
        const adminDoc = await adminDb.collection('users').doc(broadcast.adminId).get();
        if (adminDoc.exists) {
          const adminData = adminDoc.data();
          adminName = adminData?.displayName || adminData?.name || 'Admin';
        }
      }

      history.push({
        id: broadcastDoc.id,
        title: broadcast.title,
        message: broadcast.message,
        type: broadcast.type,
        targetAudience: broadcast.targetAudience,
        recipientCount: broadcast.recipientCount || 0,
        readCount: broadcast.readCount || 0,
        adminId: broadcast.adminId,
        adminName,
        createdAt: toDate(broadcast.createdAt),
      });
    }

    return history;
  } catch (error) {
    log.error('Error fetching broadcast history:', error);
    return [];
  }
}

/**
 * Get notification type statistics
 */
export async function getNotificationTypeStats(): Promise<
  Array<{
    type: string;
    label: string;
    count: number;
    readRate: number;
  }>
> {
  try {
    await checkAdmin();

    const typeLabels: Record<string, string> = {
      announcement: 'Announcements',
      update: 'Updates',
      alert: 'Alerts',
      promotion: 'Promotions',
      badge: 'Badge Awards',
      message: 'Messages',
      reply: 'Replies',
      reaction: 'Reactions',
      follow: 'Follows',
      mention: 'Mentions',
    };

    // Sample notifications to get type stats
    const usersSnapshot = await adminDb.collection('users').limit(200).get();

    const typeStats: Record<string, { count: number; read: number }> = {};

    for (const userDoc of usersSnapshot.docs) {
      const notificationsSnapshot = await adminDb
        .collection('users')
        .doc(userDoc.id)
        .collection('notifications')
        .limit(100)
        .get();

      for (const notifDoc of notificationsSnapshot.docs) {
        const notif = notifDoc.data();
        const type = notif.type || 'unknown';

        if (!typeStats[type]) {
          typeStats[type] = { count: 0, read: 0 };
        }
        typeStats[type].count++;
        if (notif.read) {
          typeStats[type].read++;
        }
      }
    }

    return Object.entries(typeStats)
      .map(([type, stats]) => ({
        type,
        label: typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1),
        count: stats.count,
        readRate: stats.count > 0
          ? Math.round((stats.read / stats.count) * 100)
          : 0,
      }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    log.error('Error fetching type stats:', error);
    return [];
  }
}

/**
 * Preview broadcast recipient count
 */
export async function previewBroadcastRecipients(
  targetAudience: 'all' | 'active' | 'new' | 'premium'
): Promise<{ count: number }> {
  try {
    await checkAdmin();

    let usersQuery: FirebaseFirestore.Query = adminDb.collection('users');

    switch (targetAudience) {
      case 'active': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        usersQuery = adminDb
          .collection('users')
          .where('lastActiveAt', '>=', adminTimestamp.fromDate(weekAgo));
        break;
      }
      case 'new': {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        usersQuery = adminDb
          .collection('users')
          .where('createdAt', '>=', adminTimestamp.fromDate(monthAgo));
        break;
      }
      case 'premium':
        usersQuery = adminDb.collection('users').where('isPremium', '==', true);
        break;
    }

    const snapshot = await usersQuery.get();
    return { count: snapshot.size };
  } catch (error) {
    log.error('Error previewing recipients:', error);
    return { count: 0 };
  }
}
