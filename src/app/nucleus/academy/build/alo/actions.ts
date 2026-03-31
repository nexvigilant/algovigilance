'use server';

/**
 * ALO Completion Server Actions
 *
 * Server actions for tracking ALO (Atomic Learning Object) completion.
 * Handles section progression, activity results, and portfolio artifact creation.
 *
 * @see src/types/alo.ts for type definitions
 * @see src/components/academy/alo-renderer.tsx for client component
 */

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { serializeForClient } from '@/lib/serialization-utils';
import type { Timestamp as ClientTimestamp } from 'firebase/firestore';
import type {
  ALOCompletion,
  ALOCompletionSerialized,
  ALOSectionCompletion,
  ALOActivityResult,
  ALOProgressSummary,
} from '@/types/alo';

import { logger } from '@/lib/logger';
const log = logger.scope('learn/alo/actions');

// Cast Admin SDK Timestamp to client Timestamp type (compatible at runtime)
const now = () => adminTimestamp.now() as unknown as ClientTimestamp;

// =============================================================================
// COMPLETION TRACKING
// =============================================================================

/**
 * Start or resume an ALO session.
 * Creates a new completion record if none exists, or returns the existing one.
 *
 * @param userId - The user's ID
 * @param aloId - The ALO ID
 * @param ksbId - The associated KSB ID
 * @returns Serialized completion record or null on error
 */
export async function startALOSession(
  userId: string,
  aloId: string,
  ksbId: string
): Promise<ALOCompletionSerialized | null> {
  try {
    log.debug(`[startALOSession] Starting/resuming ALO session`, { userId, aloId, ksbId });

    // Check for existing completion record
    const existingQuery = await adminDb
      .collection('alo_completions')
      .where('userId', '==', userId)
      .where('aloId', '==', aloId)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      const existingDoc = existingQuery.docs[0];
      const data = existingDoc.data();

      log.debug('[startALOSession] Resuming existing session', { completionId: existingDoc.id });

      // Update last activity timestamp
      await existingDoc.ref.update({
        lastActivityAt: now(),
      });

      return serializeForClient({
        id: existingDoc.id,
        userId: data.userId,
        aloId: data.aloId,
        ksbId: data.ksbId,
        sectionsCompleted: data.sectionsCompleted,
        activityResult: data.activityResult,
        portfolioArtifactId: data.portfolioArtifactId,
        completed: data.completed,
        completedAt: data.completedAt,
        startedAt: data.startedAt,
        lastActivityAt: now(),
      }) as ALOCompletionSerialized;
    }

    // Create new completion record
    const timestamp = now();
    const completionData: Omit<ALOCompletion, 'id'> = {
      userId,
      aloId,
      ksbId,
      sectionsCompleted: {
        hook: false,
        concept: false,
        activity: false,
        reflection: false,
      },
      completed: false,
      startedAt: timestamp,
      lastActivityAt: timestamp,
    };

    const docRef = await adminDb.collection('alo_completions').add(completionData);
    log.info('[startALOSession] Created new session', { completionId: docRef.id, aloId });

    return serializeForClient({
      ...completionData,
      id: docRef.id,
    }) as ALOCompletionSerialized;
  } catch (error) {
    log.error('[startALOSession] Error:', error);
    return null;
  }
}

/**
 * Update section completion status.
 *
 * @param completionId - The completion record ID
 * @param section - The section that was completed
 * @param userId - User ID for ownership verification
 * @returns Updated completion or null on error
 */
export async function updateSectionCompletion(
  completionId: string,
  section: keyof ALOSectionCompletion,
  userId: string
): Promise<ALOCompletionSerialized | null> {
  try {
    log.debug('[updateSectionCompletion] Updating section', { completionId, section });

    const completionRef = adminDb.collection('alo_completions').doc(completionId);

    // Use transaction for atomic updates
    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(completionRef);

      if (!doc.exists) {
        throw new Error('Completion record not found');
      }

      const data = doc.data() as Omit<ALOCompletion, 'id'>;

      // Verify ownership
      if (data.userId !== userId) {
        throw new Error('Unauthorized: User does not own this completion');
      }

      // Update section completion
      const sectionsCompleted: ALOSectionCompletion = {
        ...data.sectionsCompleted,
        [section]: true,
      };

      const lastActivityAt = now();

      transaction.update(completionRef, {
        sectionsCompleted,
        lastActivityAt,
      });

      return {
        ...data,
        id: doc.id,
        sectionsCompleted,
        lastActivityAt,
      } as ALOCompletion;
    });

    log.debug('[updateSectionCompletion] Section updated', { section, completionId });

    return serializeForClient(result) as ALOCompletionSerialized;
  } catch (error) {
    log.error('[updateSectionCompletion] Error:', error);
    return null;
  }
}

/**
 * Submit activity engine result.
 *
 * @param completionId - The completion record ID
 * @param result - The activity engine result
 * @param userId - User ID for ownership verification
 * @returns Updated completion or null on error
 */
