'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Reply } from '@/types/community';
import { orchestrateActivity, getAuthenticatedUser, getCurrentUserInfo } from '../utils';
import { moderateCommentContent } from '@/app/nucleus/admin/academy/learners/moderation-actions';
import {
  markdownToHtml,
  extractMentions,
  resolveUsernamesToIds,
  createMentionNotifications,
} from '../utils';
import { withRateLimit } from '@/lib/rate-limit';
import { sendCommunityReplyNotification } from '@/lib/email';

import { logger } from '@/lib/logger';
const log = logger.scope('posts/replies');

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateReplySchema = z.object({
  postId: z.string(),
  content: z
    .string()
    .min(1, 'Reply cannot be empty')
    .max(5000, 'Reply too long'),
  parentReplyId: z.string().optional(),
});

// ============================================================================
// Reply Operations
// ============================================================================

/**
 * Get replies for a post
 */
export async function getReplies(
  postId: string
): Promise<{ success: boolean; replies: Reply[]; error?: string }> {
  try {
    const snapshot = await adminDb
      .collection('community_posts')
      .doc(postId)
      .collection('replies')
      .orderBy('createdAt', 'asc')
      .get();

    const replies = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Reply;
    }).filter((reply) => !reply.isHidden);

    return { success: true, replies };
  } catch (error) {
    log.error('Get replies error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch replies',
      replies: [],
    };
  }
}

/**
 * Create a reply to a post
 */
