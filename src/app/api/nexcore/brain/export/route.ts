import { NextResponse } from "next/server";
import {
  queryBrain,
  isBrainAvailable,
  BrainUnavailableError,
} from "@/lib/brain-db";

interface SessionExportRow {
  session_id: string;
  project: string;
  description: string;
  created_at: string;
  outcome_verdict: string;
  tool_calls_total: number;
  mcp_calls: number;
  files_modified: number;
  commits: number;
  lesson_count: number;
  pattern_count: number;
  g1_proposition: string;
  tokens_total: number;
}

/**
 * GET /api/nexcore/brain/export
 *
 * Export sessions joined with autopsy records and artifacts.
 * Query params:
 *   - format: "json" (default) | "csv"
 *   - limit: number (default 100, max 1000)
 *   - verdict: filter by outcome_verdict
 */
export async function GET(request: Request) {
  if (!isBrainAvailable()) {
    return NextResponse.json(
      { error: "Brain database not available locally" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const limitParam = Math.min(
    parseInt(searchParams.get("limit") ?? "100", 10),
    1000,
  );
  const verdict = searchParams.get("verdict");

  let whereClause = "";
  if (verdict) {
    // Sanitize verdict to prevent injection
    const safeVerdict = verdict.replace(/[^a-z_]/g, "");
    whereClause = `AND a.outcome_verdict = '${safeVerdict}'`;
  }

  try {
    const rows = queryBrain<SessionExportRow>(`
      SELECT
        s.id as session_id, s.project, s.description, s.created_at,
        a.outcome_verdict, a.tool_calls_total, a.mcp_calls,
        a.files_modified, a.commits, a.lesson_count, a.pattern_count,
        a.g1_proposition, a.tokens_total
      FROM sessions s
      LEFT JOIN autopsy_records a ON s.id = a.session_id
      WHERE 1=1 ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ${limitParam}
    `);

    if (format === "csv") {
      if (rows.length === 0) {
        return new Response("No data", { status: 200 });
      }
      const headers = Object.keys(rows[0]);
      const csvLines = [
        headers.join(","),
        ...rows.map((row) =>
          headers
            .map((h) => {
              const val = String(
                (row as unknown as Record<string, unknown>)[h] ?? "",
              );
              return val.includes(",") || val.includes('"')
                ? `"${val.replace(/"/g, '""')}"`
                : val;
            })
            .join(","),
        ),
      ];

      return new Response(csvLines.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition":
            "attachment; filename=brain-sessions-export.csv",
        },
      });
    }

    return NextResponse.json({
      status: "ok",
      count: rows.length,
      sessions: rows,
    });
  } catch (err) {
    if (err instanceof BrainUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to query brain database" },
      { status: 500 },
    );
  }
}
