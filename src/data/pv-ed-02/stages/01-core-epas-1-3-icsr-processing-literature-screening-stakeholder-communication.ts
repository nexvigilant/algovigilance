/**
 * Stage: Core EPAs 1-3: ICSR Processing, Literature Screening & Stakeholder Communication
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage01: CapabilityStage = {
  id: 'pv-ed-02-01',
  title: 'Core EPAs 1-3: ICSR Processing, Literature Screening & Stakeholder Communication',
  description: 'Build foundational entrustment in EPA-1 (ICSR Processing), EPA-2 (Literature Screening for Safety Information), and EPA-3 (Stakeholder Communication). Assess readiness to progress from observation (Level 1) to direct supervision (Level 2).',
  lessons: [
    {
      id: 'pv-ed-02-01-a01',
      title: 'EPA Framework Introduction & Entrustment Principles',
      description: 'EPA Framework Introduction & Entrustment Principles',
      content: `## EPA Framework Introduction & Entrustment Principles\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-02-01-a02',
      title: 'ICSR Processing Workflow Simulation',
      description: 'ICSR Processing Workflow Simulation',
      content: `## ICSR Processing Workflow Simulation\n\nTODO: Add content for this activity.`,
      estimatedDuration: 25,
},
    {
      id: 'pv-ed-02-01-a03',
      title: 'Core EPAs 1-3 Entrustment Assessment',
      description: 'Core EPAs 1-3 Entrustment Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-02-01-q01',
        type: 'multiple-choice',
        options: [
          'Complete MedDRA coding and causality assessment',
          'Initial triage to determine seriousness and regulatory reportability',
          'Send follow-up request to the reporter for missing information',
          'Submit the completed report to the relevant regulatory authority',
        ],
        correctAnswer: 1,
          question: 'When processing an ICSR, which action must be completed within the first 24 hours of receipt for a serious adverse event from a spontaneous source?',
          explanation: 'Initial triage within 24 hours is critical to determine if the case meets seriousness criteria and triggers expedited reporting timelines. Early identification of serious cases ensures regulatory timelines (15-day or 7-day) are met. Full coding and causality assessment follow during medical review.',
          points: 2,
        },
        {
          id: 'pv-ed-02-01-q02',
        type: 'true-false',
        correctAnswer: 0 as 0 | 1,
          question: 'Literature screening for pharmacovigilance purposes requires searching only PubMed/MEDLINE, as it is the most comprehensive biomedical database.',
          explanation: 'PV literature screening requires multiple databases including PubMed/MEDLINE, Embase, and regional databases. ICH E2C(R2) and GVP Module VI specify that MAHs must monitor worldwide scientific literature. Embase covers European journals not indexed in PubMed, and disease-specific databases may be needed.',
          points: 1,
        },
        {
          id: 'pv-ed-02-01-q03',
        type: 'multiple-choice',
        options: [
          'Independently processing cases including complex multi-drug reports',
          'Performing data entry and initial triage under direct observation by a supervisor',
          'Supervising other ICSR processors and conducting quality reviews',
          'Designing and implementing ICSR processing SOPs for the organization',
        ],
        correctAnswer: 1,
          question: 'At entrustment Level 2 (direct supervision) for EPA-1 (ICSR Processing), which capability is expected?',
          explanation: 'Entrustment Level 2 (direct supervision) means the learner can perform the activity but requires a supervisor present who can step in if needed. For ICSR processing, this means handling data entry and initial triage steps while being observed, with the supervisor reviewing all outputs.',
          points: 2,
        },
        {
          id: 'pv-ed-02-01-q04',
        type: 'multiple-choice',
        options: [
          'Present only the raw disproportionality scores without clinical interpretation',
          'Provide a structured summary with clinical context, statistical evidence, regulatory implications, and proposed actions',
          'Email a spreadsheet of affected cases with minimal commentary',
          'Delegate the presentation to the biostatistics team for technical accuracy',
        ],
        correctAnswer: 1,
          question: 'Which communication approach is most appropriate when presenting a safety signal to a cross-functional safety review committee?',
          explanation: 'Effective stakeholder communication requires a structured, multi-dimensional presentation integrating clinical context (what does this mean for patients?), statistical evidence (how strong is the signal?), regulatory implications (what are our obligations?), and proposed actions (what should we do next?).',
          points: 2,
        }
        ],
      },
},
    {
      id: 'pv-ed-02-01-a04',
      title: 'Literature Screening Strategy Builder',
      description: 'Literature Screening Strategy Builder',
      content: `## Literature Screening Strategy Builder\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-02-01-a05',
      title: 'Entrustment Self-Assessment: EPAs 1-3',
      description: 'Entrustment Self-Assessment: EPAs 1-3',
      content: `## Entrustment Self-Assessment: EPAs 1-3\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
}
  ],
};
