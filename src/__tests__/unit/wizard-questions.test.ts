/**
 * Unit Tests: Service Discovery Wizard - Question Flow
 *
 * Tests the adaptive question flow, branching logic, and progress calculation.
 */

import {
  wizardQuestions,
  resolveQuestionFlow,
  getNextQuestionId,
  hasMoreQuestions,
  getCurrentQuestion,
  calculateProgress,
} from '@/data/wizard-questions';
import { createInitialWizardState } from '@/types/service-wizard';
import type { WizardState } from '@/types/service-wizard';

describe('Wizard Questions Data', () => {
  describe('wizardQuestions structure', () => {
    it('has entry question q1-situation', () => {
      expect(wizardQuestions['q1-situation']).toBeDefined();
      expect(wizardQuestions['q1-situation'].id).toBe('q1-situation');
    });

    it('all questions have required fields', () => {
      Object.values(wizardQuestions).forEach((question) => {
        expect(question.id).toBeDefined();
        expect(question.text).toBeDefined();
        expect(question.options).toBeDefined();
        expect(question.options.length).toBeGreaterThan(0);
      });
    });

    it('all options have required fields', () => {
      Object.values(wizardQuestions).forEach((question) => {
        question.options.forEach((option) => {
          expect(option.id).toBeDefined();
          expect(option.label).toBeDefined();
          expect(option.scores).toBeDefined();
        });
      });
    });

    it('Q1 options branch to correct Q2 questions', () => {
      const q1 = wizardQuestions['q1-situation'];

      const challengeOption = q1.options.find((o) => o.id === 'challenge');
      expect(challengeOption?.nextQuestion).toBe('q2a-challenge-type');

      const opportunityOption = q1.options.find((o) => o.id === 'opportunity');
      expect(opportunityOption?.nextQuestion).toBe('q2b-opportunity-type');

      const explorationOption = q1.options.find((o) => o.id === 'exploration');
      expect(explorationOption?.nextQuestion).toBe('q2c-exploration-area');
    });

    it('has all three branch questions', () => {
      expect(wizardQuestions['q2a-challenge-type']).toBeDefined();
      expect(wizardQuestions['q2b-opportunity-type']).toBeDefined();
      expect(wizardQuestions['q2c-exploration-area']).toBeDefined();
    });

    it('has maturity and impact questions', () => {
      expect(wizardQuestions['q3-maturity']).toBeDefined();
      expect(wizardQuestions['q4-impact']).toBeDefined();
    });
  });

  describe('resolveQuestionFlow', () => {
    it('returns only q1 for initial state', () => {
      const state = createInitialWizardState();
      const flow = resolveQuestionFlow(state);
      expect(flow).toEqual(['q1-situation']);
    });

    it('builds challenge branch flow correctly', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: { 'q1-situation': 'challenge' },
        branch: 'challenge',
      };
      const flow = resolveQuestionFlow(state);

      expect(flow).toContain('q1-situation');
      expect(flow).toContain('q2a-challenge-type');
      expect(flow).toContain('q3-maturity');
      expect(flow).toContain('q4-impact');
      expect(flow).not.toContain('q2b-opportunity-type');
      expect(flow.length).toBe(4);
    });

    it('builds opportunity branch flow correctly', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: { 'q1-situation': 'opportunity' },
        branch: 'opportunity',
      };
      const flow = resolveQuestionFlow(state);

      expect(flow).toContain('q1-situation');
      expect(flow).toContain('q2b-opportunity-type');
      expect(flow).toContain('q3-maturity');
      expect(flow).toContain('q4-impact');
      expect(flow).not.toContain('q2a-challenge-type');
      expect(flow.length).toBe(4);
    });

    it('builds exploration branch flow correctly', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: { 'q1-situation': 'exploration' },
        branch: 'exploration',
      };
      const flow = resolveQuestionFlow(state);

      expect(flow).toContain('q1-situation');
      expect(flow).toContain('q2c-exploration-area');
      expect(flow).toContain('q3-maturity');
      expect(flow).toContain('q4-impact');
      expect(flow.length).toBe(4);
    });
  });

  describe('getNextQuestionId', () => {
    it('returns branch question after Q1', () => {
      const state = createInitialWizardState();

      const nextAfterChallenge = getNextQuestionId('q1-situation', 'challenge', state);
      expect(nextAfterChallenge).toBe('q2a-challenge-type');

      const nextAfterOpportunity = getNextQuestionId('q1-situation', 'opportunity', state);
      expect(nextAfterOpportunity).toBe('q2b-opportunity-type');
    });

    it('returns maturity question after Q2', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: { 'q1-situation': 'challenge' },
        branch: 'challenge',
        questionFlow: ['q1-situation', 'q2a-challenge-type', 'q3-maturity', 'q4-impact'],
      };

      const next = getNextQuestionId('q2a-challenge-type', 'strategic-clarity', state);
      expect(next).toBe('q3-maturity');
    });

    it('returns null for invalid question', () => {
      const state = createInitialWizardState();
      const next = getNextQuestionId('invalid-question', 'option', state);
      expect(next).toBeNull();
    });
  });

  describe('hasMoreQuestions', () => {
    it('returns true at start of flow with answers', () => {
      // Need at least one answer for resolveQuestionFlow to work properly
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: { 'q1-situation': 'challenge' },
        branch: 'challenge',
        questionIndex: 0,
        questionFlow: ['q1-situation', 'q2a-challenge-type', 'q3-maturity', 'q4-impact'],
      };
      // Flow has 4 questions, at index 0 there are more
      expect(hasMoreQuestions(state)).toBe(true);
    });

    it('returns false at end of flow', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: { 'q1-situation': 'challenge' },
        branch: 'challenge',
        questionIndex: 3, // Last question index for 4-question flow
        questionFlow: ['q1-situation', 'q2a-challenge-type', 'q3-maturity', 'q4-impact'],
      };
      expect(hasMoreQuestions(state)).toBe(false);
    });
  });

  describe('getCurrentQuestion', () => {
    it('returns first question at index 0', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        questionIndex: 0,
        questionFlow: ['q1-situation'],
      };
      const question = getCurrentQuestion(state);
      expect(question?.id).toBe('q1-situation');
    });

    it('returns correct question at given index', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: { 'q1-situation': 'challenge' },
        branch: 'challenge',
        questionIndex: 2,
        questionFlow: ['q1-situation', 'q2a-challenge-type', 'q3-maturity', 'q4-impact'],
      };
      const question = getCurrentQuestion(state);
      expect(question?.id).toBe('q3-maturity');
    });

    it('returns null for out of bounds index', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        questionIndex: 10,
        questionFlow: ['q1-situation'],
      };
      const question = getCurrentQuestion(state);
      expect(question).toBeNull();
    });
  });

  describe('calculateProgress', () => {
    it('returns 0 for no answers', () => {
      const state = createInitialWizardState();
      const progress = calculateProgress(state);
      expect(progress).toBe(0);
    });

    it('returns correct percentage for partial completion', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: {
          'q1-situation': 'challenge',
          'q2a-challenge-type': 'strategic-clarity',
        },
        branch: 'challenge',
        questionFlow: ['q1-situation', 'q2a-challenge-type', 'q3-maturity', 'q4-impact'],
      };
      const progress = calculateProgress(state);
      // 2 answered out of 4 = 50%
      expect(progress).toBe(50);
    });

    it('returns 100 for fully completed wizard', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: {
          'q1-situation': 'challenge',
          'q2a-challenge-type': 'strategic-clarity',
          'q3-maturity': 'standardized',
          'q4-impact': 'department',
        },
        branch: 'challenge',
        questionFlow: ['q1-situation', 'q2a-challenge-type', 'q3-maturity', 'q4-impact'],
      };
      const progress = calculateProgress(state);
      expect(progress).toBe(100);
    });
  });
});

