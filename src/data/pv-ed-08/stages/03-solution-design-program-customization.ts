/**
 * Stage: Solution Design & Program Customization
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage03: CapabilityStage = {
  id: 'pv-ed-08-03',
  title: 'Solution Design & Program Customization',
  description: 'Apply solution design principles to create tailored PV education programs: map competency gaps to learning interventions, integrate technology-enabled delivery (LMS, simulation, e-learning), incorporate change management strategies, and design blended programs that combine education with on-the-job coaching.',
  lessons: [
    {
      id: 'pv-ed-08-03-a01',
      title: 'Designing Tailored PV Education Solutions',
      description: 'Designing Tailored PV Education Solutions',
      content: `## Designing Tailored PV Education Solutions\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-08-03-a02',
      title: 'Technology-Enabled Learning Configuration',
      description: 'Technology-Enabled Learning Configuration',
      content: `## Technology-Enabled Learning Configuration\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-08-03-a03',
      title: 'Solution Design Assessment',
      description: 'Solution Design Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 75,
        questions: [
        {
          id: 'pv-ed-08-03-q01',
        type: 'multiple-choice',
        options: [
          'Target signal management competencies specifically, using the inspection findings to define learning objectives and practical exercises',
          'Provide a general PV overview course covering all topics equally',
          'Focus exclusively on case processing since it is the most common PV activity',
          'Delay training until after the next inspection to see if findings recur',
        ],
        correctAnswer: 0,
          question: 'When designing a PV education solution for a company that recently received inspection findings related to signal management, which approach is most effective?',
          explanation: 'Effective solution design is gap-driven. Inspection findings provide direct evidence of competency deficiencies. Targeted training that addresses the specific findings, with practical exercises mirroring the failed activities, delivers maximum impact and demonstrates CAPA effectiveness.',
          points: 2,
        },
        {
          id: 'pv-ed-08-03-q02',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Change management is an essential component of PV education solution design because training alone does not guarantee that new knowledge will be applied in daily practice.',
          explanation: 'The knowledge-to-practice gap is well-documented. Change management addresses organizational barriers to adoption: leadership support, process redesign, reinforcement mechanisms, and performance measurement. Without it, training investment often fails to translate into improved PV operations.',
          points: 1,
        },
        {
          id: 'pv-ed-08-03-q03',
        type: 'multiple-choice',
        options: [
          'E-learning delivers foundational knowledge efficiently while workshops develop practical application skills through case-based discussion',
          'E-learning is always cheaper than instructor-led training',
          'Workshops are unnecessary if e-learning assessments are comprehensive',
          'Blended programs are only effective for large organizations',
        ],
        correctAnswer: 0,
          question: 'In a blended PV learning program, what is the primary advantage of combining e-learning modules with instructor-led workshops?',
          explanation: 'Blended learning leverages the strengths of each modality: e-learning for self-paced knowledge acquisition (Remember/Understand in Bloom\'s taxonomy) and instructor-led sessions for higher-order skills (Apply/Analyze/Evaluate) requiring discussion, case work, and expert facilitation.',
          points: 2,
        }
        ],
      },
}
  ],
};
