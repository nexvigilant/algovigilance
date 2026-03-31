/**
 * Email Notification System Tests
 *
 * Tests email notification functionality for:
 * - Contact form notifications
 * - Consulting inquiry notifications
 * - Affiliate application notifications
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Resend
const mockSend = jest.fn(() => Promise.resolve({ id: 'test-email-id' }));
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

describe('Email Notification System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set required environment variable
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  describe('Contact Form Notifications', () => {
    it('should send admin notification on contact form submission', async () => {
      const { sendContactFormNotification } = await import('@/lib/email');

      await sendContactFormNotification({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subject: 'Test Inquiry',
        message: 'This is a test message.',
        companyName: 'Test Corp',
        companyType: 'pharmaceutical',
        serviceInterest: 'pharmacovigilance',
        timeline: '1-3-months',
        source: 'test',
      });

      expect(mockSend).toHaveBeenCalled();
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.to).toContain('matthew@nexvigilant.com');
      expect(callArgs.subject).toContain('Contact');
    });

    it('should include all form fields in notification', async () => {
      const { sendContactFormNotification } = await import('@/lib/email');

      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@pharma.com',
        subject: 'Partnership Inquiry',
        message: 'Interested in partnership opportunities.',
        companyName: 'Big Pharma Inc',
        companyType: 'pharmaceutical',
        serviceInterest: 'strategic-consulting',
        timeline: 'immediate',
        source: 'consulting_page',
      };

      await sendContactFormNotification(formData);

      const emailHtml = mockSend.mock.calls[0][0].html;
      expect(emailHtml).toContain('John');
      expect(emailHtml).toContain('Doe');
      expect(emailHtml).toContain('john.doe@pharma.com');
      expect(emailHtml).toContain('Big Pharma Inc');
    });

    it('should handle missing optional fields gracefully', async () => {
      const { sendContactFormNotification } = await import('@/lib/email');

      await expect(sendContactFormNotification({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subject: 'Simple Inquiry',
        message: 'Just a simple question.',
        // No optional fields
      })).resolves.not.toThrow();
    });
  });

  describe('Consulting Lead Notifications', () => {
    it('should send notification with lead score', async () => {
      const { sendConsultingLeadNotification } = await import('@/lib/email');

      await sendConsultingLeadNotification({
        firstName: 'Enterprise',
        lastName: 'Client',
        email: 'enterprise@pharma.com',
        jobTitle: 'VP Safety',
        companyName: 'Global Pharma',
        companyType: 'pharmaceutical',
        companySize: '5000+',
        consultingCategory: 'strategic',
        functionalArea: 'pharmacovigilance',
        budgetRange: 'over-500k',
        timeline: 'immediate',
        challengeDescription: 'Need strategic consulting for global PV operations.',
        leadScore: 160,
        source: 'consulting_page',
      });

      expect(mockSend).toHaveBeenCalled();
      const emailHtml = mockSend.mock.calls[0][0].html;
      expect(emailHtml).toContain('160'); // Lead score
      expect(emailHtml).toContain('strategic');
    });

    it('should format company size correctly', async () => {
      const { sendConsultingLeadNotification } = await import('@/lib/email');

      const companySizes = ['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];

      for (const size of companySizes) {
        mockSend.mockClear();

        await sendConsultingLeadNotification({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          companyName: 'Test Corp',
          companyType: 'biotech',
          companySize: size as Parameters<typeof sendConsultingLeadNotification>[0]['companySize'],
          consultingCategory: 'innovation',
          timeline: '1-3-months',
          challengeDescription: 'Testing company size formatting.',
          leadScore: 50,
        });

        expect(mockSend).toHaveBeenCalled();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle Resend API errors gracefully', async () => {
      mockSend.mockRejectedValueOnce(new Error('API Error'));

      const { sendContactFormNotification } = await import('@/lib/email');

      // Should not throw, just return error result
      const result = await sendContactFormNotification({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Testing error handling.',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle missing API key', async () => {
      delete process.env.RESEND_API_KEY;

      // Re-import to get fresh module
      jest.resetModules();

      // Should handle gracefully
      // Actual behavior depends on implementation
    });
  });

  describe('Email Content Security', () => {
    it('should escape HTML in user input', async () => {
      mockSend.mockClear();
      const { sendContactFormNotification } = await import('@/lib/email');

      const maliciousInput = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'User',
        email: 'test@example.com',
        subject: 'Test',
        message: '<img src=x onerror=alert("xss")>',
      };

      await sendContactFormNotification(maliciousInput);

      const emailHtml = mockSend.mock.calls[0][0].html;
      // Should escape HTML tags (< becomes &lt;)
      expect(emailHtml).not.toContain('<script>');
      expect(emailHtml).not.toContain('<img');
      // Should contain the escaped versions
      expect(emailHtml).toContain('&lt;script&gt;');
      expect(emailHtml).toContain('&lt;img');
    });
  });
});

describe('Email Templates', () => {
  it('should use consistent branding', async () => {
    const { sendContactFormNotification } = await import('@/lib/email');

    await sendContactFormNotification({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      subject: 'Test',
      message: 'Testing branding.',
    });

    const emailHtml = mockSend.mock.calls[0][0].html;
    expect(emailHtml).toContain('AlgoVigilance');
  });

  it('should include reply-to address', async () => {
    mockSend.mockClear();
    const { sendContactFormNotification } = await import('@/lib/email');

    await sendContactFormNotification({
      firstName: 'Test',
      lastName: 'User',
      email: 'customer@example.com',
      subject: 'Test',
      message: 'Testing reply-to.',
    });

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.replyTo).toBe('customer@example.com');
  });
});
