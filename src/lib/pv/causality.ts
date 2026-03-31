/**
 * Causality Assessment Algorithms
 *
 * Implements standard causality assessment methods for determining
 * drug-event causal relationships in pharmacovigilance.
 *
 * Methods:
 * 1. Naranjo Algorithm (Adverse Drug Reaction Probability Scale)
 *    - 10 weighted questions, score range -4 to +13
 *    - Reference: Naranjo CA, et al. Clin Pharmacol Ther 1981;30:239-45
 *
 * 2. WHO-UMC System (Uppsala Monitoring Centre)
 *    - 6 causality categories based on qualitative criteria
 *    - Reference: The Uppsala Monitoring Centre causality assessment system
 *
 * Based on OpenRIMS-PV NaranjoScore/WHOCausality patterns.
 *
 * @module lib/pv/causality
 */

import type { NaranjoCausality, WHOUMCCausality } from './types';

// ============================================================================
// NARANJO ALGORITHM
// ============================================================================

/**
 * Answer type for Naranjo questions
 */
export type NaranjoAnswer = 'yes' | 'no' | 'unknown';

/**
 * Naranjo question structure
 */
export interface NaranjoQuestion {
  id: number;
  text: string;
  weights: {
    yes: number;
    no: number;
    unknown: number;
  };
}

/**
 * Naranjo assessment result
 */
export interface NaranjoAssessment {
  answers: NaranjoAnswer[];
  score: number;
  category: NaranjoCausality;
  assessedAt: Date;
  assessedBy?: string;
}

/**
 * The 10 Naranjo Algorithm questions with their weights
 */
export const NARANJO_QUESTIONS: NaranjoQuestion[] = [
  {
    id: 1,
    text: 'Are there previous conclusive reports on this reaction?',
    weights: { yes: 1, no: 0, unknown: 0 },
  },
  {
    id: 2,
    text: 'Did the adverse event appear after the suspected drug was given?',
    weights: { yes: 2, no: -1, unknown: 0 },
  },
  {
    id: 3,
    text: 'Did the adverse reaction improve when the drug was discontinued or a specific antagonist was given?',
    weights: { yes: 1, no: 0, unknown: 0 },
  },
  {
    id: 4,
    text: 'Did the adverse reaction reappear when the drug was readministered?',
    weights: { yes: 2, no: -1, unknown: 0 },
  },
  {
    id: 5,
    text: 'Are there alternative causes (other than the drug) that could on their own have caused the reaction?',
    weights: { yes: -1, no: 2, unknown: 0 },
  },
  {
    id: 6,
    text: 'Did the reaction reappear when a placebo was given?',
    weights: { yes: -1, no: 1, unknown: 0 },
  },
  {
    id: 7,
    text: 'Was the drug detected in the blood (or other fluids) in concentrations known to be toxic?',
    weights: { yes: 1, no: 0, unknown: 0 },
  },
  {
    id: 8,
    text: 'Was the reaction more severe when the dose was increased, or less severe when the dose was decreased?',
    weights: { yes: 1, no: 0, unknown: 0 },
  },
  {
    id: 9,
    text: 'Did the patient have a similar reaction to the same or similar drugs in any previous exposure?',
    weights: { yes: 1, no: 0, unknown: 0 },
  },
  {
    id: 10,
    text: 'Was the adverse event confirmed by any objective evidence?',
    weights: { yes: 1, no: 0, unknown: 0 },
  },
];

/**
 * Calculates the Naranjo score from answers
 * @param answers Array of 10 answers (yes/no/unknown)
 * @returns Total score (-4 to +13)
 */
export function calculateNaranjoScore(answers: NaranjoAnswer[]): number {
  let score = 0;

  for (let i = 0; i < Math.min(answers.length, NARANJO_QUESTIONS.length); i++) {
    const answer = answers[i];
    const question = NARANJO_QUESTIONS[i];
    score += question.weights[answer];
  }

  return score;
}

/**
 * Interprets a Naranjo score into a causality category
 * @param score The calculated score
 * @returns Causality category
 */
export function interpretNaranjoScore(score: number): NaranjoCausality {
  if (score >= 9) return 'definite';
  if (score >= 5) return 'probable';
  if (score >= 1) return 'possible';
  return 'doubtful';
}

/**
 * Creates a complete Naranjo assessment from answers
 * @param answers Array of 10 answers
 * @param assessedBy Optional assessor identifier
 * @returns Complete assessment object
 * @throws Error if answers array doesn't have 10 elements
 */
export function createNaranjoAssessment(
  answers: NaranjoAnswer[],
  assessedBy?: string
): NaranjoAssessment {
  if (answers.length !== 10) {
    throw new Error('10 answers required for Naranjo assessment');
  }

  const score = calculateNaranjoScore(answers);
  const category = interpretNaranjoScore(score);

  return {
    answers,
    score,
    category,
    assessedAt: new Date(),
    assessedBy,
  };
}

// ============================================================================
// WHO-UMC CAUSALITY SYSTEM
// ============================================================================

/**
 * WHO-UMC causality categories
 */
export const WHO_UMC_CATEGORIES = {
  certain: 'certain',
  probable: 'probable',
  possible: 'possible',
  unlikely: 'unlikely',
  conditional: 'conditional',
  unassessable: 'unassessable',
} as const;

/**
 * Criteria for WHO-UMC assessment
 */
