/**
 * Circle Templates
 *
 * Pre-defined templates for creating circles, each with suggested tags,
 * required fields, and example circles to help users create organized communities.
 *
 * @remarks
 * Templates provide structure and guidance for circle creation,
 * ensuring consistent organization across the community platform.
 */

import type { CircleTags, OrganizationType } from './circle-taxonomy';

// ============================================================================
// TEMPLATE COLORS
// ============================================================================

/**
 * Theme colors for circle templates.
 */
export type TemplateColor =
  | 'blue'
  | 'purple'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'pink'
  | 'slate'
  | 'cyan'
  | 'rose'
  | 'indigo';

/**
 * All valid template colors.
 */
export const TEMPLATE_COLORS: readonly TemplateColor[] = [
  'blue', 'purple', 'green', 'yellow', 'orange',
  'pink', 'slate', 'cyan', 'rose', 'indigo'
] as const;

/**
 * Type guard for TemplateColor.
 */
export function isTemplateColor(value: string): value is TemplateColor {
  return TEMPLATE_COLORS.includes(value as TemplateColor);
}

/**
 * Tailwind color class configuration.
 */
export interface TemplateColorClasses {
  readonly bg: string;
  readonly text: string;
  readonly border: string;
  readonly badge: string;
}

/**
 * Tailwind color classes for each template color.
 */
export const TEMPLATE_COLOR_CLASSES: Readonly<Record<TemplateColor, TemplateColorClasses>> = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
    badge: 'bg-green-500/20 text-green-300',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-300',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500/20 text-orange-300',
  },
  pink: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
    badge: 'bg-pink-500/20 text-pink-300',
  },
  slate: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    badge: 'bg-slate-500/20 text-slate-300',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    badge: 'bg-indigo-500/20 text-indigo-300',
  },
};

// ============================================================================
// TEMPLATE DEFINITION
// ============================================================================

/**
 * Field types that can be required or optional in a template.
 */
export type CircleTagField = keyof CircleTags;

/**
 * Circle template definition.
 *
 * @remarks
 * Templates define the structure, required fields, and suggestions
 * for creating a specific type of circle.
 */
export interface CircleTemplate {
  /** Unique identifier for the template */
  readonly id: string;

  /** Display name */
  readonly name: string;

  /** Short description of the template's purpose */
  readonly description: string;

  /** Longer description shown in template details */
  readonly longDescription: string;

  /** Lucide icon name */
  readonly icon: string;

  /** Theme color for visual styling */
  readonly color: TemplateColor;

  /** Pre-filled/suggested tags for this template */
  readonly suggestedTags: Partial<CircleTags>;

  /** Fields that must be filled for this template */
  readonly requiredFields: readonly CircleTagField[];

  /** Fields that are optional but recommended */
  readonly optionalFields: readonly CircleTagField[];

  /** Example circles using this template */
  readonly exampleCircles: readonly string[];

  /** Use cases / who should use this template */
  readonly useCases: readonly string[];

  /** Whether this template typically creates official or community circles */
  readonly defaultAuthority: 'official' | 'community';
}

// ============================================================================
// TEMPLATE IDS
// ============================================================================

/**
 * Template IDs for type safety.
 */
export type CircleTemplateId =
  | 'professional-function'
  | 'organization-chapter'
  | 'career-stage'
  | 'skill-development'
  | 'career-pathway'
  | 'interest-community'
  | 'custom';

/**
 * All valid template IDs.
 */
export const CIRCLE_TEMPLATE_IDS: readonly CircleTemplateId[] = [
  'professional-function', 'organization-chapter', 'career-stage',
  'skill-development', 'career-pathway', 'interest-community', 'custom'
] as const;

/**
 * Type guard for CircleTemplateId.
 */
export function isCircleTemplateId(value: string): value is CircleTemplateId {
  return CIRCLE_TEMPLATE_IDS.includes(value as CircleTemplateId);
}

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

/**
 * The 7 core circle templates.
 */
