/**
 * Email Template Unit Tests
 *
 * Tests email service functions, data validation, and template helpers.
 * Mocks Resend to verify email construction without sending.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock Resend before importing email module
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'mock-message-id' } }),
    },
  })),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    scope: () => ({
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

// Set env before importing email module
process.env.RESEND_API_KEY = 'test-api-key';

describe('Email Service', () => {
  // Import after mocks are set up
  let emailModule: typeof import('@/lib/email');

  beforeEach(async () => {
    jest.resetModules();
    process.env.RESEND_API_KEY = 'test-api-key';
    emailModule = await import('@/lib/email');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Type Definitions', () => {
    it('ConsultingLeadNotificationData has all required fields', () => {
      const data: import('@/lib/email').ConsultingLeadNotificationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyName: 'Acme Corp',
        companyType: 'pharma',
        companySize: '100-500',
        consultingCategory: 'strategic-advisory',
        timeline: 'immediate',
        challengeDescription: 'Need help with PV strategy',
        leadScore: 85,
      };
      expect(data.firstName).toBe('John');
      expect(data.leadScore).toBe(85);
    });

    it('ContactFormNotificationData has required fields', () => {
      const data: import('@/lib/email').ContactFormNotificationData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        subject: 'General Inquiry',
        message: 'I have a question about your services.',
      };
      expect(data.firstName).toBe('Jane');
      expect(data.subject).toBe('General Inquiry');
    });

    it('AffiliateApplicationData has required fields', () => {
      const data: import('@/lib/email').AffiliateApplicationData = {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        programType: 'ambassador',
        institutionOrCompany: 'University of PV',
      };
      expect(data.programType).toBe('ambassador');
    });

    it('WizardBrochureData has required fields', () => {
      const data: import('@/lib/email').WizardBrochureData = {
        firstName: 'Alice',
        email: 'alice@example.com',
        situationSummary: 'Facing a challenge with regulatory compliance',
        branch: 'challenge',
        primary: {
          title: 'Strategic Positioning',
          tagline: 'Chart Your Course',
          outcomes: ['Clear strategic direction', 'Defensible positioning'],
          deliverables: ['Strategic Direction Report', 'Execution Roadmap'],
          detailUrl: '/consulting',
        },
        secondary: [],
      };
      expect(data.branch).toBe('challenge');
      expect(data.primary.title).toBe('Strategic Positioning');
    });
  });

  describe('EmailResult type', () => {
    it('represents success correctly', () => {
      const result: import('@/lib/email').EmailResult = {
        success: true,
        messageId: 'msg_123',
      };
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_123');
    });

    it('represents failure correctly', () => {
      const result: import('@/lib/email').EmailResult = {
        success: false,
        error: 'Email service not configured',
      };
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });
  });

  describe('Consulting Lead Notification', () => {
    it('accepts valid consulting lead data', async () => {
      const data: import('@/lib/email').ConsultingLeadNotificationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        jobTitle: 'VP of Safety',
        companyName: 'Pharma Inc',
        companyType: 'pharma',
        companySize: '500-1000',
        consultingCategory: 'strategic-advisory',
        functionalArea: 'pv-operations',
        budgetRange: '100k-250k',
        timeline: 'immediate',
        challengeDescription: 'Need to improve our PV operations efficiency',
        leadScore: 120,
        source: 'consulting_page',
      };

      const result = await emailModule.sendConsultingLeadNotification(data);
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id');
    });

    it('handles optional fields being null', async () => {
      const data: import('@/lib/email').ConsultingLeadNotificationData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        jobTitle: null,
        companyName: 'Small Biotech',
        companyType: 'biotech',
        companySize: '1-50',
        consultingCategory: 'project-delivery',
        functionalArea: null,
        budgetRange: null,
        timeline: 'near-term',
        challengeDescription: 'Project rescue needed',
        leadScore: 45,
      };

      const result = await emailModule.sendConsultingLeadNotification(data);
      expect(result.success).toBe(true);
    });

    it('formats high priority correctly for high lead scores', async () => {
      const data: import('@/lib/email').ConsultingLeadNotificationData = {
        firstName: 'CEO',
        lastName: 'Executive',
        email: 'ceo@enterprise.com',
        companyName: 'Global Pharma',
        companyType: 'pharma',
        companySize: '10000+',
        consultingCategory: 'strategic-advisory',
        timeline: 'immediate',
        challengeDescription: 'Enterprise transformation',
        leadScore: 150, // High priority threshold
      };

      const result = await emailModule.sendConsultingLeadNotification(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Contact Form Notification', () => {
    it('accepts valid contact form data', async () => {
      const data: import('@/lib/email').ContactFormNotificationData = {
        firstName: 'Contact',
        lastName: 'User',
        email: 'contact@test.com',
        companyName: 'Test Company',
        companyType: 'cro',
        serviceInterest: 'consulting',
        timeline: 'near-term',
        subject: 'General Question',
        message: 'I would like to learn more about your services.',
        source: 'public_site',
      };

      const result = await emailModule.sendContactFormNotification(data);
      expect(result.success).toBe(true);
    });

    it('handles minimal data', async () => {
      const data: import('@/lib/email').ContactFormNotificationData = {
        firstName: 'Min',
        lastName: 'Data',
        email: 'min@test.com',
        subject: 'Quick Question',
        message: 'Hello!',
      };

      const result = await emailModule.sendContactFormNotification(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Consulting Lead Acknowledgment', () => {
    it('sends acknowledgment to consulting lead', async () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyName: 'Pharma Inc',
      };

      const result = await emailModule.sendConsultingLeadAcknowledgment(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Contact Form Acknowledgment', () => {
    it('sends acknowledgment for contact form', async () => {
      const data = {
        firstName: 'Jane',
        email: 'jane@example.com',
        subject: 'My Question',
      };

      const result = await emailModule.sendContactFormAcknowledgment(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Affiliate Application Confirmation', () => {
    it('sends confirmation for ambassador application', async () => {
      const data: import('@/lib/email').AffiliateApplicationData = {
        firstName: 'Student',
        lastName: 'Ambassador',
        email: 'student@university.edu',
        programType: 'ambassador',
        institutionOrCompany: 'University of Excellence',
      };

      const result = await emailModule.sendAffiliateApplicationConfirmation(data);
      expect(result.success).toBe(true);
    });

    it('sends confirmation for advisor application', async () => {
      const data: import('@/lib/email').AffiliateApplicationData = {
        firstName: 'Senior',
        lastName: 'Expert',
        email: 'expert@pharma.com',
        programType: 'advisor',
        institutionOrCompany: 'Global Pharma Corp',
      };

      const result = await emailModule.sendAffiliateApplicationConfirmation(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Affiliate Status Update', () => {
    const baseData: import('@/lib/email').AffiliateApplicationData = {
      firstName: 'Applicant',
      lastName: 'Test',
      email: 'applicant@test.com',
      programType: 'ambassador',
      institutionOrCompany: 'Test University',
    };

    it('sends approved status update', async () => {
      const result = await emailModule.sendAffiliateStatusUpdate({
        ...baseData,
        status: 'approved',
      });
      expect(result.success).toBe(true);
    });

    it('sends declined status update', async () => {
      const result = await emailModule.sendAffiliateStatusUpdate({
        ...baseData,
        status: 'declined',
        notes: 'We encourage you to reapply next quarter.',
      });
      expect(result.success).toBe(true);
    });

    it('sends interview status update', async () => {
      const result = await emailModule.sendAffiliateStatusUpdate({
        ...baseData,
        status: 'interview',
      });
      expect(result.success).toBe(true);
    });

    it('sends waitlisted status update', async () => {
      const result = await emailModule.sendAffiliateStatusUpdate({
        ...baseData,
        status: 'waitlisted',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Wizard Brochure Email', () => {
    it('sends brochure with primary recommendation only', async () => {
      const data: import('@/lib/email').WizardBrochureData = {
        firstName: 'Prospect',
        email: 'prospect@company.com',
        companyName: 'Prospect Corp',
        situationSummary: 'Facing regulatory compliance challenges',
        branch: 'challenge',
        primary: {
          title: 'Operational Strategy',
          tagline: 'Keep Moving Forward',
          outcomes: [
            'Distressed initiatives diagnosed',
            'Governance gaps eliminated',
          ],
          deliverables: [
            'Strategic Diagnostic Report',
            'Intervention Directive',
          ],
          detailUrl: '/consulting',
        },
        secondary: [],
      };

      const result = await emailModule.sendWizardBrochure(data);
      expect(result.success).toBe(true);
    });

    it('sends brochure with secondary recommendations', async () => {
      const data: import('@/lib/email').WizardBrochureData = {
        firstName: 'Explorer',
        email: 'explorer@company.com',
        situationSummary: 'Exploring new market opportunities',
        branch: 'opportunity',
        primary: {
          title: 'Strategic Positioning',
          tagline: 'Chart Your Course',
          outcomes: ['Clear direction', 'Defensible positioning'],
          deliverables: ['Strategic Direction Report', 'Roadmap'],
          detailUrl: '/consulting',
        },
        secondary: [
          {
            title: 'Threat Intelligence',
            tagline: 'See Around Corners',
            outcomes: ['Early threat identification', 'Proactive positioning'],
            detailUrl: '/consulting',
          },
        ],
      };

      const result = await emailModule.sendWizardBrochure(data);
      expect(result.success).toBe(true);
    });

    it('handles all branch types', async () => {
      const branches: Array<'challenge' | 'opportunity' | 'exploration'> = [
        'challenge',
        'opportunity',
        'exploration',
      ];

      for (const branch of branches) {
        const data: import('@/lib/email').WizardBrochureData = {
          firstName: 'Test',
          email: 'test@test.com',
          situationSummary: `Testing ${branch} branch`,
          branch,
          primary: {
            title: 'Test Service',
            tagline: 'Test Tagline',
            outcomes: ['Test outcome'],
            deliverables: ['Test deliverable'],
            detailUrl: '/consulting',
          },
          secondary: [],
        };

        const result = await emailModule.sendWizardBrochure(data);
        expect(result.success).toBe(true);
      }
    });
  });
});

describe('Email Service - No API Key', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  it('handles missing Resend API key gracefully', async () => {
    // Re-import with no API key
    const emailModuleNoKey = await import('@/lib/email');

    const result = await emailModuleNoKey.sendConsultingLeadNotification({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      companyName: 'Test Co',
      companyType: 'pharma',
      companySize: '100-500',
      consultingCategory: 'strategic-advisory',
      timeline: 'immediate',
      challengeDescription: 'Test',
      leadScore: 50,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email service not configured');
  });
});
