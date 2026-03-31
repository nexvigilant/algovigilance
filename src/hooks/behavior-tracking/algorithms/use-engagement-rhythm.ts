'use client';

import { useMemo } from 'react';
import { useBehaviorTracker } from '../use-behavior-tracker';
import type { EffectOutput, DiscoverabilityTier } from '../types';

interface EngagementConfig {
  enabled?: boolean;
  tier?: DiscoverabilityTier;
  intensity?: number;
}

export function useEngagementRhythm(config: EngagementConfig = {}) {
  const { enabled = true, tier = 'attentive', intensity = 1 } = config;
  const { scores } = useBehaviorTracker();

  const effect = useMemo((): EffectOutput => {
    if (!enabled) return {};

    const { engagementType } = scores;

    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    const effectIntensity = intensity * tierMultiplier;

    switch (engagementType) {
      case 'creator':
        // Outward-flowing particles - sharing energy
        return {
          primaryColor: `rgba(212, 175, 55, ${effectIntensity})`,
          secondaryColor: `rgba(255, 255, 255, ${effectIntensity * 0.4})`,
          glowColor: `rgba(212, 175, 55, ${effectIntensity * 0.7})`,
          particleCount: Math.round(12 * effectIntensity),
          particleSpeed: 2.5,
          particleDirection: 'outward',
          burstEffect: true,
          intensity: effectIntensity,
        };

      case 'consumer':
        // Inward-flowing particles - absorbing
        return {
          primaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
          secondaryColor: `rgba(184, 115, 51, ${effectIntensity * 0.3})`,
          glowColor: `rgba(0, 174, 239, ${effectIntensity * 0.5})`,
          particleCount: Math.round(8 * effectIntensity),
          particleSpeed: 1.5,
          particleDirection: 'inward',
          waveEffect: true,
          intensity: effectIntensity * 0.9,
        };

      case 'conversationalist':
        // Orbital particle dance - balanced exchange
        return {
          primaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
          secondaryColor: `rgba(212, 175, 55, ${effectIntensity})`,
          glowColor: `rgba(184, 115, 51, ${effectIntensity * 0.5})`,
          particleCount: Math.round(10 * effectIntensity),
          particleSpeed: 1.8,
          particleDirection: 'orbital',
          pulseSpeed: 1.5,
          intensity: effectIntensity,
        };

      case 'lurker':
        // Subtle, almost invisible presence
        return {
          primaryColor: `rgba(148, 163, 184, ${effectIntensity * 0.3})`,
          glowColor: `rgba(148, 163, 184, ${effectIntensity * 0.1})`,
          particleCount: Math.round(2 * effectIntensity),
          particleSpeed: 0.3,
          particleDirection: 'orbital',
          intensity: effectIntensity * 0.2,
        };

      default:
        return {
          primaryColor: `rgba(148, 163, 184, ${effectIntensity * 0.4})`,
          particleCount: Math.round(4 * effectIntensity),
          particleSpeed: 1,
          intensity: effectIntensity * 0.3,
        };
    }
  }, [enabled, tier, intensity, scores]);

  return {
    effect,
    engagementType: scores.engagementType,
  };
}
