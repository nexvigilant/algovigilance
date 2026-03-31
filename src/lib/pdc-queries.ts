/**
 * PDC v4.1 Query Utilities
 *
 * Functions to query and derive relationships within the PDC framework.
 * Key principle: KSBs belong to Domains, EPAs require Domains.
 * EPA-KSB relationships are derived through domain membership.
 *
 * Hierarchy:
 *   KSB ──→ Domain ──→ EPA (via epa.dag.requiredDomains)
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy as _orderBy,
  limit as _firestoreLimit,
} from 'firebase/firestore';
import type {
  PDCDomainV41,
  PDCEPAV41,
  PDCCPAV41,
  PDCKSBV41,
  PDCDAGMetadataV41,
} from '@/types/pdc-v41';

// =============================================================================
// COLLECTION REFERENCES
// =============================================================================

const PDC_FRAMEWORK = 'pdc_framework';
const KSB_LIBRARY = 'ksb_library';

// =============================================================================
// DOMAIN QUERIES
// =============================================================================

/**
 * Get all domains
 */
export async function getAllDomains(): Promise<PDCDomainV41[]> {
  const snapshot = await getDocs(
    collection(db, PDC_FRAMEWORK, 'domains', 'items')
  );
  return snapshot.docs.map((doc) => doc.data() as PDCDomainV41);
}

/**
 * Get a single domain by ID
 */
export async function getDomain(domainId: string): Promise<PDCDomainV41 | null> {
  const docRef = doc(db, PDC_FRAMEWORK, 'domains', 'items', domainId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as PDCDomainV41) : null;
}

/**
 * Get domains by cluster
 */
export async function getDomainsByCluster(
  clusterId: 'foundational' | 'operational' | 'strategic' | 'integration'
): Promise<PDCDomainV41[]> {
  const allDomains = await getAllDomains();
  return allDomains.filter((d) => d.cluster.id === clusterId);
}

/**
 * Get domains by DAG layer
 */
export async function getDomainsByLayer(layer: number): Promise<PDCDomainV41[]> {
  const allDomains = await getAllDomains();
  return allDomains.filter((d) => d.dag.layer === layer);
}

// =============================================================================
// EPA QUERIES
// =============================================================================

/**
 * Get all EPAs
 */
export async function getAllEPAs(): Promise<PDCEPAV41[]> {
  const snapshot = await getDocs(
    collection(db, PDC_FRAMEWORK, 'epas', 'items')
  );
  return snapshot.docs.map((doc) => doc.data() as PDCEPAV41);
}

/**
 * Get a single EPA by ID
 */
export async function getEPA(epaId: string): Promise<PDCEPAV41 | null> {
  const docRef = doc(db, PDC_FRAMEWORK, 'epas', 'items', epaId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as PDCEPAV41) : null;
}

/**
 * Get EPAs by tier
 */
export async function getEPAsByTier(
  tier: 'Core' | 'Executive' | 'Advanced'
): Promise<PDCEPAV41[]> {
  const allEPAs = await getAllEPAs();
  return allEPAs.filter((e) => e.tier === tier);
}

/**
 * Get EPAs that require a specific domain
 */
export async function getEPAsForDomain(domainId: string): Promise<PDCEPAV41[]> {
  const allEPAs = await getAllEPAs();
  return allEPAs.filter((epa) =>
    epa.dag.requiredDomains.some((req) => req.domainId === domainId)
  );
}

/**
 * Get the domains required for an EPA
 */
export async function getDomainsForEPA(epaId: string): Promise<{
  primary: PDCDomainV41[];
  supporting: PDCDomainV41[];
}> {
  const epa = await getEPA(epaId);
  if (!epa) return { primary: [], supporting: [] };

  const allDomains = await getAllDomains();
  const domainMap = new Map(allDomains.map((d) => [d.id, d]));

  const primary = epa.competencyRequirements.primary
    .map((req) => domainMap.get(req.domainId))
    .filter((d): d is PDCDomainV41 => d !== undefined);

  const supporting = epa.competencyRequirements.supporting
    .map((req) => domainMap.get(req.domainId))
    .filter((d): d is PDCDomainV41 => d !== undefined);

  return { primary, supporting };
}

// =============================================================================
// CPA QUERIES
// =============================================================================

/**
 * Get all CPAs
 */
