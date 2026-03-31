'use client';

import { CheckCircle, XCircle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface QuestionReviewItemProps {
  questionNumber: number;
  questionText: string;
  explanation?: string;
  isCorrect: boolean;
  userAnswer?: string;
  correctAnswer?: string;
  options?: readonly string[];
}

export function QuestionReviewItem({
  questionNumber,
  questionText,
  explanation,
  isCorrect,
  userAnswer,
  correctAnswer,
  options: _options,
}: QuestionReviewItemProps) {
  const [isExpanded, setIsExpanded] = useState(!isCorrect); // Auto-expand incorrect answers

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all',
        isCorrect
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-red-500/30 bg-red-500/5'
      )}
    >
      {/* Question Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-nex-light/20 transition-colors"
      >
        {isCorrect ? (
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-light">
            {questionNumber}. {questionText}
          </p>
          {!isCorrect && userAnswer && correctAnswer && (
            <p className="text-sm text-red-400 mt-1">
              Your answer: {userAnswer}
            </p>
          )}
        </div>
        {explanation && (
          <div className="flex-shrink-0 text-slate-dim">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        )}
      </button>

      {/* Expandable Explanation */}
      {explanation && isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div
            className={cn(
              'p-4 rounded-lg border',
              isCorrect
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/20'
            )}
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                {!isCorrect && correctAnswer && (
                  <p className="text-sm font-medium text-emerald-400 mb-2">
                    Correct answer: {correctAnswer}
                  </p>
                )}
                <p className="text-sm text-slate-light leading-relaxed">
                  {explanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show "Click to see explanation" hint for unexpanded items */}
      {explanation && !isExpanded && (
        <div className="px-4 pb-3 pt-0">
          <p className="text-xs text-slate-dim flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Click to see explanation
          </p>
        </div>
      )}
    </div>
  );
}
