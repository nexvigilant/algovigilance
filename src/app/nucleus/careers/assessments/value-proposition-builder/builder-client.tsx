'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Brain, Award, HandHelping, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { AssessmentLayout } from '@/components/careers/assessments/assessment-layout';
import { type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import {
  NetworksStep,
  ExpertiseStep,
  CredibilityStep,
  SupportStep,
  SynthesisStep
} from './step-components';

type Step = 'networks' | 'expertise' | 'credibility' | 'support' | 'synthesis' | 'complete';

interface NECSResponses {
  networks: Record<string, string>;
  expertise: Record<string, string>;
  credibility: Record<string, string>;
  support: Record<string, string>;
}

const STEPS: AssessmentStep<Step>[] = [
  { id: 'networks', label: 'Networks', icon: Users, color: 'cyan' },
  { id: 'expertise', label: 'Expertise', icon: Brain, color: 'purple-400' },
  { id: 'credibility', label: 'Credibility', icon: Award, color: 'gold' },
  { id: 'support', label: 'Support', icon: HandHelping, color: 'green-400' },
  { id: 'synthesis', label: 'Synthesis', icon: Sparkles, color: 'cyan' },
];

const STEP_ORDER: Step[] = ['networks', 'expertise', 'credibility', 'support', 'synthesis', 'complete'];

export function BuilderClient() {
  const [currentStep, setCurrentStep] = useState<Step>('networks');
  const [responses, setResponses] = useState<NECSResponses>({
    networks: {},
    expertise: {},
    credibility: {},
    support: {}
  });

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const _progress = currentStep === 'complete' ? 100 : (currentStepIndex / (STEP_ORDER.length - 1)) * 100;

  const goToStep = useCallback((step: Step) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      goToStep(STEP_ORDER[nextIndex]);
    }
  }, [currentStepIndex, goToStep]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(STEP_ORDER[prevIndex]);
    }
  }, [currentStepIndex, goToStep]);

  const updateResponses = useCallback((dimension: keyof NECSResponses, newResponses: Record<string, string>) => {
    setResponses(prev => ({
      ...prev,
      [dimension]: newResponses
    }));
  }, []);

  const handleReset = useCallback(() => {
    setResponses({
      networks: {},
      expertise: {},
      credibility: {},
      support: {}
    });
    setCurrentStep('networks');
  }, []);

  const handleComplete = useCallback(() => {
    setCurrentStep('complete');
  }, []);

  // Completion screen
  if (currentStep === 'complete') {
    return (
      <Card className="bg-nex-surface border-nex-border">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-cyan" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Value Proposition Complete!
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You&apos;ve successfully built your NECS value proposition. Your generated outputs
            are ready to use in LinkedIn profiles, advisory applications, and professional introductions.
          </p>

          <div className="grid grid-cols-4 gap-3 mb-8 max-lg mx-auto">
            {STEPS.slice(0, 4).map(step => {
              const Icon = step.icon;
              const dimension = step.id as keyof NECSResponses;
              const filledCount = Object.values(responses[dimension]).filter(v => v.trim().length >= 20).length;

              return (
                <div key={step.id} className="text-center">
                  {Icon && <Icon className={`h-6 w-6 mx-auto mb-1 text-${step.color}`} />}
                  <p className="text-xs font-semibold text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{filledCount} entries</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => goToStep('synthesis')}
              className="border-cyan text-cyan hover:bg-cyan/10"
            >
              View Outputs
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-nex-border text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>

          <div className="mt-8 p-4 bg-cyan/5 border border-cyan/20 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Next Steps:</strong> Use your generated LinkedIn summary
              to update your profile, or download all outputs for reference when applying to advisory positions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AssessmentLayout
      steps={STEPS}
      currentStepId={currentStep}
      assessmentTitle="Building Your Value Proposition"
      onStepClick={(id) => (currentStep as string) !== 'complete' && STEP_ORDER.indexOf(id as Step) <= currentStepIndex && goToStep(id as Step)}
    >
      {currentStep === 'networks' && (
        <NetworksStep
          responses={responses.networks}
          onUpdate={(newResponses) => updateResponses('networks', newResponses)}
          onNext={goNext}
        />
      )}

      {currentStep === 'expertise' && (
        <ExpertiseStep
          responses={responses.expertise}
          onUpdate={(newResponses) => updateResponses('expertise', newResponses)}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'credibility' && (
        <CredibilityStep
          responses={responses.credibility}
          onUpdate={(newResponses) => updateResponses('credibility', newResponses)}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'support' && (
        <SupportStep
          responses={responses.support}
          onUpdate={(newResponses) => updateResponses('support', newResponses)}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'synthesis' && (
        <SynthesisStep
          allResponses={responses}
          onBack={goBack}
          onComplete={handleComplete}
        />
      )}
    </AssessmentLayout>
  );
}
