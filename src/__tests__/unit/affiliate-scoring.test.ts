/**
 * Affiliate Scoring Logic Unit Tests
 *
 * Tests the scoring algorithms for Ambassador and Advisor applications.
 * These mirror the scoring functions in grow/actions.ts.
 */

import { describe, it, expect } from '@jest/globals';
import type {
  AmbassadorApplication,
  AdvisorApplication,
} from '@/lib/schemas/affiliate';

/**
 * Calculate Ambassador application score
 * Mirrors the logic in src/app/(public)/grow/actions.ts
 */
function calculateAmbassadorScore(data: AmbassadorApplication): number {
  let score = 0;

  // Multiple career interests shows engagement
  score += Math.min(data.careerInterests.length * 5, 20);

  // Motivation quality (longer = more thoughtful, up to a point)
  if (data.motivation.length >= 200) score += 15;
  else if (data.motivation.length >= 100) score += 10;
  else score += 5;

  // Role scoring
  const roleScores: Record<string, number> = {
    'student': 10,
    'recent-graduate': 15,
    'fellow': 20,
    'residency': 20,
    'entry-level': 15,
  };
  score += roleScores[data.currentRole] || 10;

  // LinkedIn presence shows professionalism
  if (data.linkedInProfile) score += 10;

  // Healthcare program scoring
  const programScores: Record<string, number> = {
    'pharmd': 20,
    'phd': 20,
    'md': 20,
    'mph': 15,
    'ms': 15,
    'pharm-bs': 10,
    'nursing': 10,
    'other': 5,
  };
  score += programScores[data.programOfStudy] || 5;

  // PV-related expertise bonus
  if (['pharmacovigilance', 'drug-safety', 'regulatory-affairs'].includes(data.areaOfExpertise)) {
    score += 10;
  }

  return score;
}

/**
 * Calculate Advisor application score
 * Mirrors the logic in src/app/(public)/grow/actions.ts
 */
function calculateAdvisorScore(data: AdvisorApplication): number {
  let score = 0;

  // Years of experience (key factor)
  if (data.yearsOfExperience >= 10) score += 40;
  else if (data.yearsOfExperience >= 5) score += 30;
  else score += 20;

  // Multiple specializations shows breadth
  score += Math.min(data.specializations.length * 5, 25);

  // Consulting interest level
  const interestScores: Record<string, number> = {
    'regular': 20,
    'occasional': 15,
    'open': 10,
  };
  score += interestScores[data.consultingInterest] || 10;

  // Motivation quality
  if (data.motivation.length >= 200) score += 15;
  else if (data.motivation.length >= 100) score += 10;
  else score += 5;

  // LinkedIn presence
  if (data.linkedInProfile) score += 10;

  // PV-related expertise bonus
  if (['pharmacovigilance', 'drug-safety', 'regulatory-affairs'].includes(data.areaOfExpertise)) {
    score += 10;
  }

  // Referral source bonus (network referrals are higher quality)
  if (data.referralSource === 'colleague') score += 10;
  else if (data.referralSource === 'conference') score += 5;

  return score;
}

