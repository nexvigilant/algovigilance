"use client";

/**
 * useSurvivalData — React hook for Kaplan-Meier survival surface with Measured<T> confidence.
 *
 * Fetches KM survival estimates from pv_core_kaplan_meier MCP tool, derives
 * Measured<number> per step via deriveMeasured(survival, se), and builds a
 * surface function + confidence function for SurfacePlot3D with per-vertex opacity.
 *
 * Late timepoints with few at-risk patients → low confidence → surface dissolves.
 * This is correct behavior — do not "fix" by clamping.
 *
 * Migrated to useSWRData for cross-page caching and request deduplication.
 *
 * Grounding: ν(Frequency) + ∂(Boundary) + ς(State) + N(Quantity)
 */

import { useMemo, useCallback } from "react";
import { deriveMeasured, type Measured } from "@/lib/observatory/measured";
import { useSWRData } from "@/hooks/use-swr-data";
import { mcpFetch } from "@/lib/observatory/mcp-fetch";

// ─── Domain Types ────────────────────────────────────────────────────────────

interface KmStep {
  time: number;
  survival: number;
  se: number;
  ci_lower: number;
  ci_upper: number;
  at_risk: number;
  events: number;
}

interface KmResponse {
  steps?: KmStep[];
  result?: { steps?: KmStep[] };
  median_survival?: number;
  confidence?: number;
}

interface LogRankResponse {
  chi_squared?: number;
  p_value?: number;
  hazard_ratio?: number;
  result?: {
    chi_squared?: number;
    p_value?: number;
    hazard_ratio?: number;
  };
}

export interface LogRankResult {
  chiSquared: number;
  pValue: number;
  hazardRatio: number | null;
}

export interface SurvivalGroup {
  name: string;
  steps: Array<Measured<number> & { time: number; atRisk: number }>;
}

// ─── Presets ─────────────────────────────────────────────────────────────────

export interface SurvivalPreset {
  name: string;
  groups: Array<{
    name: string;
    times: number[];
    events: boolean[];
  }>;
}

/** Freireich et al. (1963) — 6-MP vs placebo for acute leukemia. D002 validation dataset. */
export const FREIREICH_PRESET: SurvivalPreset = {
  name: "Freireich Leukemia (6-MP vs Placebo)",
  groups: [
    {
      name: "6-MP",
      times: [
        6, 6, 6, 6, 7, 9, 10, 10, 11, 13, 16, 17, 19, 20, 22, 23, 25, 32, 32,
        34, 35,
      ],
      events: Array.from({ length: 21 }, (_, i) => i < 9), // 9 events, 12 censored
    },
    {
      name: "Placebo",
      times: [
        1, 1, 2, 2, 3, 4, 4, 5, 5, 8, 8, 8, 8, 11, 11, 12, 12, 15, 17, 22, 23,
      ],
      events: Array.from({ length: 21 }, () => true), // all events
    },
  ],
};

export const SURVIVAL_PRESETS: Record<string, SurvivalPreset> = {
  freireich: FREIREICH_PRESET,
};

// ─── Client-side Kaplan-Meier ────────────────────────────────────────────────

/**
 * Compute KM steps client-side as fallback when MCP is unavailable.
 * Uses Greenwood's formula for SE: SE = S(t) * sqrt(sum(d_i / (n_i * (n_i - d_i))))
 *
 * // CALIBRATION: Greenwood SE → deriveMeasured() → confidence [0,1]
 */
function computeKmLocal(times: number[], events: boolean[]): KmStep[] {
  // Build ordered event table
  const entries = times
    .map((t, i) => ({ time: t, event: events[i] ?? false }))
    .sort((a, b) => a.time - b.time);

  const n = entries.length;
  let atRisk = n;
  let survival = 1.0;
  let greenwoodSum = 0;
  const steps: KmStep[] = [
    {
      time: 0,
      survival: 1.0,
      se: 0,
      ci_lower: 1.0,
      ci_upper: 1.0,
      at_risk: n,
      events: 0,
    },
  ];

  let i = 0;
  while (i < entries.length) {
    const currentTime = entries[i].time;
    let deaths = 0;
    let censored = 0;

    // Count events at this time
    while (i < entries.length && entries[i].time === currentTime) {
      if (entries[i].event) deaths++;
      else censored++;
      i++;
    }

    if (deaths > 0 && atRisk > 0) {
      survival *= 1 - deaths / atRisk;
      if (atRisk > deaths) {
        greenwoodSum += deaths / (atRisk * (atRisk - deaths));
      }
    }

    const se = survival * Math.sqrt(greenwoodSum);
    const z = 1.96;
    const ci_lower = Math.max(0, survival - z * se);
    const ci_upper = Math.min(1, survival + z * se);

    steps.push({
      time: currentTime,
      survival,
      se,
      ci_lower,
      ci_upper,
      at_risk: atRisk,
      events: deaths,
    });

    atRisk -= deaths + censored;
  }

  return steps;
}

