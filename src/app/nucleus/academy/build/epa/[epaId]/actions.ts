'use server';

/**
 * EPA Learning Actions
 *
 * Server actions for fetching KSBs organized by entrustment level
 * for the EPA learning experience.
 */

import { adminDb } from '@/lib/firebase-admin';
import { serializeForClient } from '@/lib/serialization-utils';
import type { ProficiencyLevel } from '@/types/epa-pathway';
import type { CapabilityComponent } from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
const log = logger.scope('learn/epa/actions');

// =============================================================================
// PDC v4.1 COLLECTION PATHS
// =============================================================================

const PATHS = {
  epas: 'pdc_framework/epas/items',
} as const;

// Helper to get subcollection reference from path
function getItemsCollection(path: string) {
  const [collection, doc, subcollection] = path.split('/');
  return adminDb.collection(collection).doc(doc).collection(subcollection);
}

/**
 * Get KSBs for an EPA organized by proficiency level
 * @param epaId - The EPA identifier
 * @param options.includeAllStatuses - If true, returns all KSBs regardless of status (for admin).
 *                                     If false (default), only returns published KSBs (for practitioners).
 */
export async function getKSBsForEPA(
  epaId: string,
  options: { includeAllStatuses?: boolean } = {}
): Promise<Record<ProficiencyLevel, CapabilityComponent[]>> {
  const { includeAllStatuses = false } = options;
  // Normalize ID to uppercase to match Firestore document IDs
  const normalizedEpaId = epaId.toUpperCase();

  try {
    // Initialize empty result
    const result: Record<ProficiencyLevel, CapabilityComponent[]> = {
      L1: [],
      L2: [],
      L3: [],
      L4: [],
      L5: [],
      'L5+': [],
    };

    // Get the EPA to find its domains
    const epaDoc = await getItemsCollection(PATHS.epas).doc(normalizedEpaId).get();
    if (!epaDoc.exists) {
      log.warn(`[getKSBsForEPA] EPA not found: ${epaId}`);
      return result;
    }

    const epaData = epaDoc.data();
    const domains = [
      ...(epaData?.primaryDomains || []),
      ...(epaData?.secondaryDomains || []),
    ];

    if (domains.length === 0) {
      log.warn(`[getKSBsForEPA] No domains found for EPA: ${epaId}`);
      return result;
    }

    // Fetch KSBs from each domain's capability_components subcollection
    // that have this EPA ID mapped
    const ksbPromises = domains.map(async (domainId) => {
      try {
        const snapshot = await adminDb
          .collection('pv_domains')
          .doc(domainId)
          .collection('capability_components')
          .where('epaIds', 'array-contains', normalizedEpaId)
          .get();

        return snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          domainId,
        })) as CapabilityComponent[];
      } catch (error) {
        log.error(`[getKSBsForEPA] Error fetching KSBs for domain ${domainId}:`, error);
        return [];
      }
    });

    const ksbArrays = await Promise.all(ksbPromises);
    const allKSBs = ksbArrays.flat();

    // Also try fetching KSBs that might have epa_id field (legacy format)
    const legacyPromises = domains.map(async (domainId) => {
      try {
        const snapshot = await adminDb
          .collection('pv_domains')
          .doc(domainId)
          .collection('capability_components')
          .where('epa_id', '==', normalizedEpaId)
          .get();

        return snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          domainId,
        })) as CapabilityComponent[];
      } catch (error) {
        // Silently ignore - this query may fail if field doesn't exist
        return [];
      }
    });

    const legacyArrays = await Promise.all(legacyPromises);
    const legacyKSBs = legacyArrays.flat();

    // Also use collection group query to find KSBs that have this EPA in their epaIds
    // This catches KSBs in domains not explicitly listed in the EPA's domain list
    let collectionGroupKSBs: CapabilityComponent[] = [];
    try {
      const cgSnapshot = await adminDb
        .collectionGroup('capability_components')
        .where('epaIds', 'array-contains', normalizedEpaId)
        .get();

      collectionGroupKSBs = cgSnapshot.docs.map((doc) => {
        // Extract domainId from the parent path: pv_domains/{domainId}/capability_components
        const pathParts = doc.ref.path.split('/');
        const domainId = pathParts[1] || '';
        return {
          ...doc.data(),
          id: doc.id,
          domainId,
        } as CapabilityComponent;
      });
    } catch (error) {
      // Collection group query may fail if index doesn't exist
      log.warn(`[getKSBsForEPA] Collection group query failed (index may not exist):`, error);
    }

    // Combine and deduplicate from all sources
    const seenIds = new Set<string>();
    const combinedKSBs: CapabilityComponent[] = [];

    for (const ksb of [...allKSBs, ...legacyKSBs, ...collectionGroupKSBs]) {
      if (!seenIds.has(ksb.id)) {
        seenIds.add(ksb.id);

        // Filter by status unless includeAllStatuses is true
        // Only published KSBs should be shown to practitioners
        if (includeAllStatuses || ksb.status === 'published') {
          combinedKSBs.push(ksb);
        }
      }
    }

    // Organize by proficiency level
    for (const ksb of combinedKSBs) {
      const level = ksb.proficiencyLevel as ProficiencyLevel;
      if (level && result[level]) {
        result[level].push(ksb);
      } else {
        // Default to L1 if no level specified
        result['L1'].push(ksb);
      }
    }

    // Sort each level by type (knowledge, skill, behavior) then by itemName
    const typeOrder: Record<string, number> = { knowledge: 0, skill: 1, behavior: 2, ai_integration: 3 };
    for (const level of Object.keys(result) as ProficiencyLevel[]) {
      result[level].sort((a, b) => {
        const typeCompare = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
        if (typeCompare !== 0) return typeCompare;
        return (a.itemName || '').localeCompare(b.itemName || '');
      });
    }

    const totalCount = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
    const statusFilter = includeAllStatuses ? 'all statuses' : 'published only';
    log.info(`[getKSBsForEPA] Found ${totalCount} KSBs for ${normalizedEpaId} across ${domains.length} domains (${statusFilter})`);

    // Serialize all KSBs to convert Firestore Timestamps to ISO strings
    // This is required for passing data to Client Components
    const serializedResult: Record<ProficiencyLevel, CapabilityComponent[]> = {
      L1: result.L1.map(ksb => serializeForClient(ksb)),
      L2: result.L2.map(ksb => serializeForClient(ksb)),
      L3: result.L3.map(ksb => serializeForClient(ksb)),
      L4: result.L4.map(ksb => serializeForClient(ksb)),
      L5: result.L5.map(ksb => serializeForClient(ksb)),
      'L5+': result['L5+'].map(ksb => serializeForClient(ksb)),
    };

    return serializedResult;
  } catch (error) {
    log.error(`[getKSBsForEPA] Error:`, error);
    return {
      L1: [],
      L2: [],
      L3: [],
      L4: [],
      L5: [],
      'L5+': [],
    };
  }
}

/**
 * Get a single KSB by ID with full content
 */
export async function getKSBById(
  domainId: string,
  ksbId: string
): Promise<CapabilityComponent | null> {
  try {
    const doc = await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .doc(ksbId)
      .get();

    if (!doc.exists) {
      return null;
    }

    // Serialize to convert Firestore Timestamps for Client Components
    return serializeForClient({
      ...doc.data(),
      id: doc.id,
      domainId,
    } as CapabilityComponent);
  } catch (error) {
    log.error(`[getKSBById] Error:`, error);
    return null;
  }
}
