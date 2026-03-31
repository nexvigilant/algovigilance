/**
 * KSB to DAG Converter
 * Transforms KSB data into PathwayDAG format for visualization
 */

import type { CapabilityComponent } from '@/types/pv-curriculum';
import type { PathwayDAG, DAGNode, DAGEdge } from '@/types/pathway-dag';
import type { ProficiencyLevel } from '@/types/epa-pathway';

/**
 * Convert KSBs organized by level into a PathwayDAG
 */
export function convertKSBsToDAG(
  ksbsByLevel: Record<ProficiencyLevel, CapabilityComponent[]>,
  completedKSBs: readonly string[],
  currentLevel: ProficiencyLevel,
  metadata: {
    epaId: string;
    epaName: string;
  }
): PathwayDAG {
  const nodes: DAGNode[] = [];
  const edges: DAGEdge[] = [];
  const levels: ProficiencyLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+'];

  let totalNodes = 0;
  let completedNodes = 0;

  // Create nodes for each KSB
  for (const level of levels) {
    const ksbs = ksbsByLevel[level] || [];

    for (const ksb of ksbs) {
      const isCompleted = completedKSBs.includes(ksb.id);
      const isAvailable = isLevelAccessible(level, currentLevel);

      const status = isCompleted
        ? 'completed'
        : !isAvailable
        ? 'locked'
        : 'available';

      nodes.push({
        id: ksb.id,
        label: truncateLabel(ksb.itemName, 30),
        type: 'ksb',
        status,
        level,
        metadata: {
          estimatedMinutes: ksb.activityMetadata?.estimatedMinutes,
          type: ksb.type as 'knowledge' | 'skill' | 'behavior',
          domainId: ksb.domainId,
        },
      });

      totalNodes++;
      if (isCompleted) completedNodes++;
    }
  }

  // Create level checkpoint nodes
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const levelKsbs = ksbsByLevel[level] || [];

    if (levelKsbs.length === 0) continue;

    const checkpointId = `checkpoint-${level}`;
    const allLevelComplete = levelKsbs.every((ksb) =>
      completedKSBs.includes(ksb.id)
    );
    const levelIndex = levels.indexOf(level);
    const currentIndex = levels.indexOf(currentLevel);

    nodes.push({
      id: checkpointId,
      label: `${level} Complete`,
      type: 'checkpoint',
      status: allLevelComplete
        ? 'completed'
        : levelIndex <= currentIndex
        ? 'in_progress'
        : 'locked',
      level,
    });
  }

  // Create edges: KSBs within same level are connected sequentially
  for (const level of levels) {
    const ksbs = ksbsByLevel[level] || [];

    // Connect KSBs within level (parallel structure)
    const checkpointId = `checkpoint-${level}`;

    for (const ksb of ksbs) {
      // Each KSB connects to its level checkpoint
      edges.push({
        id: `${ksb.id}-to-${checkpointId}`,
        from: ksb.id,
        to: checkpointId,
        type: 'prerequisite',
      });
    }
  }

  // Connect level checkpoints sequentially
  const checkpoints = nodes.filter((n) => n.type === 'checkpoint');
  for (let i = 0; i < checkpoints.length - 1; i++) {
    edges.push({
      id: `${checkpoints[i].id}-to-${checkpoints[i + 1].id}`,
      from: checkpoints[i].id,
      to: checkpoints[i + 1].id,
      type: 'prerequisite',
    });
  }

  // Add prerequisite edges based on KSB relationships and activityMetadata
  for (const level of levels) {
    const ksbs = ksbsByLevel[level] || [];

    for (const ksb of ksbs) {
      // Gather prerequisites from both sources
      const activityPrereqs = ksb.activityMetadata?.prerequisites || [];
      const relationshipPrereqs = ksb.relationships?.prerequisites || [];
      const allPrereqs = [...new Set([...activityPrereqs, ...relationshipPrereqs])];

      for (const prereqId of allPrereqs) {
        // Check if the prerequisite KSB exists in our nodes
        if (nodes.some((n) => n.id === prereqId)) {
          edges.push({
            id: `prereq-${prereqId}-to-${ksb.id}`,
            from: prereqId,
            to: ksb.id,
            type: 'prerequisite',
          });
        }
      }

      // Add corequisite edges (bidirectional, shown as 'recommended')
      const corequisites = ksb.relationships?.corequisites || [];
      for (const coreqId of corequisites) {
        // Only add edge in one direction to avoid duplicates
        if (nodes.some((n) => n.id === coreqId) && ksb.id < coreqId) {
          edges.push({
            id: `coreq-${ksb.id}-to-${coreqId}`,
            from: ksb.id,
            to: coreqId,
            type: 'recommended',
          });
        }
      }
    }
  }

  return {
    nodes,
    edges,
    metadata: {
      epaId: metadata.epaId,
      epaName: metadata.epaName,
      totalNodes,
      completedNodes,
      currentLevel,
    },
  };
}

