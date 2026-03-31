/**
 * Shared quiz data for community discovery
 *
 * Used by both the public preview quiz and authenticated quiz
 * to ensure consistency across experiences.
 */

export const COMMUNITY_INTERESTS = [
  'Regulatory Affairs',
  'Clinical Trials',
  'Drug Development',
  'Pharmacovigilance',
  'Medical Writing',
  'Quality Assurance',
  'Market Access',
  'Pharmacoeconomics',
  'Medical Affairs',
  'Data Science',
  'Biostatistics',
  'Project Management',
] as const;

export const COMMUNITY_GOALS = [
  'networking',
  'learning',
  'job-seeking',
  'mentoring',
  'sharing-knowledge',
] as const;

export const COMMUNITY_GOAL_LABELS: Record<CommunityGoal, string> = {
  networking: 'Connect with Professionals',
  learning: 'Learn New Skills',
  'job-seeking': 'Find Job Opportunities',
  mentoring: 'Find a Mentor',
  'sharing-knowledge': 'Share Expertise & Advocate',
};

export const COMMUNITY_TOPICS = [
  'FDA Regulations',
  'EMA Guidelines',
  'Clinical Study Design',
  'Adverse Event Reporting',
  'Post-Marketing Surveillance',
  'Risk Management',
  'Health Economics',
  'Real World Evidence',
  'Digital Health',
  'AI in Healthcare',
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'practitioner', label: 'Practitioner / Recent Graduate' },
  { value: 'transitioning', label: 'Transitioning to Pharma' },
  { value: 'early-career', label: 'Early Career (0-3 years)' },
  { value: 'mid-career', label: 'Mid Career (4-10 years)' },
  { value: 'senior', label: 'Senior Professional (10+ years)' },
] as const;

// Type exports
export type CommunityInterest = (typeof COMMUNITY_INTERESTS)[number];
export type CommunityGoal = (typeof COMMUNITY_GOALS)[number];
export type CommunityTopic = (typeof COMMUNITY_TOPICS)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]['value'];

export interface CommunityQuizData {
  interests: CommunityInterest[];
  goals: CommunityGoal[];
  preferredTopics: CommunityTopic[];
  experience?: ExperienceLevel;
}

/** Extended quiz state with step tracking for autosave */
export interface CommunityQuizState extends CommunityQuizData {
  currentStep: number;
  lastUpdated: number;
}

// Quiz step configuration
export const QUIZ_STEPS = [
  { id: 1, title: 'Interests', required: true },
  { id: 2, title: 'Goals', required: true },
  { id: 3, title: 'Topics', required: false },
  { id: 4, title: 'Experience', required: false },
] as const;

export const TOTAL_QUIZ_STEPS = QUIZ_STEPS.length;

// UI Constants
export const QUIZ_UI_CONFIG = {
  /** Max interests to display on completion screen before "+N more" */
  maxDisplayedInterests: 4,
  /** Z-index for keyboard hints tooltip (above most elements) */
  tooltipZIndex: 50,
  /** Minimum touch target size in pixels (WCAG 2.5.5) */
  minTouchTarget: 44,
  /** Autosave debounce delay in ms */
  autosaveDelay: 500,
  /** Session expiry for saved quiz state (24 hours) */
  sessionExpiryMs: 24 * 60 * 60 * 1000,
} as const;

// localStorage keys
export const QUIZ_STORAGE_KEY = 'nex_discovery_quiz_preview';
export const QUIZ_STATE_KEY = 'nex_discovery_quiz_state';

// Routes
export const QUIZ_ROUTES = {
  community: '/community',
  membership: '/auth/signup',
  signIn: '/auth/signin',
  signUp: '/auth/signup',
} as const;

import { logger } from '@/lib/logger';
const log = logger.scope('data/community-quiz');

/**
 * Safely save quiz data to localStorage (final submission)
 * Returns true if successful, false if storage is unavailable
 */
export function saveQuizData(data: CommunityQuizData): boolean {
  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    // localStorage may be full or disabled (private browsing)
    log.warn('Could not save quiz progress:', error);
    return false;
  }
}

/**
 * Save quiz state with step tracking (autosave)
 */
