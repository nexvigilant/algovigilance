/**
 * useTimelineData — React hook for fetching drug lifecycle timeline data.
 *
 * Calls pv_signal_complete via the Studio proxy, then transforms into an
 * Observatory temporal graph dataset. Falls back to hardcoded demo data
 * when the drug name is too short or the request fails.
 * Backed by useSWRData for cross-page caching and request deduplication.
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import type { ObservatoryDataset } from "@/lib/observatory/adapter";
import type { GraphNode, GraphEdge } from "@/components/observatory";

// ─── API Types ───────────────────────────────────────────────────────────────

interface SignalResult {
  drug: string;
  event: string;
  prr: number;
  ror: number;
  report_count: number;
  signal_detected: boolean;
}

interface SignalResponse {
  drug: string;
  signals: SignalResult[];
  total_events: number;
}

// ─── Timeline Category ───────────────────────────────────────────────────────

type TimelineCategory =
  | "signal"
  | "regulatory"
  | "clinical"
  | "manufacturing"
  | "postmarket";

interface TimelineEventData {
  id: string;
  label: string;
  timestamp: string;
  category: TimelineCategory;
  severity: number;
  velocity: number;
}

// ─── Category Colors ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<TimelineCategory, string> = {
  signal: "#ef4444",
  regulatory: "#f97316",
  clinical: "#06b6d4",
  manufacturing: "#22c55e",
  postmarket: "#a855f7",
};

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_EVENTS: TimelineEventData[] = [
  {
    id: "ev-0",
    label: "Initial NDA Approval",
    timestamp: "2020-03-15",
    category: "regulatory",
    severity: 0.9,
    velocity: 0.2,
  },
  {
    id: "ev-1",
    label: "Phase III Completion",
    timestamp: "2020-07-22",
    category: "clinical",
    severity: 0.7,
    velocity: 0.3,
  },
  {
    id: "ev-2",
    label: "First Postmarket Safety Review",
    timestamp: "2020-11-10",
    category: "postmarket",
    severity: 0.4,
    velocity: 0.5,
  },
  {
    id: "ev-3",
    label: "GI Adverse Event Signal",
    timestamp: "2021-02-08",
    category: "signal",
    severity: 0.6,
    velocity: 0.7,
  },
  {
    id: "ev-4",
    label: "Labeling Update — GI Warning",
    timestamp: "2021-06-14",
    category: "regulatory",
    severity: 0.5,
    velocity: 0.4,
  },
  {
    id: "ev-5",
    label: "Manufacturing Site Audit",
    timestamp: "2021-10-30",
    category: "manufacturing",
    severity: 0.3,
    velocity: 0.2,
  },
  {
    id: "ev-6",
    label: "REMS Program Initiated",
    timestamp: "2022-01-19",
    category: "regulatory",
    severity: 0.8,
    velocity: 0.6,
  },
  {
    id: "ev-7",
    label: "Renal Signal Detection",
    timestamp: "2022-05-27",
    category: "signal",
    severity: 0.75,
    velocity: 0.85,
  },
  {
    id: "ev-8",
    label: "Phase IV Post-Approval Study Start",
    timestamp: "2022-09-03",
    category: "clinical",
    severity: 0.5,
    velocity: 0.4,
  },
  {
    id: "ev-9",
    label: "Generic Entry — Supply Shift",
    timestamp: "2023-03-12",
    category: "manufacturing",
    severity: 0.4,
    velocity: 0.3,
  },
  {
    id: "ev-10",
    label: "Cardiac Drift Detected (KS Test)",
    timestamp: "2024-01-05",
    category: "signal",
    severity: 0.9,
    velocity: 0.95,
  },
  {
    id: "ev-11",
    label: "FDA Safety Communication Issued",
    timestamp: "2024-08-20",
    category: "regulatory",
    severity: 1.0,
    velocity: 0.8,
  },
];

// ─── Dataset STEM Metadata ───────────────────────────────────────────────────

const TIMELINE_STEM = {
  trait: "Sequence",
  domain: "Science",
  t1: "σ Sequence",
  transfer: "Time→Event→Signal — temporal evolution of drug safety signals",
  crate: "nexcore-vigilance",
  tools: ["pv_signal_complete", "faers_drug_events"],
};

// ─── Transform ───────────────────────────────────────────────────────────────

function buildDemoDataset(drug: string): ObservatoryDataset {
  return buildTemporalGraph(drug, DEMO_EVENTS);
}

function buildTemporalGraph(
  drug: string,
  events: TimelineEventData[],
): ObservatoryDataset {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Extract unique years from event timestamps
  const years = Array.from(
    new Set(events.map((ev) => new Date(ev.timestamp).getFullYear())),
  ).sort((a, b) => a - b);

  // Year milestone nodes
  years.forEach((year) => {
    nodes.push({
      id: `year-${year}`,
      label: String(year),
      group: "foundation",
      value: 1.5,
      color: "#475569",
    });
  });

  // Event nodes
  events.forEach((ev, i) => {
    nodes.push({
      id: ev.id,
      label: ev.label,
      group: ev.category,
      value: ev.severity * 2 + 0.5,
      color: CATEGORY_COLORS[ev.category],
    });

    // Edge from year milestone to event
    const year = new Date(ev.timestamp).getFullYear();
    edges.push({
      source: `year-${year}`,
      target: ev.id,
      weight: 1,
    });

    // Edge to next chronological event in same category
    const nextSameCategory = events
      .slice(i + 1)
      .find((later) => later.category === ev.category);

    if (nextSameCategory) {
      edges.push({
        source: ev.id,
        target: nextSameCategory.id,
        weight: 1.5,
      });
    }
  });

  const displayDrug = drug.length >= 2 ? drug : "metformin";

  return {
    label: `${displayDrug.charAt(0).toUpperCase()}${displayDrug.slice(1)} — Drug Lifecycle Timeline`,
    description:
      `Temporal graph visualizing the safety event history for ${displayDrug}. ` +
      `Year milestones anchor the X-axis. Node size encodes event severity; ` +
      `category color encodes event type. Edges within a category show chronological ` +
      `signal progression and drift patterns across the drug lifecycle.`,
    nodes,
    edges,
    dimension: 3,
    stem: TIMELINE_STEM,
    explorerType: "timeline",
  };
}

function transformSignalResponse(
  drug: string,
  response: SignalResponse,
): ObservatoryDataset {
  const events: TimelineEventData[] = response.signals
    .slice(0, 12)
    .map((sig, i) => {
      const category: TimelineCategory = sig.signal_detected
        ? "signal"
        : "postmarket";
      const year = 2020 + Math.floor(i / 3);
      const month = String((i % 12) + 1).padStart(2, "0");
      return {
        id: `ev-${i}`,
        label: sig.event,
        timestamp: `${year}-${month}-01`,
        category,
        severity: Math.min(sig.prr / 10, 1),
        velocity: Math.min(sig.report_count / 500, 1),
      };
    });

  return buildTemporalGraph(drug, events.length > 0 ? events : DEMO_EVENTS);
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function fetchTimelineData(drug: string): Promise<ObservatoryDataset> {
  const res = await fetch("/api/nexcore/api/v1/mcp/pv_signal_complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ params: { drug, event: "*", reports: 100 } }),
  });

  if (!res.ok) throw new Error(`Signal API returned ${res.status}`);
  const response: SignalResponse = await res.json();
  return transformSignalResponse(drug, response);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTimelineData(drug: string): {
  data: ObservatoryDataset | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const key = drug.length >= 2 ? `observatory-timeline-${drug}` : null;

  const { data, error, isLoading, retry } = useSWRData<ObservatoryDataset>(
    key,
    () => fetchTimelineData(drug),
    {
      dedupingInterval: 500,
      fallback: buildDemoDataset(drug.length >= 2 ? drug : "metformin"),
    },
  );

  return {
    data: data ?? buildDemoDataset(drug.length >= 2 ? drug : "metformin"),
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
  };
}
