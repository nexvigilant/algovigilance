import { type NextRequest, NextResponse } from "next/server";

/**
 * Station Topology API — feeds the Observatory 3D visualization.
 *
 * Returns the Station tool graph as nodes (tools) and edges (domain relationships)
 * for rendering in ForceGraph3D.
 *
 * GET /api/station/topology
 * GET /api/station/topology?domain=pv-engine  (filter by domain)
 */

const STATION_URL =
  process.env.STATION_URL || "https://mcp.nexvigilant.com";

interface ToolNode {
  id: string;
  name: string;
  domain: string;
  group: number;
}

interface DomainEdge {
  source: string;
  target: string;
  weight: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainFilter = searchParams.get("domain");

  try {
    // Fetch tool list from Station
    const res = await fetch(`${STATION_URL}/tools`, {
      headers: { "User-Agent": "AlgoVigilance-Observatory/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Station returned ${res.status}` },
        { status: 502 },
      );
    }

    const tools: Array<{ name: string; description?: string }> = await res.json();

    // Parse tools into domain-grouped nodes
    const domainGroups = new Map<string, number>();
    let groupCounter = 0;
    const nodes: ToolNode[] = [];
    const domainToolCounts = new Map<string, number>();

    for (const tool of tools) {
      // Extract domain from tool name: "pv-engine_nexvigilant_com_assess_naranjo" → "pv-engine"
      const parts = tool.name.split("_nexvigilant_com_");
      const domain = parts.length > 1
        ? parts[0].replace(/_/g, ".")
        : tool.name.split("_")[0];

      // Apply domain filter if specified
      if (domainFilter && !domain.includes(domainFilter)) continue;

      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, groupCounter++);
      }

      nodes.push({
        id: tool.name,
        name: tool.name.split("_com_").pop()?.replace(/_/g, " ") ?? tool.name,
        domain,
        group: domainGroups.get(domain) ?? 0,
      });

      domainToolCounts.set(domain, (domainToolCounts.get(domain) ?? 0) + 1);
    }

    // Build edges between tools in the same domain (intra-domain)
    // and between domains that share common tool patterns (inter-domain)
    const edges: DomainEdge[] = [];
    const domains = Array.from(domainGroups.keys());

    // Inter-domain edges: connect domains that share tool name patterns
    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const domA = domains[i];
        const domB = domains[j];
        const toolsA = nodes.filter((n) => n.domain === domA).map((n) => n.name);
        const toolsB = nodes.filter((n) => n.domain === domB).map((n) => n.name);

        // Check for shared suffixes (e.g., both have "search", "detect", etc.)
        const suffixesA = new Set(toolsA.map((t) => t.split("_").pop()));
        const suffixesB = new Set(toolsB.map((t) => t.split("_").pop()));
        let shared = 0;
        for (const s of suffixesA) {
          if (s && suffixesB.has(s)) shared++;
        }

        if (shared >= 2) {
          edges.push({
            source: `domain:${domA}`,
            target: `domain:${domB}`,
            weight: shared,
          });
        }
      }
    }

    // Domain summary nodes
    const domainNodes = domains.map((d) => ({
      id: `domain:${d}`,
      name: d,
      domain: d,
      group: domainGroups.get(d) ?? 0,
      toolCount: domainToolCounts.get(d) ?? 0,
      isDomain: true,
    }));

    return NextResponse.json(
      {
        nodes: domainFilter ? nodes : domainNodes,
        edges,
        tools: domainFilter ? nodes : undefined,
        meta: {
          totalTools: tools.length,
          totalDomains: domains.length,
          filteredTools: nodes.length,
          station: STATION_URL,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Topology fetch failed" },
      { status: 502 },
    );
  }
}
