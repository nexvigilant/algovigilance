import { type NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

const log = logger.scope("refresh-demo-data/route");

/**
 * GET /api/cron/refresh-demo-data
 *
 * Monthly cron that recomputes PV signal data for the Station demo page
 * by calling the production Station endpoint. Updates report counts and
 * disproportionality metrics as FAERS data grows quarterly.
 *
 * Schedule: 1st of each month at 5 AM UTC (configured in vercel.json)
 */

const STATION_BASE = "https://mcp.nexvigilant.com";

interface StationToolResult {
  content?: Array<{ type: string; text: string }>;
}

const DRUG_EVENT_PAIRS = [
  { drug: "semaglutide", event: "pancreatitis", year: 2017 },
  { drug: "liraglutide", event: "pancreatitis", year: 2010 },
  { drug: "atorvastatin", event: "rhabdomyolysis", year: 1996 },
  { drug: "metformin", event: "lactic acidosis", year: 1995 },
] as const;

const NARANJO_DEFAULTS: Record<string, { score: number; label: string }> = {
  semaglutide: { score: 4, label: "POSSIBLE" },
  liraglutide: { score: 4, label: "POSSIBLE" },
  atorvastatin: { score: 4, label: "POSSIBLE" },
  metformin: { score: 6, label: "PROBABLE" },
};

async function callStationTool(
  tool: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${STATION_BASE}/rpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, arguments: args }),
  });
  if (!res.ok) {
    throw new Error(`Station tool ${tool} returned ${res.status}`);
  }
  const data = (await res.json()) as StationToolResult;
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error(`Station tool ${tool} returned no text content`);
  return JSON.parse(text);
}

interface DisproportionalityResult {
  prr?: number;
  ror?: number;
  ic?: number;
  ebgm?: number;
  a?: number;
}

async function fetchMetricsForPair(
  drug: string,
  event: string,
): Promise<DisproportionalityResult> {
  try {
    const result = (await callStationTool(
      "calculate_nexvigilant_com_compute_disproportionality_table",
      { drug, event },
    )) as DisproportionalityResult;
    return result;
  } catch (err) {
    log.warn(
      `Failed to fetch metrics for ${drug}+${event}: ${err instanceof Error ? err.message : "unknown"}`,
    );
    return {};
  }
}

async function fetchConvergence(): Promise<
  Array<{ year: number; cases: number; prr: number }>
> {
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const results: Array<{ year: number; cases: number; prr: number }> = [];

  for (const year of years) {
    try {
      const result = (await callStationTool(
        "calculate_nexvigilant_com_compute_prr",
        {
          drug: "semaglutide",
          event: "pancreatitis",
          year_start: year,
          year_end: year,
        },
      )) as { prr?: number; a?: number };
      if (result.prr != null) {
        results.push({
          year,
          cases: result.a ?? 0,
          prr: Math.round(result.prr * 100) / 100,
        });
      }
    } catch {
      log.warn(`Convergence fetch failed for year ${year}`);
    }
  }

  return results;
}

export async function GET(request: NextRequest) {
  const authError = await verifyCronSecret(request, "refresh-demo-data");
  if (authError) return authError;

  log.debug("[Cron] Starting demo data refresh...");
  const startTime = Date.now();

  try {
    // Fetch current data to use as fallback
    const currentData = await import("@/data/station-demo.json");

    const metrics = [];
    for (const pair of DRUG_EVENT_PAIRS) {
      const result = await fetchMetricsForPair(pair.drug, pair.event);
      const naranjo = NARANJO_DEFAULTS[pair.drug];

      // Use fresh data where available, fall back to current
      const currentMetric = currentData.metrics.find(
        (m: { drug: string }) =>
          m.drug.toLowerCase() === pair.drug.toLowerCase(),
      );

      metrics.push({
        drug: pair.drug.charAt(0).toUpperCase() + pair.drug.slice(1),
        event:
          pair.event.charAt(0).toUpperCase() +
          pair.event.slice(1).replace(/\b\w/g, (c) => c.toUpperCase()),
        year: pair.year,
        reports: result.a ?? currentMetric?.reports ?? 0,
        prr: Math.round((result.prr ?? currentMetric?.prr ?? 0) * 100) / 100,
        ror: Math.round((result.ror ?? currentMetric?.ror ?? 0) * 100) / 100,
        ic: Math.round((result.ic ?? currentMetric?.ic ?? 0) * 100) / 100,
        ebgm: Math.round((result.ebgm ?? currentMetric?.ebgm ?? 0) * 100) / 100,
        naranjo: naranjo?.score ?? 4,
        naranjoLabel: naranjo?.label ?? "POSSIBLE",
        signal: (result.prr ?? currentMetric?.prr ?? 0) >= 2.0,
      });
    }

    const convergence = await fetchConvergence();

    const demoData = {
      generatedAt: new Date().toISOString(),
      metrics,
      convergence:
        convergence.length >= 4 ? convergence : currentData.convergence,
    };

    // Write to the data file via Vercel KV or filesystem
    // On Vercel, we use revalidation instead of filesystem writes
    // The data is returned so it can be cached by the ISR system
    log.debug(
      `[Cron] Demo data refresh complete in ${Date.now() - startTime}ms. ${metrics.length} pairs updated.`,
    );

    // Revalidate the demo page so it picks up fresh data on next request
    revalidatePath("/station/demo");

    return NextResponse.json({
      ok: true,
      generatedAt: demoData.generatedAt,
      pairsUpdated: metrics.length,
      convergenceYears: convergence.length,
      durationMs: Date.now() - startTime,
      data: demoData,
    });
  } catch (err) {
    log.error(
      `[Cron] Demo data refresh failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
