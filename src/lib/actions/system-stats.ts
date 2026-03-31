'use server';

/**
 * System Stats Management
 *
 * Server actions for dashboard KPIs and system-wide statistics.
 * Manages aggregate stats stored in the system_stats collection.
 */

import {
  getDocument,
  updateDocument,
  createDocument,
  nowTimestamp,
} from '@/lib/firestore-utils';
import { logger } from '@/lib/logger';
import {
  SystemStatsSchema,
  type SystemStats,
  type StatType,
  type Trend,
} from '@/lib/schemas/firestore';
import type { DashboardKPI } from '@/types';

// ============================================================================
// System Stats Operations
// ============================================================================

/**
 * Get a specific system stat by type
 *
 * @param statType - Type of stat to retrieve
 * @returns System stat or null if not found
 */
export async function getSystemStat(
  statType: StatType
): Promise<SystemStats | null> {
  try {
    return await getDocument('system_stats', statType, SystemStatsSchema);
  } catch (error) {
    logger.error('system-stats', `Error getting ${statType} stat`, { error });
    return null;
  }
}

/**
 * Update or create a system stat
 *
 * @param statType - Type of stat to update
 * @param value - New stat value
 * @param change - Change description (e.g., "+20.1% from last month")
 * @param trend - Trend indicator ('up', 'down', or 'neutral')
 * @returns Success status
 */
