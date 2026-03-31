/**
 * Stripe Server Actions
 *
 * Server actions for subscription management and payment operations.
 * These run on the server and interact with Stripe API and Firestore.
 */

'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { getServerStripe, STRIPE_PRICES } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import type { SubscriptionTier } from '@/types';
import { checkBotId } from 'botid/server';
import { toDateFromSerialized } from '@/types/academy';

// ============================================================================
// Checkout Session Creation
// ============================================================================

export interface CreateCheckoutSessionInput {
  userId: string;
  tier: SubscriptionTier;
  isFounding: boolean;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionOutput {
  success: boolean;
  sessionId?: string;
  error?: string;
}

/**
 * Create a Stripe Checkout session for subscription
 * This integrates with Firebase Stripe Extension
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionOutput> {
  try {
    // BotID protection - prevent automated payment fraud
    const verification = await checkBotId();
    if (verification.isBot) {
      logger.error('stripe', 'Bot detected attempting checkout session creation');
      return { success: false, error: 'Access denied. Please try again later.' };
    }

    const { userId, tier, isFounding, successUrl, cancelUrl } = input;

    // Validate user exists
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    // Determine which price to use
    let priceId: string;
    if (tier === 'student') {
      priceId = isFounding ? STRIPE_PRICES.STUDENT_FOUNDING : STRIPE_PRICES.STUDENT_REGULAR;
    } else {
      priceId = isFounding ? STRIPE_PRICES.PROFESSIONAL_FOUNDING : STRIPE_PRICES.PROFESSIONAL_REGULAR;
    }

    if (!priceId) {
      return { success: false, error: 'Price configuration missing. Please contact support.' };
    }

    // Create checkout session document in Firestore
    // Firebase Stripe Extension will pick this up and create the session
    const checkoutSessionData = {
      mode: isFounding ? 'payment' : 'subscription',
      price: priceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tier,
        isFounding: isFounding.toString(),
        userId,
      },
      created: adminTimestamp.now(),
    };

    const sessionRef = await adminDb
      .collection('customers')
      .doc(userId)
      .collection('checkout_sessions')
      .add(checkoutSessionData);

    logger.info('stripe', 'Created checkout session document', { sessionRefId: sessionRef.id });

    // Wait for extension to process (it adds sessionId field)
    // In production, redirect immediately and let extension handle async
    return { success: true, sessionId: sessionRef.id };
  } catch (error) {
    logger.error('stripe', 'Error creating checkout session', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    };
  }
}

// ============================================================================
// Subscription Management
// ============================================================================

export interface GetSubscriptionStatusOutput {
  hasActiveSubscription: boolean;
  tier: SubscriptionTier | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  isFoundingMember: boolean;
}

/**
 * Get current subscription status for a user
 */
export async function getSubscriptionStatus(userId: string): Promise<GetSubscriptionStatusOutput> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        hasActiveSubscription: false,
        tier: null,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        isFoundingMember: false,
      };
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription;

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        tier: null,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        isFoundingMember: false,
      };
    }

    return {
      hasActiveSubscription: subscription.status === 'active' || subscription.status === 'trial',
      tier: subscription.tier || null,
      status: subscription.status || null,
      currentPeriodEnd: toDateFromSerialized(subscription.currentPeriodEnd) || null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      isFoundingMember: subscription.isFoundingMember || false,
    };
  } catch (error) {
    logger.error('stripe', 'Error getting subscription status', { error });
    return {
      hasActiveSubscription: false,
      tier: null,
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      isFoundingMember: false,
    };
  }
}

// ============================================================================
// Trial Management
// ============================================================================

export interface StartTrialOutput {
  success: boolean;
  error?: string;
  trialEndsAt?: Date;
}

/**
 * Start a 3-day free trial for a user
 * No credit card required
 */
