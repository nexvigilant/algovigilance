// ============================================================================
// LMS GAMIFICATION: Levels, Badges, Streaks, Leaderboards
// ============================================================================

import { type Timestamp } from 'firebase/firestore';

import type { ActivityEngineType } from './activity-engines';

// ============================================================================
// POINTS & LEVELS
// ============================================================================

export interface Level {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;            // Infinity for top level
  icon: string;                 // Emoji or icon class
  color: string;                // Tailwind color class
  benefits: string[];           // Unlocked features
}

export interface UserLevel {
  userId: string;
  currentLevel: number;
  currentPoints: number;
  pointsToNextLevel: number;
  updatedAt: Timestamp;
}

export const PV_LEVELS: Level[] = [
  { level: 1, name: 'Observer', minPoints: 0, maxPoints: 100, icon: '👁️', color: 'text-slate-400', benefits: [] },
  { level: 2, name: 'Reporter', minPoints: 101, maxPoints: 300, icon: '📝', color: 'text-blue-400', benefits: ['Basic case entry'] },
  { level: 3, name: 'Analyst', minPoints: 301, maxPoints: 600, icon: '🔍', color: 'text-cyan-400', benefits: ['Signal detection tools'] },
  { level: 4, name: 'Specialist', minPoints: 601, maxPoints: 1000, icon: '⭐', color: 'text-gold', benefits: ['Advanced analytics'] },
  { level: 5, name: 'Expert', minPoints: 1001, maxPoints: 2000, icon: '🏆', color: 'text-amber-400', benefits: ['Mentorship access'] },
  { level: 6, name: 'Master', minPoints: 2001, maxPoints: Infinity, icon: '👑', color: 'text-purple-400', benefits: ['All access', 'Content creation'] },
];

// ============================================================================
// BADGES
// ============================================================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;                 // Emoji or icon URL
  color: string;                // Background color class
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: BadgeRequirement[];
  isSecret: boolean;            // Hidden until earned
  createdAt: Timestamp;
}

export interface BadgeRequirement {
  type: 'activity_count' | 'accuracy' | 'streak' | 'points' | 'level' | 'domain_mastery' | 'custom';
  activityType?: ActivityEngineType;
  domainId?: string;
  threshold: number;            // Count, percentage, or level
  minCount?: number;            // For accuracy: minimum attempts
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Timestamp;
  progress?: number;            // 0-100 if not yet earned
}

// ============================================================================
// STREAKS
// ============================================================================

export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;     // YYYY-MM-DD
  streakHistory: StreakDay[];   // Last 90 days
  updatedAt: Timestamp;
}

export interface StreakDay {
  date: string;                 // YYYY-MM-DD
  activitiesCompleted: number;
  pointsEarned: number;
}

// ============================================================================
// LEADERBOARDS
// ============================================================================

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  previousRank?: number;
}

export interface Leaderboard {
  id: string;
  type: 'global' | 'domain' | 'cohort' | 'weekly' | 'monthly';
  domainId?: string;
  cohortId?: string;
  entries: LeaderboardEntry[];
  period?: {
    start: Timestamp;
    end: Timestamp;
  };
  updatedAt: Timestamp;
}
