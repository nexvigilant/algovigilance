/**
 * Stage: Research and Development
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage07: CapabilityStage = {
  id: 'pv-ed-03-07',
  title: 'Research and Development',
  description: 'CPA-7 — Post-authorization safety studies (PASS), epidemiological study design, literature monitoring, and contribution to the evidence base. Covers Competencies 5 (Literature Monitoring), 9 (Epidemiological Methods), 8 (Signal Detection), and 15 (Continuous Learning) mapped to EPAs 4 and 5.',
  lessons: [
    {
      id: 'pv-ed-03-07-a01',
      title: 'PASS Design and GVP Module VIII Requirements',
      description: 'PASS Design and GVP Module VIII Requirements',
      content: `## PASS Design and GVP Module VIII Requirements\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-07-a02',
      title: 'Epidemiological Study Design Selector',
      description: 'Epidemiological Study Design Selector',
      content: `## Epidemiological Study Design Selector\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-03-07-a03',
      title: 'PASS Protocol Critique: Evaluating a Published Study',
      description: 'PASS Protocol Critique: Evaluating a Published Study',
      content: `## PASS Protocol Critique: Evaluating a Published Study\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-03-07-a04',
      title: 'Research and Development Assessment',
      description: 'Research and Development Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 85,
        questions: [
        {
          id: 'pv-ed-03-07-q01',
        type: 'multiple-choice',
        options: [
          'The study protocol must be submitted to the PRAC before study initiation, and the final study report must be submitted within 12 months of data collection end',
          'Only the final report needs to be submitted to the competent authority upon study completion',
          'No regulatory submission is required for voluntary studies not imposed as a condition of the marketing authorization',
          'The study must be registered in ClinicalTrials.gov and published in a peer-reviewed journal',
        ],
        correctAnswer: 0,
          question: 'Under GVP Module VIII, a Post-Authorization Safety Study (PASS) initiated voluntarily by an MAH must meet which requirement?',
          explanation: 'Per GVP Module VIII, even voluntarily-initiated non-interventional PASS must have protocols submitted to PRAC, and final study reports submitted within 12 months of data collection end. This ensures regulatory oversight of all post-authorization safety research.',
          points: 2,
        },
        {
          id: 'pv-ed-03-07-q02',
        type: 'multiple-choice',
        options: [
          'Case-control study — efficiently studies rare outcomes by comparing cases to matched controls',
          'Randomized controlled trial — provides the strongest level of evidence',
          'Cross-sectional survey — captures prevalence at a single time point',
          'Ecological study — uses aggregate population-level data',
        ],
        correctAnswer: 0,
          question: 'Which epidemiological study design is most appropriate for detecting rare adverse events that require long observation periods?',
          explanation: 'Case-control studies are optimal for rare outcomes because they start with identified cases and work backward, making them far more efficient than cohort studies or RCTs for rare events. Cohort studies are better for common outcomes with known exposures.',
          points: 2,
        },
        {
          id: 'pv-ed-03-07-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'GVP Module VI requires MAHs to monitor worldwide medical literature for ICSRs, including monitoring a minimum list of reference databases specified by the EMA.',
          explanation: 'GVP Module VI mandates literature monitoring using a specified minimum list of databases (including at minimum widely used reference databases like Embase/MEDLINE). ICSRs identified in literature must be processed according to the same timelines as spontaneous reports.',
          points: 1,
        }
        ],
      },
}
  ],
};
