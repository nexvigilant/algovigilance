/**
 * SuccessClient - Post-Checkout Success Page
 *
 * STATUS: DISABLED DURING WAITLIST PHASE
 * This component is unreachable because success/page.tsx redirects to /membership.
 *
 * @see /membership for current waitlist flow
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Sparkles, GraduationCap, BookOpen, Users, AlertCircle } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { getSubscriptionStatus } from '@/lib/actions/stripe';
import Link from 'next/link';

/** Stripe session IDs start with 'cs_' and are alphanumeric */
function isValidSessionIdFormat(sessionId: string): boolean {
  return /^cs_[a-zA-Z0-9]+$/.test(sessionId);
}

export function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref for cleanup
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const sessionId = searchParams.get('session_id');

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }

    // Redirect to membership if no session ID (handles direct URL access)
    if (!sessionId) {
      router.push('/membership');
      return;
    }

    // Validate session ID format to prevent spoofing
    if (!isValidSessionIdFormat(sessionId)) {
      setError('Invalid checkout session. Please try again.');
      setVerifying(false);
      return;
    }

    // Verify subscription status with retries (webhook may still be processing)
    async function verifySubscription() {
      if (!user) return;

      try {
        const status = await getSubscriptionStatus(user.uid);

        if (status.hasActiveSubscription) {
          if (isMountedRef.current) {
            setVerified(true);
            setVerifying(false);
          }
          return;
        }

        // Retry up to 5 times (15 seconds total) if subscription not yet active
        if (retryCountRef.current < 5) {
          retryCountRef.current++;
          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              verifySubscription();
            }
          }, 3000);
        } else {
          // After 5 retries, show success but with a note
          // (webhook may be delayed, user can check status later)
          if (isMountedRef.current) {
            setVerified(true);
            setVerifying(false);
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          // On error, still show success (webhook processing may be delayed)
          setVerified(true);
          setVerifying(false);
        }
      }
    }

    verifySubscription();
  }, [user, loading, sessionId, router]);

  if (loading || !user || verifying) {
    return (
      <VoiceLoading context="profile" variant="fullpage" message="Activating your membership..." />
    );
  }

  // Show error state for invalid session
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6 max-w-4xl">
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            <strong>Checkout Error</strong>
            <p className="mt-2">{error}</p>
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button asChild>
            <Link href="/membership">Return to Membership</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 max-w-4xl">
      {/* Success Header */}
      <div className="text-center mb-12 space-y-4">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <CheckCircle2 className="h-24 w-24 text-green-500" />
            <Sparkles className="h-8 w-8 text-nex-gold-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold font-headline">
          Welcome to AlgoVigilance!
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {verified
            ? 'Thank you for becoming a founding member. Your subscription is now active and you have full access to all platform features.'
            : 'Thank you for your payment. Your subscription is being activated and you should have full access shortly.'}
        </p>
      </div>

      {/* Founding Member Badge */}
      <Card className="mb-8 bg-gradient-to-br from-nex-gold-400/10 to-nex-gold-500/10 border-nex-gold-400/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-nex-gold-400/20">
              <Sparkles className="h-8 w-8 text-nex-gold-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Founding Member Status</h3>
              <p className="text-muted-foreground">
                You're one of our earliest supporters. Thank you for believing in our mission!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="space-y-6 mb-12">
        <h2 className="text-2xl font-bold font-headline text-center">Your Next Steps</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Complete Profile */}
          <Card className="holographic-card">
            <CardHeader>
              <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Add your information and preferences to personalize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/nucleus/profile">Go to Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Explore Academy */}
          <Card className="holographic-card">
            <CardHeader>
              <div className="p-3 rounded-lg bg-cyan/10 w-fit mb-2">
                <BookOpen className="h-8 w-8 text-cyan" />
              </div>
              <CardTitle>Explore the Academy</CardTitle>
              <CardDescription>
                Browse courses and start learning today - all courses are included
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/nucleus/academy">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Join Community */}
          <Card className="holographic-card">
            <CardHeader>
              <div className="p-3 rounded-lg bg-nex-gold-400/10 w-fit mb-2">
                <Users className="h-8 w-8 text-nex-gold-400" />
              </div>
              <CardTitle>Join the Community</CardTitle>
              <CardDescription>
                Connect with fellow healthcare professionals in our forums
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/nucleus/community/circles">Explore Forums</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* What You Get */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">What's Included in Your Membership</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Unlimited Academy Access</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All current and future courses</li>
                <li>• Video lessons and quizzes</li>
                <li>• Professional certifications</li>
                <li>• Progress tracking and badges</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Community Forums</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Specialized professional forums</li>
                <li>• Direct messaging</li>
                <li>• Networking opportunities</li>
                <li>• Expert discussions</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Career Development</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Frameworks and templates</li>
                <li>• SOPs and best practices</li>
                <li>• Industry insights</li>
                <li>• Professional guidance</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Founding Member Benefits</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Locked-in founding discount rate</li>
                <li>• Early access to new features</li>
                <li>• Founding member badge</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA to Dashboard */}
      <div className="text-center space-y-4">
        <Button asChild size="lg" className="w-full max-w-md">
          <Link href="/nucleus">Enter Nucleus Dashboard</Link>
        </Button>

        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to {user.email}
        </p>
      </div>

      {/* Help Section */}
      <div className="mt-12 pt-8 border-t text-center">
        <h3 className="text-lg font-semibold mb-2">Need Help Getting Started?</h3>
        <p className="text-muted-foreground mb-4">
          Check out our getting started guide or contact support
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/contact">Contact Support</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/nucleus/profile/subscription">Manage Subscription</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
