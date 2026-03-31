/**
 * Glass Station Client — bridges Glass labs to AlgoVigilance Station MCP tools.
 * Extended from Academy's station-client with Glass-specific workflows.
 */

const STATION = "https://mcp.nexvigilant.com";

export async function callStation(
  tool: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${STATION}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name: tool, arguments: args },
        id: `glass-${Date.now()}`,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.result?.content?.[0]?.text;
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

// ─── Signal Investigation Workflow ───────────────────────────────────────────

export interface DrugIdentity {
  rxcui: string;
  name: string;
  synonym?: string;
}

export interface FaersEvent {
  term: string;
  count: number;
}

export interface DisproportionalityResult {
  drug: string;
  event: string;
  prr?: number;
  ror?: number;
  ic?: number;
  ebgm?: number;
  signal: boolean;
  cases?: number;
}

export interface LabelSection {
  section: string;
  text: string;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  journal?: string;
  year?: string;
}

/** Step 1: Resolve drug name to RxCUI */
export async function resolveDrug(name: string): Promise<DrugIdentity | null> {
  const result = await callStation("rxnav_nlm_nih_gov_get_rxcui", { name });
  if (!result) return null;
  return {
    rxcui: String(result.rxcui ?? result.id ?? ""),
    name: String(result.name ?? name),
    synonym: result.synonym ? String(result.synonym) : undefined,
  };
}

/** Step 2: Search FAERS for top adverse events */
export async function searchFaers(
  drug: string,
  limit = 15,
): Promise<FaersEvent[]> {
  // Fetch cases — use 50 for reasonable aggregation without timeout
  const result = await callStation("api_fda_gov_search_adverse_events", {
    drug,
    limit: 50,
  });
  if (!result) {
    return [];
  }


  // The response has results[] where each case has reactions[]
  const cases = result.results as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(cases) || cases.length === 0) return [];

  // Aggregate reactions across all cases
  const counts: Record<string, number> = {};
  for (const c of cases) {
    const reactions = c.reactions;
    if (Array.isArray(reactions)) {
      for (const r of reactions) {
        const term = String(r).trim();
        if (term && term !== "Unknown" && term.length > 1) {
          counts[term] = (counts[term] ?? 0) + 1;
        }
      }
    }
  }

  // Sort by frequency, return top N
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));

  return sorted.length > 0 ? sorted : [];
}

/** Step 3: Compute disproportionality for a drug-event pair */
export async function computeDisproportionality(
  drug: string,
  event: string,
): Promise<DisproportionalityResult | null> {
  // Call all four metrics
  const [prr, ror, ic, ebgm] = await Promise.all([
    callStation("calculate_nexvigilant_com_compute_prr", { drug, event }),
    callStation("calculate_nexvigilant_com_compute_ror", { drug, event }),
    callStation("calculate_nexvigilant_com_compute_ic", { drug, event }),
    callStation("calculate_nexvigilant_com_compute_ebgm", { drug, event }),
  ]);

  if (!prr && !ror && !ic && !ebgm) return null;

  const prrVal = prr ? Number(prr.prr ?? prr.value ?? 0) : undefined;
  const rorVal = ror ? Number(ror.ror ?? ror.value ?? 0) : undefined;
  const icVal = ic ? Number(ic.ic ?? ic.value ?? 0) : undefined;
  const ebgmVal = ebgm ? Number(ebgm.ebgm ?? ebgm.value ?? 0) : undefined;

  // Signal if PRR > 2 or ROR > 2 or IC > 0 or EBGM > 2
  const isSignal =
    (prrVal !== undefined && prrVal > 2) ||
    (rorVal !== undefined && rorVal > 2) ||
    (icVal !== undefined && icVal > 0) ||
    (ebgmVal !== undefined && ebgmVal > 2);

  return {
    drug,
    event,
    prr: prrVal,
    ror: rorVal,
    ic: icVal,
    ebgm: ebgmVal,
    signal: isSignal,
    cases: prr ? Number(prr.a ?? prr.cases ?? 0) : undefined,
  };
}

