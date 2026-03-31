/**
 * Pathway Registry
 *
 * Central registry for all clinical pathway definitions.
 * Provides access to pathways by task type and guidance level.
 */

import type {
  Pathway,
  PVTaskType,
  GuidanceLevel,
} from '@/types/clinical-pathways';

/**
 * Pathway metadata for listing
 */
export interface PathwayMetadata {
  id: string;
  taskType: PVTaskType;
  name: string;
  description: string;
  guidanceLevel: GuidanceLevel;
  estimatedMinutes: number;
  phases: number;
}

/**
 * Registry storage
 */
const pathwayStore = new Map<string, Pathway>();

/**
 * Build registry key from task type and guidance level
 */
function buildKey(taskType: PVTaskType, guidanceLevel: GuidanceLevel): string {
  return `${taskType}_${guidanceLevel}`;
}

/**
 * Register a pathway
 */
export function registerPathway(pathway: Pathway): void {
  const key = buildKey(pathway.taskType, pathway.guidanceLevel);
  pathwayStore.set(key, pathway);
}

/**
 * Get a pathway by task type and guidance level
 */
export function getPathway(
  taskType: PVTaskType,
  guidanceLevel: GuidanceLevel
): Pathway | undefined {
  const key = buildKey(taskType, guidanceLevel);
  return pathwayStore.get(key);
}

/**
 * Get a pathway, falling back to higher guidance levels if not found
 */
export function getPathwayWithFallback(
  taskType: PVTaskType,
  preferredGuidance: GuidanceLevel
): Pathway | undefined {
  // Try preferred level first
  const preferred = getPathway(taskType, preferredGuidance);
  if (preferred) return preferred;

  // Fallback order: medium → high
  const fallbackOrder: GuidanceLevel[] = ['medium', 'high'];
  for (const level of fallbackOrder) {
    const fallback = getPathway(taskType, level);
    if (fallback) return fallback;
  }

  return undefined;
}

/**
 * List all available pathways
 */
export function listPathways(): PathwayMetadata[] {
  return Array.from(pathwayStore.values()).map((p) => ({
    id: p.id,
    taskType: p.taskType,
    name: p.name,
    description: p.description,
    guidanceLevel: p.guidanceLevel,
    estimatedMinutes: Math.ceil(
      Object.values(p.states).reduce((sum, s) => sum + s.estimatedTimeSeconds, 0) / 60
    ),
    phases: p.phases.length,
  }));
}

/**
 * List pathways for a specific task type
 */
export function listPathwaysForTask(taskType: PVTaskType): PathwayMetadata[] {
  return listPathways().filter((p) => p.taskType === taskType);
}

/**
 * Check if a pathway exists
 */
export function hasPathway(
  taskType: PVTaskType,
  guidanceLevel: GuidanceLevel
): boolean {
  return pathwayStore.has(buildKey(taskType, guidanceLevel));
}

/**
 * Pathway registry interface
 */
export interface PathwayRegistry {
  get(taskType: PVTaskType, guidanceLevel: GuidanceLevel): Pathway | undefined;
  getWithFallback(taskType: PVTaskType, preferredGuidance: GuidanceLevel): Pathway | undefined;
  list(): PathwayMetadata[];
  listForTask(taskType: PVTaskType): PathwayMetadata[];
  has(taskType: PVTaskType, guidanceLevel: GuidanceLevel): boolean;
  register(pathway: Pathway): void;
}

/**
 * Create a pathway registry instance
 */
export function createPathwayRegistry(): PathwayRegistry {
  return {
    get: getPathway,
    getWithFallback: getPathwayWithFallback,
    list: listPathways,
    listForTask: listPathwaysForTask,
    has: hasPathway,
    register: registerPathway,
  };
}

// =============================================================================
// Initialize Registry with Built-in Pathways
// =============================================================================

// Export singleton registry
export const pathwayRegistry = createPathwayRegistry();
