'use server';

import { toDate } from '@/lib/utils';
import { adminAuth, adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { CommunityPost, PostId } from '@/types/community';

import { logger } from '@/lib/logger';
const log = logger.scope('posts/actions');
const POSTS_LIST_LIMIT = 100;
const WEEK_DAYS = 7;
const TOP_POSTS_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 10;
const ADMIN_HISTORY_LIMIT = 50;

// Check if user is admin - verifies session AND role
async function checkAdmin() {
  // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Session validation and role lookup must execute in order.
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

export interface PostWithAuthor extends CommunityPost {
  authorEmail?: string;
}

export interface PostFilters {
  category?: string;
  status?: 'all' | 'visible' | 'hidden' | 'pinned' | 'locked';
  search?: string;
  sortBy?: 'recent' | 'popular' | 'replies' | 'views';
  dateRange?: 'all' | 'today' | 'week' | 'month';
}

export interface PostAnalytics {
  totalPosts: number;
  totalViews: number;
  totalReactions: number;
  totalReplies: number;
  postsToday: number;
  postsThisWeek: number;
  categoryDistribution: Record<string, number>;
  topPosts: Array<{
    id: string;
    title: string;
    views: number;
    reactions: number;
    replies: number;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    authorName: string;
    createdAt: Date;
    category: string;
  }>;
}

export interface PostAdminHistoryEntry {
  id: string;
  type: string;
  postId: string;
  postTitle?: string;
  adminName: string;
  reason?: string;
  createdAt: Date;
}

/**
 * Get all posts with filters for admin
 */
export async function getAllPostsAdmin(
  filters: PostFilters = {}
): Promise<PostWithAuthor[]> {
  try {
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Authorization must complete before querying protected collections.
    await checkAdmin();

    let postsQuery: FirebaseFirestore.Query = adminDb.collection('community_posts');

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      postsQuery = postsQuery.where('category', '==', filters.category);
    }

    // Apply status filter
    if (filters.status) {
      switch (filters.status) {
        case 'hidden':
          postsQuery = postsQuery.where('isHidden', '==', true);
          break;
        case 'visible':
          postsQuery = postsQuery.where('isHidden', '==', false);
          break;
        case 'pinned':
          postsQuery = postsQuery.where('isPinned', '==', true);
          break;
        case 'locked':
          postsQuery = postsQuery.where('isLocked', '==', true);
          break;
      }
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - WEEK_DAYS));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }

      postsQuery = postsQuery.where('createdAt', '>=', adminTimestamp.fromDate(startDate));
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'popular':
        postsQuery = postsQuery.orderBy('viewCount', 'desc');
        break;
      case 'replies':
        postsQuery = postsQuery.orderBy('replyCount', 'desc');
        break;
      case 'views':
        postsQuery = postsQuery.orderBy('viewCount', 'desc');
        break;
      default:
        postsQuery = postsQuery.orderBy('createdAt', 'desc');
    }

    // Limit results
    postsQuery = postsQuery.limit(POSTS_LIST_LIMIT);

    const snapshot = await postsQuery.get();
    const posts = await Promise.all(
      snapshot.docs.map(async (postDoc): Promise<PostWithAuthor> => {
        const postData = postDoc.data() as CommunityPost;

        // Get author email
        const userDoc = await adminDb.collection('users').doc(postData.authorId).get();
        const authorEmail = userDoc.exists ? userDoc.data()?.email : undefined;

        return {
          ...postData,
          id: postDoc.id as PostId,
          authorEmail,
        };
      })
    );

    // Apply search filter (client-side for now)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          post.authorName.toLowerCase().includes(searchLower)
      );
    }

    return posts;
  } catch (error) {
    log.error('Error fetching posts:', error);
    throw new Error('Failed to fetch posts');
  }
}

/**
 * Get post analytics for admin dashboard
 */
