'use client';

import { CheckCircle2, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface AssessmentStep<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  color?: string;
}

interface AssessmentProgressHeaderProps<T extends string = string> {
  steps: AssessmentStep<T>[];
  currentStepId: T;
  assessmentTitle: string;
  onStepClick?: (stepId: T) => void;
  variant?: 'circles' | 'pills';
  className?: string;
}

export function AssessmentProgressHeader<T extends string = string>({
  steps,
  currentStepId,
  assessmentTitle,
  onStepClick,
  variant = 'circles',
  className
}: AssessmentProgressHeaderProps<T>) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <Card className={cn("bg-nex-surface border-nex-border", className)}>
      <CardContent className="p-4">
        {/* Progress Bar & Title */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{assessmentTitle}</span>
            <span className="text-cyan font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className={cn(
          "flex items-center",
          variant === 'circles' ? "justify-between" : "flex-wrap gap-2"
        )}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStepId;
            const isCompleted = index < currentIndex;
            const isClickable = index <= currentIndex && !!onStepClick;
            const stepColor = step.color || 'cyan';

            if (variant === 'pills') {
              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition-colors",
                    isActive 
                      ? "bg-cyan text-nex-deep font-medium"
                      : isCompleted
                      ? "bg-cyan/20 text-cyan cursor-pointer hover:bg-cyan/30"
                      : "bg-nex-dark text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {step.label}
                </button>
              );
            }

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isActive
                      ? `bg-${stepColor}/20 ring-2 ring-${stepColor}`
                      : isCompleted
                      ? "bg-green-500/20"
                      : "bg-nex-dark"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : Icon ? (
                    <Icon className={cn("h-5 w-5", isActive ? `text-${stepColor}` : "text-muted-foreground")} />
                  ) : (
                    <span className={cn("text-xs font-bold", isActive ? `text-${stepColor}` : "text-muted-foreground")}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
