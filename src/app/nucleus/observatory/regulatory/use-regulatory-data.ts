/**
 * useRegulatoryData — React hook for fetching regulatory milestone DAG data.
 *
 * Calls the guidelines_search MCP endpoint via the Studio proxy when a drug
 * name of at least 2 characters is provided. Falls back to a hardcoded FDA
 * approval pipeline demo DAG when the API fails or the drug field is empty.
 *
 * Migrated to useSWRData for cross-page caching and request deduplication.
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import type { ObservatoryDataset } from "@/lib/observatory/adapter";
import type { GraphNode, GraphEdge } from "@/components/observatory";

// ─── API Response Types ───────────────────────────────────────────────────────

interface GuidelineResult {
  id: string;
  title: string;
  category: string;
  phase: string;
  relevance_score: number;
  dependencies: string[];
}

interface GuidelinesSearchResponse {
  query: string;
  results: GuidelineResult[];
  total: number;
}

// ─── Phase Color Map ──────────────────────────────────────────────────────────

const PHASE_COLOR_MAP: Record<string, string> = {
  preclinical: "#818cf8",
  phase1: "#06b6d4",
  phase2: "#22c55e",
  phase3: "#eab308",
  nda: "#f97316",
  approval: "#ef4444",
  postmarket: "#a855f7",
};

function phaseColor(phase: string): string {
  return PHASE_COLOR_MAP[phase] ?? "#7B95B5";
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

interface DemoMilestone {
  id: string;
  title: string;
  phase: string;
  relevance_score: number;
  dependencies: string[];
}

const DEMO_MILESTONES: DemoMilestone[] = [
  // Preclinical
  {
    id: "ind-enabling",
    title: "IND-Enabling Studies",
    phase: "preclinical",
    relevance_score: 0.9,
    dependencies: [],
  },
  {
    id: "tox-studies",
    title: "Toxicology Package",
    phase: "preclinical",
    relevance_score: 0.85,
    dependencies: ["ind-enabling"],
  },
  {
    id: "cmc-development",
    title: "CMC Development",
    phase: "preclinical",
    relevance_score: 0.75,
    dependencies: ["ind-enabling"],
  },
  {
    id: "nonclinical",
    title: "Nonclinical Safety Assessment",
    phase: "preclinical",
    relevance_score: 0.8,
    dependencies: ["tox-studies"],
  },
  // Phase 1
  {
    id: "ind-application",
    title: "IND Application",
    phase: "phase1",
    relevance_score: 0.95,
    dependencies: ["tox-studies", "cmc-development", "nonclinical"],
  },
  {
    id: "phase1-trial",
    title: "Phase 1 Clinical Trial",
    phase: "phase1",
    relevance_score: 1.0,
    dependencies: ["ind-application"],
  },
  {
    id: "pd-pk",
    title: "PK/PD Characterisation",
    phase: "phase1",
    relevance_score: 0.7,
    dependencies: ["phase1-trial"],
  },
  // Phase 2
  {
    id: "phase2-trial",
    title: "Phase 2a/2b Trial",
    phase: "phase2",
    relevance_score: 1.0,
    dependencies: ["phase1-trial", "pd-pk"],
  },
  {
    id: "dose-finding",
    title: "Dose-Finding Study",
    phase: "phase2",
    relevance_score: 0.8,
    dependencies: ["phase2-trial"],
  },
  // Phase 3
  {
    id: "phase3-trial",
    title: "Phase 3 Pivotal Trial",
    phase: "phase3",
    relevance_score: 1.0,
    dependencies: ["phase2-trial", "dose-finding"],
  },
  {
    id: "cmc-process",
    title: "Commercial CMC Scale-Up",
    phase: "phase3",
    relevance_score: 0.72,
    dependencies: ["cmc-development", "phase3-trial"],
  },
  // NDA
  {
    id: "nda-filing",
    title: "NDA/BLA Filing",
    phase: "nda",
    relevance_score: 0.95,
    dependencies: ["phase3-trial", "cmc-process"],
  },
  // Approval
  {
    id: "fda-review",
    title: "FDA Review Period",
    phase: "approval",
    relevance_score: 0.9,
    dependencies: ["nda-filing"],
  },
  {
    id: "adcom",
    title: "Advisory Committee",
    phase: "approval",
    relevance_score: 0.75,
    dependencies: ["fda-review"],
  },
  {
    id: "approval-letter",
    title: "Approval Letter",
    phase: "approval",
    relevance_score: 1.0,
    dependencies: ["adcom"],
  },
  // Postmarket
  {
    id: "phase4-pmc",
    title: "Phase 4 / Post-Marketing Commitment",
    phase: "postmarket",
    relevance_score: 0.85,
    dependencies: ["approval-letter"],
  },
  {
    id: "rems",
    title: "REMS Program (if required)",
    phase: "postmarket",
    relevance_score: 0.65,
    dependencies: ["approval-letter"],
  },
  {
    id: "psur",
    title: "PSUR / PBRER Submissions",
    phase: "postmarket",
    relevance_score: 0.7,
    dependencies: ["phase4-pmc"],
  },
];

// ─── Transform Helpers ────────────────────────────────────────────────────────

function normalizeScore(score: number, min: number, max: number): number {
  const range = max - min || 1;
  return 0.5 + ((score - min) / range) * 2.5;
}

function buildDataset(
  milestones: DemoMilestone[],
  label: string,
  description: string,
): ObservatoryDataset {
  const scores = milestones.map((m) => m.relevance_score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  const nodes: GraphNode[] = milestones.map((m) => ({
    id: m.id,
    label: m.title,
    group: m.phase,
    value: normalizeScore(m.relevance_score, minScore, maxScore),
    color: phaseColor(m.phase),
  }));

  const edges: GraphEdge[] = milestones.flatMap((m) =>
    m.dependencies.map((depId) => ({
      source: depId,
      target: m.id,
      weight: 1.5,
    })),
  );

  return {
    label,
    description,
    nodes,
    edges,
    dimension: 3,
    stem: {
      trait: "Sequence",
      domain: "Engineering",
      t1: "→ Causality",
      transfer:
        "Milestone→Dependency — FDA regulatory pathway as directed acyclic graph",
      crate: "nexcore-vigilance",
      tools: ["guidelines_search", "fda_guidance_search"],
    },
    explorerType: "regulatory",
  };
}

function buildDemoDataset(): ObservatoryDataset {
  return buildDataset(
    DEMO_MILESTONES,
    "FDA Approval Pipeline",
    `${DEMO_MILESTONES.length} regulatory milestones across 7 phases. Directed edges represent FDA-mandated dependency ordering from IND-enabling studies through post-marketing commitments.`,
  );
}

function buildLiveDataset(
  response: GuidelinesSearchResponse,
): ObservatoryDataset {
  const milestones: DemoMilestone[] = response.results.map((r) => ({
    id: r.id,
    title: r.title,
    phase: r.phase in PHASE_COLOR_MAP ? r.phase : "preclinical",
    relevance_score: r.relevance_score,
    dependencies: r.dependencies.filter((dep) =>
      response.results.some((r2) => r2.id === dep),
    ),
  }));

  // Seed with at least the demo data if API returns nothing useful
  const source = milestones.length >= 3 ? milestones : DEMO_MILESTONES;

  return buildDataset(
    source,
    `Regulatory: ${response.query}`,
    `${source.length} guideline results for "${response.query}". Edges indicate dependency ordering derived from guideline cross-references.`,
  );
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchRegulatory(drugName: string): Promise<ObservatoryDataset> {
  const res = await fetch("/api/nexcore/api/v1/mcp/guidelines_search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ params: { query: drugName, limit: 20 } }),
  });

  if (!res.ok) throw new Error(`Guidelines API returned ${res.status}`);
  const data = (await res.json()) as GuidelinesSearchResponse;
  return buildLiveDataset(data);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface RegulatoryDataState {
  data: ObservatoryDataset | null;
  loading: boolean;
  error: string | null;
}

export function useRegulatoryData(
  drug: string,
): RegulatoryDataState & { refetch: () => void } {
  const key = drug.length >= 2 ? `regulatory-${drug}` : null;

  const {
    data: apiData,
    error,
    isLoading,
    retry,
  } = useSWRData<ObservatoryDataset>(key, () => fetchRegulatory(drug), {
    dedupingInterval: 500,
    showToast: false,
  });

  return {
    data: apiData ?? buildDemoDataset(),
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
  };
}
