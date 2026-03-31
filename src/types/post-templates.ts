/**
 * Post Templates
 *
 * Pre-defined templates for creating posts, providing structure and
 * reducing friction for common post types.
 */

/**
 * Post template theme colors
 */
export type PostTemplateColor =
  | 'blue'
  | 'purple'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'cyan'
  | 'rose';

/**
 * Tailwind color classes for post templates
 */
export const POST_TEMPLATE_COLOR_CLASSES: Record<
  PostTemplateColor,
  { bg: string; text: string; border: string; badge: string }
> = {
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
};

/**
 * Category IDs matching the post editor
 */
export type CategoryId = 'general' | 'academy' | 'careers' | 'guardian' | 'projects';

/**
 * Post template definition
 */
export interface PostTemplate {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Short description */
  description: string;

  /** Lucide icon name */
  icon: string;

  /** Theme color */
  color: PostTemplateColor;

  /** Title placeholder text */
  titlePlaceholder: string;

  /** Title prefix (optional) */
  titlePrefix?: string;

  /** Content scaffold with markdown structure */
  contentTemplate: string;

  /** Suggested category */
  suggestedCategory: CategoryId;

  /** Suggested tags */
  suggestedTags: string[];

  /** Example use cases */
  examples: string[];
}

/**
 * Template IDs for type safety
 */
export type PostTemplateId =
  | 'question'
  | 'discussion'
  | 'showcase'
  | 'resource'
  | 'help-wanted'
  | 'introduction'
  | 'blank';

/**
 * The 7 post templates
 */
export const POST_TEMPLATES: Record<PostTemplateId, PostTemplate> = {
  question: {
    id: 'question',
    name: 'Ask a Question',
    description: 'Get help or insights from the community',
    icon: 'HelpCircle',
    color: 'blue',
    titlePlaceholder: 'What would you like to know?',
    titlePrefix: '[Question] ',
    contentTemplate: `## Context
What's the situation or background?

## My Question
What specifically are you trying to figure out?

## What I've Tried
Any approaches you've already explored?
`,
    suggestedCategory: 'general',
    suggestedTags: ['question', 'help'],
    examples: [
      'How do I approach ICSR processing for pediatric cases?',
      'What certifications are most valued in PV?',
      'Best practices for aggregate report timelines?',
    ],
  },

  discussion: {
    id: 'discussion',
    name: 'Start a Discussion',
    description: 'Share thoughts and spark conversation',
    icon: 'MessageSquare',
    color: 'purple',
    titlePlaceholder: 'What topic do you want to discuss?',
    contentTemplate: `## The Topic
What's on your mind?

## My Perspective
Share your thoughts or position.

## Questions for the Community
What would you like to hear from others?
`,
    suggestedCategory: 'general',
    suggestedTags: ['discussion'],
    examples: [
      'The future of AI in pharmacovigilance',
      'Remote work in drug safety roles',
      'Career progression paths in regulatory affairs',
    ],
  },

  showcase: {
    id: 'showcase',
    name: 'Share a Win',
    description: 'Celebrate achievements and inspire others',
    icon: 'Trophy',
    color: 'yellow',
    titlePlaceholder: 'What are you celebrating?',
    titlePrefix: '[Win] ',
    contentTemplate: `## The Achievement
What did you accomplish?

## The Journey
How did you get here?

## Key Learnings
What would you share with others on the same path?
`,
    suggestedCategory: 'careers',
    suggestedTags: ['win', 'milestone', 'career'],
    examples: [
      'Passed my RAPS certification!',
      'Promoted to Senior Safety Scientist',
      'Published my first case study',
    ],
  },

  resource: {
    id: 'resource',
    name: 'Share a Resource',
    description: 'Share tools, articles, or helpful content',
    icon: 'Link',
    color: 'green',
    titlePlaceholder: 'What resource are you sharing?',
    titlePrefix: '[Resource] ',
    contentTemplate: `## The Resource
What are you sharing? (Include link if applicable)

## Why It's Valuable
How has this helped you or why is it useful?

## Who Should Check It Out
Who would benefit most from this?
`,
    suggestedCategory: 'general',
    suggestedTags: ['resource', 'tool'],
    examples: [
      'Free EMA guidance document collection',
      'Useful Excel template for signal detection',
      'Great podcast on regulatory careers',
    ],
  },

  'help-wanted': {
    id: 'help-wanted',
    name: 'Request Help',
    description: 'Get assistance with a specific challenge',
    icon: 'HandHelping',
    color: 'orange',
    titlePlaceholder: 'What do you need help with?',
    titlePrefix: '[Help] ',
    contentTemplate: `## The Challenge
What are you struggling with?

## Details
Provide context that would help others assist you.

## Ideal Outcome
What would success look like?
`,
    suggestedCategory: 'general',
    suggestedTags: ['help-wanted'],
    examples: [
      'Need guidance on MedDRA coding best practices',
      'Looking for mentorship in signal management',
      'Help reviewing my first PSUR draft',
    ],
  },

  introduction: {
    id: 'introduction',
    name: 'Introduce Yourself',
    description: 'Say hello and connect with the community',
    icon: 'UserPlus',
    color: 'cyan',
    titlePlaceholder: 'Your introduction headline',
    titlePrefix: '[Intro] ',
    contentTemplate: `## Hello, Community! 👋

**Who I Am**
A brief introduction about yourself.

**My Background**
What's your professional journey?

**What Brings Me Here**
What are you hoping to get from or give to this community?

**Fun Fact**
Something interesting about you outside of work!
`,
    suggestedCategory: 'general',
    suggestedTags: ['introduction', 'new-member'],
    examples: [
      'Clinical pharmacist transitioning to PV',
      'New grad excited about drug safety',
      '10-year PV veteran joining the community',
    ],
  },

  blank: {
    id: 'blank',
    name: 'Blank Post',
    description: 'Start from scratch with no template',
    icon: 'FileText',
    color: 'rose',
    titlePlaceholder: "What's your post about?",
    contentTemplate: '',
    suggestedCategory: 'general',
    suggestedTags: [],
    examples: ['Anything you want to share'],
  },
};

/**
 * Get a template by ID
 */
export function getPostTemplate(id: PostTemplateId): PostTemplate {
  return POST_TEMPLATES[id];
}

/**
 * Get all templates as an array (excluding blank for UI display)
 */
export function getAllPostTemplates(includeBlank = false): PostTemplate[] {
  const templates = Object.values(POST_TEMPLATES);
  return includeBlank ? templates : templates.filter((t) => t.id !== 'blank');
}

/**
 * Get templates by category
 */
export function getTemplatesForCategory(category: CategoryId): PostTemplate[] {
  return getAllPostTemplates().filter((t) => t.suggestedCategory === category);
}
