'use client';

import { useMemo } from 'react';
import { useBehaviorTracker } from '../use-behavior-tracker';
import type { EffectOutput, DiscoverabilityTier } from '../types';

interface CollaborationConfig {
  enabled?: boolean;
  tier?: DiscoverabilityTier;
  intensity?: number;
}

export function useCollaborationFrequency(config: CollaborationConfig = {}) {
  const { enabled = true, tier = 'attentive', intensity = 1 } = config;
  const { scores, metrics } = useBehaviorTracker();

  // Determine collaboration style
  const collaborationStyle = useMemo(() => {
    const { collaborationPreference } = scores;

    if (collaborationPreference > 70) return 'collaborator';
    if (collaborationPreference < 30) return 'soloist';
    return 'balanced';
  }, [scores]);

  const effect = useMemo((): EffectOutput => {
    if (!enabled) return {};

    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    const effectIntensity = intensity * tierMultiplier;
    const collabFactor = scores.collaborationPreference / 100;

    switch (collaborationStyle) {
      case 'collaborator':
        // Effects that "reach out" - extended particle fields
        return {
          primaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
          secondaryColor: `rgba(212, 175, 55, ${effectIntensity * 0.6})`,
          glowColor: `rgba(0, 174, 239, ${effectIntensity * 0.7})`,
          particleCount: Math.round(12 * effectIntensity * collabFactor),
          particleSpeed: 2,
          particleDirection: 'outward',
          burstEffect: true,
          waveEffect: true,
          intensity: effectIntensity,
        };

      case 'soloist':
        // Self-contained effects - tight, personal aura
        return {
          primaryColor: `rgba(212, 175, 55, ${effectIntensity})`,
          secondaryColor: `rgba(184, 115, 51, ${effectIntensity * 0.4})`,
          glowColor: `rgba(212, 175, 55, ${effectIntensity * 0.5})`,
          particleCount: Math.round(6 * effectIntensity),
          particleSpeed: 0.8,
          particleDirection: 'orbital',
          pulseSpeed: 2,
          intensity: effectIntensity * 0.9,
        };

      case 'balanced':
        // Mix of inward and outward
        return {
          primaryColor: `rgba(0, 174, 239, ${effectIntensity * 0.8})`,
          secondaryColor: `rgba(212, 175, 55, ${effectIntensity * 0.8})`,
          glowColor: `rgba(184, 115, 51, ${effectIntensity * 0.5})`,
          particleCount: Math.round(8 * effectIntensity),
          particleSpeed: 1.2,
          particleDirection: 'orbital',
          trailEffect: true,
          intensity: effectIntensity,
        };

      default:
        return {
          primaryColor: `rgba(148, 163, 184, ${effectIntensity * 0.4})`,
          particleCount: Math.round(4 * effectIntensity),
          intensity: effectIntensity * 0.3,
        };
    }
  }, [enabled, tier, intensity, scores, collaborationStyle]);

  // Calculate recent collaboration metrics
  const recentMetrics = useMemo(() => {
    const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCommunity = metrics.communityInteractions.filter(
      (c) => c.timestamp > last7Days
    );
    const recentContent = metrics.contentInteractions.filter(
      (c) => c.timestamp > last7Days
    );

    return {
      socialActivities: recentCommunity.length,
      soloActivities: recentContent.length,
      posts: recentCommunity.filter((c) => c.type === 'post').length,
      comments: recentCommunity.filter((c) => c.type === 'comment').length,
      reactions: recentCommunity.filter((c) => c.type === 'reaction').length,
    };
  }, [metrics]);

  return {
    effect,
    collaborationStyle,
    collaborationPreference: scores.collaborationPreference,
    recentMetrics,
  };
}
