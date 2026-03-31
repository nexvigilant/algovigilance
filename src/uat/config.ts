/**
 * UAT Agent Configuration
 *
 * Central configuration for the UAT testing system.
 * Configurable via environment variables or direct imports.
 */

import path from 'path';

export interface UATConfig {
  /** Base URL for the application under test */
  baseUrl: string;

  /** Run browser in headless mode */
  headless: boolean;

  /** Default timeout for page operations (ms) */
  timeout: number;

  /** Take screenshot on detected errors */
  screenshotOnError: boolean;

  /** Record video of test sessions */
  videoRecording: boolean;

  /** Maximum actions per flow before stopping */
  maxActionsPerFlow: number;

  /** Output directory for reports and artifacts */
  outputDir: string;

  /** AI decision confidence threshold (0-1) */
  aiConfidenceThreshold: number;

  /** Slow down actions for debugging (ms between actions) */
  slowMo: number;

  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };

  /** Parallel execution settings */
  parallel: {
    /** Run personas in parallel */
    enabled: boolean;
    /** Max concurrent browser contexts */
    maxWorkers: number;
  };

  /** Retry settings for flaky actions */
  retry: {
    /** Max retries for failed actions */
    maxRetries: number;
    /** Delay between retries (ms) */
    retryDelay: number;
  };
}

export const uatConfig: UATConfig = {
  baseUrl: process.env.UAT_BASE_URL || 'http://localhost:9002',
  headless: process.env.UAT_HEADLESS !== 'false',
  timeout: parseInt(process.env.UAT_TIMEOUT || '30000', 10),
  screenshotOnError: true,
  videoRecording: true,
  maxActionsPerFlow: parseInt(process.env.UAT_MAX_ACTIONS || '50', 10),
  outputDir: process.env.UAT_OUTPUT_DIR || path.join(process.cwd(), 'uat-reports'),
  aiConfidenceThreshold: 0.7,
  slowMo: parseInt(process.env.UAT_SLOW_MO || '0', 10),
  viewport: {
    width: 1280,
    height: 720,
  },
  parallel: {
    enabled: process.env.UAT_PARALLEL !== 'false',
    maxWorkers: parseInt(process.env.UAT_MAX_WORKERS || '4', 10),
  },
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },
};

/**
 * Persona-specific configuration
 */
export interface PersonaConfig {
  id: string;
  name: string;
  description: string;
  authRequired: boolean;
  role: 'visitor' | 'member' | 'practitioner' | 'admin';
  targetFlows: FlowId[];
  goals: string[];
  behaviorProfile: {
    /** How deeply to explore (affects branching decisions) */
    explorationDepth: 'shallow' | 'medium' | 'deep';
    /** Speed of form interactions */
    formFillSpeed: 'fast' | 'realistic' | 'slow';
    /** How tolerant of minor issues before reporting */
    errorTolerance: 'low' | 'medium' | 'high';
  };
}

export type FlowId =
  | 'service-wizard'
  | 'onboarding'
  | 'academy'
  | 'community'
  | 'public-pages'
  | 'profile'
  | 'admin';

export const personas: Record<string, PersonaConfig> = {
  visitor: {
    id: 'visitor',
    name: 'Jordan',
    description: 'New visitor exploring the platform',
    authRequired: false,
    role: 'visitor',
    targetFlows: ['service-wizard', 'public-pages'],
    goals: [
      'Explore the landing page',
      'Complete the service wizard assessment',
      'View intelligence content',
      'Submit contact form',
    ],
    behaviorProfile: {
      explorationDepth: 'medium',
      formFillSpeed: 'realistic',
      errorTolerance: 'low',
    },
  },
  member: {
    id: 'member',
    name: 'Alex',
    description: 'New member completing onboarding',
    authRequired: true,
    role: 'member',
    targetFlows: ['onboarding', 'academy', 'community'],
    goals: [
      'Complete 4-step onboarding',
      'Browse academy pathways',
      'View community discussions',
      'Update profile',
    ],
    behaviorProfile: {
      explorationDepth: 'medium',
      formFillSpeed: 'realistic',
      errorTolerance: 'medium',
    },
  },
  practitioner: {
    id: 'practitioner',
    name: 'Morgan',
    description: 'Active learner engaging with platform',
    authRequired: true,
    role: 'practitioner',
    targetFlows: ['academy', 'community', 'profile'],
    goals: [
      'Enroll in a pathway',
      'Complete ALO activities',
      'Create community post',
      'Reply to discussions',
      'Check progress',
    ],
    behaviorProfile: {
      explorationDepth: 'deep',
      formFillSpeed: 'fast',
      errorTolerance: 'medium',
    },
  },
  admin: {
    id: 'admin',
    name: 'Taylor',
    description: 'Platform administrator',
    authRequired: true,
    role: 'admin',
    targetFlows: ['admin'],
    goals: [
      'View admin dashboard',
      'Check platform statistics',
      'Review moderation queue',
      'Manage content',
    ],
    behaviorProfile: {
      explorationDepth: 'shallow',
      formFillSpeed: 'fast',
      errorTolerance: 'high',
    },
  },
};

