/**
 * ICH E2B-Compliant Age Group Calculator
 *
 * Calculates patient age group at time of adverse event onset.
 * Based on ICH E2B(R3) D.2.2 guidance and OpenRIMS-PV implementation.
 *
 * @module lib/pv/age-groups
 * @see https://wiki.openrims.org
 */

import type { AgeGroup, AgeGroupBoundary, AgeGroupResult, AgeGroupInfo } from './types';

/**
 * ICH E2B age group boundaries in months
 * Based on ICH E2B(R3) D.2.2 classifications
 */
export const AGE_GROUP_BOUNDARIES: readonly AgeGroupBoundary[] = [
  {
    code: 'neonate',
    label: 'Neonate <= 1 month',
    e2bCode: '1',
    minMonths: 0,
    maxMonths: 1,
  },
  {
    code: 'infant',
    label: 'Infant > 1 month and <= 4 years',
    e2bCode: '2',
    minMonths: 1,
    maxMonths: 48, // 4 years
  },
  {
    code: 'child',
    label: 'Child > 4 years and <= 11 years',
    e2bCode: '3',
    minMonths: 48,
    maxMonths: 132, // 11 years
  },
  {
    code: 'adolescent',
    label: 'Adolescent > 11 years and <= 16 years',
    e2bCode: '4',
    minMonths: 132,
    maxMonths: 192, // 16 years
  },
  {
    code: 'adult',
    label: 'Adult > 16 years and <= 69 years',
    e2bCode: '5',
    minMonths: 192,
    maxMonths: 828, // 69 years
  },
  {
    code: 'elderly',
    label: 'Elderly > 69 years',
    e2bCode: '6',
    minMonths: 828,
    maxMonths: null, // No upper bound
  },
] as const;

/**
 * Get age group info by code
 */
export function getAgeGroupInfo(code: AgeGroup): AgeGroupInfo {
  const boundary = AGE_GROUP_BOUNDARIES.find((b) => b.code === code);
  if (!boundary) {
    throw new Error(`Unknown age group code: ${code}`);
  }
  return {
    code: boundary.code,
    label: boundary.label,
    e2bCode: boundary.e2bCode,
  };
}

/**
 * Calculate months between two dates
 * Uses the same logic as OpenRIMS-PV's AddMonths comparison
 */
function calculateMonthsBetween(startDate: Date, endDate: Date): number {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  const days = endDate.getDate() - startDate.getDate();

  let totalMonths = years * 12 + months;

  // If the day hasn't been reached yet, subtract a month
  if (days < 0) {
    totalMonths -= 1;
  }

  return totalMonths;
}

/**
 * Calculate detailed age breakdown
 */
function calculateAgeBreakdown(
  dateOfBirth: Date,
  onsetDate: Date
): { years: number; months: number; days: number } {
  let years = onsetDate.getFullYear() - dateOfBirth.getFullYear();
  let months = onsetDate.getMonth() - dateOfBirth.getMonth();
  let days = onsetDate.getDate() - dateOfBirth.getDate();

  // Adjust for negative days
  if (days < 0) {
    months -= 1;
    // Get days in the previous month
    const prevMonth = new Date(onsetDate.getFullYear(), onsetDate.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // Adjust for negative months
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

/**
 * Calculate patient age group at time of adverse event onset
 *
 * Implements ICH E2B(R3) D.2.2 age group classification.
 * Matches OpenRIMS-PV PatientClinicalEvent.AgeGroup logic.
 *
 * @param dateOfBirth - Patient's date of birth
 * @param onsetDate - Date of adverse event onset
 * @returns Age group result with classification and details
 * @throws Error if onset date is before date of birth
 *
 * @example
 * ```ts
 * const result = calculateAgeGroup(
 *   new Date('2020-01-01'),
 *   new Date('2024-06-15')
 * );
 * // result.ageGroup === 'infant'
 * // result.label === 'Infant > 1 month and <= 4 years'
 * // result.e2bCode === '2'
 * ```
 */
export function calculateAgeGroup(
  dateOfBirth: Date,
  onsetDate: Date
): AgeGroupResult {
  // Validate dates
  if (onsetDate < dateOfBirth) {
    throw new Error('Onset date cannot be before date of birth');
  }

  // Calculate age in months for classification
  const ageInMonths = calculateMonthsBetween(dateOfBirth, onsetDate);

  // Find matching age group
  // Logic matches OpenRIMS-PV: check boundaries from youngest to oldest
  let matchedBoundary: AgeGroupBoundary = AGE_GROUP_BOUNDARIES[AGE_GROUP_BOUNDARIES.length - 1];

  for (const boundary of AGE_GROUP_BOUNDARIES) {
    const maxMonths = boundary.maxMonths ?? Infinity;

    // Check if age falls within this boundary
    // Note: OpenRIMS uses <= for upper bound (inclusive)
    if (ageInMonths >= boundary.minMonths && ageInMonths <= maxMonths) {
      matchedBoundary = boundary;
      break;
    }
  }

  // Calculate detailed age breakdown
  const ageBreakdown = calculateAgeBreakdown(dateOfBirth, onsetDate);

  return {
    ageGroup: matchedBoundary.code,
    label: matchedBoundary.label,
    e2bCode: matchedBoundary.e2bCode,
    ageAtOnset: ageBreakdown,
    calculatedFrom: {
      dateOfBirth,
      onsetDate,
    },
  };
}

/**
 * Determine if a patient is pediatric (under 18)
 * Commonly used for regulatory reporting thresholds
 */
export function isPediatric(dateOfBirth: Date, onsetDate: Date): boolean {
  const result = calculateAgeGroup(dateOfBirth, onsetDate);
  return ['neonate', 'infant', 'child', 'adolescent'].includes(result.ageGroup);
}

/**
 * Determine if a patient is geriatric (65+)
 * Some regulations use 65 as threshold, others 69
 */
export function isGeriatric(
  dateOfBirth: Date,
  onsetDate: Date,
  threshold: 65 | 69 = 69
): boolean {
  const ageInMonths = calculateMonthsBetween(dateOfBirth, onsetDate);
  const thresholdMonths = threshold * 12;
  return ageInMonths > thresholdMonths;
}
