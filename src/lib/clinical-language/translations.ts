/**
 * Clinical Language Translations
 *
 * Maps PV/regulatory terminology to clinical language for each HCP domain.
 * These translations make the system feel familiar to pharmacists, nurses,
 * and physicians by using terms from their daily practice.
 */

import type { ClinicalDomain } from '@/types/clinical-pathways';

/**
 * Translation entry: PV term → domain-specific clinical language
 */
export interface TranslationEntry {
  /** Original PV/regulatory term (case-insensitive matching) */
  pvTerm: string;
  /** Translations by domain, with fallback to 'default' */
  translations: Partial<Record<ClinicalDomain | 'default', string>>;
}

/**
 * Core PV terminology translations
 *
 * Priority order for lookup:
 * 1. User's specific domain
 * 2. 'default' fallback
 * 3. Original term (if no translation found)
 */
export const CLINICAL_TRANSLATIONS: TranslationEntry[] = [
  // === CASE CONCEPTS ===
  {
    pvTerm: 'adverse event',
    translations: {
      pharmacist: 'unwanted drug reaction',
      nurse: 'medication side effect',
      physician: 'adverse drug reaction',
      qa_specialist: 'adverse event',
      default: 'unwanted effect from the medication',
    },
  },
  {
    pvTerm: 'adverse drug reaction',
    translations: {
      pharmacist: 'drug reaction',
      nurse: 'medication reaction',
      physician: 'ADR',
      default: 'drug reaction',
    },
  },
  {
    pvTerm: 'individual case safety report',
    translations: {
      pharmacist: 'drug reaction report',
      nurse: 'medication incident report',
      physician: 'adverse event report',
      default: 'safety report',
    },
  },
  {
    pvTerm: 'ICSR',
    translations: {
      pharmacist: 'drug reaction report',
      nurse: 'medication incident report',
      physician: 'AE report',
      default: 'safety report',
    },
  },

  // === ASSESSMENT TERMS ===
  {
    pvTerm: 'causality assessment',
    translations: {
      pharmacist: 'likelihood the drug caused this',
      nurse: 'whether the medication caused the reaction',
      physician: 'causal relationship determination',
      default: 'determining if the drug caused the problem',
    },
  },
  {
    pvTerm: 'seriousness criteria',
    translations: {
      pharmacist: 'how severe was the reaction',
      nurse: 'patient outcome severity',
      physician: 'clinical significance',
      default: 'how serious the event was',
    },
  },
  {
    pvTerm: 'expectedness',
    translations: {
      pharmacist: 'whether this reaction is in the drug labeling',
      nurse: 'if this is a known side effect',
      physician: 'labeled vs unlabeled reaction',
      default: 'whether this reaction was expected',
    },
  },
  {
    pvTerm: 'listedness',
    translations: {
      pharmacist: 'whether this is in the reference safety information',
      nurse: 'if this is a documented reaction',
      physician: 'RSI concordance',
      default: 'whether this reaction is documented',
    },
  },

  // === DRUG TERMS ===
  {
    pvTerm: 'suspect drug',
    translations: {
      pharmacist: 'the medication that may have caused this',
      nurse: 'the drug you think caused the reaction',
      physician: 'suspected causative agent',
      default: 'the medication that might have caused this',
    },
  },
  {
    pvTerm: 'concomitant medications',
    translations: {
      pharmacist: 'other medications the patient was taking',
      nurse: 'other meds on the MAR',
      physician: 'concurrent therapy',
      default: 'other medications being taken at the same time',
    },
  },
  {
    pvTerm: 'dechallenge',
    translations: {
      pharmacist: 'what happened when the drug was stopped',
      nurse: 'result of discontinuing the medication',
      physician: 'response to drug withdrawal',
      default: 'what happened when the medication was stopped',
    },
  },
  {
    pvTerm: 'rechallenge',
    translations: {
      pharmacist: 'what happened when the drug was restarted',
      nurse: 'result of re-administering the medication',
      physician: 'response to drug re-exposure',
      default: 'what happened when the medication was restarted',
    },
  },
  {
    pvTerm: 'indication',
    translations: {
      pharmacist: 'reason for prescribing',
      nurse: 'why the patient is on this medication',
      physician: 'therapeutic indication',
      default: 'why the medication was prescribed',
    },
  },

  // === TIMING TERMS ===
  {
    pvTerm: 'onset date',
    translations: {
      pharmacist: 'when symptoms first appeared',
      nurse: 'when you first noticed the reaction',
      physician: 'symptom onset',
      default: 'when the reaction started',
    },
  },
  {
    pvTerm: 'time to onset',
    translations: {
      pharmacist: 'how long after starting the drug',
      nurse: 'time from medication to reaction',
      physician: 'latency period',
      default: 'how long after taking the medication',
    },
  },
  {
    pvTerm: 'duration',
    translations: {
      pharmacist: 'how long the reaction lasted',
      nurse: 'length of the reaction',
      physician: 'reaction duration',
      default: 'how long it lasted',
    },
  },

  // === OUTCOME TERMS ===
  {
    pvTerm: 'outcome',
    translations: {
      pharmacist: 'how the patient is now',
      nurse: 'current patient status',
      physician: 'clinical outcome',
      default: 'what happened to the patient',
    },
  },
  {
    pvTerm: 'recovered',
    translations: {
      pharmacist: 'patient is back to normal',
      nurse: 'patient recovered fully',
      physician: 'complete resolution',
      default: 'fully recovered',
    },
  },
  {
    pvTerm: 'recovering',
    translations: {
      pharmacist: 'patient is getting better',
      nurse: 'patient improving',
      physician: 'ongoing resolution',
      default: 'still recovering',
    },
  },
  {
    pvTerm: 'not recovered',
    translations: {
      pharmacist: 'patient still has symptoms',
      nurse: 'symptoms persist',
      physician: 'unresolved',
      default: 'not yet recovered',
    },
  },
  {
    pvTerm: 'fatal',
    translations: {
      pharmacist: 'patient died',
      nurse: 'patient deceased',
      physician: 'death',
      default: 'patient died',
    },
  },
  {
    pvTerm: 'sequelae',
    translations: {
      pharmacist: 'lasting effects from the reaction',
      nurse: 'ongoing complications',
      physician: 'residual effects',
      default: 'lasting effects',
    },
  },

  // === SERIOUSNESS CRITERIA ===
  {
    pvTerm: 'serious adverse event',
    translations: {
      pharmacist: 'severe reaction requiring action',
      nurse: 'reaction needing immediate attention',
      physician: 'SAE',
      default: 'serious reaction',
    },
  },
  {
    pvTerm: 'hospitalization',
    translations: {
      pharmacist: 'patient needed to be admitted',
      nurse: 'required hospital admission',
      physician: 'inpatient admission required',
      default: 'needed hospital stay',
    },
  },
  {
    pvTerm: 'life-threatening',
    translations: {
      pharmacist: 'put the patient at immediate risk',
      nurse: 'patient was in danger',
      physician: 'acute life threat',
      default: 'life was at risk',
    },
  },
  {
    pvTerm: 'disability',
    translations: {
      pharmacist: 'caused lasting impairment',
      nurse: 'resulted in functional limitation',
      physician: 'persistent incapacity',
      default: 'caused lasting disability',
    },
  },
  {
    pvTerm: 'congenital anomaly',
    translations: {
      pharmacist: 'birth defect in baby',
      nurse: 'baby was affected',
      physician: 'fetal malformation',
      default: 'birth defect',
    },
  },
  {
    pvTerm: 'medically important',
    translations: {
      pharmacist: 'clinically significant event',
      nurse: 'important medical event',
      physician: 'other medically significant',
      default: 'medically important event',
    },
  },

  // === REPORTER TERMS ===
  {
    pvTerm: 'reporter',
    translations: {
      pharmacist: 'you (the person reporting)',
      nurse: 'you (the reporting nurse)',
      physician: 'reporting clinician',
      default: 'person reporting this',
    },
  },
  {
    pvTerm: 'healthcare professional',
    translations: {
      pharmacist: 'pharmacist, nurse, or doctor',
      nurse: 'medical professional',
      physician: 'HCP',
      default: 'healthcare worker',
    },
  },

  // === REGULATORY TERMS ===
  {
    pvTerm: 'expedited report',
    translations: {
      pharmacist: 'urgent report (15 days)',
      nurse: 'priority report',
      physician: '15-day expedited',
      default: 'urgent report',
    },
  },
  {
    pvTerm: 'follow-up',
    translations: {
      pharmacist: 'additional information for a previous report',
      nurse: 'update to earlier report',
      physician: 'supplemental information',
      default: 'update to previous report',
    },
  },
  {
    pvTerm: 'MedDRA',
    translations: {
      pharmacist: 'medical terminology dictionary',
      nurse: 'standard medical terms',
      physician: 'MedDRA coding',
      default: 'standardized medical terms',
    },
  },
  {
    pvTerm: 'E2B',
    translations: {
      pharmacist: 'electronic reporting format',
      nurse: 'standard report format',
      physician: 'ICH E2B format',
      default: 'electronic format',
    },
  },
];

/**
 * Build a lookup map for faster translation access
 */
export function buildTranslationMap(): Map<string, TranslationEntry> {
  const map = new Map<string, TranslationEntry>();
  for (const entry of CLINICAL_TRANSLATIONS) {
    map.set(entry.pvTerm.toLowerCase(), entry);
  }
  return map;
}

/**
 * Pre-built translation map for runtime use
 */
export const TRANSLATION_MAP = buildTranslationMap();
