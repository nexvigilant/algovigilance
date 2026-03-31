/**
 * Referential Integrity Validator Unit Tests
 *
 * Tests that all foreign key references in the PDC data resolve
 * to existing entities.
 */

import { referentialIntegrityValidator } from '../../../scripts/validation/content-validation/referential-integrity';
import type { PDCData } from '../../../scripts/validation/content-validation/types';
import {
  validEPAs,
  validCPAs,
  validDomains,
  validEPADomainMappings,
  validCPAEPAMappings,
  validKSBs,
  validActivityAnchors,
  invalidMappings,
} from './fixtures';

describe('Referential Integrity Validator', () => {
  // Helper to create valid base data
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
      expect(referentialIntegrityValidator.name).toBe('Referential Integrity');
      expect(referentialIntegrityValidator.layer).toBe('referential-integrity');
    });

    it('should return a valid LayerResult structure', async () => {
      const data = createValidData();
      const result = await referentialIntegrityValidator.validate(data);

      expect(result).toHaveProperty('layer', 'referential-integrity');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checksRun');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Valid Data', () => {
    it('should pass with valid EPA-Domain mappings', async () => {
      const data = createValidData();
      const result = await referentialIntegrityValidator.validate(data);

      expect(result.passed).toBe(true);
      const errors = result.issues.filter((i) => i.severity === 'error');
      expect(errors).toHaveLength(0);
    });

    it('should pass when all references resolve correctly', async () => {
      const data = createValidData();
      const result = await referentialIntegrityValidator.validate(data);

      expect(result.checksPassed).toBeGreaterThan(0);
      expect(result.checksRun).toBeGreaterThan(0);
    });
  });

  describe('Invalid EPA References', () => {
    it('should detect invalid EPA ID in EPA-Domain mapping', async () => {
      const data = createValidData();
      data.epaDomainMappings.push({
        epaId: 'EPA-99', // Non-existent
        domainId: 'D01',
        role: 'Primary',
        level: 'L3',
      });

      const result = await referentialIntegrityValidator.validate(data);

      const invalidRefIssues = result.issues.filter(
        (i) => i.code === 'REF_INVALID_EPA'
      );
      expect(invalidRefIssues.length).toBeGreaterThan(0);
      expect(invalidRefIssues[0].actual).toBe('EPA-99');
    });

    it('should detect invalid EPA in CPA-EPA mapping', async () => {
      const data = createValidData();
      data.cpaEpaMappings.push({
        cpaId: 'CPA-1',
        epaId: 'EPA-99', // Non-existent
        relationship: 'Core',
      });

      const result = await referentialIntegrityValidator.validate(data);

      const invalidRefIssues = result.issues.filter(
        (i) => i.code === 'REF_INVALID_EPA_IN_CPA'
      );
      expect(invalidRefIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Invalid Domain References', () => {
    it('should detect invalid Domain ID format', async () => {
      const data = createValidData();
      data.epaDomainMappings.push(invalidMappings.orphanDomain as unknown as (typeof data.epaDomainMappings)[number]);

      const result = await referentialIntegrityValidator.validate(data);

      const invalidRefIssues = result.issues.filter(
        (i) => i.code === 'REF_INVALID_DOMAIN'
      );
      expect(invalidRefIssues.length).toBeGreaterThan(0);
    });

    it('should suggest domain ID format in suggestion', async () => {
      const data = createValidData();
      data.epaDomainMappings.push({
        epaId: 'EPA-01',
        domainId: 'Domain99', // Invalid format
        role: 'Primary',
        level: 'L3',
      });

      const result = await referentialIntegrityValidator.validate(data);

      const issue = result.issues.find((i) => i.code === 'REF_INVALID_DOMAIN');
      expect(issue?.suggestion).toContain('DXX');
    });
  });

  describe('Invalid CPA References', () => {
    it('should detect invalid CPA in CPA-EPA mapping', async () => {
      const data = createValidData();
      data.cpaEpaMappings.push({
        cpaId: 'CPA-99', // Non-existent
        epaId: 'EPA-01',
        relationship: 'Core',
      });

      const result = await referentialIntegrityValidator.validate(data);

      const invalidRefIssues = result.issues.filter(
        (i) => i.code === 'REF_INVALID_CPA'
      );
      expect(invalidRefIssues.length).toBeGreaterThan(0);
    });

    it('should detect invalid CPA in CPA-Domain mapping', async () => {
      const data = createValidData();
      data.cpaDomainMappings = [
        {
          cpaId: 'CPA-99', // Non-existent
          domainId: 'D01',
        },
      ];

      const result = await referentialIntegrityValidator.validate(data);

      const invalidRefIssues = result.issues.filter(
        (i) => i.code === 'REF_INVALID_CPA_IN_DOMAIN'
      );
      expect(invalidRefIssues.length).toBeGreaterThan(0);
    });
  });

  describe('KSB Validation', () => {
    it('should detect invalid domain reference in KSB', async () => {
      const data = createValidData();
      data.ksbs.push({
        id: 'KSB-D99-K0001',
        domainId: 'D99', // Non-existent
        type: 'Knowledge',
        majorSection: 'Test',
        section: 'Test',
        itemName: 'Test KSB',
        itemDescription: 'A test KSB item with enough description length.',
        proficiencyLevel: 'L1',
        bloomLevel: 'Remember',
        keywords: ['test'],
        epaIds: ['EPA-01'],
        cpaIds: ['CPA-1'],
        regulatoryRefs: [],
        status: 'active',
      });

      const result = await referentialIntegrityValidator.validate(data);

      const invalidRefIssues = result.issues.filter(
        (i) => i.code === 'REF_INVALID_KSB_DOMAIN'
      );
      expect(invalidRefIssues.length).toBeGreaterThan(0);
    });

    it('should skip KSB validation when no KSBs exist', async () => {
      const data = createValidData();
      data.ksbs = [];

      const result = await referentialIntegrityValidator.validate(data);

      // Should not throw and should pass
      expect(result).toBeDefined();
    });
  });

  describe('Activity Anchor Validation', () => {
    it('should detect invalid domain reference in ActivityAnchor', async () => {
      const data = createValidData();
      data.activityAnchors.push({
        domainId: 'D99', // Non-existent
        proficiencyLevel: 'L1',
        levelName: 'Novice',
        anchorNumber: 1,
        activityDescription: 'Test activity',
        observableBehaviors: 'Test behaviors',
        evidenceTypes: ['assessment'],
      });

      const result = await referentialIntegrityValidator.validate(data);

      const invalidRefIssues = result.issues.filter(
        (i) => i.code === 'REF_INVALID_ANCHOR_DOMAIN'
      );
      expect(invalidRefIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Unmapped EPAs Warning', () => {
    it('should warn about EPAs without any mappings', async () => {
      // Create minimal data with an unmapped EPA
      const data: PDCData = {
        epas: [
          {
            id: 'EPA-01',
            name: 'Mapped EPA',
            focusArea: 'Test',
            tier: 'Core',
            description: 'An EPA with domain mappings.',
            portRange: '3001-3003',
          },
          {
            id: 'EPA-99',
            name: 'Orphan EPA',
            focusArea: 'Test',
            tier: 'Core',
            description:
              'This is an EPA without any domain or CPA mappings for testing.',
            portRange: '9999-9999',
          },
        ],
        cpas: [],
        domains: [
          {
            id: 'D01',
            name: 'Test Domain',
            thematicCluster: 1,
            clusterName: 'Foundational Domains',
            definition: 'A test domain for fixtures.',
            totalKSBs: 50,
            hasAssessment: true,
          },
        ],
        epaDomainMappings: [
          { epaId: 'EPA-01', domainId: 'D01', role: 'Primary', level: 'L3' },
          // EPA-99 has NO mappings
        ],
        cpaEpaMappings: [],
        cpaDomainMappings: [],
        ksbs: [],
        activityAnchors: [],
        metadata: {
          version: '4.1',
          exportedAt: new Date().toISOString(),
        },
      };

      const result = await referentialIntegrityValidator.validate(data);

      const warnings = result.issues.filter(
        (i) => i.code === 'REF_UNMAPPED_EPA' && i.severity === 'warning'
      );
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].entityId).toBe('EPA-99');
    });
  });

  describe('CPA keyEPAs Validation', () => {
    it('should warn about invalid EPA references in CPA.keyEPAs', async () => {
      const data = createValidData();
      // Modify a CPA to have an invalid keyEPA
      const cpaWithInvalidKey = { ...data.cpas[0] };
      cpaWithInvalidKey.keyEPAs = ['EPA-99', 'EPA-100']; // Non-existent EPAs
      data.cpas = [cpaWithInvalidKey, ...data.cpas.slice(1)];

      const result = await referentialIntegrityValidator.validate(data);

      const keyEPAIssues = result.issues.filter(
        (i) => i.code === 'REF_INVALID_KEY_EPA'
      );
      expect(keyEPAIssues.length).toBeGreaterThan(0);
    });

    it('should skip special keyEPAs entries like "All EPAs"', async () => {
      const data = createValidData();
      // Add special entry that should be skipped
      const cpaWithSpecialKey = { ...data.cpas[0] };
      cpaWithSpecialKey.keyEPAs = ['All EPAs', '', 'EPA-01'];
      data.cpas = [cpaWithSpecialKey, ...data.cpas.slice(1)];

      const result = await referentialIntegrityValidator.validate(data);

      // Should not create issues for "All EPAs" or empty strings
      const keyEPAIssues = result.issues.filter(
        (i) =>
          i.code === 'REF_INVALID_KEY_EPA' &&
          (i.actual === 'All EPAs' || i.actual === '')
      );
      expect(keyEPAIssues).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const data = createValidData();
      const result = await referentialIntegrityValidator.validate(data);

      // Should complete within 1 second for small dataset
      expect(result.duration).toBeLessThan(1000);
    });
  });
});
