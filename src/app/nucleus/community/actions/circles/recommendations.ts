'use server';

/**
 * Circle Recommendations Server Actions
 *
 * Provides popularity-based circle recommendations by querying public/semi-private
 * forums the user hasn't joined, sorted by member count.
 */

import { adminDb } from '@/lib/firebase-admin';
import { getAuthenticatedUser } from '../utils/auth';
import { convertTimestamps } from '../utils/timestamp';
import type { SmartForum } from '@/types/community';

import { logger } from '@/lib/logger';
const log = logger.scope('actions/circles/recommendations');

interface RecommendedCircle {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  matchScore: number;
  matchedInterests: string[];
  tags?: string[];
}

interface GetRecommendedCirclesResult {
  success: boolean;
  circles?: RecommendedCircle[];
  error?: string;
}

/**
 * Get circle recommendations for the current user.
 * Returns public/semi-private circles the user hasn't joined, sorted by popularity.
 */
export async function getRecommendedCircles(
  limit: number = 5
): Promise<GetRecommendedCirclesResult> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's current forums to exclude
    const userForumsSnapshot = await adminDb
      .collection('forums')
      .where('membership.memberIds', 'array-contains', user.uid)
      .select()
      .get();

    const joinedForumIds = new Set(userForumsSnapshot.docs.map(doc => doc.id));

    // Query active public forums sorted by member count
    const forumsSnapshot = await adminDb
      .collection('forums')
      .where('status', '==', 'active')
      .where('membership.joinType', 'in', ['open', 'request'])
      .orderBy('membership.memberCount', 'desc')
      .limit(limit + joinedForumIds.size) // Over-fetch to account for filtering
      .get();

    const circles: RecommendedCircle[] = [];

    for (const doc of forumsSnapshot.docs) {
      if (circles.length >= limit) break;
      if (joinedForumIds.has(doc.id)) continue;

      const data = convertTimestamps({ id: doc.id, ...doc.data() }) as SmartForum;
      circles.push({
        id: doc.id,
        name: data.name,
        description: data.description || '',
        memberCount: data.membership?.memberCount || 0,
        matchScore: data.membership?.memberCount || 0, // Popularity-based score
        matchedInterests: data.tags ? [...data.tags] : [],
        tags: data.tags ? [...data.tags] : undefined,
      });
    }

    log.debug('Recommended circles', { count: circles.length, userId: user.uid });

    return { success: true, circles };
  } catch (error) {
    log.error('Failed to get recommendations', { error });
    return { success: false, error: 'Failed to load recommendations' };
  }
}
