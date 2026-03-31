'use client';

import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuestionReviewItem } from './question-review-item';
import type { QuizQuestion, QuizAttempt } from '@/types/academy';

/**
 * Get the display text for a user's answer
 */
function getAnswerText(question: QuizQuestion, answer: number | number[]): string {
  if (question.type === 'true-false') {
    return answer === 1 ? 'True' : 'False';
  }

  if (question.type === 'multiple-select') {
    const indices = answer as number[];
    return indices.map(i => question.options[i]).join(', ');
  }

  // multiple-choice
  return question.options[answer as number];
}

/**
 * Get the display text for the correct answer
 */
function getCorrectAnswerText(question: QuizQuestion): string {
  if (question.type === 'true-false') {
    return question.correctAnswer === 1 ? 'True' : 'False';
  }

  if (question.type === 'multiple-select') {
    return question.correctAnswer.map(i => question.options[i]).join(', ');
  }

  // multiple-choice
  return question.options[question.correctAnswer];
}

interface QuizResultsScreenProps {
  result: Omit<QuizAttempt, 'completedAt'>;
  questions: QuizQuestion[];
  answers: (number | number[])[];
  passingScore: number;
  canRetry: boolean;
  onRetry: () => void;
}

export function QuizResultsScreen({
  result,
  questions,
  answers,
  passingScore,
  canRetry,
  onRetry,
}: QuizResultsScreenProps) {
  const checkAnswer = (question: QuizQuestion, userAnswer: number | number[]): boolean => {
    if (userAnswer === null || userAnswer === undefined) return false;

    if (question.type === 'multiple-select') {
      const correctAnswers = question.correctAnswer as number[];
      const userAnswers = userAnswer as number[];

      if (userAnswers.length !== correctAnswers.length) return false;

      return (
        correctAnswers.every((answer) => userAnswers.includes(answer)) &&
        userAnswers.every((answer) => correctAnswers.includes(answer))
      );
    }

    return userAnswer === question.correctAnswer;
  };

  return (
    <Card className="p-8">
      <div className="text-center max-w-2xl mx-auto">
        {/* Result Icon */}
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
            result.passed ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}
        >
          {result.passed ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <XCircle className="h-8 w-8 text-red-500" />
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-2xl font-bold mb-2">
          {result.passed ? 'Congratulations!' : 'Not Quite There'}
        </h3>
        <p className="text-muted-foreground mb-8">
          {result.passed
            ? 'You passed the quiz!'
            : `You need ${passingScore}% to pass. Review the material and try again.`}
        </p>

        {/* Score Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Your Score</p>
            <p className="text-3xl font-bold">{Math.round(result.score)}%</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Points</p>
            <p className="text-3xl font-bold">
              {result.pointsEarned}/{result.pointsPossible}
            </p>
          </div>
        </div>

        {/* Question Review */}
        <div className="text-left space-y-4 mb-8">
          <h4 className="font-semibold text-lg text-slate-light">Review Answers</h4>
          <p className="text-sm text-slate-dim mb-4">
            Click on any question to see the explanation and learn more.
          </p>
          {questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = checkAnswer(question, userAnswer);

            return (
              <QuestionReviewItem
                key={question.id}
                questionNumber={index + 1}
                questionText={question.question}
                explanation={question.explanation}
                isCorrect={isCorrect}
                userAnswer={userAnswer !== undefined && userAnswer !== null
                  ? getAnswerText(question, userAnswer)
                  : undefined
                }
                correctAnswer={getCorrectAnswerText(question)}
                options={question.type !== 'true-false' ? question.options : undefined}
              />
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {!result.passed && canRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Quiz
            </Button>
          )}
          {result.passed && (
            <Badge className="text-lg px-4 py-2 bg-green-500">
              Lesson Complete!
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