export async function startTrial(userId: string): Promise<StartTrialOutput> {
  try {
    // BotID protection - prevent automated trial abuse
    const verification = await checkBotId();
    if (verification.isBot) {
      logger.error('stripe', 'Bot detected attempting trial start');
      return { success: false, error: 'Access denied. Please try again later.' };
    }

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    if (!userData) return { success: false, error: 'User data is empty' };

    // Check if user has already used their trial
    if (userData.trial?.hasUsedTrial) {
      return { success: false, error: 'Trial already used' };
    }

    // Check if user already has active subscription
    if (userData.subscription?.status === 'active') {
      return { success: false, error: 'User already has active subscription' };
    }

    const now = adminTimestamp.now();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 3); // 3 days from now

    // Update user document with trial data
    await userRef.update({
      'trial.startedAt': now,
      'trial.endsAt': adminTimestamp.fromDate(trialEnd),
      'trial.hasUsedTrial': true,
      'trial.completedOnboarding': false,
      'subscription.status': 'trial',
      'nucleus.status': 'active',
    });

    logger.info('stripe', 'Started trial for user', { userId });

    return {
      success: true,
      trialEndsAt: trialEnd,
    };
  } catch (error) {
    logger.error('stripe', 'Error starting trial', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start trial',
    };
  }
}

/**
 * Check if user's trial has expired
 */
export async function checkTrialExpiration(userId: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return true; // Treat missing user as expired
    }

    const userData = userDoc.data();
    if (!userData) return true;
    const trial = userData.trial;

    if (!trial || !trial.endsAt) {
      return true; // No trial or no end date = expired
    }

    const now = new Date();
    const endsAt = toDateFromSerialized(trial.endsAt);

    return now > endsAt;
  } catch (error) {
    logger.error('stripe', 'Error checking trial expiration', { error });
    return true; // Fail safe - treat as expired
  }
}

// ============================================================================
// Student Verification
// ============================================================================

export interface VerifyStudentEmailOutput {
  success: boolean;
  error?: string;
  isValid?: boolean;
}

/**
 * Verify if email is from a recognized university domain
 */
export async function verifyStudentEmail(email: string): Promise<VerifyStudentEmailOutput> {
  try {
    const emailLower = email.toLowerCase();

    // List of recognized academic domains
    const academicDomains = [
      '.edu', // United States
      '.ac.uk', // United Kingdom
      '.edu.au', // Australia
      '.ac.nz', // New Zealand
      '.edu.ca', // Canada
      '.ac.za', // South Africa
      '.edu.sg', // Singapore
      '.edu.hk', // Hong Kong
      '.ac.jp', // Japan
      '.edu.my', // Malaysia
      '.ac.in', // India
      '.edu.br', // Brazil
      '.edu.mx', // Mexico
      '.edu.ar', // Argentina
      '.edu.co', // Colombia
      '.edu.pe', // Peru
      '.edu.ph', // Philippines
      '.ac.th', // Thailand
      '.ac.kr', // South Korea
      '.edu.tw', // Taiwan
    ];

    const isValid = academicDomains.some((domain) => emailLower.endsWith(domain));

    return {
      success: true,
      isValid,
    };
  } catch (error) {
    logger.error('stripe', 'Error verifying student email', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify email',
    };
  }
}

// ============================================================================
// Customer Portal
// ============================================================================

export interface CreatePortalLinkOutput {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Create Stripe Customer Portal link for subscription management
 * Allows users to update payment method, view invoices, cancel subscription
 */
export async function createPortalLink(userId: string, returnUrl: string): Promise<CreatePortalLinkOutput> {
  try {
    // BotID protection - prevent unauthorized portal access
    const verification = await checkBotId();
    if (verification.isBot) {
      logger.error('stripe', 'Bot detected attempting portal link creation');
      return { success: false, error: 'Access denied. Please try again later.' };
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    if (!userData) return { success: false, error: 'User data is empty' };
    const stripeCustomerId = userData.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      return { success: false, error: 'No Stripe customer found. Please contact support.' };
    }

    const stripe = await getServerStripe();

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      success: true,
      url: session.url,
    };
  } catch (error) {
    logger.error('stripe', 'Error creating portal link', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create portal link',
    };
  }
}
