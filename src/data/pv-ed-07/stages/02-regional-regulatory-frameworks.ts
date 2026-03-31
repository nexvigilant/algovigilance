/**
 * Stage: Regional Regulatory Frameworks
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage02: CapabilityStage = {
  id: 'pv-ed-07-02',
  title: 'Regional Regulatory Frameworks',
  description: 'Understand major regional pharmacovigilance requirements: FDA 21 CFR Part 312/314 (IND/NDA reporting), 21 CFR 600.80 (biologics), EMA Good Pharmacovigilance Practices (GVP) module system, and PMDA GPSP/GVP requirements. Compare timelines, definitions, and reporting thresholds across regions.',
  lessons: [
    {
      id: 'pv-ed-07-02-a01',
      title: 'FDA Pharmacovigilance Regulations',
      description: 'FDA Pharmacovigilance Regulations',
      content: `## FDA Pharmacovigilance Regulations\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-07-02-a02',
      title: 'EMA Good Pharmacovigilance Practices Modules',
      description: 'EMA Good Pharmacovigilance Practices Modules',
      content: `## EMA Good Pharmacovigilance Practices Modules\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-07-02-a03',
      title: 'Regional Divergence Case Study: Expedited Reporting Timelines',
      description: 'Regional Divergence Case Study: Expedited Reporting Timelines',
      content: `## Regional Divergence Case Study: Expedited Reporting Timelines\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-07-02-a04',
      title: 'Regional Frameworks Assessment',
      description: 'Regional Frameworks Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-07-02-q01',
        type: 'multiple-choice',
        options: [
          'Serious and unexpected adverse experiences',
          'All adverse experiences regardless of seriousness',
          'Only fatal adverse experiences',
          'Only adverse experiences with a positive rechallenge',
        ],
        correctAnswer: 0,
          question: 'Under FDA regulations, 21 CFR 314.80 requires Marketing Authorization Holders to submit 15-day Alert Reports for which type of adverse events?',
          explanation: '21 CFR 314.80 requires 15-day Alert Reports for adverse drug experiences that are both serious and unexpected. The combination of seriousness criteria and unlisted/unexpected nature triggers the expedited timeline.',
          points: 2,
        },
        {
          id: 'pv-ed-07-02-q02',
        type: 'multiple-select',
        options: [
          'Module VI: Collection, management, and submission of ICSRs',
          'Module VII: Periodic Safety Update Reports',
          'Module IX: Signal management',
          'Module XII: Post-authorization efficacy studies',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which of the following are EMA Good Pharmacovigilance Practices (GVP) modules? Select all that apply.',
          explanation: 'Modules VI, VII, and IX are established EMA GVP modules. There is no Module XII for post-authorization efficacy studies. GVP Module XVI covers risk minimization measures, and post-authorization efficacy studies (PAES) are covered under separate guidance.',
          points: 3,
        },
        {
          id: 'pv-ed-07-02-q03',
        type: 'true-false',
        correctAnswer: 0 as 0 | 1,
          question: 'Japan\'s PMDA requires submission of Periodic Safety Update Reports (PSURs) with the same periodicity as the EMA for all marketed products.',
          explanation: 'Japan has its own periodic reporting system with different periodicity requirements. While ICH E2C(R2) harmonized the PBRER format, Japan still maintains distinct submission intervals, particularly during the re-examination period, which typically requires semi-annual reports.',
          points: 1,
        }
        ],
      },
}
  ],
};
