import { NextResponse } from "next/server";
import { queryBrain, isBrainAvailable } from "@/lib/brain-db";

interface SessionRow {
  id: string;
  project: string;
  description: string;
  created_at: string;
  outcome_verdict: string | null;
  lesson_count: number | null;
  pattern_count: number | null;
  g1_proposition: string | null;
  tool_calls_total: number | null;
  files_modified: number | null;
  commits: number | null;
  artifact_count: number | null;
}

/**
 * GET /api/nexcore/brain/sessions
 *
 * Paginated session list with autopsy data and artifact counts.
 * Query params:
 *   - offset: number (default 0)
 *   - limit: number (default 50, max 200)
 *   - verdict: filter by outcome_verdict
 *   - search: search descriptions
 */
export async function GET(request: Request) {
  if (!isBrainAvailable()) {
    return NextResponse.json(
      { error: "Brain database not available locally" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const verdict = searchParams.get("verdict");
  const search = searchParams.get("search");

  const conditions: string[] = ["1=1"];
  if (verdict) {
    const safe = verdict.replace(/[^a-z_]/g, "");
    conditions.push(`a.outcome_verdict = '${safe}'`);
  }
  if (search) {
    const safe = search.replace(/'/g, "''").slice(0, 100);
    conditions.push(`s.description LIKE '%${safe}%'`);
  }

  try {
    const rows = queryBrain<SessionRow>(`
      SELECT
        s.id, s.project, s.description, s.created_at,
        a.outcome_verdict, a.lesson_count, a.pattern_count,
        a.g1_proposition, a.tool_calls_total, a.files_modified, a.commits,
        (SELECT COUNT(*) FROM artifacts ar WHERE ar.session_id = s.id) as artifact_count
      FROM sessions s
      LEFT JOIN autopsy_records a ON s.id = a.session_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const totalRows = queryBrain<{ total: number }>(`
      SELECT COUNT(*) as total
      FROM sessions s
      LEFT JOIN autopsy_records a ON s.id = a.session_id
      WHERE ${conditions.join(" AND ")}
    `);

    return NextResponse.json({
      status: "ok",
      total: totalRows[0]?.total ?? 0,
      offset,
      limit,
      sessions: rows,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to query sessions" },
      { status: 500 },
    );
  }
}
