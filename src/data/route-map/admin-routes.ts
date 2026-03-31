/**
 * Admin Routes — /nucleus/admin/*
 * @module data/route-map/admin-routes
 */
import type { RouteNode } from './types';

export const ADMIN_ROUTES: RouteNode[] = [
  // ─── ADMIN HUB ────────────────────────────────────────────────────────────
  {
    path: '/nucleus/admin',
    label: 'Admin',
    category: 'admin',
    role: 'hub',
    primitive: 'mu',
    depth: 2,
    parent: '/nucleus',
    children: ['/nucleus/admin/academy', '/nucleus/admin/community', '/nucleus/admin/intelligence', '/nucleus/admin/affiliate-applications', '/nucleus/admin/content', '/nucleus/admin/content-freshness', '/nucleus/admin/content-validation', '/nucleus/admin/media', '/nucleus/admin/neural-visualization', '/nucleus/admin/research', '/nucleus/admin/seed', '/nucleus/admin/settings', '/nucleus/admin/visuals', '/nucleus/admin/waitlist', '/nucleus/admin/watchtower', '/nucleus/admin/website-leads'],
    crossLinks: [],
  },

  // ─── ACADEMY ADMIN ────────────────────────────────────────────────────────
  { path: '/nucleus/admin/academy', label: 'Academy Admin', category: 'admin', role: 'hub', primitive: 'mu', depth: 3, parent: '/nucleus/admin', children: ['/nucleus/admin/academy/analytics', '/nucleus/admin/academy/certificates', '/nucleus/admin/academy/content-pipeline', '/nucleus/admin/academy/courses', '/nucleus/admin/academy/dag-viewer', '/nucleus/admin/academy/framework', '/nucleus/admin/academy/framework-browser', '/nucleus/admin/academy/ksb-builder', '/nucleus/admin/academy/ksb-management', '/nucleus/admin/academy/learners', '/nucleus/admin/academy/my-work', '/nucleus/admin/academy/operations', '/nucleus/admin/academy/pdc', '/nucleus/admin/academy/pipeline', '/nucleus/admin/academy/pv-domains', '/nucleus/admin/academy/resources', '/nucleus/admin/academy/skills'], crossLinks: [] },
  { path: '/nucleus/admin/academy/analytics', label: 'Analytics', category: 'admin', role: 'leaf', primitive: 'kappa', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/certificates', label: 'Certificates', category: 'admin', role: 'leaf', primitive: 'kappa', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/content/hierarchy', label: 'Content Hierarchy', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/content-pipeline', label: 'Content Pipeline', category: 'admin', role: 'leaf', primitive: 'sigma', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/dag-viewer', label: 'ALO DAG Viewer', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/courses', label: 'Courses', category: 'admin', role: 'hub', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: ['/nucleus/admin/academy/courses/new', '/nucleus/admin/academy/courses/generate', '/nucleus/admin/academy/courses/[id]/edit', '/nucleus/admin/academy/courses/[id]/preview'], crossLinks: [] },
  { path: '/nucleus/admin/academy/courses/new', label: 'New Course', category: 'admin', role: 'leaf', primitive: 'arrow', depth: 5, parent: '/nucleus/admin/academy/courses', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/courses/generate', label: 'Generate Course', category: 'admin', role: 'leaf', primitive: 'arrow', depth: 5, parent: '/nucleus/admin/academy/courses', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/courses/[id]/edit', label: 'Edit Course', category: 'admin', role: 'leaf', primitive: 'lambda', depth: 5, parent: '/nucleus/admin/academy/courses', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/courses/[id]/preview', label: 'Preview Course', category: 'admin', role: 'leaf', primitive: 'lambda', depth: 5, parent: '/nucleus/admin/academy/courses', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/framework', label: 'Framework', category: 'admin', role: 'hub', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: ['/nucleus/admin/academy/framework/[areaId]'], crossLinks: [] },
  { path: '/nucleus/admin/academy/framework/[areaId]', label: 'Framework Area', category: 'admin', role: 'hub', primitive: 'lambda', depth: 5, parent: '/nucleus/admin/academy/framework', children: ['/nucleus/admin/academy/framework/[areaId]/cpa/[cpaId]', '/nucleus/admin/academy/framework/[areaId]/epa/[epaId]'], crossLinks: [] },
  { path: '/nucleus/admin/academy/framework/[areaId]/cpa/[cpaId]', label: 'CPA Detail', category: 'admin', role: 'leaf', primitive: 'lambda', depth: 6, parent: '/nucleus/admin/academy/framework/[areaId]', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/framework/[areaId]/epa/[epaId]', label: 'EPA Detail', category: 'admin', role: 'leaf', primitive: 'lambda', depth: 6, parent: '/nucleus/admin/academy/framework/[areaId]', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/framework-browser', label: 'Framework Browser', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/ksb-builder', label: 'KSB Builder', category: 'admin', role: 'hub', primitive: 'arrow', depth: 4, parent: '/nucleus/admin/academy', children: ['/nucleus/admin/academy/ksb-builder/review'], crossLinks: [] },
  { path: '/nucleus/admin/academy/ksb-builder/review', label: 'KSB Review', category: 'admin', role: 'leaf', primitive: 'kappa', depth: 5, parent: '/nucleus/admin/academy/ksb-builder', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/ksb-management', label: 'KSB Management', category: 'admin', role: 'hub', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: ['/nucleus/admin/academy/ksb-management/pharmacovigilance'], crossLinks: [] },
  { path: '/nucleus/admin/academy/ksb-management/pharmacovigilance', label: 'PV KSBs', category: 'admin', role: 'leaf', primitive: 'mu', depth: 5, parent: '/nucleus/admin/academy/ksb-management', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/learners', label: 'Learners', category: 'admin', role: 'hub', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: ['/nucleus/admin/academy/learners/[userId]'], crossLinks: [] },
  { path: '/nucleus/admin/academy/learners/[userId]', label: 'Learner Detail', category: 'admin', role: 'leaf', primitive: 'lambda', depth: 5, parent: '/nucleus/admin/academy/learners', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/my-work', label: 'My Work', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/operations', label: 'Operations', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/pdc', label: 'PDC', category: 'admin', role: 'hub', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: ['/nucleus/admin/academy/pdc/cpas'], crossLinks: [] },
  { path: '/nucleus/admin/academy/pdc/cpas', label: 'CPAs', category: 'admin', role: 'hub', primitive: 'mu', depth: 5, parent: '/nucleus/admin/academy/pdc', children: ['/nucleus/admin/academy/pdc/cpas/[cpaId]'], crossLinks: [] },
  { path: '/nucleus/admin/academy/pdc/cpas/[cpaId]', label: 'CPA Detail', category: 'admin', role: 'leaf', primitive: 'lambda', depth: 6, parent: '/nucleus/admin/academy/pdc/cpas', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/pipeline', label: 'Pipeline', category: 'admin', role: 'leaf', primitive: 'sigma', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/pv-domains', label: 'PV Domains', category: 'admin', role: 'hub', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: ['/nucleus/admin/academy/pv-domains/[id]'], crossLinks: [] },
  { path: '/nucleus/admin/academy/pv-domains/[id]', label: 'PV Domain Detail', category: 'admin', role: 'leaf', primitive: 'lambda', depth: 5, parent: '/nucleus/admin/academy/pv-domains', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/resources', label: 'Resources', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },
  { path: '/nucleus/admin/academy/skills', label: 'Skills', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/academy', children: [], crossLinks: [] },

  // ─── COMMUNITY ADMIN ──────────────────────────────────────────────────────
  { path: '/nucleus/admin/community', label: 'Community Admin', category: 'admin', role: 'hub', primitive: 'mu', depth: 3, parent: '/nucleus/admin', children: ['/nucleus/admin/community/analytics', '/nucleus/admin/community/badges', '/nucleus/admin/community/circles', '/nucleus/admin/community/discovery', '/nucleus/admin/community/messages', '/nucleus/admin/community/moderation', '/nucleus/admin/community/notifications', '/nucleus/admin/community/onboarding', '/nucleus/admin/community/posts', '/nucleus/admin/community/settings', '/nucleus/admin/community/users'], crossLinks: [] },
  { path: '/nucleus/admin/community/analytics', label: 'Analytics', category: 'admin', role: 'leaf', primitive: 'kappa', depth: 4, parent: '/nucleus/admin/community', children: [], crossLinks: [] },
  { path: '/nucleus/admin/community/badges', label: 'Badges', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/community', children: [], crossLinks: [] },
  { path: '/nucleus/admin/community/circles', label: 'Circles', category: 'admin', role: 'hub', primitive: 'mu', depth: 4, parent: '/nucleus/admin/community', children: ['/nucleus/admin/community/circles/[circleId]/edit'], crossLinks: [] },
  { path: '/nucleus/admin/community/circles/[circleId]/edit', label: 'Edit Circle', category: 'admin', role: 'leaf', primitive: 'lambda', depth: 5, parent: '/nucleus/admin/community/circles', children: [], crossLinks: [] },
  { path: '/nucleus/admin/community/discovery', label: 'Discovery', category: 'admin', role: 'leaf', primitive: 'kappa', depth: 4, parent: '/nucleus/admin/community', children: [], crossLinks: [] },
  { path: '/nucleus/admin/community/messages', label: 'Messages', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/community', children: [], crossLinks: [] },
  { path: '/nucleus/admin/community/moderation', label: 'Moderation', category: 'admin', role: 'leaf', primitive: 'partial', depth: 4, parent: '/nucleus/admin/community', children: [], crossLinks: [] },
  { path: '/nucleus/admin/community/notifications', label: 'Notifications', category: 'admin', role: 'leaf', primitive: 'sigma', depth: 4, parent: '/nucleus/admin/community', children: [], crossLinks: [] },
  { path: '/nucleus/admin/community/onboarding', label: 'Onboarding', category: 'admin', role: 'leaf', primitive: 'sigma', depth: 4, parent: '/nucleus/admin/community', children: [], crossLinks: [] },
  { path: '/nucleus/admin/community/posts', label: 'Posts', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/community', children: [], crossLinks: [] },
  { path: '/nucleus/admin/community/settings', label: 'Settings', category: 'admin', role: 'leaf', primitive: 'pi', depth: 4, parent: '/nucleus/admin/community', children: [], crossLinks: [] },
  { path: '/nucleus/admin/community/users', label: 'Users', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/community', children: [], crossLinks: [] },

  // ─── INTELLIGENCE ADMIN ───────────────────────────────────────────────────
  { path: '/nucleus/admin/intelligence', label: 'Intelligence CMS', category: 'admin', role: 'hub', primitive: 'mu', depth: 3, parent: '/nucleus/admin', children: ['/nucleus/admin/intelligence/new', '/nucleus/admin/intelligence/[id]'], crossLinks: [] },
  { path: '/nucleus/admin/intelligence/new', label: 'New Article', category: 'admin', role: 'leaf', primitive: 'arrow', depth: 4, parent: '/nucleus/admin/intelligence', children: [], crossLinks: [] },
  { path: '/nucleus/admin/intelligence/[id]', label: 'Edit Article', category: 'admin', role: 'leaf', primitive: 'lambda', depth: 4, parent: '/nucleus/admin/intelligence', children: [], crossLinks: [] },

  // ─── STANDALONE ADMIN PAGES ───────────────────────────────────────────────
  { path: '/nucleus/admin/affiliate-applications', label: 'Affiliate Applications', category: 'admin', role: 'leaf', primitive: 'mu', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/content', label: 'Content Images', category: 'admin', role: 'leaf', primitive: 'mu', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/content-freshness', label: 'Content Freshness', category: 'admin', role: 'leaf', primitive: 'sigma', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/content-validation', label: 'Content Validation', category: 'admin', role: 'leaf', primitive: 'kappa', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/media', label: 'Media', category: 'admin', role: 'leaf', primitive: 'mu', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/neural-visualization', label: 'Neural Visualization', category: 'admin', role: 'leaf', primitive: 'rho', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/research', label: 'Research', category: 'admin', role: 'leaf', primitive: 'kappa', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/seed', label: 'Data Seeding', category: 'admin', role: 'leaf', primitive: 'arrow', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/settings', label: 'Settings', category: 'admin', role: 'leaf', primitive: 'pi', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/visuals', label: 'Visual Design', category: 'admin', role: 'leaf', primitive: 'mu', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/waitlist', label: 'Waitlist', category: 'admin', role: 'leaf', primitive: 'sigma', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/watchtower', label: 'Watchtower', category: 'admin', role: 'leaf', primitive: 'kappa', depth: 3, parent: '/nucleus/admin', children: [], crossLinks: [] },
  { path: '/nucleus/admin/website-leads', label: 'Website Leads', category: 'admin', role: 'hub', primitive: 'mu', depth: 3, parent: '/nucleus/admin', children: ['/nucleus/admin/website-leads/consulting', '/nucleus/admin/website-leads/contact', '/nucleus/admin/website-leads/quiz-sessions'], crossLinks: [] },
  { path: '/nucleus/admin/website-leads/consulting', label: 'Consulting Leads', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/website-leads', children: [], crossLinks: [] },
  { path: '/nucleus/admin/website-leads/contact', label: 'Contact Leads', category: 'admin', role: 'leaf', primitive: 'mu', depth: 4, parent: '/nucleus/admin/website-leads', children: [], crossLinks: [] },
  { path: '/nucleus/admin/website-leads/quiz-sessions', label: 'Quiz Sessions', category: 'admin', role: 'leaf', primitive: 'kappa', depth: 4, parent: '/nucleus/admin/website-leads', children: [], crossLinks: [] },
];
