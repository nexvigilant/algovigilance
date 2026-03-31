import {
  Target,
  Briefcase,
  Sparkles,
  BookOpen,
  Activity,
  BarChart3,
  GraduationCap,
  Users,
  Award,
  Library,
  Wrench,
  Layers,
  Network,
} from 'lucide-react';
import type { AdminNavCardProps } from './admin-nav-card';

export type CardCategory = 'create' | 'monitor' | 'admin';

export interface AdminNavItem extends Omit<AdminNavCardProps, 'icon'> {
  id: string;
  icon: typeof Target;
  category: CardCategory;
  priority: number; // Lower = higher priority, shown first
}

/**
 * Academy Admin Navigation Configuration
 *
 * Cards are organized into three categories:
 * - create: Content creation and building tools
 * - monitor: Analytics, pipeline status, learner progress
 * - admin: System configuration and management
 */
export const adminNavItems: AdminNavItem[] = [
  // === CREATE CATEGORY ===
  {
    id: 'hierarchy',
    icon: Layers,
    title: 'Content Hierarchy',
    description: 'Navigate CPA → EPA → Domain → KSB structure',
    href: '/nucleus/admin/academy/content/hierarchy',
    actionLabel: 'View Hierarchy',
    variant: 'gold',
    category: 'create',
    priority: 0,
  },
  {
    id: 'my-work',
    icon: Briefcase,
    title: 'My Work',
    description: 'View your assigned domains and content tasks',
    href: '/nucleus/admin/academy/my-work',
    actionLabel: 'View Assignments',
    variant: 'emerald',
    category: 'create',
    priority: 1,
  },
  {
    id: 'content-pipeline',
    icon: Sparkles,
    title: 'AI Content Pipeline',
    description: 'Batch generate content for multiple KSBs at once',
    href: '/nucleus/admin/academy/content-pipeline',
    actionLabel: 'Launch Pipeline',
    variant: 'violet',
    category: 'create',
    priority: 2,
  },
  {
    id: 'ksb-builder',
    icon: Wrench,
    title: 'KSB Content Builder',
    description: 'Edit and refine individual KSB content manually',
    href: '/nucleus/admin/academy/ksb-builder',
    actionLabel: 'Build Content',
    variant: 'cyan',
    category: 'create',
    priority: 3,
  },
  {
    id: 'courses',
    icon: BookOpen,
    title: 'Capability Pathways',
    description: 'Create, edit, and publish pathways',
    href: '/nucleus/admin/academy/courses',
    actionLabel: 'Manage Pathways',
    variant: 'cyan',
    category: 'create',
    priority: 4,
  },

  // === MONITOR CATEGORY ===
  {
    id: 'operations',
    icon: Target,
    title: 'Content Operations',
    description: 'Manage content generation, review, and publishing',
    href: '/nucleus/admin/academy/operations',
    actionLabel: 'Open Operations',
    variant: 'gold',
    category: 'monitor',
    priority: 1,
  },
  {
    id: 'pipeline',
    icon: Activity,
    title: 'Pipeline Status',
    description: 'Monitor AI pipeline health and active generation jobs',
    href: '/nucleus/admin/academy/pipeline',
    actionLabel: 'View Status',
    variant: 'cyan',
    category: 'monitor',
    priority: 2,
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'View detailed learning analytics',
    href: '/nucleus/admin/academy/analytics',
    actionLabel: 'View Analytics',
    variant: 'cyan',
    category: 'monitor',
    priority: 3,
  },
  {
    id: 'learners',
    icon: Users,
    title: 'Practitioner Management',
    description: 'Monitor practitioner progress and enrollments',
    href: '/nucleus/admin/academy/learners',
    actionLabel: 'Manage Practitioners',
    variant: 'cyan',
    category: 'monitor',
    priority: 4,
  },

  // === ADMIN CATEGORY ===
  {
    id: 'pdc-framework',
    icon: Network,
    title: 'PDC Framework',
    description: 'Manage Career Practice Activities and the full PDC hierarchy',
    href: '/nucleus/admin/academy/pdc',
    actionLabel: 'Open PDC',
    variant: 'gold',
    category: 'admin',
    priority: 0,
  },
  {
    id: 'skills',
    icon: GraduationCap,
    title: 'Skills Management',
    description: 'Manage skills taxonomy and tracking',
    href: '/nucleus/admin/academy/skills',
    actionLabel: 'Manage Skills',
    variant: 'cyan',
    category: 'admin',
    priority: 1,
  },
  {
    id: 'certificates',
    icon: Award,
    title: 'Capability Verifications',
    description: 'Manage and revoke verifications',
    href: '/nucleus/admin/academy/certificates',
    actionLabel: 'Manage Verifications',
    variant: 'cyan',
    category: 'admin',
    priority: 2,
  },
  {
    id: 'framework',
    icon: Library,
    title: 'Framework Browser',
    description: 'Browse Domains, EPAs, and CPAs by functional area',
    href: '/nucleus/admin/academy/framework',
    actionLabel: 'Browse Framework',
    variant: 'cyan',
    category: 'admin',
    priority: 3,
  },
];

/**
 * Get cards by category, sorted by priority
 */
export function getCardsByCategory(category: CardCategory): AdminNavItem[] {
  return adminNavItems
    .filter((item) => item.category === category)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Category metadata for display
 */
export const categoryMeta: Record<CardCategory, { label: string; description: string }> = {
  create: {
    label: 'Create',
    description: 'Build and generate content',
  },
  monitor: {
    label: 'Monitor',
    description: 'Track progress and performance',
  },
  admin: {
    label: 'Configure',
    description: 'System settings and management',
  },
};