export async function createReply(data: z.infer<typeof CreateReplySchema>) {
  try {
    // Validate input
    const validated = CreateReplySchema.parse(data);

    // Get current user
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return { success: false, error: 'Not authenticated. Please sign in to reply.' };
    }

    // Check rate limit
    const rateLimitResult = await withRateLimit(authUser.uid, 'replies');
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.error || 'You are replying too frequently. Please wait before posting another reply.',
        rateLimited: true,
      };
    }

    const user = await getCurrentUserInfo(authUser.uid);
    if (!user) {
      return { success: false, error: 'User profile not found' };
    }

    // Check if post exists and is not locked
    const postDoc = await adminDb.collection('community_posts').doc(validated.postId).get();
    if (!postDoc.exists) {
      return { success: false, error: 'Post not found' };
    }

    if (postDoc.data()?.isLocked) {
      return {
        success: false,
        error: 'This post is locked and cannot receive replies',
      };
    }

    // Create reply document
    const replyRef = adminDb
      .collection('community_posts')
      .doc(validated.postId)
      .collection('replies')
      .doc();
    const contentHtml = await markdownToHtml(validated.content);

    // AI Content Moderation
    const moderationResult = await moderateCommentContent(
      replyRef.id,
      validated.content,
      user?.uid || authUser.uid,
      validated.postId
    );

    // Block if auto-actioned (critical violation)
    if (
      moderationResult.autoActioned &&
      moderationResult.recommendedAction === 'auto_remove'
    ) {
      return {
        success: false,
        error:
          'Your reply could not be posted as it appears to violate our community guidelines. Please review and try again.',
        moderationBlocked: true,
      };
    }

    // Extract and resolve mentions
    const mentionedUsernames = await extractMentions(validated.content);
    const usernameToId = await resolveUsernamesToIds(mentionedUsernames);
    const mentionedUserIds = Array.from(usernameToId.values());

    const replyData = {
      id: replyRef.id,
      postId: validated.postId,
      content: validated.content,
      contentHtml,
      authorId: user?.uid || authUser.uid,
      authorName: user?.name || 'Anonymous',
      authorAvatar: user?.avatar || null,
      parentReplyId: validated.parentReplyId || null,
      upvotes: 0,
      downvotes: 0,
      reactionCounts: {
        like: 0,
        love: 0,
        insightful: 0,
        helpful: 0,
        celebrate: 0,
      },
      isAcceptedAnswer: false,
      isHidden: false,
      mentions: mentionedUserIds,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await replyRef.set(replyData);

    // Update post reply count and last activity
    await adminDb.collection('community_posts').doc(validated.postId).update({
      replyCount: FieldValue.increment(1),
      lastActivityAt: FieldValue.serverTimestamp(),
    });

    // Unified Activity Orchestration
    const postData = postDoc.data();
    await orchestrateActivity({
      type: 'reply_created',
      metadata: {
        contentId: replyRef.id,
        contentType: 'reply',
        postId: validated.postId,
        topics: postData?.tags || [],
        category: postData?.category,
      }
    });

    // Send mention notifications (with email)
    if (mentionedUserIds.length > 0) {
      await createMentionNotifications({
        mentionedUserIds,
        authorName: user?.name || 'Anonymous',
        authorId: user?.uid || authUser.uid,
        contentType: 'reply',
        contentId: replyRef.id,
        postId: validated.postId,
        postTitle: postData?.title || 'a post',
        contentPreview: validated.content,
      });
    }

    // Notify post author of the reply (if they're not the one replying)
    const postAuthorId = postData?.authorId;
    if (postAuthorId && postAuthorId !== (user?.uid || authUser.uid)) {
      try {
        // Create in-app notification
        await adminDb
          .collection('users')
          .doc(postAuthorId)
          .collection('notifications')
          .add({
            type: 'reply',
            title: 'New reply to your post',
            message: `${user?.name || 'Someone'} replied to "${postData?.title || 'your post'}"`,
            actionUrl: `/nucleus/community/circles/post/${validated.postId}`,
            metadata: {
              postId: validated.postId,
              replyId: replyRef.id,
              authorId: user?.uid || authUser.uid,
              authorName: user?.name || 'Anonymous',
            },
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });

        // Send email notification
        const postAuthorDoc = await adminDb.collection('users').doc(postAuthorId).get();
        const postAuthorData = postAuthorDoc.data();
        const postAuthorEmail = postAuthorData?.email;
        const emailEnabled = postAuthorData?.preferences?.emailNotifications?.replies !== false; // Default to true

        if (postAuthorEmail && emailEnabled) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://algovigilance.net';
          // Fire and forget - don't block on email sending
          sendCommunityReplyNotification({
            recipientEmail: postAuthorEmail,
            recipientName: postAuthorData?.name || postAuthorData?.displayName || 'there',
            authorName: user?.name || 'Someone',
            postTitle: postData?.title || 'your post',
            replyPreview: validated.content,
            postUrl: `${baseUrl}/nucleus/community/circles/post/${validated.postId}`,
          }).catch((emailError) => {
            log.error(`Error sending reply email to post author ${postAuthorId}:`, emailError);
          });
        }
      } catch (notifyError) {
        // Don't fail the reply creation if notification fails
        log.error('Error notifying post author of reply:', notifyError);
      }
    }

    revalidatePath(`/nucleus/community/circles/post/${validated.postId}`);

    return {
      success: true,
      replyId: replyRef.id,
      message: 'Reply posted successfully',
    };
  } catch (error) {
    log.error('Create reply error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Delete a reply (author only)
 */
export async function deleteReply(postId: string, replyId: string) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user owns the reply
    const replyDoc = await adminDb
      .collection('community_posts')
      .doc(postId)
      .collection('replies')
      .doc(replyId)
      .get();

    if (!replyDoc.exists) {
      return { success: false, error: 'Reply not found' };
    }

    if (replyDoc.data()?.authorId !== user.uid) {
      return { success: false, error: 'You can only delete your own replies' };
    }

    await adminDb
      .collection('community_posts')
      .doc(postId)
      .collection('replies')
      .doc(replyId)
      .delete();

    // Update post reply count
    await adminDb.collection('community_posts').doc(postId).update({
      replyCount: FieldValue.increment(-1),
    });

    revalidatePath(`/nucleus/community/circles/post/${postId}`);

    return { success: true, message: 'Reply deleted successfully' };
  } catch (error) {
    log.error('Delete reply error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}
