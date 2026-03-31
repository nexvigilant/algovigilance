'use server';

/**
 * EPA Pathway Server Actions
 *
 * Server actions for EPA (Entrustable Professional Activity) pathway management.
 * These actions handle:
 * - Fetching EPA catalog data
 * - User enrollment in EPA pathways
 * - Progress tracking and updates
 * - EPA completion and certification
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  EPAPathway,
  EPACatalogCard,
  EPACatalogFilters,
  EPATier,
  UserEPAProgress,
  EPAProgressStatus,
  ProficiencyLevel,
  KSBCompletion,
  LevelProgress,
  FlexibleTimestamp,
  EPAUserId,
  EPAId,
  KSBId,
  PortfolioArtifactId,
} from '@/types/epa-pathway';

import { logger } from '@/lib/logger';
import { serializeForClient } from '@/lib/serialization-utils';
const log = logger.scope('academy/epa/actions');

// Use shared serialization utility
const serializeEPAData = serializeForClient;

/** Plain timestamp from a Date — safe for server-to-client serialization and Firestore writes. */
function toPlainTimestamp(date: Date): FlexibleTimestamp {
  return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
}

/** Current time as a plain serializable timestamp. */
function nowPlainTimestamp(): FlexibleTimestamp {
  return toPlainTimestamp(new Date());
}

// =============================================================================
// PDC v4.1 COLLECTION PATHS
// =============================================================================

const PATHS = {
  epas: 'epas',
  domains: 'pv_domains',
} as const;

/**
 * Helper to get a collection reference
 */
function getItemsCollection(path: string) {
  return adminDb.collection(path);
}

// =============================================================================
// EPA CATALOG ACTIONS
// =============================================================================

/**
 * Get all EPA pathways for catalog display
 * Returns lightweight catalog cards suitable for listing
 */
export async function getEPAPathways(
  filters?: EPACatalogFilters
): Promise<EPACatalogCard[]> {
  try {
    let query = getItemsCollection(PATHS.epas).where('status', '==', 'published');

    // Apply filters
    if (filters?.tier) {
      query = query.where('tier', '==', filters.tier);
    }
    if (filters?.difficulty) {
      query = query.where('pathway.difficulty', '==', filters.difficulty);
    }
    if (filters?.minContentCoverage) {
      query = query.where('contentCoverage', '>=', filters.minContentCoverage);
    }

    const snapshot = await query.orderBy('epaNumber', 'asc').get();

    const epas: EPACatalogCard[] = snapshot.docs.map((doc) => {
      const data = doc.data() as EPAPathway;
      return {
        id: data.id,
        name: data.name,
        shortName: data.shortName,
        tier: data.tier,
        epaNumber: data.epaNumber,
        ksbStats: data.ksbStats,
        pathway: data.pathway,
        contentCoverage: data.contentCoverage,
        status: data.status,
      };
    });

    // Apply domain/CPA filters (post-query since arrays)
    let filtered = epas;
    if (filters?.domainId) {
      // Need to fetch full docs to check array membership
      const fullDocs = await Promise.all(
        snapshot.docs.map(async (doc) => ({
          card: epas.find((e) => e.id === doc.id),
          data: doc.data() as EPAPathway,
        }))
      );
      filtered = fullDocs
        .filter((d): d is typeof d & { card: NonNullable<typeof d.card> } =>
          d.card != null && (filters.domainId ? d.data.primaryDomains.includes(filters.domainId) : false)
        )
        .map((d) => d.card);
    }

    log.info(`[getEPAPathways] Returning ${filtered.length} EPAs`);
    return filtered;
  } catch (error) {
    log.error('[getEPAPathways] Error:', error);
    return [];
  }
}

/**
 * Get EPA pathways by tier
 */
export async function getEPAsByTier(tier: EPATier): Promise<EPACatalogCard[]> {
  return getEPAPathways({ tier });
}

/**
 * Get a single EPA by ID with full details
 * Normalizes the ID to uppercase (e.g., "epa-01" → "EPA-01")
 * Serializes timestamps for client component compatibility
 */
export async function getEPAById(epaId: string): Promise<EPAPathway | null> {
  try {
    // Normalize ID to uppercase to match Firestore document IDs
    const normalizedId = epaId.toUpperCase();
    const doc = await getItemsCollection(PATHS.epas).doc(normalizedId).get();

    if (!doc.exists) {
      log.warn(`[getEPAById] EPA not found: ${normalizedId} (original: ${epaId})`);
      return null;
    }

    // Serialize timestamps for client component compatibility
    const data = doc.data() as EPAPathway;
    return serializeEPAData(data as unknown as Record<string, unknown>) as unknown as EPAPathway;
  } catch (error) {
    log.error(`[getEPAById] Error fetching ${epaId}:`, error);
    return null;
  }
}

