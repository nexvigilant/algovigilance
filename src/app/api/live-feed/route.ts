import { NextResponse } from "next/server";
import { liveBus } from "@/lib/live-bus";

const STATION_URL = "https://mcp.nexvigilant.com";
const NEXCORE_API = "http://localhost:3030";

// Drug-event pairs for parallel signal processing demo
const SIGNAL_TARGETS = [
  { drug: "metformin", event: "Lactic acidosis", harm: "A" },
  { drug: "semaglutide", event: "Pancreatitis", harm: "A" },
  { drug: "warfarin", event: "Haemorrhage", harm: "A" },
  { drug: "ciprofloxacin", event: "Tendon rupture", harm: "B" },
  { drug: "atorvastatin", event: "Rhabdomyolysis", harm: "B" },
  { drug: "pembrolizumab", event: "Pneumonitis", harm: "B" },
  { drug: "carbamazepine", event: "Stevens-Johnson syndrome", harm: "B" },
  { drug: "isotretinoin", event: "Depression", harm: "C" },
];

interface StationHealth {
  status: string;
  tools: number;
  configs: number;
  telemetry: {
    total_calls: number;
    error_rate_pct: number;
    uptime_seconds: number;
    trend: string;
    calls_per_minute: number;
    latency_p99_ms: number;
  };
  git_sha: string;
}

interface SignalResult {
  drug: string;
  event: string;
  harmType: string;
  prr: number | null;
  ror: number | null;
  ic: number | null;
  caseCount: number | null;
  signal: boolean;
  verdict: string;
  route: string;
  latencyMs: number;
}

interface LiveFeedFrame {
  type: "health" | "signal" | "batch_complete" | "mesh_topology";
  timestamp: string;
  station?: {
    status: string;
    tools: number;
    configs: number;
    calls: number;
    errorRate: number;
    uptime: number;
    trend: string;
    callsPerMinute: number;
    latencyP99: number;
    gitSha: string;
  };
  signal?: SignalResult;
  batch?: {
    total: number;
    completed: number;
    signals: number;
    avgLatencyMs: number;
  };
  mesh?: {
    nodes: Array<{ id: string; state: string; neighbor_count: number }>;
    edges: Array<{ from: string; to: string; quality: number }>;
    node_count: number;
    edge_count: number;
    route_count: number;
  };
}

async function fetchStationHealth(): Promise<StationHealth | null> {
  try {
    const resp = await fetch(`${STATION_URL}/health`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!resp.ok) return null;
    return (await resp.json()) as StationHealth;
  } catch {
    return null;
  }
}