export async function getPostAnalytics(): Promise<PostAnalytics> {
  try {
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Authorization must complete before querying protected collections.
    await checkAdmin();

    const snapshot = await adminDb.collection('community_posts').get();

    let totalViews = 0;
    let totalReactions = 0;
    let totalReplies = 0;
    let postsToday = 0;
    let postsThisWeek = 0;
    const categoryCount: Record<string, number> = {};
    const allPosts: Array<{
      id: string;
      title: string;
      views: number;
      reactions: number;
      replies: number;
      authorName: string;
      createdAt: Date;
      category: string;
    }> = [];

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - WEEK_DAYS);

    for (const postDoc of snapshot.docs) {
      const post = postDoc.data() as CommunityPost;
      const createdAt = toDate(post.createdAt);

      // Aggregate stats
      totalViews += post.viewCount || 0;
      totalReplies += post.replyCount || 0;

      // Sum reactions
      const reactions = Object.values(post.reactionCounts || {}).reduce(
        (sum, count) => sum + count,
        0
      );
      totalReactions += reactions;

      // Category distribution
      categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;

      // Time-based counts
      if (createdAt >= todayStart) {
        postsToday++;
      }
      if (createdAt >= weekStart) {
        postsThisWeek++;
      }

      allPosts.push({
        id: postDoc.id,
        title: post.title,
        views: post.viewCount || 0,
        reactions,
        replies: post.replyCount || 0,
        authorName: post.authorName,
        createdAt,
        category: post.category,
      });
    }

    // Sort for top posts (by views + reactions)
    const topPosts = [...allPosts]
      .sort((a, b) => b.views + b.reactions - (a.views + a.reactions))
      .slice(0, TOP_POSTS_LIMIT)
      .map(({ id, title, views, reactions, replies }) => ({
        id,
        title,
        views,
        reactions,
        replies,
      }));

    // Sort for recent activity
    const recentActivity = [...allPosts]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, RECENT_ACTIVITY_LIMIT)
      .map(({ id, title, authorName, createdAt, category }) => ({
        id,
        title,
        authorName,
        createdAt,
        category,
      }));

    return {
      totalPosts: snapshot.size,
      totalViews,
      totalReactions,
      totalReplies,
      postsToday,
      postsThisWeek,
      categoryDistribution: categoryCount,
      topPosts,
      recentActivity,
    };
  } catch (error) {
    log.error('Error fetching post analytics:', error);
    throw new Error('Failed to fetch analytics');
  }
}

/**
 * Toggle post pinned status
 */
export async function togglePostPinned(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Read-modify-write with audit logging is intentionally ordered.
    await checkAdmin();

    const postRef = adminDb.collection('community_posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post not found' };
    }

    const currentPinned = postDoc.data()?.isPinned || false;

    await postRef.update({
      isPinned: !currentPinned,
      updatedAt: adminTimestamp.now(),
    });

    // Log admin action
    await adminDb.collection('post_admin_actions').add({
      type: currentPinned ? 'unpin' : 'pin',
      postId,
      createdAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/posts');
    return { success: true };
  } catch (error) {
    log.error('Error toggling pin:', error);
    return { success: false, error: 'Failed to toggle pin status' };
  }
}

/**
 * Toggle post locked status
 */
export async function togglePostLocked(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Read-modify-write with audit logging is intentionally ordered.
    await checkAdmin();

    const postRef = adminDb.collection('community_posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post not found' };
    }

    const currentLocked = postDoc.data()?.isLocked || false;

    await postRef.update({
      isLocked: !currentLocked,
      updatedAt: adminTimestamp.now(),
    });

    await adminDb.collection('post_admin_actions').add({
      type: currentLocked ? 'unlock' : 'lock',
      postId,
      createdAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/posts');
    return { success: true };
  } catch (error) {
    log.error('Error toggling lock:', error);
    return { success: false, error: 'Failed to toggle lock status' };
  }
}

/**
 * Toggle post hidden status
 */
export async function togglePostHidden(
  postId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Read-modify-write with audit logging is intentionally ordered.
    const admin = await checkAdmin();

    const postRef = adminDb.collection('community_posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post not found' };
    }

    const currentHidden = postDoc.data()?.isHidden || false;

    await postRef.update({
      isHidden: !currentHidden,
      updatedAt: adminTimestamp.now(),
    });

    await adminDb.collection('post_admin_actions').add({
      type: currentHidden ? 'unhide' : 'hide',
      postId,
      adminId: admin.uid,
      reason: reason || (currentHidden ? 'Restored by admin' : 'Hidden by admin'),
      createdAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/posts');
    return { success: true };
  } catch (error) {
    log.error('Error toggling hidden:', error);
    return { success: false, error: 'Failed to toggle visibility' };
  }
}

/**
 * Delete a post permanently
 */
export async function deletePostAdmin(
  postId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Read-modify-write with audit logging is intentionally ordered.
    const admin = await checkAdmin();

    const postRef = adminDb.collection('community_posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return { success: false, error: 'Post not found' };
    }

    // Keep audit log and deletion in one atomic commit.
    const batch = adminDb.batch();
    const actionRef = adminDb.collection('post_admin_actions').doc();
    batch.set(actionRef, {
      type: 'delete',
      postId,
      postTitle: postDoc.data()?.title,
      adminId: admin.uid,
      reason,
      createdAt: adminTimestamp.now(),
    });
    batch.delete(postRef);
    await batch.commit();

    revalidatePath('/nucleus/admin/community/posts');
    return { success: true };
  } catch (error) {
    log.error('Error deleting post:', error);
    return { success: false, error: 'Failed to delete post' };
  }
}

