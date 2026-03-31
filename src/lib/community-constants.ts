import type { Badge, BadgeId } from '@/types/community';

/**
 * Reputation Points System
 * Points awarded for various community actions
 */
export const REPUTATION_POINTS = {
  CREATE_POST: 5,
  CREATE_REPLY: 3,
  RECEIVE_UPVOTE_POST: 10,
  RECEIVE_UPVOTE_REPLY: 5,
  RECEIVE_DOWNVOTE_POST: -2,
  RECEIVE_DOWNVOTE_REPLY: -1,
  RECEIVE_REACTION: 2,
  ACCEPTED_ANSWER: 25,
  DAILY_LOGIN: 1,
} as const;

/**
 * Reputation Levels
 * User progression system based on total reputation points
 */
export const REPUTATION_LEVELS = [
  { level: 1, name: 'Newcomer', minPoints: 0, color: '#94a3b8' },
  { level: 2, name: 'Contributor', minPoints: 50, color: '#60a5fa' },
  { level: 3, name: 'Active Member', minPoints: 200, color: '#34d399' },
  { level: 4, name: 'Trusted', minPoints: 500, color: '#fbbf24' },
  { level: 5, name: 'Expert', minPoints: 1000, color: '#f97316' },
  { level: 6, name: 'Authority', minPoints: 2500, color: '#ec4899' },
  { level: 7, name: 'Legend', minPoints: 5000, color: '#a855f7' },
] as const;

/**
 * Get reputation level from points
 */
export function getReputationLevel(points: number) {
  for (let i = REPUTATION_LEVELS.length - 1; i >= 0; i--) {
    if (points >= REPUTATION_LEVELS[i].minPoints) {
      return REPUTATION_LEVELS[i];
    }
  }
  return REPUTATION_LEVELS[0];
}

/**
 * Reaction Types Configuration
 * Available reactions with metadata
 */
export const REACTION_TYPES = {
  like: {
    id: 'like',
    emoji: '👍',
    label: 'Like',
    color: '#3b82f6',
  },
  love: {
    id: 'love',
    emoji: '❤️',
    label: 'Love',
    color: '#ef4444',
  },
  insightful: {
    id: 'insightful',
    emoji: '💡',
    label: 'Insightful',
    color: '#fbbf24',
  },
  helpful: {
    id: 'helpful',
    emoji: '🙌',
    label: 'Helpful',
    color: '#10b981',
  },
  celebrate: {
    id: 'celebrate',
    emoji: '🎉',
    label: 'Celebrate',
    color: '#a855f7',
  },
} as const;

/**
 * Badge Definitions
 * All available badges with requirements
 */
