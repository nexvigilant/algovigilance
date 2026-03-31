/**
 * Stage: Multi-Method Assessment Design
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage02: CapabilityStage = {
  id: 'pv-ed-05-02',
  title: 'Multi-Method Assessment Design',
  description: 'Understand the five core assessment methods for pharmacovigilance competency: Direct Observation of procedural skills, Work Product Review of ICSRs and signal reports, 360-degree Feedback from multidisciplinary teams, Simulation-based assessment using case scenarios, and Portfolio Analysis for longitudinal competency evidence.',
  lessons: [
    {
      id: 'pv-ed-05-02-a01',
      title: 'Direct Observation Methods in PV',
      description: 'Direct Observation Methods in PV',
      content: `## Direct Observation Methods in PV\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-05-02-a02',
      title: 'Work Product Review: ICSRs, PSURs, and Signal Reports',
      description: 'Work Product Review: ICSRs, PSURs, and Signal Reports',
      content: `## Work Product Review: ICSRs, PSURs, and Signal Reports\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-05-02-a03',
      title: '360-Degree Feedback in PV Teams',
      description: '360-Degree Feedback in PV Teams',
      content: `## 360-Degree Feedback in PV Teams\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'pv-ed-05-02-a04',
      title: 'Simulation-Based Assessment Design',
      description: 'Simulation-Based Assessment Design',
      content: `## Simulation-Based Assessment Design\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'pv-ed-05-02-a05',
      title: 'Multi-Method Assessment Assessment',
      description: 'Multi-Method Assessment Assessment',
      content: '',
      estimatedDuration: 16,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-05-02-q01',
        type: 'multiple-choice',
        options: [
          'Direct observation during real ICSR processing with a structured rating form',
          'A written examination on WHO-UMC causality categories',
          'Self-reported confidence survey on causality assessment skills',
          'Annual supervisor performance rating',
        ],
        correctAnswer: 0,
          question: 'When assessing a PV professional\'s ability to conduct WHO-UMC causality assessment, which method provides the most valid evidence of actual performance?',
          explanation: 'Direct observation of actual ICSR processing provides the most valid evidence of real-world performance (Miller\'s \'Does\' level). Written exams only assess knowledge, not application. Self-report and annual reviews lack standardization and direct performance evidence.',
          points: 2,
        },
        {
          id: 'pv-ed-05-02-q02',
        type: 'multiple-select',
        options: [
          'Completed ICSR forms with documented causality assessments',
          'PSUR/PBRER aggregate analysis sections authored by the learner',
          'Signal validation reports with disproportionality calculations',
          'Personal journal entries about work satisfaction',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which work products are appropriate for assessing PV competency through Work Product Review? Select all that apply.',
          explanation: 'ICSRs, PSUR/PBRER sections, and signal validation reports are all authentic PV work products that demonstrate domain competency. Personal journal entries may support reflective practice but are not PV-specific work products for competency assessment.',
          points: 3,
        },
        {
          id: 'pv-ed-05-02-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: '360-degree feedback in pharmacovigilance should include input from regulatory affairs, medical affairs, clinical operations, and quality assurance colleagues who interact with the PV professional.',
          explanation: 'PV professionals operate at the intersection of multiple functions. 360-degree feedback should capture perspectives from all stakeholders who interact with the PV professional, including regulatory affairs (submission coordination), medical affairs (benefit-risk input), clinical operations (trial safety data), and QA (compliance oversight).',
          points: 1,
        }
        ],
      },
}
  ],
};
