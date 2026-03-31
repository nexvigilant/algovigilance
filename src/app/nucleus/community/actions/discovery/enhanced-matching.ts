'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { SmartForum } from '@/types/community';
import type { CircleTags, CareerStage } from '@/types/circle-taxonomy';
import type { EnhancedQuizData } from '../../discover/enhanced-discovery-quiz';

import { logger } from '@/lib/logger';
const log = logger.scope('discovery/enhanced-matching');

/**
 * Circle recommendation with match details
 */
export interface CircleRecommendation {
  circle: SmartForum;
  matchScore: number; // 0-100
  matchReasons: MatchReason[];
  matchedDimensions: string[];
}

/**
 * Reason why a circle was recommended
 */
export interface MatchReason {
  type: 'career_stage' | 'skill' | 'goal' | 'interest' | 'organization' | 'pathway' | 'function' | 'industry';
  label: string;
  weight: number;
}

/**
 * Weights for different matching factors
 */
const MATCH_WEIGHTS = {
  careerStage: 25,      // Career stage alignment is very important
  skills: 20,           // Skills match
  goals: 20,            // Goal compatibility
  interests: 15,        // Interest overlap
  pathways: 10,         // Career pathway match
  organizations: 5,     // Organization affiliation
  functions: 3,         // Job function match
  industries: 2,        // Industry match
};

/**
 * Get personalized circle recommendations based on enhanced quiz data
 */
export async function getEnhancedCircleRecommendations(
  quizData: EnhancedQuizData,
  options: {
    limit?: number;
    includeAll?: boolean;
  } = {}
): Promise<CircleRecommendation[]> {
  const { limit = 20, includeAll = false } = options;

  try {
    // Fetch active circles from Firestore
    const circlesRef = adminDb.collection('forums');
    const querySnapshot = await circlesRef
      .where('status', '==', 'active')
      .limit(100)
      .get();

    if (querySnapshot.empty) {
      return [];
    }

    const circles = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SmartForum[];

    // Score each circle
    const scoredCircles: CircleRecommendation[] = circles.map((circle) => {
      const { score, reasons, dimensions } = calculateMatchScore(circle, quizData);
      return {
        circle: {
          ...circle,
          matchScore: score,
        },
        matchScore: score,
        matchReasons: reasons,
        matchedDimensions: dimensions,
      };
    });

    // Sort by match score (descending)
    scoredCircles.sort((a, b) => b.matchScore - a.matchScore);

    // Filter out low scores unless includeAll is true
    const filtered = includeAll
      ? scoredCircles
      : scoredCircles.filter((r) => r.matchScore >= 20);

    return filtered.slice(0, limit);
  } catch (error) {
    log.error('Error getting enhanced recommendations:', error);
    return [];
  }
}

/**
 * Calculate match score between a circle and quiz data
 */
function calculateMatchScore(
  circle: SmartForum,
  quizData: EnhancedQuizData
): { score: number; reasons: MatchReason[]; dimensions: string[] } {
  const reasons: MatchReason[] = [];
  const dimensions: string[] = [];
  let totalScore = 0;

  const circleTags = circle.circleTags || createEmptyCircleTags(circle);

  // 1. Career Stage Match (25%)
  if (quizData.careerStage && circleTags.careerStages.length > 0) {
    const stageMatch = matchCareerStage(quizData.careerStage as CareerStage, circleTags.careerStages);
    if (stageMatch > 0) {
      const weight = MATCH_WEIGHTS.careerStage * stageMatch;
      totalScore += weight;
      reasons.push({
        type: 'career_stage',
        label: `Matches your career stage`,
        weight,
      });
      dimensions.push('career-stage');
    }
  }

  // 2. Skills Match (20%)
  const skillMatches = findArrayOverlap(
    [...quizData.currentSkills, ...quizData.skillsToLearn],
    circleTags.skills
  );
  if (skillMatches.length > 0) {
    const weight = Math.min(MATCH_WEIGHTS.skills, skillMatches.length * 5);
    totalScore += weight;
    reasons.push({
      type: 'skill',
      label: `${skillMatches.length} skill${skillMatches.length > 1 ? 's' : ''} in common`,
      weight,
    });
    dimensions.push('skill');
  }

  // 3. Goals Match (20%)
  const goalMatches = findArrayOverlap(quizData.careerGoals, circleTags.goals);
  if (goalMatches.length > 0) {
    const weight = Math.min(MATCH_WEIGHTS.goals, goalMatches.length * 7);
    totalScore += weight;
    reasons.push({
      type: 'goal',
      label: `Aligned with your goals`,
      weight,
    });
    dimensions.push('aspiration');
  }

  // 4. Interests Match (15%)
  const interestMatches = findArrayOverlap(quizData.interests, circleTags.interests);
  if (interestMatches.length > 0) {
    const weight = Math.min(MATCH_WEIGHTS.interests, interestMatches.length * 5);
    totalScore += weight;
    reasons.push({
      type: 'interest',
      label: `${interestMatches.length} shared interest${interestMatches.length > 1 ? 's' : ''}`,
      weight,
    });
    dimensions.push('interest');
  }

  // 5. Pathway Match (10%)
  const pathwayMatches = findArrayOverlap(quizData.pathways, circleTags.pathways);
  if (pathwayMatches.length > 0) {
    const weight = Math.min(MATCH_WEIGHTS.pathways, pathwayMatches.length * 5);
    totalScore += weight;
    reasons.push({
      type: 'pathway',
      label: `Supports your career pathway`,
      weight,
    });
    dimensions.push('pathway');
  }

  // 6. Organization Match (5%)
  const orgMatches = findArrayOverlap(
    [...quizData.organizations, ...quizData.customAffiliations],
    circleTags.organizationName ? [circleTags.organizationName] : []
  );
  if (orgMatches.length > 0 ||
      (circleTags.organizationType && quizData.organizations.length > 0)) {
    const weight = MATCH_WEIGHTS.organizations;
    totalScore += weight;
    reasons.push({
      type: 'organization',
      label: `Organization connection`,
      weight,
    });
    dimensions.push('organization');
  }

  // 7. Function Match (3%)
  if (quizData.currentRole && circleTags.functions.length > 0) {
    const roleLower = quizData.currentRole.toLowerCase();
    const functionMatch = circleTags.functions.some(
      (f) => roleLower.includes(f.toLowerCase()) || f.toLowerCase().includes(roleLower)
    );
    if (functionMatch) {
      totalScore += MATCH_WEIGHTS.functions;
      reasons.push({
        type: 'function',
        label: `Related to your role`,
        weight: MATCH_WEIGHTS.functions,
      });
      dimensions.push('function');
    }
  }

  // 8. Industry Match (2%)
  if (quizData.currentIndustry && circleTags.industries.length > 0) {
    if (circleTags.industries.includes(quizData.currentIndustry)) {
      totalScore += MATCH_WEIGHTS.industries;
      reasons.push({
        type: 'industry',
        label: `In your industry`,
        weight: MATCH_WEIGHTS.industries,
      });
      dimensions.push('function');
    }
  }

  // Normalize score to 0-100
  const normalizedScore = Math.min(100, Math.round(totalScore));

  // Sort reasons by weight (descending)
  reasons.sort((a, b) => b.weight - a.weight);

  return {
    score: normalizedScore,
    reasons: reasons.slice(0, 3), // Top 3 reasons
    dimensions: [...new Set(dimensions)],
  };
}

