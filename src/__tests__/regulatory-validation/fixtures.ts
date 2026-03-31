/**
 * Regulatory Validation Test Fixtures
 */

import type { RegulatoryData } from '../../../scripts/regulatory/types';

export const createMinimalValidData = (): RegulatoryData => ({
  masterDirectory: {
    regulations: [
      {
        regId: 'FDA-CFR-001',
        officialIdentifier: '21 CFR 312.32',
        title: 'IND Safety Reporting',
        jurisdiction: 'FDA',
        documentType: 'CFR',
        status: 'Current',
        effectiveDate: null,
        applicability: {
          rxDrugs: true,
          otc: false,
          biologics: true,
          vaccines: true,
          bloodProducts: true,
          biosimilars: true,
          generics: false,
          combinationProducts: true,
          atmp: true,
        },
        roles: {
          mahSponsor: true,
          qppv: false,
          investigator: true,
          hcp: false,
          distributor: false,
          croVendor: true,
        },
        lifecycleStage: 'Pre-Approval',
        pvActivityCategory: 'Expedited Reporting',
        summaryDescription: 'Establishes requirements for sponsors to report safety information.',
        keyRequirements: ['15-day alert reports', '7-day reports for fatal events'],
        notes: null,
      },
      {
        regId: 'ICH-E2-001',
        officialIdentifier: 'ICH E2A',
        title: 'Clinical Safety Data Management',
        jurisdiction: 'ICH',
        documentType: 'ICH Guideline',
        status: 'Current',
        effectiveDate: null,
        applicability: {
          rxDrugs: true,
          otc: false,
          biologics: true,
          vaccines: true,
          bloodProducts: true,
          biosimilars: true,
          generics: false,
          combinationProducts: true,
          atmp: true,
        },
        roles: {
          mahSponsor: true,
          qppv: false,
          investigator: true,
          hcp: false,
          distributor: false,
          croVendor: true,
        },
        lifecycleStage: 'Both',
        pvActivityCategory: 'Expedited Reporting',
        summaryDescription: 'Defines standards for clinical safety data management.',
        keyRequirements: ['Serious AE definition', 'Expedited reporting criteria'],
        notes: null,
      },
    ],
  },
  reportingTimelines: {
    timelines: [
      {
        eventReportType: 'Serious Unexpected ADR - Domestic',
        reportCategory: 'Expedited',
        fda: {
          timeframe: '15 calendar days',
          authority: '21 CFR 314.80(c)(1)(i)',
        },
        ema: {
          timeframe: '15 calendar days',
          authority: 'Dir 2001/83/EC Art 107(3)',
        },
        ichReference: 'ICH E2D',
        whoReference: 'Per national requirements',
        day0Definition: 'Date MAH/Sponsor first receives minimum information',
        keyDifferences: 'Aligned on 15-day timeline',
        notes: null,
      },
    ],
  },
  crossReferenceMatrix: {
    crossReferences: [
      {
        topicArea: 'Serious Adverse Event Definition',
        keyRequirement: 'Death, life-threatening, hospitalization, disability',
        fda: {
          citation: '21 CFR 312.32(a)',
          document: 'IND Safety Reporting Final Rule',
        },
        ema: {
          citation: 'Dir 2001/83/EC Art 1(12)',
          document: 'GVP Annex IV',
        },
        ich: {
          citation: 'ICH E2A Section II.A',
          document: 'E2A Guideline',
        },
        who: null,
        cioms: 'CIOMS I',
        harmonizationLevel: 'Fully Harmonized',
        varianceNotes: 'Minor wording differences',
      },
    ],
  },
  ksbRegulationMappings: {
    mappings: [
      {
        regId: 'FDA-CFR-001',
        regTitle: 'IND Safety Reporting',
        domainId: 'D06',
        domainName: 'Expedited & ICSR Reporting', // Matches DOMAIN_NAMES['D06']
        relevanceType: 'Foundational',
        academyLevel: 'Core',
        relatedKsbIds: [],
        relatedKsbCount: 0,
        competencyFocus: 'Case processing & reporting',
        notes: null,
      },
    ],
  },
  gapAnalysis: {
    gaps: [
      {
        priority: 'CRITICAL',
        regId: 'ICH-017',
        officialIdentifier: 'ICH E6(R3)',
        title: 'Good Clinical Practice - Complete Revision',
        jurisdiction: 'ICH',
        documentType: 'ICH Guideline',
        statusEffectiveDate: 'Step 4: 2025-01-06',
        gapCategory: 'GCP Modernization',
        actionRequired: 'Curriculum update required',
        notes: 'EMA effective 23 July 2025',
      },
    ],
    summary: {
      critical: 1,
      high: 0,
      medium: 0,
      low: 0,
      regional: 0,
    },
  },
  acronyms: {
    acronyms: [
      {
        acronym: 'ADR',
        fullTerm: 'Adverse Drug Reaction',
        definition: 'A response to a medicinal product which is noxious and unintended',
        contextJurisdiction: 'All',
      },
      {
        acronym: 'ICSR',
        fullTerm: 'Individual Case Safety Report',
        definition: 'Report of a single adverse event case',
        contextJurisdiction: 'All',
      },
    ],
  },
  metadata: {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    sourceSpreadsheetId: 'test-spreadsheet-id',
    totalRegulations: 2,
    totalTimelines: 1,
    totalCrossReferences: 1,
    totalMappings: 1,
    totalAcronyms: 2,
    totalGaps: 1,
  },
});

export const createDataWithDuplicateRegId = (): RegulatoryData => {
  const data = createMinimalValidData();
  data.masterDirectory.regulations.push({
    ...data.masterDirectory.regulations[0],
    // Same regId = duplicate
  });
  return data;
};

export const createDataWithMissingFields = (): RegulatoryData => {
  const data = createMinimalValidData();
  data.masterDirectory.regulations[0].summaryDescription = '';
  data.masterDirectory.regulations[0].title = '';
  return data;
};

export const createDataWithInvalidJurisdiction = (): RegulatoryData => {
  const data = createMinimalValidData();
  (data.masterDirectory.regulations[0] as Record<string, unknown>).jurisdiction = 'INVALID';
  return data;
};

export const createDataWithInvalidDomainId = (): RegulatoryData => {
  const data = createMinimalValidData();
  data.ksbRegulationMappings.mappings[0].domainId = 'D99';
  return data;
};

export const createDataWithInvalidMapping = (): RegulatoryData => {
  const data = createMinimalValidData();
  data.ksbRegulationMappings.mappings[0].regId = 'NONEXISTENT-001';
  return data;
};

export const createEmptyData = (): RegulatoryData => ({
  masterDirectory: { regulations: [] },
  reportingTimelines: { timelines: [] },
  crossReferenceMatrix: { crossReferences: [] },
  ksbRegulationMappings: { mappings: [] },
  gapAnalysis: { gaps: [], summary: { critical: 0, high: 0, medium: 0, low: 0, regional: 0 } },
  acronyms: { acronyms: [] },
  metadata: {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    sourceSpreadsheetId: 'test',
    totalRegulations: 0,
    totalTimelines: 0,
    totalCrossReferences: 0,
    totalMappings: 0,
    totalAcronyms: 0,
    totalGaps: 0,
  },
});
