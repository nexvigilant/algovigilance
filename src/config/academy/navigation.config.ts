/**
 * Academy Navigation Configuration
 *
 * Defines the navigation items for the Academy nav bar.
 */

import { Home, Target, Award, Briefcase, Bookmark, Lightbulb, ClipboardCheck, RefreshCw, GraduationCap, Layers, FlaskConical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AcademyNavItem {
  /** Display label */
  label: string;
  /** Navigation path */
  href: string;
  /** Icon component */
  icon: LucideIcon;
}

/**
 * Navigation items for the Academy navigation bar.
 */
export const ACADEMY_NAV_ITEMS: readonly AcademyNavItem[] = [
  { label: 'Dashboard', href: '/nucleus/academy/dashboard', icon: Home },
  { label: 'Pathways', href: '/nucleus/academy/pathways', icon: Target },
  { label: 'Progress', href: '/nucleus/academy/progress', icon: Award },
  { label: 'Portfolio', href: '/nucleus/academy/portfolio', icon: Briefcase },
  { label: 'Bookmarks', href: '/nucleus/academy/bookmarks', icon: Bookmark },
  { label: 'Skills', href: '/nucleus/academy/skills', icon: Lightbulb },
  { label: 'Assessments', href: '/nucleus/academy/assessments', icon: ClipboardCheck },
  { label: 'Review', href: '/nucleus/academy/review', icon: RefreshCw },
  { label: 'GVP Training', href: '/nucleus/academy/gvp-modules', icon: GraduationCap },
  { label: 'Capabilities', href: '/nucleus/academy/capabilities', icon: Layers },
  { label: 'Interactive Lab', href: '/nucleus/academy/interactive/sparse-coding', icon: FlaskConical },
] as const;

/**
 * Base path for the Academy section.
 */
export const ACADEMY_BASE_PATH = '/nucleus/academy' as const;

/**
 * Dashboard path (used for "home" detection).
 */
export const ACADEMY_DASHBOARD_PATH = '/nucleus/academy/dashboard' as const;
