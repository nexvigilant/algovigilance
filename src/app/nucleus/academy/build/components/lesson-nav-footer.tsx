'use client';

import { ArrowLeft, ArrowRight, CheckCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LessonNavFooterProps {
  currentLessonNumber: number;
  totalLessons: number;
  hasPrevious: boolean;
  hasNext: boolean;
  isLessonCompleted: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
}

export function LessonNavFooter({
  currentLessonNumber,
  totalLessons,
  hasPrevious,
  hasNext,
  isLessonCompleted,
  onPrevious,
  onNext,
  onComplete,
}: LessonNavFooterProps) {
  // Smart button: Complete first, then allow navigation
  const handleNextClick = () => {
    if (!isLessonCompleted) {
      // Auto-complete then navigate
      onComplete();
      // Small delay to allow state to update
      setTimeout(() => onNext(), 100);
    } else {
      // Already completed, just navigate
      onNext();
    }
  };

  return (
    <footer className="border-t p-4 bg-card">
      <div className="container max-w-4xl mx-auto flex items-center justify-between">
        <Button onClick={onPrevious} disabled={!hasPrevious} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">
          Lesson {currentLessonNumber} of {totalLessons}
        </span>

        {hasNext ? (
          <Button onClick={handleNextClick}>
            {isLessonCompleted ? (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Complete & Next
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={onComplete} disabled={isLessonCompleted}>
            {isLessonCompleted ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Course Completed
              </>
            ) : (
              <>
                Complete Course
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </footer>
  );
}
