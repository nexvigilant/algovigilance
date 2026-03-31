'use client';

import { useMemo } from 'react';
import { useLearningVelocity } from './algorithms/use-learning-velocity';
import { useExplorationFingerprint } from './algorithms/use-exploration-fingerprint';
import { useEngagementRhythm } from './algorithms/use-engagement-rhythm';
import { useCircadianResonance } from './algorithms/use-circadian-resonance';
import { useDecisionMomentum } from './algorithms/use-decision-momentum';
import { useCollaborationFrequency } from './algorithms/use-collaboration-frequency';
import type { EffectOutput, BehaviorAlgorithmConfigs } from './types';

// Default configuration for all algorithms
const defaultConfigs: BehaviorAlgorithmConfigs = {
  learningVelocity: { enabled: true, tier: 'attentive', intensity: 1 },
  explorationFingerprint: { enabled: true, tier: 'attentive', intensity: 1 },
  engagementRhythm: { enabled: true, tier: 'attentive', intensity: 1 },
  circadianResonance: { enabled: true, tier: 'obvious', intensity: 1 },
  serendipitySparks: { enabled: true, tier: 'attentive', intensity: 1 },
  entropyEcho: { enabled: true, tier: 'discerning', intensity: 1 },
  competencyConstellation: { enabled: true, tier: 'attentive', intensity: 1 },
  attentionHeatmap: { enabled: true, tier: 'hidden', intensity: 1 },
  decisionMomentum: { enabled: true, tier: 'attentive', intensity: 1 },
  collaborationFrequency: { enabled: true, tier: 'attentive', intensity: 1 },
};

interface CombinedEffectsConfig {
  configs?: Partial<BehaviorAlgorithmConfigs>;
  context?: 'nucleus' | 'academy' | 'community' | 'profile' | 'general';
}

export function useCombinedEffects(config: CombinedEffectsConfig = {}) {
  const { configs = {}, context = 'general' } = config;

  // Merge with defaults
  const mergedConfigs = useMemo(() => {
    return {
      ...defaultConfigs,
      ...configs,
    } as BehaviorAlgorithmConfigs;
  }, [configs]);

  // Context-specific adjustments
  const contextAdjustments = useMemo(() => {
    switch (context) {
      case 'nucleus':
        return {
          explorationFingerprint: { intensity: 1.5 },
          circadianResonance: { intensity: 1.2 },
          decisionMomentum: { intensity: 1.3 },
        };
      case 'academy':
        return {
          learningVelocity: { intensity: 1.5 },
          competencyConstellation: { intensity: 1.3 },
        };
      case 'community':
        return {
          engagementRhythm: { intensity: 1.5 },
          collaborationFrequency: { intensity: 1.3 },
        };
      case 'profile':
        return {
          competencyConstellation: { intensity: 1.5 },
          circadianResonance: { intensity: 1.2 },
        };
      default:
        return {};
    }
  }, [context]);

  // Apply context adjustments
  const finalConfigs = useMemo(() => {
    const adjusted = { ...mergedConfigs };
    Object.entries(contextAdjustments).forEach(([key, value]) => {
      const configKey = key as keyof BehaviorAlgorithmConfigs;
      adjusted[configKey] = {
        ...adjusted[configKey],
        ...value,
      };
    });
    return adjusted;
  }, [mergedConfigs, contextAdjustments]);

  // Get individual algorithm results
  const learningVelocity = useLearningVelocity(finalConfigs.learningVelocity);
  const explorationFingerprint = useExplorationFingerprint(finalConfigs.explorationFingerprint);
  const engagementRhythm = useEngagementRhythm(finalConfigs.engagementRhythm);
  const circadianResonance = useCircadianResonance(finalConfigs.circadianResonance);
  const decisionMomentum = useDecisionMomentum(finalConfigs.decisionMomentum);
  const collaborationFrequency = useCollaborationFrequency(finalConfigs.collaborationFrequency);

  // Combine effects based on context priority
  const combinedEffect = useMemo((): EffectOutput => {
    // Weight effects by context relevance
    const weights: Record<string, number> = {
      learningVelocity: context === 'academy' ? 0.3 : 0.1,
      explorationFingerprint: context === 'nucleus' ? 0.3 : 0.1,
      engagementRhythm: context === 'community' ? 0.3 : 0.1,
      circadianResonance: 0.15, // Always relevant
      decisionMomentum: 0.1,
      collaborationFrequency: context === 'community' ? 0.2 : 0.1,
    };

    // Normalize weights
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    Object.keys(weights).forEach((key) => {
      weights[key] /= totalWeight;
    });

    // Blend particle counts
    const particleCount = Math.round(
      (learningVelocity.effect.particleCount || 0) * weights.learningVelocity +
      (explorationFingerprint.effect.particleCount || 0) * weights.explorationFingerprint +
      (engagementRhythm.effect.particleCount || 0) * weights.engagementRhythm +
      (circadianResonance.effect.particleCount || 0) * weights.circadianResonance +
      (decisionMomentum.effect.particleCount || 0) * weights.decisionMomentum +
      (collaborationFrequency.effect.particleCount || 0) * weights.collaborationFrequency
    );

    // Average speeds
    const particleSpeed =
      (learningVelocity.effect.particleSpeed || 1) * weights.learningVelocity +
      (explorationFingerprint.effect.particleSpeed || 1) * weights.explorationFingerprint +
      (engagementRhythm.effect.particleSpeed || 1) * weights.engagementRhythm +
      (circadianResonance.effect.particleSpeed || 1) * weights.circadianResonance +
      (decisionMomentum.effect.particleSpeed || 1) * weights.decisionMomentum +
      (collaborationFrequency.effect.particleSpeed || 1) * weights.collaborationFrequency;

    // Use the most weighted effect's colors
    let dominantEffect = circadianResonance.effect;
    let maxWeight = weights.circadianResonance;

    if (context === 'academy' && weights.learningVelocity > maxWeight) {
      dominantEffect = learningVelocity.effect;
    } else if (context === 'nucleus' && weights.explorationFingerprint > maxWeight) {
      dominantEffect = explorationFingerprint.effect;
    } else if (context === 'community' && weights.engagementRhythm > maxWeight) {
      dominantEffect = engagementRhythm.effect;
    }

    return {
      primaryColor: dominantEffect.primaryColor,
      secondaryColor: dominantEffect.secondaryColor || circadianResonance.effect.secondaryColor,
      glowColor: dominantEffect.glowColor,
      particleCount,
      particleSpeed,
      particleDirection: dominantEffect.particleDirection || 'orbital',
      pulseSpeed: dominantEffect.pulseSpeed || 1.5,
      intensity: dominantEffect.intensity || 0.5,
      trailEffect: dominantEffect.trailEffect,
      burstEffect: dominantEffect.burstEffect,
      waveEffect: dominantEffect.waveEffect,
    };
  }, [
    context,
    learningVelocity.effect,
    explorationFingerprint.effect,
    engagementRhythm.effect,
    circadianResonance.effect,
    decisionMomentum.effect,
    collaborationFrequency.effect,
  ]);

  // Return all algorithm data plus combined effect
  return {
    combinedEffect,
    algorithms: {
      learningVelocity,
      explorationFingerprint,
      engagementRhythm,
      circadianResonance,
      decisionMomentum,
      collaborationFrequency,
    },
    context,
  };
}
