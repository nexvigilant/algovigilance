/**
 * Stage: Education-to-Consulting Integration
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage05: CapabilityStage = {
  id: 'pv-ed-08-05',
  title: 'Education-to-Consulting Integration',
  description: 'Analyze integration frameworks that bridge PV education and consulting: education-to-consulting transition models, knowledge-to-practice application methodologies, individual-to-organization scaling strategies, and local-to-global transformation pathways that extend learnings across multinational operations.',
  lessons: [
    {
      id: 'pv-ed-08-05-a01',
      title: 'Bridging Education and Consulting in PV',
      description: 'Bridging Education and Consulting in PV',
      content: `## Bridging Education and Consulting in PV\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-08-05-a02',
      title: 'Knowledge-to-Practice Translation Exercise',
      description: 'Knowledge-to-Practice Translation Exercise',
      content: `## Knowledge-to-Practice Translation Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-08-05-a03',
      title: 'Individual-to-Organization Scaling Case Study',
      description: 'Individual-to-Organization Scaling Case Study',
      content: `## Individual-to-Organization Scaling Case Study\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-08-05-a04',
      title: 'Integration Frameworks Assessment',
      description: 'Integration Frameworks Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-08-05-q01',
        type: 'multiple-choice',
        options: [
          'Level 3: Behavior (transfer of learning to job performance)',
          'Level 1: Reaction (learner satisfaction)',
          'Level 2: Learning (knowledge acquisition)',
          'Level 4: Results (organizational impact)',
        ],
        correctAnswer: 0,
          question: 'The Kirkpatrick model, adapted for PV education evaluation, measures training effectiveness at four levels. Which level assesses whether trained behaviors are applied in the workplace?',
          explanation: 'Kirkpatrick Level 3 (Behavior) measures the transfer of learning to workplace application. In PV, this means assessing whether trained individuals actually apply new signal management, case processing, or reporting skills in their daily work. This is the critical bridge between education and consulting impact.',
          points: 2,
        },
        {
          id: 'pv-ed-08-05-q02',
        type: 'multiple-select',
        options: [
          'Creating internal PV champion networks who mentor colleagues',
          'Embedding new competencies into SOPs and job descriptions',
          'Integrating competency metrics into performance review systems',
          'Relying solely on annual refresher training without process changes',
        ],
        correctAnswer: [0, 1, 2],
          question: 'When scaling a PV competency improvement from individual training to organizational capability, which strategies are effective? Select all that apply.',
          explanation: 'Organizational scaling requires structural reinforcement: champion networks provide peer support, SOP integration institutionalizes new practices, and performance metrics sustain accountability. Annual refresher training alone (without process integration) typically fails to sustain organizational change.',
          points: 3,
        },
        {
          id: 'pv-ed-08-05-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Local-to-global transformation in PV requires adapting a core competency framework to accommodate regional regulatory differences while maintaining consistent quality standards.',
          explanation: 'Global PV organizations must balance standardization (consistent quality, harmonized processes) with localization (regional regulatory compliance, local language requirements, jurisdiction-specific reporting). A core framework with regional adaptations is the standard approach for multinational PV operations.',
          points: 1,
        }
        ],
      },
}
  ],
};
