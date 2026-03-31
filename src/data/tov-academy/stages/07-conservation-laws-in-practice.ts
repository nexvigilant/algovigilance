/**
 * Stage: Conservation Laws in Practice
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage07: CapabilityStage = {
  id: 'tov-01-07',
  title: 'Conservation Laws in Practice',
  description: 'Evaluate the eleven conservation laws in real-world pharmacovigilance scenarios. Assess how violations of Capacity/Saturation, Charge Conservation, Stoichiometry, and Structural Invariant laws produce detectable safety signals.',
  lessons: [
    {
      id: 'tov-01-07-a01',
      title: 'Conservation Law Violations as Signals',
      description: 'Conservation Law Violations as Signals',
      content: `## Conservation Law Violations as Signals\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-07-a02',
      title: 'Detecting Mass/Amount and Energy Violations',
      description: 'Detecting Mass/Amount and Energy Violations',
      content: `## Detecting Mass/Amount and Energy Violations\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-07-a03',
      title: 'Catalyst Invariance and Entropy Analysis',
      description: 'Catalyst Invariance and Entropy Analysis',
      content: `## Catalyst Invariance and Entropy Analysis\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-07-a04',
      title: 'Charge, Stoichiometry, and Structural Invariant',
      description: 'Charge, Stoichiometry, and Structural Invariant',
      content: `## Charge, Stoichiometry, and Structural Invariant\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-07-a05',
      title: 'Conservation Law Scenario Analysis',
      description: 'Conservation Law Scenario Analysis',
      content: `## Conservation Law Scenario Analysis\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-07-a06',
      title: 'Conservation Laws Assessment',
      description: 'Conservation Laws Assessment',
      content: '',
      estimatedDuration: 10,
      assessment: {
        type: 'quiz',
        passingScore: 85,
        questions: [
        {
          id: 'tov-01-07-q01',
        type: 'multiple-choice',
        options: [
          'Mass/Amount Conservation (Law 1) — 5 reports/day are unaccounted for',
          'Energy/Gradient Conservation (Law 2) — processing energy is insufficient',
          'Flux Continuity (Law 4) — flow rate is discontinuous',
          'Capacity/Saturation (Law 8) — system is overloaded',
        ],
        correctAnswer: 0,
          question: 'A pharmacovigilance system shows reports entering at a rate of 100/day but only 85/day are processed and 10/day are archived. Which conservation law is violated?',
          explanation: '100 in - 85 processed - 10 archived = 5 unaccounted. Mass/Amount Conservation (Law 1) requires that all quantities are traceable. The missing 5 reports per day indicate a conservation violation.',
          points: 3,
        },
        {
          id: 'tov-01-07-q02',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'The Structural Invariant law (Law 11) ensures that the fundamental topology of a pharmacovigilance system remains stable under normal operating conditions.',
          explanation: 'Law 11 (Structural Invariant) preserves the fundamental architecture. Changes to system structure indicate a phase transition or boundary violation.',
          points: 1,
        }
        ],
      },
}
  ],
};
