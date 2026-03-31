'use client';

import { useState, useMemo, useCallback } from 'react';
import { useBehaviorTracker } from '../use-behavior-tracker';
import type { EffectOutput, DiscoverabilityTier } from '../types';

interface EntropyConfig {
  enabled?: boolean;
  tier?: DiscoverabilityTier;
  intensity?: number;
  variationRange?: number; // How much things can vary
}

interface EntropyVariation {
  colorShift: number; // -1 to 1
  positionOffset: { x: number; y: number };
  scaleVariation: number; // 0.9 to 1.1
  rotationOffset: number; // degrees
}

export function useEntropyEcho(config: EntropyConfig = {}) {
  const {
    enabled = true,
    tier = 'discerning',
    intensity = 1,
    variationRange = 0.1,
  } = config;

  const { scores } = useBehaviorTracker();
  const [variations, setVariations] = useState<Map<string, EntropyVariation>>(new Map());
  const [noticedChanges, setNoticedChanges] = useState(0);

  // Generate deterministic but varying values per session
  const sessionSeed = useMemo(() => Math.random(), []);

  // Create variation for an element
  const getVariation = useCallback((elementId: string): EntropyVariation => {
    if (variations.has(elementId)) {
      return variations.get(elementId) as EntropyVariation;
    }

    // Generate pseudo-random variation based on element ID and session
    const hash = elementId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rand = (seed: number) => {
      const x = Math.sin(seed + hash + sessionSeed * 1000) * 10000;
      return x - Math.floor(x);
    };

    // Adjust variation range based on detail orientation
    // High detail orientation = less variation (user notices)
    const adjustedRange = variationRange * (1 - scores.detailOrientation / 200);

    const variation: EntropyVariation = {
      colorShift: (rand(1) - 0.5) * adjustedRange * 2,
      positionOffset: {
        x: (rand(2) - 0.5) * adjustedRange * 20,
        y: (rand(3) - 0.5) * adjustedRange * 20,
      },
      scaleVariation: 1 + (rand(4) - 0.5) * adjustedRange,
      rotationOffset: (rand(5) - 0.5) * adjustedRange * 10,
    };

    setVariations((prev) => new Map(prev).set(elementId, variation));
    return variation;
  }, [variations, sessionSeed, variationRange, scores.detailOrientation]);

  // Track when user notices a change (e.g., mentions in feedback, adjusts settings)
  const markNoticed = useCallback(() => {
    setNoticedChanges((prev) => prev + 1);
  }, []);

  // Effect based on detail orientation
  const effect = useMemo((): EffectOutput => {
    if (!enabled) return {};

    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    const effectIntensity = intensity * tierMultiplier;
    const detailFactor = scores.detailOrientation / 100;

    // High detail orientation = more structured effects
    // Low detail orientation = more varied effects
    if (detailFactor > 0.7) {
      // User values consistency - calm, ordered
      return {
        primaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
        secondaryColor: `rgba(212, 175, 55, ${effectIntensity * 0.3})`,
        glowColor: `rgba(0, 174, 239, ${effectIntensity * 0.5})`,
        particleCount: Math.round(6 * effectIntensity),
        particleSpeed: 0.8,
        particleDirection: 'linear',
        pulseSpeed: 2,
        intensity: effectIntensity,
      };
    } else {
      // User comfortable with change - varied, dynamic
      return {
        primaryColor: `rgba(212, 175, 55, ${effectIntensity})`,
        secondaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
        glowColor: `rgba(184, 115, 51, ${effectIntensity * 0.6})`,
        particleCount: Math.round(10 * effectIntensity),
        particleSpeed: 1.5,
        particleDirection: 'chaotic',
        pulseSpeed: 1,
        intensity: effectIntensity,
      };
    }
  }, [enabled, tier, intensity, scores]);

  return {
    effect,
    getVariation,
    markNoticed,
    detailOrientation: scores.detailOrientation,
    noticedChanges,
    sessionSeed,
  };
}
