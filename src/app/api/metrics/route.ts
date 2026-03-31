import { exec } from "child_process";
import { liveBus } from "@/lib/live-bus";
import { logger } from "@/lib/logger";
import {
  computeSigmaPct,
  computeToolSuccessRate,
  computeTestPassRate,
  computeTokenEfficiency,
  computeDecisionRisk,
} from "@/lib/metrics-compute";

const log = logger.scope("api/metrics");

export const dynamic = "force-dynamic";

const DB = `${process.env.HOME}/.claude/brain/brain.db`;

function sql(query: string): Promise<string> {
  return new Promise((resolve) => {
    exec(
      `sqlite3 -cmd ".timeout 5000" "${DB}" "${query}"`,
      { timeout: 10_000 },
      (err, stdout) => {
        if (err) {
          log.warn("sql query failed", {
            query: query.slice(0, 120),
            error: err.message,
          });
        }
        resolve(err ? "" : stdout.trim());
      },
    );
  });
}

function sqlJson(query: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve) => {
    exec(
      `sqlite3 -cmd ".timeout 5000" -json "${DB}" "${query}"`,
      { timeout: 10_000 },
      (err, stdout) => {
        if (err) {
          log.warn("sqlJson query failed", {
            query: query.slice(0, 120),
            error: err.message,
          });
          return resolve([]);
        }
        if (!stdout.trim()) return resolve([]);
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch (parseErr) {
          log.warn("sqlJson parse failed", {
            query: query.slice(0, 120),
            stdout: stdout.slice(0, 200),
          });
          resolve([]);
        }
      },
    );
  });
}

