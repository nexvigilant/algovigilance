"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface WizardStep {
  title: string;
  description: string;
  content: React.ReactNode;
  /** Field names in this step — used for per-step validation */
  fields?: string[];
}

interface FormWizardProps {
  steps: WizardStep[];
  /** Called when "Next" is pressed. Return true to allow advancement. */
  onValidateStep?: (stepIndex: number, fields: string[]) => Promise<boolean>;
  /** Called when the final step's submit is pressed */
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  className?: string;
}

export function FormWizard({
  steps,
  onValidateStep,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Submit",
  className,
}: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const current = steps[currentStep];

  const handleNext = async () => {
    if (onValidateStep && current.fields) {
      const isValid = await onValidateStep(currentStep, current.fields);
      if (!isValid) return;
    }

    if (isLastStep) {
      onSubmit();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) setCurrentStep((s) => s - 1);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Progress */}
      <nav aria-label="Form progress">
        <ol className="flex items-center gap-2">
          {steps.map((step, index) => {
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <li key={step.title} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => index < currentStep && setCurrentStep(index)}
                  disabled={index >= currentStep}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                    isComplete &&
                      "bg-emerald-500 text-white cursor-pointer hover:bg-emerald-400",
                    isCurrent &&
                      "bg-cyan text-nex-deep ring-2 ring-cyan/30 ring-offset-2 ring-offset-nex-background",
                    !isComplete &&
                      !isCurrent &&
                      "border border-white/20 text-slate-dim cursor-default",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-6 sm:w-10 transition-colors duration-300",
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

      {/* Step content */}
      {current && (
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-headline font-semibold text-white">
            {current.title}
          </h3>
          <p className="text-sm text-slate-dim">{current.description}</p>
          <div className="mt-4">{current.content}</div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          disabled={isFirstStep || isSubmitting}
          className={cn(
            isFirstStep && "invisible",
            "text-slate-dim hover:text-white",
          )}
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className={cn(
            "touch-target font-semibold",
            isLastStep
              ? "bg-cyan text-nex-deep hover:bg-cyan-glow hover:shadow-glow-cyan"
              : "bg-cyan/80 text-nex-deep hover:bg-cyan",
          )}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Sending...
            </>
          ) : isLastStep ? (
            submitLabel
          ) : (
            <>
              Continue
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
