import { NextResponse } from "next/server";
import { queryBrain, isBrainAvailable } from "@/lib/brain-db";

/**
 * GET /api/nexcore/brain/skill-proposals
 *
 * List skill proposals from the pattern-to-skill pipeline.
 * Filterable by status (pending, promoted, rejected).
 */
export async function GET(request: Request) {
  if (!isBrainAvailable()) {
    return NextResponse.json(
      { error: "Brain database not available locally" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let whereClause = "";
  if (status) {
    const safe = status.replace(/[^a-z]/g, "");
    whereClause = `WHERE status = '${safe}'`;
  }

  try {
    const rows = queryBrain(`
      SELECT id, pattern_id, proposed_name, proposed_description,
             confidence, status, created_at, promoted_at, skill_path
      FROM skill_proposals
      ${whereClause}
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      status: "ok",
      count: rows.length,
      proposals: rows,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to query brain database" },
      { status: 500 },
    );
  }
}
