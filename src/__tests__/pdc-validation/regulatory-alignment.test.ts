/**
 * Regulatory Alignment Validator Unit Tests
 *
 * Tests regulatory reference validation:
 * - ICH guideline format parsing
 * - Deprecated guideline detection
 * - FDA/EMA reference validation
 * - Regulatory coverage analysis
 */

import {
  regulatoryAlignmentValidator,
  parseICHReference,
  parseFDAReference,
  parseGVPReference,
  classifyReference,
  ICH_E_GUIDELINES,
  GVP_MODULES,
} from '../../../scripts/validation/content-validation/regulatory-alignment';
import type { PDCData, KSB } from '../../../scripts/validation/content-validation/types';

describe('Regulatory Alignment Validator', () => {
  // Helper to create minimal valid data
  const createMinimalData = (): PDCData => ({
    epas: [
      {
        id: 'EPA-01',
        name: 'Test EPA',
        focusArea: 'Testing',
        tier: 'Core',
        description: 'Test pharmacovigilance description.',
        portRange: '3001-3003',
      },
    ],
    cpas: [
      {
        id: 'CPA-1',
        name: 'Test CPA',
        focusArea: 'Testing',
        primaryIntegration: 'Test',
        careerStage: 'Entry',
        executiveSummary: 'A summary of the pharmacovigilance pathway.',
        aiIntegration: 'AI integration for safety signal detection.',
        keyEPAs: ['EPA-01'],
        prerequisite: undefined,
      },
    ],
    domains: [
      {
        id: 'D01',
        name: 'Regulatory Compliance',
        thematicCluster: 1,
        clusterName: 'Foundational',
        definition: 'Test domain definition.',
        totalKSBs: 10,
        hasAssessment: true,
      },
    ],
    epaDomainMappings: [
      { epaId: 'EPA-01', domainId: 'D01', role: 'Primary', level: 'L3' },
    ],
    cpaEpaMappings: [
      { cpaId: 'CPA-1', epaId: 'EPA-01', relationship: 'Core' },
    ],
    cpaDomainMappings: [],
    ksbs: [],
    activityAnchors: [],
    metadata: {
      version: '4.1',
      exportedAt: new Date().toISOString(),
    },
  });

  // Helper to create a KSB with regulatory refs
  const createKSB = (
    id: string,
    domainId: string,
    regulatoryRefs: string[] = []
  ): KSB => ({
    id,
    domainId,
    type: 'Knowledge',
    majorSection: 'Test',
    section: 'Test',
    itemName: 'Test KSB',
    itemDescription: 'Test description for pharmacovigilance.',
    proficiencyLevel: 'L3',
    bloomLevel: 'Apply',
    keywords: ['pharmacovigilance'],
    epaIds: ['EPA-01'],
    cpaIds: ['CPA-1'],
    regulatoryRefs,
    status: 'active',
  });

  describe('Basic Properties', () => {
    it('should have correct name and layer', () => {
      expect(regulatoryAlignmentValidator.name).toBe('Regulatory Alignment Validation');
      expect(regulatoryAlignmentValidator.layer).toBe('regulatory-alignment');
    });

    it('should return a valid LayerResult structure', async () => {
      const data = createMinimalData();
      const result = await regulatoryAlignmentValidator.validate(data);

      expect(result).toHaveProperty('layer', 'regulatory-alignment');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checksRun');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('ICH Reference Parsing', () => {
    it('should parse full ICH format correctly', () => {
      const result = parseICHReference('ICH E2A');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('ICH E2A');
      expect(result.guideline).toBe('E2A');
      expect(result.current).toBe(true);
    });

    it('should parse ICH with revision number', () => {
      const result = parseICHReference('ICH E2B(R3)');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('ICH E2B(R3)');
      expect(result.guideline).toBe('E2B(R3)');
      expect(result.current).toBe(true);
    });

    it('should parse short form ICH references', () => {
      const result = parseICHReference('E2C(R2)');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('ICH E2C(R2)');
      expect(result.guideline).toBe('E2C(R2)');
    });

    it('should identify deprecated guidelines', () => {
      const result = parseICHReference('E2B');
      expect(result.valid).toBe(true);
      expect(result.current).toBe(false);
      expect(result.supersededBy).toBe('E2B(R3)');
    });

    it('should identify superseded E6 guidelines', () => {
      const result = parseICHReference('ICH E6');
      expect(result.valid).toBe(true);
      expect(result.current).toBe(false);
      expect(result.supersededBy).toBe('E6(R2)');
    });

    it('should reject invalid ICH formats', () => {
      const result = parseICHReference('ICH Z99');
      // The pattern only matches specific series letters (E, Q, S, M)
      // and the full regex requires exact format
      expect(result.valid).toBe(false);
    });
  });

  describe('FDA Reference Parsing', () => {
    it('should parse 21 CFR Part references', () => {
      const result = parseFDAReference('21 CFR Part 312');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('cfr');
    });

    it('should parse compact CFR format', () => {
      const result = parseFDAReference('21CFR312.32');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('cfr');
    });

    it('should parse FDA system references', () => {
      const faers = parseFDAReference('FAERS');
      expect(faers.valid).toBe(true);
      expect(faers.type).toBe('system');

      const medwatch = parseFDAReference('MedWatch');
      expect(medwatch.valid).toBe(true);
      expect(medwatch.type).toBe('system');
    });

    it('should reject invalid FDA formats', () => {
      const result = parseFDAReference('FDA Guidelines');
      expect(result.valid).toBe(false);
    });
  });

  describe('GVP Reference Parsing', () => {
    it('should parse GVP Module Roman numerals', () => {
      const result = parseGVPReference('GVP Module VI');
      expect(result.valid).toBe(true);
      expect(result.module).toBe('VI');
      expect(result.name).toBe('Collection, management and submission of reports of suspected adverse reactions');
    });

    it('should parse GVP Module letters', () => {
      const result = parseGVPReference('GVP Module P');
      expect(result.valid).toBe(true);
      expect(result.module).toBe('P');
      expect(result.name).toBe('Core concepts in pharmacovigilance');
    });

    it('should handle case variations', () => {
      const result = parseGVPReference('gvp module ix');
      expect(result.valid).toBe(true);
      expect(result.module).toBe('IX');
      expect(result.name).toBe('Signal management');
    });

    it('should reject invalid GVP formats', () => {
      const result = parseGVPReference('GVP 5');
      expect(result.valid).toBe(false);
    });
  });

  describe('Reference Classification', () => {
    it('should classify ICH references', () => {
      const result = classifyReference('ICH E2E');
      expect(result.type).toBe('ich');
      expect(result.parsed.valid).toBe(true);
    });

    it('should classify FDA references', () => {
      const result = classifyReference('21 CFR Part 312');
      expect(result.type).toBe('fda');
      expect(result.parsed.valid).toBe(true);
    });

    it('should classify EMA/GVP references', () => {
      const result = classifyReference('GVP Module VII');
      expect(result.type).toBe('ema');
      expect(result.parsed.valid).toBe(true);
    });

    it('should mark unknown references', () => {
      const result = classifyReference('Some Random Text');
      expect(result.type).toBe('unknown');
      expect(result.parsed.valid).toBe(false);
    });
  });

  describe('Deprecated ICH Detection', () => {
    it('should warn when using deprecated ICH references', async () => {
      const data = createMinimalData();
      data.ksbs = [
        createKSB('KSB-D01-K0001', 'D01', ['E2B']), // Deprecated, superseded by E2B(R3)
      ];

      const result = await regulatoryAlignmentValidator.validate(data);

      const deprecatedIssues = result.issues.filter(
        (i) => i.code === 'REG_DEPRECATED_ICH'
      );
      expect(deprecatedIssues.length).toBeGreaterThan(0);
      expect(deprecatedIssues[0].severity).toBe('warning');
      expect(deprecatedIssues[0].message).toContain('E2B(R3)');
    });

    it('should pass when using current ICH references', async () => {
      const data = createMinimalData();
      data.ksbs = [
        createKSB('KSB-D01-K0001', 'D01', ['ICH E2B(R3)', 'ICH E2C(R2)']),
      ];

      const result = await regulatoryAlignmentValidator.validate(data);

      const deprecatedIssues = result.issues.filter(
        (i) => i.code === 'REG_DEPRECATED_ICH'
      );
      expect(deprecatedIssues).toHaveLength(0);
    });
  });

  describe('Unknown Reference Format Detection', () => {
    it('should warn about unknown reference formats', async () => {
      const data = createMinimalData();
      data.ksbs = [
        createKSB('KSB-D01-K0001', 'D01', ['BananaOgy Standard']),
      ];

      const result = await regulatoryAlignmentValidator.validate(data);

      const unknownIssues = result.issues.filter(
        (i) => i.code === 'REG_UNKNOWN_FORMAT'
      );
      expect(unknownIssues.length).toBeGreaterThan(0);
      expect(unknownIssues[0].severity).toBe('warning');
    });

    it('should accept references mentioning regulatory authorities', async () => {
      const data = createMinimalData();
      data.ksbs = [
        createKSB('KSB-D01-K0001', 'D01', ['FDA Guidance Document']),
      ];

      const result = await regulatoryAlignmentValidator.validate(data);

      const unknownIssues = result.issues.filter(
        (i) => i.code === 'REG_UNKNOWN_FORMAT' && i.entityId === 'KSB-D01-K0001'
      );
      expect(unknownIssues).toHaveLength(0);
    });
  });

  describe('Regulatory Coverage Analysis', () => {
    it('should warn when regulatory-critical domain has low coverage', async () => {
      const data = createMinimalData();
      // Domain D01 is "Regulatory Compliance" with thematicCluster 1
      // Add 10 KSBs, only 2 with refs (20% coverage)
      data.ksbs = [
        createKSB('KSB-D01-K0001', 'D01', ['ICH E2A']),
        createKSB('KSB-D01-K0002', 'D01', ['ICH E2B(R3)']),
        createKSB('KSB-D01-K0003', 'D01', []),
        createKSB('KSB-D01-K0004', 'D01', []),
        createKSB('KSB-D01-K0005', 'D01', []),
        createKSB('KSB-D01-K0006', 'D01', []),
        createKSB('KSB-D01-K0007', 'D01', []),
        createKSB('KSB-D01-K0008', 'D01', []),
        createKSB('KSB-D01-K0009', 'D01', []),
        createKSB('KSB-D01-K0010', 'D01', []),
      ];

      const result = await regulatoryAlignmentValidator.validate(data);

      const coverageIssues = result.issues.filter(
        (i) => i.code === 'REG_LOW_COVERAGE'
      );
      expect(coverageIssues.length).toBeGreaterThan(0);
      expect(coverageIssues[0].severity).toBe('warning');
    });

    it('should pass when coverage meets threshold', async () => {
      const data = createMinimalData();
      // 6 of 10 KSBs with refs (60% coverage)
      data.ksbs = [
        createKSB('KSB-D01-K0001', 'D01', ['ICH E2A']),
        createKSB('KSB-D01-K0002', 'D01', ['ICH E2B(R3)']),
        createKSB('KSB-D01-K0003', 'D01', ['ICH E2C(R2)']),
        createKSB('KSB-D01-K0004', 'D01', ['ICH E2D']),
        createKSB('KSB-D01-K0005', 'D01', ['ICH E2E']),
        createKSB('KSB-D01-K0006', 'D01', ['GVP Module VI']),
        createKSB('KSB-D01-K0007', 'D01', []),
        createKSB('KSB-D01-K0008', 'D01', []),
        createKSB('KSB-D01-K0009', 'D01', []),
        createKSB('KSB-D01-K0010', 'D01', []),
      ];

      const result = await regulatoryAlignmentValidator.validate(data);

      const coverageIssues = result.issues.filter(
        (i) => i.code === 'REG_LOW_COVERAGE'
      );
      expect(coverageIssues).toHaveLength(0);
    });
  });

  describe('Terminology Consistency', () => {
    it('should suggest abbreviations for expanded terms', async () => {
      const data = createMinimalData();
      data.epas[0].description =
        'Understanding individual case safety report handling and submission requirements.';

      const result = await regulatoryAlignmentValidator.validate(data);

      const termIssues = result.issues.filter(
        (i) => i.code === 'REG_TERM_EXPANSION'
      );
      expect(termIssues.length).toBeGreaterThan(0);
      expect(termIssues[0].severity).toBe('info');
      expect(termIssues[0].message).toContain('ICSR');
    });
  });

  describe('ICH E2E Coverage', () => {
    it('should inform when no E2E references exist', async () => {
      const data = createMinimalData();
      data.ksbs = [
        createKSB('KSB-D01-K0001', 'D01', ['ICH E2A', 'ICH E2B(R3)']),
      ];

      const result = await regulatoryAlignmentValidator.validate(data);

      const e2eIssues = result.issues.filter(
        (i) => i.code === 'REG_NO_E2E_REFS'
      );
      expect(e2eIssues.length).toBeGreaterThan(0);
      expect(e2eIssues[0].severity).toBe('info');
    });

    it('should pass when E2E reference exists', async () => {
      const data = createMinimalData();
      data.ksbs = [
        createKSB('KSB-D01-K0001', 'D01', ['ICH E2E']),
      ];

      const result = await regulatoryAlignmentValidator.validate(data);

      const e2eIssues = result.issues.filter(
        (i) => i.code === 'REG_NO_E2E_REFS'
      );
      expect(e2eIssues).toHaveLength(0);
    });
  });

  describe('Section Consistency', () => {
    it('should flag inconsistent regulatory refs within section', async () => {
      const data = createMinimalData();
      // 4 KSBs in same section, 3 with refs, 1 without
      const baseKsb = createKSB('KSB-D01-K0001', 'D01', ['ICH E2A']);
      data.ksbs = [
        { ...baseKsb, id: 'KSB-D01-K0001', regulatoryRefs: ['ICH E2A'] },
        { ...baseKsb, id: 'KSB-D01-K0002', regulatoryRefs: ['ICH E2B(R3)'] },
        { ...baseKsb, id: 'KSB-D01-K0003', regulatoryRefs: ['ICH E2C(R2)'] },
        { ...baseKsb, id: 'KSB-D01-K0004', regulatoryRefs: [] }, // No refs
      ];

      const result = await regulatoryAlignmentValidator.validate(data);

      const inconsistentIssues = result.issues.filter(
        (i) => i.code === 'REG_INCONSISTENT_SECTION'
      );
      expect(inconsistentIssues.length).toBeGreaterThan(0);
      expect(inconsistentIssues[0].entityId).toBe('KSB-D01-K0004');
    });
  });

  describe('Data Constants', () => {
    it('should have complete ICH E-series guidelines', () => {
      const pvGuidelines = ['E2A', 'E2B(R3)', 'E2C(R2)', 'E2D', 'E2E', 'E2F'];
      for (const guideline of pvGuidelines) {
        expect(ICH_E_GUIDELINES).toHaveProperty(guideline);
        expect(ICH_E_GUIDELINES[guideline].current).toBe(true);
      }
    });

    it('should have complete GVP modules', () => {
      const coreModules = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
      for (const module of coreModules) {
        expect(GVP_MODULES).toHaveProperty(module);
      }
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const data = createMinimalData();
      // Add 100 KSBs with mixed regulatory refs
      data.ksbs = Array.from({ length: 100 }, (_, i) =>
        createKSB(
          `KSB-D01-K${String(i + 1).padStart(4, '0')}`,
          'D01',
          i % 2 === 0 ? ['ICH E2A', 'GVP Module VI'] : []
        )
      );

      const result = await regulatoryAlignmentValidator.validate(data);

      expect(result.duration).toBeLessThan(1000);
    });
  });
});
