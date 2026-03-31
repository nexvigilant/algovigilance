'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { SmartForum } from '@/types/community';
import { handleActionError, createSuccessResult, type ActionResult } from './utils/errors';


/**
 * Convert Admin SDK Timestamps to ISO strings for client component compatibility
 */
function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  if (!data) return data;

  const result: Record<string, unknown> = {};
  for (const key in data) {
    const value = data[key];
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (obj._seconds !== undefined && obj._nanoseconds !== undefined) {
        result[key] = new Date((obj._seconds as number) * 1000).toISOString();
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? convertTimestamps(item as Record<string, unknown>)
            : item
        );
      } else {
        result[key] = convertTimestamps(obj);
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

export interface TrendingForum {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  postCount: number;
  activityLevel: 'low' | 'medium' | 'high';
  tags: string[];
  recentActivity?: string; // ISO timestamp
}

/**
 * Get trending forums based on activity and member count
 * This is a public action that doesn't require authentication for display purposes
 */
export async function getTrendingForums(limit: number = 5): Promise<ActionResult<TrendingForum[]>> {
  try {
    // Query forums sorted by member count (most popular)
    const popularQuery = adminDb
      .collection('forums')
      .where('status', '==', 'active')
      .orderBy('membership.memberCount', 'desc')
      .limit(limit);

    const [popularSnapshot] = await Promise.all([
      popularQuery.get(),
    ]);

    // Combine and dedupe results, prioritizing by a combined score
    const forumsMap = new Map<string, TrendingForum>();

    popularSnapshot.docs.forEach((doc) => {
      const data = convertTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>) as unknown as SmartForum;
      if (!forumsMap.has(doc.id)) {
        forumsMap.set(doc.id, {
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          memberCount: data.membership?.memberCount || 0,
          postCount: data.stats?.postCount || 0,
          activityLevel: data.stats?.activityLevel || 'low',
          tags: [...(data.tags || [])],
          recentActivity: (data.stats as { lastActivity?: string } | undefined)?.lastActivity,
        });
      }
    });

    // Sort by a combined score: memberCount * 2 + postCount
    const forums = Array.from(forumsMap.values())
      .sort((a, b) => {
        const scoreA = a.memberCount * 2 + a.postCount;
        const scoreB = b.memberCount * 2 + b.postCount;
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return createSuccessResult(forums);
  } catch (error) {
    return handleActionError(error, 'getTrendingForums');
  }
}

export interface TrendingTopic {
  topic: string;
  postCount: number;
  growth: number;
  forums: string[];
}

/**
 * Get trending topics across forums
 * Based on tag frequency in recent posts
 */
export async function getTrendingTopicsSimple(limit: number = 5): Promise<ActionResult<TrendingTopic[]>> {
  try {
    // Get recent posts to analyze trending topics
    const postsQuery = adminDb
      .collection('community_posts')
      .orderBy('createdAt', 'desc')
      .limit(100);

    const postsSnapshot = await postsQuery.get();

    // Count tag occurrences
    const tagCounts = new Map<string, { count: number; forums: Set<string> }>();

    postsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const tags = data.tags || [];
      const forumId = data.forumId || 'general';

      tags.forEach((tag: string) => {
        const existing = tagCounts.get(tag) || { count: 0, forums: new Set<string>() };
        existing.count++;
        existing.forums.add(forumId);
        tagCounts.set(tag, existing);
      });
    });

    // Convert to sorted array
    const topics: TrendingTopic[] = Array.from(tagCounts.entries())
      .map(([topic, data]) => ({
        topic,
        postCount: data.count,
        growth: Math.floor(Math.random() * 30) + 5, // Mock growth for now
        forums: Array.from(data.forums),
      }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, limit);

    return createSuccessResult(topics);
  } catch (error) {
    return handleActionError(error, 'getTrendingTopicsSimple');
  }
}
