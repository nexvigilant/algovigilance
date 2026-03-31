/**
 * Stage: Accreditation Program Design
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage04: CapabilityStage = {
  id: 'pv-ed-07-04',
  title: 'Accreditation Program Design',
  description: 'Apply accreditation principles to pharmacovigilance education: program-level certification vs. individual professional certification, ISO 17024 (conformity assessment for personnel certification), ISO 9001 quality management integration, and continuous compliance monitoring through systematic review cycles.',
  lessons: [
    {
      id: 'pv-ed-07-04-a01',
      title: 'Certification and Accreditation Frameworks',
      description: 'Certification and Accreditation Frameworks',
      content: `## Certification and Accreditation Frameworks\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-07-04-a02',
      title: 'Designing a PV Professional Certification Program',
      description: 'Designing a PV Professional Certification Program',
      content: `## Designing a PV Professional Certification Program\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-07-04-a03',
      title: 'ISO Integration for PV Education Programs',
      description: 'ISO Integration for PV Education Programs',
      content: `## ISO Integration for PV Education Programs\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-07-04-a04',
      title: 'Accreditation Design Assessment',
      description: 'Accreditation Design Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'pv-ed-07-04-q01',
        type: 'multiple-choice',
        options: [
          'Bodies operating certification of persons',
          'Laboratories performing calibration and testing',
          'Organizations providing management system audits',
          'Companies manufacturing pharmaceutical products',
        ],
        correctAnswer: 0,
          question: 'ISO/IEC 17024 provides requirements for which type of accreditation?',
          explanation: 'ISO/IEC 17024 specifies requirements for bodies that certify persons against specific requirements, including examination development, assessment processes, and certification maintenance. It is the standard for professional certification bodies.',
          points: 2,
        },
        {
          id: 'pv-ed-07-04-q02',
        type: 'multiple-choice',
        options: [
          'Program certification validates the educational offering itself; individual certification validates a person\'s competencies',
          'Program certification is always more rigorous than individual certification',
          'Individual certification does not require ongoing maintenance',
          'Program certification is only needed for academic institutions',
        ],
        correctAnswer: 0,
          question: 'In accreditation program design, what distinguishes program-level certification from individual professional certification?',
          explanation: 'Program certification evaluates whether an educational program meets defined quality standards and learning outcomes. Individual certification assesses whether a person possesses required knowledge, skills, and competencies. Both serve distinct but complementary purposes.',
          points: 2,
        },
        {
          id: 'pv-ed-07-04-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Maintaining professional PV certification typically requires documented continuing professional development (CPD) activities to ensure competencies remain current.',
          explanation: 'Most professional certification schemes require ongoing CPD to maintain certification. This is essential in pharmacovigilance where regulatory requirements, scientific knowledge, and best practices evolve continuously.',
          points: 1,
        }
        ],
      },
}
  ],
};
