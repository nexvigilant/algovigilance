'use client';

/**
 * Journey Progress Tracker
 *
 * Visual stepper showing onboarding progress with clickable steps.
 * Shows completion status, current step, and locked/available states.
 */

import { cn } from '@/lib/utils';
import { useOnboarding } from '../onboarding-context';
import { ONBOARDING_STEPS, type OnboardingStepId } from '@/types/onboarding-journey';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Compass,
  Users,
  MessageSquare,
  UserPlus,
  Check,
  Lock,
} from 'lucide-react';

const STEP_ICONS: Record<OnboardingStepId, React.ComponentType<{ className?: string }>> = {
  profile: User,
  discovery: Compass,
  circle: Users,
  introduce: MessageSquare,
  connect: UserPlus,
};

export function JourneyProgress() {
  const {
    currentStepId,
    progressPercent,
    goToStep,
    getStepStatus,
    isStepAccessible,
  } = useOnboarding();

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-cyan-soft">
            Your Progress
          </span>
          <span className="text-sm font-mono text-cyan-glow">
            {progressPercent}%
          </span>
        </div>
        <Progress
          value={progressPercent}
          aria-label={`Onboarding progress: ${progressPercent}% complete`}
          className="h-2"
        />
      </div>

      {/* Step indicators */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-nex-light" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-cyan to-cyan-glow transition-all duration-500"
          style={{
            width: `${Math.max(0, (progressPercent / 100) * (100 - 10))}%`,
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {ONBOARDING_STEPS.map((step) => {
            const Icon = STEP_ICONS[step.id];
            const status = getStepStatus(step.id);
            const isActive = step.id === currentStepId;
            const isAccessible = isStepAccessible(step.id);
            const isCompleted = status === 'completed' || status === 'skipped';
            const isLocked = status === 'locked';

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && goToStep(step.id)}
                disabled={!isAccessible}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`${step.title}${isCompleted ? ' (completed)' : isLocked ? ' (locked)' : isActive ? ' (current step)' : ''}`}
                className={cn(
                  'flex flex-col items-center gap-2 group transition-all touch-target',
                  isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'
                )}
              >
                {/* Circle with icon */}
                <div
                  className={cn(
                    'relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted &&
                      'bg-cyan text-nex-deep ring-2 ring-cyan ring-offset-2 ring-offset-nex-dark',
                    isActive &&
                      !isCompleted &&
                      'bg-cyan/20 text-cyan ring-2 ring-cyan ring-offset-2 ring-offset-nex-dark animate-pulse',
                    !isCompleted &&
                      !isActive &&
                      isAccessible &&
                      'bg-nex-light text-slate-dim hover:bg-nex-light/80 hover:text-cyan-soft',
                    isLocked && 'bg-nex-light/50 text-slate-dim/50'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : isLocked ? (
                    <Lock className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>

                {/* Step label */}
                <div className="text-center max-w-[80px]">
                  <p
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isActive && 'text-cyan',
                      isCompleted && 'text-cyan-soft',
                      !isActive && !isCompleted && isAccessible && 'text-slate-dim',
                      isLocked && 'text-slate-dim/50'
                    )}
                  >
                    {step.title.split(' ').slice(0, 2).join(' ')}
                  </p>
                  {status === 'skipped' && (
                    <p className="text-[10px] text-slate-dim/70 mt-0.5">
                      Skipped
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
