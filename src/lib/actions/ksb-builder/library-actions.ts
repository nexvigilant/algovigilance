'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { COLLECTIONS, SUBCOLLECTIONS } from '@/lib/firestore-utils';
import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
import type { KSBLibraryEntry } from './types';

const log = logger.scope('ksb-builder/library-actions');

// ============================================================================
// KSB Library Integration (Universal Knowledge Bank)
// ============================================================================
//
// NOTE: The `ksb_library` collection is INTENTIONALLY used here.
// Unlike the legacy ksb-management/actions.ts, this is NOT deprecated.
//
// The ksb_library serves as a "Universal Knowledge Bank" for AI content generation:
// - Provides rich research data for ALO content generation
// - Contains citation and regulatory context for enhanced prompts
// - Links to capability_components via `ksbLibraryId` field
//
// Primary KSB data storage: pv_domains/{id}/capability_components
// Research enrichment: ksb_library (linked via ksbLibraryId)
// ============================================================================

export async function searchKSBLibrary(
  query: string,
  type?: 'knowledge' | 'skill' | 'behavior'
): Promise<{ success: boolean; entries?: KSBLibraryEntry[]; error?: string }> {
  try {
    let queryRef = adminDb.collection('ksb_library').limit(50);

    if (type) {
      queryRef = queryRef.where('type', '==', type);
    }

    const snapshot = await queryRef.get();

    // Filter by query string (title, description, keywords)
    const entries: KSBLibraryEntry[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ksbCode: data.ksbCode || data.id,
          title: data.title || data.itemName || '',
          description: data.description || data.itemDescription || '',
          type: data.type || 'knowledge',
          keywords: data.keywords || [],
          researchQuality: data.researchQuality || data.qualityScore || 0,
          lastUpdated: toDateFromSerialized(data.lastUpdated) || toDateFromSerialized(data.updatedAt),
          citations: data.citations || data.citationCount || 0,
        } as KSBLibraryEntry;
      })
      .filter((entry) => {
        const searchLower = query.toLowerCase();
        return (
          entry.title.toLowerCase().includes(searchLower) ||
          entry.description.toLowerCase().includes(searchLower) ||
          entry.keywords.some((k) => k.toLowerCase().includes(searchLower))
        );
      });

    return { success: true, entries };
  } catch (error) {
    log.error('Error searching KSB library:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search library',
    };
  }
}

export async function getKSBFromLibrary(
  ksbLibraryId: string
): Promise<{ success: boolean; entry?: KSBLibraryEntry; error?: string }> {
  try {
    const docSnap = await adminDb.collection('ksb_library').doc(ksbLibraryId).get();

    if (!docSnap.exists) {
      return { success: false, error: 'KSB not found in library' };
    }

    const data = docSnap.data();
    if (!data) {
      return { success: false, error: 'KSB library data is empty' };
    }
    const entry: KSBLibraryEntry = {
      id: docSnap.id,
      ksbCode: data.ksbCode || data.id,
      title: data.title || data.itemName || '',
      description: data.description || data.itemDescription || '',
      type: data.type || 'knowledge',
      keywords: data.keywords || [],
      researchQuality: data.researchQuality || data.qualityScore || 0,
      lastUpdated: toDateFromSerialized(data.lastUpdated) || toDateFromSerialized(data.updatedAt),
      citations: data.citations || data.citationCount || 0,
    };

    return { success: true, entry };
  } catch (error) {
    log.error('Error fetching from KSB library:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch from library',
    };
  }
}

export async function linkKSBToLibrary(
  domainId: string,
  ksbId: string,
  ksbLibraryId: string,
  matchConfidence: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    // Verify the library entry exists
    const libraryEntry = await getKSBFromLibrary(ksbLibraryId);
    if (!libraryEntry.success || !libraryEntry.entry) {
      return { success: false, error: 'KSB library entry not found' };
    }

    const entry = libraryEntry.entry;

    // Update the capability component with the reference
    await adminDb
      .collection(COLLECTIONS.PV_DOMAINS)
      .doc(domainId)
      .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
      .doc(ksbId)
      .update({
        ksbLibraryId,
        ksbLibraryMapping: {
          matchConfidence,
          mappedAt: adminTimestamp.now(),
          mappedBy: userId,
        },
        coverage: {
          hasResearch: true,
          researchQuality: entry.researchQuality,
          lastSynced: adminTimestamp.now(),
          readyForProduction: entry.researchQuality >= 70,
          missingRequirements: entry.researchQuality < 70
            ? ['Research quality below threshold']
            : [],
        },
        updatedAt: adminTimestamp.now(),
      });

    return { success: true };
  } catch (error) {
    log.error('Error linking KSB to library:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to link KSB',
    };
  }
}
