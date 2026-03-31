import { NextResponse } from "next/server";

/**
 * Live infrastructure counts for the Station Demo page.
 * Fetches from production endpoint and caches for 24 hours.
 * Falls back to last-known values if the endpoint is unreachable.
 */

const STATION_TOOLS_URL = "https://mcp.nexvigilant.com/tools";
const STATION_HEALTH_URL = "https://mcp.nexvigilant.com/health";

interface DemoStats {
  publicToolCount: number;
  stationHealthy: boolean;
  computedAt: string;
}

const FALLBACK_STATS: DemoStats = {
  publicToolCount: 199,
  stationHealthy: true,
  computedAt: "2026-03-26T00:00:00Z",
};

async function fetchLiveStats(): Promise<DemoStats> {
  const [toolsRes, healthRes] = await Promise.allSettled([
    fetch(STATION_TOOLS_URL, { next: { revalidate: 86400 } }),
    fetch(STATION_HEALTH_URL, { next: { revalidate: 86400 } }),
  ]);

  let publicToolCount = FALLBACK_STATS.publicToolCount;
  let stationHealthy = FALLBACK_STATS.stationHealthy;

  if (toolsRes.status === "fulfilled" && toolsRes.value.ok) {
    const tools: unknown[] = await toolsRes.value.json();
    publicToolCount = tools.length;
  }

  if (healthRes.status === "fulfilled") {
    stationHealthy = healthRes.value.ok;
  }

  return {
    publicToolCount,
    stationHealthy,
    computedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const stats = await fetchLiveStats();
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json(FALLBACK_STATS);
  }
}
