/**
 * Content Quality Validator Unit Tests
 *
 * Tests text quality analysis of PDC content:
 * - Description/definition length thresholds
 * - Name uniqueness
 * - Placeholder detection
 * - Terminology consistency
 */

import { contentQualityValidator } from '../../../scripts/validation/content-validation/content-quality';
import type { PDCData } from '../../../scripts/validation/content-validation/types';
import {
  validEPAs,
  validCPAs,
  validDomains,
  validEPADomainMappings,
  validCPAEPAMappings,
  validKSBs,
  validActivityAnchors,
  invalidEPAs,
  _invalidDomains,
} from './fixtures';

describe('Content Quality Validator', () => {
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
      expect(contentQualityValidator.name).toBe('Content Quality');
      expect(contentQualityValidator.layer).toBe('content-quality');
    });

    it('should return a valid LayerResult structure', async () => {
      const data = createValidData();
      const result = await contentQualityValidator.validate(data);

      expect(result).toHaveProperty('layer', 'content-quality');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checksRun');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('EPA Description Quality', () => {
    it('should detect empty or placeholder EPA descriptions', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Test EPA',
          focusArea: 'Test',
          tier: 'Core',
          description: 'TBD', // Placeholder
          portRange: '3001-3003',
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_EPA_EMPTY_DESC'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('error');
    });

    it('should detect EPA descriptions below minimum length', async () => {
      const data = createValidData();
      data.epas = [invalidEPAs.shortDescription as unknown as (typeof data.epas)[number]];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_EPA_SHORT_DESC'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('warning');
    });

    it('should provide sentence structure info', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Test EPA',
          focusArea: 'Test',
          tier: 'Core',
          description: 'this description lacks proper sentence structure',
          portRange: '3001-3003',
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_EPA_SENTENCE'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('info');
    });
  });

  describe('CPA Executive Summary Quality', () => {
    it('should detect empty or placeholder CPA summaries', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-1',
          name: 'Test CPA',
          focusArea: 'Test',
          primaryIntegration: 'Test',
          careerStage: 'Foundation',
          executiveSummary: 'N/A', // Placeholder
          aiIntegration: 'Test AI',
          keyEPAs: ['EPA-01'],
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_CPA_EMPTY_SUMMARY'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should detect short CPA summaries', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-1',
          name: 'Test CPA',
          focusArea: 'Test',
          primaryIntegration: 'Test',
          careerStage: 'Foundation',
          executiveSummary: 'Too short summary.',
          aiIntegration: 'Test AI',
          keyEPAs: ['EPA-01'],
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_CPA_SHORT_SUMMARY'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Domain Definition Quality', () => {
    it('should detect empty domain definitions', async () => {
      const data = createValidData();
      data.domains = [
        {
          id: 'D01',
          name: 'Test Domain',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: '...', // Placeholder (just dots)
          totalKSBs: 50,
          hasAssessment: true,
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_DOMAIN_EMPTY_DEF'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should detect short domain definitions', async () => {
      const data = createValidData();
      data.domains = [
        {
          id: 'D01',
          name: 'Test Domain',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: 'Too short.',
          totalKSBs: 50,
          hasAssessment: true,
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_DOMAIN_SHORT_DEF'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Name Uniqueness', () => {
    it('should detect duplicate EPA names', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Duplicate Name',
          focusArea: 'Test',
          tier: 'Core',
          description:
            'First EPA with this name for testing duplicate detection.',
          portRange: '3001-3003',
        },
        {
          id: 'EPA-02',
          name: 'Duplicate Name', // Same name as EPA-01
          focusArea: 'Test',
          tier: 'Core',
          description:
            'Second EPA with same name for testing duplicate detection.',
          portRange: '3004-3006',
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_EPA_DUPLICATE_NAME'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('error');
    });

    it('should detect duplicate CPA names', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-1',
          name: 'Same Name',
          focusArea: 'Test',
          primaryIntegration: 'Test',
          careerStage: 'Foundation',
          executiveSummary:
            'First CPA with this name for testing duplicate detection.',
          aiIntegration: 'Test AI',
          keyEPAs: ['EPA-01'],
        },
        {
          id: 'CPA-2',
          name: 'Same Name',
          focusArea: 'Test',
          primaryIntegration: 'Test',
          careerStage: 'Foundation',
          executiveSummary:
            'Second CPA with same name for testing duplicate detection.',
          aiIntegration: 'Test AI',
          keyEPAs: ['EPA-01'],
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_CPA_DUPLICATE_NAME'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should detect duplicate Domain names', async () => {
      const data = createValidData();
      data.domains = [
        {
          id: 'D01',
          name: 'Duplicate Domain',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: 'First domain with this name for testing duplicates.',
          totalKSBs: 50,
          hasAssessment: true,
        },
        {
          id: 'D02',
          name: 'Duplicate Domain',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: 'Second domain with same name for testing duplicates.',
          totalKSBs: 50,
          hasAssessment: true,
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_DOMAIN_DUPLICATE_NAME'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Name Minimum Length', () => {
    it('should detect EPA names that are too short', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'ABC', // Too short (< 5 chars)
          focusArea: 'Test',
          tier: 'Core',
          description:
            'An EPA with a very short name for testing length validation.',
          portRange: '3001-3003',
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_EPA_SHORT_NAME'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('PV Terminology', () => {
    it('should note when EPA description lacks PV terminology', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Generic Process',
          focusArea: 'Generic',
          tier: 'Core',
          description:
            'This is a completely generic description without any domain-specific terminology about the field.',
          portRange: '3001-3003',
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_EPA_NO_PV_TERMS'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('info');
    });

    it('should pass when EPA description contains PV terminology', async () => {
      const data = createValidData();
      // Valid EPAs from fixtures should contain PV terms
      const result = await contentQualityValidator.validate(data);

      // Should not flag our valid fixtures
      const pvTermIssues = result.issues.filter(
        (i) =>
          i.code === 'QUAL_EPA_NO_PV_TERMS' &&
          i.entityId != null && ['EPA-01', 'EPA-10', 'EPA-21'].includes(i.entityId)
      );
      expect(pvTermIssues).toHaveLength(0);
    });
  });

  describe('Focus Area Validation', () => {
    it('should warn about empty focus areas', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Test EPA',
          focusArea: '', // Empty
          tier: 'Core',
          description:
            'An EPA with empty focus area for testing validation.',
          portRange: '3001-3003',
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_EPA_EMPTY_FOCUS'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('AI Integration Field', () => {
    it('should warn about empty AI integration fields', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-1',
          name: 'Test CPA',
          focusArea: 'Test',
          primaryIntegration: 'Test',
          careerStage: 'Foundation',
          executiveSummary:
            'A complete executive summary that meets the minimum length requirements.',
          aiIntegration: '', // Empty
          keyEPAs: ['EPA-01'],
        },
      ];

      const result = await contentQualityValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'QUAL_CPA_EMPTY_AI'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Placeholder Detection', () => {
    it('should detect various placeholder patterns', async () => {
      const placeholders = ['TBD', 'TODO', 'N/A', '[placeholder]', '---'];

      for (const placeholder of placeholders) {
        const data = createValidData();
        data.epas = [
          {
            id: 'EPA-01',
            name: 'Test EPA',
            focusArea: 'Test',
            tier: 'Core',
            description: placeholder,
            portRange: '3001-3003',
          },
        ];

        const result = await contentQualityValidator.validate(data);

        const issues = result.issues.filter(
          (i) => i.code === 'QUAL_EPA_EMPTY_DESC'
        );
        expect(issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const data = createValidData();
      const result = await contentQualityValidator.validate(data);

      expect(result.duration).toBeLessThan(1000);
    });
  });
});
