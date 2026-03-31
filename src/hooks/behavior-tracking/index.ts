// Behavior Tracking System - Main exports
// Client-side behavior analysis for dynamic effects

// Types
export * from './types';

// Core tracker
export { useBehaviorTracker, BehaviorTrackerProvider } from './use-behavior-tracker';

// Algorithm hooks
export { useLearningVelocity } from './algorithms/use-learning-velocity';
export { useExplorationFingerprint } from './algorithms/use-exploration-fingerprint';
export { useEngagementRhythm } from './algorithms/use-engagement-rhythm';
export { useCircadianResonance } from './algorithms/use-circadian-resonance';
export { useSerendipitySparks } from './algorithms/use-serendipity-sparks';
export { useEntropyEcho } from './algorithms/use-entropy-echo';
export { useCompetencyConstellation } from './algorithms/use-competency-constellation';
export { useAttentionHeatmap } from './algorithms/use-attention-heatmap';
export { useDecisionMomentum } from './algorithms/use-decision-momentum';
export { useCollaborationFrequency } from './algorithms/use-collaboration-frequency';

// Convenience hook to get all algorithm effects
export { useCombinedEffects } from './use-combined-effects';
