/**
 * Stage: Benchmarking & Gap Analysis
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage05: CapabilityStage = {
  id: 'pv-ed-07-05',
  title: 'Benchmarking & Gap Analysis',
  description: 'Analyze pharmacovigilance programs through systematic benchmarking and gap analysis: compare organizational capabilities against regulatory expectations and industry leaders, identify competency gaps using maturity models, track innovation adoption, and measure program outcomes against defined performance indicators.',
  lessons: [
    {
      id: 'pv-ed-07-05-a01',
      title: 'Benchmarking Frameworks for PV Programs',
      description: 'Benchmarking Frameworks for PV Programs',
      content: `## Benchmarking Frameworks for PV Programs\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-07-05-a02',
      title: 'Conducting a PV Competency Gap Analysis',
      description: 'Conducting a PV Competency Gap Analysis',
      content: `## Conducting a PV Competency Gap Analysis\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-07-05-a03',
      title: 'Competitor and Innovation Benchmarking',
      description: 'Competitor and Innovation Benchmarking',
      content: `## Competitor and Innovation Benchmarking\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-07-05-a04',
      title: 'Benchmarking Assessment',
      description: 'Benchmarking Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-07-05-q01',
        type: 'multiple-choice',
        options: [
          'A managed organization measures and controls its PV processes quantitatively, while a defined organization has documented but unmonitored processes',
          'A defined organization has more staff than a managed organization',
          'A managed organization has regulatory approval while a defined organization does not',
          'There is no meaningful difference between these maturity levels',
        ],
        correctAnswer: 0,
          question: 'In a pharmacovigilance maturity model, what distinguishes a \'managed\' organization (Level 3) from a \'defined\' organization (Level 2)?',
          explanation: 'Following CMMI-style maturity models applied to PV, Level 2 (Defined) means processes are documented and standardized, while Level 3 (Managed) adds quantitative measurement and control. The key differentiator is data-driven process management.',
          points: 2,
        },
        {
          id: 'pv-ed-07-05-q02',
        type: 'multiple-select',
        options: [
          'Current competency assessment against regulatory requirements',
          'Comparison of training content to ICH guideline updates',
          'Analysis of inspection findings and CAPAs related to training',
          'Revenue comparison with competitor education providers',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which are valid components of a PV education program gap analysis? Select all that apply.',
          explanation: 'Effective gap analysis compares current state against requirements (regulatory, ICH), identifies where inspection findings reveal training deficiencies, and maps content currency. Revenue comparison is a business metric, not a competency gap analysis component.',
          points: 3,
        },
        {
          id: 'pv-ed-07-05-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Key Performance Indicators (KPIs) for PV education programs should include both process metrics (e.g., course completion rates) and outcome metrics (e.g., reduction in reporting errors after training).',
          explanation: 'Effective PV program evaluation requires both process metrics (tracking activity and engagement) and outcome metrics (measuring real-world impact). Process metrics alone cannot demonstrate that training improved actual PV practice.',
          points: 1,
        }
        ],
      },
}
  ],
};
