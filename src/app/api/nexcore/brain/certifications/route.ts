import { NextResponse } from "next/server";
import { queryBrain, isBrainAvailable } from "@/lib/brain-db";

/**
 * GET /api/nexcore/brain/certifications
 *
 * List Academy certifications. Filterable by level and active status.
 */
export async function GET(request: Request) {
  if (!isBrainAvailable()) {
    return NextResponse.json(
      { error: "Brain database not available locally" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") !== "false";

  const whereClause = activeOnly ? "WHERE valid_until > datetime('now')" : "";

  try {
    const rows = queryBrain(`
      SELECT id, agent_id, track, level, modules_passed, modules_failed,
             intake_score, certified_at, valid_until, session_id, created_at
      FROM academy_certifications
      ${whereClause}
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      status: "ok",
      count: rows.length,
      certifications: rows,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to query brain database" },
      { status: 500 },
    );
  }
}