/**
 * Match career stages with flexibility for adjacent stages
 */
function matchCareerStage(userStage: CareerStage, circleStages: readonly CareerStage[]): number {
  // Direct match
  if (circleStages.includes(userStage)) {
    return 1.0;
  }

  // Adjacent stage matching
  const stageOrder: CareerStage[] = [
    'practitioner', 'entry', 'mid', 'senior', 'lead', 'executive'
  ];

  const userIndex = stageOrder.indexOf(userStage);
  if (userIndex === -1) {
    // Special stages like 'transitioning' or 'returning' match broadly
    return circleStages.length > 0 ? 0.5 : 0;
  }

  // Check for adjacent stages
  for (const circleStage of circleStages) {
    const circleIndex = stageOrder.indexOf(circleStage);
    if (circleIndex !== -1 && Math.abs(userIndex - circleIndex) === 1) {
      return 0.5; // Partial match for adjacent stages
    }  }

  return 0;
}

/**
 * Find overlapping items between two arrays
 */
function findArrayOverlap(arr1: readonly string[], arr2: readonly string[]): string[] {
  const set1 = new Set(arr1.map((s) => s.toLowerCase()));
  return arr2.filter((item) => set1.has(item.toLowerCase()));
}

/**
 * Create empty circle tags from legacy data
 */
function createEmptyCircleTags(circle: SmartForum): CircleTags {
  return {
    functions: circle.category ? [circle.category] : [],
    industries: [],
    careerStages: [],
    skills: [],
    goals: [],
    interests: (circle.tags && circle.tags.length > 0) ? [...circle.tags] : [],
    pathways: [],
  };
}

/**
 * Get circles by specific dimension
 */
export async function getCirclesByDimension(
  dimension: keyof CircleTags,
  value: string,
  options: { limit?: number } = {}
): Promise<SmartForum[]> {
  const { limit = 20 } = options;

  try {
    // Note: This requires a Firestore index on circleTags fields
    // For now, we'll fetch and filter client-side
    const circlesRef = adminDb.collection('forums');
    const querySnapshot = await circlesRef
      .where('status', '==', 'active')
      .limit(100)
      .get();

    const circles = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((circle) => {
        const tags = (circle as SmartForum).circleTags;
        if (!tags) return false;

        const tagValue = tags[dimension];
        if (Array.isArray(tagValue)) {
          return tagValue.some(
            (v) => v.toLowerCase() === value.toLowerCase()
          );
        }
        if (typeof tagValue === 'string') {
          return tagValue.toLowerCase() === value.toLowerCase();
        }
        return false;
      }) as SmartForum[];

    return circles.slice(0, limit);
  } catch (error) {
    log.error('Error getting circles by dimension:', error);
    return [];
  }
}

/**
 * Get featured/trending circles
 */
export async function getFeaturedCircles(limit: number = 6): Promise<SmartForum[]> {
  try {
    const circlesRef = adminDb.collection('forums');
    const querySnapshot = await circlesRef
      .where('status', '==', 'active')
      .orderBy('stats.memberCount', 'desc')
      .limit(limit)
      .get();

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SmartForum[];
  } catch (error) {
    log.error('Error getting featured circles:', error);
    return [];
  }
}

/**
 * Get official circles
 */
export async function getOfficialCircles(limit: number = 10): Promise<SmartForum[]> {
  try {
    const circlesRef = adminDb.collection('forums');
    const querySnapshot = await circlesRef
      .where('authority', '==', 'official')
      .where('status', '==', 'active')
      .limit(limit)
      .get();

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SmartForum[];
  } catch (error) {
    log.error('Error getting official circles:', error);
    return [];
  }
}
