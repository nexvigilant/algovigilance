'use client';

/**
 * Service Discovery Wizard - Question Screen
 *
 * Displays a single question with selectable option cards.
 * Supports keyboard navigation and accessibility.
 */

import { useCallback, useEffect, useRef, forwardRef } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WizardQuestion as WizardQuestionType, WizardOption } from '@/types/service-wizard';
import { cn } from '@/lib/utils';

// Rotating accent colors for visual feedback when changing questions
const ACCENT_COLORS = [
  { border: 'border-cyan/40', hover: 'hover:border-cyan', selected: 'border-cyan bg-cyan/10' },
  { border: 'border-violet-500/40', hover: 'hover:border-violet-500', selected: 'border-violet-500 bg-violet-500/10' },
  { border: 'border-emerald-500/40', hover: 'hover:border-emerald-500', selected: 'border-emerald-500 bg-emerald-500/10' },
  { border: 'border-amber-500/40', hover: 'hover:border-amber-500', selected: 'border-amber-500 bg-amber-500/10' },
  { border: 'border-rose-500/40', hover: 'hover:border-rose-500', selected: 'border-rose-500 bg-rose-500/10' },
];

interface WizardQuestionProps {
  question: WizardQuestionType;
  questionIndex: number;
  selectedOption?: string;
  onSelectOption: (optionId: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function WizardQuestion({
  question,
  questionIndex,
  selectedOption,
  onSelectOption,
  onBack,
  canGoBack,
}: WizardQuestionProps) {
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Get accent color for this question
  const accentColor = ACCENT_COLORS[questionIndex % ACCENT_COLORS.length];

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const options = question.options;
      let newIndex = index;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = (index + 1) % options.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = (index - 1 + options.length) % options.length;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectOption(options[index].id);
        return;
      }

      if (newIndex !== index) {
        optionsRef.current[newIndex]?.focus();
      }
    },
    [question.options, onSelectOption]
  );

  // Focus first option on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      optionsRef.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [question.id]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      {canGoBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-slate-dim hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}

      {/* Question */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-headline font-bold text-white mb-3">
          {question.text}
        </h2>
        {question.subtext && (
          <p className="text-slate-dim text-lg">{question.subtext}</p>
        )}
      </div>

      {/* Options */}
      <div
        className="grid gap-4"
        role="listbox"
        aria-label={question.text}
      >
        {question.options.map((option, index) => (
          <OptionCard
            key={option.id}
            option={option}
            isSelected={selectedOption === option.id}
            accentColor={accentColor}
            onSelect={() => onSelectOption(option.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            ref={(el) => {
              optionsRef.current[index] = el;
            }}
          />
        ))}
      </div>

      {/* Hint */}
      <p className="text-center text-sm text-slate-dim mt-8">
        Click an option to continue, or use arrow keys to navigate
      </p>
    </div>
  );
}

// =============================================================================
// Option Card Component
// =============================================================================

interface AccentColor {
  border: string;
  hover: string;
  selected: string;
}

interface OptionCardProps {
  option: WizardOption;
  isSelected: boolean;
  accentColor: AccentColor;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const OptionCard = forwardRef<HTMLButtonElement, OptionCardProps>(
  function OptionCard({ option, isSelected, accentColor, onSelect, onKeyDown }, ref) {
    return (
      <button
        ref={ref}
        role="option"
        aria-selected={isSelected}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        className={cn(
          'w-full text-left p-5 rounded-xl border-2 transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:ring-offset-2 focus:ring-offset-nex-deep',
          'bg-nex-surface/50',
          isSelected
            ? accentColor.selected
            : cn(accentColor.border, accentColor.hover, 'hover:bg-white/5')
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg mb-1">
              {option.label}
            </h3>
            {option.description && (
              <p className="text-slate-dim text-sm">{option.description}</p>
            )}
          </div>

          {/* Selection indicator */}
          <div
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
              isSelected
                ? 'border-cyan bg-cyan'
                : 'border-nex-light bg-transparent'
            )}
          >
            {isSelected && <Check className="h-4 w-4 text-nex-deep" />}
          </div>
        </div>
      </button>
    );
  }
);
