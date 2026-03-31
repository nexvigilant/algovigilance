/**
 * Stage: Core EPAs 4-6: Post-Marketing Analysis, Signal Detection & Regulatory Documents
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage02: CapabilityStage = {
  id: 'pv-ed-02-02',
  title: 'Core EPAs 4-6: Post-Marketing Analysis, Signal Detection & Regulatory Documents',
  description: 'Develop competency in EPA-4 (Post-Marketing Data Analysis), EPA-5 (Signal Detection & Validation), and EPA-6 (Regulatory Document Development). Progress toward indirect supervision (Level 3).',
  lessons: [
    {
      id: 'pv-ed-02-02-a01',
      title: 'Post-Marketing Surveillance Data Sources & Methods',
      description: 'Post-Marketing Surveillance Data Sources & Methods',
      content: `## Post-Marketing Surveillance Data Sources & Methods\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-02-02-a02',
      title: 'Signal Detection Workflow Simulation',
      description: 'Signal Detection Workflow Simulation',
      content: `## Signal Detection Workflow Simulation\n\nTODO: Add content for this activity.`,
      estimatedDuration: 25,
},
    {
      id: 'pv-ed-02-02-a03',
      title: 'Core EPAs 4-6 Assessment',
      description: 'Core EPAs 4-6 Assessment',
      content: '',
      estimatedDuration: 25,
      assessment: {
        type: 'quiz',
        passingScore: 72,
        questions: [
        {
          id: 'pv-ed-02-02-q01',
        type: 'multiple-choice',
        options: [
          'Crude proportional reporting ratio (PRR)',
          'Stratified or adjusted disproportionality analysis',
          'Simple frequency count of adverse event reports',
          'Unadjusted reporting odds ratio (ROR)',
        ],
        correctAnswer: 1,
          question: 'When conducting post-marketing data analysis, which statistical measure best accounts for the effect of confounding variables in observational safety data?',
          explanation: 'Stratified or adjusted disproportionality analysis accounts for confounders like age, gender, reporting year, and co-medications that can create spurious signals. Crude measures (PRR, ROR without stratification) are susceptible to confounding, particularly masking effects and protopathic bias.',
          points: 2,
        },
        {
          id: 'pv-ed-02-02-q02',
        type: 'multiple-choice',
        options: [
          'Validation uses clinical data while confirmation uses statistical data',
          'Validation checks if evidence warrants further investigation; confirmation involves a more thorough evaluation with additional data',
          'Validation is performed by regulators while confirmation is performed by MAHs',
          'They are the same step described by different terms in EU and US regulations',
        ],
        correctAnswer: 1,
          question: 'In the signal management process defined by GVP Module IX, what distinguishes signal validation from signal confirmation?',
          explanation: 'Signal validation is an initial assessment of whether the evidence is sufficient to justify further investigation (filtering step). Signal confirmation involves a more comprehensive evaluation with additional data sources, clinical review, and scientific assessment to determine if a true safety concern exists.',
          points: 2,
        },
        {
          id: 'pv-ed-02-02-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'A Periodic Benefit-Risk Evaluation Report (PBRER) must include an evaluation of the overall benefit-risk balance of the medicinal product, not just a listing of adverse events.',
          explanation: 'Per ICH E2C(R2), the PBRER requires a comprehensive evaluation of the benefit-risk balance, integrating safety data, efficacy evidence, and overall risk-benefit assessment. This is a fundamental shift from the older PSUR format which focused primarily on safety data compilation.',
          points: 1,
        },
        {
          id: 'pv-ed-02-02-q04',
        type: 'multiple-choice',
        options: [
          'Use verbatim patient descriptions for authenticity',
          'Use MedDRA Preferred Terms aligned with the approved SmPC/USPI section conventions',
          'Use ICD-10 codes for international standardization',
          'Use the investigator\'s verbatim terms from clinical trial reports',
        ],
        correctAnswer: 1,
          question: 'When developing a regulatory submission document such as a safety variation to product labeling, which principle governs the language used to describe adverse reactions?',
          explanation: 'Regulatory documents must use MedDRA Preferred Terms (PTs) following established SmPC/USPI conventions. This ensures consistency with existing labeling, enables regulatory database searches, and maintains standardized terminology recognized across regulatory agencies globally.',
          points: 2,
        }
        ],
      },
},
    {
      id: 'pv-ed-02-02-a04',
      title: 'Regulatory Document Drafting Exercise',
      description: 'Regulatory Document Drafting Exercise',
      content: `## Regulatory Document Drafting Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-02-02-a05',
      title: 'Signal Validation Decision Tree Practice',
      description: 'Signal Validation Decision Tree Practice',
      content: `## Signal Validation Decision Tree Practice\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
}
  ],
};
