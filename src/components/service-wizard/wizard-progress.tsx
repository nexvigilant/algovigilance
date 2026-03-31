'use client';

/**
 * Service Discovery Wizard - Progress Indicator
 *
 * Shows adaptive progress through the wizard (not numbered steps).
 * Displays as a minimal bar at the top of the screen.
 */

import { cn } from '@/lib/utils';

interface WizardProgressProps {
  progress: number; // 0-100
  currentStep: number;
  totalSteps: number;
}

export function WizardProgress({
  progress,
  currentStep,
  totalSteps,
}: WizardProgressProps) {
  return (
    <div className="sticky top-0 z-10 bg-nex-deep/95 backdrop-blur-sm border-b border-nex-light">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Wizard progress: ${progress}% complete, question ${currentStep} of ${totalSteps}`}
          className="h-1 bg-nex-surface rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-cyan to-cyan-glow transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Step Indicator */}
        <div className="py-3 flex items-center justify-between text-sm" role="status" aria-live="polite">
          <span className="text-slate-dim">
            Question {currentStep}{currentStep > 1 ? ` of ${totalSteps}` : ''}
          </span>
          <span className="text-cyan font-medium">{progress}% complete</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Alternative: Dot Progress (Optional)
// =============================================================================

interface DotProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function DotProgress({ currentStep, totalSteps }: DotProgressProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-4"
      role="group"
      aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={cn(
            'w-2.5 h-2.5 rounded-full transition-all duration-300',
            index < currentStep
              ? 'bg-cyan' // Completed
              : index === currentStep
              ? 'bg-cyan/50 ring-2 ring-cyan ring-offset-2 ring-offset-nex-deep' // Current
              : 'bg-nex-light' // Upcoming
          )}
        />
      ))}
      <span className="sr-only">
        Step {currentStep + 1} of {totalSteps}
      </span>
    </div>
  );
}
