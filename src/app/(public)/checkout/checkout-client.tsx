/**
 * CheckoutClient - Stripe Checkout Flow
 *
 * STATUS: DISABLED DURING WAITLIST PHASE
 * This component is currently unreachable because page.tsx redirects to /membership.
 * The code is preserved for post-launch activation.
 *
 * @see /membership for current waitlist flow
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, AlertCircle, Sparkles, GraduationCap, Briefcase } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { createCheckoutSession, verifyStudentEmail } from '@/lib/actions/stripe';
import { PRICING, formatAmount } from '@/lib/stripe';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SubscriptionTier } from '@/types';

import { logger } from '@/lib/logger';
const log = logger.scope('checkout/checkout-client');

/** Valid tier values that map to PRICING keys */
const VALID_TIERS = ['student', 'professional'] as const;

/** Type guard for URL tier parameter validation */
function isValidTier(tier: string | null): tier is SubscriptionTier {
  return tier !== null && VALID_TIERS.includes(tier as typeof VALID_TIERS[number]);
}

/** Base URL for checkout redirects - falls back to window.location.origin if not set */
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

/** Whether to apply founding member pricing - controlled via env */
const IS_FOUNDING_PERIOD = process.env.NEXT_PUBLIC_FOUNDING_PERIOD !== 'false';

