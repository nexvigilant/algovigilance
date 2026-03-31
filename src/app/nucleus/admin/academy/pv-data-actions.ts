'use server';

/**
 * Consolidated PV Data Actions
 *
 * Central module for PV framework data operations. Consolidates common patterns
 * from pv-domains/actions.ts, domain-actions.ts, framework-browser/actions.ts,
 * and ksb-management/actions.ts.
 *
 * Collections (PDC v4.1):
 * - pv_domains: Rich PV domain data with capability_components subcollection (1,286 KSBs)
 * - pdc_framework/domains/items: Domain specifications for framework browser
 * - functional_areas: Functional area groupings
 *
 * DEPRECATED Collections (being phased out):
 * - domains: Use pdc_framework/domains/items instead
 * - ksb_library: Use pv_domains/{id}/capability_components instead
 *
 * @module admin/academy/pv-data-actions
 */

import { adminDb } from '@/lib/firebase-admin';
import type {
  PVDomain,
  CapabilityComponent,
  ActivityAnchor,
} from '@/types/pv-curriculum';
import type { KSBType, ProficiencyLevel } from '@/types/pv-framework';
import type { FunctionalArea, KSB } from '@/types/ksb-framework';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('pv-data-actions');

// =============================================================================
// PDC v4.1 COLLECTION PATHS
// =============================================================================

const PATHS = {
  domains: 'pdc_framework/domains/items',
} as const;

// Helper to get subcollection reference from path
function getItemsCollection(path: string) {
  const [collection, doc, subcollection] = path.split('/');
  return adminDb.collection(collection).doc(doc).collection(subcollection);
}

// ============================================================================
// Timestamp Utilities (shared across all PV data)
// ============================================================================

/**
 * Convert Firestore Timestamps to serializable format
 * Works with both Timestamp objects and serialized {_seconds, _nanoseconds}
 */
export function convertTimestamp(value: unknown): Date | string | null {
  if (!value) return null;

  // Firestore Timestamp with toDate method
  if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return toDateFromSerialized(value as { toDate: () => Date });
  }

  // Serialized Timestamp {_seconds, _nanoseconds}
  if (typeof value === 'object' && '_seconds' in value) {
    const ts = value as { _seconds: number; _nanoseconds?: number };
    return new Date(ts._seconds * 1000 + (ts._nanoseconds || 0) / 1000000);
  }

  // Already a Date
  if (value instanceof Date) {
    return value;
  }

  // String date
  if (typeof value === 'string') {
    return value;
  }

  return null;
}

/**
 * Recursively convert all Timestamps in an object
 */
export function convertTimestamps<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  // Handle timestamp-like objects
  if (typeof obj === 'object') {
    const anyObj = obj as Record<string, unknown>;

    // Check if this is a timestamp
    if ('_seconds' in anyObj || (typeof anyObj.toDate === 'function')) {
      return convertTimestamp(obj) as unknown as T;
    }

    // Date object
    if (obj instanceof Date) {
      return obj;
    }

    // Array
    if (Array.isArray(obj)) {
      return obj.map(item => convertTimestamps(item)) as unknown as T;
    }

    // Regular object - recurse
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertTimestamps(value);
    }
    return result as T;
  }

  return obj;
}

/**
 * Serialize timestamps to ISO strings for client components
 */
export function serializeTimestamps<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'object' && obj !== null) {
    const anyObj = obj as Record<string, unknown>;

    // Firestore Timestamp with toDate method
    if (typeof anyObj.toDate === 'function') {
      return (toDateFromSerialized(anyObj) as Date).toISOString() as unknown as T;
    }

    // Serialized Timestamp
    if ('_seconds' in anyObj && '_nanoseconds' in anyObj) {
      const seconds = anyObj._seconds as number;
      const nanoseconds = anyObj._nanoseconds as number;
      return new Date(seconds * 1000 + nanoseconds / 1000000).toISOString() as unknown as T;
    }

    // Date object
    if (obj instanceof Date) {
      return obj.toISOString() as unknown as T;
    }

    // Array
    if (Array.isArray(obj)) {
      return obj.map(item => serializeTimestamps(item)) as unknown as T;
    }

    // Regular object - recurse
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeTimestamps(value);
    }
    return result as T;
  }

  return obj;
}

