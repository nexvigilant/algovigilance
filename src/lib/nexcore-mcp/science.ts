/**
 * NexCore MCP SDK — Science & computation domain.
 *
 * Chemistry, chemivigilance, STEM, epidemiology, molecular,
 * kellnr compute, pharma R&D, polymer, stoichiometry.
 */
import { call } from './core'
import type { SignalInput } from './core'

// ── Chemistry ───────────────────────────────────────────────────────────────

export const chemistry = {
  thresholdRate: (p: Record<string, unknown>) => call('chemistry_threshold_rate', p),
  decayRemaining: (p: { initial: number; half_life: number; elapsed: number }) =>
    call('chemistry_decay_remaining', p),
  saturationRate: (p: Record<string, unknown>) => call('chemistry_saturation_rate', p),
  feasibility: (p: Record<string, unknown>) => call('chemistry_feasibility', p),
  dependencyRate: (p: Record<string, unknown>) => call('chemistry_dependency_rate', p),
  bufferCapacity: (p: Record<string, unknown>) => call('chemistry_buffer_capacity', p),
  signalAbsorbance: (p: Record<string, unknown>) => call('chemistry_signal_absorbance', p),
  equilibrium: (p: Record<string, unknown>) => call('chemistry_equilibrium', p),
  pvMappings: () => call('chemistry_pv_mappings'),
  thresholdExceeded: (p: Record<string, unknown>) => call('chemistry_threshold_exceeded', p),
  hillResponse: (p: { input: number; k_half: number; n_hill: number }) =>
    call('chemistry_hill_response', p),
  nernstPotential: (p: Record<string, unknown>) => call('chemistry_nernst_potential', p),
  inhibitionRate: (p: Record<string, unknown>) => call('chemistry_inhibition_rate', p),
  eyringRate: (p: Record<string, unknown>) => call('chemistry_eyring_rate', p),
  langmuirCoverage: (p: Record<string, unknown>) => call('chemistry_langmuir_coverage', p),
  firstLawClosed: (p: Record<string, unknown>) => call('chemistry_first_law_closed', p),
  firstLawOpen: (p: Record<string, unknown>) => call('chemistry_first_law_open', p),
} as const

// ── Chemivigilance (structural safety) ──────────────────────────────────────

export const chem = {
  parseSmiles: (p: { smiles: string }) => call('chem_parse_smiles', p),
  descriptors: (p: { smiles: string }) => call('chem_descriptors', p),
  fingerprint: (p: { smiles: string }) => call('chem_fingerprint', p),
  similarity: (p: { a: string; b: string }) => call('chem_similarity', p),
  structuralAlerts: (p: { smiles: string }) => call('chem_structural_alerts', p),
  predictToxicity: (p: { smiles: string }) => call('chem_predict_toxicity', p),
  predictMetabolites: (p: { smiles: string }) => call('chem_predict_metabolites', p),
  predictDegradants: (p: { smiles: string }) => call('chem_predict_degradants', p),
  safetyBrief: (p: { smiles: string }) => call('chem_safety_brief', p),
  substructure: (p: Record<string, unknown>) => call('chem_substructure', p),
  watchlist: (p: Record<string, unknown>) => call('chem_watchlist', p),
  alertLibrary: () => call('chem_alert_library'),
  ringScan: (p: { smiles: string }) => call('chem_ring_scan', p),
  aromaticity: (p: { smiles: string }) => call('chem_aromaticity', p),
  molecularFormula: (p: { smiles: string }) => call('chem_molecular_formula', p),
} as const

// ── STEM ────────────────────────────────────────────────────────────────────