export async function submitActivityResult(
  completionId: string,
  result: ALOActivityResult,
  userId: string
): Promise<ALOCompletionSerialized | null> {
  try {
    log.debug('[submitActivityResult] Submitting activity result', {
      completionId,
      engineType: result.engineType,
      score: result.score,
      passed: result.passed,
    });

    const completionRef = adminDb.collection('alo_completions').doc(completionId);

    const updatedData = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(completionRef);

      if (!doc.exists) {
        throw new Error('Completion record not found');
      }

      const data = doc.data() as Omit<ALOCompletion, 'id'>;

      // Verify ownership
      if (data.userId !== userId) {
        throw new Error('Unauthorized: User does not own this completion');
      }

      // Update with activity result
      const sectionsCompleted: ALOSectionCompletion = {
        ...data.sectionsCompleted,
        activity: true,
      };

      const lastActivityAt = now();

      transaction.update(completionRef, {
        activityResult: result,
        sectionsCompleted,
        lastActivityAt,
      });

      return {
        ...data,
        id: doc.id,
        activityResult: result,
        sectionsCompleted,
        lastActivityAt,
      } as ALOCompletion;
    });

    log.info('[submitActivityResult] Activity result saved', {
      completionId,
      passed: result.passed,
    });

    return serializeForClient(updatedData) as ALOCompletionSerialized;
  } catch (error) {
    log.error('[submitActivityResult] Error:', error);
    return null;
  }
}

/**
 * Complete an ALO and optionally create a portfolio artifact.
 *
 * @param completionId - The completion record ID
 * @param reflectionResponse - User's reflection text
 * @param userId - User ID for ownership verification
 * @param createPortfolioArtifact - Whether to create a portfolio artifact
 * @param portfolioConfig - Optional portfolio artifact configuration
 * @returns Updated completion or null on error
 */
export async function completeALO(
  completionId: string,
  reflectionResponse: string,
  userId: string,
  createPortfolioArtifact: boolean = false,
  portfolioConfig?: {
    title: string;
    artifactType: string;
    ksbId: string;
  }
): Promise<ALOCompletionSerialized | null> {
  try {
    log.debug('[completeALO] Completing ALO', { completionId, userId });

    const completionRef = adminDb.collection('alo_completions').doc(completionId);

    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(completionRef);

      if (!doc.exists) {
        throw new Error('Completion record not found');
      }

      const data = doc.data() as Omit<ALOCompletion, 'id'>;

      // Verify ownership
      if (data.userId !== userId) {
        throw new Error('Unauthorized: User does not own this completion');
      }

      // Ensure all previous sections are completed
      if (!data.sectionsCompleted.hook || !data.sectionsCompleted.concept || !data.sectionsCompleted.activity) {
        throw new Error('Cannot complete ALO: previous sections not completed');
      }

      const completedAt = now();
      const sectionsCompleted: ALOSectionCompletion = {
        ...data.sectionsCompleted,
        reflection: true,
      };

      let portfolioArtifactId: string | undefined;

      // Create portfolio artifact if requested
      if (createPortfolioArtifact && portfolioConfig) {
        const artifactData = {
          userId,
          ksbId: portfolioConfig.ksbId,
          aloId: data.aloId,
          title: portfolioConfig.title,
          artifactType: portfolioConfig.artifactType,
          content: reflectionResponse,
          activityResult: data.activityResult,
          createdAt: completedAt,
          updatedAt: completedAt,
        };

        const artifactRef = adminDb
          .collection('users')
          .doc(userId)
          .collection('portfolio')
          .doc();

        transaction.set(artifactRef, artifactData);
        portfolioArtifactId = artifactRef.id;

        log.debug('[completeALO] Created portfolio artifact', { artifactId: portfolioArtifactId });
      }

      const updateData: Record<string, unknown> = {
        sectionsCompleted,
        completed: true,
        completedAt,
        lastActivityAt: completedAt,
      };

      if (portfolioArtifactId) {
        updateData.portfolioArtifactId = portfolioArtifactId;
      }

      transaction.update(completionRef, updateData);

      return {
        ...data,
        id: doc.id,
        sectionsCompleted,
        completed: true,
        completedAt,
        lastActivityAt: completedAt,
        portfolioArtifactId,
      } as ALOCompletion;
    });

    log.info('[completeALO] ALO completed successfully', {
      completionId,
      aloId: result.aloId,
      hasPortfolioArtifact: !!result.portfolioArtifactId,
    });

    return serializeForClient(result) as ALOCompletionSerialized;
  } catch (error) {
    log.error('[completeALO] Error:', error);
    return null;
  }
}

// =============================================================================
// PROGRESS QUERIES
// =============================================================================

/**
 * Get a user's ALO completion record.
 *
 * @param userId - The user's ID
 * @param aloId - The ALO ID
 * @returns Serialized completion or null if not found
 */
