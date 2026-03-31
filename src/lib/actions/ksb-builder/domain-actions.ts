'use server';

import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-utils';
import { logger } from '@/lib/logger';
import type { FunctionalAreaInfo, DomainInfo } from './types';

const log = logger.scope('ksb-builder/domain-actions');

// ============================================================================
// Fetch Functional Areas
// ============================================================================

export async function getFunctionalAreas(): Promise<{
  success: boolean;
  functionalAreas?: FunctionalAreaInfo[];
  error?: string;
}> {
  try {
    const snapshot = await adminDb
      .collection('functional_areas')
      .orderBy('name', 'asc')
      .get();

    const functionalAreas: FunctionalAreaInfo[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || doc.id,
        description: data.description,
        status: data.status || 'active',
        domainCount: data.domainCount || 0,
      };
    });

    return { success: true, functionalAreas };
  } catch (error) {
    log.error('Error fetching functional areas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch functional areas',
    };
  }
}

// ============================================================================
// Fetch Domains
// ============================================================================

export async function getDomains(functionalAreaId?: string): Promise<{
  success: boolean;
  domains?: DomainInfo[];
  error?: string;
}> {
  try {
    // Use simple query without orderBy to avoid composite index requirement
    let snapshot;

    if (functionalAreaId) {
      snapshot = await adminDb
        .collection(COLLECTIONS.PV_DOMAINS)
        .where('functionalAreaId', '==', functionalAreaId)
        .get();
    } else {
      snapshot = await adminDb.collection(COLLECTIONS.PV_DOMAINS).get();
    }

    const domains: DomainInfo[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Domain ${doc.id}`,
        cluster: data.cluster,
        description: data.description,
        functionalAreaId: data.functionalAreaId,
      };
    });

    // Sort in-memory by id
    domains.sort((a, b) => a.id.localeCompare(b.id));

    return { success: true, domains };
  } catch (error) {
    log.error('Error fetching domains:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch domains',
    };
  }
}
