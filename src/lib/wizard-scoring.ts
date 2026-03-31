/**
 * Strategic Diagnostic Assessment - Scoring & Benchmarking Engine
 *
 * Calculates organizational maturity indices and strategic domain benchmarks
 * based on the AlgoVigilance Intelligence Doctrine.
 */

import type {
  ServiceCategory,
  WizardState,
  WizardRecommendations,
  ServiceRecommendation,
} from '@/types/service-wizard';
import {
  serviceInfo,
  getPersonalizedOutcomes,
  getSituationMessage,
} from '@/data/service-outcomes';
import { wizardQuestions } from '@/data/wizard-questions';

// =============================================================================
// Constants & Benchmarks
// =============================================================================

const RECOMMENDATION_THRESHOLD_VALUE = 0.4;
const MATURITY_LEVELS = {
  'reactive': 1,
  'standardized': 2,
  'optimized': 3,
  'intelligence-led': 4,
};

// =============================================================================
// Core Scoring Logic
// =============================================================================

/**
 * Calculates the total score for each strategic domain
 */
export function calculateScores(
  answers: Record<string, string>
): Record<ServiceCategory, number> {
  const scores: Record<ServiceCategory, number> = {
    strategic: 0,
    innovation: 0,
    tactical: 0,
    talent: 0,
    technology: 0,
    maturity: 0,
  };

  for (const [questionId, optionId] of Object.entries(answers)) {
    const question = wizardQuestions[questionId];
    if (!question) continue;

    const option = question.options.find((o) => o.id === optionId);
    if (!option?.scores) continue;

    for (const [category, score] of Object.entries(option.scores)) {
      scores[category as ServiceCategory] += score;
    }
  }

  return scores;
}

/**
 * Calculates the Organizational Maturity Index (1.0 - 4.0)
 */
export function calculateMaturityIndex(answers: Record<string, string>): number {
  const maturityAnswer = answers['q3-maturity'];
  if (!maturityAnswer) return 1.0;
  
  return MATURITY_LEVELS[maturityAnswer as keyof typeof MATURITY_LEVELS] || 1.0;
}

/**
 * Collects diagnostic tags for intelligence mapping
 */
export function collectTags(answers: Record<string, string>): string[] {
  const tags: string[] = [];

  for (const [questionId, optionId] of Object.entries(answers)) {
    const question = wizardQuestions[questionId];
    if (!question) continue;

    const option = question.options.find((o) => o.id === optionId);
    if (option?.tags) {
      tags.push(...option.tags);
    }
  }

  return [...new Set(tags)];
}

// =============================================================================
// Recommendation Generation
// =============================================================================

/**
 * Generates high-fidelity strategic recommendations
 */
export function generateRecommendations(state: WizardState): WizardRecommendations {
  const scores = state.scores;
  const tags = state.tags;
  const maturityIndex = calculateMaturityIndex(state.answers);

  // Sort domains by impact score
  const sortedServices = (Object.entries(scores) as [ServiceCategory, number][])
    .sort((a, b) => b[1] - a[1]);

  const maxScore = sortedServices[0][1];
  const primaryCategory = sortedServices[0][0];

  // Primary Strategic Imperative
  const primary: ServiceRecommendation = {
    category: primaryCategory,
    score: maxScore,
    isPrimary: true,
    outcomes: getPersonalizedOutcomes(primaryCategory, tags),
    headline: serviceInfo[primaryCategory].tagline,
  };

  // Concurrent Operational Mandates
  const threshold = maxScore * RECOMMENDATION_THRESHOLD_VALUE;
  const secondary: ServiceRecommendation[] = sortedServices
    .slice(1)
    .filter(([_, score]) => score >= threshold && score > 0)
    .map(([category, score]) => ({
      category,
      score,
      isPrimary: false,
      outcomes: getPersonalizedOutcomes(category, tags).slice(0, 2),
      headline: serviceInfo[category].tagline,
    }));

  return {
    primary,
    secondary,
    personalizedMessage: getSituationMessage(tags),
    situationSummary: generateSituationSummary(state, maturityIndex),
  };
}

/**
 * Generates a clinical intelligence briefing summary
 */
function generateSituationSummary(state: WizardState, maturityIndex: number): string {
  const branch = state.branch;
  const impact = state.answers['q4-impact'];
  
  const maturityLabels = ['Reactive', 'Standardized', 'Optimized', 'Intelligence-Led'];
  const currentMaturity = maturityLabels[Math.floor(maturityIndex) - 1] || 'Reactive';

  let summary = `Initial diagnostic identifies a focus on `;
  
  if (branch === 'challenge') summary += `structural failure mode resolution `;
  else if (branch === 'opportunity') summary += `strategic advantage pursuit `;
  else summary += `capability benchmarking `;

  summary += `operating at a ${currentMaturity} maturity level. `;

  if (impact === 'enterprise') {
    summary += `The required intervention scope is Enterprise-wide, necessitating deep architectural transformation.`;
  } else if (impact === 'department') {
    summary += `Targeted functional uplift is required to resolve localized bottlenecks.`;
  } else {
    summary += `High-precision support is needed for a specific operational initiative.`;
  }

  return summary;
}

// =============================================================================
// State Management
// =============================================================================

export function processAnswer(
  state: WizardState,
  questionId: string,
  optionId: string
): Partial<WizardState> {
  const question = wizardQuestions[questionId];
  if (!question) return {};

  const option = question.options.find((o) => o.id === optionId);
  if (!option) return {};

  const newAnswers = { ...state.answers, [questionId]: optionId };
  const newScores = calculateScores(newAnswers);
  const newTags = collectTags(newAnswers);

  let branch = state.branch;
  if (questionId === 'q1-situation') {
    branch = optionId as 'challenge' | 'opportunity' | 'exploration';
  }

  return {
    answers: newAnswers,
    scores: newScores,
    tags: newTags,
    branch,
  };
}

export function isWizardComplete(state: WizardState): boolean {
  const requiredQuestions = ['q1-situation', 'q3-maturity', 'q4-impact'];
  for (const qId of requiredQuestions) {
    if (!state.answers[qId]) return false;
  }
  return true;
}