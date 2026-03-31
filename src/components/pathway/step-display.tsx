'use client';

/**
 * StepDisplay Component
 *
 * Renders the current pathway step with prompt, options, and fields.
 * Translates PV terminology to clinical language based on user domain.
 */

import { cn } from '@/lib/utils';
import type { StepDisplay as StepDisplayType } from '@/types/clinical-pathways';

interface StepDisplayProps {
  step: StepDisplayType;
  onOptionSelect?: (optionId: string) => void;
  onFieldChange?: (fieldId: string, value: string | number | boolean) => void;
  className?: string;
}

export function StepDisplay({
  step,
  onOptionSelect,
  onFieldChange,
  className,
}: StepDisplayProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Phase indicator */}
      <p className="text-xs font-mono uppercase tracking-widest text-cyan/60">
        {step.phaseName}
      </p>

      {/* Main prompt */}
      <div className="space-y-2">
        <h2 className="text-xl font-headline text-slate-light">
          {step.prompt}
        </h2>
        {step.helpAvailable && (
          <p className="text-xs text-cyan/60 mt-1">Press ? for help</p>
        )}
      </div>

      {/* Options (for question states) */}
      {step.options && step.options.length > 0 && (
        <div className="space-y-3">
          {step.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onOptionSelect?.(option.id)}
              className={cn(
                'w-full text-left p-4 rounded-lg border transition-all',
                'bg-nex-surface border-nex-border',
                'hover:border-cyan/50 hover:bg-nex-light',
                'focus:outline-none focus:ring-2 focus:ring-cyan/50'
              )}
            >
              <span className="font-medium text-slate-light">
                {option.label}
              </span>
              {option.clinicalDescription && (
                <p className="mt-1 text-sm text-slate-light/60">
                  {option.clinicalDescription}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fields (for data entry states) */}
      {step.fields && step.fields.length > 0 && (
        <div className="space-y-4">
          {step.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label
                htmlFor={field.id}
                className="block text-sm font-medium text-slate-light"
              >
                {field.label}
                {field.validators?.some((v) => v.type === 'required') && (
                  <span className="text-red-400 ml-1">*</span>
                )}
              </label>

              {field.type === 'text' && (
                <input
                  id={field.id}
                  type="text"
                  placeholder={field.placeholder}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
                    'bg-nex-deep border border-nex-border',
                    'text-slate-light placeholder:text-slate-light/40',
                    'focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50'
                  )}
                  onChange={(e) => onFieldChange?.(field.id, e.target.value)}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  id={field.id}
                  placeholder={field.placeholder}
                  rows={4}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg resize-none',
                    'bg-nex-deep border border-nex-border',
                    'text-slate-light placeholder:text-slate-light/40',
                    'focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50'
                  )}
                  onChange={(e) => onFieldChange?.(field.id, e.target.value)}
                />
              )}

              {field.type === 'number' && (
                <input
                  id={field.id}
                  type="number"
                  placeholder={field.placeholder}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
                    'bg-nex-deep border border-nex-border',
                    'text-slate-light placeholder:text-slate-light/40',
                    'focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50'
                  )}
                  onChange={(e) =>
                    onFieldChange?.(field.id, parseFloat(e.target.value) || 0)
                  }
                />
              )}

              {field.type === 'date' && (
                <input
                  id={field.id}
                  type="date"
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
                    'bg-nex-deep border border-nex-border',
                    'text-slate-light',
                    'focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50'
                  )}
                  onChange={(e) => onFieldChange?.(field.id, e.target.value)}
                />
              )}

              {field.type === 'select' && field.options && (
                <select
                  id={field.id}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg',
                    'bg-nex-deep border border-nex-border',
                    'text-slate-light',
                    'focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan/50'
                  )}
                  onChange={(e) => onFieldChange?.(field.id, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {field.helpText && (
                <p className="text-xs text-slate-light/50">{field.helpText}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
