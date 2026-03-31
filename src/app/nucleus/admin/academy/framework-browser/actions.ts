'use server';

import { adminDb as db } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

const log = logger.scope('framework-browser/actions');

// =============================================================================
// TYPES (Client-safe versions without Timestamp)
// =============================================================================

/**
 * PDC v4.1 Domain
 * Source: pdc_framework/domains/items/{D01-D15}
 */
export interface PDCDomain {
  id: string; // 'D01' - 'D15'
  name: string;
  shortName: string;
  description: string;

  cluster: {
    id: 'foundational' | 'operational' | 'strategic' | 'integration';
    number: 1 | 2 | 3 | 4;
    name: string;
  };

  dag: {
    layer: 0 | 1 | 2 | 3 | 4 | 5;
    prerequisites: string[];
    unlocks: string[];
    isSourceNode: boolean;
    isSinkNode: boolean;
    isCriticalPath: boolean;
    criticalPathOrder: number | null;
  };

  coreKnowledge: {
    component: string;
    aiIntegration?: string;
  }[];

  assessmentWeights: {
    L1: { knowledge: number; intelligence: number; expertise: number };
    L2: { knowledge: number; intelligence: number; expertise: number };
    L3: { knowledge: number; intelligence: number; expertise: number };
    L4: { knowledge: number; intelligence: number; expertise: number };
    L5: { knowledge: number; intelligence: number; expertise: number };
  };

  programCoverage: {
    appe: { levelRange: string; weeks: string } | null;
    pcap: { rotations: string[]; levelRange: string } | null;
    smp: { focus: string; levelRange: string } | null;
  };

  version: string;
}

/**
 * PDC v4.1 EPA
 * Source: pdc_framework/epas/items/{EPA-01 to EPA-21}
 */
export interface PDCEPA {
  id: string; // 'EPA-01' - 'EPA-21'
  name: string;
  shortName: string;
  definition: string;

  tier: 'Core' | 'Executive' | 'Advanced';
  tierNumber: 1 | 2 | 3;

  dag: {
    primaryLayer: number;
    requiredDomains: {
      domainId: string;
      minimumLevel: 1 | 2 | 3 | 4 | 5;
      isPrimary: boolean;
    }[];
    enabledAtProgramStage: string;
  };

  competencyRequirements: {
    primary: { domainId: string; level: number }[];
    supporting: { domainId: string; level: number }[];
  };

  entrustmentLevels: {
    level: 1 | 2 | 3 | 4 | 5;
    label: string;
    description: string;
    supervisionNeed: string;
    assessmentMethod: string;
  }[];

  aiGateway?: {
    isGateway: true;
    phases: {
      phase: 1 | 2 | 3 | 4 | 5;
      name: string;
      levelRange: string;
      capabilities: string[];
    }[];
    enablesCPA8: boolean;
  };

  guardian?: {
    portRange: string;
    serviceEndpoints: string[];
  };

  version: string;
}

/**
 * PDC v4.1 CPA
 * Source: pdc_framework/cpas/items/{CPA-01 to CPA-09}
 */
export interface PDCCPA {
  id: string; // 'CPA-01' - 'CPA-09'
  name: string;
  focusArea: string;
  definition: string;

  category: 'Core' | 'Advanced' | 'Capstone';
  careerStage: 'Foundation' | 'Foundation-Advanced' | 'Advanced' | 'Executive';

  dag: {
    layers: number[];
    primaryDomains: string[];
    isFullDAGTraversal: boolean;
    alignedPCAPRotations: string[];
  };

  keyEPAs: string[];

  integrationModule: {
    id: string;
    name: string;
    domains: string[];
  };

  aiIntegration: {
    capabilities: string[];
    isAICapstone: boolean;
  };

  achievementCriteria: {
    level: string;
    requirements: string[];
  };

  successMetrics: {
    metric: string;
    target: string;
  }[];

  version: string;
}

// =============================================================================
// COLLECTION PATHS (PDC v4.1)
// =============================================================================

const PATHS = {
  domains: 'pdc_framework/domains/items',
  epas: 'pdc_framework/epas/items',
  cpas: 'pdc_framework/cpas/items',
  dagMetadata: 'pdc_framework/dag_metadata',
} as const;

// Helper to get collection reference
function getItemsCollection(path: string) {
  const [collection, doc, subcollection] = path.split('/');
  return db.collection(collection).doc(doc).collection(subcollection);
}

// =============================================================================
// DOMAIN ACTIONS
// =============================================================================

/**
 * Get all domains, sorted by ID (D01-D15)
 */
