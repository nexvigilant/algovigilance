/**
 * Coverage Analysis Validator Unit Tests
 *
 * Tests distribution and coverage metrics:
 * - Domains per EPA
 * - EPAs per CPA
 * - Thematic cluster balance
 * - Level distribution
 */

import {
  coverageAnalysisValidator,
  calculateCoverageMetrics,
} from '../../../scripts/validation/content-validation/coverage-analysis';
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

describe('Coverage Analysis Validator', () => {
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
      expect(coverageAnalysisValidator.name).toBe('Coverage Analysis');
      expect(coverageAnalysisValidator.layer).toBe('coverage-analysis');
    });

    it('should return a valid LayerResult structure', async () => {
      const data = createValidData();
      const result = await coverageAnalysisValidator.validate(data);

      expect(result).toHaveProperty('layer', 'coverage-analysis');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checksRun');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('Domains per EPA Analysis', () => {
    it('should warn when average domains per EPA is low', async () => {
      const data = createValidData();
      // Create EPAs with minimal domain coverage
      data.epas = Array.from({ length: 10 }, (_, i) => ({
        id: `EPA-${String(i + 1).padStart(2, '0')}`,
        name: `Test EPA ${i + 1}`,
        focusArea: 'Test',
        tier: 'Core',
        description: 'Test EPA with low domain coverage.',
        portRange: `300${i}-300${i + 2}`,
      }));
      data.epaDomainMappings = data.epas.map((epa) => ({
        epaId: epa.id,
        domainId: 'D01', // Only one domain each
        role: 'Primary',
        level: 'L3',
      }));

      const result = await coverageAnalysisValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COV_LOW_DOMAINS_PER_EPA'
      );
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should note EPAs with very low or high domain coverage', async () => {
      const data = createValidData();
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Low Coverage EPA',
          focusArea: 'Test',
          tier: 'Core',
          description: 'EPA with minimal domain coverage.',
          portRange: '3001-3003',
        },
        {
          id: 'EPA-02',
          name: 'High Coverage EPA',
          focusArea: 'Test',
          tier: 'Core',
          description: 'EPA with extensive domain coverage.',
          portRange: '3004-3006',
        },
      ];
      data.domains = validDomains;
      data.epaDomainMappings = [
        { epaId: 'EPA-01', domainId: 'D01', role: 'Primary', level: 'L3' },
        // EPA-01 has only 1 domain (low coverage)
        ...validDomains.map((d) => ({
          epaId: 'EPA-02',
          domainId: d.id,
          role: 'Primary' as const,
          level: 'L3',
        })),
        // EPA-02 has all domains (high coverage)
      ];

      const result = await coverageAnalysisValidator.validate(data);

      const lowCoverageIssues = result.issues.filter(
        (i) => i.code === 'COV_EPA_LOW_DOMAINS' && i.entityId === 'EPA-01'
      );
      expect(lowCoverageIssues.length).toBeGreaterThan(0);
    });
  });

  describe('EPAs per CPA Analysis', () => {
    it('should warn when average EPAs per CPA is low', async () => {
      const data = createValidData();
      // Create CPAs with minimal EPA coverage
      data.cpas = Array.from({ length: 5 }, (_, i) => ({
        id: `CPA-${i + 1}`,
        name: `Test CPA ${i + 1}`,
        focusArea: 'Test',
        primaryIntegration: 'Test',
        careerStage: 'Foundation',
        executiveSummary: 'Test CPA with low EPA coverage.',
        aiIntegration: 'Test AI',
        keyEPAs: ['EPA-01'],
      }));
      data.cpaEpaMappings = data.cpas.map((cpa) => ({
        cpaId: cpa.id,
        epaId: 'EPA-01', // Only one EPA each
        relationship: 'Key EPA',
      }));

      const result = await coverageAnalysisValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COV_LOW_EPAS_PER_CPA'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Domain EPA Coverage', () => {
    it('should warn when domain has no EPA references', async () => {
      const data = createValidData();
      data.domains = [
        {
          id: 'D01',
          name: 'Covered Domain',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: 'Domain with EPA references.',
          totalKSBs: 50,
          hasAssessment: true,
        },
        {
          id: 'D99',
          name: 'Orphan Domain',
          thematicCluster: 1,
          clusterName: 'Foundational Domains',
          definition: 'Domain without any EPA references.',
          totalKSBs: 50,
          hasAssessment: true,
        },
      ];
      data.epaDomainMappings = [
        { epaId: 'EPA-01', domainId: 'D01', role: 'Primary', level: 'L3' },
        // D99 has no mappings
      ];

      const result = await coverageAnalysisValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COV_DOMAIN_NO_EPAS' && i.entityId === 'D99'
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('warning');
    });
  });

  describe('Tier Distribution', () => {
    it('should warn when tier counts differ from expected', async () => {
      const data = createValidData();
      // Create EPAs with wrong tier distribution
      data.epas = [
        {
          id: 'EPA-01',
          name: 'Only Core EPA',
          focusArea: 'Test',
          tier: 'Core',
          description: 'The only Core EPA for testing tier distribution.',
          portRange: '3001-3003',
        },
      ];

      const result = await coverageAnalysisValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COV_TIER_COUNT_MISMATCH'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Level Distribution', () => {
    it('should note when L3 level is underrepresented', async () => {
      const data = createValidData();
      // Create mappings with L3 underrepresented
      data.epaDomainMappings = [
        { epaId: 'EPA-01', domainId: 'D01', role: 'Primary', level: 'L2' },
        { epaId: 'EPA-01', domainId: 'D08', role: 'Supporting', level: 'L2' },
        { epaId: 'EPA-10', domainId: 'D01', role: 'Primary', level: 'L4' },
        { epaId: 'EPA-10', domainId: 'D08', role: 'Primary', level: 'L4' },
        { epaId: 'EPA-21', domainId: 'D08', role: 'Primary', level: 'L5' },
        // No L3 mappings
      ];

      const result = await coverageAnalysisValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COV_L3_UNDERREPRESENTED'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Role Distribution', () => {
    it('should note when Primary/Supporting ratio is imbalanced', async () => {
      const data = createValidData();
      // Create mappings with only Primary roles
      data.epaDomainMappings = Array.from({ length: 10 }, (_, i) => ({
        epaId: 'EPA-01',
        domainId: `D${String(i + 1).padStart(2, '0')}`,
        role: 'Primary' as const, // 100% Primary
        level: 'L3',
      }));

      const result = await coverageAnalysisValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COV_ROLE_IMBALANCED'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('CPA-8 Capstone Coverage', () => {
    it('should note when CPA-8 does not cover all domains', async () => {
      const data = createValidData();
      data.cpas = [
        {
          id: 'CPA-8',
          name: 'Strategic PV Leadership',
          focusArea: 'Executive Leadership',
          primaryIntegration: 'Strategy',
          careerStage: 'Executive',
          executiveSummary: 'Executive-level pharmacovigilance leadership.',
          aiIntegration: 'AI-driven strategic support.',
          keyEPAs: ['EPA-10', 'EPA-15'],
        },
      ];
      data.cpaDomainMappings = [
        { cpaId: 'CPA-8', domainId: 'D01' },
        // Only covers D01, not all domains
      ];

      const result = await coverageAnalysisValidator.validate(data);

      const issues = result.issues.filter(
        (i) => i.code === 'COV_CAPSTONE_INCOMPLETE'
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Coverage Summary', () => {
    it('should include coverage summary in issues', async () => {
      const data = createValidData();
      const result = await coverageAnalysisValidator.validate(data);

      const summaryIssues = result.issues.filter(
        (i) => i.code === 'COV_SUMMARY'
      );
      expect(summaryIssues.length).toBe(1);
      expect(summaryIssues[0].severity).toBe('info');
      expect(summaryIssues[0].actual).toContain('Domains/EPA');
    });
  });

  describe('Empty Data Handling', () => {
    it('should handle empty data gracefully', async () => {
      const data = edgeCases.emptyData;
      const result = await coverageAnalysisValidator.validate(data);

      expect(result).toBeDefined();
      expect(result.checksRun).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const data = createValidData();
      const result = await coverageAnalysisValidator.validate(data);

      expect(result.duration).toBeLessThan(1000);
    });
  });
});

describe('calculateCoverageMetrics', () => {
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

  it('should return CoverageMetrics structure', () => {
    const data = createValidData();
    const metrics = calculateCoverageMetrics(data);

    expect(metrics).toHaveProperty('domainsPerEPA');
    expect(metrics).toHaveProperty('epasPerCPA');
    expect(metrics).toHaveProperty('epasPerDomain');
    expect(metrics).toHaveProperty('thematicClusters');
    expect(metrics).toHaveProperty('tierDistribution');
    expect(metrics).toHaveProperty('levelDistribution');
  });

  it('should calculate domainsPerEPA correctly', () => {
    const data = createValidData();
    const metrics = calculateCoverageMetrics(data);

    expect(metrics.domainsPerEPA).toHaveProperty('avg');
    expect(metrics.domainsPerEPA).toHaveProperty('min');
    expect(metrics.domainsPerEPA).toHaveProperty('max');
    expect(metrics.domainsPerEPA).toHaveProperty('distribution');
    expect(typeof metrics.domainsPerEPA.avg).toBe('number');
  });

  it('should calculate tier distribution correctly', () => {
    const data = createValidData();
    const metrics = calculateCoverageMetrics(data);

    expect(metrics.tierDistribution).toHaveProperty('Core');
    // Should count EPAs by tier
    const totalInTiers = Object.values(metrics.tierDistribution).reduce(
      (a, b) => a + b,
      0
    );
    expect(totalInTiers).toBe(data.epas.length);
  });

  it('should calculate level distribution correctly', () => {
    const data = createValidData();
    const metrics = calculateCoverageMetrics(data);

    // Should count mappings by level
    const totalLevelMappings = Object.values(metrics.levelDistribution).reduce(
      (a, b) => a + b,
      0
    );
    expect(totalLevelMappings).toBe(data.epaDomainMappings.length);
  });

  it('should calculate thematic clusters correctly', () => {
    const data = createValidData();
    const metrics = calculateCoverageMetrics(data);

    // Should have cluster entries
    const clusterCount = Object.keys(metrics.thematicClusters).length;
    expect(clusterCount).toBeGreaterThan(0);

    // Each cluster should have domain count and KSB count
    for (const cluster of Object.values(metrics.thematicClusters)) {
      expect(cluster).toHaveProperty('name');
      expect(cluster).toHaveProperty('domainCount');
      expect(cluster).toHaveProperty('totalKSBs');
    }
  });
});
