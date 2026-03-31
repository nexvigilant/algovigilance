/**
 * Stage: Process Domain III: Post-Authorization Safety Studies
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage04: CapabilityStage = {
  id: 'pv-ed-01-04',
  title: 'Process Domain III: Post-Authorization Safety Studies',
  description: 'Assess competency in Domain 9: design, conduct, and evaluation of post-authorization safety studies (PASS) including both imposed and voluntary studies under regulatory frameworks.',
  lessons: [
    {
      id: 'pv-ed-01-04-a01',
      title: 'PASS Design & Regulatory Requirements',
      description: 'PASS Design & Regulatory Requirements',
      content: `## PASS Design & Regulatory Requirements\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-01-04-a02',
      title: 'PASS Protocol Development Workshop',
      description: 'PASS Protocol Development Workshop',
      content: `## PASS Protocol Development Workshop\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-01-04-a03',
      title: 'Post-Authorization Study Assessment',
      description: 'Post-Authorization Study Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 76,
        questions: [
        {
          id: 'pv-ed-01-04-q01',
        type: 'multiple-choice',
        options: [
          'Committee for Medicinal Products for Human Use (CHMP)',
          'Pharmacovigilance Risk Assessment Committee (PRAC)',
          'Committee for Advanced Therapies (CAT)',
          'Coordination Group for Mutual Recognition (CMDh)',
        ],
        correctAnswer: 1,
          question: 'Under EU legislation, which committee is responsible for evaluating PASS protocols and results for studies imposed as a condition of marketing authorization?',
          explanation: 'PRAC is the EMA committee responsible for assessing all aspects of risk management of medicines, including evaluation of PASS protocols and study results. For imposed PASS, the protocol must be submitted to PRAC within 12 months of MA approval.',
          points: 2,
        },
        {
          id: 'pv-ed-01-04-q02',
        type: 'true-false',
        correctAnswer: 0 as 0 | 1,
          question: 'A post-authorization efficacy study (PAES) and a post-authorization safety study (PASS) serve the same regulatory purpose and are governed by identical guidelines.',
          explanation: 'PASS and PAES serve different purposes. PASS focuses on identifying, characterizing, or quantifying safety risks and evaluating risk minimization measures. PAES addresses residual uncertainty about efficacy. While both may be imposed as conditions of authorization, they have distinct protocols, endpoints, and evaluation criteria.',
          points: 1,
        },
        {
          id: 'pv-ed-01-04-q03',
        type: 'multiple-choice',
        options: [
          'Randomized controlled trial',
          'Case-control study nested within a cohort',
          'Prospective cohort study using electronic health records',
          'Cross-sectional survey of healthcare professionals',
        ],
        correctAnswer: 2,
          question: 'Which study design is most appropriate for a PASS aimed at estimating the incidence rate of a rare adverse reaction in a real-world population?',
          explanation: 'A prospective cohort study using real-world data (e.g., electronic health records, registries) is ideal for estimating incidence rates of adverse reactions in routine clinical practice. It captures the natural history of drug exposure and outcomes without the selection bias of clinical trials.',
          points: 2,
        }
        ],
      },
},
    {
      id: 'pv-ed-01-04-a04',
      title: 'PASS vs PAES Decision Framework',
      description: 'PASS vs PAES Decision Framework',
      content: `## PASS vs PAES Decision Framework\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'pv-ed-01-04-a05',
      title: 'Study Design Selection Tool',
      description: 'Study Design Selection Tool',
      content: `## Study Design Selection Tool\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
}
  ],
};