/**
 * Get EPAs that contain a specific domain
 */
export async function getEPAsByDomain(domainId: string): Promise<EPACatalogCard[]> {
  try {
    const snapshot = await getItemsCollection(PATHS.epas)
      .where('status', '==', 'published')
      .where('primaryDomains', 'array-contains', domainId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as EPAPathway;
      return {
        id: data.id,
        name: data.name,
        shortName: data.shortName,
        tier: data.tier,
        epaNumber: data.epaNumber,
        ksbStats: data.ksbStats,
        pathway: data.pathway,
        contentCoverage: data.contentCoverage,
        status: data.status,
      };
    });
  } catch (error) {
    log.error(`[getEPAsByDomain] Error:`, error);
    return [];
  }
}

// =============================================================================
// USER EPA PROGRESS ACTIONS
// =============================================================================

/**
 * Get user's progress for a specific EPA
 * Serializes timestamps for client component compatibility
 */
export async function getUserEPAProgress(
  userId: string,
  epaId: string
): Promise<UserEPAProgress | null> {
  try {
    const doc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('epa_progress')
      .doc(epaId)
      .get();

    if (!doc.exists) {
      return null;
    }

    // Serialize timestamps for client component compatibility
    const data = doc.data() as UserEPAProgress;
    return serializeEPAData(data as unknown as Record<string, unknown>) as unknown as UserEPAProgress;
  } catch (error) {
    log.error(`[getUserEPAProgress] Error for ${userId}/${epaId}:`, error);
    return null;
  }
}

/**
 * Get all EPA progress for a user
 * Serializes timestamps for client component compatibility
 */
export async function getAllUserEPAProgress(userId: string): Promise<UserEPAProgress[]> {
  try {
    const snapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('epa_progress')
      .get();

    // Serialize timestamps for client component compatibility
    return snapshot.docs.map((doc) => {
      const data = doc.data() as UserEPAProgress;
      return serializeEPAData(data as unknown as Record<string, unknown>) as unknown as UserEPAProgress;
    });
  } catch (error) {
    log.error(`[getAllUserEPAProgress] Error for ${userId}:`, error);
    return [];
  }
}

/**
 * Enroll user in an EPA pathway
 */
export async function enrollInEPA(
  userId: string,
  epaId: string,
  source: 'catalog' | 'recommendation' | 'admin_assigned' = 'catalog'
): Promise<{ success: boolean; error?: string }> {
  // Normalize ID to uppercase to match Firestore document IDs
  const normalizedEpaId = epaId.toUpperCase();

  try {
    // Check if EPA exists
    const epaDoc = await getItemsCollection(PATHS.epas).doc(normalizedEpaId).get();
    if (!epaDoc.exists) {
      return { success: false, error: 'EPA pathway not found' };
    }

    // Check if already enrolled
    const existingProgress = await adminDb
      .collection('users')
      .doc(userId)
      .collection('epa_progress')
      .doc(normalizedEpaId)
      .get();

    if (existingProgress.exists) {
      return { success: false, error: 'Already enrolled in this pathway' };
    }

    // Create initial progress document
    const now = nowPlainTimestamp();
    const initialProgress: UserEPAProgress = {
      userId: userId as EPAUserId,
      epaId: normalizedEpaId as EPAId,
      status: 'in_progress' as EPAProgressStatus,
      proficiencyProgress: {
        currentLevel: 'L1' as ProficiencyLevel,
        progressPercent: 0,
        levelHistory: [],
      },
      entrustmentProgress: {
        currentLevel: 'observation',
        supervisionRequired: 'Full supervision required',
      },
      completedKSBs: [],
      ksbCompletions: [],
      totalTimeSpent: 0,
      enrolledAt: now,
      lastActivityAt: now,
    };

    await adminDb
      .collection('users')
      .doc(userId)
      .collection('epa_progress')
      .doc(normalizedEpaId)
      .set(initialProgress);

    log.info(`[enrollInEPA] User ${userId} enrolled in ${normalizedEpaId} via ${source}`);

    return { success: true };
  } catch (error) {
    log.error(`[enrollInEPA] Error:`, error);
    return { success: false, error: 'Failed to enroll in pathway' };
  }
}

/**
 * Record KSB completion and update EPA progress
 */