export async function getAllCPAs(): Promise<PDCCPAV41[]> {
  const snapshot = await getDocs(
    collection(db, PDC_FRAMEWORK, 'cpas', 'items')
  );
  return snapshot.docs.map((doc) => doc.data() as PDCCPAV41);
}

/**
 * Get a single CPA by ID
 */
export async function getCPA(cpaId: string): Promise<PDCCPAV41 | null> {
  const docRef = doc(db, PDC_FRAMEWORK, 'cpas', 'items', cpaId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as PDCCPAV41) : null;
}

/**
 * Get CPAs by category
 */
export async function getCPAsByCategory(
  category: 'Core' | 'Advanced' | 'Capstone'
): Promise<PDCCPAV41[]> {
  const allCPAs = await getAllCPAs();
  return allCPAs.filter((c) => c.category === category);
}

// =============================================================================
// KSB QUERIES
// =============================================================================

/**
 * Get all KSBs
 */
export async function getAllKSBs(): Promise<PDCKSBV41[]> {
  const snapshot = await getDocs(collection(db, KSB_LIBRARY));
  return snapshot.docs.map((doc) => doc.data() as PDCKSBV41);
}

/**
 * Get a single KSB by ID
 */
export async function getKSB(ksbId: string): Promise<PDCKSBV41 | null> {
  const docRef = doc(db, KSB_LIBRARY, ksbId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as PDCKSBV41) : null;
}

/**
 * Get KSBs by domain
 */
export async function getKSBsByDomain(domainId: string): Promise<PDCKSBV41[]> {
  const q = query(
    collection(db, KSB_LIBRARY),
    where('domain.id', '==', domainId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as PDCKSBV41);
}

/**
 * Get KSBs by type
 */
export async function getKSBsByType(
  typeName: 'Knowledge' | 'Skill' | 'Behavior' | 'AI_Integration'
): Promise<PDCKSBV41[]> {
  const q = query(collection(db, KSB_LIBRARY), where('type', '==', typeName));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as PDCKSBV41);
}

/**
 * Get KSBs by proficiency level
 */
export async function getKSBsByProficiencyLevel(
  level: 1 | 2 | 3 | 4 | 5
): Promise<PDCKSBV41[]> {
  const q = query(
    collection(db, KSB_LIBRARY),
    where('framework.proficiencyLevel', '==', level)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as PDCKSBV41);
}

// =============================================================================
// DERIVED RELATIONSHIPS (EPA-KSB via Domain)
// =============================================================================

/**
 * Get KSBs that contribute to an EPA through domain membership.
 *
 * This is the primary method for deriving EPA-KSB relationships.
 * It looks up the EPA's required domains, then fetches all KSBs in those domains.
 *
 * @param epaId - The EPA ID (e.g., 'EPA-01')
 * @param options - Optional filters
 * @returns KSBs grouped by relevance (primary/supporting)
 */
export async function getKSBsForEPA(
  epaId: string,
  options?: {
    type?: 'Knowledge' | 'Skill' | 'Behavior' | 'AI_Integration';
    minProficiencyLevel?: number;
    maxProficiencyLevel?: number;
  }
): Promise<{
  primary: PDCKSBV41[];
  supporting: PDCKSBV41[];
  all: PDCKSBV41[];
}> {
  const epa = await getEPA(epaId);
  if (!epa) return { primary: [], supporting: [], all: [] };

  // Get domain IDs from EPA requirements
  const primaryDomainIds = epa.competencyRequirements.primary.map(
    (req) => req.domainId
  );
  const supportingDomainIds = epa.competencyRequirements.supporting.map(
    (req) => req.domainId
  );
  const allDomainIds = [...new Set([...primaryDomainIds, ...supportingDomainIds])];

  // Fetch KSBs for each domain
  const ksbPromises = allDomainIds.map((domainId) => getKSBsByDomain(domainId));
  const ksbArrays = await Promise.all(ksbPromises);
  let allKSBs = ksbArrays.flat();

  // Apply optional filters
  if (options?.type) {
    allKSBs = allKSBs.filter((ksb) => ksb.type === options.type);
  }
  if (options?.minProficiencyLevel) {
    allKSBs = allKSBs.filter(
      (ksb) => ksb.framework.proficiencyLevel >= (options.minProficiencyLevel ?? 0)
    );
  }
  if (options?.maxProficiencyLevel) {
    allKSBs = allKSBs.filter(
      (ksb) => ksb.framework.proficiencyLevel <= (options.maxProficiencyLevel ?? Infinity)
    );
  }

  // Group by primary/supporting based on domain membership
  const primary = allKSBs.filter((ksb) =>
    primaryDomainIds.includes(ksb.domain.id)
  );
  const supporting = allKSBs.filter((ksb) =>
    supportingDomainIds.includes(ksb.domain.id)
  );

  return { primary, supporting, all: allKSBs };
}

