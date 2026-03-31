'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendCommunityMentionNotification } from '@/lib/email';
import { logger } from '@/lib/logger';

const log = logger.scope('actions/utils/notifications');

/**
 * AlgoVigilance Notification & Mention Utilities
 */

/**
 * Extract @mentions from content
 */
export async function extractMentions(content: string): Promise<string[]> {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const matches = content.matchAll(mentionRegex);
  const usernames = new Set<string>();
  for (const match of matches) {
    usernames.add(match[1].toLowerCase());
  }
  return Array.from(usernames);
}

/**
 * Resolve usernames to user IDs with batching optimization
 */
export async function resolveUsernamesToIds(usernames: string[]): Promise<Map<string, string>> {
  const usernameToId = new Map<string, string>();
  if (usernames.length === 0) return usernameToId;

  try {
    const BATCH_SIZE = 30;
    for (let i = 0; i < usernames.length; i += BATCH_SIZE) {
      const batch = usernames.slice(i, i + BATCH_SIZE);
      const snapshot = await adminDb.collection('users')
        .where('name', 'in', batch)
        .get();

      snapshot.docs.forEach(doc => {
        const name = doc.data().name;
        if (name) usernameToId.set(name.toLowerCase(), doc.id);
      });
    }
  } catch (error) {
    log.error('Error resolving usernames:', error);
  }
  return usernameToId;
}

/**
 * Create mention notifications (Batch optimized)
 */
export async function createMentionNotifications(input: {
  mentionedUserIds: string[];
  authorName: string;
  authorId: string;
  contentType: 'post' | 'reply';
  contentId: string;
  postId: string;
  postTitle: string;
  contentPreview?: string;
}): Promise<void> {
  const { mentionedUserIds, authorName, authorId, contentType, postId, postTitle, contentPreview } = input;
  const userIdsToNotify = mentionedUserIds.filter(id => id !== authorId);
  if (userIdsToNotify.length === 0) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://algovigilance.net';

  try {
    const userRefs = userIdsToNotify.map(id => adminDb.collection('users').doc(id));
    const userDocs = await adminDb.getAll(...userRefs);
    const batch = adminDb.batch();

    for (const doc of userDocs) {
      if (!doc.exists) continue;
      const userId = doc.id;
      const userData = doc.data();
      if (!userData) continue;
      
      const notificationsRef = adminDb.collection(`users/${userId}/notifications`).doc();
      batch.set(notificationsRef, {
        userId,
        type: 'mention',
        title: `${authorName} mentioned you`,
        message: `You were mentioned in ${contentType}: "${postTitle}"`,
        actionUrl: `/nucleus/community/circles/post/${postId}`,
        metadata: { authorId, authorName, postId, contentType },
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Fire-and-forget email
      if (userData.email && userData.preferences?.emailNotifications?.mentions !== false) {
        sendCommunityMentionNotification({
          recipientEmail: userData.email,
          recipientName: userData.name || 'there',
          authorName,
          contentType,
          postTitle,
          contentPreview: contentPreview || `You were mentioned.`,
          postUrl: `${baseUrl}/nucleus/community/circles/post/${postId}`,
        }).catch(err => log.error('Email failed', { userId, err }));
      }
    }
    await batch.commit();
  } catch (error) {
    log.error('Mention notifications failed', error);
  }
}
