/**
 * Stage: Assessment Quality Assurance
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage05: CapabilityStage = {
  id: 'pv-ed-05-05',
  title: 'Assessment Quality Assurance',
  description: 'Analyze the four pillars of assessment quality in PV education: Validity (does the assessment measure what it claims?), Reliability (inter-rater reliability >0.80), Authenticity (does it reflect real PV practice?), and Fairness (is it equitable across diverse learner populations?). Apply quality frameworks to evaluate assessment instruments.',
  lessons: [
    {
      id: 'pv-ed-05-05-a01',
      title: 'Validity Frameworks for PV Assessment',
      description: 'Validity Frameworks for PV Assessment',
      content: `## Validity Frameworks for PV Assessment\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-05-a02',
      title: 'Inter-Rater Reliability in Competency Assessment',
      description: 'Inter-Rater Reliability in Competency Assessment',
      content: `## Inter-Rater Reliability in Competency Assessment\n\nTODO: Add content for this activity.`,
      estimatedDuration: 12,
},
    {
      id: 'pv-ed-05-05-a03',
      title: 'Reliability Calibration Exercise',
      description: 'Reliability Calibration Exercise',
      content: `## Reliability Calibration Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-05-a04',
      title: 'Authenticity and Fairness in Assessment',
      description: 'Authenticity and Fairness in Assessment',
      content: `## Authenticity and Fairness in Assessment\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-05-a05',
      title: 'Assessment Quality Assurance Assessment',
      description: 'Assessment Quality Assurance Assessment',
      content: '',
      estimatedDuration: 18,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-05-05-q01',
        type: 'multiple-choice',
        options: [
          'Authenticity — the assessment reflects real professional practice conditions',
          'Reliability — the assessment produces consistent scores across raters',
          'Fairness — the assessment is equitable for all learners',
          'Feasibility — the assessment is practical to administer',
        ],
        correctAnswer: 0,
          question: 'An assessment requires PV trainees to process simulated ICSRs that closely mirror real-world cases, using actual safety database interfaces. Which quality criterion does this primarily address?',
          explanation: 'Authenticity ensures assessments reflect real professional practice. Using realistic ICSRs with actual database interfaces creates authentic assessment conditions that mirror what PV professionals encounter in practice.',
          points: 2,
        },
        {
          id: 'pv-ed-05-05-q02',
        type: 'multiple-choice',
        options: [
          '0.80 (Cohen\'s kappa or ICC)',
          '0.50',
          '0.60',
          '0.95',
        ],
        correctAnswer: 0,
          question: 'What is the minimum acceptable inter-rater reliability coefficient for high-stakes PV competency assessments?',
          explanation: 'An inter-rater reliability coefficient of 0.80 or above (measured by Cohen\'s kappa or intraclass correlation coefficient) is the established threshold for high-stakes competency assessments. Below 0.80 indicates unacceptable variability between assessors.',
          points: 2,
        },
        {
          id: 'pv-ed-05-05-q03',
        type: 'multiple-choice',
        options: [
          'Demonstration that experienced PV scientists score significantly higher than novice trainees',
          'High internal consistency (Cronbach\'s alpha) among test items',
          'A large number of test items',
          'Administration in a standardized testing center',
        ],
        correctAnswer: 0,
          question: 'Construct validity evidence for a PV signal detection assessment would include which of the following?',
          explanation: 'Construct validity evidence includes known-groups validation — demonstrating that the assessment discriminates between groups expected to differ (experts vs. novices). Internal consistency relates to reliability, not validity. Item count and testing location are administrative considerations.',
          points: 2,
        },
        {
          id: 'pv-ed-05-05-q04',
        type: 'true-false',
        correctAnswer: 0 as 0 | 1,
          question: 'Assessment fairness in PV education requires that assessments use only English-language materials, since English is the regulatory standard for ICH submissions.',
          explanation: 'While English is used for ICH submissions, assessment fairness requires accommodating linguistic and cultural diversity. Many PV professionals work with local-language reporting and national regulatory authorities. Fair assessments consider language accommodations, cultural context, and diverse regulatory environments.',
          points: 1,
        }
        ],
      },
}
  ],
};
