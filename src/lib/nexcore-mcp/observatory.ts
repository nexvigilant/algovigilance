/**
 * NexCore MCP SDK — Observatory & visualization domain.
 *
 * Viz tools (31), topology, graph layout, observatory personalization,
 * cloud intelligence, drift detection.
 */
import { call } from './core'

// ── Visualization (31 tools) ────────────────────────────────────────────────

export const viz = {
  stemTaxonomy: () => call('viz_stem_taxonomy'),
  typeComposition: (p: Record<string, unknown>) => call('viz_type_composition', p),
  methodLoop: (p: Record<string, unknown>) => call('viz_method_loop', p),
  confidenceChain: (p: Record<string, unknown>) => call('viz_confidence_chain', p),
  bounds: (p: Record<string, unknown>) => call('viz_bounds', p),
  dag: (p: Record<string, unknown>) => call('viz_dag', p),
  molecularInfo: (p: Record<string, unknown>) => call('viz_molecular_info', p),
  surfaceMesh: (p: Record<string, unknown>) => call('viz_surface_mesh', p),
  spectralAnalysis: (p: Record<string, unknown>) => call('viz_spectral_analysis', p),
  communityDetect: (p: Record<string, unknown>) => call('viz_community_detect', p),
  centrality: (p: Record<string, unknown>) => call('viz_centrality', p),
  vdagOverlay: (p: Record<string, unknown>) => call('viz_vdag_overlay', p),
  antibodyStructure: (p: Record<string, unknown>) => call('viz_antibody_structure', p),
  interactionMap: (p: Record<string, unknown>) => call('viz_interaction_map', p),
  projection: (p: Record<string, unknown>) => call('viz_projection', p),
  proteinStructure: (p: Record<string, unknown>) => call('viz_protein_structure', p),
  topologyAnalysis: (p: Record<string, unknown>) => call('viz_topology_analysis', p),
  dynamicsStep: (p: Record<string, unknown>) => call('viz_dynamics_step', p),
  forceFieldEnergy: (p: Record<string, unknown>) => call('viz_force_field_energy', p),
  gpuLayout: (p: Record<string, unknown>) => call('viz_gpu_layout', p),
  hypergraph: (p: Record<string, unknown>) => call('viz_hypergraph', p),
  lodSelect: (p: Record<string, unknown>) => call('viz_lod_select', p),
  minimizeEnergy: (p: Record<string, unknown>) => call('viz_minimize_energy', p),
  particlePreset: (p: Record<string, unknown>) => call('viz_particle_preset', p),
  aeOverlay: (p: Record<string, unknown>) => call('viz_ae_overlay', p),
  coordGen: (p: Record<string, unknown>) => call('viz_coord_gen', p),
  bipartiteLayout: (p: Record<string, unknown>) => call('viz_bipartite_layout', p),
  manifoldSample: (p: Record<string, unknown>) => call('viz_manifold_sample', p),
  stringModes: (p: Record<string, unknown>) => call('viz_string_modes', p),
  renderPipeline: (p: Record<string, unknown>) => call('viz_render_pipeline', p),
  orbitalDensity: (p: Record<string, unknown>) => call('viz_orbital_density', p),
} as const

// ── Topology ────────────────────────────────────────────────────────────────

export const topology = {
  vietorisRips: (p: Record<string, unknown>) => call('topo_vietoris_rips', p),
  persistence: (p: Record<string, unknown>) => call('topo_persistence', p),
  betti: (p: Record<string, unknown>) => call('topo_betti', p),
  centrality: (p: Record<string, unknown>) => call('graph_centrality', p),
  components: (p: Record<string, unknown>) => call('graph_components', p),
  shortestPath: (p: Record<string, unknown>) => call('graph_shortest_path', p),
} as const

// ── Observatory Personalization + Graph Layout ──────────────────────────────

export const observatory = {
  personalizeDetect: (p: Record<string, unknown>) => call('observatory_personalize_detect', p),
  personalizeGet: (p: Record<string, unknown>) => call('observatory_personalize_get', p),
  personalizeSet: (p: Record<string, unknown>) => call('observatory_personalize_set', p),
  personalizeValidate: (p: Record<string, unknown>) => call('observatory_personalize_validate', p),
  graphLayoutConverge: (p: Record<string, unknown>) => call('graph_layout_converge', p),
  careerTransitions: (p: Record<string, unknown>) => call('career_transitions', p),
  learningDagResolve: (p: Record<string, unknown>) => call('learning_dag_resolve', p),
} as const

// ── Cloud Intelligence ──────────────────────────────────────────────────────

export const cloud = {
  primitiveComposition: (p: Record<string, unknown>) => call('cloud_primitive_composition', p),
  transferConfidence: (p: Record<string, unknown>) => call('cloud_transfer_confidence', p),
  tierClassify: (p: Record<string, unknown>) => call('cloud_tier_classify', p),
  compareTypes: (p: Record<string, unknown>) => call('cloud_compare_types', p),
  reverseSynthesize: (p: Record<string, unknown>) => call('cloud_reverse_synthesize', p),
  listTypes: () => call('cloud_list_types'),
  molecularWeight: (p: Record<string, unknown>) => call('cloud_molecular_weight', p),
  dominantShift: (p: Record<string, unknown>) => call('cloud_dominant_shift', p),
  infraStatus: () => call('cloud_infra_status'),
  infraMap: () => call('cloud_infra_map'),
  capacityProject: (p: Record<string, unknown>) => call('cloud_capacity_project', p),
  supervisorHealth: () => call('cloud_supervisor_health'),
  reverseTransfer: (p: Record<string, unknown>) => call('cloud_reverse_transfer', p),
  transferChain: (p: Record<string, unknown>) => call('cloud_transfer_chain', p),
  architectureAdvisor: (p: Record<string, unknown>) => call('cloud_architecture_advisor', p),
  anomalyDetect: (p: Record<string, unknown>) => call('cloud_anomaly_detect', p),
  transferMatrix: () => call('cloud_transfer_matrix'),
} as const

// ── Drift Detection ─────────────────────────────────────────────────────────

export const drift = {
  ksTest: (p: Record<string, unknown>) => call('drift_ks_test', p),
  psi: (p: Record<string, unknown>) => call('drift_psi', p),
  jsd: (p: Record<string, unknown>) => call('drift_jsd', p),
  detect: (p: Record<string, unknown>) => call('drift_detect', p),
} as const

// ── Observability ───────────────────────────────────────────────────────────

export const observability = {
  query: (p: Record<string, unknown>) => call('observability_query', p),
  freshness: (p: Record<string, unknown>) => call('observability_freshness', p),
} as const
