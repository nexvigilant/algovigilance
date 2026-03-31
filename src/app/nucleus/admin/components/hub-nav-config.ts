import {
  BookOpen,
  Users,
  Handshake,
  Briefcase,
  ShieldCheck,
  Zap,
  Mail,
  Newspaper,
  Image,
  Images,
  UserPlus,
  Settings,
  BrainCircuit,
  FlaskConical,
  Database,
  Palette,
} from 'lucide-react';
import type { HubNavCardProps } from './hub-nav-card';

export type HubCategory = 'products' | 'content' | 'operations';

export interface HubNavItem extends Omit<HubNavCardProps, 'icon'> {
  id: string;
  icon: typeof BookOpen;
  category: HubCategory;
  priority: number;
}

/**
 * Admin Hub Navigation Configuration
 *
 * Cards are organized into three categories:
 * - products: Main AlgoVigilance ecosystem products/services
 * - content: Content management and media tools
 * - operations: Administrative operations and settings
 */
export const hubNavItems: HubNavItem[] = [
  // === PRODUCTS CATEGORY ===
  {
    id: 'academy',
    icon: BookOpen,
    title: 'Academy',
    description: 'Learning management system, courses, and capability pathways',
    href: '/nucleus/admin/academy',
    actionLabel: 'Manage Academy',
    category: 'products',
    priority: 1,
  },
  {
    id: 'community',
    icon: Users,
    title: 'Community',
    description: 'Professional networking, forums, and member engagement',
    href: '/nucleus/admin/community',
    actionLabel: 'Manage Community',
    category: 'products',
    priority: 2,
  },
  {
    id: 'solutions',
    icon: Handshake,
    title: 'Solutions',
    description: 'Consulting services, client projects, and deliverables',
    href: '/nucleus/solutions',
    actionLabel: 'Manage Solutions',
    category: 'products',
    priority: 3,
  },
  {
    id: 'careers',
    icon: Briefcase,
    title: 'Careers',
    description: 'Job board, career pathways, and talent matching',
    href: '/nucleus/careers',
    actionLabel: 'Manage Careers',
    category: 'products',
    priority: 4,
  },
  {
    id: 'guardian',
    icon: ShieldCheck,
    title: 'Guardian',
    description: 'Pharmaceutical oversight, safety monitoring, and reports',
    href: '/nucleus/guardian',
    actionLabel: 'Manage Guardian',
    category: 'products',
    priority: 5,
  },
  {
    id: 'ventures',
    icon: Zap,
    title: 'Ventures',
    description: 'Innovation projects, investments, and partnerships',
    href: '/nucleus/ventures',
    actionLabel: 'Manage Ventures',
    category: 'products',
    priority: 6,
  },

  // === CONTENT CATEGORY ===
  {
    id: 'intelligence',
    icon: Newspaper,
    title: 'Intelligence CMS',
    description: 'Create and manage articles, podcasts, and publications',
    href: '/nucleus/admin/intelligence',
    actionLabel: 'Manage Intelligence',
    category: 'content',
    priority: 1,
  },
  {
    id: 'content-images',
    icon: Image,
    title: 'Content Images',
    description: 'Generate and manage article images with AI',
    href: '/nucleus/admin/content',
    actionLabel: 'Manage Images',
    category: 'content',
    priority: 2,
  },
  {
    id: 'media',
    icon: Images,
    title: 'Media Management',
    description: 'Unified image management for all platform content',
    href: '/nucleus/admin/media',
    actionLabel: 'Manage Media',
    category: 'content',
    priority: 3,
  },

  // === OPERATIONS CATEGORY ===
  {
    id: 'website-leads',
    icon: Mail,
    title: 'Website Leads',
    description: 'Manage consulting leads, contact submissions, and quiz sessions',
    href: '/nucleus/admin/website-leads',
    actionLabel: 'View Leads Hub',
    category: 'operations',
    priority: 1,
  },
  {
    id: 'affiliate-applications',
    icon: UserPlus,
    title: 'Affiliate Applications',
    description: 'Review Ambassador & Advisor program applications',
    href: '/nucleus/admin/affiliate-applications',
    actionLabel: 'View Applications',
    category: 'operations',
    priority: 2,
  },
  {
    id: 'user-management',
    icon: Users,
    title: 'User Management',
    description: 'Manage member accounts, roles, and permissions',
    href: '/nucleus/admin/community/users',
    actionLabel: 'Manage Users',
    category: 'operations',
    priority: 3,
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'System Settings',
    description: 'Configure platform features and global settings',
    href: '/nucleus/admin/settings',
    actionLabel: 'Open Settings',
    category: 'operations',
    priority: 4,
  },
  {
    id: 'neural-visualization',
    icon: BrainCircuit,
    title: 'Neural Visualization',
    description: 'Interactive neural network and system architecture visualizations',
    href: '/nucleus/admin/neural-visualization',
    actionLabel: 'Open Visualizer',
    category: 'operations',
    priority: 5,
  },
  {
    id: 'research',
    icon: FlaskConical,
    title: 'Research Tools',
    description: 'Deep research capabilities and investigation workflows',
    href: '/nucleus/admin/research',
    actionLabel: 'Open Research',
    category: 'operations',
    priority: 6,
  },
  {
    id: 'seed',
    icon: Database,
    title: 'Data Seeding',
    description: 'Development data seeding and database management tools',
    href: '/nucleus/admin/seed',
    actionLabel: 'Open Seeder',
    category: 'operations',
    priority: 7,
  },
  {
    id: 'visuals',
    icon: Palette,
    title: 'Visual Design',
    description: 'Design system components, brand assets, and style reference',
    href: '/nucleus/admin/visuals',
    actionLabel: 'Open Visuals',
    category: 'operations',
    priority: 8,
  },
];

/**
 * Get cards by category, sorted by priority
 */
export function getCardsByCategory(category: HubCategory): HubNavItem[] {
  return hubNavItems
    .filter((item) => item.category === category)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Category metadata for display
 */
export const categoryMeta: Record<HubCategory, { label: string; description: string; icon: string }> = {
  products: {
    label: 'Products',
    description: 'Ecosystem services',
    icon: 'Zap',
  },
  content: {
    label: 'Content',
    description: 'Publishing & media',
    icon: 'Newspaper',
  },
  operations: {
    label: 'Operations',
    description: 'Admin & settings',
    icon: 'Settings',
  },
};
