'use client';

import { Progress } from '@/components/ui/progress';

interface QuizProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
}

export function QuizProgress({
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
}: QuizProgressProps) {
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
        <span className="font-medium">{answeredCount} answered</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
