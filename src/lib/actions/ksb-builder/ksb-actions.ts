'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import type {
  CapabilityComponent,
  KSBHook,
  KSBConcept,
  KSBActivity,
  KSBReflection,
  KSBActivityMetadata,
  KSBContentStatus,
  KSBStatusChange,
  ResearchData,
  CoverageScore,
} from '@/types/pv-curriculum';
import { COLLECTIONS, SUBCOLLECTIONS } from '@/lib/firestore-utils';
import { logger } from '@/lib/logger';
import { serializeTimestamps, calculateCoverageScoreFromResearch } from './helpers';

const log = logger.scope('ksb-builder/ksb-actions');

// ============================================================================
// Fetch KSBs for Builder
// ============================================================================

export async function getKSBsForBuilder(
  domainId: string
): Promise<{ success: boolean; ksbs?: CapabilityComponent[]; error?: string }> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.PV_DOMAINS)
      .doc(domainId)
      .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
      .orderBy('id', 'asc')
      .get();

    const ksbs: CapabilityComponent[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Serialize all timestamps recursively for Client Component compatibility
      return serializeTimestamps(data) as CapabilityComponent;
    });

    return { success: true, ksbs };
  } catch (error) {
    log.error('Error fetching KSBs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch KSBs',
    };
  }
}

export async function getKSBForBuilder(
  domainId: string,
  ksbId: string
): Promise<{ success: boolean; ksb?: CapabilityComponent; error?: string }> {
  try {
    const docSnap = await adminDb
      .collection(COLLECTIONS.PV_DOMAINS)
      .doc(domainId)
      .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
      .doc(ksbId)
      .get();

    if (!docSnap.exists) {
      return { success: false, error: 'KSB not found' };
    }

    const data = docSnap.data();
    if (!data) {
      return { success: false, error: 'KSB data is empty' };
    }
    // Serialize all timestamps recursively for Client Component compatibility
    const ksb: CapabilityComponent = serializeTimestamps(data) as CapabilityComponent;

    return { success: true, ksb };
  } catch (error) {
    log.error('Error fetching KSB:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch KSB',
    };
  }
}

// ============================================================================
// Update KSB Activity Content
// ============================================================================

export async function updateKSBHook(
  domainId: string,
  ksbId: string,
  hook: KSBHook
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection(COLLECTIONS.PV_DOMAINS)
      .doc(domainId)
      .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
      .doc(ksbId)
      .update({
        hook,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating hook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update hook',
    };
  }
}

export async function updateKSBConcept(
  domainId: string,
  ksbId: string,
  concept: KSBConcept
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection(COLLECTIONS.PV_DOMAINS)
      .doc(domainId)
      .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
      .doc(ksbId)
      .update({
        concept,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating concept:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update concept',
    };
  }
}

export async function updateKSBActivity(
  domainId: string,
  ksbId: string,
  activity: KSBActivity
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection(COLLECTIONS.PV_DOMAINS)
      .doc(domainId)
      .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
      .doc(ksbId)
      .update({
        activity,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating activity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update activity',
    };
  }
}

export async function updateKSBReflection(
  domainId: string,
  ksbId: string,
  reflection: KSBReflection
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection(COLLECTIONS.PV_DOMAINS)
      .doc(domainId)
      .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
      .doc(ksbId)
      .update({
        reflection,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating reflection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update reflection',
    };
  }
}

export async function updateKSBMetadata(
  domainId: string,
  ksbId: string,
  metadata: KSBActivityMetadata
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection(COLLECTIONS.PV_DOMAINS)
      .doc(domainId)
      .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
      .doc(ksbId)
      .update({
        activityMetadata: metadata,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update metadata',
    };
  }
}