async function runSignalDetection(
  drug: string,
  event: string,
  harmType: string,
): Promise<SignalResult> {
  const start = Date.now();
  try {
    const resp = await fetch(`${STATION_URL}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "open-vigil_fr_compute_disproportionality",
          arguments: { drug, event },
        },
      }),
    });

    const latencyMs = Date.now() - start;

    if (!resp.ok) {
      return {
        drug,
        event,
        harmType,
        prr: null,
        ror: null,
        ic: null,
        caseCount: null,
        signal: false,
        verdict: "unavailable",
        route: "retry",
        latencyMs,
      };
    }

    const rpcResponse = await resp.json();
    // Extract text content from JSON-RPC response
    const textContent = rpcResponse?.result?.content?.find(
      (c: { type: string }) => c.type === "text",
    )?.text;
    const data = textContent ? JSON.parse(textContent) : {};
    const scores = data?.scores ?? {};
    const contingency = data?.contingency_table ?? {};

    const prr = scores.PRR ?? null;
    const ror = scores.ROR ?? null;
    const ic = scores.IC ?? null;
    const caseCount = contingency.a_drug_event ?? null;
    const isSignal = data?.signal_assessment === "signal_detected";

    // Triage verdict based on our microgram logic
    let verdict = "no_signal";
    let route = "archive";

    if (isSignal && prr !== null) {
      if (prr >= 10) {
        verdict = "strong_signal";
        route = "causality_assessment";
      } else if (prr >= 2) {
        verdict = "signal_detected";
        route = "signal_investigation";
      }
    }

    if (harmType === "B" && isSignal) {
      verdict = "idiosyncratic_signal";
      route = "causality_assessment";
    }

    return {
      drug,
      event,
      harmType,
      prr,
      ror,
      ic,
      caseCount,
      signal: isSignal,
      verdict,
      route,
      latencyMs,
    };
  } catch {
    return {
      drug,
      event,
      harmType,
      prr: null,
      ror: null,
      ic: null,
      caseCount: null,
      signal: false,
      verdict: "timeout",
      route: "retry",
      latencyMs: Date.now() - start,
    };
  }
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (frame: LiveFeedFrame) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(frame)}\n\n`),
          );
          // Dual-publish to live bus
          const channel = frame.type === "signal" ? "signal" : "station";
          liveBus.publish({
            channel,
            type: `live.${frame.type}`,
            data: frame as unknown as Record<string, unknown>,
            timestamp: frame.timestamp,
          });
        } catch {
          // stream closed
        }
      };

      // Phase 1: Station health
      const health = await fetchStationHealth();
      send({
        type: "health",
        timestamp: new Date().toISOString(),
        station: health
          ? {
              status: health.status,
              tools: health.tools,
              configs: health.configs,
              calls: health.telemetry?.total_calls ?? 0,
              errorRate: health.telemetry?.error_rate_pct ?? 0,
              uptime: health.telemetry?.uptime_seconds ?? 0,
              trend: health.telemetry?.trend ?? "unknown",
              callsPerMinute: health.telemetry?.calls_per_minute ?? 0,
              latencyP99: health.telemetry?.latency_p99_ms ?? 0,
              gitSha: health.git_sha ?? "unknown",
            }
          : undefined,
      });

      // Phase 2: Parallel signal processing — fire all 8 drugs simultaneously
      // Stream each result as it arrives
      const shuffled = [...SIGNAL_TARGETS].sort(() => Math.random() - 0.5);
      let completed = 0;
      let signalCount = 0;
      let totalLatency = 0;

      const promises = shuffled.map(async (target) => {
        const result = await runSignalDetection(
          target.drug,
          target.event,
          target.harm,
        );
        completed++;
        if (result.signal) signalCount++;
        totalLatency += result.latencyMs;

        send({
          type: "signal",
          timestamp: new Date().toISOString(),
          signal: result,
        });

        return result;
      });

      const results = await Promise.all(promises);

      // Phase 2.5: Mesh topology — simulate signal processing mesh
      // Each drug is a node. Edges connect drugs that share the same route.
      // Collector node aggregates all signals.
      try {
        const drugNodes = results.map((r) => r.drug);
        const allNodes = [...drugNodes, "collector"];

        // Build edges: drugs with same verdict route connect via collector
        const meshEdges: Array<{
          from: string;
          to: string;
          latency_ms: number;
          reliability: number;
        }> = [];

        for (const r of results) {
          // Every drug → collector
          meshEdges.push({
            from: r.drug,
            to: "collector",
            latency_ms: r.latencyMs,
            reliability: r.signal ? 0.95 : 0.7,
          });
        }

        // Cross-connect drugs sharing the same route (signal collaboration)
        for (let i = 0; i < results.length; i++) {
          for (let j = i + 1; j < results.length; j++) {
            if (results[i].route === results[j].route && results[i].signal && results[j].signal) {
              meshEdges.push({
                from: results[i].drug,
                to: results[j].drug,
                latency_ms: (results[i].latencyMs + results[j].latencyMs) / 2,
                reliability: 0.9,
              });
            }
          }
        }

        const meshResp = await fetch(`${NEXCORE_API}/api/v1/mesh/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({ nodes: allNodes, edges: meshEdges }),
        });

        if (meshResp.ok) {
          const meshData = await meshResp.json();
          send({
            type: "mesh_topology",
            timestamp: new Date().toISOString(),
            mesh: {
              nodes: allNodes.map((id) => ({
                id,
                state: id === "collector" ? "aggregating" : results.find((r) => r.drug === id)?.signal ? "signal" : "clear",
                neighbor_count: meshEdges.filter((e) => e.from === id || e.to === id).length,
              })),
              edges: meshEdges.map((e) => ({
                from: e.from,
                to: e.to,
                quality: meshData.routes?.find(
                  (r: { destination: string; next_hop: string }) =>
                    r.destination === e.to && r.next_hop === e.from,
                )?.quality_score ?? e.reliability,
              })),
              node_count: allNodes.length,
              edge_count: meshEdges.length,
              route_count: meshData.route_count ?? meshEdges.length,
            },
          });
        }
      } catch {
        // Mesh simulation optional — NexCore API might not be running
      }

      // Phase 3: Batch summary
      send({
        type: "batch_complete",
        timestamp: new Date().toISOString(),
        batch: {
          total: shuffled.length,
          completed,
          signals: signalCount,
          avgLatencyMs: Math.round(totalLatency / completed),
        },
      });

      // Phase 4: Continue streaming health every 30s
      const interval = setInterval(async () => {
        try {
          const h = await fetchStationHealth();
          send({
            type: "health",
            timestamp: new Date().toISOString(),
            station: h
              ? {
                  status: h.status,
                  tools: h.tools,
                  configs: h.configs,
                  calls: h.telemetry?.total_calls ?? 0,
                  errorRate: h.telemetry?.error_rate_pct ?? 0,
                  uptime: h.telemetry?.uptime_seconds ?? 0,
                  trend: h.telemetry?.trend ?? "unknown",
                  callsPerMinute: h.telemetry?.calls_per_minute ?? 0,
                  latencyP99: h.telemetry?.latency_p99_ms ?? 0,
                  gitSha: h.git_sha ?? "unknown",
                }
              : undefined,
          });
        } catch {
          clearInterval(interval);
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      }, 30_000);

      setTimeout(() => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }, 10 * 60 * 1000);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
