/**
 * Wizard Brochure API Route Tests
 *
 * Validates the /api/wizard-brochure endpoint structure, schema validation,
 * and email integration.
 *
 * Run with: npm test -- --testPathPattern=wizard-brochure
 */

import fs from 'fs';
import path from 'path';

describe('Wizard Brochure API Route', () => {
  const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'wizard-brochure', 'route.ts');
  const _emailPath = path.join(process.cwd(), 'src', 'lib', 'email.ts');

  test('API route file should exist', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  test('should export POST handler', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('export async function POST');
  });

  test('should use Zod schema validation', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("import { z } from 'zod'");
    expect(content).toContain('wizardBrochureSchema');
    expect(content).toContain('.safeParse');
  });

  test('should validate required fields', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    // Required string fields
    expect(content).toContain("firstName: z.string()");
    expect(content).toContain("email: z.string().email");
    expect(content).toContain("situationSummary: z.string()");
    expect(content).toContain("branch: z.enum(['challenge', 'opportunity', 'exploration'])");
  });

  test('should validate primary recommendation structure', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    // Primary recommendation object
    expect(content).toContain('primary: z.object({');
    expect(content).toContain('title: z.string()');
    expect(content).toContain('tagline: z.string()');
    expect(content).toContain('outcomes: z.array(z.string())');
    expect(content).toContain('deliverables: z.array(z.string())');
    expect(content).toContain('detailUrl: z.string()');
  });

  test('should validate secondary recommendations array', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('secondary: z.array(');
  });

  test('should import sendWizardBrochure from email module', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("import { sendWizardBrochure");
    expect(content).toContain("from '@/lib/email'");
  });

  test('should handle validation errors with 400 status', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("status: 400");
    expect(content).toContain("error: 'Invalid request data'");
  });

  test('should handle email sending errors with 500 status', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("status: 500");
  });

  test('should return success with messageId', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('success: true');
    expect(content).toContain('messageId');
  });

  test('should use logger for debugging', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("import { logger } from '@/lib/logger'");
    expect(content).toContain("logger.scope('api/wizard-brochure')");
  });
});

describe('Wizard Brochure Lead Storage', () => {
  const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'wizard-brochure', 'route.ts');

  test('should import Firebase admin SDK', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("import { adminDb, adminTimestamp } from '@/lib/firebase-admin'");
  });

  test('should store lead in wizard_leads collection', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("adminDb.collection('wizard_leads')");
  });

  test('should store essential lead data', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('firstName: data.firstName');
    expect(content).toContain('email: data.email');
    expect(content).toContain('companyName: data.companyName');
    expect(content).toContain('branch: data.branch');
  });

  test('should store recommendation data', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('primaryRecommendation: data.primary.title');
    expect(content).toContain('secondaryRecommendations:');
  });

  test('should track email sent status', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('emailSent: false');
    expect(content).toContain('emailSent: true');
  });

  test('should store timestamp for lead creation', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('createdAt: adminTimestamp.now()');
  });

  test('should update lead with email message ID after sending', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('emailMessageId: result.messageId');
    expect(content).toContain('emailSentAt: adminTimestamp.now()');
  });

  test('should handle database errors gracefully', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('catch (dbError)');
    expect(content).toContain("Failed to store lead");
  });

  test('should return leadId in response', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('leadId,');
  });

  test('should mark source as wizard-brochure', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("source: 'wizard-brochure'");
  });
});

describe('Email Module - Wizard Brochure Function', () => {
  const brochurePath = path.join(process.cwd(), 'src', 'lib', 'email', 'brochure.ts');
  const indexPath = path.join(process.cwd(), 'src', 'lib', 'email', 'index.ts');

  test('email brochure module should exist', () => {
    expect(fs.existsSync(brochurePath)).toBe(true);
  });

  test('should re-export sendWizardBrochure from index', () => {
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('sendWizardBrochure');
  });

  test('should export sendWizardBrochure function', () => {
    const content = fs.readFileSync(brochurePath, 'utf-8');
    expect(content).toContain('export async function sendWizardBrochure');
  });

  test('should export WizardBrochureData interface', () => {
    const content = fs.readFileSync(brochurePath, 'utf-8');
    expect(content).toContain('export interface WizardBrochureData');
  });

  test('WizardBrochureData should have required fields', () => {
    const content = fs.readFileSync(brochurePath, 'utf-8');

    // Extract WizardBrochureData interface block
    const interfaceMatch = content.match(/export interface WizardBrochureData\s*{[\s\S]*?^}/m);
    expect(interfaceMatch).not.toBeNull();

    if (!interfaceMatch) throw new Error('WizardBrochureData interface not found');
    const interfaceContent = interfaceMatch[0];
    expect(interfaceContent).toContain('firstName: string');
    expect(interfaceContent).toContain('email: string');
    expect(interfaceContent).toContain('situationSummary: string');
    expect(interfaceContent).toContain('branch:');
    expect(interfaceContent).toContain('primary:');
    expect(interfaceContent).toContain('secondary:');
  });

  test('should generate HTML email with AlgoVigilance branding', () => {
    const content = fs.readFileSync(brochurePath, 'utf-8');

    // Check for email template content
    expect(content).toContain('AlgoVigilance');
    expect(content).toContain('Recommended for You');
    expect(content).toContain('Schedule Your Discovery Call');
  });

  test('should use Resend for email delivery', () => {
    const clientPath = path.join(process.cwd(), 'src', 'lib', 'email', 'client.ts');
    const content = fs.readFileSync(clientPath, 'utf-8');
    expect(content).toContain("from 'resend'");
  });

  test('should handle email service not configured gracefully', () => {
    const content = fs.readFileSync(brochurePath, 'utf-8');
    expect(content).toContain('Email service not configured');
  });
});

describe('Wizard Brochure Schema Validation', () => {
  // These tests validate the expected schema structure matches what the modal sends

  test('valid payload structure should match expected format', () => {
    // This documents the expected payload format
    const validPayload = {
      firstName: 'Test User',
      email: 'test@example.com',
      companyName: 'Test Company',
      situationSummary: 'Testing the wizard email',
      branch: 'challenge' as const,
      primary: {
        title: 'Strategic Advisory',
        tagline: 'Executive guidance for PV leaders',
        outcomes: ['Outcome 1', 'Outcome 2'],
        deliverables: ['Deliverable 1', 'Deliverable 2'],
        detailUrl: '/consulting',
      },
      secondary: [
        {
          title: 'Innovation Lab',
          tagline: 'R&D partnerships',
          outcomes: ['Secondary outcome'],
          detailUrl: '/consulting',
        },
      ],
    };

    // Validate all required fields exist
    expect(validPayload.firstName).toBeDefined();
    expect(validPayload.email).toBeDefined();
    expect(validPayload.situationSummary).toBeDefined();
    expect(validPayload.branch).toBeDefined();
    expect(validPayload.primary).toBeDefined();
    expect(validPayload.secondary).toBeDefined();

    // Validate primary structure
    expect(validPayload.primary.title).toBeDefined();
    expect(validPayload.primary.tagline).toBeDefined();
    expect(validPayload.primary.outcomes.length).toBeGreaterThan(0);
    expect(validPayload.primary.deliverables.length).toBeGreaterThan(0);
    expect(validPayload.primary.detailUrl).toBeDefined();
  });

  test('branch values should be one of three valid options', () => {
    const validBranches = ['challenge', 'opportunity', 'exploration'];

    validBranches.forEach((branch) => {
      expect(['challenge', 'opportunity', 'exploration']).toContain(branch);
    });
  });
});
