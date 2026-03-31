'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAuthUserId } from '@/lib/admin-auth';
import type { PortfolioArtifact, KSBProgress } from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('portfolio/actions');

// ============================================================================
// Portfolio Artifact Actions
// ============================================================================

export async function createPortfolioArtifact(
  artifact: Omit<PortfolioArtifact, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const artifactRef = adminDb.collection('portfolio_artifacts').doc();
    const now = adminTimestamp.now();

    await artifactRef.set({
      ...artifact,
      id: artifactRef.id,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id: artifactRef.id };
  } catch (error) {
    log.error('Error creating portfolio artifact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create artifact',
    };
  }
}

export async function getPortfolioArtifacts(
  userId: string
): Promise<{ success: boolean; artifacts?: PortfolioArtifact[]; error?: string }> {
  try {
    // Validate auth - user can only access their own artifacts
    const authUserId = await requireAuthUserId();
    if (authUserId !== userId) {
      return { success: false, error: 'Unauthorized: Cannot access other user\'s artifacts' };
    }

    const snapshot = await adminDb
      .collection('portfolio_artifacts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const artifacts: PortfolioArtifact[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: toDateFromSerialized(data.createdAt),
        updatedAt: toDateFromSerialized(data.updatedAt),
        verifiedAt: toDateFromSerialized(data.verifiedAt),
      } as PortfolioArtifact;
    });

    return { success: true, artifacts };
  } catch (error) {
    log.error('Error fetching portfolio artifacts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch artifacts',
    };
  }
}

export async function getPortfolioArtifact(
  artifactId: string
): Promise<{ success: boolean; artifact?: PortfolioArtifact; error?: string }> {
  try {
    const docSnap = await adminDb.collection('portfolio_artifacts').doc(artifactId).get();

    if (!docSnap.exists) {
      return { success: false, error: 'Artifact not found' };
    }

    const data = docSnap.data();
    if (!data) return { success: false, error: 'Artifact data is empty' };
    const artifact: PortfolioArtifact = {
      ...data,
      createdAt: toDateFromSerialized(data.createdAt),
      updatedAt: toDateFromSerialized(data.updatedAt),
      verifiedAt: toDateFromSerialized(data.verifiedAt),
    } as PortfolioArtifact;

    return { success: true, artifact };
  } catch (error) {
    log.error('Error fetching portfolio artifact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch artifact',
    };
  }
}

export async function getArtifactsByDomain(
  userId: string,
  domainId: string
): Promise<{ success: boolean; artifacts?: PortfolioArtifact[]; error?: string }> {
  try {
    // Validate auth - user can only access their own artifacts
    const authUserId = await requireAuthUserId();
    if (authUserId !== userId) {
      return { success: false, error: 'Unauthorized: Cannot access other user\'s artifacts' };
    }

    const snapshot = await adminDb
      .collection('portfolio_artifacts')
      .where('userId', '==', userId)
      .where('domainId', '==', domainId)
      .orderBy('createdAt', 'desc')
      .get();

    const artifacts: PortfolioArtifact[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: toDateFromSerialized(data.createdAt),
        updatedAt: toDateFromSerialized(data.updatedAt),
        verifiedAt: toDateFromSerialized(data.verifiedAt),
      } as PortfolioArtifact;
    });

    return { success: true, artifacts };
  } catch (error) {
    log.error('Error fetching artifacts by domain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch artifacts',
    };
  }
}

