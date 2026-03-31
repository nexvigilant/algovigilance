/**
 * Stage: Communication and Stakeholder Engagement
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage06: CapabilityStage = {
  id: 'pv-ed-03-06',
  title: 'Communication and Stakeholder Engagement',
  description: 'CPA-6 — Regulatory submissions (PSURs/PBRERs), healthcare professional communication, patient engagement, and cross-functional collaboration. Covers Competencies 13 (Communication), 14 (Documentation), 15 (Continuous Learning), and 10 (Benefit-Risk) mapped to EPAs 3, 6, and 8.',
  lessons: [
    {
      id: 'pv-ed-03-06-a01',
      title: 'PSUR/PBRER Structure and Regulatory Requirements',
      description: 'PSUR/PBRER Structure and Regulatory Requirements',
      content: `## PSUR/PBRER Structure and Regulatory Requirements\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-06-a02',
      title: 'PBRER Section Analysis Workshop',
      description: 'PBRER Section Analysis Workshop',
      content: `## PBRER Section Analysis Workshop\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-06-a03',
      title: 'Dear Healthcare Provider Letter Drafting Exercise',
      description: 'Dear Healthcare Provider Letter Drafting Exercise',
      content: `## Dear Healthcare Provider Letter Drafting Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-03-06-a04',
      title: 'Communication and Stakeholder Assessment',
      description: 'Communication and Stakeholder Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-03-06-q01',
        type: 'multiple-choice',
        options: [
          'The Periodic Safety Update Report (PSUR) as defined in ICH E2C(R1)',
          'The Development Safety Update Report (DSUR) as defined in ICH E2F',
          'The Annual Safety Report defined in FDA 21 CFR 312.32',
          'The Risk Management Plan Summary Report per GVP Module V',
        ],
        correctAnswer: 0,
          question: 'The Periodic Benefit-Risk Evaluation Report (PBRER), as defined in ICH E2C(R2), replaced which previous periodic reporting format?',
          explanation: 'ICH E2C(R2) superseded E2C(R1) by introducing the PBRER format, which added a formal benefit-risk evaluation to the periodic safety update, replacing the purely safety-focused PSUR framework.',
          points: 2,
        },
        {
          id: 'pv-ed-03-06-q02',
        type: 'multiple-choice',
        options: [
          'Integrated Benefit-Risk Analysis for Approved Indications',
          'Marketing performance metrics and sales volume data',
          'Competitor safety profile comparison tables',
          'Patient-reported outcome questionnaire results',
        ],
        correctAnswer: 0,
          question: 'Which of the following is a mandatory section of the PBRER per ICH E2C(R2)?',
          explanation: 'The Integrated Benefit-Risk Analysis for Approved Indications is a core required section of the PBRER. It synthesizes the benefit and risk evidence to support an updated benefit-risk evaluation at each reporting interval.',
          points: 2,
        },
        {
          id: 'pv-ed-03-06-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Direct Healthcare Professional Communications (DHPCs) require prior approval or notification to the relevant competent authority before distribution in the EU.',
          explanation: 'Per GVP Module XV, DHPCs in the EU must be agreed upon with the relevant competent authority (national or EMA via PRAC) before dissemination. The content, target audience, and timing must be approved to ensure consistent, accurate safety communication.',
          points: 1,
        }
        ],
      },
}
  ],
};
