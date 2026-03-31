/**
 * Stage: Risk Management
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage03: CapabilityStage = {
  id: 'pv-ed-03-03',
  title: 'Risk Management',
  description: 'CPA-3 — Risk Evaluation and Mitigation Strategies (REMS), Risk Management Plans (RMPs), and benefit-risk frameworks. Covers Competencies 10 (Benefit-Risk), 11 (Risk Minimization), 12 (Regulatory Compliance), and 13 (Communication) mapped to EPAs 7 and 8.',
  lessons: [
    {
      id: 'pv-ed-03-03-a01',
      title: 'Risk Management Plans and REMS Frameworks',
      description: 'Risk Management Plans and REMS Frameworks',
      content: `## Risk Management Plans and REMS Frameworks\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-03-a02',
      title: 'Benefit-Risk Assessment Framework Builder',
      description: 'Benefit-Risk Assessment Framework Builder',
      content: `## Benefit-Risk Assessment Framework Builder\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-03-03-a03',
      title: 'REMS Case Study: Isotretinoin iPLEDGE Program',
      description: 'REMS Case Study: Isotretinoin iPLEDGE Program',
      content: `## REMS Case Study: Isotretinoin iPLEDGE Program\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-03-a04',
      title: 'Risk Management Assessment',
      description: 'Risk Management Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'pv-ed-03-03-q01',
        type: 'multiple-choice',
        options: [
          'Marketing budget allocation for the product lifecycle',
          'Safety specification summarizing the safety profile',
          'Pharmacovigilance plan for further characterizing risks',
          'Risk minimization measures including routine and additional measures',
        ],
        correctAnswer: 0,
          question: 'Under EU GVP Module V, which component is NOT part of a Risk Management Plan (RMP)?',
          explanation: 'An EU RMP per GVP Module V consists of a safety specification (Part II), a pharmacovigilance plan (Part III), and risk minimization measures (Part V). Marketing budget is a commercial function and has no place in an RMP.',
          points: 2,
        },
        {
          id: 'pv-ed-03-03-q02',
        type: 'multiple-choice',
        options: [
          'All of the following: Medication Guide, Communication Plan, Elements to Assure Safe Use (ETASU), and an Implementation System',
          'Only a Medication Guide and a Dear Healthcare Provider letter',
          'Only patient registries and restricted distribution programs',
          'Only a black box warning on the product labeling',
        ],
        correctAnswer: 0,
          question: 'The FDA REMS program may include which of the following elements to ensure safe use of a medication?',
          explanation: 'Under 21 USC 355-1, a REMS may require one or more of: a Medication Guide, a Communication Plan, Elements to Assure Safe Use (ETASU such as prescriber certification, patient registries, restricted distribution), and an Implementation System to monitor ETASU compliance.',
          points: 2,
        },
        {
          id: 'pv-ed-03-03-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'The EMA\'s benefit-risk methodology uses a structured framework called PrOACT-URL (Problem, Objectives, Alternatives, Consequences, Trade-offs — Uncertainty, Risk tolerance, Linked decisions).',
          explanation: 'The EMA adopted the PrOACT-URL framework as part of its Benefit-Risk Methodology Project to bring structure and transparency to benefit-risk evaluation in regulatory decision-making.',
          points: 1,
        }
        ],
      },
}
  ],
};
