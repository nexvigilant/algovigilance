'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Step, CallBackProps } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

// Dynamic import to avoid SSR issues
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

export interface TourStep extends Omit<Step, 'target'> {
  target: string;
}

interface AssessmentTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
}

const TOUR_STORAGE_KEY_PREFIX = 'nexvigilant-tour-completed-';

export function AssessmentTour({ tourId, steps, onComplete }: AssessmentTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [_hasSeenTour, setHasSeenTour] = useState(true); // Default true to prevent flash
  const [isClient, setIsClient] = useState(false);

  // Check if user has seen tour before
  useEffect(() => {
    setIsClient(true);
    const storageKey = `${TOUR_STORAGE_KEY_PREFIX}${tourId}`;
    const seen = localStorage.getItem(storageKey);
    setHasSeenTour(seen === 'true');

    // Auto-start tour for first-time users after a brief delay
    if (!seen) {
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [tourId]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status as string)) {
      setRun(false);
      setStepIndex(0);
      // Mark tour as completed
      const storageKey = `${TOUR_STORAGE_KEY_PREFIX}${tourId}`;
      localStorage.setItem(storageKey, 'true');
      setHasSeenTour(true);
      onComplete?.();
    } else if (type === 'step:after') {
      // Update step index for controlled mode
      if (action === 'next') {
        setStepIndex(index + 1);
      } else if (action === 'prev') {
        setStepIndex(index - 1);
      }
    }
  }, [tourId, onComplete]);

  const handleStartTour = useCallback(() => {
    setStepIndex(0);
    setRun(true);
  }, []);

  if (!isClient) return null;

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        disableOverlayClose
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#00D4FF', // cyan
            backgroundColor: '#1A2A40', // nex-surface
            textColor: '#E2E8F0', // text
            arrowColor: '#1A2A40',
            overlayColor: 'rgba(10, 22, 40, 0.85)',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: '12px',
            padding: '16px',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          tooltipTitle: {
            color: '#D4AF37', // gold
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '8px',
          },
          tooltipContent: {
            color: '#E2E8F0',
            fontSize: '14px',
            lineHeight: '1.5',
          },
          buttonNext: {
            backgroundColor: '#00D4FF',
            color: '#0A1628',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 500,
          },
          buttonBack: {
            color: '#94A3B8',
            marginRight: '8px',
          },
          buttonSkip: {
            color: '#94A3B8',
          },
          spotlight: {
            borderRadius: '8px',
          },
          beacon: {
            display: 'none', // We use our own help button
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip tour',
        }}
      />

      {/* Help button to restart tour */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleStartTour}
        className="fixed bottom-4 right-4 z-50 border-cyan/30 bg-nex-surface/90 backdrop-blur hover:bg-nex-surface hover:border-cyan shadow-lg"
        title="Take a guided tour"
      >
        <HelpCircle className="h-4 w-4 mr-2 text-cyan" />
        <span className="text-sm text-foreground">Help</span>
      </Button>
    </>
  );
}

// Pre-built tour configurations for assessments
export const PERFORMANCE_CONDITIONS_TOUR: TourStep[] = [
  {
    target: '[data-tour="step-header"]',
    title: 'Welcome to Your Performance Map',
    content: 'This assessment helps you discover the work conditions where you perform best. It takes about 10-15 minutes to complete.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="progress-bar"]',
    title: 'Track Your Progress',
    content: 'The progress bar shows how far you\'ve come. Your progress is automatically saved, so you can return anytime.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="preference-slider"]',
    title: 'Preference Sliders',
    content: 'Use the 1-7 scale to indicate your preferences:\n• 1-2: Strong preference for the left option\n• 3-5: Balanced/flexible\n• 6-7: Strong preference for the right option',
    placement: 'top',
  },
  {
    target: '[data-tour="importance-selector"]',
    title: 'How Important Is This?',
    content: 'After selecting a preference, mark how critical this condition is:\n• Critical: Deal-breaker if not met\n• Important: Strongly preferred\n• Nice to Have: Flexible on this',
    placement: 'top',
  },
  {
    target: '[data-tour="navigation-buttons"]',
    title: 'Navigate Easily',
    content: 'Use Next and Back to move through the 6 sections. Your answers are saved automatically.',
    placement: 'top',
  },
];

export const BOARD_EFFECTIVENESS_TOUR: TourStep[] = [
  {
    target: '[data-tour="step-header"]',
    title: 'Board Effectiveness Checklist',
    content: 'Evaluate your board across 8 governance dimensions with 42 checkpoints. Your progress is automatically saved.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="progress-bar"]',
    title: 'Track Your Progress',
    content: 'Navigate through sections using the progress indicators. Click completed steps to go back.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="rating-selector"]',
    title: 'Rate Each Item',
    content: 'For each governance practice:\n• Yes: Fully implemented\n• Partial: Partially in place\n• No: Not implemented\n• N/A: Not applicable',
    placement: 'top',
  },
  {
    target: '[data-tour="importance-selector"]',
    title: 'Set Priority Level',
    content: 'After rating an item, mark its priority:\n• Critical: Essential for governance\n• Important: Strongly recommended\n• Nice to Have: Good but optional',
    placement: 'top',
  },
  {
    target: '[data-tour="navigation-buttons"]',
    title: 'Navigate Sections',
    content: 'Move through the 8 dimensions: Strategy, Governance, Financial, Risk, Leadership, Composition, Culture, and Stakeholders.',
    placement: 'top',
  },
];
