/**
 * Community Reputation Types
 *
 * Types for badges, reputation, and achievements.
 *
 * @module types/community/reputation
 */

import type { BadgeId, CommunityUserId } from './branded-ids';
import type { FlexibleTimestamp } from './timestamps';
import type { BadgeCategory, BadgeRarity, BadgeRequirementType } from './enums';

// ============================================================================
// BADGE REQUIREMENTS
// ============================================================================

/**
 * Badge requirement definition.
 */
export interface BadgeRequirement {
  readonly type: BadgeRequirementType;
  readonly count: number;
}

// ============================================================================
// USER REPUTATION
// ============================================================================

/**
 * Achievement
 *
 * Represents an earned achievement with timestamp.
 */
export interface Achievement {
  readonly badgeId: BadgeId;
  readonly earnedAt: FlexibleTimestamp;
  readonly awardedBy?: string;
  readonly isManualAward?: boolean;
  readonly reason?: string;
}

/**
 * User Reputation
 *
 * Tracks user reputation points and levels.
 *
 * @remarks
 * Reputation is calculated from various community activities
 * and determines user privileges and visibility.
 */
export interface UserReputation {
  readonly userId: CommunityUserId;
  readonly totalPoints: number;
  readonly level: number;
  readonly levelName: string;
  readonly postPoints: number;
  readonly replyPoints: number;
  readonly reactionPoints: number;
  readonly acceptedAnswerPoints: number;
  readonly badges: readonly BadgeId[];
  readonly achievements: readonly Achievement[];
  readonly updatedAt: FlexibleTimestamp;
}

// ============================================================================
// BADGE DEFINITION
// ============================================================================

/**
 * Badge Definition
 *
 * Defines available badges and their requirements.
 *
 * @remarks
 * Badges gamify community participation and recognize
 * contributions at various rarity levels.
 */
export interface Badge {
  readonly id: BadgeId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly category: BadgeCategory;
  readonly requirement: BadgeRequirement;
  readonly rarity: BadgeRarity;
}
