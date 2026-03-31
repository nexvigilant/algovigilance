'use server';

/**
 * Compatibility layer for legacy EPA/CPA types.
 *
 * Maps PDCEPA/PDCCPA from framework-browser/actions.ts to the legacy
 * EPA/CPA interfaces that some consumers still expect.
 *
 * Consumers should migrate to PDCEPA/PDCCPA directly over time.
 */

import {
  getEPAsAction,
  getCPAsAction,
  type PDCEPA,
  type PDCCPA,
} from '@/app/nucleus/admin/academy/framework-browser/actions';

// Legacy types (previously in framework/actions.ts)
export interface EPA {
  id: string;
  name: string;
  definition: string;
  tier: 'core' | 'executive';
  primaryDomains: string[];
  aiIntegration: string;
  careerStage: string;
}

export interface CPA {
  id: string;
  name: string;
  focusArea: string;
  summary: string;
  primaryDomains: string[];
  keyEPAs: string[];
  aiIntegration: string;
  careerStage: string;
}

function mapPDCEPAtoEPA(pdc: PDCEPA): EPA {
  return {
    id: pdc.id,
    name: pdc.name,
    definition: pdc.definition,
    tier: pdc.tier.toLowerCase() === 'core' ? 'core' : 'executive',
    primaryDomains: pdc.competencyRequirements.primary.map((d) => d.domainId),
    aiIntegration: pdc.aiGateway
      ? pdc.aiGateway.phases.map((p) => p.name).join(', ')
      : 'None',
    careerStage: pdc.dag.enabledAtProgramStage,
  };
}

function mapPDCCPAtoCPA(pdc: PDCCPA): CPA {
  return {
    id: pdc.id,
    name: pdc.name,
    focusArea: pdc.focusArea,
    summary: pdc.definition,
    primaryDomains: pdc.dag.primaryDomains,
    keyEPAs: pdc.keyEPAs,
    aiIntegration: pdc.aiIntegration.capabilities.join(', '),
    careerStage: pdc.careerStage,
  };
}

export async function getEPAs(): Promise<EPA[]> {
  const pdcEPAs = await getEPAsAction();
  return pdcEPAs.map(mapPDCEPAtoEPA);
}

export async function getCPAs(): Promise<CPA[]> {
  const pdcCPAs = await getCPAsAction();
  return pdcCPAs.map(mapPDCCPAtoCPA);
}
