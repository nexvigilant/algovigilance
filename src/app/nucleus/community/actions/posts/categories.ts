'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { ForumCategory, CommunityPost } from '@/types/community';

import { logger } from '@/lib/logger';
const log = logger.scope('posts/categories');

// ============================================================================
// Category Operations
// ============================================================================

/**
 * Get all forum categories with stats
 */
export async function getForumCategories(): Promise<{
  success: boolean;
  categories: ForumCategory[];
}> {
  const categories = [
    {
      id: 'general',
      name: 'General Discussion',
      description: 'Open discussions, introductions, and community chat',
      icon: '📢',
    },
    {
      id: 'academy',
      name: 'Academy',
      description:
        'Capability Pathway questions, learning help, and educational discussions',
      icon: '🎓',
    },
    {
      id: 'careers',
      name: 'Careers',
      description: 'Job seeking, career transitions, and professional advice',
      icon: '💼',
    },
    {
      id: 'guardian',
      name: 'Guardian',
      description:
        'Patient safety, drug safety insights, and safety monitoring',
      icon: '🛡️',
    },
    {
      id: 'projects',
      name: 'Projects & Collaboration',
      description: 'Work together on real projects and initiatives',
      icon: '🚀',
    },
  ];

  try {
    const categoryIds = categories.map((c) => c.id);

    // Batch 1: Fetch recent posts for all categories in single query
    // Then group by category to find latest per category
    const recentPostsSnapshot = await adminDb
      .collection('community_posts')
      .where('category', 'in', categoryIds)
      .where('isHidden', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(50) // Enough to capture latest from each category
      .get();

    // Group posts by category, taking first (latest) from each
    const latestPostByCategory = new Map<string, CommunityPost>();
    for (const doc of recentPostsSnapshot.docs) {
      const post = doc.data() as CommunityPost;
      if (!latestPostByCategory.has(post.category)) {
        latestPostByCategory.set(post.category, post);
      }
    }

    // Batch 2: Get counts in parallel (Firestore doesn't support batch count())
    // Note: This map is intentional - reduced from 2N to N+1 queries by batching latest posts above
    const countResults = await Promise.all(
      categories.map(async (category) => {
        const countSnapshot = await adminDb
          .collection('community_posts')
          .where('category', '==', category.id)
          .where('isHidden', '==', false)
          .count()
          .get();
        return { id: category.id, count: countSnapshot.data().count };
      })
    );

    const countByCategory = new Map(countResults.map((r) => [r.id, r.count]));

    // Combine data
    const categoriesWithStats = categories.map((category) => ({
      ...category,
      postCount: countByCategory.get(category.id) || 0,
      latestPost: latestPostByCategory.get(category.id) || null,
    }));

    return { success: true, categories: categoriesWithStats };
  } catch (error) {
    log.error('Get categories error:', error);
    // Return categories with zero counts on error
    return {
      success: true,
      categories: categories.map((cat) => ({
        ...cat,
        postCount: 0,
        latestPost: null,
      })),
    };
  }
}
