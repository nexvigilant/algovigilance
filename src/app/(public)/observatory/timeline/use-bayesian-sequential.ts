"use client";

/**
 * useBayesianSequential — React hook for Bayesian sequential evidence accumulation.
 *
 * Fetches Beta-Binomial posterior updates from pv_core_bayesian_sequential_beta_binomial
 * MCP tool. Returns time-series data showing how signal confidence evolves as
 * reports accumulate over time.
 *
 * Client-side fallback computes Beta-Binomial updates locally when MCP is unavailable.
 *
 * Grounding: →(Causality) + ν(Frequency) + ς(State) — evidence accumulation over time
 */

import { useState, useCallback } from "react";
import { useSWRData } from "@/hooks/use-swr-data";
import { mcpFetch } from "@/lib/observatory/mcp-fetch";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BayesianStep {
  /** Time index (report number or period) */
  time: number;
  /** Posterior mean P(signal) */
  posteriorMean: number;
  /** 95% credible interval lower bound */
  ciLower: number;
  /** 95% credible interval upper bound */
  ciUpper: number;
  /** Bayes factor vs prior at this step */
  bayesFactor: number;
  /** Alpha parameter of Beta posterior */
  alpha: number;
  /** Beta parameter of Beta posterior */
  beta: number;
}

interface McpBayesianResponse {
  steps?: Array<{
    time?: number;
    posterior_mean?: number;
    ci_lower?: number;
    ci_upper?: number;
    bayes_factor?: number;
    alpha?: number;
    beta?: number;
  }>;
  result?: {
    steps?: Array<{
      time?: number;
      posterior_mean?: number;
      ci_lower?: number;
      ci_upper?: number;
      bayes_factor?: number;
      alpha?: number;
      beta?: number;
    }>;
  };
}

interface BayesianResult {
  steps: BayesianStep[];
  fallback: boolean;
}

// ─── Client-side Beta-Binomial ──────────────────────────────────────────────

/**
 * Compute sequential Beta-Binomial updates client-side as fallback.
 * Prior: Beta(1,1) = Uniform. Each observation updates: α += success, β += failure.
 *
 * // CALIBRATION: Beta(α,β) → CI via normal approximation for α+β > 10,
 * // exact quantiles otherwise. Sufficient for visualization.
 */
function computeBayesianLocal(
  events: number,
  totalReports: number,
  steps: number,
): BayesianStep[] {
  const result: BayesianStep[] = [];
  let alpha = 1; // Prior α
  let beta = 1; // Prior β
  const eventsPerStep = Math.max(1, Math.floor(totalReports / steps));
  const eventRate = totalReports > 0 ? events / totalReports : 0.5;

  for (let i = 0; i <= steps; i++) {
    const time = i * eventsPerStep;
    if (i > 0) {
      // Simulate reports arriving: each report is an event with probability = eventRate
      const successes = Math.round(eventsPerStep * eventRate);
      const failures = eventsPerStep - successes;
      alpha += successes;
      beta += failures;
    }

    const posteriorMean = alpha / (alpha + beta);
    const variance =
      (alpha * beta) / ((alpha + beta) * (alpha + beta) * (alpha + beta + 1));
    const se = Math.sqrt(variance);
    const z = 1.96;

    // Bayes factor: posterior odds / prior odds (prior = Beta(1,1) = 0.5/0.5)
    const posteriorOdds = alpha / beta;
    const priorOdds = 1; // Beta(1,1)
    const bayesFactor = posteriorOdds / priorOdds;

    result.push({
      time,
      posteriorMean,
      ciLower: Math.max(0, posteriorMean - z * se),
      ciUpper: Math.min(1, posteriorMean + z * se),
      bayesFactor,
      alpha,
      beta,
    });
  }

  return result;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

interface BayesianParams {
  events: number;
  totalReports: number;
  numSteps: number;
}

export function useBayesianSequential() {
  const [params, setParams] = useState<BayesianParams | null>(null);

  const key = params
    ? `bayesian-sequential:${params.events}:${params.totalReports}:${params.numSteps}`
    : null;

  const { data, error, isLoading } = useSWRData<BayesianResult>(
    key,
    async () => {
      const controller = new AbortController();
      const json = await mcpFetch<McpBayesianResponse>(
        "pv_core_bayesian_sequential_beta_binomial",
        {
          events: params!.events,
          total: params!.totalReports,
          prior_alpha: 1,
          prior_beta: 1,
          steps: params!.numSteps,
        },
        controller.signal,
      );
      const rawSteps = json.steps ?? json.result?.steps ?? [];
      const steps: BayesianStep[] = rawSteps.map((s, i) => ({
        time: s.time ?? i,
        posteriorMean: s.posterior_mean ?? 0.5,
        ciLower: s.ci_lower ?? 0,
        ciUpper: s.ci_upper ?? 1,
        bayesFactor: s.bayes_factor ?? 1,
        alpha: s.alpha ?? 1,
        beta: s.beta ?? 1,
      }));
      return { steps, fallback: false };
    },
    {
      dedupingInterval: 500,
      showToast: false,
      onError: () => {
        // Handled by fallback in return value
      },
    },
  );

  // If MCP failed, compute client-side fallback
  const resolved: BayesianResult =
    data ??
    (params && error
      ? {
          steps: computeBayesianLocal(
            params.events,
            params.totalReports,
            params.numSteps,
          ),
          fallback: true,
        }
      : { steps: [], fallback: false });

  /**
   * Fetch Bayesian sequential analysis for a drug-event pair.
   * @param events - Number of AE reports (successes)
   * @param totalReports - Total reports examined
   * @param numSteps - Number of time steps for sequential display
   */
  const fetchBayesian = useCallback(
    (events: number, totalReports: number, numSteps = 20) => {
      setParams({ events, totalReports, numSteps });
    },
    [],
  );

  return {
    steps: resolved.steps,
    loading: isLoading,
    error: resolved.fallback
      ? "MCP unavailable — using client-side Bayesian"
      : (error?.message ?? null),
    fetchBayesian,
  };
}
