/**
 * Stage: Signal Management
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage02: CapabilityStage = {
  id: 'pv-ed-03-02',
  title: 'Signal Management',
  description: 'CPA-2 — Signal detection, validation, prioritization, and assessment. Covers Competencies 8 (Signal Detection), 9 (Epidemiological Methods), 10 (Benefit-Risk Assessment), and 15 (Continuous Learning) mapped to EPAs 5 and 6.',
  lessons: [
    {
      id: 'pv-ed-03-02-a01',
      title: 'Signal Detection Methods and Data Sources',
      description: 'Signal Detection Methods and Data Sources',
      content: `## Signal Detection Methods and Data Sources\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-02-a02',
      title: 'Disproportionality Analysis Workshop',
      description: 'Disproportionality Analysis Workshop',
      content: `## Disproportionality Analysis Workshop\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-02-a03',
      title: 'Signal Validation Case Study: Fluoroquinolone Aortic Dissection',
      description: 'Signal Validation Case Study: Fluoroquinolone Aortic Dissection',
      content: `## Signal Validation Case Study: Fluoroquinolone Aortic Dissection\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-02-a04',
      title: 'Signal Management Assessment',
      description: 'Signal Management Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-03-02-q01',
        type: 'multiple-choice',
        options: [
          '(a / (a+b)) / (c / (c+d)), where a = drug-event pair, b = drug-other events, c = non-drug-event, d = non-drug-other events',
          '(a × d) / (b × c) in a standard 2×2 contingency table',
          'The observed-to-expected ratio using Bayesian shrinkage',
          'The chi-square statistic divided by degrees of freedom',
        ],
        correctAnswer: 0,
          question: 'In disproportionality analysis, the Proportional Reporting Ratio (PRR) is calculated as which of the following?',
          explanation: 'PRR compares the proportion of a specific event among reports for a drug of interest versus the proportion of that event among all other drugs. PRR = (a/(a+b)) / (c/(c+d)). The ROR uses the cross-product ratio (ad/bc) instead.',
          points: 2,
        },
        {
          id: 'pv-ed-03-02-q02',
        type: 'multiple-choice',
        options: [
          'Signal detection → Signal validation → Signal prioritization → Signal assessment → Recommendation for action',
          'Signal validation → Signal detection → Signal assessment → Signal prioritization → Recommendation for action',
          'Signal assessment → Signal detection → Signal validation → Recommendation for action → Signal prioritization',
          'Signal detection → Signal assessment → Signal prioritization → Signal validation → Recommendation for action',
        ],
        correctAnswer: 0,
          question: 'According to GVP Module IX, what is the correct sequence in the signal management process?',
          explanation: 'GVP Module IX defines the signal management process as: detection (identifying potential signals from data), validation (confirming the signal warrants further analysis), prioritization (ranking by public health impact), assessment (detailed evaluation), and recommendation for action.',
          points: 2,
        },
        {
          id: 'pv-ed-03-02-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'The Empirical Bayesian Geometric Mean (EBGM) uses a gamma-Poisson shrinkage model to reduce false positives from disproportionality analysis in large spontaneous reporting databases.',
          explanation: 'EBGM employs a gamma-Poisson shrinkage (GPS) model that shrinks extreme values toward the overall mean, reducing false positive signals that arise from sparse data. The EB05 (lower 5th percentile) threshold of >= 2.0 is commonly used for signal detection.',
          points: 1,
        }
        ],
      },
}
  ],
};
