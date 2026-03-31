/**
 * Contact Forms Data
 *
 * Centralized configuration for contact and consulting inquiry forms.
 * Eliminates duplication between forms and ensures analytics consistency.
 */

// ============================================================================
// Lead Source Attribution
// ============================================================================

/**
 * Lead source identifiers for form attribution.
 * Using const object enables autocomplete while remaining JSON-serializable.
 */
export const LEAD_SOURCES = {
  // Public site forms
  PUBLIC_SITE: 'public_site',
  CONTACT_PAGE: 'contact_page',
  CONSULTING_PAGE: 'consulting_page',
  SERVICES_PAGE: 'services_page',

  // Intelligence referrals
  INTELLIGENCE_SIGNAL: 'intelligence_signal',
  INTELLIGENCE_ARTICLE: 'intelligence_article',

  // Marketing campaigns
  HEADER_CTA: 'header_cta',
  FOOTER_CTA: 'footer_cta',

  // Partner referrals
  PARTNER_REFERRAL: 'partner_referral',
} as const;

export type LeadSource = (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES];

// ============================================================================
// Honeypot Configuration
// ============================================================================

/**
 * Standardized honeypot field name across all forms.
 * Using consistent naming simplifies bot detection patterns.
 */
export const HONEYPOT_FIELD_NAME = 'website_url';

// ============================================================================
// Company Type Labels
// ============================================================================

/**
 * Company types for general contact form (simpler set)
 */
export const CONTACT_COMPANY_TYPES = {
  pharmaceutical: 'Pharmaceutical',
  biotech: 'Biotechnology',
  cro: 'CRO (Contract Research Organization)',
  healthcare: 'Healthcare Provider',
  other: 'Other',
} as const;

/**
 * Company types for consulting form (extended set)
 */
export const CONSULTING_COMPANY_TYPES = {
  pharmaceutical: 'Pharmaceutical Company',
  biotech: 'Biotechnology Company',
  cro: 'Contract Research Organization (CRO)',
  healthcare: 'Healthcare Organization',
  'medical-device': 'Medical Device Company',
  consulting: 'Consulting Firm',
  other: 'Other',
} as const;

// ============================================================================
// Service Labels
// ============================================================================

export const SERVICE_INTEREST_LABELS = {
  'signal-validation': 'Signal Validation & Analysis',
  'enterprise-advisory': 'Enterprise Advisory',
  'independent-oversight': 'Independent Oversight (Guardian)',
  'future-intelligence': 'Future Intelligence',
  'project-delivery': 'Project Delivery (Tactical)',
  'talent-development': 'Talent Development',
  general: 'General Inquiry',
} as const;

export const CONSULTING_CATEGORY_LABELS = {
  strategic: 'Market Strategy (Chart Your Course)',
  innovation: 'Future Intelligence (Ignite Possibilities)',
  ld: 'Talent Development (Build Your People)',
  tactical: 'Project Delivery (Execute with Precision)',
  multiple: 'Multiple Services / Not Sure',
} as const;

// ============================================================================
// Timeline Labels
// ============================================================================

/**
 * Timeline options for general contact form
 */
export const CONTACT_TIMELINE_LABELS = {
  immediate: 'Immediate (within 2 weeks)',
  '1-3-months': 'Short-term (1-3 months)',
  '3-6-months': 'Medium-term (3-6 months)',
  '6-plus-months': 'Long-term (6+ months)',
  exploratory: 'Exploratory (just learning)',
} as const;

/**
 * Timeline options for consulting form
 */
export const CONSULTING_TIMELINE_LABELS = {
  immediate: 'Immediate (within 30 days)',
  '1-3-months': '1-3 months',
  '3-6-months': '3-6 months',
  '6-plus-months': '6+ months',
  exploratory: 'Exploratory / Planning Phase',
} as const;

// ============================================================================
// Company Size Labels
// ============================================================================

export const COMPANY_SIZE_LABELS = {
  '1-50': '1-50 employees',
  '51-200': '51-200 employees',
  '201-500': '201-500 employees',
  '501-1000': '501-1,000 employees',
  '1001-5000': '1,001-5,000 employees',
  '5000+': '5,000+ employees',
} as const;

// ============================================================================
// Functional Area Labels
// ============================================================================

export const FUNCTIONAL_AREA_LABELS = {
  pharmacovigilance: 'Pharmacovigilance',
  'business-development-operations': 'Business Development & Operations',
  'pharma-strategy-intelligence': 'Pharmaceutical Strategy & Intelligence',
  other: 'Other / Not Listed',
} as const;

// ============================================================================
// Routes
// ============================================================================

export const CONTACT_ROUTES = {
  contact: '/contact',
  thankYou: '/contact/thank-you',
  consulting: '/consulting',
  services: '/services',
  schedule: '/schedule',
} as const;

// ============================================================================
// Bot Detection Configuration
// ============================================================================

/**
 * Bot detection configuration.
 * Set BLOCK_SUSPECTED_BOTS to true in production to enable strict mode.
 */
export const BOT_DETECTION_CONFIG = {
  /**
   * If true, block suspected bots (may have false positives).
   * If false, only block verified bots (known crawler signatures).
   *
   * Set to false during development/debugging, true in production.
   */
  BLOCK_SUSPECTED_BOTS: process.env.NODE_ENV === 'production',

  /**
   * Always block verified bots (known crawlers/scrapers).
   */
  BLOCK_VERIFIED_BOTS: true,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard for checking if a value is a valid lead source
 */
export function isValidLeadSource(value: unknown): value is LeadSource {
  if (typeof value !== 'string') return false;
  return Object.values(LEAD_SOURCES).includes(value as LeadSource);
}

/**
 * Get display label for a timeline value
 */
export function getTimelineLabel(
  value: string,
  formType: 'contact' | 'consulting' = 'contact'
): string {
  const labels =
    formType === 'consulting'
      ? CONSULTING_TIMELINE_LABELS
      : CONTACT_TIMELINE_LABELS;
  return labels[value as keyof typeof labels] || value;
}
