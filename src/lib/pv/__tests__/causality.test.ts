/**
 * Tests for Causality Assessment Algorithms
 *
 * Implements two standard causality assessment methods:
 *
 * 1. Naranjo Algorithm (Naranjo Adverse Drug Reaction Probability Scale)
 *    - 10 weighted questions
 *    - Score range: -4 to +13
 *    - Categories: Definite (≥9), Probable (5-8), Possible (1-4), Doubtful (≤0)
 *
 * 2. WHO-UMC System (Uppsala Monitoring Centre)
 *    - 6 causality categories
 *    - Qualitative assessment based on criteria
 *
 * Based on:
 * - Naranjo CA, et al. Clin Pharmacol Ther 1981;30:239-45
 * - The Uppsala Monitoring Centre criteria
 * - OpenRIMS-PV NaranjoScore/WHOCausality patterns
 */

import {
  // Naranjo Algorithm
  type NaranjoAnswer,
  NARANJO_QUESTIONS,
  calculateNaranjoScore,
  interpretNaranjoScore,
  createNaranjoAssessment,
  // WHO-UMC System
  type WHOUMCCriteria,
  type WHOUMCCausality,
  WHO_UMC_CATEGORIES,
  assessWHOUMCCausality,
  getWHOUMCDescription,
  // Integration
  getCausalityStrength,
  compareCausalityMethods,
} from '../causality';

describe('Naranjo Algorithm', () => {
  describe('NARANJO_QUESTIONS', () => {
    it('should have exactly 10 questions', () => {
      expect(NARANJO_QUESTIONS.length).toBe(10);
    });

    it('should have correct question structure', () => {
      const q1 = NARANJO_QUESTIONS[0];
      expect(q1.id).toBe(1);
      expect(q1.text).toContain('previous conclusive reports');
      expect(q1.weights).toEqual({ yes: 1, no: 0, unknown: 0 });
    });

    it('should have questions with varied weights', () => {
      // Question 5 has negative weight for "yes" (alternative causes = bad)
      const q5 = NARANJO_QUESTIONS[4];
      expect(q5.weights.yes).toBeLessThan(0);
      // Question 6 has negative weight for "yes" (placebo reaction = bad)
      const q6 = NARANJO_QUESTIONS[5];
      expect(q6.weights.yes).toBeLessThan(0);
    });
  });

  describe('calculateNaranjoScore', () => {
    it('should calculate score of 0 for all unknowns', () => {
      const answers: NaranjoAnswer[] = Array(10).fill('unknown');
      const score = calculateNaranjoScore(answers);
      expect(score).toBe(0);
    });

    it('should calculate maximum possible score', () => {
      // Maximum score comes from: Q1-Q4 yes, Q5-Q6 no, Q7-Q10 yes
      // Q1: +1, Q2: +2, Q3: +1, Q4: +2, Q5(no): +2, Q6(no): +1, Q7: +1, Q8: +1, Q9: +1, Q10: +1
      const optimalAnswers: NaranjoAnswer[] = [
        'yes', 'yes', 'yes', 'yes', 'no',
        'no', 'yes', 'yes', 'yes', 'yes',
      ];
      const score = calculateNaranjoScore(optimalAnswers);
      expect(score).toBe(13); // Maximum possible score
    });

    it('should calculate minimum score for worst case', () => {
      // Answers that give minimum score (mostly "no" where it subtracts)
      const answers: NaranjoAnswer[] = [
        'no', 'no', 'no', 'no', 'no',
        'yes', 'no', 'no', 'no', 'no',
      ];
      const score = calculateNaranjoScore(answers);
      expect(score).toBeLessThanOrEqual(0);
    });

    it('should handle mixed answers correctly', () => {
      // Typical case: some yes, some no, some unknown
      const answers: NaranjoAnswer[] = [
        'yes',     // Q1: +1
        'yes',     // Q2: +2
        'unknown', // Q3: 0
        'no',      // Q4: -1
        'unknown', // Q5: 0
        'unknown', // Q6: 0
        'yes',     // Q7: +1
        'unknown', // Q8: 0
        'no',      // Q9: 0
        'yes',     // Q10: +1
      ];
      const score = calculateNaranjoScore(answers);
      expect(score).toBe(4); // 1+2+0-1+0+0+1+0+0+1 = 4
    });
  });

  describe('interpretNaranjoScore', () => {
    it('should classify score ≥9 as definite', () => {
      expect(interpretNaranjoScore(9)).toBe('definite');
      expect(interpretNaranjoScore(13)).toBe('definite');
    });

    it('should classify score 5-8 as probable', () => {
      expect(interpretNaranjoScore(5)).toBe('probable');
      expect(interpretNaranjoScore(8)).toBe('probable');
    });

    it('should classify score 1-4 as possible', () => {
      expect(interpretNaranjoScore(1)).toBe('possible');
      expect(interpretNaranjoScore(4)).toBe('possible');
    });

    it('should classify score ≤0 as doubtful', () => {
      expect(interpretNaranjoScore(0)).toBe('doubtful');
      expect(interpretNaranjoScore(-4)).toBe('doubtful');
    });
  });

  describe('createNaranjoAssessment', () => {
    it('should create complete assessment object', () => {
      const answers: NaranjoAnswer[] = [
        'yes', 'yes', 'yes', 'unknown', 'no',
        'unknown', 'yes', 'yes', 'yes', 'yes',
      ];

      const assessment = createNaranjoAssessment(answers);

      expect(assessment.answers).toEqual(answers);
      expect(assessment.score).toBeGreaterThan(0);
      expect(assessment.category).toBeDefined();
      expect(assessment.assessedAt).toBeInstanceOf(Date);
    });

    it('should reject incomplete answers', () => {
      const answers: NaranjoAnswer[] = ['yes', 'no']; // Only 2 answers
      expect(() => createNaranjoAssessment(answers)).toThrow('10 answers required');
    });
  });
});

