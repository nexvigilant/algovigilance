'use client';

import { Card } from '@/components/ui/card';
import { QuizProgress } from './quiz-progress';
import { QuestionRenderer } from './question-renderer';
import { QuizNavigation } from './quiz-navigation';
import type { QuizQuestion } from '@/types/academy';

interface QuizActiveScreenProps {
  currentQuestion: QuizQuestion;
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: (number | number[] | null)[];
  isLastQuestion: boolean;
  isSubmitting: boolean;
  onAnswer: (answer: number | number[]) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onNavigateToQuestion: (index: number) => void;
}

export function QuizActiveScreen({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  answers,
  isLastQuestion,
  isSubmitting,
  onAnswer,
  onPrevious,
  onNext,
  onSubmit,
  onNavigateToQuestion,
}: QuizActiveScreenProps) {
  const answeredCount = answers.filter((a) => a !== null && a !== undefined).length;
  const currentAnswer = answers[currentQuestionIndex];

  return (
    <Card className="p-8">
      {/* Progress Bar */}
      <QuizProgress
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
      />

      {/* Question */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-6">{currentQuestion.question}</h3>

        <QuestionRenderer
          question={currentQuestion}
          currentAnswer={currentAnswer}
          onAnswer={onAnswer}
        />
      </div>

      {/* Navigation */}
      <QuizNavigation
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answers={answers}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        onPrevious={onPrevious}
        onNext={onNext}
        onSubmit={onSubmit}
        onNavigateToQuestion={onNavigateToQuestion}
      />
    </Card>
  );
}
