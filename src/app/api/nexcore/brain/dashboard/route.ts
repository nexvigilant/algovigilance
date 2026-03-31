import { NextResponse } from "next/server";
import { queryBrain, isBrainAvailable } from "@/lib/brain-db";

/**
 * GET /api/nexcore/brain/dashboard
 *
 * Current brain state: beliefs, corrections, trust, patterns, health.
 * Single call for the brain dashboard UI.
 */
export async function GET() {
  if (!isBrainAvailable()) {
    return NextResponse.json(
      { error: "Brain database not available locally" },
      { status: 503 },
    );
  }

  try {
    const beliefs = queryBrain(`
      SELECT id, proposition, confidence, validation_count, category, updated_at
      FROM beliefs ORDER BY confidence DESC LIMIT 20
    `);

    const corrections = queryBrain(`
      SELECT id, context, correction, application_count, learned_at
      FROM corrections ORDER BY application_count DESC
    `);

    const trust = queryBrain(`
      SELECT domain, demonstrations, failures, updated_at
      FROM trust_accumulators ORDER BY demonstrations DESC
    `);

    const patterns = queryBrain(`
      SELECT id, pattern_type, description, occurrence_count, confidence, updated_at
      FROM patterns WHERE occurrence_count >= 3
      ORDER BY occurrence_count DESC LIMIT 20
    `);

    const antibodies = queryBrain(`
      SELECT id, name, threat_type, severity, description, applications
      FROM antibodies ORDER BY applications DESC LIMIT 10
    `);

    const healthRaw = queryBrain(`
      SELECT composite_score, captured_at
      FROM health_snapshots ORDER BY captured_at DESC LIMIT 1
    `);

    const sessionStats = queryBrain(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN outcome_verdict IN ('fully_demonstrated','partially_demonstrated','not_demonstrated') THEN 1 ELSE 0 END) as model_verdicts,
        SUM(CASE WHEN outcome_verdict LIKE '%heuristic%' THEN 1 ELSE 0 END) as heuristic,
        SUM(CASE WHEN outcome_verdict LIKE 'unmeasured%' THEN 1 ELSE 0 END) as unmeasured
      FROM autopsy_records
    `);

    const toolUsage = queryBrain(`
      SELECT tool_name, total_calls, failure_count, last_used
      FROM tool_usage WHERE total_calls >= 10
      ORDER BY total_calls DESC LIMIT 20
    `);

    return NextResponse.json({
      status: "ok",
      beliefs,
      corrections,
      trust,
      patterns,
      antibodies,
      health: healthRaw[0] ?? null,
      session_stats: sessionStats[0] ?? null,
      tool_usage: toolUsage,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to query brain database" },
      { status: 500 },
    );
  }
}
