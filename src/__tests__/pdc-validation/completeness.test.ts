/**
 * Completeness Validator Unit Tests
 *
 * Tests that all entities have required relationships
 * and no orphaned entities exist in the data model.
 */

import { completenessValidator } from '../../../scripts/validation/content-validation/completeness';
import type { PDCData } from '../../../scripts/validation/content-validation/types';
import {
  validEPAs,
  validCPAs,
  validDomains,
  validEPADomainMappings,
  validCPAEPAMappings,
  validKSBs,
  validActivityAnchors,
  edgeCases,
} from './fixtures';

describe('Completeness Validator', () => {
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
      expect(completenessValidator.name).toBe('Completeness');
      expect(completenessValidator.layer).toBe('completeness');
    });

    it('should return a valid LayerResult structure', async () => {
      const data = createValidData();
      const result = await completenessValidator.validate(data);

      expect(result).toHaveProperty('layer', 'completeness');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checksRun');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('EPA Domain Mappings', () => {
    it('should detect EPAs without domain mappings', async () => {
      const data = createValidData();
      // Add an EPA without mappings
      data.epas.push({
        id: 'EPA-99',
        name: 'Orphan EPA',
        focusArea: 'Test',
        tier: 'Core',
        description:
          'An EPA without any domain mappings for completeness testing.',
        portRange: '9999-9999',
      });

      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_EPA_NO_DOMAINS'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].entityId).toBe('EPA-99');
      expect(issues[0].severity).toBe('error');
    });

    it('should pass when all EPAs have at least one domain mapping', async () => {
      const data = createValidData();
      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_EPA_NO_DOMAINS'
      );
      // Our valid fixtures should have mappings
      const unmappedEPAs = data.epas.filter(
        (epa) => !data.epaDomainMappings.some((m) => m.epaId === epa.id)
      );
      expect(issues.length).toBe(unmappedEPAs.length);
    });
  });

  describe('CPA EPA Mappings', () => {
    it('should detect CPAs without EPA mappings', async () => {
      const data = createValidData();
      // Add a CPA without mappings
      data.cpas.push({
        id: 'CPA-99',
        name: 'Orphan CPA',
        focusArea: 'Test',
        primaryIntegration: 'Test',
        careerStage: 'Foundation',
        executiveSummary: 'A CPA without EPA mappings for testing purposes.',
        aiIntegration: 'None',
        keyEPAs: [],
      });

      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_CPA_NO_EPAS'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].entityId).toBe('CPA-99');
    });
  });

  describe('Domain EPA Coverage', () => {
    it('should warn about domains without EPA mappings', async () => {
      const data = createValidData();
      // Add a domain without any EPA mappings
      data.domains.push({
        id: 'D99',
        name: 'Orphan Domain',
        thematicCluster: 1,
        clusterName: 'Foundational Domains',
        definition:
          'A domain without any EPA mappings for testing orphan detection.',
        totalKSBs: 0,
        hasAssessment: false,
      });

      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_DOMAIN_NO_EPAS'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('warning');
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate EPA-Domain mappings', async () => {
      const data = createValidData();
      // Add duplicate mapping
      const duplicateMapping = { ...data.epaDomainMappings[0] };
      data.epaDomainMappings.push(duplicateMapping);

      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_DUPLICATE_EPA_DOMAIN'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should detect duplicate CPA-EPA mappings', async () => {
      const data = createValidData();
      // Add duplicate mapping
      const duplicateMapping = { ...data.cpaEpaMappings[0] };
      data.cpaEpaMappings.push(duplicateMapping);

      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_DUPLICATE_CPA_EPA'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should handle edge case with duplicate IDs from fixtures', async () => {
      const data = createValidData();
      data.epas = edgeCases.duplicateEPAIds as typeof data.epas;

      const result = await completenessValidator.validate(data);

      // Should still run without errors
      expect(result).toBeDefined();
    });
  });

  describe('Core EPA Coverage', () => {
    it('should warn about Core EPAs with fewer than 3 domain mappings', async () => {
      const data = createValidData();
      // Create a Core EPA with only 1 domain
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Test Core EPA',
          focusArea: 'Test',
          tier: 'Core',
          description: 'A Core EPA with insufficient domain coverage.',
          portRange: '3001-3003',
        },
      ];
      data.epaDomainMappings = [
        {
          epaId: 'EPA-01',
          domainId: 'D01',
          role: 'Primary',
          level: 'L3',
        },
      ];

      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_CORE_EPA_LOW_COVERAGE'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Entity Count Validation', () => {
    it('should warn when EPA count differs from expected (21)', async () => {
      const data = createValidData();
      // Remove EPAs to create mismatch
      data.epas = data.epas.slice(0, 1);

      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_EPA_COUNT_MISMATCH'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].expected).toBe(21);
    });

    it('should warn when CPA count differs from expected (8)', async () => {
      const data = createValidData();
      data.cpas = data.cpas.slice(0, 1);

      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_CPA_COUNT_MISMATCH'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].expected).toBe(8);
    });

    it('should warn when Domain count differs from expected (15)', async () => {
      const data = createValidData();
      data.domains = data.domains.slice(0, 1);

      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_DOMAIN_COUNT_MISMATCH'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].expected).toBe(15);
    });
  });

  describe('CPA Domain Mapping Completeness', () => {
    it('should warn about CPAs without domain mappings', async () => {
      const data = createValidData();
      // Ensure no CPA-Domain mappings
      data.cpaDomainMappings = [];

      const result = await completenessValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COMP_CPA_NO_DOMAIN_MAPPINGS'
      );
      // Should warn for each CPA without domain mappings
      expect(issues.length).toBe(data.cpas.length);
    });
  });

  describe('Empty Data Handling', () => {
    it('should handle empty data gracefully', async () => {
      const data = edgeCases.emptyData;
      const result = await completenessValidator.validate(data);

      // Should return without throwing
      expect(result).toBeDefined();
      expect(result.checksRun).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const data = createValidData();
      const result = await completenessValidator.validate(data);

      expect(result.duration).toBeLessThan(1000);
    });
  });
});
