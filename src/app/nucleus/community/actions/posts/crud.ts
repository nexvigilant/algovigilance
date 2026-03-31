'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { CommunityPost } from '@/types/community';
import { orchestrateActivity, withTiming } from '../utils';
import { trackEngagement } from '../user/interests';
import { moderatePostContent } from '@/app/nucleus/admin/academy/learners/moderation-actions';
import { markdownToHtml } from '../utils';
import { withRateLimit } from '@/lib/rate-limit';
import { convertTimestamps } from '../utils/timestamp';

import { getAuthenticatedUser, getCurrentUserInfo } from '../utils/auth';

import { communityAnalyze } from '@/lib/nexcore-api';
import { getTenantContext } from '@/lib/platform/tenant';
import { meterCommunityAction } from '@/lib/platform/metering';

import { logger } from '@/lib/logger';
const log = logger.scope('posts/crud');

// ============================================================================
// Validation Schemas
// ============================================================================

const AttachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileSize: z.number(),
  fileType: z.enum(['image', 'document', 'pdf', 'spreadsheet', 'other']),
  mimeType: z.string(),
  uploadedAt: z.any(), // FlexibleTimestamp - Firestore Timestamp or serialized form
});

const CreatePostSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(300, 'Title too long'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content too long'),
  category: z.enum(['general', 'academy', 'careers', 'guardian', 'projects']),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed'),
  attachments: z.array(AttachmentSchema).max(5, 'Maximum 5 attachments allowed').optional(),
});

const UpdatePostSchema = z.object({
  postId: z.string(),
  title: z.string().min(5).max(300).optional(),
  content: z.string().min(10).max(10000).optional(),
  tags: z.array(z.string()).max(5).optional(),
});

// ============================================================================
// Post Operations
// ============================================================================

/**
 * Create a new community post
 */
export async function createPost(data: z.infer<typeof CreatePostSchema>) {
  return withTiming('createPost', async () => {
    try {
      // Validate input
      const validated = CreatePostSchema.parse(data);

      // Get current user
      const authUser = await getAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Not authenticated. Please sign in to post.' };
      }

      // Check rate limit
      const rateLimitResult = await withRateLimit(authUser.uid, 'posts');
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: rateLimitResult.error || 'You are posting too frequently. Please wait before posting again.',
          rateLimited: true,
          resetAt: rateLimitResult.resetAt.toISOString(),
        };
      }

      const user = await getCurrentUserInfo(authUser.uid);
      if (!user) {
        return { success: false, error: 'User profile not found' };
      }

      // Create post document
      const postRef = adminDb.collection('community_posts').doc();
      const contentHtml = await markdownToHtml(validated.content);

      // AI Content Moderation
      const moderationResult = await moderatePostContent(
        postRef.id,
        validated.content,
        user?.uid || authUser.uid,
        validated.title
      );

      // Block if auto-actioned (critical violation)
      if (
        moderationResult.autoActioned &&
        moderationResult.recommendedAction === 'auto_remove'
      ) {
        return {
          success: false,
          error:
            'Your post could not be published as it appears to violate our community guidelines. Please review and try again.',
          moderationBlocked: true,
        };
      }

      // PRPaaS: Get tenant context for multi-tenant scoping + metering
      const tenantCtx = await getTenantContext();

      const postData: Record<string, unknown> = {
        id: postRef.id,
        title: validated.title,
        content: validated.content,
        contentHtml,
        authorId: user?.uid || authUser.uid,
        authorName: user?.name || 'Anonymous',
        authorAvatar: user?.avatar || null,
        category: validated.category,
        tags: validated.tags,
        upvotes: 0,
        downvotes: 0,
        reactionCounts: {
          like: 0,
          love: 0,
          insightful: 0,
          helpful: 0,
          celebrate: 0,
        },
        replyCount: 0,
        isPinned: false,
        isLocked: false,
        isHidden: false,
        viewCount: 0,
        // PRPaaS: Tenant scoping
        tenantId: tenantCtx?.tenantId || 'default',
        visibility: 'platform',  // Default: visible across tenants
        lastActivityAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Add attachments if provided
      if (validated.attachments && validated.attachments.length > 0) {
        postData.attachments = validated.attachments;
      }

      await postRef.set(postData);

      // Unified activity orchestration (Atomic update for activity log, profile interests, and stats)
      await orchestrateActivity({
        type: 'post_created',
        metadata: {
          contentId: postRef.id,
          contentType: 'post',
          topics: validated.tags,
          category: validated.category,
        }
      });

      // PRPaaS: Meter the post creation event (fire-and-forget)
      if (tenantCtx) {
        meterCommunityAction(tenantCtx.tenantId, tenantCtx.userId, 'post_created', {
          postId: postRef.id,
          category: validated.category,
        }).catch(() => { /* metering failure never blocks user */ });
      }

      // Fire-and-forget: NexCore Rust computation (primitive extraction, PV signal detection)
      communityAnalyze(validated.content, postRef.id, validated.title)
        .then(async (analysis) => {
          if (analysis && analysis.pvRelevance > 0) {
            // Store NexCore analysis results back to Firestore for display
            await adminDb.collection('community_posts').doc(postRef.id).update({
              nexcoreAnalysis: {
                pvRelevance: analysis.pvRelevance,
                pvKeywords: analysis.pvKeywords,
                primitives: analysis.primitives,
                topics: analysis.topics,
                signalHints: analysis.signalHints,
                analyzedAt: FieldValue.serverTimestamp(),
              },
            });
            log.info(`NexCore analysis stored for post ${postRef.id}: PV relevance ${analysis.pvRelevance}`);
          }
        })
        .catch((err: unknown) => {
          log.debug('NexCore analysis skipped (non-blocking):', err);
        });

      revalidatePath('/nucleus/community/circles');
      revalidatePath(`/nucleus/community/circles/${validated.category}`);

      return {
        success: true,
        postId: postRef.id,
        message: 'Post created successfully',
      };
    } catch (error) {
      log.error('Create post error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post',
      };
    }
  }, { category: data.category });
}

