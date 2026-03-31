/**
 * Shared Station MCP client for Academy interactive labs.
 * Calls mcp.nexvigilant.com — the Academy→Glass bridge.
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
        id: `academy-${Date.now()}`,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.result?.content?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export interface StationSignalResult {
  prr?: number;
  ror?: number;
  ic?: number;
  ebgm?: number;
  signal?: boolean;
  cases?: number;
}

/** Fetch live disproportionality from Station for a drug+event pair */
export async function fetchLiveSignal(
  drug: string,
  event: string,
): Promise<StationSignalResult | null> {
  const result = await callStation(
    "calculate_nexvigilant_com_compute_prr",
    { drug, event },
  );
  if (!result) return null;
  return {
    prr: Number(result.prr ?? result.value ?? 0),
    ror: Number(result.ror ?? 0),
    signal: Boolean(result.signal),
    cases: Number(result.cases ?? result.a ?? 0),
  };
}

/** Fetch live Naranjo causality assessment from Station */
export async function fetchLiveNaranjo(
  drug: string,
  event: string,
  answers: number[],
): Promise<{ score: number; category: string } | null> {
  const result = await callStation(
    "calculate_nexvigilant_com_assess_naranjo_causality",
    { drug, event, answers },
  );
  if (!result) return null;
  return {
    score: Number(result.score ?? result.total_score ?? 0),
    category: String(result.category ?? result.causality_category ?? "Unknown"),
  };
}

// ─── Microgram Decision Tools (V1 void closure) ─────────────────────────────

export interface MicrogramDecision {
  classification?: string;
  signal_detected?: boolean;
  causality?: string;
  action?: string;
  priority?: string;
  confidence?: number;
  deadline_days?: number;
  duration_us?: number;
}

/** Run the PRR signal microgram — classifies signal/no-signal from a PRR value */
export async function fetchSignalDecision(
  prr: number,
  chi_square?: number,
  case_count?: number,
): Promise<MicrogramDecision | null> {
  const result = await callStation(
    "microgram_nexvigilant_com_run_prr_signal",
    { prr, chi_square: chi_square ?? 0, case_count: case_count ?? 0 },
  );
  if (!result) return null;
  const output = (result.output ?? result) as Record<string, unknown>;
  return {
    classification: String(output.classification ?? "unknown"),
    signal_detected: Boolean(output.signal_detected),
    duration_us: Number(result.duration_us ?? 0),
  };
}

/** Run the Naranjo causality microgram — classifies causality from a Naranjo score */
export async function fetchCausalityDecision(
  naranjo_score: number,
): Promise<MicrogramDecision | null> {
  const result = await callStation(
    "microgram_nexvigilant_com_run_naranjo_quick",
    { naranjo_score },
  );
  if (!result) return null;
  const output = (result.output ?? result) as Record<string, unknown>;
  return {
    causality: String(output.causality ?? "unknown"),
    action: String(output.action ?? "unknown"),
    confidence: Number(output.confidence ?? 0),
    duration_us: Number(result.duration_us ?? 0),
  };
}

/** Run the full PV signal-to-action chain — PRR → causality → action in ~20μs */
export async function fetchSignalToAction(
  prr: number,
  naranjo_score: number,
  is_serious: boolean,
): Promise<MicrogramDecision | null> {
  const result = await callStation(
    "microgram_nexvigilant_com_run_pv_signal_to_action",
    { prr, naranjo_score, is_serious },
  );
  if (!result) return null;
  const output = (result.final_output ?? result) as Record<string, unknown>;
  return {
    classification: String(output.classification ?? "unknown"),
    signal_detected: Boolean(output.signal_detected),
    causality: String(output.causality ?? "unknown"),
    action: String(output.action ?? "unknown"),
    priority: String(output.priority ?? "unknown"),
    deadline_days: Number(output.deadline_days ?? 0),
    duration_us: Number(result.total_duration_us ?? 0),
  };
}

/** Run any microgram by name — exposes the full 1,384-program fleet */
export async function fetchMicrogramDecision(
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  return callStation("microgram_nexvigilant_com_run_microgram", { name, ...args });
}

// ─── Data Tools ──────────────────────────────────────────────────────────────

/** Fetch FAERS adverse event search results from Station */
export async function fetchFaersEvents(
  drug: string,
  limit: number = 10,
): Promise<Array<{ term: string; count: number }>> {
  const result = await callStation(
    "api_fda_gov_search_adverse_events",
    { drug, limit },
  );
  if (!result) return [];
  const events = (result.events ?? result.results) as
    | Array<Record<string, unknown>>
    | undefined;
  if (!Array.isArray(events)) return [];
  return events
    .filter((e) => e.term || e.patient)
    .slice(0, limit)
    .map((e) => ({
      term: String(
        e.term ??
          ((e.patient as Record<string, unknown>)?.reaction as Array<Record<string, unknown>> | undefined)?.[0]?.reactionmeddrapt ??
          "Unknown",
      ),
      count: Number(e.count ?? 1),
    }));
}
