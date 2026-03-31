'use client';

import { useMemo } from 'react';
import { useBehaviorTracker } from '../use-behavior-tracker';
import type { EffectOutput, DiscoverabilityTier } from '../types';

interface LearningVelocityConfig {
  enabled?: boolean;
  tier?: DiscoverabilityTier;
  intensity?: number;
}

export function useLearningVelocity(config: LearningVelocityConfig = {}) {
  const { enabled = true, tier = 'attentive', intensity = 1 } = config;
  const { scores } = useBehaviorTracker();

  const effect = useMemo((): EffectOutput => {
    if (!enabled) return {};

    const { learningStyle, learningVelocity } = scores;
    const baseIntensity = (learningVelocity / 100) * intensity;

    // Tier-based visibility adjustments
    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    const effectIntensity = baseIntensity * tierMultiplier;

    switch (learningStyle) {
      case 'efficient':
        // Cyan energy bursts - fast and bright
        return {
          primaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
          secondaryColor: `rgba(255, 255, 255, ${effectIntensity * 0.5})`,
          glowColor: `rgba(0, 174, 239, ${effectIntensity * 0.8})`,
          particleCount: Math.round(12 * effectIntensity),
          particleSpeed: 2 + effectIntensity,
          particleDirection: 'outward',
          pulseSpeed: 0.5,
          burstEffect: true,
          intensity: effectIntensity,
        };

      case 'thorough':
        // Gold steady glow - warm and consistent
        return {
          primaryColor: `rgba(212, 175, 55, ${effectIntensity})`,
          secondaryColor: `rgba(184, 115, 51, ${effectIntensity * 0.5})`,
          glowColor: `rgba(212, 175, 55, ${effectIntensity * 0.6})`,
          particleCount: Math.round(6 * effectIntensity),
          particleSpeed: 0.5,
          particleDirection: 'orbital',
          pulseSpeed: 2,
          waveEffect: true,
          intensity: effectIntensity,
        };

      case 'skimmer':
        // Copper flickering - uncertain and quick
        return {
          primaryColor: `rgba(184, 115, 51, ${effectIntensity})`,
          secondaryColor: `rgba(212, 175, 55, ${effectIntensity * 0.3})`,
          glowColor: `rgba(184, 115, 51, ${effectIntensity * 0.4})`,
          particleCount: Math.round(8 * effectIntensity),
          particleSpeed: 3,
          particleDirection: 'chaotic',
          pulseSpeed: 0.3,
          intensity: effectIntensity * 0.7,
        };

      default:
        // Unknown - neutral effect
        return {
          primaryColor: `rgba(148, 163, 184, ${effectIntensity * 0.5})`,
          particleCount: Math.round(4 * effectIntensity),
          particleSpeed: 1,
          particleDirection: 'orbital',
          intensity: effectIntensity * 0.3,
        };
    }
  }, [enabled, tier, intensity, scores]);

  return {
    effect,
    learningStyle: scores.learningStyle,
    velocity: scores.learningVelocity,
  };
}