/**
 * Check if a level is accessible based on current level
 */
function isLevelAccessible(
  level: ProficiencyLevel,
  currentLevel: ProficiencyLevel
): boolean {
  const levels: ProficiencyLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+'];
  return levels.indexOf(level) <= levels.indexOf(currentLevel);
}

/**
 * Truncate label to max length with ellipsis
 */
function truncateLabel(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Prerequisite configuration for bulk import
 */
export interface PrerequisiteConfig {
  ksbId: string;
  prerequisites: string[];
  corequisites?: string[];
}

/**
 * Load and apply prerequisites from a configuration array
 * Useful for spreadsheet imports or external data sources
 */
export function applyPrerequisiteConfig(
  ksbsByLevel: Record<ProficiencyLevel, CapabilityComponent[]>,
  config: PrerequisiteConfig[]
): Record<ProficiencyLevel, CapabilityComponent[]> {
  const configMap = new Map(config.map((c) => [c.ksbId, c]));
  const result = { ...ksbsByLevel };

  for (const level of Object.keys(result) as ProficiencyLevel[]) {
    result[level] = result[level].map((ksb) => {
      const prereqConfig = configMap.get(ksb.id);
      if (!prereqConfig) return ksb;

      return {
        ...ksb,
        relationships: {
          ...(ksb.relationships || { prerequisites: [], corequisites: [], relatedKSBs: [] }),
          prerequisites: [
            ...(ksb.relationships?.prerequisites || []),
            ...prereqConfig.prerequisites,
          ],
          corequisites: [
            ...(ksb.relationships?.corequisites || []),
            ...(prereqConfig.corequisites || []),
          ],
        },
      };
    });
  }

  return result;
}

/**
 * Infer prerequisites based on domain structure and level hierarchy
 * Automatically connects same-domain KSBs across levels
 */
export function inferPrerequisitesByDomain(
  ksbsByLevel: Record<ProficiencyLevel, CapabilityComponent[]>
): PrerequisiteConfig[] {
  const levels: ProficiencyLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L5+'];
  const inferredConfigs: PrerequisiteConfig[] = [];

  // Group KSBs by domain across all levels
  const ksbsByDomain = new Map<string, { level: ProficiencyLevel; ksb: CapabilityComponent }[]>();

  for (const level of levels) {
    const ksbs = ksbsByLevel[level] || [];
    for (const ksb of ksbs) {
      const domainKsbs = ksbsByDomain.get(ksb.domainId) || [];
      domainKsbs.push({ level, ksb });
      ksbsByDomain.set(ksb.domainId, domainKsbs);
    }
  }

  // For each domain, create prerequisite links from lower to higher levels
  for (const [_domainId, domainKsbs] of ksbsByDomain) {
    // Sort by level
    domainKsbs.sort((a, b) => levels.indexOf(a.level) - levels.indexOf(b.level));

    // Connect KSBs to all lower-level KSBs in same domain
    for (let i = 1; i < domainKsbs.length; i++) {
      const current = domainKsbs[i];
      const lowerLevelKsbs = domainKsbs
        .slice(0, i)
        .filter((d) => levels.indexOf(d.level) < levels.indexOf(current.level));

      if (lowerLevelKsbs.length > 0) {
        inferredConfigs.push({
          ksbId: current.ksb.id,
          prerequisites: lowerLevelKsbs.map((d) => d.ksb.id),
        });
      }
    }
  }

  return inferredConfigs;
}

/**
 * Create a simple linear DAG for display purposes
 * Useful when full prerequisite data isn't available
 */
export function createSimpleDAG(
  ksbs: CapabilityComponent[],
  completedKSBs: string[],
  metadata: {
    epaId: string;
    epaName: string;
    currentLevel: ProficiencyLevel;
  }
): PathwayDAG {
  const nodes: DAGNode[] = ksbs.map((ksb) => ({
    id: ksb.id,
    label: truncateLabel(ksb.itemName, 25),
    type: 'ksb' as const,
    status: completedKSBs.includes(ksb.id) ? 'completed' : 'available',
    level: ksb.proficiencyLevel,
    metadata: {
      estimatedMinutes: ksb.activityMetadata?.estimatedMinutes,
      type: ksb.type as 'knowledge' | 'skill' | 'behavior',
      domainId: ksb.domainId,
    },
  }));

  // Simple linear edges
  const edges: DAGEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge-${i}`,
      from: nodes[i].id,
      to: nodes[i + 1].id,
      type: 'recommended',
    });
  }

  return {
    nodes,
    edges,
    metadata: {
      epaId: metadata.epaId,
      epaName: metadata.epaName,
      totalNodes: nodes.length,
      completedNodes: nodes.filter((n) => n.status === 'completed').length,
      currentLevel: metadata.currentLevel,
    },
  };
}
