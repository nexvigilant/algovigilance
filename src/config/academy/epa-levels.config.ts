/**
 * EPA Proficiency Level Configuration
 *
 * Single source of truth for EPA entrustment level definitions.
 * Used across level navigation, EPA learning views, and progress tracking.
 */

import type { ProficiencyLevel } from '@/types/epa-pathway';

/**
 * Ordered array of proficiency levels from foundational to expert.
 */
export const EPA_LEVEL_ORDER: readonly ProficiencyLevel[] = [
  'L1',
  'L2',
  'L3',
  'L4',
  'L5',
  'L5+',
] as const;

/**
 * Human-readable labels for each proficiency level.
 */
export const EPA_LEVEL_LABELS: Readonly<Record<ProficiencyLevel, string>> = {
  L1: 'Foundational',
  L2: 'Developing',
  L3: 'Competent',
  L4: 'Proficient',
  L5: 'Expert',
  'L5+': 'Thought Leader',
} as const;

/**
 * Descriptions for each proficiency level (for tooltips, help text).
 */
export const EPA_LEVEL_DESCRIPTIONS: Readonly<Record<ProficiencyLevel, string>> = {
  L1: 'Basic understanding of core concepts and terminology',
  L2: 'Developing skills with guided practice and supervision',
  L3: 'Competent practitioner with independent capability',
  L4: 'Proficient professional with advanced expertise',
  L5: 'Expert level with ability to mentor others',
  'L5+': 'Thought leader driving innovation in the field',
} as const;

/**
 * Default empty entrustment level requirements.
 * Used as fallback when EPA data doesn't include level details.
 */
export const DEFAULT_ENTRUSTMENT_LEVELS: Readonly<
  Record<ProficiencyLevel, { description?: string; estimatedHours?: number }>
> = {
  L1: {},
  L2: {},
  L3: {},
  L4: {},
  L5: {},
  'L5+': {},
} as const;

/**
 * Color classes for each proficiency level.
 */
export const EPA_LEVEL_COLORS: Readonly<Record<ProficiencyLevel, {
  text: string;
  bg: string;
  border: string;
}>> = {
  L1: { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/30' },
  L2: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
  L3: { text: 'text-cyan', bg: 'bg-cyan/10', border: 'border-cyan/30' },
  L4: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  L5: { text: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/30' },
  'L5+': { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
} as const;
