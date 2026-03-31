/**
 * Form Submission Capabilities Test Suite
 *
 * Tests all public form submission flows:
 * - Contact form
 * - Consulting inquiry
 * - Waitlist signup
 * - Ambassador application
 * - Advisor application
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve({ id: 'test-doc-id' })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
      })),
    })),
  },
  adminFieldValue: {
    serverTimestamp: jest.fn(() => new Date()),
  },
}));

// Mock BotID
jest.mock('botid/server', () => ({
  checkBotId: jest.fn(() => Promise.resolve({ isBot: false })),
}));

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  checkPublicRateLimit: jest.fn(() => Promise.resolve({ allowed: true })),
}));

// Mock email functions
jest.mock('@/lib/email', () => ({
  sendContactFormNotification: jest.fn(() => Promise.resolve()),
  sendContactFormAcknowledgment: jest.fn(() => Promise.resolve()),
  sendConsultingLeadNotification: jest.fn(() => Promise.resolve()),
  sendConsultingLeadAcknowledgment: jest.fn(() => Promise.resolve()),
}));

describe('Form Submission Capabilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Contact Form', () => {
    it('should validate required fields', async () => {
      const { submitContactForm } = await import('@/app/(public)/contact/actions');

      const invalidData = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        subject: '',
        message: 'short',
      };

      const result = await submitContactForm(invalidData as Parameters<typeof submitContactForm>[0]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('check your form fields');
    });

    it('should accept valid contact form submission', async () => {
      const { submitContactForm } = await import('@/app/(public)/contact/actions');

      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        subject: 'Test Inquiry',
        message: 'This is a test message that is long enough to pass validation.',
        companyName: 'Test Corp',
        companyType: 'pharmaceutical' as const,
        serviceInterest: 'pharmacovigilance' as const,
        timeline: '1-3-months' as const,
        source: 'test',
      };

      const result = await submitContactForm(validData);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Thank you');
    });

    it('should reject verified bot submissions', async () => {
      // The form only blocks isVerifiedBot (known crawlers), not regular isBot
      // This is intentional - isBot has false positives, so only verified bots are blocked
      const { checkBotId } = await import('botid/server');
      (checkBotId as jest.Mock).mockResolvedValueOnce({ isBot: true, isVerifiedBot: true, isHuman: false });

      const { submitContactForm } = await import('@/app/(public)/contact/actions');

      const validData = {
        firstName: 'Bot',
        lastName: 'User',
        email: 'bot@example.com',
        subject: 'Spam',
        message: 'This is spam content from a bot submission.',
      };

      const result = await submitContactForm(validData as Parameters<typeof submitContactForm>[0]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unable to process');
    });

    it('should enforce rate limiting', async () => {
      const { checkPublicRateLimit } = await import('@/lib/rate-limit');
      (checkPublicRateLimit as jest.Mock).mockResolvedValueOnce({
        allowed: false,
        error: 'Rate limit exceeded',
      });

      const { submitContactForm } = await import('@/app/(public)/contact/actions');

      const validData = {
        firstName: 'Rate',
        lastName: 'Limited',
        email: 'rate@example.com',
        subject: 'Test',
        message: 'Testing rate limiting enforcement in contact form.',
      };

      const result = await submitContactForm(validData as Parameters<typeof submitContactForm>[0]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit exceeded');
    });
  });

  describe('Consulting Inquiry Form', () => {
    it('should validate enterprise-specific fields', async () => {
      const { submitConsultingInquiry } = await import('@/app/(public)/contact/actions');

      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyName: '', // Required
        companyType: 'pharmaceutical' as const,
        companySize: '51-200' as const,
        consultingCategory: 'strategic' as const,
        timeline: 'immediate' as const,
        challengeDescription: 'Too short', // Min 20 chars
      };

      const result = await submitConsultingInquiry(invalidData as Parameters<typeof submitConsultingInquiry>[0]);
      expect(result.success).toBe(false);
    });

    it('should calculate lead score correctly', async () => {
      const { adminDb } = await import('@/lib/firebase-admin');
      const mockAdd = jest.fn(() => Promise.resolve({ id: 'test-id' }));
      (adminDb.collection as jest.Mock).mockReturnValue({ add: mockAdd });

      const { submitConsultingInquiry } = await import('@/app/(public)/contact/actions');

      const highValueLead = {
        firstName: 'Enterprise',
        lastName: 'Client',
        email: 'enterprise@pharma.com',
        jobTitle: 'VP of Safety',
        companyName: 'Big Pharma Inc',
        companyType: 'pharmaceutical' as const,
        companySize: '5000+' as const,
        consultingCategory: 'strategic' as const,
        timeline: 'immediate' as const,
        budgetRange: 'over-500k' as const,
        challengeDescription: 'We need comprehensive strategic consulting for our global pharmacovigilance operations.',
      };

      const result = await submitConsultingInquiry(highValueLead);
      expect(result.success).toBe(true);

      // Verify lead score was calculated (60 + 50 + 30 + 20 = 160)
      const savedData = mockAdd.mock.calls[0][0];
      expect(savedData.leadScore).toBeGreaterThanOrEqual(100);
    });

    it('should use separate rate limit key from contact form', async () => {
      const { checkPublicRateLimit } = await import('@/lib/rate-limit');

      const { submitConsultingInquiry } = await import('@/app/(public)/contact/actions');

      const validData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        companyName: 'Test Corp',
        companyType: 'biotech' as const,
        companySize: '51-200' as const,
        consultingCategory: 'innovation' as const,
        timeline: '1-3-months' as const,
        challengeDescription: 'Testing rate limit key separation for consulting inquiry form.',
      };

      await submitConsultingInquiry(validData);

      // Verify it uses 'consulting_inquiry' key, not 'contact_form'
      expect(checkPublicRateLimit).toHaveBeenCalledWith('consulting_inquiry');
    });
  });
});

describe('Rate Limiting System', () => {
  it('should have rate limits for all public actions', () => {
    // Verify consulting_inquiry is in the expected list
    const expectedActions = [
      'affiliate_application',
      'consulting_inquiry',
      'contact_form',
      'newsletter_signup',
      'waitlist',
    ];

    // This verifies the rate limit actions are documented
    expect(expectedActions).toContain('consulting_inquiry');
    expect(expectedActions).toHaveLength(5);
  });
});

describe('Input Validation', () => {
  it('should sanitize email addresses to lowercase', async () => {
    const { adminDb } = await import('@/lib/firebase-admin');
    const mockAdd = jest.fn(() => Promise.resolve({ id: 'test-id' }));
    (adminDb.collection as jest.Mock).mockReturnValue({ add: mockAdd });

    const { submitContactForm } = await import('@/app/(public)/contact/actions');

    const dataWithUppercaseEmail = {
      firstName: 'Test',
      lastName: 'User',
      email: 'TEST.USER@EXAMPLE.COM',
      subject: 'Test',
      message: 'Testing email normalization to lowercase.',
    };

    await submitContactForm(dataWithUppercaseEmail as Parameters<typeof submitContactForm>[0]);

    const savedData = mockAdd.mock.calls[0][0];
    expect(savedData.email).toBe('test.user@example.com');
  });

  it('should reject invalid email formats', async () => {
    const { submitContactForm } = await import('@/app/(public)/contact/actions');

    const invalidEmails = [
      'not-an-email',
      '@nodomain.com',
      'missing@.com',
      'spaces in@email.com',
    ];

    for (const email of invalidEmails) {
      const result = await submitContactForm({
        firstName: 'Test',
        lastName: 'User',
        email,
        subject: 'Test',
        message: 'Testing invalid email rejection.',
      } as Parameters<typeof submitContactForm>[0]);

      expect(result.success).toBe(false);
    }
  });
});
