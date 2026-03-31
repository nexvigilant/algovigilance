/**
 * Circle Taxonomy Types
 *
 * Multi-dimensional classification system for community circles.
 * Supports professional networking, career exploration, skill development,
 * and interest-based connections.
 *
 * @remarks
 * Circles use a multi-dimensional tagging system allowing discovery
 * across job functions, career stages, skills, interests, and pathways.
 */

// ============================================================================
// DIMENSION TYPES
// ============================================================================

/**
 * Primary dimensions for circle classification.
 * Each circle can be tagged across multiple dimensions for better discovery.
 */
export type CircleDimension =
  | 'function'      // Job functions (Engineering, Marketing, etc.)
  | 'organization'  // Professional orgs, fraternities, alumni networks
  | 'career-stage'  // Entry, Mid, Senior, Executive, Transitioning
  | 'aspiration'    // Career goals and aspirations
  | 'skill'         // Technical and soft skills
  | 'interest'      // Professional interests and topics
  | 'pathway'       // Career pathways and exploration
  | 'knowledge';    // Knowledge domains and sub-domains

/**
 * All valid circle dimensions.
 */
export const CIRCLE_DIMENSIONS: readonly CircleDimension[] = [
  'function', 'organization', 'career-stage', 'aspiration',
  'skill', 'interest', 'pathway', 'knowledge'
] as const;

/**
 * Type guard for CircleDimension.
 */
export function isCircleDimension(value: string): value is CircleDimension {
  return CIRCLE_DIMENSIONS.includes(value as CircleDimension);
}

// ============================================================================
// CAREER STAGES
// ============================================================================

/**
 * Career stages representing where someone is in their professional journey.
 */
export type CareerStage =
  | 'practitioner'  // Currently in training / building capability
  | 'entry'         // 0-2 years experience
  | 'mid'           // 3-7 years experience
  | 'senior'        // 8-15 years experience
  | 'lead'          // Team lead / manager level
  | 'executive'     // Director and above
  | 'transitioning' // Changing careers/industries
  | 'returning';    // Returning to workforce

/**
 * All valid career stages.
 */
export const CAREER_STAGES: readonly CareerStage[] = [
  'practitioner', 'entry', 'mid', 'senior', 'lead', 'executive', 'transitioning', 'returning'
] as const;

/**
 * Type guard for CareerStage.
 */
export function isCareerStage(value: string): value is CareerStage {
  return CAREER_STAGES.includes(value as CareerStage);
}

/**
 * Labels for career stages (user-facing display).
 */
export const CAREER_STAGE_LABELS: Readonly<Record<CareerStage, string>> = {
  practitioner: 'Practitioner / In Training',
  entry: 'Entry Level (0-2 years)',
  mid: 'Mid-Career (3-7 years)',
  senior: 'Senior (8-15 years)',
  lead: 'Team Lead / Manager',
  executive: 'Director / Executive',
  transitioning: 'Career Changer',
  returning: 'Returning Professional',
} as const;

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

/**
 * Types of professional organizations that circles can be affiliated with.
 */
export type OrganizationType =
  | 'professional-association' // PMI, ACM, NSBE, etc.
  | 'fraternity-sorority'      // Greek organizations
  | 'alumni-network'           // University/company alumni
  | 'industry-group'           // Industry-specific groups
  | 'certification-body'       // PMP, CFA, etc. certification holders
  | 'mentorship-network'       // Mentorship programs
  | 'custom';                  // User-defined organization type

/**
 * All valid organization types.
 */
export const ORGANIZATION_TYPES: readonly OrganizationType[] = [
  'professional-association', 'fraternity-sorority', 'alumni-network',
  'industry-group', 'certification-body', 'mentorship-network', 'custom'
] as const;

/**
 * Type guard for OrganizationType.
 */
export function isOrganizationType(value: string): value is OrganizationType {
  return ORGANIZATION_TYPES.includes(value as OrganizationType);
}

/**
 * Labels for organization types (user-facing display).
 */
export const ORGANIZATION_TYPE_LABELS: Readonly<Record<OrganizationType, string>> = {
  'professional-association': 'Professional Association',
  'fraternity-sorority': 'Fraternity / Sorority',
  'alumni-network': 'Alumni Network',
  'industry-group': 'Industry Group',
  'certification-body': 'Certification Holders',
  'mentorship-network': 'Mentorship Network',
  custom: 'Other Organization',
} as const;

// ============================================================================
// CIRCLE TAGS
// ============================================================================

/**
 * Multi-dimensional tagging structure for circles.
 * Allows circles to be discovered across multiple dimensions.
 *
 * @remarks
 * Each array property supports multiple values, enabling
 * circles to span multiple categories for better discoverability.
 */
export interface CircleTags {
  /** Job functions (e.g., ['engineering', 'devops']) */
  readonly functions: readonly string[];

  /** Industries (e.g., ['fintech', 'healthcare']) */
  readonly industries: readonly string[];

  /** Career stages of target members */
  readonly careerStages: readonly CareerStage[];

  /** Skills relevant to this circle (e.g., ['python', 'leadership']) */
  readonly skills: readonly string[];

  /** Career goals addressed (e.g., ['career-change', 'upskilling']) */
  readonly goals: readonly string[];

