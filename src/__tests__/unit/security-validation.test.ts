/**
 * Security Validation Unit Tests
 *
 * Tests XSS prevention, injection pattern detection, and secure Zod schemas.
 * These are critical security functions that protect against attacks.
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeHtml,
  sanitizeText,
  validateUserInput,
  secureSchemas,
  isValidFirebaseUid,
  isValidDocumentId,
} from '@/lib/security/validation';

describe('Security Validation', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe formatting tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<p>Hello <strong>world</strong>!</p>');
    });

    it('should allow links with href', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('href="https://example.com"');
    });

    it('should allow lists', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
    });

    it('should allow code blocks', () => {
      const input = '<pre><code>const x = 1;</code></pre>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<pre><code>const x = 1;</code></pre>');
    });

    it('should strip script tags (XSS prevention)', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });

    it('should strip onclick handlers (XSS prevention)', () => {
      const input = '<button onclick="alert(\'XSS\')">Click</button>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('should strip onerror handlers (XSS prevention)', () => {
      const input = '<img src="x" onerror="alert(\'XSS\')">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onerror');
    });

    it('should strip javascript: URLs (XSS prevention)', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should strip data attributes', () => {
      const input = '<div data-malicious="payload">Content</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('data-malicious');
    });

    it('should strip disallowed tags', () => {
      const input = '<div><span><iframe src="evil.com"></iframe></span></div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('iframe');
      expect(result).not.toContain('div');
      expect(result).not.toContain('span');
    });

    it('should handle empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should handle plain text (no HTML)', () => {
      const input = 'Just plain text';
      expect(sanitizeHtml(input)).toBe('Just plain text');
    });
  });

  describe('sanitizeText', () => {
    it('should strip all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitizeText(input);
      expect(result).toBe('Hello world!');
    });

    it('should handle nested tags', () => {
      const input = '<div><p><span>Nested</span></p></div>';
      const result = sanitizeText(input);
      expect(result).toBe('Nested');
    });

    it('should handle malicious scripts', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeText(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
      expect(result).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should preserve plain text', () => {
      const input = 'Just plain text';
      expect(sanitizeText(input)).toBe('Just plain text');
    });

    it('should preserve HTML entities (security: no decoding)', () => {
      // DOMPurify preserves encoded entities - this is secure behavior
      // as it prevents double-encoding attacks
      const input = '&lt;script&gt;';
      const result = sanitizeText(input);
      expect(result).toBe('&lt;script&gt;');
    });
  });

  describe('validateUserInput', () => {
    it('should accept valid string input', () => {
      const result = validateUserInput('Hello, world!');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello, world!');
      expect(result.error).toBeUndefined();
    });

    it('should reject non-string input', () => {
      expect(validateUserInput(123).valid).toBe(false);
      expect(validateUserInput(null).valid).toBe(false);
      expect(validateUserInput(undefined).valid).toBe(false);
      expect(validateUserInput({}).valid).toBe(false);
      expect(validateUserInput([]).valid).toBe(false);
    });

    it('should reject input exceeding max length', () => {
      const longInput = 'a'.repeat(10001);
      const result = validateUserInput(longInput);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10000');
    });

    it('should respect custom max length', () => {
      const input = 'a'.repeat(101);
      const result = validateUserInput(input, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('100');
    });

    it('should detect script injection', () => {
      const result = validateUserInput('<script>alert("XSS")</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid input detected');
    });

    it('should detect javascript: protocol', () => {
      const result = validateUserInput('javascript:alert("XSS")');
      expect(result.valid).toBe(false);
    });

    it('should detect onclick handler', () => {
      const result = validateUserInput('onclick=alert("XSS")');
      expect(result.valid).toBe(false);
    });

    it('should detect onerror handler', () => {
      const result = validateUserInput('onerror=alert("XSS")');
      expect(result.valid).toBe(false);
    });

    it('should detect onload handler', () => {
      const result = validateUserInput('onload=malicious()');
      expect(result.valid).toBe(false);
    });

    it('should detect data:text/html injection', () => {
      const result = validateUserInput('data: text/html,<script>');
      expect(result.valid).toBe(false);
    });

    it('should detect vbscript: protocol', () => {
      const result = validateUserInput('vbscript:msgbox("XSS")');
      expect(result.valid).toBe(false);
    });

    it('should detect CSS expression', () => {
      const result = validateUserInput('expression(alert("XSS"))');
      expect(result.valid).toBe(false);
    });

    it('should detect CSS data URLs', () => {
      const result = validateUserInput('url("data:text/html,<script>")');
      expect(result.valid).toBe(false);
    });

    it('should sanitize output (strip HTML)', () => {
      const result = validateUserInput('<p>Hello</p>');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello');
    });
  });

  describe('secureSchemas', () => {
    describe('email', () => {
      it('should accept valid email', () => {
        const result = secureSchemas.email.safeParse('Test@Example.com');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('test@example.com'); // normalized to lowercase
        }
      });

      it('should reject email with leading/trailing whitespace', () => {
        // Zod runs transforms AFTER validation, so whitespace causes validation failure
        // This is secure - users must provide clean input
        const result = secureSchemas.email.safeParse('  test@example.com  ');
        expect(result.success).toBe(false);
      });

      it('should reject invalid email', () => {
        expect(secureSchemas.email.safeParse('not-an-email').success).toBe(false);
        expect(secureSchemas.email.safeParse('@example.com').success).toBe(false);
        expect(secureSchemas.email.safeParse('test@').success).toBe(false);
      });

      it('should reject overly long email', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        expect(secureSchemas.email.safeParse(longEmail).success).toBe(false);
      });
    });

    describe('username', () => {
      it('should accept valid username', () => {
        expect(secureSchemas.username.safeParse('john_doe-123').success).toBe(true);
        expect(secureSchemas.username.safeParse('User123').success).toBe(true);
      });

      it('should reject too short username', () => {
        expect(secureSchemas.username.safeParse('ab').success).toBe(false);
      });

      it('should reject too long username', () => {
        expect(secureSchemas.username.safeParse('a'.repeat(31)).success).toBe(false);
      });

      it('should reject special characters', () => {
        expect(secureSchemas.username.safeParse('user@name').success).toBe(false);
        expect(secureSchemas.username.safeParse('user name').success).toBe(false);
        expect(secureSchemas.username.safeParse('user.name').success).toBe(false);
      });
    });

    describe('password', () => {
      it('should accept strong password', () => {
        const result = secureSchemas.password.safeParse('StrongP@ssw0rd!');
        expect(result.success).toBe(true);
      });

      it('should reject short password', () => {
        const result = secureSchemas.password.safeParse('Short1@');
        expect(result.success).toBe(false);
      });

      it('should require uppercase letter', () => {
        const result = secureSchemas.password.safeParse('lowercaseonly1@');
        expect(result.success).toBe(false);
      });

      it('should require lowercase letter', () => {
        const result = secureSchemas.password.safeParse('UPPERCASEONLY1@');
        expect(result.success).toBe(false);
      });

      it('should require number', () => {
        const result = secureSchemas.password.safeParse('NoNumbersHere@');
        expect(result.success).toBe(false);
      });

      it('should require special character', () => {
        const result = secureSchemas.password.safeParse('NoSpecialChar123');
        expect(result.success).toBe(false);
      });
    });

    describe('displayName', () => {
      it('should accept valid display name', () => {
        const result = secureSchemas.displayName.safeParse('John Doe');
        expect(result.success).toBe(true);
      });

      it('should sanitize HTML in display name', () => {
        const result = secureSchemas.displayName.safeParse('<script>alert("XSS")</script>John');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toContain('script');
        }
      });

      it('should reject too short display name', () => {
        expect(secureSchemas.displayName.safeParse('J').success).toBe(false);
      });

      it('should reject too long display name', () => {
        expect(secureSchemas.displayName.safeParse('a'.repeat(51)).success).toBe(false);
      });
    });

    describe('bio', () => {
      it('should accept valid bio with allowed HTML', () => {
        const result = secureSchemas.bio.safeParse('Hello, I am <strong>John</strong>!');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toContain('<strong>');
        }
      });

      it('should sanitize dangerous HTML in bio', () => {
        const result = secureSchemas.bio.safeParse('<script>alert("XSS")</script>Hello');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toContain('script');
          expect(result.data).toBe('Hello');
        }
      });

      it('should reject overly long bio', () => {
        expect(secureSchemas.bio.safeParse('a'.repeat(501)).success).toBe(false);
      });
    });

    describe('url', () => {
      it('should accept HTTPS URL', () => {
        expect(secureSchemas.url.safeParse('https://example.com').success).toBe(true);
      });

      it('should reject HTTP URL', () => {
        expect(secureSchemas.url.safeParse('http://example.com').success).toBe(false);
      });

      it('should reject invalid URL', () => {
        expect(secureSchemas.url.safeParse('not-a-url').success).toBe(false);
      });
    });

    describe('slug', () => {
      it('should accept valid slug', () => {
        expect(secureSchemas.slug.safeParse('my-awesome-post').success).toBe(true);
        expect(secureSchemas.slug.safeParse('post123').success).toBe(true);
      });

      it('should reject uppercase in slug', () => {
        expect(secureSchemas.slug.safeParse('MyPost').success).toBe(false);
      });

      it('should reject spaces in slug', () => {
        expect(secureSchemas.slug.safeParse('my post').success).toBe(false);
      });

      it('should reject special characters in slug', () => {
        expect(secureSchemas.slug.safeParse('my_post').success).toBe(false);
        expect(secureSchemas.slug.safeParse('my.post').success).toBe(false);
      });

      it('should reject empty slug', () => {
        expect(secureSchemas.slug.safeParse('').success).toBe(false);
      });

      it('should reject too long slug', () => {
        expect(secureSchemas.slug.safeParse('a'.repeat(101)).success).toBe(false);
      });
    });
  });

  describe('isValidFirebaseUid', () => {
    it('should accept valid Firebase UID', () => {
      expect(isValidFirebaseUid('abc123XYZ456def789GHI012')).toBe(true);
      expect(isValidFirebaseUid('a'.repeat(28))).toBe(true);
    });

    it('should reject non-string', () => {
      expect(isValidFirebaseUid(123)).toBe(false);
      expect(isValidFirebaseUid(null)).toBe(false);
      expect(isValidFirebaseUid(undefined)).toBe(false);
      expect(isValidFirebaseUid({})).toBe(false);
    });

    it('should reject too short UID', () => {
      expect(isValidFirebaseUid('short')).toBe(false);
    });

    it('should reject too long UID', () => {
      expect(isValidFirebaseUid('a'.repeat(129))).toBe(false);
    });

    it('should reject special characters', () => {
      expect(isValidFirebaseUid('abc-123_XYZ')).toBe(false);
      expect(isValidFirebaseUid('abc@123.xyz')).toBe(false);
    });
  });

  describe('isValidDocumentId', () => {
    it('should accept valid document ID', () => {
      expect(isValidDocumentId('abc123')).toBe(true);
      expect(isValidDocumentId('A1b2C3d4')).toBe(true);
    });

    it('should reject non-string', () => {
      expect(isValidDocumentId(123)).toBe(false);
      expect(isValidDocumentId(null)).toBe(false);
      expect(isValidDocumentId(undefined)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidDocumentId('')).toBe(false);
    });

    it('should reject too long document ID', () => {
      expect(isValidDocumentId('a'.repeat(1501))).toBe(false);
    });

    it('should reject special characters', () => {
      expect(isValidDocumentId('doc-id')).toBe(false);
      expect(isValidDocumentId('doc_id')).toBe(false);
      expect(isValidDocumentId('doc.id')).toBe(false);
    });
  });
});