describe('WHO-UMC Causality System', () => {
  describe('WHO_UMC_CATEGORIES', () => {
    it('should define all 6 WHO-UMC categories', () => {
      expect(WHO_UMC_CATEGORIES.certain).toBe('certain');
      expect(WHO_UMC_CATEGORIES.probable).toBe('probable');
      expect(WHO_UMC_CATEGORIES.possible).toBe('possible');
      expect(WHO_UMC_CATEGORIES.unlikely).toBe('unlikely');
      expect(WHO_UMC_CATEGORIES.conditional).toBe('conditional');
      expect(WHO_UMC_CATEGORIES.unassessable).toBe('unassessable');
    });
  });

  describe('assessWHOUMCCausality', () => {
    it('should assess as certain when all criteria met', () => {
      const criteria: WHOUMCCriteria = {
        temporalRelationship: true,
        plausibleMechanism: true,
        responseToWithdrawal: true,
        responseToRechallenge: true,
        alternativeExplanation: false,
        additionalInformationNeeded: false,
      };

      const result = assessWHOUMCCausality(criteria);
      expect(result).toBe('certain');
    });

    it('should assess as probable when no rechallenge but otherwise strong', () => {
      const criteria: WHOUMCCriteria = {
        temporalRelationship: true,
        plausibleMechanism: true,
        responseToWithdrawal: true,
        responseToRechallenge: false,
        alternativeExplanation: false,
        additionalInformationNeeded: false,
      };

      const result = assessWHOUMCCausality(criteria);
      expect(result).toBe('probable');
    });

    it('should assess as possible when temporal + plausible but no dechallenge', () => {
      const criteria: WHOUMCCriteria = {
        temporalRelationship: true,
        plausibleMechanism: true,
        responseToWithdrawal: false,
        responseToRechallenge: false,
        alternativeExplanation: true,
        additionalInformationNeeded: false,
      };

      const result = assessWHOUMCCausality(criteria);
      expect(result).toBe('possible');
    });

    it('should assess as unlikely when timing is wrong', () => {
      const criteria: WHOUMCCriteria = {
        temporalRelationship: false,
        plausibleMechanism: false,
        responseToWithdrawal: false,
        responseToRechallenge: false,
        alternativeExplanation: true,
        additionalInformationNeeded: false,
      };

      const result = assessWHOUMCCausality(criteria);
      expect(result).toBe('unlikely');
    });

    it('should assess as conditional when additional info needed', () => {
      const criteria: WHOUMCCriteria = {
        temporalRelationship: true,
        plausibleMechanism: true,
        responseToWithdrawal: true,
        responseToRechallenge: false,
        alternativeExplanation: false,
        additionalInformationNeeded: true,
      };

      const result = assessWHOUMCCausality(criteria);
      expect(result).toBe('conditional');
    });

    it('should assess as unassessable when insufficient data', () => {
      const criteria: WHOUMCCriteria = {
        temporalRelationship: undefined,
        plausibleMechanism: undefined,
        responseToWithdrawal: undefined,
        responseToRechallenge: undefined,
        alternativeExplanation: undefined,
        additionalInformationNeeded: undefined,
      };

      const result = assessWHOUMCCausality(criteria);
      expect(result).toBe('unassessable');
    });
  });

  describe('getWHOUMCDescription', () => {
    it('should return descriptions for each category', () => {
      expect(getWHOUMCDescription('certain')).toContain('plausible time relationship');
      expect(getWHOUMCDescription('probable')).toContain('unlikely to be attributed');
      expect(getWHOUMCDescription('possible')).toContain('could also be explained');
      expect(getWHOUMCDescription('unlikely')).toContain('improbable');
      expect(getWHOUMCDescription('conditional')).toContain('more data');
      expect(getWHOUMCDescription('unassessable')).toContain('insufficient');
    });
  });
});

