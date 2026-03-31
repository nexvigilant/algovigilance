/**
 * Station Client — public interface for AlgoVigilance Station MCP tools.
 * Re-exports from the Glass station-client, plus wizard-specific aliases.
 */
export {
  callStation,
  resolveDrug,
  searchFaers,
  computeDisproportionality,
  getDrugLabel,
  computeNaranjo,
  computeWhoUmc,
  searchCaseReports,
  getFaersContext,
  searchPubMed,
} from "@/app/nucleus/glass/station-client";

export type {
  DrugIdentity,
  FaersEvent,
  DisproportionalityResult,
  LabelSection,
  PubMedArticle,
  NaranjoResult,
  WhoUmcResult,
  CaseReport,
} from "@/app/nucleus/glass/station-client";

import { computeNaranjo, computeDisproportionality } from "@/app/nucleus/glass/station-client";
import type { NaranjoResult, DisproportionalityResult } from "@/app/nucleus/glass/station-client";

// ─── Wizard-specific aliases ──────────────────────────────────────────────────

export type StationNaranjoResult = NaranjoResult;
export type StationSignalResult = DisproportionalityResult;

export async function stationComputeNaranjo(answers: number[]): Promise<NaranjoResult | null> {
  const answersObj: Record<string, number> = {};
  answers.forEach((a, i) => { answersObj[`q${i + 1}`] = a; });
  return computeNaranjo("unknown", "unknown", answersObj);
}

export async function stationComputeSignal(drug: string, event: string): Promise<DisproportionalityResult | null> {
  return computeDisproportionality(drug, event);
}
