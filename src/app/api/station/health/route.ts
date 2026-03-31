import { NextResponse } from "next/server";

/**
 * Station Health Proxy — proxies https://mcp.nexvigilant.com/health
 * to avoid CORS issues in the browser and add a short server-side cache.
 *
 * Cache: 30-second stale-while-revalidate so the 30s client refresh
 * doesn't hammer the production endpoint directly.
 */

const STATION_HEALTH_URL = "https://mcp.nexvigilant.com/health";

export interface DomainHealth {
  domain: string;
  avg_duration_ms: number;
  call_count: number;
  error_count: number;
  top_tools: string[];
}

export interface StationHealth {
  avg_duration_ms: number;
  latency_p99_ms: number;
  error_rate_pct: number;
  slo_status: "ok" | "warn" | "critical";
  domains: DomainHealth[];
  total_calls: number;
  total_errors: number;
  uptime_seconds: number;
}

const FALLBACK: StationHealth = {
  avg_duration_ms: 0,
  latency_p99_ms: 0,
  error_rate_pct: 0,
  slo_status: "ok",
  domains: [],
  total_calls: 0,
  total_errors: 0,
  uptime_seconds: 0,
};

export async function GET() {
  try {
    const res = await fetch(STATION_HEALTH_URL, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ...FALLBACK, _error: `Upstream returned ${res.status}` },
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const data: StationHealth = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=10",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream unreachable";
    return NextResponse.json(
      { ...FALLBACK, _error: message },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
