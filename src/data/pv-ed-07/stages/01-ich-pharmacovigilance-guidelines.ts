/**
 * Stage: ICH Pharmacovigilance Guidelines
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage01: CapabilityStage = {
  id: 'pv-ed-07-01',
  title: 'ICH Pharmacovigilance Guidelines',
  description: 'Learn the ICH E2 series guidelines that form the global foundation for pharmacovigilance practice: E2A (clinical safety reporting), E2B (ICSR data elements), E2C (periodic safety reports), E2D (post-approval safety reporting), E2E (pharmacovigilance planning), and E2F (DSUR).',
  lessons: [
    {
      id: 'pv-ed-07-01-a01',
      title: 'Introduction to the ICH E2 Series',
      description: 'Introduction to the ICH E2 Series',
      content: `## Introduction to the ICH E2 Series\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-07-01-a02',
      title: 'Mapping ICH Guidelines to PV Activities',
      description: 'Mapping ICH Guidelines to PV Activities',
      content: `## Mapping ICH Guidelines to PV Activities\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-07-01-a03',
      title: 'ICH Guidelines Assessment',
      description: 'ICH Guidelines Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-07-01-q01',
        type: 'multiple-choice',
        options: [
          'ICH E2B(R3)',
          'ICH E2A',
          'ICH E2C(R2)',
          'ICH E2D',
        ],
        correctAnswer: 0,
          question: 'Which ICH guideline establishes the data elements and message standards for Individual Case Safety Reports (ICSRs)?',
          explanation: 'ICH E2B(R3) defines the electronic data elements and messaging format for ICSRs, using the HL7/ISO 27953 standard for structured transmission between regulatory authorities and MAHs.',
          points: 2,
        },
        {
          id: 'pv-ed-07-01-q02',
        type: 'multiple-choice',
        options: [
          'Pharmacovigilance planning',
          'Expedited reporting of clinical trial adverse events',
          'Periodic Benefit-Risk Evaluation Reports',
          'Development Safety Update Reports',
        ],
        correctAnswer: 0,
          question: 'ICH E2E provides guidance on which pharmacovigilance activity?',
          explanation: 'ICH E2E covers pharmacovigilance planning, including the development of safety specifications and pharmacovigilance plans for the post-approval period. It was a precursor to the risk management planning framework.',
          points: 2,
        },
        {
          id: 'pv-ed-07-01-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'ICH E2F provides guidance on the Development Safety Update Report (DSUR), which summarizes safety information during the clinical development phase of a drug.',
          explanation: 'ICH E2F establishes the DSUR as an annual safety report for investigational products during clinical development, providing a comprehensive review of safety data to regulatory authorities and ethics committees.',
          points: 1,
        }
        ],
      },
}
  ],
};
