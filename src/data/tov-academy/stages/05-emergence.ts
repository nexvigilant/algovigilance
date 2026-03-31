/**
 * Stage: Emergence
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage05: CapabilityStage = {
  id: 'tov-01-05',
  title: 'Emergence',
  description: 'Axiom A5 — System-level behaviors emerge from component interactions. Analyze how cascading effects arise when hierarchically organized subsystems (A2) interact near the safety boundary (A4), producing emergent phenomena that cannot be predicted from components alone.',
  lessons: [
    {
      id: 'tov-01-05-a01',
      title: 'Emergence in Complex Systems',
      description: 'Emergence in Complex Systems',
      content: `## Emergence in Complex Systems\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-05-a02',
      title: 'Cascading Failure Analysis',
      description: 'Cascading Failure Analysis',
      content: `## Cascading Failure Analysis\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'tov-01-05-a03',
      title: 'Emergence in Drug Safety Signals',
      description: 'Emergence in Drug Safety Signals',
      content: `## Emergence in Drug Safety Signals\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'tov-01-05-a04',
      title: 'Emergence Assessment',
      description: 'Emergence Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'tov-01-05-q01',
        type: 'multiple-choice',
        options: [
          'Depth 2 — it depends on A2 and A4',
          'Depth 0 — it is a root axiom',
          'Depth 1 — it depends only on A1',
          'Depth 3 — it depends on all other axioms',
        ],
        correctAnswer: 0,
          question: 'Axiom A5 (Emergence) is at what depth in the axiom dependency DAG?',
          explanation: 'A5 is at depth 2, depending on A2 (Hierarchical Organization) and A4 (Safety Manifold). It is the deepest axiom in the DAG.',
          points: 2,
        },
        {
          id: 'tov-01-05-q02',
        type: 'true-false',
        correctAnswer: 0 as 0 | 1,
          question: 'Emergent safety signals can always be predicted by analyzing individual component behaviors in isolation.',
          explanation: 'By definition, emergence produces behaviors that cannot be predicted from components alone. This is precisely why Axiom A5 exists — to account for system-level phenomena.',
          points: 1,
        }
        ],
      },
}
  ],
};
