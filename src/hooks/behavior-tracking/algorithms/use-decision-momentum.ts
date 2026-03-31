'use client';

import { useMemo, useCallback, useRef } from 'react';
import { useBehaviorTracker } from '../use-behavior-tracker';
import type { EffectOutput, DiscoverabilityTier } from '../types';

interface DecisionConfig {
  enabled?: boolean;
  tier?: DiscoverabilityTier;
  intensity?: number;
}

export function useDecisionMomentum(config: DecisionConfig = {}) {
  const { enabled = true, tier = 'attentive', intensity = 1 } = config;
  const { scores, trackDecision } = useBehaviorTracker();
  const hoverStartRef = useRef<Map<string, number>>(new Map());

  const effect = useMemo((): EffectOutput => {
    if (!enabled) return {};

    const { decisionStyle, avgDecisionTime: _avgDecisionTime } = scores;

    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    const effectIntensity = intensity * tierMultiplier;

    switch (decisionStyle) {
      case 'quick':
        // Sharp, immediate particle bursts
        return {
          primaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
          secondaryColor: `rgba(255, 255, 255, ${effectIntensity * 0.6})`,
          glowColor: `rgba(0, 174, 239, ${effectIntensity * 0.8})`,
          particleCount: Math.round(15 * effectIntensity),
          particleSpeed: 4,
          particleDirection: 'outward',
          burstEffect: true,
          pulseSpeed: 0.3,
          intensity: effectIntensity,
        };

      case 'deliberate':
        // Building glow before action
        return {
          primaryColor: `rgba(212, 175, 55, ${effectIntensity})`,
          secondaryColor: `rgba(184, 115, 51, ${effectIntensity * 0.5})`,
          glowColor: `rgba(212, 175, 55, ${effectIntensity * 0.6})`,
          particleCount: Math.round(8 * effectIntensity),
          particleSpeed: 0.8,
          particleDirection: 'inward',
          waveEffect: true,
          pulseSpeed: 2,
          intensity: effectIntensity,
        };

      case 'hesitant':
        // Wavering, uncertain particles
        return {
          primaryColor: `rgba(184, 115, 51, ${effectIntensity * 0.8})`,
          secondaryColor: `rgba(148, 163, 184, ${effectIntensity * 0.4})`,
          glowColor: `rgba(184, 115, 51, ${effectIntensity * 0.4})`,
          particleCount: Math.round(10 * effectIntensity),
          particleSpeed: 1.5,
          particleDirection: 'chaotic',
          pulseSpeed: 0.5,
          intensity: effectIntensity * 0.7,
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

  // Track hover start for decision timing
  const onHoverStart = useCallback((elementId: string) => {
    hoverStartRef.current.set(elementId, Date.now());
  }, []);

  // Track hover end and decision
  const onHoverEnd = useCallback((elementId: string, clicked: boolean) => {
    const startTime = hoverStartRef.current.get(elementId);
    if (startTime) {
      const duration = Date.now() - startTime;
      trackDecision(elementId, duration, clicked);
      hoverStartRef.current.delete(elementId);
    }
  }, [trackDecision]);

  return {
    effect,
    decisionStyle: scores.decisionStyle,
    avgDecisionTime: scores.avgDecisionTime,
    onHoverStart,
    onHoverEnd,
  };
}
