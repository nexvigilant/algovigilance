'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  COMMUNITY_INTERESTS,
  COMMUNITY_GOALS,
  COMMUNITY_GOAL_LABELS,
  COMMUNITY_TOPICS,
  EXPERIENCE_LEVELS,
  type CommunityQuizData,
  type CommunityInterest,
  type CommunityGoal,
  type CommunityTopic,
  type ExperienceLevel,
} from '@/data/community-quiz';

interface QuizStepContentProps {
  step: number;
  formData: CommunityQuizData;
  toggleInterest: (value: string) => void;
  toggleGoal: (value: string) => void;
  toggleTopic: (value: string) => void;
  setExperience: (value: ExperienceLevel) => void;
  stepHeadingRef: React.RefObject<HTMLHeadingElement | null>;
}

export function QuizStepContent({
  step,
  formData,
  toggleInterest,
  toggleGoal,
  toggleTopic,
  setExperience,
  stepHeadingRef,
}: QuizStepContentProps) {
  return (
    <div className="min-h-[400px]">
      {/* Step 1: Interests */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="mb-2 text-2xl font-bold text-white outline-none"
            >
              What interests you?
            </h2>
            <p className="text-slate-dim">
              Select all areas that match your professional interests
            </p>
          </div>

          <div
            className="grid grid-cols-2 gap-3 md:grid-cols-3"
            role="group"
            aria-label="Interest options"
          >
            {COMMUNITY_INTERESTS.map((interest: CommunityInterest) => {
              const isSelected = formData.interests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    'relative rounded-lg border-2 p-3 text-center transition-all touch-target',
                    'focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-nex-surface',
                    isSelected
                      ? 'border-cyan bg-cyan/20 ring-2 ring-cyan/30 shadow-[0_0_10px_rgba(0,174,239,0.15)]'
                      : 'border-cyan/30 bg-nex-dark hover:border-cyan/50 hover:bg-nex-light/50'
                  )}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <div
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan"
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3 text-nex-deep" />
                    </div>
                  )}
                  <span
                    className={cn(
                      'text-sm',
                      isSelected ? 'font-medium text-cyan' : 'text-white'
                    )}
                  >
                    {interest}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Goals */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="mb-2 text-2xl font-bold text-white outline-none"
            >
              What are your goals?
            </h2>
            <p className="text-slate-dim">
              Tell us what you hope to achieve
            </p>
          </div>

          <div
            className="grid gap-3"
            role="group"
            aria-label="Goal options"
          >
            {COMMUNITY_GOALS.map((goal: CommunityGoal) => {
              const isSelected = formData.goals.includes(goal);
              return (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={cn(
                    'relative rounded-lg border-2 p-4 text-left transition-all touch-target',
                    'focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-nex-surface',
                    isSelected
                      ? 'border-cyan bg-cyan/20 ring-2 ring-cyan/30 shadow-[0_0_10px_rgba(0,174,239,0.15)]'
                      : 'border-cyan/30 bg-nex-dark hover:border-cyan/50 hover:bg-nex-light/50'
                  )}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan"
                      aria-hidden="true"
                    >
                      <Check className="h-4 w-4 text-nex-deep" />
                    </div>
                  )}
                  <span
                    className={cn(
                      'font-medium',
                      isSelected ? 'text-cyan' : 'text-white'
                    )}
                  >
                    {COMMUNITY_GOAL_LABELS[goal]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Preferred Topics */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="mb-2 text-2xl font-bold text-white outline-none"
            >
              Any specific topics?
            </h2>
            <p className="text-slate-dim">
              Optional: Select topics you&apos;d like to explore
            </p>
          </div>

          <div
            className="grid grid-cols-2 gap-3"
            role="group"
            aria-label="Topic options"
          >
            {COMMUNITY_TOPICS.map((topic: CommunityTopic) => {
              const isSelected = formData.preferredTopics.includes(topic);
              return (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    'relative rounded-lg border-2 p-3 text-sm transition-all touch-target',
                    'focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-nex-surface',
                    isSelected
                      ? 'border-cyan bg-cyan/20 text-cyan font-medium ring-1 ring-cyan/30'
                      : 'border-cyan/30 bg-nex-dark text-white hover:border-cyan/50 hover:bg-nex-light/50'
                  )}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <span
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan"
                      aria-hidden="true"
                    >
                      <Check className="h-2.5 w-2.5 text-nex-deep" />
                    </span>
                  )}
                  {topic}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Experience Level */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="mb-2 text-2xl font-bold text-white outline-none"
            >
              What&apos;s your experience level?
            </h2>
            <p className="text-slate-dim">
              Optional: This helps us recommend the right communities
            </p>
          </div>

          <div
            className="grid gap-3"
            role="group"
            aria-label="Experience level options"
          >
            {EXPERIENCE_LEVELS.map((level) => {
              const isSelected = formData.experience === level.value;
              return (
                <button
                  key={level.value}
                  onClick={() => setExperience(level.value as ExperienceLevel)}
                  className={cn(
                    'relative rounded-lg border-2 p-4 text-left transition-all touch-target',
                    'focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-nex-surface',
                    isSelected
                      ? 'border-cyan bg-cyan/20 ring-2 ring-cyan/30 shadow-[0_0_10px_rgba(0,174,239,0.15)]'
                      : 'border-cyan/30 bg-nex-dark hover:border-cyan/50 hover:bg-nex-light/50'
                  )}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan"
                      aria-hidden="true"
                    >
                      <Check className="h-4 w-4 text-nex-deep" />
                    </div>
                  )}
                  <span
                    className={cn(
                      'font-medium',
                      isSelected ? 'text-cyan' : 'text-white'
                    )}
                  >
                    {level.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
