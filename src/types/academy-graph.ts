/**
 * Academy Graph Types — Atomized Learning Pathway DAG
 *
 * Mirrors the Rust academy-forge AtomizedPathway and LearningGraph types.
 * Used by the DAG Viewer to render ALO dependency graphs.
 */

export type AloType = 'hook' | 'concept' | 'activity' | 'reflection';
export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
export type AloEdgeType = 'prereq' | 'coreq' | 'strengthens' | 'assesses' | 'extends';

export interface AtomicLearningObject {
  id: string;
  title: string;
  alo_type: AloType;
  learning_objective: string;
  estimated_duration: number; // minutes
  bloom_level: BloomLevel;
  ksb_refs: string[];
  source_stage_id: string;
  source_activity_id?: string;
  assessment?: { passing_score: number; questions: unknown[] };
}

export interface AloEdge {
  from: string;
  to: string;
  edge_type: AloEdgeType;
  strength: number;
}

export interface AtomizedPathway {
  id: string;
  title: string;
  source_pathway_id: string;
  alos: AtomicLearningObject[];
  edges: AloEdge[];
}

export interface OverlapCluster {
  concept: string;
  alo_ids: string[];
  pathways: string[];
  canonical_alo_id: string;
}

export interface GraphMetadata {
  node_count: number;
  edge_count: number;
  connected_components: number;
  diameter: number;
  avg_duration_min: number;
  total_duration_min: number;
  overlap_ratio: number;
}

export interface LearningGraph {
  nodes: AtomicLearningObject[];
  edges: AloEdge[];
  pathways: string[];
  overlap_clusters: OverlapCluster[];
  metadata: GraphMetadata;
}
