/**
 * PDC Framework Data - Type-Safe Exports
 *
 * Auto-generated from Google Sheets export.
 * Last exported: 2025-12-22T05:13:11.022Z
 *
 * DO NOT EDIT MANUALLY - Run `npm run export:pdc` to regenerate.
 */

import epasData from './epas.json';
import cpasData from './cpas.json';
import domainsData from './domains.json';
import ksbsData from './ksbs.json';
import epaDomainMappingsData from './epa-domain-mappings.json';
import cpaEpaMappingsData from './cpa-epa-mappings.json';
import activityAnchorsData from './activity-anchors.json';
import metadataData from './metadata.json';

// Types
export interface EPA {
  id: string;
  name: string;
  focusArea: string;
  tier: 'Core' | 'Executive' | 'Advanced';
  description: string;
  primaryDomains: Array<{ domainId: string; level: string }>;
  supportingDomains: Array<{ domainId: string; level: string }>;
  portRange: string;
}

export interface CPA {
  id: string;
  name: string;
  focusArea: string;
  primaryIntegration: string;
  careerStage: string;
  executiveSummary: string;
  aiIntegration: string;
  keyEPAs: string[];
}

export interface Domain {
  id: string;
  name: string;
  thematicCluster: number;
  clusterName: string;
  definition: string;
  totalKSBs: number;
  hasAssessment: boolean;
}

export interface KSB {
  id: string;
  domainId: string;
  type: 'Knowledge' | 'Skill' | 'Behavior' | 'AI Integration';
  majorSection: string;
  section: string;
  itemName: string;
  itemDescription: string;
  proficiencyLevel: string;
  bloomLevel: string;
  keywords: string[];
  epaIds: string[];
  cpaIds: string[];
  regulatoryRefs: string[];
  status: string;
}

export interface EPADomainMapping {
  epaId: string;
  domainId: string;
  role: 'Primary' | 'Supporting';
  level: string;
}

export interface CPAEPAMapping {
  cpaId: string;
  epaId: string;
  relationship: string;
}

export interface ActivityAnchor {
  domainId: string;
  proficiencyLevel: string;
  levelName: string;
  anchorNumber: number;
  activityDescription: string;
  observableBehaviors: string;
  evidenceTypes: string[];
}

export interface PDCMetadata {
  exportedAt: string;
  sourceSpreadsheetId: string;
  version: string;
  counts: {
    epas: number;
    cpas: number;
    domains: number;
    ksbs: number;
    epaDomainMappings: number;
    cpaEpaMappings: number;
    activityAnchors: number;
  };
}

// Typed data exports
export const epas = epasData as EPA[];
export const cpas = cpasData as CPA[];
export const domains = domainsData as Domain[];
export const ksbs = ksbsData as KSB[];
export const epaDomainMappings = epaDomainMappingsData as EPADomainMapping[];
export const cpaEpaMappings = cpaEpaMappingsData as CPAEPAMapping[];
export const activityAnchors = activityAnchorsData as ActivityAnchor[];
export const metadata = metadataData as PDCMetadata;

// Helper functions
export function getEPAById(id: string): EPA | undefined {
  return epas.find((e) => e.id === id);
}

export function getCPAById(id: string): CPA | undefined {
  return cpas.find((c) => c.id === id);
}

export function getDomainById(id: string): Domain | undefined {
  return domains.find((d) => d.id === id);
}

export function getKSBById(id: string): KSB | undefined {
  return ksbs.find((k) => k.id === id);
}

export function getKSBsByDomain(domainId: string): KSB[] {
  return ksbs.filter((k) => k.domainId === domainId);
}

export function getKSBsByEPA(epaId: string): KSB[] {
  return ksbs.filter((k) => k.epaIds.includes(epaId));
}

export function getKSBsByCPA(cpaId: string): KSB[] {
  return ksbs.filter((k) => k.cpaIds.includes(cpaId));
}

export function getAnchorsByDomain(domainId: string): ActivityAnchor[] {
  return activityAnchors.filter((a) => a.domainId === domainId);
}

export function getDomainsForEPA(epaId: string): Array<Domain & { role: 'Primary' | 'Supporting'; level: string }> {
  const mappings = epaDomainMappings.filter((m) => m.epaId === epaId);
  return mappings
    .map((m) => {
      const domain = getDomainById(m.domainId);
      return domain ? { ...domain, role: m.role, level: m.level } : null;
    })
    .filter((d): d is Domain & { role: 'Primary' | 'Supporting'; level: string } => d !== null);
}

export function getEPAsForCPA(cpaId: string): EPA[] {
  const mappings = cpaEpaMappings.filter((m) => m.cpaId === cpaId);
  return mappings
    .map((m) => getEPAById(m.epaId))
    .filter((e): e is EPA => e !== undefined);
}
