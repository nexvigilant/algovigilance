import {
  Users,
  Shield,
  BarChart3,
  Settings,
  Sparkles,
  LayoutGrid,
  FileText,
  Award,
  Bell,
  Mail,
} from 'lucide-react';
import type { CommunityNavCardProps } from './community-nav-card';

export type CommunityCategory = 'content' | 'engage' | 'manage';

export interface CommunityNavItem extends Omit<CommunityNavCardProps, 'icon'> {
  id: string;
  icon: typeof Users;
  category: CommunityCategory;
  priority: number;
}

/**
 * Community Admin Navigation Configuration
 *
 * Cards are organized into three categories:
 * - content: Forums, posts, and discovery management
 * - engage: Member engagement tools (badges, notifications, messages)
 * - manage: Administration (users, moderation, analytics, settings)
 */
export const communityNavItems: CommunityNavItem[] = [
  // === CONTENT CATEGORY ===
  {
    id: 'circles',
    icon: LayoutGrid,
    title: 'Circle Management',
    description: 'Create, edit, and manage community circles (forums)',
    href: '/nucleus/admin/community/circles',
    color: 'blue',
    category: 'content',
    priority: 1,
  },
  {
    id: 'posts',
    icon: FileText,
    title: 'Posts Management',
    description: 'Moderate posts, manage featured content, and view analytics',
    href: '/nucleus/admin/community/posts',
    color: 'indigo',
    category: 'content',
    priority: 2,
  },
  {
    id: 'discovery',
    icon: Sparkles,
    title: 'Discovery',
    description: 'Manage featured communities and discovery settings',
    href: '/nucleus/admin/community/discovery',
    color: 'yellow',
    category: 'content',
    priority: 3,
  },

  // === ENGAGE CATEGORY ===
  {
    id: 'badges',
    icon: Award,
    title: 'Badge Management',
    description: 'Award badges, view statistics, and manage achievements',
    href: '/nucleus/admin/community/badges',
    color: 'amber',
    category: 'engage',
    priority: 1,
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Send broadcasts, view analytics, and manage settings',
    href: '/nucleus/admin/community/notifications',
    color: 'cyan',
    category: 'engage',
    priority: 2,
  },
  {
    id: 'messages',
    icon: Mail,
    title: 'Messages',
    description: 'Monitor conversations, search messages, and view analytics',
    href: '/nucleus/admin/community/messages',
    color: 'pink',
    category: 'engage',
    priority: 3,
  },

  // === MANAGE CATEGORY ===
  {
    id: 'users',
    icon: Users,
    title: 'Member Management',
    description: 'Manage community members, roles, and permissions',
    href: '/nucleus/admin/community/users',
    color: 'green',
    category: 'manage',
    priority: 1,
  },
  {
    id: 'moderation',
    icon: Shield,
    title: 'Content Moderation',
    description: 'Review reported content and manage community safety',
    href: '/nucleus/admin/community/moderation',
    color: 'red',
    category: 'manage',
    priority: 2,
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics',
    description: 'View community growth, engagement, and health metrics',
    href: '/nucleus/admin/community/analytics',
    color: 'purple',
    category: 'manage',
    priority: 3,
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings',
    description: 'Configure global community settings and defaults',
    href: '/nucleus/admin/community/settings',
    color: 'gray',
    category: 'manage',
    priority: 4,
  },
];

/**
 * Get cards by category, sorted by priority
 */
export function getCardsByCategory(category: CommunityCategory): CommunityNavItem[] {
  return communityNavItems
    .filter((item) => item.category === category)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Category metadata for display
 */
export const categoryMeta: Record<CommunityCategory, { label: string; description: string }> = {
  content: {
    label: 'Content',
    description: 'Forums, posts, and discovery',
  },
  engage: {
    label: 'Engage',
    description: 'Badges, notifications, messages',
  },
  manage: {
    label: 'Manage',
    description: 'Users, moderation, analytics',
  },
};
