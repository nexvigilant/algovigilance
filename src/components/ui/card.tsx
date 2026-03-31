'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { useUISounds } from '@/hooks/use-ui-sounds';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  enableSounds?: boolean;
  enableHaptics?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, enableSounds = false, enableHaptics = true, onMouseEnter, ...props }, ref) => {
    const { playHover } = useUISounds({ volume: 0.1, enabled: enableSounds && interactive });
    const { lightTap } = useHapticFeedback({ enabled: enableHaptics && interactive });

    const handleMouseEnter = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (interactive) {
        playHover();
        lightTap();
      }
      onMouseEnter?.(e);
    }, [interactive, onMouseEnter, playHover, lightTap]);

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300',
          'border-white/10 bg-opacity-80 backdrop-blur-md',
          'hover:shadow-glow-cyan/20 hover:border-cyan/30',
          className
        )}
        onMouseEnter={handleMouseEnter}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
