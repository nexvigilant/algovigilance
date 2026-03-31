'use client';

import React from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-neural-circuit';

interface PrismaticRaysProps {
  className?: string;
  intensity?: 'subtle' | 'medium' | 'vibrant';
}

/**
 * Emerald City Effect: Prismatic light rays that create a
 * distant cityscape glow effect with bokeh depth-of-field orbs.
 *
 * Inspired by: The glistening spires of Oz's Emerald City,
 * translated into AlgoVigilance's zircon blue and metallic gold palette.
 */
export function PrismaticRays({
  className = '',
  intensity = 'medium'
}: PrismaticRaysProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const opacityMultiplier = intensity === 'subtle' ? 0.5 : intensity === 'vibrant' ? 1.5 : 1;

  // Respect user's motion preferences - render nothing if reduced motion preferred
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* === VERTICAL LIGHT RAYS - Distant cityscape spires === */}

      {/* Primary cyan ray - left side */}
      <div
        className="absolute left-[12%] top-0 w-[2px] h-[70%] animate-pulse-slow"
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(0, 229, 255, ${0.15 * opacityMultiplier}) 30%, rgba(0, 229, 255, ${0.2 * opacityMultiplier}) 50%, rgba(0, 229, 255, ${0.15 * opacityMultiplier}) 70%, transparent 100%)`,
          animationDelay: '0s'
        }}
      />

      {/* Gold accent ray - left-center */}
      <div
        className="absolute left-[28%] top-0 w-[1px] h-[55%] animate-shimmer-slow"
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(212, 175, 55, ${0.2 * opacityMultiplier}) 40%, rgba(244, 208, 63, ${0.25 * opacityMultiplier}) 60%, transparent 100%)`,
          animationDelay: '-2s'
        }}
      />

      {/* Thin cyan ray - center-left */}
      <div
        className="absolute left-[42%] top-0 w-[1px] h-[45%] animate-pulse-slow"
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(0, 174, 239, ${0.12 * opacityMultiplier}) 50%, transparent 100%)`,
          animationDelay: '-4s'
        }}
      />

      {/* Primary ray - right-center */}
      <div
        className="absolute right-[35%] top-0 w-[2px] h-[65%] animate-shimmer-slow"
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(0, 229, 255, ${0.18 * opacityMultiplier}) 25%, rgba(0, 229, 255, ${0.22 * opacityMultiplier}) 50%, rgba(0, 174, 239, ${0.15 * opacityMultiplier}) 75%, transparent 100%)`,
          animationDelay: '-1s'
        }}
      />

      {/* Gold ray - right side */}
      <div
        className="absolute right-[18%] top-0 w-[1px] h-[50%] animate-pulse-slow"
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(244, 208, 63, ${0.18 * opacityMultiplier}) 40%, rgba(212, 175, 55, ${0.15 * opacityMultiplier}) 70%, transparent 100%)`,
          animationDelay: '-3s'
        }}
      />

      {/* Thin cyan ray - far right */}
      <div
        className="absolute right-[8%] top-0 w-[1px] h-[40%] animate-shimmer-slow"
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(0, 229, 255, ${0.1 * opacityMultiplier}) 60%, transparent 100%)`,
          animationDelay: '-5s'
        }}
      />

      {/* === HORIZONTAL PRISMATIC BAR - City horizon === */}
      <div
        className="absolute top-[30%] left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent 5%, rgba(0, 174, 239, ${0.15 * opacityMultiplier}) 25%, rgba(212, 175, 55, ${0.2 * opacityMultiplier}) 50%, rgba(0, 229, 255, ${0.15 * opacityMultiplier}) 75%, transparent 95%)`
        }}
      />

      {/* Secondary horizon bar - lower */}
      <div
        className="absolute top-[60%] left-[10%] right-[10%] h-[1px] opacity-50"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(0, 229, 255, ${0.1 * opacityMultiplier}) 30%, rgba(244, 208, 63, ${0.12 * opacityMultiplier}) 50%, rgba(0, 229, 255, ${0.1 * opacityMultiplier}) 70%, transparent 100%)`
        }}
      />

      {/* === BOKEH ORB EFFECTS - Depth of field === */}

      {/* Large cyan bokeh - top left */}
      <div
        className="absolute top-[15%] left-[8%] w-40 h-40 rounded-full animate-bokeh"
        style={{
          background: `radial-gradient(circle, rgba(0, 229, 255, ${0.08 * opacityMultiplier}) 0%, transparent 70%)`,
          filter: 'blur(50px)',
          animationDelay: '0s'
        }}
      />

      {/* Medium gold bokeh - top right */}
      <div
        className="absolute top-[20%] right-[12%] w-32 h-32 rounded-full animate-bokeh"
        style={{
          background: `radial-gradient(circle, rgba(244, 208, 63, ${0.06 * opacityMultiplier}) 0%, transparent 70%)`,
          filter: 'blur(40px)',
          animationDelay: '-5s'
        }}
      />

      {/* Small cyan bokeh - mid-left */}
      <div
        className="absolute top-[45%] left-[5%] w-24 h-24 rounded-full animate-bokeh"
        style={{
          background: `radial-gradient(circle, rgba(0, 174, 239, ${0.07 * opacityMultiplier}) 0%, transparent 70%)`,
          filter: 'blur(35px)',
          animationDelay: '-10s'
        }}
      />

      {/* Large gold bokeh - bottom right */}
      <div
        className="absolute top-[55%] right-[15%] w-36 h-36 rounded-full animate-bokeh"
        style={{
          background: `radial-gradient(circle, rgba(212, 175, 55, ${0.05 * opacityMultiplier}) 0%, transparent 70%)`,
          filter: 'blur(45px)',
          animationDelay: '-7s'
        }}
      />

      {/* Medium cyan bokeh - bottom left */}
      <div
        className="absolute top-[70%] left-[20%] w-28 h-28 rounded-full animate-bokeh"
        style={{
          background: `radial-gradient(circle, rgba(0, 229, 255, ${0.06 * opacityMultiplier}) 0%, transparent 70%)`,
          filter: 'blur(38px)',
          animationDelay: '-12s'
        }}
      />

      {/* === MAIN CITY GLOW - Central luminosity === */}
      <div
        className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full animate-city-glow"
        style={{
          background: `radial-gradient(ellipse 100% 60% at 50% 100%, rgba(0, 229, 255, ${0.06 * opacityMultiplier}) 0%, rgba(0, 174, 239, ${0.03 * opacityMultiplier}) 40%, transparent 70%)`,
          filter: 'blur(60px)'
        }}
      />
    </div>
  );
}
