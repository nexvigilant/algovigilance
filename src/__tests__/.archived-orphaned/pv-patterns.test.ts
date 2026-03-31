/**
 * PV-Patterns Library Tests
 *
 * Verifies core functionality extracted from OpenRIMS-PV and ml-organ-tox
 */

import {
  // Types
  type ClassificationMetrics,

  // Enums
  ReportClassification,
  NaranjoCausality,
  TaskStatus,

  // Constants
  ICH_AGE_GROUPS,
  getE2BDoseUnit,
  getDrugCharacterization,

  // Calculators
  getAgeGroup,
  calculateAgeAtEvent,
  getAgeGroupFromMonths,

  // Metrics
  evaluatePredictions,
  buildConfusionMatrix,
  calculateBalancedAccuracy,
  formatMetrics,

  // Services
  createCausalityService,
  assessNaranjoCausality,
  createClassificationService,
  isSeriousAdverseEvent,

  // Version
  PV_PATTERNS_VERSION,
} from '../../packages/pharma-utils/src/pv-patterns/index';

describe('PV-Patterns Library', () => {
  describe('Version', () => {
    it('should export version', () => {
      expect(PV_PATTERNS_VERSION).toBe('0.1.0');
    });
  });

  describe('Enums', () => {
    describe('ReportClassification', () => {
      it('should have correct classifications', () => {
        expect(ReportClassification.AESI.id).toBe(1);
        expect(ReportClassification.SAE.id).toBe(2);
        expect(ReportClassification.ClinicallySignificant.id).toBe(3);
        expect(ReportClassification.Unclassified.id).toBe(4);
      });

      it('should list all classifications', () => {
        const all = ReportClassification.list();
        expect(all).toHaveLength(4);
      });

      it('should find by name', () => {
        const sae = ReportClassification.fromName('SAE');
        expect(sae.id).toBe(2);
      });

      it('should identify serious classifications', () => {
        expect(ReportClassification.AESI.isSerious()).toBe(true);
        expect(ReportClassification.SAE.isSerious()).toBe(true);
        expect(ReportClassification.ClinicallySignificant.isSerious()).toBe(false);
      });
    });

    describe('NaranjoCausality', () => {
      it('should determine causality from score', () => {
        expect(NaranjoCausality.fromScore(9).name).toBe('Definite');
        expect(NaranjoCausality.fromScore(6).name).toBe('Probable');
        expect(NaranjoCausality.fromScore(3).name).toBe('Possible');
        expect(NaranjoCausality.fromScore(0).name).toBe('Doubtful');
      });

      it('should identify suspect drugs', () => {
        expect(NaranjoCausality.Definite.isSuspect()).toBe(true);
        expect(NaranjoCausality.Probable.isSuspect()).toBe(true);
        expect(NaranjoCausality.Possible.isSuspect()).toBe(true);
        expect(NaranjoCausality.Doubtful.isSuspect()).toBe(false);
      });
    });

    describe('TaskStatus', () => {
      it('should identify terminal states', () => {
        expect(TaskStatus.Completed.isTerminal()).toBe(true);
        expect(TaskStatus.Cancelled.isTerminal()).toBe(true);
        expect(TaskStatus.New.isTerminal()).toBe(false);
        expect(TaskStatus.OnHold.isTerminal()).toBe(false);
      });
    });
  });

  describe('Age Calculator', () => {
    describe('getAgeGroup', () => {
      it('should calculate neonate age group', () => {
        const birthDate = '2024-01-01';
        const onsetDate = '2024-01-15'; // 15 days old
        const result = getAgeGroup(birthDate, onsetDate);
        expect(result).toBe('Neonate <= 1 month');
      });

      it('should calculate infant age group', () => {
        const birthDate = '2023-01-01';
        const onsetDate = '2024-01-01'; // 1 year old
        const result = getAgeGroup(birthDate, onsetDate);
        expect(result).toBe('Infant > 1 month and <= 4 years');
      });

      it('should calculate child age group', () => {
        const birthDate = '2015-01-01';
        const onsetDate = '2024-01-01'; // 9 years old
        const result = getAgeGroup(birthDate, onsetDate);
        expect(result).toBe('Child > 4 years and <= 11 years');
      });

      it('should calculate adult age group', () => {
        const birthDate = '1990-01-01';
        const onsetDate = '2024-01-01'; // 34 years old
        const result = getAgeGroup(birthDate, onsetDate);
        expect(result).toBe('Adult > 16 years and <= 69 years');
      });

      it('should calculate elderly age group', () => {
        const birthDate = '1950-01-01';
        const onsetDate = '2024-01-01'; // 74 years old
        const result = getAgeGroup(birthDate, onsetDate);
        expect(result).toBe('Elderly > 69 years');
      });

      it('should return null for missing dates', () => {
        expect(getAgeGroup(null, '2024-01-01')).toBeNull();
        expect(getAgeGroup('2024-01-01', null)).toBeNull();
      });
    });

    describe('calculateAgeAtEvent', () => {
      it('should return complete age information', () => {
        const result = calculateAgeAtEvent('1990-06-15', '2024-01-01');

        expect(result.ageGroup).toBe('Adult > 16 years and <= 69 years');
        expect(result.ageInMonths).toBeGreaterThan(400);
        expect(result.e2bAgeGroupCode).toBe('5');
        expect(result.ageFormatted).toContain('years');
      });
    });

    describe('getAgeGroupFromMonths', () => {
      it('should map months to correct age groups', () => {
        expect(getAgeGroupFromMonths(0)).toBe(ICH_AGE_GROUPS.NEONATE.name);
        expect(getAgeGroupFromMonths(24)).toBe(ICH_AGE_GROUPS.INFANT.name);
        expect(getAgeGroupFromMonths(100)).toBe(ICH_AGE_GROUPS.CHILD.name);
        expect(getAgeGroupFromMonths(180)).toBe(ICH_AGE_GROUPS.ADOLESCENT.name);
        expect(getAgeGroupFromMonths(400)).toBe(ICH_AGE_GROUPS.ADULT.name);
        expect(getAgeGroupFromMonths(900)).toBe(ICH_AGE_GROUPS.ELDERLY.name);
      });
    });
  });

  describe('E2B Constants', () => {
    describe('getE2BDoseUnit', () => {
      it('should map common dose units', () => {
        expect(getE2BDoseUnit('mg')).toContain('milligram');
        expect(getE2BDoseUnit('g')).toContain('gram');
        expect(getE2BDoseUnit('ml')).toContain('millilitre');
        expect(getE2BDoseUnit('mcg')).toContain('microgram');
      });

      it('should return unknown for unrecognized units', () => {
        expect(getE2BDoseUnit('xyz')).toContain('unknown');
      });
    });

    describe('getDrugCharacterization', () => {
      it('should return suspect for valid Naranjo causality', () => {
        expect(getDrugCharacterization('Possible')).toBe('1');
        expect(getDrugCharacterization('Probable')).toBe('1');
        expect(getDrugCharacterization('Definite')).toBe('1');
      });

      it('should return concomitant for doubtful causality', () => {
        expect(getDrugCharacterization('Doubtful')).toBe('2');
        expect(getDrugCharacterization()).toBe('2');
      });
    });
  });

  describe('ML Classification Metrics', () => {
    describe('evaluatePredictions', () => {
      it('should calculate metrics correctly', () => {
        const yTruth: (0 | 1)[] = [1, 1, 0, 0, 1, 0, 1, 0];
        const yPred: (0 | 1)[] = [1, 1, 0, 0, 0, 0, 1, 1];

        const metrics = evaluatePredictions(yTruth, yPred);

        expect(metrics.accuracy).toBe(0.75);
        expect(metrics.sensitivity).toBeCloseTo(0.75, 2);
        expect(metrics.specificity).toBeCloseTo(0.75, 2);
      });
    });

    describe('buildConfusionMatrix', () => {
      it('should build correct confusion matrix', () => {
        const yTruth: (0 | 1)[] = [1, 1, 0, 0];
        const yPred: (0 | 1)[] = [1, 0, 0, 1];

        const cm = buildConfusionMatrix(yTruth, yPred);

        expect(cm.truePositives).toBe(1);
        expect(cm.trueNegatives).toBe(1);
        expect(cm.falsePositives).toBe(1);
        expect(cm.falseNegatives).toBe(1);
      });
    });

    describe('calculateBalancedAccuracy', () => {
      it('should calculate balanced accuracy', () => {
        // Source: ml-organ-tox - M['bacc']=0.5*(M['sens']+M['spec'])
        const bacc = calculateBalancedAccuracy(0.8, 0.6);
        expect(bacc).toBe(0.7);
      });
    });

    describe('formatMetrics', () => {
      it('should format as percentages', () => {
        const metrics: ClassificationMetrics = {
          sensitivity: 0.85,
          specificity: 0.90,
          accuracy: 0.875,
          f1Score: 0.87,
          balancedAccuracy: 0.875,
        };

        const formatted = formatMetrics(metrics);

        expect(formatted.sensitivity).toBe('85.0%');
        expect(formatted.specificity).toBe('90.0%');
        expect(formatted.accuracy).toBe('87.5%');
      });
    });
  });

  describe('Causality Service', () => {
    describe('assessNaranjoCausality', () => {
      it('should calculate definite causality', () => {
        const result = assessNaranjoCausality({
          previousReports: 'yes',
          appearedAfterDrug: 'yes',
          improvedOnDiscontinuation: 'yes',
          reappearedOnRechallenge: 'yes',
          alternativeCauses: 'no',
          toxicConcentration: 'yes',
          doseRelated: 'yes',
          previousSimilarReaction: 'yes',
          objectiveEvidence: 'yes',
        });

        expect(result.causality.name).toBe('Definite');
        expect(result.score).toBeGreaterThanOrEqual(9);
        expect(result.isSuspect).toBe(true);
      });

      it('should calculate doubtful causality', () => {
        const result = assessNaranjoCausality({
          appearedAfterDrug: 'no',
          alternativeCauses: 'yes',
        });

        expect(result.causality.name).toBe('Doubtful');
        expect(result.isSuspect).toBe(false);
      });
    });

    describe('CausalityService', () => {
      it('should perform combined assessment', () => {
        const service = createCausalityService();

        const result = service.assessCombined(
          {
            appearedAfterDrug: 'yes',
            improvedOnDiscontinuation: 'yes',
            alternativeCauses: 'no',
          },
          {
            temporalRelationship: true,
            dechallenge: 'positive',
            alternativeCausesExcluded: 'yes',
            pharmacologicallyPlausible: true,
          }
        );

        expect(result.isSuspect).toBe(true);
        expect(result.recommendation).toBeTruthy();
      });
    });
  });

  describe('Classification Service', () => {
    describe('isSeriousAdverseEvent', () => {
      it('should identify SAE by seriousness criteria', () => {
        const event = {
          id: 1,
          guid: 'test-guid',
          patientId: 1,
          seriousnessCriteria: ['hospitalization' as const],
          archived: false,
        };

        expect(isSeriousAdverseEvent(event)).toBe(true);
      });

      it('should identify SAE by fatal outcome', () => {
        const event = {
          id: 1,
          guid: 'test-guid',
          patientId: 1,
          outcome: 'fatal' as const,
          archived: false,
        };

        expect(isSeriousAdverseEvent(event)).toBe(true);
      });

      it('should identify non-serious events', () => {
        const event = {
          id: 1,
          guid: 'test-guid',
          patientId: 1,
          outcome: 'recovered' as const,
          archived: false,
        };

        expect(isSeriousAdverseEvent(event)).toBe(false);
      });
    });

    describe('ClassificationService', () => {
      it('should classify SAE correctly', () => {
        const service = createClassificationService();

        const events = [{
          id: 1,
          guid: 'test-guid',
          patientId: 1,
          seriousnessCriteria: ['hospitalization' as const],
          archived: false,
        }];

        const result = service.classifyReport(events, []);

        expect(result.classification.name).toBe('SAE');
        expect(result.isExpedited).toBe(false); // Not fatal/life-threatening
      });

      it('should classify fatal SAE as expedited', () => {
        const service = createClassificationService();

        const events = [{
          id: 1,
          guid: 'test-guid',
          patientId: 1,
          seriousnessCriteria: ['death' as const],
          outcome: 'fatal' as const,
          archived: false,
        }];

        const result = service.classifyReport(events, []);

        expect(result.classification.name).toBe('SAE');
        expect(result.isExpedited).toBe(true);
        expect(result.timeline?.daysFromReceipt).toBe(7);
      });
    });
  });
});
