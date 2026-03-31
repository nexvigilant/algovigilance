
/**
 * A micro-module comprising 3-7 related KSBs
 */
export interface MicroModule {
  id: string;
  title: string;
  description: string;
  ksbIds: string[];
  estimatedMinutes: number;
  structure: {
    warmup: string; // ALO ID
    core: string[]; // ALO IDs
    challenge: string; // ALO ID
    assessment: string; // QuickCheck/Assessment ID
  };
  prerequisites: string[]; // Module IDs
  unlocks: string[]; // Module IDs
}

/**
 * A complete Capability Pathway
 */
export interface CapabilityPathway {
  id: string;
  title: string;
  description: string;
  targetOutcome: string;
  domainIds: string[];
  epaIds: string[];
  modules: MicroModule[];
  duration: {
    minimum: number; // hours
    recommended: number; // hours
    maximum: number; // days
  };
  milestones: PathwayMilestone[];
  finalAssessmentId: string;
}

export interface PathwayMilestone {
  id: string;
  title: string;
  description: string;
  requiredModuleIds: string[];
  reward?: {
    type: 'badge' | 'certificate' | 'unlock';
    value: string;
  };
}

/**
 * Quick check for module verification
 */
export interface QuickCheck {
  id: string;
  moduleId: string;
  ksbIds: string[];
  questions: {
    id: string;
    text: string;
    type: 'multiple_choice' | 'true_false';
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
  }[];
  passingScore: number;
}