export async function updateArtifactStatus(
  artifactId: string,
  status: 'draft' | 'submitted' | 'verified',
  verifierId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = adminDb.collection('portfolio_artifacts').doc(artifactId);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: adminTimestamp.now(),
    };

    if (status === 'verified' && verifierId) {
      updateData.verifiedAt = adminTimestamp.now();
      updateData.verifiedBy = verifierId;
    }

    await docRef.update(updateData);
    return { success: true };
  } catch (error) {
    log.error('Error updating artifact status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

export async function deletePortfolioArtifact(
  artifactId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb.collection('portfolio_artifacts').doc(artifactId).delete();
    return { success: true };
  } catch (error) {
    log.error('Error deleting artifact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete artifact',
    };
  }
}

// ============================================================================
// KSB Progress Actions
// ============================================================================

export async function getKSBProgress(
  userId: string,
  ksbId: string
): Promise<{ success: boolean; progress?: KSBProgress; error?: string }> {
  try {
    // Validate auth - user can only access their own progress
    const authUserId = await requireAuthUserId();
    if (authUserId !== userId) {
      return { success: false, error: 'Unauthorized: Cannot access other user\'s progress' };
    }

    const progressId = `${userId}_${ksbId}`;
    const docSnap = await adminDb.collection('ksb_progress').doc(progressId).get();

    if (!docSnap.exists) {
      return { success: true, progress: undefined };
    }

    const data = docSnap.data();
    if (!data) return { success: true, progress: undefined };
    const progress: KSBProgress = {
      ...data,
      createdAt: toDateFromSerialized(data.createdAt),
      updatedAt: toDateFromSerialized(data.updatedAt),
      completedAt: toDateFromSerialized(data.completedAt),
      lastAttemptAt: toDateFromSerialized(data.lastAttemptAt),
    } as KSBProgress;

    return { success: true, progress };
  } catch (error) {
    log.error('Error fetching KSB progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch progress',
    };
  }
}

export async function updateKSBProgress(
  userId: string,
  ksbId: string,
  domainId: string,
  updates: Partial<KSBProgress>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate auth - user can only update their own progress
    const authUserId = await requireAuthUserId();
    if (authUserId !== userId) {
      return { success: false, error: 'Unauthorized: Cannot update other user\'s progress' };
    }

    const progressId = `${userId}_${ksbId}`;
    const docRef = adminDb.collection('ksb_progress').doc(progressId);
    const docSnap = await docRef.get();

    const now = adminTimestamp.now();

    if (!docSnap.exists) {
      // Create new progress record
      const newProgress = {
        id: progressId,
        userId,
        ksbId,
        domainId,
        sectionsCompleted: {
          hook: false,
          concept: false,
          activity: false,
          reflection: false,
        },
        attempts: 0,
        status: 'not_started',
        totalTimeSpent: 0,
        createdAt: now,
        updatedAt: now,
        ...updates,
        completedAt: updates.completedAt ? adminTimestamp.fromDate(updates.completedAt) : null,
        lastAttemptAt: updates.lastAttemptAt ? adminTimestamp.fromDate(updates.lastAttemptAt) : null,
      };

      await docRef.set(newProgress);
    } else {
      // Update existing progress
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: now,
      };

      // Convert dates to Timestamps
      if (updates.completedAt) {
        updateData.completedAt = adminTimestamp.fromDate(updates.completedAt);
      }
      if (updates.lastAttemptAt) {
        updateData.lastAttemptAt = adminTimestamp.fromDate(updates.lastAttemptAt);
      }

      await docRef.update(updateData);
    }

    return { success: true };
  } catch (error) {
    log.error('Error updating KSB progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress',
    };
  }
}

export async function getUserKSBProgress(
  userId: string
): Promise<{ success: boolean; progress?: KSBProgress[]; error?: string }> {
  try {
    // Validate auth - user can only access their own progress
    const authUserId = await requireAuthUserId();
    if (authUserId !== userId) {
      return { success: false, error: 'Unauthorized: Cannot access other user\'s progress' };
    }

    const snapshot = await adminDb
      .collection('ksb_progress')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    const progress: KSBProgress[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: toDateFromSerialized(data.createdAt),
        updatedAt: toDateFromSerialized(data.updatedAt),
        completedAt: toDateFromSerialized(data.completedAt),
        lastAttemptAt: toDateFromSerialized(data.lastAttemptAt),
      } as KSBProgress;
    });

    return { success: true, progress };
  } catch (error) {
    log.error('Error fetching user KSB progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch progress',
    };
  }
}

export async function getDomainProgress(
  userId: string,
  domainId: string
): Promise<{
  success: boolean;
  stats?: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    averageScore: number;
  };
  error?: string;
}> {
  try {
    // Validate auth - user can only access their own progress
    const authUserId = await requireAuthUserId();
    if (authUserId !== userId) {
      return { success: false, error: 'Unauthorized: Cannot access other user\'s progress' };
    }

    const snapshot = await adminDb
      .collection('ksb_progress')
      .where('userId', '==', userId)
      .where('domainId', '==', domainId)
      .get();

    const progressList = snapshot.docs.map((doc) => doc.data() as KSBProgress);

    const completed = progressList.filter((p) => p.status === 'completed' || p.status === 'mastered').length;
    const inProgress = progressList.filter((p) => p.status === 'in_progress').length;
    const notStarted = progressList.filter((p) => p.status === 'not_started').length;

    const scores = progressList
      .filter((p) => p.bestScore !== undefined)
      .map((p) => p.bestScore as number);
    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    return {
      success: true,
      stats: {
        total: progressList.length,
        completed,
        inProgress,
        notStarted,
        averageScore,
      },
    };
  } catch (error) {
    log.error('Error fetching domain progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch progress',
    };
  }
}
