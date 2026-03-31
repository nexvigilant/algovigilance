import { AssessmentProgressHeader, type AssessmentStep } from './assessment-progress-header';
import { AssessmentStepBadge } from './assessment-step-badge';
import { cn } from '@/lib/utils';

interface AssessmentLayoutProps<T extends string = string> {
  steps: AssessmentStep<T>[];
  currentStepId: T;
  assessmentTitle: string;
  onStepClick?: (stepId: T) => void;
  children: React.ReactNode;
  showBadge?: boolean;
  badgeLabel?: string;
  variant?: 'circles' | 'pills';
  className?: string;
}

export function AssessmentLayout<T extends string = string>({
  steps,
  currentStepId,
  assessmentTitle,
  onStepClick,
  children,
  showBadge = true,
  badgeLabel,
  variant = 'circles',
  className
}: AssessmentLayoutProps<T>) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);
  const currentStep = steps[currentIndex];

  return (
    <div className={cn("space-y-6", className)}>
      <AssessmentProgressHeader
        steps={steps}
        currentStepId={currentStepId}
        assessmentTitle={assessmentTitle}
        onStepClick={onStepClick}
        variant={variant}
      />

      {showBadge && currentStepId !== 'results' && currentStepId !== 'complete' && (
        <AssessmentStepBadge
          currentStep={currentIndex + 1}
          totalSteps={steps.filter(s => s.id !== 'results' && s.id !== 'complete').length}
          label={badgeLabel || `${currentStep?.label} Assessment`}
        />
      )}

      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}
