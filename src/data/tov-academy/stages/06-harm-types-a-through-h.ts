/**
 * Stage: Harm Types A through H
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage06: CapabilityStage = {
  id: 'tov-01-06',
  title: 'Harm Types A through H',
  description: 'Analyze the eight harm type classifications: Acute (A), Cumulative (B), Off-Target (C), Cascade (D), Idiosyncratic (E), Saturation (F), Interaction (G), and Population (H). Map each harm type to its conservation law and affected hierarchy levels.',
  lessons: [
    {
      id: 'tov-01-06-a01',
      title: 'Harm Type Classification Framework',
      description: 'Harm Type Classification Framework',
      content: `## Harm Type Classification Framework\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-06-a02',
      title: 'Acute and Cumulative Harm',
      description: 'Acute and Cumulative Harm',
      content: `## Acute and Cumulative Harm\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'tov-01-06-a03',
      title: 'Off-Target and Cascade Harm',
      description: 'Off-Target and Cascade Harm',
      content: `## Off-Target and Cascade Harm\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'tov-01-06-a04',
      title: 'Idiosyncratic and Saturation Harm',
      description: 'Idiosyncratic and Saturation Harm',
      content: `## Idiosyncratic and Saturation Harm\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'tov-01-06-a05',
      title: 'Interaction and Population Harm',
      description: 'Interaction and Population Harm',
      content: `## Interaction and Population Harm\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'tov-01-06-a06',
      title: 'Harm Type Case Studies',
      description: 'Harm Type Case Studies',
      content: `## Harm Type Case Studies\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-06-a07',
      title: 'Harm Types Assessment',
      description: 'Harm Types Assessment',
      content: '',
      estimatedDuration: 10,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'tov-01-06-q01',
        type: 'multiple-choice',
        options: [
          'Cascade (D)',
          'Acute (A)',
          'Population (H)',
          'Interaction (G)',
        ],
        correctAnswer: 0,
          question: 'Which harm type is characterized by effects at hierarchy levels 4, 5, 6, and 7, and is governed by Conservation Law 4 (Flux Continuity)?',
          explanation: 'Cascade harm (Type D) affects levels 4-7 and is governed by Flux Continuity (Law 4). Cascading effects propagate through the hierarchy when flux conservation is violated.',
          points: 2,
        },
        {
          id: 'tov-01-06-q02',
        type: 'multiple-select',
        options: [
          'Idiosyncratic (E)',
          'Population (H)',
          'Acute (A)',
          'Off-Target (C)',
        ],
        correctAnswer: [0, 1],
          question: 'Which harm types have NO associated conservation law? Select all that apply.',
          explanation: 'Idiosyncratic (E) and Population (H) have no associated conservation law. Acute maps to Law 1, Off-Target maps to Law 2.',
          points: 3,
        },
        {
          id: 'tov-01-06-q03',
        type: 'multiple-choice',
        options: [
          'Capacity/Saturation (Law 8)',
          'Mass/Amount (Law 1)',
          'Entropy Increase (Law 6)',
          'Catalyst Invariance (Law 5)',
        ],
        correctAnswer: 0,
          question: 'Saturation harm (Type F) is governed by which conservation law?',
          explanation: 'Saturation harm (Type F) maps to Law 8 (Capacity/Saturation). When processing capacity is exceeded, saturation-type harm occurs at levels 3, 4, and 5.',
          points: 2,
        }
        ],
      },
}
  ],
};
