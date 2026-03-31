'use client';

import { cn } from '@/lib/utils';
import { PROFESSIONAL_SKILLS } from '@/lib/constants/organizations';
import type { EnhancedQuizData } from './enhanced-discovery-quiz';

interface QuizStepSkillsProps {
  formData: EnhancedQuizData;
  toggleArraySelection: <K extends keyof EnhancedQuizData>(field: K, value: string) => void;
}

export function QuizStepSkills({ formData, toggleArraySelection }: QuizStepSkillsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-white font-medium mb-2">Current Skills</h4>
        <p className="text-sm text-cyan-soft/60 mb-3">
          Select skills you already have
        </p>
        <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto">
          {PROFESSIONAL_SKILLS.map((skill) => {
            const isSelected = formData.currentSkills.includes(skill.id);
            return (
              <button
                key={skill.id}
                onClick={() => toggleArraySelection('currentSkills', skill.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-all',
                  isSelected
                    ? 'border-green-500 bg-green-500/20 text-green-300'
                    : 'border-cyan/30 bg-nex-light text-white hover:border-cyan/50'
                )}
              >
                {skill.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-white font-medium mb-2">Skills to Develop</h4>
        <p className="text-sm text-cyan-soft/60 mb-3">
          Select skills you want to learn or improve
        </p>
        <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto">
          {PROFESSIONAL_SKILLS.map((skill) => {
            const isSelected = formData.skillsToLearn.includes(skill.id);
            return (
              <button
                key={skill.id}
                onClick={() => toggleArraySelection('skillsToLearn', skill.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-all',
                  isSelected
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                    : 'border-cyan/30 bg-nex-light text-white hover:border-cyan/50'
                )}
              >
                {skill.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
