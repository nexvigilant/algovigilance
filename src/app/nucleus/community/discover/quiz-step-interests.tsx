'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAREER_PATHWAYS } from '@/types/circle-taxonomy';
import { PROFESSIONAL_INTERESTS } from '@/lib/constants/organizations';
import type { EnhancedQuizData } from './enhanced-discovery-quiz';

interface QuizStepInterestsProps {
  formData: EnhancedQuizData;
  toggleArraySelection: <K extends keyof EnhancedQuizData>(field: K, value: string) => void;
}

export function QuizStepInterests({ formData, toggleArraySelection }: QuizStepInterestsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-white font-medium mb-2">Career Pathways</h4>
        <p className="text-sm text-cyan-soft/60 mb-3">
          Are you exploring any of these career transitions?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CAREER_PATHWAYS.map((pathway) => {
            const isSelected = formData.pathways.includes(pathway.id);
            return (
              <button
                key={pathway.id}
                onClick={() => toggleArraySelection('pathways', pathway.id)}
                className={cn(
                  'rounded border-2 p-2 text-left text-sm transition-all relative',
                  isSelected
                    ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                    : 'border-cyan/30 bg-nex-light text-white hover:border-cyan/50'
                )}
                title={pathway.description}
              >
                {isSelected && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
                {pathway.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-white font-medium mb-2">Professional Interests</h4>
        <p className="text-sm text-cyan-soft/60 mb-3">
          Topics you would like to explore or discuss
        </p>
        <div className="flex flex-wrap gap-2">
          {PROFESSIONAL_INTERESTS.map((interest) => {
            const isSelected = formData.interests.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => toggleArraySelection('interests', interest.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-all',
                  isSelected
                    ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                    : 'border-cyan/30 bg-nex-light text-white hover:border-cyan/50'
                )}
              >
                {interest.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
