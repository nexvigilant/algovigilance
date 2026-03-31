/**
 * station-client.ts
 *
 * Thin wrappers around the AlgoVigilance Station REST endpoint.
 * Each function POSTs to https://mcp.nexvigilant.com/tools/{tool_name}
 * and maps the raw response to the types this page expects.
 *
 * On any network or parse error the function returns null so callers
 * can fall back to demo data without crashing.
 */

import type { TopEvent, SuseCandidate } from "../types";

const STATION_BASE = "https://mcp.nexvigilant.com/tools";

/** Generic POST helper — returns the parsed JSON content or throws. */
async function callTool<T>(
  toolName: string,
  args: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${STATION_BASE}/${toolName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ arguments: args }),
    // Station tools are read-only, 10 s is generous
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Station ${toolName} returned HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// resolveRxCUI
// ---------------------------------------------------------------------------

interface RxNavSearchResponse {
  drugGroup?: {
    conceptGroup?: Array<{
      conceptProperties?: Array<{
        rxcui: string;
        name: string;
        tty?: string;
      }>;
    }>;
  };
  // Station may wrap inside a content array
  content?: Array<{ text?: string }>;
}

export async function resolveRxCUI(
  drugName: string,
): Promise<{ rxcui: string; canonicalName: string } | null> {
  try {
    const raw = await callTool<RxNavSearchResponse>(
      "rxnav_nlm_nih_gov_search_drugs",
      {
        drug_name: drugName,
      },
    );

    // Station tools return content as an array of {type, text} objects.
    // Parse the embedded JSON if present.
    const payload = extractPayload<RxNavSearchResponse>(raw);

    const groups = payload?.drugGroup?.conceptGroup ?? [];
    for (const group of groups) {
      const props = group.conceptProperties ?? [];
      for (const prop of props) {
        if (prop.rxcui && prop.name) {
          return { rxcui: prop.rxcui, canonicalName: prop.name };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// searchFaersEvents
// ---------------------------------------------------------------------------

interface FaersCountsResponse {
  results?: Array<{ term: string; count: number }>;
  content?: Array<{ text?: string }>;
}

export async function searchFaersEvents(drugName: string): Promise<TopEvent[]> {
  try {
    const raw = await callTool<FaersCountsResponse>(
      "api_fda_gov_get_drug_counts",
      {
        drug_name: drugName,
        count_field: "patient.reaction.reactionmeddrapt.exact",
        limit: 20,
      },
    );

    const payload = extractPayload<FaersCountsResponse>(raw);
    const results = payload?.results ?? [];

    return results.map((r) => ({
      event: r.term,
      count: r.count,
      // Disproportionality fields are populated later by computeDisproportionality.
      // Default to sentinel values so components don't crash on partial data.
      prr: 0,
      ror: 0,
      ic025: 0,
      chiSq: 0,
      onLabel: false,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// computeDisproportionality
// ---------------------------------------------------------------------------

interface OpenVigilResponse {
  prr?: number;
  ror?: number;
  ic025?: number;
  chi_square?: number;
  chiSq?: number;
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  // Alternate camelCase keys some proxies normalise to
  chi2?: number;
  content?: Array<{ text?: string }>;
}

export interface DisproportionalityResult {
  prr: number;
  ror: number;
  ic025: number;
  chiSq: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

export async function computeDisproportionality(
  drug: string,
  event: string,
): Promise<DisproportionalityResult | null> {
  try {
    const raw = await callTool<OpenVigilResponse>(
      "open-vigil_fr_compute_disproportionality",
      { drug, event },
    );

    const p = extractPayload<OpenVigilResponse>(raw);
    if (!p) return null;

    const chiSq = p.chi_square ?? p.chiSq ?? p.chi2 ?? 0;
    const prr = p.prr ?? 0;
    const ror = p.ror ?? 0;
    const ic025 = p.ic025 ?? 0;
    const a = p.a ?? 0;
    const b = p.b ?? 0;
    const c = p.c ?? 0;
    const d = p.d ?? 0;

    if (prr === 0 && ror === 0) return null;

    return { prr, ror, ic025, chiSq, a, b, c, d };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// getAdverseReactions
// ---------------------------------------------------------------------------

interface DailyMedResponse {
  adverse_reactions?: string;
  content?: Array<{ text?: string }>;
}

export async function getAdverseReactions(
  drugName: string,
): Promise<string | null> {
  try {
    const raw = await callTool<DailyMedResponse>(
      "dailymed_nlm_nih_gov_get_adverse_reactions",
      { drug_name: drugName },
    );

    const payload = extractPayload<DailyMedResponse>(raw);
    return payload?.adverse_reactions ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Station tools return either a direct JSON object OR a wrapper like:
 *   { content: [{ type: "text", text: "<json string>" }] }
 *
 * This helper unwraps both shapes.
 */
function extractPayload<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;

  // Direct shape
  if (!Array.isArray(obj.content)) return raw as T;

  // Wrapped shape — take first text content and JSON-parse it
  const items = obj.content as Array<Record<string, unknown>>;
  const first = items[0];
  if (!first) return null;

  if (typeof first.text === "string") {
    try {
      return JSON.parse(first.text) as T;
    } catch {
      // text is plain prose, not JSON — surface it as-is for string fields
      return { adverse_reactions: first.text } as unknown as T;
    }
  }

  // content item itself has the data
  return first as unknown as T;
}

// ---------------------------------------------------------------------------
// Verdict classifier (mirrors demo-data logic exactly)
// ---------------------------------------------------------------------------

/**
 * Classify a SUSE verdict from disproportionality measures.
 *
 * Thresholds derived from the demo-data examples and Evans criteria:
 *   CRITICAL  — PRR >= 100  OR  IC025 >= 6
 *   HIGH      — PRR >= 10   OR  IC025 >= 3
 *   INVESTIGATE — PRR >= 2  AND IC025 > 0 AND chiSq >= 3.841
 *   CLEARED   — below all thresholds
 */
export function classifyVerdict(
  prr: number,
  ic025: number,
  chiSq: number,
): SuseCandidate["verdict"] {
  if (prr >= 100 || ic025 >= 6) return "CRITICAL";
  if (prr >= 10 || ic025 >= 3) return "HIGH";
  if (prr >= 2 && ic025 > 0 && chiSq >= 3.841) return "INVESTIGATE";
  return "CLEARED";
}

/**
 * Returns true if the event name appears (case-insensitive substring) in
 * the adverse reactions label text.
 */
export function isOnLabel(event: string, labelText: string | null): boolean {
  if (!labelText) return false;
  return labelText.toLowerCase().includes(event.toLowerCase());
}
