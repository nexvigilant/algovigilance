/**
 * Waitlist Schema Unit Tests
 *
 * Fast, isolated tests for waitlist form validation.
 * No mocking required - pure Zod schema validation.
 */

import { describe, it, expect } from '@jest/globals';
import { WaitlistSchema } from '@/lib/schemas/waitlist';

describe('WaitlistSchema', () => {
  describe('Valid submissions', () => {
    it('should accept valid email', () => {
      const result = WaitlistSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('should accept email with subdomain', () => {
      const result = WaitlistSchema.safeParse({ email: 'user@mail.company.com' });
      expect(result.success).toBe(true);
    });

    it('should accept email with plus sign', () => {
      const result = WaitlistSchema.safeParse({ email: 'user+tag@example.com' });
      expect(result.success).toBe(true);
    });

    it('should accept email with dots in local part', () => {
      const result = WaitlistSchema.safeParse({ email: 'first.last@example.com' });
      expect(result.success).toBe(true);
    });

    it('should accept international TLDs', () => {
      const validEmails = [
        'user@example.co.uk',
        'user@example.com.au',
        'user@example.org',
        'user@example.io',
      ];
      validEmails.forEach(email => {
        const result = WaitlistSchema.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Invalid email formats', () => {
    it('should reject missing email', () => {
      const result = WaitlistSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = WaitlistSchema.safeParse({ email: '' });
      expect(result.success).toBe(false);
    });

    it('should reject email without @ symbol', () => {
      const result = WaitlistSchema.safeParse({ email: 'notanemail.com' });
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = WaitlistSchema.safeParse({ email: 'test@' });
      expect(result.success).toBe(false);
    });

    it('should reject email without local part', () => {
      const result = WaitlistSchema.safeParse({ email: '@example.com' });
      expect(result.success).toBe(false);
    });

    it('should reject email with spaces', () => {
      const result = WaitlistSchema.safeParse({ email: 'test @example.com' });
      expect(result.success).toBe(false);
    });

    it('should reject plain text', () => {
      const result = WaitlistSchema.safeParse({ email: 'just some text' });
      expect(result.success).toBe(false);
    });

    it('should reject email with multiple @ symbols', () => {
      const result = WaitlistSchema.safeParse({ email: 'test@@example.com' });
      expect(result.success).toBe(false);
    });
  });

  describe('Error messages', () => {
    it('should return custom error message for invalid email', () => {
      const result = WaitlistSchema.safeParse({ email: 'invalid' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle very long email addresses', () => {
      const longLocalPart = 'a'.repeat(64); // Max local part length
      const result = WaitlistSchema.safeParse({ email: `${longLocalPart}@example.com` });
      expect(result.success).toBe(true);
    });

    it('should handle numeric email addresses', () => {
      const result = WaitlistSchema.safeParse({ email: '12345@example.com' });
      expect(result.success).toBe(true);
    });

    it('should handle email with hyphen in domain', () => {
      const result = WaitlistSchema.safeParse({ email: 'user@my-company.com' });
      expect(result.success).toBe(true);
    });
  });
});
