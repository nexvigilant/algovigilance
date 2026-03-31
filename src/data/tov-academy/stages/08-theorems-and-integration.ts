/**
 * Stage: Theorems and Integration
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage08: CapabilityStage = {
  id: 'tov-01-08',
  title: 'Theorems and Integration',
  description: 'Synthesize all five axioms through the three principal theorems: the Predictability Theorem (requires A1-A5), the Attenuation Theorem (requires A2, A5), and the Intervention Theorem (requires A3, A4, A5). Create integrated safety assessments using the complete Theory of Vigilance framework.',
  lessons: [
    {
      id: 'tov-01-08-a01',
      title: 'The Predictability Theorem',
      description: 'The Predictability Theorem',
      content: `## The Predictability Theorem\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'tov-01-08-a02',
      title: 'The Attenuation Theorem',
      description: 'The Attenuation Theorem',
      content: `## The Attenuation Theorem\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'tov-01-08-a03',
      title: 'The Intervention Theorem',
      description: 'The Intervention Theorem',
      content: `## The Intervention Theorem\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'tov-01-08-a04',
      title: 'Theorem Application Workshop',
      description: 'Theorem Application Workshop',
      content: `## Theorem Application Workshop\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'tov-01-08-a05',
      title: 'Integrated Safety Assessment Design',
      description: 'Integrated Safety Assessment Design',
      content: `## Integrated Safety Assessment Design\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'tov-01-08-a06',
      title: 'Theorems and Integration Assessment',
      description: 'Theorems and Integration Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 85,
        questions: [
        {
          id: 'tov-01-08-q01',
        type: 'multiple-choice',
        options: [
          'All five: A1, A2, A3, A4, and A5',
          'Only A1 and A5',
          'A2 and A5',
          'A3, A4, and A5',
        ],
        correctAnswer: 0,
          question: 'The Predictability Theorem requires which axioms?',
          explanation: 'The Predictability Theorem is the most demanding theorem, requiring all five axioms (A1-A5). Only when all conditions hold can system behavior be predicted.',
          points: 2,
        },
        {
          id: 'tov-01-08-q02',
        type: 'multiple-choice',
        options: [
          'The Intervention Theorem',
          'The Predictability Theorem',
          'The Attenuation Theorem',
          'There is no such theorem',
        ],
        correctAnswer: 0,
          question: 'Which theorem requires Axioms A3, A4, and A5 and provides the basis for designing safety interventions?',
          explanation: 'The Intervention Theorem requires A3 (Conservation Constraints), A4 (Safety Manifold), and A5 (Emergence). It establishes that interventions must respect conservation laws and safety boundaries while accounting for emergent effects.',
          points: 2,
        },
        {
          id: 'tov-01-08-q03',
        type: 'multiple-choice',
        options: [
          'A2 (Hierarchical Organization) and A5 (Emergence)',
          'A1 (System Decomposition) and A3 (Conservation Constraints)',
          'A4 (Safety Manifold) only',
          'All five axioms',
        ],
        correctAnswer: 0,
          question: 'The Attenuation Theorem depends on which axioms?',
          explanation: 'The Attenuation Theorem requires A2 (Hierarchical Organization) and A5 (Emergence). It describes how signals attenuate as they propagate through hierarchical levels.',
          points: 2,
        },
        {
          id: 'tov-01-08-q04',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'The Theory of Vigilance defines exactly three principal theorems: Predictability, Attenuation, and Intervention.',
          explanation: 'The three principal theorems are: Predictability (A1-A5), Attenuation (A2, A5), and Intervention (A3, A4, A5). Together they cover prediction, signal propagation, and corrective action.',
          points: 1,
        }
        ],
      },
}
  ],
};
