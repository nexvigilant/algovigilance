/**
 * Checkpoint Manager for Manufacturing Pipeline
 *
 * Handles persistence and recovery of batch processing state,
 * enabling resume capability after failures or interruptions.
 *
 * Also provides incremental checkpointing at the ALO section level
 * to avoid regenerating completed sections after mid-generation failures.
 *
 * @module lib/manufacturing/checkpoint-manager
 */

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { BatchCheckpoint, BatchConfig } from '@/types/manufacturing';
import type {
  KSBHook,
  KSBConcept,
  KSBActivity,
  KSBReflection,
  KSBActivityMetadata,
} from '@/types/alo';
import { toDateFromSerialized } from '@/types/academy';

const log = logger.scope('checkpoint-manager');

const CHECKPOINT_COLLECTION = 'manufacturing_checkpoints';
const INCREMENTAL_CHECKPOINT_COLLECTION = 'manufacturing_incremental_checkpoints';

/**
 * Partial ALO content structure for incremental saving
 */
export interface ALOContent {
  hook: KSBHook;
  concept: KSBConcept;
  activity: KSBActivity;
  reflection: KSBReflection;
  metadata: KSBActivityMetadata;
}

/**
 * ALO section types for incremental checkpointing
 */
export type ALOSection = 'hook' | 'concept' | 'activity' | 'reflection' | 'metadata';

/**
 * Incremental checkpoint for individual ALO generation
 */
export interface IncrementalCheckpoint {
  /** Temporary ALO ID (before final save) */
  aloId: string;
  /** KSB ID being processed */
  ksbId: string;
  /** Domain ID for context */
  domainId: string;
  /** Sections that have been successfully generated */
  completedSections: ALOSection[];
  /** Partial ALO content saved so far */
  partialContent: Partial<ALOContent>;
  /** Timestamp of last update */
  timestamp: Date;
  /** Generation input parameters for resume */
  generationInput?: Record<string, unknown>;
}

/**
 * Saves a checkpoint to Firestore for later resume
 */
export async function saveCheckpoint(checkpoint: BatchCheckpoint): Promise<void> {
  try {
    await adminDb.collection(CHECKPOINT_COLLECTION).doc(checkpoint.batchId).set({
      ...checkpoint,
      timestamp: new Date(),
    });
    log.info(`Checkpoint saved for batch ${checkpoint.batchId}`, {
      processedCount: checkpoint.processedKsbIds.length,
      lastKsbId: checkpoint.lastKsbId,
    });
  } catch (error) {
    log.error('Failed to save checkpoint', { batchId: checkpoint.batchId, error });
    throw error;
  }
}

/**
 * Loads a checkpoint from Firestore
 */
export async function loadCheckpoint(batchId: string): Promise<BatchCheckpoint | null> {
  try {
    const doc = await adminDb.collection(CHECKPOINT_COLLECTION).doc(batchId).get();

    if (!doc.exists) {
      log.debug(`No checkpoint found for batch ${batchId}`);
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    log.info(`Checkpoint loaded for batch ${batchId}`, {
      processedCount: data.processedKsbIds?.length || 0,
    });

    return {
      batchId: data.batchId,
      config: data.config as BatchConfig,
      processedKsbIds: data.processedKsbIds || [],
      lastKsbId: data.lastKsbId,
      timestamp: toDateFromSerialized(data.timestamp) || new Date(),
    };
  } catch (error) {
    log.error('Failed to load checkpoint', { batchId, error });
    throw error;
  }
}

/**
 * Lists all available checkpoints
 */
export async function listCheckpoints(): Promise<BatchCheckpoint[]> {
  try {
    const snapshot = await adminDb
      .collection(CHECKPOINT_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        batchId: data.batchId,
        config: data.config as BatchConfig,
        processedKsbIds: data.processedKsbIds || [],
        lastKsbId: data.lastKsbId,
        timestamp: toDateFromSerialized(data.timestamp) || new Date(),
      };
    });
  } catch (error) {
    log.error('Failed to list checkpoints', { error });
    throw error;
  }
}

/**
 * Deletes a checkpoint after successful completion
 */
export async function deleteCheckpoint(batchId: string): Promise<void> {
  try {
    await adminDb.collection(CHECKPOINT_COLLECTION).doc(batchId).delete();
    log.info(`Checkpoint deleted for batch ${batchId}`);
  } catch (error) {
    log.error('Failed to delete checkpoint', { batchId, error });
    // Non-critical, don't throw
  }
}

/**
 * Generates a unique batch ID with timestamp
 */
