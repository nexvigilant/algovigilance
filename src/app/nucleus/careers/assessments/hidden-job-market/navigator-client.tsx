'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, Eye, HeartHandshake, Rocket, CheckCircle2, RotateCcw } from 'lucide-react';
import { AssessmentLayout } from '@/components/careers/assessments/assessment-layout';
import { type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import {
  NetworkMappingStep,
  VisibilityStep,
  RelationshipStep,
  ActionPlanStep
} from './step-components';

type Step = 'network-mapping' | 'visibility' | 'relationships' | 'action-plan' | 'complete';

interface NavigatorResponses {
  networkMapping: Record<string, string>;
  visibility: Record<string, string>;
  relationships: Record<string, string>;
}

const STEPS: AssessmentStep<Step>[] = [
  { id: 'network-mapping', label: 'Network', icon: Network, color: 'cyan' },
  { id: 'visibility', label: 'Visibility', icon: Eye, color: 'purple-400' },
  { id: 'relationships', label: 'Relationships', icon: HeartHandshake, color: 'gold' },
  { id: 'action-plan', label: 'Action Plan', icon: Rocket, color: 'green-400' },
];

const STEP_ORDER: Step[] = ['network-mapping', 'visibility', 'relationships', 'action-plan', 'complete'];

export function NavigatorClient() {
  const [currentStep, setCurrentStep] = useState<Step>('network-mapping');
  const [responses, setResponses] = useState<NavigatorResponses>({
    networkMapping: {},
    visibility: {},
    relationships: {}
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

  const updateResponses = useCallback((section: keyof NavigatorResponses, newResponses: Record<string, string>) => {
    setResponses(prev => ({
      ...prev,
      [section]: newResponses
    }));
  }, []);

  const handleReset = useCallback(() => {
    setResponses({
      networkMapping: {},
      visibility: {},
      relationships: {}
    });
    setCurrentStep('network-mapping');
  }, []);

  const handleComplete = useCallback(() => {
    setCurrentStep('complete');
  }, []);

  // Completion screen
  if (currentStep === 'complete') {
    const totalResponses =
      Object.values(responses.networkMapping).filter(v => v.trim().length >= 30).length +
      Object.values(responses.visibility).filter(v => v.trim().length >= 30).length +
      Object.values(responses.relationships).filter(v => v.trim().length >= 30).length;

    return (
      <Card className="bg-nex-surface border-nex-border">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-cyan" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Action Plan Complete!
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You&apos;ve created your personalized plan to access the hidden job market.
            Your action plans and templates are ready for implementation.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8 max-w-lg mx-auto">
            {STEPS.slice(0, 3).map(step => {
              const Icon = step.icon;
              const sectionKey = step.id === 'network-mapping' ? 'networkMapping' : step.id as keyof NavigatorResponses;
              const filledCount = Object.values(responses[sectionKey] || {}).filter(v => v.trim().length >= 30).length;

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
              onClick={() => goToStep('action-plan')}
              className="border-cyan text-cyan hover:bg-cyan/10"
            >
              View Action Plans
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

          <div className="mt-8 p-4 bg-gold/5 border border-gold/20 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Remember:</strong> The hidden job market rewards
              consistency over intensity. Start with Week 1 of your 30-day plan and build momentum.
            </p>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Assessment depth: {totalResponses}/12 areas completed
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AssessmentLayout
      steps={STEPS}
      currentStepId={currentStep}
      assessmentTitle="Hidden Job Market Navigator"
      onStepClick={(id) => (currentStep as string) !== 'complete' && STEP_ORDER.indexOf(id as Step) <= currentStepIndex && goToStep(id as Step)}
    >
      {currentStep === 'network-mapping' && (
        <NetworkMappingStep
          responses={responses.networkMapping}
          onUpdate={(newResponses) => updateResponses('networkMapping', newResponses)}
          onNext={goNext}
        />
      )}

      {currentStep === 'visibility' && (
        <VisibilityStep
          responses={responses.visibility}
          onUpdate={(newResponses) => updateResponses('visibility', newResponses)}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'relationships' && (
        <RelationshipStep
          responses={responses.relationships}
          onUpdate={(newResponses) => updateResponses('relationships', newResponses)}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'action-plan' && (
        <ActionPlanStep
          allResponses={responses}
          onBack={goBack}
          onComplete={handleComplete}
        />
      )}
    </AssessmentLayout>
  );
}
