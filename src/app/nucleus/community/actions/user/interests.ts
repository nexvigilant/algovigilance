'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { UserInterestProfile } from '@/types/community';
import type { CommunityUserId } from '@/types/community/branded-ids';

import { logger } from '@/lib/logger';
const log = logger.scope('user/interests');

/**
 * Track user engagement with content
 * Called whenever user interacts with posts, forums, etc.
 */
export async function trackEngagement(input: {
  userId: string;
  contentType: 'post' | 'reply' | 'forum' | 'user' | 'search';
  contentId: string;
  topics?: readonly string[];
  category?: string;
  engagementType: 'view' | 'create' | 'reply' | 'reaction' | 'search';
}): Promise<{ success: boolean }> {
  try {
    const {
      userId,
      contentType,
      contentId,
      topics = [],
      category,
      engagementType,
    } = input;

    // Create engagement record using Admin SDK
    const engagementsRef = adminDb.collection(`users/${userId}/engagements`).doc();
    await engagementsRef.set({
      contentType,
      contentId,
      topics,
      category,
      engagementType,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Update topics engaged with in real-time
    if (topics.length > 0 || category) {
      await updateTopicsEngagedWith(
        userId,
        [...topics, category].filter(Boolean) as string[]
      );
    }

    return { success: true };
  } catch (error) {
    log.error('Error tracking engagement:', error);
    return { success: false };
  }
}

/**
 * Update the list of topics user has engaged with
 */
export async function updateTopicsEngagedWith(
  userId: string,
  newTopics: readonly string[]
): Promise<void> {
  try {
    const profileRef = adminDb.doc(`users/${userId}/profile/interests`);
    const profileDoc = await profileRef.get();

    const currentTopics = profileDoc.exists
      ? profileDoc.data()?.topicsEngagedWith || []
      : [];

    // Add new topics, avoiding duplicates
    const updatedTopics = Array.from(new Set([...currentTopics, ...newTopics]));

    await profileRef.set(
      {
        topicsEngagedWith: updatedTopics,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    log.error('Error updating topics engaged:', error);
  }
}

/**
 * Get user's interest profile
 */
export async function getUserInterestProfile(userId: string): Promise<{
  success: boolean;
  profile?: UserInterestProfile;
  error?: string;
}> {
  try {
    const profileRef = adminDb.doc(`users/${userId}/profile/interests`);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      // Return default profile if none exists
      return {
        success: true,
        profile: {
          userId: userId as CommunityUserId,
          interests: [],
          expertise: [],
          careerStage: 'transitioning',
          goals: [],
          topicsEngagedWith: [],
          preferredCategories: [],
          activityPattern: {
            mostActiveTimeOfDay: 'afternoon',
            mostActiveDays: [],
            avgEngagementPerWeek: 0,
          },
          lastAnalyzed: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      };
    }

    return {
      success: true,
      profile: profileDoc.data() as UserInterestProfile,
    };
  } catch (error) {
    log.error('Error fetching interest profile:', error);
    return { success: false, error: 'Failed to fetch profile' };
  }
}
