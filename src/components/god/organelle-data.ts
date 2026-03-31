/**
 * Organelle data — separated from cell-nucleus-3d.tsx to avoid pulling
 * Three.js into static imports. LiveFeedPanel imports this file for
 * ORGANELLE_INFO without triggering Turbopack Three.js resolution.
 */

export interface OrganelleData {
  domain: string;
  label: string;
  bio: string;
  system: string;
  color: string;
  status: "exists" | "partial" | "missing";
  /** CTA link — routes to the relevant capability page */
  cta: { label: string; href: string } | null;
  /** Metric headline shown during streaming */
  metric: string;
}

export const ORGANELLE_INFO: Record<string, OrganelleData> = {
  envelope: {
    domain: "station",
    label: "Nuclear Envelope",
    bio: "Double membrane barrier controlling what enters and exits",
    system: "AlgoVigilance Station — auth boundary, CORS, TLS",
    color: "#7B95B5",
    status: "exists",
    cta: { label: "Explore Station Tools", href: "/station" },
    metric: "tools",
  },
  chromatin: {
    domain: "pv",
    label: "Chromatin",
    bio: "DNA — the core genetic code of the organism",
    system: "PV Signal Detection — PRR, ROR, IC, EBGM",
    color: "#a855f7",
    status: "exists",
    cta: { label: "Run Signal Detection", href: "/live-feed" },
    metric: "signals_active",
  },
  nucleolus: {
    domain: "brain",
    label: "Nucleolus",
    bio: "Dense factory that builds the cell's protein machinery",
    system: "Brain System — sessions, artifacts, implicit learning",
    color: "#10b981",
    status: "exists",
    cta: { label: "View Research", href: "/research/hexim1" },
    metric: "artifacts",
  },
  ribosomes: {
    domain: "mcg",
    label: "Ribosomes",
    bio: "Molecular machines that execute genetic instructions",
    system: "Micrograms — 512 atomic decision programs, 5,577 tests",
    color: "#F4D03F",
    status: "exists",
    cta: { label: "See Decision Programs", href: "/tools" },
    metric: "programs",
  },
  lamina: {
    domain: "rust",
    label: "Nuclear Lamina",
    bio: "Structural scaffold maintaining nuclear integrity",
    system: "NexCore Rust — 237 crates, type-safe foundation",
    color: "#5F7A96",
    status: "exists",
    cta: { label: "View Architecture", href: "/capabilities" },
    metric: "crates",
  },
  pores: {
    domain: "nucleus",
    label: "Nuclear Pores",
    bio: "Selective gates controlling molecular transport",
    system: "Nucleus Portal — 319 pages, route transport",
    color: "#D4AF37",
    status: "exists",
    cta: { label: "Enter Portal", href: "/auth/sign-in" },
    metric: "pages",
  },
  mrna: {
    domain: "academy",
    label: "mRNA Transcripts",
    bio: "Messenger molecules carrying knowledge to the cytoplasm",
    system: "PV Academy — courses, FSRS spaced repetition",
    color: "#06b6d4",
    status: "exists",
    cta: { label: "Start Learning", href: "/academy" },
    metric: "courses",
  },
  repair: {
    domain: "",
    label: "DNA Repair",
    bio: "Detects and fixes mutations in real-time",
    system: "Error Monitoring — coming soon",
    color: "#DC2626",
    status: "missing",
    cta: { label: "Get Early Access", href: "/waitlist" },
    metric: "",
  },
  splicing: {
    domain: "",
    label: "Spliceosomes",
    bio: "Processes pre-mRNA into mature functional form",
    system: "Content Pipeline — coming soon",
    color: "#f97316",
    status: "missing",
    cta: { label: "Get Early Access", href: "/waitlist" },
    metric: "",
  },
  epigenetic: {
    domain: "",
    label: "Epigenetic Marks",
    bio: "Same DNA, different expression per cell type",
    system: "Personalization — coming soon",
    color: "#8b5cf6",
    status: "missing",
    cta: { label: "Get Early Access", href: "/waitlist" },
    metric: "",
  },
};
