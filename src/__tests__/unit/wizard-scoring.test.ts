/**
 * Unit Tests: Service Discovery Wizard - Scoring Algorithm
 *
 * Tests the scoring logic, recommendation generation, and state helpers.
 */

import {
  calculateScores,
  collectTags,
  generateRecommendations,
  processAnswer,
  isWizardComplete,
} from '@/lib/wizard-scoring';
import { createInitialWizardState } from '@/types/service-wizard';
import type { WizardState } from '@/types/service-wizard';

describe('Wizard Scoring Algorithm', () => {
  describe('calculateScores', () => {
    it('returns zero scores for empty answers', () => {
      const scores = calculateScores({});
      expect(scores).toEqual({
        strategic: 0,
        innovation: 0,
        tactical: 0,
        talent: 0,
        technology: 0,
        maturity: 0,
      });
    });

    it('calculates scores correctly for challenge branch - strategic clarity', () => {
      const answers = {
        'q1-situation': 'challenge',
        'q2a-challenge-type': 'strategic-clarity',
      };
      const scores = calculateScores(answers);
      expect(scores.strategic).toBe(3);
      expect(scores.innovation).toBe(1);
      expect(scores.tactical).toBe(0);
      expect(scores.talent).toBe(0);
      expect(scores.technology).toBe(0);
    });

    it('calculates scores correctly for challenge branch - project at risk', () => {
      const answers = {
        'q1-situation': 'challenge',
        'q2a-challenge-type': 'project-at-risk',
      };
      const scores = calculateScores(answers);
      expect(scores.tactical).toBe(3);
      expect(scores.strategic).toBe(0);
    });

    it('calculates scores correctly for opportunity branch - new market', () => {
      const answers = {
        'q1-situation': 'opportunity',
        'q2b-opportunity-type': 'new-market',
      };
      const scores = calculateScores(answers);
      expect(scores.strategic).toBe(3);
      expect(scores.innovation).toBe(2);
    });

    it('accumulates scores across multiple questions', () => {
      const answers = {
        'q1-situation': 'challenge',
        'q2a-challenge-type': 'strategic-clarity', // strategic: 3, innovation: 1
        'q3-maturity': 'reactive', // tactical: 1
        'q4-impact': 'enterprise', // strategic: 2, talent: 1
      };
      const scores = calculateScores(answers);
      expect(scores.strategic).toBe(5); // 3 + 2
      expect(scores.innovation).toBe(1);
      expect(scores.tactical).toBe(1);
      expect(scores.talent).toBe(1);
    });
  });

  describe('collectTags', () => {
    it('returns empty array for no answers', () => {
      const tags = collectTags({});
      expect(tags).toEqual([]);
    });

    it('collects tags from answers', () => {
      const answers = {
        'q1-situation': 'challenge',
        'q2a-challenge-type': 'strategic-clarity',
      };
      const tags = collectTags(answers);
      expect(tags).toContain('challenge-focused');
      expect(tags).toContain('needs-direction');
      expect(tags).toContain('strategic-gap');
    });

    it('removes duplicate tags', () => {
      const answers = {
        'q1-situation': 'challenge',
      };
      const tags = collectTags(answers);
      // Each tag should appear only once
      const uniqueTags = [...new Set(tags)];
      expect(tags.length).toBe(uniqueTags.length);
    });
  });

  describe('processAnswer', () => {
    it('updates answers correctly', () => {
      const state = createInitialWizardState();
      const updates = processAnswer(state, 'q1-situation', 'challenge');

      expect(updates.answers).toEqual({ 'q1-situation': 'challenge' });
      expect(updates.branch).toBe('challenge');
      expect(updates.tags).toContain('challenge-focused');
    });

    it('recalculates scores on each answer', () => {
      let state = createInitialWizardState();

      // First answer
      let updates = processAnswer(state, 'q1-situation', 'challenge');
      state = { ...state, ...updates };

      // Second answer
      updates = processAnswer(state, 'q2a-challenge-type', 'project-at-risk');

      expect(updates.scores?.tactical).toBe(3);
    });

    it('sets branch correctly from Q1 answer', () => {
      const state = createInitialWizardState();

      const challengeUpdates = processAnswer(state, 'q1-situation', 'challenge');
      expect(challengeUpdates.branch).toBe('challenge');

      const opportunityUpdates = processAnswer(state, 'q1-situation', 'opportunity');
      expect(opportunityUpdates.branch).toBe('opportunity');

      const explorationUpdates = processAnswer(state, 'q1-situation', 'exploration');
      expect(explorationUpdates.branch).toBe('exploration');
    });
  });

  describe('isWizardComplete', () => {
    it('returns false for initial state', () => {
      const state = createInitialWizardState();
      expect(isWizardComplete(state)).toBe(false);
    });

    it('returns false with only Q1 answered', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: { 'q1-situation': 'challenge' },
        branch: 'challenge',
      };
      expect(isWizardComplete(state)).toBe(false);
    });

    it('returns true when minimum required questions answered (challenge branch)', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: {
          'q1-situation': 'challenge',
          'q2a-challenge-type': 'strategic-clarity',
          'q3-maturity': 'standardized',
          'q4-impact': 'department',
        },
        branch: 'challenge',
      };
      expect(isWizardComplete(state)).toBe(true);
    });

    it('returns true when minimum required questions answered (opportunity branch)', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: {
          'q1-situation': 'opportunity',
          'q2b-opportunity-type': 'new-market',
          'q3-maturity': 'optimized',
          'q4-impact': 'enterprise',
        },
        branch: 'opportunity',
      };
      expect(isWizardComplete(state)).toBe(true);
    });
  });

  describe('generateRecommendations', () => {
    it('generates primary recommendation with highest score', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: {
          'q1-situation': 'challenge',
          'q2a-challenge-type': 'project-at-risk', // tactical: 3
          'q3-maturity': 'reactive', // tactical: 1
          'q4-impact': 'specific-project', // tactical: 1
        },
        scores: { strategic: 0, innovation: 0, tactical: 5, talent: 0, technology: 0, maturity: 0 },
        tags: ['challenge-focused', 'project-risk', 'maturity-l1'],
        branch: 'challenge',
        screen: 'results',
        questionIndex: 4,
        questionFlow: [],
        isProcessing: false,
      };

      const recommendations = generateRecommendations(state);

      expect(recommendations.primary.category).toBe('tactical');
      expect(recommendations.primary.isPrimary).toBe(true);
      expect(recommendations.primary.score).toBe(5);
    });

    it('includes secondary recommendations above threshold', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: {
          'q1-situation': 'opportunity',
          'q2b-opportunity-type': 'new-market', // strategic: 3, innovation: 2
        },
        scores: { strategic: 3, innovation: 2, tactical: 0, talent: 0, technology: 0, maturity: 0 },
        tags: ['opportunity-focused', 'market-expansion'],
        branch: 'opportunity',
        screen: 'results',
        questionIndex: 2,
        questionFlow: [],
        isProcessing: false,
      };

      const recommendations = generateRecommendations(state);

      expect(recommendations.primary.category).toBe('strategic');
      // Innovation (2) is above 40% threshold of max (3 * 0.4 = 1.2)
      expect(recommendations.secondary.length).toBeGreaterThanOrEqual(1);
      expect(recommendations.secondary[0]?.category).toBe('innovation');
    });

    it('generates personalized message', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: { 'q1-situation': 'challenge' },
        scores: { strategic: 1, innovation: 0, tactical: 0, talent: 0, technology: 0, maturity: 0 },
        tags: ['challenge-focused'],
        branch: 'challenge',
        screen: 'results',
        questionIndex: 1,
        questionFlow: [],
        isProcessing: false,
      };

      const recommendations = generateRecommendations(state);

      expect(recommendations.personalizedMessage).toBeTruthy();
      expect(typeof recommendations.personalizedMessage).toBe('string');
    });

    it('generates situation summary', () => {
      const state: WizardState = {
        ...createInitialWizardState(),
        answers: {
          'q1-situation': 'opportunity',
          'q3-maturity': 'optimized',
          'q4-impact': 'enterprise',
        },
        scores: { strategic: 1, innovation: 1, tactical: 0, talent: 0, technology: 0, maturity: 0 },
        tags: ['opportunity-focused', 'maturity-l3', 'enterprise-scope'],
        branch: 'opportunity',
        screen: 'results',
        questionIndex: 3,
        questionFlow: [],
        isProcessing: false,
      };

      const recommendations = generateRecommendations(state);

      expect(recommendations.situationSummary).toContain('strategic advantage pursuit');
    });
  });
});
