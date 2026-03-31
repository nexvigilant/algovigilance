/**
 * Contact & Consulting Schema Unit Tests
 *
 * Fast, isolated tests for form validation schemas and lead scoring.
 * No mocking required - pure Zod schema validation.
 */

import { describe, it, expect } from '@jest/globals';
import {
  ContactFormSchema,
  ConsultingInquirySchema,
  CompanySizeSchema,
  BudgetRangeSchema,
  TimelineSchema,
  ConsultingCompanyTypeSchema,
} from '@/lib/schemas/contact';
import { calculateLeadScore } from '@/lib/internal/lead-scoring';

describe('ContactFormSchema', () => {
  const validContact = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@pharma.com',
    subject: 'Consulting Inquiry',
    message: 'I would like to discuss pharmacovigilance consulting services.',
  };

  describe('Valid submissions', () => {
    it('should accept minimal valid contact form', () => {
      const result = ContactFormSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it('should accept contact form with all optional fields', () => {
      const data = {
        ...validContact,
        companyName: 'Pharma Corp',
        companyType: 'pharmaceutical' as const,
        serviceInterest: 'pharmacovigilance' as const,
        timeline: 'immediate' as const,
        source: 'website',
      };
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty string for optional enum fields', () => {
      const data = {
        ...validContact,
        companyType: '' as const,
        serviceInterest: '' as const,
        timeline: '' as const,
      };
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Required field validation', () => {
    it('should reject missing firstName', () => {
      const { firstName: _, ...data } = validContact;
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty firstName', () => {
      const data = { ...validContact, firstName: '' };
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing lastName', () => {
      const { lastName: _, ...data } = validContact;
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const { email: _, ...data } = validContact;
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing subject', () => {
      const { subject: _, ...data } = validContact;
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing message', () => {
      const { message: _, ...data } = validContact;
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Email validation', () => {
    it('should reject invalid email format', () => {
      const data = { ...validContact, email: 'not-an-email' };
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const data = { ...validContact, email: 'test@' };
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'jane.doe@pharma.com',
        'user+tag@company.co.uk',
        'name@subdomain.domain.org',
      ];
      validEmails.forEach(email => {
        const data = { ...validContact, email };
        const result = ContactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Message validation', () => {
    it('should reject message under 10 characters', () => {
      const data = { ...validContact, message: 'Too short' };
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept message at exactly 10 characters', () => {
      const data = { ...validContact, message: '1234567890' };
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Company type validation', () => {
    it('should accept all valid company types', () => {
      const validTypes = ['pharmaceutical', 'biotech', 'cro', 'healthcare', 'other', ''];
      validTypes.forEach(type => {
        const data = { ...validContact, companyType: type as typeof validTypes[number] };
        const result = ContactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid company type', () => {
      const data = { ...validContact, companyType: 'invalid-type' };
      const result = ContactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Service interest validation', () => {
    it('should accept all valid service interests', () => {
      const validInterests = [
        'signal-validation', 'strategic-consulting', 'regulatory-affairs',
        'clinical-development', 'pharmacovigilance', 'medical-affairs',
        'market-access', 'general', ''
      ];
      validInterests.forEach(interest => {
        const data = { ...validContact, serviceInterest: interest as typeof validInterests[number] };
        const result = ContactFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('ConsultingInquirySchema', () => {
  const validInquiry = {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@biotech.com',
    companyName: 'BioTech Inc',
    companyType: 'biotech' as const,
    companySize: '201-500' as const,
    consultingCategory: 'strategic' as const,
    timeline: '1-3-months' as const,
    challengeDescription: 'We need help building a pharmacovigilance strategy for our new drug launch.',
  };

  describe('Valid submissions', () => {
    it('should accept minimal valid consulting inquiry', () => {
      const result = ConsultingInquirySchema.safeParse(validInquiry);
      expect(result.success).toBe(true);
    });

    it('should accept inquiry with all optional fields', () => {
      const data = {
        ...validInquiry,
        jobTitle: 'VP of Drug Safety',
        functionalArea: 'pharmacovigilance' as const,
        budgetRange: '100k-250k' as const,
        source: 'consulting_page',
      };
      const result = ConsultingInquirySchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Required field validation', () => {
    it('should reject missing companyName', () => {
      const { companyName: _, ...data } = validInquiry;
      const result = ConsultingInquirySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing companyType', () => {
      const { companyType: _, ...data } = validInquiry;
      const result = ConsultingInquirySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing companySize', () => {
      const { companySize: _, ...data } = validInquiry;
      const result = ConsultingInquirySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing consultingCategory', () => {
      const { consultingCategory: _, ...data } = validInquiry;
      const result = ConsultingInquirySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing timeline', () => {
      const { timeline: _, ...data } = validInquiry;
      const result = ConsultingInquirySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing challengeDescription', () => {
      const { challengeDescription: _, ...data } = validInquiry;
      const result = ConsultingInquirySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Challenge description validation', () => {
    it('should reject description under 20 characters', () => {
      const data = { ...validInquiry, challengeDescription: 'Too short' };
      const result = ConsultingInquirySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept description at exactly 20 characters', () => {
      const data = { ...validInquiry, challengeDescription: '12345678901234567890' };
      const result = ConsultingInquirySchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Company size validation', () => {
    it('should accept all valid company sizes', () => {
      const validSizes = ['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];
      validSizes.forEach(size => {
        const data = { ...validInquiry, companySize: size as typeof validSizes[number] };
        const result = ConsultingInquirySchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid company size', () => {
      const data = { ...validInquiry, companySize: '10000+' };
      const result = ConsultingInquirySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Consulting category validation', () => {
    it('should accept all valid categories', () => {
      const validCategories = ['strategic', 'innovation', 'ld', 'tactical', 'multiple'];
      validCategories.forEach(category => {
        const data = { ...validInquiry, consultingCategory: category as typeof validCategories[number] };
        const result = ConsultingInquirySchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Budget range validation', () => {
    it('should accept all valid budget ranges', () => {
      const validBudgets = ['under-25k', '25k-50k', '50k-100k', '100k-250k', '250k-500k', 'over-500k', 'not-sure'];
      validBudgets.forEach(budget => {
        const data = { ...validInquiry, budgetRange: budget as typeof validBudgets[number] };
        const result = ConsultingInquirySchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('calculateLeadScore', () => {
  const baseInquiry = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@company.com',
    companyName: 'Test Corp',
    companyType: 'pharmaceutical' as const,
    companySize: '501-1000' as const,
    consultingCategory: 'strategic' as const,
    timeline: '1-3-months' as const,
    challengeDescription: 'We need strategic consulting help.',
  };

  describe('Company size scoring', () => {
    it('should score 10 for small companies (1-50)', () => {
      const data = { ...baseInquiry, companySize: '1-50' as const };
      const score = calculateLeadScore(data);
      expect(score).toBeGreaterThanOrEqual(10);
    });

    it('should score 60 for enterprise companies (5000+)', () => {
      const data = { ...baseInquiry, companySize: '5000+' as const };
      const score = calculateLeadScore(data);
      expect(score).toBeGreaterThanOrEqual(100);
    });

    it('should score higher for larger companies', () => {
      const small = calculateLeadScore({ ...baseInquiry, companySize: '1-50' as const });
      const large = calculateLeadScore({ ...baseInquiry, companySize: '5000+' as const });
      expect(large).toBeGreaterThan(small);
    });
  });

  describe('Timeline urgency scoring', () => {
    it('should score 30 for immediate timeline', () => {
      const data = { ...baseInquiry, timeline: 'immediate' as const };
      const scoreImmediate = calculateLeadScore(data);
      const baseScore = calculateLeadScore({ ...baseInquiry, timeline: 'exploratory' as const });
      expect(scoreImmediate - baseScore).toBe(45); // 50 - 5 = 45
    });

    it('should score lowest for exploratory timeline', () => {
      const exploratory = calculateLeadScore({ ...baseInquiry, timeline: 'exploratory' as const });
      const immediate = calculateLeadScore({ ...baseInquiry, timeline: 'immediate' as const });
      expect(immediate).toBeGreaterThan(exploratory);
    });
  });

  describe('Budget scoring', () => {
    it('should increase score with budget range', () => {
      const withoutBudget = calculateLeadScore(baseInquiry);
      const withBudget = calculateLeadScore({ ...baseInquiry, budgetRange: 'over-500k' as const });
      expect(withBudget).toBeGreaterThan(withoutBudget);
    });

    it('should score 50 for over-500k budget', () => {
      const baseSansType = { ...baseInquiry, companyType: 'other' as const }; // Normalize type
      const withoutBudget = calculateLeadScore(baseSansType);
      const withBudget = calculateLeadScore({ ...baseSansType, budgetRange: 'over-500k' as const });
      expect(withBudget - withoutBudget).toBe(50);
    });

    it('should score 15 for not-sure budget', () => {
      const baseSansType = { ...baseInquiry, companyType: 'other' as const };
      const withoutBudget = calculateLeadScore(baseSansType);
      const withBudget = calculateLeadScore({ ...baseSansType, budgetRange: 'not-sure' as const });
      expect(withBudget - withoutBudget).toBe(15);
    });
  });

  describe('Company type scoring', () => {
    it('should score 20 for pharmaceutical companies', () => {
      const pharma = calculateLeadScore({ ...baseInquiry, companyType: 'pharmaceutical' as const });
      const other = calculateLeadScore({ ...baseInquiry, companyType: 'other' as const });
      expect(pharma - other).toBe(15); // 20 - 5 = 15
    });

    it('should score 20 for biotech companies', () => {
      const biotech = calculateLeadScore({ ...baseInquiry, companyType: 'biotech' as const });
      const other = calculateLeadScore({ ...baseInquiry, companyType: 'other' as const });
      expect(biotech - other).toBe(15);
    });
  });

  describe('Combined scoring', () => {
    it('should calculate maximum score for enterprise pharma with immediate need and high budget', () => {
      const maxData = {
        ...baseInquiry,
        companySize: '5000+' as const,       // 100
        companyType: 'pharmaceutical' as const, // 20
        timeline: 'immediate' as const,       // 50
        budgetRange: 'over-500k' as const,    // 50
      };
      const score = calculateLeadScore(maxData);
      expect(score).toBe(220); // Max possible score
    });

    it('should calculate minimum score for small other company exploring', () => {
      const minData = {
        ...baseInquiry,
        companySize: '1-50' as const,         // 10
        companyType: 'other' as const,        // 5
        timeline: 'exploratory' as const,    // 5
        // No budget specified                 // 0
      };
      const score = calculateLeadScore(minData);
      expect(score).toBe(20); // Min score without budget
    });
  });
});

describe('Enum Schemas', () => {
  describe('CompanySizeSchema', () => {
    it('should accept all valid sizes', () => {
      const validSizes = ['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];
      validSizes.forEach(size => {
        const result = CompanySizeSchema.safeParse(size);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid size', () => {
      const result = CompanySizeSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('BudgetRangeSchema', () => {
    it('should accept all valid budget ranges', () => {
      const validBudgets = ['under-25k', '25k-50k', '50k-100k', '100k-250k', '250k-500k', 'over-500k', 'not-sure'];
      validBudgets.forEach(budget => {
        const result = BudgetRangeSchema.safeParse(budget);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('TimelineSchema', () => {
    it('should accept all valid timelines', () => {
      const validTimelines = ['immediate', '1-3-months', '3-6-months', '6-plus-months', 'exploratory'];
      validTimelines.forEach(timeline => {
        const result = TimelineSchema.safeParse(timeline);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('ConsultingCompanyTypeSchema', () => {
    it('should accept all valid company types', () => {
      const validTypes = ['pharmaceutical', 'biotech', 'cro', 'healthcare', 'medical-device', 'consulting', 'other'];
      validTypes.forEach(type => {
        const result = ConsultingCompanyTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });
  });
});
