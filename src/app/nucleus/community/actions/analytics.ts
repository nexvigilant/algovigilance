'use server';

import { getAuthenticatedUser } from './utils';
import { handleActionError, createSuccessResult, type ActionResult } from './utils/errors';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const _log = logger.scope('actions/analytics');

/**
 * Get trending topics across all forums
 * SECURITY: Requires authentication
 */
export async function getTrendingTopics(
  _period: 'day' | 'week' | 'month' = 'week'
): Promise<ActionResult<Array<{
    topic: string;
    postCount: number;
    growth: number;
    forums: string[];
}>>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    // Mock trending topics - in production, analyze from Firestore
    const topics = [
      {
        topic: 'regulatory-affairs',
        postCount: 45,
        growth: 23.5,
        forums: ['Regulatory Affairs', 'Career Development'],
      },
      {
        topic: 'clinical-trials',
        postCount: 38,
        growth: 15.2,
        forums: ['Clinical Development', 'Regulatory Affairs'],
      },
      {
        topic: 'pharmacovigilance',
        postCount: 32,
        growth: 28.7,
        forums: ['Drug Safety', 'Quality & Compliance'],
      },
      {
        topic: 'career-transition',
        postCount: 29,
        growth: 31.4,
        forums: ['Career Development', 'General Discussion'],
      },
      {
        topic: 'fda-submissions',
        postCount: 24,
        growth: 12.8,
        forums: ['Regulatory Affairs'],
      },
    ];

    return createSuccessResult(topics);
  } catch (error) {
    return handleActionError(error, 'getTrendingTopics');
  }
}

/**
 * Get community-wide analytics
 * SECURITY: Requires authentication
 */
export async function getCommunityAnalytics(
  _period: '7d' | '30d' | '90d' = '30d'
): Promise<ActionResult<{
    overview: {
      totalMembers: number;
      activeMembers: number;
      totalPosts: number;
      totalForums: number;
      growthRate: number;
    };
    engagement: {
      avgPostsPerDay: number;
      avgRepliesPerPost: number;
      avgResponseTime: number; // hours
      topContributors: Array<{ userId: string; contributions: number }>;
    };
    trending: {
      hotForums: Array<{
        forumId: string;
        name: string;
        activityScore: number;
      }>;
      hotTopics: Array<{ topic: string; mentions: number }>;
      risingStars: Array<{ userId: string; growthRate: number }>;
    };
}>> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    // Mock analytics - in production, calculate from Firestore
    const analytics = {
      overview: {
        totalMembers: 1250,
        activeMembers: 850,
        totalPosts: 3400,
        totalForums: 12,
        growthRate: 15.4,
      },
      engagement: {
        avgPostsPerDay: 45,
        avgRepliesPerPost: 3.2,
        avgResponseTime: 4.5,
        topContributors: [
          { userId: 'user1', contributions: 150 },
          { userId: 'user2', contributions: 120 },
          { userId: 'user3', contributions: 95 },
        ],
      },
      trending: {
        hotForums: [
          { forumId: 'f1', name: 'Regulatory Affairs', activityScore: 95 },
          { forumId: 'f2', name: 'Clinical Ops', activityScore: 88 },
        ],
        hotTopics: [
          { topic: 'AI in Pharma', mentions: 145 },
          { topic: 'Remote Trials', mentions: 120 },
        ],
        risingStars: [
          { userId: 'user4', growthRate: 25 },
          { userId: 'user5', growthRate: 22 },
        ],
      },
    };

    return createSuccessResult(analytics);
  } catch (error) {
    return handleActionError(error, 'getCommunityAnalytics');
  }
}

/**
 * Get real-time engagement heatmap data
 * Aggregates activities into hourly buckets for the last 24 hours
 */
export async function getEngagementHeatmap(): Promise<ActionResult<Array<{ hour: string; count: number }>>> {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // In a real high-scale scenario, we would use a pre-aggregated collection
    // but for now we query the global activities if possible or per-user for demo
    // Since we want admin-level, we'll assume a global 'activities' collection exists 
    // or aggregate from active forums.
    
    // For this implementation, we aggregate from the last 1000 activities
    const snapshot = await adminDb.collectionGroup('activities')
      .where('timestamp', '>=', twentyFourHoursAgo)
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();

    // Fetch Risk Data for Overlay
    const riskSnapshot = await adminDb.collection('guardian_audit_trail')
      .where('timestamp', '>=', twentyFourHoursAgo)
      .get();

    const hourlyCounts: Record<string, { engagement: number; totalRisk: number; riskCount: number }> = {};
    
    // Initialize all 24 hours
    for (let i = 0; i < 24; i++) {
      const date = new Date(Date.now() - i * 60 * 60 * 1000);
      const hourStr = `${date.getHours()}:00`;
      hourlyCounts[hourStr] = { engagement: 0, totalRisk: 0, riskCount: 0 };
    }

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = toDateFromSerialized(data.timestamp);
      const hourStr = `${date.getHours()}:00`;
      if (hourStr in hourlyCounts) {
        hourlyCounts[hourStr].engagement++;
      }
    });

    riskSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = toDateFromSerialized(data.timestamp);
      const hourStr = `${date.getHours()}:00`;
      if (hourStr in hourlyCounts) {
        hourlyCounts[hourStr].totalRisk += data.risk?.score || 0;
        hourlyCounts[hourStr].riskCount++;
      }
    });

    const data = Object.entries(hourlyCounts)
      .map(([hour, stats]) => ({ 
        hour, 
        count: stats.engagement,
        avgRisk: stats.riskCount > 0 ? Math.round(stats.totalRisk / stats.riskCount) : 0
      }))
      .reverse();

    return createSuccessResult(data);
  } catch (error) {
    return handleActionError(error, 'getEngagementHeatmap');
  }
}
