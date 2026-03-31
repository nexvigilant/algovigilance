'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Check,
  X,
  Briefcase,
  TrendingUp,
  Users,
  Zap,
  Target,
  Compass,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CAREER_STAGE_LABELS } from '@/types/circle-taxonomy';
import type { CareerStage } from '@/types/circle-taxonomy';
import {
  CAREER_FUNCTIONS as _CAREER_FUNCTIONS,
  INDUSTRIES,
  PROFESSIONAL_SKILLS,
  PROFESSIONAL_INTERESTS,
  PROFESSIONAL_ORGANIZATIONS,
  GREEK_ORGANIZATIONS,
} from '@/lib/constants/organizations';
import { CAREER_GOALS, CAREER_PATHWAYS } from '@/types/circle-taxonomy';

import { logger } from '@/lib/logger';
const log = logger.scope('discover/enhanced-discovery-quiz');

/**
 * Enhanced quiz data structure for the 6-step flow
 */
export interface EnhancedQuizData {
  // Step 1: Career Context
  currentRole: string;
  currentIndustry: string;
  yearsExperience: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | '';

  // Step 2: Career Stage
  careerStage: CareerStage | '';

  // Step 3: Professional Connections
  organizations: string[];
  customAffiliations: string[];

  // Step 4: Skills & Growth
  currentSkills: string[];
  skillsToLearn: string[];

  // Step 5: Goals & Aspirations
  careerGoals: string[];

  // Step 6: Interests & Exploration
  pathways: string[];
  interests: string[];
}

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-50)' },
  { value: 'small', label: 'Small (51-200)' },
  { value: 'medium', label: 'Medium (201-1000)' },
  { value: 'large', label: 'Large (1001-5000)' },
  { value: 'enterprise', label: 'Enterprise (5000+)' },
];

const STEP_INFO = [
  {
    number: 1,
    title: 'Career Context',
    subtitle: 'Tell us about your current role',
    icon: Briefcase,
  },
  {
    number: 2,
    title: 'Career Stage',
    subtitle: 'Where are you in your journey?',
    icon: TrendingUp,
  },
  {
    number: 3,
    title: 'Professional Connections',
    subtitle: 'Organizations and networks',
    icon: Users,
  },
  {
    number: 4,
    title: 'Skills & Growth',
    subtitle: 'Your skills and learning goals',
    icon: Zap,
  },
  {
    number: 5,
    title: 'Goals & Aspirations',
    subtitle: 'What you want to achieve',
    icon: Target,
  },
  {
    number: 6,
    title: 'Interests & Exploration',
    subtitle: 'Topics and pathways to explore',
    icon: Compass,
  },
];

const ALL_ORGANIZATIONS = [...PROFESSIONAL_ORGANIZATIONS, ...GREEK_ORGANIZATIONS];

