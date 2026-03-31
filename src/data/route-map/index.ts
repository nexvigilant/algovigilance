/**
 * Route Map — Complete Site DAG
 *
 * Combines all route segments into a unified map.
 * Powers sitemap generation, navigation validation, and RelatedResources.
 *
 * @module data/route-map
 */

export type { RouteNode, RouteCategory, RouteRole, RoutePrimitive } from './types';

import type { RouteNode, RouteCategory } from './types';
import { PUBLIC_ROUTES } from './public-routes';
import { PROTECTED_ROUTES } from './protected-routes';
import { SAFETY_ROUTES } from './safety-routes';
import { ADMIN_ROUTES } from './admin-routes';

/** Complete site route map — all pages as a flat array */
export const ROUTE_MAP: RouteNode[] = [
  ...PUBLIC_ROUTES,
  ...PROTECTED_ROUTES,
  ...SAFETY_ROUTES,
  ...ADMIN_ROUTES,
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Look up a single route by exact path */
export function getRouteByPath(path: string): RouteNode | undefined {
  return ROUTE_MAP.find((node) => node.path === path);
}

/** Get all direct children of a route */
export function getRouteChildren(path: string): RouteNode[] {
  return ROUTE_MAP.filter((node) => node.parent === path);
}

/** Get resolved cross-link RouteNodes for a given path */
export function getRouteCrossLinks(path: string): RouteNode[] {
  const route = getRouteByPath(path);
  if (!route) return [];
  return route.crossLinks
    .map((linkPath) => getRouteByPath(linkPath))
    .filter((r): r is RouteNode => r !== undefined);
}

/** Get all routes by category */
export function getRoutesByCategory(category: RouteCategory): RouteNode[] {
  return ROUTE_MAP.filter((node) => node.category === category);
}

/** Get all hub routes */
export function getHubRoutes(): RouteNode[] {
  return ROUTE_MAP.filter((node) => node.role === 'hub');
}
