/**
 * Pathway DAG Types
 * Types for visualizing capability pathways as directed acyclic graphs
 */

/**
 * DAG Node representing a KSB or checkpoint
 */
export interface DAGNode {
  id: string;
  label: string;
  /** Node type determines styling */
  type: 'ksb' | 'checkpoint' | 'milestone' | 'epa';
  /** Current completion status */
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  /** Proficiency level (L1-L5+) */
  level?: string;
  /** Additional metadata for tooltips */
  metadata?: {
    estimatedMinutes?: number;
    type?: 'knowledge' | 'skill' | 'behavior';
    domainId?: string;
  };
}

/**
 * DAG Edge representing a dependency
 */
export interface DAGEdge {
  id: string;
  from: string;
  to: string;
  /** Edge type for styling */
  type: 'prerequisite' | 'recommended' | 'corequisite';
  /** Edge weight for layout algorithms */
  weight?: number;
}

/**
 * Complete DAG structure for a pathway
 */
export interface PathwayDAG {
  nodes: DAGNode[];
  edges: DAGEdge[];
  /** Metadata about the pathway */
  metadata: {
    epaId: string;
    epaName: string;
    totalNodes: number;
    completedNodes: number;
    currentLevel: string;
  };
}

/**
 * Vis-network specific options for DAG rendering
 */
export interface DAGRenderOptions {
  /** Layout direction */
  direction: 'UD' | 'DU' | 'LR' | 'RL';
  /** Enable physics simulation */
  physics: boolean;
  /** Node spacing */
  nodeSpacing: number;
  /** Level separation for hierarchical layout */
  levelSeparation: number;
  /** Highlight path to selected node */
  highlightPath: boolean;
}

/**
 * Node style configuration based on status
 */
export interface NodeStyleConfig {
  locked: {
    color: string;
    borderColor: string;
    opacity: number;
  };
  available: {
    color: string;
    borderColor: string;
    opacity: number;
  };
  in_progress: {
    color: string;
    borderColor: string;
    opacity: number;
  };
  completed: {
    color: string;
    borderColor: string;
    opacity: number;
  };
}

/**
 * Default node styles matching AlgoVigilance brand
 */
export const DEFAULT_NODE_STYLES: NodeStyleConfig = {
  locked: {
    color: '#1e293b', // nex-surface
    borderColor: '#334155', // nex-border
    opacity: 0.5,
  },
  available: {
    color: '#0e7490', // cyan-700
    borderColor: '#06b6d4', // cyan
    opacity: 1,
  },
  in_progress: {
    color: '#ca8a04', // gold
    borderColor: '#eab308', // gold-bright
    opacity: 1,
  },
  completed: {
    color: '#059669', // emerald-600
    borderColor: '#10b981', // emerald-500
    opacity: 1,
  },
};
