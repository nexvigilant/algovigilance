'use server';

import { recommendForums as recommendForumsFlow } from '@/lib/ai/flows/recommend-forums';
import type {
  RecommendForumsInput,
  RecommendForumsOutput,
} from '@/lib/ai/flows/recommend-forums';
import { recommendPosts as recommendPostsFlow } from '@/lib/ai/flows/recommend-posts';
import type { RecommendPostsInput, RecommendPostsOutput } from '@/lib/ai/flows/recommend-posts';
import { semanticSearch as semanticSearchFlow } from '@/lib/ai/flows/semantic-search';
import type { SemanticSearchInput, SemanticSearchOutput } from '@/lib/ai/flows/semantic-search';
import { findYourHome as findYourHomeFlow } from '@/lib/ai/flows/find-your-home';
import type { FindYourHomeInput, FindYourHomeOutput } from '@/lib/ai/flows/find-your-home';

import { logger } from '@/lib/logger';
const log = logger.scope('discovery/recommendations');

/**
 * Server action for getting personalized forum recommendations.
 * Returns null on failure instead of throwing — AI recommendations are non-critical.
 */
export async function getForumRecommendations(
  input: RecommendForumsInput
): Promise<RecommendForumsOutput | null> {
  try {
    return await recommendForumsFlow(input);
  } catch (error) {
    log.error('Error getting forum recommendations:', error);
    return null;
  }
}

/**
 * Server action for getting personalized post recommendations.
 * Returns null on failure instead of throwing — AI recommendations are non-critical.
 */
export async function getPostRecommendations(
  input: RecommendPostsInput
): Promise<RecommendPostsOutput | null> {
  try {
    return await recommendPostsFlow(input);
  } catch (error) {
    log.error('Error getting post recommendations:', error);
    return null;
  }
}

/**
 * Server action for performing semantic search across forums and posts.
 * Returns null on failure instead of throwing.
 */
export async function performSemanticSearch(
  input: SemanticSearchInput
): Promise<SemanticSearchOutput | null> {
  try {
    return await semanticSearchFlow(input);
  } catch (error) {
    log.error('Error performing semantic search:', error);
    return null;
  }
}

/**
 * Server action for generating personalized "Find Your Home" onboarding analysis.
 * Returns null on failure instead of throwing.
 */
export async function getFindYourHomeAnalysis(
  input: FindYourHomeInput
): Promise<FindYourHomeOutput | null> {
  try {
    return await findYourHomeFlow(input);
  } catch (error) {
    log.error('Error generating Find Your Home analysis:', error);
    return null;
  }
}
