import { NextResponse } from "next/server";
import { queryBrain, isBrainAvailable } from "@/lib/brain-db";

/**
 * GET /api/nexcore/brain/token-efficiency
 *
 * Token efficiency trends: tokens per action by session.
 */
export async function GET() {
  if (!isBrainAvailable()) {
    return NextResponse.json(
      { error: "Brain database not available locally" },
      { status: 503 },
    );
  }

  try {
    const rows = queryBrain(`
      SELECT session_id, action_count, total_tokens,
        CASE WHEN action_count > 0
          THEN ROUND(1.0 * total_tokens / action_count, 1)
          ELSE 0 END as tokens_per_action,
        datetime(started_at, 'unixepoch') as started_at
      FROM token_efficiency
      WHERE action_count > 0
      ORDER BY started_at DESC
      LIMIT 100
    `);

    const avgTpa =
      rows.length > 0
        ? rows.reduce(
            (sum, r) =>
              sum + ((r as Record<string, number>).tokens_per_action ?? 0),
            0,
          ) / rows.length
        : 0;

    return NextResponse.json({
      status: "ok",
      count: rows.length,
      avg_tokens_per_action: Math.round(avgTpa),
      sessions: rows,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to query brain database" },
      { status: 500 },
    );
  }
}
