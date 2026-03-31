/**
 * Security Utilities
 *
 * Security-related functions including audit logging, input validation,
 * and sanitization utilities.
 *
 * @module lib/security
 */

// Audit Logging
export {
  logSecurityEvent,
  getRecentSecurityEvents,
  getSecurityEventCounts,
  type SecurityEventType,
  type SecurityEvent,
} from './audit-log';

// Input Validation & Sanitization
export {
  sanitizeHtml,
  sanitizeText,
  validateUserInput,
  secureSchemas,
  isValidFirebaseUid,
  isValidDocumentId,
} from './validation';
