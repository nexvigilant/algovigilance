/**
 * Business Rules Validator Unit Tests
 *
 * Tests domain-specific business logic rules for the PDC framework:
 * - Tier-Level consistency
 * - Core/Executive EPA requirements
 * - CPA-8 Capstone rules
 * - AI Gateway (EPA-10) prerequisites
 */

import { businessRulesValidator } from '../../../scripts/validation/content-validation/business-rules';
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

describe('Business Rules Validator', () => {
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
      expect(businessRulesValidator.name).toBe('Business Rules');
      expect(businessRulesValidator.layer).toBe('business-rules');
    });

    it('should return a valid LayerResult structure', async () => {
      const data = createValidData();
      const result = await businessRulesValidator.validate(data);

      expect(result).toHaveProperty('layer', 'business-rules');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checksRun');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('EPA Tier Validation', () => {
    it('should detect Core EPAs with wrong tier', async () => {
      const data = createValidData();
      // Add EPA-01 (Core) with wrong tier
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Core EPA',
          focusArea: 'Test',
          tier: 'Executive', // Wrong!
          description:
            'A Core EPA that incorrectly has Executive tier for testing.',
          portRange: '3001-3003',
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_CORE_EPA_WRONG_TIER'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].expected).toBe('Core');
      expect(issues[0].actual).toBe('Executive');
    });

    it('should detect Executive EPAs with wrong tier', async () => {
      const data = createValidData();
      // Add EPA-15 (Executive) with wrong tier
      data.epas = [
        {
          id: 'EPA-15',
          name: 'Executive EPA',
          focusArea: 'Test',
          tier: 'Core', // Wrong!
          description:
            'An Executive EPA that incorrectly has Core tier for testing.',
          portRange: '3001-3003',
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_EXEC_EPA_WRONG_TIER'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should detect Advanced EPAs with wrong tier', async () => {
      const data = createValidData();
      // Add EPA-21 (Advanced) with wrong tier
      data.epas = [
        {
          id: 'EPA-21',
          name: 'Advanced EPA',
          focusArea: 'Test',
          tier: 'Core', // Wrong!
          description:
            'An Advanced EPA that incorrectly has Core tier for testing.',
          portRange: '3061-3063',
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_ADV_EPA_WRONG_TIER'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Tier-Level Consistency', () => {
    it('should warn when Executive EPA has mapping below L4', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-15',
          name: 'Executive EPA',
          focusArea: 'Leadership',
          tier: 'Executive',
          description: 'An Executive EPA for testing tier-level consistency.',
          portRange: '3001-3003',
        },
      ];
      data.epaDomainMappings = [
        {
          epaId: 'EPA-15',
          domainId: 'D01',
          role: 'Primary',
          level: 'L2', // Too low for Executive
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_EXEC_LOW_LEVEL'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should warn when Core EPA has mapping above L4', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Core EPA',
          focusArea: 'Processing',
          tier: 'Core',
          description: 'A Core EPA for testing tier-level consistency.',
          portRange: '3001-3003',
        },
      ];
      data.epaDomainMappings = [
        {
          epaId: 'EPA-01',
          domainId: 'D01',
          role: 'Primary',
          level: 'L5+', // Too high for Core
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_CORE_HIGH_LEVEL'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('CPA-8 Capstone Rules', () => {
    it('should error when CPA-8 does not include EPA-10', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-8',
          name: 'Strategic PV Leadership',
          focusArea: 'Executive Leadership',
          primaryIntegration: 'Strategy + All Domains',
          careerStage: 'Executive',
          executiveSummary: 'Executive-level pharmacovigilance leadership.',
          aiIntegration: 'AI-driven strategic decision support.',
          keyEPAs: ['EPA-15'],
          prerequisite: 'EPA-10 L4+',
        },
      ];
      data.cpaEpaMappings = [
        {
          cpaId: 'CPA-8',
          epaId: 'EPA-15', // Missing EPA-10!
          relationship: 'Executive',
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_CAPSTONE_NO_GATEWAY'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('error');
    });

    it('should warn when CPA-8 has low Core EPA coverage', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-8',
          name: 'Strategic PV Leadership',
          focusArea: 'Executive Leadership',
          primaryIntegration: 'Strategy + All Domains',
          careerStage: 'Executive',
          executiveSummary: 'Executive-level pharmacovigilance leadership.',
          aiIntegration: 'AI-driven strategic decision support.',
          keyEPAs: ['EPA-10', 'EPA-15'],
          prerequisite: 'EPA-10 L4+',
        },
      ];
      data.epas = [
        {
          id: 'EPA-10',
          name: 'AI Gateway',
          focusArea: 'AI Integration',
          tier: 'Core',
          description: 'The AI Gateway EPA.',
          portRange: '3028-3030',
        },
        {
          id: 'EPA-15',
          name: 'Executive EPA',
          focusArea: 'Leadership',
          tier: 'Executive',
          description: 'An Executive EPA.',
          portRange: '3040-3042',
        },
      ];
      data.cpaEpaMappings = [
        { cpaId: 'CPA-8', epaId: 'EPA-10', relationship: 'Gateway' },
        { cpaId: 'CPA-8', epaId: 'EPA-15', relationship: 'Executive' },
        // Only 2 EPAs, way less than 8
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_CAPSTONE_LOW_COVERAGE'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('AI Gateway EPA-10 Rules', () => {
    it('should warn when EPA-10 has wrong tier', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-10',
          name: 'AI-Augmented Signal Analysis',
          focusArea: 'AI Integration',
          tier: 'Executive', // Wrong, should be Core
          description: 'Apply AI tools to enhance pharmacovigilance workflows.',
          portRange: '3028-3030',
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_GATEWAY_WRONG_TIER'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should provide info when EPA-10 focus area does not mention AI', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-10',
          name: 'Signal Analysis',
          focusArea: 'Analytics', // Missing "AI"
          tier: 'Core',
          description: 'Apply tools to enhance pharmacovigilance workflows.',
          portRange: '3028-3030',
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_GATEWAY_FOCUS'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('info');
    });
  });

  describe('Role Distribution', () => {
    it('should warn when EPA has no Primary domain mappings', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Test EPA',
          focusArea: 'Test',
          tier: 'Core',
          description: 'An EPA with only Supporting domain mappings.',
          portRange: '3001-3003',
        },
      ];
      data.epaDomainMappings = [
        {
          epaId: 'EPA-01',
          domainId: 'D01',
          role: 'Supporting', // Only Supporting, no Primary
          level: 'L3',
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_NO_PRIMARY_DOMAIN'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Career Stage Validation', () => {
    it('should warn about non-standard career stages', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-1',
          name: 'Test CPA',
          focusArea: 'Test',
          primaryIntegration: 'Test',
          careerStage: 'Beginner', // Invalid career stage
          executiveSummary: 'A test CPA with invalid career stage.',
          aiIntegration: 'None',
          keyEPAs: ['EPA-01'],
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_INVALID_CAREER_STAGE'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].actual).toBe('Beginner');
    });
  });

  describe('Thematic Cluster Consistency', () => {
    it('should warn when cluster name does not match cluster number', async () => {
      const data = createValidData();
      data.domains = [
        {
          id: 'D01',
          name: 'Test Domain',
          thematicCluster: 1, // Foundational
          clusterName: 'Process and Methodology Domains', // Wrong!
          definition: 'A domain with mismatched cluster name.',
          totalKSBs: 50,
          hasAssessment: true,
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_CLUSTER_NAME_MISMATCH'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].expected).toBe('Foundational Domains');
    });
  });

  describe('Port Range Validation', () => {
    it('should note non-standard port range format', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Test EPA',
          focusArea: 'Test',
          tier: 'Core',
          description: 'An EPA with invalid port range format.',
          portRange: '300-400', // Invalid format (should be XXXX-XXXX)
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_INVALID_PORT_FORMAT'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should note duplicate port ranges', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Test EPA 1',
          focusArea: 'Test',
          tier: 'Core',
          description: 'First EPA with duplicate port range.',
          portRange: '3001-3003',
        },
        {
          id: 'EPA-02',
          name: 'Test EPA 2',
          focusArea: 'Test',
          tier: 'Core',
          description: 'Second EPA with same port range.',
          portRange: '3001-3003', // Same as EPA-01
        },
      ];

      const result = await businessRulesValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'BIZ_DUPLICATE_PORT_RANGE'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const data = createValidData();
      const result = await businessRulesValidator.validate(data);

      expect(result.duration).toBeLessThan(1000);
    });
  });
});
