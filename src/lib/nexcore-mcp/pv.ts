/**
 * NexCore MCP SDK — Pharmacovigilance domain.
 *
 * Signal detection, FAERS, PV axioms, PV DSL, PV embeddings, vigilance.
 */
import { call } from "./core";
import type { SignalInput } from "./core";

// ── PV Signal Detection ─────────────────────────────────────────────────────

export interface SignalResult {
  prr?: number;
  ror?: number;
  ic?: number;
  ebgm?: number;
  chi_square?: number;
  signals?: Record<string, boolean>;
}

export const pv = {
  signalComplete: (p: SignalInput) =>
    call<SignalResult>("pv_signal_complete", p),
  signalPrr: (p: SignalInput) => call<{ prr: number }>("pv_signal_prr", p),
  signalRor: (p: SignalInput) => call<{ ror: number }>("pv_signal_ror", p),
  signalIc: (p: SignalInput) => call<{ ic: number }>("pv_signal_ic", p),
  signalEbgm: (p: SignalInput) => call<{ ebgm: number }>("pv_signal_ebgm", p),
  chiSquare: (p: SignalInput) =>
    call<{ chi_square: number }>("pv_chi_square", p),
  naranjoQuick: (p: Record<string, unknown>) => call("pv_naranjo_quick", p),
  whoUmcQuick: (p: Record<string, unknown>) => call("pv_who_umc_quick", p),
  pipeline: (p: Record<string, unknown>) => call("pv_pipeline", p),
  signalCooperative: (p: Record<string, unknown>) =>
    call("pv_signal_cooperative", p),
  signalStrength: (p: Record<string, unknown>) => call("pv_signal_strength", p),
} as const;

// ── PV Axioms ───────────────────────────────────────────────────────────────

export const pvAxioms = {
  ksbLookup: (p: { query: string }) => call("pv_axioms_ksb_lookup", p),
  regulationSearch: (p: { query: string }) =>
    call("pv_axioms_regulation_search", p),
  traceabilityChain: (p: Record<string, unknown>) =>
    call("pv_axioms_traceability_chain", p),
  domainDashboard: (p: Record<string, unknown>) =>
    call("pv_axioms_domain_dashboard", p),
  query: (p: { query: string }) => call("pv_axioms_query", p),
} as const;

// ── PV Embeddings ───────────────────────────────────────────────────────────

export const pvEmbeddings = {
  similarity: (p: { a: string; b: string }) =>
    call("pv_embedding_similarity", p),
  get: (p: { term: string }) => call("pv_embedding_get", p),
  stats: () => call("pv_embedding_stats"),
} as const;

// ── PV DSL ──────────────────────────────────────────────────────────────────

export const pvdsl = {
  compile: (p: { source: string }) => call("pvdsl_compile", p),
  execute: (p: { source: string }) => call("pvdsl_execute", p),
  eval: (p: { expr: string }) => call("pvdsl_eval", p),
  functions: () => call("pvdsl_functions"),
} as const;

// ── FAERS ───────────────────────────────────────────────────────────────────

export interface FaersSearchParams {
  query?: string;
  drug?: string;
  event?: string;
  limit?: number;
}

export const faers = {
  search: (p: FaersSearchParams) => call("faers_search", p),
  drugEvents: (p: { drug: string }) => call("faers_drug_events", p),
  signalCheck: (p: { drug: string; event: string }) =>
    call("faers_signal_check", p),
  disproportionality: (p: Record<string, unknown>) =>
    call("faers_disproportionality", p),
  compareDrugs: (p: { drugs: string[] }) => call("faers_compare_drugs", p),
  polypharmacy: (p: Record<string, unknown>) => call("faers_polypharmacy", p),
  reporterWeighted: (p: Record<string, unknown>) =>
    call("faers_reporter_weighted", p),
  outcomeConditioned: (p: Record<string, unknown>) =>
    call("faers_outcome_conditioned", p),
  signalVelocity: (p: Record<string, unknown>) =>
    call("faers_signal_velocity", p),
  seriousnessCascade: (p: Record<string, unknown>) =>
    call("faers_seriousness_cascade", p),
  geographicDivergence: (p: Record<string, unknown>) =>
    call("faers_geographic_divergence", p),
} as const;

// ── Signal Detection ────────────────────────────────────────────────────────

export const signal = {
  detect: (p: Record<string, unknown>) => call("signal_detect", p),
  batch: (p: Record<string, unknown>) => call("signal_batch", p),
  thresholds: () => call("signal_thresholds"),
} as const;

// ── Vigilance ───────────────────────────────────────────────────────────────

export const vigilance = {
  safetyMargin: (p: Record<string, unknown>) =>
    call("vigilance_safety_margin", p),
  riskScore: (p: Record<string, unknown>) => call("vigilance_risk_score", p),
  harmTypes: () => call("vigilance_harm_types"),
  mapToTov: (p: Record<string, unknown>) => call("vigilance_map_to_tov", p),
} as const;
