'use server';

/**
 * Circle Recommendations
 *
 * Provides personalized Circle (SmartForum) recommendations for onboarding.
 *
 * @module actions/forums/recommendations
 */

import { adminDb } from '@/lib/firebase-admin';
import type { SmartForum } from '@/types/community';
import type { CommunityUserId } from '@/types/community/branded-ids';
import { getAuthenticatedUser } from '../utils';
import { logger } from '@/lib/logger';

const log = logger.scope('forums/recommendations');

export interface RecommendedCircle {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  matchScore: number;
  matchedInterests: string[];
  tags: string[];
}

/**
 * Get user's interests from their onboarding quiz
 */
async function getUserInterests(userId: string): Promise<string[]> {
  try {
    const quizDoc = await adminDb.doc(`users/${userId}/onboarding/quiz`).get();
    if (quizDoc.exists) {
      const data = quizDoc.data();
      return data?.responses?.interests || [];
    }
    return [];
  } catch (error) {
    log.error('Error fetching user interests:', error);
    return [];
  }
}

/**
 * Calculate match score between user interests and circle tags
 */
function calculateMatchScore(userInterests: string[], circleTags: string[]): number {
  if (userInterests.length === 0 || circleTags.length === 0) return 50;

  const normalizedInterests = userInterests.map((i) => i.toLowerCase());
  const normalizedTags = circleTags.map((t) => t.toLowerCase());

  const matchedCount = normalizedInterests.filter((interest) =>
    normalizedTags.some(
      (tag) => tag.includes(interest) || interest.includes(tag)
    )
  ).length;

  const matchPercent = matchedCount / Math.max(normalizedInterests.length, 1);
  return Math.round(50 + matchPercent * 50);
}

/**
 * Get recommended circles for onboarding
 */
export async function getRecommendedCircles(limit: number = 5): Promise<{
  success: boolean;
  circles?: RecommendedCircle[];
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const [userInterests, querySnapshot] = await Promise.all([
      getUserInterests(user.uid),
      adminDb
        .collection('forums')
        .where('status', '==', 'active')
        .where('type', 'in', ['public', 'semi-private'])
        .limit(50)
        .get(),
    ]);

    if (querySnapshot.empty) {
      return { success: true, circles: [] };
    }

    const scoredCircles = querySnapshot.docs
      .map((doc) => {
        const data = doc.data() as SmartForum;
        const circleTags = [...(data.tags || [])];

        if (data.membership?.memberIds?.includes(user.uid as CommunityUserId)) {
          return;
        }

        const matchScore = calculateMatchScore(userInterests, circleTags);
        const matchedInterests = userInterests.filter((interest) =>
          circleTags.some(
            (tag) =>
              tag.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(tag.toLowerCase())
          )
        );

        return {
          id: doc.id,
          name: data.name,
          description: data.description || '',
          memberCount: data.membership?.memberCount ?? 0,
          matchScore,
          matchedInterests,
          tags: circleTags,
        };
      })
      .filter((c): c is RecommendedCircle => c !== null)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return { success: true, circles: scoredCircles };
  } catch (error) {
    log.error('Error getting recommended circles:', error);
    return {
      success: false,
      error: 'Failed to get recommendations',
    };
  }
}
