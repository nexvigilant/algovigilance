/**
 * Stage: Safety Manifold
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage04: CapabilityStage = {
  id: 'tov-01-04',
  title: 'Safety Manifold',
  description: 'Axiom A4 — System states form a manifold with a safety boundary. Apply the concept of d(s) — the distance from current state to the safety boundary — and understand how the Safety Manifold integrates System Decomposition (A1) and Conservation Constraints (A3) to define operational safety regions.',
  lessons: [
    {
      id: 'tov-01-04-a01',
      title: 'The Safety Boundary Concept',
      description: 'The Safety Boundary Concept',
      content: `## The Safety Boundary Concept\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-04-a02',
      title: 'Computing d(s) Safety Distance',
      description: 'Computing d(s) Safety Distance',
      content: `## Computing d(s) Safety Distance\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'tov-01-04-a03',
      title: 'Safety Manifold Case Study',
      description: 'Safety Manifold Case Study',
      content: `## Safety Manifold Case Study\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-04-a04',
      title: 'Signal Detection Thresholds',
      description: 'Signal Detection Thresholds',
      content: `## Signal Detection Thresholds\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'tov-01-04-a05',
      title: 'Safety Manifold Assessment',
      description: 'Safety Manifold Assessment',
      content: '',
      estimatedDuration: 10,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'tov-01-04-q01',
        type: 'multiple-choice',
        options: [
          'A1 (System Decomposition) and A3 (Conservation Constraints)',
          'A1 (System Decomposition) and A2 (Hierarchical Organization)',
          'A2 (Hierarchical Organization) and A3 (Conservation Constraints)',
          'A3 (Conservation Constraints) only',
        ],
        correctAnswer: 0,
          question: 'Axiom A4 (Safety Manifold) depends on which axioms?',
          explanation: 'A4 depends on both A1 and A3. The safety manifold requires decomposed subsystems (A1) that obey conservation laws (A3) to define meaningful state boundaries.',
          points: 2,
        },
        {
          id: 'tov-01-04-q02',
        type: 'multiple-choice',
        options: [
          '2.0',
          '1.0',
          '3.841',
          '0.5',
        ],
        correctAnswer: 0,
          question: 'What is the default PRR (Proportional Reporting Ratio) threshold for signal detection in the Theory of Vigilance?',
          explanation: 'The default PRR threshold is 2.0. This means a drug-event combination must be reported at least twice as often as expected to constitute a potential signal.',
          points: 2,
        },
        {
          id: 'tov-01-04-q03',
        type: 'multiple-select',
        options: [
          'Chi-square >= 3.841',
          'ROR lower CI > 1.0',
          'IC025 > 0',
          'EB05 >= 2.0',
        ],
        correctAnswer: [0, 1, 2, 3],
          question: 'Which signal detection thresholds are defined in the Theory of Vigilance? Select all that apply.',
          explanation: 'All four are standard signal detection thresholds: Chi-sq >= 3.841 (p < 0.05), ROR lower 95% CI > 1.0, IC025 > 0 (Bayesian), and EB05 >= 2.0 (Empirical Bayes).',
          points: 4,
        }
        ],
      },
}
  ],
};
