'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  saveOnboardingQuiz,
  type OnboardingQuizData,
  type ExperienceLevel,
  type LearningStyle,
} from '../actions/user/onboarding';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { logger } from '@/lib/logger';
const log = logger.scope('onboarding/onboarding-quiz');

// Available options
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
] as const;

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

const LEARNING_STYLES = [
  { value: 'visual', label: 'Visual (Videos, Diagrams)', icon: '📺' },
  { value: 'reading', label: 'Reading (Articles, Guides)', icon: '📚' },
  { value: 'hands-on', label: 'Hands-on (Projects, Practice)', icon: '🛠️' },
  { value: 'discussion', label: 'Discussion (Forums, Groups)', icon: '💬' },
];

export function OnboardingQuiz() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<OnboardingQuizData>>({
    interests: [],
    goals: [],
    preferredTopics: [],
  });

  const totalSteps = 5;

  // Check for discovery quiz data from localStorage and pre-fill form
  useEffect(() => {
    const stored = localStorage.getItem('nex_discovery_quiz');
    if (stored) {
      try {
        const discoveryData = JSON.parse(stored);
        // Pre-fill form with discovery data
        setFormData((prev) => ({
          ...prev,
          interests: discoveryData.interests || prev.interests,
          goals: discoveryData.goals || prev.goals,
          preferredTopics:
            discoveryData.preferredTopics || prev.preferredTopics,
          experience: discoveryData.experience || prev.experience,
        }));
        // Clear discovery data after transferring
        localStorage.removeItem('nex_discovery_quiz');
      } catch (error) {
        log.error('Error loading discovery data:', error);
      }
    }
  }, []);

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await saveOnboardingQuiz(formData as OnboardingQuizData);
      if (result.success) {
        // Save quiz data to localStorage for matches page
        localStorage.setItem('nex_discovery_quiz', JSON.stringify(formData));
        // Redirect to circle matches
        router.push('/nucleus/community/discover/matches');
      } else {
        toast({
          title: 'Failed to save',
          description: result.error || 'Please try again.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      log.error('Submit error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 2:
        return formData.experience !== undefined;
      case 3:
        return (formData.interests?.length || 0) > 0;
      case 4:
        return (formData.goals?.length || 0) > 0;
      default:
        return true;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-nex-dark p-4">
      <Card className="w-full max-w-3xl border-cyan/30 bg-nex-surface p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-cyan-soft">
              Welcome to the AlgoVigilance Community
            </h2>
            <span className="text-sm text-cyan-glow">
              Step {step} of {totalSteps}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-nex-light">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-cyan to-cyan-glow transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Roles */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  Tell us about yourself
                </h3>
                <p className="text-cyan-soft/70">
                  Help us personalize your experience
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentRole" className="text-cyan-soft">
                    Current Role (Optional)
                  </Label>
                  <Input
                    id="currentRole"
                    value={formData.currentRole || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currentRole: e.target.value,
                      }))
                    }
                    placeholder="e.g., Clinical Research Associate"
                    className="mt-1 border-cyan/30 bg-nex-light text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="targetRole" className="text-cyan-soft">
                    Target Role (Optional)
                  </Label>
                  <Input
                    id="targetRole"
                    value={formData.targetRole || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetRole: e.target.value,
                      }))
                    }
                    placeholder="e.g., Regulatory Affairs Manager"
                    className="mt-1 border-cyan/30 bg-nex-light text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Experience Level */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  What's your experience level?
                </h3>
                <p className="text-cyan-soft/70">
                  This helps us match you with relevant content
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
                    <span className="font-medium text-white">
                      {level.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  What are your interests?
                </h3>
                <p className="text-cyan-soft/70">
                  Select all that apply (at least one required)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleSelection('interests', interest)}
                    className={cn(
                      'rounded-lg border-2 p-3 text-center transition-all',
                      formData.interests?.includes(interest)
                        ? 'border-cyan bg-cyan/10'
                        : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
                    )}
                  >
                    <span className="text-sm text-white">{interest}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Goals */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  What are your goals?
                </h3>
                <p className="text-cyan-soft/70">
                  Select all that apply (at least one required)
                </p>
              </div>

              <div className="grid gap-3">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleSelection('goals', goal)}
                    className={cn(
                      'rounded-lg border-2 p-4 text-left transition-all',
                      formData.goals?.includes(goal)
                        ? 'border-cyan bg-cyan/10'
                        : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
                    )}
                  >
                    <span className="font-medium text-white">
                      {GOAL_LABELS[goal]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Topics & Learning Style */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-2xl font-bold text-white">
                  Almost done!
                </h3>
                <p className="text-cyan-soft/70">
                  A few more preferences to personalize your experience
                </p>
              </div>

              <div>
                <Label className="mb-3 block text-cyan-soft">
                  Preferred Topics (Optional)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => toggleSelection('preferredTopics', topic)}
                      className={cn(
                        'rounded border p-2 text-sm transition-all',
                        formData.preferredTopics?.includes(topic)
                          ? 'border-cyan bg-cyan/10 text-white'
                          : 'border-cyan/30 bg-nex-light text-cyan-soft hover:border-cyan/50'
                      )}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block text-cyan-soft">
                  Learning Style (Optional)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {LEARNING_STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          learningStyle: style.value as LearningStyle,
                        }))
                      }
                      className={cn(
                        'rounded-lg border-2 p-3 text-left transition-all',
                        formData.learningStyle === style.value
                          ? 'border-cyan bg-cyan/10'
                          : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
                      )}
                    >
                      <div className="mb-1 text-2xl">{style.icon}</div>
                      <span className="text-sm text-white">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

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
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="hover:bg-cyan-dark/80 bg-cyan-dark text-white"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="hover:bg-cyan-dark/80 bg-cyan-dark text-white"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  Complete
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
