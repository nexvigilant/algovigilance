/**
 * NexCore MCP SDK — Foundation & computation domain.
 *
 * Foundation, edit distance, combinatorics, wolfram, aggregate,
 * rank fusion, lex primitiva, ToV, NMD, compendious, zeta,
 * visual, measure, value mining.
 */
import { call } from './core'

// ── Foundation ──────────────────────────────────────────────────────────────

export const foundation = {
  levenshtein: (p: { a: string; b: string }) => call('foundation_levenshtein', p),
  levenshteinBounded: (p: { a: string; b: string; max_dist: number }) =>
    call('foundation_levenshtein_bounded', p),
  fuzzySearch: (p: { query: string; candidates: string[] }) =>
    call('foundation_fuzzy_search', p),
  sha256: (p: { input: string }) => call('foundation_sha256', p),
  yamlParse: (p: { input: string }) => call('foundation_yaml_parse', p),
  graphTopsort: (p: Record<string, unknown>) => call('foundation_graph_topsort', p),
  graphLevels: (p: Record<string, unknown>) => call('foundation_graph_levels', p),
  fsrsReview: (p: Record<string, unknown>) => call('foundation_fsrs_review', p),
  conceptGrep: (p: { concept: string }) => call('foundation_concept_grep', p),
  domainDistance: (p: Record<string, unknown>) => call('foundation_domain_distance', p),
  flywheelVelocity: (p: Record<string, unknown>) => call('foundation_flywheel_velocity', p),
  tokenRatio: (p: Record<string, unknown>) => call('foundation_token_ratio', p),
  spectralOverlap: (p: Record<string, unknown>) => call('foundation_spectral_overlap', p),
} as const

// ── Edit Distance ───────────────────────────────────────────────────────────

export const editDistance = {
  compute: (p: { a: string; b: string }) => call('edit_distance_compute', p),
  similarity: (p: { a: string; b: string }) => call('edit_distance_similarity', p),
  traceback: (p: { a: string; b: string }) => call('edit_distance_traceback', p),
  transfer: (p: Record<string, unknown>) => call('edit_distance_transfer', p),
  batch: (p: Record<string, unknown>) => call('edit_distance_batch', p),
} as const

// ── Combinatorics ───────────────────────────────────────────────────────────

export const combinatorics = {
  catalan: (p: { n: number }) => call('comb_catalan', p),
  catalanTable: (p: { n: number }) => call('comb_catalan_table', p),
  cycleDecomposition: (p: Record<string, unknown>) => call('comb_cycle_decomposition', p),
  minTranspositions: (p: Record<string, unknown>) => call('comb_min_transpositions', p),
  derangement: (p: { n: number }) => call('comb_derangement', p),
  derangementProbability: (p: { n: number }) => call('comb_derangement_probability', p),
  gridPaths: (p: Record<string, unknown>) => call('comb_grid_paths', p),
  binomial: (p: { n: number; k: number }) => call('comb_binomial', p),
  multinomial: (p: Record<string, unknown>) => call('comb_multinomial', p),
  josephus: (p: Record<string, unknown>) => call('comb_josephus', p),
  eliminationOrder: (p: Record<string, unknown>) => call('comb_elimination_order', p),
  linearExtensions: (p: Record<string, unknown>) => call('comb_linear_extensions', p),
} as const

// ── Wolfram ─────────────────────────────────────────────────────────────────

export const wolfram = {
  query: (p: { input: string }) => call('wolfram_query', p),
  shortAnswer: (p: { input: string }) => call('wolfram_short_answer', p),
  spokenAnswer: (p: { input: string }) => call('wolfram_spoken_answer', p),
  calculate: (p: { input: string }) => call('wolfram_calculate', p),
  stepByStep: (p: { input: string }) => call('wolfram_step_by_step', p),
  plot: (p: { input: string }) => call('wolfram_plot', p),
  convert: (p: { input: string }) => call('wolfram_convert', p),
  chemistry: (p: { input: string }) => call('wolfram_chemistry', p),
  physics: (p: { input: string }) => call('wolfram_physics', p),
  astronomy: (p: { input: string }) => call('wolfram_astronomy', p),
  statistics: (p: { input: string }) => call('wolfram_statistics', p),
  dataLookup: (p: { input: string }) => call('wolfram_data_lookup', p),
  finance: (p: { input: string }) => call('wolfram_finance', p),
  nutrition: (p: { input: string }) => call('wolfram_nutrition', p),
  linguistics: (p: { input: string }) => call('wolfram_linguistics', p),
} as const

// ── Aggregate ───────────────────────────────────────────────────────────────

export const aggregate = {
  fold: (p: Record<string, unknown>) => call('aggregate_fold', p),
  treeFold: (p: Record<string, unknown>) => call('aggregate_tree_fold', p),
  rank: (p: Record<string, unknown>) => call('aggregate_rank', p),
  percentile: (p: Record<string, unknown>) => call('aggregate_percentile', p),
  outliers: (p: Record<string, unknown>) => call('aggregate_outliers', p),
} as const

// ── Rank Fusion ─────────────────────────────────────────────────────────────

export const rankFusion = {
  rrf: (p: Record<string, unknown>) => call('rank_fusion_rrf', p),
  hybrid: (p: Record<string, unknown>) => call('rank_fusion_hybrid', p),
  borda: (p: Record<string, unknown>) => call('rank_fusion_borda', p),
} as const

// ── Lex Primitiva ───────────────────────────────────────────────────────────

