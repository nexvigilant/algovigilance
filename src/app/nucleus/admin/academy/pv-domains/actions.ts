'use server';

import { adminDb as db } from '@/lib/firebase-admin';
import type {
  PVDomain,
  CapabilityComponent,
  ActivityAnchor,
  AssessmentMethod,
  DomainIntegration,
  ImplementationPhase,
  SuccessMetric,
} from '@/types/pv-curriculum';
import type { KSBType, ProficiencyLevel } from '@/types/pv-framework';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('pv-domains/actions');

/**
 * Fetch all PV domains
 */
export async function getPVDomains(): Promise<PVDomain[]> {
  try {
    const snapshot = await db
      .collection('pv_domains')
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastUpdated: toDateFromSerialized(data.lastUpdated)?.toISOString() || data.lastUpdated || null,
        createdAt: toDateFromSerialized(data.createdAt)?.toISOString() || data.createdAt || null,
        updatedAt: toDateFromSerialized(data.updatedAt)?.toISOString() || data.updatedAt || null,
      } as unknown as PVDomain;
    });
  } catch (error) {
    log.error('Error fetching PV domains:', error);
    throw new Error('Failed to fetch PV domains');
  }
}

/**
 * Fetch a single PV domain by ID
 */
export async function getPVDomain(domainId: string): Promise<PVDomain | null> {
  try {
    const docRef = db.collection('pv_domains').doc(domainId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      lastUpdated: toDateFromSerialized(data?.lastUpdated)?.toISOString() || data?.lastUpdated || null,
      createdAt: toDateFromSerialized(data?.createdAt)?.toISOString() || data?.createdAt || null,
      updatedAt: toDateFromSerialized(data?.updatedAt)?.toISOString() || data?.updatedAt || null,
    } as unknown as PVDomain;
  } catch (error) {
    log.error(`Error fetching PV domain ${domainId}:`, error);
    throw new Error('Failed to fetch PV domain');
  }
}

/**
 * Fetch capability components (KSBs) for a domain
 * Optionally filter by type
 */
export async function getCapabilityComponents(
  domainId: string,
  type?: KSBType | 'ai_integration'
): Promise<CapabilityComponent[]> {
  try {
    const snapshot = await db
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .orderBy('majorSection', 'asc')
      .get();

    let components = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: toDateFromSerialized(data.createdAt) || data.createdAt,
        updatedAt: toDateFromSerialized(data.updatedAt) || data.updatedAt,
      } as CapabilityComponent;
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
 * Fetch activity anchors for a domain
 * Optionally filter by proficiency level
 */
export async function getActivityAnchors(
  domainId: string,
  level?: ProficiencyLevel
): Promise<ActivityAnchor[]> {
  try {
    // Simple query without composite index - sort client-side
    const snapshot = await db
      .collection('pv_domains')
      .doc(domainId)
      .collection('activity_anchors')
      .get();

    let anchors = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: toDateFromSerialized(data.createdAt) || data.createdAt,
        updatedAt: toDateFromSerialized(data.updatedAt) || data.updatedAt,
      } as ActivityAnchor;
    });

    // Client-side sorting by level then anchor number
    const levelOrder = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+', 'L5++'];
    anchors.sort((a, b) => {
      const levelDiff = levelOrder.indexOf(a.proficiencyLevel) - levelOrder.indexOf(b.proficiencyLevel);
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
    return []; // Return empty array instead of throwing
  }
}

/**
 * Fetch assessment methods for a domain
 */
export async function getAssessmentMethods(
  domainId: string
): Promise<AssessmentMethod[]> {
  try {
    const snapshot = await db
      .collection('pv_domains')
      .doc(domainId)
      .collection('assessment_methods')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: toDateFromSerialized(data.createdAt) || data.createdAt,
        updatedAt: toDateFromSerialized(data.updatedAt) || data.updatedAt,
      } as AssessmentMethod;
    });
  } catch (error) {
    log.error(`Error fetching assessment methods for ${domainId}:`, error);
    throw new Error('Failed to fetch assessment methods');
  }
}

/**
 * Extended integration with direction context
 */
export interface DomainIntegrationWithContext extends DomainIntegration {
  flowDirection: 'outbound' | 'inbound';  // outbound = this domain provides, inbound = this domain receives
}

/**
 * Fetch cross-domain integrations for a domain (bidirectional)
 * Gets integrations where domain is source (outbound) OR target (inbound)
 */
