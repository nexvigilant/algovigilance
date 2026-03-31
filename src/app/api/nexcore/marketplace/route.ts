import { NextResponse } from "next/server";

// Marketplace API — list available micrograms.
// Development: reads from rsk-core filesystem.
// Production: will proxy to NexCore API at port 3030.

const NEXCORE_URL = process.env.NEXCORE_URL || "http://localhost:3030";

export async function GET() {
  try {
    // Try NexCore backend first (when running)
    const res = await fetch(`${NEXCORE_URL}/api/marketplace/list`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // NexCore not available — return static fallback
  }

  // Fallback: return metadata about the ecosystem
  // (source: rsk mcg test-all output from ~/Projects/rsk-core/rsk/micrograms/)
  return NextResponse.json({
    status: "static",
    message:
      "NexCore backend not available — returning static marketplace data",
    ecosystem: {
      total_micrograms: 415,
      total_tests: 4527,
      total_chains: 19,
      operators: [
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "contains",
        "not_contains",
        "matches",
        "is_null",
        "is_not_null",
      ],
    },
  });
}
