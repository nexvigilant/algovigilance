/**
 * Stage: Fellowship Months 7-12: Core Competency
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage03: CapabilityStage = {
  id: 'pv-ed-04-03',
  title: 'Fellowship Months 7-12: Core Competency',
  description: 'Core competency development phase. Fellows transition from supervised to increasingly independent practice in Case Management and Signal Management (CPAs 1-2). Experiential learning shifts to indirect supervision. Didactic content deepens into regulatory science and epidemiological methods. Target: Level 3 in CPAs 1-2, Level 2 in CPAs 3-5.',
  lessons: [
    {
      id: 'pv-ed-04-03-a01',
      title: 'Core Competency Phase Curriculum and Milestones',
      description: 'Core Competency Phase Curriculum and Milestones',
      content: `## Core Competency Phase Curriculum and Milestones\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-04-03-a02',
      title: 'Competency Milestone Tracker: Self-Assessment Tool',
      description: 'Competency Milestone Tracker: Self-Assessment Tool',
      content: `## Competency Milestone Tracker: Self-Assessment Tool\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-04-03-a03',
      title: 'Core Competency Phase Assessment',
      description: 'Core Competency Phase Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'pv-ed-04-03-q01',
        type: 'multiple-choice',
        options: [
          'Level 3 — indirect supervision with the supervisor available but not directly overseeing routine work',
          'Level 1 — direct active supervision required for all cases',
          'Level 4 — distant/oversight supervision only; practice-ready',
          'Level 5 — can supervise others performing this activity',
        ],
        correctAnswer: 0,
          question: 'A PV fellow at month 10 can independently assess causality for routine ICSRs but requires guidance for complex cases involving drug interactions. This performance corresponds to which entrustment level?',
          explanation: 'Level 3 entrustment is characterized by independence on routine tasks with supervisor availability for complex situations. The fellow handles standard cases independently but appropriately seeks guidance for complex drug interaction cases.',
          points: 2,
        },
        {
          id: 'pv-ed-04-03-q02',
        type: 'multiple-choice',
        options: [
          'Workplace-Based Assessment (WPBA) using direct observation with structured rating scales and narrative feedback over multiple cases',
          'A single high-stakes written examination at the end of month 12',
          'Self-reported confidence surveys completed monthly',
          'Peer comparison rankings within the fellowship cohort',
        ],
        correctAnswer: 0,
          question: 'Which assessment method is MOST appropriate for evaluating a fellow\'s progression from Level 2 to Level 3 in case processing?',
          explanation: 'EPA entrustment decisions require multiple observations over time using workplace-based assessments. Single exams test knowledge but not entrustable performance. WPBAs with structured tools (like the Ottawa scale) capture both competency and professional behavior.',
          points: 2,
        },
        {
          id: 'pv-ed-04-03-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'During the core competency phase, AI-enhanced learning tools should supplement but not replace the experiential and mentorship modalities.',
          explanation: 'AI tools enhance efficiency and pattern recognition but cannot develop the clinical judgment, professional relationships, and tacit knowledge that experiential and mentorship modalities provide. All five modalities work synergistically.',
          points: 1,
        }
        ],
      },
}
  ],
};
