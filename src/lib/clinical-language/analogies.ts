/**
 * Clinical Analogies
 *
 * Maps PV concepts to familiar clinical workflows for each HCP domain.
 * These analogies help users understand unfamiliar PV processes by
 * connecting them to activities they perform daily.
 */

import type { ClinicalDomain } from '@/types/clinical-pathways';

/**
 * Analogy entry: PV concept → domain-specific clinical analogy
 */
export interface AnalogyEntry {
  /** Concept identifier (used in pathway states) */
  conceptId: string;
  /** Display name for the concept */
  conceptName: string;
  /** Analogies by domain */
  analogies: Partial<Record<ClinicalDomain | 'default', string>>;
}

/**
 * Clinical analogies for PV workflows
 *
 * Each analogy connects a PV task to a familiar clinical activity,
 * making the process feel intuitive rather than bureaucratic.
 */
export const CLINICAL_ANALOGIES: AnalogyEntry[] = [
  // === WORKFLOW ANALOGIES ===
  {
    conceptId: 'case_triage',
    conceptName: 'Initial Case Assessment',
    analogies: {
      pharmacist: 'Like checking a prescription for DUR flags - you\'re identifying what needs attention.',
      nurse: 'Like triaging a patient in the ED - quickly determining priority and next steps.',
      physician: 'Like your initial differential diagnosis - gathering key facts to guide your assessment.',
      qa_specialist: 'Like initial QC screening - checking for completeness and obvious issues.',
      default: 'Like sorting cases by urgency and importance.',
    },
  },
  {
    conceptId: 'seriousness_assessment',
    conceptName: 'Determining Seriousness',
    analogies: {
      pharmacist: 'Like deciding if you need to call the prescriber about an interaction - how urgent is this?',
      nurse: 'Like deciding if a patient needs immediate intervention vs. monitoring.',
      physician: 'Like determining admission criteria - does this patient need a higher level of care?',
      qa_specialist: 'Like severity classification in your QC workflows.',
      default: 'Like deciding how urgently this needs attention.',
    },
  },
  {
    conceptId: 'causality_assessment',
    conceptName: 'Causality Determination',
    analogies: {
      pharmacist: 'Like evaluating a drug interaction probability - certain, probable, possible, or unlikely?',
      nurse: 'Like assessing if a PRN medication worked - did the intervention cause the change?',
      physician: 'Like establishing differential probability - how likely is this the cause vs. alternatives?',
      qa_specialist: 'Like root cause analysis - establishing the chain of events.',
      default: 'Like determining if the medication was responsible for what happened.',
    },
  },
  {
    conceptId: 'drug_identification',
    conceptName: 'Suspect Drug Selection',
    analogies: {
      pharmacist: 'Like identifying which medication triggered a DUR alert in a poly-pharmacy patient.',
      nurse: 'Like identifying which medication on the MAR might have caused a reaction.',
      physician: 'Like identifying the most likely causative agent among multiple therapies.',
      default: 'Like figuring out which medication is most likely responsible.',
    },
  },
  {
    conceptId: 'patient_information',
    conceptName: 'Patient Details Collection',
    analogies: {
      pharmacist: 'Like the patient profile you review before dispensing - key demographics and history.',
      nurse: 'Like the admission assessment you do - gathering essential patient information.',
      physician: 'Like the HPI and PMH you document - relevant background for the case.',
      default: 'Like collecting the basic patient information you need to understand the case.',
    },
  },
  {
    conceptId: 'event_description',
    conceptName: 'Describing What Happened',
    analogies: {
      pharmacist: 'Like documenting a clinical intervention - what happened, when, and what you observed.',
      nurse: 'Like writing a nursing note about an incident - clear, factual, chronological.',
      physician: 'Like dictating the history of present illness - the story of what happened.',
      default: 'Like writing a clear description of the event for the medical record.',
    },
  },
  {
    conceptId: 'outcome_determination',
    conceptName: 'Patient Outcome',
    analogies: {
      pharmacist: 'Like follow-up on a reported ADR - did the patient recover when the drug was stopped?',
      nurse: 'Like documenting patient status at shift change - where are they now?',
      physician: 'Like documenting clinical course and disposition.',
      default: 'Like describing how the patient is doing now.',
    },
  },
  {
    conceptId: 'dechallenge_assessment',
    conceptName: 'Response to Drug Discontinuation',
    analogies: {
      pharmacist: 'Like evaluating if symptoms improved after stopping a medication - the gold standard.',
      nurse: 'Like observing if a reaction resolved after holding a dose.',
      physician: 'Like assessing response to withdrawal of therapy.',
      default: 'Like seeing if the problem went away when the medication was stopped.',
    },
  },
  {
    conceptId: 'rechallenge_assessment',
    conceptName: 'Response to Drug Re-exposure',
    analogies: {
      pharmacist: 'Like what happens if the patient takes the medication again - did the reaction recur?',
      nurse: 'Like observing if a reaction returns when medication is restarted.',
      physician: 'Like provocative re-exposure - the most definitive evidence.',
      default: 'Like seeing if the problem came back when the medication was restarted.',
    },
  },

  // === DOCUMENTATION ANALOGIES ===
  {
    conceptId: 'case_narrative',
    conceptName: 'Writing the Case Summary',
    analogies: {
      pharmacist: 'Like writing a clinical note for your records - clear, concise, factual.',
      nurse: 'Like writing an incident report - what happened, in what order, what was done.',
      physician: 'Like dictating a discharge summary - the full picture in a structured format.',
      default: 'Like writing a clear summary of everything that happened.',
    },
  },
  {
    conceptId: 'follow_up_information',
    conceptName: 'Adding More Information',
    analogies: {
      pharmacist: 'Like updating a patient profile when you get new information.',
      nurse: 'Like adding an addendum to your notes when you learn something new.',
      physician: 'Like supplementing a report with additional findings.',
      default: 'Like adding new information to an existing record.',
    },
  },

  // === QUALITY ANALOGIES ===
  {
    conceptId: 'completeness_check',
    conceptName: 'Checking for Complete Information',
    analogies: {
      pharmacist: 'Like verifying a prescription has all required elements before dispensing.',
      nurse: 'Like ensuring all required assessments are documented before shift change.',
      physician: 'Like ensuring documentation supports the level of care billed.',
      qa_specialist: 'Like your standard QC checklist review.',
      default: 'Like making sure you have all the information needed.',
    },
  },
  {
    conceptId: 'data_quality',
    conceptName: 'Ensuring Accuracy',
    analogies: {
      pharmacist: 'Like double-checking drug names and doses before dispensing.',
      nurse: 'Like verifying patient ID before medication administration.',
      physician: 'Like confirming findings before signing off on results.',
      qa_specialist: 'Like your data integrity verification procedures.',
      default: 'Like double-checking that the information is accurate.',
    },
  },
];

/**
 * Build a lookup map for faster analogy access
 */
export function buildAnalogyMap(): Map<string, AnalogyEntry> {
  const map = new Map<string, AnalogyEntry>();
  for (const entry of CLINICAL_ANALOGIES) {
    map.set(entry.conceptId, entry);
  }
  return map;
}

/**
 * Pre-built analogy map for runtime use
 */
export const ANALOGY_MAP = buildAnalogyMap();
