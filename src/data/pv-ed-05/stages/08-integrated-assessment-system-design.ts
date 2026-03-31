/**
 * Stage: Integrated Assessment System Design
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage08: CapabilityStage = {
  id: 'pv-ed-05-08',
  title: 'Integrated Assessment System Design',
  description: 'Create a comprehensive, integrated assessment system for a PV education program that combines multi-method assessments, portfolio architecture across all levels, quality assurance mechanisms, digital technologies, and certification pathways into a coherent whole. Design assessment blueprints and programmatic assessment plans.',
  lessons: [
    {
      id: 'pv-ed-05-08-a01',
      title: 'Programmatic Assessment Principles',
      description: 'Programmatic Assessment Principles',
      content: `## Programmatic Assessment Principles\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-08-a02',
      title: 'Assessment Blueprint Design Workshop',
      description: 'Assessment Blueprint Design Workshop',
      content: `## Assessment Blueprint Design Workshop\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-05-08-a03',
      title: 'Designing a Competency Committee Review Process',
      description: 'Designing a Competency Committee Review Process',
      content: `## Designing a Competency Committee Review Process\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-05-08-a04',
      title: 'Integrated Assessment Case Study: Building a PV Training Program Assessment Plan',
      description: 'Integrated Assessment Case Study: Building a PV Training Program Assessment Plan',
      content: `## Integrated Assessment Case Study: Building a PV Training Program Assessment Plan\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-05-08-a05',
      title: 'Integrated Assessment System Design Assessment',
      description: 'Integrated Assessment System Design Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 85,
        questions: [
        {
          id: 'pv-ed-05-08-q01',
        type: 'multiple-choice',
        options: [
          'To make holistic entrustment and progression decisions by reviewing aggregated assessment data from multiple sources',
          'To write individual examination questions',
          'To grade individual assessments independently',
          'To observe every learner encounter directly',
        ],
        correctAnswer: 0,
          question: 'In programmatic assessment for PV education, what is the role of a competency committee?',
          explanation: 'Competency committees in programmatic assessment review aggregated data from multiple assessment methods (direct observations, work products, portfolios, exams) to make holistic decisions about learner progression and entrustment. They do not write items, grade individually, or observe directly.',
          points: 2,
        },
        {
          id: 'pv-ed-05-08-q02',
        type: 'multiple-choice',
        options: [
          'Competency standards, assessment methods, Bloom\'s taxonomy levels, and required evidence types',
          'Only topic areas and time allocations',
          'Only assessment methods and grading scales',
          'Only learning objectives and lecture schedules',
        ],
        correctAnswer: 0,
          question: 'An assessment blueprint for a PV signal detection module should map which elements together?',
          explanation: 'A comprehensive assessment blueprint maps competency standards (what to assess), assessment methods (how to assess), cognitive levels (Bloom\'s taxonomy), and required evidence types (what counts as evidence). This ensures alignment between learning objectives, instructional methods, and assessment strategies.',
          points: 2,
        },
        {
          id: 'pv-ed-05-08-q03',
        type: 'multiple-select',
        options: [
          'Multiple data points per competency from different assessment methods',
          'Longitudinal tracking of competency development over time',
          'Alignment between assessment and real-world PV practice requirements',
          'Reliance on a single high-stakes examination for all decisions',
        ],
        correctAnswer: [0, 1, 2],
          question: 'Which design principles are essential for an integrated PV assessment system? Select all that apply.',
          explanation: 'Integrated assessment systems require triangulation (multiple data points), longitudinal tracking (development over time), and authenticity (alignment with practice). Reliance on a single exam contradicts the principle of programmatic assessment, which aggregates evidence across methods and time.',
          points: 3,
        },
        {
          id: 'pv-ed-05-08-q04',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'In an integrated PV assessment system, formative assessments should feed forward into summative decisions by contributing data points to the competency committee\'s review.',
          explanation: 'In programmatic assessment, the distinction between formative and summative is not about individual assessments but about the stakes of decisions. Low-stakes formative assessments contribute data points that aggregate into high-stakes summative decisions by competency committees.',
          points: 1,
        }
        ],
      },
}
  ],
};