describe('Question Content Validation', () => {
  describe('Q1: Situation', () => {
    const q1 = wizardQuestions['q1-situation'];

    it('has three options', () => {
      expect(q1.options.length).toBe(3);
    });

    it('options cover challenge, opportunity, exploration', () => {
      const optionIds = q1.options.map((o) => o.id);
      expect(optionIds).toContain('challenge');
      expect(optionIds).toContain('opportunity');
      expect(optionIds).toContain('exploration');
    });

    it('all options have tags', () => {
      q1.options.forEach((option) => {
        expect(option.tags).toBeDefined();
        expect(option.tags?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Q2a: Challenge Type', () => {
    const q2a = wizardQuestions['q2a-challenge-type'];

    it('has five challenge options', () => {
      expect(q2a.options.length).toBe(5);
    });

    it('each option scores at least one service', () => {
      q2a.options.forEach((option) => {
        const totalScore = Object.values(option.scores).reduce((sum, s) => sum + (s || 0), 0);
        expect(totalScore).toBeGreaterThan(0);
      });
    });
  });

  describe('Q3: Maturity', () => {
    const q3 = wizardQuestions['q3-maturity'];

    it('has four maturity options', () => {
      expect(q3.options.length).toBe(4);
    });

    it('reactive option boosts tactical', () => {
      const reactive = q3.options.find((o) => o.id === 'reactive');
      expect(reactive?.scores.tactical).toBe(1);
    });

    it('intelligence-led option boosts strategic and innovation', () => {
      const intelligenceLed = q3.options.find((o) => o.id === 'intelligence-led');
      expect(intelligenceLed?.scores.strategic).toBe(2);
      expect(intelligenceLed?.scores.innovation).toBe(2);
    });
  });

  describe('Q4: Impact', () => {
    const q4 = wizardQuestions['q4-impact'];

    it('has three impact options', () => {
      expect(q4.options.length).toBe(3);
    });

    it('enterprise option boosts strategic and talent', () => {
      const enterprise = q4.options.find((o) => o.id === 'enterprise');
      expect(enterprise?.scores.strategic).toBe(2);
      expect(enterprise?.scores.talent).toBe(1);
    });
  });
});
