import { type NextRequest, NextResponse } from "next/server";

/**
 * Station API Route — Bridges Nucleus (Anatomy) to AlgoVigilance Station (Nervous System).
 *
 * Calls mcp.nexvigilant.com via HTTP JSON-RPC. Works on Vercel serverless
 * and local dev — no binary spawn needed.
 *
 * POST /api/station { tool: "tool_name", args: { ... } }
 * GET  /api/station?tool=tool_name&param=value
 */

const STATION_URL =
  process.env.STATION_URL || "https://mcp.nexvigilant.com";

async function callStation(
  toolName: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; result?: unknown; error?: string; latency_ms?: number }> {
  const start = Date.now();

  const res = await fetch(`${STATION_URL}/rpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  });

  const latency_ms = Date.now() - start;

  if (!res.ok) {
    return { ok: false, error: `Station returned ${res.status}`, latency_ms };
  }

  const data = await res.json();

  if (data.error) {
    return { ok: false, error: data.error.message, latency_ms };
  }

  // Extract text content from MCP result
  const content = data.result?.content;
  if (content?.[0]?.text) {
    try {
      const parsed = JSON.parse(content[0].text);
      return { ok: true, result: parsed, latency_ms };
    } catch {
      return { ok: true, result: content[0].text, latency_ms };
    }
  }

  return { ok: true, result: data.result, latency_ms };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, args } = body as {
      tool: string;
      args: Record<string, unknown>;
    };

    if (!tool || typeof tool !== "string") {
      return NextResponse.json(
        { ok: false, error: 'Missing "tool" field' },
        { status: 400 },
      );
    }

    const result = await callStation(tool, args || {});
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Station call failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tool = searchParams.get("tool");
  if (!tool) {
    return NextResponse.json(
      { ok: false, error: 'Missing "tool" query parameter' },
      { status: 400 },
    );
  }

  const args: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== "tool") args[key] = value;
  });

  try {
    const result = await callStation(tool, args);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Station call failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
