import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CircuitButtonProps extends ButtonProps {
  glow?: boolean;
}

export const CircuitButton = React.forwardRef<
  HTMLButtonElement,
  CircuitButtonProps
>(
  (
    { className, variant = 'default', glow = false, children, ...props },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(
          'circuit-button relative overflow-hidden',
          glow && 'shadow-glow-cyan',
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Button>
    );
  }
);
CircuitButton.displayName = 'CircuitButton';
