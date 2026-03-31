/**
 * Stage: Client Success Metrics & ROI
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage06: CapabilityStage = {
  id: 'pv-ed-08-06',
  title: 'Client Success Metrics & ROI',
  description: 'Evaluate client success through quantified metrics: competency improvement rates (pre/post assessment scores), EPA progression (entrustable professional activity advancement), regulatory inspection readiness indicators, business outcome achievement (reduced findings, faster processing, fewer queries), and education program ROI calculation methodologies.',
  lessons: [
    {
      id: 'pv-ed-08-06-a01',
      title: 'Measuring PV Education ROI',
      description: 'Measuring PV Education ROI',
      content: `## Measuring PV Education ROI\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-08-06-a02',
      title: 'Building Client Success Metrics Dashboards',
      description: 'Building Client Success Metrics Dashboards',
      content: `## Building Client Success Metrics Dashboards\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-08-06-a03',
      title: 'ROI Calculation Case Study',
      description: 'ROI Calculation Case Study',
      content: `## ROI Calculation Case Study\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-08-06-a04',
      title: 'Client Success Metrics Assessment',
      description: 'Client Success Metrics Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-08-06-q01',
        type: 'multiple-choice',
        options: [
          'Reduction in regulatory inspection findings and associated CAPA remediation costs',
          'Number of training hours completed per employee',
          'Satisfaction scores from post-training surveys',
          'Total number of e-learning modules deployed',
        ],
        correctAnswer: 0,
          question: 'When calculating ROI for a PV education program, which cost-avoidance metric provides the strongest business case to executive stakeholders?',
          explanation: 'Regulatory findings carry direct costs (CAPA implementation, consultant remediation, potential warning letters) and indirect costs (brand damage, delayed approvals). Demonstrating that training reduces findings provides a quantifiable financial return that resonates with executive decision-makers.',
          points: 2,
        },
        {
          id: 'pv-ed-08-06-q02',
        type: 'multiple-choice',
        options: [
          'The learner can perform the PV activity competently with oversight available but not actively observing',
          'The learner no longer needs any quality checks on their work',
          'The learner is qualified to supervise others performing the activity',
          'The learner has completed all available training modules',
        ],
        correctAnswer: 0,
          question: 'In the Entrustable Professional Activities (EPA) framework applied to PV, advancing from \'direct supervision required\' to \'indirect supervision sufficient\' indicates what about the learner?',
          explanation: 'EPA progression levels reflect increasing autonomy. Moving from direct to indirect supervision means the professional can perform the activity independently with a supervisor available for consultation but not directly observing each step. Quality checks and periodic audits still apply.',
          points: 2,
        },
        {
          id: 'pv-ed-08-06-q03',
        type: 'multiple-select',
        options: [
          'Up-to-date training records for all PV personnel with documented competency assessments',
          'SOPs that reflect current regulatory requirements with evidence of periodic review',
          'Documented signal management process with evaluation records',
          'A training budget that exceeds industry average spending',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which are valid indicators of regulatory inspection readiness for a PV organization? Select all that apply.',
          explanation: 'Inspection readiness depends on demonstrable compliance: documented training/competency (GVP Module I), current SOPs with review evidence (quality system requirements), and operational evidence of PV activities (signal management records). Budget size is not an inspection criterion.',
          points: 3,
        }
        ],
      },
}
  ],
};
