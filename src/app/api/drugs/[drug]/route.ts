/**
 * Drug Safety API — agent-friendly JSON endpoint.
 *
 * GET /api/drugs/metformin → returns structured safety data from Station.
 * Designed for AI agents, MCP clients, and programmatic consumers.
 *
 * Response includes: identity, top adverse events, disproportionality signals,
 * label warnings, and links to deeper investigation tools.
 */

const STATION = "https://mcp.nexvigilant.com";

async function callStation(
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
        id: `api-${Date.now()}`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.result?.content?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ drug: string }> },
) {
  const { drug } = await params;

  // Parallel fetch: FAERS events + DailyMed labels + RxNav identity
  const [faersData, labelData, identityData] = await Promise.all([
    callStation("api_fda_gov_search_adverse_events", { drug, limit: 10 }),
    callStation("dailymed_nlm_nih_gov_get_adverse_reactions", {
      drug_name: drug,
    }),
    callStation("rxnav_nlm_nih_gov_get_rxcui", { name: drug }),
  ]);

  // Extract top events
  const events: { term: string; count: number }[] = [];
  if (faersData && Array.isArray(faersData.events)) {
    for (const ev of faersData.events.slice(0, 10)) {
      if (ev.term && ev.count) {
        events.push({ term: String(ev.term), count: Number(ev.count) });
      }
    }
  } else if (faersData && Array.isArray(faersData.results)) {
    for (const ev of faersData.results.slice(0, 10)) {
      const term = ev.patient?.reaction?.[0]?.reactionmeddrapt ?? ev.term;
      if (term)
        events.push({ term: String(term), count: Number(ev.count ?? 1) });
    }
  }

  // Compute PRR for top 5 events
  const signals = await Promise.all(
    events.slice(0, 5).map(async (ev) => {
      const result = await callStation(
        "calculate_nexvigilant_com_compute_prr",
        {
          drug,
          event: ev.term,
        },
      );
      if (!result) return { event: ev.term, prr: null, signal: false };
      const prr = Number(result.prr ?? result.value ?? 0);
      return { event: ev.term, prr, signal: prr > 2 };
    }),
  );

  const response = {
    drug,
    rxcui: identityData?.rxcui ?? null,
    source: "AlgoVigilance Station (mcp.nexvigilant.com)",
    timestamp: new Date().toISOString(),
    adverse_events: events,
    signals: signals.filter((s) => s.prr !== null),
    label_warnings: labelData
      ? ((labelData.adverse_reactions as string) ?? "").slice(0, 2000)
      : null,
    links: {
      profile: `https://algovigilance.net/drugs/${drug}`,
      live_feed: "https://algovigilance.net/live-feed",
      station: "https://mcp.nexvigilant.com",
      mcp_endpoint: "https://mcp.nexvigilant.com/mcp",
    },
    _meta: {
      powered_by: "AlgoVigilance Station",
      tools_used: [
        "api_fda_gov_search_adverse_events",
        "dailymed_nlm_nih_gov_get_adverse_reactions",
        "rxnav_nlm_nih_gov_get_rxcui",
        "calculate_nexvigilant_com_compute_prr",
      ],
      agent_friendly: true,
    },
  };

  return Response.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
