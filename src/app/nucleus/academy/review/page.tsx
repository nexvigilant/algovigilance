'use client';

/**
 * FSRS Review Page
 *
 * Spaced repetition review session for previously learned KSBs.
 * Uses the FSRSReviewSession component for the review interface.
 */

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FSRSReviewSession } from '@/components/academy/fsrs-review-session';
import { useAuth } from '@/hooks/use-auth';
import { VoiceLoading } from '@/components/voice';

export default function ReviewPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <VoiceLoading context="academy" variant="fullpage" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8">
        <Brain className="h-16 w-16 text-slate-dim mb-4" />
        <h1 className="text-2xl font-bold text-slate-light mb-2">Sign In Required</h1>
        <p className="text-slate-dim mb-6 text-center max-w-md">
          Please sign in to access your spaced repetition reviews.
        </p>
        <Button asChild>
          <Link href="/auth/signin?redirect=/nucleus/academy/review">
            Sign In
          </Link>
        </Button>
      </div>
    );
  }

  const handleComplete = () => {
    router.push('/nucleus/academy/dashboard');
  };

  const handleSkip = () => {
    router.push('/nucleus/academy');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-nex-deep">
      {/* Header */}
      <header className="border-b border-nex-border bg-nex-surface">
        <div className="container mx-auto px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-slate-dim hover:text-slate-light"
              >
                <Link href="/nucleus/academy">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Academy
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              <h1 className="text-lg font-semibold text-gold">Spaced Review</h1>
            </div>

            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Intro Section */}
          <div className="text-center mb-8">
            <Brain className="h-12 w-12 text-cyan mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-light mb-2">
              Strengthen Your Memory
            </h2>
            <p className="text-slate-dim max-w-lg mx-auto">
              Review your learned KSBs using spaced repetition. Rate how well you recall
              each concept to optimize your review schedule.
            </p>
          </div>

          {/* Review Session */}
          <FSRSReviewSession
            onComplete={handleComplete}
            onSkip={handleSkip}
            maxCards={20}
          />

          {/* Tips Section */}
          <div className="mt-8 p-4 rounded-xl bg-nex-surface border border-nex-border">
            <h3 className="text-sm font-semibold text-slate-light mb-2">
              Review Tips
            </h3>
            <ul className="text-xs text-slate-dim space-y-1">
              <li>
                <span className="text-cyan font-mono">Space</span> to reveal answer
              </li>
              <li>
                <span className="text-red-400 font-mono">1</span> Again &mdash; Didn&apos;t remember
              </li>
              <li>
                <span className="text-orange-400 font-mono">2</span> Hard &mdash; Struggled to recall
              </li>
              <li>
                <span className="text-emerald-400 font-mono">3</span> Good &mdash; Remembered with effort
              </li>
              <li>
                <span className="text-cyan font-mono">4</span> Easy &mdash; Instant recall
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
