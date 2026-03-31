/**
 * Stage: Technology Integration and Quality Monitoring
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage05: CapabilityStage = {
  id: 'pv-ed-06-05',
  title: 'Technology Integration and Quality Monitoring',
  description: 'Analyze technology integration strategies for PV education programs, including LMS configuration for competency tracking, safety database integration for authentic practice environments, virtual simulation platforms, and real-time quality monitoring dashboards. Evaluate technology solutions against program requirements.',
  lessons: [
    {
      id: 'pv-ed-06-05-a01',
      title: 'LMS Configuration for PV Competency Tracking',
      description: 'LMS Configuration for PV Competency Tracking',
      content: `## LMS Configuration for PV Competency Tracking\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-05-a02',
      title: 'Safety Database Integration for Training Environments',
      description: 'Safety Database Integration for Training Environments',
      content: `## Safety Database Integration for Training Environments\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-05-a03',
      title: 'Real-Time Quality Monitoring Dashboard Design',
      description: 'Real-Time Quality Monitoring Dashboard Design',
      content: `## Real-Time Quality Monitoring Dashboard Design\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-05-a04',
      title: 'Technology Solution Evaluation Case Study',
      description: 'Technology Solution Evaluation Case Study',
      content: `## Technology Solution Evaluation Case Study\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-05-a05',
      title: 'Technology Integration Assessment',
      description: 'Technology Integration Assessment',
      content: '',
      estimatedDuration: 16,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-06-05-q01',
        type: 'multiple-choice',
        options: [
          'Automated tracking of training completion with audit trail and electronic signatures per 21 CFR Part 11',
          'Gamification features with leaderboards and badges',
          'Social learning forums for informal discussion',
          'Mobile app availability for offline access',
        ],
        correctAnswer: 0,
          question: 'Which LMS capability is most critical for a PV education program that must demonstrate regulatory compliance?',
          explanation: 'Regulatory compliance requires auditable training records. The LMS must track completion with electronic signatures that comply with 21 CFR Part 11 (electronic records/electronic signatures) and EU Annex 11 (computerised systems). This audit trail is what regulators inspect.',
          points: 2,
        },
        {
          id: 'pv-ed-06-05-q02',
        type: 'multiple-choice',
        options: [
          'Practice ICSR data entry, MedDRA coding, and case processing in a realistic but non-production environment',
          'Submit real adverse event reports to regulatory authorities',
          'Access actual patient data for training purposes',
          'Modify production database configurations',
        ],
        correctAnswer: 0,
          question: 'Integrating a training environment with a safety database sandbox allows learners to:',
          explanation: 'A safety database sandbox provides a realistic training environment where learners practice with synthetic/anonymized data. They never access real patient data or production systems during training. This protects data integrity while providing authentic practice.',
          points: 2,
        },
        {
          id: 'pv-ed-06-05-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'A real-time quality monitoring dashboard for PV education should track leading indicators (e.g., assessment completion rates, engagement metrics) in addition to lagging indicators (e.g., final competency scores, certification rates).',
          explanation: 'Leading indicators (completion pace, engagement, formative assessment scores) enable early intervention before problems become critical. Lagging indicators (final scores, certification rates) confirm outcomes but are too late for corrective action. Both are needed for effective quality monitoring.',
          points: 1,
        }
        ],
      },
}
  ],
};