/** Timeout for Stripe session creation (15 seconds) */
const CHECKOUT_TIMEOUT_MS = 15000;

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStudentEmailValid, setIsStudentEmailValid] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Refs for cleanup and avoiding stale closures
  const loadingRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Sync loading state with ref to avoid stale closure in timeout
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get tier from URL params if present (validated against PRICING keys)
  useEffect(() => {
    const tierParam = searchParams.get('tier');
    if (isValidTier(tierParam)) {
      setSelectedTier(tierParam);
    }
  }, [searchParams]);

  // Redirect to signin if not authenticated, preserving tier selection
  useEffect(() => {
    if (!authLoading && !user) {
      const tierParam = searchParams.get('tier');
      const redirectPath = tierParam ? `/checkout?tier=${tierParam}` : '/checkout';
      router.push(`/auth/signin?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [user, authLoading, router, searchParams]);

  // Check if user's email is a university email
  useEffect(() => {
    async function checkEmail() {
      if (!user?.email) return;

      setCheckingEmail(true);
      try {
        const result = await verifyStudentEmail(user.email);
        if (isMountedRef.current) {
          setIsStudentEmailValid(result.isValid || false);
        }
      } catch (err) {
        log.error('Failed to verify student email:', err);
        if (isMountedRef.current) {
          // Default to false on error - user can contact support
          setIsStudentEmailValid(false);
          setError('Could not verify email eligibility. Contact support if you have a university email.');
        }
      } finally {
        if (isMountedRef.current) {
          setCheckingEmail(false);
        }
      }
    }

    if (user) {
      checkEmail();
    }
  }, [user]);

  const handleSubscribe = useCallback(async () => {
    if (!user || !selectedTier) return;

    // Check if student tier and email is not valid
    if (selectedTier === 'student' && !isStudentEmailValid) {
      setError('Student tier requires a university email address. Please sign up with your .edu email or contact support.');
      return;
    }

    // Clean up any existing listeners/timeouts
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setLoading(true);
    setError(null);

    try {
      // Create checkout session
      const result = await createCheckoutSession({
        userId: user.uid,
        tier: selectedTier,
        isFounding: IS_FOUNDING_PERIOD,
        successUrl: `${BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${BASE_URL}/checkout?tier=${selectedTier}`,
      });

      if (!result.success || !result.sessionId) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Listen for the sessionId to be populated by the extension
      const sessionRef = doc(db, 'customers', user.uid, 'checkout_sessions', result.sessionId);

      const unsubscribe = onSnapshot(
        sessionRef,
        (snap) => {
          const data = snap.data();

          if (data?.url) {
            // Extension has created the Stripe session with checkout URL
            // Redirect directly to Stripe Checkout
            window.location.href = data.url;
            unsubscribe();
            unsubscribeRef.current = null;
          }

          if (data?.error) {
            if (isMountedRef.current) {
              setError(data.error.message || 'An error occurred');
              setLoading(false);
            }
            unsubscribe();
            unsubscribeRef.current = null;
          }
        },
        (err) => {
          log.error('Error listening to checkout session:', err);
          if (isMountedRef.current) {
            setError('Failed to create checkout session');
            setLoading(false);
          }
        }
      );

      // Store for cleanup
      unsubscribeRef.current = unsubscribe;

      // Timeout using ref to get current loading state
      timeoutRef.current = setTimeout(() => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        // Use ref to avoid stale closure
        if (loadingRef.current && isMountedRef.current) {
          setError('Checkout session creation timed out. Please try again.');
          setLoading(false);
        }
      }, CHECKOUT_TIMEOUT_MS);
    } catch (err) {
      log.error('Checkout error:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setLoading(false);
      }
    }
  }, [user, selectedTier, isStudentEmailValid]);

  if (authLoading || !user) {
    return (
      <VoiceLoading context="profile" variant="fullpage" message="Loading checkout..." />
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline mb-4">Choose Your Membership</h1>
        <p className="text-lg text-muted-foreground">
          Get started with AlgoVigilance today. All plans include unlimited Academy access and full Community features.
        </p>
      </div>

      {/* Founding Member Banner */}
      <Alert className="mb-8 bg-gradient-to-r from-nex-gold-400/10 to-nex-gold-500/10 border-nex-gold-400/50">
        <Sparkles className="h-5 w-5 text-nex-gold-400" />
        <AlertDescription className="text-base">
          <strong>Founding Member Discount:</strong> Special pricing for early adopters. Lock in your rate before prices increase!
          <p className="mt-2 text-sm text-muted-foreground">
            Founding Member status includes lifetime platform access at locked-in pricing, priority support, and early feature access.
            Membership is a subscription—it does not include equity, voting rights, or governance participation in AlgoVigilance, LLC.
          </p>
        </AlertDescription>
      </Alert>

      {/* Email Verification Alert for Students */}
      {checkingEmail && (
        <Alert className="mb-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          <AlertDescription>Verifying your email address...</AlertDescription>
        </Alert>
      )}

      {isStudentEmailValid === false && (
        <Alert className="mb-8" variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            <strong>Student Pricing Requires University Email</strong>
            <p className="mt-2">
              Your current email ({user.email}) is not recognized as a university email address. To access student
              pricing, please sign up with your .edu email address or contact support if you believe this is an error.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {isStudentEmailValid === true && (
        <Alert className="mb-8 bg-green-500/10 border-green-500/50">
          <Check className="h-5 w-5 text-green-500" />
          <AlertDescription>
            <strong>University Email Verified!</strong> You're eligible for student pricing.
          </AlertDescription>
        </Alert>
      )}

      {/* Tier Selection */}
      <div className="grid md:grid-cols-2 gap-8 mb-8" role="radiogroup" aria-label="Membership tier selection">
        {/* Student Tier */}
        <Card
          role="radio"
          aria-checked={selectedTier === 'student'}
          aria-disabled={!isStudentEmailValid && isStudentEmailValid !== null}
          tabIndex={!isStudentEmailValid && isStudentEmailValid !== null ? -1 : 0}
          className={`cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            selectedTier === 'student'
              ? 'ring-2 ring-primary shadow-lg'
              : 'hover:shadow-md'
          } ${!isStudentEmailValid && isStudentEmailValid !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => isStudentEmailValid && setSelectedTier('student')}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && isStudentEmailValid) {
              e.preventDefault();
              setSelectedTier('student');
            }
          }}
        >
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <GraduationCap className="h-10 w-10 text-cyan" />
              {selectedTier === 'student' && <Check className="h-6 w-6 text-primary" />}
            </div>
            <CardTitle className="text-2xl">Practitioner Member</CardTitle>
            <CardDescription>For current university students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Founding Discount Pricing */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{formatAmount(PRICING.STUDENT.FOUNDING_AMOUNT)}</span>
                <span className="text-muted-foreground">for 3 months</span>
              </div>
              <Badge variant="secondary" className="bg-nex-gold-400/20 text-nex-gold-400">
                Founding Discount
              </Badge>
              <p className="text-sm text-muted-foreground">
                3 months at $9.99/mo, then {formatAmount(PRICING.STUDENT.REGULAR_AMOUNT)}/month
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Rate locked during university + 3 months post-grad</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Unlimited Academy courses and certifications</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Full Community access and forums</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Automatic transition to early professional rate post-grad</span>
              </li>
            </ul>

            {!isStudentEmailValid && isStudentEmailValid !== null && (
              <p className="text-sm text-destructive">
                Requires university email (.edu or equivalent)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Professional Tier */}
        <Card
          role="radio"
          aria-checked={selectedTier === 'professional'}
          tabIndex={0}
          className={`cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            selectedTier === 'professional' ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedTier('professional')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedTier('professional');
            }
          }}
        >
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <Briefcase className="h-10 w-10 text-nex-gold-400" />
              {selectedTier === 'professional' && <Check className="h-6 w-6 text-primary" />}
            </div>
            <CardTitle className="text-2xl">Professional Member</CardTitle>
            <CardDescription>For healthcare and industry professionals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Founding Discount Pricing */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{formatAmount(PRICING.PROFESSIONAL.FOUNDING_AMOUNT)}</span>
                <span className="text-muted-foreground">for 4 months</span>
              </div>
              <Badge variant="secondary" className="bg-nex-gold-400/20 text-nex-gold-400">
                Founding Discount
              </Badge>
              <p className="text-sm text-muted-foreground">
                1st month FREE + 3 months at $34.99/mo, then {formatAmount(PRICING.PROFESSIONAL.REGULAR_AMOUNT)}/month
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Unlimited Academy courses and certifications</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Full Community access and forums</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Advanced career development frameworks</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Professional networking and mentorship</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Subscribe Button */}
      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          onClick={handleSubscribe}
          disabled={!selectedTier || loading || (selectedTier === 'student' && !isStudentEmailValid)}
          className="w-full max-w-md"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating checkout session...
            </>
          ) : (
            `Subscribe to ${selectedTier === 'student' ? 'Practitioner' : 'Professional'} Membership`
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center max-w-md">
          You'll be redirected to Stripe's secure checkout. 30-day money-back guarantee.
        </p>
      </div>

      {/* Additional Info */}
      <div className="mt-12 pt-8 border-t">
        <h3 className="text-lg font-semibold mb-4 text-center">What's Included</h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Academy Access</h4>
            <p className="text-muted-foreground">
              Unlimited access to all courses, video lessons, quizzes, and professional certifications
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Community Forums</h4>
            <p className="text-muted-foreground">
              Connect with healthcare and industry professionals, join specialized forums, and build your network
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Career Development</h4>
            <p className="text-muted-foreground">
              Access frameworks, SOPs, and tools to advance your career and demonstrate your capabilities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