function shell(cmd: string): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 10_000 }, (err, stdout) => {
      if (err) {
        log.warn("shell command failed", {
          cmd: cmd.slice(0, 120),
          error: err.message,
        });
      }
      resolve(err ? "" : stdout.trim());
    });
  });
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (
        channel: string,
        type: string,
        data: Record<string, unknown>,
      ) => {
        const event = {
          channel,
          type,
          data,
          timestamp: new Date().toISOString(),
        };
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          /* closed */
        }
        liveBus.publish({
          channel: channel as "system",
          type,
          data,
          timestamp: event.timestamp,
        });
      };

      // --- 1. Session & Verdict Metrics ---
      const [sessionCount, verdictBreakdown, recentVerdicts, sessions24h] =
        await Promise.all([
          sql("SELECT COUNT(*) FROM sessions;"),
          sqlJson(`
          SELECT outcome_verdict as verdict, COUNT(*) as count
          FROM autopsy_records WHERE outcome_verdict IS NOT NULL
          GROUP BY outcome_verdict ORDER BY count DESC;
        `),
          sql(`
          SELECT COUNT(*) FROM autopsy_records
          WHERE outcome_verdict IN ('fully_demonstrated','partially_demonstrated','not_demonstrated')
          AND session_id IN (SELECT id FROM sessions ORDER BY created_at DESC LIMIT 20);
        `),
          sql(
            "SELECT COUNT(*) FROM sessions WHERE created_at >= datetime('now', '-24 hours');",
          ),
        ]);

      const totalSessions = parseInt(sessionCount, 10) || 0;
      const { modelVerdicts, sigmaPct } = computeSigmaPct(
        totalSessions,
        verdictBreakdown,
      );

      send("system", "metrics.sessions", {
        total: totalSessions,
        last_24h: parseInt(sessions24h, 10) || 0,
        model_verdicts: modelVerdicts,
        sigma_pct: sigmaPct,
        recent_20_verdicts: parseInt(recentVerdicts, 10) || 0,
        verdict_breakdown: verdictBreakdown,
      });

      // --- 2. Tool Usage Metrics ---
      const toolUsage = await sqlJson(`
        SELECT tool_name, total_calls, success_count, failure_count
        FROM tool_usage ORDER BY total_calls DESC LIMIT 15;
      `);

      const { totalCalls, successRate } = computeToolSuccessRate(toolUsage);

      send("system", "metrics.tools", {
        total_calls: totalCalls,
        success_rate_pct: successRate,
        top_tools: toolUsage.slice(0, 10),
      });

      // --- 3. Test Health ---
      const testHealth = await sqlJson(`
        SELECT crate_name, SUM(passed) as passed, SUM(failed) as failed, COUNT(*) as runs
        FROM test_runs GROUP BY crate_name ORDER BY SUM(passed) DESC LIMIT 10;
      `);

      const { totalPassed, totalFailed, passRate } =
        computeTestPassRate(testHealth);

      send("system", "metrics.tests", {
        total_passed: totalPassed,
        total_failed: totalFailed,
        pass_rate_pct: passRate,
        crate_breakdown: testHealth,
      });

      // --- 4. Knowledge Health ---
      const [
        beliefs,
        patterns,
        corrections,
        antibodies,
        artifacts,
        trustDomains,
      ] = await Promise.all([
        sql("SELECT COUNT(*) FROM beliefs;"),
        sql("SELECT COUNT(*) FROM patterns;"),
        sql("SELECT COUNT(*) FROM corrections WHERE status = 'active';"),
        sql("SELECT COUNT(*) FROM antibodies;"),
        sql("SELECT COUNT(*) FROM artifacts;"),
        sql("SELECT COUNT(*) FROM trust_accumulators;"),
      ]);

      send("system", "metrics.knowledge", {
        beliefs: parseInt(beliefs, 10) || 0,
        patterns: parseInt(patterns, 10) || 0,
        active_corrections: parseInt(corrections, 10) || 0,
        antibodies: parseInt(antibodies, 10) || 0,
        artifacts: parseInt(artifacts, 10) || 0,
        trust_domains: parseInt(trustDomains, 10) || 0,
      });

      // --- 5. Flywheel Score ---
      const flywheel = await sqlJson(`
        SELECT score, verdict, rim, momentum, friction, gyro, elastic,
               auto_pct, sessions_total, sessions_24h, hooks, skills, antibodies
        FROM flywheel_evaluations ORDER BY id DESC LIMIT 1;
      `);

      const flywheelTrend = await sqlJson(`
        SELECT score FROM flywheel_evaluations ORDER BY id DESC LIMIT 10;
      `);

      send("system", "metrics.flywheel", {
        current: flywheel[0] ?? {},
        trend: flywheelTrend.map((r) => Number(r.score)),
      });

      // --- 6. Infrastructure Counts ---
      const [hookCount, skillCount, agentCount, mcgCount] = await Promise.all([
        shell("find ~/.claude/hooks/bash -name '*.sh' 2>/dev/null | wc -l"),
        shell("ls ~/.claude/skills/ 2>/dev/null | wc -l"),
        shell("ls ~/.claude/agents/*.md 2>/dev/null | wc -l"),
        shell(
          "find ~/Projects/rsk-core/rsk/micrograms -name '*.yaml' -type f 2>/dev/null | wc -l",
        ),
      ]);

      send("system", "metrics.infrastructure", {
        hooks: parseInt(hookCount, 10) || 0,
        skills: parseInt(skillCount, 10) || 0,
        agents: parseInt(agentCount, 10) || 0,
        micrograms: parseInt(mcgCount, 10) || 0,
      });

      // --- 7. Conservation Law ---
      const boundaryPct = 97; // ∂ — from memory
      const voidPct = 67; // ∅
      const existencePct = 34; // ∃
      send("system", "metrics.conservation", {
        boundary_pct: boundaryPct,
        void_pct: voidPct,
        existence_pct: existencePct,
        sigma_pct: sigmaPct,
        formula: "∃ = ∂(×(ς, ∅))",
      });

      // --- 8. Token Efficiency ---
      const tokenEff = await sqlJson(`
        SELECT SUM(action_count) as total_actions, SUM(total_tokens) as total_tokens
        FROM token_efficiency;
      `);

      const { actions, tokens, tokensPerAction } =
        computeTokenEfficiency(tokenEff);

      send("system", "metrics.tokens", {
        total_actions: actions,
        total_tokens: tokens,
        tokens_per_action: tokensPerAction,
      });

      // --- 9. Decision Audit ---
      const decisions = await sqlJson(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk,
          SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) as medium_risk
        FROM decision_audit;
      `);

      const {
        total: decTotal,
        highRisk,
        mediumRisk,
      } = computeDecisionRisk(decisions);

      send("system", "metrics.decisions", {
        total: decTotal,
        high_risk: highRisk,
        medium_risk: mediumRisk,
      });

      // --- 10. Velocity ---
      const velocity = await sqlJson(`
        SELECT session_band, momentum, commits, files_modified, tool_calls
        FROM flywheel_velocity ORDER BY id DESC LIMIT 5;
      `);

      send("system", "metrics.velocity", {
        recent: velocity,
      });

      // --- Done ---
      send("system", "metrics.complete", {
        metrics_count: 10,
        phase: "complete",
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    },
  });
}