// ============================================================================
// PV Domains (pv_domains collection) - Rich domain data
// ============================================================================

/**
 * Fetch all PV domains with full data
 */
export async function getAllPVDomains(): Promise<PVDomain[]> {
  try {
    const snapshot = await adminDb
      .collection('pv_domains')
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return serializeTimestamps({
        id: doc.id,
        ...data,
      }) as unknown as PVDomain;
    });
  } catch (error) {
    log.error('Error fetching PV domains:', error);
    throw new Error('Failed to fetch PV domains');
  }
}

/**
 * Fetch a single PV domain by ID
 */
export async function getPVDomainById(domainId: string): Promise<PVDomain | null> {
  try {
    const doc = await adminDb.collection('pv_domains').doc(domainId).get();

    if (!doc.exists) {
      return null;
    }

    return serializeTimestamps({
      id: doc.id,
      ...doc.data(),
    }) as unknown as PVDomain;
  } catch (error) {
    log.error(`Error fetching PV domain ${domainId}:`, error);
    throw new Error('Failed to fetch PV domain');
  }
}

/**
 * Domain summary for selectors/dropdowns (minimal data)
 */
export interface DomainSummary {
  id: string;
  name: string;
  definition: string;
  totalKSBs: number;
  stats: {
    knowledge: number;
    skills: number;
    behaviors: number;
  };
}

/**
 * Get domain summaries for selector UI
 */
export async function getPVDomainSummaries(): Promise<DomainSummary[]> {
  try {
    const snapshot = await adminDb
      .collection('pv_domains')
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as PVDomain;
      return {
        id: data.id,
        name: data.name,
        definition: data.definition,
        totalKSBs: data.totalKSBs,
        stats: {
          knowledge: data.stats?.knowledge || 0,
          skills: data.stats?.skills || 0,
          behaviors: data.stats?.behaviors || 0,
        },
      };
    });
  } catch (error) {
    log.error('Error fetching domain summaries:', error);
    throw new Error('Failed to fetch domain summaries');
  }
}

// ============================================================================
// Capability Components (KSBs in pv_domains subcollection)
// ============================================================================

/**
 * Fetch capability components (KSBs) for a domain
 */
export async function getCapabilityComponentsByDomain(
  domainId: string,
  type?: KSBType | 'ai_integration'
): Promise<CapabilityComponent[]> {
  try {
    const snapshot = await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .orderBy('majorSection', 'asc')
      .get();

    let components = snapshot.docs.map(doc => {
      return convertTimestamps(doc.data()) as CapabilityComponent;
    });

    // Client-side filtering for type
    if (type) {
      components = components.filter(c => c.type === type);
    }

    return components;
  } catch (error) {
    log.error(`Error fetching capability components for ${domainId}:`, error);
    throw new Error('Failed to fetch capability components');
  }
}

/**
 * Search capability components across all domains
 */
