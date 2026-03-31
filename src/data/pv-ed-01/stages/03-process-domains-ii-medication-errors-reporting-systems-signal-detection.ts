/**
 * Stage: Process Domains II: Medication Errors, Reporting Systems & Signal Detection
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage03: CapabilityStage = {
  id: 'pv-ed-01-03',
  title: 'Process Domains II: Medication Errors, Reporting Systems & Signal Detection',
  description: 'Assess competency in Domains 6-8: medication error frameworks, global spontaneous reporting systems, and statistical/qualitative signal detection methodologies.',
  lessons: [
    {
      id: 'pv-ed-01-03-a01',
      title: 'Medication Error Taxonomy & Reporting Frameworks',
      description: 'Medication Error Taxonomy & Reporting Frameworks',
      content: `## Medication Error Taxonomy & Reporting Frameworks\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-01-03-a02',
      title: 'Signal Detection Method Comparison Lab',
      description: 'Signal Detection Method Comparison Lab',
      content: `## Signal Detection Method Comparison Lab\n\nTODO: Add content for this activity.`,
      estimatedDuration: 25,
},
    {
      id: 'pv-ed-01-03-a03',
      title: 'Process Domains II Knowledge Assessment',
      description: 'Process Domains II Knowledge Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 74,
        questions: [
        {
          id: 'pv-ed-01-03-q01',
        type: 'multiple-choice',
        options: [
          'Proportional Reporting Ratio (PRR)',
          'Reporting Odds Ratio (ROR)',
          'Empirical Bayes Geometric Mean (EBGM)',
          'Chi-squared statistic',
        ],
        correctAnswer: 2,
          question: 'In the context of pharmacovigilance, which disproportionality measure uses a Bayesian approach with a prior distribution based on all drug-event combinations in the database?',
          explanation: 'EBGM (Multi-item Gamma Poisson Shrinker) is a Bayesian method that uses prior information from all drug-event combinations to shrink estimates toward the overall background rate. This makes it more robust than frequentist measures (PRR, ROR) for rare events or sparse data, as used by FDA in FAERS analysis.',
          points: 2,
        },
        {
          id: 'pv-ed-01-03-q02',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'The WHO Programme for International Drug Monitoring (VigiBase) uses the Information Component (IC) as its primary disproportionality measure for signal detection.',
          explanation: 'VigiBase, maintained by the Uppsala Monitoring Centre (UMC), uses the Bayesian Confidence Propagation Neural Network (BCPNN) which calculates the Information Component (IC). The IC025 (lower 95% credibility interval) > 0 is the standard threshold for a signal of disproportionate reporting.',
          points: 1,
        },
        {
          id: 'pv-ed-01-03-q03',
        type: 'multiple-choice',
        options: [
          'Category C — error reached patient, no harm',
          'Category D — error reached patient, required monitoring',
          'Category E — error contributed to temporary harm requiring intervention',
          'Category F — error contributed to temporary harm requiring hospitalization',
        ],
        correctAnswer: 2,
          question: 'Under the NCC MERP taxonomy, which category describes a medication error that reached the patient and required intervention to preclude harm?',
          explanation: 'NCC MERP Category E describes errors that reached the patient and contributed to or resulted in temporary harm requiring intervention. Categories A-D involve no harm (from potential error to monitoring), while F-I escalate from hospitalization to death.',
          points: 2,
        },
        {
          id: 'pv-ed-01-03-q04',
        type: 'multiple-choice',
        options: [
          'EudraVigilance (EMA)',
          'FAERS (FDA Adverse Event Reporting System)',
          'VigiBase (WHO/UMC)',
          'Yellow Card Scheme (MHRA)',
        ],
        correctAnswer: 1,
          question: 'Which global spontaneous reporting system is operated by the FDA and contains over 20 million adverse event reports?',
          explanation: 'FAERS is the FDA\'s post-marketing safety surveillance database containing reports from healthcare professionals, consumers, and manufacturers. It is publicly accessible via openFDA and is one of the largest AE databases globally, critical for US signal detection activities.',
          points: 2,
        }
        ],
      },
},
    {
      id: 'pv-ed-01-03-a04',
      title: 'Reporting System Navigation Exercise',
      description: 'Reporting System Navigation Exercise',
      content: `## Reporting System Navigation Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-01-03-a05',
      title: 'Signal Detection Threshold Application',
      description: 'Signal Detection Threshold Application',
      content: `## Signal Detection Threshold Application\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
}
  ],
};
