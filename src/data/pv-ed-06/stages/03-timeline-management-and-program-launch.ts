/**
 * Stage: Timeline Management and Program Launch
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage03: CapabilityStage = {
  id: 'pv-ed-06-03',
  title: 'Timeline Management and Program Launch',
  description: 'Apply project management principles to PV education program launches, including milestone planning with regulatory compliance deadlines, critical path analysis for curriculum development, pilot testing protocols, and go-live readiness checklists. Integrate program timelines with organizational PV system audit cycles.',
  lessons: [
    {
      id: 'pv-ed-06-03-a01',
      title: 'Program Launch Timeline Design',
      description: 'Program Launch Timeline Design',
      content: `## Program Launch Timeline Design\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-03-a02',
      title: 'Critical Path Analysis for Curriculum Development',
      description: 'Critical Path Analysis for Curriculum Development',
      content: `## Critical Path Analysis for Curriculum Development\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-03-a03',
      title: 'Pilot Testing Protocol Design',
      description: 'Pilot Testing Protocol Design',
      content: `## Pilot Testing Protocol Design\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-03-a04',
      title: 'Go-Live Readiness Checklist Builder',
      description: 'Go-Live Readiness Checklist Builder',
      content: `## Go-Live Readiness Checklist Builder\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-03-a05',
      title: 'Timeline and Launch Assessment',
      description: 'Timeline and Launch Assessment',
      content: '',
      estimatedDuration: 14,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'pv-ed-06-03-q01',
        type: 'multiple-choice',
        options: [
          'Regulatory inspection dates and PSMF (Pharmacovigilance System Master File) update deadlines',
          'The organization\'s annual holiday party',
          'Industry conference submission deadlines',
          'New employee orientation schedules',
        ],
        correctAnswer: 0,
          question: 'When planning a PV education program launch, which external deadline is most critical to integrate into the timeline?',
          explanation: 'Regulatory inspection dates drive training urgency — PV staff must be demonstrably trained before inspections. PSMF updates must reference the training system. These are hard external deadlines that the program timeline must accommodate.',
          points: 2,
        },
        {
          id: 'pv-ed-06-03-q02',
        type: 'multiple-choice',
        options: [
          'A representative sample of target learners, structured feedback collection, and pre/post competency measurement',
          'Only senior PV scientists who already know signal detection',
          'Only the program development team for internal review',
          'Random selection of employees across all departments',
        ],
        correctAnswer: 0,
          question: 'A pilot test of a new PV signal detection training module should include which of the following?',
          explanation: 'Effective piloting requires representative learners (matching the target audience), structured feedback (to identify issues systematically), and pre/post measurement (to verify learning effectiveness). Testing only with experts, developers, or random employees does not validate the program for its intended audience.',
          points: 2,
        },
        {
          id: 'pv-ed-06-03-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'A go-live readiness checklist for a PV education program should verify that assessment instruments have been validated, LMS configurations are tested, and faculty briefings are complete before launch.',
          explanation: 'Go-live readiness requires verification across three domains: content readiness (validated assessments, reviewed materials), technology readiness (tested LMS configurations, working integrations), and people readiness (briefed faculty, enrolled learners, support team prepared).',
          points: 1,
        }
        ],
      },
}
  ],
};
