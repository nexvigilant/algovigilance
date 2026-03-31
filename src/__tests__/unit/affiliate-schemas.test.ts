/**
 * Affiliate Schema Unit Tests
 *
 * Fast, isolated tests for form validation schemas.
 * No mocking required - pure Zod schema validation.
 */

import { describe, it, expect } from '@jest/globals';
import {
  AmbassadorApplicationSchema,
  AdvisorApplicationSchema,
  AffiliateStatusSchema,
  ExpertiseAreaSchema,
  ProgramOfStudySchema,
  CurrentRoleAmbassadorSchema,
} from '@/lib/schemas/affiliate';

describe('AmbassadorApplicationSchema', () => {
  const validAmbassador = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    linkedInProfile: 'https://linkedin.com/in/test',
    currentRole: 'student' as const,
    programOfStudy: 'pharmd' as const,
    institutionName: 'Test University',
    graduationDate: '2025-05',
    areaOfExpertise: 'pharmacovigilance' as const,
    careerInterests: ['pharmacovigilance'],
    motivation: 'I want to help build the pharmacovigilance community and share knowledge with peers.',
  };

  describe('Valid submissions', () => {
    it('should accept valid ambassador application', () => {
      const result = AmbassadorApplicationSchema.safeParse(validAmbassador);
      expect(result.success).toBe(true);
    });

    it('should accept empty LinkedIn profile', () => {
      const data = { ...validAmbassador, linkedInProfile: '' };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept optional LinkedIn profile (undefined)', () => {
      const { linkedInProfile: _, ...data } = validAmbassador;
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Required field validation', () => {
    it('should reject missing firstName', () => {
      const { firstName: _, ...data } = validAmbassador;
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty firstName', () => {
      const data = { ...validAmbassador, firstName: '' };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const { email: _, ...data } = validAmbassador;
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty careerInterests', () => {
      const data = { ...validAmbassador, careerInterests: [] };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Email validation', () => {
    it('should reject invalid email format', () => {
      const data = { ...validAmbassador, email: 'invalid-email' };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const data = { ...validAmbassador, email: 'test@' };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'test.user@example.com',
        'test+label@example.co.uk',
      ];
      validEmails.forEach(email => {
        const data = { ...validAmbassador, email };
        const result = AmbassadorApplicationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('LinkedIn URL validation', () => {
    it('should reject invalid LinkedIn URL', () => {
      const data = { ...validAmbassador, linkedInProfile: 'not-a-url' };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid LinkedIn URLs', () => {
      const validUrls = [
        'https://linkedin.com/in/johndoe',
        'https://www.linkedin.com/in/johndoe',
      ];
      validUrls.forEach(url => {
        const data = { ...validAmbassador, linkedInProfile: url };
        const result = AmbassadorApplicationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Motivation length validation', () => {
    it('should reject motivation under 50 characters', () => {
      const data = { ...validAmbassador, motivation: 'Too short' };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject motivation over 500 characters', () => {
      const data = { ...validAmbassador, motivation: 'a'.repeat(501) };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept motivation at exactly 50 characters', () => {
      const data = { ...validAmbassador, motivation: 'a'.repeat(50) };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Enum validation', () => {
    it('should reject invalid currentRole', () => {
      const data = { ...validAmbassador, currentRole: 'invalid-role' };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept all valid currentRole values', () => {
      const validRoles = ['student', 'recent-graduate', 'fellow', 'residency', 'entry-level'];
      validRoles.forEach(role => {
        const data = { ...validAmbassador, currentRole: role };
        const result = AmbassadorApplicationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid programOfStudy', () => {
      const data = { ...validAmbassador, programOfStudy: 'invalid-program' };
      const result = AmbassadorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('AdvisorApplicationSchema', () => {
  const validAdvisor = {
    firstName: 'Test',
    lastName: 'Advisor',
    email: 'test@company.com',
    linkedInProfile: 'https://linkedin.com/in/testadvisor',
    currentRole: 'Director of Drug Safety',
    currentCompany: 'Pharma Corp',
    yearsOfExperience: 10,
    areaOfExpertise: 'pharmacovigilance' as const,
    specializations: ['signal-detection', 'case-processing'],
    consultingInterest: 'regular' as const,
    motivation: 'I want to help the next generation of pharmacovigilance professionals succeed.',
  };

  describe('Valid submissions', () => {
    it('should accept valid advisor application', () => {
      const result = AdvisorApplicationSchema.safeParse(validAdvisor);
      expect(result.success).toBe(true);
    });

    it('should accept optional referralSource', () => {
      const data = { ...validAdvisor, referralSource: 'linkedin' as const };
      const result = AdvisorApplicationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Years of experience validation', () => {
    it('should reject experience under 2 years', () => {
      const data = { ...validAdvisor, yearsOfExperience: 1 };
      const result = AdvisorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative experience', () => {
      const data = { ...validAdvisor, yearsOfExperience: -5 };
      const result = AdvisorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept exactly 2 years', () => {
      const data = { ...validAdvisor, yearsOfExperience: 2 };
      const result = AdvisorApplicationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject over 50 years', () => {
      const data = { ...validAdvisor, yearsOfExperience: 51 };
      const result = AdvisorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Specializations validation', () => {
    it('should reject empty specializations', () => {
      const data = { ...validAdvisor, specializations: [] };
      const result = AdvisorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept single specialization', () => {
      const data = { ...validAdvisor, specializations: ['signal-detection'] };
      const result = AdvisorApplicationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept multiple specializations', () => {
      const data = {
        ...validAdvisor,
        specializations: ['signal-detection', 'case-processing', 'risk-management'],
      };
      const result = AdvisorApplicationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Consulting interest validation', () => {
    it('should reject invalid consulting interest', () => {
      const data = { ...validAdvisor, consultingInterest: 'invalid' };
      const result = AdvisorApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept all valid consulting interests', () => {
      const validInterests = ['occasional', 'regular', 'open'];
      validInterests.forEach(interest => {
        const data = { ...validAdvisor, consultingInterest: interest };
        const result = AdvisorApplicationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('Enum Schemas', () => {
  describe('AffiliateStatusSchema', () => {
    it('should accept all valid statuses', () => {
      const validStatuses = ['new', 'reviewed', 'interview', 'approved', 'declined', 'waitlisted'];
      validStatuses.forEach(status => {
        const result = AffiliateStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const result = AffiliateStatusSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('ExpertiseAreaSchema', () => {
    it('should accept pharmacovigilance', () => {
      const result = ExpertiseAreaSchema.safeParse('pharmacovigilance');
      expect(result.success).toBe(true);
    });

    it('should accept drug-safety', () => {
      const result = ExpertiseAreaSchema.safeParse('drug-safety');
      expect(result.success).toBe(true);
    });
  });

  describe('ProgramOfStudySchema', () => {
    it('should accept pharmd', () => {
      const result = ProgramOfStudySchema.safeParse('pharmd');
      expect(result.success).toBe(true);
    });
  });

  describe('CurrentRoleAmbassadorSchema', () => {
    it('should accept student', () => {
      const result = CurrentRoleAmbassadorSchema.safeParse('student');
      expect(result.success).toBe(true);
    });
  });
});
