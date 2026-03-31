/**
 * Stage: Conservation Constraints
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage03: CapabilityStage = {
  id: 'tov-01-03',
  title: 'Conservation Constraints',
  description: 'Axiom A3 — Measurable quantities obey conservation laws. Learn the eleven conservation laws that govern pharmacovigilance systems: Mass/Amount, Energy/Gradient, State Normalization, Flux Continuity, Catalyst Invariance, Entropy Increase, Momentum, Capacity/Saturation, Charge Conservation, Stoichiometry, and Structural Invariant.',
  lessons: [
    {
      id: 'tov-01-03-a01',
      title: 'Conservation Laws Overview',
      description: 'Conservation Laws Overview',
      content: `## Conservation Laws Overview\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'tov-01-03-a02',
      title: 'Mass/Amount and Energy/Gradient Laws',
      description: 'Mass/Amount and Energy/Gradient Laws',
      content: `## Mass/Amount and Energy/Gradient Laws\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'tov-01-03-a03',
      title: 'State Normalization and Flux Continuity',
      description: 'State Normalization and Flux Continuity',
      content: `## State Normalization and Flux Continuity\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'tov-01-03-a04',
      title: 'Conservation Laws Assessment',
      description: 'Conservation Laws Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'tov-01-03-q01',
        type: 'multiple-choice',
        options: [
          'Mass/Amount Conservation (Law 1)',
          'Energy/Gradient Conservation (Law 2)',
          'Flux Continuity (Law 4)',
          'Stoichiometry (Law 10)',
        ],
        correctAnswer: 0,
          question: 'Which conservation law states that the total number of adverse event reports in a closed system cannot spontaneously increase or decrease?',
          explanation: 'Law 1 (Mass/Amount Conservation) ensures that quantities are preserved. Reports cannot appear or disappear without an identifiable source or sink.',
          points: 2,
        },
        {
          id: 'tov-01-03-q02',
        type: 'multiple-select',
        options: [
          'Catalyst Invariance (Law 5)',
          'Signal Amplification (Law 12)',
          'Entropy Increase (Law 6)',
          'Momentum (Law 7)',
        ],
        correctAnswer: [0, 2, 3],
          question: 'Which of the following are conservation laws in the Theory of Vigilance? Select all that apply.',
          explanation: 'Laws 5 (Catalyst Invariance), 6 (Entropy Increase), and 7 (Momentum) are three of the eleven conservation laws. There is no Law 12 — the ToV defines exactly eleven conservation laws.',
          points: 3,
        },
        {
          id: 'tov-01-03-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Axiom A3 (Conservation Constraints) is a root axiom with no dependencies, alongside A1 (System Decomposition).',
          explanation: 'A3 is at depth 0 with no dependencies. It and A1 are the two root axioms of the Theory of Vigilance.',
          points: 1,
        }
        ],
      },
}
  ],
};
