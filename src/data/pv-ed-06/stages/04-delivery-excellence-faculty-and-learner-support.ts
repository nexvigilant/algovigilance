/**
 * Stage: Delivery Excellence: Faculty and Learner Support
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage04: CapabilityStage = {
  id: 'pv-ed-06-04',
  title: 'Delivery Excellence: Faculty and Learner Support',
  description: 'Apply best practices for delivery excellence in PV education, including faculty coordination and calibration, learner support systems, mentoring frameworks, and interventions for struggling learners. Establish mechanisms for real-time quality monitoring during program delivery.',
  lessons: [
    {
      id: 'pv-ed-06-04-a01',
      title: 'Faculty Coordination and Calibration',
      description: 'Faculty Coordination and Calibration',
      content: `## Faculty Coordination and Calibration\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-04-a02',
      title: 'Learner Support Framework Design',
      description: 'Learner Support Framework Design',
      content: `## Learner Support Framework Design\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-04-a03',
      title: 'PV Mentoring Program Structure',
      description: 'PV Mentoring Program Structure',
      content: `## PV Mentoring Program Structure\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-04-a04',
      title: 'Intervening with Struggling Learners: PV Case Studies',
      description: 'Intervening with Struggling Learners: PV Case Studies',
      content: `## Intervening with Struggling Learners: PV Case Studies\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-04-a05',
      title: 'Delivery Excellence Assessment',
      description: 'Delivery Excellence Assessment',
      content: '',
      estimatedDuration: 14,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'pv-ed-06-04-q01',
        type: 'multiple-choice',
        options: [
          'All assessors rate the same learner performance samples consistently (inter-rater reliability >0.80)',
          'All faculty use identical lecture slides',
          'Faculty are assigned equal numbers of learners',
          'Faculty meet weekly for social events',
        ],
        correctAnswer: 0,
          question: 'Faculty calibration sessions in a PV education program should ensure that:',
          explanation: 'Calibration ensures assessment consistency. Faculty review standardized performance samples (e.g., sample ICSRs, causality assessment recordings) and practice scoring until they achieve inter-rater reliability above 0.80. This is essential for fair, reliable assessment.',
          points: 2,
        },
        {
          id: 'pv-ed-06-04-q02',
        type: 'multiple-select',
        options: [
          'Additional supervised practice with feedback on coding decisions',
          'Peer tutoring from a trainee who has demonstrated MedDRA proficiency',
          'Access to supplementary MedDRA learning resources and coding exercises',
          'Immediate removal from the training program',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which learner support interventions are appropriate when a PV trainee is struggling with MedDRA coding accuracy? Select all that apply.',
          explanation: 'Appropriate interventions include supervised practice (guided repetition with feedback), peer tutoring (social learning from proficient peers), and supplementary resources (additional learning opportunities). Immediate removal without remediation is not appropriate support.',
          points: 3,
        },
        {
          id: 'pv-ed-06-04-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'In a PV mentoring program, mentors should be experienced PV professionals who can provide both technical guidance on pharmacovigilance practices and career development advice.',
          explanation: 'Effective PV mentoring combines technical mentorship (guidance on signal detection, causality assessment, regulatory submissions) with professional development (career planning, networking, leadership skills). Dual-focus mentoring improves both competency and retention.',
          points: 1,
        }
        ],
      },
}
  ],
};