export const CIRCLE_TEMPLATES: Readonly<Record<CircleTemplateId, CircleTemplate>> = {
  'professional-function': {
    id: 'professional-function',
    name: 'Professional Function',
    description: 'Connect with others in your field or job function',
    longDescription:
      'Create a community for professionals who share the same job function or discipline. Perfect for sharing best practices, discussing trends, and building a network within your profession.',
    icon: 'Briefcase',
    color: 'blue',
    suggestedTags: {
      functions: [],
    },
    requiredFields: ['functions'],
    optionalFields: ['industries', 'skills', 'careerStages'],
    exampleCircles: ['DevOps Engineers', 'Product Managers', 'Data Scientists', 'UX Designers', 'Clinical Research Associates'],
    useCases: [
      'Share best practices in your profession',
      'Discuss industry trends and tools',
      'Network with peers in similar roles',
      'Find mentors in your field',
    ],
    defaultAuthority: 'community',
  },

  'organization-chapter': {
    id: 'organization-chapter',
    name: 'Organization / Chapter',
    description: 'Professional organizations, fraternities, and alumni networks',
    longDescription:
      'Build a community for members of professional associations, Greek organizations, alumni networks, or certification bodies. Connect with fellow members and coordinate activities.',
    icon: 'Users',
    color: 'purple',
    suggestedTags: {
      organizationType: 'professional-association' as OrganizationType,
    },
    requiredFields: ['organizationType'],
    optionalFields: ['industries', 'functions'],
    exampleCircles: [
      'NSBE Members',
      'PMI Atlanta Chapter',
      'Kappa Alpha Psi Brothers',
      'Stanford CS Alumni',
      'CFA Charterholders',
    ],
    useCases: [
      'Connect with fellow organization members',
      'Coordinate local chapter activities',
      'Share organization-specific resources',
      'Network within your professional community',
    ],
    defaultAuthority: 'community',
  },

  'career-stage': {
    id: 'career-stage',
    name: 'Career Stage',
    description: 'Connect with peers at similar career points',
    longDescription:
      'Join or create a community of professionals at the same stage in their careers. Share experiences, challenges, and advice with people who understand exactly where you are.',
    icon: 'TrendingUp',
    color: 'green',
    suggestedTags: {
      careerStages: [],
    },
    requiredFields: ['careerStages'],
    optionalFields: ['functions', 'goals'],
    exampleCircles: [
      'New Grads 2024',
      'Senior Engineers',
      'First-Time Managers',
      'Career Changers Over 40',
      'Executive Women Leaders',
    ],
    useCases: [
      'Share challenges specific to your career stage',
      'Learn from others at the same level',
      'Build peer support networks',
      'Navigate career transitions together',
    ],
    defaultAuthority: 'community',
  },

  'skill-development': {
    id: 'skill-development',
    name: 'Skill Development',
    description: 'Learn and grow specific skills together',
    longDescription:
      'Create a focused learning community around specific skills. Practice together, share resources, and hold each other accountable as you develop new competencies.',
    icon: 'Zap',
    color: 'yellow',
    suggestedTags: {
      skills: [],
      goals: ['upskilling'],
    },
    requiredFields: ['skills'],
    optionalFields: ['functions', 'careerStages'],
    exampleCircles: [
      'Python Learners',
      'Public Speaking Practice',
      'System Design Study Group',
      'Leadership Skills Lab',
      'SQL Mastery',
    ],
    useCases: [
      'Learn new skills with accountability',
      'Share learning resources',
      'Practice skills together',
      'Get feedback on skill development',
    ],
    defaultAuthority: 'community',
  },

  'career-pathway': {
    id: 'career-pathway',
    name: 'Career Pathway',
    description: 'Explore and navigate career transitions',
    longDescription:
      'Navigate major career transitions with others on the same path. Share experiences, advice, and support as you move between roles, industries, or career stages.',
    icon: 'Route',
    color: 'orange',
    suggestedTags: {
      pathways: [],
    },
    requiredFields: ['pathways'],
    optionalFields: ['careerStages', 'functions', 'goals'],
    exampleCircles: [
      'IC to Manager Track',
      'Tech to Product Transition',
      'Clinical to Pharma Journey',
      'Startup Founders Club',
      'Return to Work Support',
    ],
    useCases: [
      'Navigate career transitions',
      'Learn from those who made the switch',
      'Get support during major changes',
      'Build your transition roadmap',
    ],
    defaultAuthority: 'community',
  },

  'interest-community': {
    id: 'interest-community',
    name: 'Interest Community',
    description: 'Connect over shared professional interests',
    longDescription:
      'Build a community around shared professional interests, topics, or passions. Discuss trends, share insights, and connect with like-minded professionals.',
    icon: 'Heart',
    color: 'pink',
    suggestedTags: {
      interests: [],
    },
    requiredFields: ['interests'],
    optionalFields: ['functions', 'industries'],
    exampleCircles: [
      'AI Ethics Discussion',
      'Remote Work Culture',
      'Side Project Builders',
      'Women in Tech Leadership',
      'Healthcare Innovation',
    ],
    useCases: [
      'Discuss topics you are passionate about',
      'Stay current on trends',
      'Find people who share your interests',
      'Explore new professional topics',
    ],
    defaultAuthority: 'community',
  },

  custom: {
    id: 'custom',
    name: 'Custom Circle',
    description: 'Create a unique circle with your own structure',
    longDescription:
      'Build a completely custom community that does not fit the other templates. Define your own tags, focus, and structure to create exactly the community you envision.',
    icon: 'Sparkles',
    color: 'slate',
    suggestedTags: {},
    requiredFields: [],
    optionalFields: ['functions', 'industries', 'careerStages', 'skills', 'goals', 'interests', 'pathways'],
    exampleCircles: ['Your unique community'],
    useCases: [
      'Create a community that does not fit other templates',
      'Combine multiple dimensions',
      'Build something entirely new',
      'Experiment with unique formats',
    ],
    defaultAuthority: 'community',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a template by ID.
 *
 * @param id - The template ID to look up
 * @returns The template definition
 */
export function getCircleTemplate(id: CircleTemplateId): CircleTemplate {
  return CIRCLE_TEMPLATES[id];
}

/**
 * Get all templates as an array.
 *
 * @returns Array of all template definitions
 */
export function getAllCircleTemplates(): readonly CircleTemplate[] {
  return Object.values(CIRCLE_TEMPLATES);
}

/**
 * Get templates that match specific criteria.
 *
 * @param dimension - The tag dimension to filter by
 * @returns Templates that use this dimension as required or optional
 */
export function getTemplatesForDimension(dimension: CircleTagField): readonly CircleTemplate[] {
  return getAllCircleTemplates().filter(
    (template) => template.requiredFields.includes(dimension) || template.optionalFields.includes(dimension)
  );
}

/**
 * Result of template field validation.
 */
export interface TemplateValidationResult {
  /** Whether all required fields are filled */
  readonly valid: boolean;
  /** Names of missing required fields */
  readonly missing: readonly string[];
}

/**
 * Validate that required fields are filled for a template.
 *
 * @param templateId - The template to validate against
 * @param tags - The tags to validate
 * @returns Validation result with missing field names
 */
export function validateTemplateFields(
  templateId: CircleTemplateId,
  tags: Partial<CircleTags>
): TemplateValidationResult {
  const template = getCircleTemplate(templateId);
  const missing: string[] = [];

  for (const field of template.requiredFields) {
    const value = tags[field];
    if (value === undefined || value === null) {
      missing.push(field);
    } else if (Array.isArray(value) && value.length === 0) {
      missing.push(field);
    } else if (typeof value === 'string' && value.trim() === '') {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get the color classes for a template.
 *
 * @param templateId - The template ID to get colors for
 * @returns Tailwind color class configuration
 */
export function getTemplateColors(templateId: CircleTemplateId): TemplateColorClasses {
  const template = getCircleTemplate(templateId);
  return TEMPLATE_COLOR_CLASSES[template.color];
}