export async function getALOCompletion(
  userId: string,
  aloId: string
): Promise<ALOCompletionSerialized | null> {
  try {
    const query = await adminDb
      .collection('alo_completions')
      .where('userId', '==', userId)
      .where('aloId', '==', aloId)
      .limit(1)
      .get();

    if (query.empty) {
      return null;
    }

    const doc = query.docs[0];
    return serializeForClient({
      ...doc.data(),
      id: doc.id,
    }) as ALOCompletionSerialized;
  } catch (error) {
    log.error('[getALOCompletion] Error:', error);
    return null;
  }
}

/**
 * Get all ALO completions for a user.
 *
 * @param userId - The user's ID
 * @param options - Query options
 * @returns Array of serialized completions
 */
export async function getUserALOCompletions(
  userId: string,
  options: {
    completedOnly?: boolean;
    limit?: number;
    ksbId?: string;
  } = {}
): Promise<ALOCompletionSerialized[]> {
  try {
    const { completedOnly = false, limit = 100, ksbId } = options;

    let query = adminDb
      .collection('alo_completions')
      .where('userId', '==', userId);

    if (completedOnly) {
      query = query.where('completed', '==', true);
    }

    if (ksbId) {
      query = query.where('ksbId', '==', ksbId);
    }

    const snapshot = await query
      .orderBy('lastActivityAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) =>
      serializeForClient({
        ...doc.data(),
        id: doc.id,
      }) as ALOCompletionSerialized
    );
  } catch (error) {
    log.error('[getUserALOCompletions] Error:', error);
    return [];
  }
}

/**
 * Get ALO progress summary for a user.
 *
 * @param userId - The user's ID
 * @returns Progress summary
 */
export async function getALOProgressSummary(
  userId: string
): Promise<ALOProgressSummary> {
  try {
    const snapshot = await adminDb
      .collection('alo_completions')
      .where('userId', '==', userId)
      .get();

    let completedALOs = 0;
    let inProgressALOs = 0;
    let totalTimeSpent = 0;
    let totalScore = 0;
    let scoreCount = 0;
    let portfolioArtifactsGenerated = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();

      if (data.completed) {
        completedALOs++;
      } else {
        inProgressALOs++;
      }

      if (data.activityResult?.timeSpentSeconds) {
        totalTimeSpent += data.activityResult.timeSpentSeconds;
      }

      if (data.activityResult?.score !== undefined) {
        totalScore += data.activityResult.score;
        scoreCount++;
      }

      if (data.portfolioArtifactId) {
        portfolioArtifactsGenerated++;
      }
    });

    const totalALOs = completedALOs + inProgressALOs;
    const completionRate = totalALOs > 0 ? (completedALOs / totalALOs) * 100 : 0;
    const averageActivityScore = scoreCount > 0 ? totalScore / scoreCount : 0;

    return {
      totalALOs,
      completedALOs,
      inProgressALOs,
      completionRate,
      totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
      averageActivityScore,
      portfolioArtifactsGenerated,
    };
  } catch (error) {
    log.error('[getALOProgressSummary] Error:', error);
    return {
      totalALOs: 0,
      completedALOs: 0,
      inProgressALOs: 0,
      completionRate: 0,
      totalTimeSpent: 0,
      averageActivityScore: 0,
      portfolioArtifactsGenerated: 0,
    };
  }
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Get completion status for multiple ALOs.
 * Useful for displaying completion indicators in catalogs.
 *
 * @param userId - The user's ID
 * @param aloIds - Array of ALO IDs to check
 * @returns Map of ALO ID to completion status
 */
export async function getALOCompletionStatuses(
  userId: string,
  aloIds: string[]
): Promise<Record<string, { completed: boolean; progress: number }>> {
  try {
    if (aloIds.length === 0) return {};

    // Firestore 'in' queries are limited to 30 items
    const chunks: string[][] = [];
    for (let i = 0; i < aloIds.length; i += 30) {
      chunks.push(aloIds.slice(i, i + 30));
    }

    const results: Record<string, { completed: boolean; progress: number }> = {};

    // Initialize all as not started
    aloIds.forEach((id) => {
      results[id] = { completed: false, progress: 0 };
    });

    // Query in parallel
    await Promise.all(
      chunks.map(async (chunk) => {
        const snapshot = await adminDb
          .collection('alo_completions')
          .where('userId', '==', userId)
          .where('aloId', 'in', chunk)
          .get();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const sectionsCompleted = data.sectionsCompleted as ALOSectionCompletion;
          const completed = Object.values(sectionsCompleted).filter(Boolean).length;
          const progress = (completed / 4) * 100;

          results[data.aloId] = {
            completed: data.completed || false,
            progress,
          };
        });
      })
    );

    return results;
  } catch (error) {
    log.error('[getALOCompletionStatuses] Error:', error);
    return {};
  }
}
