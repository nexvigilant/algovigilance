/**
 * Stage: AI-Enhanced Pharmacovigilance
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage08: CapabilityStage = {
  id: 'pv-ed-03-08',
  title: 'AI-Enhanced Pharmacovigilance',
  description: 'CPA-8 — Artificial intelligence and machine learning applications in PV: automated case processing, NLP-driven signal detection, predictive safety analytics, and governance of AI/ML tools. Integrates all competencies with AI literacy mapped to EPAs 10, 11, and 12.',
  lessons: [
    {
      id: 'pv-ed-03-08-a01',
      title: 'AI/ML Applications Across the PV Lifecycle',
      description: 'AI/ML Applications Across the PV Lifecycle',
      content: `## AI/ML Applications Across the PV Lifecycle\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-08-a02',
      title: 'NLP Pipeline Design for ICSR Processing',
      description: 'NLP Pipeline Design for ICSR Processing',
      content: `## NLP Pipeline Design for ICSR Processing\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-03-08-a03',
      title: 'AI Governance Framework Design for PV Operations',
      description: 'AI Governance Framework Design for PV Operations',
      content: `## AI Governance Framework Design for PV Operations\n\nTODO: Add content for this activity.`,
      estimatedDuration: 25,
},
    {
      id: 'pv-ed-03-08-a04',
      title: 'AI-Enhanced PV Assessment',
      description: 'AI-Enhanced PV Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 85,
        questions: [
        {
          id: 'pv-ed-03-08-q01',
        type: 'multiple-choice',
        options: [
          'Human-in-the-loop validation where a qualified safety professional reviews and confirms AI-extracted data before regulatory submission',
          'Using the largest available language model to maximize extraction accuracy',
          'Processing all reports through the AI system without exception to ensure consistency',
          'Training the model exclusively on the company\'s internal case database',
        ],
        correctAnswer: 0,
          question: 'When implementing NLP for automated ICSR processing, which step is MOST critical to ensure regulatory compliance?',
          explanation: 'Regulatory agencies (EMA, FDA) require that MAHs maintain responsibility for the quality and completeness of safety data. AI/ML tools can assist but human oversight by qualified personnel is mandatory, especially for serious/unexpected cases requiring expedited reporting.',
          points: 2,
        },
        {
          id: 'pv-ed-03-08-q02',
        type: 'multiple-choice',
        options: [
          'Using time-series models on spontaneous reporting data to forecast emerging safety signals before they cross statistical thresholds',
          'Replacing causality assessment with automated probability scores to eliminate human bias',
          'Using AI to override regulatory reporting decisions when the model disagrees with the safety physician',
          'Eliminating follow-up activities for cases that the AI model classifies as non-serious',
        ],
        correctAnswer: 0,
          question: 'Which of the following represents a valid application of predictive analytics in pharmacovigilance?',
          explanation: 'Predictive analytics can legitimately augment signal detection by identifying reporting trends and emerging patterns before they reach traditional statistical thresholds. However, AI cannot replace regulatory obligations, causality assessment by qualified professionals, or mandated follow-up procedures.',
          points: 2,
        },
        {
          id: 'pv-ed-03-08-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'The EU AI Act classifies AI systems used in pharmacovigilance safety decision-making as high-risk, requiring conformity assessment, transparency obligations, and human oversight provisions.',
          explanation: 'Under the EU AI Act (Regulation 2024/1689), AI systems used in healthcare safety contexts — including pharmacovigilance decision support — are classified as high-risk under Annex III. This mandates risk management systems, data governance, human oversight, and conformity assessment before deployment.',
          points: 1,
        }
        ],
      },
}
  ],
};
