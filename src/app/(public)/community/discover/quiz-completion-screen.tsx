'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ArrowRight, AlertCircle } from 'lucide-react';
import { QUIZ_UI_CONFIG, QUIZ_ROUTES, type CommunityQuizData } from '@/data/community-quiz';

interface QuizCompletionScreenProps {
  formData: Pick<CommunityQuizData, 'interests'>;
  saveError: boolean;
}

export function QuizCompletionScreen({
  formData,
  saveError,
}: QuizCompletionScreenProps) {
  const displayedInterests = formData.interests.slice(
    0,
    QUIZ_UI_CONFIG.maxDisplayedInterests
  );
  const remainingCount =
    formData.interests.length - QUIZ_UI_CONFIG.maxDisplayedInterests;

  return (
    <div className="flex min-h-screen items-center justify-center bg-nex-deep p-4">
      <Card className="relative w-full max-w-2xl border-cyan/30 bg-nex-surface p-8 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-500/30 bg-green-500/10">
          <Check className="h-10 w-10 text-green-400" />
        </div>

        <h1 className="mb-4 text-3xl font-bold font-headline text-white">
          Your Pathway is Ready
        </h1>

        <p className="mb-2 text-lg text-slate-dim">
          Based on your profile, you&apos;re matched with professionals who
          can{' '}
          <span className="text-cyan font-semibold">
            accelerate your career
          </span>
          .
        </p>

        <div className="my-8 rounded-lg border border-cyan/20 bg-cyan/5 p-6">
          <p className="text-slate-light mb-4">
            Unlock access to targeted discussions, mentorship opportunities,
            and job leads curated for your exact background.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-4 max-h-24 overflow-hidden">
            {displayedInterests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-cyan/20 px-3 py-1 text-sm text-cyan"
              >
                {interest}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="rounded-full bg-cyan/20 px-3 py-1 text-sm text-cyan">
                +{remainingCount} more
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-cyan hover:bg-cyan/90 text-nex-deep font-semibold touch-target"
          >
            <Link href={QUIZ_ROUTES.membership}>
              Unlock My Network
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-slate-dim/50 text-slate-light hover:bg-nex-light/10 touch-target"
          >
            <Link href={QUIZ_ROUTES.community}>Back to Community</Link>
          </Button>
        </div>

        {saveError && (
          <div
            className="mt-4 flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-300"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>
              Your preferences couldn&apos;t be saved locally. Sign up to save your profile.
            </span>
          </div>
        )}

        <p className="mt-6 text-sm text-slate-dim">
          Already have an account?{' '}
          <Link
            href={QUIZ_ROUTES.signIn}
            className="text-cyan hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
