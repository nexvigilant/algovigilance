'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuizNavigationProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: (number | number[] | null)[];
  isLastQuestion: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onNavigateToQuestion: (index: number) => void;
}

export function QuizNavigation({
  currentQuestionIndex,
  totalQuestions,
  answers,
  isLastQuestion,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
  onNavigateToQuestion,
}: QuizNavigationProps) {
  const hasUnansweredQuestions = answers.some(
    (a) => a === null || a === undefined
  );

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      {/* Previous Button */}
      <Button
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
        variant="outline"
      >
        Previous
      </Button>

      {/* Question Navigator Dots */}
      <div className="flex gap-2">
        {Array.from({ length: totalQuestions }).map((_, index) => {
          const isAnswered = answers[index] !== null && answers[index] !== undefined;
          const isCurrent = index === currentQuestionIndex;

          return (
            <button
              key={index}
              onClick={() => onNavigateToQuestion(index)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : isAnswered
                  ? 'bg-cyan text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-muted'
              }`}
              aria-label={`Go to question ${index + 1}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* Next/Submit Button */}
      {isLastQuestion ? (
        <Button
          onClick={onSubmit}
          disabled={hasUnansweredQuestions || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      ) : (
        <Button onClick={onNext}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