export async function updateSystemStat(
  statType: StatType,
  value: number,
  change: string,
  trend: Trend
): Promise<{ success: boolean; error?: string }> {
  try {
    const stat = {
      statType,
      value,
      change,
      trend,
      lastUpdated: nowTimestamp(),
    };

    // Try to get existing stat
    const existing = await getSystemStat(statType);

    if (existing) {
      // Update existing stat
      await updateDocument('system_stats', statType, stat);
    } else {
      // Create new stat
      await createDocument('system_stats', statType, stat, SystemStatsSchema);
    }

    return { success: true };
  } catch (error) {
    logger.error('system-stats', `Error updating ${statType} stat`, { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all dashboard KPIs
 *
 * Fetches all system stats and formats them for the dashboard
 *
 * @returns Array of dashboard KPIs
 */
export async function getDashboardKPIs(): Promise<DashboardKPI[]> {
  try {
    // Fetch all stats in parallel
    const [
      communityMembers,
      academyCourses,
      guardianThreats,
      careersRoles,
    ] = await Promise.all([
      getSystemStat('community_members'),
      getSystemStat('academy_courses'),
      getSystemStat('guardian_threats'),
      getSystemStat('careers_roles'),
    ]);

    // Format for dashboard
    const kpis: DashboardKPI[] = [
      {
        title: 'Community Members',
        value: communityMembers?.value.toLocaleString() || '0',
        change: communityMembers?.change || 'No data',
        trend: communityMembers?.trend || 'neutral',
      },
      {
        title: 'Academy Courses',
        value: academyCourses?.value || 0,
        change: academyCourses?.change || 'No data',
        trend: academyCourses?.trend || 'neutral',
      },
      {
        title: 'Guardian Threats Mitigated',
        value: guardianThreats?.value.toLocaleString() || '0',
        change: guardianThreats?.change || 'Live Monitoring Active',
        trend: guardianThreats?.trend || 'neutral',
      },
      {
        title: 'Careers™ Active Roles',
        value: careersRoles?.value || 0,
        change: careersRoles?.change || 'No data',
        trend: careersRoles?.trend || 'neutral',
      },
    ];

    return kpis;
  } catch (error) {
    logger.error('system-stats', 'Error getting dashboard KPIs', { error });

    // Return fallback data if Firestore query fails
    return [
      {
        title: 'Community Members',
        value: '0',
        change: 'No data',
        trend: 'neutral',
      },
      {
        title: 'Academy Courses',
        value: 0,
        change: 'No data',
        trend: 'neutral',
      },
      {
        title: 'Guardian Threats Mitigated',
        value: '0',
        change: 'Live Monitoring Active',
        trend: 'neutral',
      },
      {
        title: 'Careers™ Active Roles',
        value: 0,
        change: 'No data',
        trend: 'neutral',
      },
    ];
  }
}

/**
 * Initialize system stats with default values
 *
 * Used for seeding the database or resetting stats
 *
 * @returns Success status
 */
export async function initializeSystemStats(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const defaultStats: Array<{
      statType: StatType;
      value: number;
      change: string;
      trend: Trend;
    }> = [
      {
        statType: 'community_members',
        value: 0,
        change: 'Getting started',
        trend: 'neutral',
      },
      {
        statType: 'academy_courses',
        value: 0,
        change: 'Coming Q1 2026',
        trend: 'neutral',
      },
      {
        statType: 'guardian_threats',
        value: 0,
        change: 'Live Monitoring Active',
        trend: 'neutral',
      },
      {
        statType: 'careers_roles',
        value: 0,
        change: 'Coming Q2 2026',
        trend: 'neutral',
      },
    ];

    // Create all stats in parallel
    await Promise.all(
      defaultStats.map((stat) =>
        updateSystemStat(stat.statType, stat.value, stat.change, stat.trend)
      )
    );

    return { success: true };
  } catch (error) {
    logger.error('system-stats', 'Error initializing system stats', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Stat Calculation Helpers (for Cloud Functions or scheduled tasks)
// ============================================================================

/**
 * Calculate community member count from users collection
 *
 * This would typically be called by a Cloud Function or scheduled task
 * to update the community_members stat based on actual user count
 *
 * @returns Updated stat or null if calculation failed
 */
export async function calculateCommunityMemberCount(): Promise<SystemStats | null> {
  try {
    // TODO: Implement actual count query when needed
    // For now, this is a placeholder
    // In production, you'd use:
    // const snapshot = await getDocs(collection(db, 'users'));
    // const count = snapshot.size;

    logger.warn('system-stats', 'calculateCommunityMemberCount not fully implemented');
    return null;
  } catch (error) {
    logger.error('system-stats', 'Error calculating community member count', { error });
    return null;
  }
}

/**
 * Calculate Academy course count from courses collection
 *
 * @returns Updated stat or null if calculation failed
 */
export async function calculateAcademyCourseCount(): Promise<SystemStats | null> {
  try {
    // TODO: Implement when courses collection is populated (Q1 2026)
    logger.warn('system-stats', 'calculateAcademyCourseCount not fully implemented');
    return null;
  } catch (error) {
    logger.error('system-stats', 'Error calculating academy course count', { error });
    return null;
  }
}

/**
 * Calculate Guardian threat count from threats collection
 *
 * @returns Updated stat or null if calculation failed
 */
export async function calculateGuardianThreatCount(): Promise<SystemStats | null> {
  try {
    // TODO: Implement when threat monitoring is active (Q3-Q4 2026)
    logger.warn('system-stats', 'calculateGuardianThreatCount not fully implemented');
    return null;
  } catch (error) {
    logger.error('system-stats', 'Error calculating guardian threat count', { error });
    return null;
  }
}

/**
 * Calculate Careers active role count from jobs collection
 *
 * @returns Updated stat or null if calculation failed
 */
export async function calculateCareersRoleCount(): Promise<SystemStats | null> {
  try {
    // TODO: Implement when jobs collection is populated (Q2 2026)
    logger.warn('system-stats', 'calculateCareersRoleCount not fully implemented');
    return null;
  } catch (error) {
    logger.error('system-stats', 'Error calculating careers role count', { error });
    return null;
  }
}

// ============================================================================
// Academy Leaderboard
// ============================================================================

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  rank: number;
}

/**
 * Get top learners for the Academy leaderboard
 *
 * Fetches users with the most course completions or certifications.
 * Returns top 3 by default.
 *
 * @param limit - Number of top learners to return (default: 3)
 * @returns Array of leaderboard entries
 */
export async function getTopLearners(limit: number = 3): Promise<LeaderboardEntry[]> {
  try {
    // Query users ordered by completedCourses count (descending)
    const { adminDb } = await import('@/lib/firebase-admin');
    const usersSnapshot = await adminDb
      .collection('users')
      .where('completedCourses', '>', 0)
      .orderBy('completedCourses', 'desc')
      .limit(limit)
      .get();

    if (usersSnapshot.empty) {
      // Return placeholder data when no learners have completed courses
      return [];
    }

    const entries: LeaderboardEntry[] = usersSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || data.name || 'Anonymous Learner',
        avatar: data.photoURL || data.avatar,
        title: data.title || data.role || 'Community Member',
        rank: index + 1,
      };
    });

    return entries;
  } catch (error) {
    logger.error('system-stats', 'Error fetching top learners', { error });
    // Return empty array on error - UI will show placeholder
    return [];
  }
}
