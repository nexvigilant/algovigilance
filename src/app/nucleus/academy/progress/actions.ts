'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Enrollment, Certificate } from '@/types/academy';
import { getStreakData } from '@/lib/actions/fsrs';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('progress/actions');

/**
 * Serialize a Firebase Timestamp to ISO string for safe client component transfer.
 * Handles:
 * - Admin SDK Timestamps with .seconds/.nanoseconds getters
 * - Raw Firestore data with _seconds/_nanoseconds properties
 * - Timestamps with toDate() method
 * - Date objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function timestampToISOString(ts: any): string | null {
  if (!ts) return null;

  // Handle raw Firestore data (when timestamps come through as plain objects with _seconds)
  // Check this FIRST as it's most common from doc.data()
  if ('_seconds' in ts && '_nanoseconds' in ts) {
    return new Date(ts._seconds * 1000 + ts._nanoseconds / 1_000_000).toISOString();
  }

  // Handle Admin SDK Timestamp (has .seconds and .nanoseconds as getters or properties)
  if ('seconds' in ts && 'nanoseconds' in ts) {
    return new Date(ts.seconds * 1000 + ts.nanoseconds / 1_000_000).toISOString();
  }

  // Handle Timestamp with toDate method
  if (typeof ts.toDate === 'function') {
    return toDateFromSerialized(ts).toISOString();
  }

  // Handle Date objects
  if (ts instanceof Date) {
    return ts.toISOString();
  }

  return null;
}

// Serialized analytics type (uses ISO strings for timestamps - safe for client components)
export interface ProgressAnalytics {
  userId: string;
  periodStart: string | null;
  periodEnd: string | null;
  coursesEnrolled: number;
  coursesCompleted: number;
  coursesInProgress: number;
  totalLearningTime: number;
  lessonsCompleted: number;
  averageQuizScore: number;
  certificatesEarned: number;
  daysActive: number;
  currentStreak: number;
  longestStreak: number;
  skillsAcquired: number;
  skillLevel: 'novice' | 'intermediate' | 'advanced' | 'expert';
  calculatedAt: string | null;
}

/**
 * Calculate practitioner analytics from enrollment and verification data
 */
export async function getProgressAnalytics(userId: string): Promise<ProgressAnalytics | null> {
  try {
    // Fetch all enrollments for the user (using Admin SDK)
    const enrollmentsSnapshot = await adminDb
      .collection('enrollments')
      .where('userId', '==', userId)
      .get();
    const enrollments = enrollmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Enrollment[];

    // Fetch all certificates for the user (using Admin SDK)
    const certificatesSnapshot = await adminDb
      .collection('certificates')
      .where('userId', '==', userId)
      .where('isRevoked', '==', false)
      .get();
    const certificates = certificatesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Certificate[];

    // Calculate analytics
    const coursesEnrolled = enrollments.length;
    const coursesCompleted = enrollments.filter((e) => e.status === 'completed').length;
    const coursesInProgress = enrollments.filter((e) => e.status === 'in-progress').length;

    // Calculate learning time from enrollments
    const totalLearningTime = enrollments.reduce((sum, enrollment) => {
      // Estimate learning time from progress and completed lessons
      const estimatedTime = enrollment.completedLessons?.length ?? 0 * 30; // ~30 min per lesson
      return sum + estimatedTime;
    }, 0);

    // Calculate average quiz score
    const allQuizScores = enrollments.flatMap((e) => e.quizScores?.map((q) => q.score) ?? []);
    const averageQuizScore =
      allQuizScores.length > 0
        ? Math.round(allQuizScores.reduce((a, b) => a + b, 0) / allQuizScores.length)
        : 0;

    // Estimate skills acquired (1 skill per completed course + additional from lessons)
    const skillsAcquired = coursesCompleted + Math.floor(coursesCompleted * 0.5);

    // Calculate engagement metrics
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentEnrollments = enrollments.filter((e) => {
      const lastAccessed = toDateFromSerialized(e.lastAccessedAt) ?? toDateFromSerialized(e.enrolledAt);
      return lastAccessed && lastAccessed > thirtyDaysAgo;
    });

    const daysActive = new Set(
      recentEnrollments.flatMap((e) => {
        const lastAccessed = toDateFromSerialized(e.lastAccessedAt) ?? new Date();
        const enrolled = toDateFromSerialized(e.enrolledAt) ?? new Date();
        const days = [];
        for (let d = new Date(enrolled); d <= lastAccessed; d.setDate(d.getDate() + 1)) {
          days.push(d.toDateString());
        }
        return days;
      })
    ).size;

    // Calculate completion percentage
    const lessonsCompleted = enrollments.reduce((sum, e) => sum + (e.completedLessons?.length ?? 0), 0);

    // Determine skill level based on courses completed
    let skillLevel: 'novice' | 'intermediate' | 'advanced' | 'expert' = 'novice';
    if (coursesCompleted >= 1) skillLevel = 'intermediate';
    if (coursesCompleted >= 3) skillLevel = 'advanced';
    if (coursesCompleted >= 5) skillLevel = 'expert';

    // Get real streak data
    const streakData = await getStreakData(userId);

    // Serialize timestamps to ISO strings for safe client component transfer
    const now = Timestamp.fromDate(new Date());
    const analytics: ProgressAnalytics = {
      userId,
      periodStart: timestampToISOString(enrollments[0]?.enrolledAt ?? now),
      periodEnd: timestampToISOString(now),
      coursesEnrolled,
      coursesCompleted,
      coursesInProgress,
      totalLearningTime: Math.max(60, totalLearningTime), // Minimum 60 minutes for demo
      lessonsCompleted,
      averageQuizScore,
      certificatesEarned: certificates.length,
      daysActive: Math.max(1, daysActive),
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      skillsAcquired,
      skillLevel,
      calculatedAt: timestampToISOString(now)
    };

    return analytics;
  } catch (error) {
    log.error('[getProgressAnalytics] Error calculating analytics:', error);
    return null;
  }
}