/**
 * Get EPAs that a KSB contributes to (derived through domain membership).
 *
 * @param ksbId - The KSB ID (e.g., 'K-D01-001')
 * @returns EPAs where this KSB's domain is a requirement
 */
export async function getEPAsForKSB(ksbId: string): Promise<{
  primary: PDCEPAV41[];
  supporting: PDCEPAV41[];
}> {
  const ksb = await getKSB(ksbId);
  if (!ksb) return { primary: [], supporting: [] };

  const domainId = ksb.domain.id;
  const allEPAs = await getAllEPAs();

  const primary = allEPAs.filter((epa) =>
    epa.competencyRequirements.primary.some((req) => req.domainId === domainId)
  );

  const supporting = allEPAs.filter((epa) =>
    epa.competencyRequirements.supporting.some((req) => req.domainId === domainId)
  );

  return { primary, supporting };
}

/**
 * Get KSBs for a CPA based on its primary domains
 */
export async function getKSBsForCPA(cpaId: string): Promise<PDCKSBV41[]> {
  const cpa = await getCPA(cpaId);
  if (!cpa) return [];

  const domainIds = cpa.dag.primaryDomains;
  const ksbPromises = domainIds.map((domainId) => getKSBsByDomain(domainId));
  const ksbArrays = await Promise.all(ksbPromises);
  return ksbArrays.flat();
}

// =============================================================================
// DAG METADATA
// =============================================================================

/**
 * Get DAG metadata
 */
export async function getDAGMetadata(): Promise<PDCDAGMetadataV41 | null> {
  const docRef = doc(db, PDC_FRAMEWORK, 'dag_metadata');
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as PDCDAGMetadataV41) : null;
}

/**
 * Get critical path domains
 */
export async function getCriticalPathDomains(): Promise<PDCDomainV41[]> {
  const metadata = await getDAGMetadata();
  if (!metadata) return [];

  const allDomains = await getAllDomains();
  const domainMap = new Map(allDomains.map((d) => [d.id, d]));

  return metadata.criticalPath.nodes
    .map((id) => domainMap.get(id))
    .filter((d): d is PDCDomainV41 => d !== undefined);
}

// =============================================================================
// AGGREGATION QUERIES
// =============================================================================

/**
 * Get KSB counts by domain
 */
export async function getKSBCountsByDomain(): Promise<
  Record<string, { total: number; byType: Record<string, number> }>
> {
  const allKSBs = await getAllKSBs();
  const counts: Record<string, { total: number; byType: Record<string, number> }> = {};

  for (const ksb of allKSBs) {
    const domainId = ksb.domain.id;
    if (!counts[domainId]) {
      counts[domainId] = { total: 0, byType: {} };
    }
    counts[domainId].total++;
    counts[domainId].byType[ksb.type] = (counts[domainId].byType[ksb.type] || 0) + 1;
  }

  return counts;
}

/**
 * Get EPA coverage analysis - which domains and KSBs contribute to each EPA
 */
export async function getEPACoverageAnalysis(epaId: string): Promise<{
  epa: PDCEPAV41 | null;
  domains: {
    primary: PDCDomainV41[];
    supporting: PDCDomainV41[];
  };
  ksbCounts: {
    primary: number;
    supporting: number;
    total: number;
    byType: Record<string, number>;
  };
}> {
  const epa = await getEPA(epaId);
  if (!epa) {
    return {
      epa: null,
      domains: { primary: [], supporting: [] },
      ksbCounts: { primary: 0, supporting: 0, total: 0, byType: {} },
    };
  }

  const domains = await getDomainsForEPA(epaId);
  const ksbs = await getKSBsForEPA(epaId);

  const byType: Record<string, number> = {};
  for (const ksb of ksbs.all) {
    byType[ksb.type] = (byType[ksb.type] || 0) + 1;
  }

  return {
    epa,
    domains,
    ksbCounts: {
      primary: ksbs.primary.length,
      supporting: ksbs.supporting.length,
      total: ksbs.all.length,
      byType,
    },
  };
}
