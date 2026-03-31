/**
 * Email Client Configuration
 *
 * Shared email client, configuration, and utility functions.
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';

export const log = logger.scope('lib/email');

// Initialize Resend client (will be undefined if API key not set)
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Email configuration
export const EMAIL_CONFIG = {
  from: 'AlgoVigilance <notifications@nexvigilant.com>',
  replyTo: 'matthew@nexvigilant.com',
  adminEmail: 'matthew@nexvigilant.com',
};

// ============================================================================
// Types
// ============================================================================

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * Format budget range for display
 */
export function formatBudget(value: string): string {
  const budgets: Record<string, string> = {
    'under-25k': 'Under $25K',
    '25k-50k': '$25K - $50K',
    '50k-100k': '$50K - $100K',
    '100k-250k': '$100K - $250K',
    '250k-500k': '$250K - $500K',
    'over-500k': 'Over $500K',
    'not-sure': 'To Be Determined',
  };
  return budgets[value] || value;
}

/**
 * Format company type for display
 */
export function formatCompanyType(value: string): string {
  const types: Record<string, string> = {
    pharmaceutical: 'Pharmaceutical',
    biotech: 'Biotech',
    cro: 'CRO',
    healthcare: 'Healthcare',
    'medical-device': 'Medical Device',
    consulting: 'Consulting',
    other: 'Other',
  };
  return types[value] || value;
}

/**
 * Format company size for display
 */
export function formatCompanySize(value: string): string {
  const sizes: Record<string, string> = {
    '1-50': '1-50 employees',
    '51-200': '51-200 employees',
    '201-500': '201-500 employees',
    '501-1000': '501-1000 employees',
    '1001-5000': '1001-5000 employees',
    '5000+': '5000+ employees',
  };
  return sizes[value] || value;
}

/**
 * Format consulting category for display
 */
export function formatConsultingCategory(value: string): string {
  const categories: Record<string, string> = {
    strategic: 'Strategic Advisory',
    innovation: 'Innovation & Transformation',
    ld: 'Learning & Development',
    tactical: 'Tactical Support',
    multiple: 'Multiple Categories',
  };
  return categories[value] || value;
}

/**
 * Format timeline for display
 */
export function formatTimeline(value: string): string {
  const timelines: Record<string, string> = {
    immediate: 'Immediate (within 2 weeks)',
    '1-3-months': '1-3 months',
    '3-6-months': '3-6 months',
    '6-plus-months': '6+ months',
    exploratory: 'Exploratory',
  };
  return timelines[value] || value;
}

/**
 * Format kebab-case string to Title Case
 */
export function formatLabel(value: string): string {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
