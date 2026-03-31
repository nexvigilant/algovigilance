'use server';

import { toDate } from '@/lib/utils';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('messages/actions');

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

export interface MessagingAnalytics {
  totalConversations: number;
  totalMessages: number;
  activeConversationsToday: number;
  activeConversationsThisWeek: number;
  averageMessagesPerConversation: number;
  topMessagers: Array<{
    userId: string;
    userName: string;
    messageCount: number;
  }>;
  recentConversations: Array<{
    id: string;
    participants: string[];
    lastMessage: string;
    messageCount: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  messageVolumeByDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface ConversationDetail {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: Date;
  };
}

/**
 * Get messaging analytics for admin dashboard
 */
export async function getMessagingAnalytics(): Promise<MessagingAnalytics> {
  try {
    await checkAdmin();

    const conversationsSnapshot = await adminDb.collection('conversations').get();

    let totalMessages = 0;
    let activeToday = 0;
    let activeThisWeek = 0;
    const userMessageCounts: Record<string, { count: number; name: string }> = {};
    const messagesByDay: Record<string, number> = {};

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const recentConversations: MessagingAnalytics['recentConversations'] = [];

    for (const convDoc of conversationsSnapshot.docs) {
      const convData = convDoc.data();
      const updatedAt = toDate(convData.updatedAt);
      const createdAt = toDate(convData.createdAt);

      // Check activity
      if (updatedAt >= todayStart) {
        activeToday++;
      }
      if (updatedAt >= weekStart) {
        activeThisWeek++;
      }

      // Get messages in this conversation
      const messagesSnapshot = await adminDb.collection(`conversations/${convDoc.id}/messages`).get();
      const messageCount = messagesSnapshot.size;
      totalMessages += messageCount;

      // Track user message counts and daily volume
      for (const msgDoc of messagesSnapshot.docs) {
        const msgData = msgDoc.data();
        const senderId = msgData.senderId;
        const senderName = msgData.senderName || 'Unknown';

        if (!userMessageCounts[senderId]) {
          userMessageCounts[senderId] = { count: 0, name: senderName };
        }
        userMessageCounts[senderId].count++;

        // Track daily volume
        const msgDate = toDateFromSerialized(msgData.createdAt);
        if (msgDate) {
          const dateKey = msgDate.toISOString().split('T')[0];
          messagesByDay[dateKey] = (messagesByDay[dateKey] || 0) + 1;
        }
      }

      // Add to recent conversations
      const participantNames = convData.participants?.map((p: { name?: string }) => p.name ?? '') || [];
      recentConversations.push({
        id: convDoc.id,
        participants: participantNames,
        lastMessage: convData.lastMessage?.content || '',
        messageCount,
        createdAt,
        updatedAt,
      });
    }

    // Sort and limit recent conversations
    recentConversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const topRecentConversations = recentConversations.slice(0, 10);

    // Get top messagers
    const topMessagers = Object.entries(userMessageCounts)
      .map(([userId, data]) => ({
        userId,
        userName: data.name,
        messageCount: data.count,
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 10);

    // Format daily volume (last 7 days)
    const messageVolumeByDay: MessagingAnalytics['messageVolumeByDay'] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      messageVolumeByDay.push({
        date: dateKey,
        count: messagesByDay[dateKey] || 0,
      });
    }

    // Calculate average
    const totalConversations = conversationsSnapshot.size;
    const averageMessagesPerConversation = totalConversations > 0
      ? Math.round(totalMessages / totalConversations)
      : 0;

    return {
      totalConversations,
      totalMessages,
      activeConversationsToday: activeToday,
      activeConversationsThisWeek: activeThisWeek,
      averageMessagesPerConversation,
      topMessagers,
      recentConversations: topRecentConversations,
      messageVolumeByDay,
    };
  } catch (error) {
    log.error('Error fetching messaging analytics:', error);
    throw new Error('Failed to fetch analytics');
  }
}

/**
 * Get all conversations with details for admin
 */
export async function getAllConversationsAdmin(): Promise<ConversationDetail[]> {
  try {
    await checkAdmin();

    const snapshot = await adminDb.collection('conversations')
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .get();

    const conversations: ConversationDetail[] = [];

    for (const convDoc of snapshot.docs) {
      const convData = convDoc.data();

      // Get message count
      const messagesSnapshot = await adminDb.collection(`conversations/${convDoc.id}/messages`).get();

      conversations.push({
        id: convDoc.id,
        participants: convData.participants || [],
        messageCount: messagesSnapshot.size,
        createdAt: toDate(convData.createdAt),
        updatedAt: toDate(convData.updatedAt),
        lastMessage: convData.lastMessage
          ? {
              content: convData.lastMessage.content,
              senderName: convData.lastMessage.senderName,
              createdAt: toDate(convData.lastMessage.createdAt),
            }
          : undefined,
      });
    }

    return conversations;
  } catch (error) {
    log.error('Error fetching conversations:', error);
    return [];
  }
}

/**
 * Get conversation messages for admin review
 */
export async function getConversationMessagesAdmin(
  conversationId: string
): Promise<
  Array<{
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: Date;
    read: boolean;
  }>
> {
  try {
    await checkAdmin();

    const snapshot = await adminDb.collection(`conversations/${conversationId}/messages`)
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map((msgDoc) => {
      const data = msgDoc.data();
      return {
        id: msgDoc.id,
        senderId: data.senderId,
        senderName: data.senderName || 'Unknown',
        content: data.content,
        createdAt: toDate(data.createdAt),
        read: data.read || false,
      };
    });
  } catch (error) {
    log.error('Error fetching conversation messages:', error);
    return [];
  }
}

/**
 * Get user messaging stats
 */
export async function getUserMessagingStats(userId: string): Promise<{
  conversationCount: number;
  messagesSent: number;
  messagesReceived: number;
  lastActive: Date | null;
}> {
  try {
    await checkAdmin();

    const conversationsSnapshot = await adminDb.collection('conversations')
      .where('participantIds', 'array-contains', userId)
      .get();

    let messagesSent = 0;
    let messagesReceived = 0;
    let lastActive: Date | null = null;

    for (const convDoc of conversationsSnapshot.docs) {
      const messagesSnapshot = await adminDb.collection(`conversations/${convDoc.id}/messages`).get();

      for (const msgDoc of messagesSnapshot.docs) {
        const msgData = msgDoc.data();
        if (msgData.senderId === userId) {
          messagesSent++;
        } else {
          messagesReceived++;
        }

        const msgDate = toDateFromSerialized(msgData.createdAt);
        if (msgDate && (!lastActive || msgDate > lastActive)) {
          lastActive = msgDate;
        }
      }
    }

    return {
      conversationCount: conversationsSnapshot.size,
      messagesSent,
      messagesReceived,
      lastActive,
    };
  } catch (error) {
    log.error('Error fetching user messaging stats:', error);
    return {
      conversationCount: 0,
      messagesSent: 0,
      messagesReceived: 0,
      lastActive: null,
    };
  }
}

/**
 * Search messages across all conversations
 */
export async function searchMessagesAdmin(
  searchTerm: string
): Promise<
  Array<{
    conversationId: string;
    messageId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: Date;
    participants: string[];
  }>
> {
  try {
    await checkAdmin();

    if (!searchTerm || searchTerm.length < 3) {
      return [];
    }

    const conversationsSnapshot = await adminDb.collection('conversations').limit(100).get();

    const results: Array<{
      conversationId: string;
      messageId: string;
      senderId: string;
      senderName: string;
      content: string;
      createdAt: Date;
      participants: string[];
    }> = [];

    const searchLower = searchTerm.toLowerCase();

    for (const convDoc of conversationsSnapshot.docs) {
      const convData = convDoc.data();
      const participantNames = convData.participants?.map((p: { name?: string }) => p.name ?? '') || [];

      const messagesSnapshot = await adminDb.collection(`conversations/${convDoc.id}/messages`).get();

      for (const msgDoc of messagesSnapshot.docs) {
        const msgData = msgDoc.data();
        if (msgData.content?.toLowerCase().includes(searchLower)) {
          results.push({
            conversationId: convDoc.id,
            messageId: msgDoc.id,
            senderId: msgData.senderId,
            senderName: msgData.senderName || 'Unknown',
            content: msgData.content,
            createdAt: toDate(msgData.createdAt),
            participants: participantNames,
          });
        }
      }
    }

    // Sort by date and limit
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results.slice(0, 50);
  } catch (error) {
    log.error('Error searching messages:', error);
    return [];
  }
}
