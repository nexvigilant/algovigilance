'use client';

import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';

interface MagneticButtonProps extends ButtonProps {
  /** Magnetic pull strength (default: 20, higher = less pull) */
  strength?: number;
}

/**
 * Button with magnetic hover effect.
 * Respects prefers-reduced-motion - disables animation for users with motion sensitivity.
 */
export const MagneticButton = React.forwardRef<
  HTMLButtonElement,
  MagneticButtonProps
>(({ className, children, strength = 20, ...props }, ref) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Skip magnetic effect if user prefers reduced motion
      if (prefersReducedMotion) return;

      const { clientX, clientY } = e;
      const { left, top, width, height } =
        e.currentTarget.getBoundingClientRect();
      const x = (clientX - (left + width / 2)) / strength;
      const y = (clientY - (top + height / 2)) / strength;
      setPosition({ x, y });
    },
    [strength, prefersReducedMotion]
  );

  const handleMouseLeave = React.useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  // Merge refs
  React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

  // If reduced motion preferred, render without animation wrapper
  if (prefersReducedMotion) {
    return (
      <Button
        ref={buttonRef}
        className={cn('magnetic-button', className)}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <motion.div
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      <Button
        ref={buttonRef}
        className={cn('magnetic-button', className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
});
MagneticButton.displayName = 'MagneticButton';