  /** Professional interests (e.g., ['ai-ethics', 'remote-work']) */
  readonly interests: readonly string[];

  /** Career pathways explored (e.g., ['ic-to-manager', 'startup-founder']) */
  readonly pathways: readonly string[];

  /** Type of organization (for org-specific circles) */
  readonly organizationType?: OrganizationType;

  /** Specific organization name (for org-specific circles) */
  readonly organizationName?: string;
}

/**
 * Mutable version of CircleTags for form building.
 */
export interface CircleTagsMutable {
  functions: string[];
  industries: string[];
  careerStages: CareerStage[];
  skills: string[];
  goals: string[];
  interests: string[];
  pathways: string[];
  organizationType?: OrganizationType;
  organizationName?: string;
}

/**
 * Creates an empty CircleTags object with default values.
 *
 * @returns Empty mutable circle tags for form initialization
 */
export function createEmptyCircleTags(): CircleTagsMutable {
  return {
    functions: [],
    industries: [],
    careerStages: [],
    skills: [],
    goals: [],
    interests: [],
    pathways: [],
  };
}

// ============================================================================
// CIRCLE AUTHORITY
// ============================================================================

/**
 * Authority level for circles.
 * Determines if a circle is officially sanctioned or community-created.
 */
export type CircleAuthority = 'official' | 'community';

/**
 * All valid circle authority levels.
 */
export const CIRCLE_AUTHORITIES: readonly CircleAuthority[] = ['official', 'community'] as const;

/**
 * Type guard for CircleAuthority.
 */
export function isCircleAuthority(value: string): value is CircleAuthority {
  return CIRCLE_AUTHORITIES.includes(value as CircleAuthority);
}

// ============================================================================
// CAREER GOALS
// ============================================================================

/**
 * Career goal definition with display metadata.
 */
export interface CareerGoalDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

/**
 * Common career goals that users might have.
 */
export const CAREER_GOALS = [
  { id: 'career-change', label: 'Career Change', description: 'Transitioning to a new career path' },
  { id: 'upskilling', label: 'Upskilling', description: 'Learning new skills in current field' },
  { id: 'leadership', label: 'Leadership Growth', description: 'Developing leadership capabilities' },
  { id: 'networking', label: 'Professional Networking', description: 'Building professional connections' },
  { id: 'job-search', label: 'Job Search', description: 'Finding new opportunities' },
  { id: 'mentoring', label: 'Mentoring', description: 'Giving or receiving mentorship' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', description: 'Starting or growing a business' },
  { id: 'certification', label: 'Certification', description: 'Pursuing professional certifications' },
  { id: 'specialization', label: 'Specialization', description: 'Deepening expertise in a niche' },
  { id: 'work-life-balance', label: 'Work-Life Balance', description: 'Improving work-life integration' },
] as const;

/**
 * Type for career goal IDs (derived from CAREER_GOALS).
 */
export type CareerGoalId = (typeof CAREER_GOALS)[number]['id'];

/**
 * All valid career goal IDs.
 */
export const CAREER_GOAL_IDS: readonly CareerGoalId[] = CAREER_GOALS.map(g => g.id);

/**
 * Type guard for CareerGoalId.
 */
export function isCareerGoalId(value: string): value is CareerGoalId {
  return CAREER_GOAL_IDS.includes(value as CareerGoalId);
}

// ============================================================================
// CAREER PATHWAYS
// ============================================================================

/**
 * Career pathway definition with display metadata.
 */
export interface CareerPathwayDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

/**
 * Common career pathways that circles might support.
 */
export const CAREER_PATHWAYS = [
  { id: 'ic-to-manager', label: 'IC to Manager', description: 'Individual contributor to people management' },
  { id: 'manager-to-executive', label: 'Manager to Executive', description: 'Moving into executive leadership' },
  { id: 'tech-to-product', label: 'Tech to Product', description: 'Technical roles to product management' },
  { id: 'clinical-to-pharma', label: 'Clinical to Pharma', description: 'Healthcare to pharmaceutical industry' },
  { id: 'academia-to-industry', label: 'Academia to Industry', description: 'Academic to corporate transition' },
  { id: 'startup-founder', label: 'Startup Founder', description: 'Building and launching startups' },
  { id: 'corporate-to-consulting', label: 'Corporate to Consulting', description: 'In-house to consulting roles' },
  { id: 'generalist-to-specialist', label: 'Generalist to Specialist', description: 'Broad role to deep specialization' },
  { id: 'specialist-to-generalist', label: 'Specialist to Generalist', description: 'Specialized to broader scope' },
  { id: 'return-to-workforce', label: 'Return to Workforce', description: 'Re-entering after career break' },
] as const;

/**
 * Type for career pathway IDs (derived from CAREER_PATHWAYS).
 */
export type CareerPathwayId = (typeof CAREER_PATHWAYS)[number]['id'];

/**
 * All valid career pathway IDs.
 */
export const CAREER_PATHWAY_IDS: readonly CareerPathwayId[] = CAREER_PATHWAYS.map(p => p.id);

/**
 * Type guard for CareerPathwayId.
 */
export function isCareerPathwayId(value: string): value is CareerPathwayId {
  return CAREER_PATHWAY_IDS.includes(value as CareerPathwayId);
}
