'use server';

import type { Enrollment, Certificate, AchievementSummary, Achievement, AchievementCategory, AchievementRarity } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('academy/achievements');

/**
 * Achievement definition template — static catalog of all earnable achievements.
 */
interface AchievementDef {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly category: AchievementCategory;
  readonly rarity: AchievementRarity;
  readonly check: (ctx: AchievementContext) => AchievementResult;
}

interface AchievementContext {
  readonly enrollments: readonly Enrollment[];
  readonly certificates: readonly Certificate[];
  readonly streak: number;
  readonly bestQuizScore: number;
  readonly totalCompletedLessons: number;
}

interface AchievementResult {
  readonly earned: boolean;
  readonly earnedAt?: string;
  readonly progress?: number;
  readonly target?: number;
  readonly current?: number;
}

/**
 * Static achievement catalog — all 12 achievements.
 * Each has a pure check function that derives earned status from data.
 */
const ACHIEVEMENT_CATALOG: readonly AchievementDef[] = [
  // ── Pathway Achievements ──
  {
    id: 'first-enrollment',
    title: 'First Steps',
    description: 'Enroll in your first capability pathway',
    icon: '🚀',
    category: 'pathway',
    rarity: 'common',
    check: (ctx) => ({
      earned: ctx.enrollments.length > 0,
      current: ctx.enrollments.length,
      target: 1,
      progress: Math.min(100, ctx.enrollments.length * 100),
    }),
  },
  {
    id: 'first-completion',
    title: 'Practitioner',
    description: 'Complete your first capability pathway',
    icon: '🎓',
    category: 'pathway',
    rarity: 'uncommon',
    check: (ctx) => {
      const completed = ctx.enrollments.filter(e => e.status === 'completed');
      return {
        earned: completed.length >= 1,
        current: completed.length,
        target: 1,
        progress: Math.min(100, completed.length * 100),
      };
    },
  },
  {
    id: 'three-completions',
    title: 'Scholar',
    description: 'Complete 3 capability pathways',
    icon: '📚',
    category: 'pathway',
    rarity: 'rare',
    check: (ctx) => {
      const completed = ctx.enrollments.filter(e => e.status === 'completed').length;
      return {
        earned: completed >= 3,
        current: completed,
        target: 3,
        progress: Math.min(100, Math.round((completed / 3) * 100)),
      };
    },
  },
  {
    id: 'five-completions',
    title: 'Domain Expert',
    description: 'Complete 5 capability pathways',
    icon: '🏆',
    category: 'pathway',
    rarity: 'legendary',
    check: (ctx) => {
      const completed = ctx.enrollments.filter(e => e.status === 'completed').length;
      return {
        earned: completed >= 5,
        current: completed,
        target: 5,
        progress: Math.min(100, Math.round((completed / 5) * 100)),
      };
    },
  },
  // ── Assessment Achievements ──
  {
    id: 'high-scorer',
    title: 'Signal Hunter',
    description: 'Score 90% or above on any assessment',
    icon: '🎯',
    category: 'assessment',
    rarity: 'uncommon',
    check: (ctx) => ({
      earned: ctx.bestQuizScore >= 90,
      current: ctx.bestQuizScore,
      target: 90,
      progress: Math.min(100, Math.round((ctx.bestQuizScore / 90) * 100)),
    }),
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Score 100% on any assessment',
    icon: '💎',
    category: 'assessment',
    rarity: 'rare',
    check: (ctx) => ({
      earned: ctx.bestQuizScore >= 100,
      current: ctx.bestQuizScore,
      target: 100,
      progress: ctx.bestQuizScore,
    }),
  },
  {
    id: 'lesson-milestone',
    title: 'Deep Diver',
    description: 'Complete 25 practice activities',
    icon: '🔬',
    category: 'assessment',
    rarity: 'uncommon',
    check: (ctx) => ({
      earned: ctx.totalCompletedLessons >= 25,
      current: ctx.totalCompletedLessons,
      target: 25,
      progress: Math.min(100, Math.round((ctx.totalCompletedLessons / 25) * 100)),
    }),
  },
  // ── Streak Achievements ──
  {
    id: 'streak-3',
    title: 'Streak Starter',
    description: 'Maintain a 3-day practice streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    check: (ctx) => ({
      earned: ctx.streak >= 3,
      current: ctx.streak,
      target: 3,
      progress: Math.min(100, Math.round((ctx.streak / 3) * 100)),
    }),
  },
  {
    id: 'streak-7',
    title: 'On Fire',
    description: 'Maintain a 7-day practice streak',
    icon: '⚡',
    category: 'streak',
    rarity: 'uncommon',
    check: (ctx) => ({
      earned: ctx.streak >= 7,
      current: ctx.streak,
      target: 7,
      progress: Math.min(100, Math.round((ctx.streak / 7) * 100)),
    }),
  },
  {
    id: 'streak-30',
    title: 'Dedicated',
    description: 'Maintain a 30-day practice streak',
    icon: '🌟',
    category: 'streak',
    rarity: 'legendary',
    check: (ctx) => ({
      earned: ctx.streak >= 30,
      current: ctx.streak,
      target: 30,
      progress: Math.min(100, Math.round((ctx.streak / 30) * 100)),
    }),
  },
  // ── Verification Achievements ──
  {
    id: 'first-verification',
    title: 'Verified',
    description: 'Earn your first capability verification',
    icon: '✅',
    category: 'verification',
    rarity: 'uncommon',
    check: (ctx) => ({
      earned: ctx.certificates.length >= 1,
      current: ctx.certificates.length,
      target: 1,
      progress: Math.min(100, ctx.certificates.length * 100),
    }),
  },
  {
    id: 'three-verifications',
    title: 'Verified Professional',
    description: 'Earn 3 capability verifications',
    icon: '🛡️',
    category: 'verification',
    rarity: 'rare',
    check: (ctx) => {
      const count = ctx.certificates.length;
      return {
        earned: count >= 3,
        current: count,
        target: 3,
        progress: Math.min(100, Math.round((count / 3) * 100)),
      };
    },
  },
] as const;

/**
 * Compute achievements from existing user data.
 * Pure derivation — no DB writes needed.
 */
export async function computeAchievements(
  enrollments: readonly Enrollment[],
  certificates: readonly Certificate[],
  streak: number,
): Promise<AchievementSummary> {
  // Compute derived metrics
  const bestQuizScore = enrollments.reduce((best, enrollment) => {
    const enrollmentBest = enrollment.quizScores.reduce(
      (b, qs) => Math.max(b, qs.score),
      0
    );
    return Math.max(best, enrollmentBest);
  }, 0);

  const totalCompletedLessons = enrollments.reduce(
    (total, e) => total + e.completedLessons.length,
    0
  );

  const ctx: AchievementContext = {
    enrollments,
    certificates,
    streak,
    bestQuizScore,
    totalCompletedLessons,
  };

  const achievements: Achievement[] = ACHIEVEMENT_CATALOG.map(def => {
    const result = def.check(ctx);
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      category: def.category,
      rarity: def.rarity,
      earned: result.earned,
      earnedAt: result.earnedAt,
      progress: result.progress,
      target: result.target,
      current: result.current,
    };
  });

  const earned = achievements.filter(a => a.earned);

  log.debug(`[computeAchievements] ${earned.length}/${achievements.length} earned`);

  return {
    total: achievements.length,
    earned: earned.length,
    achievements,
    latest: earned.length > 0 ? earned[earned.length - 1] : undefined,
  };
}
