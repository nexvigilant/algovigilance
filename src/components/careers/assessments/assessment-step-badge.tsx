import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AssessmentStepBadgeProps {
  currentStep: number;
  totalSteps: number;
  label: string;
  className?: string;
}

export function AssessmentStepBadge({
  currentStep,
  totalSteps,
  label,
  className
}: AssessmentStepBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="outline" className="text-cyan border-cyan">
        Step {currentStep} of {totalSteps}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
