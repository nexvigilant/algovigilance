/**
 * Stage: Recognition Pathway Development
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage06: CapabilityStage = {
  id: 'pv-ed-07-06',
  title: 'Recognition Pathway Development',
  description: 'Evaluate strategies for building recognition pathways: securing endorsement from professional bodies (DIA, ISPE, Royal Pharmaceutical Society), regulatory agency acknowledgment, establishing academic institution credit partnerships (CPD, CE, academic credits), and engaging industry advisory boards to validate curriculum relevance.',
  lessons: [
    {
      id: 'pv-ed-07-06-a01',
      title: 'Building Professional Recognition Pathways',
      description: 'Building Professional Recognition Pathways',
      content: `## Building Professional Recognition Pathways\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-07-06-a02',
      title: 'Evaluating Recognition Strategies',
      description: 'Evaluating Recognition Strategies',
      content: `## Evaluating Recognition Strategies\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-07-06-a03',
      title: 'Academic Credit Partnership Design',
      description: 'Academic Credit Partnership Design',
      content: `## Academic Credit Partnership Design\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-07-06-a04',
      title: 'Recognition Pathways Assessment',
      description: 'Recognition Pathways Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-07-06-q01',
        type: 'multiple-choice',
        options: [
          'Demonstrated alignment between program learning outcomes and academic credit-level descriptors (e.g., QAA FHEQ levels)',
          'Having the largest number of enrolled learners',
          'Offering the program at the lowest cost',
          'Using the same learning management system as the academic institution',
        ],
        correctAnswer: 0,
          question: 'When seeking academic credit partnerships for a PV education program, which factor is most critical for institutional acceptance?',
          explanation: 'Academic institutions grant credit based on demonstrated equivalence between program learning outcomes and their credit-level descriptors. Quality frameworks (e.g., QAA FHEQ in the UK, Bologna Framework in Europe) define the standards that external programs must meet for credit recognition.',
          points: 2,
        },
        {
          id: 'pv-ed-07-06-q02',
        type: 'multiple-choice',
        options: [
          'Validating curriculum relevance to current industry practice and emerging regulatory trends',
          'Providing direct funding for program operations',
          'Replacing the need for formal accreditation',
          'Conducting final examinations for certification candidates',
        ],
        correctAnswer: 0,
          question: 'An industry advisory board for a PV education program primarily serves which function?',
          explanation: 'Advisory boards ensure curriculum stays relevant to actual industry needs and anticipates emerging requirements. They validate content against real-world practice, identify skill gaps, and provide strategic direction. They complement but do not replace formal accreditation.',
          points: 2,
        },
        {
          id: 'pv-ed-07-06-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Continuing Professional Development (CPD) credits awarded by professional pharmacy bodies can be used to demonstrate ongoing competence in pharmacovigilance for regulatory inspections.',
          explanation: 'Regulatory inspectors review training records during GVP inspections. CPD credits from recognized professional bodies provide documented evidence of ongoing competence development, supporting compliance with GVP Module I requirements for qualified personnel.',
          points: 1,
        }
        ],
      },
}
  ],
};