/**
 * Bulk action on multiple posts
 */
export async function bulkPostAction(
  postIds: string[],
  action: 'hide' | 'unhide' | 'delete' | 'pin' | 'unpin' | 'lock' | 'unlock',
  reason?: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Authorization and batch mutation must remain ordered.
    const admin = await checkAdmin();
    const batch = adminDb.batch();
    let count = 0;
    const now = adminTimestamp.now();

    const postRefs = postIds.map((postId) =>
      adminDb.collection('community_posts').doc(postId)
    );
    const postDocs = await Promise.all(postRefs.map((postRef) => postRef.get()));

    for (const [index, postDoc] of postDocs.entries()) {
      if (!postDoc.exists) continue;

      const postRef = postRefs[index];
      switch (action) {
        case 'hide':
          batch.update(postRef, { isHidden: true, updatedAt: now });
          break;
        case 'unhide':
          batch.update(postRef, { isHidden: false, updatedAt: now });
          break;
        case 'pin':
          batch.update(postRef, { isPinned: true, updatedAt: now });
          break;
        case 'unpin':
          batch.update(postRef, { isPinned: false, updatedAt: now });
          break;
        case 'lock':
          batch.update(postRef, { isLocked: true, updatedAt: now });
          break;
        case 'unlock':
          batch.update(postRef, { isLocked: false, updatedAt: now });
          break;
        case 'delete':
          batch.delete(postRef);
          break;
      }

      count++;
    }

    await batch.commit();

    // Log bulk action
    await adminDb.collection('post_admin_actions').add({
      type: `bulk_${action}`,
      postIds,
      adminId: admin.uid,
      reason: reason || `Bulk ${action}`,
      count,
      createdAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/posts');
    return { success: true, count };
  } catch (error) {
    log.error('Error in bulk action:', error);
    return { success: false, count: 0, error: 'Failed to perform bulk action' };
  }
}

/**
 * Get admin action history for posts
 */
export async function getPostAdminHistory(): Promise<PostAdminHistoryEntry[]> {
  try {
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Authorization must complete before querying protected collections.
    await checkAdmin();

    const snapshot = await adminDb
      .collection('post_admin_actions')
      .orderBy('createdAt', 'desc')
      .limit(ADMIN_HISTORY_LIMIT)
      .get();

    const history = await Promise.all(
      snapshot.docs.map(async (actionDoc): Promise<PostAdminHistoryEntry> => {
        const action = actionDoc.data();
        const storedPostTitle = action.postTitle as string | undefined;

        const [adminDoc, postDoc] = await Promise.all([
          action.adminId
            ? adminDb.collection('users').doc(action.adminId).get()
            : Promise.resolve(null),
          !storedPostTitle && action.postId
            ? adminDb.collection('community_posts').doc(action.postId).get()
            : Promise.resolve(null),
        ]);

        let adminName = 'Admin';
        if (adminDoc?.exists) {
          const adminData = adminDoc.data();
          adminName = adminData?.displayName || adminData?.name || 'Admin';
        }

        let postTitle = storedPostTitle;
        if (!postTitle && postDoc?.exists) {
          postTitle = postDoc.data()?.title;
        }

        return {
          id: actionDoc.id,
          type: action.type,
          postId: action.postId ?? '',
          postTitle,
          adminName,
          reason: action.reason,
          createdAt: toDate(action.createdAt),
        };
      })
    );

    return history;
  } catch (error) {
    log.error('Error fetching admin history:', error);
    return [];
  }
}

/**
 * Feature a post (pin to top of category)
 */
export async function featurePost(
  postId: string,
  featured: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Read-modify-write with audit logging is intentionally ordered.
    await checkAdmin();

    const postRef = adminDb.collection('community_posts').doc(postId);
    await postRef.update({
      isFeatured: featured,
      featuredAt: featured ? adminTimestamp.now() : null,
      updatedAt: adminTimestamp.now(),
    });

    await adminDb.collection('post_admin_actions').add({
      type: featured ? 'feature' : 'unfeature',
      postId,
      createdAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/posts');
    return { success: true };
  } catch (error) {
    log.error('Error featuring post:', error);
    return { success: false, error: 'Failed to update featured status' };
  }
}
