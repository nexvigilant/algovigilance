'use client';

import { Button } from '@/components/ui/button';

interface StepNavigationProps {
  step: number;
  totalSteps: number;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function StepNavigation({
  step,
  totalSteps,
  loading,
  onPrevious,
  onNext,
}: StepNavigationProps) {
  return (
    <div className="flex justify-between mt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={step === 1 || loading}
      >
        Previous
      </Button>

      {step < totalSteps ? (
        <Button type="button" onClick={onNext} disabled={loading}>
          Next
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={loading}
          className="border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 bg-transparent"
        >
          {loading ? 'Setting up...' : 'Launch Your Platform'}
        </Button>
      )}
    </div>
  );
}
