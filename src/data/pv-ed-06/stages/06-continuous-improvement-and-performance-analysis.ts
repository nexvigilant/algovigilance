/**
 * Stage: Continuous Improvement and Performance Analysis
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage06: CapabilityStage = {
  id: 'pv-ed-06-06',
  title: 'Continuous Improvement and Performance Analysis',
  description: 'Analyze continuous improvement methodologies applied to PV education programs, including feedback integration from multiple stakeholder groups, performance analysis using operational metrics, gap identification through data-driven assessment review, and innovation implementation cycles. Apply Plan-Do-Study-Act (PDSA) cycles to program improvement.',
  lessons: [
    {
      id: 'pv-ed-06-06-a01',
      title: 'PDSA Cycles for PV Education Improvement',
      description: 'PDSA Cycles for PV Education Improvement',
      content: `## PDSA Cycles for PV Education Improvement\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-06-a02',
      title: 'Multi-Stakeholder Feedback Integration',
      description: 'Multi-Stakeholder Feedback Integration',
      content: `## Multi-Stakeholder Feedback Integration\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-06-a03',
      title: 'Performance Gap Analysis Workshop',
      description: 'Performance Gap Analysis Workshop',
      content: `## Performance Gap Analysis Workshop\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-06-a04',
      title: 'Data-Driven Improvement Case Study',
      description: 'Data-Driven Improvement Case Study',
      content: `## Data-Driven Improvement Case Study\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-06-a05',
      title: 'Continuous Improvement Assessment',
      description: 'Continuous Improvement Assessment',
      content: '',
      estimatedDuration: 18,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-06-06-q01',
        type: 'multiple-choice',
        options: [
          'Analyzing collected data to determine whether the improvement intervention achieved the intended outcome',
          'Designing the improvement intervention',
          'Implementing the improvement in a pilot group',
          'Scaling the improvement across the entire program',
        ],
        correctAnswer: 0,
          question: 'In the Plan-Do-Study-Act (PDSA) cycle applied to PV education, the \'Study\' phase involves:',
          explanation: 'The \'Study\' phase in PDSA involves analyzing results of the intervention. In PV education, this means comparing pre/post metrics (e.g., did the revised signal detection module improve learner accuracy from 72% to 85%?). \'Plan\' designs, \'Do\' implements, \'Act\' scales or revises.',
          points: 2,
        },
        {
          id: 'pv-ed-06-06-q02',
        type: 'multiple-select',
        options: [
          'Assessment score distributions showing competency areas where learners consistently underperform',
          'Learner feedback surveys identifying unclear content or insufficient practice opportunities',
          'Faculty observations of common learner errors during workplace-based assessments',
          'Industry stock prices of pharmaceutical companies',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which data sources are valuable for identifying performance gaps in a PV education program? Select all that apply.',
          explanation: 'Assessment data reveals competency-specific gaps, learner feedback identifies instructional issues, and faculty observations surface practice-based errors. Together these provide a comprehensive view. Stock prices are irrelevant to educational performance analysis.',
          points: 3,
        },
        {
          id: 'pv-ed-06-06-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Continuous improvement in PV education should incorporate regulatory updates (e.g., new EU GVP modules, revised FDA guidances) into program content within a defined update cycle.',
          explanation: 'PV regulations evolve regularly. Programs must have defined processes for monitoring regulatory changes and incorporating updates. For example, when the EU GVP is revised or FDA issues new guidance on safety reporting, curriculum must be updated to maintain regulatory currency and compliance.',
          points: 1,
        }
        ],
      },
}
  ],
};