export async function getDomainIntegrations(
  domainId: string
): Promise<DomainIntegrationWithContext[]> {
  try {
    // Get integrations where this domain is the SOURCE (outbound - provides to others)
    const outboundSnapshot = await db
      .collection('pv_domain_integration')
      .where('sourceDomainId', '==', domainId)
      .get();

    const outbound = outboundSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        flowDirection: 'outbound' as const,
        createdAt: toDateFromSerialized(data.createdAt) || data.createdAt,
        updatedAt: toDateFromSerialized(data.updatedAt) || data.updatedAt,
      } as DomainIntegrationWithContext;
    });

    // Get integrations where this domain is the TARGET (inbound - receives from others)
    const inboundSnapshot = await db
      .collection('pv_domain_integration')
      .where('relatedDomain', '==', domainId)
      .get();

    const inbound = inboundSnapshot.docs.map(doc => {
      const data = doc.data();
      // Swap source and related for display consistency (show the OTHER domain)
      return {
        ...data,
        relatedDomain: data.sourceDomainId,  // The other domain becomes relatedDomain
        sourceDomainId: domainId,            // Current domain is now "source" for display
        flowDirection: 'inbound' as const,
        createdAt: toDateFromSerialized(data.createdAt) || data.createdAt,
        updatedAt: toDateFromSerialized(data.updatedAt) || data.updatedAt,
      } as DomainIntegrationWithContext;
    });

    return [...outbound, ...inbound];
  } catch (error) {
    log.error(`Error fetching domain integrations for ${domainId}:`, error);
    throw new Error('Failed to fetch domain integrations');
  }
}

/**
 * Fetch implementation phases for a domain
 */
export async function getImplementationPhases(
  domainId: string
): Promise<ImplementationPhase[]> {
  try {
    // Query without orderBy to avoid composite index requirement
    const snapshot = await db
      .collection('pv_implementation_guidance')
      .where('domainId', '==', domainId)
      .get();

    const phases = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: toDateFromSerialized(data.createdAt) || data.createdAt,
        updatedAt: toDateFromSerialized(data.updatedAt) || data.updatedAt,
      } as ImplementationPhase;
    });

    // Client-side sorting by phase number
    return phases.sort((a, b) => a.phase - b.phase);
  } catch (error) {
    log.error(`Error fetching implementation phases for ${domainId}:`, error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Fetch success metrics for a domain
 * Optionally filter by category
 */
export async function getSuccessMetrics(
  domainId: string,
  category?: 'Individual' | 'Organizational' | 'Global'
): Promise<SuccessMetric[]> {
  try {
    const snapshot = await db
      .collection('pv_success_metrics')
      .where('domainId', '==', domainId)
      .get();

    let metrics = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: toDateFromSerialized(data.createdAt) || data.createdAt,
        updatedAt: toDateFromSerialized(data.updatedAt) || data.updatedAt,
      } as SuccessMetric;
    });

    // Client-side filtering for category
    if (category) {
      metrics = metrics.filter(m => m.metricCategory === category);
    }

    return metrics;
  } catch (error) {
    log.error(`Error fetching success metrics for ${domainId}:`, error);
    throw new Error('Failed to fetch success metrics');
  }
}

/**
 * Search capability components across all domains
 */
export async function searchCapabilityComponents(
  query: string,
  type?: KSBType | 'ai_integration',
  limit: number = 50
): Promise<CapabilityComponent[]> {
  try {
    // Get all domains first
    const domainsSnapshot = await db.collection('pv_domains').get();
    const results: CapabilityComponent[] = [];
    const queryLower = query.toLowerCase();

    // Search in each domain's components
    for (const domainDoc of domainsSnapshot.docs) {
      const componentsSnapshot = await db
        .collection('pv_domains')
        .doc(domainDoc.id)
        .collection('capability_components')
        .get();

      for (const doc of componentsSnapshot.docs) {
        const data = doc.data() as CapabilityComponent;

        // Filter by type if specified
        if (type && data.type !== type) continue;

        // Search in name, description, keywords
        const matchesName = data.itemName?.toLowerCase().includes(queryLower);
        const matchesDesc = data.itemDescription?.toLowerCase().includes(queryLower);
        const matchesKeywords = data.keywords?.some(k =>
          k.toLowerCase().includes(queryLower)
        );

        if (matchesName || matchesDesc || matchesKeywords) {
          results.push({
            ...data,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
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
