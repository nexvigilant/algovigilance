'use server';

/**
 * PDC Admin Actions
 *
 * Server actions for managing the Pharmacovigilance Development Continuum (PDC) framework.
 * Hierarchy: CPA > EPA > Domain > KSB
 *
 * CPAs (Career Practice Activities) are managed in Firestore with hybrid import/edit support.
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

import { logger } from '@/lib/logger';
const log = logger.scope('actions');
import type {
  CPA,
  CPACatalogCard,
  CPAStatus,
  CPACareerStage,
  CPAStats,
  PDCHierarchy,
  PDCHierarchyCPA,
  PDCHierarchyEPA,
  PDCHierarchyDomain,
} from '@/types/pdc-framework';

// =============================================================================
// PDC v4.1 COLLECTION PATHS
// =============================================================================

const PATHS = {
  cpas: 'pdc_framework/cpas/items',
  epas: 'pdc_framework/epas/items',
  domains: 'pdc_framework/domains/items',
} as const;

// Helper to get subcollection reference from path
function getItemsCollection(path: string) {
  const [collection, doc, subcollection] = path.split('/');
  return adminDb.collection(collection).doc(doc).collection(subcollection);
}

// ============================================================================
// TYPES
// ============================================================================

export interface PDCStats {
  totalCPAs: number;
  publishedCPAs: number;
  draftCPAs: number;
  totalEPAs: number;
  totalDomains: number;
  totalKSBs: number;
  contentCoverage: number;
}

export interface CPAFormData {
  name: string;
  focusArea: string;
  summary: string;
  careerStage: CPACareerStage;
  aiIntegration: string;
  primaryDomains: string[];
  supportingDomains?: string[];
  keyEPAs: string[];
  supportingEPAs?: string[];
  status: CPAStatus;
  order: number;
  educationalPhilosophy?: string;
  implementationPhase?: string;
  successMetrics?: string[];
  developmentPathway?: string[];
}

// ============================================================================
// CPA CRUD OPERATIONS
// ============================================================================

/**
 * Get all CPAs from Firestore
 */
export async function getAllCPAs(): Promise<CPA[]> {
  const snapshot = await getItemsCollection(PATHS.cpas)
    .orderBy('order', 'asc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      focusArea: data.focusArea || '',
      summary: data.summary || '',
      careerStage: data.careerStage || 'Foundation',
      aiIntegration: data.aiIntegration || '',
      primaryDomains: data.primaryDomains || [],
      supportingDomains: data.supportingDomains,
      keyEPAs: data.keyEPAs || [],
      supportingEPAs: data.supportingEPAs,
      proficiencyLevels: data.proficiencyLevels,
      behavioralAnchors: data.behavioralAnchors,
      successMetrics: data.successMetrics,
      developmentPathway: data.developmentPathway,
      educationalPhilosophy: data.educationalPhilosophy,
      implementationPhase: data.implementationPhase,
      status: data.status || 'draft',
      order: data.order || 99,
      stats: data.stats || { epaCount: 0, domainCount: 0, ksbCount: 0, contentCoverage: 0 },
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      publishedAt: data.publishedAt,
      sourceRef: data.sourceRef,
    } as CPA;
  });
}

/**
 * Get published CPAs for practitioner views
 */
export async function getPublishedCPAs(): Promise<CPACatalogCard[]> {
  const snapshot = await getItemsCollection(PATHS.cpas)
    .where('status', '==', 'published')
    .orderBy('order', 'asc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      focusArea: data.focusArea || '',
      careerStage: data.careerStage || 'Foundation',
      keyEPAs: data.keyEPAs || [],
      stats: data.stats || { epaCount: 0, domainCount: 0, ksbCount: 0, contentCoverage: 0 },
      status: data.status || 'draft',
    } as CPACatalogCard;
  });
}

/**
 * Get a single CPA by ID
 */
