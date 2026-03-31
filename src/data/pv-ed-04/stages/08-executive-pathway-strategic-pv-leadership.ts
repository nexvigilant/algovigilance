/**
 * Stage: Executive Pathway: Strategic PV Leadership
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage08: CapabilityStage = {
  id: 'pv-ed-04-08',
  title: 'Executive Pathway: Strategic PV Leadership',
  description: 'Executive development pathway for PV Managers (L4-L5), Directors (L5), and Executives (L5+). Covers strategic leadership: PV system design, global regulatory strategy, organizational capability building, AI governance, and cross-functional executive collaboration. Learning modalities: executive mentorship, strategic self-directed development, and leadership-focused experiential assignments. Target: L5+ strategic leadership competence.',
  lessons: [
    {
      id: 'pv-ed-04-08-a01',
      title: 'Executive PV Leadership: System Design and Global Strategy',
      description: 'Executive PV Leadership: System Design and Global Strategy',
      content: `## Executive PV Leadership: System Design and Global Strategy\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-04-08-a02',
      title: 'Organizational Capability Assessment and Gap Analysis',
      description: 'Organizational Capability Assessment and Gap Analysis',
      content: `## Organizational Capability Assessment and Gap Analysis\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-04-08-a03',
      title: 'Executive Decision Scenario: Post-Marketing Safety Crisis Management',
      description: 'Executive Decision Scenario: Post-Marketing Safety Crisis Management',
      content: `## Executive Decision Scenario: Post-Marketing Safety Crisis Management\n\nTODO: Add content for this activity.`,
      estimatedDuration: 25,
},
    {
      id: 'pv-ed-04-08-a04',
      title: 'Executive Pathway Assessment',
      description: 'Executive Pathway Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 85,
        questions: [
        {
          id: 'pv-ed-04-08-q01',
        type: 'multiple-choice',
        options: [
          'A single global pharmacovigilance system with a designated EU QPPV, US safety officer, and local qualified persons in each market, supported by a comprehensive PSMF',
          'Separate independent PV systems for each geographic market with no central coordination',
          'Outsourcing all PV activities to a single CRO with no internal oversight capability',
          'A PV system focused exclusively on the largest market by revenue',
        ],
        correctAnswer: 0,
          question: 'An executive-level PV leader designing a global PV system for a newly marketed product must ensure which structural requirement?',
          explanation: 'Global PV requires an integrated system meeting requirements across jurisdictions: EU QPPV (Directive 2001/83/EC), US safety officer (21 CFR 314.80), and local QPPVs/safety contacts as required by national regulations, unified through a global PSMF and consistent SOPs.',
          points: 2,
        },
        {
          id: 'pv-ed-04-08-q02',
        type: 'multiple-choice',
        options: [
          'Establishing a validation framework that ensures AI outputs meet regulatory accuracy requirements with documented human oversight protocols',
          'Deploying the most advanced available AI model as quickly as possible to reduce headcount',
          'Allowing each regional team to independently select and deploy their preferred AI tools',
          'Replacing the quality management system with AI-driven automated compliance',
        ],
        correctAnswer: 0,
          question: 'When implementing AI/ML tools in a global PV organization, which governance principle should an executive prioritize FIRST?',
          explanation: 'AI governance in PV must prioritize validation and human oversight. The EU AI Act, EMA, and FDA all require that AI tools used in safety contexts be validated for accuracy and maintain human oversight. Governance frameworks must be established before deployment.',
          points: 2,
        },
        {
          id: 'pv-ed-04-08-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'Executive PV leaders should ensure their organization maintains a succession plan that includes competency-mapped development pathways for all critical PV roles, not just the QPPV position.',
          explanation: 'Organizational resilience requires succession planning across all critical PV functions, not just the regulatory-mandated QPPV role. Competency-mapped pathways ensure continuity of expertise in signal management, risk evaluation, and all other CPAs.',
          points: 1,
        }
        ],
      },
}
  ],
};
