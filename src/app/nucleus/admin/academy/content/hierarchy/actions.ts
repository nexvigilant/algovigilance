'use server';

/**
 * Hierarchy View Actions
 *
 * Aggregates content hierarchy data for the admin content operations view.
 * Hierarchy: CPA → EPA → Domain → KSBs (Knowledge, Skills, Behaviors)
 */

import { adminDb } from '@/lib/firebase-admin';
import { getEPAs, getCPAs, type EPA, type CPA } from '@/lib/actions/framework-compat';

// ============================================================================
// Types
// ============================================================================

export interface HierarchyDomain {
  id: string;
  name: string;
  cluster: string;
  ksbCount: number;
  publishedCount: number;
  draftCount: number;
}

export interface HierarchyEPA extends EPA {
  ksbCount: number;
  domains: HierarchyDomain[];
}

export interface HierarchyCPA extends CPA {
  ksbCount: number;
  epas: HierarchyEPA[];
}

export interface HierarchyStats {
  totalCPAs: number;
  totalEPAs: number;
  totalDomains: number;
  totalKSBs: number;
  publishedKSBs: number;
  draftKSBs: number;
  pendingKSBs: number;
}

export interface ContentHierarchy {
  cpas: HierarchyCPA[];
  orphanEPAs: HierarchyEPA[]; // EPAs not linked to any CPA
  orphanDomains: HierarchyDomain[]; // Domains not linked to any EPA
  stats: HierarchyStats;
}

// ============================================================================
// Domain Data (from Firestore pv_domains)
// ============================================================================

interface DomainDoc {
  id: string;
  name: string;
  cluster?: string;
  description?: string;
}

async function getDomains(): Promise<DomainDoc[]> {
  const snapshot = await adminDb.collection('pv_domains').get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name || doc.id,
    cluster: doc.data().cluster || 'Core',
    description: doc.data().description,
  }));
}

// ============================================================================
// KSB Counts by Domain
// ============================================================================

interface KSBCounts {
  total: number;
  published: number;
  draft: number;
  pending: number;
}

async function getKSBCountsByDomain(): Promise<Record<string, KSBCounts>> {
  // Get all domains first, then parallelize KSB counts
  // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- First await is followed by Promise.all map pattern
  const domainsSnapshot = await adminDb.collection('pv_domains').get();

  // Fetch all KSB counts in parallel
  const countPromises = domainsSnapshot.docs.map(async (domainDoc) => {
    const domainId = domainDoc.id;
    const ksbSnapshot = await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .get();

    let published = 0;
    let draft = 0;
    let pending = 0;

    ksbSnapshot.docs.forEach((doc) => {
      const status = doc.data().status;
      if (status === 'published') published++;
      else if (status === 'draft') draft++;
      else if (status === 'pending_review') pending++;
      else draft++; // Default to draft if no status
    });

    return {
      domainId,
      counts: {
        total: ksbSnapshot.size,
        published,
        draft,
        pending,
      },
    };
  });

  const results = await Promise.all(countPromises);

  // Convert to record
  const counts: Record<string, KSBCounts> = {};
  results.forEach(({ domainId, counts: domainCounts }) => {
    counts[domainId] = domainCounts;
  });

  return counts;
}

// ============================================================================
// Main Hierarchy Builder
// ============================================================================