export const stem = {
  version: () => call('stem_version'),
  taxonomy: () => call('stem_taxonomy'),
  confidenceCombine: (p: Record<string, unknown>) => call('stem_confidence_combine', p),
  tierInfo: (p: Record<string, unknown>) => call('stem_tier_info', p),
  chemBalance: (p: Record<string, unknown>) => call('stem_chem_balance', p),
  chemFraction: (p: Record<string, unknown>) => call('stem_chem_fraction', p),
  chemRatio: (p: Record<string, unknown>) => call('stem_chem_ratio', p),
  chemRate: (p: Record<string, unknown>) => call('stem_chem_rate', p),
  chemAffinity: (p: Record<string, unknown>) => call('stem_chem_affinity', p),
  physFma: (p: Record<string, unknown>) => call('stem_phys_fma', p),
  physConservation: (p: Record<string, unknown>) => call('stem_phys_conservation', p),
  physPeriod: (p: Record<string, unknown>) => call('stem_phys_period', p),
  physAmplitude: (p: Record<string, unknown>) => call('stem_phys_amplitude', p),
  physScale: (p: Record<string, unknown>) => call('stem_phys_scale', p),
  physInertia: (p: Record<string, unknown>) => call('stem_phys_inertia', p),
  mathBoundsCheck: (p: Record<string, unknown>) => call('stem_math_bounds_check', p),
  mathRelationInvert: (p: Record<string, unknown>) => call('stem_math_relation_invert', p),
  mathProof: (p: Record<string, unknown>) => call('stem_math_proof', p),
  mathIdentity: (p: Record<string, unknown>) => call('stem_math_identity', p),
  spatialDistance: (p: Record<string, unknown>) => call('stem_spatial_distance', p),
  spatialTriangle: (p: Record<string, unknown>) => call('stem_spatial_triangle', p),
  spatialNeighborhood: (p: Record<string, unknown>) => call('stem_spatial_neighborhood', p),
  spatialDimension: (p: Record<string, unknown>) => call('stem_spatial_dimension', p),
  spatialOrientation: (p: Record<string, unknown>) => call('stem_spatial_orientation', p),
} as const

// ── Epidemiology ────────────────────────────────────────────────────────────

export const epi = {
  relativeRisk: (p: SignalInput) => call('epi_relative_risk', p),
  oddsRatio: (p: SignalInput) => call('epi_odds_ratio', p),
  attributableRisk: (p: SignalInput) => call('epi_attributable_risk', p),
  nntNnh: (p: Record<string, unknown>) => call('epi_nnt_nnh', p),
  attributableFraction: (p: Record<string, unknown>) => call('epi_attributable_fraction', p),
  populationAf: (p: Record<string, unknown>) => call('epi_population_af', p),
  incidenceRate: (p: Record<string, unknown>) => call('epi_incidence_rate', p),
  prevalence: (p: Record<string, unknown>) => call('epi_prevalence', p),
  kaplanMeier: (p: Record<string, unknown>) => call('epi_kaplan_meier', p),
  smr: (p: Record<string, unknown>) => call('epi_smr', p),
  pvMappings: () => call('epi_pv_mappings'),
} as const

// ── Molecular ───────────────────────────────────────────────────────────────

export const molecular = {
  translateCodon: (p: Record<string, unknown>) => call('molecular_translate_codon', p),
  translateMrna: (p: Record<string, unknown>) => call('molecular_translate_mrna', p),
  centralDogma: (p: Record<string, unknown>) => call('molecular_central_dogma', p),
  admePhase: (p: Record<string, unknown>) => call('molecular_adme_phase', p),
} as const

export const molecularWeight = {
  compute: (p: Record<string, unknown>) => call('mw_compute', p),
  periodicTable: () => call('mw_periodic_table'),
  compare: (p: Record<string, unknown>) => call('mw_compare', p),
  predictTransfer: (p: Record<string, unknown>) => call('mw_predict_transfer', p),
} as const

// ── Kellnr Compute ──────────────────────────────────────────────────────────

