/**
 * Community Recommendations Types
 *
 * Types for AI-generated recommendations for forums, connections, and posts.
 *
 * @module types/community/recommendations
 */

import type { ForumId, PostId, CommunityUserId } from './branded-ids';
import type { FlexibleTimestamp } from './timestamps';

// ============================================================================
// FORUM RECOMMENDATIONS
// ============================================================================

/**
 * Forum Recommendation
 *
 * Recommended forum with AI-generated reasoning.
 */
export interface ForumRecommendation {
  readonly forumId: ForumId;
  readonly forumName: string;
  readonly reason: string;
  readonly matchScore: number;
  readonly matchedInterests: readonly string[];
}

// ============================================================================
// CONNECTION RECOMMENDATIONS
// ============================================================================

/**
 * Connection Recommendation
 *
 * Recommended user connection with AI-generated reasoning.
 */
export interface ConnectionRecommendation {
  readonly userId: CommunityUserId;
  readonly userName: string;
  readonly userAvatar?: string;
  readonly reason: string;
  readonly matchScore: number;
  readonly commonInterests: readonly string[];
  readonly complementaryExpertise?: readonly string[];
}

// ============================================================================
// POST RECOMMENDATIONS
// ============================================================================

/**
 * Post Recommendation
 *
 * Recommended post/discussion with reasoning.
 */
export interface PostRecommendation {
  readonly postId: PostId;
  readonly postTitle: string;
  readonly reason: string;
  readonly matchScore: number;
  readonly relevantTo: readonly string[];
}

// ============================================================================
// USER RECOMMENDATIONS
// ============================================================================

/**
 * User Recommendation
 *
 * AI-generated recommendations for users.
 *
 * @remarks
 * Recommendations are generated periodically and cached
 * with an expiration time for freshness.
 */
export interface UserRecommendation {
  readonly userId: CommunityUserId;
  readonly recommendedForums: readonly ForumRecommendation[];
  readonly recommendedConnections: readonly ConnectionRecommendation[];
  readonly recommendedPosts: readonly PostRecommendation[];
  readonly generatedAt: FlexibleTimestamp;
  readonly expiresAt: FlexibleTimestamp;
}
