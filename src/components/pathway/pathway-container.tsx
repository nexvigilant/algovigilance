'use client';

/**
 * PathwayContainer Component
 *
 * Main container that orchestrates the clinical pathway experience.
 * Manages the ClinicalPathwayNavigator and renders appropriate UI.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, AlertCircle } from 'lucide-react';
import { PathwayStep, PathwayComplete } from './pathway-step';
import { PhaseIndicator } from './progress-bar';

import { logger } from '@/lib/logger';
const log = logger.scope('components/pathway-container');
import {
  createNavigator,
} from '@/lib/pathway-navigator';
import type {
  HCPUser,
  PVTaskType,
  ValidationWarning,
  ValidationError,
  StepDisplay,
} from '@/types/clinical-pathways';

interface PathwayContainerProps {
  user: HCPUser;
  taskType: PVTaskType;
  onComplete?: (caseId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function PathwayContainer({
  user,
  taskType,
  onComplete,
  onCancel,
  className,
}: PathwayContainerProps) {
  // Initialize navigator
  const navigator = useMemo(
    () => createNavigator(user, taskType),
    [user, taskType]
  );

  // State
  const [currentStep, setCurrentStep] = useState<StepDisplay>(() =>
    navigator.getCurrentStep()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [completionSummary, setCompletionSummary] = useState<{
    narrative: string;
    keyFacts: Array<{ label: string; value: string }>;
    nextSteps: string[];
    caseReference?: string;
  } | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Get phases from pathway
  const phases = useMemo(
    () => navigator.getPathway().phases,
    [navigator]
  );

  // Handle input submission
  const handleSubmit = useCallback(
    async (fieldId: string, value: string | number | boolean) => {
      setIsSubmitting(true);
      setErrors([]);

      try {
        const result = await navigator.processInput({ field: fieldId, value });

        if (result.success) {
          // Update warnings
          setWarnings([...(result.warnings || [])]);

          // Check if complete
          if (result.isComplete) {
            const completion = await navigator.complete();
            if (completion.success && completion.summary) {
              setCompletionSummary({
                ...completion.summary,
                keyFacts: [...completion.summary.keyFacts],
                nextSteps: [...completion.summary.nextSteps],
              });
              setIsComplete(true);
              if (completion.summary.caseReference) {
                onComplete?.(completion.summary.caseReference);
              }
            }
          } else if (result.nextStep) {
            // Move to next step
            setCurrentStep(result.nextStep);
          }
        } else {
          // Show errors
          setErrors([...(result.errors || [])]);
        }
      } catch (error) {
        log.error('Pathway navigation error:', error);
        setErrors([
          {
            code: 'SYSTEM_ERROR',
            field: fieldId,
            message: 'An unexpected error occurred. Please try again.',
          },
        ]);
      } finally {
        setIsSubmitting(false);
      }
    },
    [navigator, onComplete]
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    const prevStep = navigator.goBack();
    if (prevStep) {
      setCurrentStep(prevStep);
      setWarnings([]);
      setErrors([]);
    }
  }, [navigator]);

  // Handle help
  const handleHelp = useCallback(() => {
    setShowHelpModal(true);
  }, []);

  // Handle new case
  const handleNewCase = useCallback(() => {
    // Reset state - in a real app, would create new navigator
    setIsComplete(false);
    setCompletionSummary(null);
    setWarnings([]);
    setErrors([]);
    // Note: Would need to re-initialize navigator for true reset
  }, []);

  // Get help content
  const helpContent = useMemo(
    () => (showHelpModal ? navigator.getHelp() : null),
    [navigator, showHelpModal]
  );

  return (
    <div
      className={cn(
        'relative flex flex-col h-full bg-nex-dark rounded-xl border border-nex-border overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-nex-surface border-b border-nex-border">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-headline text-gold">
            {navigator.getPathway().name}
          </h1>
          <PhaseIndicator
            phases={[...phases]}
            currentPhase={currentStep.phaseName}
            className="hidden md:flex"
          />
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-slate-light/50 hover:text-slate-light transition-colors rounded-lg hover:bg-nex-light"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden p-6">
        {isComplete ? (
          <PathwayComplete
            summary={completionSummary || undefined}
            onNewCase={handleNewCase}
          />
        ) : (
          <PathwayStep
            step={currentStep}
            onSubmit={handleSubmit}
            onBack={currentStep.canGoBack ? handleBack : undefined}
            onHelp={handleHelp}
            warnings={warnings}
            errors={errors}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Help Modal */}
      {showHelpModal && helpContent && (
        <HelpModal
          content={{
            ...helpContent,
            commonMistakes: helpContent.commonMistakes ? [...helpContent.commonMistakes] : undefined,
          }}
          analogy={navigator.getClinicalAnalogy()}
          onClose={() => setShowHelpModal(false)}
        />
      )}
    </div>
  );
}

/**
 * HelpModal - Contextual help overlay
 */
interface HelpModalProps {
  content: {
    explanation: string;
    clinicalAnalogies?: Record<string, string>;
    commonMistakes?: string[];
    regulatoryReference?: string;
  };
  analogy?: string;
  onClose: () => void;
}

function HelpModal({ content, analogy, onClose }: HelpModalProps) {
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="absolute inset-0 bg-nex-deep/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="w-full max-w-lg bg-nex-surface rounded-xl border border-nex-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nex-border">
          <h2 className="text-lg font-headline text-gold">Help</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-light/50 hover:text-slate-light transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Explanation */}
          <div>
            <h3 className="text-sm font-mono uppercase tracking-wide text-cyan/60 mb-2">
              What is this?
            </h3>
            <p className="text-slate-light">{content.explanation}</p>
          </div>

          {/* Clinical analogy */}
          {analogy && (
            <div className="bg-cyan/5 border border-cyan/20 rounded-lg p-4">
              <h3 className="text-sm font-mono uppercase tracking-wide text-cyan mb-2">
                Clinical Analogy
              </h3>
              <p className="text-slate-light/80">{analogy}</p>
            </div>
          )}

          {/* Common mistakes */}
          {content.commonMistakes && content.commonMistakes.length > 0 && (
            <div>
              <h3 className="text-sm font-mono uppercase tracking-wide text-amber-400/60 mb-2">
                Common Mistakes
              </h3>
              <ul className="space-y-2">
                {content.commonMistakes.map((mistake, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-slate-light/70"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400/70 flex-shrink-0 mt-0.5" />
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory reference */}
          {content.regulatoryReference && (
            <div className="text-xs text-slate-light/40 pt-4 border-t border-nex-border">
              <span className="font-mono">Regulatory Note:</span>{' '}
              {content.regulatoryReference}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-nex-border">
          <button
            onClick={onClose}
            className={cn(
              'w-full py-2 px-4 rounded-lg font-medium transition-all',
              'bg-cyan text-nex-deep hover:bg-cyan-glow',
              'focus:outline-none focus:ring-2 focus:ring-cyan/50'
            )}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
