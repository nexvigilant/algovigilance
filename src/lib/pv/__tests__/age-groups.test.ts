/**
 * Tests for ICH E2B-compliant age group calculator
 *
 * Based on OpenRIMS-PV PatientClinicalEvent.AgeGroup logic
 * Validates against ICH E2B(R3) D.2.2 requirements
 */

import { calculateAgeGroup, getAgeGroupInfo, AGE_GROUP_BOUNDARIES } from '../age-groups';
import type { AgeGroup } from '../types';

describe('calculateAgeGroup', () => {
  // Helper to create dates
  const date = (year: number, month: number, day: number) =>
    new Date(year, month - 1, day);

  describe('Neonate (≤ 1 month)', () => {
    it('should classify newborn as neonate', () => {
      const dob = date(2024, 1, 1);
      const onset = date(2024, 1, 15); // 14 days old
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('neonate');
      expect(result.label).toBe('Neonate <= 1 month');
    });

    it('should classify 1-month-old as neonate', () => {
      const dob = date(2024, 1, 1);
      const onset = date(2024, 2, 1); // Exactly 1 month
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('neonate');
    });
  });

  describe('Infant (> 1 month and ≤ 4 years)', () => {
    it('should classify 2-month-old as infant', () => {
      const dob = date(2024, 1, 1);
      const onset = date(2024, 3, 1); // 2 months old
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('infant');
      expect(result.label).toBe('Infant > 1 month and <= 4 years');
    });

    it('should classify 4-year-old as infant', () => {
      const dob = date(2020, 1, 1);
      const onset = date(2024, 1, 1); // Exactly 4 years (48 months)
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('infant');
    });
  });

  describe('Child (> 4 years and ≤ 11 years)', () => {
    it('should classify 5-year-old as child', () => {
      const dob = date(2019, 1, 1);
      const onset = date(2024, 1, 15); // 5 years old
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('child');
      expect(result.label).toBe('Child > 4 years and <= 11 years');
    });

    it('should classify 11-year-old as child', () => {
      const dob = date(2013, 1, 1);
      const onset = date(2024, 1, 1); // 11 years (132 months)
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('child');
    });
  });

  describe('Adolescent (> 11 years and ≤ 16 years)', () => {
    it('should classify 12-year-old as adolescent', () => {
      const dob = date(2012, 1, 1);
      const onset = date(2024, 6, 1); // 12.5 years old
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('adolescent');
      expect(result.label).toBe('Adolescent > 11 years and <= 16 years');
    });

    it('should classify 16-year-old as adolescent', () => {
      const dob = date(2008, 1, 1);
      const onset = date(2024, 1, 1); // 16 years (192 months)
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('adolescent');
    });
  });

  describe('Adult (> 16 years and ≤ 69 years)', () => {
    it('should classify 30-year-old as adult', () => {
      const dob = date(1994, 1, 1);
      const onset = date(2024, 1, 15);
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('adult');
      expect(result.label).toBe('Adult > 16 years and <= 69 years');
    });

    it('should classify 69-year-old as adult', () => {
      const dob = date(1955, 1, 1);
      const onset = date(2024, 1, 1); // 69 years (828 months)
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('adult');
    });
  });

  describe('Elderly (> 69 years)', () => {
    it('should classify 70-year-old as elderly', () => {
      const dob = date(1954, 1, 1);
      const onset = date(2024, 6, 1); // 70.5 years old
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('elderly');
      expect(result.label).toBe('Elderly > 69 years');
    });

    it('should classify 90-year-old as elderly', () => {
      const dob = date(1934, 1, 1);
      const onset = date(2024, 1, 1);
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('elderly');
    });
  });

  describe('Edge cases', () => {
    it('should throw error if onset is before birth', () => {
      const dob = date(2024, 6, 1);
      const onset = date(2024, 1, 1); // Before birth
      expect(() => calculateAgeGroup(dob, onset)).toThrow('Onset date cannot be before date of birth');
    });

    it('should handle same-day birth and onset', () => {
      const dob = date(2024, 1, 1);
      const onset = date(2024, 1, 1); // Same day
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageGroup).toBe('neonate');
    });

    it('should return correct age components', () => {
      const dob = date(2020, 3, 15);
      const onset = date(2024, 6, 20); // 4 years, 3 months, 5 days
      const result = calculateAgeGroup(dob, onset);
      expect(result.ageAtOnset.years).toBe(4);
      expect(result.ageAtOnset.months).toBe(3);
      expect(result.ageAtOnset.days).toBe(5);
    });
  });
});

describe('getAgeGroupInfo', () => {
  it('should return correct info for each age group', () => {
    const testCases: Array<{ code: AgeGroup; expectedE2b: string }> = [
      { code: 'neonate', expectedE2b: '1' },
      { code: 'infant', expectedE2b: '2' },
      { code: 'child', expectedE2b: '3' },
      { code: 'adolescent', expectedE2b: '4' },
      { code: 'adult', expectedE2b: '5' },
      { code: 'elderly', expectedE2b: '6' },
    ];

    testCases.forEach(({ code, expectedE2b }) => {
      const info = getAgeGroupInfo(code);
      expect(info.code).toBe(code);
      expect(info.e2bCode).toBe(expectedE2b);
      expect(info.label).toBeTruthy();
    });
  });
});

describe('AGE_GROUP_BOUNDARIES', () => {
  it('should have 6 age group definitions', () => {
    expect(AGE_GROUP_BOUNDARIES).toHaveLength(6);
  });

  it('should have contiguous boundaries', () => {
    // Each group's min should be previous group's max
    for (let i = 1; i < AGE_GROUP_BOUNDARIES.length; i++) {
      const prev = AGE_GROUP_BOUNDARIES[i - 1];
      const curr = AGE_GROUP_BOUNDARIES[i];
      expect(curr.minMonths).toBe(prev.maxMonths);
    }
  });

  it('should have null max for elderly', () => {
    const elderly = AGE_GROUP_BOUNDARIES.find(b => b.code === 'elderly');
    expect(elderly?.maxMonths).toBeNull();
  });
});
