'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { withTiming } from '../utils/performance';

import { logger } from '@/lib/logger';
const log = logger.scope('user/directory');

/**
 * Helper to get authenticated user from session cookie
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
 * Member filters for directory
 */
export interface MemberFilters {
  search?: string;
  specialties?: string[];
  careerStage?: string;
  location?: string;
  goals?: string[];
  verifiedOnly?: boolean;
  sortBy?: 'newest' | 'reputation' | 'activity' | 'alphabetical';
  limit?: number;
  offset?: number;
}

/**
 * Member directory entry
 */
/**
 * Pathway progress for a user's Capability Pathway journey
 */
export interface PathwayProgress {
  pathwayId: string;
  pathwayName: string;
  progressPercent: number;
  completedMilestones: number;
  totalMilestones: number;
  isPrimary: boolean;
}

/**
 * Member directory entry
 */
export interface MemberDirectoryEntry {
  userId: string;
  name: string;
  avatar: string | null;
  title: string | null;
  organization: string | null;
  location: string | null;
  bio: string | null;
  specialties: string[];
  careerStage: string | null;
  reputationPoints: number;
  reputationLevel: string;
  postCount: number;
  joinedAt: string;
  isOnline: boolean;
  verifiedPractitioner: boolean;
  pathwayProgress?: PathwayProgress[];
}

// In-memory cache for filter options (refreshes every 5 minutes)
let filterOptionsCache: {
  data: { specialties: string[]; careerStages: string[]; locations: string[]; goals: string[] };
  expiresAt: number;
} | null = null;

const FILTER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get all available filter options
 * Cached in-memory to avoid full collection scan on every request.
 */
export async function getMemberFilterOptions(): Promise<{
  success: boolean;
  options?: {
    specialties: string[];
    careerStages: string[];
    locations: string[];
    goals: string[];
  };
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Return cached options if still fresh
    if (filterOptionsCache && Date.now() < filterOptionsCache.expiresAt) {
      return { success: true, options: filterOptionsCache.data };
    }

    // Cache miss — fetch and rebuild
    const usersSnapshot = await adminDb
      .collection('users')
      .select('specialties', 'location')
      .limit(500)
      .get();

    const specialtiesSet = new Set<string>();
    const locationsSet = new Set<string>();

    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.specialties) {
        data.specialties.forEach((s: string) => specialtiesSet.add(s));
      }
      if (data.location) {
        locationsSet.add(data.location);
      }
    });

    const careerStages = [
      'practitioner',
      'transitioning',
      'early-career',
      'mid-career',
      'senior',
      'expert',
    ];

    const goals = [
      'networking',
      'learning',
      'job-seeking',
      'mentoring',
      'sharing-knowledge',
    ];

    const options = {
      specialties: Array.from(specialtiesSet).sort(),
      careerStages,
      locations: Array.from(locationsSet).sort(),
      goals,
    };

    // Cache the result
    filterOptionsCache = {
      data: options,
      expiresAt: Date.now() + FILTER_CACHE_TTL_MS,
    };

    return { success: true, options };
  } catch (error) {
    log.error('Error fetching filter options:', error);
    return { success: false, error: 'Failed to fetch filter options' };
  }
}

/**
 * Get members with filters
 *
 * OPTIMIZED: Uses batch reads (getAll) instead of N+1 individual queries
 * for reputation and interest profile data.
 */