export function saveQuizState(data: CommunityQuizData, step: number): boolean {
  try {
    const state: CommunityQuizState = {
      ...data,
      currentStep: step,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    log.warn('Could not autosave quiz state:', error);
    return false;
  }
}

/**
 * Load quiz state from localStorage (for resume functionality)
 * Returns null if no data exists, parsing fails, or session expired.
 *
 * Performs defensive validation:
 * - Bounds-checks currentStep (1 ≤ step ≤ TOTAL_QUIZ_STEPS)
 * - Coerces undefined arrays to empty arrays
 * - Filters stale selections against current option lists
 */
export function loadQuizState(): CommunityQuizState | null {
  try {
    const stored = localStorage.getItem(QUIZ_STATE_KEY);
    if (!stored) return null;

    const raw = JSON.parse(stored);

    // Check if session has expired
    if (
      typeof raw.lastUpdated === 'number' &&
      Date.now() - raw.lastUpdated > QUIZ_UI_CONFIG.sessionExpiryMs
    ) {
      clearQuizState();
      return null;
    }

    // Validate and sanitize the state
    const validatedState: CommunityQuizState = {
      // Coerce arrays with ?? [] and filter stale values
      interests: filterValidInterests(raw.interests ?? []),
      goals: filterValidGoals(raw.goals ?? []),
      preferredTopics: filterValidTopics(raw.preferredTopics ?? []),
      // Validate experience against current options
      experience: isValidExperience(raw.experience) ? raw.experience : undefined,
      // Bounds-check currentStep (clamp to valid range)
      currentStep: Math.max(
        1,
        Math.min(TOTAL_QUIZ_STEPS, Number(raw.currentStep) || 1)
      ),
      lastUpdated: raw.lastUpdated ?? Date.now(),
    };

    return validatedState;
  } catch (error) {
    log.warn('Could not load quiz state:', error);
    return null;
  }
}

/**
 * Load quiz data from localStorage (final submission data)
 * Returns null if no data exists or parsing fails
 */
export function loadQuizData(): CommunityQuizData | null {
  try {
    const stored = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CommunityQuizData;
  } catch (error) {
    log.warn('Could not load quiz progress:', error);
    return null;
  }
}

/**
 * Clear quiz data from localStorage
 */
export function clearQuizData(): void {
  try {
    localStorage.removeItem(QUIZ_STORAGE_KEY);
  } catch {
    // Silently fail - data will be orphaned but no harm done
  }
}

/**
 * Clear quiz state from localStorage
 */
export function clearQuizState(): void {
  try {
    localStorage.removeItem(QUIZ_STATE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Check if user has unsaved progress
 */
export function hasUnsavedProgress(data: CommunityQuizData): boolean {
  return (
    data.interests.length > 0 ||
    data.goals.length > 0 ||
    data.preferredTopics.length > 0 ||
    data.experience !== undefined
  );
}

/**
 * Type guard for checking if a value is a valid CommunityInterest
 */
export function isValidInterest(value: string): value is CommunityInterest {
  return (COMMUNITY_INTERESTS as readonly string[]).includes(value);
}

/**
 * Type guard for checking if a value is a valid CommunityGoal
 */
export function isValidGoal(value: string): value is CommunityGoal {
  return (COMMUNITY_GOALS as readonly string[]).includes(value);
}

/**
 * Type guard for checking if a value is a valid CommunityTopic
 */
export function isValidTopic(value: string): value is CommunityTopic {
  return (COMMUNITY_TOPICS as readonly string[]).includes(value);
}

/**
 * Type guard for checking if a value is a valid ExperienceLevel
 */
export function isValidExperience(value: unknown): value is ExperienceLevel {
  if (typeof value !== 'string') return false;
  return EXPERIENCE_LEVELS.some((level) => level.value === value);
}

/**
 * Filter an array to only include valid interests (removes stale values)
 */
export function filterValidInterests(values: unknown[]): CommunityInterest[] {
  if (!Array.isArray(values)) return [];
  return values.filter(
    (v): v is CommunityInterest => typeof v === 'string' && isValidInterest(v)
  );
}

/**
 * Filter an array to only include valid goals (removes stale values)
 */
export function filterValidGoals(values: unknown[]): CommunityGoal[] {
  if (!Array.isArray(values)) return [];
  return values.filter(
    (v): v is CommunityGoal => typeof v === 'string' && isValidGoal(v)
  );
}

/**
 * Filter an array to only include valid topics (removes stale values)
 */
export function filterValidTopics(values: unknown[]): CommunityTopic[] {
  if (!Array.isArray(values)) return [];
  return values.filter(
    (v): v is CommunityTopic => typeof v === 'string' && isValidTopic(v)
  );
}

/**
 * Immediately flush autosave state (bypasses debounce)
 * Used before navigation to prevent data loss
 */
export function flushQuizState(data: CommunityQuizData, step: number): boolean {
  return saveQuizState(data, step);
}
