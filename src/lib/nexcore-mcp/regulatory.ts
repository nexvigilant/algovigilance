/**
 * NexCore MCP SDK — Regulatory & compliance domain.
 *
 * Guidelines, ICH, FDA guidance, FDA credibility, FHIR, MeSH,
 * compliance, security posture.
 */
import { call } from './core'

// ── Regulatory (Guidelines + ICH) ───────────────────────────────────────────

export const regulatory = {
  guidelinesSearch: (p: { query: string }) => call('guidelines_search', p),
  guidelinesGet: (p: { id: string }) => call('guidelines_get', p),
  guidelinesCategories: () => call('guidelines_categories'),
  guidelinesPvAll: () => call('guidelines_pv_all'),
  guidelinesUrl: (p: { id: string }) => call('guidelines_url', p),
  ichLookup: (p: { code: string }) => call('ich_lookup', p),
  ichSearch: (p: { query: string }) => call('ich_search', p),
  ichGuideline: (p: { code: string }) => call('ich_guideline', p),
  ichStats: () => call('ich_stats'),
  fdaGuidanceSearch: (p: { query: string }) => call('fda_guidance_search', p),
  fdaGuidanceGet: (p: { id: string }) => call('fda_guidance_get', p),
  fdaGuidanceCategories: () => call('fda_guidance_categories'),
  fdaGuidanceUrl: (p: { id: string }) => call('fda_guidance_url', p),
  fdaGuidanceStatus: () => call('fda_guidance_status'),
  primitivesExtract: (p: Record<string, unknown>) => call('regulatory_primitives_extract', p),
  primitivesAudit: (p: Record<string, unknown>) => call('regulatory_primitives_audit', p),
  primitivesCompare: (p: Record<string, unknown>) => call('regulatory_primitives_compare', p),
  complianceCatalogIch: () => call('compliance_catalog_ich'),
} as const

// ── FDA Credibility Assessment ──────────────────────────────────────────────

export const fdaCredibility = {
  defineCou: (p: Record<string, unknown>) => call('fda_define_cou', p),
  assessRisk: (p: Record<string, unknown>) => call('fda_assess_risk', p),
  createPlan: (p: Record<string, unknown>) => call('fda_create_plan', p),
  validateEvidence: (p: Record<string, unknown>) => call('fda_validate_evidence', p),
  decideAdequacy: (p: Record<string, unknown>) => call('fda_decide_adequacy', p),
  calculateScore: (p: Record<string, unknown>) => call('fda_calculate_score', p),
  metricsSummary: () => call('fda_metrics_summary'),
  evidenceDistribution: () => call('fda_evidence_distribution'),
  riskDistribution: () => call('fda_risk_distribution'),
  driftTrend: (p: Record<string, unknown>) => call('fda_drift_trend', p),
  ratingThresholds: () => call('fda_rating_thresholds'),
} as const

// ── FHIR (clinical data) ────────────────────────────────────────────────────

export const fhir = {
  adverseEventToSignal: (p: Record<string, unknown>) => call('fhir_adverse_event_to_signal', p),
  batchToSignals: (p: Record<string, unknown>) => call('fhir_batch_to_signals', p),
  parseBundle: (p: Record<string, unknown>) => call('fhir_parse_bundle', p),
  validateResource: (p: Record<string, unknown>) => call('fhir_validate_resource', p),
} as const

// ── MeSH ────────────────────────────────────────────────────────────────────

export const mesh = {
  lookup: (p: { id: string }) => call('mesh_lookup', p),
  search: (p: { query: string }) => call('mesh_search', p),
  tree: (p: { id: string }) => call('mesh_tree', p),
  crossref: (p: Record<string, unknown>) => call('mesh_crossref', p),
  enrichPubmed: (p: Record<string, unknown>) => call('mesh_enrich_pubmed', p),
  consistency: (p: Record<string, unknown>) => call('mesh_consistency', p),
} as const

// ── Compliance ──────────────────────────────────────────────────────────────

export const compliance = {
  checkExclusion: (p: Record<string, unknown>) => call('compliance_check_exclusion', p),
  assess: (p: Record<string, unknown>) => call('compliance_assess', p),
  catalogIch: () => call('compliance_catalog_ich'),
  secFilings: (p: Record<string, unknown>) => call('compliance_sec_filings', p),
  secPharma: (p: Record<string, unknown>) => call('compliance_sec_pharma', p),
} as const

// ── Security Posture ────────────────────────────────────────────────────────

export const security = {
  postureAssess: (p: Record<string, unknown>) => call('security_posture_assess', p),
  threatReadiness: (p: Record<string, unknown>) => call('security_threat_readiness', p),
  complianceGap: (p: Record<string, unknown>) => call('security_compliance_gap', p),
} as const
