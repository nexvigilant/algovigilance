'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DiscoveryQuizData, DiscoveryExperienceLevel } from '../actions/discovery/core';

// Available options (same as onboarding)
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
  'networking',
  'learning',
  'job-seeking',
  'mentoring',
  'sharing-knowledge',
];

const GOAL_LABELS: Record<string, string> = {
  networking: 'Connect with Professionals',
  learning: 'Learn New Skills',
  'job-seeking': 'Find Job Opportunities',
  mentoring: 'Find a Mentor',
  'sharing-knowledge': 'Share Expertise & Advocate',
};

const TOPICS = [
  'FDA Regulations',
  'EMA Guidelines',
  'Clinical Study Design',
  'Adverse Event Reporting',
  'Post-Marketing Surveillance',
  'Risk Management',
  'Health Economics',
  'Real World Evidence',
  'Digital Health',
  'AI in Healthcare',
];

const EXPERIENCE_LEVELS = [
  { value: 'practitioner', label: 'Practitioner / Recent Graduate' },
  { value: 'transitioning', label: 'Transitioning to Pharma' },
  { value: 'early-career', label: 'Early Career (0-3 years)' },
  { value: 'mid-career', label: 'Mid Career (4-10 years)' },
  { value: 'senior', label: 'Senior Professional (10+ years)' },
];