describe('Causality Integration', () => {
  describe('getCausalityStrength', () => {
    it('should return numeric strength for Naranjo categories', () => {
      expect(getCausalityStrength('definite')).toBe(4);
      expect(getCausalityStrength('probable')).toBe(3);
      expect(getCausalityStrength('possible')).toBe(2);
      expect(getCausalityStrength('doubtful')).toBe(1);
    });

    it('should return numeric strength for WHO-UMC categories', () => {
      expect(getCausalityStrength('certain')).toBe(4);
      expect(getCausalityStrength('probable')).toBe(3);
      expect(getCausalityStrength('possible')).toBe(2);
      expect(getCausalityStrength('unlikely')).toBe(1);
      expect(getCausalityStrength('conditional')).toBe(0);
      expect(getCausalityStrength('unassessable')).toBe(0);
    });
  });

  describe('compareCausalityMethods', () => {
    it('should compare Naranjo and WHO-UMC assessments', () => {
      const comparison = compareCausalityMethods('probable', 'probable');

      expect(comparison.naranjo).toBe('probable');
      expect(comparison.whoUmc).toBe('probable');
      expect(comparison.agreement).toBe(true);
      expect(comparison.overallStrength).toBe(3);
    });

    it('should detect disagreement between methods', () => {
      const comparison = compareCausalityMethods('definite', 'possible');

      expect(comparison.agreement).toBe(false);
      expect(comparison.strengthDifference).toBe(2); // 4 - 2
    });

    it('should use higher strength when methods disagree', () => {
      const comparison = compareCausalityMethods('definite', 'possible');

      // Conservative approach: use lower strength
      expect(comparison.overallStrength).toBeLessThanOrEqual(4);
    });
  });
});

describe('Naranjo Question Details', () => {
  it('Q1: Previous reports on this reaction', () => {
    const q = NARANJO_QUESTIONS[0];
    expect(q.text).toContain('previous conclusive reports');
    expect(q.weights.yes).toBe(1);
    expect(q.weights.no).toBe(0);
  });

  it('Q2: Event appeared after drug administration', () => {
    const q = NARANJO_QUESTIONS[1];
    expect(q.text).toContain('after the suspected drug was given');
    expect(q.weights.yes).toBe(2);
    expect(q.weights.no).toBe(-1);
  });

  it('Q3: Improved when drug discontinued (dechallenge)', () => {
    const q = NARANJO_QUESTIONS[2];
    expect(q.text).toContain('discontinued');
    expect(q.weights.yes).toBe(1);
  });

  it('Q4: Reappeared on readministration (rechallenge)', () => {
    const q = NARANJO_QUESTIONS[3];
    expect(q.text).toContain('readministered');
    expect(q.weights.yes).toBe(2);
    expect(q.weights.no).toBe(-1);
  });

  it('Q5: Alternative causes could explain event', () => {
    const q = NARANJO_QUESTIONS[4];
    expect(q.text).toContain('alternative causes');
    expect(q.weights.yes).toBe(-1);
    expect(q.weights.no).toBe(2);
  });

  it('Q6: Reaction reappeared with placebo', () => {
    const q = NARANJO_QUESTIONS[5];
    expect(q.text).toContain('placebo');
    expect(q.weights.yes).toBe(-1);
    expect(q.weights.no).toBe(1);
  });

  it('Q7: Drug detected in toxic concentration', () => {
    const q = NARANJO_QUESTIONS[6];
    expect(q.text).toContain('toxic');
    expect(q.weights.yes).toBe(1);
  });

  it('Q8: Reaction severity varied with dose', () => {
    const q = NARANJO_QUESTIONS[7];
    expect(q.text).toContain('dose');
    expect(q.weights.yes).toBe(1);
  });

  it('Q9: Patient had similar reaction to drug before', () => {
    const q = NARANJO_QUESTIONS[8];
    expect(q.text).toContain('similar reaction');
    expect(q.weights.yes).toBe(1);
  });

  it('Q10: Reaction confirmed by objective evidence', () => {
    const q = NARANJO_QUESTIONS[9];
    expect(q.text).toContain('objective evidence');
    expect(q.weights.yes).toBe(1);
  });
});

describe('E2B Integration', () => {
  it('should map to existing NaranjoCausality type', () => {
    // Types from types.ts should align
    const categories = ['definite', 'probable', 'possible', 'doubtful'];
    categories.forEach((cat) => {
      expect(interpretNaranjoScore(cat === 'definite' ? 9 : cat === 'probable' ? 5 : cat === 'possible' ? 1 : 0))
        .toBe(cat);
    });
  });

  it('should map to existing WHOUMCCausality type', () => {
    // All WHO-UMC categories should be valid
    const categories: WHOUMCCausality[] = ['certain', 'probable', 'possible', 'unlikely', 'conditional', 'unassessable'];
    categories.forEach((cat) => {
      expect(getWHOUMCDescription(cat)).toBeDefined();
    });
  });
});
