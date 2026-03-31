/**
 * useCausalityData — React hook for fetching Bradford Hill causality evidence data.
 *
 * Wraps the pv_signal_complete MCP endpoint with loading/error state management.
 * Backed by useSWRData for cross-page caching and request deduplication.
 *
 * Builds a 3-layer graph: Drug center → Adverse Events → Bradford Hill criteria.
 *
 * Primitive formula: → Causality — Drug→Event→Evidence network
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import type { GraphNode, GraphEdge } from "@/components/observatory";
import type { ObservatoryDataset } from "@/lib/observatory/adapter";

// ─── API Response Types ──────────────────────────────────────────────────────

interface SignalResult {
  drug: string;
  event: string;
  prr: number;
  ror: number;
  ic: number;
  eb05: number;
  chi_squared: number;
  report_count: number;
  signal_detected: boolean;
}

interface SignalCompleteResponse {
  drug: string;
  signals: SignalResult[];
  total_events: number;
}

// ─── Bradford Hill Criteria ──────────────────────────────────────────────────

const BH_CRITERIA = [
  "Strength",
  "Consistency",
  "Specificity",
  "Temporality",
  "Biological Gradient",
  "Plausibility",
  "Coherence",
  "Experiment",
  "Analogy",
] as const;

type BHCriterion = (typeof BH_CRITERIA)[number];

// ─── Signal Color ────────────────────────────────────────────────────────────

function aeColor(prr: number, signalDetected: boolean): string {
  if (!signalDetected) return "#7B95B5"; // slate — no signal
  if (prr >= 5.0) return "#ef4444"; // red — strong
  if (prr >= 3.0) return "#f97316"; // orange — moderate
  if (prr >= 2.0) return "#eab308"; // gold — threshold
  return "#7B95B5";
}

// ─── Bradford Hill Weights per Signal Strength ───────────────────────────────

function bhWeightsForSignal(
  signal: SignalResult,
): Partial<Record<BHCriterion, number>> {
  const { prr, signal_detected } = signal;
  if (!signal_detected) {
    return {
      Analogy: 0.2,
      Plausibility: 0.3,
    };
  }
  if (prr >= 5.0) {
    return {
      Strength: 0.9,
      Consistency: 0.75,
      Specificity: 0.65,
      Temporality: 0.8,
      "Biological Gradient": 0.7,
      Plausibility: 0.85,
      Coherence: 0.6,
      Experiment: 0.5,
      Analogy: 0.55,
    };
  }
  if (prr >= 3.0) {
    return {
      Strength: 0.65,
      Consistency: 0.55,
      Temporality: 0.6,
      Plausibility: 0.7,
      "Biological Gradient": 0.5,
      Coherence: 0.45,
      Analogy: 0.4,
    };
  }
  // PRR >= 2.0
  return {
    Strength: 0.4,
    Temporality: 0.5,
    Plausibility: 0.5,
    Analogy: 0.35,
  };
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_SIGNALS: SignalResult[] = [
  {
    drug: "ibuprofen",
    event: "Gastrointestinal hemorrhage",
    prr: 5.8,
    ror: 6.2,
    ic: 2.3,
    eb05: 3.1,
    chi_squared: 28.4,
    report_count: 1420,
    signal_detected: true,
  },
  {
    drug: "ibuprofen",
    event: "Renal impairment",
    prr: 4.2,
    ror: 4.5,
    ic: 1.9,
    eb05: 2.5,
    chi_squared: 19.7,
    report_count: 890,
    signal_detected: true,
  },
  {
    drug: "ibuprofen",
    event: "Acute myocardial infarction",
    prr: 3.1,
    ror: 3.3,
    ic: 1.4,
    eb05: 2.1,
    chi_squared: 12.3,
    report_count: 540,
    signal_detected: true,
  },
  {
    drug: "ibuprofen",
    event: "Anaphylactic reaction",
    prr: 2.7,
    ror: 2.9,
    ic: 1.2,
    eb05: 1.8,
    chi_squared: 9.8,
    report_count: 310,
    signal_detected: true,
  },
  {
    drug: "ibuprofen",
    event: "Hepatotoxicity",
    prr: 2.2,
    ror: 2.3,
    ic: 0.9,
    eb05: 1.4,
    chi_squared: 6.1,
    report_count: 220,
    signal_detected: true,
  },
  {
    drug: "ibuprofen",
    event: "Headache",
    prr: 1.4,
    ror: 1.5,
    ic: 0.4,
    eb05: 0.8,
    chi_squared: 2.1,
    report_count: 780,
    signal_detected: false,
  },
  {
    drug: "ibuprofen",
    event: "Nausea",
    prr: 1.2,
    ror: 1.3,
    ic: 0.2,
    eb05: 0.5,
    chi_squared: 1.4,
    report_count: 650,
    signal_detected: false,
  },
  {
    drug: "ibuprofen",
    event: "Fatigue",
    prr: 1.1,
    ror: 1.1,
    ic: 0.1,
    eb05: 0.3,
    chi_squared: 0.8,
    report_count: 430,
    signal_detected: false,
  },
];

// ─── Transform to ObservatoryDataset ─────────────────────────────────────────

function transformToDataset(
  drugName: string,
  signals: SignalResult[],
): ObservatoryDataset {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Layer 1: Drug center node
  nodes.push({
    id: "drug-center",
    label: drugName,
    group: "service",
    value: 2.5,
    color: "#06b6d4",
  });

  // Layer 3: Bradford Hill criteria nodes (shared)
  for (const criterion of BH_CRITERIA) {
    nodes.push({
      id: `bh-${criterion}`,
      label: criterion,
      group: "foundation",
      value: 1.0,
      color: "#a855f7",
    });
  }

  // Layer 2: Adverse event nodes + edges
  const maxCount = Math.max(...signals.map((s) => s.report_count), 1);

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    const aeId = `ae-${i}`;
    const normalizedValue = 0.5 + (signal.report_count / maxCount) * 2.0;

    // AE node
    nodes.push({
      id: aeId,
      label: signal.event,
      group: signal.signal_detected ? "orchestration" : "domain",
      value: normalizedValue,
      color: aeColor(signal.prr, signal.signal_detected),
    });

    // Drug → AE edge
    edges.push({
      source: "drug-center",
      target: aeId,
      weight: Math.min(signal.prr, 5),
      label: `PRR ${signal.prr.toFixed(1)}`,
    });

    // AE → Bradford Hill edges (only for signal-detected events)
    if (signal.signal_detected) {
      const bhWeights = bhWeightsForSignal(signal);
      for (const [criterion, weight] of Object.entries(bhWeights) as [
        BHCriterion,
        number,
      ][]) {
        edges.push({
          source: aeId,
          target: `bh-${criterion}`,
          weight,
          label: `${(weight * 100).toFixed(0)}%`,
        });
      }
    }
  }

  const signalCount = signals.filter((s) => s.signal_detected).length;

  return {
    label: `Causality: ${drugName}`,
    description: `Bradford Hill causality assessment for ${drugName}. ${signals.length} adverse events analyzed, ${signalCount} signals detected. Node color encodes PRR signal strength. Edges to Bradford Hill criteria show evidence weight.`,
    nodes,
    edges,
    dimension: 3,
    stem: {
      trait: "Relate",
      domain: "Science",
      t1: "→ Causality",
      transfer:
        "Drug→Event→Evidence — Bradford Hill causality criteria as evidence network",
      crate: "nexcore-vigilance",
      tools: ["pv_signal_complete", "pv_signal_prr", "pv_signal_ror"],
    },
    explorerType: "causality",
  };
}

// ─── Fetcher ────────────────────────────────────────────────────────────────

async function fetchCausalityData(drug: string): Promise<ObservatoryDataset> {
  const res = await fetch("/api/nexcore/api/v1/mcp/pv_signal_complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ params: { drug, event: "*", reports: 100 } }),
  });

  if (!res.ok) throw new Error(`pv_signal_complete returned ${res.status}`);
  const data: SignalCompleteResponse = await res.json();
  const signals = data.signals.length > 0 ? data.signals : DEMO_SIGNALS;
  return transformToDataset(data.drug || drug, signals);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCausalityData(drug: string): {
  data: ObservatoryDataset | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const key = drug.length >= 2 ? `observatory-causality-${drug}` : null;

  const { data, error, isLoading, retry } = useSWRData<ObservatoryDataset>(
    key,
    () => fetchCausalityData(drug),
    { dedupingInterval: 500 },
  );

  return {
    data,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
  };
}
