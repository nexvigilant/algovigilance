/**
 * Stage: Competency Needs Analysis & Gap Assessment
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage02: CapabilityStage = {
  id: 'pv-ed-08-02',
  title: 'Competency Needs Analysis & Gap Assessment',
  description: 'Understand methodologies for assessing PV competency gaps: current-state vs. required-state analysis, regulatory requirement mapping, organizational maturity assessment using PV-specific maturity models, and strategic objective alignment to ensure education programs target the right deficiencies.',
  lessons: [
    {
      id: 'pv-ed-08-02-a01',
      title: 'Competency Gap Assessment Frameworks',
      description: 'Competency Gap Assessment Frameworks',
      content: `## Competency Gap Assessment Frameworks\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-08-02-a02',
      title: 'Regulatory Requirement Mapping Exercise',
      description: 'Regulatory Requirement Mapping Exercise',
      content: `## Regulatory Requirement Mapping Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-08-02-a03',
      title: 'Organizational Maturity Assessment Case Study',
      description: 'Organizational Maturity Assessment Case Study',
      content: `## Organizational Maturity Assessment Case Study\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-08-02-a04',
      title: 'Needs Analysis Assessment',
      description: 'Needs Analysis Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-08-02-q01',
        type: 'multiple-choice',
        options: [
          'Define required competencies from regulations/standards, assess current state, identify gaps, prioritize by risk',
          'Assess current state, purchase training, define requirements afterward',
          'Prioritize by budget, select courses, then define competencies',
          'Conduct training first, then assess whether it addressed the right gaps',
        ],
        correctAnswer: 0,
          question: 'When conducting a PV competency gap analysis, what is the correct sequence of assessment steps?',
          explanation: 'Effective gap analysis follows a structured approach: first define the target state from regulatory requirements and best practices, then objectively assess current capabilities, identify the delta, and prioritize gaps based on regulatory risk and business impact.',
          points: 2,
        },
        {
          id: 'pv-ed-08-02-q02',
        type: 'multiple-select',
        options: [
          'Regulatory inspection findings and CAPA records',
          'Individual performance assessments and training records',
          'Case processing quality metrics (error rates, timeliness)',
          'Competitor employee LinkedIn profiles',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which data sources are appropriate for assessing current PV competency levels within an organization? Select all that apply.',
          explanation: 'Valid data sources include internal quality data (inspection findings, CAPAs), individual assessments (performance reviews, training history), and operational metrics (error rates, compliance timelines). Competitor employee profiles are not a valid internal competency data source.',
          points: 3,
        },
        {
          id: 'pv-ed-08-02-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'GVP Module I requires that Marketing Authorization Holders ensure their personnel involved in PV activities are appropriately qualified and trained.',
          explanation: 'EMA GVP Module I (Pharmacovigilance systems and their quality systems) requires MAHs to ensure that all personnel involved in PV are suitably qualified, trained, and have defined roles and responsibilities. This creates the regulatory basis for competency-based training programs.',
          points: 1,
        }
        ],
      },
}
  ],
};
