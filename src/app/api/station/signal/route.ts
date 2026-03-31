import { type NextRequest, NextResponse } from "next/server";

/**
 * Station Signal API — Academy→Glass bridge for live PV signal detection.
 *
 * Proxies drug safety queries to the production AlgoVigilance Station at
 * mcp.nexvigilant.com. Returns structured signal data that the Signal
 * Investigation Lab can render directly.
 *
 * This is the Nervous System wire that connects Academy (Anatomy) to
 * Station (Glass) — Move 0 of the AlgoVigilance strategy.
 *
 * GET /api/station/signal?drug=metformin&event=lactic+acidosis
 */

const STATION_URL =
  process.env.STATION_URL || "https://mcp.nexvigilant.com/rpc";

interface StationToolCall {
  tool: string;
  args: Record<string, unknown>;
}

async function callStation(
  tool: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(STATION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: tool, arguments: args },
    }),
  });

  if (!response.ok) {
    throw new Error(`Station returned ${response.status}`);
  }

  const data = await response.json();
  const content = data?.result?.content?.[0]?.text;
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      return { raw: content };
    }
  }
  return data?.result ?? data;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const drug = searchParams.get("drug");
  const event = searchParams.get("event");

  if (!drug) {
    return NextResponse.json(
      { error: "Missing required parameter: drug" },
      { status: 400 },
    );
  }

  try {
    // Run parallel queries to Station
    const queries: StationToolCall[] = [
      {
        tool: "rxnav_nlm_nih_gov_get_rxcui",
        args: { name: drug },
      },
      {
        tool: "api_fda_gov_search_adverse_events",
        args: { drug, limit: 10 },
      },
    ];

    // Add disproportionality if event specified
    if (event) {
      queries.push({
        tool: "open-vigil_fr_compute_disproportionality",
        args: { drug, event },
      });
      queries.push({
        tool: "pubmed_ncbi_nlm_nih_gov_search_signal_literature",
        args: { drug, event },
      });
    }

    const results = await Promise.allSettled(
      queries.map((q) => callStation(q.tool, q.args)),
    );

    const response: Record<string, unknown> = {
      drug,
      event: event ?? null,
      timestamp: new Date().toISOString(),
      station: "mcp.nexvigilant.com",
    };

    // Map results to named fields
    const fields = ["rxnav", "faers", "disproportionality", "literature"];
    results.forEach((result, i) => {
      const key = fields[i];
      if (key) {
        response[key] =
          result.status === "fulfilled" ? result.value : { error: "failed" };
      }
    });

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Station query failed" },
      { status: 502 },
    );
  }
}
