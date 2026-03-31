'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { SmartForum, FlexibleTimestamp } from '@/types/community';
import type { ForumId, CommunityUserId } from '@/types/community/branded-ids';
import { trackEngagement } from '../user/interests';
import { convertTimestamps } from '../utils/timestamp';
import { withRateLimit } from '@/lib/rate-limit';

import { logger } from '@/lib/logger';
const log = logger.scope('forums/crud');

/**
 * Helper to get authenticated user from session cookie
 */
async function getAuthenticatedUser() {
  const token = (await cookies()).get('nucleus_id_token')?.value;
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch (error) {
    log.warn('Token verification failed', { error });
    return null;
  }
}


/**
 * Forum creation schema
 */
const CreateForumSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required').max(10),
  visibility: z.enum(['public', 'members-only', 'private']).default('public'),
  joinType: z.enum(['open', 'request', 'invite-only']).default('open'),
  requestForm: z
    .object({
      enabled: z.boolean(),
      questions: z.array(
        z.object({
          id: z.string(),
          type: z.enum(['text', 'textarea', 'select', 'multiselect']),
          label: z.string(),
          placeholder: z.string().optional(),
          required: z.boolean(),
          options: z.array(z.string()).optional(),
        })
      ),
      introMessage: z.string().optional(),
    })
    .optional(),
});

export type CreateForumInput = z.infer<typeof CreateForumSchema>;

/**
 * Forum filters for directory
 */
export interface ForumFilters {
  category?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'newest' | 'popular' | 'active' | 'members';
  visibility?: 'public' | 'members-only';
  limitCount?: number;
}

/**
 * Create a new forum
 */
export async function createForum(
  input: CreateForumInput
): Promise<{ success: boolean; forumId?: string; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Rate limit check (3 forums per day)
    const rateLimitResult = await withRateLimit(user.uid, 'forum_create');
    if (!rateLimitResult.allowed) {
      log.warn('Forum creation rate limit exceeded', { userId: user.uid });
      return { success: false, error: rateLimitResult.error || 'You can only create 3 forums per day. Please try again later.' };
    }

    // Validate input
    const validated = CreateForumSchema.parse(input);

    // Create forum document using Admin SDK
    const forumRef = adminDb.collection('forums').doc();
    const forumData: SmartForum = {
      id: forumRef.id as ForumId,
      name: validated.name,
      description: validated.description,
      category: validated.category,
      tags: validated.tags,
      type:
        validated.visibility === 'members-only'
          ? 'semi-private'
          : validated.visibility,
      aiGenerated: false,
      createdBy: user.uid as CommunityUserId,
      createdAt: FieldValue.serverTimestamp() as unknown as FlexibleTimestamp,
      membership: {
        memberIds: [user.uid as CommunityUserId], // Creator is first member
        moderatorIds: [user.uid as CommunityUserId], // Creator is moderator
        memberCount: 1,
        joinType: validated.joinType,
        pendingRequests: [], // No pending requests initially
        // Include request form if provided
        ...(validated.requestForm && {
          requestForm: validated.requestForm,
        }),
      },
      stats: {
        postCount: 0,
        activeMembers: 1,
        avgResponseTime: 0,
        activityLevel: 'low',
        weeklyGrowth: 0,
      },
      intelligence: {
        keyThemes: validated.tags,
        targetAudience: [],
        similarForums: [],
        qualityScore: 0,
      },
      status: 'active', // Default status
      authority: 'community',
      metadata: {
        isPinned: false,
        isFeatured: false,
        isArchived: false,
      },
      updatedAt: FieldValue.serverTimestamp() as unknown as FlexibleTimestamp,
    };

    await forumRef.set(forumData);

    // Track forum creation for interest profiling
    await trackEngagement({
      userId: user.uid,
      contentType: 'forum',
      contentId: forumRef.id,
      topics: validated.tags,
      category: validated.category,
      engagementType: 'create',
    });

    return { success: true, forumId: forumRef.id };
  } catch (error) {
    log.error('Error creating forum:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create forum',
    };
  }
}

/**
 * Get all forums with filters
 */
