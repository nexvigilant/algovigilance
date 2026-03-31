'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  ListChecks,
  Scale,
  Lightbulb,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { AssessmentLayout } from '@/components/careers/assessments/assessment-layout';
import { type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import { scenarios } from './scenario-data';
import { ChallengeStep } from './step-components/challenge-step';
import { ChoicesStep } from './step-components/choices-step';
import { ConsequencesStep } from './step-components/consequences-step';
import { CreativeStep } from './step-components/creative-step';
import { ConclusionsStep } from './step-components/conclusions-step';
import { ResultsSummary } from './results-summary';

const STEP_DATA: AssessmentStep[] = [
  { id: 'challenge', label: 'Challenge', icon: Target },
  { id: 'choices', label: 'Choices', icon: ListChecks },
  { id: 'consequences', label: 'Consequences', icon: Scale },
  { id: 'creative', label: 'Creative', icon: Lightbulb },
  { id: 'conclusions', label: 'Conclusions', icon: FileCheck }
];

interface UserResponses {
  challengeResponse: string;
  selectedChoices: string[];
  consequenceRankings: { [key: string]: number };
  creativeResponse: string;
  creativeFeedback: string | null;
  selectedRecommendation: string | null;
  justification: string;
}

const initialResponses: UserResponses = {
  challengeResponse: '',
  selectedChoices: [],
  consequenceRankings: {},
  creativeResponse: '',
  creativeFeedback: null,
  selectedRecommendation: null,
  justification: ''
};

export function FrameworkClient() {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<UserResponses>(initialResponses);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<number[]>([]);

  const scenario = scenarios[currentScenarioIndex];
  const totalSteps = STEP_DATA.length;
  const _progress = ((currentStep + 1) / totalSteps) * 100;

  // Step validation
  const isStepValid = useCallback((stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Challenge
        return responses.challengeResponse.trim().length >= 20;
      case 1: { // Choices
        const { choices } = scenario;
        return responses.selectedChoices.length >= choices.minSelections &&
               responses.selectedChoices.length <= choices.maxSelections;
      }
      case 2: // Consequences
        return Object.keys(responses.consequenceRankings).length === 4;
      case 3: // Creative
        return responses.creativeResponse.trim().length >= 50;
      case 4: // Conclusions
        return responses.selectedRecommendation !== null &&
               responses.justification.trim().length >= 30;
      default:
        return false;
    }
  }, [responses, scenario]);

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the scenario
      setIsComplete(true);
      if (!completedScenarios.includes(currentScenarioIndex)) {
        setCompletedScenarios([...completedScenarios, currentScenarioIndex]);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to completed steps or the next step after current
    if (stepIndex <= currentStep || (stepIndex === currentStep + 1 && isStepValid(currentStep))) {
      setCurrentStep(stepIndex);
    }
  };

  // Response handlers
  const updateResponses = <K extends keyof UserResponses>(key: K, value: UserResponses[K]) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  // AI Feedback handler for Creative step
  const handleRequestFeedback = async () => {
    setIsLoadingFeedback(true);
    try {
      const response = await fetch('/api/ai/signal-framework-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          scenarioTitle: scenario.title,
          userResponse: responses.creativeResponse,
          context: {
            challengeResponse: responses.challengeResponse,
            selectedChoices: responses.selectedChoices,
            consequenceRankings: responses.consequenceRankings
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        updateResponses('creativeFeedback', data.feedback);
      } else {
        // Fallback feedback if API fails
        updateResponses('creativeFeedback',
          "Your approach shows thoughtful consideration of the signal evaluation process. Consider how your suggested analyses would integrate with existing pharmacovigilance workflows and regulatory requirements. Strong responses typically address both statistical rigor and clinical plausibility."
        );
      }
    } catch (error) {
      // Fallback feedback on error
      updateResponses('creativeFeedback',
        "Your approach demonstrates engagement with the complexity of signal evaluation. Consider strengthening your response by explicitly connecting your proposed methods to the specific data patterns in this scenario."
      );
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  // Scenario selection
  const handleSelectScenario = (index: number) => {
    setCurrentScenarioIndex(index);
    setCurrentStep(0);
    setResponses(initialResponses);
    setIsComplete(false);
  };

  // Reset current scenario
  const handleRestart = () => {
    setCurrentStep(0);
    setResponses(initialResponses);
    setIsComplete(false);
  };

  // Render results view
  if (isComplete) {
    return (
      <ResultsSummary
        scenario={scenario}
        responses={responses}
        onRestart={handleRestart}
        onSelectNewScenario={() => {
          const nextIndex = (currentScenarioIndex + 1) % scenarios.length;
          handleSelectScenario(nextIndex);
        }}
        completedCount={completedScenarios.length}
        totalScenarios={scenarios.length}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <Card className="p-4 bg-nex-surface border-nex-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Select Scenario</h3>
          <Badge variant="outline" className="text-xs">
            {completedScenarios.length}/{scenarios.length} Completed
          </Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          {scenarios.map((s, i) => (
            <Button
              key={s.id}
              variant={currentScenarioIndex === i ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelectScenario(i)}
              className={currentScenarioIndex === i ? 'bg-cyan hover:bg-cyan-dark/80' : ''}
            >
              {completedScenarios.includes(i) && (
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              )}
              {s.title.split(':')[0]}
            </Button>
          ))}
        </div>
      </Card>

      <AssessmentLayout
        steps={STEP_DATA}
        currentStepId={STEP_DATA[currentStep].id}
        assessmentTitle="5 C's Decision Framework"
        badgeLabel="Signal Detection & Evaluation Assessment"
        onStepClick={(id) => handleStepClick(STEP_DATA.findIndex(s => s.id === id))}
      >
        {/* Step Content */}
        <div className="min-h-[500px]">
          {currentStep === 0 && (
            <ChallengeStep
              scenario={scenario}
              response={responses.challengeResponse}
              onResponseChange={(value) => updateResponses('challengeResponse', value)}
            />
          )}

          {currentStep === 1 && (
            <ChoicesStep
              scenario={scenario}
              selectedChoices={responses.selectedChoices}
              onChoicesChange={(choices) => updateResponses('selectedChoices', choices)}
            />
          )}

          {currentStep === 2 && (
            <ConsequencesStep
              scenario={scenario}
              rankings={responses.consequenceRankings}
              onRankingsChange={(rankings) => updateResponses('consequenceRankings', rankings)}
            />
          )}

          {currentStep === 3 && (
            <CreativeStep
              scenario={scenario}
              response={responses.creativeResponse}
              onResponseChange={(value) => updateResponses('creativeResponse', value)}
              aiFeedback={responses.creativeFeedback}
              onRequestFeedback={handleRequestFeedback}
              isLoadingFeedback={isLoadingFeedback}
            />
          )}

          {currentStep === 4 && (
            <ConclusionsStep
              scenario={scenario}
              selectedRecommendation={responses.selectedRecommendation}
              onRecommendationChange={(rec) => updateResponses('selectedRecommendation', rec)}
              justification={responses.justification}
              onJustificationChange={(value) => updateResponses('justification', value)}
            />
          )}
        </div>
      </AssessmentLayout>

      {/* Navigation */}
      <Card className="p-4 bg-nex-surface border-nex-border">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            {!isStepValid(currentStep) && (
              <span className="text-amber-500">
                Complete this step to continue
              </span>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={!isStepValid(currentStep)}
            className="bg-cyan hover:bg-cyan-dark/80 text-nex-deep"
          >
            {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
