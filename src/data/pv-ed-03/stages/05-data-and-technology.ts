/**
 * Stage: Data and Technology
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update content, then re-run forge_compile.
 */

import type { CapabilityStage } from '@/types/academy';

export const stage05: CapabilityStage = {
  id: 'pv-ed-03-05',
  title: 'Data and Technology',
  description: 'CPA-5 — Safety database management, data standards (E2B, MedDRA, WHODrug), and technology platforms for PV operations. Covers Competencies 7 (Data Management), 15 (Continuous Learning), and AI literacy mapped to EPAs 4 and 10.',
  lessons: [
    {
      id: 'pv-ed-03-05-a01',
      title: 'PV Data Standards: E2B(R3), MedDRA, and WHODrug',
      description: 'PV Data Standards: E2B(R3), MedDRA, and WHODrug',
      content: `## PV Data Standards: E2B(R3), MedDRA, and WHODrug\n\nTODO: Add content for this activity.`,
      estimatedDuration: 15,
},
    {
      id: 'pv-ed-03-05-a02',
      title: 'MedDRA Coding Hierarchy Navigation',
      description: 'MedDRA Coding Hierarchy Navigation',
      content: `## MedDRA Coding Hierarchy Navigation\n\nTODO: Add content for this activity.`,
      estimatedDuration: 20,
},
    {
      id: 'pv-ed-03-05-a03',
      title: 'Data and Technology Assessment',
      description: 'Data and Technology Assessment',
      content: '',
      estimatedDuration: 20,
      assessment: {
        type: 'quiz',
        passingScore: 80,
        questions: [
        {
          id: 'pv-ed-03-05-q01',
        type: 'multiple-choice',
        options: [
          'Five: SOC, HLGT, HLT, PT, LLT',
          'Three: SOC, PT, LLT',
          'Four: SOC, HLT, PT, LLT',
          'Six: SOC, HLGT, HLT, PT, LLT, Verbatim',
        ],
        correctAnswer: 0,
          question: 'MedDRA (Medical Dictionary for Regulatory Activities) is organized into how many hierarchical levels?',
          explanation: 'MedDRA has five hierarchical levels: System Organ Class (SOC) at the top, High Level Group Term (HLGT), High Level Term (HLT), Preferred Term (PT), and Lowest Level Term (LLT) for coding verbatim terms.',
          points: 2,
        },
        {
          id: 'pv-ed-03-05-q02',
        type: 'multiple-choice',
        options: [
          'XML based on the ICH ICSR specification with HL7 Individual Case Safety Report schema',
          'CSV flat files with fixed column headers',
          'JSON-LD with FHIR resource mapping',
          'PDF/A with embedded structured data',
        ],
        correctAnswer: 0,
          question: 'ICH E2B(R3) uses which data format for electronic transmission of ICSRs?',
          explanation: 'E2B(R3) defines an XML-based format using the HL7 ICSR standard for structured electronic transmission of ICSRs between regulatory authorities, MAHs, and WHO.',
          points: 2,
        },
        {
          id: 'pv-ed-03-05-q03',
        type: 'true-false',
        correctAnswer: 1 as 0 | 1,
          question: 'WHODrug Global is the international reference for identifying medicinal products in PV and uses the Anatomical Therapeutic Chemical (ATC) classification system.',
          explanation: 'WHODrug Global, maintained by the Uppsala Monitoring Centre (UMC), is the reference drug dictionary for pharmacovigilance. It uses the WHO ATC classification to categorize medicinal substances by therapeutic/pharmacological/chemical properties.',
          points: 1,
        }
        ],
      },
}
  ],
};
