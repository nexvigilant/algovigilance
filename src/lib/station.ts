/**
 * AlgoVigilance Station client — server-side fetch to mcp.nexvigilant.com REST API.
 *
 * Station exposes tools via POST /tools/{name} with JSON body = arguments.
 * Response: { content: [{ type: "text", text: "<JSON>" }] }
 *
 * Use in API routes (server-side only) — never import from client components.
 */

const STATION_URL =
  process.env.NEXVIGILANT_STATION_URL ?? "https://mcp.nexvigilant.com";

export interface StationResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

/**
 * Call a Station tool and return the parsed JSON result.
 * Throws on network errors, HTTP errors, or tool errors.
 */
export async function stationCall<T>(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(`${STATION_URL}/tools/${toolName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Station ${toolName}: HTTP ${res.status}`);
  }

  const data: StationResponse = await res.json();

  if (data.isError) {
    const text = data.content?.[0]?.text ?? "Unknown error";
    throw new Error(`Station ${toolName}: ${text}`);
  }

  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error(`Station ${toolName}: empty response`);
  }

  return JSON.parse(text) as T;
}
