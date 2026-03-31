/**
 * Stage: PV Consulting Foundations
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage01: CapabilityStage = {
  id: 'pv-ed-08-01',
  title: 'PV Consulting Foundations',
  description: 'Learn the core models for pharmacovigilance consulting engagements: advisory, embedded, managed service, and hybrid delivery models. Identify key stakeholders, engagement lifecycles, and the relationship between education and consulting in the PV domain.',
  lessons: [
    {
      id: 'pv-ed-08-01-a01',
      title: 'Introduction to PV Consulting Models',
      description: 'Introduction to PV Consulting Models',
      content: `## Introduction to PV Consulting Models\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-08-01-a02',
      title: 'Client Engagement Lifecycle Explorer',
      description: 'Client Engagement Lifecycle Explorer',
      content: `## Client Engagement Lifecycle Explorer\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-08-01-a03',
      title: 'PV Consulting Foundations Assessment',
      description: 'PV Consulting Foundations Assessment',
      content: '',
      estimatedDuration: 15,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-08-01-q01',
        type: 'multiple-choice',
        options: [
          'To identify gaps between current organizational PV capabilities and regulatory requirements',
          'To sell the maximum number of training courses',
          'To conduct a full GVP inspection simulation',
          'To replace the client\'s existing QPPV',
        ],
        correctAnswer: 0,
          question: 'In a PV consulting engagement, what is the primary purpose of a needs analysis phase?',
          explanation: 'Needs analysis systematically identifies the gap between an organization\'s current PV capabilities and what is required by regulations, industry best practices, or strategic objectives. This gap analysis drives the entire consulting engagement scope.',
          points: 2,
        },
        {
          id: 'pv-ed-08-01-q02',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'A managed PV service model typically involves the consulting firm taking operational responsibility for defined pharmacovigilance activities on behalf of the client.',
          explanation: 'In a managed service model, the consulting provider assumes operational responsibility for specific PV activities (e.g., case processing, aggregate reporting, signal management) under a service-level agreement, while the MAH retains overall regulatory accountability.',
          points: 1,
        },
        {
          id: 'pv-ed-08-01-q03',
        type: 'multiple-choice',
        options: [
          'The Marketing Authorization Holder (MAH)',
          'The outsourced service provider',
          'The contract research organization',
          'The local safety officer at each affiliate',
        ],
        correctAnswer: 0,
          question: 'Which stakeholder typically holds ultimate regulatory accountability for pharmacovigilance activities regardless of outsourcing arrangements?',
          explanation: 'Under both EU GVP and FDA regulations, the Marketing Authorization Holder retains ultimate regulatory responsibility for all PV activities, even when operations are outsourced. This is a fundamental principle that shapes all consulting engagement structures.',
          points: 2,
        }
        ],
      },
}
  ],
};
