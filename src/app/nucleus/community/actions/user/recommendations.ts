'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getUserInterestProfile } from './interests';

import { logger } from '@/lib/logger';
const log = logger.scope('user/recommendations');

/**
 * Get users with similar interests
 * Used for connection recommendations
 */
export async function getUsersWithSimilarInterests(
  userId: string,
  limitCount: number = 10
): Promise<{
  users: { userId: string; commonInterests: string[]; matchScore: number }[];
}> {
  try {
    const { profile: userProfile } = await getUserInterestProfile(userId);
    if (!userProfile || userProfile.interests.length === 0) {
      return { users: [] };
    }

    const userTopics = new Set(userProfile.interests.map((i) => i.topic));

    // Get all user profiles (in production, this would be optimized)
    const profilesSnapshot = await adminDb
      .collection('users')
      .limit(100)
      .get();

    // Fetch all interest profiles in parallel (was N+1: 100 sequential reads)
    const otherUserIds = profilesSnapshot.docs
      .map((doc) => doc.id)
      .filter((id) => id !== userId);

    const profileResults = await Promise.all(
      otherUserIds.map((id) => getUserInterestProfile(id))
    );

    const similarUsers: {
      userId: string;
      commonInterests: string[];
      matchScore: number;
    }[] = [];

    for (let i = 0; i < otherUserIds.length; i++) {
      const otherProfile = profileResults[i].profile;
      if (!otherProfile || otherProfile.interests.length === 0) continue;

      const otherTopics = new Set(otherProfile.interests.map((i) => i.topic));
      const commonInterests: string[] = [];

      userTopics.forEach((topic) => {
        if (otherTopics.has(topic)) {
          commonInterests.push(topic);
        }
      });

      if (commonInterests.length >= 2) {
        const matchScore = Math.min(
          (commonInterests.length / userTopics.size) * 100,
          100
        );

        similarUsers.push({
          userId: otherUserIds[i],
          commonInterests,
          matchScore,
        });
      }
    }

    // Sort by match score
    similarUsers.sort((a, b) => b.matchScore - a.matchScore);

    return { users: similarUsers.slice(0, limitCount) };
  } catch (error) {
    log.error('Error finding similar users:', error);
    return { users: [] };
  }
}
