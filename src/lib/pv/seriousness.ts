/**
 * ICH E2B Seriousness Criteria Utility
 *
 * Classifies adverse event seriousness and generates E2B field values.
 * Based on ICH E2B(R3) A.1.5.2 and OpenRIMS-PV implementation.
 *
 * @module lib/pv/seriousness
 * @see https://www.ich.org/page/efficacy-guidelines (E2B)
 */

import type { SeriousnessCriterion } from './types';

/**
 * Seriousness criterion definition with E2B mappings
 */
export interface SeriousnessCriterionInfo {
  code: SeriousnessCriterion;
  label: string;
  e2bField: string;      // ICH E2B(R3) field reference
  e2bElementGuid: string; // OpenRIMS DatasetElement GUID
  description: string;
}

/**
 * E2B seriousness field values for ICSR generation
 * Maps to ICH E2B(R3) A.1.5.2a-f fields
 */
export interface SeriousnessE2BFields {
  /** A.1.5.2a - Results in Death */
  seriousnessResultInDeath: '1=Yes' | '2=No';
  /** A.1.5.2b - Life Threatening */
  seriousnessLifeThreatening: '1=Yes' | '2=No';
  /** A.1.5.2c - Hospitalization */
  seriousnessHospitalization: '1=Yes' | '2=No';
  /** A.1.5.2d - Disabling/Incapacitating */
  seriousnessDisabling: '1=Yes' | '2=No';
  /** A.1.5.2e - Congenital Anomaly */
  seriousnessCongenitalAnomaly: '1=Yes' | '2=No';
  /** A.1.5.2f - Other Medically Important */
  seriousnessOther: '1=Yes' | '2=No';
  /** A.1.5.1 - Serious (1=Yes, 2=No) */
  serious: '1' | '2';
}

/**
 * Result of seriousness classification
 */
export interface SeriousnessClassification {
  isSerious: boolean;
  criteria: SeriousnessCriterion[];
  e2bSeriousCode: '1' | '2';
  primaryCriterion?: SeriousnessCriterion;
}

/**
 * ICH E2B seriousness criteria definitions
 * GUIDs from OpenRIMS-PV DatasetElement mappings
 */
export const SERIOUSNESS_CRITERIA: readonly SeriousnessCriterionInfo[] = [
  {
    code: 'death',
    label: 'Resulted in death',
    e2bField: 'A.1.5.2a',
    e2bElementGuid: 'B4EA6CBF-2D9C-482D-918A-36ABB0C96EFA',
    description: 'The adverse event resulted in the death of the patient',
  },
  {
    code: 'life_threatening',
    label: 'Is life-threatening',
    e2bField: 'A.1.5.2b',
    e2bElementGuid: '26C6F08E-B80B-411E-BFDC-0506FE102253',
    description: 'The patient was at substantial risk of dying at the time of the event',
  },
  {
    code: 'hospitalization',
    label: 'Requires hospitalization or longer stay in hospital',
    e2bField: 'A.1.5.2c',
    e2bElementGuid: '837154A9-D088-41C6-A9E2-8A0231128496',
    description: 'Inpatient hospitalization or prolongation of existing hospitalization',
  },
  {
    code: 'disability',
    label: 'Results in persistent or significant disability/incapacity',
    e2bField: 'A.1.5.2d',
    e2bElementGuid: 'DDEBDEC0-2A90-49C7-970E-B7855CFDF19D',
    description: 'Substantial disruption of ability to conduct normal life functions',
  },
  {
    code: 'congenital_anomaly',
    label: 'Is a congenital anomaly/birth defect',
    e2bField: 'A.1.5.2e',
    e2bElementGuid: 'DF89C98B-1D2A-4C8E-A753-02E265841F4F',
    description: 'Congenital anomaly or birth defect in offspring',
  },
  {
    code: 'other_medically_important',
    label: 'Other medically important condition',
    e2bField: 'A.1.5.2f',
    e2bElementGuid: '33A75547-EF1B-42FB-8768-CD6EC52B24F8',
    description: 'Important medical event that may jeopardize the patient',
  },
] as const;

/**
 * Map of criterion code to info for fast lookup
 */
const CRITERIA_MAP = new Map<SeriousnessCriterion, SeriousnessCriterionInfo>(
  SERIOUSNESS_CRITERIA.map((c) => [c.code, c])
);

