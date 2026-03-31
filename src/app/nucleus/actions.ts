'use server';

/**
 * Nucleus Server Actions
 *
 * Server-side functions that can be called from client components
 * to perform data fetching, mutations, and other server operations.
 */

import type { DashboardKPI, ThreatEvent, LeaderboardEntry } from '@/types';
import { getDashboardKPIs as getKPIsFromDB } from '@/lib/actions/system-stats';
import { getThreatEvents as getThreatsFromDB } from '@/lib/actions/threats';
import {
  updateUserProfile as updateProfileDB,
  updateNotificationPreferences as updatePreferencesDB
} from '@/lib/actions/users';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

import { logger } from '@/lib/logger';
const log = logger.scope('nucleus/actions');

/**
 * Get authenticated user from session cookie
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  const token = (await cookies()).get('nucleus_id_token')?.value;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ============================================================================
// Nucleus Data Actions
// ============================================================================

/**
 * Fetch nucleus KPIs for the authenticated user
 */
export async function getDashboardKPIs(): Promise<DashboardKPI[]> {
  return getKPIsFromDB();
}

/**
 * Fetch recent threat events from Guardian
 */
export async function getThreatEvents(): Promise<ThreatEvent[]> {
  return getThreatsFromDB(3); // Get latest 3 for nucleus
}

/**
 * Fetch Academy leaderboard
 * Calculates rankings based on:
 * - Completed courses (100 points each)
 * - Quiz points earned
 * - Certificates earned (bonus 50 points each)
 */
export async function getAcademyLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');

    // Fetch all enrollments, certificates, and users in parallel
    const enrollmentsQuery = query(collection(db, 'enrollments'));
    const certificatesQuery = query(
      collection(db, 'certificates'),
      where('isRevoked', '==', false)
    );
    const usersQuery = query(collection(db, 'users'));

    const [enrollmentsSnapshot, certificatesSnapshot, usersSnapshot] = await Promise.all([
      getDocs(enrollmentsQuery),
      getDocs(certificatesQuery),
      getDocs(usersQuery),
    ]);

    // Create maps for quick lookup
    const userMap = new Map();
    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      userMap.set(doc.id, {
        id: doc.id,
        name: data.displayName || data.email || 'Anonymous User',
        email: data.email,
      });
    });

    const certificateCountMap = new Map();
    certificatesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const count = certificateCountMap.get(data.userId) || 0;
      certificateCountMap.set(data.userId, count + 1);
    });

    // Calculate points for each user
    const userPoints = new Map();

    enrollmentsSnapshot.docs.forEach((doc) => {
      const enrollment = doc.data();
      const userId = enrollment.userId;

      if (!userId) return;

      let points = userPoints.get(userId) || 0;

      // Points for completed courses (100 each)
      if (enrollment.status === 'completed') {
        points += 100;
      }

      // Points from quiz scores
      if (enrollment.quizScores && Array.isArray(enrollment.quizScores)) {
        enrollment.quizScores.forEach((quizScore: { score: number }) => {
          points += Math.round((quizScore.score / 100) * 50); // Max 50 points per quiz
        });
      }

      userPoints.set(userId, points);
    });

    // Add certificate bonus points
    certificateCountMap.forEach((certCount, userId) => {
      const points = userPoints.get(userId) || 0;
      userPoints.set(userId, points + (certCount * 50)); // 50 bonus points per certificate
    });

    // Convert to leaderboard entries
    const leaderboardEntries: LeaderboardEntry[] = [];

    userPoints.forEach((points, userId) => {
      const user = userMap.get(userId);
      if (user && points > 0) {
        const certCount = certificateCountMap.get(userId) || 0;
        leaderboardEntries.push({
          id: userId,
          name: user.name,
          role: certCount > 0 ? `${certCount} Verification${certCount !== 1 ? 's' : ''}` : 'Practitioner',
          rank: 0, // Will be assigned after sorting
          points,
        });
      }
    });

    // Sort by points descending
    leaderboardEntries.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

    // Assign ranks
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Return top 10
    return leaderboardEntries.slice(0, 10);
  } catch (error) {
    log.error('Error fetching leaderboard:', error);
    // Return empty array on error
    return [];
  }
}

// ============================================================================
// User Profile Actions
// ============================================================================

/**
 * Update user profile information
 */
export async function updateUserProfile(data: {
  name?: string;
  avatar?: string;
  professionalTitle?: string;
  bio?: string;
}, _userId?: string) {  // userId ignored - we get it from session
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, message: 'Not authenticated' };
  }
  return updateProfileDB(userId, data);
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(preferences: {
  email: boolean;
  push: boolean;
  sms: boolean;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, message: 'Not authenticated' };
  }
  return updatePreferencesDB(userId, preferences);
}

// ============================================================================
// Helper Functions (Internal Use)
// ============================================================================

/**
 * Revalidate nucleus data
 * Used to trigger fresh data fetches
 */
export async function revalidateDashboard() {
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/nucleus');

  return { success: true };
}