export async function recordKSBCompletion(
  userId: string,
  epaId: string,
  ksbId: string,
  score?: number,
  activityType: 'red_pen' | 'triage' | 'synthesis' | 'assessment' = 'assessment',
  portfolioArtifactId?: string
): Promise<{ success: boolean; levelAdvanced?: boolean; newLevel?: ProficiencyLevel; epaCompleted?: boolean }> {
  // Normalize ID to uppercase to match Firestore document IDs
  const normalizedEpaId = epaId.toUpperCase();

  try {
    const progressRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('epa_progress')
      .doc(normalizedEpaId);

    const progressDoc = await progressRef.get();

    if (!progressDoc.exists) {
      return { success: false };
    }

    const progress = progressDoc.data() as UserEPAProgress;
    const now = nowPlainTimestamp();

    // Create mutable copies of arrays for modification
    const completedKSBs = [...progress.completedKSBs] as string[];
    const ksbCompletions = [...progress.ksbCompletions] as KSBCompletion[];

    // Add KSB completion
    const completion: KSBCompletion = {
      ksbId: ksbId as KSBId,
      completedAt: now,
      score,
      attempts: 1,
      activityType,
      portfolioArtifactId: portfolioArtifactId as PortfolioArtifactId,
    };

    // Check if KSB already completed
    if (completedKSBs.includes(ksbId)) {
      // Update existing completion (retry)
      const existingIndex = ksbCompletions.findIndex((c) => c.ksbId === ksbId);
      if (existingIndex >= 0) {
        ksbCompletions[existingIndex] = {
          ...ksbCompletions[existingIndex],
          ...completion,
          attempts: (ksbCompletions[existingIndex].attempts || 0) + 1,
        };
      }
    } else {
      completedKSBs.push(ksbId);
      ksbCompletions.push(completion);
    }

    // Get EPA to calculate progress
    const epaDoc = await getItemsCollection(PATHS.epas).doc(normalizedEpaId).get();
    const epa = epaDoc.data() as EPAPathway;

    // Calculate new progress percentage
    const totalKSBs = epa.ksbStats.total;
    const completedCount = completedKSBs.length;
    const newProgressPercent = Math.round((completedCount / totalKSBs) * 100);

    // Check for level advancement (80% threshold)
    let levelAdvanced = false;
    let newLevel: ProficiencyLevel | undefined;

    // Create mutable copies for proficiency and entrustment
    let currentProficiencyLevel = progress.proficiencyProgress.currentLevel;
    const levelHistory = [...progress.proficiencyProgress.levelHistory] as LevelProgress[];
    let currentEntrustmentLevel = progress.entrustmentProgress.currentLevel;
    let supervisionRequired = progress.entrustmentProgress.supervisionRequired;

    const levelThresholds: Record<ProficiencyLevel, number> = {
      'L1': 20,
      'L2': 40,
      'L3': 60,
      'L4': 80,
      'L5': 95,
      'L5+': 100,
    };

    // Check if user should advance to next level
    const levels: ProficiencyLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+'];
    const currentIndex = levels.indexOf(currentProficiencyLevel);

    if (currentIndex < levels.length - 1) {
      const nextLevel = levels[currentIndex + 1];
      const nextThreshold = levelThresholds[currentProficiencyLevel];

      if (newProgressPercent >= nextThreshold) {
        newLevel = nextLevel;
        levelAdvanced = true;

        // Record level completion in history
        const levelEntry: LevelProgress = {
          level: currentProficiencyLevel,
          startedAt: progress.enrolledAt,
          completedAt: now,
          ksbsCompleted: completedCount,
          ksbsTotal: totalKSBs,
          progressPercent: newProgressPercent,
          assessmentPassed: true,
        };
        levelHistory.push(levelEntry);

        currentProficiencyLevel = newLevel;

        // Update entrustment level
        const entrustmentMap: Record<ProficiencyLevel, 'observation' | 'direct' | 'indirect' | 'remote' | 'independent' | 'supervisor'> = {
          'L1': 'observation',
          'L2': 'direct',
          'L3': 'indirect',
          'L4': 'remote',
          'L5': 'independent',
          'L5+': 'supervisor',
        };

        currentEntrustmentLevel = entrustmentMap[newLevel];
        supervisionRequired = getSupervisionDescription(newLevel);
      }
    }

    // Update progress document
    await progressRef.update({
      completedKSBs,
      ksbCompletions,
      'proficiencyProgress.currentLevel': currentProficiencyLevel,
      'proficiencyProgress.progressPercent': newProgressPercent,
      'proficiencyProgress.levelHistory': levelHistory,
      'entrustmentProgress.currentLevel': currentEntrustmentLevel,
      'entrustmentProgress.supervisionRequired': supervisionRequired,
      lastActivityAt: now,
      totalTimeSpent: FieldValue.increment(5), // Estimate 5 minutes per KSB
    });

    log.info(
      `[recordKSBCompletion] User ${userId} completed ${ksbId} in ${normalizedEpaId}. ` +
        `Progress: ${newProgressPercent}%${levelAdvanced ? `, Advanced to ${newLevel}` : ''}`
    );

    // EPA is fully completed when user reaches L5+ or is at L5+ with 100% progress
    const epaCompleted = newLevel === 'L5+' || (currentProficiencyLevel === 'L5+' && newProgressPercent === 100);

    return { success: true, levelAdvanced, newLevel, epaCompleted };
  } catch (error) {
    log.error(`[recordKSBCompletion] Error:`, error);
    return { success: false };
  }
}

