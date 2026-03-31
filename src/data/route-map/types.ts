/**
 * Route Map Types
 *
 * Type definitions for the complete site DAG.
 *
 * Primitives (from T1 Lex Primitiva):
 *   mu (Mapping)     — hub pages that map children
 *   sigma (Sequence)  — sequential flow pages (funnels, progress)
 *   partial (Boundary) — auth gates, permission boundaries
 *   lambda (Location)  — detail/leaf pages addressed by ID
 *   arrow (Causality)  — pages that drive action/conversion
 *   kappa (Comparison) — search, analytics, assessment pages
 *   rho (Recursion)    — self-referential/interactive pages
 *   pi (Persistence)   — static/archival content
 *
 * @module data/route-map/types
 */

export type RouteCategory = 'public' | 'auth' | 'protected' | 'admin' | 'legal' | 'verify' | 'internal';
export type RouteRole = 'root' | 'hub' | 'bridge' | 'leaf' | 'gate' | 'funnel';
export type RoutePrimitive = 'mu' | 'sigma' | 'partial' | 'lambda' | 'arrow' | 'kappa' | 'rho' | 'pi';

export interface RouteNode {
  path: string;
  label: string;
  category: RouteCategory;
  role: RouteRole;
  primitive: RoutePrimitive;
  depth: number;
  parent: string | null;
  children: string[];
  crossLinks: string[];
}
