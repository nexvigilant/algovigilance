/**
 * Stage: Professional and Executive Portfolio Architecture
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage04: CapabilityStage = {
  id: 'pv-ed-05-04',
  title: 'Professional and Executive Portfolio Architecture',
  description: 'Apply portfolio design principles at Professional and Executive levels. Professional portfolios include independent work examples (signal evaluations, benefit-risk assessments), quality metrics (accuracy rates, timeliness), and innovation attempts. Executive portfolios document transformation initiatives, industry influence (publications, committee work), and legacy documentation.',
  lessons: [
    {
      id: 'pv-ed-05-04-a01',
      title: 'Professional Portfolio: Independent Work and Quality Metrics',
      description: 'Professional Portfolio: Independent Work and Quality Metrics',
      content: `## Professional Portfolio: Independent Work and Quality Metrics\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-04-a02',
      title: 'Professional Portfolio: Innovation Documentation',
      description: 'Professional Portfolio: Innovation Documentation',
      content: `## Professional Portfolio: Innovation Documentation\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-05-04-a03',
      title: 'Executive Portfolio: Transformation and Influence',
      description: 'Executive Portfolio: Transformation and Influence',
      content: `## Executive Portfolio: Transformation and Influence\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-05-04-a04',
      title: 'Portfolio Level Differentiation Workshop',
      description: 'Portfolio Level Differentiation Workshop',
      content: `## Portfolio Level Differentiation Workshop\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-04-a05',
      title: 'Professional and Executive Portfolio Assessment',
      description: 'Professional and Executive Portfolio Assessment',
      content: '',
      estimatedDuration: 16,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'pv-ed-05-04-q01',
        type: 'multiple-choice',
        options: [
          'Sensitivity and specificity rates for signal identification against a validated reference standard',
          'Number of years in a PV role',
          'Number of training certificates obtained',
          'Supervisor satisfaction ratings',
        ],
        correctAnswer: 0,
          question: 'A Professional-level PV portfolio should include quality metrics. Which metric best demonstrates signal detection competency?',
          explanation: 'Sensitivity (true positive rate) and specificity (true negative rate) against a validated reference standard directly measure signal detection accuracy. Years of experience, certificates, and supervisor ratings are proxy measures that don\'t directly assess competency.',
          points: 2,
        },
        {
          id: 'pv-ed-05-04-q02',
        type: 'multiple-select',
        options: [
          'Documentation of a PV system transformation initiative with measurable outcomes',
          'Evidence of industry influence through CIOMS working group participation',
          'A legacy documentation package for knowledge transfer to successors',
          'A basic ICSR processing logbook',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which artifacts are appropriate for an Executive-level PV portfolio? Select all that apply.',
          explanation: 'Executive portfolios document transformation (system-level change), influence (industry leadership such as CIOMS, ICH, or regulatory advisory committee participation), and legacy (knowledge transfer). A basic ICSR logbook is a Foundation-level artifact.',
          points: 3,
        },
        {
          id: 'pv-ed-05-04-q03',
        type: 'true-false',
        correctAnswer: 0 as 0 | 1,
          question: 'An innovation attempt in a Professional-level portfolio must demonstrate successful implementation to count as valid evidence of competency.',
          explanation: 'Innovation attempts are valued regardless of outcome. A well-documented attempt that identifies a problem, proposes a solution, tests it, and reflects on results demonstrates analytical and creative competency even if the innovation was ultimately not adopted.',
          points: 1,
        }
        ],
      },
}
  ],
};
