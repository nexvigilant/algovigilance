'use server';

import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { handleActionError, createSuccessResult, type ActionResult } from '../utils/errors';

import { toDateFromSerialized } from '@/types/academy';

/** Firestore forum document shape (partial - only fields used in discovery) */
interface ForumDocument {
  id: string;
  tags?: string[];
  category?: string;
  topics?: string[];
  learningFocused?: boolean;
  memberCount?: number;
  hasMentorship?: boolean;
  postCount?: number;
  beginner_friendly?: boolean;
  advanced_topics?: boolean;
  lastActivityAt?: unknown;
  name?: string;
  description?: string;
}

/**
 * Discovery quiz response schema (for prospective members)
 */
const DiscoveryQuizSchema = z.object({
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  goals: z.array(z.string()).min(1, 'Please select at least one goal'),
  experience: z
    .enum(['practitioner', 'transitioning', 'early-career', 'mid-career', 'senior'])
    .optional(),
  preferredTopics: z.array(z.string()),
});

export type DiscoveryQuizData = z.infer<typeof DiscoveryQuizSchema>;
export type DiscoveryExperienceLevel = NonNullable<DiscoveryQuizData['experience']>;

/**
 * Community preview interface for prospective members
 */
export interface CommunityPreview {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  memberCount: number;
  postCount: number;
  recentActivity: string;
  matchReason: string;
  matchScore: number;
}

/**
 * Get personalized community recommendations based on quiz responses
 * This is public (no auth required) for prospective members
 */
export async function getPersonalizedCommunities(
  quizData: DiscoveryQuizData
): Promise<ActionResult<{
  communities: CommunityPreview[];
  totalMatches: number;
}>> {
  try {
    // Validate input
    const validated = DiscoveryQuizSchema.parse(quizData);

    // Combine interests and preferred topics for matching
    const _allTopics = [...validated.interests, ...validated.preferredTopics];
    const _uniqueTopics = Array.from(new Set(_allTopics));

    // Query forums/communities that match user interests
    const querySnapshot = await adminDb
      .collection('forums')
      .where('status', '==', 'active')
      .orderBy('memberCount', 'desc')
      .limit(50)
      .get();

    const allForums = querySnapshot.docs.map((doc): ForumDocument => ({
      id: doc.id,
      ...(doc.data() as Omit<ForumDocument, 'id'>),
    }));

    // Score and rank forums based on quiz responses
    const scoredCommunities: CommunityPreview[] = allForums
      .map((forum) => {
        const forumTags = forum.tags || [];
        const forumCategory = forum.category || '';
        const forumTopics = forum.topics || [];

        // Calculate match score
        let matchScore = 0;
        const matchReasons: string[] = [];

        // Interest matching (highest weight)
        const matchedInterests = validated.interests.filter((interest) =>
          [...forumTags, ...forumTopics].some(
            (tag) =>
              tag.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (matchedInterests.length > 0) {
          matchScore += matchedInterests.length * 30;
          matchReasons.push(
            `Matches ${matchedInterests.length} of your interests`
          );
        }

        // Preferred topics matching
        const matchedTopics = validated.preferredTopics.filter((topic) =>
          [...forumTags, ...forumTopics].some(
            (tag) =>
              tag.toLowerCase().includes(topic.toLowerCase()) ||
              topic.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (matchedTopics.length > 0) {
          matchScore += matchedTopics.length * 20;
          matchReasons.push(
            `Discusses ${matchedTopics[0]}${matchedTopics.length > 1 ? ` and ${matchedTopics.length - 1} more topics` : ''}`
          );
        }

        // Goal alignment (medium weight)
        if (validated.goals.includes('learning') && forum.learningFocused) {
          matchScore += 15;
          matchReasons.push('Great for learning and skill development');
        }
        if (validated.goals.includes('networking') && (forum.memberCount ?? 0) > 50) {
          matchScore += 10;
          matchReasons.push('Active community for networking');
        }
        if (
          validated.goals.includes('job-seeking') &&
          forumCategory === 'Career Development'
        ) {
          matchScore += 15;
          matchReasons.push('Focused on career opportunities');
        }
        if (validated.goals.includes('mentoring') && forum.hasMentorship) {
          matchScore += 15;
          matchReasons.push('Mentorship opportunities available');
        }
        if (
          validated.goals.includes('sharing-knowledge') &&
          (forum.postCount ?? 0) > 100
        ) {
          matchScore += 10;
          matchReasons.push('Active discussions for knowledge sharing');
        }

        // Experience level matching
        if (validated.experience) {
          if (validated.experience === 'practitioner' && forum.beginner_friendly) {
            matchScore += 10;
            matchReasons.push('Beginner-friendly environment');
          }
          if (
            ['mid-career', 'senior'].includes(validated.experience) &&
            forum.advanced_topics
          ) {
            matchScore += 10;
            matchReasons.push('Advanced professional discussions');
          }
        }

        // Activity bonus (small weight)
        if ((forum.postCount ?? 0) > 100) {
          matchScore += 5;
        }
        if ((forum.memberCount ?? 0) > 100) {
          matchScore += 5;
        }

        // Calculate recent activity
        const lastActivityDate =
          toDateFromSerialized(forum.lastActivityAt as Record<string, unknown> | null | undefined) || new Date(0);
        const daysSinceActivity = Math.floor(
          (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const recentActivity =
          daysSinceActivity === 0
            ? 'Active today'
            : daysSinceActivity === 1
              ? 'Active yesterday'
              : daysSinceActivity < 7
                ? `Active ${daysSinceActivity} days ago`
                : daysSinceActivity < 30
                  ? 'Active this month'
                  : 'Less active';

        return {
          id: forum.id,
          name: forum.name || 'Unnamed Community',
          description: forum.description || '',
          category: forum.category || 'General',
          tags: forumTags,
          memberCount: forum.memberCount || 0,
          postCount: forum.postCount || 0,
          recentActivity,
          matchReason: matchReasons.join(' • ') || 'Relevant to your interests',
          matchScore,
        };
      })
      .filter((community) => community.matchScore > 0) // Only include communities with some match
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score descending
      .slice(0, 12); // Top 12 recommendations

    return createSuccessResult({
      communities: scoredCommunities,
      totalMatches: scoredCommunities.length,
    });
  } catch (error) {
    return handleActionError(error, 'getPersonalizedCommunities');
  }
}

/**
 * Get aggregate stats for discovery page
 * Shows prospective members the scale of the community
 */
export async function getCommunityStats(): Promise<ActionResult<{
  totalCommunities: number;
  totalMembers: number;
  totalPosts: number;
  activeToday: number;
}>> {
  try {
    const forumsSnapshot = await adminDb
      .collection('forums')
      .where('status', '==', 'active')
      .limit(100)
      .get();

    const totalCommunities = forumsSnapshot.size;
    let totalMembers = 0;
    let totalPosts = 0;

    forumsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalMembers += data.memberCount || 0;
      totalPosts += data.postCount || 0;
    });

    return createSuccessResult({
      totalCommunities,
      totalMembers,
      totalPosts,
      activeToday: Math.floor(totalMembers * 0.15), // Estimate 15% daily active
    });
  } catch (error) {
    return handleActionError(error, 'getCommunityStats');
  }
}
