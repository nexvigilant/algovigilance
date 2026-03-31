/**
 * Public, Legal, Auth, Verify & Internal Routes
 * @module data/route-map/public-routes
 */
import type { RouteNode } from './types';

export const PUBLIC_ROUTES: RouteNode[] = [
  // ─── ROOT ──────────────────────────────────────────────────────────────────
  {
    path: '/',
    label: 'Home',
    category: 'public',
    role: 'root',
    primitive: 'lambda',
    depth: 0,
    parent: null,
    children: ['/about', '/academy', '/careers', '/community', '/consulting', '/contact', '/doctrine', '/grow', '/guardian', '/intelligence', '/membership', '/schedule', '/services', '/ventures', '/checkout', '/trial/start'],
    crossLinks: [],
  },

  // ─── PUBLIC ────────────────────────────────────────────────────────────────
  { path: '/about', label: 'About', category: 'public', role: 'leaf', primitive: 'lambda', depth: 1, parent: '/', children: [], crossLinks: [] },
  { path: '/academy', label: 'Academy', category: 'public', role: 'hub', primitive: 'mu', depth: 1, parent: '/', children: [], crossLinks: ['/nucleus/academy'] },
  { path: '/careers', label: 'Careers', category: 'public', role: 'bridge', primitive: 'mu', depth: 1, parent: '/', children: [], crossLinks: ['/nucleus/careers'] },
  { path: '/consulting', label: 'Consulting', category: 'public', role: 'hub', primitive: 'arrow', depth: 1, parent: '/', children: [], crossLinks: ['/services'] },
  {
    path: '/contact',
    label: 'Contact',
    category: 'public',
    role: 'bridge',
    primitive: 'arrow',
    depth: 1,
    parent: '/',
    children: ['/contact/thank-you'],
    crossLinks: [],
  },
  { path: '/contact/thank-you', label: 'Thank You', category: 'public', role: 'leaf', primitive: 'sigma', depth: 2, parent: '/contact', children: [], crossLinks: ['/academy', '/intelligence', '/community'] },
  {
    path: '/community',
    label: 'Community',
    category: 'public',
    role: 'hub',
    primitive: 'mu',
    depth: 1,
    parent: '/',
    children: ['/community/discover'],
    crossLinks: ['/nucleus/community'],
  },
  { path: '/community/discover', label: 'Discover', category: 'public', role: 'leaf', primitive: 'kappa', depth: 2, parent: '/community', children: [], crossLinks: [] },
  { path: '/doctrine', label: 'Doctrine', category: 'public', role: 'leaf', primitive: 'pi', depth: 1, parent: '/', children: [], crossLinks: [] },
  {
    path: '/grow',
    label: 'Grow',
    category: 'public',
    role: 'hub',
    primitive: 'sigma',
    depth: 1,
    parent: '/',
    children: ['/grow/advisor', '/grow/ambassador', '/grow/pathway'],
    crossLinks: ['/membership'],
  },
  { path: '/grow/advisor', label: 'Advisor Program', category: 'public', role: 'leaf', primitive: 'sigma', depth: 2, parent: '/grow', children: [], crossLinks: [] },
  { path: '/grow/ambassador', label: 'Ambassador Program', category: 'public', role: 'leaf', primitive: 'sigma', depth: 2, parent: '/grow', children: [], crossLinks: [] },
  { path: '/grow/pathway', label: 'Growth Pathway', category: 'public', role: 'leaf', primitive: 'sigma', depth: 2, parent: '/grow', children: [], crossLinks: [] },
  { path: '/guardian', label: 'Guardian', category: 'public', role: 'bridge', primitive: 'partial', depth: 1, parent: '/', children: ['/guardian/docs/quickstart'], crossLinks: ['/nucleus/guardian'] },
  { path: '/guardian/docs/quickstart', label: 'Guardian Quickstart', category: 'public', role: 'leaf', primitive: 'sigma', depth: 2, parent: '/guardian', children: [], crossLinks: [] },
  {
    path: '/intelligence',
    label: 'Intelligence',
    category: 'public',
    role: 'hub',
    primitive: 'mu',
    depth: 1,
    parent: '/',
    children: ['/intelligence/series', '/intelligence/[slug]'],
    crossLinks: [],
  },
  { path: '/intelligence/series', label: 'Series', category: 'public', role: 'hub', primitive: 'sigma', depth: 2, parent: '/intelligence', children: ['/intelligence/series/[seriesSlug]'], crossLinks: [] },
  { path: '/intelligence/[slug]', label: 'Article', category: 'public', role: 'leaf', primitive: 'lambda', depth: 2, parent: '/intelligence', children: [], crossLinks: [] },
  { path: '/intelligence/series/[seriesSlug]', label: 'Series Detail', category: 'public', role: 'leaf', primitive: 'lambda', depth: 3, parent: '/intelligence/series', children: [], crossLinks: [] },
  { path: '/membership', label: 'Membership', category: 'public', role: 'funnel', primitive: 'sigma', depth: 1, parent: '/', children: [], crossLinks: ['/auth/signup'] },
  { path: '/schedule', label: 'Schedule', category: 'public', role: 'leaf', primitive: 'arrow', depth: 1, parent: '/', children: [], crossLinks: ['/consulting'] },
  { path: '/services', label: 'Services', category: 'public', role: 'hub', primitive: 'mu', depth: 1, parent: '/', children: [], crossLinks: ['/consulting'] },
  { path: '/ventures', label: 'Ventures', category: 'public', role: 'bridge', primitive: 'partial', depth: 1, parent: '/', children: [], crossLinks: ['/nucleus/ventures'] },
  { path: '/checkout', label: 'Checkout', category: 'public', role: 'funnel', primitive: 'sigma', depth: 1, parent: '/', children: ['/checkout/success'], crossLinks: [] },
  { path: '/checkout/success', label: 'Checkout Success', category: 'public', role: 'leaf', primitive: 'sigma', depth: 2, parent: '/checkout', children: [], crossLinks: ['/nucleus'] },
  { path: '/trial/start', label: 'Start Trial', category: 'public', role: 'gate', primitive: 'sigma', depth: 1, parent: '/', children: [], crossLinks: ['/auth/signup'] },

  // ─── LEGAL ─────────────────────────────────────────────────────────────────
  { path: '/privacy', label: 'Privacy Policy', category: 'legal', role: 'leaf', primitive: 'pi', depth: 1, parent: '/', children: [], crossLinks: ['/terms'] },
  { path: '/terms', label: 'Terms of Service', category: 'legal', role: 'leaf', primitive: 'pi', depth: 1, parent: '/', children: [], crossLinks: ['/privacy'] },

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  { path: '/auth/signin', label: 'Sign In', category: 'auth', role: 'gate', primitive: 'partial', depth: 1, parent: '/', children: [], crossLinks: ['/auth/signup', '/auth/reset-password'] },
  { path: '/auth/signup', label: 'Sign Up', category: 'auth', role: 'gate', primitive: 'partial', depth: 1, parent: '/', children: [], crossLinks: ['/auth/signin', '/membership'] },
  { path: '/auth/reset-password', label: 'Reset Password', category: 'auth', role: 'leaf', primitive: 'partial', depth: 1, parent: '/', children: [], crossLinks: ['/auth/signin'] },

  // ─── VERIFY ────────────────────────────────────────────────────────────────
  { path: '/verify', label: 'Verify', category: 'verify', role: 'hub', primitive: 'kappa', depth: 1, parent: '/', children: ['/verify/[verificationId]'], crossLinks: [] },
  { path: '/verify/[verificationId]', label: 'Verification Detail', category: 'verify', role: 'leaf', primitive: 'kappa', depth: 2, parent: '/verify', children: [], crossLinks: [] },

  // ─── INTERNAL ─────────────────────────────────────────────────────────────
  { path: '/design-system', label: 'Design System', category: 'internal', role: 'hub', primitive: 'mu', depth: 1, parent: '/', children: ['/design-system/neural-manifold', '/design-system/sparse-coding'], crossLinks: [] },
  { path: '/design-system/neural-manifold', label: 'Neural Manifold', category: 'internal', role: 'leaf', primitive: 'rho', depth: 2, parent: '/design-system', children: [], crossLinks: [] },
  { path: '/design-system/sparse-coding', label: 'Sparse Coding', category: 'internal', role: 'leaf', primitive: 'rho', depth: 2, parent: '/design-system', children: [], crossLinks: [] },
  { path: '/observatory-test', label: 'Observatory Test', category: 'internal', role: 'leaf', primitive: 'rho', depth: 1, parent: '/', children: [], crossLinks: [] },
  { path: '/maintenance', label: 'Maintenance', category: 'internal', role: 'leaf', primitive: 'pi', depth: 1, parent: '/', children: [], crossLinks: [] },
  { path: '/signal-trending', label: 'Signal Trending', category: 'protected', role: 'leaf', primitive: 'kappa', depth: 1, parent: '/', children: [], crossLinks: ['/nucleus/vigilance/signals'] },
];