export async function getForums(filters: ForumFilters = {}): Promise<{
  success: boolean;
  forums?: SmartForum[];
  total?: number;
  error?: string;
}> {
  try {
    const {
      category,
      tags,
      search,
      sortBy = 'popular',
      visibility,
      limitCount = 50,
    } = filters;

    // Use Admin SDK for server-side reads
    let forumsQuery = adminDb.collection('forums').where('status', '==', 'active');

    // Category filter
    if (category) {
      forumsQuery = forumsQuery.where('category', '==', category);
    }

    // Visibility filter
    if (visibility) {
      forumsQuery = forumsQuery.where('visibility', '==', visibility);
    }

    // Tag filter (Firestore array-contains)
    if (tags && tags.length > 0) {
      forumsQuery = forumsQuery.where('tags', 'array-contains', tags[0]);
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        forumsQuery = forumsQuery.orderBy('createdAt', 'desc');
        break;
      case 'popular':
        forumsQuery = forumsQuery.orderBy('membership.memberCount', 'desc');
        break;
      case 'active':
        forumsQuery = forumsQuery.orderBy('stats.activityLevel', 'desc');
        break;
      case 'members':
        forumsQuery = forumsQuery.orderBy('membership.memberCount', 'desc');
        break;
    }

    forumsQuery = forumsQuery.limit(limitCount);

    const querySnapshot = await forumsQuery.get();

    let forums = querySnapshot.docs.map((doc) => convertTimestamps({
      id: doc.id,
      ...doc.data(),
    })) as SmartForum[];

    // Client-side filtering for search and multiple tags
    if (search) {
      const searchLower = search.toLowerCase();
      forums = forums.filter(
        (forum) =>
          forum.name.toLowerCase().includes(searchLower) ||
          forum.description.toLowerCase().includes(searchLower)
      );
    }

    if (tags && tags.length > 1) {
      forums = forums.filter((forum) =>
        tags.every((tag) => forum.tags?.includes(tag))
      );
    }

    return {
      success: true,
      forums,
      total: forums.length,
    };
  } catch (error) {
    log.error('Error fetching forums:', error);
    return { success: false, error: 'Failed to fetch forums' };
  }
}

/**
 * Get a single forum by ID
 */
export async function getForum(
  forumId: string
): Promise<{ success: boolean; forum?: SmartForum; error?: string }> {
  try {
    // Use Admin SDK for server-side reads
    const forumRef = adminDb.collection('forums').doc(forumId);
    const forumDoc = await forumRef.get();

    if (!forumDoc.exists) {
      return { success: false, error: 'Forum not found' };
    }

    const forum = convertTimestamps({ id: forumDoc.id, ...forumDoc.data() }) as SmartForum;

    // Track forum view for interest profiling
    const user = await getAuthenticatedUser();
    if (user) {
      await trackEngagement({
        userId: user.uid,
        contentType: 'forum',
        contentId: forumId,
        topics: forum.tags || [],
        category: forum.category,
        engagementType: 'view',
      });
    }

    return { success: true, forum };
  } catch (error) {
    log.error('Error fetching forum:', error);
    return { success: false, error: 'Failed to fetch forum' };
  }
}

/**
 * Update forum settings
 */
export async function updateForum(
  forumId: string,
  updates: Partial<SmartForum>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use Admin SDK for server-side operations
    const forumRef = adminDb.collection('forums').doc(forumId);
    const forumDoc = await forumRef.get();

    if (!forumDoc.exists) {
      return { success: false, error: 'Forum not found' };
    }

    const forum = forumDoc.data() as SmartForum;
    // Check if user is creator or moderator
    if (
      forum.createdBy !== (user.uid as CommunityUserId) &&
      !forum.membership?.moderatorIds?.includes(user.uid as CommunityUserId)
    ) {
      return { success: false, error: 'Not authorized' };
    }

    await forumRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating forum:', error);
    return { success: false, error: 'Failed to update forum' };
  }
}

/**
 * Get all available forum category names (for filtering)
 */
export async function getForumCategoryList(): Promise<{
  success: boolean;
  categories?: string[];
  error?: string;
}> {
  try {
    // Use Admin SDK for server-side reads
    const querySnapshot = await adminDb
      .collection('forums')
      .where('status', '==', 'active')
      .limit(100)
      .get();

    const categoriesSet = new Set<string>();
    querySnapshot.docs.forEach((doc) => {
      const forum = doc.data() as SmartForum;
      if (forum.category) {
        categoriesSet.add(forum.category);
      }
    });

    return {
      success: true,
      categories: Array.from(categoriesSet).sort(),
    };
  } catch (error) {
    log.error('Error fetching categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

/**
 * Get all available forum tags (for filtering)
 */
export async function getForumTagList(): Promise<{
  success: boolean;
  tags?: string[];
  error?: string;
}> {
  try {
    // Use Admin SDK for server-side reads
    const querySnapshot = await adminDb
      .collection('forums')
      .where('status', '==', 'active')
      .limit(100)
      .get();

    const tagsSet = new Set<string>();
    querySnapshot.docs.forEach((doc) => {
      const forum = doc.data() as SmartForum;
      if (forum.tags) {
        forum.tags.forEach((tag) => tagsSet.add(tag));
      }
    });

    return {
      success: true,
      tags: Array.from(tagsSet).sort(),
    };
  } catch (error) {
    log.error('Error fetching tags:', error);
    return { success: false, error: 'Failed to fetch tags' };
  }
}
