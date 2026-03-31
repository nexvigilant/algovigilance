/**
 * Stage: System Decomposition
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage01: CapabilityStage = {
  id: 'tov-01-01',
  title: 'System Decomposition',
  description: 'Axiom A1 — Every pharmacovigilance system decomposes into measurable subsystems. Learn to identify system boundaries and decompose complex drug safety processes into primitive components.',
  lessons: [
    {
      id: 'tov-01-01-a01',
      title: 'Identifying System Boundaries',
      description: 'Identifying System Boundaries',
      content: `## Identifying System Boundaries\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-01-a02',
      title: 'Decomposition in Practice',
      description: 'Decomposition in Practice',
      content: `## Decomposition in Practice\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-01-a03',
      title: 'System Decomposition Assessment',
      description: 'System Decomposition Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'tov-01-01-q01',
        type: 'multiple-choice',
        options: [
          'It must decompose into measurable subsystems',
          'It must operate as a single monolithic unit',
          'It must rely on qualitative assessment only',
          'It must be validated by external auditors',
        ],
        correctAnswer: 0,
          question: 'According to Axiom A1 (System Decomposition), what is the fundamental requirement for any pharmacovigilance system?',
          explanation: 'Axiom A1 states that every PV system decomposes into measurable subsystems. This is the foundational axiom upon which all other axioms depend.',
          points: 2,
        },
        {
          id: 'tov-01-01-q02',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'System Decomposition (A1) has no dependencies on other axioms and serves as a root axiom in the Theory of Vigilance.',
          explanation: 'A1 is at depth 0 in the axiom dependency DAG with no dependencies, making it one of two root axioms alongside A3.',
          points: 1,
        }
        ],
      },
}
  ],
};
