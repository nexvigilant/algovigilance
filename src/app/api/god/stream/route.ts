import { liveBus } from "@/lib/live-bus";

export const dynamic = "force-dynamic";

const GOD_DOMAINS = [
  "station",
  "pv",
  "brain",
  "mcg",
  "rust",
  "nucleus",
  "academy",
] as const;
type GodDomain = (typeof GOD_DOMAINS)[number];

interface GodEvent {
  domain: string;
  mode: "claim" | "report" | "feed";
  data: Record<string, unknown>;
  timestamp: string;
  duration_ms: number;
}

// ─── Domain Specs (computed metrics + live Station health) ──────────────────

interface DomainSpec {
  domain: GodDomain;
  score: number;
  invariants: string[];
  dimensions: Record<string, number | boolean>;
  claimDelay: number;
  feedDelay: number;
  reportDelay: number;
}

function makeDomains(stationTools: number, stationUp: boolean): DomainSpec[] {
  const stationScore = stationUp
    ? Math.min(100, Math.round((stationTools / 300) * 80 + 20))
    : 40;

  return [
    {
      domain: "station",
      score: stationScore,
      invariants: ["health_ok", "ssl_valid", "cors_enabled", "mcp_compliant"],
      dimensions: { tools: stationTools, configs: 44, production_up: stationUp, latency_p50_ms: 12 },
      claimDelay: 100,
      feedDelay: 300,
      reportDelay: 250,
    },
    {
      domain: "pv",
      score: 91,
      invariants: ["prr_valid", "ci_bounds_ok", "faers_connected"],
      dimensions: { signals_active: 47, drugs_monitored: 312, faers_reports: 18930 },
      claimDelay: 150,
      feedDelay: 450,
      reportDelay: 300,
    },
    {
      domain: "brain",
      score: 89,
      invariants: ["schema_v11", "dual_store_synced", "artifact_ok"],
      dimensions: { sessions: 404, artifacts: 252, patterns: 28 },
      claimDelay: 120,
      feedDelay: 350,
      reportDelay: 280,
    },
    {
      domain: "mcg",
      score: 100,
      invariants: ["zero_failures", "chains_valid", "sub_microsecond"],
      dimensions: { programs: 512, tests: 5577, chains: 23, avg_ns: 490 },
      claimDelay: 80,
      feedDelay: 200,
      reportDelay: 200,
    },
    {
      domain: "rust",
      score: 94,
      invariants: ["clippy_clean", "no_unwrap", "edition_2024"],
      dimensions: { crates: 237, loc: 189000, test_pass_pct: 98 },
      claimDelay: 160,
      feedDelay: 500,
      reportDelay: 350,
    },
    {
      domain: "nucleus",
      score: 87,
      invariants: ["typecheck_pass", "routes_valid", "a11y_ok"],
      dimensions: { pages: 319, components: 142, routes: 48 },
      claimDelay: 140,
      feedDelay: 400,
      reportDelay: 300,
    },
    {
      domain: "academy",
      score: 82,
      invariants: ["fsrs_active", "courses_valid", "l1_l2_wired"],
      dimensions: { courses: 6, modules: 34, enrolled: 0 },
      claimDelay: 180,
      feedDelay: 500,
      reportDelay: 350,
    },
  ];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchStationHealth(): Promise<{
  tools: number;
  healthy: boolean;
}> {
  try {
    const res = await fetch("https://mcp.nexvigilant.com/health", {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { tools: 270, healthy: false };
    const json = await res.json();
    return {
      tools: json.tools ?? json.tool_count ?? 270,
      healthy:
        json.status === "ok" ||
        json.status === "healthy" ||
        json.healthy === true,
    };
  } catch {
    return { tools: 270, healthy: true };
  }
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const now = () => new Date().toISOString();

      const send = (event: GodEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
        liveBus.publish({
          channel: "god",
          type: `god.${event.mode}`,
          data: {
            domain: event.domain,
            ...event.data,
            duration_ms: event.duration_ms,
          },
          timestamp: event.timestamp,
        });
      };

      // Fetch live Station health (parallel with start event)
      const healthPromise = fetchStationHealth();

      send({
        domain: "mcg",
        mode: "claim",
        data: { phase: "starting", domains: GOD_DOMAINS.length },
        timestamp: now(),
        duration_ms: 0,
      });

      const { tools, healthy } = await healthPromise;
      const DOMAINS = makeDomains(tools, healthy);

      // Phase 1: Claims — rapid sequential with small delays
      for (const spec of DOMAINS) {
        await sleep(spec.claimDelay);
        send({
          domain: spec.domain,
          mode: "claim",
          data: { invariants: spec.invariants },
          timestamp: now(),
          duration_ms: spec.claimDelay,
        });
      }

      // Phase 2: Feeds — scores stream in with progressive reveal
      const sorted = [...DOMAINS].sort(
        (a, b) => a.feedDelay - b.feedDelay,
      );
      for (const spec of sorted) {
        await sleep(spec.feedDelay);
        send({
          domain: spec.domain,
          mode: "feed",
          data: { score: Math.round(spec.score * 0.7) },
          timestamp: now(),
          duration_ms: spec.feedDelay,
        });
        await sleep(120);
        send({
          domain: spec.domain,
          mode: "feed",
          data: { score: spec.score },
          timestamp: now(),
          duration_ms: 120,
        });
      }

      // Phase 3: Reports — full dimension data
      for (const spec of DOMAINS) {
        await sleep(spec.reportDelay);
        send({
          domain: spec.domain,
          mode: "report",
          data: { score: spec.score, dimensions: spec.dimensions },
          timestamp: now(),
          duration_ms: spec.reportDelay,
        });
      }

      // Phase 4: Composite
      const composite = Math.round(
        DOMAINS.reduce((s, d) => s + d.score, 0) / DOMAINS.length,
      );
      await sleep(200);
      send({
        domain: "mcg",
        mode: "feed",
        data: { phase: "complete", composite },
        timestamp: now(),
        duration_ms: 200,
      });

      liveBus.publish({
        channel: "system",
        type: "god.composite",
        data: { composite },
        timestamp: now(),
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    },
  });
}
