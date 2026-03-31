'use client';

import { useRef, useCallback } from 'react';
import { useSpringPhysics } from '@/hooks/use-spring-physics';

interface SpringCardProps {
  children: React.ReactNode;
  className?: string;
  /** Vertical displacement on hover in px. Default: -3 */
  hoverY?: number;
  /** Scale on hover. Default: 1.015 */
  hoverScale?: number;
}

/**
 * Wraps any element with physics-based spring hover animation.
 *
 * Uses a damped harmonic oscillator (ζ=0.55, k=180) for organic
 * bounce-settle behavior that CSS transitions can't replicate.
 *
 * The element lifts and scales on hover, then springs back with
 * a subtle overshoot when the cursor leaves.
 */
export function SpringCard({
  children,
  className,
  hoverY = -3,
  hoverScale = 1.015,
}: SpringCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const spring = useSpringPhysics({ stiffness: 180, damping: 0.55, mass: 0.8 });

  const onEnter = useCallback(() => {
    spring.trigger(ref.current, { y: hoverY, scale: hoverScale });
  }, [spring, hoverY, hoverScale]);

  const onLeave = useCallback(() => {
    spring.release(ref.current);
  }, [spring]);

  return (
    <div
      ref={ref}
      className={className}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ willChange: 'transform' }}
    >
      {children}
    </div>
  );
}
