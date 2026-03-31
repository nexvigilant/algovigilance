/**
 * Stage: Program Readiness Assessment
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage01: CapabilityStage = {
  id: 'pv-ed-06-01',
  title: 'Program Readiness Assessment',
  description: 'Understand the components of a comprehensive readiness assessment for launching a pharmacovigilance education program, including organizational capability analysis, infrastructure evaluation, stakeholder identification, and gap analysis against regulatory training requirements.',
  lessons: [
    {
      id: 'pv-ed-06-01-a01',
      title: 'Readiness Assessment Framework for PV Education',
      description: 'Readiness Assessment Framework for PV Education',
      content: `## Readiness Assessment Framework for PV Education\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-01-a02',
      title: 'Organizational Capability Analysis Tool',
      description: 'Organizational Capability Analysis Tool',
      content: `## Organizational Capability Analysis Tool\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-01-a03',
      title: 'Regulatory Training Requirements Mapping',
      description: 'Regulatory Training Requirements Mapping',
      content: `## Regulatory Training Requirements Mapping\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'pv-ed-06-01-a04',
      title: 'Program Readiness Assessment',
      description: 'Program Readiness Assessment',
      content: '',
      estimatedDuration: 13,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-06-01-q01',
        type: 'multiple-choice',
        options: [
          'EU GVP Module I (Pharmacovigilance systems and their quality systems)',
          'ICH E6(R2) Good Clinical Practice',
          'FDA 21 CFR Part 11 Electronic Records',
          'ISO 9001 Quality Management Systems',
        ],
        correctAnswer: 0,
          question: 'Which regulatory requirement mandates that Marketing Authorization Holders ensure PV personnel are \'suitably qualified and trained\'?',
          explanation: 'EU GVP Module I requires that MAHs establish and maintain a pharmacovigilance system with appropriately qualified and trained personnel. This is a key regulatory driver for PV education programs and must be addressed in readiness assessment.',
          points: 2,
        },
        {
          id: 'pv-ed-06-01-q02',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'A readiness assessment for a PV education program should include evaluation of existing learning management system (LMS) capabilities, including the ability to track completion rates and manage competency records.',
          explanation: 'Technology infrastructure is a critical readiness component. The LMS must support PV-specific requirements: tracking regulatory training completions, managing competency records, generating compliance reports, and supporting assessment delivery.',
          points: 1,
        },
        {
          id: 'pv-ed-06-01-q03',
        type: 'multiple-choice',
        options: [
          'A competency gap requiring targeted technical training intervention',
          'An infrastructure gap requiring new technology',
          'A resource gap requiring additional budget',
          'A stakeholder alignment gap requiring executive sponsorship',
        ],
        correctAnswer: 0,
          question: 'During a readiness assessment, a gap analysis reveals that 40% of PV staff lack training on E2B(R3) ICSR transmission standards. What type of gap does this represent?',
          explanation: 'This is a competency gap — the difference between required knowledge (E2B(R3) standards for electronic ICSR transmission) and current staff capabilities. Competency gaps are addressed through targeted training programs, which is distinct from infrastructure, resource, or alignment gaps.',
          points: 2,
        }
        ],
      },
}
  ],
};
