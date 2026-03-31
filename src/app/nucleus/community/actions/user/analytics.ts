'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import type {
  UserInterestProfile,
  InterestArea,
  ExpertiseArea,
} from '@/types/community';
import type { FlexibleTimestamp } from '@/types/community/timestamps';
import type { CommunityUserId } from '@/types/community/branded-ids';
import type { CommunityCareerStage } from '@/types/community/enums';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('user/analytics');

/** Plain timestamp from a Date — safe for server-to-client serialization. */
function toPlainTimestamp(date: Date): FlexibleTimestamp {
  return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
}

/** Current time as a plain serializable timestamp. */
function nowPlainTimestamp(): FlexibleTimestamp {
  return toPlainTimestamp(new Date());
}

/**
 * Convert an Admin SDK Timestamp to a plain serializable timestamp.
 * Extracts seconds/nanoseconds without class instance methods that fail serialization.
 */
function serializeAdminTimestamp(ts: AdminTimestamp): FlexibleTimestamp {
  return { seconds: ts.seconds, nanoseconds: ts.nanoseconds };
}

/**
 * Analyze user activity and build interest profile
 * This should be run periodically (e.g., daily) or on-demand
 */
export async function analyzeUserInterests(userId: string): Promise<{
  success: boolean;
  profile?: UserInterestProfile;
  error?: string;
}> {
  try {
    // Get recent engagements (last 90 days)
    const engagementsRef = adminDb.collection(`users/${userId}/engagements`);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const engagementsSnapshot = await engagementsRef
      .where('timestamp', '>=', AdminTimestamp.fromDate(ninetyDaysAgo))
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();

    const engagements = engagementsSnapshot.docs.map((doc) => doc.data());

    // Extract topics and count frequencies
    const topicFrequency = new Map<string, number>();
    const categoryFrequency = new Map<string, number>();
    const topicFirstEngagement = new Map<string, AdminTimestamp>();
    const topicLastEngagement = new Map<string, AdminTimestamp>();

    engagements.forEach((engagement) => {
      // Process topics
      if (engagement.topics && Array.isArray(engagement.topics)) {
        engagement.topics.forEach((topic: string) => {
          topicFrequency.set(topic, (topicFrequency.get(topic) || 0) + 1);

          if (!topicFirstEngagement.has(topic)) {
            topicFirstEngagement.set(topic, engagement.timestamp);
          }
          topicLastEngagement.set(topic, engagement.timestamp);
        });
      }

      // Process categories
      if (engagement.category) {
        categoryFrequency.set(
          engagement.category,
          (categoryFrequency.get(engagement.category) || 0) + 1
        );
      }
    });

    // Build interest areas (topics with significant engagement)
    const interests: InterestArea[] = [];
    const totalEngagements = engagements.length;

    topicFrequency.forEach((count, topic) => {
      if (count >= 2) {
        // Only include topics engaged with at least twice
        const confidence = Math.min(count / (totalEngagements * 0.1), 1); // Cap at 1.0

        interests.push({
          topic,
          confidence,
          engagementCount: count,
          firstEngaged: serializeAdminTimestamp(topicFirstEngagement.get(topic) ?? AdminTimestamp.now()),
          lastEngaged: serializeAdminTimestamp(topicLastEngagement.get(topic) ?? AdminTimestamp.now()),
        });
      }
    });

    // Sort by confidence and take top 20
    interests.sort((a, b) => b.confidence - a.confidence);
    const topInterests = interests.slice(0, 20);

    // Analyze expertise based on quality indicators
    const expertise = await analyzeExpertise(userId);

    // Determine career stage based on activity patterns
    const careerStage = await determineCareerStage(engagements, expertise);

    // Analyze activity patterns
    const activityPattern = await analyzeActivityPattern(engagements);

    // Get preferred categories
    const preferredCategories = Array.from(categoryFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    // Get topics engaged with
    const topicsEngagedWith = Array.from(topicFrequency.keys());

    // Build the complete profile
    const profile: UserInterestProfile = {
      userId: userId as CommunityUserId,
      interests: topInterests,
      expertise,
      careerStage,
      goals: [], // Set by onboarding quiz or manually
      topicsEngagedWith,
      preferredCategories,
      activityPattern,
      lastAnalyzed: nowPlainTimestamp(),
      updatedAt: nowPlainTimestamp(),
    };

    // Save to Firestore
    const profileRef = adminDb.doc(`users/${userId}/profile/interests`);
    await profileRef.set(profile);

    return { success: true, profile };
  } catch (error) {
    log.error('Error analyzing user interests:', error);
    return { success: false, error: 'Failed to analyze interests' };
  }
}

/**
 * Analyze user's expertise areas based on quality indicators
 */
export async function analyzeExpertise(
  userId: string
): Promise<ExpertiseArea[]> {
  try {
    const expertise: ExpertiseArea[] = [];

    // Get user's posts and analyze by topic
    const postsSnapshot = await adminDb
      .collection('community_posts')
      .where('authorId', '==', userId)
      .limit(100)
      .get();

    // Group posts by tags and calculate quality metrics
    const topicMetrics = new Map<
      string,
      {
        posts: number;
        acceptedAnswers: number;
        helpfulReactions: number;
        totalQuality: number;
      }
    >();

    postsSnapshot.docs.forEach((doc) => {
      const post = doc.data();
      const tags = post.tags || [];

      tags.forEach((tag: string) => {
        const metrics = topicMetrics.get(tag) || {
          posts: 0,
          acceptedAnswers: 0,
          helpfulReactions: 0,
          totalQuality: 0,
        };

        metrics.posts += 1;
        // Note: We'll need to check replies for accepted answers
        metrics.helpfulReactions += post.reactionCounts?.helpful || 0;
        metrics.totalQuality +=
          (post.reactionCounts?.helpful || 0) +
          (post.reactionCounts?.insightful || 0);

        topicMetrics.set(tag, metrics);
      });
    });

    // Convert metrics to expertise areas
    topicMetrics.forEach((metrics, topic) => {
      if (metrics.posts >= 3) {
        // Require at least 3 posts on a topic
        const qualityScore = Math.min(
          (metrics.helpfulReactions * 10 + metrics.acceptedAnswers * 20) /
            metrics.posts,
          100
        );

        let level: 'beginner' | 'intermediate' | 'advanced' | 'expert' =
          'beginner';
        if (qualityScore >= 70 && metrics.posts >= 10) level = 'expert';
        else if (qualityScore >= 50 && metrics.posts >= 7) level = 'advanced';
        else if (qualityScore >= 30 && metrics.posts >= 5)
          level = 'intermediate';

        expertise.push({
          topic,
          level,
          indicators: {
            acceptedAnswers: metrics.acceptedAnswers,
            helpfulReactions: metrics.helpfulReactions,
            postsCreated: metrics.posts,
            qualityScore,
          },
          earnedAt: nowPlainTimestamp(),
        });
      }
    });

    // Sort by quality score
    expertise.sort(
      (a, b) => b.indicators.qualityScore - a.indicators.qualityScore
    );

    return expertise.slice(0, 10); // Top 10 expertise areas
  } catch (error) {
    log.error('Error analyzing expertise:', error);
    return [];
  }
}

/**
 * Determine user's career stage based on activity and expertise
 */
export async function determineCareerStage(
  engagements: FirebaseFirestore.DocumentData[],
  expertise: ExpertiseArea[]
): Promise<CommunityCareerStage> {
  const expertiseCount = expertise.length;
  const advancedExpertise = expertise.filter(
    (e) => e.level === 'advanced' || e.level === 'expert'
  ).length;

  // Simple heuristic - can be enhanced with more data
  if (advancedExpertise >= 3) return 'expert';
  if (advancedExpertise >= 2 || expertiseCount >= 5) return 'senior';
  if (expertiseCount >= 3) return 'mid-career';
  if (expertiseCount >= 1) return 'early-career';
  if (engagements.length >= 10) return 'transitioning';

  return 'practitioner';
}

/**
 * Analyze activity patterns to determine when user is most active
 */
export async function analyzeActivityPattern(engagements: FirebaseFirestore.DocumentData[]): Promise<{
  mostActiveTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  mostActiveDays: string[];
  avgEngagementPerWeek: number;
}> {
  if (engagements.length === 0) {
    return {
      mostActiveTimeOfDay: 'afternoon',
      mostActiveDays: [],
      avgEngagementPerWeek: 0,
    };
  }

  const timeOfDayCount = {
    morning: 0, // 6am - 12pm
    afternoon: 0, // 12pm - 6pm
    evening: 0, // 6pm - 10pm
    night: 0, // 10pm - 6am
  };

  const dayOfWeekCount = new Map<string, number>();
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  engagements.forEach((engagement) => {
    const date = toDateFromSerialized(engagement.timestamp);
    const hour = date.getHours();
    const day = daysOfWeek[date.getDay()];

    // Time of day
    if (hour >= 6 && hour < 12) timeOfDayCount.morning++;
    else if (hour >= 12 && hour < 18) timeOfDayCount.afternoon++;
    else if (hour >= 18 && hour < 22) timeOfDayCount.evening++;
    else timeOfDayCount.night++;

    // Day of week
    dayOfWeekCount.set(day, (dayOfWeekCount.get(day) || 0) + 1);
  });

  // Most active time of day
  const mostActiveTimeOfDay = Object.entries(timeOfDayCount).sort(
    (a, b) => b[1] - a[1]
  )[0][0] as 'morning' | 'afternoon' | 'evening' | 'night';

  // Most active days (top 3)
  const mostActiveDays = Array.from(dayOfWeekCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day]) => day);

  // Average engagement per week
  const oldestEngagement =
    toDateFromSerialized(engagements[engagements.length - 1]?.timestamp);
  const weeksSinceFirst = oldestEngagement
    ? Math.max(
        (Date.now() - oldestEngagement.getTime()) / (7 * 24 * 60 * 60 * 1000),
        1
      )
    : 1;
  const avgEngagementPerWeek = Math.round(engagements.length / weeksSinceFirst);

  return {
    mostActiveTimeOfDay,
    mostActiveDays,
    avgEngagementPerWeek,
  };
}