export interface WHOUMCCriteria {
  /** Event occurred with plausible time relationship to drug */
  temporalRelationship?: boolean;
  /** Response to drug is clinically/pharmacologically plausible */
  plausibleMechanism?: boolean;
  /** Event improved on withdrawal (dechallenge) */
  responseToWithdrawal?: boolean;
  /** Event reappeared on re-exposure (rechallenge) */
  responseToRechallenge?: boolean;
  /** Alternative causes could explain the event */
  alternativeExplanation?: boolean;
  /** More data needed for proper assessment */
  additionalInformationNeeded?: boolean;
}

/**
 * WHO-UMC assessment result
 */
export interface WHOUMCAssessment {
  criteria: WHOUMCCriteria;
  category: WHOUMCCausality;
  rationale: string;
  assessedAt: Date;
  assessedBy?: string;
}

/**
 * WHO-UMC category descriptions
 */
const WHO_UMC_DESCRIPTIONS: Record<WHOUMCCausality, string> = {
  certain:
    'Event with plausible time relationship to drug administration, cannot be explained by disease or other drugs, response to withdrawal clinically plausible, event definitive pharmacologically or phenomenologically using satisfactory rechallenge procedure if necessary.',
  probable:
    'Event with reasonable time relationship to drug administration, unlikely to be attributed to disease or other drugs, response to withdrawal clinically reasonable, rechallenge not required.',
  possible:
    'Event with reasonable time relationship to drug administration, could also be explained by disease or other drugs, information on drug withdrawal may be lacking or unclear.',
  unlikely:
    'Event with temporal relationship to drug administration which makes a causal relationship improbable, disease or other drugs provide plausible explanations.',
  conditional:
    'Event reported but more data needed for proper assessment, additional data being examined.',
  unassessable:
    'Report suggesting an adverse reaction but cannot be judged because of insufficient or contradictory information, report cannot be supplemented or verified.',
};

/**
 * Assesses WHO-UMC causality based on criteria
 * @param criteria Assessment criteria
 * @returns Causality category
 */
export function assessWHOUMCCausality(criteria: WHOUMCCriteria): WHOUMCCausality {
  // Check if we need more data
  if (criteria.additionalInformationNeeded === true) {
    return 'conditional';
  }

  // Check if data is insufficient
  const definedCriteria = Object.values(criteria).filter((v) => v !== undefined);
  if (definedCriteria.length === 0) {
    return 'unassessable';
  }

  // CERTAIN: All criteria met including rechallenge
  if (
    criteria.temporalRelationship === true &&
    criteria.plausibleMechanism === true &&
    criteria.responseToWithdrawal === true &&
    criteria.responseToRechallenge === true &&
    criteria.alternativeExplanation === false
  ) {
    return 'certain';
  }

  // PROBABLE: Strong criteria but no rechallenge required
  if (
    criteria.temporalRelationship === true &&
    criteria.plausibleMechanism === true &&
    criteria.responseToWithdrawal === true &&
    criteria.alternativeExplanation === false
  ) {
    return 'probable';
  }

  // UNLIKELY: Temporal relationship improbable or alternative explanation
  if (
    criteria.temporalRelationship === false ||
    (criteria.alternativeExplanation === true && criteria.plausibleMechanism === false)
  ) {
    return 'unlikely';
  }

  // POSSIBLE: Reasonable relationship but could be other causes
  if (criteria.temporalRelationship === true || criteria.plausibleMechanism === true) {
    return 'possible';
  }

  return 'unassessable';
}

/**
 * Gets the description for a WHO-UMC category
 * @param category The causality category
 * @returns Description text
 */
export function getWHOUMCDescription(category: WHOUMCCausality): string {
  return WHO_UMC_DESCRIPTIONS[category];
}

// ============================================================================
// INTEGRATION UTILITIES
// ============================================================================

/**
 * Combined causality category (union of both systems)
 */
export type CausalityCategory = NaranjoCausality | WHOUMCCausality;

/**
 * Causality strength map (higher = stronger relationship)
 */
const CAUSALITY_STRENGTH: Record<CausalityCategory, number> = {
  // Naranjo
  definite: 4,
  probable: 3,
  possible: 2,
  doubtful: 1,
  // WHO-UMC
  certain: 4,
  unlikely: 1,
  conditional: 0,
  unassessable: 0,
};

/**
 * Gets the numeric strength of a causality category
 * @param category Any causality category
 * @returns Strength value (0-4)
 */
export function getCausalityStrength(category: CausalityCategory): number {
  return CAUSALITY_STRENGTH[category] ?? 0;
}

/**
 * Method comparison result
 */
export interface CausalityComparison {
  naranjo: NaranjoCausality;
  whoUmc: WHOUMCCausality;
  agreement: boolean;
  strengthDifference: number;
  overallStrength: number;
}

/**
 * Compares Naranjo and WHO-UMC assessments
 * @param naranjo Naranjo category
 * @param whoUmc WHO-UMC category
 * @returns Comparison result
 */
export function compareCausalityMethods(
  naranjo: NaranjoCausality,
  whoUmc: WHOUMCCausality
): CausalityComparison {
  const naranjoStrength = getCausalityStrength(naranjo);
  const whoUmcStrength = getCausalityStrength(whoUmc);

  const strengthDifference = Math.abs(naranjoStrength - whoUmcStrength);

  // Agreement if strength difference is 0 or 1
  const agreement = strengthDifference <= 1;

  // Conservative approach: use lower strength when methods disagree
  const overallStrength = Math.min(naranjoStrength, whoUmcStrength);

  return {
    naranjo,
    whoUmc,
    agreement,
    strengthDifference,
    overallStrength,
  };
}
