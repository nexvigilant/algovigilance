import { NextResponse } from "next/server";
import { queryBrain, isBrainAvailable } from "@/lib/brain-db";

/**
 * GET /api/nexcore/brain/decisions
 *
 * List decision audit entries. Filterable by risk_level.
 */
export async function GET(request: Request) {
  if (!isBrainAvailable()) {
    return NextResponse.json(
      { error: "Brain database not available locally" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const riskLevel = searchParams.get("risk_level");

  let whereClause = "";
  if (riskLevel) {
    const safe = riskLevel.replace(/[^A-Z]/g, "");
    whereClause = `WHERE risk_level = '${safe}'`;
  }

  try {
    const rows = queryBrain(`
      SELECT id, timestamp, session_id, tool, action, target, risk_level, reversible
      FROM decision_audit
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT 100
    `);

    return NextResponse.json({
      status: "ok",
      count: rows.length,
      decisions: rows,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to query brain database" },
      { status: 500 },
    );
  }
}
