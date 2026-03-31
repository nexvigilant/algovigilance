'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { Notification } from '@/types/community';

import { logger } from '@/lib/logger';
const log = logger.scope('messaging/notifications');

/**
 * Helper to get authenticated user from session cookie
 */
async function getAuthenticatedUser() {
  const token = (await cookies()).get('nucleus_id_token')?.value;
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch (error) {
    return null;
  }
}

/**
 * Get user notifications with pagination
 * SECURITY: Only returns notifications for the authenticated user
 */
export async function getNotifications(input: {
  limitCount?: number;
  unreadOnly?: boolean;
}): Promise<{ notifications: Notification[]; unreadCount: number }> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { notifications: [], unreadCount: 0 };
    }

    // SECURITY: Always use the authenticated user's ID
    const userId = user.uid;

    // Build query
    let notificationQuery = adminDb
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(input.limitCount || 20);

    if (input.unreadOnly) {
      notificationQuery = adminDb
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .where('read', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(input.limitCount || 20);
    }

    const notificationsSnapshot = await notificationQuery.get();

    const notifications: Notification[] = notificationsSnapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    ) as Notification[];

    // Get unread count
    const unreadSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .where('read', '==', false)
      .get();
    const unreadCount = unreadSnapshot.size;

    return { notifications, unreadCount };
  } catch (error) {
    log.error('Error fetching notifications:', error);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean }> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false };
    }

    await adminDb
      .collection('users')
      .doc(user.uid)
      .collection('notifications')
      .doc(notificationId)
      .update({
        read: true,
      });

    return { success: true };
  } catch (error) {
    log.error('Error marking notification as read:', error);
    return { success: false };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<{
  success: boolean;
}> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false };
    }

    // Get all unread notifications
    const unreadSnapshot = await adminDb
      .collection('users')
      .doc(user.uid)
      .collection('notifications')
      .where('read', '==', false)
      .get();

    // Mark all as read
    const updatePromises = unreadSnapshot.docs.map((doc) =>
      doc.ref.update({ read: true })
    );

    await Promise.all(updatePromises);

    return { success: true };
  } catch (error) {
    log.error('Error marking all notifications as read:', error);
    return { success: false };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { count: 0 };
    }

    const unreadSnapshot = await adminDb
      .collection('users')
      .doc(user.uid)
      .collection('notifications')
      .where('read', '==', false)
      .get();

    return { count: unreadSnapshot.size };
  } catch (error) {
    log.error('Error getting unread count:', error);
    return { count: 0 };
  }
}

/**
 * Get both unread message and notification counts in a single request
 * Optimized for nav badge indicators to reduce network calls
 */
export async function getUnreadCounts(): Promise<{
  messages: number;
  notifications: number;
}> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { messages: 0, notifications: 0 };
    }

    // Run both queries in parallel
    const [conversationsSnapshot, notificationsSnapshot] = await Promise.all([
      // Messages: sum unread counts from conversations
      adminDb
        .collection('conversations')
        .where('participantIds', 'array-contains', user.uid)
        .get(),
      // Notifications: count unread notifications
      adminDb
        .collection('users')
        .doc(user.uid)
        .collection('notifications')
        .where('read', '==', false)
        .get(),
    ]);

    // Sum up denormalized unread counts from all conversations
    let totalMessages = 0;
    conversationsSnapshot.docs.forEach((convDoc) => {
      const data = convDoc.data();
      const unreadByUser = data.unreadCountByUser || {};
      totalMessages += unreadByUser[user.uid] || 0;
    });

    return {
      messages: totalMessages,
      notifications: notificationsSnapshot.size,
    };
  } catch (error) {
    log.error('Error getting unread counts:', error);
    return { messages: 0, notifications: 0 };
  }
}
