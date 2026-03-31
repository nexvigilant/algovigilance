/**
 * Stage: Fellowship Months 1-6: Foundation Building
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage02: CapabilityStage = {
  id: 'pv-ed-04-02',
  title: 'Fellowship Months 1-6: Foundation Building',
  description: 'First six months of PV fellowship focused on structured foundation building. All five learning modalities active: intensive didactic instruction, experiential case work under direct supervision, assigned mentorship relationships, guided self-directed learning plans, and introduction to AI-enhanced tools. Target: Level 2 across core CPAs.',
  lessons: [
    {
      id: 'pv-ed-04-02-a01',
      title: 'Fellowship Curriculum Design: Months 1-6',
      description: 'Fellowship Curriculum Design: Months 1-6',
      content: `## Fellowship Curriculum Design: Months 1-6\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-04-02-a02',
      title: 'Learning Modality Integration Planner',
      description: 'Learning Modality Integration Planner',
      content: `## Learning Modality Integration Planner\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-04-02-a03',
      title: 'Case Processing Under Supervision Simulation',
      description: 'Case Processing Under Supervision Simulation',
      content: `## Case Processing Under Supervision Simulation\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-04-02-a04',
      title: 'Fellowship Foundation Assessment',
      description: 'Fellowship Foundation Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-04-02-q01',
        type: 'multiple-choice',
        options: [
          'Ability to independently triage incoming ICSRs for seriousness and expectedness with >90% accuracy under indirect supervision',
          'Completion of all assigned reading materials and online modules',
          'Memorization of the complete MedDRA System Organ Class hierarchy',
          'Ability to independently write a complete PBRER without review',
        ],
        correctAnswer: 0,
          question: 'During the foundation phase of a PV fellowship (months 1-6), which milestone best indicates readiness to progress to core competency building?',
          explanation: 'The transition from foundation to core competency requires demonstrated ability (not just knowledge) in fundamental PV tasks. Case triage is a core CPA-1 skill; performing it accurately under indirect supervision indicates Level 2-3 entrustment readiness.',
          points: 2,
        },
        {
          id: 'pv-ed-04-02-q02',
        type: 'multiple-choice',
        options: [
          'Regular one-on-one sessions with an experienced PV professional covering career development, complex case review, and professional identity formation',
          'Annual performance reviews conducted by the fellowship program director only',
          'Unstructured social interactions at professional conferences',
          'Peer-to-peer study groups without senior professional involvement',
        ],
        correctAnswer: 0,
          question: 'The mentorship modality in a PV fellowship ideally includes which structured component?',
          explanation: 'Effective PV mentorship follows best practices in health professions education: regular structured sessions, longitudinal relationship with a senior professional, and explicit coverage of both technical competency and professional identity development.',
          points: 2,
        },
        {
          id: 'pv-ed-04-02-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Self-directed learning in the fellowship foundation phase should follow a structured Individual Development Plan (IDP) with specific competency targets rather than unguided exploration.',
          explanation: 'An IDP with competency targets provides scaffolding for self-directed learning. In the foundation phase, fellows need structure to identify knowledge gaps and track progress. The IDP evolves to become more self-generated as the fellow matures.',
          points: 1,
        }
        ],
      },
}
  ],
};