export async function updateKSBFullContent(
  domainId: string,
  ksbId: string,
  content: {
    hook?: KSBHook;
    concept?: KSBConcept;
    activity?: KSBActivity;
    reflection?: KSBReflection;
    activityMetadata?: KSBActivityMetadata;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection(COLLECTIONS.PV_DOMAINS)
      .doc(domainId)
      .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
      .doc(ksbId)
      .update({
        ...content,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating KSB content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update content',
    };
  }
}

// ============================================================================
// Get KSB Content Status
// ============================================================================

export async function getKSBContentStatus(
  domainId: string
): Promise<{
  success: boolean;
  stats?: {
    total: number;
    withHook: number;
    withConcept: number;
    withActivity: number;
    withReflection: number;
    complete: number;
  };
  error?: string;
}> {
  try {
    const result = await getKSBsForBuilder(domainId);
    if (!result.success || !result.ksbs) {
      return { success: false, error: result.error };
    }

    const ksbs = result.ksbs;
    const stats = {
      total: ksbs.length,
      withHook: ksbs.filter((k) => k.hook).length,
      withConcept: ksbs.filter((k) => k.concept).length,
      withActivity: ksbs.filter((k) => k.activity).length,
      withReflection: ksbs.filter((k) => k.reflection).length,
      complete: ksbs.filter((k) => k.hook && k.concept && k.activity && k.reflection).length,
    };

    return { success: true, stats };
  } catch (error) {
    log.error('Error getting content status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get status',
    };
  }
}

// ============================================================================
// Workflow Status Management
// ============================================================================

export async function updateKSBStatus(
  domainId: string,
  ksbId: string,
  newStatus: KSBContentStatus,
  userId: string,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    // Get current status for audit
    const ksbResult = await getKSBForBuilder(domainId, ksbId);
    if (!ksbResult.success || !ksbResult.ksb) {
      return { success: false, error: 'KSB not found' };
    }

    const previousStatus = ksbResult.ksb.status || 'draft';

    // Validate status transition
    const validTransitions: Record<KSBContentStatus, KSBContentStatus[]> = {
      draft: ['generating'],
      generating: ['review', 'draft'],
      review: ['published', 'draft'],
      published: ['archived', 'review'],
      archived: ['draft'],
    };

    if (!validTransitions[previousStatus]?.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status transition: ${previousStatus} → ${newStatus}`,
      };
    }

    // Build workflow update based on new status
    const workflowUpdate: Record<string, unknown> = {
      version: (ksbResult.ksb.workflow?.version || 0) + 1,
      lastModifiedBy: userId,
    };

    if (newStatus === 'review') {
      workflowUpdate.generatedAt = adminTimestamp.now();
    } else if (newStatus === 'published') {
      workflowUpdate.reviewedBy = userId;
      workflowUpdate.reviewedAt = adminTimestamp.now();
      workflowUpdate.publishedBy = userId;
      workflowUpdate.publishedAt = adminTimestamp.now();
      if (comment) workflowUpdate.reviewNotes = comment;
    } else if (newStatus === 'archived') {
      workflowUpdate.archivedBy = userId;
      workflowUpdate.archivedAt = adminTimestamp.now();
    }

    // Update KSB status and create audit record in parallel (independent writes)
    const statusChange: Omit<KSBStatusChange, 'id'> = {
      ksbId,
      domainId,
      previousStatus,
      newStatus,
      changedBy: userId,
      changedAt: new Date(),
      comment,
    };

    await Promise.all([
      adminDb
        .collection(COLLECTIONS.PV_DOMAINS)
        .doc(domainId)
        .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
        .doc(ksbId)
        .update({
          status: newStatus,
          workflow: workflowUpdate,
          updatedAt: adminTimestamp.now(),
        }),
      adminDb.collection('ksb_status_changes').add(statusChange),
    ]);

    return { success: true };
  } catch (error) {
    log.error('Error updating KSB status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

export async function submitForReview(
  domainId: string,
  ksbId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Validate content completeness before submitting
  const ksbResult = await getKSBForBuilder(domainId, ksbId);
  if (!ksbResult.success || !ksbResult.ksb) {
    return { success: false, error: 'KSB not found' };
  }

  const ksb = ksbResult.ksb;
  const missingContent: string[] = [];

  if (!ksb.hook?.content) missingContent.push('Hook');
  if (!ksb.concept?.content) missingContent.push('Concept');
  if (!ksb.activity?.instructions) missingContent.push('Activity');
  if (!ksb.reflection?.prompt) missingContent.push('Reflection');

  if (missingContent.length > 0) {
    return {
      success: false,
      error: `Missing required content: ${missingContent.join(', ')}`,
    };
  }

  return updateKSBStatus(domainId, ksbId, 'review', userId);
}

export async function publishKSB(
  domainId: string,
  ksbId: string,
  userId: string,
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> {
  return updateKSBStatus(domainId, ksbId, 'published', userId, reviewNotes);
}

export async function archiveKSB(
  domainId: string,
  ksbId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return updateKSBStatus(domainId, ksbId, 'archived', userId, reason);
}

/**
 * Update research data for a KSB with auto CoverageScore recalculation
 */
export async function updateKSBResearch(
  domainId: string,
  ksbId: string,
  researchData: Partial<ResearchData>,
  userId: string
): Promise<{ success: boolean; error?: string; coverageScore?: CoverageScore }> {
  try {
    await requireAdmin();

    // Calculate new coverage score
    const coverageScore = calculateCoverageScoreFromResearch(researchData);

    // Update the KSB document and create audit record in parallel (independent writes)
    await Promise.all([
      adminDb
        .collection(COLLECTIONS.PV_DOMAINS)
        .doc(domainId)
        .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
        .doc(ksbId)
        .update({
          research: {
            ...researchData,
            lastResearchedAt: new Date(),
            researchedBy: userId,
          },
          coverageScore,
          updatedAt: adminTimestamp.now(),
        }),
      adminDb.collection('ksb_research_updates').add({
        ksbId,
        domainId,
        updatedBy: userId,
        updatedAt: new Date(),
        citationCount: researchData.citations?.length || 0,
        authorityLevel: researchData.authorityLevel,
        coverageScore: coverageScore.overall,
      }),
    ]);

    return { success: true, coverageScore };
  } catch (error) {
    log.error('Error updating KSB research:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update research data',
    };
  }
}

/**
 * Alias for backwards compatibility
 */
export async function getKSBsForDomain(domainId: string) {
  return getKSBsForBuilder(domainId);
}
