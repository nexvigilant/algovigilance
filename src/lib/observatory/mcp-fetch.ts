/**
 * Shared MCP fetch utility for Observatory explorer hooks.
 *
 * Primary: AlgoVigilance Station REST API at mcp.nexvigilant.com
 *   Response: { content: [{ type: "text", text: "<JSON>" }] }
 *
 * Fallback: Local nexcore-api gateway at /api/nexcore
 *   Response: { tool, success, result: { content: [{ type: "text", text: "<JSON>" }] } }
 *
 * parseMcpContent<T> handles both shapes transparently.
 * mcpFetch<T> tries Station first, falls back to local.
 *
 * Primitive formula: μ(∂) — mapping applied at the gateway boundary.
 */

const STATION_URL = "https://mcp.nexvigilant.com";

// ─── Response Shapes ─────────────────────────────────────────────────────────

/** Station REST response: content array at top level. */
interface StationResponse {
  content?: Array<{ type: string; text: string }>;
}

/** Legacy nexcore-api gateway response: wrapped in tool/success/result. */
interface GatewayResponse {
  tool: string;
  success: boolean;
  result: {
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
}

/** Union for backward compatibility. */
export type McpGatewayResponse = GatewayResponse;

// ─── Parsing ─────────────────────────────────────────────────────────────────

/** Extract text from either Station or Gateway response shape. */
function extractText(body: unknown): string | null {
  const obj = body as Record<string, unknown>;

  // Station shape: { content: [{ text: "..." }] }
  if (Array.isArray(obj.content)) {
    const first = (obj.content as Array<Record<string, unknown>>)[0];
    if (first?.text && typeof first.text === "string") return first.text;
  }

  // Gateway shape: { result: { content: [{ text: "..." }] } }
  const result = obj.result as Record<string, unknown> | undefined;
  if (result && Array.isArray(result.content)) {
    const first = (result.content as Array<Record<string, unknown>>)[0];
    if (first?.text && typeof first.text === "string") return first.text;
  }

  return null;
}

/** Extract typed JSON from any MCP response shape. */
export function parseMcpText<T>(body: unknown): T {
  const text = extractText(body);
  if (!text) throw new Error("MCP response: no text content");
  return JSON.parse(text) as T;
}

/** Extract raw text from any MCP response shape. */
export function parseMcpRawText(body: unknown): string {
  const text = extractText(body);
  if (!text) throw new Error("MCP response: no text content");
  return text;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

/** POST to Station REST API, fall back to local nexcore-api proxy. */
export async function mcpFetch<T>(
  tool: string,
  params: Record<string, unknown>,
  signal: AbortSignal,
): Promise<T> {
  // Primary: Station cloud
  try {
    const res = await fetch(`${STATION_URL}/tools/${tool}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal,
    });
    if (res.ok) {
      return parseMcpText<T>(await res.json());
    }
  } catch {
    // Station unavailable — fall through to local
  }

  // Fallback: local nexcore-api proxy
  const res = await fetch(`/api/nexcore/api/v1/mcp/${tool}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ params }),
    signal,
  });
  if (!res.ok) throw new Error(`MCP ${tool}: HTTP ${res.status}`);
  return parseMcpText<T>(await res.json());
}

/** POST to Station REST API for raw text, fall back to local. */
export async function mcpFetchText(
  tool: string,
  params: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<string> {
  // Primary: Station cloud
  try {
    const res = await fetch(`${STATION_URL}/tools/${tool}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      ...(signal && { signal }),
    });
    if (res.ok) {
      return parseMcpRawText(await res.json());
    }
  } catch {
    // Station unavailable — fall through to local
  }

  // Fallback: local nexcore-api proxy
  const res = await fetch(`/api/nexcore/api/v1/mcp/${tool}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ params }),
    ...(signal && { signal }),
  });
  if (!res.ok) throw new Error(`MCP ${tool}: HTTP ${res.status}`);
  return parseMcpRawText(await res.json());
}
