'use client';

/**
 * Journey Wizard
 *
 * Main onboarding journey component that renders the appropriate step
 * based on current progress and manages the overall flow.
 */

import { useOnboarding } from './onboarding-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  JourneyProgress,
  StepProfile,
  StepDiscovery,
  StepCircle,
  StepIntroduce,
  StepConnect,
} from './components';
import { Loader2, PartyPopper, ArrowRight, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function JourneyWizard() {
  const router = useRouter();
  const {
    isLoading,
    error,
    currentStepId,
    isComplete,
    reset,
  } = useOnboarding();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nex-dark p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan mx-auto mb-4" />
          <p className="text-cyan-soft/70">Loading your journey...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nex-dark p-4">
        <Card className="max-w-md w-full p-8 bg-nex-surface border-red-500/30 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-cyan/30 text-cyan"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // Completed state
  if (isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nex-dark p-4">
        <Card className="max-w-lg w-full p-8 bg-nex-surface border-cyan/30 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan/10 mb-6">
            <PartyPopper className="h-10 w-10 text-cyan" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Welcome to the Community!
          </h1>
          <p className="text-cyan-soft/70 mb-8 max-w-sm mx-auto">
            You've completed your onboarding journey. You're all set to explore,
            connect, and grow with fellow professionals.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/nucleus/community')}
              className="w-full bg-cyan hover:bg-cyan-dark text-nex-deep font-semibold h-12"
            >
              Enter the Community
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="ghost"
                onClick={reset}
                className="text-slate-dim hover:text-cyan-soft text-sm"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Journey (Dev Only)
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Active journey - render current step
  return (
    <div className="flex min-h-screen items-center justify-center bg-nex-dark p-4">
      <Card className="w-full max-w-2xl border-cyan/30 bg-nex-surface">
        {/* Progress tracker */}
        <div className="p-6 border-b border-cyan/20">
          <JourneyProgress />
        </div>

        {/* Step content */}
        <div className="p-6">
          <StepContent stepId={currentStepId} />
        </div>
      </Card>
    </div>
  );
}

/**
 * Renders the appropriate step component based on step ID
 */
function StepContent({ stepId }: { stepId: string }) {
  switch (stepId) {
    case 'profile':
      return <StepProfile />;
    case 'discovery':
      return <StepDiscovery />;
    case 'circle':
      return <StepCircle />;
    case 'introduce':
      return <StepIntroduce />;
    case 'connect':
      return <StepConnect />;
    default:
      return (
        <div className="text-center py-8 text-cyan-soft/70">
          Unknown step: {stepId}
        </div>
      );
  }
}
