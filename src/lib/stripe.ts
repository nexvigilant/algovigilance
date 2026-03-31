/**
 * Stripe Client Configuration
 *
 * Provides Stripe client instances for both client-side and server-side usage.
 * Client-side uses @stripe/stripe-js for checkout redirects.
 * Server-side uses stripe package for API operations.
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';

import { logger } from '@/lib/logger';
const log = logger.scope('lib/stripe');

// ============================================================================
// Client-Side Stripe (for checkout redirects)
// ============================================================================

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe.js client instance
 * Loads Stripe.js with your publishable key
 * Use this for redirecting to Stripe Checkout
 */
export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      log.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// ============================================================================
// Server-Side Stripe (for API operations)
// ============================================================================

/**
 * Get server-side Stripe instance
 * Use this in server actions and API routes
 * Requires STRIPE_SECRET_KEY environment variable
 */
export const getServerStripe = async () => {
  const Stripe = (await import('stripe')).default;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
    typescript: true,
  });
};

// ============================================================================
// Price Configuration
// ============================================================================

/**
 * Stripe Price IDs
 * These will be populated after creating products in Stripe Dashboard
 * Update these values after running the Stripe setup
 */
export const STRIPE_PRICES = {
  // Student Tier
  STUDENT_FOUNDING: process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDENT_FOUNDING || '', // $29.97 one-time (3 months)
  STUDENT_REGULAR: process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDENT_REGULAR || '', // $14.00/month recurring
  STUDENT_EARLY_PROFESSIONAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_EARLY_PROFESSIONAL || '', // $34.99/month recurring

  // Professional Tier
  PROFESSIONAL_FOUNDING: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_FOUNDING || '', // $104.97 one-time (4 months)
  PROFESSIONAL_REGULAR: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_REGULAR || '', // $49.99/month recurring
} as const;

// ============================================================================
// Pricing Constants
// ============================================================================

export const PRICING = {
  STUDENT: {
    FOUNDING_AMOUNT: 2997, // $29.97 in cents
    REGULAR_AMOUNT: 1400, // $14.00 in cents
    EARLY_PROFESSIONAL_AMOUNT: 3499, // $34.99 in cents
    FOUNDING_MONTHS: 3,
  },
  PROFESSIONAL: {
    FOUNDING_AMOUNT: 10497, // $104.97 in cents
    REGULAR_AMOUNT: 4999, // $49.99 in cents
    FOUNDING_MONTHS: 4,
    FREE_MONTHS: 1,
  },
  TRIAL: {
    DURATION_DAYS: 3,
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format amount in cents to dollar string
 * @param amountInCents - Amount in cents (e.g., 2997)
 * @returns Formatted string (e.g., "$29.97")
 */
export function formatAmount(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

/**
 * Get display price for a tier and discount status
 */
export function getDisplayPrice(tier: 'student' | 'professional', isFounding: boolean): {
  amount: string;
  interval: string;
  description: string;
} {
  if (tier === 'student') {
    if (isFounding) {
      return {
        amount: formatAmount(PRICING.STUDENT.FOUNDING_AMOUNT),
        interval: 'for 3 months',
        description: `${formatAmount(PRICING.STUDENT.FOUNDING_AMOUNT)} upfront (3 months at $9.99/mo), then ${formatAmount(PRICING.STUDENT.REGULAR_AMOUNT)}/month`,
      };
    }
    return {
      amount: formatAmount(PRICING.STUDENT.REGULAR_AMOUNT),
      interval: '/month',
      description: `${formatAmount(PRICING.STUDENT.REGULAR_AMOUNT)} per month`,
    };
  }

  // Professional
  if (isFounding) {
    return {
      amount: formatAmount(PRICING.PROFESSIONAL.FOUNDING_AMOUNT),
      interval: 'for 4 months',
      description: `${formatAmount(PRICING.PROFESSIONAL.FOUNDING_AMOUNT)} upfront (1st month FREE + 3 months at $34.99/mo), then ${formatAmount(PRICING.PROFESSIONAL.REGULAR_AMOUNT)}/month`,
    };
  }
  return {
    amount: formatAmount(PRICING.PROFESSIONAL.REGULAR_AMOUNT),
    interval: '/month',
    description: `${formatAmount(PRICING.PROFESSIONAL.REGULAR_AMOUNT)} per month`,
  };
}

// ============================================================================
// PV Cloud Tiers (Station tool access + usage metering)
// ============================================================================

export const PV_CLOUD_TIERS = {
  explorer: {
    name: 'Explorer',
    description: 'Individual pharmacovigilance professional',
    features: [
      'Signal detection (PRR, ROR)',
      'FAERS search (100 queries/month)',
      'DailyMed labeling lookup',
      'Basic causality assessment',
    ],
    stationCallsIncluded: 100,
    priceId: process.env.STRIPE_PRICE_PV_EXPLORER ?? '',
  },
  professional: {
    name: 'Professional',
    description: 'PV team with full signal detection',
    features: [
      'All Explorer features',
      'Full disproportionality suite (PRR/ROR/IC/EBGM)',
      'Station tool access (1,000 calls/month)',
      'PubMed literature search',
      'Benefit-risk assessment',
      'WHO-UMC causality',
    ],
    stationCallsIncluded: 1000,
    priceId: process.env.STRIPE_PRICE_PV_PROFESSIONAL ?? '',
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Organization-wide PV intelligence platform',
    features: [
      'All Professional features',
      'Unlimited Station tool calls',
      'EudraVigilance + VigiAccess access',
      'Competitive landscape analysis',
      'Custom microgram chains',
      'Dedicated support',
    ],
    stationCallsIncluded: -1, // unlimited
    priceId: process.env.STRIPE_PRICE_PV_ENTERPRISE ?? '',
  },
} as const;

export type PvCloudTier = keyof typeof PV_CLOUD_TIERS;

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate Stripe environment variables
 * Call this on app startup to ensure proper configuration
 */
export function validateStripeConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    missing.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  }

  // Server-side only validation (don't check in client components)
  if (typeof window === 'undefined') {
    if (!process.env.STRIPE_SECRET_KEY) {
      missing.push('STRIPE_SECRET_KEY');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
