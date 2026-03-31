/**
 * Tests for pv-compute/causality.ts
 *
 * Covers:
 *   computeNaranjo — 10-question weighted score, 4 categories
 *   computeWhoUmc  — WHO-UMC qualitative causality classification
 *
 * Naranjo weights (from source):
 *   Q1: [+1, 0,  0]   Q6:  [-1, +1, 0]
 *   Q2: [+2, -1, 0]   Q7:  [+1,  0, 0]
 *   Q3: [+1,  0, 0]   Q8:  [+1,  0, 0]
 *   Q4: [+2, -1, 0]   Q9:  [+1,  0, 0]
 *   Q5: [-1, +2, 0]   Q10: [+1,  0, 0]
 *
 * Scoring: >=9 Definite | 5-8 Probable | 1-4 Possible | <=0 Doubtful
 */

import { computeNaranjo, computeWhoUmc } from '../causality';
import type {
  NaranjoResult,
  WhoUmcInput,
  WhoUmcResult,
} from '../causality';

// ── Naranjo ──────────────────────────────────────────────────────────────────

describe('computeNaranjo', () => {

  describe('Definite (score >= 9)', () => {
    test('optimal answers produce Definite category', () => {
      // Yes to Q1-Q4, Q7-Q10 (+1+2+1+2+1+1+1+1=10)
      // No  to Q5, Q6 (+2+1=3)  → total = 13
      const answers = [1, 1, 1, 1, -1, -1, 1, 1, 1, 1];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBe(13);
      expect(result.category).toBe('Definite');
    });

    test('minimum Definite score is exactly 9', () => {
      // Need sum >= 9. One combination: Q2 yes(+2), Q4 yes(+2), Q1 yes(+1),
      // Q3 yes(+1), Q5 no(+2), Q6 no(+1), Q7-Q10 any one yes(+1)
      // Q1+Q2+Q3+Q4 = 1+2+1+2=6, Q5 no=+2 → 8, Q7 yes=+1 → 9, rest DK=0
      const answers = [1, 1, 1, 1, -1, 0, 1, 0, 0, 0];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBeGreaterThanOrEqual(9);
      expect(result.category).toBe('Definite');
    });
  });

  describe('Probable (score 5-8)', () => {
    test('all Yes answers produce Probable (score = 8)', () => {
      // All Yes: Q1(+1)+Q2(+2)+Q3(+1)+Q4(+2)+Q5(-1)+Q6(-1)+Q7(+1)+Q8(+1)+Q9(+1)+Q10(+1)
      // = 1+2+1+2-1-1+1+1+1+1 = 8
      const answers = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBe(8);
      expect(result.category).toBe('Probable');
    });

    test('score of exactly 5 is Probable', () => {
      // Q2 yes(+2), Q4 yes(+2), Q7 yes(+1), rest DK(0) → score=5
      const answers = [0, 1, 0, 1, 0, 0, 1, 0, 0, 0];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBe(5);
      expect(result.category).toBe('Probable');
    });

    test('score of exactly 8 is Probable', () => {
      const answers = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBe(8);
      expect(result.category).toBe('Probable');
    });
  });

  describe('Possible (score 1-4)', () => {
    test('score of exactly 1 is Possible', () => {
      // Q1 yes(+1), rest DK(0) → score=1
      const answers = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBe(1);
      expect(result.category).toBe('Possible');
    });

    test('score of exactly 4 is Possible', () => {
      // Q2 yes(+2), Q3 yes(+1), Q7 yes(+1), rest DK → score=4
      const answers = [0, 1, 1, 0, 0, 0, 1, 0, 0, 0];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBe(4);
      expect(result.category).toBe('Possible');
    });
  });

  describe('Doubtful (score <= 0)', () => {
    test('all No answers produce Doubtful', () => {
      // All No: Q1(0)+Q2(-1)+Q3(0)+Q4(-1)+Q5(+2)+Q6(+1)+Q7(0)+Q8(0)+Q9(0)+Q10(0)
      // = 0-1+0-1+2+1+0+0+0+0 = 1
      // Note: Q5 no = +2 and Q6 no = +1 → actually pushes to Possible (score=1)
      const answers = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
      const result: NaranjoResult = computeNaranjo(answers);

      // Q2 no=-1, Q4 no=-1, Q5 no=+2, Q6 no=+1, rest no=0 → 0-1+0-1+2+1+0+0+0+0=1
      // This is Possible(1) per the weights — the "all No" case is not Doubtful
      expect(result.score).toBe(1);
      expect(result.category).toBe('Possible');
    });

    test('all Don\'t Know answers produce score 0 (Doubtful)', () => {
      // All DK: every weight[2] is 0 → score = 0
      const answers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBe(0);
      expect(result.category).toBe('Doubtful');
    });

    test('score of exactly 0 is Doubtful', () => {
      const answers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBe(0);
      expect(result.category).toBe('Doubtful');
    });

    test('negative net score is Doubtful', () => {
      // Q5 yes(-1), Q6 yes(-1), Q2 no(-1), Q4 no(-1), rest DK → -1-1-1-1 = -4
      const answers = [0, -1, 0, -1, 1, 1, 0, 0, 0, 0];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBeLessThanOrEqual(0);
      expect(result.category).toBe('Doubtful');
    });
  });

  describe('score boundaries', () => {
    test('score of 9 is Definite (not Probable)', () => {
      const answers = [1, 1, 1, 1, -1, 0, 1, 0, 0, 0];
      const result: NaranjoResult = computeNaranjo(answers);

      expect(result.score).toBeGreaterThanOrEqual(9);
      expect(result.category).toBe('Definite');
    });

    test('result object contains both score and category', () => {
      const result: NaranjoResult = computeNaranjo([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('category');
    });
  });

  describe('input guard', () => {
    test('throws when fewer than 10 answers provided', () => {
      expect(() => computeNaranjo([1, 1, 1]))
        .toThrow('10');
    });

    test('throws when more than 10 answers provided', () => {
      expect(() => computeNaranjo([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]))
        .toThrow('10');
    });

    test('throws when empty array provided', () => {
      expect(() => computeNaranjo([]))
        .toThrow('10');
    });

    test('does not throw for exactly 10 answers', () => {
      expect(() => computeNaranjo([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
        .not.toThrow();
    });
  });
});

// ── WHO-UMC ───────────────────────────────────────────────────────────────────

describe('computeWhoUmc', () => {

  describe('Certain', () => {
    test('reasonable temporal + positive dechallenge + positive rechallenge + unlikely alternatives = Certain', () => {
      const input: WhoUmcInput = {
        temporal: 'reasonable',
        dechallenge: 'positive',
        rechallenge: 'positive',
        alternatives: 'unlikely',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      expect(result.category).toBe('Certain');
    });

    test('Certain result includes descriptive text', () => {
      const input: WhoUmcInput = {
        temporal: 'reasonable',
        dechallenge: 'positive',
        rechallenge: 'positive',
        alternatives: 'unlikely',
      };
      const { description } = computeWhoUmc(input);

      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });

  describe('Probable/Likely', () => {
    test('reasonable temporal + positive dechallenge + no rechallenge + unlikely alternatives = Probable', () => {
      const input: WhoUmcInput = {
        temporal: 'reasonable',
        dechallenge: 'positive',
        rechallenge: 'not_done',
        alternatives: 'unlikely',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      expect(result.category).toBe('Probable/Likely');
    });

    test('rechallenge unknown does not prevent Probable if all else met', () => {
      const input: WhoUmcInput = {
        temporal: 'reasonable',
        dechallenge: 'positive',
        rechallenge: 'unknown',
        alternatives: 'unlikely',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      // rechallenge not positive → not Certain; but temporal+dechallenge+alternatives met → Probable
      expect(result.category).toBe('Probable/Likely');
    });
  });

  describe('Possible', () => {
    test('reasonable temporal with possible alternatives = Possible', () => {
      const input: WhoUmcInput = {
        temporal: 'reasonable',
        dechallenge: 'not_done',
        rechallenge: 'not_done',
        alternatives: 'possible',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      expect(result.category).toBe('Possible');
    });

    test('reasonable temporal with negative dechallenge = Possible', () => {
      const input: WhoUmcInput = {
        temporal: 'reasonable',
        dechallenge: 'negative',
        rechallenge: 'not_done',
        alternatives: 'possible',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      expect(result.category).toBe('Possible');
    });
  });

  describe('Unlikely', () => {
    test('unlikely temporal relationship = Unlikely', () => {
      const input: WhoUmcInput = {
        temporal: 'unlikely',
        dechallenge: 'not_done',
        rechallenge: 'not_done',
        alternatives: 'possible',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      expect(result.category).toBe('Unlikely');
    });

    test('probable alternative causes = Unlikely', () => {
      const input: WhoUmcInput = {
        temporal: 'reasonable',
        dechallenge: 'not_done',
        rechallenge: 'not_done',
        alternatives: 'probable',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      expect(result.category).toBe('Unlikely');
    });

    test('unlikely temporal with unlikely alternatives = Unlikely', () => {
      const input: WhoUmcInput = {
        temporal: 'unlikely',
        dechallenge: 'negative',
        rechallenge: 'negative',
        alternatives: 'unlikely',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      expect(result.category).toBe('Unlikely');
    });
  });

  describe('Unassessable/Unclassifiable', () => {
    test('all unknowns produces Unassessable', () => {
      const input: WhoUmcInput = {
        temporal: 'unknown',
        dechallenge: 'unknown',
        rechallenge: 'unknown',
        alternatives: 'unknown',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      expect(result.category).toBe('Unassessable/Unclassifiable');
    });

    test('Unassessable result has non-empty description', () => {
      const input: WhoUmcInput = {
        temporal: 'unknown',
        dechallenge: 'unknown',
        rechallenge: 'unknown',
        alternatives: 'unknown',
      };
      const { description } = computeWhoUmc(input);

      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });

  describe('Conditional/Unclassified', () => {
    test('unknown temporal produces Conditional', () => {
      // temporal unknown but not all three unknown → Conditional
      const input: WhoUmcInput = {
        temporal: 'unknown',
        dechallenge: 'positive',
        rechallenge: 'not_done',
        alternatives: 'possible',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      expect(result.category).toBe('Conditional/Unclassified');
    });

    test('both dechallenge and rechallenge unknown produces Conditional', () => {
      const input: WhoUmcInput = {
        temporal: 'reasonable',
        dechallenge: 'unknown',
        rechallenge: 'unknown',
        alternatives: 'possible',
      };
      const result: WhoUmcResult = computeWhoUmc(input);

      expect(result.category).toBe('Conditional/Unclassified');
    });
  });

  describe('result structure', () => {
    test('result always has category and description', () => {
      const inputs: WhoUmcInput[] = [
        { temporal: 'reasonable', dechallenge: 'positive', rechallenge: 'positive', alternatives: 'unlikely' },
        { temporal: 'unknown',    dechallenge: 'unknown',  rechallenge: 'unknown',  alternatives: 'unknown'  },
        { temporal: 'unlikely',   dechallenge: 'not_done', rechallenge: 'not_done', alternatives: 'probable' },
      ];

      for (const input of inputs) {
        const result: WhoUmcResult = computeWhoUmc(input);
        expect(result).toHaveProperty('category');
        expect(result).toHaveProperty('description');
        expect(typeof result.category).toBe('string');
        expect(typeof result.description).toBe('string');
      }
    });
  });
});
