'use server';

/**
 * Onboarding Analytics Server Actions
 *
 * Provides aggregated analytics data for the onboarding funnel.
 * Used by admin dashboards to monitor onboarding health.
 *
 * @module actions/admin/onboarding-analytics
 */

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { OnboardingJourney } from '@/types/onboarding-journey';
import type { Timestamp } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';

const log = logger.scope('admin/onboarding-analytics');

/**
 * Safely convert a timestamp field to a Date object
 * Handles Firestore Timestamp, Date, and ISO string formats
 */
function toDate(value: Timestamp | Date | string | null | undefined): Date | null {
  if (!value) return null;

  // If it's already a Date
  if (value instanceof Date) return value;

  // If it's a string (ISO date)
  if (typeof value === 'string') return new Date(value);

  // If it's a Firestore Timestamp (has toDate method)
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return toDateFromSerialized(value);
  }

  // Fallback: try to create Date from whatever it is
  return new Date(value as unknown as string);
}

interface AnalyticsData {
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  avgCompletionTime: number;
  stepMetrics: {
    stepId: string;
    started: number;
    completed: number;
    skipped: number;
    dropOff: number;
  }[];
  recentActivity: {
    date: string;
    started: number;
    completed: number;
  }[];
}

/**
 * Get authenticated user from session cookie
 */
async function getAuthenticatedUser() {
  const token = (await cookies()).get('nucleus_id_token')?.value;
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch {
    return null;
  }
}

/**
 * Check if user has admin role
 * @internal Used when admin-only access is required
 */
async function _isAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    const data = userDoc.data();
    return data?.role === 'admin' || data?.roles?.includes('admin');
  } catch {
    return false;
  }
}

/**
 * Get aggregated onboarding analytics
 */
export async function getOnboardingAnalytics(): Promise<{
  success: boolean;
  analytics?: AnalyticsData;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Optional: Require admin role for production
    // if (process.env.NODE_ENV === 'production') {
    //   const adminCheck = await isAdmin(user.uid);
    //   if (!adminCheck) {
    //     return { success: false, error: 'Admin access required' };
    //   }
    // }

    // Query all journey documents using collection group
    const journeysRef = adminDb.collectionGroup('onboarding');
    const journeysSnapshot = await journeysRef.get();

    if (journeysSnapshot.empty) {
      return {
        success: true,
        analytics: {
          totalStarted: 0,
          totalCompleted: 0,
          completionRate: 0,
          avgCompletionTime: 0,
          stepMetrics: [],
          recentActivity: [],
        },
      };
    }

    // Aggregate metrics
    let totalStarted = 0;
    let totalCompleted = 0;
    let totalCompletionTime = 0;
    let completionTimeCount = 0;

    const stepMetrics: Record<string, {
      started: number;
      completed: number;
      skipped: number;
    }> = {
      profile: { started: 0, completed: 0, skipped: 0 },
      discovery: { started: 0, completed: 0, skipped: 0 },
      circle: { started: 0, completed: 0, skipped: 0 },
      introduce: { started: 0, completed: 0, skipped: 0 },
      connect: { started: 0, completed: 0, skipped: 0 },
    };

    const recentActivityMap: Record<string, { started: number; completed: number }> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      recentActivityMap[dateKey] = { started: 0, completed: 0 };
    }

    journeysSnapshot.docs.forEach((doc) => {
      // Only process journey documents (not quiz, etc.)
      if (doc.id !== 'journey') return;

      const journey = doc.data() as OnboardingJourney;
      totalStarted++;

      if (journey.isComplete) {
        totalCompleted++;
      }

      // Calculate completion time
      if (journey.startedAt && journey.completedAt) {
        const startTime = toDate(journey.startedAt);
        const endTime = toDate(journey.completedAt);
        if (startTime && endTime) {
          const minutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
          if (minutes > 0 && minutes < 10000) { // Filter outliers
            totalCompletionTime += minutes;
            completionTimeCount++;
          }
        }
      }

      // Aggregate step metrics
      if (journey.steps) {
        Object.entries(journey.steps).forEach(([stepId, step]) => {
          if (stepMetrics[stepId]) {
            if (step.status === 'in_progress' || step.status === 'completed' || step.status === 'skipped') {
              stepMetrics[stepId].started++;
            }
            if (step.status === 'completed') {
              stepMetrics[stepId].completed++;
            }
            if (step.status === 'skipped') {
              stepMetrics[stepId].skipped++;
            }
          }
        });
      }

      // Track recent activity
      if (journey.startedAt) {
        const startDate = toDate(journey.startedAt);
        if (startDate) {
          const dateKey = startDate.toISOString().split('T')[0];
          if (recentActivityMap[dateKey]) {
            recentActivityMap[dateKey].started++;
          }
        }
      }
      if (journey.completedAt) {
        const completedDate = toDate(journey.completedAt);
        if (completedDate) {
          const dateKey = completedDate.toISOString().split('T')[0];
          if (recentActivityMap[dateKey]) {
            recentActivityMap[dateKey].completed++;
          }
        }
      }
    });

    // Calculate drop-off for each step
    const stepIds = ['profile', 'discovery', 'circle', 'introduce', 'connect'];
    const formattedStepMetrics = stepIds.map((stepId, index) => {
      const metric = stepMetrics[stepId];
      const previousStarted = index === 0 ? totalStarted : stepMetrics[stepIds[index - 1]].started;
      const dropOff = previousStarted - metric.started;

      return {
        stepId,
        started: metric.started,
        completed: metric.completed,
        skipped: metric.skipped,
        dropOff: dropOff > 0 ? dropOff : 0,
      };
    });

    const completionRate = totalStarted > 0
      ? Math.round((totalCompleted / totalStarted) * 100)
      : 0;

    const avgCompletionTime = completionTimeCount > 0
      ? Math.round(totalCompletionTime / completionTimeCount)
      : 0;

    const recentActivity = Object.entries(recentActivityMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        started: data.started,
        completed: data.completed,
      }));

    log.info('Generated onboarding analytics', {
      totalStarted,
      totalCompleted,
      completionRate,
    });

    return {
      success: true,
      analytics: {
        totalStarted,
        totalCompleted,
        completionRate,
        avgCompletionTime,
        stepMetrics: formattedStepMetrics,
        recentActivity,
      },
    };
  } catch (error) {
    log.error('Error generating onboarding analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics',
    };
  }
}
