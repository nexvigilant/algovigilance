'use client';

import React from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-neural-circuit';

interface AmbientParticlesProps {
  count?: number;
  className?: string;
  opacity?: 'low' | 'medium' | 'high';
}

export function AmbientParticles({
  count = 30,
  className = '',
  opacity = 'medium'
}: AmbientParticlesProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const opacityMultiplier = opacity === 'low' ? 0.5 : opacity === 'high' ? 1.5 : 1;

  // Respect user's motion preferences - render static particles or none
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {Array.from({ length: count }).map((_, i) => {
        // Deterministic pseudo-random based on index to avoid hydration mismatch
        const seed = (i * 17 + 7) % 100;
        const size = 2 + (seed % 30) / 10;
        const left = ((i * 31 + 13) % 100);
        const top = ((i * 47 + 23) % 100);
        const duration = 15 + (seed % 20);
        const delay = -((i * 11) % 20);

        // Cycle through gold, cyan, copper
        const colorIndex = i % 3;
        // Tight 2px glow for crisp electronic look
        const colors = [
          {
            bg: `rgba(212, 175, 55, ${0.5 * opacityMultiplier})`,
            shadow: `0 0 2px rgba(212, 175, 55, ${0.7 * opacityMultiplier})`,
          },
          {
            bg: `rgba(0, 174, 239, ${0.4 * opacityMultiplier})`,
            shadow: `0 0 2px rgba(0, 174, 239, ${0.6 * opacityMultiplier})`,
          },
          {
            bg: `rgba(184, 115, 51, ${0.4 * opacityMultiplier})`,
            shadow: `0 0 2px rgba(184, 115, 51, ${0.6 * opacityMultiplier})`,
          },
        ];

        return (
          <div
            key={i}
            className="absolute rounded-full animate-float-particle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              top: `${top}%`,
              background: colors[colorIndex].bg,
              boxShadow: colors[colorIndex].shadow,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
