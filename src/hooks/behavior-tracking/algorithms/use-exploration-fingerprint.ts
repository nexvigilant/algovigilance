'use client';

import { useMemo } from 'react';
import { useBehaviorTracker } from '../use-behavior-tracker';
import type { EffectOutput, DiscoverabilityTier } from '../types';

interface ExplorationConfig {
  enabled?: boolean;
  tier?: DiscoverabilityTier;
  intensity?: number;
}

export function useExplorationFingerprint(config: ExplorationConfig = {}) {
  const { enabled = true, tier = 'attentive', intensity = 1 } = config;
  const { scores } = useBehaviorTracker();

  const effect = useMemo((): EffectOutput => {
    if (!enabled) return {};

    const { explorationStyle } = scores;

    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    const effectIntensity = intensity * tierMultiplier;

    switch (explorationStyle) {
      case 'linear':
        // Ordered particle trails - methodical movement
        return {
          primaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
          secondaryColor: `rgba(212, 175, 55, ${effectIntensity * 0.3})`,
          glowColor: `rgba(0, 174, 239, ${effectIntensity * 0.5})`,
          particleCount: Math.round(10 * effectIntensity),
          particleSpeed: 1.5,
          particleDirection: 'linear',
          trailEffect: true,
          intensity: effectIntensity,
        };

      case 'hub-spoke':
        // Pulsing center with radiating lines
        return {
          primaryColor: `rgba(212, 175, 55, ${effectIntensity})`,
          secondaryColor: `rgba(0, 174, 239, ${effectIntensity * 0.5})`,
          glowColor: `rgba(212, 175, 55, ${effectIntensity * 0.7})`,
          particleCount: Math.round(8 * effectIntensity),
          particleSpeed: 2,
          particleDirection: 'outward',
          pulseSpeed: 1.5,
          waveEffect: true,
          intensity: effectIntensity,
        };

      case 'depth-first':
        // Concentrated glow - focused energy
        return {
          primaryColor: `rgba(184, 115, 51, ${effectIntensity})`,
          secondaryColor: `rgba(212, 175, 55, ${effectIntensity * 0.6})`,
          glowColor: `rgba(184, 115, 51, ${effectIntensity * 0.8})`,
          particleCount: Math.round(6 * effectIntensity),
          particleSpeed: 0.5,
          particleDirection: 'inward',
          pulseSpeed: 3,
          intensity: effectIntensity * 1.2,
        };

      case 'scatter':
        // Chaotic particle bursts - random exploration
        return {
          primaryColor: `rgba(0, 174, 239, ${effectIntensity * 0.8})`,
          secondaryColor: `rgba(212, 175, 55, ${effectIntensity * 0.8})`,
          glowColor: `rgba(184, 115, 51, ${effectIntensity * 0.5})`,
          particleCount: Math.round(15 * effectIntensity),
          particleSpeed: 3,
          particleDirection: 'chaotic',
          burstEffect: true,
          intensity: effectIntensity * 0.9,
        };

      default:
        return {
          primaryColor: `rgba(148, 163, 184, ${effectIntensity * 0.4})`,
          particleCount: Math.round(4 * effectIntensity),
          particleSpeed: 1,
          particleDirection: 'orbital',
          intensity: effectIntensity * 0.3,
        };
    }
  }, [enabled, tier, intensity, scores]);

  return {
    effect,
    explorationStyle: scores.explorationStyle,
  };
}
