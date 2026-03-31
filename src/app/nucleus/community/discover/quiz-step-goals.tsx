'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAREER_GOALS } from '@/types/circle-taxonomy';
import type { EnhancedQuizData } from './enhanced-discovery-quiz';

interface QuizStepGoalsProps {
  formData: EnhancedQuizData;
  toggleArraySelection: <K extends keyof EnhancedQuizData>(field: K, value: string) => void;
}

export function QuizStepGoals({ formData, toggleArraySelection }: QuizStepGoalsProps) {
  return (
    <div className="space-y-4">
      <p className="text-cyan-soft/70 mb-4">
        What are you hoping to achieve? Select all that apply.
      </p>

      <div className="grid gap-3">
        {CAREER_GOALS.map((goal) => {
          const isSelected = formData.careerGoals.includes(goal.id);
          return (
            <button
              key={goal.id}
              onClick={() => toggleArraySelection('careerGoals', goal.id)}
              className={cn(
                'relative rounded-lg border-2 p-4 text-left transition-all',
                isSelected
                  ? 'border-cyan bg-cyan/20 ring-2 ring-cyan/30'
                  : 'border-cyan/30 bg-nex-light hover:border-cyan/50 hover:bg-nex-border'
              )}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="pr-10">
                <span
                  className={cn(
                    'font-medium block',
                    isSelected ? 'text-cyan-soft' : 'text-white'
                  )}
                >
                  {goal.label}
                </span>
                <span className="text-sm text-cyan-soft/60">
                  {goal.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
