'use client';

/**
 * PathwayStep Component
 *
 * Composite component that combines StepDisplay, ProgressBar, and navigation.
 * Handles a single step in the pathway with validation feedback.
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft, HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { StepDisplay } from './step-display';
import { ProgressBar } from './progress-bar';
import type {
  StepDisplay as StepDisplayType,
  ValidationWarning,
  ValidationError,
} from '@/types/clinical-pathways';

interface PathwayStepProps {
  step: StepDisplayType;
  onSubmit: (fieldId: string, value: string | number | boolean) => Promise<void>;
  onBack?: () => void;
  onHelp?: () => void;
  warnings?: ValidationWarning[];
  errors?: ValidationError[];
  isSubmitting?: boolean;
  className?: string;
}

export function PathwayStep({
  step,
  onSubmit,
  onBack,
  onHelp,
  warnings = [],
  errors = [],
  isSubmitting = false,
  className,
}: PathwayStepProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string | number | boolean>>({});

  const handleOptionSelect = useCallback(
    async (optionId: string) => {
      await onSubmit('selection', optionId);
    },
    [onSubmit]
  );

  const handleFieldChange = useCallback(
    (fieldId: string, value: string | number | boolean) => {
      setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    },
    []
  );

  const handleFieldSubmit = useCallback(async () => {
    // Submit all field values
    for (const [fieldId, value] of Object.entries(fieldValues)) {
      await onSubmit(fieldId, value);
    }
  }, [fieldValues, onSubmit]);

  const hasFields = step.fields && step.fields.length > 0;
  const hasOptions = step.options && step.options.length > 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with progress and navigation */}
      <div className="flex-shrink-0 space-y-4 pb-6 border-b border-nex-border">
        {/* Navigation row */}
        <div className="flex items-center justify-between">
          {/* Back button */}
          {step.canGoBack && onBack ? (
            <button
              onClick={onBack}
              disabled={isSubmitting}
              className={cn(
                'flex items-center gap-2 text-sm text-slate-light/70 hover:text-slate-light transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div /> // Spacer
          )}

          {/* Help button */}
          {onHelp && (
            <button
              onClick={onHelp}
              className="flex items-center gap-2 text-sm text-cyan/70 hover:text-cyan transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </button>
          )}
        </div>

        {/* Progress bar */}
        <ProgressBar progress={step.progress} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto py-6">
        <StepDisplay
          step={step}
          onOptionSelect={handleOptionSelect}
          onFieldChange={handleFieldChange}
        />

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-6 space-y-2">
            {warnings.map((warning) => (
              <div
                key={`${warning.field}-${warning.type}`}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg',
                  warning.severity === 'high'
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'bg-amber-500/5 border border-amber-500/20'
                )}
              >
                <AlertTriangle
                  className={cn(
                    'w-5 h-5 flex-shrink-0 mt-0.5',
                    warning.severity === 'high'
                      ? 'text-amber-400'
                      : 'text-amber-400/70'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-200">{warning.message}</p>
                  {warning.suggestion && (
                    <p className="mt-1 text-xs text-amber-200/60">
                      {warning.suggestion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-6 space-y-2">
            {errors.map((error) => (
              <div
                key={`${error.code}-${error.field}`}
                className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-200">{error.message}</p>
                  {error.example && (
                    <p className="mt-1 text-xs text-red-200/60">
                      Example: {error.example}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with submit button (for field-based steps) */}
      {hasFields && !hasOptions && (
        <div className="flex-shrink-0 pt-6 border-t border-nex-border">
          <button
            onClick={handleFieldSubmit}
            disabled={isSubmitting}
            className={cn(
              'w-full py-3 px-6 rounded-lg font-medium transition-all',
              'bg-cyan text-nex-deep hover:bg-cyan-glow',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:ring-offset-2 focus:ring-offset-nex-surface'
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-nex-deep/30 border-t-nex-deep rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * PathwayComplete - Shown when pathway is finished
 */
interface PathwayCompleteProps {
  summary?: {
    narrative: string;
    keyFacts: Array<{ label: string; value: string }>;
    nextSteps: string[];
    caseReference?: string;
  };
  onNewCase?: () => void;
  className?: string;
}

export function PathwayComplete({
  summary,
  onNewCase,
  className,
}: PathwayCompleteProps) {
  return (
    <div className={cn('text-center space-y-8', className)}>
      {/* Success icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-2xl font-headline text-gold">Report Submitted</h2>
        <p className="text-slate-light/70">
          Your adverse event report has been successfully submitted.
        </p>
      </div>

      {/* Summary */}
      {summary && (
        <div className="text-left space-y-6 bg-nex-surface rounded-lg p-6 border border-nex-border">
          {/* Narrative */}
          <div>
            <h3 className="text-sm font-mono uppercase tracking-wide text-cyan/60 mb-2">
              Summary
            </h3>
            <p className="text-slate-light">{summary.narrative}</p>
          </div>

          {/* Key facts */}
          {summary.keyFacts.length > 0 && (
            <div>
              <h3 className="text-sm font-mono uppercase tracking-wide text-cyan/60 mb-2">
                Key Details
              </h3>
              <dl className="space-y-2">
                {summary.keyFacts.map((fact) => (
                  <div key={fact.label} className="flex justify-between">
                    <dt className="text-slate-light/60">{fact.label}</dt>
                    <dd className="text-slate-light font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Next steps */}
          {summary.nextSteps.length > 0 && (
            <div>
              <h3 className="text-sm font-mono uppercase tracking-wide text-cyan/60 mb-2">
                Next Steps
              </h3>
              <ul className="space-y-1">
                {summary.nextSteps.map((step) => (
                  <li key={`step-${step}`} className="text-slate-light/80 flex items-start gap-2">
                    <span className="text-cyan">•</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Case reference */}
          <div className="pt-4 border-t border-nex-border">
            <p className="text-sm text-slate-light/50">
              Case Reference: <span className="font-mono text-cyan">{summary.caseReference}</span>
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {onNewCase && (
        <button
          onClick={onNewCase}
          className={cn(
            'py-3 px-6 rounded-lg font-medium transition-all',
            'border border-cyan text-cyan hover:bg-cyan/10',
            'focus:outline-none focus:ring-2 focus:ring-cyan/50'
          )}
        >
          Report Another Event
        </button>
      )}
    </div>
  );
}