describe('Ambassador Scoring', () => {
  const baseAmbassador: AmbassadorApplication = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    linkedInProfile: '',
    currentRole: 'student',
    programOfStudy: 'other',
    institutionName: 'Test University',
    graduationDate: '2025-05',
    areaOfExpertise: 'other',
    careerInterests: ['pharmacovigilance'],
    motivation: 'a'.repeat(50), // Minimum valid motivation
  };

  describe('Career interests scoring', () => {
    it('should add 5 points per career interest (max 20)', () => {
      const oneInterest = calculateAmbassadorScore({ ...baseAmbassador, careerInterests: ['pv'] });
      const fourInterests = calculateAmbassadorScore({
        ...baseAmbassador,
        careerInterests: ['pv', 'reg', 'clinical', 'quality'],
      });
      const fiveInterests = calculateAmbassadorScore({
        ...baseAmbassador,
        careerInterests: ['pv', 'reg', 'clinical', 'quality', 'research'],
      });

      expect(fourInterests - oneInterest).toBe(15); // 4*5 - 1*5 = 15
      expect(fiveInterests).toBe(fourInterests); // Capped at 20
    });
  });

  describe('Motivation length scoring', () => {
    it('should give 5 points for short motivation (<100 chars)', () => {
      const short = calculateAmbassadorScore({ ...baseAmbassador, motivation: 'a'.repeat(50) });
      const medium = calculateAmbassadorScore({ ...baseAmbassador, motivation: 'a'.repeat(100) });
      expect(medium - short).toBe(5); // 10 - 5 = 5
    });

    it('should give 10 points for medium motivation (100-199 chars)', () => {
      const medium = calculateAmbassadorScore({ ...baseAmbassador, motivation: 'a'.repeat(100) });
      const long = calculateAmbassadorScore({ ...baseAmbassador, motivation: 'a'.repeat(200) });
      expect(long - medium).toBe(5); // 15 - 10 = 5
    });

    it('should give 15 points for long motivation (200+ chars)', () => {
      const long = calculateAmbassadorScore({ ...baseAmbassador, motivation: 'a'.repeat(200) });
      const veryLong = calculateAmbassadorScore({ ...baseAmbassador, motivation: 'a'.repeat(400) });
      expect(long).toBe(veryLong); // Both get 15, capped
    });
  });

  describe('Role scoring', () => {
    it('should give highest score to fellows and residents', () => {
      const fellow = calculateAmbassadorScore({ ...baseAmbassador, currentRole: 'fellow' });
      const student = calculateAmbassadorScore({ ...baseAmbassador, currentRole: 'student' });
      expect(fellow - student).toBe(10); // 20 - 10 = 10
    });

    it('should give medium score to recent graduates', () => {
      const recentGrad = calculateAmbassadorScore({ ...baseAmbassador, currentRole: 'recent-graduate' });
      const student = calculateAmbassadorScore({ ...baseAmbassador, currentRole: 'student' });
      expect(recentGrad - student).toBe(5); // 15 - 10 = 5
    });
  });

  describe('LinkedIn scoring', () => {
    it('should add 10 points for LinkedIn profile', () => {
      const withLinkedIn = calculateAmbassadorScore({
        ...baseAmbassador,
        linkedInProfile: 'https://linkedin.com/in/test',
      });
      const withoutLinkedIn = calculateAmbassadorScore({ ...baseAmbassador, linkedInProfile: '' });
      expect(withLinkedIn - withoutLinkedIn).toBe(10);
    });
  });

  describe('Program scoring', () => {
    it('should give highest score to PharmD/PhD/MD', () => {
      const pharmd = calculateAmbassadorScore({ ...baseAmbassador, programOfStudy: 'pharmd' });
      const other = calculateAmbassadorScore({ ...baseAmbassador, programOfStudy: 'other' });
      expect(pharmd - other).toBe(15); // 20 - 5 = 15
    });

    it('should give medium score to MPH/MS', () => {
      const mph = calculateAmbassadorScore({ ...baseAmbassador, programOfStudy: 'mph' });
      const other = calculateAmbassadorScore({ ...baseAmbassador, programOfStudy: 'other' });
      expect(mph - other).toBe(10); // 15 - 5 = 10
    });
  });

  describe('PV expertise bonus', () => {
    it('should add 10 points for PV-related expertise', () => {
      const pvExpert = calculateAmbassadorScore({
        ...baseAmbassador,
        areaOfExpertise: 'pharmacovigilance',
      });
      const otherExpert = calculateAmbassadorScore({ ...baseAmbassador, areaOfExpertise: 'other' });
      expect(pvExpert - otherExpert).toBe(10);
    });
  });

  describe('Total score range', () => {
    it('should calculate minimum score correctly', () => {
      const minScore = calculateAmbassadorScore(baseAmbassador);
      // 1 interest (5) + short motivation (5) + student (10) + no linkedin (0) + other program (5) + no PV (0)
      expect(minScore).toBe(25);
    });

    it('should calculate maximum score correctly', () => {
      const maxAmbassador: AmbassadorApplication = {
        ...baseAmbassador,
        careerInterests: ['pv', 'reg', 'clinical', 'quality'], // 20 points (capped)
        motivation: 'a'.repeat(200), // 15 points
        currentRole: 'fellow', // 20 points
        linkedInProfile: 'https://linkedin.com/in/test', // 10 points
        programOfStudy: 'pharmd', // 20 points
        areaOfExpertise: 'pharmacovigilance', // 10 points
      };
      const maxScore = calculateAmbassadorScore(maxAmbassador);
      expect(maxScore).toBe(95);
    });
  });
});