export async function getDomainsAction(): Promise<PDCDomain[]> {
  try {
    const snapshot = await getItemsCollection(PATHS.domains)
      .orderBy('id', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        shortName: data.shortName,
        description: data.description,
        cluster: data.cluster,
        dag: data.dag,
        coreKnowledge: data.coreKnowledge || [],
        assessmentWeights: data.assessmentWeights,
        programCoverage: data.programCoverage,
        version: data.version || '4.1',
      } as PDCDomain;
    });
  } catch (error) {
    log.error('Error fetching domains:', error);
    throw new Error('Failed to fetch domains');
  }
}

/**
 * Get a single domain by ID (e.g., "D01" or "1")
 */
export async function getDomainByIdAction(id: string | number): Promise<PDCDomain | null> {
  // Normalize ID to D## format
  const normalizedId = typeof id === 'number'
    ? `D${id.toString().padStart(2, '0')}`
    : id.toUpperCase().startsWith('D')
      ? id.toUpperCase()
      : `D${id.toString().padStart(2, '0')}`;

  try {
    const doc = await getItemsCollection(PATHS.domains).doc(normalizedId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      shortName: data.shortName,
      description: data.description,
      cluster: data.cluster,
      dag: data.dag,
      coreKnowledge: data.coreKnowledge || [],
      assessmentWeights: data.assessmentWeights,
      programCoverage: data.programCoverage,
      version: data.version || '4.1',
    } as PDCDomain;
  } catch (error) {
    log.error('Error fetching domain:', error);
    throw new Error('Failed to fetch domain');
  }
}

/**
 * Get domains by cluster
 */
export async function getDomainsByClusterAction(
  clusterId: 'foundational' | 'operational' | 'strategic' | 'integration'
): Promise<PDCDomain[]> {
  try {
    const snapshot = await getItemsCollection(PATHS.domains)
      .where('cluster.id', '==', clusterId)
      .orderBy('id', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        shortName: data.shortName,
        description: data.description,
        cluster: data.cluster,
        dag: data.dag,
        coreKnowledge: data.coreKnowledge || [],
        assessmentWeights: data.assessmentWeights,
        programCoverage: data.programCoverage,
        version: data.version || '4.1',
      } as PDCDomain;
    });
  } catch (error) {
    log.error('Error fetching domains by cluster:', error);
    throw new Error('Failed to fetch domains by cluster');
  }
}

/**
 * Get domains by DAG layer
 */
export async function getDomainsByLayerAction(layer: number): Promise<PDCDomain[]> {
  try {
    const snapshot = await getItemsCollection(PATHS.domains)
      .where('dag.layer', '==', layer)
      .orderBy('id', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        shortName: data.shortName,
        description: data.description,
        cluster: data.cluster,
        dag: data.dag,
        coreKnowledge: data.coreKnowledge || [],
        assessmentWeights: data.assessmentWeights,
        programCoverage: data.programCoverage,
        version: data.version || '4.1',
      } as PDCDomain;
    });
  } catch (error) {
    log.error('Error fetching domains by layer:', error);
    throw new Error('Failed to fetch domains by layer');
  }
}

// =============================================================================
// EPA ACTIONS
// =============================================================================

/**
 * Get all EPAs, sorted by ID (EPA-01 to EPA-21)
 */
export async function getEPAsAction(): Promise<PDCEPA[]> {
  try {
    const snapshot = await getItemsCollection(PATHS.epas)
      .orderBy('id', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        shortName: data.shortName,
        definition: data.definition,
        tier: data.tier,
        tierNumber: data.tierNumber,
        dag: data.dag,
        competencyRequirements: data.competencyRequirements,
        entrustmentLevels: data.entrustmentLevels || [],
        aiGateway: data.aiGateway,
        guardian: data.guardian,
        version: data.version || '4.1',
      } as PDCEPA;
    });
  } catch (error) {
    log.error('Error fetching EPAs:', error);
    throw new Error('Failed to fetch EPAs');
  }
}

/**
 * Get a single EPA by ID (e.g., "EPA-01" or "epa-01")
 */
export async function getEPAByIdAction(id: string): Promise<PDCEPA | null> {
  // Normalize ID to uppercase
  const normalizedId = id.toUpperCase();

  try {
    const doc = await getItemsCollection(PATHS.epas).doc(normalizedId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      shortName: data.shortName,
      definition: data.definition,
      tier: data.tier,
      tierNumber: data.tierNumber,
      dag: data.dag,
      competencyRequirements: data.competencyRequirements,
      entrustmentLevels: data.entrustmentLevels || [],
      aiGateway: data.aiGateway,
      guardian: data.guardian,
      version: data.version || '4.1',
    } as PDCEPA;
  } catch (error) {
    log.error('Error fetching EPA:', error);
    throw new Error('Failed to fetch EPA');
  }
}

/**
 * Get EPAs by tier (Core, Executive, Advanced)
 */