/**
 * Get supervision description for proficiency level
 */
function getSupervisionDescription(level: ProficiencyLevel): string {
  const descriptions: Record<ProficiencyLevel, string> = {
    'L1': 'Full supervision required - observation only',
    'L2': 'Direct supervision - supervisor present during activity',
    'L3': 'Indirect supervision - supervisor available when needed',
    'L4': 'Remote supervision - retrospective review only',
    'L5': 'Independent practice - full autonomy',
    'L5+': 'Can supervise others - teaching capability',
  };
  return descriptions[level];
}

/**
 * Mark EPA as completed
 */
export async function completeEPA(
  userId: string,
  epaId: string
): Promise<{ success: boolean; certificateId?: string }> {
  // Normalize ID to uppercase to match Firestore document IDs
  const normalizedEpaId = epaId.toUpperCase();

  try {
    const progressRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('epa_progress')
      .doc(normalizedEpaId);

    const progressDoc = await progressRef.get();

    if (!progressDoc.exists) {
      return { success: false };
    }

    const progress = progressDoc.data() as UserEPAProgress;

    // Verify completion requirements (95%+)
    if (progress.proficiencyProgress.progressPercent < 95) {
      return { success: false };
    }

    // Update progress status
    await progressRef.update({
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
    });

    // Create certificate (optional - can be done separately)
    // For now, just mark as completed

    log.info(`[completeEPA] User ${userId} completed ${normalizedEpaId}`);

    return { success: true };
  } catch (error) {
    log.error(`[completeEPA] Error:`, error);
    return { success: false };
  }
}

// =============================================================================
// EPA STATISTICS ACTIONS
// =============================================================================

/**
 * Get EPA enrollment statistics
 * Uses collection group query to aggregate progress across all users
 */
export async function getEPAEnrollmentStats(epaId: string): Promise<{
  totalEnrolled: number;
  inProgress: number;
  completed: number;
  averageProgress: number;
}> {
  try {
    const normalizedId = epaId.toUpperCase();
    const snapshot = await adminDb
      .collectionGroup('epa_progress')
      .where('epaId', '==', normalizedId)
      .get();

    if (snapshot.empty) {
      return { totalEnrolled: 0, inProgress: 0, completed: 0, averageProgress: 0 };
    }

    let totalProgress = 0;
    let completedCount = 0;
    let inProgressCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as UserEPAProgress;
      totalProgress += data.proficiencyProgress.progressPercent;
      
      if (data.status === 'completed') {
        completedCount++;
      } else {
        inProgressCount++;
      }
    });

    return {
      totalEnrolled: snapshot.size,
      inProgress: inProgressCount,
      completed: completedCount,
      averageProgress: Math.round(totalProgress / snapshot.size),
    };
  } catch (error) {
    log.error(`[getEPAEnrollmentStats] Error for ${epaId}:`, error);
    return { totalEnrolled: 0, inProgress: 0, completed: 0, averageProgress: 0 };
  }
}

/**
 * Get priority EPAs (EPA 1-5) for content generation focus
 */
export async function getPriorityEPAs(): Promise<EPACatalogCard[]> {
  try {
    const snapshot = await getItemsCollection(PATHS.epas)
      .where('status', '==', 'published')
      .where('epaNumber', '<=', 5)
      .orderBy('epaNumber', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as EPAPathway;
      return {
        id: data.id,
        name: data.name,
        shortName: data.shortName,
        tier: data.tier,
        epaNumber: data.epaNumber,
        ksbStats: data.ksbStats,
        pathway: data.pathway,
        contentCoverage: data.contentCoverage,
        status: data.status,
      };
    });
  } catch (error) {
    log.error(`[getPriorityEPAs] Error:`, error);
    return [];
  }
}
