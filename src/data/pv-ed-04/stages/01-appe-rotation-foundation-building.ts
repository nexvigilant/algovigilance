/**
 * Stage: APPE Rotation: Foundation Building
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage01: CapabilityStage = {
  id: 'pv-ed-04-01',
  title: 'APPE Rotation: Foundation Building',
  description: 'Six-week Advanced Pharmacy Practice Experience rotation establishing baseline PV competency. Introduces all 8 Critical Professional Activities at Level 1-2 (Direct Supervision to Indirect Supervision). Primary modalities: Experiential learning through direct observation and structured didactic instruction.',
  lessons: [
    {
      id: 'pv-ed-04-01-a01',
      title: 'APPE PV Rotation Structure and Learning Objectives',
      description: 'APPE PV Rotation Structure and Learning Objectives',
      content: `## APPE PV Rotation Structure and Learning Objectives\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-04-01-a02',
      title: 'Mapping ACPE Standards to PV Competencies',
      description: 'Mapping ACPE Standards to PV Competencies',
      content: `## Mapping ACPE Standards to PV Competencies\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-04-01-a03',
      title: 'APPE Foundation Assessment',
      description: 'APPE Foundation Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-04-01-q01',
        type: 'multiple-choice',
        options: [
          'Direct active supervision — the supervisor is physically present and actively guides the learner',
          'Indirect supervision — the supervisor is available but not directly observing',
          'Reactive supervision — the supervisor is contacted only when the learner encounters a problem',
          'Full autonomy — the learner performs independently and supervises others',
        ],
        correctAnswer: 0,
          question: 'In EPA-based assessment, Level 1 entrustment means the learner performs an activity under which condition?',
          explanation: 'EPA entrustment Level 1 is \'Observe only\' or direct active supervision where the supervisor is present and actively guiding. Level 2 is direct supervision with the learner performing, Level 3 is indirect supervision, Level 4 is distant supervision (practice-ready), and Level 5 is aspired autonomy.',
          points: 2,
        },
        {
          id: 'pv-ed-04-01-q02',
        type: 'multiple-choice',
        options: [
          'Experiential learning through observed practice and structured preceptor feedback',
          'Self-directed online module completion without preceptor interaction',
          'Independent research projects submitted at rotation end',
          'AI-enhanced simulation without human oversight',
        ],
        correctAnswer: 0,
          question: 'Which learning modality is MOST emphasized during an APPE PV rotation for developing initial case processing skills?',
          explanation: 'APPE rotations are grounded in experiential learning per ACPE Standards 2025. Students develop initial competency through direct observation, hands-on practice under supervision, and structured feedback from experienced preceptors.',
          points: 2,
        },
        {
          id: 'pv-ed-04-01-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'During a 6-week APPE PV rotation, a student is expected to achieve Level 1-2 entrustment across all 8 Critical Professional Activities.',
          explanation: 'The APPE rotation provides foundational exposure to all 8 CPAs at introductory entrustment levels (L1-L2). This establishes baseline awareness and initial supervised practice before deeper competency development in fellowship or employment.',
          points: 1,
        }
        ],
      },
}
  ],
};