export const lexPrimitiva = {
  list: () => call('lex_primitiva_list'),
  get: (p: { symbol: string }) => call('lex_primitiva_get', p),
  tier: (p: Record<string, unknown>) => call('lex_primitiva_tier', p),
  composition: (p: Record<string, unknown>) => call('lex_primitiva_composition', p),
  reverseCompose: (p: Record<string, unknown>) => call('lex_primitiva_reverse_compose', p),
  reverseLookup: (p: Record<string, unknown>) => call('lex_primitiva_reverse_lookup', p),
  molecularWeight: (p: Record<string, unknown>) => call('lex_primitiva_molecular_weight', p),
  dominantShift: (p: Record<string, unknown>) => call('lex_primitiva_dominant_shift', p),
  stateMode: (p: Record<string, unknown>) => call('lex_primitiva_state_mode', p),
  audit: () => call('lex_primitiva_audit'),
  synth: (p: Record<string, unknown>) => call('lex_primitiva_synth', p),
} as const

// ── ToV Grounded ────────────────────────────────────────────────────────────

export const tovGrounded = {
  signalStrength: (p: Record<string, unknown>) => call('tov_grounded_signal_strength', p),
  safetyMargin: (p: Record<string, unknown>) => call('tov_grounded_safety_margin', p),
  stabilityShell: (p: Record<string, unknown>) => call('tov_grounded_stability_shell', p),
  harmType: (p: Record<string, unknown>) => call('tov_grounded_harm_type', p),
  metaVigilance: (p: Record<string, unknown>) => call('tov_grounded_meta_vigilance', p),
  ekaIntelligence: (p: Record<string, unknown>) => call('tov_grounded_eka_intelligence', p),
  magicNumbers: () => call('tov_grounded_magic_numbers'),
} as const

// ── NMD (anti-hallucination) ────────────────────────────────────────────────

export const nmd = {
  check: (p: Record<string, unknown>) => call('nmd_check', p),
  upfEvaluate: (p: Record<string, unknown>) => call('nmd_upf_evaluate', p),
  smgProcess: (p: Record<string, unknown>) => call('nmd_smg_process', p),
  adaptiveStats: () => call('nmd_adaptive_stats'),
  thymicStatus: () => call('nmd_thymic_status'),
  status: () => call('nmd_status'),
} as const

// ── Compendious (text density) ──────────────────────────────────────────────

export const compendious = {
  scoreText: (p: { text: string }) => call('compendious_score_text', p),
  compressText: (p: { text: string }) => call('compendious_compress_text', p),
  compareTexts: (p: { a: string; b: string }) => call('compendious_compare_texts', p),
  analyzePatterns: (p: { text: string }) => call('compendious_analyze_patterns', p),
  getDomainTarget: (p: { domain: string }) => call('compendious_get_domain_target', p),
} as const

// ── Zeta (pure math) ────────────────────────────────────────────────────────

export const zeta = {
  compute: (p: Record<string, unknown>) => call('zeta_compute', p),
  findZeros: (p: Record<string, unknown>) => call('zeta_find_zeros', p),
  verifyRh: (p: Record<string, unknown>) => call('zeta_verify_rh', p),
  embeddedZeros: (p: Record<string, unknown>) => call('zeta_embedded_zeros', p),
  lmfdbParse: (p: Record<string, unknown>) => call('zeta_lmfdb_parse', p),
  telescopeRun: (p: Record<string, unknown>) => call('zeta_telescope_run', p),
  batchRun: (p: Record<string, unknown>) => call('zeta_batch_run', p),
  scalingFit: (p: Record<string, unknown>) => call('zeta_scaling_fit', p),
  scalingPredict: (p: Record<string, unknown>) => call('zeta_scaling_predict', p),
  cayley: (p: Record<string, unknown>) => call('zeta_cayley', p),
  operatorHunt: (p: Record<string, unknown>) => call('zeta_operator_hunt', p),
  operatorCandidate: (p: Record<string, unknown>) => call('zeta_operator_candidate', p),
  gueCompare: (p: Record<string, unknown>) => call('zeta_gue_compare', p),
} as const

// ── Value Mining ────────────────────────────────────────────────────────────

export const valueMining = {
  signalTypes: () => call('value_signal_types'),
  signalDetect: (p: Record<string, unknown>) => call('value_signal_detect', p),
  baselineCreate: (p: Record<string, unknown>) => call('value_baseline_create', p),
  pvMapping: () => call('value_pv_mapping'),
} as const

// ── Measure (quality metrics) ───────────────────────────────────────────────

export const measure = {
  crate: (p: Record<string, unknown>) => call('measure_crate', p),
  workspace: () => call('measure_workspace'),
  entropy: (p: Record<string, unknown>) => call('measure_entropy', p),
  graph: (p: Record<string, unknown>) => call('measure_graph', p),
  drift: (p: Record<string, unknown>) => call('measure_drift', p),
  compare: (p: Record<string, unknown>) => call('measure_compare', p),
  stats: () => call('measure_stats'),
  qualityGradient: (p: Record<string, unknown>) => call('quality_gradient', p),
} as const

// ── Visual (shape/color) ────────────────────────────────────────────────────

export const visual = {
  shapeClassify: (p: Record<string, unknown>) => call('visual_shape_classify', p),
  colorAnalyze: (p: Record<string, unknown>) => call('visual_color_analyze', p),
  shapeList: () => call('visual_shape_list'),
} as const
