import { NextResponse } from "next/server";
import { queryBrain, isBrainAvailable } from "@/lib/brain-db";

/**
 * GET /api/nexcore/brain/sessions/:id
 *
 * Full session detail: session metadata + autopsy record + artifacts + tool usage.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBrainAvailable()) {
    return NextResponse.json(
      { error: "Brain database not available locally" },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const safeId = id.replace(/[^a-z0-9-]/g, "");

  try {
    const sessions = queryBrain(`
      SELECT id, project, description, created_at
      FROM sessions WHERE id = '${safeId}'
    `);

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const autopsy = queryBrain(`
      SELECT
        outcome_verdict, directive_id, phase, phase_type,
        g1_proposition, g2_specificity, g3_singularity,
        lesson_count, pattern_count,
        tool_calls_total, mcp_calls, files_modified, commits,
        tokens_total, chain_level,
        rc_pdp_proposition, rc_pdp_so_what, rc_pdp_why, rc_hook_gap
      FROM autopsy_records WHERE session_id = '${safeId}'
    `);

    const artifacts = queryBrain(`
      SELECT name, artifact_type, summary, created_at, updated_at, current_version
      FROM artifacts WHERE session_id = '${safeId}'
      ORDER BY created_at DESC
    `);

    const toolUsage = queryBrain(`
      SELECT tool_name, total_calls, failure_count, last_used
      FROM tool_usage WHERE session_id = '${safeId}'
      ORDER BY total_calls DESC
    `);

    return NextResponse.json({
      status: "ok",
      session: sessions[0],
      autopsy: autopsy[0] ?? null,
      artifacts,
      tool_usage: toolUsage,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load session detail" },
      { status: 500 },
    );
  }
}
