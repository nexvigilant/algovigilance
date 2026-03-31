/**
 * Strategic Diagnostic Assessment - Question Bank
 *
 * Adaptive diagnostic flow with branching logic based on user responses.
 * Designed as a "Lead Generation Exam" to evaluate organizational maturity.
 */

import type { WizardQuestion, WizardState } from '@/types/service-wizard';

// =============================================================================
// Question Definitions
// =============================================================================

export const wizardQuestions: Record<string, WizardQuestion> = {
  // ---------------------------------------------------------------------------
  // Entry Question (Always Asked First)
  // ---------------------------------------------------------------------------
  'q1-situation': {
    id: 'q1-situation',
    text: 'Identify your primary strategic objective.',
    subtext: 'Select the operational mandate that currently defines your focus.',
    options: [
      {
        id: 'challenge',
        label: 'Resolution of Critical Failure Modes',
        description: 'Addressing structural gaps or operational risks',
        scores: {},
        nextQuestion: 'q2a-challenge-type',
        tags: ['challenge-focused'],
      },
      {
        id: 'opportunity',
        label: 'Pursuit of Strategic Advantage',
        description: 'Capitalizing on market shifts or innovation opportunities',
        scores: {},
        nextQuestion: 'q2b-opportunity-type',
        tags: ['opportunity-focused'],
      },
      {
        id: 'exploration',
        label: 'Capability Benchmarking',
        description: 'Benchmarking capabilities and identifying future trajectories',
        scores: {},
        nextQuestion: 'q2c-exploration-area',
        tags: ['exploration-focused'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Challenge Branch (Q2a)
  // ---------------------------------------------------------------------------
  'q2a-challenge-type': {
    id: 'q2a-challenge-type',
    text: "Define the nature of the structural gap.",
    subtext: 'Diagnostic assessment of current operational friction points.',
    branch: 'challenge',
    options: [
      {
        id: 'strategic-clarity',
        label: 'Architecture & Positioning Gap',
        description: 'Unclear strategic direction or poor market positioning',
        scores: { strategic: 3, innovation: 1 },
        nextQuestion: 'q3-maturity',
        tags: ['needs-direction', 'strategic-gap'],
      },
      {
        id: 'project-at-risk',
        label: 'Tactical Execution Failure',
        description: 'Critical projects at risk, timeline slippage, or quality issues',
        scores: { tactical: 3 },
        nextQuestion: 'q3-maturity',
        tags: ['project-risk', 'execution-gap'],
      },
      {
        id: 'capability-gaps',
        label: 'Capability & Talent Deficiency',
        description: 'Skill gaps in key PV domains or knowledge retention issues',
        scores: { talent: 3 },
        nextQuestion: 'q3-maturity',
        tags: ['capability-gap', 'team-development'],
      },
      {
        id: 'reactive-mode',
        label: 'Foresight Gap',
        description: 'Always reacting to signals instead of anticipating them',
        scores: { innovation: 3, strategic: 1 },
        nextQuestion: 'q3-maturity',
        tags: ['reactive-mode', 'foresight-gap'],
      },
      {
        id: 'technology-gap',
        label: 'Technological Debt / System Fragmentation',
        description: 'Manual processes, disconnected data, or outdated tools',
        scores: { technology: 3, tactical: 1 },
        nextQuestion: 'q3-maturity',
        tags: ['technology-gap', 'automation-focused'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Opportunity Branch (Q2b)
  // ---------------------------------------------------------------------------
  'q2b-opportunity-type': {
    id: 'q2b-opportunity-type',
    text: 'What is the target strategic advantage?',
    subtext: 'Define the intended outcome of this strategic intervention.',
    branch: 'opportunity',
    options: [
      {
        id: 'new-market',
        label: 'Market Expansion & Therapeutic Entry',
        description: 'Expanding into new regions or therapeutic areas',
        scores: { strategic: 3, innovation: 2 },
        nextQuestion: 'q3-maturity',
        tags: ['market-expansion', 'growth-focused'],
      },
      {
        id: 'competitive-advantage',
        label: 'Structural Competitive Advantage',
        description: 'Redefining leadership through better safety data',
        scores: { strategic: 2, innovation: 2 },
        nextQuestion: 'q3-maturity',
        tags: ['competitive-positioning', 'differentiation'],
      },
      {
        id: 'operational-excellence',
        label: 'Efficiency & Operational Command',
        description: 'Improving speed, quality, and precision of safety operations',
        scores: { tactical: 2, talent: 1, technology: 1 },
        nextQuestion: 'q3-maturity',
        tags: ['operational-improvement', 'efficiency-focused'],
      },
      {
        id: 'digital-transformation',
        label: 'Digital Transformation',
        description: 'Enabling AI-powered workflows and automated signal detection',
        scores: { technology: 3, innovation: 2 },
        nextQuestion: 'q3-maturity',
        tags: ['digital-transformation', 'technology-focused'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Exploration Branch (Q2c)
  // ---------------------------------------------------------------------------
  'q2c-exploration-area': {
    id: 'q2c-exploration-area',
    text: 'Choose your focus area.',
    subtext: "Focus the diagnostic on the area of greatest organizational impact.",
    branch: 'exploration',
    options: [
      {
        id: 'direction',
        label: 'Strategic Direction & Corporate Trajectory',
        description: 'Understanding where to focus for long-term safety leadership',
        scores: { strategic: 2 },
        nextQuestion: 'q3-maturity',
        tags: ['strategic-interest', 'direction-seeking'],
      },
      {
        id: 'future-trends',
        label: 'Foresight & Emerging Safety Signals',
        description: 'Preparing for shifts in the regulatory and safety landscape',
        scores: { innovation: 3 },
        nextQuestion: 'q3-maturity',
        tags: ['future-focused', 'trend-aware'],
      },
      {
        id: 'execution',
        label: 'Precision Execution & Regulatory Command',
        description: 'Benchmarking current project delivery and compliance speed',
        scores: { tactical: 2 },
        nextQuestion: 'q3-maturity',
        tags: ['execution-interest', 'delivery-focused'],
      },
      {
        id: 'people',
        label: 'Talent Architecture & Capability Benchmarking',
        description: 'Evaluating team competency and development potential',
        scores: { talent: 3 },
        nextQuestion: 'q3-maturity',
        tags: ['people-focused', 'development-interest'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Maturity Question (New Q3 - Diagnostic Replacement for Timeline)
  // ---------------------------------------------------------------------------
  'q3-maturity': {
    id: 'q3-maturity',
    text: 'Rate your current capability maturity level.',
    subtext: 'Benchmark your organizational readiness against AlgoVigilance standards.',
    options: [
      {
        id: 'reactive',
        label: 'Tier 1: Reactive',
        description: 'Operational focus is prioritized toward immediate compliance and symptom resolution.',
        scores: { tactical: 1 },
        nextQuestion: 'q4-impact',
        tags: ['maturity-l1', 'reactive'],
      },
      {
        id: 'standardized',
        label: 'Tier 2: Standardized',
        description: 'Operational protocols are defined but lack automated integration or predictive depth.',
        scores: { tactical: 2 },
        nextQuestion: 'q4-impact',
        tags: ['maturity-l2', 'standardized'],
      },
      {
        id: 'optimized',
        label: 'Tier 3: Optimized',
        description: 'Efficiencies are realized through integrated metrics and early-stage strategic foresight.',
        scores: { strategic: 1, technology: 1 },
        nextQuestion: 'q4-impact',
        tags: ['maturity-l3', 'optimized'],
      },
      {
        id: 'intelligence-led',
        label: 'Tier 4: Data-Led',
        description: 'Proactive competitive advantage achieved through advanced data science and uncompromised oversight.',
        scores: { strategic: 2, innovation: 2 },
        nextQuestion: 'q4-impact',
        tags: ['maturity-l4', 'intelligence-led'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Impact Question (Q4)
  // ---------------------------------------------------------------------------
  'q4-impact': {
    id: 'q4-impact',
    text: "What is the intended scope of impact?",
    subtext: 'Scale of the strategic intervention required.',
    options: [
      {
        id: 'specific-project',
        label: 'Initiative-Specific',
        description: 'Focus on a single project, molecule, or regulatory event',
        scores: { tactical: 1 },
        tags: ['project-scope', 'focused'],
      },
      {
        id: 'department',
        label: 'Functional / Business Unit',
        description: 'Impacting an entire PV or Regulatory department',
        scores: {},
        tags: ['department-scope', 'team-level'],
      },
      {
        id: 'enterprise',
        label: 'Enterprise / Organizational',
        description: 'Organization-wide strategic transformation',
        scores: { strategic: 2, talent: 1 },
        tags: ['enterprise-scope', 'transformational'],
      },
    ],
  },
};

// =============================================================================
// Question Flow Resolution
// =============================================================================

export function resolveQuestionFlow(state: WizardState): string[] {
  const flow: string[] = ['q1-situation'];
  const q1Answer = state.answers['q1-situation'];
  if (!q1Answer) return flow;

  const q1Option = wizardQuestions['q1-situation'].options.find(
    (o) => o.id === q1Answer
  );
  if (q1Option?.nextQuestion) {
    flow.push(q1Option.nextQuestion);
  }

  flow.push('q3-maturity');
  flow.push('q4-impact');

  return flow;
}

export function getNextQuestionId(
  currentQuestionId: string,
  selectedOption: string,
  state: WizardState
): string | null {
  const currentQuestion = wizardQuestions[currentQuestionId];
  if (!currentQuestion) return null;

  const option = currentQuestion.options.find((o) => o.id === selectedOption);
  if (!option) return null;

  if (option.nextQuestion) {
    return option.nextQuestion;
  }

  const flow = resolveQuestionFlow(state);
  const currentIndex = flow.indexOf(currentQuestionId);

  if (currentIndex === -1 || currentIndex >= flow.length - 1) {
    return null;
  }

  return flow[currentIndex + 1];
}

export function hasMoreQuestions(state: WizardState): boolean {
  const flow = resolveQuestionFlow(state);
  return state.questionIndex < flow.length - 1;
}

export function getCurrentQuestion(state: WizardState): WizardQuestion | null {
  const flow = resolveQuestionFlow(state);
  const questionId = flow[state.questionIndex];
  return questionId ? wizardQuestions[questionId] : null;
}

export function calculateProgress(state: WizardState): number {
  const flow = resolveQuestionFlow(state);
  const totalQuestions = flow.length || 4;
  const answeredQuestions = Object.keys(state.answers).length;
  return Math.round((answeredQuestions / totalQuestions) * 100);
}