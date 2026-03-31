'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAREER_STAGE_LABELS } from '@/types/circle-taxonomy';
import type { CareerStage } from '@/types/circle-taxonomy';
import type { EnhancedQuizData } from './enhanced-discovery-quiz';

interface QuizStepCareerStageProps {
  formData: EnhancedQuizData;
  setFormData: React.Dispatch<React.SetStateAction<EnhancedQuizData>>;
}

export function QuizStepCareerStage({ formData, setFormData }: QuizStepCareerStageProps) {
  return (
    <div className="space-y-4">
      <p className="text-cyan-soft/70 mb-4">
        Select the stage that best describes where you are in your career
      </p>

      <div className="grid gap-3">
        {(Object.entries(CAREER_STAGE_LABELS) as [CareerStage, string][]).map(
          ([value, label]) => {
            const isSelected = formData.careerStage === value;
            return (
              <button
                key={value}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, careerStage: value }))
                }
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
                <span
                  className={cn(
                    'font-medium',
                    isSelected ? 'text-cyan-soft' : 'text-white'
                  )}
                >
                  {label}
                </span>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
