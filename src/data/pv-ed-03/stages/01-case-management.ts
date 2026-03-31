/**
 * Stage: Case Management
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage01: CapabilityStage = {
  id: 'pv-ed-03-01',
  title: 'Case Management',
  description: 'CPA-1 — Individual Case Safety Report (ICSR) lifecycle from intake through submission. Covers Competencies 2 (Regulatory Knowledge), 3 (Case Processing), 4 (Medical Assessment), and 14 (Documentation) mapped to EPAs 1, 2, and 3.',
  lessons: [
    {
      id: 'pv-ed-03-01-a01',
      title: 'ICSR Lifecycle and Regulatory Timelines',
      description: 'ICSR Lifecycle and Regulatory Timelines',
      content: `## ICSR Lifecycle and Regulatory Timelines\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-01-a02',
      title: 'Case Intake and Data Entry Simulation',
      description: 'Case Intake and Data Entry Simulation',
      content: `## Case Intake and Data Entry Simulation\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-01-a03',
      title: 'Case Management Fundamentals Assessment',
      description: 'Case Management Fundamentals Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-03-01-q01',
        type: 'multiple-choice',
        options: [
          'An identifiable reporter, an identifiable patient, a suspect product, and an adverse event/reaction',
          'Patient demographics, drug dose, onset date, and outcome',
          'Reporter credentials, patient diagnosis, suspect drug class, and MedDRA coding',
          'Case narrative, laboratory results, concomitant medications, and medical history',
        ],
        correctAnswer: 0,
          question: 'Under ICH E2B(R3) guidelines, what are the four minimum criteria for a valid Individual Case Safety Report (ICSR)?',
          explanation: 'ICH E2B(R3) defines four minimum criteria for ICSR validity: an identifiable reporter, an identifiable patient, at least one suspect medicinal product, and at least one suspected adverse event or reaction.',
          points: 2,
        },
        {
          id: 'pv-ed-03-01-q02',
        type: 'multiple-choice',
        options: [
          '15 calendar days from the date the MAH first becomes aware',
          '30 calendar days from the date of the event',
          '7 calendar days from receipt of the report',
          '90 calendar days from marketing authorization',
        ],
        correctAnswer: 0,
          question: 'What is the regulatory reporting timeline for serious, unexpected adverse drug reactions from post-marketing sources to competent authorities in most jurisdictions?',
          explanation: 'Per ICH E2D and most regulatory frameworks, serious unexpected ADRs from spontaneous sources must be reported as expedited reports within 15 calendar days. Fatal or life-threatening cases require initial reporting within 7 days with a follow-up by 15 days.',
          points: 2,
        },
        {
          id: 'pv-ed-03-01-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'According to GVP Module VI, follow-up information for an ICSR should be sought when the initial report is incomplete but medically relevant details may be obtainable from the reporter.',
          explanation: 'GVP Module VI requires Marketing Authorization Holders to make reasonable attempts to obtain follow-up information for ICSRs, particularly when the initial report lacks important medical or regulatory details.',
          points: 1,
        }
        ],
      },
}
  ],
};
