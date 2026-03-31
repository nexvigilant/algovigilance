'use server';

import { getUserProgressStats } from '@/lib/academy/unified-progress';
import { getDueCardsGrouped } from '@/lib/actions/fsrs';
import { logger } from '@/lib/logger';

const log = logger.scope('academy/stats-actions');

export async function getMyAcademyStats(userId: string) {
  try {
    const [progressStats, dueCards] = await Promise.all([
      getUserProgressStats(userId),
      getDueCardsGrouped(userId).catch(() => ({ learning: [], review: [], relearning: [], total: 0 })),
    ]);

    return {
      pathwaysEnrolled: progressStats.totalCourses,
      pathwaysCompleted: progressStats.coursesCompleted,
      lessonsCompleted: progressStats.totalLessonsCompleted,
      dueReviews: dueCards.total,
    };
  } catch (error) {
    log.error('Failed to fetch academy stats:', error);
    return {
      pathwaysEnrolled: 0,
      pathwaysCompleted: 0,
      lessonsCompleted: 0,
      dueReviews: 0,
    };
  }
}
