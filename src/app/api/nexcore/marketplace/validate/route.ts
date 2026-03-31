import { NextRequest, NextResponse } from "next/server";

// Marketplace validation API — runs the 7-gate check on uploaded YAML.
// Proxies to NexCore which has the rsk binary for actual execution.
// (source: rsk mcg test command, microgram/mod.rs validation logic)

const NEXCORE_URL = process.env.NEXCORE_URL || "http://localhost:3030";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    if (!body.trim()) {
      return NextResponse.json(
        { error: "Empty request body — provide YAML content" },
        { status: 400 },
      );
    }

    // Forward to NexCore for real validation
    const res = await fetch(`${NEXCORE_URL}/api/marketplace/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "text/yaml",
        Accept: "application/json",
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // NexCore returned an error
    const errorText = await res.text().catch(() => "Unknown error");
    return NextResponse.json(
      {
        error: `Validation backend returned ${res.status}`,
        detail: errorText,
      },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Validation backend unavailable",
        message:
          "NexCore API at port 3030 is not running. Start it with: cargo run -p nexcore-api --release",
      },
      { status: 503 },
    );
  }
}