/**
 * Flow-specific configuration
 */
export interface FlowConfig {
  id: FlowId;
  name: string;
  description: string;
  entryPoint: string;
  requiredAuth: boolean;
  estimatedDuration: number; // seconds
  criticalCheckpoints: string[];
}

export const flows: Record<FlowId, FlowConfig> = {
  'service-wizard': {
    id: 'service-wizard',
    name: 'Service Wizard',
    description: 'Strategic diagnostic assessment wizard',
    entryPoint: '/services',
    requiredAuth: false,
    estimatedDuration: 120,
    criticalCheckpoints: [
      'Welcome screen displayed',
      'Question navigation works',
      'Results displayed correctly',
      'PDF download available',
    ],
  },
  onboarding: {
    id: 'onboarding',
    name: 'Onboarding',
    description: '4-step profile completion',
    entryPoint: '/nucleus/onboarding',
    requiredAuth: true,
    estimatedDuration: 180,
    criticalCheckpoints: [
      'Step 1: Basic info',
      'Step 2: Education',
      'Step 3: Experience',
      'Step 4: Affiliations',
      'Completion redirect',
    ],
  },
  academy: {
    id: 'academy',
    name: 'Academy',
    description: 'Learning pathways and ALO activities',
    entryPoint: '/nucleus/academy',
    requiredAuth: true,
    estimatedDuration: 300,
    criticalCheckpoints: [
      'Pathway grid displayed',
      'Pathway detail loads',
      'ALO sections render',
      'Progress tracking works',
    ],
  },
  community: {
    id: 'community',
    name: 'Community',
    description: 'Discussion forums and interactions',
    entryPoint: '/nucleus/community',
    requiredAuth: true,
    estimatedDuration: 180,
    criticalCheckpoints: [
      'Forum list displayed',
      'Post creation works',
      'Reply functionality',
      'Voting works',
    ],
  },
  'public-pages': {
    id: 'public-pages',
    name: 'Public Pages',
    description: 'Marketing and information pages',
    entryPoint: '/',
    requiredAuth: false,
    estimatedDuration: 120,
    criticalCheckpoints: [
      'Landing page loads',
      'Navigation works',
      'All public routes accessible',
      'Contact form submits',
    ],
  },
  profile: {
    id: 'profile',
    name: 'Profile',
    description: 'User profile management',
    entryPoint: '/nucleus/profile',
    requiredAuth: true,
    estimatedDuration: 90,
    criticalCheckpoints: [
      'Profile loads',
      'Edit functionality',
      'Settings tabs work',
    ],
  },
  admin: {
    id: 'admin',
    name: 'Admin Dashboard',
    description: 'Platform administration',
    entryPoint: '/nucleus/admin',
    requiredAuth: true,
    estimatedDuration: 120,
    criticalCheckpoints: [
      'Dashboard loads',
      'Stats displayed',
      'Tab navigation works',
      'Admin actions available',
    ],
  },
};

/**
 * Get configuration for a specific persona
 */
export function getPersonaConfig(personaId: string): PersonaConfig | undefined {
  return personas[personaId];
}

/**
 * Get configuration for a specific flow
 */
export function getFlowConfig(flowId: FlowId): FlowConfig {
  return flows[flowId];
}

/**
 * Get all flows for a persona
 */
export function getFlowsForPersona(personaId: string): FlowConfig[] {
  const persona = personas[personaId];
  if (!persona) return [];
  return persona.targetFlows.map((flowId) => flows[flowId]);
}
