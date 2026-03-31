'use server';

import { adminDb } from '@/lib/firebase-admin';

import { logger } from '@/lib/logger';
const log = logger.scope('academy/domain-leaderboard-actions');

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  completedPathways: number;
  totalPathways: number;
  averageProgress: number;
  topDomain: string;
}

/**
 * Compute domain leaderboard from enrollment data.
 * Ranks users by completed pathways (tiebreaker: average progress).
 * Display names are partially masked for privacy.
 */
export async function getDomainLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  try {
    // Get all enrollments
    const enrollmentsSnap = await adminDb.collection('enrollments').get();

    // Group by userId
    const userMap = new Map<string, {
      completed: number;
      total: number;
      progressSum: number;
      domains: Map<string, number>;
    }>();

    for (const doc of enrollmentsSnap.docs) {
      const data = doc.data();
      const userId = data.userId as string;

      if (!userMap.has(userId)) {
        userMap.set(userId, { completed: 0, total: 0, progressSum: 0, domains: new Map() });
      }

      const entry = userMap.get(userId);
      if (!entry) continue;
      entry.total++;
      entry.progressSum += (data.progress as number) ?? 0;

      if (data.status === 'completed') {
        entry.completed++;
      }

      // Track domain from courseId (we'll resolve names below)
      const courseId = data.courseId as string;
      entry.domains.set(courseId, (entry.domains.get(courseId) ?? 0) + 1);
    }

    // Get course topics for domain names
    const coursesSnap = await adminDb.collection('courses').get();
    const courseTopics = new Map<string, string>();
    for (const doc of coursesSnap.docs) {
      const data = doc.data();
      courseTopics.set(doc.id, (data.topic as string) ?? 'General');
    }

    // Get user display names
    const userIds = [...userMap.keys()];
    const userNames = new Map<string, string>();

    // Batch fetch users (Firestore limits to 30 per `in` query)
    for (let i = 0; i < userIds.length; i += 30) {
      const batch = userIds.slice(i, i + 30);
      const usersSnap = await adminDb
        .collection('users')
        .where('__name__', 'in', batch)
        .get();

      for (const doc of usersSnap.docs) {
        const data = doc.data();
        const name = (data.displayName as string) ?? (data.email as string) ?? 'Practitioner';
        userNames.set(doc.id, maskName(name));
      }
    }

    // Build and sort leaderboard
    const entries: LeaderboardEntry[] = [];

    for (const [userId, stats] of userMap.entries()) {
      // Find top domain
      let topCourseId = '';
      let maxCount = 0;
      for (const [courseId, count] of stats.domains) {
        if (count > maxCount) {
          maxCount = count;
          topCourseId = courseId;
        }
      }

      entries.push({
        userId,
        displayName: userNames.get(userId) ?? 'Practitioner',
        completedPathways: stats.completed,
        totalPathways: stats.total,
        averageProgress: stats.total > 0 ? stats.progressSum / stats.total : 0,
        topDomain: courseTopics.get(topCourseId) ?? 'General',
      });
    }

    // Sort: completed desc, then average progress desc
    entries.sort((a, b) => {
      if (b.completedPathways !== a.completedPathways) {
        return b.completedPathways - a.completedPathways;
      }
      return b.averageProgress - a.averageProgress;
    });

    return entries.slice(0, limit);
  } catch (error) {
    log.error('Failed to compute leaderboard:', error);
    return [];
  }
}

/** Mask display name for privacy (show first initial + last initial) */
function maskName(name: string): string {
  if (!name) return 'Practitioner';

  // Email - show first char + domain
  if (name.includes('@')) {
    const [local, domain] = name.split('@');
    return `${local[0]}***@${domain}`;
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const n = parts[0];
    if (n.length <= 2) return n;
    return `${n[0]}${'*'.repeat(n.length - 2)}${n[n.length - 1]}`;
  }

  // Multi-word: "John Smith" → "J. S."
  return parts.map(p => `${p[0]}.`).join(' ');
}
