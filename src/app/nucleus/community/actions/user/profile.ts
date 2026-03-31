'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { withRateLimit } from '@/lib/rate-limit';

import { logger } from '@/lib/logger';
const log = logger.scope('user/profile');

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
 * Profile Update Schema
 */
const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name too long')
    .optional(),
  bio: z.string().max(500, 'Bio too long (max 500 characters)').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  organization: z.string().max(100, 'Organization name too long').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  linkedIn: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
  twitter: z.string().url('Invalid Twitter URL').or(z.literal('')).optional(),
});

/**
 * Update user profile
 */
export async function updateProfile(
  input: z.infer<typeof UpdateProfileSchema>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: 'You must be logged in to update your profile',
      };
    }

    // Rate limit check
    const rateLimitResult = await withRateLimit(user.uid, 'profile_update');
    if (!rateLimitResult.allowed) {
      log.warn('Profile update rate limit exceeded', { userId: user.uid });
      return { success: false, error: rateLimitResult.error || 'Too many profile updates. Please try again later.' };
    }

    // Validate input
    const validation = UpdateProfileSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    const data = validation.data;

    // Sanitize bio if provided
    const sanitizedData: z.infer<typeof UpdateProfileSchema> = { ...data };
    if (data.bio) {
      sanitizedData.bio = DOMPurify.sanitize(data.bio, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });
    }

    // Update user document
    const userRef = adminDb.doc(`users/${user.uid}`);
    await userRef.update({
      ...sanitizedData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Get current user's profile for editing
 */
export async function getCurrentUserProfile(): Promise<{
  success: boolean;
  profile?: {
    name: string;
    email: string;
    bio?: string;
    title?: string;
    organization?: string;
    location?: string;
    website?: string;
    linkedIn?: string;
    twitter?: string;
    avatar?: string;
  };
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'You must be logged in' };
    }

    const userDoc = await adminDb.doc(`users/${user.uid}`).get();

    if (!userDoc.exists) {
      return { success: false, error: 'User profile not found' };
    }

    const userData = userDoc.data();

    return {
      success: true,
      profile: {
        name: userData?.name || userData?.displayName || user.name || '',
        email: userData?.email || user.email || '',
        bio: userData?.bio || '',
        title: userData?.title || '',
        organization: userData?.organization || '',
        location: userData?.location || '',
        website: userData?.website || '',
        linkedIn: userData?.linkedIn || '',
        twitter: userData?.twitter || '',
        avatar: userData?.avatar || userData?.photoURL || user.picture || '',
      },
    };
  } catch (error) {
    log.error('Error fetching profile:', error);
    return { success: false, error: 'Failed to load profile' };
  }
}

/**
 * Update user avatar URL
 */
export async function updateAvatar(avatarUrl: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'You must be logged in' };
    }

    // Validate URL
    try {
      new URL(avatarUrl);
    } catch {
      return { success: false, error: 'Invalid avatar URL' };
    }

    const userRef = adminDb.doc(`users/${user.uid}`);
    await userRef.update({
      avatar: avatarUrl,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating avatar:', error);
    return { success: false, error: 'Failed to update avatar' };
  }
}

/**
 * Get current user's engagement stats for nudges and onboarding
 * Returns post count, circles joined, and reply count
 */
export async function getCurrentUserEngagementStats(): Promise<{
  success: boolean;
  stats?: {
    postCount: number;
    replyCount: number;
    circlesJoined: number;
  };
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // OPTIMIZATION: Parallelize independent Firestore queries
    // This reduces O(T₁ + T₂ + T₃) → O(max(T₁, T₂, T₃))
    // Typical improvement: ~300ms → ~100ms (3x speedup)
    const [postsSnapshot, forumsSnapshot, repliesSnapshot] = await Promise.all([
      // Get post count
      adminDb
        .collection('community_posts')
        .where('authorId', '==', user.uid)
        .count()
        .get(),

      // Get circles/forums the user has joined
      adminDb
        .collectionGroup('members')
        .where('userId', '==', user.uid)
        .count()
        .get(),

      // Get reply count (from all posts)
      adminDb
        .collectionGroup('replies')
        .where('authorId', '==', user.uid)
        .count()
        .get(),
    ]);

    const postCount = postsSnapshot.data().count;
    const circlesJoined = forumsSnapshot.data().count;
    const replyCount = repliesSnapshot.data().count;

    return {
      success: true,
      stats: {
        postCount,
        replyCount,
        circlesJoined,
      },
    };
  } catch (error) {
    log.error('Error fetching engagement stats:', error);
    return { success: false, error: 'Failed to load stats' };
  }
}
