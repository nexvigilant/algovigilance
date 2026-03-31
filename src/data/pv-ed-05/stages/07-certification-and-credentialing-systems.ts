/**
 * Stage: Certification and Credentialing Systems
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage07: CapabilityStage = {
  id: 'pv-ed-05-07',
  title: 'Certification and Credentialing Systems',
  description: 'Evaluate certification management frameworks for PV professionals, including competency-based certification criteria, recertification and continuing professional development (CPD) requirements, certification body standards (e.g., RAPS, DIA), and the relationship between portfolio evidence and certification decisions.',
  lessons: [
    {
      id: 'pv-ed-05-07-a01',
      title: 'PV Certification Landscape and Standards',
      description: 'PV Certification Landscape and Standards',
      content: `## PV Certification Landscape and Standards\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-07-a02',
      title: 'Competency-Based Certification Criteria Design',
      description: 'Competency-Based Certification Criteria Design',
      content: `## Competency-Based Certification Criteria Design\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-07-a03',
      title: 'CPD and Recertification Models',
      description: 'CPD and Recertification Models',
      content: `## CPD and Recertification Models\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-07-a04',
      title: 'Portfolio-to-Certification Decision Framework',
      description: 'Portfolio-to-Certification Decision Framework',
      content: `## Portfolio-to-Certification Decision Framework\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-05-07-a05',
      title: 'Certification Management Assessment',
      description: 'Certification Management Assessment',
      content: '',
      estimatedDuration: 18,
      assessment: {
        type: 'quiz',
        passingScore: 85,
        questions: [
        {
          id: 'pv-ed-05-07-q01',
        type: 'multiple-choice',
        options: [
          'Demonstrated competency through portfolio evidence mapped to defined standards with verified assessments',
          'Completion of a fixed number of training hours regardless of performance',
          'Passing a single written examination',
          'Years of experience in a PV role',
        ],
        correctAnswer: 0,
          question: 'In a competency-based PV certification program, what is the primary basis for a certification decision?',
          explanation: 'Competency-based certification requires demonstrated competency through multiple evidence sources (portfolio artifacts, workplace assessments, examinations) mapped to defined standards. Time-based, single-exam, or experience-based criteria alone are insufficient for competency-based certification.',
          points: 2,
        },
        {
          id: 'pv-ed-05-07-q02',
        type: 'multiple-select',
        options: [
          'Continuing professional development (CPD) activities in current PV practices',
          'Evidence of ongoing competency through workplace-based assessments',
          'Demonstration of awareness of regulatory updates (e.g., new EU GVP modules, FDA guidances)',
          'A requirement to repeat all original certification examinations in full',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which elements should a PV recertification program include? Select all that apply.',
          explanation: 'Recertification should include CPD activities, ongoing workplace-based assessment, and regulatory currency. Repeating all original exams is inefficient and does not reflect current best practice in continuing certification. Targeted reassessment of updated content is more appropriate.',
          points: 3,
        },
        {
          id: 'pv-ed-05-07-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'The Regulatory Affairs Professionals Society (RAPS) offers the RAC (Regulatory Affairs Certification) which covers pharmacovigilance regulatory knowledge as part of its broader regulatory affairs scope.',
          explanation: 'RAPS RAC certification includes pharmacovigilance and safety reporting as part of the broader regulatory affairs body of knowledge. It is one of several professional certifications relevant to PV professionals, alongside certifications from organizations like DIA.',
          points: 1,
        }
        ],
      },
}
  ],
};
