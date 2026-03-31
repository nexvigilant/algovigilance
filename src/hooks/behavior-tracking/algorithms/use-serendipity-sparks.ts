'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBehaviorTracker } from '../use-behavior-tracker';
import type { EffectOutput, DiscoverabilityTier } from '../types';

interface SerendipityConfig {
  enabled?: boolean;
  tier?: DiscoverabilityTier;
  intensity?: number;
  sparkInterval?: number; // ms between potential sparks
}

interface SparkTarget {
  id: string;
  type: 'content' | 'feature' | 'navigation';
  label: string;
}

export function useSerendipitySparks(config: SerendipityConfig = {}) {
  const {
    enabled = true,
    tier = 'attentive',
    intensity = 1,
    sparkInterval: _sparkInterval = 30000, // 30 seconds
  } = config;

  const { scores, trackSerendipityResponse } = useBehaviorTracker();
  const [activeSpark, setActiveSpark] = useState<SparkTarget | null>(null);
  const [sparkPosition, setSparkPosition] = useState({ x: 0, y: 0 });

  // Track auto-dismiss timeout for cleanup
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, []);

  // Frequency based on curiosity score
  const sparkProbability = useMemo(() => {
    const { curiosityScore } = scores;
    // High curiosity = more sparks
    return Math.min(0.8, (curiosityScore / 100) * 0.5 + 0.1);
  }, [scores]);

  // Generate random spark
  const generateSpark = useCallback((targets: SparkTarget[]) => {
    if (!enabled || targets.length === 0) return;

    if (Math.random() < sparkProbability) {
      const target = targets[Math.floor(Math.random() * targets.length)];

      // Random position within viewport
      setSparkPosition({
        x: 20 + Math.random() * 60, // 20-80% from left
        y: 20 + Math.random() * 60, // 20-80% from top
      });

      setActiveSpark(target);

      // Clear any existing dismiss timeout before setting new one
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }

      // Auto-dismiss after 5 seconds if not interacted
      dismissTimeoutRef.current = setTimeout(() => {
        setActiveSpark((current) => {
          if (current?.id === target.id) {
            trackSerendipityResponse(false);
            return null;
          }
          return current;
        });
        dismissTimeoutRef.current = null;
      }, 5000);
    }
  }, [enabled, sparkProbability, trackSerendipityResponse]);

  // Handle spark interaction
  const followSpark = useCallback(() => {
    if (activeSpark) {
      // Clear auto-dismiss timeout since user interacted
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
      trackSerendipityResponse(true);
      const target = activeSpark;
      setActiveSpark(null);
      return target;
    }
    return null;
  }, [activeSpark, trackSerendipityResponse]);

  const dismissSpark = useCallback(() => {
    if (activeSpark) {
      // Clear auto-dismiss timeout since user interacted
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
      trackSerendipityResponse(false);
      setActiveSpark(null);
    }
  }, [activeSpark, trackSerendipityResponse]);

  // Effect for the spark visualization
  const effect = useMemo((): EffectOutput => {
    if (!enabled || !activeSpark) return {};

    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    const effectIntensity = intensity * tierMultiplier;
    const curiosityBoost = scores.curiosityScore / 100;

    return {
      primaryColor: `rgba(168, 85, 247, ${effectIntensity})`, // Purple for discovery
      secondaryColor: `rgba(0, 174, 239, ${effectIntensity * 0.6})`,
      glowColor: `rgba(168, 85, 247, ${effectIntensity * curiosityBoost})`,
      particleCount: Math.round(6 * effectIntensity),
      particleSpeed: 2,
      particleDirection: 'outward',
      burstEffect: true,
      pulseSpeed: 0.8,
      intensity: effectIntensity,
    };
  }, [enabled, activeSpark, tier, intensity, scores]);

  return {
    effect,
    activeSpark,
    sparkPosition,
    curiosityScore: scores.curiosityScore,
    generateSpark,
    followSpark,
    dismissSpark,
    sparkProbability,
  };
}
