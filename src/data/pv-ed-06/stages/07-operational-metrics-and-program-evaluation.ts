/**
 * Stage: Operational Metrics and Program Evaluation
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage07: CapabilityStage = {
  id: 'pv-ed-06-07',
  title: 'Operational Metrics and Program Evaluation',
  description: 'Evaluate PV education program effectiveness using operational metrics: completion rates (target >95%), learner satisfaction (target >4.5/5.0), competency achievement rates, EPA progression velocity, time-to-competency benchmarks, and return on investment calculations. Design comprehensive program evaluation frameworks.',
  lessons: [
    {
      id: 'pv-ed-06-07-a01',
      title: 'Kirkpatrick\'s Four Levels Applied to PV Education',
      description: 'Kirkpatrick\'s Four Levels Applied to PV Education',
      content: `## Kirkpatrick's Four Levels Applied to PV Education\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-07-a02',
      title: 'Operational Metrics Dashboard Design',
      description: 'Operational Metrics Dashboard Design',
      content: `## Operational Metrics Dashboard Design\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-07-a03',
      title: 'ROI Calculation for PV Training Programs',
      description: 'ROI Calculation for PV Training Programs',
      content: `## ROI Calculation for PV Training Programs\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-07-a04',
      title: 'Program Evaluation Case Study: Benchmarking Against Targets',
      description: 'Program Evaluation Case Study: Benchmarking Against Targets',
      content: `## Program Evaluation Case Study: Benchmarking Against Targets\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-07-a05',
      title: 'Operational Metrics Assessment',
      description: 'Operational Metrics Assessment',
      content: '',
      estimatedDuration: 18,
      assessment: {
        type: 'quiz',
        passingScore: 85,
        questions: [
        {
          id: 'pv-ed-06-07-q01',
        type: 'multiple-choice',
        options: [
          'Level 3: Behavior — transfer of learning to the workplace',
          'Level 1: Reaction — learner satisfaction',
          'Level 2: Learning — knowledge and skill acquisition',
          'Level 4: Results — organizational impact',
        ],
        correctAnswer: 0,
          question: 'In Kirkpatrick\'s evaluation model, measuring whether PV trainees apply signal detection skills correctly in their daily work represents which level?',
          explanation: 'Level 3 (Behavior) measures whether learning transfers to workplace performance. Observing whether trainees correctly apply signal detection skills in their daily PV work assesses behavioral change, which is the bridge between learning (L2) and organizational results (L4).',
          points: 2,
        },
        {
          id: 'pv-ed-06-07-q02',
        type: 'multiple-choice',
        options: [
          'Analyze the 8% non-completion cohort to identify barriers (scheduling, workload, content difficulty) and implement targeted interventions',
          'Lower the completion rate target to 90%',
          'Remove the non-completing learners from the program',
          'Declare the program successful since 92% is close to target',
        ],
        correctAnswer: 0,
          question: 'A PV education program reports 92% completion rate against a target of >95%. Which action is most appropriate?',
          explanation: 'When a metric falls below target, the appropriate response is root cause analysis. Analyzing why 8% did not complete reveals actionable barriers. Lowering targets, removing learners, or ignoring the gap undermines program quality and regulatory compliance.',
          points: 2,
        },
        {
          id: 'pv-ed-06-07-q03',
        type: 'multiple-select',
        options: [
          'Cost savings from reduced regulatory findings and remediation expenses',
          'Value of improved ICSR quality and reduced error rates',
          'Revenue impact from faster regulatory submission timelines',
          'Total program costs including development, delivery, technology, and personnel',
        ],
        correctAnswer: [0, 1, 2, 3],
          question: 'Which elements should be included in an ROI calculation for a PV education program? Select all that apply.',
          explanation: 'Comprehensive ROI includes both benefits (reduced findings, improved quality, faster submissions) and costs (development, delivery, technology, personnel). ROI = (Total Benefits - Total Costs) / Total Costs. All four elements are necessary for a complete calculation.',
          points: 4,
        },
        {
          id: 'pv-ed-06-07-q04',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'EPA progression velocity measures how quickly learners advance through entrustment levels (from direct supervision to unsupervised practice) and is a key metric for competency-based PV education programs.',
          explanation: 'EPA progression velocity tracks the rate at which learners progress through entrustment levels. Faster progression (with maintained quality) indicates effective instruction. Slow progression may indicate instructional gaps or insufficient practice opportunities.',
          points: 1,
        }
        ],
      },
}
  ],
};
