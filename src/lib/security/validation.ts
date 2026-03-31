import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

import { logger } from '@/lib/logger';
const log = logger.scope('security/validation');

/**
 * Sanitize HTML content (XSS prevention)
 *
 * Allows safe formatting tags only.
 *
 * @param dirty - Potentially dangerous HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text (remove all HTML)
 *
 * @param dirty - Potentially dangerous string
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Injection patterns to detect and block
 */
const INJECTION_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onerror=, etc.
  /data:\s*text\/html/i,
  /vbscript:/i,
  /expression\s*\(/i, // CSS expression
  /url\s*\(\s*['"]?\s*data:/i, // CSS data URLs
];

/**
 * Validate and sanitize user input
 *
 * @param input - User input to validate
 * @param maxLength - Maximum allowed length
 * @returns Validation result with sanitized value
 */
export function validateUserInput(
  input: unknown,
  maxLength = 10000
): { valid: boolean; sanitized: string; error?: string } {
  if (typeof input !== 'string') {
    return { valid: false, sanitized: '', error: 'Input must be a string' };
  }

  if (input.length > maxLength) {
    return {
      valid: false,
      sanitized: '',
      error: `Input exceeds ${maxLength} characters`,
    };
  }

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      log.warn(`[SECURITY] Injection attempt detected: ${pattern}`);
      return { valid: false, sanitized: '', error: 'Invalid input detected' };
    }
  }

  const sanitized = sanitizeText(input);
  return { valid: true, sanitized };
}

/**
 * Secure Zod schemas for common input types
 */
export const secureSchemas = {
  /**
   * Email validation with normalization
   */
  email: z.string().email().max(254).toLowerCase().trim(),

  /**
   * Username with strict character set
   */
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),

  /**
   * Strong password requirements
   */
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),

  /**
   * Display name with sanitization
   */
  displayName: z
    .string()
    .min(2)
    .max(50)
    .transform(s => sanitizeText(s)),

  /**
   * Bio/description with safe HTML
   */
  bio: z
    .string()
    .max(500)
    .transform(s => sanitizeHtml(s)),

  /**
   * HTTPS-only URL validation
   */
  url: z
    .string()
    .url()
    .refine(url => url.startsWith('https://'), 'URL must use HTTPS'),

  /**
   * Safe slug for URLs
   */
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
};

/**
 * Validate that a string looks like a valid Firebase UID
 */
export function isValidFirebaseUid(uid: unknown): uid is string {
  if (typeof uid !== 'string') return false;
  // Firebase UIDs are typically 28 characters, alphanumeric
  return /^[a-zA-Z0-9]{20,128}$/.test(uid);
}

/**
 * Validate that a string looks like a valid Firestore document ID
 */
export function isValidDocumentId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  // Firestore document IDs are typically 20 characters
  return /^[a-zA-Z0-9]{1,1500}$/.test(id);
}