export function generateBatchId(prefix: string = 'batch'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Gets the most recent checkpoint for a given config (useful for auto-resume)
 */
export async function getLatestCheckpoint(
  sourceCollection: string
): Promise<BatchCheckpoint | null> {
  try {
    const snapshot = await adminDb
      .collection(CHECKPOINT_COLLECTION)
      .where('config.sourceCollection', '==', sourceCollection)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    return {
      batchId: data.batchId,
      config: data.config as BatchConfig,
      processedKsbIds: data.processedKsbIds || [],
      lastKsbId: data.lastKsbId,
      timestamp: toDateFromSerialized(data.timestamp) || new Date(),
    };
  } catch (error) {
    log.error('Failed to get latest checkpoint', { sourceCollection, error });
    return null;
  }
}

// =============================================================================
// Incremental Checkpointing (Section-Level)
// =============================================================================

/**
 * Generates a temporary ALO ID for incremental checkpointing
 */
export function generateTempAloId(ksbId: string): string {
  const timestamp = Date.now();
  return `temp-alo-${ksbId}-${timestamp}`;
}

/**
 * Saves an incremental checkpoint after completing an ALO section
 *
 * Call this after each section (hook, concept, activity, reflection, metadata)
 * is successfully generated to enable resume from that point.
 */
export async function saveIncrementalCheckpoint(
  checkpoint: IncrementalCheckpoint
): Promise<void> {
  try {
    await adminDb
      .collection(INCREMENTAL_CHECKPOINT_COLLECTION)
      .doc(checkpoint.ksbId) // Use ksbId as doc ID for easy lookup
      .set({
        ...checkpoint,
        timestamp: new Date(),
      });

    log.debug(`Incremental checkpoint saved for KSB ${checkpoint.ksbId}`, {
      completedSections: checkpoint.completedSections,
    });
  } catch (error) {
    log.error('Failed to save incremental checkpoint', {
      ksbId: checkpoint.ksbId,
      error,
    });
    // Non-critical - don't throw, but log for monitoring
  }
}

/**
 * Loads an incremental checkpoint for a KSB
 *
 * Returns null if no checkpoint exists (fresh generation needed)
 */
export async function loadIncrementalCheckpoint(
  ksbId: string
): Promise<IncrementalCheckpoint | null> {
  try {
    const doc = await adminDb
      .collection(INCREMENTAL_CHECKPOINT_COLLECTION)
      .doc(ksbId)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    log.debug(`Incremental checkpoint loaded for KSB ${ksbId}`, {
      completedSections: data.completedSections,
    });

    return {
      aloId: data.aloId,
      ksbId: data.ksbId,
      domainId: data.domainId,
      completedSections: data.completedSections || [],
      partialContent: data.partialContent || {},
      timestamp: toDateFromSerialized(data.timestamp) || new Date(),
      generationInput: data.generationInput,
    };
  } catch (error) {
    log.error('Failed to load incremental checkpoint', { ksbId, error });
    return null;
  }
}

/**
 * Updates an existing incremental checkpoint with a new section
 *
 * Convenience method that loads, updates, and saves in one call.
 */
export async function updateIncrementalCheckpoint(
  ksbId: string,
  section: ALOSection,
  sectionContent: unknown
): Promise<void> {
  try {
    const existing = await loadIncrementalCheckpoint(ksbId);

    if (!existing) {
      log.warn(`No checkpoint found to update for KSB ${ksbId}`);
      return;
    }

    // Add section to completed list if not already there
    const completedSections = existing.completedSections.includes(section)
      ? existing.completedSections
      : [...existing.completedSections, section];

    // Update partial content
    const partialContent = {
      ...existing.partialContent,
      [section]: sectionContent,
    };

    await saveIncrementalCheckpoint({
      ...existing,
      completedSections,
      partialContent,
    });
  } catch (error) {
    log.error('Failed to update incremental checkpoint', {
      ksbId,
      section,
      error,
    });
  }
}

/**
 * Deletes an incremental checkpoint after successful ALO completion
 */
export async function deleteIncrementalCheckpoint(ksbId: string): Promise<void> {
  try {
    await adminDb
      .collection(INCREMENTAL_CHECKPOINT_COLLECTION)
      .doc(ksbId)
      .delete();

    log.debug(`Incremental checkpoint deleted for KSB ${ksbId}`);
  } catch (error) {
    log.error('Failed to delete incremental checkpoint', { ksbId, error });
    // Non-critical, don't throw
  }
}

/**
 * Lists all pending incremental checkpoints
 *
 * Useful for viewing partially-generated ALOs that can be resumed.
 */
export async function listIncrementalCheckpoints(
  options: {
    domainId?: string;
    limit?: number;
    olderThan?: Date;
  } = {}
): Promise<IncrementalCheckpoint[]> {
  try {
    let query = adminDb
      .collection(INCREMENTAL_CHECKPOINT_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(options.limit ?? 100);

    if (options.domainId) {
      query = query.where('domainId', '==', options.domainId);
    }

    if (options.olderThan) {
      query = query.where('timestamp', '<', options.olderThan);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        aloId: data.aloId,
        ksbId: data.ksbId,
        domainId: data.domainId,
        completedSections: data.completedSections || [],
        partialContent: data.partialContent || {},
        timestamp: toDateFromSerialized(data.timestamp) || new Date(),
        generationInput: data.generationInput,
      };
    });
  } catch (error) {
    log.error('Failed to list incremental checkpoints', { error });
    throw error;
  }
}

/**
 * Cleans up stale incremental checkpoints older than specified age
 *
 * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 */
export async function cleanupStaleIncrementalCheckpoints(
  maxAgeMs: number = 24 * 60 * 60 * 1000
): Promise<{ deleted: number }> {
  try {
    const cutoffDate = new Date(Date.now() - maxAgeMs);

    const snapshot = await adminDb
      .collection(INCREMENTAL_CHECKPOINT_COLLECTION)
      .where('timestamp', '<', cutoffDate)
      .limit(500)
      .get();

    if (snapshot.empty) {
      return { deleted: 0 };
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    log.info(`Cleaned up ${snapshot.size} stale incremental checkpoints`);
    return { deleted: snapshot.size };
  } catch (error) {
    log.error('Failed to cleanup stale incremental checkpoints', { error });
    throw error;
  }
}

/**
 * Checks if an ALO section needs to be generated
 *
 * Returns true if the section is not in the completed list.
 */
export function needsGeneration(
  checkpoint: IncrementalCheckpoint | null,
  section: ALOSection
): boolean {
  if (!checkpoint) return true;
  return !checkpoint.completedSections.includes(section);
}