/**
 * Get criterion info by code
 */
export function getCriterionInfo(code: SeriousnessCriterion): SeriousnessCriterionInfo {
  const info = CRITERIA_MAP.get(code);
  if (!info) {
    throw new Error(`Unknown seriousness criterion: ${code}`);
  }
  return info;
}

/**
 * Check if an event is serious based on criteria
 *
 * @param criteria - Array of seriousness criteria that apply
 * @returns true if any serious criterion is present
 */
export function isSeriousEvent(criteria: SeriousnessCriterion[]): boolean {
  return criteria.length > 0;
}

/**
 * Classify seriousness and return structured result
 *
 * @param criteria - Array of seriousness criteria that apply
 * @returns Classification result with E2B code
 *
 * @example
 * ```ts
 * const result = classifySeriousness(['death', 'hospitalization']);
 * // result.isSerious === true
 * // result.e2bSeriousCode === '1'
 * // result.primaryCriterion === 'death'
 * ```
 */
export function classifySeriousness(
  criteria: SeriousnessCriterion[]
): SeriousnessClassification {
  const isSerious = criteria.length > 0;

  // Priority order for primary criterion (most severe first)
  const priorityOrder: SeriousnessCriterion[] = [
    'death',
    'life_threatening',
    'hospitalization',
    'disability',
    'congenital_anomaly',
    'other_medically_important',
  ];

  const primaryCriterion = priorityOrder.find((c) => criteria.includes(c));

  return {
    isSerious,
    criteria: [...criteria],
    e2bSeriousCode: isSerious ? '1' : '2',
    primaryCriterion,
  };
}

/**
 * Generate E2B seriousness field values for ICSR
 *
 * Maps criteria to ICH E2B(R3) A.1.5.2 fields.
 * Matches OpenRIMS-PV MapSafetyReportRelatedFields logic.
 *
 * @param criteria - Array of seriousness criteria that apply
 * @returns E2B field values ready for XML generation
 *
 * @example
 * ```ts
 * const fields = getSeriousnessE2BFields(['death']);
 * // fields.seriousnessResultInDeath === '1=Yes'
 * // fields.serious === '1'
 * ```
 */
export function getSeriousnessE2BFields(
  criteria: SeriousnessCriterion[]
): SeriousnessE2BFields {
  const criteriaSet = new Set(criteria);

  return {
    seriousnessResultInDeath: criteriaSet.has('death') ? '1=Yes' : '2=No',
    seriousnessLifeThreatening: criteriaSet.has('life_threatening') ? '1=Yes' : '2=No',
    seriousnessHospitalization: criteriaSet.has('hospitalization') ? '1=Yes' : '2=No',
    seriousnessDisabling: criteriaSet.has('disability') ? '1=Yes' : '2=No',
    seriousnessCongenitalAnomaly: criteriaSet.has('congenital_anomaly') ? '1=Yes' : '2=No',
    seriousnessOther: criteriaSet.has('other_medically_important') ? '1=Yes' : '2=No',
    serious: criteria.length > 0 ? '1' : '2',
  };
}

/**
 * Parse OpenRIMS-style seriousness string to criteria
 *
 * OpenRIMS stores seriousness as descriptive strings like:
 * "Resulted in death", "Is life-threatening", etc.
 *
 * @param seriousReason - OpenRIMS seriousness description
 * @returns Matching criterion or undefined
 */
export function parseOpenRIMSSeriousness(
  seriousReason: string
): SeriousnessCriterion | undefined {
  const normalizedReason = seriousReason.toLowerCase().trim();

  // Map OpenRIMS string values to criterion codes
  const mappings: Array<{ pattern: RegExp; code: SeriousnessCriterion }> = [
    { pattern: /resulted in death/i, code: 'death' },
    { pattern: /life.?threatening/i, code: 'life_threatening' },
    { pattern: /hospitalization|hospital/i, code: 'hospitalization' },
    { pattern: /disability|incapacity/i, code: 'disability' },
    { pattern: /congenital|birth defect|anomaly/i, code: 'congenital_anomaly' },
    { pattern: /other.*important|medically important/i, code: 'other_medically_important' },
  ];

  for (const { pattern, code } of mappings) {
    if (pattern.test(normalizedReason)) {
      return code;
    }
  }

  return undefined;
}
