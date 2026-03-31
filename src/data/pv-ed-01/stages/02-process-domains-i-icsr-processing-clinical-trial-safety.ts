/**
 * Stage: Process Domains I: ICSR Processing & Clinical Trial Safety
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage02: CapabilityStage = {
  id: 'pv-ed-01-02',
  title: 'Process Domains I: ICSR Processing & Clinical Trial Safety',
  description: 'Assess competency in Domains 4-5: ICSR lifecycle management from intake through submission, and clinical trial safety processes including SUSAR reporting and DSUR preparation.',
  lessons: [
    {
      id: 'pv-ed-01-02-a01',
      title: 'ICSR Processing Workflow Deep Dive',
      description: 'ICSR Processing Workflow Deep Dive',
      content: `## ICSR Processing Workflow Deep Dive\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-01-02-a02',
      title: 'Clinical Trial Safety Case Simulation',
      description: 'Clinical Trial Safety Case Simulation',
      content: `## Clinical Trial Safety Case Simulation\n\nTODO: Add content for this activity.`,
      estimatedDuration: 25,
},
    {
      id: 'pv-ed-01-02-a03',
      title: 'ICSR & Clinical Trial Safety Assessment',
      description: 'ICSR & Clinical Trial Safety Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 72,
        questions: [
        {
          id: 'pv-ed-01-02-q01',
        type: 'multiple-choice',
        options: [
          'Patient, reporter, suspect drug, adverse event/reaction',
          'Patient demographics, reporter credentials, drug batch number, MedDRA code',
          'Patient name, physician reporter, marketed drug, serious adverse event',
          'Patient age, healthcare professional reporter, approved drug, hospitalization',
        ],
        correctAnswer: 0,
          question: 'Under ICH E2B(R3), what are the four minimum criteria required for a valid Individual Case Safety Report (ICSR)?',
          explanation: 'The four minimum criteria for a valid ICSR are: an identifiable patient, an identifiable reporter, a suspect medicinal product, and an adverse event or reaction. These are internationally harmonized requirements under ICH E2B(R3) and apply regardless of seriousness or expectedness.',
          points: 2,
        },
        {
          id: 'pv-ed-01-02-q02',
        type: 'true-false',
        correctAnswer: 0 as 0 | 1,
          question: 'A Suspected Unexpected Serious Adverse Reaction (SUSAR) must be reported to regulatory authorities within 15 calendar days if fatal or life-threatening, and within 7 calendar days for all other serious cases.',
          explanation: 'The timeline is reversed: fatal or life-threatening SUSARs require initial reporting within 7 calendar days (with follow-up within 8 additional days), while all other serious SUSARs must be reported within 15 calendar days. These expedited timelines are defined in ICH E2A and regional regulations.',
          points: 1,
        },
        {
          id: 'pv-ed-01-02-q03',
        type: 'multiple-choice',
        options: [
          'Periodic Benefit-Risk Evaluation Report (PBRER)',
          'Development Safety Update Report (DSUR)',
          'Risk Management Plan (RMP)',
          'Investigator\'s Brochure (IB)',
        ],
        correctAnswer: 1,
          question: 'Which document provides a periodic comprehensive safety analysis of a drug\'s clinical trial data and is submitted annually to regulatory authorities?',
          explanation: 'The DSUR (ICH E2F) is an annual report that provides a comprehensive safety evaluation of a drug under clinical investigation. The PBRER is the post-marketing equivalent. The RMP describes risk minimization strategies, and the IB compiles clinical/non-clinical data for investigators.',
          points: 2,
        },
        {
          id: 'pv-ed-01-02-q04',
        type: 'multiple-choice',
        options: [
          'During initial triage before data entry',
          'After data entry during medical review and assessment',
          'Only at the time of regulatory submission',
          'During follow-up when additional information is received',
        ],
        correctAnswer: 1,
          question: 'When processing an ICSR, at what stage is MedDRA coding typically applied?',
          explanation: 'MedDRA coding of adverse events is performed after initial data entry, during the medical review and assessment phase. This ensures the verbatim terms from reporters are accurately mapped to standardized terminology at the appropriate level (PT, LLT) for consistent analysis and regulatory reporting.',
          points: 2,
        }
        ],
      },
},
    {
      id: 'pv-ed-01-02-a04',
      title: 'ICSR Data Quality Audit Exercise',
      description: 'ICSR Data Quality Audit Exercise',
      content: `## ICSR Data Quality Audit Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-01-02-a05',
      title: 'Behavioral Anchors: Process Compliance at Each Level',
      description: 'Behavioral Anchors: Process Compliance at Each Level',
      content: `## Behavioral Anchors: Process Compliance at Each Level\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
}
  ],
};
