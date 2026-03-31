/**
 * useStateData — React hook for orbital state machine data.
 *
 * Provides live Guardian homeostasis status via MCP and type exports
 * for state machine definitions. State machines (MACHINES) are defined
 * alongside the explorer component as they encode UI structure.
 *
 * MCP enrichment: guardian_homeostasis_tick → live threat status overlay.
 * Markov analysis: markov_analyze → steady-state probabilities for orbital speed.
 *
 * Primitive formula: hook = ν(guardian) + ς(machine_state) — frequency of
 * homeostasis checks crossed with state transitions.
 */

"use client";

import { useState, useCallback } from "react";
import { useSWRData } from "@/hooks/use-swr-data";
import type { StateNode, StateTransition } from "@/components/observatory";
import { mcpFetch } from "@/lib/observatory/mcp-fetch";

// ─── Type Exports (shared with state-explorer.tsx) ──────────────────────────

export type MachineKey =
  | "guardian"
  | "gestation"
  | "meiosis"
  | "session"
  | "signal-lifecycle"
  | "tov-assessment"
  | "drug-pipeline";

export interface MachineStem {
  trait: string;
  domain: string;
  t1: string;
  transfer: string;
  crate: string;
  tools: string[];
}

export interface MachineDef {
  label: string;
  description: string;
  centralLabel: string;
  states: StateNode[];
  transitions: StateTransition[];
  stem?: MachineStem;
}

// ─── MCP Tool Response Types ─────────────────────────────────────────────────

interface GuardianStatus {
  homeostasis: number;
  threatLevel: "normal" | "advisory" | "warning" | "critical";
  lastCheck: string;
}

interface GuardianTickResponse {
  homeostasis: number;
  threat_level: string;
}

interface MarkovTransitionInput {
  from: number;
  to: number;
  probability: number;
}

export interface MarkovAnalyzeInput {
  states: string[];
  transitions: MarkovTransitionInput[];
  analysis: string;
}

interface MarkovDistEntry {
  state: string;
  probability: number;
}

interface MarkovStationaryResponse {
  analysis: string;
  distribution: MarkovDistEntry[];
  confidence: number;
}

interface MarkovSummaryResponse {
  analysis: string;
  stationary_distribution: MarkovDistEntry[];
  is_ergodic: boolean;
  entropy_rate: number;
}

// ─── State ──────────────────────────────────────────────────────────────────

interface StateDataResult {
  guardianStatus: GuardianStatus | null;
  /** Markov steady-state probabilities per state (maps to orbitalSpeed). */
  markovSteadyState: number[] | null;
  loading: boolean;
  error: string | null;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Data hook for the state explorer.
 *
 * Fetches live Guardian homeostasis status via MCP on mount and provides
 * a refetch mechanism. Falls back gracefully when MCP is unavailable —
 * the explorer works fully with its static machine definitions.
 *
 * @param autoFetch - Whether to fetch guardian status on mount (default: true)
 */
export function useStateData(
  autoFetch = true,
): StateDataResult & {
  refetch: () => void;
  fetchMarkov: (input: MarkovAnalyzeInput) => void;
} {
  // Markov is imperative (different params each call) — keep as local state
  const [markovSteadyState, setMarkovSteadyState] = useState<number[] | null>(
    null,
  );
  const [markovInput, setMarkovInput] = useState<MarkovAnalyzeInput | null>(
    null,
  );

  // Guardian status via SWR — auto-fetches when autoFetch is true
  const guardianKey = autoFetch ? "state-data:guardian" : null;
  const {
    data: guardianData,
    error: guardianError,
    isLoading: guardianLoading,
    retry,
  } = useSWRData<GuardianStatus>(
    guardianKey,
    async () => {
      const controller = new AbortController();
      const result = await mcpFetch<GuardianTickResponse>(
        "guardian_homeostasis_tick",
        {},
        controller.signal,
      );
      return {
        homeostasis: result.homeostasis,
        threatLevel:
          (result.threat_level as GuardianStatus["threatLevel"]) ?? "normal",
        lastCheck: new Date().toISOString(),
      };
    },
    { dedupingInterval: 500, showToast: false },
  );

  // Markov steady-state via SWR — fetches when markovInput is set
  const markovKey = markovInput
    ? `state-data:markov:${markovInput.analysis}:${markovInput.states.join(",")}`
    : null;

  useSWRData<number[]>(
    markovKey,
    async () => {
      const controller = new AbortController();
      const result = await mcpFetch<
        MarkovStationaryResponse | MarkovSummaryResponse
      >("markov_analyze", { ...markovInput! }, controller.signal);
      const dist =
        "distribution" in result
          ? (result as MarkovStationaryResponse).distribution
          : (result as MarkovSummaryResponse).stationary_distribution;
      if (dist && Array.isArray(dist)) {
        const probs = dist.map((d) => d.probability);
        setMarkovSteadyState(probs);
        return probs;
      }
      return [];
    },
    { dedupingInterval: 500, showToast: false },
  );

  /**
   * Fetch Markov steady-state from MCP given states + transitions.
   * Maps steady-state probabilities → orbitalSpeed per state.
   */
  const fetchMarkov = useCallback((input: MarkovAnalyzeInput) => {
    setMarkovInput(input);
  }, []);

  return {
    guardianStatus: guardianData ?? null,
    markovSteadyState,
    loading: guardianLoading,
    error: guardianError?.message ?? null,
    refetch: retry,
    fetchMarkov,
  };
}
