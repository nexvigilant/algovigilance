/**
 * Stage: Digital Assessment Technologies
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage06: CapabilityStage = {
  id: 'pv-ed-05-06',
  title: 'Digital Assessment Technologies',
  description: 'Analyze digital tools that enhance PV competency assessment: AI-powered portfolio analysis for automated evidence classification, automated competency mapping against regulatory frameworks, progress visualization dashboards for learner and program tracking, and predictive success modeling to identify at-risk learners early.',
  lessons: [
    {
      id: 'pv-ed-05-06-a01',
      title: 'AI-Powered Portfolio Analysis',
      description: 'AI-Powered Portfolio Analysis',
      content: `## AI-Powered Portfolio Analysis\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-05-06-a02',
      title: 'Automated Competency Mapping Demo',
      description: 'Automated Competency Mapping Demo',
      content: `## Automated Competency Mapping Demo\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-06-a03',
      title: 'Progress Visualization Dashboard Design',
      description: 'Progress Visualization Dashboard Design',
      content: `## Progress Visualization Dashboard Design\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-06-a04',
      title: 'Predictive Success Modeling',
      description: 'Predictive Success Modeling',
      content: `## Predictive Success Modeling\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-05-06-a05',
      title: 'Digital Assessment Technologies Assessment',
      description: 'Digital Assessment Technologies Assessment',
      content: '',
      estimatedDuration: 16,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-05-06-q01',
        type: 'multiple-choice',
        options: [
          'Work products by competency domain, linking ICSR samples to specific PV competency standards',
          'Only text documents, excluding numerical data and images',
          'Only artifacts submitted in the past 30 days',
          'Only artifacts tagged by the learner themselves',
        ],
        correctAnswer: 0,
          question: 'AI-powered portfolio analysis in PV education can automatically classify which of the following evidence types?',
          explanation: 'AI-powered portfolio analysis uses natural language processing and document classification to automatically map work products (ICSRs, signal reports, PSURs) to competency domains, regardless of format, timeframe, or manual tagging.',
          points: 2,
        },
        {
          id: 'pv-ed-05-06-q02',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Predictive success modeling in PV education uses early performance indicators (e.g., ICSR processing accuracy in weeks 1-4, quiz scores, engagement patterns) to identify learners at risk of not achieving competency milestones.',
          explanation: 'Predictive models analyze early performance data — processing accuracy, assessment scores, platform engagement, time-on-task — to flag learners who may need additional support before they fall critically behind on competency progression.',
          points: 1,
        },
        {
          id: 'pv-ed-05-06-q03',
        type: 'multiple-choice',
        options: [
          'A PV-specific framework aligned with ICH guidelines and national regulatory requirements',
          'A generic corporate leadership competency model',
          'The CanMEDS physician competency framework without modification',
          'ISO 9001 quality management system requirements',
        ],
        correctAnswer: 0,
          question: 'Which competency framework is most appropriate for automated competency mapping in pharmacovigilance education?',
          explanation: 'Automated competency mapping requires a domain-specific framework. A PV-specific framework aligned with ICH E2A/E2B/E2C/E2D/E2E guidelines and relevant national regulations (e.g., EU GVP, FDA 21 CFR 314.80) provides the most relevant competency domains for mapping.',
          points: 2,
        }
        ],
      },
}
  ],
};