export async function getCPAById(cpaId: string): Promise<CPA | null> {
  const doc = await getItemsCollection(PATHS.cpas).doc(cpaId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (!data) return null;
  return {
    id: doc.id,
    name: data.name || '',
    focusArea: data.focusArea || '',
    summary: data.summary || '',
    careerStage: data.careerStage || 'Foundation',
    aiIntegration: data.aiIntegration || '',
    primaryDomains: data.primaryDomains || [],
    supportingDomains: data.supportingDomains,
    keyEPAs: data.keyEPAs || [],
    supportingEPAs: data.supportingEPAs,
    proficiencyLevels: data.proficiencyLevels,
    behavioralAnchors: data.behavioralAnchors,
    successMetrics: data.successMetrics,
    developmentPathway: data.developmentPathway,
    educationalPhilosophy: data.educationalPhilosophy,
    implementationPhase: data.implementationPhase,
    status: data.status || 'draft',
    order: data.order || 99,
    stats: data.stats || { epaCount: 0, domainCount: 0, ksbCount: 0, contentCoverage: 0 },
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    publishedAt: data.publishedAt,
    sourceRef: data.sourceRef,
  } as CPA;
}

/**
 * Create a new CPA
 */
export async function createCPA(formData: CPAFormData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Generate ID if not provided
    const cpaId = `CPA-${String(formData.order).padStart(2, '0')}`;

    // Check if CPA already exists
    const existing = await getItemsCollection(PATHS.cpas).doc(cpaId).get();
    if (existing.exists) {
      return { success: false, error: `CPA with ID ${cpaId} already exists` };
    }

    const now = FieldValue.serverTimestamp();

    const cpaData = {
      ...formData,
      stats: {
        epaCount: formData.keyEPAs.length + (formData.supportingEPAs?.length || 0),
        domainCount: formData.primaryDomains.length + (formData.supportingDomains?.length || 0),
        ksbCount: 0,
        contentCoverage: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    await getItemsCollection(PATHS.cpas).doc(cpaId).set(cpaData);

    revalidatePath('/nucleus/admin/academy/pdc');
    revalidatePath('/nucleus/academy/pdc');

    return { success: true, id: cpaId };
  } catch (error) {
    log.error('Error creating CPA:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update an existing CPA
 */
export async function updateCPA(
  cpaId: string,
  formData: Partial<CPAFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await getItemsCollection(PATHS.cpas).doc(cpaId).get();
    if (!doc.exists) {
      return { success: false, error: `CPA ${cpaId} not found` };
    }

    const updateData: Record<string, unknown> = {
      ...formData,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Recalculate stats if EPAs or domains changed
    if (formData.keyEPAs || formData.supportingEPAs || formData.primaryDomains || formData.supportingDomains) {
      const existingData = doc.data() ?? {};
      const keyEPAs = formData.keyEPAs || existingData.keyEPAs || [];
      const supportingEPAs = formData.supportingEPAs || existingData.supportingEPAs || [];
      const primaryDomains = formData.primaryDomains || existingData.primaryDomains || [];
      const supportingDomains = formData.supportingDomains || existingData.supportingDomains || [];

      updateData.stats = {
        epaCount: keyEPAs.length + supportingEPAs.length,
        domainCount: primaryDomains.length + supportingDomains.length,
        ksbCount: existingData.stats?.ksbCount || 0,
        contentCoverage: existingData.stats?.contentCoverage || 0,
      };
    }

    await getItemsCollection(PATHS.cpas).doc(cpaId).update(updateData);

    revalidatePath('/nucleus/admin/academy/pdc');
    revalidatePath(`/nucleus/admin/academy/pdc/cpas/${cpaId}`);
    revalidatePath('/nucleus/academy/pdc');

    return { success: true };
  } catch (error) {
    log.error('Error updating CPA:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Publish a CPA
 */
export async function publishCPA(cpaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await getItemsCollection(PATHS.cpas).doc(cpaId).get();
    if (!doc.exists) {
      return { success: false, error: `CPA ${cpaId} not found` };
    }

    await getItemsCollection(PATHS.cpas).doc(cpaId).update({
      status: 'published',
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/nucleus/admin/academy/pdc');
    revalidatePath('/nucleus/academy/pdc');

    return { success: true };
  } catch (error) {
    log.error('Error publishing CPA:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Archive a CPA
 */
export async function archiveCPA(cpaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await getItemsCollection(PATHS.cpas).doc(cpaId).get();
    if (!doc.exists) {
      return { success: false, error: `CPA ${cpaId} not found` };
    }

    await getItemsCollection(PATHS.cpas).doc(cpaId).update({
      status: 'archived',
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/nucleus/admin/academy/pdc');
    revalidatePath('/nucleus/academy/pdc');

    return { success: true };
  } catch (error) {
    log.error('Error archiving CPA:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete a CPA (admin only, use with caution)
 */
export async function deleteCPA(cpaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await getItemsCollection(PATHS.cpas).doc(cpaId).get();
    if (!doc.exists) {
      return { success: false, error: `CPA ${cpaId} not found` };
    }

    await getItemsCollection(PATHS.cpas).doc(cpaId).delete();

    revalidatePath('/nucleus/admin/academy/pdc');
    revalidatePath('/nucleus/academy/pdc');

    return { success: true };
  } catch (error) {
    log.error('Error deleting CPA:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// PDC HIERARCHY & STATS
// ============================================================================

/**
 * Get PDC dashboard statistics
 */
export async function getPDCStats(): Promise<PDCStats> {
  // Fetch all data in parallel
  const [cpasSnapshot, epasSnapshot, domainsSnapshot] = await Promise.all([
    getItemsCollection(PATHS.cpas).get(),
    getItemsCollection(PATHS.epas).get(),
    adminDb.collection('pv_domains').get(),
  ]);

  // Count CPAs by status
  let publishedCPAs = 0;
  let draftCPAs = 0;
  cpasSnapshot.docs.forEach((doc) => {
    const status = doc.data().status;
    if (status === 'published') publishedCPAs++;
    else draftCPAs++;
  });

  // Count total KSBs across all domains
  let totalKSBs = 0;
  const ksbPromises = domainsSnapshot.docs.map(async (domainDoc) => {
    const ksbSnapshot = await adminDb
      .collection('pv_domains')
      .doc(domainDoc.id)
      .collection('capability_components')
      .count()
      .get();
    return ksbSnapshot.data().count;
  });

  const ksbCounts = await Promise.all(ksbPromises);
  totalKSBs = ksbCounts.reduce((sum, count) => sum + count, 0);

  // Calculate content coverage (published KSBs / total KSBs)
  let publishedKSBs = 0;
  const publishedKsbPromises = domainsSnapshot.docs.map(async (domainDoc) => {
    const ksbSnapshot = await adminDb
      .collection('pv_domains')
      .doc(domainDoc.id)
      .collection('capability_components')
      .where('status', '==', 'published')
      .count()
      .get();
    return ksbSnapshot.data().count;
  });

  const publishedKsbCounts = await Promise.all(publishedKsbPromises);
  publishedKSBs = publishedKsbCounts.reduce((sum, count) => sum + count, 0);

  const contentCoverage = totalKSBs > 0 ? Math.round((publishedKSBs / totalKSBs) * 100) : 0;

  return {
    totalCPAs: cpasSnapshot.size,
    publishedCPAs,
    draftCPAs,
    totalEPAs: epasSnapshot.size,
    totalDomains: domainsSnapshot.size,
    totalKSBs,
    contentCoverage,
  };
}

/**
 * Get complete PDC hierarchy for tree display
 */
export async function getPDCHierarchy(): Promise<PDCHierarchy> {
  // Fetch all data in parallel
  const [cpas, epasSnapshot, domainsSnapshot] = await Promise.all([
    getAllCPAs(),
    getItemsCollection(PATHS.epas).orderBy('epaNumber', 'asc').get(),
    adminDb.collection('pv_domains').get(),
  ]);

  // Build domain map with KSB counts
  const domainMap = new Map<string, PDCHierarchyDomain>();
  const domainKsbPromises = domainsSnapshot.docs.map(async (doc) => {
    const data = doc.data();
    const ksbSnapshot = await adminDb
      .collection('pv_domains')
      .doc(doc.id)
      .collection('capability_components')
      .get();

    let publishedCount = 0;
    let draftCount = 0;
    let knowledgeCount = 0;
    let skillCount = 0;
    let behaviorCount = 0;

    ksbSnapshot.docs.forEach((ksbDoc) => {
      const ksbData = ksbDoc.data();
      if (ksbData.status === 'published') publishedCount++;
      else draftCount++;

      const type = ksbData.type?.toLowerCase();
      if (type === 'knowledge') knowledgeCount++;
      else if (type === 'skill') skillCount++;
      else if (type === 'behavior') behaviorCount++;
    });

    return {
      id: doc.id,
      name: data.name || doc.id,
      cluster: data.cluster || 'Core',
      clusterName: data.clusterName || data.cluster || 'Core',
      stats: {
        total: ksbSnapshot.size,
        knowledge: knowledgeCount,
        skill: skillCount,
        behavior: behaviorCount,
        published: publishedCount,
        draft: draftCount,
      },
    } as PDCHierarchyDomain;
  });

  const domains = await Promise.all(domainKsbPromises);
  domains.forEach((domain) => {
    domainMap.set(domain.id, domain);
    // Also map by name for lookup
    domainMap.set(domain.name, domain);
  });

  // Build EPA map
  const epaMap = new Map<string, PDCHierarchyEPA>();
  const linkedDomains = new Set<string>();

  epasSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const epaDomains: PDCHierarchyDomain[] = [];

    // Get domains for this EPA
    const primaryDomains = data.primaryDomains || [];
    primaryDomains.forEach((domainRef: string) => {
      // Try to find by ID or name
      let domain = domainMap.get(domainRef);
      if (!domain) {
        // Try extracting domain number from format like "Domain 1 - Foundations"
        const match = domainRef.match(/Domain\s*(\d+)/i);
        if (match) {
          const domainId = `D${match[1].padStart(2, '0')}`;
          domain = domainMap.get(domainId);
        }
      }
      if (domain) {
        epaDomains.push(domain);
        linkedDomains.add(domain.id);
      }
    });

    const epa: PDCHierarchyEPA = {
      id: doc.id,
      name: data.name || data.title || '',
      shortName: data.shortName || data.name?.substring(0, 50) || '',
      tier: data.tier || data.category || 'core',
      epaNumber: data.epaNumber || parseInt(doc.id.replace(/\D/g, '')) || 0,
      status: data.status || 'draft',
      domains: epaDomains,
      stats: {
        domainCount: epaDomains.length,
        ksbCount: epaDomains.reduce((sum, d) => sum + d.stats.total, 0),
        contentCoverage:
          epaDomains.length > 0
            ? Math.round(
                epaDomains.reduce((sum, d) => sum + (d.stats.published / Math.max(d.stats.total, 1)) * 100, 0) /
                  epaDomains.length
              )
            : 0,
      },
    };

    epaMap.set(doc.id, epa);
    // Also map by normalized ID (EPA1 -> EPA-01)
    const normalizedId = `EPA-${String(epa.epaNumber).padStart(2, '0')}`;
    epaMap.set(normalizedId, epa);
  });

  // Build CPA hierarchy
  const linkedEPAs = new Set<string>();
  const hierarchyCPAs: PDCHierarchyCPA[] = cpas.map((cpa) => {
    const cpaEPAs: PDCHierarchyEPA[] = [];

    cpa.keyEPAs.forEach((epaRef) => {
      // Normalize EPA reference (EPA-01 or EPA 1 -> EPA1)
      const normalizedRef = epaRef.replace(/[-\s]+/g, '');
      let epa = epaMap.get(normalizedRef);

      // Try alternative formats
      if (!epa) {
        const match = epaRef.match(/(\d+)/);
        if (match) {
          const epaNumber = parseInt(match[1]);
          const altId = `EPA${epaNumber}`;
          epa = epaMap.get(altId);
          if (!epa) {
            const altId2 = `EPA-${String(epaNumber).padStart(2, '0')}`;
            epa = epaMap.get(altId2);
          }
        }
      }

      if (epa) {
        cpaEPAs.push(epa);
        linkedEPAs.add(epa.id);
      }
    });

    return {
      id: cpa.id,
      name: cpa.name,
      focusArea: cpa.focusArea,
      careerStage: cpa.careerStage,
      order: cpa.order,
      status: cpa.status,
      epas: cpaEPAs,
      stats: {
        epaCount: cpaEPAs.length,
        domainCount: new Set(cpaEPAs.flatMap((e) => e.domains.map((d) => d.id))).size,
        ksbCount: cpaEPAs.reduce((sum, e) => sum + e.stats.ksbCount, 0),
        contentCoverage:
          cpaEPAs.length > 0
            ? Math.round(cpaEPAs.reduce((sum, e) => sum + e.stats.contentCoverage, 0) / cpaEPAs.length)
            : 0,
      },
    };
  });

  // Find orphan EPAs and domains
  const orphanEPAs: PDCHierarchyEPA[] = [];
  epaMap.forEach((epa, id) => {
    // Skip duplicate mappings (normalized IDs)
    if (!linkedEPAs.has(id) && !id.includes('-')) {
      orphanEPAs.push(epa);
    }
  });

  const orphanDomains: PDCHierarchyDomain[] = [];
  domainMap.forEach((domain, id) => {
    // Skip name-based mappings
    if (!linkedDomains.has(id) && id.startsWith('D')) {
      orphanDomains.push(domain);
    }
  });

  // Calculate overall stats
  const totalKSBs = domains.reduce((sum, d) => sum + d.stats.total, 0);
  const publishedKSBs = domains.reduce((sum, d) => sum + d.stats.published, 0);

  return {
    cpas: hierarchyCPAs,
    orphanEPAs,
    orphanDomains,
    stats: {
      totalCPAs: cpas.length,
      totalEPAs: epasSnapshot.size,
      totalDomains: domainsSnapshot.size,
      totalKSBs,
      contentCoverage: totalKSBs > 0 ? Math.round((publishedKSBs / totalKSBs) * 100) : 0,
    },
  };
}

// ============================================================================
// SEED DATA (for initial setup)
// ============================================================================

/**
 * Seed CPAs from master list (for initial setup)
 */
export async function seedCPAsFromMasterList(): Promise<{ success: boolean; created: number; error?: string }> {
  try {
    // Import master list from types
    const { CPA_MASTER_LIST } = await import('@/types/pdc-framework');

    let created = 0;
    const now = FieldValue.serverTimestamp();

    for (const cpaData of CPA_MASTER_LIST) {
      const doc = await getItemsCollection(PATHS.cpas).doc(cpaData.id).get();

      if (!doc.exists) {
        await getItemsCollection(PATHS.cpas).doc(cpaData.id).set({
          name: cpaData.name,
          focusArea: cpaData.focusArea,
          summary: '', // To be filled in from PDC Manual
          careerStage: cpaData.careerStage,
          aiIntegration: '',
          primaryDomains: cpaData.primaryDomains,
          keyEPAs: cpaData.keyEPAs,
          status: 'draft',
          order: parseInt(cpaData.id.replace('CPA-', '')),
          stats: {
            epaCount: cpaData.keyEPAs.length,
            domainCount: cpaData.primaryDomains.length,
            ksbCount: 0,
            contentCoverage: 0,
          },
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    revalidatePath('/nucleus/admin/academy/pdc');

    return { success: true, created };
  } catch (error) {
    log.error('Error seeding CPAs:', error);
    return { success: false, created: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update CPA stats (call after KSB content changes)
 */
export async function refreshCPAStats(cpaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cpa = await getCPAById(cpaId);
    if (!cpa) {
      return { success: false, error: `CPA ${cpaId} not found` };
    }

    // Get EPA data to count domains and KSBs
    const epasSnapshot = await getItemsCollection(PATHS.epas).get();
    const epaMap = new Map<string, { domains: string[]; ksbCount: number }>();

    // Build EPA data
    for (const doc of epasSnapshot.docs) {
      const data = doc.data();
      const domains = data.primaryDomains || [];

      // Count KSBs across domains
      let ksbCount = 0;
      for (const domainRef of domains) {
        const match = domainRef.match(/Domain\s*(\d+)/i);
        if (match) {
          const domainId = `D${match[1].padStart(2, '0')}`;
          const ksbSnapshot = await adminDb
            .collection('pv_domains')
            .doc(domainId)
            .collection('capability_components')
            .count()
            .get();
          ksbCount += ksbSnapshot.data().count;
        }
      }

      epaMap.set(doc.id, { domains, ksbCount });
      // Normalize
      const normalizedId = `EPA${doc.id.replace(/\D/g, '')}`;
      epaMap.set(normalizedId, { domains, ksbCount });
    }

    // Calculate stats for this CPA
    let totalKSBs = 0;
    let publishedKSBs = 0;
    const allDomains = new Set<string>();

    for (const epaRef of cpa.keyEPAs) {
      const normalizedRef = epaRef.replace(/[-\s]+/g, '');
      const epaData = epaMap.get(normalizedRef);

      if (epaData) {
        totalKSBs += epaData.ksbCount;
        epaData.domains.forEach((d) => {
          const match = d.match(/Domain\s*(\d+)/i);
          if (match) allDomains.add(`D${match[1].padStart(2, '0')}`);
        });
      }
    }

    // Count published KSBs
    for (const domainId of allDomains) {
      const ksbSnapshot = await adminDb
        .collection('pv_domains')
        .doc(domainId)
        .collection('capability_components')
        .where('status', '==', 'published')
        .count()
        .get();
      publishedKSBs += ksbSnapshot.data().count;
    }

    const stats: CPAStats = {
      epaCount: cpa.keyEPAs.length + (cpa.supportingEPAs?.length || 0),
      domainCount: allDomains.size,
      ksbCount: totalKSBs,
      contentCoverage: totalKSBs > 0 ? Math.round((publishedKSBs / totalKSBs) * 100) : 0,
    };

    await getItemsCollection(PATHS.cpas).doc(cpaId).update({
      stats,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/nucleus/admin/academy/pdc');

    return { success: true };
  } catch (error) {
    log.error('Error refreshing CPA stats:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// CPA RELATIONSHIP HELPERS
// ============================================================================

interface CPAEPAData {
  id: string;
  name: string;
  tier: string;
  description?: string;
  domains: string[];
  ksbCount: number;
}

/**
 * Get EPA details for a CPA's linked EPAs
 */
export async function getCPAEPAs(cpaId: string): Promise<CPAEPAData[]> {
  const cpa = await getCPAById(cpaId);
  if (!cpa) return [];

  const allEpaIds = [...cpa.keyEPAs, ...(cpa.supportingEPAs || [])];
  if (allEpaIds.length === 0) return [];

  const epasSnapshot = await getItemsCollection(PATHS.epas).get();
  const results: CPAEPAData[] = [];

  for (const doc of epasSnapshot.docs) {
    const data = doc.data();

    // Check if this EPA is linked to the CPA (normalize IDs for comparison)
    const normalizedDocId = doc.id.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isLinked = allEpaIds.some((epaRef) => {
      const normalizedRef = epaRef.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return normalizedRef === normalizedDocId;
    });

    if (isLinked) {
      // Count KSBs across this EPA's domains
      let ksbCount = 0;
      const domains = data.primaryDomains || [];

      for (const domainRef of domains) {
        const match = domainRef.match(/Domain\s*(\d+)/i);
        if (match) {
          const domainId = `D${match[1].padStart(2, '0')}`;
          try {
            const ksbSnapshot = await adminDb
              .collection('pv_domains')
              .doc(domainId)
              .collection('capability_components')
              .count()
              .get();
            ksbCount += ksbSnapshot.data().count;
          } catch {
            // Domain may not exist
          }
        }
      }

      results.push({
        id: doc.id,
        name: data.name || doc.id,
        tier: data.tier || 'Core',
        description: data.description,
        domains: domains,
        ksbCount,
      });
    }
  }

  return results;
}

interface CPADomainData {
  id: string;
  name: string;
  ksbCount: number;
  publishedCount: number;
}

/**
 * Get domain details for a CPA's primary domains
 */
export async function getCPADomains(cpaId: string): Promise<CPADomainData[]> {
  const cpa = await getCPAById(cpaId);
  if (!cpa) return [];

  const results: CPADomainData[] = [];

  for (const domainRef of cpa.primaryDomains) {
    // Extract domain ID from reference (e.g., "Domain 2" -> "D02")
    const match = domainRef.match(/Domain\s*(\d+)/i);
    let domainId: string;

    if (match) {
      domainId = `D${match[1].padStart(2, '0')}`;
    } else if (domainRef.startsWith('D')) {
      domainId = domainRef;
    } else {
      continue; // Invalid format
    }

    try {
      const domainDoc = await adminDb.collection('pv_domains').doc(domainId).get();

      if (domainDoc.exists) {
        const data = domainDoc.data();
        if (!data) continue;

        // Count total and published KSBs
        const [totalSnapshot, publishedSnapshot] = await Promise.all([
          adminDb
            .collection('pv_domains')
            .doc(domainId)
            .collection('capability_components')
            .count()
            .get(),
          adminDb
            .collection('pv_domains')
            .doc(domainId)
            .collection('capability_components')
            .where('status', '==', 'published')
            .count()
            .get(),
        ]);

        results.push({
          id: domainId,
          name: data.name || domainId,
          ksbCount: totalSnapshot.data().count,
          publishedCount: publishedSnapshot.data().count,
        });
      }
    } catch {
      // Domain may not exist
    }
  }

  return results;
}
