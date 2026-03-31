"use client";

import * as React from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  description: string;
  content: React.ReactNode;
}

interface StepWizardProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[];
  currentStep: number;
  onNext?: () => void;
  onBack?: () => void;
}

const StepWizard = React.forwardRef<HTMLDivElement, StepWizardProps>(
  ({ className, steps, currentStep, onNext, onBack, ...props }, ref) => {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;
    const current = steps[currentStep];

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        {/* Progress bar */}
        <nav aria-label="Progress">
          <ol className="flex items-center gap-2">
            {steps.map((step, index) => {
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <li key={step.title} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                      isComplete && "bg-emerald-500 text-white",
                      isCurrent &&
                        "bg-cyan-500 text-white ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-background",
                      !isComplete &&
                        !isCurrent &&
                        "border border-white/20 text-muted-foreground",
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-8 transition-colors duration-300",
                        isComplete ? "bg-emerald-500" : "bg-white/10",
                      )}
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Current step content */}
        {current && (
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              Step {currentStep + 1}: {current.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {current.description}
            </p>
            <div className="mt-4">{current.content}</div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isFirstStep}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
              isFirstStep
                ? "cursor-not-allowed text-muted-foreground/50"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={isLastStep && !onNext}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-200",
              isLastStep
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-cyan-600 text-white hover:bg-cyan-500",
            )}
          >
            {isLastStep ? "All Done!" : "Next Step"}
            {!isLastStep && (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    );
  },
);
StepWizard.displayName = "StepWizard";

export { StepWizard };
export type { StepWizardProps, Step };
