/**
 * Stage: Assessment & Strategy: Regulatory Compliance
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage06: CapabilityStage = {
  id: 'pv-ed-01-06',
  title: 'Assessment & Strategy: Regulatory Compliance',
  description: 'Assess competency in Domain 12: global regulatory compliance frameworks, GVP guidelines, CFR requirements, and evolving regulatory expectations for AI-enabled PV systems.',
  lessons: [
    {
      id: 'pv-ed-01-06-a01',
      title: 'Global Regulatory Landscape: GVP, CFR & ICH Guidelines',
      description: 'Global Regulatory Landscape: GVP, CFR & ICH Guidelines',
      content: `## Global Regulatory Landscape: GVP, CFR & ICH Guidelines\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-01-06-a02',
      title: 'Regulatory Gap Analysis Simulation',
      description: 'Regulatory Gap Analysis Simulation',
      content: `## Regulatory Gap Analysis Simulation\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-01-06-a03',
      title: 'Regulatory Compliance Assessment',
      description: 'Regulatory Compliance Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-01-06-q01',
        type: 'multiple-choice',
        options: [
          'GVP Module V — Risk Management Systems',
          'GVP Module VII — Periodic Safety Update Report',
          'GVP Module IX — Signal Management',
          'GVP Module XVI — Risk Minimisation Measures',
        ],
        correctAnswer: 2,
          question: 'Which GVP module specifically addresses signal management including detection, validation, confirmation, analysis, prioritization, and assessment?',
          explanation: 'GVP Module IX covers the complete signal management process from detection through assessment and recommendation for action. It defines a signal as \'information that arises from one or multiple sources which suggests a new potentially causal association, or a new aspect of a known association.\'',
          points: 2,
        },
        {
          id: 'pv-ed-01-06-q02',
        type: 'multiple-choice',
        options: [
          '7 calendar days',
          '15 calendar days',
          '30 calendar days',
          '90 calendar days',
        ],
        correctAnswer: 1,
          question: 'Under 21 CFR 314.80, what is the expedited reporting timeline for serious and unexpected adverse drug experiences from post-marketing sources?',
          explanation: '21 CFR 314.80(c)(1) requires manufacturers to report serious, unexpected adverse drug experiences as 15-day Alert Reports. If the event is fatal or life-threatening, an additional field alert is recommended. Periodic reports (non-serious/expected) follow quarterly/annual schedules.',
          points: 2,
        },
        {
          id: 'pv-ed-01-06-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'ICH E2C(R2) harmonizes the format and content of the Periodic Benefit-Risk Evaluation Report (PBRER), which replaced the Periodic Safety Update Report (PSUR) in the EU.',
          explanation: 'ICH E2C(R2) established the PBRER as the harmonized format for periodic safety reporting. In the EU, the PBRER replaced the PSUR for centrally authorized products, providing a more comprehensive benefit-risk evaluation rather than just safety data compilation.',
          points: 1,
        }
        ],
      },
},
    {
      id: 'pv-ed-01-06-a04',
      title: 'GVP Module Navigation Exercise',
      description: 'GVP Module Navigation Exercise',
      content: `## GVP Module Navigation Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'pv-ed-01-06-a05',
      title: 'AI Regulatory Readiness Self-Assessment',
      description: 'AI Regulatory Readiness Self-Assessment',
      content: `## AI Regulatory Readiness Self-Assessment\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
}
  ],
};