// ─── Fetched Data Shape ─────────────────────────────────────────────────────

interface SurvivalFetchResult {
  groups: SurvivalGroup[];
  logRank: LogRankResult | null;
}

// ─── Fetcher ────────────────────────────────────────────────────────────────

async function fetchSurvival(
  preset: SurvivalPreset,
): Promise<SurvivalFetchResult> {
  // Combine all groups into a single MCP call
  const allTimes: number[] = [];
  const allEvents: boolean[] = [];
  const allGroups: string[] = [];
  for (const g of preset.groups) {
    for (let i = 0; i < g.times.length; i++) {
      allTimes.push(g.times[i]);
      allEvents.push(g.events[i] ?? false);
      allGroups.push(g.name);
    }
  }

  // Fetch KM + log-rank in parallel via mcpFetch
  const controller = new AbortController();
  const kmParams = { times: allTimes, events: allEvents, groups: allGroups };

  const kmPromise = mcpFetch<KmResponse>(
    "pv_core_kaplan_meier",
    kmParams,
    controller.signal,
  ).catch(() => null);

  const logRankPromise =
    preset.groups.length > 1
      ? mcpFetch<LogRankResponse>(
          "pv_core_log_rank",
          kmParams,
          controller.signal,
        ).catch(() => null)
      : Promise.resolve(null);

  const [kmJson, logRankJson] = await Promise.all([kmPromise, logRankPromise]);

  // Parse KM steps from MCP or fall back to client-side
  const kmSteps = kmJson?.steps ?? kmJson?.result?.steps;
  let survivalGroups: SurvivalGroup[];

  if (kmSteps && kmSteps.length > 0) {
    // MCP returned data — single group (MCP may not separate by group)
    survivalGroups = [
      {
        name:
          preset.groups.length === 1
            ? (preset.groups[0]?.name ?? "Combined")
            : "Combined",
        steps: kmSteps.map((s) => ({
          time: s.time,
          value: s.survival,
          confidence: deriveMeasured(s.survival, s.se).confidence,
          atRisk: s.at_risk,
        })),
      },
    ];
  } else {
    // Client-side fallback — compute per group
    survivalGroups = preset.groups.map((g) => {
      const steps = computeKmLocal(g.times, g.events);
      return {
        name: g.name,
        steps: steps.map((s) => ({
          time: s.time,
          value: s.survival,
          confidence: deriveMeasured(s.survival, s.se).confidence,
          atRisk: s.at_risk,
        })),
      };
    });
  }

  // Parse log-rank
  const lr = logRankJson?.result ?? logRankJson;
  const logRank: LogRankResult | null =
    lr?.chi_squared !== undefined
      ? {
          chiSquared: lr.chi_squared ?? 0,
          pValue: lr.p_value ?? 1,
          hazardRatio: lr.hazard_ratio ?? null,
        }
      : null;

  return { groups: survivalGroups, logRank };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSurvivalData(preset: SurvivalPreset) {
  // Build a stable key from the preset name
  const key = `survival-km-${preset.name}`;

  const { data, error, isLoading, retry } = useSWRData<SurvivalFetchResult>(
    key,
    () => fetchSurvival(preset),
    { showToast: false },
  );

  const groups = data?.groups ?? [];
  const logRank = data?.logRank ?? null;

  // Build surface function: x=time, y=group interpolation, z=S(t)
  const surfaceFn = useMemo(() => {
    if (groups.length === 0) return (_x: number, _y: number) => 1;

    const nGroups = groups.length;

    return (x: number, y: number): number => {
      // Map x ∈ [-5, 5] → time ∈ [0, maxTime]
      const maxTime = Math.max(
        ...groups.flatMap((g) => g.steps.map((s) => s.time)),
        1,
      );
      const time = ((x + 5) / 10) * maxTime;

      // Map y ∈ [-5, 5] → group interpolation [0, nGroups-1]
      const groupIdx = ((y + 5) / 10) * Math.max(nGroups - 1, 1);
      const loIdx = Math.max(0, Math.min(nGroups - 2, Math.floor(groupIdx)));
      const hiIdx = Math.min(nGroups - 1, loIdx + 1);
      const t = nGroups > 1 ? groupIdx - loIdx : 0;

      function survivalAtTime(group: SurvivalGroup, timePoint: number): number {
        const steps = group.steps;
        if (steps.length === 0) return 1;
        const last = steps[steps.length - 1];
        if (!last || timePoint >= last.time) return last?.value ?? 0;
        const first = steps[0];
        if (!first || timePoint <= first.time) return first?.value ?? 1;
        for (let i = 0; i < steps.length - 1; i++) {
          const a = steps[i];
          const b = steps[i + 1];
          if (!a || !b) continue;
          if (timePoint >= a.time && timePoint <= b.time) {
            const frac =
              b.time === a.time ? 0 : (timePoint - a.time) / (b.time - a.time);
            return a.value + frac * (b.value - a.value);
          }
        }
        return 1;
      }

      const loGroup = groups[loIdx];
      const hiGroup = groups[hiIdx];
      if (!loGroup || !hiGroup) return 1;

      const loVal = survivalAtTime(loGroup, time);
      const hiVal = survivalAtTime(hiGroup, time);
      return loVal + t * (hiVal - loVal);
    };
  }, [groups]);

  // Build confidence function for per-vertex opacity
  const confidenceFn = useMemo(() => {
    if (groups.length === 0) return (_x: number, _y: number) => 1;

    const nGroups = groups.length;

    return (x: number, y: number): number => {
      const maxTime = Math.max(
        ...groups.flatMap((g) => g.steps.map((s) => s.time)),
        1,
      );
      const time = ((x + 5) / 10) * maxTime;

      const groupIdx = ((y + 5) / 10) * Math.max(nGroups - 1, 1);
      const loIdx = Math.max(0, Math.min(nGroups - 2, Math.floor(groupIdx)));
      const hiIdx = Math.min(nGroups - 1, loIdx + 1);
      const t = nGroups > 1 ? groupIdx - loIdx : 0;

      function confAtTime(group: SurvivalGroup, timePoint: number): number {
        const steps = group.steps;
        if (steps.length === 0) return 1;
        const last = steps[steps.length - 1];
        if (!last || timePoint >= last.time) return last?.confidence ?? 0.5;
        const first = steps[0];
        if (!first || timePoint <= first.time) return first?.confidence ?? 1;
        for (let i = 0; i < steps.length - 1; i++) {
          const a = steps[i];
          const b = steps[i + 1];
          if (!a || !b) continue;
          if (timePoint >= a.time && timePoint <= b.time) {
            const frac =
              b.time === a.time ? 0 : (timePoint - a.time) / (b.time - a.time);
            return a.confidence + frac * (b.confidence - a.confidence);
          }
        }
        return 1;
      }

      const loGroup = groups[loIdx];
      const hiGroup = groups[hiIdx];
      if (!loGroup || !hiGroup) return 1;

      const loConf = confAtTime(loGroup, time);
      const hiConf = confAtTime(hiGroup, time);
      return loConf + t * (hiConf - loConf);
    };
  }, [groups]);

  /**
   * Build per-vertex opacity Float32Array for SurfacePlot3D.
   * Must match grid: (resolution+1)^2 vertices.
   */
  const buildVertexOpacities = useCallback(
    (resolution: number, range: [number, number]): Float32Array => {
      const [lo, hi] = range;
      const step = (hi - lo) / resolution;
      const count = (resolution + 1) * (resolution + 1);
      const opacities = new Float32Array(count);
      const minOpacity = 0.15;

      for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
          const x = lo + i * step;
          const y = lo + j * step;
          const conf = confidenceFn(x, y);
          // CALIBRATION: linear map confidence [0,1] → opacity [minOpacity, 1.0]
          opacities[i * (resolution + 1) + j] =
            minOpacity + conf * (1 - minOpacity);
        }
      }

      return opacities;
    },
    [confidenceFn],
  );

  return {
    groups,
    logRank,
    surfaceFn,
    confidenceFn,
    buildVertexOpacities,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
  };
}