export async function searchCapabilityComponents(
  query: string,
  options?: {
    type?: KSBType | 'ai_integration';
    limit?: number;
    domainId?: string;
  }
): Promise<CapabilityComponent[]> {
  const { type, limit = 50, domainId } = options || {};

  try {
    const queryLower = query.toLowerCase();
    const results: CapabilityComponent[] = [];

    // If specific domain, search only that domain
    const domainIds = domainId
      ? [domainId]
      : (await adminDb.collection('pv_domains').get()).docs.map(d => d.id);

    for (const dId of domainIds) {
      const snapshot = await adminDb
        .collection('pv_domains')
        .doc(dId)
        .collection('capability_components')
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data() as CapabilityComponent;

        // Filter by type
        if (type && data.type !== type) continue;

        // Search in name, description, keywords
        const matchesName = data.itemName?.toLowerCase().includes(queryLower);
        const matchesDesc = data.itemDescription?.toLowerCase().includes(queryLower);
        const matchesKeywords = data.keywords?.some(k =>
          k.toLowerCase().includes(queryLower)
        );

        if (matchesName || matchesDesc || matchesKeywords) {
          results.push(convertTimestamps(data));
        }

        if (results.length >= limit) break;
      }

      if (results.length >= limit) break;
    }

    return results;
  } catch (error) {
    log.error('Error searching capability components:', error);
    throw new Error('Failed to search capability components');
  }
}

// ============================================================================
// Activity Anchors
// ============================================================================

const LEVEL_ORDER = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+', 'L5++'];

/**
 * Fetch activity anchors for a domain
 */
export async function getActivityAnchorsByDomain(
  domainId: string,
  level?: ProficiencyLevel
): Promise<ActivityAnchor[]> {
  try {
    const snapshot = await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('activity_anchors')
      .get();

    let anchors = snapshot.docs.map(doc => {
      return convertTimestamps(doc.data()) as ActivityAnchor;
    });

    // Client-side sorting by level then anchor number
    anchors.sort((a, b) => {
      const levelDiff = LEVEL_ORDER.indexOf(a.proficiencyLevel) - LEVEL_ORDER.indexOf(b.proficiencyLevel);
      if (levelDiff !== 0) return levelDiff;
      return a.anchorNumber - b.anchorNumber;
    });

    // Client-side filtering for level
    if (level) {
      anchors = anchors.filter(a => a.proficiencyLevel === level);
    }

    return anchors;
  } catch (error) {
    log.error(`Error fetching activity anchors for ${domainId}:`, error);
    return [];
  }
}

// ============================================================================
// Legacy KSB Library (ksb_library collection)
// DEPRECATED: Use pv_domains/{id}/capability_components instead
// ============================================================================

/**
 * Fetch KSBs from legacy ksb_library by functional area
 * @deprecated KSB data has been consolidated into pv_domains/{id}/capability_components.
 * Use getCapabilityComponentsByDomain() or searchCapabilityComponents() instead.
 */
export async function getKSBsByFunctionalArea(
  functionalArea: string,
  options?: {
    type?: 'knowledge' | 'skill' | 'behavior';
    status?: string;
  }
): Promise<KSB[]> {
  const { type, status } = options || {};

  try {
    const snapshot = await adminDb
      .collection('ksb_library')
      .where('functional_area', '==', functionalArea)
      .get();

    let ksbs = snapshot.docs.map(doc => {
      return convertTimestamps(doc.data()) as KSB;
    });

    // Client-side filtering
    if (type) {
      ksbs = ksbs.filter(ksb => ksb.type === type);
    }

    if (status) {
      ksbs = ksbs.filter(ksb => ksb.status === status);
    }

    // Sort by priority (desc) then name (asc)
    ksbs.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.name || '').localeCompare(b.name || '');
    });

    return ksbs;
  } catch (error) {
    log.error(`Error fetching KSBs for ${functionalArea}:`, error);
    throw new Error('Failed to fetch KSBs');
  }
}

/**
 * Fetch all functional areas
 */
export async function getAllFunctionalAreas(): Promise<FunctionalArea[]> {
  try {
    const snapshot = await adminDb
      .collection('functional_areas')
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map(doc => convertTimestamps(doc.data()) as FunctionalArea);
  } catch (error) {
    log.error('Error fetching functional areas:', error);
    throw new Error('Failed to fetch functional areas');
  }
}

// ============================================================================
// Framework Browser Data (domains, epas, cpas collections)
// ============================================================================

/**
 * Domain from simpler domains collection (framework browser)
 */
