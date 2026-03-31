/**
 * Semantic Validator Unit Tests
 *
 * Tests meaning-based validation:
 * - Bloom-Proficiency alignment
 * - Terminology consistency
 * - Activity anchor progression
 * - Description coherence
 */

import { semanticValidator } from '../../../scripts/validation/content-validation/semantic';
import type { PDCData } from '../../../scripts/validation/content-validation/types';

describe('Semantic Validator', () => {
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
        name: 'Test Domain',
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

  describe('Basic Properties', () => {
    it('should have correct name and layer', () => {
      expect(semanticValidator.name).toBe('Semantic Validation');
      expect(semanticValidator.layer).toBe('semantic');
    });

    it('should return a valid LayerResult structure', async () => {
      const data = createMinimalData();
      const result = await semanticValidator.validate(data);

      expect(result).toHaveProperty('layer', 'semantic');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checksRun');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('Bloom-Proficiency Alignment', () => {
    it('should pass when Bloom aligns with proficiency', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'Identify and recognize the key pharmacovigilance terms.',
          proficiencyLevel: 'L1', // L1 expects Remember (1) or Understand (2)
          bloomLevel: 'Remember', // Level 1 - matches L1
          keywords: ['pharmacovigilance'],
          epaIds: ['EPA-01'],
          cpaIds: ['CPA-1'],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await semanticValidator.validate(data);

      const alignmentIssues = result.issues.filter(
        (i) => i.code === 'SEM_BLOOM_PROF_MISMATCH'
      );
      expect(alignmentIssues).toHaveLength(0);
    });

    it('should warn when Bloom is misaligned with proficiency', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'Create a comprehensive pharmacovigilance system.',
          proficiencyLevel: 'L1', // L1 expects Remember/Understand
          bloomLevel: 'Create', // Level 6 - too high for L1!
          keywords: ['pharmacovigilance'],
          epaIds: ['EPA-01'],
          cpaIds: ['CPA-1'],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await semanticValidator.validate(data);

      const alignmentIssues = result.issues.filter(
        (i) => i.code === 'SEM_BLOOM_PROF_MISMATCH'
      );
      expect(alignmentIssues.length).toBeGreaterThan(0);
      expect(alignmentIssues[0].severity).toBe('warning');
    });

    it('should detect verb-Bloom mismatch in description', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          // Description uses "design" (Create level 6) but Bloom is Remember
          itemDescription: 'Design and develop a pharmacovigilance monitoring system.',
          proficiencyLevel: 'L5', // High level
          bloomLevel: 'Remember', // But low Bloom level - mismatch
          keywords: ['pharmacovigilance'],
          epaIds: ['EPA-01'],
          cpaIds: ['CPA-1'],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await semanticValidator.validate(data);

      const verbIssues = result.issues.filter(
        (i) => i.code === 'SEM_BLOOM_VERB_MISMATCH'
      );
      expect(verbIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Terminology Consistency', () => {
    it('should detect PV terminology misspellings in KSBs', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          // Contains misspelling: "pharmacovigilence"
          itemDescription: 'Understand pharmacovigilence principles and saftey monitoring.',
          proficiencyLevel: 'L2',
          bloomLevel: 'Understand',
          keywords: ['pharmacovigilance'],
          epaIds: ['EPA-01'],
          cpaIds: ['CPA-1'],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await semanticValidator.validate(data);

      const misspellingIssues = result.issues.filter(
        (i) => i.code === 'SEM_TERMINOLOGY_MISSPELLING'
      );
      expect(misspellingIssues.length).toBeGreaterThanOrEqual(2); // pharmacovigilence + saftey
    });

    it('should detect misspellings in EPA descriptions', async () => {
      const data = createMinimalData();
      // Add misspelling to EPA
      data.epas[0].description = 'Understand pharmacovigilence and advese event reporting.';

      const result = await semanticValidator.validate(data);

      const misspellingIssues = result.issues.filter(
        (i) => i.code === 'SEM_TERMINOLOGY_MISSPELLING' && i.entity === 'EPA'
      );
      expect(misspellingIssues.length).toBeGreaterThan(0);
    });

    it('should pass when terminology is correct', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'Understand pharmacovigilance principles and safety monitoring.',
          proficiencyLevel: 'L2',
          bloomLevel: 'Understand',
          keywords: ['pharmacovigilance'],
          epaIds: ['EPA-01'],
          cpaIds: ['CPA-1'],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await semanticValidator.validate(data);

      const misspellingIssues = result.issues.filter(
        (i) => i.code === 'SEM_TERMINOLOGY_MISSPELLING'
      );
      expect(misspellingIssues).toHaveLength(0);
    });
  });

  describe('Activity Anchor Progression', () => {
    it('should warn when high-level anchor has simple language', async () => {
      const data = createMinimalData();
      data.activityAnchors = [
        {
          domainId: 'D01',
          proficiencyLevel: 'L5++',
          levelName: 'Master',
          anchorNumber: 1,
          // Very simple language for L5++ (Master level)
          activityDescription: 'Do things. Help people.',
          observableBehaviors: 'Works.',
          evidenceTypes: ['observation'],
        },
      ];

      const result = await semanticValidator.validate(data);

      const complexityIssues = result.issues.filter(
        (i) => i.code === 'SEM_ANCHOR_LOW_COMPLEXITY'
      );
      expect(complexityIssues.length).toBeGreaterThan(0);
    });

    it('should pass when anchor complexity matches level', async () => {
      const data = createMinimalData();
      data.activityAnchors = [
        {
          domainId: 'D01',
          proficiencyLevel: 'L5',
          levelName: 'Expert',
          anchorNumber: 1,
          activityDescription:
            'Independently design and implement comprehensive pharmacovigilance systems that integrate signal detection methodologies with risk management strategies across multiple therapeutic areas.',
          observableBehaviors:
            'Demonstrates strategic leadership in developing organizational pharmacovigilance capabilities while mentoring junior practitioners.',
          evidenceTypes: ['portfolio', 'peer review'],
        },
      ];

      const result = await semanticValidator.validate(data);

      const complexityIssues = result.issues.filter(
        (i) => i.code === 'SEM_ANCHOR_LOW_COMPLEXITY'
      );
      expect(complexityIssues).toHaveLength(0);
    });
  });

  describe('Description Coherence', () => {
    it('should flag Knowledge KSB using skill-oriented verbs', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge', // Marked as Knowledge
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          // But uses skill-oriented language
          itemDescription: 'Perform and execute adverse event reporting procedures.',
          proficiencyLevel: 'L3',
          bloomLevel: 'Apply',
          keywords: ['reporting'],
          epaIds: ['EPA-01'],
          cpaIds: ['CPA-1'],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await semanticValidator.validate(data);

      const coherenceIssues = result.issues.filter(
        (i) => i.code === 'SEM_KSB_TYPE_MISMATCH'
      );
      expect(coherenceIssues.length).toBeGreaterThan(0);
    });

    it('should flag Skill KSB lacking action verbs', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-S0001',
          domainId: 'D01',
          type: 'Skill', // Marked as Skill
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          // But uses knowledge-oriented language
          itemDescription: 'The regulatory requirements for adverse event reporting.',
          proficiencyLevel: 'L3',
          bloomLevel: 'Apply',
          keywords: ['reporting'],
          epaIds: ['EPA-01'],
          cpaIds: ['CPA-1'],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await semanticValidator.validate(data);

      const coherenceIssues = result.issues.filter(
        (i) => i.code === 'SEM_KSB_TYPE_MISMATCH'
      );
      expect(coherenceIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const data = createMinimalData();
      const result = await semanticValidator.validate(data);

      expect(result.duration).toBeLessThan(1000);
    });
  });
});
