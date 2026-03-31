'use client';

/**
 * OptionButton Component
 *
 * Styled button for pathway options with clinical descriptions.
 * Supports different states: default, selected, disabled.
 */

import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface OptionButtonProps {
  /** Unique identifier for the option (used by parent for selection tracking) */
  id: string;
  label: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function OptionButton({
  id,
  label,
  description,
  selected = false,
  disabled = false,
  onClick,
  className,
}: OptionButtonProps) {
  return (
    <button
      id={`option-${id}`}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all',
        'focus:outline-none focus:ring-2 focus:ring-cyan/50',
        // Default state
        !selected &&
          !disabled &&
          'bg-nex-surface border-nex-border hover:border-cyan/50 hover:bg-nex-light',
        // Selected state
        selected && 'bg-cyan/10 border-cyan text-cyan',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed bg-nex-deep border-nex-border',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Selection indicator */}
        <div
          className={cn(
            'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
            selected ? 'border-cyan bg-cyan' : 'border-nex-border'
          )}
        >
          {selected && <CheckCircle2 className="w-4 h-4 text-nex-deep" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              'font-medium',
              selected ? 'text-cyan' : 'text-slate-light'
            )}
          >
            {label}
          </span>
          {description && (
            <p
              className={cn(
                'mt-1 text-sm',
                selected ? 'text-cyan/70' : 'text-slate-light/60'
              )}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * OptionGroup - Container for multiple option buttons
 */
interface OptionGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function OptionGroup({ children, className }: OptionGroupProps) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}
