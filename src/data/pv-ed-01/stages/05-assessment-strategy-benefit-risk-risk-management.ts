/**
 * Stage: Assessment & Strategy: Benefit-Risk & Risk Management
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage05: CapabilityStage = {
  id: 'pv-ed-01-05',
  title: 'Assessment & Strategy: Benefit-Risk & Risk Management',
  description: 'Assess competency in Domains 10-11: structured benefit-risk assessment frameworks and risk management planning including RMP development and REMS programs.',
  lessons: [
    {
      id: 'pv-ed-01-05-a01',
      title: 'Benefit-Risk Assessment Frameworks: PrOACT-URL & Effects Table',
      description: 'Benefit-Risk Assessment Frameworks: PrOACT-URL & Effects Table',
      content: `## Benefit-Risk Assessment Frameworks: PrOACT-URL & Effects Table\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-01-05-a02',
      title: 'Risk Management Plan Construction Lab',
      description: 'Risk Management Plan Construction Lab',
      content: `## Risk Management Plan Construction Lab\n\nTODO: Add content for this activity.`,
      estimatedDuration: 25,
},
    {
      id: 'pv-ed-01-05-a03',
      title: 'Benefit-Risk & Risk Management Assessment',
      description: 'Benefit-Risk & Risk Management Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 78,
        questions: [
        {
          id: 'pv-ed-01-05-q01',
        type: 'multiple-choice',
        options: [
          'PrOACT-URL (Problem, Objectives, Alternatives, Consequences, Trade-offs, Uncertainty, Risk tolerance, Linked decisions)',
          'BRAT (Benefit-Risk Action Team) framework',
          'MCDA (Multi-Criteria Decision Analysis)',
          'GRADE (Grading of Recommendations, Assessment, Development and Evaluation)',
        ],
        correctAnswer: 0,
          question: 'The EMA\'s benefit-risk assessment framework is based on which structured decision-making approach?',
          explanation: 'The EMA adopted the PrOACT-URL framework for structured benefit-risk assessment. It provides a systematic approach to define the problem, set objectives, identify alternatives, evaluate consequences, make trade-offs, assess uncertainty, consider risk tolerance, and link decisions.',
          points: 2,
        },
        {
          id: 'pv-ed-01-05-q02',
        type: 'multiple-choice',
        options: [
          'Module SI — Epidemiology of the indication',
          'Module SVIII — Summary of the safety concerns',
          'Module SII — Non-clinical part of the safety specification',
          'Module SIII — Clinical trial exposure',
        ],
        correctAnswer: 1,
          question: 'In an EU Risk Management Plan (RMP), which module contains the summary of the safety specification including important identified risks, potential risks, and missing information?',
          explanation: 'Module SVIII of the Safety Specification in the EU-RMP (GVP Module V) summarizes the safety concerns categorized as important identified risks, important potential risks, and missing information. This summary drives the pharmacovigilance plan and risk minimization activities.',
          points: 2,
        },
        {
          id: 'pv-ed-01-05-q03',
        type: 'true-false',
        correctAnswer: 0 as 0 | 1,
          question: 'A Risk Evaluation and Mitigation Strategy (REMS) is an EU regulatory requirement equivalent to the European Risk Management Plan.',
          explanation: 'REMS is a US FDA regulatory requirement (21 CFR 314.520), not an EU requirement. While both REMS and EU-RMP aim to manage drug risks, they differ in structure, legal basis, and scope. REMS may include medication guides, communication plans, and Elements to Assure Safe Use (ETASU), while EU-RMPs follow GVP Module V structure.',
          points: 1,
        },
        {
          id: 'pv-ed-01-05-q04',
        type: 'multiple-choice',
        options: [
          'Favorable and unfavorable effects with their frequencies',
          'Quality of evidence assessment for each effect',
          'Cost-effectiveness ratios for each treatment alternative',
          'Importance ranking or weight for each effect',
        ],
        correctAnswer: 2,
          question: 'Which of the following is NOT a standard component of the effects table used in structured benefit-risk assessment?',
          explanation: 'The effects table in benefit-risk assessment includes favorable/unfavorable effects, their frequencies, quality of evidence, and importance rankings. Cost-effectiveness analysis is a separate health economic evaluation and is not part of the standard regulatory benefit-risk effects table.',
          points: 2,
        }
        ],
      },
},
    {
      id: 'pv-ed-01-05-a04',
      title: 'Effects Table Construction Exercise',
      description: 'Effects Table Construction Exercise',
      content: `## Effects Table Construction Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-01-05-a05',
      title: 'RMP vs REMS Comparative Analysis',
      description: 'RMP vs REMS Comparative Analysis',
      content: `## RMP vs REMS Comparative Analysis\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
}
  ],
};
