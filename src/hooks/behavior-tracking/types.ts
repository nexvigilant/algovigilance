// Behavior Tracking Types
// All data stored client-side for privacy

export type DiscoverabilityTier = 'obvious' | 'attentive' | 'discerning' | 'hidden';

export interface SessionData {
  startTime: number;
  endTime?: number;
  dayOfWeek: number;
  hourOfDay: number;
  pagesVisited: string[];
  interactions: number;
}

export interface NavigationEvent {
  from: string;
  to: string;
  timestamp: number;
  hoverDuration?: number;
}

export interface ContentInteraction {
  contentId: string;
  contentType: 'lesson' | 'quiz' | 'post' | 'page';
  timeSpent: number;
  scrollDepth: number;
  performance?: number; // Quiz score, etc.
  timestamp: number;
}

export interface CommunityInteraction {
  type: 'post' | 'comment' | 'reaction' | 'read' | 'share';
  timestamp: number;
  contentId?: string;
}

export interface DecisionEvent {
  elementId: string;
  hoverDuration: number;
  clicked: boolean;
  backtrackedWithin?: number; // ms until user went back
  timestamp: number;
}

export interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
  pageId: string;
}

export interface UserBehaviorMetrics {
  // Session patterns
  sessions: SessionData[];

  // Navigation patterns
  navigationSequences: NavigationEvent[];

  // Content consumption
  contentInteractions: ContentInteraction[];

  // Community engagement
  communityInteractions: CommunityInteraction[];

  // Decision patterns
  decisions: DecisionEvent[];

  // Attention patterns (sampled, not every move)
  mouseMovements: MouseMovement[];

  // Aggregated scores (computed)
  scores: BehaviorScores;
}

export interface BehaviorScores {
  // Learning Velocity (0-100)
  learningVelocity: number;
  learningStyle: 'efficient' | 'thorough' | 'skimmer' | 'unknown';

  // Exploration pattern
  explorationStyle: 'linear' | 'hub-spoke' | 'depth-first' | 'scatter' | 'unknown';

  // Engagement type
  engagementType: 'creator' | 'consumer' | 'conversationalist' | 'lurker' | 'unknown';

  // Peak hours (0-23)
  peakHours: number[];
  circadianType: 'morning' | 'afternoon' | 'night' | 'weekend' | 'unknown';

  // Curiosity score (0-100)
  curiosityScore: number;

  // Detail orientation (0-100)
  detailOrientation: number;

  // Decision style
  decisionStyle: 'quick' | 'deliberate' | 'hesitant' | 'unknown';
  avgDecisionTime: number;

  // Collaboration preference (0-100, 0=solo, 100=collaborative)
  collaborationPreference: number;

  // Last updated
  lastUpdated: number;
}

export interface AlgorithmConfig {
  enabled: boolean;
  tier: DiscoverabilityTier;
  intensity: number; // 0-1
}

export interface BehaviorAlgorithmConfigs {
  learningVelocity: AlgorithmConfig;
  explorationFingerprint: AlgorithmConfig;
  engagementRhythm: AlgorithmConfig;
  circadianResonance: AlgorithmConfig;
  serendipitySparks: AlgorithmConfig;
  entropyEcho: AlgorithmConfig;
  competencyConstellation: AlgorithmConfig;
  attentionHeatmap: AlgorithmConfig;
  decisionMomentum: AlgorithmConfig;
  collaborationFrequency: AlgorithmConfig;
}

// Effect outputs from algorithms
export interface EffectOutput {
  // Color variations
  primaryColor?: string;
  secondaryColor?: string;
  glowColor?: string;

  // Particle effects
  particleCount?: number;
  particleSpeed?: number;
  particleDirection?: 'inward' | 'outward' | 'orbital' | 'chaotic' | 'linear';

  // Animation modifiers
  pulseSpeed?: number;
  intensity?: number;

  // Special effects
  trailEffect?: boolean;
  burstEffect?: boolean;
  waveEffect?: boolean;
}
