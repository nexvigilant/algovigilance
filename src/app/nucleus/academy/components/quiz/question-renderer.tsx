'use client';

import type { QuizQuestion } from '@/types/academy';
import { isMultipleChoice, isTrueFalse, isMultipleSelect } from '@/types/academy';
import { MultipleChoice } from './question-types/multiple-choice';
import { TrueFalse } from './question-types/true-false';
import { MultipleSelect } from './question-types/multiple-select';

interface QuestionRendererProps {
  question: QuizQuestion;
  currentAnswer: number | number[] | null;
  onAnswer: (answer: number | number[]) => void;
}

export function QuestionRenderer({ question, currentAnswer, onAnswer }: QuestionRendererProps) {
  if (isMultipleChoice(question)) {
    return (
      <MultipleChoice
        options={question.options}
        currentAnswer={typeof currentAnswer === 'number' ? currentAnswer : null}
        onAnswer={onAnswer}
      />
    );
  }

  if (isTrueFalse(question)) {
    return (
      <TrueFalse
        currentAnswer={typeof currentAnswer === 'number' ? currentAnswer : null}
        onAnswer={onAnswer}
      />
    );
  }

  if (isMultipleSelect(question)) {
    return (
      <MultipleSelect
        options={question.options}
        currentAnswers={Array.isArray(currentAnswer) ? currentAnswer : []}
        onAnswer={onAnswer}
      />
    );
  }

  return (
    <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
      <p className="text-sm text-yellow-800 dark:text-yellow-200">
        Unknown question type: {(question as Record<string, unknown>).type as string}
      </p>
    </div>
  );
}
