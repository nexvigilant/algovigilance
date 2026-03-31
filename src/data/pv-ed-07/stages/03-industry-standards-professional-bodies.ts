/**
 * Stage: Industry Standards & Professional Bodies
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage03: CapabilityStage = {
  id: 'pv-ed-07-03',
  title: 'Industry Standards & Professional Bodies',
  description: 'Apply industry standards from key professional organizations: DIA (Drug Information Association) training and competency frameworks, ISPE (International Society for Pharmaceutical Engineering) quality guidelines, and PIPA (Pharmaceutical Information and Pharmacovigilance Association) best practices for PV professionals.',
  lessons: [
    {
      id: 'pv-ed-07-03-a01',
      title: 'Professional Organizations in Pharmacovigilance',
      description: 'Professional Organizations in Pharmacovigilance',
      content: `## Professional Organizations in Pharmacovigilance\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-07-03-a02',
      title: 'Aligning Organizational Practices with Industry Standards',
      description: 'Aligning Organizational Practices with Industry Standards',
      content: `## Aligning Organizational Practices with Industry Standards\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-07-03-a03',
      title: 'Industry Standards Assessment',
      description: 'Industry Standards Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'pv-ed-07-03-q01',
        type: 'multiple-choice',
        options: [
          'Providing training programs, conferences, and competency frameworks for PV professionals',
          'Issuing legally binding regulatory guidance for drug safety',
          'Conducting GMP inspections of pharmaceutical manufacturing sites',
          'Publishing mandatory reporting standards for clinical trial adverse events',
        ],
        correctAnswer: 0,
          question: 'The Drug Information Association (DIA) contributes to pharmacovigilance education primarily through which mechanism?',
          explanation: 'DIA is a professional association that contributes through training, conferences, publications, and competency development for drug safety professionals. It does not have regulatory authority to issue binding guidance or conduct inspections.',
          points: 2,
        },
        {
          id: 'pv-ed-07-03-q02',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'PIPA (Pharmaceutical Information and Pharmacovigilance Association) specifically focuses on the intersection of medical information and drug safety, promoting best practices for pharmacovigilance professionals in industry.',
          explanation: 'PIPA is a UK-based professional body that focuses on medical information and pharmacovigilance practice within the pharmaceutical industry. It provides training, networking, and best practice guidance for PV and MI professionals.',
          points: 1,
        },
        {
          id: 'pv-ed-07-03-q03',
        type: 'multiple-choice',
        options: [
          'Map competencies to ICH guidelines and validate against multiple regional requirements',
          'Design exclusively to FDA requirements as the most stringent',
          'Use only EMA GVP modules as the training framework',
          'Focus solely on PMDA requirements for the most conservative approach',
        ],
        correctAnswer: 0,
          question: 'When designing a PV training program aligned with industry standards, which approach best ensures global portability of competencies?',
          explanation: 'Global portability requires mapping to the internationally harmonized ICH framework, then validating against multiple regional requirements. Single-region focus creates competency gaps when professionals work across jurisdictions.',
          points: 2,
        }
        ],
      },
}
  ],
};
