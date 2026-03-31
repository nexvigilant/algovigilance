/**
 * Stage: Foundational Domains: PV Foundations, Clinical ADR Analysis & ADR Recognition
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage01: CapabilityStage = {
  id: 'pv-ed-01-01',
  title: 'Foundational Domains: PV Foundations, Clinical ADR Analysis & ADR Recognition',
  description: 'Assess and develop competency in Domains 1-3: understanding PV principles in the AI era, clinical analysis of adverse drug reactions, and systematic ADR recognition including AI-augmented approaches.',
  lessons: [
    {
      id: 'pv-ed-01-01-a01',
      title: 'PV Foundations Self-Assessment',
      description: 'PV Foundations Self-Assessment',
      content: `## PV Foundations Self-Assessment\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-01-01-a02',
      title: 'ADR Classification Interactive Exercise',
      description: 'ADR Classification Interactive Exercise',
      content: `## ADR Classification Interactive Exercise\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-01-01-a03',
      title: 'Foundational Domains Knowledge Check',
      description: 'Foundational Domains Knowledge Check',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 70,
        questions: [
        {
          id: 'pv-ed-01-01-q01',
        type: 'multiple-choice',
        options: [
          'A response to a drug which is noxious and unintended and which occurs at doses normally used in man',
          'Any unfavorable medical occurrence in a patient administered a pharmaceutical product',
          'All noxious and unintended responses to a medicinal product related to any dose',
          'A harmful and unintended response that requires dose modification or discontinuation',
        ],
        correctAnswer: 2,
          question: 'According to ICH E2A, which of the following best defines an adverse drug reaction (ADR) in the pre-approval clinical experience context?',
          explanation: 'ICH E2A defines an ADR in the pre-approval context as \'all noxious and unintended responses to a medicinal product related to any dose,\' which differs from the WHO definition used post-approval. This broader definition captures reactions at all dose levels including overdose.',
          points: 2,
        },
        {
          id: 'pv-ed-01-01-q02',
        type: 'true-false',
        correctAnswer: 0 as 0 | 1,
          question: 'In pharmacovigilance, the terms \'adverse event\' and \'adverse drug reaction\' are interchangeable because both describe drug-related harm.',
          explanation: 'An adverse event (AE) is any untoward medical occurrence associated with drug use but without necessarily having a causal relationship. An ADR implies at least a reasonable possibility of a causal relationship. All ADRs are AEs, but not all AEs are ADRs.',
          points: 1,
        },
        {
          id: 'pv-ed-01-01-q03',
        type: 'multiple-choice',
        options: [
          'Type A (Augmented)',
          'Type B (Bizarre)',
          'Type C (Chronic)',
          'Type D (Delayed)',
        ],
        correctAnswer: 0,
          question: 'Which Rawlins-Thompson classification type describes dose-dependent, pharmacologically predictable adverse reactions?',
          explanation: 'Type A reactions are augmented pharmacological effects that are dose-dependent and predictable from the drug\'s mechanism of action. They account for approximately 80% of all ADRs and are generally manageable with dose adjustment.',
          points: 2,
        },
        {
          id: 'pv-ed-01-01-q04',
        type: 'multiple-choice',
        options: [
          'Replacing human medical review of individual case safety reports',
          'Automating MedDRA coding and narrative extraction from unstructured text',
          'Eliminating the need for pharmacovigilance professionals in signal detection',
          'Generating regulatory submissions without human oversight',
        ],
        correctAnswer: 1,
          question: 'What is the primary role of AI/NLP tools in ADR recognition within the current PV landscape?',
          explanation: 'AI/NLP tools currently augment PV processes by automating extraction and coding tasks from unstructured text sources. They do not replace human medical review, which remains essential for clinical judgment, causality assessment, and regulatory decision-making.',
          points: 2,
        }
        ],
      },
},
    {
      id: 'pv-ed-01-01-a04',
      title: 'Competency Gap Mapping: Domains 1-3',
      description: 'Competency Gap Mapping: Domains 1-3',
      content: `## Competency Gap Mapping: Domains 1-3\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-01-01-a05',
      title: 'Development Level Self-Placement (L1-L5++)',
      description: 'Development Level Self-Placement (L1-L5++)',
      content: `## Development Level Self-Placement (L1-L5++)\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
}
  ],
};
