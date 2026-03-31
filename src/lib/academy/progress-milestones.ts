/**
 * Progress Milestone System
 *
 * Tracks learner progress milestones and triggers celebrations
 * at 25%, 50%, 75%, and 100% completion.
 */

export const MILESTONES = [25, 50, 75, 100] as const;
export type Milestone = (typeof MILESTONES)[number];

export interface MilestoneInfo {
  milestone: Milestone;
  message: string;
  emoji: string;
  celebration: 'confetti' | 'sparkle' | 'fireworks' | 'trophy';
}

const MILESTONE_CONFIG: Record<Milestone, Omit<MilestoneInfo, 'milestone'>> = {
  25: {
    message: 'Great start! You\'re building momentum.',
    emoji: '🚀',
    celebration: 'sparkle',
  },
  50: {
    message: 'Halfway there! Keep up the excellent work.',
    emoji: '⭐',
    celebration: 'confetti',
  },
  75: {
    message: 'Almost there! The finish line is in sight.',
    emoji: '🔥',
    celebration: 'sparkle',
  },
  100: {
    message: 'Congratulations! You\'ve completed this pathway.',
    emoji: '🏆',
    celebration: 'trophy',
  },
};

/**
 * Check if a milestone was crossed between previous and new progress
 *
 * @param previousProgress - Progress before the update (0-100)
 * @param newProgress - Progress after the update (0-100)
 * @returns The milestone crossed, or null if none
 */
export function checkMilestone(
  previousProgress: number,
  newProgress: number
): Milestone | null {
  for (const milestone of MILESTONES) {
    if (previousProgress < milestone && newProgress >= milestone) {
      return milestone;
    }
  }
  return null;
}

/**
 * Get milestone info for a specific milestone value
 */
export function getMilestoneInfo(milestone: Milestone): MilestoneInfo {
  return {
    milestone,
    ...MILESTONE_CONFIG[milestone],
  };
}

/**
 * Get the next milestone for a given progress value
 */
export function getNextMilestone(progress: number): Milestone | null {
  for (const milestone of MILESTONES) {
    if (progress < milestone) {
      return milestone;
    }
  }
  return null;
}

/**
 * Calculate progress to next milestone
 *
 * @param currentProgress - Current progress (0-100)
 * @returns Object with next milestone info and progress towards it
 */
export function getProgressToNextMilestone(currentProgress: number): {
  nextMilestone: Milestone | null;
  progressToNext: number;
  percentToNext: number;
} {
  const nextMilestone = getNextMilestone(currentProgress);

  if (!nextMilestone) {
    return {
      nextMilestone: null,
      progressToNext: 0,
      percentToNext: 100,
    };
  }

  // Find previous milestone (or 0)
  const previousMilestone = MILESTONES.find((m, i) =>
    i === 0 ? currentProgress < m : MILESTONES[i - 1] <= currentProgress && currentProgress < m
  );
  const startPoint = previousMilestone ? MILESTONES[MILESTONES.indexOf(previousMilestone) - 1] || 0 : 0;

  const progressToNext = nextMilestone - currentProgress;
  const range = nextMilestone - startPoint;
  const percentToNext = range > 0 ? ((currentProgress - startPoint) / range) * 100 : 0;

  return {
    nextMilestone,
    progressToNext,
    percentToNext,
  };
}
