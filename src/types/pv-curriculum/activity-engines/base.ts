/**
 * Base Activity Engine Types
 * Common types for KSB activities
 */


// ============================================================================
// ALO CONTENT SECTIONS
// ============================================================================

/**
 * Hook Section - 30-second engagement trigger
 */
export interface KSBHook {
  content: string;
  scenarioType: 'real_world' | 'case_study' | 'challenge' | 'question';
}

/**
 * Concept Section - 2-minute core learning content
 */
export interface KSBConcept {
  content: string;
  keyPoints: string[];
  examples: KSBExample[];
  resources?: KSBResource[];
}

export interface KSBExample {
  title: string;
  content: string;
  context?: string;
}

export interface KSBResource {
  title: string;
  url: string;
  type: 'article' | 'video' | 'document' | 'tool' | 'reference';
}

/**
 * Activity Section - 5-minute practice with activity engines
 */
export interface KSBActivity {
  engineType: 'red_pen' | 'triage' | 'synthesis' | 'calculator' | 'timeline' | 'code_playground';
  instructions: string;
  timeLimitMinutes?: number;
  config:
    | import('./configs').RedPenConfig
    | import('./configs').TriageConfig
    | import('./configs').SynthesisConfig
    | import('./calculator').CalculatorConfig
    | import('./timeline').TimelineConfig
    | import('./configs').CodePlaygroundConfig;
}

/**
 * Reflection Section - 30-second synthesis and portfolio capture
 */
export interface KSBReflection {
  prompt: string;
  portfolioArtifact: PortfolioArtifactConfig;
}

export interface PortfolioArtifactConfig {
  title: string;
  description: string;
  competencyTags: string[]; // EPA IDs, CPA IDs, Domain IDs
  artifactType: 'completion' | 'creation' | 'analysis' | 'decision_log';
}

/**
 * Activity Metadata - Learning experience configuration
 */
export interface KSBActivityMetadata {
  version: string;
  estimatedMinutes: number;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  prerequisites: string[]; // KSB IDs
  tags: string[];
  completionCriteria: {
    minimumScore?: number;
    requiredSections: ('hook' | 'concept' | 'activity' | 'reflection')[];
  };
}
