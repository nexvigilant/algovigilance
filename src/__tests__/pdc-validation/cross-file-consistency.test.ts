/**
 * Cross-File Consistency Validator Unit Tests
 *
 * Tests consistency across multiple JSON files:
 * - CPA.keyEPAs matches cpa-epa-mappings.json
 * - Domain.totalKSBs matches actual KSB count
 * - CPA-Domain mappings derivable from EPA relationships
 */

import { crossFileConsistencyValidator } from '../../../scripts/validation/content-validation/cross-file-consistency';
import type { PDCData } from '../../../scripts/validation/content-validation/types';
import {
  validEPAs,
  validCPAs,
  validDomains,
  validEPADomainMappings,
  validCPAEPAMappings,
  validKSBs,
  validActivityAnchors,
} from './fixtures';

describe('Cross-File Consistency Validator', () => {
  const createValidData = (): PDCData => ({
    epas: validEPAs,
    cpas: validCPAs,
    domains: validDomains,
    epaDomainMappings: validEPADomainMappings,
    cpaEpaMappings: validCPAEPAMappings,
    cpaDomainMappings: [],
    ksbs: validKSBs,
    activityAnchors: validActivityAnchors,
    metadata: {
      version: '4.1',
      exportedAt: new Date().toISOString(),
    },
  });

  describe('Basic Properties', () => {
    it('should have correct name and layer', () => {
      expect(crossFileConsistencyValidator.name).toBe('Cross-File Consistency');
      expect(crossFileConsistencyValidator.layer).toBe('cross-file-consistency');
    });

    it('should return a valid LayerResult structure', async () => {
      const data = createValidData();
      const result = await crossFileConsistencyValidator.validate(data);

      expect(result).toHaveProperty('layer', 'cross-file-consistency');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checksRun');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('CPA.keyEPAs vs Mappings Consistency', () => {
    it('should warn when keyEPAs contains EPAs not in mappings', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-1',
          name: 'Test CPA',
          focusArea: 'Test',
          primaryIntegration: 'Test',
          careerStage: 'Foundation',
          executiveSummary: 'Test summary with enough content for validation.',
          aiIntegration: 'Test AI integration',
          keyEPAs: ['EPA-01', 'EPA-99'], // EPA-99 not in mappings
        },
      ];
      data.cpaEpaMappings = [
        { cpaId: 'CPA-1', epaId: 'EPA-01', relationship: 'Key EPA' },
        // EPA-99 is missing from mappings
      ];

      const result = await crossFileConsistencyValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'XREF_KEYEPAS_NOT_MAPPED'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should note when mapped EPAs are not in keyEPAs', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-1',
          name: 'Test CPA',
          focusArea: 'Test',
          primaryIntegration: 'Test',
          careerStage: 'Foundation',
          executiveSummary: 'Test summary with enough content for validation.',
          aiIntegration: 'Test AI integration',
          keyEPAs: ['EPA-01'], // Only EPA-01 as "key"
        },
      ];
      data.epas = [
        {
          id: 'EPA-01',
          name: 'EPA 01',
          focusArea: 'Test',
          tier: 'Core',
          description: 'First EPA description.',
          portRange: '3001-3003',
        },
        {
          id: 'EPA-02',
          name: 'EPA 02',
          focusArea: 'Test',
          tier: 'Core',
          description: 'Second EPA description.',
          portRange: '3004-3006',
        },
      ];
      data.cpaEpaMappings = [
        { cpaId: 'CPA-1', epaId: 'EPA-01', relationship: 'Key EPA' },
        { cpaId: 'CPA-1', epaId: 'EPA-02', relationship: 'Integration' }, // Not in keyEPAs
      ];

      const result = await crossFileConsistencyValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'XREF_MAPPED_NOT_KEY'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('info');
    });
  });

  describe('Domain.totalKSBs vs Actual Count', () => {
    it('should warn when totalKSBs does not match actual KSB count', async () => {
      const data = createValidData();
      // Set totalKSBs to wrong value
      data.domains = [
        {
          id: 'D01',
          name: 'Test Domain',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: 'Test domain definition with enough content.',
          totalKSBs: 100, // Wrong - actual count is different
          hasAssessment: true,
        },
      ];
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'Test description',
          proficiencyLevel: 'L1',
          bloomLevel: 'Remember',
          keywords: ['test'],
          epaIds: ['EPA-01'],
          cpaIds: ['CPA-1'],
          regulatoryRefs: [],
          status: 'active',
        },
        // Only 1 KSB, but domain claims 100
      ];

      const result = await crossFileConsistencyValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'XREF_KSB_COUNT_MISMATCH'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].expected).toBe(1);
      expect(issues[0].actual).toBe(100);
    });

    it('should note when domains claim KSBs but ksbs.json is empty', async () => {
      const data = createValidData();
      data.domains = [
        {
          id: 'D01',
          name: 'Test Domain',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: 'Test domain definition with enough content.',
          totalKSBs: 50, // Claims 50 KSBs
          hasAssessment: true,
        },
      ];
      data.ksbs = []; // Empty

      const result = await crossFileConsistencyValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'XREF_KSBS_NOT_EXPORTED'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('CPA-Domain Mapping Derivability', () => {
    it('should warn when CPA-Domain mappings are missing derived domains', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-1',
          name: 'Test CPA',
          focusArea: 'Test',
          primaryIntegration: 'Test',
          careerStage: 'Foundation',
          executiveSummary: 'Test summary with enough content.',
          aiIntegration: 'Test AI',
          keyEPAs: ['EPA-01'],
        },
      ];
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Test EPA',
          focusArea: 'Test',
          tier: 'Core',
          description: 'Test EPA description.',
          portRange: '3001-3003',
        },
      ];
      data.domains = [
        {
          id: 'D01',
          name: 'Test Domain',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: 'Test domain definition.',
          totalKSBs: 50,
          hasAssessment: true,
        },
      ];
      data.cpaEpaMappings = [
        { cpaId: 'CPA-1', epaId: 'EPA-01', relationship: 'Key EPA' },
      ];
      data.epaDomainMappings = [
        { epaId: 'EPA-01', domainId: 'D01', role: 'Primary', level: 'L3' },
      ];
      data.cpaDomainMappings = []; // Missing D01 which should be derived

      const result = await crossFileConsistencyValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'XREF_CPA_DOMAIN_MISSING'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Activity Anchor Domain Coverage', () => {
    it('should warn when domains have no activity anchors', async () => {
      const data = createValidData();
      data.domains = [
        {
          id: 'D01',
          name: 'Domain with Anchors',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: 'Domain that has activity anchors.',
          totalKSBs: 50,
          hasAssessment: true,
        },
        {
          id: 'D99',
          name: 'Domain without Anchors',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: 'Domain that lacks activity anchors.',
          totalKSBs: 50,
          hasAssessment: true,
        },
      ];
      data.activityAnchors = [
        {
          domainId: 'D01', // Only D01 has anchors
          proficiencyLevel: 'L1',
          levelName: 'Novice',
          anchorNumber: 1,
          activityDescription: 'Test activity',
          observableBehaviors: 'Test behaviors',
          evidenceTypes: ['assessment'],
        },
      ];

      const result = await crossFileConsistencyValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'XREF_DOMAIN_NO_ANCHORS'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].actual).toContain('D99');
    });
  });

  describe('Relationship Type Consistency', () => {
    it('should note non-standard relationship types', async () => {
      const data = createValidData();
      data.cpaEpaMappings = [
        {
          cpaId: 'CPA-1',
          epaId: 'EPA-01',
          relationship: 'CustomRelationship', // Non-standard
        },
      ];

      const result = await crossFileConsistencyValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'XREF_UNKNOWN_RELATIONSHIP'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should accept standard relationship types', async () => {
      const data = createValidData();
      data.cpaEpaMappings = [
        { cpaId: 'CPA-1', epaId: 'EPA-01', relationship: 'Key EPA' },
        { cpaId: 'CPA-1', epaId: 'EPA-02', relationship: 'Integration' },
      ];
      data.epas = [
        {
          id: 'EPA-01',
          name: 'EPA 01',
          focusArea: 'Test',
          tier: 'Core',
          description: 'Test EPA.',
          portRange: '3001-3003',
        },
        {
          id: 'EPA-02',
          name: 'EPA 02',
          focusArea: 'Test',
          tier: 'Core',
          description: 'Test EPA.',
          portRange: '3004-3006',
        },
      ];

      const result = await crossFileConsistencyValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'XREF_UNKNOWN_RELATIONSHIP'
      );
      expect(issues).toHaveLength(0);
    });
  });

  describe('Level Format Consistency', () => {
    it('should warn about non-standard level formats', async () => {
      const data = createValidData();
      data.epaDomainMappings = [
        {
          epaId: 'EPA-01',
          domainId: 'D01',
          role: 'Primary',
          level: 'Level3', // Invalid format (should be L3)
        },
      ];

      const result = await crossFileConsistencyValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'XREF_INVALID_LEVEL_FORMAT'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should accept all valid level formats', async () => {
      const data = createValidData();
      data.epas = validEPAs;
      data.domains = validDomains;
      data.epaDomainMappings = [
        { epaId: 'EPA-01', domainId: 'D01', role: 'Primary', level: 'L1' },
        { epaId: 'EPA-01', domainId: 'D08', role: 'Supporting', level: 'L2' },
        { epaId: 'EPA-10', domainId: 'D01', role: 'Primary', level: 'L3' },
        { epaId: 'EPA-10', domainId: 'D08', role: 'Primary', level: 'L4' },
        { epaId: 'EPA-21', domainId: 'D08', role: 'Primary', level: 'L5' },
        { epaId: 'EPA-21', domainId: 'D15', role: 'Supporting', level: 'L5+' },
        { epaId: 'EPA-21', domainId: 'D01', role: 'Supporting', level: 'L5++' },
      ];

      const result = await crossFileConsistencyValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'XREF_INVALID_LEVEL_FORMAT'
      );
      expect(issues).toHaveLength(0);
    });
  });

  describe('Metadata Info', () => {
    it('should include metadata version info', async () => {
      const data = createValidData();
      const result = await crossFileConsistencyValidator.validate(data);

      const metadataIssues = result.issues.filter(
        (i) => i.code === 'XREF_METADATA_INFO'
      );
      expect(metadataIssues.length).toBeGreaterThan(0);
      expect(metadataIssues[0].message).toContain('4.1');
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const data = createValidData();
      const result = await crossFileConsistencyValidator.validate(data);

      expect(result.duration).toBeLessThan(1000);
    });
  });
});
