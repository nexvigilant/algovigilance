/**
 * MCP Tool Browser — Curated parameter schemas for ~30 high-value tools.
 *
 * Tools without entries here fall back to a generic JSON parameter input.
 */

import type { ParamDef } from "./types";

export const PARAM_SCHEMAS: Record<string, ParamDef[]> = {
  // ── Foundation ──────────────────────────────────────────────────────────
  foundation_levenshtein: [
    {
      name: "source",
      type: "string",
      required: true,
      description: "Source string",
    },
    {
      name: "target",
      type: "string",
      required: true,
      description: "Target string",
    },
  ],
  foundation_fuzzy_search: [
    {
      name: "query",
      type: "string",
      required: true,
      description: "Search query",
    },
    {
      name: "candidates",
      type: "object",
      required: true,
      description: "JSON array of candidate strings",
    },
    {
      name: "threshold",
      type: "number",
      required: false,
      description: "Min similarity (0.0-1.0)",
    },
  ],
  foundation_sha256: [
    {
      name: "input",
      type: "string",
      required: true,
      description: "Input string to hash",
    },
  ],

  // ── PV Signal Detection ────────────────────────────────────────────────
  pv_signal_complete: [
    {
      name: "a",
      type: "number",
      required: true,
      description: "Target drug + target event count",
    },
    {
      name: "b",
      type: "number",
      required: true,
      description: "Target drug + other events count",
    },
    {
      name: "c",
      type: "number",
      required: true,
      description: "Other drugs + target event count",
    },
    {
      name: "d",
      type: "number",
      required: true,
      description: "Other drugs + other events count",
    },
  ],
  pv_signal_prr: [
    {
      name: "a",
      type: "number",
      required: true,
      description: "Target drug + target event",
    },
    {
      name: "b",
      type: "number",
      required: true,
      description: "Target drug + other events",
    },
    {
      name: "c",
      type: "number",
      required: true,
      description: "Other drugs + target event",
    },
    {
      name: "d",
      type: "number",
      required: true,
      description: "Other drugs + other events",
    },
  ],
  pv_signal_ror: [
    {
      name: "a",
      type: "number",
      required: true,
      description: "Target drug + target event",
    },
    {
      name: "b",
      type: "number",
      required: true,
      description: "Target drug + other events",
    },
    {
      name: "c",
      type: "number",
      required: true,
      description: "Other drugs + target event",
    },
    {
      name: "d",
      type: "number",
      required: true,
      description: "Other drugs + other events",
    },
  ],
  pv_naranjo_quick: [
    {
      name: "answers",
      type: "object",
      required: true,
      description: "Array of 10 Naranjo scores (-1, 0, 1, or 2)",
    },
  ],

  // ── FAERS ──────────────────────────────────────────────────────────────
  faers_search: [
    {
      name: "drug_name",
      type: "string",
      required: true,
      description: "Drug name to search",
    },
    {
      name: "reaction",
      type: "string",
      required: false,
      description: "Adverse event term",
    },
    {
      name: "limit",
      type: "number",
      required: false,
      description: "Max results (default 10)",
    },
  ],
  faers_drug_events: [
    {
      name: "drug_name",
      type: "string",
      required: true,
      description: "Drug name",
    },
    {
      name: "limit",
      type: "number",
      required: false,
      description: "Max results (default 20)",
    },
  ],
  faers_signal_check: [
    {
      name: "drug_name",
      type: "string",
      required: true,
      description: "Drug name",
    },
    {
      name: "event_name",
      type: "string",
      required: true,
      description: "Adverse event term",
    },
  ],

  // ── Chemistry ──────────────────────────────────────────────────────────
  chemistry_hill_response: [
    {
      name: "concentration",
      type: "number",
      required: true,
      description: "Current concentration",
    },
    {
      name: "ec50",
      type: "number",
      required: true,
      description: "Half-maximal effective concentration",
    },
    {
      name: "hill_coefficient",
      type: "number",
      required: true,
      description: "Hill coefficient",
    },
  ],
  chemistry_equilibrium: [
    {
      name: "forward_rate",
      type: "number",
      required: true,
      description: "Forward rate constant",
    },
    {
      name: "reverse_rate",
      type: "number",
      required: true,
      description: "Reverse rate constant",
    },
  ],

  // ── Epidemiology ───────────────────────────────────────────────────────
  epi_relative_risk: [
    {
      name: "a",
      type: "number",
      required: true,
      description: "Exposed with disease",
    },
    {
      name: "b",
      type: "number",
      required: true,
      description: "Exposed without disease",
    },
    {
      name: "c",
      type: "number",
      required: true,
      description: "Unexposed with disease",
    },
    {
      name: "d",
      type: "number",
      required: true,
      description: "Unexposed without disease",
    },
  ],
  epi_odds_ratio: [
    { name: "a", type: "number", required: true, description: "Cases exposed" },
    {
      name: "b",
      type: "number",
      required: true,
      description: "Controls exposed",
    },
    {
      name: "c",
      type: "number",
      required: true,
      description: "Cases unexposed",
    },
    {
      name: "d",
      type: "number",
      required: true,
      description: "Controls unexposed",
    },
  ],
  epi_nnt_nnh: [
    {
      name: "risk_treatment",
      type: "number",
      required: true,
      description: "Risk in treatment group (0-1)",
    },
    {
      name: "risk_control",
      type: "number",
      required: true,
      description: "Risk in control group (0-1)",
    },
  ],

  // ── Wolfram ────────────────────────────────────────────────────────────
  wolfram_query: [
    {
      name: "query",
      type: "string",
      required: true,
      description: "Wolfram Alpha query",
    },
  ],
  wolfram_calculate: [
    {
      name: "expression",
      type: "string",
      required: true,
      description: "Mathematical expression",
    },
  ],
  wolfram_short_answer: [
    {
      name: "query",
      type: "string",
      required: true,
      description: "Question for a short answer",
    },
  ],

  // ── Compendious ────────────────────────────────────────────────────────
  compendious_score_text: [
    {
      name: "text",
      type: "string",
      required: true,
      description: "Text to score",
    },
    {
      name: "domain",
      type: "string",
      required: false,
      description: "Domain context",
    },
  ],
  compendious_compress_text: [
    {
      name: "text",
      type: "string",
      required: true,
      description: "Text to compress",
    },
    {
      name: "target_ratio",
      type: "number",
      required: false,
      description: "Target ratio (0-1)",
    },
  ],

  // ── Edit Distance ──────────────────────────────────────────────────────
  edit_distance_compute: [
    {
      name: "source",
      type: "string",
      required: true,
      description: "Source string",
    },
    {
      name: "target",
      type: "string",
      required: true,
      description: "Target string",
    },
  ],
  edit_distance_similarity: [
    {
      name: "source",
      type: "string",
      required: true,
      description: "Source string",
    },
    {
      name: "target",
      type: "string",
      required: true,
      description: "Target string",
    },
  ],

  // ── Lex Primitiva ──────────────────────────────────────────────────────
  lex_primitiva_composition: [
    {
      name: "name",
      type: "string",
      required: true,
      description: "Type name to decompose",
    },
  ],

  // ── MeSH / Guidelines ─────────────────────────────────────────────────
  mesh_search: [
    {
      name: "query",
      type: "string",
      required: true,
      description: "MeSH term to search",
    },
    {
      name: "limit",
      type: "number",
      required: false,
      description: "Max results",
    },
  ],
  guidelines_search: [
    {
      name: "query",
      type: "string",
      required: true,
      description: "Search query",
    },
    {
      name: "limit",
      type: "number",
      required: false,
      description: "Max results",
    },
  ],
};
