'use client';

/**
 * ProgressBar Component
 *
 * Visual progress indicator for pathway completion.
 * Shows current phase, percentage, and step count.
 */

import { cn } from '@/lib/utils';
import type { ProgressInfo } from '@/types/clinical-pathways';

interface ProgressBarProps {
  progress: ProgressInfo;
  className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Phase and step info */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-mono text-cyan/80">{progress.phaseName}</span>
        <span className="text-slate-light/60">
          Step {progress.completedSteps + 1} of {progress.estimatedTotal}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-nex-deep rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan to-cyan/70 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress.percentage, 100)}%` }}
        />
      </div>

      {/* Percentage */}
      <div className="flex justify-end">
        <span className="text-xs font-mono text-slate-light/50">
          {Math.round(progress.percentage)}% complete
        </span>
      </div>
    </div>
  );
}

/**
 * PhaseIndicator - Shows all phases with current phase highlighted
 */
interface PhaseIndicatorProps {
  phases: string[];
  currentPhase: string;
  className?: string;
}

export function PhaseIndicator({
  phases,
  currentPhase,
  className,
}: PhaseIndicatorProps) {
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {phases.map((phase, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        // isPending kept for logical completeness (isComplete/isCurrent/isPending trio)
        const isPending = index > currentIndex;

        return (
          <div key={phase} className="flex items-center gap-2">
            {/* Phase dot */}
            <div
              className={cn(
                'w-3 h-3 rounded-full transition-colors',
                isComplete && 'bg-cyan',
                isCurrent && 'bg-cyan animate-pulse',
                isPending && 'bg-nex-border'
              )}
            />

            {/* Phase name (only show current) */}
            {isCurrent && (
              <span className="text-xs font-mono text-cyan/80 hidden sm:inline">
                {phase}
              </span>
            )}

            {/* Connector line */}
            {index < phases.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 transition-colors',
                  isComplete ? 'bg-cyan/50' : 'bg-nex-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