export async function getEPAsByTierAction(
  tier: 'Core' | 'Executive' | 'Advanced'
): Promise<PDCEPA[]> {
  try {
    const snapshot = await getItemsCollection(PATHS.epas)
      .where('tier', '==', tier)
      .orderBy('id', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        shortName: data.shortName,
        definition: data.definition,
        tier: data.tier,
        tierNumber: data.tierNumber,
        dag: data.dag,
        competencyRequirements: data.competencyRequirements,
        entrustmentLevels: data.entrustmentLevels || [],
        aiGateway: data.aiGateway,
        guardian: data.guardian,
        version: data.version || '4.1',
      } as PDCEPA;
    });
  } catch (error) {
    log.error('Error fetching EPAs by tier:', error);
    throw new Error('Failed to fetch EPAs by tier');
  }
}

// =============================================================================
// CPA ACTIONS
// =============================================================================

/**
 * Get all CPAs, sorted by ID (CPA-01 to CPA-09)
 */
export async function getCPAsAction(): Promise<PDCCPA[]> {
  try {
    const snapshot = await getItemsCollection(PATHS.cpas)
      .orderBy('id', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        focusArea: data.focusArea,
        definition: data.definition,
        category: data.category,
        careerStage: data.careerStage,
        dag: data.dag,
        keyEPAs: data.keyEPAs || [],
        integrationModule: data.integrationModule,
        aiIntegration: data.aiIntegration,
        achievementCriteria: data.achievementCriteria,
        successMetrics: data.successMetrics || [],
        version: data.version || '4.1',
      } as PDCCPA;
    });
  } catch (error) {
    log.error('Error fetching CPAs:', error);
    throw new Error('Failed to fetch CPAs');
  }
}

/**
 * Get a single CPA by ID (e.g., "CPA-01" or "cpa-01")
 */
export async function getCPAByIdAction(id: string): Promise<PDCCPA | null> {
  // Normalize ID to uppercase
  const normalizedId = id.toUpperCase();

  try {
    const doc = await getItemsCollection(PATHS.cpas).doc(normalizedId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      focusArea: data.focusArea,
      definition: data.definition,
      category: data.category,
      careerStage: data.careerStage,
      dag: data.dag,
      keyEPAs: data.keyEPAs || [],
      integrationModule: data.integrationModule,
      aiIntegration: data.aiIntegration,
      achievementCriteria: data.achievementCriteria,
      successMetrics: data.successMetrics || [],
      version: data.version || '4.1',
    } as PDCCPA;
  } catch (error) {
    log.error('Error fetching CPA:', error);
    throw new Error('Failed to fetch CPA');
  }
}

/**
 * Get CPAs by category (Core, Advanced, Capstone)
 */
export async function getCPAsByCategoryAction(
  category: 'Core' | 'Advanced' | 'Capstone'
): Promise<PDCCPA[]> {
  try {
    const snapshot = await getItemsCollection(PATHS.cpas)
      .where('category', '==', category)
      .orderBy('id', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        focusArea: data.focusArea,
        definition: data.definition,
        category: data.category,
        careerStage: data.careerStage,
        dag: data.dag,
        keyEPAs: data.keyEPAs || [],
        integrationModule: data.integrationModule,
        aiIntegration: data.aiIntegration,
        achievementCriteria: data.achievementCriteria,
        successMetrics: data.successMetrics || [],
        version: data.version || '4.1',
      } as PDCCPA;
    });
  } catch (error) {
    log.error('Error fetching CPAs by category:', error);
    throw new Error('Failed to fetch CPAs by category');
  }
}

// =============================================================================
// LEGACY COMPATIBILITY (Deprecated - use new methods above)
// =============================================================================

/**
 * @deprecated Use getDomainsAction() - returns PDCDomain[]
 */
export interface Domain {
  id: number;
  title: string;
  cluster: 'foundational' | 'process' | 'assessment' | 'integration';
  description: string;
  keyTopics: string[];
  driveLink: string;
  behavioralAnchors: Record<string, string>;
}

/**
 * @deprecated Use getEPAsAction() - returns PDCEPA[]
 */
export interface EPA {
  id: string;
  title: string;
  category: 'core' | 'executive';
  definition: string;
  primaryDomains: number[];
  supportingDomains?: number[] | string[];
  entrustmentLevels: Record<string, string>;
  aiIntegration: string;
  supportsCpas: string[];
  driveDocId: string;
  driveLink: string;
}

/**
 * @deprecated Use getCPAsAction() - returns PDCCPA[]
 */
export interface CPA {
  id: string;
  title: string;
  focus: string;
  careerStage: string;
  executiveSummary: string;
  primaryDomains: number[];
  requiresEpas: string[];
  aiIntegration: string;
  progression: Record<string, string>;
  behavioralAnchors: Record<string, string>;
  driveDocId: string;
  driveLink: string;
}
