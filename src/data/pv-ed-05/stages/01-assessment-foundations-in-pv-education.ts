/**
 * Stage: Assessment Foundations in PV Education
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage01: CapabilityStage = {
  id: 'pv-ed-05-01',
  title: 'Assessment Foundations in PV Education',
  description: 'Understand the core principles of competency assessment in pharmacovigilance education, including the distinction between formative and summative assessment, criterion-referenced vs. norm-referenced approaches, and the role of assessment in competency-based PV training programs.',
  lessons: [
    {
      id: 'pv-ed-05-01-a01',
      title: 'Assessment Paradigms in Health Professions Education',
      description: 'Assessment Paradigms in Health Professions Education',
      content: `## Assessment Paradigms in Health Professions Education\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-01-a02',
      title: 'Formative vs. Summative Assessment Explorer',
      description: 'Formative vs. Summative Assessment Explorer',
      content: `## Formative vs. Summative Assessment Explorer\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'pv-ed-05-01-a03',
      title: 'Miller\'s Pyramid of Clinical Competence',
      description: 'Miller\'s Pyramid of Clinical Competence',
      content: `## Miller's Pyramid of Clinical Competence\n\nTODO: Add content for this activity.`,
      estimatedDuration: 10,
},
    {
      id: 'pv-ed-05-01-a04',
      title: 'Assessment Foundations Assessment',
      description: 'Assessment Foundations Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-05-01-q01',
        type: 'multiple-choice',
        options: [
          'Does (Action)',
          'Shows How (Performance)',
          'Knows How (Competence)',
          'Knows (Knowledge)',
        ],
        correctAnswer: 0,
          question: 'In Miller\'s Pyramid of Clinical Competence, which level represents the ability to actually perform a task in real practice, such as conducting a causality assessment on a live ICSR?',
          explanation: 'The \'Does\' level at the top of Miller\'s Pyramid represents actual performance in clinical/professional practice. In PV, this means independently performing causality assessments, signal evaluations, or ICSR processing in real work settings, not simulations.',
          points: 2,
        },
        {
          id: 'pv-ed-05-01-q02',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Criterion-referenced assessment compares a learner\'s PV competency against a fixed standard (e.g., ICH E2B compliance criteria), while norm-referenced assessment ranks learners against each other.',
          explanation: 'Criterion-referenced assessment measures against fixed criteria (e.g., can the learner correctly complete an E2B(R3) ICSR within regulatory timelines?). Norm-referenced assessment ranks learners relative to peers. Competency-based PV education predominantly uses criterion-referenced approaches.',
          points: 1,
        },
        {
          id: 'pv-ed-05-01-q03',
        type: 'multiple-choice',
        options: [
          'Workplace-based assessment with direct observation and entrustment decisions',
          'Written multiple-choice examinations only',
          'Annual performance reviews by supervisors',
          'Self-assessment questionnaires',
        ],
        correctAnswer: 0,
          question: 'Which assessment approach is most aligned with the EPA (Entrustable Professional Activity) framework used in health professions education?',
          explanation: 'EPAs require workplace-based assessment where supervisors directly observe learners performing professional activities and make entrustment decisions (from close supervision to unsupervised practice). This is central to competency-based education in PV.',
          points: 2,
        }
        ],
      },
}
  ],
};