export const kellnr = {
  pkAuc: (p: Record<string, unknown>) => call('kellnr_compute_pk_auc', p),
  pkSteadyState: (p: Record<string, unknown>) => call('kellnr_compute_pk_steady_state', p),
  pkIonization: (p: Record<string, unknown>) => call('kellnr_compute_pk_ionization', p),
  pkClearance: (p: Record<string, unknown>) => call('kellnr_compute_pk_clearance', p),
  pkVolumeDistribution: (p: Record<string, unknown>) => call('kellnr_compute_pk_volume_distribution', p),
  pkMichaelisMenten: (p: Record<string, unknown>) => call('kellnr_compute_pk_michaelis_menten', p),
  thermoGibbs: (p: Record<string, unknown>) => call('kellnr_compute_thermo_gibbs', p),
  thermoKd: (p: Record<string, unknown>) => call('kellnr_compute_thermo_kd', p),
  thermoBindingAffinity: (p: Record<string, unknown>) => call('kellnr_compute_thermo_binding_affinity', p),
  thermoArrhenius: (p: Record<string, unknown>) => call('kellnr_compute_thermo_arrhenius', p),
  statsWelchTtest: (p: Record<string, unknown>) => call('kellnr_compute_stats_welch_ttest', p),
  statsOlsRegression: (p: Record<string, unknown>) => call('kellnr_compute_stats_ols_regression', p),
  statsPoissonCi: (p: Record<string, unknown>) => call('kellnr_compute_stats_poisson_ci', p),
  statsBayesianPosterior: (p: Record<string, unknown>) => call('kellnr_compute_stats_bayesian_posterior', p),
  statsEntropy: (p: Record<string, unknown>) => call('kellnr_compute_stats_entropy', p),
  graphBetweenness: (p: Record<string, unknown>) => call('kellnr_compute_graph_betweenness', p),
  graphMutualInfo: (p: Record<string, unknown>) => call('kellnr_compute_graph_mutual_info', p),
  graphTarjanScc: (p: Record<string, unknown>) => call('kellnr_compute_graph_tarjan_scc', p),
  graphTopsort: (p: Record<string, unknown>) => call('kellnr_compute_graph_topsort', p),
  dtreeFeatureImportance: (p: Record<string, unknown>) => call('kellnr_compute_dtree_feature_importance', p),
  dtreePrune: (p: Record<string, unknown>) => call('kellnr_compute_dtree_prune', p),
  dtreeToRules: (p: Record<string, unknown>) => call('kellnr_compute_dtree_to_rules', p),
  signalSprt: (p: Record<string, unknown>) => call('kellnr_compute_signal_sprt', p),
  signalCusum: (p: Record<string, unknown>) => call('kellnr_compute_signal_cusum', p),
  signalWeibullTto: (p: Record<string, unknown>) => call('kellnr_compute_signal_weibull_tto', p),
} as const

// ── Pharma R&D ──────────────────────────────────────────────────────────────

export const pharmaRd = {
  taxonomySummary: () => call('pharma_taxonomy_summary'),
  lookupTransfer: (p: Record<string, unknown>) => call('pharma_lookup_transfer', p),
  transferMatrix: () => call('pharma_transfer_matrix'),
  strongestTransfers: () => call('pharma_strongest_transfers'),
  weakestTransfers: () => call('pharma_weakest_transfers'),
  symbolCoverage: () => call('pharma_symbol_coverage'),
  pipelineStage: (p: Record<string, unknown>) => call('pharma_pipeline_stage', p),
  classifyGenerators: (p: Record<string, unknown>) => call('pharma_classify_generators', p),
} as const

// ── Polymer ─────────────────────────────────────────────────────────────────

export const polymer = {
  compose: (p: Record<string, unknown>) => call('polymer_compose', p),
  validate: (p: Record<string, unknown>) => call('polymer_validate', p),
  analyze: (p: Record<string, unknown>) => call('polymer_analyze', p),
} as const

// ── Stoichiometry ───────────────────────────────────────────────────────────

export const stoichiometry = {
  encode: (p: Record<string, unknown>) => call('stoichiometry_encode', p),
  decode: (p: Record<string, unknown>) => call('stoichiometry_decode', p),
  sisters: (p: Record<string, unknown>) => call('stoichiometry_sisters', p),
  massState: (p: Record<string, unknown>) => call('stoichiometry_mass_state', p),
  dictionary: () => call('stoichiometry_dictionary'),
  isBalanced: (p: Record<string, unknown>) => call('stoichiometry_is_balanced', p),
  prove: (p: Record<string, unknown>) => call('stoichiometry_prove', p),
  isIsomer: (p: Record<string, unknown>) => call('stoichiometry_is_isomer', p),
} as const