export function DiscoveryQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<DiscoveryQuizData>>({
    interests: [],
    goals: [],
    preferredTopics: [],
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleSelection = (
    field: 'interests' | 'goals' | 'preferredTopics',
    value: string
  ) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleComplete = () => {
    // Store quiz data in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('nex_discovery_quiz', JSON.stringify(formData));
    }
    // Navigate to results page
    router.push('/nucleus/community/discover/results');
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return (formData.interests?.length || 0) > 0;
      case 2:
        return (formData.goals?.length || 0) > 0;
      default:
        return true;
    }
  };

  const getValidationMessage = () => {
    if (canProceed()) return null;

    switch (step) {
      case 1:
        return 'Please select at least one area of interest to continue';
      case 2:
        return 'Please select at least one goal to continue';
      default:
        return null;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          router.back();
          break;
        case 'Enter':
          if (step < totalSteps && canProceed()) {
            handleNext();
          } else if (step === totalSteps) {
            handleComplete();
          }
          break;
        case 'ArrowLeft':
          if (step > 1) {
            handleBack();
          }
          break;
        case 'ArrowRight':
          if (step < totalSteps && canProceed()) {
            handleNext();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, formData]); // Re-run when step or formData changes

  return (
    <div className="flex min-h-screen items-center justify-center bg-nex-dark p-4">
      <Card className="relative w-full max-w-3xl border-cyan/30 bg-nex-surface p-8">
        {/* Close Button */}
        <button
          onClick={() => router.back()}
          className="group absolute right-4 top-4 rounded-lg border border-cyan/30 bg-nex-light p-2 transition-all hover:border-cyan/50 hover:bg-cyan/10"
          aria-label="Close quiz"
        >
          <X className="h-5 w-5 text-cyan-soft group-hover:text-cyan-glow" />
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan/30 bg-cyan/10">
            <Sparkles className="h-8 w-8 text-cyan-glow" />
          </div>
          <h1 className="mb-2 text-3xl font-bold font-headline text-white">
            Find Your Professional Home
          </h1>
          <p className="text-lg text-cyan-soft/70">
            Discover communities tailored to your interests and goals
          </p>
        </div>

        {/* Progress Bar with Step Indicators */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-cyan-soft">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-cyan-glow">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>

          {/* Step Indicators */}
          <div className="mb-3 flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum, idx) => (
              <div key={stepNum} className="flex flex-1 items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                    stepNum < step
                      ? 'border-green-500 bg-green-500' // Completed
                      : stepNum === step
                        ? 'border-cyan bg-cyan ring-4 ring-cyan/20' // Current
                        : 'border-cyan/30 bg-nex-light' // Upcoming
                  )}
                >
                  {stepNum < step ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-bold',
                        stepNum === step ? 'text-white' : 'text-cyan-soft/50'
                      )}
                    >
                      {stepNum}
                    </span>
                  )}
                </div>

                {/* Connecting Line (except after last step) */}
                {idx < 3 && (
                  <div className="mx-2 h-1 flex-1">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        stepNum < step ? 'bg-green-500' : 'bg-cyan/30'
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Interests */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  What interests you?
                </h3>
                <p className="text-cyan-soft/70">
                  Select all areas that match your professional interests
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {INTERESTS.map((interest) => {
                  const isSelected = formData.interests?.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleSelection('interests', interest)}
                      className={cn(
                        'relative rounded-lg border-2 p-3 text-center transition-all',
                        isSelected
                          ? 'border-cyan bg-cyan/20 ring-2 ring-cyan/30 shadow-[0_0_10px_rgba(0,255,255,0.15)]'
                          : 'border-cyan/30 bg-nex-light hover:border-cyan/50 hover:bg-nex-border'
                      )}
                      aria-pressed={isSelected}
                    >
                      {isSelected && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <span className={cn('text-sm', isSelected ? 'font-medium text-cyan-soft' : 'text-white')}>
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
                <h3 className="mb-2 text-2xl font-bold text-white">
                  What are your goals?
                </h3>
                <p className="text-cyan-soft/70">
                  Tell us what you hope to achieve
                </p>
              </div>

              <div className="grid gap-3">
                {GOALS.map((goal) => {
                  const isSelected = formData.goals?.includes(goal);
                  return (
                    <button
                      key={goal}
                      onClick={() => toggleSelection('goals', goal)}
                      className={cn(
                        'relative rounded-lg border-2 p-4 text-left transition-all',
                        isSelected
                          ? 'border-cyan bg-cyan/20 ring-2 ring-cyan/30 shadow-[0_0_10px_rgba(0,255,255,0.15)]'
                          : 'border-cyan/30 bg-nex-light hover:border-cyan/50 hover:bg-nex-border'
                      )}
                      aria-pressed={isSelected}
                    >
                      {isSelected && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <span className={cn('font-medium', isSelected ? 'text-cyan-soft' : 'text-white')}>
                        {GOAL_LABELS[goal]}
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
                <h3 className="mb-2 text-2xl font-bold text-white">
                  Any specific topics?
                </h3>
                <p className="text-cyan-soft/70">
                  Optional: Select topics you'd like to explore
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {TOPICS.map((topic) => {
                  const isSelected = formData.preferredTopics?.includes(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => toggleSelection('preferredTopics', topic)}
                      className={cn(
                        'relative rounded border-2 p-2 text-sm transition-all',
                        isSelected
                          ? 'border-cyan bg-cyan/20 text-cyan-soft font-medium ring-1 ring-cyan/30'
                          : 'border-cyan/30 bg-nex-light text-white hover:border-cyan/50 hover:bg-nex-border'
                      )}
                      aria-pressed={isSelected}
                    >
                      {isSelected && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan">
                          <Check className="h-2.5 w-2.5 text-white" />
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
                <h3 className="mb-2 text-2xl font-bold text-white">
                  What's your experience level?
                </h3>
                <p className="text-cyan-soft/70">
                  Optional: This helps us recommend the right communities
                </p>
              </div>

              <div className="grid gap-3">
                {EXPERIENCE_LEVELS.map((level) => {
                  const isSelected = formData.experience === level.value;
                  return (
                    <button
                      key={level.value}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          experience: level.value as DiscoveryExperienceLevel,
                        }))
                      }
                      className={cn(
                        'relative rounded-lg border-2 p-4 text-left transition-all',
                        isSelected
                          ? 'border-cyan bg-cyan/20 ring-2 ring-cyan/30 shadow-[0_0_10px_rgba(0,255,255,0.15)]'
                          : 'border-cyan/30 bg-nex-light hover:border-cyan/50 hover:bg-nex-border'
                      )}
                      aria-pressed={isSelected}
                    >
                      {isSelected && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <span className={cn('font-medium', isSelected ? 'text-cyan-soft' : 'text-white')}>
                        {level.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Validation Error Message */}
        {getValidationMessage() && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" />
            <p className="text-sm text-orange-300">{getValidationMessage()}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-cyan/30 pt-6">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={step === 1}
            className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step < totalSteps ? (
            <div className="flex gap-2">
              {/* Show Skip button for optional steps (3 & 4) */}
              {(step === 3 || step === 4) && (
                <Button
                  onClick={() => setStep(step + 1)}
                  variant="outline"
                  className="border-cyan/30 text-cyan-soft/70 hover:bg-cyan/10"
                >
                  Skip
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="hover:bg-cyan-dark/80 bg-cyan-dark text-white"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleComplete}
              className="hover:bg-cyan-dark/80 bg-cyan-dark text-white"
            >
              Show My Matches
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