describe('Advisor Scoring', () => {
  const baseAdvisor: AdvisorApplication = {
    firstName: 'Test',
    lastName: 'Advisor',
    email: 'test@company.com',
    linkedInProfile: '',
    currentRole: 'Director',
    currentCompany: 'Pharma Corp',
    yearsOfExperience: 2, // Minimum required
    areaOfExpertise: 'other',
    specializations: ['signal-detection'],
    consultingInterest: 'open',
    motivation: 'a'.repeat(50),
  };

  describe('Experience scoring', () => {
    it('should give 20 points for 2-4 years', () => {
      const twoYears = calculateAdvisorScore({ ...baseAdvisor, yearsOfExperience: 2 });
      const fourYears = calculateAdvisorScore({ ...baseAdvisor, yearsOfExperience: 4 });
      expect(twoYears).toBe(fourYears); // Both get 20
    });

    it('should give 30 points for 5-9 years', () => {
      const fiveYears = calculateAdvisorScore({ ...baseAdvisor, yearsOfExperience: 5 });
      const nineYears = calculateAdvisorScore({ ...baseAdvisor, yearsOfExperience: 9 });
      const fourYears = calculateAdvisorScore({ ...baseAdvisor, yearsOfExperience: 4 });
      expect(fiveYears).toBe(nineYears); // Both get 30
      expect(fiveYears - fourYears).toBe(10); // 30 - 20 = 10
    });

    it('should give 40 points for 10+ years', () => {
      const tenYears = calculateAdvisorScore({ ...baseAdvisor, yearsOfExperience: 10 });
      const twentyYears = calculateAdvisorScore({ ...baseAdvisor, yearsOfExperience: 20 });
      const nineYears = calculateAdvisorScore({ ...baseAdvisor, yearsOfExperience: 9 });
      expect(tenYears).toBe(twentyYears); // Both get 40
      expect(tenYears - nineYears).toBe(10); // 40 - 30 = 10
    });
  });

  describe('Specializations scoring', () => {
    it('should add 5 points per specialization (max 25)', () => {
      const one = calculateAdvisorScore({ ...baseAdvisor, specializations: ['a'] });
      const five = calculateAdvisorScore({
        ...baseAdvisor,
        specializations: ['a', 'b', 'c', 'd', 'e'],
      });
      const six = calculateAdvisorScore({
        ...baseAdvisor,
        specializations: ['a', 'b', 'c', 'd', 'e', 'f'],
      });
      expect(five - one).toBe(20); // 25 - 5 = 20
      expect(six).toBe(five); // Capped at 25
    });
  });

  describe('Consulting interest scoring', () => {
    it('should give highest score to regular consulting', () => {
      const regular = calculateAdvisorScore({ ...baseAdvisor, consultingInterest: 'regular' });
      const open = calculateAdvisorScore({ ...baseAdvisor, consultingInterest: 'open' });
      expect(regular - open).toBe(10); // 20 - 10 = 10
    });

    it('should give medium score to occasional consulting', () => {
      const occasional = calculateAdvisorScore({ ...baseAdvisor, consultingInterest: 'occasional' });
      const open = calculateAdvisorScore({ ...baseAdvisor, consultingInterest: 'open' });
      expect(occasional - open).toBe(5); // 15 - 10 = 5
    });
  });

  describe('Referral source scoring', () => {
    it('should add 10 points for colleague referral', () => {
      const colleague = calculateAdvisorScore({ ...baseAdvisor, referralSource: 'colleague' });
      const noReferral = calculateAdvisorScore({ ...baseAdvisor });
      expect(colleague - noReferral).toBe(10);
    });

    it('should add 5 points for conference referral', () => {
      const conference = calculateAdvisorScore({ ...baseAdvisor, referralSource: 'conference' });
      const noReferral = calculateAdvisorScore({ ...baseAdvisor });
      expect(conference - noReferral).toBe(5);
    });

    it('should add 0 points for other referral sources', () => {
      const linkedin = calculateAdvisorScore({ ...baseAdvisor, referralSource: 'linkedin' });
      const noReferral = calculateAdvisorScore({ ...baseAdvisor });
      expect(linkedin).toBe(noReferral);
    });
  });

  describe('Total score range', () => {
    it('should calculate minimum score correctly', () => {
      const minScore = calculateAdvisorScore(baseAdvisor);
      // 2 years (20) + 1 spec (5) + open (10) + short motivation (5) + no linkedin (0) + no PV (0) + no referral (0)
      expect(minScore).toBe(40);
    });

    it('should calculate maximum score correctly', () => {
      const maxAdvisor: AdvisorApplication = {
        ...baseAdvisor,
        yearsOfExperience: 15, // 40 points
        specializations: ['a', 'b', 'c', 'd', 'e'], // 25 points (capped)
        consultingInterest: 'regular', // 20 points
        motivation: 'a'.repeat(200), // 15 points
        linkedInProfile: 'https://linkedin.com/in/test', // 10 points
        areaOfExpertise: 'pharmacovigilance', // 10 points
        referralSource: 'colleague', // 10 points
      };
      const maxScore = calculateAdvisorScore(maxAdvisor);
      expect(maxScore).toBe(130);
    });
  });
});
