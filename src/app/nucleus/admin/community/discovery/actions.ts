'use server';

import { toDate } from '@/lib/utils';
import { adminAuth, adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('discovery/actions');

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

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  circleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpotlightPost {
  id: string;
  postId: string;
  title: string;
  authorName: string;
  circleName: string;
  spotlightType: 'featured' | 'trending' | 'editors_pick';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface DiscoveryStats {
  totalCategories: number;
  activeCategories: number;
  featuredCircles: number;
  spotlightPosts: number;
  trendingTopics: number;
}

/**
 * Get discovery statistics
 */
export async function getDiscoveryStats(): Promise<DiscoveryStats> {
  try {
    await checkAdmin();

    // All four fetches are independent — run in parallel
    const [categoriesSnapshot, circlesSnapshot, spotlightSnapshot, recentPostsSnapshot] =
      await Promise.all([
        adminDb.collection('community_categories').get(),
        adminDb.collection('forums').get(),
        adminDb.collection('spotlight_posts').where('isActive', '==', true).get(),
        adminDb.collection('community_posts').orderBy('createdAt', 'desc').limit(100).get(),
      ]);

    const totalCategories = categoriesSnapshot.size;
    const activeCategories = categoriesSnapshot.docs.filter(
      (d) => d.data().isActive !== false
    ).length;
    const featuredCircles = circlesSnapshot.docs.filter(
      (d) => d.data().metadata?.isFeatured
    ).length;
    const spotlightPosts = spotlightSnapshot.size;

    // Get trending topics (simplified - count unique tags from recent posts)
    const topics = new Set<string>();
    recentPostsSnapshot.docs.forEach((d) => {
      const tags = d.data().tags || [];
      tags.forEach((tag: string) => topics.add(tag));
    });

    return {
      totalCategories,
      activeCategories,
      featuredCircles,
      spotlightPosts,
      trendingTopics: topics.size,
    };
  } catch (error) {
    log.error('Error fetching discovery stats:', error);
    return {
      totalCategories: 0,
      activeCategories: 0,
      featuredCircles: 0,
      spotlightPosts: 0,
      trendingTopics: 0,
    };
  }
}

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    await checkAdmin();

    const snapshot = await adminDb.collection('community_categories')
      .orderBy('order', 'asc')
      .get();

    const categories: Category[] = [];

    for (const categoryDoc of snapshot.docs) {
      const data = categoryDoc.data();

      // Count circles in this category
      const circlesSnapshot = await adminDb.collection('forums')
        .where('category', '==', data.slug || categoryDoc.id)
        .get();

      categories.push({
        id: categoryDoc.id,
        name: data.name || 'Unnamed',
        slug: data.slug || categoryDoc.id,
        description: data.description || '',
        icon: data.icon,
        color: data.color,
        order: data.order || 0,
        isActive: data.isActive !== false,
        circleCount: circlesSnapshot.size,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      });
    }

    return categories;
  } catch (error) {
    log.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Create a new category
 */
export async function createCategory(data: {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    await checkAdmin();

    // Check for duplicate slug and get max order in parallel (both are independent reads)
    const [existingSnapshot, categoriesSnapshot] = await Promise.all([
      adminDb.collection('community_categories').where('slug', '==', data.slug).get(),
      adminDb.collection('community_categories').get(),
    ]);

    if (!existingSnapshot.empty) {
      return { success: false, error: 'A category with this slug already exists' };
    }

    let maxOrder = 0;
    categoriesSnapshot.docs.forEach((d) => {
      const order = d.data().order || 0;
      if (order > maxOrder) maxOrder = order;
    });

    const categoryRef = adminDb.collection('community_categories').doc();
    await categoryRef.set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon || null,
      color: data.color || null,
      order: maxOrder + 1,
      isActive: true,
      createdAt: adminTimestamp.now(),
      updatedAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/discovery');
    return { success: true, id: categoryRef.id };
  } catch (error) {
    log.error('Error creating category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
    order?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    const categoryRef = adminDb.collection('community_categories').doc(categoryId);
    await categoryRef.update({
      ...data,
      updatedAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/discovery');
    return { success: true };
  } catch (error) {
    log.error('Error updating category:', error);
    return { success: false, error: 'Failed to update category' };
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(
  categoryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    // Check if any circles use this category
    const categoryDoc = await adminDb.collection('community_categories').doc(categoryId).get();
    if (!categoryDoc.exists) {
      return { success: false, error: 'Category not found' };
    }

    const categoryData = categoryDoc.data();
    const slug = categoryData?.slug;
    const circlesSnapshot = await adminDb.collection('forums')
      .where('category', '==', slug)
      .get();

    if (!circlesSnapshot.empty) {
      return {
        success: false,
        error: `Cannot delete: ${circlesSnapshot.size} circles use this category`,
      };
    }

    await adminDb.collection('community_categories').doc(categoryId).delete();

    revalidatePath('/nucleus/admin/community/discovery');
    return { success: true };
  } catch (error) {
    log.error('Error deleting category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}

/**
 * Get all spotlight posts
 */
export async function getSpotlightPosts(): Promise<SpotlightPost[]> {
  try {
    await checkAdmin();

    const snapshot = await adminDb.collection('spotlight_posts')
      .orderBy('createdAt', 'desc')
      .get();

    const posts: SpotlightPost[] = [];

    for (const spotlightDoc of snapshot.docs) {
      const data = spotlightDoc.data();

      // Get post details
      let title = 'Unknown Post';
      let authorName = 'Unknown';
      let circleName = 'Unknown';

      if (data.postId) {
        const postDoc = await adminDb.collection('community_posts').doc(data.postId).get();
        const postData = postDoc.data();
        if (postDoc.exists && postData) {
          title = postData.title || postData.content?.substring(0, 50) || 'Post';
          authorName = postData.authorName || 'Unknown';

          // Get circle name
          if (postData.forumId) {
            const circleDoc = await adminDb.collection('forums').doc(postData.forumId).get();
            const circleDocData = circleDoc.data();
            if (circleDoc.exists && circleDocData) {
              circleName = circleDocData.name || 'Unknown';
            }
          }
        }
      }

      posts.push({
        id: spotlightDoc.id,
        postId: data.postId,
        title,
        authorName,
        circleName,
        spotlightType: data.spotlightType || 'featured',
        startDate: toDate(data.startDate),
        endDate: toDateFromSerialized(data.endDate),
        isActive: data.isActive !== false,
        createdAt: toDate(data.createdAt),
      });
    }

    return posts;
  } catch (error) {
    log.error('Error fetching spotlight posts:', error);
    return [];
  }
}

/**
 * Add a post to spotlight
 */
export async function addToSpotlight(data: {
  postId: string;
  spotlightType: 'featured' | 'trending' | 'editors_pick';
  endDate?: Date;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    // Verify post exists and check if already spotlighted in parallel (both are independent reads)
    const [postDoc, existingSnapshot] = await Promise.all([
      adminDb.collection('community_posts').doc(data.postId).get(),
      adminDb.collection('spotlight_posts')
        .where('postId', '==', data.postId)
        .where('isActive', '==', true)
        .get(),
    ]);

    if (!postDoc.exists) {
      return { success: false, error: 'Post not found' };
    }

    if (!existingSnapshot.empty) {
      return { success: false, error: 'Post is already spotlighted' };
    }

    const newSpotlightRef = adminDb.collection('spotlight_posts').doc();
    await newSpotlightRef.set({
      postId: data.postId,
      spotlightType: data.spotlightType,
      startDate: adminTimestamp.now(),
      endDate: data.endDate ? adminTimestamp.fromDate(data.endDate) : null,
      isActive: true,
      createdAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/discovery');
    return { success: true };
  } catch (error) {
    log.error('Error adding to spotlight:', error);
    return { success: false, error: 'Failed to add to spotlight' };
  }
}

/**
 * Remove from spotlight
 */
export async function removeFromSpotlight(
  spotlightId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    await adminDb.collection('spotlight_posts').doc(spotlightId).update({
      isActive: false,
      updatedAt: adminTimestamp.now(),
    });

    revalidatePath('/nucleus/admin/community/discovery');
    return { success: true };
  } catch (error) {
    log.error('Error removing from spotlight:', error);
    return { success: false, error: 'Failed to remove from spotlight' };
  }
}

/**
 * Reorder categories
 */
export async function reorderCategories(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();

    const updates = orderedIds.map((id, index) =>
      adminDb.collection('community_categories').doc(id).update({
        order: index,
        updatedAt: adminTimestamp.now(),
      })
    );

    await Promise.all(updates);

    revalidatePath('/nucleus/admin/community/discovery');
    return { success: true };
  } catch (error) {
    log.error('Error reordering categories:', error);
    return { success: false, error: 'Failed to reorder categories' };
  }
}
