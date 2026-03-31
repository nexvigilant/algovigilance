/**
 * Client-side causality assessment algorithms.
 *
 * Naranjo ADR Probability Scale and WHO-UMC causality system.
 * No server round-trip — scoring runs in the browser.
 *
 * Reference: Naranjo et al. (1981), WHO-UMC (2019)
 *
 * T1 primitives: κ(Comparison) + σ(Sequence) + →(Causality) + N(Quantity)
 */

// ── Naranjo Algorithm ─────────────────────────────────────────────────────────

export interface NaranjoResult {
  score: number;
  category: 'Definite' | 'Probable' | 'Possible' | 'Doubtful';
}

/**
 * Naranjo question weights: [Yes, No, Don't Know]
 * Per Naranjo CA, et al. Clin Pharmacol Ther. 1981;30(2):239-245.
 */
const NARANJO_WEIGHTS: [number, number, number][] = [
  [+1, 0, 0],   // Q1: Previous conclusive reports?
  [+2, -1, 0],  // Q2: Event appeared after suspected drug?
  [+1, 0, 0],   // Q3: Reaction improved on dechallenge?
  [+2, -1, 0],  // Q4: Reaction recurred on rechallenge?
  [-1, +2, 0],  // Q5: Alternative causes?
  [-1, +1, 0],  // Q6: Reaction on placebo?
  [+1, 0, 0],   // Q7: Drug detected in toxic concentration?
  [+1, 0, 0],   // Q8: Dose-response relationship?
  [+1, 0, 0],   // Q9: Similar reaction previously?
  [+1, 0, 0],   // Q10: Confirmed by objective evidence?
];

/**
 * Compute Naranjo score from 10 answers.
 * Each answer: +1 (Yes), -1 (No), 0 (Don't Know/N/A)
 *
 * Scoring:
 *   >= 9: Definite
 *   5-8: Probable
 *   1-4: Possible
 *   <= 0: Doubtful
 */
export function computeNaranjo(answers: number[]): NaranjoResult {
  if (answers.length !== 10) {
    throw new Error('Naranjo requires exactly 10 answers');
  }

  let score = 0;
  for (let i = 0; i < 10; i++) {
    const a = answers[i];
    const weights = NARANJO_WEIGHTS[i];
    if (a === 1) score += weights[0];       // Yes
    else if (a === -1) score += weights[1];  // No
    else score += weights[2];                // Don't Know
  }

  let category: NaranjoResult['category'];
  if (score >= 9) category = 'Definite';
  else if (score >= 5) category = 'Probable';
  else if (score >= 1) category = 'Possible';
  else category = 'Doubtful';

  return { score, category };
}

// ── WHO-UMC System ────────────────────────────────────────────────────────────

export type TemporalRelationship = 'reasonable' | 'possible' | 'unlikely' | 'unknown';
export type DechallengeResult = 'positive' | 'negative' | 'not_done' | 'unknown';
export type RechallengeResult = 'positive' | 'negative' | 'not_done' | 'unknown';
export type AlternativeCauses = 'unlikely' | 'possible' | 'probable' | 'unknown';

export interface WhoUmcInput {
  temporal: TemporalRelationship;
  dechallenge: DechallengeResult;
  rechallenge: RechallengeResult;
  alternatives: AlternativeCauses;
}

export interface WhoUmcResult {
  category: 'Certain' | 'Probable/Likely' | 'Possible' | 'Unlikely' | 'Conditional/Unclassified' | 'Unassessable/Unclassifiable';
  description: string;
}

/**
 * WHO-UMC causality classification.
 *
 * Categories per WHO-UMC system (2019):
 *   Certain: reasonable time, dechallenge+, rechallenge+, no alternatives
 *   Probable/Likely: reasonable time, dechallenge+, no alternatives
 *   Possible: reasonable time, could be alternatives
 *   Unlikely: improbable time, other explanations likely
 *   Conditional: data insufficient, further assessment needed
 *   Unassessable: contradictory or insufficient data
 */
export function computeWhoUmc(input: WhoUmcInput): WhoUmcResult {
  const { temporal, dechallenge, rechallenge, alternatives } = input;

  // Unassessable: too many unknowns
  if (temporal === 'unknown' && dechallenge === 'unknown' && alternatives === 'unknown') {
    return {
      category: 'Unassessable/Unclassifiable',
      description: 'Insufficient data to assess — report incomplete or contradictory',
    };
  }

  // Certain: all criteria met + positive rechallenge
  if (
    temporal === 'reasonable' &&
    dechallenge === 'positive' &&
    rechallenge === 'positive' &&
    alternatives === 'unlikely'
  ) {
    return {
      category: 'Certain',
      description: 'Reasonable temporal association, positive dechallenge and rechallenge, no plausible alternative explanation',
    };
  }

  // Probable/Likely: good temporal + dechallenge, no alternatives
  if (
    temporal === 'reasonable' &&
    dechallenge === 'positive' &&
    alternatives === 'unlikely'
  ) {
    return {
      category: 'Probable/Likely',
      description: 'Reasonable temporal association, clinically reasonable response to withdrawal, no plausible alternatives',
    };
  }

  // Unlikely: temporal relationship makes causal link improbable
  if (temporal === 'unlikely' || alternatives === 'probable') {
    return {
      category: 'Unlikely',
      description: 'Improbable temporal relationship or more likely alternative cause identified',
    };
  }

  // Conditional: data pending
  if (temporal === 'unknown' || (dechallenge === 'unknown' && rechallenge === 'unknown')) {
    return {
      category: 'Conditional/Unclassified',
      description: 'Assessment pending further information — temporal relationship or clinical data incomplete',
    };
  }

  // Possible: reasonable time but alternatives exist or dechallenge unclear
  return {
    category: 'Possible',
    description: 'Reasonable temporal association, but alternative explanations exist or withdrawal information is lacking',
  };
}
