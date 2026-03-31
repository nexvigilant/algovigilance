/**
 * Pharmacovigilance Utility Types
 *
 * Types for PV calculations, E2B reporting, and regulatory compliance.
 * Extracted from OpenRIMS-PV and adapted for TypeScript.
 */

/**
 * ICH E2B-compliant age group classification
 * Based on ICH E2B(R3) D.2.2 guidance
 */
export type AgeGroup =
  | 'neonate'     // ≤ 1 month
  | 'infant'      // > 1 month and ≤ 4 years
  | 'child'       // > 4 years and ≤ 11 years
  | 'adolescent'  // > 11 years and ≤ 16 years
  | 'adult'       // > 16 years and ≤ 69 years
  | 'elderly';    // > 69 years

/**
 * Age group with human-readable labels for E2B reports
 */
export interface AgeGroupInfo {
  code: AgeGroup;
  label: string;
  e2bCode: string;  // ICH E2B D.2.2b coding
}

/**
 * Age group configuration with boundaries in months
 */
export interface AgeGroupBoundary {
  code: AgeGroup;
  label: string;
  e2bCode: string;
  minMonths: number;
  maxMonths: number | null;  // null = no upper bound
}

/**
 * Result of age group calculation
 */
export interface AgeGroupResult {
  ageGroup: AgeGroup;
  label: string;
  e2bCode: string;
  ageAtOnset: {
    years: number;
    months: number;
    days: number;
  };
  calculatedFrom: {
    dateOfBirth: Date;
    onsetDate: Date;
  };
}

/**
 * Seriousness criteria for adverse events
 * ICH E2B A.1.5.2
 */
export type SeriousnessCriterion =
  | 'death'
  | 'life_threatening'
  | 'hospitalization'
  | 'disability'
  | 'congenital_anomaly'
  | 'other_medically_important';

/**
 * Causality assessment methods
 */
export type CausalityMethod = 'naranjo' | 'who_umc';

/**
 * Naranjo scale causality categories
 */
export type NaranjoCausality =
  | 'definite'    // Score ≥ 9
  | 'probable'    // Score 5-8
  | 'possible'    // Score 1-4
  | 'doubtful';   // Score ≤ 0

/**
 * WHO-UMC causality categories
 */
export type WHOUMCCausality =
  | 'certain'
  | 'probable'
  | 'possible'
  | 'unlikely'
  | 'conditional'
  | 'unassessable';

/**
 * Drug characterization in ICSR
 * ICH E2B G.k.1
 */
export type DrugCharacterization =
  | 'suspect'
  | 'concomitant'
  | 'interacting';

/**
 * Reporter qualification
 * ICH E2B C.2.r.4
 */
export type ReporterQualification =
  | 'physician'
  | 'pharmacist'
  | 'other_health_professional'
  | 'lawyer'
  | 'consumer';