/**
 * Get posts by category with cursor-based pagination
 */
export async function getPostsByCategory(
  category: string,
  options?: {
    limitCount?: number;
    cursor?: { seconds: number; nanoseconds: number } | null;
  }
): Promise<{
  success: boolean;
  posts: CommunityPost[];
  hasMore: boolean;
  nextCursor?: { seconds: number; nanoseconds: number } | null;
  error?: string;
}> {
  try {
    const limitCount = options?.limitCount || 20;

    // Build query using Admin SDK
    let q = adminDb.collection('community_posts')
      .where('category', '==', category)
      .where('isHidden', '==', false)
      .orderBy('isPinned', 'desc')
      .orderBy('lastActivityAt', 'desc');

    if (options?.cursor) {
      const cursorTimestamp = new Timestamp(
        options.cursor.seconds,
        options.cursor.nanoseconds
      );
      q = q.startAfter(cursorTimestamp);
    }

    q = q.limit(limitCount + 1);

    const snapshot = await q.get();

    // Check if there are more results
    const hasMore = snapshot.docs.length > limitCount;
    const posts = snapshot.docs
      .slice(0, limitCount)
      .map((doc) => {
        const data = doc.data();
        return convertTimestamps({
          ...data,
          id: doc.id,
        }) as CommunityPost;
      });

    // Get the cursor for the next page (last document's lastActivityAt)
    // After convertTimestamps, lastActivityAt is an ISO string, so convert it back to cursor format
    let nextCursor: { seconds: number; nanoseconds: number } | null = null;
    if (hasMore && posts.length > 0) {
      const lastPost = posts[posts.length - 1];
      const lastActivityAt = lastPost.lastActivityAt;
      if (typeof lastActivityAt === 'string') {
        // ISO string - convert to seconds
        const date = new Date(lastActivityAt);
        nextCursor = { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
      } else if (lastActivityAt && typeof lastActivityAt === 'object' && 'seconds' in lastActivityAt) {
        // Timestamp-like object
        nextCursor = {
          seconds: (lastActivityAt as { seconds: number }).seconds,
          nanoseconds: (lastActivityAt as { nanoseconds?: number }).nanoseconds || 0,
        };
      }
    }

    return { success: true, posts, hasMore, nextCursor };
  } catch (error) {
    log.error('Get posts error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
      posts: [],
      hasMore: false,
    };
  }
}

/**
 * Get single post by ID
 */
export async function getPost(
  postId: string
): Promise<{ success: boolean; post?: CommunityPost; error?: string }> {
  try {
    const postDoc = await adminDb.collection('community_posts').doc(postId).get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post not found' };
    }

    // Increment view count
    await adminDb.collection('community_posts').doc(postId).update({
      viewCount: FieldValue.increment(1),
    });

    const data = postDoc.data();
    if (!data) return { success: false, error: 'Post data unavailable' };
    const post = convertTimestamps({
      ...data,
      id: postDoc.id,
    }) as CommunityPost;

    // Track engagement for interest profiling (only for authenticated users)
    const authUser = await getAuthenticatedUser();
    if (authUser) {
      await trackEngagement({
        userId: authUser.uid,
        contentType: 'post',
        contentId: postId,
        topics: post.tags,
        category: post.category,
        engagementType: 'view',
      });
    }

    return { success: true, post };
  } catch (error) {
    log.error('Get post error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Update a post (author only)
 */
export async function updatePost(data: z.infer<typeof UpdatePostSchema>) {
  try {
    const validated = UpdatePostSchema.parse(data);
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user owns the post
    const postDoc = await adminDb.collection('community_posts').doc(validated.postId).get();
    if (!postDoc.exists) {
      return { success: false, error: 'Post not found' };
    }

    if (postDoc.data()?.authorId !== authUser.uid) {
      return { success: false, error: 'You can only edit your own posts' };
    }

    // Build update data
    const updateData: {
      updatedAt: FirebaseFirestore.FieldValue;
      title?: string;
      content?: string;
      contentHtml?: string;
      tags?: string[];
    } = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (validated.title) {
      updateData.title = validated.title;
    }

    if (validated.content) {
      updateData.content = validated.content;
      updateData.contentHtml = await markdownToHtml(validated.content);
    }

    if (validated.tags) {
      updateData.tags = validated.tags;
    }

    await adminDb.collection('community_posts').doc(validated.postId).update(updateData);

    revalidatePath(`/nucleus/community/circles/post/${validated.postId}`);

    return { success: true, message: 'Post updated successfully' };
  } catch (error) {
    log.error('Update post error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Delete a post (author only)
 */
export async function deletePost(postId: string) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user owns the post
    const postDoc = await adminDb.collection('community_posts').doc(postId).get();
    if (!postDoc.exists) {
      return { success: false, error: 'Post not found' };
    }

    if (postDoc.data()?.authorId !== authUser.uid) {
      return { success: false, error: 'You can only delete your own posts' };
    }

    await adminDb.collection('community_posts').doc(postId).delete();

    // Decrement user's denormalized postCount
    await adminDb.collection('users').doc(authUser.uid).update({
      'stats.postCount': FieldValue.increment(-1),
    });

    revalidatePath('/nucleus/community/circles');

    return { success: true, message: 'Post deleted successfully' };
  } catch (error) {
    log.error('Delete post error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Search posts across all categories
 */
export async function searchPosts(
  searchTerm: string,
  limitCount = 20
): Promise<{ success: boolean; posts: CommunityPost[]; error?: string }> {
  try {
    // Simple search by title (for MVP)
    // For production, consider using Algolia or Firestore full-text search
    let q = adminDb.collection('community_posts')
      .where('isHidden', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(100);

    const snapshot = await q.get();
    const allPosts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return convertTimestamps({
        ...data,
        id: doc.id,
      }) as CommunityPost;
    });

    // Filter by search term (case-insensitive)
    const searchLower = searchTerm.toLowerCase();
    const filteredPosts = allPosts
      .filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          post.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      )
      .slice(0, limitCount);

    return { success: true, posts: filteredPosts };
  } catch (error) {
    log.error('Search posts error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch forum categories',
      posts: [],
    };
  }
}