export async function getContentHierarchy(): Promise<ContentHierarchy> {
  // Fetch all data in parallel
  const [epas, cpas, domains, ksbCounts] = await Promise.all([
    getEPAs(),
    getCPAs(),
    getDomains(),
    getKSBCountsByDomain(),
  ]);

  // Build domain lookup with KSB counts
  const domainMap = new Map<string, HierarchyDomain>();
  domains.forEach((domain) => {
    const counts = ksbCounts[domain.id] || { total: 0, published: 0, draft: 0, pending: 0 };
    domainMap.set(domain.id, {
      id: domain.id,
      name: domain.name,
      cluster: domain.cluster || 'Core',
      ksbCount: counts.total,
      publishedCount: counts.published,
      draftCount: counts.draft,
    });
  });

  // Also create lookup by domain name (EPAs use domain names in primaryDomains)
  const domainNameMap = new Map<string, HierarchyDomain>();
  domainMap.forEach((domain) => {
    domainNameMap.set(domain.name, domain);
    // Also map by partial name match (e.g., "Domain 1 - Foundations" should match)
    const shortName = domain.name.split(' - ')[0];
    if (shortName) domainNameMap.set(shortName, domain);
  });

  // Build EPA hierarchy with domains
  const epaMap = new Map<string, HierarchyEPA>();
  const linkedDomains = new Set<string>();

  epas.forEach((epa) => {
    const epaDomains: HierarchyDomain[] = [];

    epa.primaryDomains.forEach((domainName) => {
      // Try to find domain by name or partial match
      let domain = domainNameMap.get(domainName);
      if (!domain) {
        // Try partial match
        const shortName = domainName.split(' - ')[0];
        domain = domainNameMap.get(shortName);
      }
      if (domain) {
        epaDomains.push(domain);
        linkedDomains.add(domain.id);
      }
    });

    const totalKsbs = epaDomains.reduce((sum, d) => sum + d.ksbCount, 0);

    epaMap.set(epa.id, {
      ...epa,
      ksbCount: totalKsbs,
      domains: epaDomains,
    });
  });

  // Build CPA hierarchy with EPAs
  const linkedEPAs = new Set<string>();
  const hierarchyCPAs: HierarchyCPA[] = cpas.map((cpa) => {
    const cpaEPAs: HierarchyEPA[] = [];

    cpa.keyEPAs.forEach((epaRef) => {
      // keyEPAs uses "EPA 1" format, need to normalize to "EPA1"
      const epaId = epaRef.replace(/\s+/g, '');
      const epa = epaMap.get(epaId);
      if (epa) {
        cpaEPAs.push(epa);
        linkedEPAs.add(epaId);
      }
    });

    const totalKsbs = cpaEPAs.reduce((sum, e) => sum + e.ksbCount, 0);

    return {
      ...cpa,
      ksbCount: totalKsbs,
      epas: cpaEPAs,
    };
  });

  // Find orphan EPAs (not linked to any CPA)
  const orphanEPAs: HierarchyEPA[] = [];
  epaMap.forEach((epa, id) => {
    if (!linkedEPAs.has(id)) {
      orphanEPAs.push(epa);
    }
  });

  // Find orphan domains (not linked to any EPA)
  const orphanDomains: HierarchyDomain[] = [];
  domainMap.forEach((domain) => {
    if (!linkedDomains.has(domain.id)) {
      orphanDomains.push(domain);
    }
  });

  // Calculate stats
  let totalKSBs = 0;
  let publishedKSBs = 0;
  let draftKSBs = 0;
  let pendingKSBs = 0;

  Object.values(ksbCounts).forEach((counts) => {
    totalKSBs += counts.total;
    publishedKSBs += counts.published;
    draftKSBs += counts.draft;
    pendingKSBs += counts.pending;
  });

  const stats: HierarchyStats = {
    totalCPAs: cpas.length,
    totalEPAs: epas.length,
    totalDomains: domains.length,
    totalKSBs,
    publishedKSBs,
    draftKSBs,
    pendingKSBs,
  };

  return {
    cpas: hierarchyCPAs,
    orphanEPAs,
    orphanDomains,
    stats,
  };
}

// ============================================================================
// Drill-down Actions
// ============================================================================

export interface DomainKSBDetail {
  id: string;
  name: string;
  type: 'knowledge' | 'skill' | 'behavior';
  status: string;
  proficiencyLevel?: string;
  description?: string;
}

export async function getDomainKSBs(domainId: string): Promise<DomainKSBDetail[]> {
  const snapshot = await adminDb
    .collection('pv_domains')
    .doc(domainId)
    .collection('capability_components')
    .orderBy('name')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || doc.id,
      type: data.type || 'knowledge',
      status: data.status || 'draft',
      proficiencyLevel: data.proficiency_level_target,
      description: data.description,
    };
  });
}

export async function getEPADetail(epaId: string): Promise<HierarchyEPA | null> {
  // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Guard clause with early return prevents parallel execution
  const epas = await getEPAs();
  const epa = epas.find((e) => e.id === epaId);
  if (!epa) return null;

  // Fetch domains and KSB counts in parallel
  const [domains, ksbCounts] = await Promise.all([getDomains(), getKSBCountsByDomain()]);

  const domainNameMap = new Map<string, HierarchyDomain>();
  domains.forEach((domain) => {
    const counts = ksbCounts[domain.id] || { total: 0, published: 0, draft: 0, pending: 0 };
    const hierarchyDomain: HierarchyDomain = {
      id: domain.id,
      name: domain.name,
      cluster: domain.cluster || 'Core',
      ksbCount: counts.total,
      publishedCount: counts.published,
      draftCount: counts.draft,
    };
    domainNameMap.set(domain.name, hierarchyDomain);
    const shortName = domain.name.split(' - ')[0];
    if (shortName) domainNameMap.set(shortName, hierarchyDomain);
  });

  const epaDomains: HierarchyDomain[] = [];
  epa.primaryDomains.forEach((domainName) => {
    let domain = domainNameMap.get(domainName);
    if (!domain) {
      const shortName = domainName.split(' - ')[0];
      domain = domainNameMap.get(shortName);
    }
    if (domain) epaDomains.push(domain);
  });

  return {
    ...epa,
    ksbCount: epaDomains.reduce((sum, d) => sum + d.ksbCount, 0),
    domains: epaDomains,
  };
}
