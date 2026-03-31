/**
 * Deep Entity Validator Unit Tests
 *
 * Tests granular validation of KSBs and Activity Anchors:
 * - ID format consistency
 * - Completeness by domain and level
 * - Cross-entity relationships
 * - Evidence types
 */

import { deepEntityValidator } from '../../../scripts/validation/content-validation/deep-entity';
import type { PDCData } from '../../../scripts/validation/content-validation/types';

describe('Deep Entity Validator', () => {
  // Helper to create minimal valid data
  const createMinimalData = (): PDCData => ({
    epas: [
      {
        id: 'EPA-01',
        name: 'Test EPA',
        focusArea: 'Testing',
        tier: 'Core',
        description: 'Test description.',
        portRange: '3001-3003',
      },
    ],
    cpas: [],
    domains: [
      {
        id: 'D01',
        name: 'Test Domain',
        thematicCluster: 1,
        clusterName: 'Foundational',
        definition: 'Test domain definition.',
        totalKSBs: 50,
        hasAssessment: true,
      },
    ],
    epaDomainMappings: [],
    cpaEpaMappings: [],
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
      expect(deepEntityValidator.name).toBe('Deep Entity Validation');
      expect(deepEntityValidator.layer).toBe('business-rules');
    });

    it('should return a valid LayerResult structure', async () => {
      const data = createMinimalData();
      const result = await deepEntityValidator.validate(data);

      expect(result).toHaveProperty('layer');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('checksRun');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('KSB ID Format Validation', () => {
    it('should pass for valid KSB ID format', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'A valid knowledge item description.',
          proficiencyLevel: 'L2',
          bloomLevel: 'Understand',
          keywords: ['test'],
          epaIds: ['EPA-01'],
          cpaIds: [],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const idFormatIssues = result.issues.filter(
        (i) => i.code === 'DEEP_KSB_ID_FORMAT'
      );
      expect(idFormatIssues).toHaveLength(0);
    });

    it('should error for invalid KSB ID format', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'INVALID-ID', // Wrong format
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'Description here.',
          proficiencyLevel: 'L2',
          bloomLevel: 'Understand',
          keywords: ['test'],
          epaIds: ['EPA-01'],
          cpaIds: [],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const idFormatIssues = result.issues.filter(
        (i) => i.code === 'DEEP_KSB_ID_FORMAT'
      );
      expect(idFormatIssues.length).toBeGreaterThan(0);
      expect(idFormatIssues[0].severity).toBe('error');
    });

    it('should error when KSB ID domain mismatches domainId', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D02-K0001', // Says D02
          domainId: 'D01', // But field says D01
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'Description here.',
          proficiencyLevel: 'L2',
          bloomLevel: 'Understand',
          keywords: ['test'],
          epaIds: ['EPA-01'],
          cpaIds: [],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const mismatchIssues = result.issues.filter(
        (i) => i.code === 'DEEP_KSB_DOMAIN_MISMATCH'
      );
      expect(mismatchIssues.length).toBeGreaterThan(0);
    });
  });

  describe('KSB Type Validation', () => {
    it('should pass for valid KSB types', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'Valid description.',
          proficiencyLevel: 'L2',
          bloomLevel: 'Understand',
          keywords: ['test'],
          epaIds: ['EPA-01'],
          cpaIds: [],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const typeIssues = result.issues.filter(
        (i) => i.code === 'DEEP_INVALID_KSB_TYPE'
      );
      expect(typeIssues).toHaveLength(0);
    });

    it('should error for invalid KSB type', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'InvalidType', // Not Knowledge, Skill, or Behavior
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'Description.',
          proficiencyLevel: 'L2',
          bloomLevel: 'Understand',
          keywords: ['test'],
          epaIds: ['EPA-01'],
          cpaIds: [],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const typeIssues = result.issues.filter(
        (i) => i.code === 'DEEP_INVALID_KSB_TYPE'
      );
      expect(typeIssues.length).toBeGreaterThan(0);
      expect(typeIssues[0].severity).toBe('error');
    });
  });

  describe('KSB-EPA Reference Validation', () => {
    it('should warn when KSB has no EPA references', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'Description here.',
          proficiencyLevel: 'L2',
          bloomLevel: 'Understand',
          keywords: ['test'],
          epaIds: [], // No EPAs
          cpaIds: [],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const noEpaIssues = result.issues.filter(
        (i) => i.code === 'DEEP_KSB_NO_EPA'
      );
      expect(noEpaIssues.length).toBeGreaterThan(0);
      expect(noEpaIssues[0].severity).toBe('warning');
    });

    it('should error when KSB references non-existent EPA', async () => {
      const data = createMinimalData();
      data.ksbs = [
        {
          id: 'KSB-D01-K0001',
          domainId: 'D01',
          type: 'Knowledge',
          majorSection: 'Test',
          section: 'Test',
          itemName: 'Test KSB',
          itemDescription: 'Description.',
          proficiencyLevel: 'L2',
          bloomLevel: 'Understand',
          keywords: ['test'],
          epaIds: ['EPA-99'], // Non-existent
          cpaIds: [],
          regulatoryRefs: [],
          status: 'active',
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const invalidRefIssues = result.issues.filter(
        (i) => i.code === 'DEEP_INVALID_KSB_EPA'
      );
      expect(invalidRefIssues.length).toBeGreaterThan(0);
      expect(invalidRefIssues[0].severity).toBe('error');
    });
  });

  describe('Activity Anchor Completeness', () => {
    it('should warn when domain has no Activity Anchors', async () => {
      const data = createMinimalData();
      // Domain exists but no anchors

      const result = await deepEntityValidator.validate(data);

      const noAnchorIssues = result.issues.filter(
        (i) => i.code === 'DEEP_NO_ANCHORS_FOR_DOMAIN'
      );
      expect(noAnchorIssues.length).toBeGreaterThan(0);
    });

    it('should warn when domain missing anchor levels', async () => {
      const data = createMinimalData();
      data.activityAnchors = [
        {
          domainId: 'D01',
          proficiencyLevel: 'L1', // Only L1
          levelName: 'Novice',
          anchorNumber: 1,
          activityDescription: 'Basic activity for novice practitioners in this domain.',
          observableBehaviors: 'Observable behaviors for this level.',
          evidenceTypes: ['observation'],
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const missingLevelIssues = result.issues.filter(
        (i) => i.code === 'DEEP_MISSING_ANCHOR_LEVELS'
      );
      expect(missingLevelIssues.length).toBeGreaterThan(0);
    });

    it('should pass when all levels covered', async () => {
      const data = createMinimalData();
      const levels = ['L1', 'L2', 'L3', 'L4', 'L5'];
      const levelNames = ['Novice', 'Beginner', 'Competent', 'Proficient', 'Expert'];

      data.activityAnchors = levels.map((level, i) => ({
        domainId: 'D01',
        proficiencyLevel: level,
        levelName: levelNames[i],
        anchorNumber: 1,
        activityDescription: `Activity for ${levelNames[i]} practitioners in this domain.`,
        observableBehaviors: `Observable behaviors for ${level}.`,
        evidenceTypes: ['observation', 'portfolio'],
      }));

      const result = await deepEntityValidator.validate(data);

      const missingLevelIssues = result.issues.filter(
        (i) => i.code === 'DEEP_MISSING_ANCHOR_LEVELS'
      );
      expect(missingLevelIssues).toHaveLength(0);
    });
  });

  describe('Activity Anchor Evidence Types', () => {
    it('should warn when anchor has no evidence types', async () => {
      const data = createMinimalData();
      data.activityAnchors = [
        {
          domainId: 'D01',
          proficiencyLevel: 'L1',
          levelName: 'Novice',
          anchorNumber: 1,
          activityDescription: 'Activity description here.',
          observableBehaviors: 'Observable behaviors.',
          evidenceTypes: [], // No evidence types
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const noEvidenceIssues = result.issues.filter(
        (i) => i.code === 'DEEP_ANCHOR_NO_EVIDENCE'
      );
      expect(noEvidenceIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Activity Anchor Content Quality', () => {
    it('should warn when activity description is too short', async () => {
      const data = createMinimalData();
      data.activityAnchors = [
        {
          domainId: 'D01',
          proficiencyLevel: 'L1',
          levelName: 'Novice',
          anchorNumber: 1,
          activityDescription: 'Too short.', // < 30 chars
          observableBehaviors: 'Observable behaviors here.',
          evidenceTypes: ['observation'],
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const shortDescIssues = result.issues.filter(
        (i) => i.code === 'DEEP_ANCHOR_SHORT_DESCRIPTION'
      );
      expect(shortDescIssues.length).toBeGreaterThan(0);
    });

    it('should warn when level name mismatches proficiency level', async () => {
      const data = createMinimalData();
      data.activityAnchors = [
        {
          domainId: 'D01',
          proficiencyLevel: 'L1', // L1 = Novice
          levelName: 'Expert', // Wrong name
          anchorNumber: 1,
          activityDescription: 'A description that is long enough to pass validation.',
          observableBehaviors: 'Observable behaviors here.',
          evidenceTypes: ['observation'],
        },
      ];

      const result = await deepEntityValidator.validate(data);

      const mismatchIssues = result.issues.filter(
        (i) => i.code === 'DEEP_ANCHOR_LEVEL_NAME_MISMATCH'
      );
      expect(mismatchIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const data = createMinimalData();
      const result = await deepEntityValidator.validate(data);

      expect(result.duration).toBeLessThan(1000);
    });
  });
});
