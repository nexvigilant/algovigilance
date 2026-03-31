/**
 * Stage: Quality and Compliance
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage04: CapabilityStage = {
  id: 'pv-ed-03-04',
  title: 'Quality and Compliance',
  description: 'CPA-4 — Quality Management Systems (QMS) for PV, audit readiness, regulatory inspections, and SOPs. Covers Competencies 1 (Ethics), 12 (Regulatory Compliance), 7 (Data Management), and 4 (Medical Assessment) mapped to EPAs 9 and 10.',
  lessons: [
    {
      id: 'pv-ed-03-04-a01',
      title: 'PV Quality Management Systems and GVP Module I',
      description: 'PV Quality Management Systems and GVP Module I',
      content: `## PV Quality Management Systems and GVP Module I\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-04-a02',
      title: 'Audit Finding Classification Exercise',
      description: 'Audit Finding Classification Exercise',
      content: `## Audit Finding Classification Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-03-04-a03',
      title: 'Quality and Compliance Assessment',
      description: 'Quality and Compliance Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'pv-ed-03-04-q01',
        type: 'multiple-choice',
        options: [
          'Critical, Major, and Minor — where critical findings indicate potential serious risk to public health',
          'High, Medium, and Low — based on probability of recurrence',
          'Class I, II, and III — mirroring device risk classification',
          'Red, Amber, and Green — using traffic light severity',
        ],
        correctAnswer: 0,
          question: 'In a regulatory PV inspection, findings are typically classified into which categories?',
          explanation: 'EMA and most competent authorities classify PV inspection findings as Critical (conditions/practices that adversely affect public health), Major (significant deviation from EU regulatory requirements), or Minor (not likely to adversely affect public health).',
          points: 2,
        },
        {
          id: 'pv-ed-03-04-q02',
        type: 'multiple-choice',
        options: [
          'Reside and operate in the EU/EEA, with continuous and permanent access to the pharmacovigilance system master file',
          'Hold an active medical license in at least two EU member states',
          'Maintain exclusive employment with no more than one Marketing Authorization Holder',
          'Complete annual certification through the EMA pharmacovigilance training academy',
        ],
        correctAnswer: 0,
          question: 'According to GVP Module I, the Qualified Person Responsible for Pharmacovigilance (QPPV) must fulfill which key requirement?',
          explanation: 'Per GVP Module I and Directive 2001/83/EC Article 104, the QPPV must reside and operate in the EU/EEA and have continuous access to the PSMF. They must be sufficiently qualified and have oversight of the PV system.',
          points: 2,
        },
        {
          id: 'pv-ed-03-04-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'The Pharmacovigilance System Master File (PSMF) must be maintained at the site specified in the marketing authorization and be available for inspection at all times.',
          explanation: 'Per GVP Module II, the PSMF is a detailed description of the PV system used by the MAH. It must be located at the QPPV\'s site (or specified location) and be permanently available for inspection by competent authorities.',
          points: 1,
        }
        ],
      },
}
  ],
};
