/**
 * Guardian Signal Detection API — TypeScript types.
 * Mirrors the Rust API contract from nexcore-api Stream 1.
 */

import { PV_SIGNAL_THRESHOLDS, PV_BORDERLINE_THRESHOLDS, PV_CONCORDANCE_THRESHOLDS } from '@/lib/constants/pv-thresholds';

export interface SignalDetectRequest {
  /** Exposed cases: drug + event */
  a: number;
  /** Exposed cases: drug, no event */
  b: number;
  /** Unexposed cases: no drug + event */
  c: number;
  /** Unexposed cases: no drug, no event */
  d: number;
  drug_name: string;
  event_name: string;
}

export interface SignalDetectResponse {
  prr: number;
  ror: number;
  ic: number;
  ebgm: number;
  chi_sq: number;
  concordance_score: number;
  safety_margin: number;
}

export interface CausalityRequest {
  temporal: boolean;
  dechallenge: boolean;
  rechallenge: boolean;
  alternatives: boolean;
  previous: boolean;
}

export interface CausalityResponse {
  naranjo_score: number;
  naranjo_category: string;
  who_umc_category: string;
}

export interface SafetyRequest {
  prr: number;
  ror_lower: number;
  ic025: number;
  eb05: number;
  n: number;
}

export interface SafetyResponse {
  distance: number;
  action: string;
}

export interface UsageResponse {
  used: number;
  limit: number;
  plan: string;
  period_start: string;
  period_end: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used?: string;
  active: boolean;
}

export type ConcordanceLevel = 'strong' | 'moderate' | 'weak';

export function getConcordanceLevel(score: number): ConcordanceLevel {
  if (score >= PV_CONCORDANCE_THRESHOLDS.strong) return 'strong';
  if (score >= PV_CONCORDANCE_THRESHOLDS.moderate) return 'moderate';
  return 'weak';
}

export function getAlgorithmStatus(metric: string, value: number): 'positive' | 'borderline' | 'negative' {
  switch (metric) {
    case 'prr':    return value >= PV_SIGNAL_THRESHOLDS.prr ? 'positive' : value >= PV_BORDERLINE_THRESHOLDS.prrBorderline ? 'borderline' : 'negative';
    case 'ror':    return value >= PV_SIGNAL_THRESHOLDS.prr ? 'positive' : value >= PV_BORDERLINE_THRESHOLDS.rorBorderline ? 'borderline' : 'negative';
    case 'ic':     return value > PV_SIGNAL_THRESHOLDS.ic025 ? 'positive' : value > PV_BORDERLINE_THRESHOLDS.icBorderline ? 'borderline' : 'negative';
    case 'ebgm':   return value >= PV_SIGNAL_THRESHOLDS.eb05 ? 'positive' : value >= PV_BORDERLINE_THRESHOLDS.ebgmBorderline ? 'borderline' : 'negative';
    case 'chi_sq': return value >= PV_SIGNAL_THRESHOLDS.chiSquare ? 'positive' : value >= PV_BORDERLINE_THRESHOLDS.chiSquareBorderline ? 'borderline' : 'negative';
    default:       return 'negative';
  }
}
