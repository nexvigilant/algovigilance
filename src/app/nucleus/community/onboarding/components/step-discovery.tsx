'use client';

/**
 * Step 2: Discovery Quiz
 *
 * Wraps the existing OnboardingQuiz with journey integration.
 * Collects interests, goals, and learning preferences.
 */

import { useState, useEffect } from 'react';
import { useOnboarding } from '../onboarding-context';
import { Button } from '@/components/ui/button';
import { Compass, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  saveOnboardingQuiz,
  type OnboardingQuizData,
  type ExperienceLevel,
} from '../../actions/user/onboarding';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const log = logger.scope('onboarding/step-discovery');

// Options from the original quiz
const INTERESTS = [
  'Regulatory Affairs',
  'Clinical Trials',
  'Drug Development',
  'Vigilance',
  'Medical Writing',
  'Quality Assurance',
  'Market Access',
  'Pharmacoeconomics',
  'Medical Affairs',
  'Data Science',
  'Biostatistics',
  'Project Management',
];

const GOALS = [
  { value: 'networking', label: 'Connect with Professionals' },
  { value: 'learning', label: 'Learn New Skills' },
  { value: 'job-seeking', label: 'Find Job Opportunities' },
  { value: 'mentoring', label: 'Find a Mentor' },
  { value: 'sharing-knowledge', label: 'Share Expertise' },
] as const;

const EXPERIENCE_LEVELS = [
  { value: 'practitioner', label: 'Practitioner / Recent Graduate' },
  { value: 'transitioning', label: 'Transitioning to Pharma' },
  { value: 'early-career', label: 'Early Career (0-3 years)' },
  { value: 'mid-career', label: 'Mid Career (4-10 years)' },
  { value: 'senior', label: 'Senior Professional (10+ years)' },
];

export function StepDiscovery() {
  const { completeStep, startStep } = useOnboarding();
  const { toast } = useToast();
  const [subStep, setSubStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<OnboardingQuizData>>({
    interests: [],
    goals: [],
    preferredTopics: [],
  });

  const totalSubSteps = 3; // Experience, Interests, Goals

  useEffect(() => {
    startStep('discovery');
  }, [startStep]);

  const toggleSelection = (
    field: 'interests' | 'goals',
    value: string
  ) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      const updated = current.includes(value as never)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const canProceed = () => {
    switch (subStep) {
      case 1:
        return formData.experience !== undefined;
      case 2:
        return (formData.interests?.length || 0) > 0;
      case 3:
        return (formData.goals?.length || 0) > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (subStep < totalSubSteps) setSubStep(subStep + 1);
  };

  const handleBack = () => {
    if (subStep > 1) setSubStep(subStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save quiz data
      const result = await saveOnboardingQuiz(formData as OnboardingQuizData);

      if (result.success) {
        // Complete the journey step
        await completeStep('discovery', {
          experience: formData.experience,
          interestsCount: formData.interests?.length,
          goalsCount: formData.goals?.length,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error ?? 'Failed to save preferences',
          variant: 'destructive',
        });
      }
    } catch (error) {
      log.error('Discovery submission error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan/10 mb-4">
          <Compass className="h-8 w-8 text-cyan" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Tell Us About Your Interests
        </h2>
        <p className="text-cyan-soft/70 max-w-md mx-auto">
          We'll use this to recommend relevant Circles and content.
        </p>
      </div>

      {/* Sub-step progress */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={cn(
              'h-2 w-12 rounded-full transition-colors',
              step <= subStep ? 'bg-cyan' : 'bg-nex-light'
            )}
          />
        ))}
      </div>

      {/* Sub-step content */}
      <div className="min-h-[320px]">
        {/* Sub-step 1: Experience Level */}
        {subStep === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                What's your experience level?
              </h3>
              <p className="text-sm text-cyan-soft/60">
                This helps us match you with relevant peers
              </p>
            </div>

            <div className="grid gap-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      experience: level.value as ExperienceLevel,
                    }))
                  }
                  className={cn(
                    'rounded-lg border-2 p-4 text-left transition-all',
                    formData.experience === level.value
                      ? 'border-cyan bg-cyan/10'
                      : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
                  )}
                >
                  <span className="font-medium text-white">{level.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-step 2: Interests */}
        {subStep === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                What topics interest you?
              </h3>
              <p className="text-sm text-cyan-soft/60">
                Select all that apply (at least one)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleSelection('interests', interest)}
                  className={cn(
                    'rounded-lg border-2 p-3 text-center transition-all text-sm',
                    formData.interests?.includes(interest)
                      ? 'border-cyan bg-cyan/10 text-white'
                      : 'border-cyan/30 bg-nex-light text-cyan-soft hover:border-cyan/50'
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-step 3: Goals */}
        {subStep === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                What are your goals?
              </h3>
              <p className="text-sm text-cyan-soft/60">
                What do you hope to achieve here?
              </p>
            </div>

            <div className="grid gap-3">
              {GOALS.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => toggleSelection('goals', goal.value)}
                  className={cn(
                    'rounded-lg border-2 p-4 text-left transition-all',
                    formData.goals?.includes(goal.value as never)
                      ? 'border-cyan bg-cyan/10'
                      : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
                  )}
                >
                  <span className="font-medium text-white">{goal.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-cyan/20">
        <Button
          onClick={handleBack}
          variant="ghost"
          disabled={subStep === 1}
          className="text-cyan-soft hover:text-cyan hover:bg-cyan/10"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        {subStep < totalSubSteps ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-cyan hover:bg-cyan-dark text-nex-deep"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !canProceed()}
            className="bg-cyan hover:bg-cyan-dark text-nex-deep"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
