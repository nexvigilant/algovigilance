'use server';

import { getForums } from '../forums';
import type { SmartForum } from '@/types/community';
import type { CommunityUserId } from '@/types/community/branded-ids';
import { getAuthenticatedUser, withTiming } from '../utils';
import { logger } from '@/lib/logger';

const log = logger.scope('actions/discovery/matching');

export interface QuizData {
  interests: string[];
  goals: string[];
  experience: string;
  preferredTopics: string[];
  currentRole?: string;
  targetRole?: string;
}

export interface CircleMatch {
  circle: SmartForum;
  score: number;
  matchReasons: string[];
}

/**
 * Calculates a match score for a single circle based on user quiz data.
 */
function calculateMatchScore(circle: SmartForum, quizData: QuizData): CircleMatch | null {
  let score = 0;
  const matchReasons: string[] = [];

  // Match by tags (highest weight)
  const userTopics = [...(quizData.interests || []), ...(quizData.preferredTopics || [])];
  const matchingTags = circle.tags?.filter(tag =>
    userTopics.some(topic =>
      tag.toLowerCase().includes(topic.toLowerCase()) ||
      topic.toLowerCase().includes(tag.toLowerCase())
    )
  ) || [];

  if (matchingTags.length > 0) {
    score += matchingTags.length * 15;
    matchReasons.push(`Matches your interests: ${matchingTags.slice(0, 3).join(', ')}`);
  }

  // Match by category
  const categoryMatches: Record<string, string[]> = {
    'Regulatory Affairs': ['regulatory-affairs', 'fda', 'ema', 'compliance'],
    'Clinical Trials': ['clinical-trials', 'clinical-research', 'study-design'],
    'Drug Safety': ['pharmacovigilance', 'drug-safety', 'adverse-events', 'signal-detection'],
    'Careers': ['career-transition', 'job-seeking', 'networking', 'mentoring'],
    'Quality': ['quality-assurance', 'gxp', 'auditing'],
  };

  const categoryKeywords = categoryMatches[circle.category] || [];
  const categoryMatch = userTopics.some(topic =>
    categoryKeywords.some(kw => topic.toLowerCase().includes(kw))
  );

  if (categoryMatch) {
    score += 20;
    matchReasons.push(`Aligns with your ${circle.category} interest`);
  }

  // Match by goals
  if (quizData.goals?.includes('networking') && circle.type === 'public') {
    score += 10;
  }
  if (quizData.goals?.includes('learning') && circle.metadata?.rules?.length) {
    score += 5;
    matchReasons.push('Structured community for learning');
  }
  if (quizData.goals?.includes('mentoring')) {
    score += 5;
  }

  // Boost active circles
  if (circle.stats?.activityLevel === 'high') {
    score += 10;
    matchReasons.push('Highly active community');
  } else if (circle.stats?.activityLevel === 'medium') {
    score += 5;
  }

  // Boost circles with good member count
  const memberCount = circle.membership?.memberCount || 0;
  if (memberCount >= 50) {
    score += 10;
    matchReasons.push(`${memberCount} members`);
  } else if (memberCount >= 20) {
    score += 5;
  }

  // Serendipity Factor: Introduce a small deterministic random boost to prevent echo chambers
  const serendipityHash = (circle.id.length * quizData.interests.length) % 10;
  if (serendipityHash > 7) {
    score += 5;
    matchReasons.push('Expanding your network beyond primary interests');
  }

  // Pathway Alignment: Boost if circle tags match common Capability Pathway keywords
  const pathwayKeywords = ['transition', 'onboarding', 'certification', 'standards'];
  const hasPathwayMatch = circle.tags?.some(tag => 
    pathwayKeywords.some(pk => tag.toLowerCase().includes(pk))
  );
  if (hasPathwayMatch) {
    score += 15;
    matchReasons.push('Highly relevant to your Capability Pathway');
  }

  // Only return if there's some relevance
  if (score < 10) return null;

  return {
    circle,
    score: Math.min(score, 100),
    matchReasons: matchReasons.slice(0, 3),
  };
}

/**
 * Server action to get personalized circle matches based on quiz data.
 */
export async function getCircleMatches(quizData: QuizData): Promise<{
  success: boolean;
  matches?: CircleMatch[];
  joinedIds?: string[];
  pendingIds?: string[];
  error?: string;
}> {
  return withTiming('getCircleMatches', async () => {
    try {
      const authUser = await getAuthenticatedUser();
      
      // Fetch all active circles
      const result = await getForums({ sortBy: 'popular', limitCount: 100 });
      if (!result.success || !result.forums) {
        return { success: false, error: result.error || 'Failed to fetch circles' };
      }

      // Calculate matches
      const circleMatches: CircleMatch[] = [];
      for (const circle of result.forums) {
        const match = calculateMatchScore(circle, quizData);
        if (match) {
          circleMatches.push(match);
        }
      }

      // Sort by score
      circleMatches.sort((a, b) => b.score - a.score);

      // If authenticated, identify existing memberships and requests
      const joinedIds: string[] = [];
      const pendingIds: string[] = [];
      
      if (authUser) {
        for (const match of circleMatches) {
          if (match.circle.membership?.memberIds?.includes(authUser.uid as CommunityUserId)) {
            joinedIds.push(match.circle.id);
          }
          if (match.circle.membership?.pendingRequests?.includes(authUser.uid as CommunityUserId)) {
            pendingIds.push(match.circle.id);
          }
        }
      }

      return {
        success: true,
        matches: circleMatches,
        joinedIds,
        pendingIds
      };
    } catch (error) {
      log.error('Error getting circle matches:', error);
      return { success: false, error: 'Failed to calculate community matches' };
    }
  }, { 
    interestCount: quizData.interests.length,
    goalCount: quizData.goals.length 
  });
}
