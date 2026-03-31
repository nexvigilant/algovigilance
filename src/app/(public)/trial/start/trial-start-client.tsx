'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, AlertCircle, Sparkles, BookOpen, Users, Award } from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { startTrial } from '@/lib/actions/stripe';
import Link from 'next/link';

import { logger } from '@/lib/logger';
const log = logger.scope('start/trial-start-client');

export function TrialStartClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialStarted, setTrialStarted] = useState(false);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/trial/start');
    }
  }, [user, authLoading, router]);

  const handleStartTrial = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await startTrial(user.uid);

      if (!result.success) {
        throw new Error(result.error || 'Failed to start trial');
      }

      setTrialStarted(true);

      // Redirect to onboarding after 2 seconds
      setTimeout(() => {
        router.push('/nucleus/onboarding');
      }, 2000);
    } catch (err) {
      log.error('Error starting trial:', err);
      setError(err instanceof Error ? err.message : 'Failed to start trial');
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <VoiceLoading context="profile" variant="fullpage" message="Loading..." />
    );
  }

  if (trialStarted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <CheckCircle2 className="h-20 w-20 text-green-500" />
          <h2 className="text-2xl font-bold">Trial Started!</h2>
          <p className="text-muted-foreground">Redirecting you to get started...</p>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
          Start Your Free 3-Day Trial
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore AlgoVigilance with full access - no credit card required. Experience the platform before you subscribe.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* What's Included */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="holographic-card">
          <CardHeader>
            <div className="p-3 rounded-lg bg-cyan/10 w-fit mb-2">
              <BookOpen className="h-8 w-8 text-cyan" />
            </div>
            <CardTitle>Academy Access</CardTitle>
            <CardDescription>
              Browse our course catalog and preview lessons to see what you'll learn
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="holographic-card">
          <CardHeader>
            <div className="p-3 rounded-lg bg-nex-gold-400/10 w-fit mb-2">
              <Users className="h-8 w-8 text-nex-gold-400" />
            </div>
            <CardTitle>Community Forums</CardTitle>
            <CardDescription>
              Connect with healthcare professionals and explore our specialized forums
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="holographic-card">
          <CardHeader>
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Discovery Quiz</CardTitle>
            <CardDescription>
              Take our onboarding quiz to find communities and courses matched to your goals
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Trial Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">What Happens During Your Trial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium">3 Days of Full Access</p>
              <p className="text-sm text-muted-foreground">
                Explore Academy courses, join Community forums, and experience everything AlgoVigilance offers
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium">No Credit Card Required</p>
              <p className="text-sm text-muted-foreground">
                Your trial is completely free. You'll only be charged if you choose to subscribe after the trial ends
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium">Founding Member Discount Available</p>
              <p className="text-sm text-muted-foreground">
                Subscribe during or after your trial to lock in special founding member pricing
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium">No Auto-Renewal</p>
              <p className="text-sm text-muted-foreground">
                Your trial won't automatically convert to a paid subscription. You choose when you're ready to subscribe
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Trial Button */}
      <div className="flex flex-col items-center gap-4">
        <Button size="lg" onClick={handleStartTrial} disabled={loading} className="w-full max-w-md">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Starting your trial...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Start My Free Trial
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center max-w-md">
          By starting your trial, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>

      {/* Additional Info */}
      <div className="mt-12 pt-8 border-t text-center">
        <h3 className="text-lg font-semibold mb-4">After Your Trial</h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          When your trial ends, you can choose a membership plan that fits your needs. Practitioner and Professional plans available with special founding member discounts.
        </p>
        <Button asChild variant="outline">
          <Link href="/auth/signup">View Pricing Plans</Link>
        </Button>
      </div>
    </div>
  );
}
