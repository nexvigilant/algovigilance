'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { CommunityPost } from '@/types/community';
import { trackEngagement } from '../user/interests';

import { logger } from '@/lib/logger';
const log = logger.scope('discovery/search');

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

export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  status?: 'all' | 'solved' | 'unsolved';
  sortBy?:
    | 'newest'
    | 'oldest'
    | 'most_replies'
    | 'most_views'
    | 'most_reactions';
  limitCount?: number;
}

export interface SearchResult {
  posts: CommunityPost[];
  total: number;
}

/**
 * Search posts with advanced filters (discovery module)
 * Note: Renamed from searchPosts to avoid collision with posts/crud.ts
 */
export async function searchPostsWithFilters(
  filters: SearchFilters
): Promise<SearchResult> {
  try {
    const {
      query: searchQuery,
      category,
      tags,
      status,
      sortBy = 'newest',
      limitCount = 20,
    } = filters;

    let postsQuery: FirebaseFirestore.Query = adminDb.collection('community_posts');

    // Category filter
    if (category) {
      postsQuery = postsQuery.where('category', '==', category);
    }

    // Status filter (solved/unsolved)
    if (status === 'solved') {
      postsQuery = postsQuery.where('solved', '==', true);
    } else if (status === 'unsolved') {
      postsQuery = postsQuery.where('solved', '==', false);
    }

    // Tags filter (array-contains can only be used once, so we filter for first tag)
    if (tags && tags.length > 0) {
      postsQuery = postsQuery.where('tags', 'array-contains', tags[0]);
    }

    // Sorting
    switch (sortBy) {
      case 'oldest':
        postsQuery = postsQuery.orderBy('createdAt', 'asc');
        break;
      case 'most_replies':
        postsQuery = postsQuery.orderBy('replyCount', 'desc');
        break;
      case 'most_views':
        postsQuery = postsQuery.orderBy('viewCount', 'desc');
        break;
      case 'most_reactions':
        postsQuery = postsQuery.orderBy('reactionCount', 'desc');
        break;
      case 'newest':
      default:
        postsQuery = postsQuery.orderBy('createdAt', 'desc');
        break;
    }

    // Limit results
    postsQuery = postsQuery.limit(limitCount);

    // Execute query
    const querySnapshot = await postsQuery.get();

    let posts: CommunityPost[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CommunityPost[];

    // Client-side filtering for text search (Firestore doesn't support full-text search natively)
    if (searchQuery && searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      posts = posts.filter((post) => {
        const titleMatch = post.title.toLowerCase().includes(queryLower);
        const contentMatch = post.contentHtml
          .toLowerCase()
          .includes(queryLower);
        return titleMatch || contentMatch;
      });
    }

    // Client-side filtering for multiple tags (after array-contains query)
    if (tags && tags.length > 1) {
      posts = posts.filter((post) => {
        return tags.every((tag) => post.tags?.includes(tag));
      });
    }

    // Track search engagement for interest profiling (only for authenticated users)
    const user = await getAuthenticatedUser();
    if (user && (searchQuery || tags || category)) {
      await trackEngagement({
        userId: user.uid,
        contentType: 'search',
        contentId: `search-${Date.now()}`, // Unique ID for search event
        topics: tags || [],
        category,
        engagementType: 'search',
      });
    }

    return {
      posts,
      total: posts.length,
    };
  } catch (error) {
    log.error('Error searching posts:', error);
    return { posts: [], total: 0 };
  }
}

/**
 * Get all unique tags from posts (for autocomplete)
 */
export async function getAllTags(): Promise<string[]> {
  try {
    const querySnapshot = await adminDb
      .collection('community_posts')
      .limit(100)
      .get();

    const tagsSet = new Set<string>();
    querySnapshot.docs.forEach((doc) => {
      const post = doc.data() as CommunityPost;
      if (post.tags) {
        post.tags.forEach((tag) => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  } catch (error) {
    log.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Get all unique categories from posts
 */
export async function getAllCategories(): Promise<string[]> {
  try {
    const querySnapshot = await adminDb
      .collection('community_posts')
      .limit(100)
      .get();

    const categoriesSet = new Set<string>();
    querySnapshot.docs.forEach((doc) => {
      const post = doc.data() as CommunityPost;
      if (post.category) {
        categoriesSet.add(post.category);
      }
    });

    return Array.from(categoriesSet).sort();
  } catch (error) {
    log.error('Error fetching categories:', error);
    return [];
  }
}