export interface FrameworkDomain {
  id: number;
  title: string;
  cluster: 'foundational' | 'process' | 'assessment' | 'integration';
  description: string;
  keyTopics: string[];
  behavioralAnchors: Record<string, string>;
}

/**
 * Fetch all domains for framework browser
 * @deprecated Use getDomainsAction from framework-browser/actions for PDC v4.1 types
 */
export async function getFrameworkDomains(): Promise<FrameworkDomain[]> {
  try {
    const snapshot = await getItemsCollection(PATHS.domains)
      .orderBy('id', 'asc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Transform PDC v4.1 format to legacy FrameworkDomain format
      const numericId = parseInt(doc.id.replace('D', ''));
      // Map new cluster IDs to legacy format
      const clusterMap: Record<string, 'foundational' | 'process' | 'assessment' | 'integration'> = {
        'foundational': 'foundational',
        'operational': 'process',
        'strategic': 'assessment',
        'integration': 'integration',
      };
      return {
        id: numericId,
        title: data.name || data.title || '',
        cluster: clusterMap[data.cluster?.id] || 'foundational',
        description: data.description || '',
        keyTopics: data.coreKnowledge?.map((k: { component: string }) => k.component) || data.keyTopics || [],
        behavioralAnchors: data.behavioralAnchors || {},
      };
    }) as FrameworkDomain[];
  } catch (error) {
    log.error('Error fetching framework domains:', error);
    throw new Error('Failed to fetch domains');
  }
}

/**
 * Fetch domains by cluster
 * @deprecated Use getDomainsByClusterAction from framework-browser/actions for PDC v4.1 types
 */
export async function getFrameworkDomainsByCluster(
  cluster: 'foundational' | 'process' | 'assessment' | 'integration'
): Promise<FrameworkDomain[]> {
  try {
    // Map legacy cluster names to new PDC v4.1 cluster IDs
    const clusterIdMap: Record<string, string> = {
      'foundational': 'foundational',
      'process': 'operational',
      'assessment': 'strategic',
      'integration': 'integration',
    };
    const newClusterId = clusterIdMap[cluster];

    const snapshot = await getItemsCollection(PATHS.domains)
      .where('cluster.id', '==', newClusterId)
      .orderBy('id', 'asc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const numericId = parseInt(doc.id.replace('D', ''));
      return {
        id: numericId,
        title: data.name || data.title || '',
        cluster: cluster,
        description: data.description || '',
        keyTopics: data.coreKnowledge?.map((k: { component: string }) => k.component) || data.keyTopics || [],
        behavioralAnchors: data.behavioralAnchors || {},
      };
    }) as FrameworkDomain[];
  } catch (error) {
    log.error('Error fetching domains by cluster:', error);
    throw new Error('Failed to fetch domains by cluster');
  }
}

// ============================================================================
// Stats & Analytics
// ============================================================================

/**
 * Get total KSB counts across all PV domains
 */
export async function getPVFrameworkStats(): Promise<{
  totalDomains: number;
  totalKSBs: number;
  byType: { knowledge: number; skills: number; behaviors: number };
}> {
  try {
    const domainsSnapshot = await adminDb.collection('pv_domains').get();

    let totalKSBs = 0;
    let knowledge = 0;
    let skills = 0;
    let behaviors = 0;

    for (const doc of domainsSnapshot.docs) {
      const data = doc.data() as PVDomain;
      totalKSBs += data.totalKSBs || 0;
      knowledge += data.stats?.knowledge || 0;
      skills += data.stats?.skills || 0;
      behaviors += data.stats?.behaviors || 0;
    }

    return {
      totalDomains: domainsSnapshot.size,
      totalKSBs,
      byType: { knowledge, skills, behaviors },
    };
  } catch (error) {
    log.error('Error fetching PV framework stats:', error);
    throw new Error('Failed to fetch framework stats');
  }
}
