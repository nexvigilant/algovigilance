/**
 * Stage: Hierarchical Organization
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage02: CapabilityStage = {
  id: 'tov-01-02',
  title: 'Hierarchical Organization',
  description: 'Axiom A2 — Subsystems organize into hierarchical levels. Understand how decomposed components arrange into layers of increasing complexity and how this hierarchy governs information flow in safety surveillance.',
  lessons: [
    {
      id: 'tov-01-02-a01',
      title: 'Hierarchy Levels in Drug Safety',
      description: 'Hierarchy Levels in Drug Safety',
      content: `## Hierarchy Levels in Drug Safety\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-02-a02',
      title: 'Mapping Organizational Hierarchies',
      description: 'Mapping Organizational Hierarchies',
      content: `## Mapping Organizational Hierarchies\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-02-a03',
      title: 'Hierarchy and Information Flow',
      description: 'Hierarchy and Information Flow',
      content: `## Hierarchy and Information Flow\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'tov-01-02-a04',
      title: 'Hierarchical Organization Assessment',
      description: 'Hierarchical Organization Assessment',
      content: '',
      estimatedDuration: 10,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'tov-01-02-q01',
        type: 'multiple-choice',
        options: [
          'A1 (System Decomposition)',
          'A3 (Conservation Constraints)',
          'A4 (Safety Manifold)',
          'A5 (Emergence)',
        ],
        correctAnswer: 0,
          question: 'Axiom A2 (Hierarchical Organization) directly depends on which other axiom?',
          explanation: 'A2 depends on A1. You must first decompose a system (A1) before you can organize its parts into a hierarchy (A2).',
          points: 2,
        },
        {
          id: 'tov-01-02-q02',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'In the Theory of Vigilance, Hierarchical Organization (A2) is at depth 1 in the axiom dependency DAG.',
          explanation: 'A2 is at depth 1, depending only on A1 (depth 0). This places it one level above the root axioms.',
          points: 1,
        }
        ],
      },
}
  ],
};
