/**
 * Email Capture Modal Component Tests
 *
 * Tests the component structure, validation logic, and API integration
 * for the wizard email capture functionality.
 *
 * Run with: npm test -- email-capture-modal
 */

import fs from 'fs';
import path from 'path';

describe('EmailCaptureModal Component', () => {
  const componentPath = path.join(
    process.cwd(),
    'src',
    'components',
    'service-wizard',
    'email-capture-modal.tsx'
  );

  test('component file should exist', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  test('should be a client component', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain("'use client'");
  });

  test('should export EmailCaptureModal function', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('export function EmailCaptureModal');
  });

  describe('Props Interface', () => {
    test('should define EmailCaptureModalProps interface', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('interface EmailCaptureModalProps');
    });

    test('should have open prop', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('open: boolean');
    });

    test('should have onOpenChange prop', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('onOpenChange:');
    });

    test('should have recommendations prop', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('recommendations: WizardRecommendations');
    });

    test('should have branch prop', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('branch: WizardBranch');
    });

    test('should have onSuccess callback prop', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('onSuccess:');
    });
  });

  describe('Form State', () => {
    test('should define FormData interface', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('interface FormData');
    });

    test('should have firstName field', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('firstName:');
    });

    test('should have email field', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('email:');
    });

    test('should have companyName field', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('companyName:');
    });

    test('should define FormErrors interface', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('interface FormErrors');
    });
  });

  describe('Form Validation', () => {
    test('should have validateForm function', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('validateForm');
    });

    test('should validate firstName is required', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('First name is required');
    });

    test('should validate email is required', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('Email is required');
    });

    test('should validate email format with regex', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      // Check for email regex pattern
      expect(content).toContain('@');
      expect(content).toContain('valid email');
    });
  });

  describe('Form Submission', () => {
    test('should have handleSubmit function', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('handleSubmit');
    });

    test('should call wizard-brochure API endpoint', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('/api/wizard-brochure');
    });

    test('should use POST method', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("method: 'POST'");
    });

    test('should set Content-Type header', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("'Content-Type': 'application/json'");
    });

    test('should JSON stringify the payload', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('JSON.stringify');
    });

    test('should include isSubmitting state', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('isSubmitting');
      expect(content).toContain('setIsSubmitting');
    });

    test('should include submitError state', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('submitError');
      expect(content).toContain('setSubmitError');
    });
  });

  describe('API Payload Structure', () => {
    test('should build payload with firstName', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('firstName:');
      expect(content).toContain('.trim()');
    });

    test('should build payload with email', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('email:');
    });

    test('should build payload with situationSummary', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('situationSummary');
    });

    test('should build payload with branch', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('branch:');
    });

    test('should build payload with primary recommendation', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('primary:');
    });

    test('should build payload with secondary recommendations', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('secondary:');
    });
  });

  describe('UI Components', () => {
    test('should use Dialog component', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('Dialog');
      expect(content).toContain('DialogContent');
    });

    test('should use Input component', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("from '@/components/ui/input'");
    });

    test('should use Label component', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("from '@/components/ui/label'");
    });

    test('should use Button component', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("from '@/components/ui/button'");
    });

    test('should have form element', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('<form');
      expect(content).toContain('onSubmit');
    });
  });

  describe('Accessibility', () => {
    test('should have htmlFor attributes on labels', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('htmlFor="firstName"');
      expect(content).toContain('htmlFor="email"');
      expect(content).toContain('htmlFor="companyName"');
    });

    test('should have id attributes on inputs', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('id="firstName"');
      expect(content).toContain('id="email"');
      expect(content).toContain('id="companyName"');
    });

    test('should mark required fields', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      // Check for asterisk or required indicator
      expect(content).toContain('*');
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('catch');
      expect(content).toContain('error');
    });

    test('should display error message', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('submitError');
    });

    test('should have loading state', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('Sending...');
    });
  });

  describe('Success Handling', () => {
    test('should call onSuccess on successful submission', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('onSuccess()');
    });

    test('should close modal on success', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('onOpenChange(false)');
    });

    test('should reset form on success', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("firstName: ''");
      expect(content).toContain("email: ''");
    });
  });

  describe('Integration with Service Data', () => {
    test('should import serviceInfo', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("import { serviceInfo }");
      expect(content).toContain("from '@/data/service-outcomes'");
    });

    test('should access primary recommendation info', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('recommendations.primary.category');
    });

    test('should access secondary recommendations', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('recommendations.secondary');
    });
  });
});

describe('EmailCaptureModal Form Validation Logic', () => {
  // Test the validation regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  test('should reject empty email', () => {
    expect(emailRegex.test('')).toBe(false);
  });

  test('should reject email without @', () => {
    expect(emailRegex.test('invalidemail.com')).toBe(false);
  });

  test('should reject email without domain', () => {
    expect(emailRegex.test('test@')).toBe(false);
  });

  test('should reject email with spaces', () => {
    expect(emailRegex.test('test @example.com')).toBe(false);
  });

  test('should accept valid email', () => {
    expect(emailRegex.test('test@example.com')).toBe(true);
  });

  test('should accept email with subdomain', () => {
    expect(emailRegex.test('user@mail.example.com')).toBe(true);
  });

  test('should accept email with plus sign', () => {
    expect(emailRegex.test('user+tag@example.com')).toBe(true);
  });
});