export const BADGES: Badge[] = [
  // Participation Badges
  {
    id: 'first-post' as BadgeId,
    name: 'First Post',
    description: 'Created your first post',
    icon: '📝',
    category: 'participation',
    requirement: { type: 'posts', count: 1 },
    rarity: 'common',
  },
  {
    id: 'active-poster' as BadgeId,
    name: 'Active Poster',
    description: 'Created 10 posts',
    icon: '📢',
    category: 'participation',
    requirement: { type: 'posts', count: 10 },
    rarity: 'uncommon',
  },
  {
    id: 'prolific-writer' as BadgeId,
    name: 'Prolific Writer',
    description: 'Created 50 posts',
    icon: '✍️',
    category: 'participation',
    requirement: { type: 'posts', count: 50 },
    rarity: 'rare',
  },
  {
    id: 'first-reply' as BadgeId,
    name: 'First Reply',
    description: 'Posted your first reply',
    icon: '💬',
    category: 'participation',
    requirement: { type: 'replies', count: 1 },
    rarity: 'common',
  },
  {
    id: 'conversationalist' as BadgeId,
    name: 'Conversationalist',
    description: 'Posted 25 replies',
    icon: '🗣️',
    category: 'participation',
    requirement: { type: 'replies', count: 25 },
    rarity: 'uncommon',
  },
  {
    id: 'helpful-contributor' as BadgeId,
    name: 'Helpful Contributor',
    description: 'Posted 100 replies',
    icon: '🤝',
    category: 'participation',
    requirement: { type: 'replies', count: 100 },
    rarity: 'rare',
  },

  // Quality Badges
  {
    id: 'problem-solver' as BadgeId,
    name: 'Problem Solver',
    description: 'Got your first accepted answer',
    icon: '✅',
    category: 'quality',
    requirement: { type: 'accepted_answers', count: 1 },
    rarity: 'uncommon',
  },
  {
    id: 'expert-helper' as BadgeId,
    name: 'Expert Helper',
    description: '10 accepted answers',
    icon: '⭐',
    category: 'quality',
    requirement: { type: 'accepted_answers', count: 10 },
    rarity: 'rare',
  },
  {
    id: 'community-guru' as BadgeId,
    name: 'Community Guru',
    description: '50 accepted answers',
    icon: '🏆',
    category: 'quality',
    requirement: { type: 'accepted_answers', count: 50 },
    rarity: 'epic',
  },
  {
    id: 'popular-content' as BadgeId,
    name: 'Popular Content',
    description: 'Received 50 reactions',
    icon: '🔥',
    category: 'quality',
    requirement: { type: 'reactions', count: 50 },
    rarity: 'uncommon',
  },
  {
    id: 'crowd-favorite' as BadgeId,
    name: 'Crowd Favorite',
    description: 'Received 200 reactions',
    icon: '💎',
    category: 'quality',
    requirement: { type: 'reactions', count: 200 },
    rarity: 'rare',
  },

  // Milestone Badges
  {
    id: 'trusted-member' as BadgeId,
    name: 'Trusted Member',
    description: 'Reached 500 reputation',
    icon: '🛡️',
    category: 'milestone',
    requirement: { type: 'reputation', count: 500 },
    rarity: 'uncommon',
  },
  {
    id: 'community-expert' as BadgeId,
    name: 'Community Expert',
    description: 'Reached 1000 reputation',
    icon: '🎓',
    category: 'milestone',
    requirement: { type: 'reputation', count: 1000 },
    rarity: 'rare',
  },
  {
    id: 'community-authority' as BadgeId,
    name: 'Community Authority',
    description: 'Reached 2500 reputation',
    icon: '👑',
    category: 'milestone',
    requirement: { type: 'reputation', count: 2500 },
    rarity: 'epic',
  },
  {
    id: 'community-legend' as BadgeId,
    name: 'Community Legend',
    description: 'Reached 5000 reputation',
    icon: '🌟',
    category: 'milestone',
    requirement: { type: 'reputation', count: 5000 },
    rarity: 'legendary',
  },

  // Special Badges
  {
    id: 'early-adopter' as BadgeId,
    name: 'Early Adopter',
    description: 'One of the first 100 members',
    icon: '🚀',
    category: 'special',
    requirement: { type: 'reputation', count: 0 }, // Manually awarded
    rarity: 'rare',
  },
  {
    id: 'dedication' as BadgeId,
    name: 'Dedicated',
    description: '30 day login streak',
    icon: '📅',
    category: 'special',
    requirement: { type: 'streak', count: 30 },
    rarity: 'uncommon',
  },
  {
    id: 'unstoppable' as BadgeId,
    name: 'Unstoppable',
    description: '100 day login streak',
    icon: '⚡',
    category: 'special',
    requirement: { type: 'streak', count: 100 },
    rarity: 'epic',
  },

  // Onboarding Badges
  {
    id: 'journey-complete' as BadgeId,
    name: 'Journey Complete',
    description: 'Completed the community onboarding journey',
    icon: '🗺️',
    category: 'special',
    requirement: { type: 'onboarding', count: 1 },
    rarity: 'uncommon',
  },
];

/**
 * Get badge by ID
 */
export function getBadgeById(badgeId: string): Badge | undefined {
  return BADGES.find((badge) => badge.id === badgeId);
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category: Badge['category']): Badge[] {
  return BADGES.filter((badge) => badge.category === category);
}

/**
 * Get badges by rarity
 */
export function getBadgesByRarity(rarity: Badge['rarity']): Badge[] {
  return BADGES.filter((badge) => badge.rarity === rarity);
}

/**
 * Rarity Colors
 * Colors for badge rarity levels
 */
export const RARITY_COLORS = {
  common: '#94a3b8',
  uncommon: '#3b82f6',
  rare: '#a855f7',
  epic: '#f97316',
  legendary: '#fbbf24',
} as const;
