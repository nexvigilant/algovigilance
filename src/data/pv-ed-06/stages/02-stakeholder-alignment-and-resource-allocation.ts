/**
 * Stage: Stakeholder Alignment and Resource Allocation
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage02: CapabilityStage = {
  id: 'pv-ed-06-02',
  title: 'Stakeholder Alignment and Resource Allocation',
  description: 'Understand stakeholder management frameworks for PV education programs across four key groups: Learners (progress and satisfaction tracking), Faculty (engagement and teaching effectiveness), Leadership (ROI and business outcomes), and Regulators (compliance demonstration). Learn resource allocation models for budget, personnel, and technology.',
  lessons: [
    {
      id: 'pv-ed-06-02-a01',
      title: 'Stakeholder Mapping for PV Education Programs',
      description: 'Stakeholder Mapping for PV Education Programs',
      content: `## Stakeholder Mapping for PV Education Programs\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-02-a02',
      title: 'Four-Quadrant Stakeholder Management Model',
      description: 'Four-Quadrant Stakeholder Management Model',
      content: `## Four-Quadrant Stakeholder Management Model\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-06-02-a03',
      title: 'Resource Allocation Models and Budget Planning',
      description: 'Resource Allocation Models and Budget Planning',
      content: `## Resource Allocation Models and Budget Planning\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-06-02-a04',
      title: 'Faculty Resource Planning Workshop',
      description: 'Faculty Resource Planning Workshop',
      content: `## Faculty Resource Planning Workshop\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'pv-ed-06-02-a05',
      title: 'Stakeholder and Resource Assessment',
      description: 'Stakeholder and Resource Assessment',
      content: '',
      estimatedDuration: 11,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-06-02-q01',
        type: 'multiple-choice',
        options: [
          'Regulators — they require evidence of compliance with training obligations',
          'Learners — they want career advancement',
          'Faculty — they want to demonstrate teaching effectiveness',
          'IT department — they want system utilization data',
        ],
        correctAnswer: 0,
          question: 'Which stakeholder group is primarily interested in demonstrating that a PV education program meets GVP Module I requirements for \'appropriately qualified personnel\'?',
          explanation: 'Regulators are primarily concerned with compliance demonstration. During PV system inspections, they assess whether personnel are appropriately trained per GVP Module I. The program must generate auditable evidence of training completion and competency achievement.',
          points: 2,
        },
        {
          id: 'pv-ed-06-02-q02',
        type: 'multiple-select',
        options: [
          'Reduction in regulatory findings related to PV staff training during inspections',
          'Decrease in ICSR processing errors after training completion',
          'Improvement in regulatory submission timeliness (e.g., 15-day expedited report compliance)',
          'Number of social media mentions of the training program',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which metrics are most relevant for demonstrating ROI to leadership stakeholders? Select all that apply.',
          explanation: 'Leadership ROI is demonstrated through business-relevant outcomes: fewer regulatory findings (risk reduction), fewer processing errors (quality improvement), and better submission timeliness (compliance improvement). Social media mentions are not a meaningful PV education ROI metric.',
          points: 3,
        },
        {
          id: 'pv-ed-06-02-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Faculty engagement in a PV education program should be measured by both teaching effectiveness (learner outcomes) and subject-matter currency (staying current with evolving PV regulations and practices).',
          explanation: 'PV faculty must be both effective educators and current practitioners. Teaching effectiveness is measured through learner outcomes and feedback. Subject-matter currency ensures faculty can teach current regulations (e.g., recent EU GVP module revisions, new FDA guidances).',
          points: 1,
        }
        ],
      },
}
  ],
};