export async function getMembers(filters: MemberFilters = {}): Promise<{
  success: boolean;
  members?: MemberDirectoryEntry[];
  total?: number;
  error?: string;
}> {
  return withTiming('getMembers', async () => {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { search, specialties, careerStage, location, goals, verifiedOnly, sortBy = 'newest', limit = 20, offset = 0 } = filters;

    // Build query - Firestore has limited query capabilities, so we do some filtering in memory
    const query = adminDb.collection('users').limit(500);

    // Get users
    const usersSnapshot = await query.get();
    const userIds = usersSnapshot.docs.map(doc => doc.id);

    // ========================================
    // BATCH READS - Fix for N+1 query problem
    // Instead of N individual queries, we use getAll() for batch reads
    // ========================================

    // Build document references for batch fetch
    const reputationRefs = userIds.map(id =>
      adminDb.collection('user_reputations').doc(id)
    );
    const interestRefs = userIds.map(id =>
      adminDb.collection('user_interest_profiles').doc(id)
    );

    // Batch fetch reputation and interest data (2 batch reads instead of 2N individual reads)
    const [reputationDocs, interestDocs] = await Promise.all([
      reputationRefs.length > 0 ? adminDb.getAll(...reputationRefs) : Promise.resolve([]),
      interestRefs.length > 0 ? adminDb.getAll(...interestRefs) : Promise.resolve([]),
    ]);

    // Build lookup maps for O(1) access
    const reputationMap = new Map<string, { totalPoints: number }>();
    reputationDocs.forEach(doc => {
      if (doc.exists) {
        reputationMap.set(doc.id, doc.data() as { totalPoints: number });
      }
    });

    const interestMap = new Map<string, { careerStage?: string; goals?: string[] }>();
    interestDocs.forEach(doc => {
      if (doc.exists) {
        interestMap.set(doc.id, doc.data() as { careerStage?: string; goals?: string[] });
      }
    });

    // Build member entries using lookup maps and denormalized postCount
    // (No more N+1 count queries - postCount is now denormalized on user documents)
    const memberResults = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      const userId = doc.id;

      // Get reputation from batch-loaded map
      const repData = reputationMap.get(userId);
      const reputationPoints = repData?.totalPoints || 0;
      const reputationLevel = getReputationLevelName(reputationPoints);

      // Get interest profile from batch-loaded map
      const interestData = interestMap.get(userId);
      const memberCareerStage = interestData?.careerStage || null;
      const memberGoals = interestData?.goals || [];

      // Get post count from denormalized user stats (no query needed!)
      const postCount = data.stats?.postCount || 0;

      const entry: MemberDirectoryEntry = {
        userId,
        name: data.name || data.displayName || 'Anonymous',
        avatar: data.avatar || data.photoURL || null,
        title: data.title || null,
        organization: data.organization || null,
        location: data.location || null,
        bio: data.bio || null,
        specialties: data.specialties || [],
        careerStage: memberCareerStage,
        reputationPoints,
        reputationLevel,
        postCount,
        joinedAt: data.createdAt?._seconds
          ? new Date(data.createdAt._seconds * 1000).toISOString()
          : new Date().toISOString(),
        isOnline: data.isOnline || false,
        verifiedPractitioner: Boolean(data.capability?.verifiedPractitioner),
      };

      return { entry, goals: memberGoals };
    });

    // Apply filters
    let filteredMembers = memberResults
      .filter(({ entry, goals: memberGoals }) => {
        // Search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesSearch =
            entry.name.toLowerCase().includes(searchLower) ||
            (entry.title?.toLowerCase().includes(searchLower) ?? false) ||
            (entry.organization?.toLowerCase().includes(searchLower) ?? false) ||
            (entry.bio?.toLowerCase().includes(searchLower) ?? false) ||
            entry.specialties.some((s) => s.toLowerCase().includes(searchLower));
          if (!matchesSearch) return false;
        }

        // Specialties filter
        if (specialties && specialties.length > 0) {
          const hasSpecialty = specialties.some((s) => entry.specialties.includes(s));
          if (!hasSpecialty) return false;
        }

        // Career stage filter
        if (careerStage && entry.careerStage !== careerStage) {
          return false;
        }

        // Location filter
        if (location && entry.location !== location) {
          return false;
        }

        // Goals filter
        if (goals && goals.length > 0) {
          const hasGoal = goals.some((g) => memberGoals.includes(g));
          if (!hasGoal) return false;
        }

        // Verified Practitioner filter
        if (verifiedOnly && !entry.verifiedPractitioner) {
          return false;
        }

        return true;
      })
      .map(({ entry }) => entry);

    // Sort
    switch (sortBy) {
      case 'newest':
        filteredMembers.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
        break;
      case 'reputation':
        filteredMembers.sort((a, b) => b.reputationPoints - a.reputationPoints);
        break;
      case 'activity':
        filteredMembers.sort((a, b) => b.postCount - a.postCount);
        break;
      case 'alphabetical':
        filteredMembers.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    const total = filteredMembers.length;

    // Paginate
    filteredMembers = filteredMembers.slice(offset, offset + limit);

    return {
      success: true,
      members: filteredMembers,
      total,
    };
  }, { filters });
}

/**
 * Get reputation level name from points
 */
function getReputationLevelName(points: number): string {
  if (points >= 10000) return 'Legend';
  if (points >= 5000) return 'Expert';
  if (points >= 2500) return 'Veteran';
  if (points >= 1000) return 'Established';
  if (points >= 500) return 'Regular';
  if (points >= 100) return 'Active';
  return 'Newcomer';
}