/** Step 4: Get drug label sections (adverse reactions, boxed warning) */
export async function getDrugLabel(
  drug: string,
): Promise<LabelSection[]> {
  const [adr, boxed] = await Promise.all([
    callStation("dailymed_nlm_nih_gov_get_adverse_reactions", { drug }),
    callStation("dailymed_nlm_nih_gov_get_boxed_warning", { drug }),
  ]);

  const sections: LabelSection[] = [];
  if (adr) {
    sections.push({
      section: "Adverse Reactions",
      text: String(adr.text ?? adr.adverse_reactions ?? "No data available"),
    });
  }
  if (boxed) {
    sections.push({
      section: "Boxed Warning",
      text: String(boxed.text ?? boxed.warning ?? "No boxed warning"),
    });
  }
  return sections;
}

// ─── Causality Assessment Workflow ──────────────────────────────────────────

export interface NaranjoResult {
  score: number;
  category: string;
  answers: Record<string, number>;
}

export interface WhoUmcResult {
  category: string;
  description: string;
  criteria_met: string[];
}

export interface CaseReport {
  pmid: string;
  title: string;
  journal?: string;
  year?: string;
}

/** Compute Naranjo causality score */
export async function computeNaranjo(
  drug: string,
  event: string,
  answers: Record<string, number>,
): Promise<NaranjoResult | null> {
  const result = await callStation("calculate_nexvigilant_com_assess_naranjo_causality", {
    drug,
    event,
    ...answers,
  });
  if (!result) return null;
  return {
    score: Number(result.score ?? result.total_score ?? 0),
    category: String(result.category ?? result.causality_category ?? "Unknown"),
    answers: (result.answers as Record<string, number>) ?? answers,
  };
}

/** Compute WHO-UMC causality assessment */
export async function computeWhoUmc(
  drug: string,
  event: string,
  params: {
    time_relationship: boolean;
    dechallenge: boolean;
    rechallenge: boolean;
    alternative_causes: boolean;
  },
): Promise<WhoUmcResult | null> {
  const result = await callStation("calculate_nexvigilant_com_assess_who_umc_causality", {
    drug,
    event,
    ...params,
  });
  if (!result) return null;
  return {
    category: String(result.category ?? result.assessment ?? "Unassessable"),
    description: String(result.description ?? result.explanation ?? ""),
    criteria_met: Array.isArray(result.criteria_met) ? result.criteria_met.map(String) : [],
  };
}

/** Search PubMed for case reports */
export async function searchCaseReports(
  drug: string,
  event: string,
  limit = 5,
): Promise<CaseReport[]> {
  const result = await callStation(
    "pubmed_ncbi_nlm_nih_gov_search_case_reports",
    { drug, event, limit },
  );
  if (!result) return [];
  const articles = (result.articles ?? result.results) as
    | Array<Record<string, unknown>>
    | undefined;
  if (!Array.isArray(articles)) return [];
  return articles.slice(0, limit).map((a) => ({
    pmid: String(a.pmid ?? a.id ?? ""),
    title: String(a.title ?? "Untitled"),
    journal: a.journal ? String(a.journal) : undefined,
    year: a.year ? String(a.year) : undefined,
  }));
}

/** Get FAERS event counts for context */
export async function getFaersContext(
  drug: string,
  event: string,
): Promise<{ cases: number; total: number } | null> {
  const result = await callStation("api_fda_gov_search_adverse_events", {
    drug,
    event,
    limit: 1,
  });
  if (!result) return null;
  return {
    cases: Number(result.total ?? (result.meta as Record<string, unknown>)?.results ?? 0),
    total: Number(result.total ?? 0),
  };
}

/** Step 5: Search PubMed for safety literature */
export async function searchPubMed(
  drug: string,
  event: string,
  limit = 5,
): Promise<PubMedArticle[]> {
  const result = await callStation(
    "pubmed_ncbi_nlm_nih_gov_search_signal_literature",
    { drug, event, limit },
  );
  if (!result) return [];
  const articles = (result.articles ?? result.results) as
    | Array<Record<string, unknown>>
    | undefined;
  if (!Array.isArray(articles)) return [];
  return articles.slice(0, limit).map((a) => ({
    pmid: String(a.pmid ?? a.id ?? ""),
    title: String(a.title ?? "Untitled"),
    journal: a.journal ? String(a.journal) : undefined,
    year: a.year ? String(a.year) : undefined,
  }));
}

// ─── Aliases for wizard imports ───────────────────────────────────────────────

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

