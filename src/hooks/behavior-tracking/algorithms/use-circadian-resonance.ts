'use client';

import { useMemo } from 'react';
import { useBehaviorTracker } from '../use-behavior-tracker';
import type { EffectOutput, DiscoverabilityTier } from '../types';

interface CircadianConfig {
  enabled?: boolean;
  tier?: DiscoverabilityTier;
  intensity?: number;
}

export function useCircadianResonance(config: CircadianConfig = {}) {
  const { enabled = true, tier = 'obvious', intensity = 1 } = config;
  const { scores } = useBehaviorTracker();

  const effect = useMemo((): EffectOutput => {
    if (!enabled) return {};

    const { circadianType, peakHours } = scores;
    const currentHour = new Date().getHours();
    const isInPeakHour = peakHours.includes(currentHour);

    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    const peakBoost = isInPeakHour ? 1.3 : 1;
    const effectIntensity = intensity * tierMultiplier * peakBoost;

    switch (circadianType) {
      case 'morning':
        // Warm sunrise gradients - gold to cyan
        return {
          primaryColor: `rgba(212, 175, 55, ${effectIntensity})`,
          secondaryColor: `rgba(0, 174, 239, ${effectIntensity * 0.6})`,
          glowColor: `rgba(245, 158, 11, ${effectIntensity * 0.7})`,
          particleCount: Math.round(8 * effectIntensity),
          particleSpeed: 1.2,
          particleDirection: 'outward',
          pulseSpeed: 2,
          waveEffect: true,
          intensity: effectIntensity,
        };

      case 'afternoon':
        // Bright midday - strong cyan
        return {
          primaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
          secondaryColor: `rgba(255, 255, 255, ${effectIntensity * 0.5})`,
          glowColor: `rgba(0, 174, 239, ${effectIntensity * 0.8})`,
          particleCount: Math.round(10 * effectIntensity),
          particleSpeed: 2,
          particleDirection: 'orbital',
          pulseSpeed: 1,
          burstEffect: isInPeakHour,
          intensity: effectIntensity,
        };

      case 'night':
        // Cool moonlight - deep blues, silver accents
        return {
          primaryColor: `rgba(59, 130, 246, ${effectIntensity})`,
          secondaryColor: `rgba(192, 192, 192, ${effectIntensity * 0.4})`,
          glowColor: `rgba(59, 130, 246, ${effectIntensity * 0.5})`,
          particleCount: Math.round(6 * effectIntensity),
          particleSpeed: 0.8,
          particleDirection: 'orbital',
          pulseSpeed: 3,
          intensity: effectIntensity * 0.9,
        };

      case 'weekend':
        // Special weekend pattern - relaxed, varied
        return {
          primaryColor: `rgba(168, 85, 247, ${effectIntensity})`,
          secondaryColor: `rgba(212, 175, 55, ${effectIntensity * 0.5})`,
          glowColor: `rgba(168, 85, 247, ${effectIntensity * 0.6})`,
          particleCount: Math.round(12 * effectIntensity),
          particleSpeed: 1.5,
          particleDirection: 'chaotic',
          waveEffect: true,
          intensity: effectIntensity,
        };

      default:
        return {
          primaryColor: `rgba(148, 163, 184, ${effectIntensity * 0.5})`,
          particleCount: Math.round(4 * effectIntensity),
          particleSpeed: 1,
          intensity: effectIntensity * 0.3,
        };
    }
  }, [enabled, tier, intensity, scores]);

  return {
    effect,
    circadianType: scores.circadianType,
    peakHours: scores.peakHours,
    isCurrentlyPeak: scores.peakHours.includes(new Date().getHours()),
  };
}
