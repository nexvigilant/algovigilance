/**
 * Metrics Computation — Pure functions for dashboard metrics.
 *
 * Extracted from api/metrics/route.ts to separate Layer 4 (business logic)
 * from Layer 3 (data access) and Layer 5 (SSE transport).
 *
 * Architecture audit ref: NV-NRL-INT-003, Item 6.
 */

/** Compute model verdict percentage from verdict breakdown rows */
export function computeSigmaPct(
  totalSessions: number,
  verdictBreakdown: Record<string, unknown>[],
): { modelVerdicts: number; sigmaPct: number } {
  const MODEL_VERDICTS = [
    "fully_demonstrated",
    "partially_demonstrated",
    "not_demonstrated",
  ];

  const modelVerdicts = verdictBreakdown
    .filter((v) => MODEL_VERDICTS.includes(v.verdict as string))
    .reduce((acc, v) => acc + (Number(v.count) || 0), 0);

  const sigmaPct =
    totalSessions > 0 ? Math.round((modelVerdicts * 100) / totalSessions) : 0;

  return { modelVerdicts, sigmaPct };
}

/** Compute tool usage success rate from tool rows */
export function computeToolSuccessRate(toolUsage: Record<string, unknown>[]): {
  totalCalls: number;
  totalSuccess: number;
  successRate: number;
} {
  const totalCalls = toolUsage.reduce(
    (acc, t) => acc + (Number(t.total_calls) || 0),
    0,
  );
  const totalSuccess = toolUsage.reduce(
    (acc, t) => acc + (Number(t.success_count) || 0),
    0,
  );
  const successRate =
    totalCalls > 0 ? Math.round((totalSuccess * 100) / totalCalls) : 0;

  return { totalCalls, totalSuccess, successRate };
}

/** Compute test pass rate from test health rows */
export function computeTestPassRate(testHealth: Record<string, unknown>[]): {
  totalPassed: number;
  totalFailed: number;
  passRate: number;
} {
  const totalPassed = testHealth.reduce(
    (acc, t) => acc + (Number(t.passed) || 0),
    0,
  );
  const totalFailed = testHealth.reduce(
    (acc, t) => acc + (Number(t.failed) || 0),
    0,
  );
  const passRate =
    totalPassed + totalFailed > 0
      ? Math.round((totalPassed * 100) / (totalPassed + totalFailed))
      : 0;

  return { totalPassed, totalFailed, passRate };
}

/** Compute tokens per action from efficiency rows */
export function computeTokenEfficiency(tokenEff: Record<string, unknown>[]): {
  actions: number;
  tokens: number;
  tokensPerAction: number;
} {
  const actions = Number(tokenEff[0]?.total_actions) || 0;
  const tokens = Number(tokenEff[0]?.total_tokens) || 0;
  const tokensPerAction = actions > 0 ? Math.round(tokens / actions) : 0;

  return { actions, tokens, tokensPerAction };
}

/** Extract decision risk counts from decision audit rows */
export function computeDecisionRisk(decisions: Record<string, unknown>[]): {
  total: number;
  highRisk: number;
  mediumRisk: number;
} {
  return {
    total: Number(decisions[0]?.total) || 0,
    highRisk: Number(decisions[0]?.high_risk) || 0,
    mediumRisk: Number(decisions[0]?.medium_risk) || 0,
  };
}
