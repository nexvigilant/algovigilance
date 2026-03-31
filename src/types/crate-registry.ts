/**
 * Crate Registry Types
 *
 * Types for the per-crate detail pages and registry infrastructure.
 * Data sources: static crate-manifest.json (primary) + live Kellnr API (enrichment).
 */

/** Architecture layer classification */
export type CrateLayer = "foundation" | "domain" | "orchestration" | "service";

/** A single crate record in the manifest */
export interface CrateRecord {
  /** Crate name (e.g. "nexcore-vigilance") */
  name: string;
  /** Current version */
  version: string;
  /** Short description */
  description: string;
  /** Architecture layer */
  layer: CrateLayer;
  /** Direct workspace dependency names */
  dependencies: string[];
  /** Crates that depend on this one */
  dependents: string[];
  /** Approximate lines of code */
  loc: number;
  /** Number of dependents (fan-in) */
  fanIn: number;
  /** Number of dependencies (fan-out) */
  fanOut: number;
  /** Prefix family (e.g. "nexcore", "stem", "prima") */
  family: string;
  /** Searchable tags */
  tags: string[];
  /** Relative source path from workspace root */
  path: string;
  /** crates.io URL (set once published) */
  cratesIoUrl?: string;
  /** docs.rs URL (auto-generated from crates.io) */
  docsRsUrl?: string;
  /** License SPDX identifier */
  license?: string;
}

/** The full manifest file shape */
export interface CrateManifest {
  /** ISO timestamp of generation */
  generated_at: string;
  /** Total crate count */
  crate_count: number;
  /** Crate records keyed by name */
  crates: Record<string, CrateRecord>;
}

/** Live Kellnr enrichment data (optional, when backend is up) */
export interface KellnrEnrichment {
  total_downloads: number;
  max_version: string;
  last_updated: string;
  versions: Array<{
    version: string;
    downloads: number;
    created_at: string;
  }>;
}

/** Layer display configuration */
export const LAYER_CONFIG: Record<
  CrateLayer,
  {
    label: string;
    color: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  foundation: {
    label: "Foundation",
    color: "#f97316",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/30",
  },
  domain: {
    label: "Domain",
    color: "#10b981",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
  },
  orchestration: {
    label: "Orchestration",
    color: "#fbbf24",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/30",
  },
  service: {
    label: "Service",
    color: "#22d3ee",
    bgClass: "bg-cyan-500/10",
    textClass: "text-cyan-400",
    borderClass: "border-cyan-500/30",
  },
} as const;
