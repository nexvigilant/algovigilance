'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { QuizAttempt } from '@/types/academy';

interface QuizIntroScreenProps {
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  attemptNumber: number;
  previousAttempts: QuizAttempt[];
  onStart: () => void;
}

export function QuizIntroScreen({
  totalQuestions,
  passingScore,
  maxAttempts,
  attemptNumber,
  previousAttempts,
  onStart,
}: QuizIntroScreenProps) {
  const bestScore =
    previousAttempts.length > 0
      ? Math.round(Math.max(...previousAttempts.map((a) => a.score)))
      : null;

  return (
    <Card className="p-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan/10 mb-6">
          <AlertCircle className="h-8 w-8 text-cyan" />
        </div>
        <h3 className="text-2xl font-bold mb-4">Ready for the Quiz?</h3>
        <div className="space-y-3 text-sm text-muted-foreground mb-8">
          <p>
            <strong>{totalQuestions}</strong> questions
          </p>
          <p>
            Passing score: <strong>{passingScore}%</strong>
          </p>
          {maxAttempts > 0 && (
            <p>
              Attempt <strong>{attemptNumber}</strong> of{' '}
              <strong>{maxAttempts}</strong>
            </p>
          )}
          {bestScore !== null && (
            <p>
              Best score: <strong>{bestScore}%</strong>
            </p>
          )}
        </div>
        <Button onClick={onStart} size="lg" className="w-full sm:w-auto">
          Start Quiz
        </Button>
      </div>
    </Card>
  );
}