export function EnhancedDiscoveryQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<EnhancedQuizData>({
    currentRole: '',
    currentIndustry: '',
    yearsExperience: '',
    companySize: '',
    careerStage: '',
    organizations: [],
    customAffiliations: [],
    currentSkills: [],
    skillsToLearn: [],
    careerGoals: [],
    pathways: [],
    interests: [],
  });
  const [customAffiliation, setCustomAffiliation] = useState('');

  const totalSteps = 6;

  // Load saved progress from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nex_enhanced_quiz_progress');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(parsed.formData || formData);
          setStep(parsed.step || 1);
        } catch (parseError) {
          log.warn('[discovery-quiz] Failed to restore saved progress:', parseError);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'nex_enhanced_quiz_progress',
        JSON.stringify({ formData, step })
      );
    }
  }, [formData, step]);

  const handleNext = useCallback(() => {
    if (step < totalSteps) setStep(step + 1);
  }, [step, totalSteps]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const toggleArraySelection = <K extends keyof EnhancedQuizData>(
    field: K,
    value: string
  ) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const addCustomAffiliation = () => {
    if (customAffiliation.trim()) {
      setFormData((prev) => ({
        ...prev,
        customAffiliations: [...prev.customAffiliations, customAffiliation.trim()],
      }));
      setCustomAffiliation('');
    }
  };

  const removeCustomAffiliation = (affiliation: string) => {
    setFormData((prev) => ({
      ...prev,
      customAffiliations: prev.customAffiliations.filter((a) => a !== affiliation),
    }));
  };

  const handleComplete = () => {
    // Clear progress and store final quiz data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nex_enhanced_quiz_progress');
      localStorage.setItem('nex_enhanced_discovery_quiz', JSON.stringify(formData));
    }
    // Navigate to results page
    router.push('/nucleus/community/discover/results?enhanced=true');
  };

  const canProceed = () => {
    switch (step) {
      case 2: // Career Stage is required
        return formData.careerStage !== '';
      case 5: // At least one goal required
        return formData.careerGoals.length > 0;
      default:
        return true; // Other steps are optional
    }
  };

  const getValidationMessage = () => {
    if (canProceed()) return null;

    switch (step) {
      case 2:
        return 'Please select your career stage to continue';
      case 5:
        return 'Please select at least one goal to continue';
      default:
        return null;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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
  }, [step, formData, handleNext, handleBack]);

  const currentStepInfo = STEP_INFO[step - 1];
  const StepIcon = currentStepInfo.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-nex-dark p-golden-3">
      <Card className="relative w-full max-w-4xl border border-nex-light/60 bg-gradient-to-b from-nex-surface/80 to-nex-deep/40 p-golden-3 sm:p-golden-4">
        {/* Close Button */}
        <button
          onClick={() => router.back()}
          className="group absolute right-4 top-4 border border-nex-light/60 bg-nex-deep/60 p-2 transition-all hover:border-cyan/40 hover:bg-cyan/10"
          aria-label="Close quiz"
        >
          <X className="h-4 w-4 text-slate-dim/60 group-hover:text-cyan" />
        </button>

        {/* Header */}
        <div className="mb-golden-4 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-golden-2 inline-flex h-12 w-12 items-center justify-center border border-cyan/30 bg-cyan/8">
                <StepIcon className="h-6 w-6 text-cyan" />
              </div>
              <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/60 mb-1">
                AlgoVigilance Discovery — Phase {step}/{totalSteps}
              </p>
              <h1 className="mb-1 font-headline text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
                {currentStepInfo.title}
              </h1>
              <p className="text-golden-sm text-slate-dim/70 leading-golden">
                {currentStepInfo.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="mb-golden-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/60">
              Step {step} of {totalSteps}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan/70">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>

          {/* Step Indicator Bars */}
          <div className="hidden sm:flex items-center gap-1 mb-3">
            {STEP_INFO.map((s) => (
              <motion.div
                key={s.number}
                className="flex-1 h-1.5"
                initial={false}
                animate={{
                  backgroundColor: s.number <= step ? 'rgb(0, 174, 239)' : 'rgba(0, 174, 239, 0.15)',
                }}
                transition={{ duration: 0.3, delay: s.number <= step ? (s.number - 1) * 0.05 : 0 }}
              />
            ))}
          </div>

          {/* Mobile Progress Bar */}
          <div className="sm:hidden h-1.5 bg-cyan/15 overflow-hidden">
            <motion.div
              className="h-full bg-cyan"
              initial={false}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[350px] sm:min-h-[400px]">
          <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
          {/* Step 1: Career Context */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentRole" className="text-cyan-soft">
                    Current Role / Title
                  </Label>
                  <Input
                    id="currentRole"
                    placeholder="e.g., Senior Clinical Research Associate"
                    value={formData.currentRole}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, currentRole: e.target.value }))
                    }
                    className="border-cyan/30 bg-nex-light text-white placeholder:text-cyan-soft/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-cyan-soft">
                    Industry
                  </Label>
                  <Select
                    value={formData.currentIndustry}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, currentIndustry: value }))
                    }
                  >
                    <SelectTrigger className="border-cyan/30 bg-nex-light text-white">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind.id} value={ind.id}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-cyan-soft">
                    Years of Experience
                  </Label>
                  <Select
                    value={formData.yearsExperience}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, yearsExperience: value }))
                    }
                  >
                    <SelectTrigger className="border-cyan/30 bg-nex-light text-white">
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">Less than 1 year</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="4-7">4-7 years</SelectItem>
                      <SelectItem value="8-12">8-12 years</SelectItem>
                      <SelectItem value="13+">13+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize" className="text-cyan-soft">
                    Company Size
                  </Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        companySize: value as EnhancedQuizData['companySize'],
                      }))
                    }
                  >
                    <SelectTrigger className="border-cyan/30 bg-nex-light text-white">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-sm text-cyan-soft/50 mt-4">
                All fields are optional. Share what you are comfortable with.
              </p>
            </div>
          )}

          {/* Step 2: Career Stage */}
          {step === 2 && (
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
          )}

          {/* Step 3: Professional Connections */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-white font-medium mb-3">
                  Professional Organizations
                </h4>
                <p className="text-sm text-cyan-soft/60 mb-3">
                  Select any organizations you are a member of
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {ALL_ORGANIZATIONS.slice(0, 18).map((org) => {
                    const isSelected = formData.organizations.includes(org.id);
                    return (
                      <button
                        key={org.id}
                        onClick={() => toggleArraySelection('organizations', org.id)}
                        className={cn(
                          'rounded border-2 p-2 text-xs text-left transition-all relative',
                          isSelected
                            ? 'border-cyan bg-cyan/20 text-cyan-soft'
                            : 'border-cyan/30 bg-nex-light text-white hover:border-cyan/50'
                        )}
                        title={org.name}
                      >
                        {isSelected && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                        <span className="line-clamp-2">{org.acronym || org.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Custom Affiliations</h4>
                <p className="text-sm text-cyan-soft/60 mb-2">
                  Add other organizations, alumni networks, or groups
                </p>
                <div className="flex gap-2">
                  <Input
                    value={customAffiliation}
                    onChange={(e) => setCustomAffiliation(e.target.value)}
                    placeholder="Enter organization name"
                    className="border-cyan/30 bg-nex-light text-white placeholder:text-cyan-soft/40"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomAffiliation();
                      }
                    }}
                  />
                  <Button
                    onClick={addCustomAffiliation}
                    variant="outline"
                    className="border-cyan/30 text-cyan-soft"
                  >
                    Add
                  </Button>
                </div>
                {formData.customAffiliations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.customAffiliations.map((aff) => (
                      <span
                        key={aff}
                        className="inline-flex items-center gap-1 rounded-full bg-cyan/20 px-3 py-1 text-sm text-cyan-soft"
                      >
                        {aff}
                        <button
                          onClick={() => removeCustomAffiliation(aff)}
                          className="hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Skills & Growth */}
          {step === 4 && (
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
          )}

          {/* Step 5: Goals & Aspirations */}
          {step === 5 && (
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
          )}

          {/* Step 6: Interests & Exploration */}
          {step === 6 && (
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
          )}
          </motion.div>
          </AnimatePresence>
        </div>

        {/* Validation Error Message */}
        {getValidationMessage() && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" />
            <p className="text-sm text-orange-300">{getValidationMessage()}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-cyan/30 pt-5">
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
              {/* Show Skip button for optional steps */}
              {step !== 2 && step !== 5 && (
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
              Discover My Path
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
